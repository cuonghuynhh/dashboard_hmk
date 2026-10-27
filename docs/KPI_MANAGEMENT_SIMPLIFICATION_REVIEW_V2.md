# KPI Management Simplification — Tech Lead / Architect Review (V2)

**Ngày review:** 26/10/2026  
**Reviewer:** Tech Lead / Architect  
**Plan gốc:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` (section 7 — Quyết định BOD vòng 2)  
**Review trước:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_REVIEW.md`, `docs/KPI_MANAGEMENT_SIMPLIFICATION_BACKEND_REVIEW.md`  
**Phạm vi review:** đánh giá 6 quyết định mới đã chốt (all-or-nothing, bulk fill chỉ row hiển thị, checkbox per-metric, bỏ audit log, single branch, Excel-like grid) từ góc nhìn kiến trúc, migration, rủi ro còn lại và effort.

---

## 1. Kết luận tổng quan

6 quyết định mới **đi đúng hướng đơn giản hóa** và **giảm đáng kể complexity** so với vòng trước. Quan trọng nhất là **bỏ audit log** — đây là quyết định có tác động lớn nhất: loại bỏ cả một bảng DB, migration, endpoint, DTO, masking, và test suite. Đồng thời **all-or-nothing** + **single branch** + **FE-driven bulk fill** giúp backend gần như không cần logic mới phức tạp.

**Đề xuất:** thực hiện theo **1 phase duy nhất** (không cần phased deprecation như review V1) cho UI + backend tối thiểu, với điều kiện giữ nguyên backend legacy (KpiPlan company/region/period, Version History, Bulk Update API) như đã khuyến nghị ở V1. Feature flag `KpiSimplifiedUi` vẫn nên có để rollback FE.

**Effort tổng thể điều chỉnh:** từ **L/XL** (review V1) xuống **M** (backend) + **M** (FE), chủ yếu nhờ bỏ audit log và bulk fill đẩy sang FE.

---

## 2. Đánh giá từng quyết định

### 2.1 All-or-nothing partial save → đơn giản hơn, transaction rollback

**Đánh giá: ✅ Đồng ý mạnh.**

- **Backend:** 1 endpoint `PATCH /DailyTargets` nhận batch cell; transaction duy nhất. Nếu có cell invalid → trả `400` toàn bộ, không ghi gì. Không cần logic "skip cell invalid + log partial result" phức tạp. Rollback tự nhiên qua transaction.
- **FE:** state machine đơn giản: `clean | dirty | invalid | saving`. Nút lưu disable nếu `invalidCount > 0`. Không cần partial result handling / per-cell retry.
- **Rủi ro giảm:** partial failure semantics (R5 ở backend review) không còn là vấn đề.
- **Caveat:** concurrency conflict (Version mismatch) vẫn có thể xảy ra giữa các cell trong cùng batch → trả `409` toàn bộ batch (không partial). FE cần xử lý: hiển thị giá trị hiện tại, user retry.

### 2.2 Bulk fill chỉ row đang hiển thị → FE responsibility, backend không cần biết filter

**Đánh giá: ✅ Đồng ý.**

- **Backend:** không cần endpoint `BulkFill` chuyên biệt, không cần `OnlyEmpty` rule ở server, không cần audit `Source=BULK_FILL`. FE tự build list cell từ filtered rows và gọi `PATCH /DailyTargets` như edit thường.
- **FE:** bulk fill iterate over **visible/filtered rows** (đúng quyết định). Hidden rows không bị ảnh hưởng. Backend không biết filter → separation of concerns tốt.
- **Lưu ý:** phải chốt rõ với UX (UX review mục 2.3 #8): bulk áp dụng cho **tất cả ngày của loại ngày trong tháng** hay chỉ row đang hiển thị? Quyết định BOD nói "chỉ row đang hiển thị" → FE iterate filtered rows. Cần banner giải thích để BOD không hiểu nhầm (UX P1 #8).
- **Audit:** vì bỏ audit log, không cần phân biệt Source anymore.

### 2.3 Checkbox per-metric → per-metric update logic

**Đánh giá: ✅ Đồng ý, nhưng FE complexity tăng nhẹ.**

- **FE:** 2 checkbox độc lập: `☑ GMV (chỉ điền ô GMV trống)` + `☑ Traffic (chỉ điền ô Traffic trống)`. Bulk fill logic phải check từng metric độc lập: nếu GMV trống và checkbox GMV tick → điền GMV; nếu Traffic trống và checkbox Traffic tick → điền Traffic.
- **Backend:** không đổi — endpoint PATCH cell-level đã hỗ trợ partial (GMV only / Traffic only / cả hai). Backend chỉ validate từng field.
- **Caveat:** nếu cả 2 checkbox untick → nút "Áp dụng" disable (không có tác dụng). FE phải handle.
- **UX:** metric trống = skip metric đó (UX review #6). Khớp với "per-metric".

### 2.4 Bỏ audit log → giảm complexity đáng kể

**Đánh giá: ✅ Đồng ý — tác động lớn nhất.**

**Loại bỏ được:**
- Bảng `KpiDailyTargetAudit` + migration `AddKpiDailyTargetAudit` + index.
- Endpoint `GET /Admin/V2/Kpi/DailyTargets/Audit`.
- Entity `KpiDailyTargetAudit`, DTO `KpiDailyTargetAuditAdminDto`, service `GetAudit`.
- Masking cho audit DTO trong `ResponsePostProcessor` (`OldGmv/NewGmv`).
- Tests audit: `DashboardV2TargetMaskingTests` (phần audit), `DashboardV2ImportTests` (audit Source=IMPORT).
- Retention policy, partition theo tháng.

**Giữ lại:**
- `Version` concurrency token trên `KpiDailyTarget` — vẫn cần cho all-or-nothing + tránh lost update.
- Import vẫn ghi `ImportBatchId`? Có thể giữ để trace import batch, nhưng không cần audit per-cell. Quyết định: **giữ `ImportBatchId` trên `KpiDailyTarget` nếu đã có**, không thêm audit.

**Trade-off chấp nhận:** mất truy vết per-cell "ai đổi khi nào". Nếu BOD sau này cần audit, sẽ thêm ở pha sau (không ảnh hưởng schema hiện tại — có thể thêm bảng audit sau mà không migration phức tạp). Đây là quyết định reversible.

### 2.5 Single branch → grid nhỏ, state đơn giản

**Đánh giá: ✅ Đồng ý mạnh.**

- **FE:** dropdown Chi nhánh (required) + Month picker. Grid chỉ 1 chi nhánh × ~31 ngày → state nhỏ, render nhanh, không cần virtualization.
- **Backend:** không đổi — site scoping đã có (`access.AllowedSiteIds`). Chỉ cần đảm bảo endpoint filter theo `siteId` param (đã có).
- **Rủi ro giảm:** multi-branch view complexity, multi-branch concurrency không còn.
- **Caveat:** nếu BOD sau muốn xem nhiều chi nhánh cùng lúc → thêm view riêng (không ảnh hưởng phase này).

### 2.6 Excel-like grid → 1 component, ít modal

**Đánh giá: ✅ Đồng ý, nhưng FE effort không nhỏ.**

- **Components:** 1 grid component editable inline (thay 4 components xóa + 2 đơn giản hóa). Giảm modal: không wizard, không Version History modal, không Bulk Update modal.
- **State:** dirty cells, validation per-cell, bulk fill, cancel reset, unsaved changes guard. Vẫn cần state machine rõ ràng (review V1 #2.2).
- **A11y:** keyboard navigation (↑↓←→, Enter, Tab, Esc, Ctrl+S) + ARIA grid (UX review #5).
- **Mobile:** sticky cột Ngày, save bar sticky (UX review #6).

---

## 3. Kiến trúc đơn giản hơn (so với review V1)

| Lớp | Review V1 (có audit) | Review V2 (bỏ audit) |
|---|---|---|
| DB | `KpiDailyTarget` + `KpiDailyTargetAudit` + `Version` | Chỉ `KpiDailyTarget` + `Version` |
| Migration | 2 migration (Version + Audit table) | 1 migration (Version) |
| Backend endpoint | PATCH batch + GET Audit + (optional) BulkFill | Chỉ PATCH batch |
| Service | UpdateDailyTargets + BulkFill + GetAudit | Chỉ UpdateDailyTargets |
| DTO | BatchUpdate + BulkFill + Audit + Filter | Chỉ BatchUpdate |
| Masking | Audit DTO masking | Không cần |
| FE component | Grid + Audit view | Chỉ Grid |
| Tests | Audit + masking + concurrency | Chỉ concurrency + validation |

**Kết luận:** backend chỉ cần **1 endpoint mới** (`PATCH /DailyTargets`) + **1 migration** (`Version` column). Đây là thay đổi tối thiểu, rủi ro thấp.

---

## 4. Migration strategy updated (V2)

### 4.1 Phased approach (đơn giản hóa)

Vì bỏ audit log, không cần 5 pha như V1. Đề xuất **2 pha**:

| Pha | Nội dung | Rủi ro |
|---|---|---|
| 0 | Feature flag `KpiSimplifiedUi` (FE + BE) | Thấp |
| 1 | Migration `Version` column + endpoint PATCH batch + FE grid inline edit + bulk fill + filters + unsaved guard | Trung bình |
| 2 | (Tùy chọn, sau 1 release ổn định) ẩn FE modal legacy (Version History, Bulk Update) — giữ API | Thấp |

**Rollback:**
- FE: revert flag/UI; backend không đổi schema ở pha 1 (chỉ thêm cột `Version` default 0, không phá FE cũ).
- DB: migration `Version` có `Down()`; không drop cột legacy.
- Giữ endpoint cũ ít nhất 1 release.

### 4.2 Migration chi tiết (1 migration duy nhất)

```sql
ALTER TABLE "KpiDailyTarget"
  ADD COLUMN "Version" integer NOT NULL DEFAULT 0;
```

- Entity: thêm `public int Version { get; set; }` + `builder.Property(x => x.Version).IsConcurrencyToken();`
- Không cần audit table, không cần partition, không cần retention policy.

### 4.3 Backward compatibility (giữ nguyên từ V1)

- Không xóa `KpiScopeTypes.Company/Region/Site`, `KpiPeriodTypes.Year/Quarter/Month/Campaign`.
- `KpiTargetLoader` / `KpiTargetModel` vẫn dùng company/region aggregation.
- Plan cũ Công ty/Khu vực vẫn mở được, hiển thị `Phạm vi cũ`.
- Không tự động flatten company/region plans thành site-level.
- Giữ `BulkUpdate`, `Versions`, `Activate`, `Archive`, `End` endpoints (ẩn FE trước).
- `GET DailyTargets` giữ contract; thêm optional field `Version` (backward compatible).

---

## 5. Remaining risks (V2)

| # | Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|
| R1 | Lost update khi 2 user sửa cùng cell | Mất dữ liệu | `Version` concurrency token; trả `409` + giá trị hiện tại; FE hiện dialog "Dữ liệu đã thay đổi, tải lại?" |
| R2 | Cache Heatmap stale sau edit | User thấy target cũ | `DashboardV2CacheService.Invalidate()` sau commit; verify cache key theo `(site, range)` |
| R3 | Bulk fill iterate filtered rows → BOD hiểu nhầm chỉ điền row đang thấy | Sai kỳ vọng | Banner giải thích + live preview (UX P0/P1) |
| R4 | All-or-nothing: 1 cell invalid → toàn batch fail | UX khó chịu nếu nhiều lỗi | FE validate per-cell + danh sách invalid + link nhảy tới ô (UX #84) |
| R5 | Revive soft-deleted row tạo duplicate | Vi phạm unique index | Upsert tìm cả row đã soft-delete (`IgnoreQueryFilters` hoặc `Where` bao gồm deleted) |
| R6 | DayType sai do FE gửi | Dữ liệu sai | Backend tính `DayType` từ `Date`, không tin client |
| R7 | Migration downtime / lock | Ảnh hưởng prod | Thêm cột `Version` default 0 (fast, metadata-only trên PG); deploy giờ thấp điểm |
| R8 | Import + manual cùng lúc | Conflict / audit duplicate | Transaction + concurrency token; import cũng dùng upsert |
| R9 | Mất audit trail (trade-off chấp nhận) | Không truy vết per-cell | Nếu cần sau này, thêm bảng audit ở pha sau (reversible) |
| R10 | Mobile UX (grid ngang) | Khó dùng trên phone | Sticky cột Ngày + save bar sticky + card view (P2) |

**Loại bỏ được so với V1:** R3 (rò rỉ GMV qua audit DTO), R4 (volume audit khi import lớn), R8 (audit table soft-delete filter) — không còn audit table.

---

## 6. Effort estimate (V2)

| Task | Effort | Ghi chú |
|---|---|---|
| Migration `Version` column | S | 1 migration, có Down() |
| Entity + DbContext config | S | |
| Service `UpdateDailyTargets` (batch) + concurrency + cache invalidation | M | Tái dùng logic import upsert + revive |
| Controller `PATCH /DailyTargets` | S | |
| FE: grid inline edit component (1 component) | M | State machine, validation per-cell, keyboard, ARIA |
| FE: bulk fill per-metric (2 checkbox) | S | Iterate filtered rows |
| FE: filters (day type, status) | S | |
| FE: unsaved changes guard + cancel reset | S | |
| FE: input mask số + unit | S | |
| Tests: concurrency + validation + site scoping + masking (GMV trong grid response) | M | Không cần audit tests |
| OpenAPI + generated types | S | |
| **Tổng** | **M (backend) + M (FE)** | Giảm từ L/XL (V1) |

So với plan gốc (đánh giá S/M), effort thực tế vẫn **M** do concurrency + tests + A11y, nhưng đã giảm đáng kể nhờ bỏ audit log.

---

## 7. Khuyến nghị hành động cụ thể (V2)

1. **Giữ plan Option C v2** cho UI (single branch, Excel-like grid).
2. **Backend tối thiểu:** 1 migration (`Version`) + 1 endpoint (`PATCH /DailyTargets`) + service batch upsert + concurrency + cache invalidation. **Không** thêm audit table/endpoint.
3. **Không xóa backend legacy** (KpiPlan company/region/period, Version History, Bulk Update API) — giữ như V1 khuyến nghị.
4. **Bulk fill = FE-driven** (iterate filtered rows), backend không cần biết filter.
5. **Per-metric checkbox** xử lý ở FE; backend cell-level đã hỗ trợ partial.
6. **All-or-nothing** = transaction rollback; FE disable lưu nếu có invalid.
7. **Feature flag** `KpiSimplifiedUi` + rollback plan trước merge.
8. **Cập nhật tests** (không xóa legacy tests): thêm concurrency + validation + site scoping; bỏ audit tests.
9. **UX P0** (UX review): mặc định checkbox tick, live preview, confirm khi ghi đè, guard unsaved changes, input mask, metric trống = skip.

---

## 8. Câu hỏi mở còn lại

1. Audit trail: chấp nhận mất truy vết per-cell ở phase này; nếu BOD yêu cầu sau → thêm bảng audit ở pha sau (reversible, không ảnh hưởng schema hiện tại).
2. Bulk fill semantics: "chỉ row đang hiển thị" (đã chốt) — cần banner giải thích để BOD không hiểu nhầm.
3. Concurrent edit: `Version` trong body (đơn giản hơn ETag/If-Match) — đã khuyến nghị backend review.
4. Retention/import audit: không cần vì bỏ audit log.

---

*Review V2 này thay thế phần "audit log" trong review V1 và backend review. Các phần còn lại (backward compat, consumers, masking cho GMV trong grid response) vẫn áp dụng.*