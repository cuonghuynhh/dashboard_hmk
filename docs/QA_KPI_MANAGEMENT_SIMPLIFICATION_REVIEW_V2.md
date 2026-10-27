# KPI Management Simplification — QA Engineer Review V2

**Ngày review:** 26/10/2026  
**Reviewer:** QA Engineer  
**Plan gốc:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` (quyết định BOD vòng 2, section 7)  
**Phạm vi:** đánh giá 6 quyết định mới đã chốt từ góc nhìn kiểm thử, cập nhật test scenarios, edge cases, regression risks.

---

## 1. Kết luận tổng quan (QA)

6 quyết định v2 đều **testable** và **giảm scope kiểm thử** so với bản trước:

- **Bỏ audit log** là quyết định lớn nhất về QA: loại bỏ toàn bộ test liên quan bảng `KpiDailyTargetAudit`, endpoint audit, masking audit DTO, retention → giảm ~9 scenario.
- **All-or-nothing partial save** đơn giản hóa kỳ vọng kết quả lưu: không còn trạng thái "lưu một phần", chỉ có "toàn bộ thành công" hoặc "toàn bộ fail + retry".
- **Bulk fill chỉ row đang hiển thị** làm phạm vi tác động rõ ràng, dễ assert (hidden rows không đổi), nhưng **mâu thuẫn** với khuyến nghị UX (bulk áp dụng toàn bộ ngày). Cần BOD/PM chốt lại trước khi code (xem §6).
- **Checkbox per-metric** tăng số tổ hợp test (2 checkbox × 2 metric) nhưng logic rõ ràng.
- **Single branch** giảm ma trận test (không còn multi-branch view), tăng test scoping/quyền.
- **Excel-like grid** là trung tâm kiểm thử: inline edit, dirty tracking, validation per-cell, bulk fill, filter combos, cancel/reset, guard chưa lưu.

Ước tính **test scenarios giảm từ 34 xuống ~25** (chi tiết §3).

---

## 2. Tác động của từng quyết định lên test scope

| # | Quyết định v2 | Ảnh hưởng test | Scenario |
|---|---|---|---|
| 1 | All-or-nothing partial save | Bỏ test "lưu một phần (N ok / M lỗi)"; thêm test atomic fail + retry + disable nút lưu khi có cell invalid | −3 / +2 |
| 2 | Bulk fill chỉ row đang hiển thị | Thêm assert hidden rows không đổi; thêm test filter on/off trước bulk | +2 |
| 3 | Checkbox per-metric (GMV/Traffic độc lập) | Thêm tổ hợp: chỉ GMV, chỉ Traffic, cả hai, không tick | +3 |
| 4 | Bỏ audit log | Loại bỏ toàn bộ test audit (table, endpoint, masking, retention, source tracking) | −9 |
| 5 | Single branch | Loại bỏ test multi-branch view; thêm test dropdown chi nhánh + scoping/quyền | −2 / +2 |
| 6 | Excel-like grid | Trung tâm: inline edit, dirty, validation, bulk, filter combos | giữ nguyên ~12 |

**Tổng:** 34 − 9 (audit) − 3 (partial save) − 2 (multi-branch) + 2 + 3 + 2 + 2 ≈ **25**.

---

## 3. Test scenarios updated (~25)

### A. Load & filter (5)
1. Load grid theo Chi nhánh + Tháng: ngày đã có data hiển thị đậm, ngày chưa có hiển thị `—` (slate-500).
2. Đổi Chi nhánh → grid reload; có pending changes → confirm discard.
3. Đổi Tháng → grid reload; có pending changes → confirm discard.
4. Filter Loại ngày (Tất cả / Trong tuần / Cuối tuần) → chỉ rows khớp; data không bị xóa.
5. Filter Trạng thái (Tất cả / Đã nhập / Chưa nhập) + combo với filter Loại ngày → intersection đúng.

### B. Inline edit & dirty tracking (4)
6. Click cell → input; nhập giá trị → Enter/Tab chuyển cell; dirty count tăng; cell đậm.
7. Esc hủy edit cell → giá trị về ban đầu; dirty count không tăng.
8. Sửa cell rồi sửa lại về giá trị gốc → dirty count giảm về 0 (no-op không tính dirty).
9. Nút "Hủy" → discard toàn bộ thay đổi; grid về trạng thái ban đầu; dirty count = 0.

### C. Validation per-cell (4)
10. GMV ≤ 0 → viền đỏ + tooltip + `aria-invalid`; nút "Xác nhận lưu" disable.
11. Traffic < 0 → viền đỏ + tooltip; nút lưu disable.
12. GMV rỗng (null) → hợp lệ (fallback KPI cũ); Traffic rỗng → hợp lệ.
13. Có ≥1 cell invalid → disable lưu; sửa xong → enable; lưu thành công tất cả changed cells.

### D. Bulk fill (4)
14. Checkbox chỉ GMV tick → chỉ điền GMV cho các row visible; Traffic không đổi.
15. Checkbox chỉ Traffic tick → chỉ điền Traffic; GMV không đổi.
16. Cả hai tick → điền cả hai; không tick nào → nút "Áp dụng" disable / no-op.
17. Bulk fill tôn trọng "Chỉ áp dụng cho ngày chưa có giá trị": ngày đã có giá trị không bị ghi đè; untick → ghi đè + dialog xác nhận.

### E. Bulk fill scope & filter (2)
18. Filter đang bật (ẩn một số row) → bulk fill chỉ áp dụng row đang hiển thị; row bị ẩn giữ nguyên giá trị cũ; sau khi bỏ filter kiểm tra row ẩn không đổi.
19. Bulk fill metric rỗng (GMV hoặc Traffic không nhập) → skip metric đó; yêu cầu ≥1 metric; hiển thị "Chỉ điền Traffic, giữ nguyên GMV".

### F. Save all-or-nothing (3)
20. Có ≥1 cell invalid → không gọi save / backend trả 400 toàn bộ; không có cell nào được lưu (assert DB/state unchanged).
21. Tất cả valid → lưu toàn bộ changed cells trong 1 transaction; success toast; dirty count = 0; grid đồng bộ giá trị mới + Version.
22. Concurrency conflict (Version mismatch, 2 user cùng sửa) → 409; hiển thị "Dữ liệu đã thay đổi bởi người khác. Tải lại?"; không mất dữ liệu local cho đến khi user chọn.

### G. Permission & scoping (2)
23. Manager chỉ xem/sửa chi nhánh được gán: dropdown chỉ liệt kê chi nhánh được phép; sửa chi nhánh khác → 403.
24. User không có `gmv.read`: GMV masked (nếu daily target GMV nằm trong masked) — kiểm tra response không rò GMV. Traffic không bị mask.

### H. Regression / consumer (1)
25. Sau khi inline edit daily target → Heatmap hiển thị target mới (cache invalidated); ResponsePostProcessor không rò GMV.

---

## 4. Edge cases theo quyết định mới

### 4.1 All-or-nothing
- User sửa 10 cell, 1 cell invalid → nút lưu disable; không có request save; sửa xong → enable.
- Backend nhận batch có cell invalid → 400 toàn bộ, không partial; FE hiển thị danh sách invalid + link nhảy tới ô.
- Retry sau khi sửa: gửi lại toàn bộ changed cells (không chỉ cell vừa sửa) → idempotent (no-op cell skip, không audit — nhưng audit đã bỏ).
- Concurrency conflict trong batch: toàn bộ batch fail 409 hay partial? Khuyến nghị atomic: nếu 1 cell conflict → 409 toàn bộ, FE reload.

### 4.2 Bulk fill chỉ visible rows
- Filter "Chưa nhập" đang bật → bulk fill chỉ điền row chưa nhập đang hiển thị; row "Đã nhập" ẩn không bị ảnh hưởng (và row đã nhập hiển thị cũng không bị ghi đè nếu OnlyEmpty).
- Sau bulk, bỏ filter → row ẩn giữ giá trị cũ (assert).
- UX conflict: UX review khuyến nghị bulk áp dụng toàn bộ ngày bất kể filter. **QA khuyến nghị BOD chốt**: nếu giữ "chỉ visible", phải có banner rõ "Điền chỉ áp dụng cho các dòng đang hiển thị" để tránh kỳ vọng sai (UX issue #6).

### 4.3 Checkbox per-metric
- Chỉ tick GMV nhưng GMV input rỗng → không điền gì cho GMV; nếu Traffic cũng không tick → no-op, disable nút.
- Tick GMV, nhập GMV → chỉ GMV thay đổi; Traffic giữ nguyên (kể cả cell đang rỗng).
- Bulk fill không ghi đè metric đã có khi OnlyEmpty tick, nhưng nếu metric đó rỗng mà metric kia đã có → chỉ điền metric rỗng.

### 4.4 Bỏ audit log
- Không test bảng `KpiDailyTargetAudit`, endpoint `GET .../Audit`, masking audit DTO, retention.
- Regression risk: mất truy vết "ai đổi khi nào"; nếu sau này BOD yêu cầu audit, phải thêm migration + endpoint lại. Khuyến nghị giữ `UpdatedAt`/`UpdatorId` trên `KpiDailyTarget` (đã có) để còn trace tối thiểu.
- Import vẫn ghi? Quyết định bỏ audit → import cũng không ghi audit. Cần cập nhật `DashboardV2ImportTests` nếu có assert audit.

### 4.5 Single branch
- Dropdown chi nhánh required; không có option "Tất cả chi nhánh" trong grid.
- Switch branch khi có pending changes → confirm; xác nhận thì discard và reload.
- Manager không thấy chi nhánh ngoài phạm vi → không test multi-branch comparison view (đã loại bỏ).

### 4.6 Excel-like grid
- Dirty tracking phải phân biệt "đã edit" vs "chưa edit" (cell mờ `—` không tính dirty).
- Filter không xóa data: apply filter rồi bulk/edit → data underlying giữ; bỏ filter thấy đủ.
- Cancel reset về trạng thái ban đầu (bao gồm giá trị import).
- Unsaved changes guard khi đổi Tháng/Chi nhánh/filter? Filter không reload data → không cần guard; branch/month cần guard.

---

## 5. Regression risks (cần theo dõi)

1. **UX vs BOD conflict (bulk scope)**: UX review P0 #8 nói bulk áp dụng toàn bộ ngày; BOD v2 nói chỉ visible rows. Nếu không chốt, test sẽ fail sau. → Cần PM xác nhận và cập nhật UX review.
2. **All-or-nothing vs kỳ vọng "partial save" cũ**: Import vẫn partial (dòng hợp lệ ghi, dòng lỗi bỏ qua) nhưng manual save atomic. User dễ nhầm. Cần messaging rõ và test cả hai luồng.
3. **Mất audit log**: nếu sau này cần compliance, chi phí thêm lại cao. Giữ `UpdatedAt/Updator` tối thiểu.
4. **Legacy KpiPlan vẫn là nguồn** cho Heatmap/Executive/ResponsePostProcessor (company/region scope, campaign override). Không được xóa backend legacy trong cùng đợt; test consumer vẫn pass.
5. **Cache Heatmap stale** sau inline edit: test phải verify target mới hiển thị (invalidate).
6. **GMV masking**: daily target GMV có trong `MaskedProperties`? Cần test response không rò GMV cho user thiếu `gmv.read`; audit đã bỏ nên không test audit masking.
7. **Soft-delete revive**: upsert inline edit phải revive row soft-deleted (test `KpiImport_RevivesSoftDeletedRow...` tương tự) để tránh duplicate unique index.
8. **DayType tính từ Date**: backend không tin FE; test boundary T2-T6 vs T7-CN (không holiday).

---

## 6. Câu hỏi mở cho BOD/PM (QA)

1. Bulk fill scope: chỉ visible rows (BOD v2) hay toàn bộ ngày (UX)? → Ảnh hưởng test #18 và messaging.
2. Manual save atomic: nếu 1 cell conflict (409), có rollback toàn batch hay lưu các cell ok? → Khuyến nghị atomic (khớp all-or-nothing).
3. Empty cell manual: xóa giá trị (null, fallback) hay không cho phép xóa? → Ảnh hưởng validation test #12.
4. Có giữ `UpdatedAt/Updator` trace tối thiểu sau khi bỏ audit? → Khuyến nghị giữ.
5. Audit retention/export có cần không? Nếu "không", bỏ hoàn toàn; nếu "có", chỉ giảm test chứ không bỏ.

---

## 7. Khuyến nghị QA trước khi code

- Cập nhật test plan: xóa ~9 scenario audit; thêm ~6 scenario (filter+bulk visible, per-metric combos, all-or-nothing, concurrency, scoping).
- Viết automation cho filter combos × bulk fill (assert hidden rows unchanged) — đây là regression risk cao nhất.
- Giữ nguyên tests legacy (`KpiV2BulkUpdateTests`, `KpiV2LegacyPlanTests`, `KpiDailyTargetTests`) — không xóa; chuyển "deprecated but supported".
- Thêm contract test cho endpoint `PATCH /DailyTargets` (batch) trong OpenAPI.
- Chốt câu hỏi mở §6 trước khi finalize test cases.