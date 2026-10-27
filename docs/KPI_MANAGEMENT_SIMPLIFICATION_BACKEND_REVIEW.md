# KPI Management Simplification — Backend Developer Review

**Ngày review:** 26/10/2026  
**Reviewer:** Backend Developer (.NET 9 / EF Core / PostgreSQL)  
**Plan gốc:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md`  
**Kiến trúc review liên quan:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_REVIEW.md`

---

## 1. Kết luận nhanh (backend)

- **Feasible**, nhưng **không nên xóa backend legacy** trong cùng đợt. Chỉ thêm **endpoint partial update batch + audit log + concurrency token**, giữ `KpiPlan` company/region/period và các endpoint cũ.
- **Endpoint mới bắt buộc**: partial update nhiều cell trong 1 transaction + audit per-cell.
- **DB bắt buộc**: bảng `KpiDailyTargetAudit` + cột `Version` (concurrency token) trên `KpiDailyTarget`.
- **Rủi ro chính**: race condition khi nhiều người sửa cùng cell, cache Heatmap bị stale, rò rỉ GMV qua audit DTO, và volume audit khi import.

---

## 2. API changes cần thiết

### 2.1 Endpoint partial update daily targets (mới)

**Thêm vào `KpiV2Controller`** (`Src/WebApi/Controllers/Admins/V2/KpiV2Controller.cs`), route hiện có `Admin/V2/Kpi`:

```http
PATCH /Admin/V2/Kpi/DailyTargets
Content-Type: application/json
```

**DTO đề xuất** (`Src/Application/Dto/Admins/KpiV2/KpiDailyTargetDtos.cs`):

```csharp
public class KpiDailyTargetBatchUpdateAdminDto
{
    public List<KpiDailyTargetCellUpdateAdminDto> Items { get; set; } = [];
}

public class KpiDailyTargetCellUpdateAdminDto
{
    public Guid SiteId { get; set; }
    public string Date { get; set; } = null!;        // yyyy-MM-dd
    public decimal? GmvTarget { get; set; }         // null = xóa giá trị (fallback KPI cũ)
    public int? TrafficTarget { get; set; }         // null = xóa giá trị
    public int? Version { get; set; }               // optimistic concurrency (optional)
}

public class KpiDailyTargetBatchUpdateResultAdminDto
{
    public int Updated { get; set; }
    public int Unchanged { get; set; }
    public List<KpiDailyTargetAdminDto> Items { get; set; } = [];
}
```

**Hành vi backend**:
- `RequireKpiWrite()` (giống `Create/Update`).
- Validate từng cell:
  - `Date` đúng `yyyy-MM-dd`, nằm trong khoảng cho phép (tối đa 93 ngày / request, tái dùng `MaxDays`).
  - `GmvTarget`: nếu có giá trị thì **> 0** (khớp chuẩn Import "GMV bắt buộc >0"); `null` là hợp lệ (fallback).
  - `TrafficTarget`: nếu có giá trị thì **>= 0**.
  - Site thuộc phạm vi caller (`access.AllowedSiteIds` / `AllSites`).
- Load các row hiện có theo `(SiteId, Date)` trong **1 query**, tracking.
- So sánh old vs new; **chỉ ghi row và audit** khi có thay đổi (no-op không log).
- Upsert: nếu chưa có row → tạo mới (revive soft-deleted row giống import, xem `KpiImport_RevivesSoftDeletedRow...`); nếu có → update.
- `DayType` tính lại từ `Date` (weekday/weekend) — **không tin FE**.
- `ImportBatchId = null`, `Source = MANUAL` cho audit.
- `UpdateAt = Now`, `UpdatorId/UpdatorName` từ `IdentityContext`.
- Tăng `Version`.
- `SaveChangesAsync()` trong transaction; sau commit gọi `DashboardV2CacheService?.Invalidate()`.
- Trả về list row đã update (để FE đồng bộ) + số lượng.

**Lý do batch thay vì N request**: giảm round-trip, 1 transaction, audit nhất quán, tránh partial failure.

### 2.2 Bulk fill by day-type (tùy chọn nhưng nên có)

FE Option C v2 có "Áp dụng cho ngày trong tuần/cuối tuần". Có 2 cách:

1. FE tự build list cell và gọi `PATCH /DailyTargets` (đơn giản, tái dùng endpoint trên).
2. Backend endpoint chuyên biệt:

```http
POST /Admin/V2/Kpi/DailyTargets/BulkFill
```

**Khuyến nghị**: làm **endpoint chuyên biệt** để enforce rule "chỉ áp dụng ngày chưa có giá trị" và audit `Source = BULK_FILL` nhất quán:

```csharp
public class KpiDailyTargetBulkFillAdminDto
{
    public Guid SiteId { get; set; }
    public string FromDate { get; set; } = null!;
    public string ToDate { get; set; } = null!;
    public int DayType { get; set; }            // 1 weekday, 2 weekend
    public decimal? GmvTarget { get; set; }     // null = không đổi
    public int? TrafficTarget { get; set; }     // null = không đổi
    public bool OnlyEmpty { get; set; } = true;
}
```

- Chỉ điền các ngày thuộc `DayType` và (nếu `OnlyEmpty`) chưa có giá trị metric tương ứng.
- Ghi audit per-cell với `Source = BULK_FILL`, cùng `BatchId` (Guid mới) để group.

### 2.3 Audit query endpoint (mới)

```http
GET /Admin/V2/Kpi/DailyTargets/Audit?siteId=&fromDate=&toDate=&metric=&changedBy=&page=&size=
```

- Trả về `KpiDailyTargetAuditAdminDto` (xem mục 3).
- Phân quyền: `RequireKpiRead()` + site scoping (Manager chỉ xem chi nhánh được gán).
- GMV masking: `OldValue/NewValue` GMV phải được che khi thiếu `gmv.read`.

### 2.4 Giữ nguyên / không đổi

- `GET /Admin/V2/Kpi/DailyTargets` (read) — không đổi contract; chỉ có thể **thêm optional field** `Version`/`UpdateAt` vào DTO (backward compatible).
- `KpiV2Controller` endpoints KPI plan (`Get/Create/Update/Activate/...`) — **giữ nguyên**; FE ẩn modal nhưng API vẫn phục vụ FE cũ / BOD.
- Import endpoint (`PreviewKpi/ConfirmKpi`) — giữ nguyên; nên bổ sung audit `Source = IMPORT` (xem 3.4).

### 2.5 Validation & masking

- Mọi response đi qua `DashboardV2ResponsePostProcessor.MaskGmv(..., access.GmvRead)` (đã làm ở controller read). **Audit endpoint cũng phải gọi**.
- Thêm các field audit GMV vào `MaskedProperties` hoặc xử lý custom trong `Walk` (xem `DashboardV2ResponsePostProcessor.cs`).

---

## 3. Database schema changes

### 3.1 Thêm cột concurrency vào `KpiDailyTarget`

Migration mới (ví dụ `AddKpiDailyTargetVersion`):

```sql
ALTER TABLE "KpiDailyTarget"
  ADD COLUMN "Version" integer NOT NULL DEFAULT 0;
```

Entity (`Src/Domain/Entities/KpiDailyTarget.cs`):

```csharp
public int Version { get; set; }
```

Configure:

```csharp
builder.Property(x => x.Version).IsConcurrencyToken();
```

**Lý do**: tránh lost update khi 2 user sửa cùng cell. EF Core sẽ throw `DbUpdateConcurrencyException` → controller trả `409 Conflict` kèm giá trị hiện tại.

### 3.2 Bảng audit `KpiDailyTargetAudit`

Migration mới (ví dụ `AddKpiDailyTargetAudit`), **không** soft-delete (append-only, không kế thừa global query filter delete):

```sql
CREATE TABLE "KpiDailyTargetAudit" (
    "Id" uuid PRIMARY KEY,
    "SiteId" uuid NOT NULL,
    "TargetDate" date NOT NULL,
    "Metric" varchar(10) NOT NULL,          -- 'GMV' | 'TRAFFIC'
    "OldGmv" numeric(18,2) NULL,
    "NewGmv" numeric(18,2) NULL,
    "OldTraffic" integer NULL,
    "NewTraffic" integer NULL,
    "ChangedByAccountId" uuid NULL,
    "ChangedByName" varchar(200) NULL,
    "ChangedAtUtc" timestamptz NOT NULL,
    "Source" varchar(20) NOT NULL,          -- MANUAL | IMPORT | BULK_FILL | MIGRATION
    "BatchId" uuid NULL,                    -- group cho bulk fill/import
    "ImportBatchId" uuid NULL,
    "RequestId" varchar(64) NULL,
    "Reason" varchar(500) NULL
);

CREATE INDEX "IX_KpiDailyTargetAudit_Site_Date" ON "KpiDailyTargetAudit" ("SiteId", "TargetDate");
CREATE INDEX "IX_KpiDailyTargetAudit_ChangedAt" ON "KpiDailyTargetAudit" ("ChangedAtUtc");
CREATE INDEX "IX_KpiDailyTargetAudit_ChangedBy" ON "KpiDailyTargetAudit" ("ChangedByAccountId");
CREATE INDEX "IX_KpiDailyTargetAudit_Metric" ON "KpiDailyTargetAudit" ("Metric");
```

**Entity** (`Src/Domain/Entities/KpiDailyTargetAudit.cs`):

```csharp
[Comment("Audit log per-cell cho KpiDailyTarget (GMV/Traffic)")]
public class KpiDailyTargetAudit : Entity<KpiDailyTargetAudit> // không StrongEntity để tránh soft-delete
{
    public Guid SiteId { get; set; }
    public DateTime TargetDate { get; set; }
    public string Metric { get; set; } = null!;
    public decimal? OldGmv { get; set; }
    public decimal? NewGmv { get; set; }
    public int? OldTraffic { get; set; }
    public int? NewTraffic { get; set; }
    public Guid? ChangedByAccountId { get; set; }
    public string? ChangedByName { get; set; }
    public DateTime ChangedAtUtc { get; set; }
    public string Source { get; set; } = null!;
    public Guid? BatchId { get; set; }
    public Guid? ImportBatchId { get; set; }
    public string? RequestId { get; set; }
    public string? Reason { get; set; }

    public override void Configure(EntityTypeBuilder<KpiDailyTargetAudit> builder)
    {
        base.Configure(builder);
        builder.Property(x => x.TargetDate).HasColumnType("date");
        builder.Property(x => x.OldGmv).HasPrecision(18, 2);
        builder.Property(x => x.NewGmv).HasPrecision(18, 2);
        builder.HasIndex(x => new { x.SiteId, x.TargetDate });
        builder.HasIndex(x => x.ChangedAtUtc);
        builder.HasIndex(x => x.ChangedByAccountId);
    }
}
```

> **Lưu ý**: nếu `Entity<T>` base có soft-delete global filter, cần override `OnModelCreating` hoặc dùng entity không soft-delete. Audit **không được** bị filter `DeleteAt IS NULL` làm mất bản ghi (append-only).

### 3.3 Migration principles

- Migration phải có `Up()` và `Down()` (rollback).
- Thêm index sau khi create table (hoặc cùng migration).
- Không drop cột legacy `KpiPlan`/scope/period.
- Nếu volume lớn (triệu row), cân nhắc partition `KpiDailyTargetAudit` theo tháng (P2, không bắt buộc pha đầu).

---

## 4. Audit log implementation approach

### 4.1 Service layer

Mở rộng `IKpiDailyTargetService`:

```csharp
Task<KpiDailyTargetBatchUpdateResultAdminDto> UpdateDailyTargets(KpiDailyTargetBatchUpdateAdminDto input);
Task<KpiDailyTargetBulkFillResultAdminDto> BulkFill(KpiDailyTargetBulkFillAdminDto input);
Task<KpiDailyTargetAuditPagedResultAdminDto> GetAudit(KpiDailyTargetAuditFilterAdminDto filter);
```

**Thứ tự xử lý trong `UpdateDailyTargets`**:

1. `RequireKpiWrite()` (đã làm ở controller, service vẫn check access để site scoping).
2. Normalize & validate input (date, value, site scope).
3. Load existing rows tracking:  
   `Db.KpiDailyTarget.Where(x => !x.IsDeleted && siteIds.Contains(x.SiteId) && dates.Contains(x.Date))`.
4. Với mỗi cell:
   - Tìm row hiện có.
   - Nếu row tồn tại và `Version` khác input (khi input có) → collect conflict, không ghi.
   - Nếu không có thay đổi (old == new cho cả GMV & Traffic) → skip, không audit.
   - Upsert row, tăng `Version`, set `UpdateAt/Updator`.
   - Tạo `KpiDailyTargetAudit` với `Metric` tương ứng:
     - Nếu GMV thay đổi → 1 audit row `Metric='GMV'`.
     - Nếu Traffic thay đổi → 1 audit row `Metric='TRAFFIC'`.
     - (2 audit rows nếu cả hai đổi — dễ query/filter).
5. `await Db.SaveChangesAsync()` trong transaction.
6. `DashboardV2CacheService?.Invalidate()`.
7. Mask response và trả về.

### 4.2 Audit source tracking

| Source | Khi nào |
|---|---|
| `MANUAL` | Inline edit cell trên table (PATCH endpoint) |
| `BULK_FILL` | Bulk fill by day-type (POST endpoint) |
| `IMPORT` | Confirm import (cần sửa `KpiImport` confirm path để ghi audit per changed cell) |
| `MIGRATION` | `MigrateSaleTargets` nếu có sinh daily target |

**Import audit**: volume có thể lớn (max 3 tháng × N chi nhánh). Khuyến nghị:
- Chỉ ghi audit cho cell **thực sự thay đổi** (so sánh old vs new).
- Batch insert trong cùng transaction.
- Nếu quá lớn, cân nhắc ghi audit theo `BatchId` + summary (nhưng BOD yêu cầu per-cell → giữ per-cell).

### 4.3 Timezone & user

- `ChangedAtUtc = TimeProvider.GetUtcNow().UtcDateTime` (không local).
- `ChangedByAccountId = IdentityContext.Id`, `ChangedByName = IdentityContext.Name`.
- `TargetDate` là ngày VN (`date` type) — đã lưu dạng `date`.

### 4.4 No-op & idempotency

- Không log no-op.
- Nếu client gửi cùng giá trị 2 lần, lần 2 skip.
- Bulk fill `OnlyEmpty=true`: skip ngày đã có giá trị → không audit.

---

## 5. Backward compatibility

### 5.1 KPI plan legacy (company/region/period)

- **Không xóa** `KpiScopeTypes.Company/Region/Site`, `KpiPeriodTypes.Year/Quarter/Month/Campaign`.
- `KpiTargetLoader` và `KpiTargetModel` vẫn dùng các scope này (company/region aggregation, campaign override).
- `KpiV2Service.Create/Update`: thêm validation **chỉ cho phép `ScopeType = Site` và `PeriodType = Month`** khi tạo mới (tùy chọn, pha sau). **Không** xóa enum/DB.
- Plan cũ Công ty/Khu vực vẫn mở được, hiển thị `Phạm vi cũ` (đã có ở W9).
- **Không tự động flatten** company/region plans thành site-level (sẽ sai target resolution). Nếu cần, làm migration opt-in + dry-run.

### 5.2 Endpoint & FE cũ

- Giữ `BulkUpdate`, `Versions`, `Activate`, `Archive`, `End` endpoints.
- FE mới ẩn modal nhưng API vẫn hoạt động cho FE cũ / BOD.
- `GET DailyTargets` giữ contract; thêm optional fields không phá FE cũ (JSON ignore unknown).

### 5.3 HeatmapBuilder / ResponsePostProcessor / KpiTargetLoader

- `DashboardV2HeatmapBuilder.Build` nhận `KpiTargetModel` + `HeatmapTrafficTargetFact` — **không đổi signature**.
- `KpiTargetLoader.Load` vẫn load `KpiDailyTarget` theo date range — inline edit chỉ update cùng table.
- `DirectDaily` ưu tiên `KpiDailyTarget.GmvTarget` (BR-TGT-04) — **giữ nguyên**.
- `CoveredByBranches` chỉ kích hoạt khi `dailySiteTargets.Count > 0` — **không đổi**.
- `ResponsePostProcessor.MaskGmv` — audit DTO mới phải đi qua.

### 5.4 Soft-delete & revive

- Import revive soft-deleted row (test `KpiImport_RevivesSoftDeletedRow...`). Inline edit upsert phải **tái dùng logic này**: nếu row bị soft-delete, revive thay vì tạo duplicate (unique index `SiteId, Date`).

---

## 6. Potential risks (backend)

| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R1 | Lost update khi 2 user sửa cùng cell | Mất dữ liệu | Thêm `Version` concurrency token; trả 409 + giá trị hiện tại |
| R2 | Cache Heatmap stale sau edit | User thấy target cũ | `DashboardV2CacheService.Invalidate()` sau commit; verify `DashboardV2Service.Heatmap.cs` có cache key theo `(site, range)` |
| R3 | Rò rỉ GMV qua audit DTO | Vi phạm phân quyền | Audit endpoint gọi `MaskGmv`; thêm `OldGmv/NewGmv` vào `MaskedProperties`; test masking |
| R4 | Volume audit khi import lớn | DB phình, chậm | Chỉ log cell thay đổi; batch insert; index; retention policy |
| R5 | Partial save semantics mơ hồ | FE/backend không khớp | Chốt: atomic batch — nếu có cell invalid → 400 toàn bộ; concurrency conflict → 409 |
| R6 | DayType sai do FE gửi | Dữ liệu sai | Backend tính `DayType` từ `Date`, không tin client |
| R7 | Revive soft-deleted row tạo duplicate | Vi phạm unique index | Upsert tìm cả row đã soft-delete (`IgnoreQueryFilters` hoặc `Where` bao gồm deleted) |
| R8 | Audit table soft-delete filter làm mất bản ghi | Audit không truy vấn được | Audit entity không dùng `StrongEntity`/soft-delete; hoặc disable query filter |
| R9 | Migration downtime / lock | Ảnh hưởng prod | Thêm cột `Version` default 0 (fast); create audit table/index trong giờ thấp điểm |
| R10 | Import + manual cùng lúc | Conflict / audit duplicate | Transaction + concurrency token; import cũng dùng upsert + audit |
| R11 | Traffic target masking | Traffic không thuộc masked — giữ nguyên | Không thêm Traffic vào `MaskedProperties` |
| R12 | Timezone lệch | Audit timestamp sai | Dùng UTC cho `ChangedAtUtc`; `TargetDate` là `date` VN |

---

## 7. Tests cần thêm / cập nhật

- `KpiDailyTargetTests`: 
  - upsert partial update (GMV only, Traffic only, cả hai, xóa giá trị).
  - no-op không tạo audit.
  - concurrency conflict (Version mismatch).
  - site scoping (Manager không sửa chi nhánh ngoài phạm vi).
  - GMV validation (>0) và Traffic (>=0).
- `DashboardV2TargetMaskingTests`: audit DTO GMV masked.
- `DashboardV2ImportTests`: import ghi audit `Source=IMPORT` (nếu implement).
- Contract tests (`KpiV2ApiContractTests`): endpoint mới xuất hiện trong OpenAPI.

**Không xóa** tests legacy (`KpiV2BulkUpdateTests`, `KpiV2LegacyPlanTests`).

---

## 8. Khuyến nghị thứ tự implement (backend)

1. Migration: `Version` column + `KpiDailyTargetAudit` table + index.
2. Entity + DbContext + migration apply.
3. Service: `UpdateDailyTargets` (batch) + audit insert + concurrency + cache invalidation.
4. Controller: `PATCH /DailyTargets` + `GET /DailyTargets/Audit`.
5. BulkFill endpoint (nếu FE cần server-side).
6. Import audit integration.
7. Masking + tests.
8. Feature flag / phased deprecation (giữ legacy).

---

## 9. Câu hỏi mở cho BOD / FE

1. Partial save semantics: atomic (reject nếu có cell invalid) hay skip cell invalid? **Khuyến nghị atomic**.
2. Audit retention: bao lâu (gợi ý 24 tháng) và có cần export CSV?
3. Bulk fill `OnlyEmpty` default true hay false? **Khuyến nghị true** để tránh ghi đè.
4. Có cần audit cho Import (volume lớn) hay chỉ manual/bulk? **Khuyến nghị có**, nhưng per-cell chỉ cho cell thay đổi.
5. Có cần ETag/`If-Match` header hay đủ `Version` trong body? **Khuyến nghị `Version` trong body** (đơn giản hơn cho FE).