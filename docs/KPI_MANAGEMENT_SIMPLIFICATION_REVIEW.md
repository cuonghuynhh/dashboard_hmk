# KPI Management Simplification — Tech Lead / Architect Review

**Ngày review:** 26/10/2026  
**Reviewer:** Tech Lead / Architect  
**Plan gốc:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md`  
**Phạm vi review:** kiến trúc, độ phức tạp code, khả năng bảo trì, nhất quán dữ liệu, migration, rollback, và đánh giá có đáng làm hay không.

---

## 1. Kết luận tổng quan

**Nên làm, nhưng không làm big-bang.** Hướng tinh gọn là đúng: chuẩn đầu vào đã là `Chi nhánh × Ngày` (GMV/Traffic), nên UI giữ wizard/scope/legacy metrics đang dư. Tuy nhiên nếu đi kèm **xóa dữ liệu backend / enum / endpoint / version history** trong cùng một đợt, rủi ro cao và có thể tạo nợ kỹ thuật mới.

Đề xuất: **tinh gọn theo pha (phased deprecation)**:
1. Pha 1 — UI simplified + inline edit + audit log (giữ backend tương thích).
2. Pha 2 — ẩn/xóa UI legacy (version history, bulk update modal) nhưng giữ API.
3. Pha 3 — sau 1–2 release ổn định mới cân nhắc xóa backend legacy (company/region scope, period types, metrics).

---

## 2. Concerns kiến trúc

### 2.1 Hai mô hình dữ liệu đang song song
- `KpiPlan` (company/region/site × period × version × metric targets) vẫn là nguồn cho `KpiTargetLoader`/`KpiTargetModel` (campaign ghi đè, phân bổ theo ngày/loại ngày, cộng dồn khu vực/công ty).
- `KpiDailyTarget` (site × date) là nguồn mới cho Heatmap traffic target và override GMV theo ngày.

=> Plan đề xuất “chỉ Chi nhánh” nhưng **backend target resolver vẫn dùng company/region scope**. Nếu xóa scope khỏi UI mà không xử lý backend, Heatmap/Executive vẫn phụ thuộc `KpiPlan` cũ. Cần tách rõ:
- **Daily targets** = dữ liệu vận hành (inline edit/import).
- **KPI plan** = nguồn legacy/advanced (giữ read-only cho đến khi migrate).

### 2.2 Inline edit grid tăng độ phức tạp trạng thái
Option C v2 (Excel-like) cần quản lý:
- dirty cells, validation per-cell, partial save, bulk fill by day-type, checkbox “không ghi đè”, filter không xóa data, cancel reset.

=> Code FE sẽ phức tạp hơn hiện tại. Cần:
- state machine rõ ràng (clean/dirty/invalid/saving).
- optimistic concurrency (ETag/version hoặc `UpdatedAt`) để tránh ghi đè đồng thời.
- batching API (save nhiều cell trong 1 transaction) thay vì N request.

### 2.3 Audit log phải là first-class, không phải “ghi thêm”
Audit log per-cell là yêu cầu BOD. Nếu chỉ log FE, không đáng tin. Cần:
- backend ghi audit trong cùng transaction với update.
- masking theo quyền GMV (xem mục 4).

---

## 3. Tác động lên consumers

### 3.1 HeatmapBuilder
- `DashboardV2HeatmapBuilder.Build` nhận `KpiTargetModel` + `HeatmapTrafficTargetFact`.
- Traffic target completion chỉ tính ngày có cả traffic và target.
- Nếu inline edit daily target thay đổi giá trị, **cache của Heatmap service** (nếu có) phải invalidate. Cần kiểm tra `DashboardV2Service.Heatmap.cs` có cache không; nếu có, phải bust cache theo `(siteId, date range)`.

### 3.2 ResponsePostProcessor
- `GmvTarget` đã nằm trong `MaskedProperties` (dòng 95).
- Audit log DTO mới nếu có `OldValue`/`NewValue` GMV **phải được mask** cho user không có `gmv.read`. Đề xuất:
  - thêm các field audit vào masked list, hoặc
  - custom handling trong `Walk` tương tự `KpiV2MetricTargetAdminDto`.

### 3.3 KpiTargetLoader / KpiTargetModel
- `DirectDaily` ưu tiên `KpiDailyTarget.GmvTarget` (BR-TGT-04).
- Nếu company/region scope plans bị xóa, `SelectionDaily`/`Daily` aggregation phải được kiểm tra lại. Hiện tại `CoveredByBranches` chỉ kích hoạt khi `dailySiteTargets.Count > 0`. Nếu không có daily targets, fallback về plan. Nếu plan bị xóa mà không backfill daily targets, Heatmap mất target.

=> **Không được xóa company/region plans cho đến khi backfill daily targets hoặc chứng minh không còn consumer.**

---

## 4. Audit log table design (đề xuất)

```sql
CREATE TABLE KpiDailyTargetAudit (
    Id UUID PRIMARY KEY,
    SiteId UUID NOT NULL,
    TargetDate DATE NOT NULL,
    Metric VARCHAR(10) NOT NULL,          -- 'GMV' | 'TRAFFIC'
    OldValue DECIMAL(18,2) NULL,
    NewValue DECIMAL(18,2) NULL,
    ChangedByAccountId UUID NULL,
    ChangedByName VARCHAR(200) NULL,
    ChangedAtUtc TIMESTAMPTZ NOT NULL,
    Source VARCHAR(20) NOT NULL,          -- 'MANUAL' | 'IMPORT' | 'BULK_FILL' | 'MIGRATION'
    ImportBatchId UUID NULL,
    RequestId VARCHAR(64) NULL,
    Reason VARCHAR(500) NULL
);
CREATE INDEX IX_KpiDailyTargetAudit_Site_Date ON KpiDailyTargetAudit(SiteId, TargetDate);
CREATE INDEX IX_KpiDailyTargetAudit_ChangedAt ON KpiDailyTargetAudit(ChangedAtUtc);
CREATE INDEX IX_KpiDailyTargetAudit_ChangedBy ON KpiDailyTargetAudit(ChangedByAccountId);
```

Nguyên tắc:
- Ghi **per-cell changed** (không log no-op).
- UTC timestamp, không dùng local.
- Bulk fill: 1 audit row mỗi ngày thay đổi; có thể thêm `BatchId` để group.
- Retention policy (ví dụ 2 năm) và partition theo tháng nếu volume lớn.
- Không lưu giá trị nhạy cảm ngoài GMV/Traffic; traffic không thuộc masked.

---

## 5. Backward compatibility với KPI data cũ (company/region scope)

### 5.1 Không xóa enum / DB columns ở pha đầu
- `KpiScopeTypes.Company/Region/Site` và `KpiPeriodTypes.Year/Quarter/Month/Campaign` đang được dùng bởi `KpiTargetModel`.
- Xóa sẽ phá EF migrations, dữ liệu cũ, và tests (`KpiDailyTargetTests`).

### 5.2 Wizard: giữ “Phạm vi cũ” read-only (đã làm ở W9)
- Plan cũ Công ty/Khu vực vẫn mở được, hiển thị nhãn `Phạm vi cũ: ...`.
- Không cho tạo mới company/region scope (validation ở backend `Create`).

### 5.3 Migration dữ liệu (nếu muốn đơn giản hóa triệt để)
- **Không tự động flatten** company/region plans thành site-level (sẽ làm sai target resolution và mất ngữ nghĩa).
- Nếu cần, làm migration **opt-in** (script dry-run + báo cáo) và giữ bảng cũ.

---

## 6. Có nên xóa Version History và Bulk Update không?

### 6.1 Version History
- **Không an toàn nếu xóa hoàn toàn** ở pha đầu:
  - Version history là audit cấp plan (metric targets theo version), khác audit per-cell.
  - Mất khả năng truy vết “ai đổi metric target khi nào”.
- Đề xuất:
  - Pha 1: ẩn modal FE, giữ endpoint/table.
  - Pha 2: giữ read-only view (không tạo version mới từ UI).
  - Pha 3: cân nhắc xóa sau khi audit log + snapshot đầy đủ.

### 6.2 Bulk Update (KPI plan level)
- Plan mới có “bulk fill by day-type” cho daily targets, nhưng **không thay thế** bulk adjust %/absolute cho KPI plans.
- Xóa endpoint `BulkUpdate` sẽ ảnh hưởng BOD vận hành nhiều plan cùng lúc.
- Đề xuất: giữ backend endpoint, ẩn FE modal trong pha đầu; nếu muốn bỏ, thêm endpoint mới tương đương cho daily targets (bulk fill đã có).

---

## 7. Migration strategy (đề xuất)

| Pha | Nội dung | Rủi ro |
|---|---|---|
| 0 | Feature flag `KpiSimplifiedUi` (FE + BE) | Thấp |
| 1 | Thêm `KpiDailyTargetAudit` table + index + endpoint inline edit (batch) | Thấp |
| 2 | FE: grid inline edit + bulk fill + audit display; giữ KPI list read-only | Trung bình |
| 3 | Ẩn Version History / Bulk Update modal; giữ API | Thấp |
| 4 | Backend: disable tạo company/region/period legacy (validation), không xóa schema | Trung bình |
| 5 | (Tùy chọn, sau 1–2 release) xóa endpoint legacy + migration data | Cao |

**Rollback:**
- FE: revert flag/UI; backend không đổi schema ở pha 1–3.
- DB: migration audit table có `Down()`; không drop cột legacy.
- Giữ endpoint cũ ít nhất 1 release để FE cũ hoạt động.

---

## 8. Code complexity & maintainability

- **Effort thực tế lớn hơn plan** (plan đánh giá S/M; thực tế cần L/XL vì audit + concurrency + tests).
- Cần cập nhật:
  - OpenAPI (`report.json`) + generated types.
  - Tests: `KpiV2BulkUpdateTests`, `KpiV2LegacyPlanTests`, `KpiDailyTargetTests`, `DashboardV2TargetMaskingTests`.
  - Masking tests cho audit DTO.
- **Không nên xóa tests legacy**; chuyển sang “deprecated but supported” cho đến pha 3.

---

## 9. Có đáng làm không?

**Có**, vì:
- Chuẩn import đã là branch × day; UI legacy gây nhầm lẫn và nợ UX.
- Daily targets đã được Heatmap/ResponsePostProcessor tiêu thụ; inline edit tăng giá trị vận hành.

**Nhưng** chỉ nên làm nếu:
- Audit log + concurrency được thiết kế trước.
- Không xóa backend legacy trong cùng đợt.
- Có feature flag và rollback rõ ràng.

**Không nên** nếu mục tiêu là “xóa cho gọn” mà không có migration/backfill — sẽ tạo nợ mới (mất target resolution, mất audit, mất bulk operations).

---

## 10. Khuyến nghị hành động cụ thể

1. Giữ plan Option C v2 cho UI, nhưng **tách backend inline edit thành endpoint batch + audit** trước khi code FE.
2. Thêm `KpiDailyTargetAudit` theo schema mục 4; viết migration + `Down()`.
3. Thêm `RowVersion`/`UpdatedAt` vào `KpiDailyTarget` để optimistic concurrency.
4. Masking: cập nhật `ResponsePostProcessor` cho audit DTO (`OldValue`/`NewValue`).
5. Heatmap: thêm invalidation cache khi daily target thay đổi.
6. Giữ `KpiPlan` company/region/period enums; chỉ disable tạo mới qua validation.
7. Giữ Version History & Bulk Update API; ẩn FE trước.
8. Cập nhật tests, không xóa; thêm test concurrency + audit + masking.
9. Feature flag + rollback plan trước khi merge.
