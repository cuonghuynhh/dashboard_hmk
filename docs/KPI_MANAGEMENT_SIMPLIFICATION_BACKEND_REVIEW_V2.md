# KPI Management Simplification — Backend Developer Review (V2)

**Ngày review:** 26/10/2026  
**Reviewer:** Backend Developer (.NET 9 / EF Core / PostgreSQL)  
**Plan gốc:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` (section 7 — quyết định BOD vòng 2)  
**Review trước:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_BACKEND_REVIEW.md` (V1)  
**Kiến trúc review liên quan:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_REVIEW.md`

> V2 này phản ánh **6 quyết định mới đã chốt** (section 7.0 plan). So với V1, phạm vi backend **giảm đáng kể**: bỏ audit log, bỏ endpoint audit, bỏ bulk-fill chuyên biệt, đơn giản hóa về `siteId + month`.

---

## 1. Kết luận nhanh (backend) — V2

- **Feasible và nhẹ hơn V1**: backend chỉ cần **1 endpoint batch update daily targets** + cột `Version` (concurrency) trên `KpiDailyTarget`. **Không** tạo bảng audit, **không** endpoint GET audit.
- **Effort backend: M** (giảm từ L — theo quyết định bỏ audit log).
- **All-or-nothing**: toàn bộ batch trong 1 transaction; nếu 1 cell invalid/conflict → rollback toàn bộ, trả lỗi, FE sửa rồi retry.
- **Backend "không biết filter"**: bulk fill theo loại ngày là trách nhiệm FE — FE tự build list cell và gọi cùng endpoint batch. Backend chỉ validate + upsert từng cell.
- **Per-metric update**: endpoint nhận update **theo từng metric** (GMV hoặc Traffic) độc lập, không bắt buộc gửi cả hai.
- **Single branch**: read/write đều theo `siteId + month`; backend validate site thuộc phạm vi caller.
- **Excel-like grid**: backend chỉ cần `PUT/PATCH daily targets`; không wizard, không version history ở backend mới.

---

## 2. Ánh xạ 6 quyết định mới → tác động backend

| # | Quyết định (plan 7.0) | Tác động backend |
|---|---|---|
| 1 | All-or-nothing partial save | Batch trong 1 transaction; validate trước khi ghi; conflict/invalid → rollback toàn bộ + trả lỗi chi tiết. |
| 2 | Bulk fill chỉ row hiển thị | Backend **không** cần endpoint bulk-fill chuyên biệt và **không** biết filter. FE gửi list cells; backend xử lý như batch update thường. |
| 3 | Checkbox per-metric | Update **per-metric**: mỗi item chỉ chứa 1 metric (GMV hoặc Traffic). `null` value = xóa giá trị (fallback KPI cũ). |
| 4 | Bỏ audit log | **Xóa** bảng `KpiDailyTargetAudit`, **xóa** endpoint `GET .../Audit`, **xóa** audit service methods, **xóa** masking audit DTO. Effort L→M. |
| 5 | Single branch | Endpoint nhận `siteId + month` (không multi-branch). Validate site scope. |
| 6 | Excel-like grid | Backend chỉ cần `PUT/PATCH daily targets`. Giữ `KpiPlan` legacy read-only (không xóa). |

---

## 3. API contract updated

### 3.1 Endpoint batch update (mới / cập nhật)

**Thêm vào `KpiV2Controller`** (`Src/WebApi/Controllers/Admins/V2/KpiV2Controller.cs`), route hiện có `Admin/V2/Kpi`:

```http
PATCH /Admin/V2/Kpi/DailyTargets
Content-Type: application/json
```

**DTO đề xuất** (`Src/Application/Dto/Admins/KpiV2/KpiDailyTargetDtos.cs`):

```csharp
public class KpiDailyTargetBatchUpdateAdminDto
{
    public Guid SiteId { get; set; }                 // single branch (required)
    public string Month { get; set; } = null!;       // yyyy-MM (required)
    public List<KpiDailyTargetCellUpdateAdminDto> Items { get; set; } = [];
}

// Per-metric update: mỗi item = 1 metric của 1 ngày
public class KpiDailyTargetCellUpdateAdminDto
{
    public string Date { get; set; } = null!;        // yyyy-MM-dd, thuộc Month
    public string Metric { get; set; } = null!;      // "GMV" | "TRAFFIC"
    public decimal? Value { get; set; }              // null = xóa giá trị (fallback KPI cũ)
    public int? Version { get; set; }                // optimistic concurrency (optional)
}

public class KpiDailyTargetBatchUpdateResultAdminDto
{
    public int Updated { get; set; }
    public int Unchanged { get; set; }
    public List<KpiDailyTargetAdminDto> Items { get; set; } = [];  // rows bị ảnh hưởng
}
```

**Hành vi backend**:

- `RequireKpiWrite()`.
- Validate toàn bộ batch **trước khi ghi** (all-or-nothing):
  - `SiteId` thuộc phạm vi caller (`access.AllowedSiteIds` / `AllSites`); nếu không → `403`.
  - `Month` đúng `yyyy-MM`, trong khoảng cho phép (tối đa 3 tháng so với hiện tại? Khuyến nghị: chỉ tháng hiện tại ±12).
  - Mỗi item: `Date` đúng `yyyy-MM-dd` và thuộc `Month`; `Metric` ∈ {GMV, TRAFFIC}; `Value`: nếu có thì GMV **> 0**, Traffic **>= 0**; `null` hợp lệ (xóa giá trị).
  - Nếu bất kỳ item invalid → `400 Bad Request` kèm danh sách lỗi theo index, **không ghi gì**.
- Load các row hiện có theo `(SiteId, Date)` trong **1 query**, tracking (bao gồm soft-deleted → revive).
- Với mỗi item:
  - Tìm row hiện có; nếu row bị soft-delete → revive.
  - Nếu `Version` được gửi và khác row hiện tại → collect conflict; **không ghi** item đó (nhưng vẫn validate).
  - Nếu không có thay đổi (old == new cho metric đó) → skip, không tăng version.
  - Upsert metric tương ứng; nếu row chưa tồn tại → tạo mới.
  - `DayType` tính lại từ `Date` (weekday/weekend) — **không tin FE**.
  - `ImportBatchId = null`, `Source` không cần (không còn audit) — có thể bỏ field `Source` khỏi entity update path (giữ cho import nếu cần).
  - `UpdateAt = Now`, `UpdatorId/UpdatorName` từ `IdentityContext`.
  - Tăng `Version`.
- Nếu có **bất kỳ conflict** → rollback toàn bộ transaction, trả `409 Conflict` kèm danh sách cell xung đột + giá trị hiện tại.
- `SaveChangesAsync()` trong transaction; sau commit gọi `DashboardV2CacheService?.Invalidate()`.
- Trả về list row đã update + số lượng.

**Lý do per-metric**: khớp checkbox per-metric (FE chỉ gửi metric được tick), và tránh ambiguity "null = không đổi vs xóa". Ở đây `null = xóa giá trị` (fallback), nhất quán với V1; FE muốn "không đổi" thì **không gửi item đó**.

### 3.2 Read endpoint (cập nhật nhẹ)

```http
GET /Admin/V2/Kpi/DailyTargets?siteId=&month=
```

- `siteId` required (single branch), `month` required (`yyyy-MM`).
- Giữ backward compat: vẫn chấp nhận `fromDate`/`toDate` nếu FE cũ gửi (optional, deprecated).
- DTO `KpiDailyTargetAdminDto` thêm optional fields (backward compatible): `Version`, `UpdateAt`, `UpdatorName`.
- Vẫn đi qua `DashboardV2ResponsePostProcessor.MaskGmv(..., access.GmvRead)`.

### 3.3 Bulk fill (không endpoint riêng)

FE Option C v2 "Áp dụng cho ngày trong tuần/cuối tuần" → FE tự:

1. Lọc rows đang hiển thị theo filter hiện tại.
2. Với mỗi row thuộc day-type được chọn và (nếu checkbox) chưa có giá trị metric tương ứng → build item `{Date, Metric=GMV, Value=...}` và/hoặc `{Date, Metric=TRAFFIC, Value=...}`.
3. Gọi `PATCH /DailyTargets` với list cells.

→ Backend **không** cần `POST .../BulkFill`. Giảm 1 endpoint + 1 DTO + service method. Nếu sau này cần server-side (performance), có thể thêm sau mà không phá contract.

### 3.4 Giữ nguyên / không đổi

- `KpiV2Controller` endpoints KPI plan (`Get/Create/Update/Activate/Archive/End`, `BulkUpdate`, `Versions`) — **giữ nguyên**; FE ẩn modal nhưng API vẫn phục vụ FE cũ / BOD.
- Import endpoint (`PreviewKpi/ConfirmKpi`) — giữ nguyên. Không cần ghi audit (đã bỏ). Có thể giữ `Source` metadata nếu import path đã có.

### 3.5 Validation & masking

- Mọi response read đi qua `DashboardV2ResponsePostProcessor.MaskGmv`. Không còn audit DTO → không cần cập nhật masking cho audit.
- `TrafficTarget` không thuộc masked (giữ nguyên).

---

## 4. Database schema simplified

### 4.1 Chỉ thêm cột concurrency vào `KpiDailyTarget`

Migration mới (ví dụ `AddKpiDailyTargetVersion`), **không** tạo bảng audit:

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

**Lý do giữ**: all-or-nothing + race condition vẫn cần optimistic concurrency. EF Core throw `DbUpdateConcurrencyException` → controller trả `409 Conflict` kèm giá trị hiện tại.

### 4.2 Những gì BỎ so với V1

- **Không** tạo bảng `KpiDailyTargetAudit`.
- **Không** tạo index audit.
- **Không** tạo entity `KpiDailyTargetAudit`.
- **Không** migration audit.

### 4.3 Migration principles

- Migration phải có `Up()` và `Down()`.
- Thêm cột `Version` default 0 (fast, không lock lâu).
- **Không drop** cột legacy `KpiPlan`/scope/period.
- Unique index `SiteId, Date` trên `KpiDailyTarget` giữ nguyên (revive soft-deleted).

---

## 5. Hành vi backend chi tiết

### 5.1 Transaction & all-or-nothing

- Toàn bộ batch trong 1 `IDbContextTransaction`.
- Validate trước → nếu invalid → 400, không mở transaction ghi.
- Nếu conflict concurrency → rollback, 409.
- Nếu `SaveChangesAsync` throw (constraint, v.v.) → rollback, 500 + log; không để partial.
- FE interpret: 400 = sửa cell rồi retry; 409 = refresh grid rồi retry.

### 5.2 Site scoping & single branch

- `siteId` bắt buộc; nếu null/empty → 400.
- Kiểm tra `access.AllowedSiteIds.Contains(siteId)` hoặc `access.AllSites`; Manager chỉ sửa chi nhánh được gán.
- `month` bắt buộc; validate format + range.

### 5.3 DayType & timezone

- `DayType` tính từ `Date` (weekday/weekend) — không tin client.
- `TargetDate` lưu dạng `date` (VN). `UpdateAt` UTC.

### 5.4 Soft-delete revive

- Upsert tìm cả row đã soft-delete (`IgnoreQueryFilters` hoặc `Where` bao gồm deleted) để tránh vi phạm unique index `SiteId, Date`.
- Tái dùng logic import `KpiImport_RevivesSoftDeletedRow...`.

### 5.5 Cache invalidation

- Sau commit: `DashboardV2CacheService?.Invalidate()` (theo site + month/range).
- Verify `DashboardV2Service.Heatmap.cs` có cache key theo `(site, range)`; nếu không, thêm.

### 5.6 Concurrency (Version)

- FE gửi `Version` (lấy từ read). Nếu omitted → last-write-wins (chấp nhận rủi ro thấp cho single user).
- Nếu provided và mismatch → 409 + giá trị hiện tại; FE refresh.

---

## 6. Risks remaining

| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R1 | Lost update khi 2 user sửa cùng cell | Mất dữ liệu | `Version` concurrency token; 409 + giá trị hiện tại; FE refresh |
| R2 | Cache Heatmap stale sau edit | User thấy target cũ | `Invalidate()` sau commit; verify cache key |
| R3 | Volume import lớn (không audit nữa → nhẹ hơn) | DB/IO | Batch insert; index; không audit |
| R4 | Partial save semantics không khớp FE/BE | UX sai | Chốt atomic: invalid/conflict → 400/409 toàn bộ; document contract |
| R5 | DayType sai do FE gửi | Dữ liệu sai | Backend tính từ `Date` |
| R6 | Revive soft-deleted row tạo duplicate | Vi phạm unique index | Upsert tìm cả deleted row |
| R7 | Migration downtime/lock | Ảnh hưởng prod | Thêm cột default 0 (fast); chạy giờ thấp điểm |
| R8 | Import + manual cùng lúc | Conflict | Transaction + concurrency token |
| R9 | Legacy `KpiPlan` vẫn là nguồn cho Heatmap/KpiTargetLoader | Nếu xóa FE legacy mà backend vẫn phụ thuộc | Không xóa backend legacy; giữ read-only; phased deprecation |
| R10 | Mất traceability do bỏ audit | BOD/compliance có thể yêu cầu sau | Ghi nhận quyết định; nếu cần, thêm audit sau (pha sau) mà không phá contract |
| R11 | Per-metric semantics mơ hồ (null = xóa) | FE gửi sai | Document rõ: không gửi item = không đổi; `null` value = xóa |
| R12 | Bulk fill chỉ visible rows phụ thuộc FE | FE bug có thể fill sai tập | Backend validate từng cell; FE gửi list rõ ràng; test FE filter |
| R13 | Single branch nhưng FE có thể gửi siteId khác nhau trong batch | Inconsistent | Backend require tất cả item cùng `siteId` top-level; validate |

---

## 7. Tests cần thêm / cập nhật

- `KpiDailyTargetTests`:
  - batch per-metric update (GMV only, Traffic only, cả hai, xóa giá trị).
  - all-or-nothing: 1 item invalid → 400, không ghi gì.
  - concurrency conflict (Version mismatch) → 409 + rollback.
  - site scoping (Manager không sửa chi nhánh ngoài phạm vi).
  - GMV validation (>0) và Traffic (>=0).
  - revive soft-deleted row.
  - single branch: siteId required, month required.
- `DashboardV2TargetMaskingTests`: GMV masked trên read (giữ).
- Contract tests (`KpiV2ApiContractTests`): endpoint mới xuất hiện trong OpenAPI; không còn audit endpoint.
- **Không xóa** tests legacy (`KpiV2BulkUpdateTests`, `KpiV2LegacyPlanTests`).

---

## 8. Khuyến nghị thứ tự implement (backend) — V2

1. Migration: cột `Version` trên `KpiDailyTarget` (không audit table).
2. Entity + DbContext + migration apply.
3. Service: `UpdateDailyTargets` (batch per-metric) + validation + concurrency + cache invalidation.
4. Controller: `PATCH /DailyTargets` (siteId + month) + cập nhật `GET /DailyTargets` (siteId + month, thêm Version/UpdateAt).
5. Masking giữ nguyên (không audit).
6. Tests (mục 7).
7. Feature flag / phased deprecation (giữ legacy).

**Giảm so với V1**: bỏ bước audit table, audit endpoint, bulk-fill endpoint, audit service methods, audit masking.

---

## 9. Câu hỏi mở cho BOD / FE

1. All-or-nothing: khi conflict concurrency giữa 2 user, FE có tự refresh + retry không, hay báo user? **Khuyến nghị báo user + refresh**.
2. `Version` bắt buộc gửi hay optional? **Khuyến nghị optional** (last-write-wins nếu omitted) để đơn giản FE; nhưng grid nên gửi để an toàn.
3. Bulk fill "chỉ áp dụng ngày chưa có giá trị": FE kiểm tra theo metric (GMV empty / Traffic empty) độc lập — khớp checkbox per-metric.
4. Audit log đã bỏ ở phase này; nếu BOD cần traceability sau, thêm audit trong pha sau (không phá contract hiện tại).
5. Có cần ETag/`If-Match` header hay đủ `Version` trong body? **Khuyến nghị `Version` trong body** (đơn giản hơn cho FE).