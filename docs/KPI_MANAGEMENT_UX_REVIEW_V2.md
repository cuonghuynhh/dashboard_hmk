# KPI Management — Đánh giá UX V2 (Góc nhìn UX Designer)

**Tài liệu tham chiếu:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` (Quyết định BOD vòng 2 — section 7)
**Đối tượng người dùng:** BOD (Business Operations Director) — không chuyên kỹ thuật, dùng dashboard hằng ngày.
**Phạm vi:** Đánh giá 6 quyết định mới đã chốt: (1) All-or-nothing partial save, (2) Bulk fill chỉ row đang hiển thị, (3) Checkbox per-metric, (4) Bỏ audit log, (5) Single branch, (6) Excel-like grid 1 màn hình.
**Ghi chú:** Tài liệu này **cập nhật/supersede** các mục liên quan trong `KPI_MANAGEMENT_UX_REVIEW.md` (V1): partial save → all-or-nothing; audit log → bỏ; bulk scope → chỉ dòng hiển thị.

---

## 1. Kết luận tổng quan

Các quyết định mới nhìn chung **đi đúng hướng UX**:
- All-or-nothing làm ngữ nghĩa lưu rõ ràng, tránh trạng thái "lưu một phần" mơ hồ.
- Single branch + Excel-like grid giảm tải nhận thức, thao tác quen thuộc.
- Per-metric checkbox linh hoạt hơn checkbox toàn cục.
- Bỏ audit log giảm complexity đáng kể.

Tuy nhiên 3 quyết định tạo **rủi ro UX mới** cần xử lý trước khi code:
1. **All-or-nothing** có thể gây bực bội nếu lỗi phân tán (user sửa xong 1 ô lại phát hiện ô khác) → cần validation tổng hợp + nhảy tới ô lỗi + giữ edits khi fail.
2. **Bulk fill chỉ row đang hiển thị** dễ gây "sai kỳ vọng" nếu filter không được nhận biết rõ → cần filter chip luôn hiển thị + banner + đếm số dòng bị ảnh hưởng.
3. **Bỏ audit log** làm mất dấu vết truy xuất → cần bù bằng metadata "cập nhật lần cuối" + toast xác nhận lưu chi tiết.

**Khuyến nghị:** Áp dụng các điều chỉnh P0 trong mục 2 trước khi triển khai; đồng thời cập nhật `KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` section 4.2 và 7.

---

## 2. Đánh giá từng quyết định mới

### 2.1 All-or-nothing partial save

**Tác động UX:** Rõ ràng, không còn trạng thái "lưu một phần" khó hiểu. Nhưng nếu 1 ô invalid, toàn bộ batch fail → user phải tìm và sửa tất cả.

**Vấn đề phát hiện**

| # | Vấn đề | Mức | Ảnh hưởng |
|---|---|---|---|
| 1 | Ô lỗi bị ẩn do filter → user không nhìn thấy nhưng save vẫn fail → hoang mang | Cao | Mất thời gian |
| 2 | Không có tổng hợp lỗi → phải tự rà từng cell | Cao | Sai sót |
| 3 | Nếu save fail (400), FE có thể discard edits nếu không thiết kế kỹ → mất dữ liệu | Cao | Mất dữ liệu |
| 4 | Conflict đồng thời (409) chưa có UX xử lý | Trung bình | Mất dữ liệu |
| 5 | Không có tiến trình "đã lưu bao nhiêu" → user không biết còn bao nhiêu việc | Thấp | Thiếu feedback |

**Recommendations (P0)**
1. Validation real-time per-cell (GMV >0, Traffic ≥0) + tổng hợp live: `3 ô không hợp lệ` trong save bar.
2. Nút lưu disable nếu có bất kỳ invalid cell (kể cả dòng đang ẩn); tooltip nêu lý do.
3. Cung cấp link `Xem ô lỗi` → clear filter hoặc scroll tới ô lỗi đầu tiên; highlight tất cả ô invalid.
4. Khi save fail (400), **giữ nguyên grid dirty** + highlight invalid + toast: `Chưa lưu được: 3 ô không hợp lệ. Sửa rồi nhấn lưu lại.`
5. Save bar hiển thị: `N ô chưa lưu (gồm M dòng đang ẩn)` để user biết phạm vi thực sự.
6. Conflict (409): toast `Dữ liệu đã thay đổi bởi người khác.` + nút `Tải lại dữ liệu mới` (P1: giữ bản nháp để merge).

**Acceptance**
- [ ] 1 invalid cell → nút lưu disable; sau khi sửa → enable.
- [ ] Ô lỗi bị ẩn vẫn được đếm và có cách xem.
- [ ] Save fail không discard edits.

---

### 2.2 Bulk fill chỉ row đang hiển thị

**Tác động UX:** Giảm rủi ro ghi nhầm toàn tháng, nhưng user phải **nhận biết filter đang bật**. Nếu không, bulk chỉ điền vài dòng → user tưởng đã điền cả tháng.

**Vấn đề phát hiện**

| # | Vấn đề | Mức |
|---|---|---|
| 1 | Filter state không luôn hiển thị rõ → user không biết bulk chỉ áp dụng dòng đang thấy | Cao |
| 2 | Bulk có thể áp dụng 0 dòng (filter không khớp day-type) → không feedback | Trung bình |
| 3 | Không có cách nhanh "áp dụng toàn bộ tháng" khi filter đang bật | Trung bình |
| 4 | Đếm "đã thay đổi" không phân biệt dòng hiển thị/ẩn → dễ nhầm | Thấp |

**Recommendations (P0)**
1. Filter luôn hiển thị dạng chip kèm số dòng: `Đang lọc: Trong tuần · 12 dòng` + nút `Bỏ lọc`.
2. Nút bulk hiển thị động số dòng bị ảnh hưởng: `Điền vào 12 dòng đang hiển thị`.
3. Banner cố định khi filter ≠ `Tất cả`: `Chú ý: "Điền" chỉ áp dụng cho các dòng đang hiển thị. Dòng bị ẩn không thay đổi.`
4. Preview trước apply: `Sẽ điền: 12 dòng (GMV 10 ô trống · 2 đã có → bỏ qua theo checkbox)`.
5. Nếu filter result rỗng → disable bulk + tooltip `Không có dòng nào khớp bộ lọc hiện tại`.
6. Trong banner cung cấp quick link `Bỏ lọc để áp dụng toàn bộ tháng`.
7. Sau apply toast nêu rõ phạm vi: `Đã điền 12 dòng đang hiển thị (Trong tuần).`
8. Save bar đếm bao gồm dòng ẩn: `N ô chưa lưu (gồm M dòng đang ẩn)`.

**Acceptance**
- [ ] Filter active → chip + banner hiển thị.
- [ ] Bulk button count khớp số dòng đang hiển thị.
- [ ] Filter rỗng → bulk disable.
- [ ] Toast sau apply nêu rõ phạm vi.

---

### 2.3 Checkbox per-metric (GMV/Traffic độc lập)

**Tác động UX:** Linh hoạt hơn (chỉ điền GMV hoặc chỉ Traffic), nhưng tăng số control (4 checkbox cho 2 day-type) → cần bố cục rõ ràng, tránh nhầm.

**Vấn đề phát hiện**

| # | Vấn đề | Mức |
|---|---|---|
| 1 | Checkbox có thể bị hiểu là "bật/tắt metric" thay vì "chỉ điền ô trống" | Trung bình |
| 2 | Nếu checkbox untick nhưng vẫn nhập giá trị → user không biết sẽ ghi đè | Cao |
| 3 | Empty input + checkbox ticked → không rõ skip hay lỗi | Trung bình |
| 4 | 4 checkbox gần nhau → dễ bấm nhầm loại ngày/metric | Thấp |

**Recommendations (P0)**
1. Default cả 2 checkbox ticked (chỉ điền ô trống) — an toàn.
2. Label câu khẳng định: `☑ Chỉ điền ô GMV còn trống` / `☑ Chỉ điền ô Traffic còn trống`.
3. Input và checkbox độc lập: input luôn cho phép nhập; checkbox chỉ điều khiển có ghi đè ô đã có hay không. (Không disable input khi untick.)
4. Empty input → skip metric đó (không thay đổi), không lỗi; yêu cầu ít nhất 1 metric có giá trị để enable nút apply.
5. Nếu untick checkbox + input non-empty + có ngày đã có giá trị → on apply hiển thị confirm: `Ghi đè GMV cho X ngày đã có giá trị? [Hủy] [Ghi đè]`.
6. Nếu cả 2 checkbox untick + cả 2 input có giá trị → 1 confirm gộp liệt kê cả 2 metric.
7. Preview cập nhật theo checkbox: `GMV: bỏ qua 2 ngày đã có` vs `GMV: ghi đè 2 ngày đã có`.
8. Bố cục: mỗi day-type một card, accent màu khác nhau (Trong tuần = indigo, Cuối tuần = amber); checkbox đặt ngay dưới input tương ứng.
9. Toast sau apply: `Đã điền GMV cho 10 ngày, Traffic cho 10 ngày (chỉ ô trống).`

**Acceptance**
- [ ] Default checkbox ticked.
- [ ] Empty input → skip metric, không lỗi.
- [ ] Untick + có dữ liệu đã có → confirm trước apply.
- [ ] Preview count khớp checkbox state.

---

### 2.4 Bỏ audit log

**Tác động UX:** Giảm complexity, không cần màn hình audit. Nhưng BOD mất khả năng truy "ai sửa gì khi nào" → có thể gây lo lắng. Cần bù bằng feedback nhẹ, không xây audit table.

**Vấn đề phát hiện**

| # | Vấn đề | Mức |
|---|---|---|
| 1 | Không còn traceability → khó truy nguyên nhân khi số liệu sai | Cao (nếu compliance) |
| 2 | Không có "lịch sử thay đổi" → BOD thiếu yên tâm | Trung bình |
| 3 | All-or-nothing + no audit → trước khi lưu cần review kỹ hơn | Trung bình |

**Recommendations (P0/P1)**
1. Hiển thị metadata nhẹ từ row (từ `UpdatedAt`/`UpdatorName` đã có): tooltip cell/row `Cập nhật: 26/10 14:32 bởi Nguyễn A`. (Không phải audit log đầy đủ, chỉ orientation.)
2. Toast xác nhận lưu chi tiết: `Đã lưu 18 ngày lúc 14:32 bởi [Tên].`
3. Trước khi lưu, hiển thị tóm tắt thay đổi: `Sẽ lưu: 12 ô GMV, 8 ô Traffic; ghi đè 5 ô đã có.` (đặc biệt khi có overwrite).
4. Không hiển thị nút "Lịch sử thay đổi" (tránh nhầm là audit) — nếu cần, để trong help/documentation là "sẽ discuss sau".
5. Nếu compliance yêu cầu traceability, escalate để giữ audit ở phase 2 (không phải scope hiện tại).
6. P1: Confirm dialog trước lưu khi có ghi đè: `Lưu 18 ngày (gồm 5 ô ghi đè)? [Hủy] [Lưu]`.

**Acceptance**
- [ ] Không có màn hình audit / endpoint audit trong UI.
- [ ] Toast lưu có timestamp + người dùng.
- [ ] Tooltip row hiển thị last-modified (nếu backend expose).

---

### 2.5 Single branch

**Tác động UX:** Grid nhỏ hơn, thao tác nhanh hơn, ít nhầm. Nhưng mất khả năng so sánh nhiều chi nhánh → cần guard khi đổi chi nhánh.

**Recommendations (P0)**
1. Dropdown chi nhánh required, đặt đầu panel điều khiển; grid header hiển thị `Chi nhánh: X · Tháng: Y`.
2. Pending changes guard khi đổi chi nhánh: `Bạn có thay đổi chưa lưu. Hủy thay đổi và tải chi nhánh mới?`
3. Save bar hiển thị chi nhánh đang lưu để tránh lưu nhầm.
4. Empty state: `Chưa có mục tiêu cho chi nhánh X tháng Y. Dùng "Điền..." hoặc "Import mục tiêu" để bắt đầu.`
5. Mobile: dropdown full-width, grid scroll ngang với cột Ngày sticky.
6. P2: `Sao chép mục tiêu từ chi nhánh khác` (chọn source + tháng, preview + confirm).

**Acceptance**
- [ ] Đổi chi nhánh khi có pending changes → confirm.
- [ ] Grid header có tên chi nhánh + tháng.
- [ ] Empty state có hướng dẫn.

---

### 2.6 Excel-like grid (1 màn hình)

**Tác động UX:** Quen thuộc, 1 màn hình, thao tác nhanh. Cần đảm bảo accessibility + responsive như V1.

**Recommendations (P0/P1)**
1. Keyboard navigation đầy đủ: ↑↓←→, Enter/F2 vào edit, Tab/Shift+Tab cell tiếp, Esc hủy edit, Ctrl+S lưu (V1).
2. Sticky header row + sticky cột đầu (Ngày) khi cuộn ngang/dọc.
3. Trạng thái cell rõ ràng: mờ (chưa nhập, slate-500 thay slate-400 cho contrast), đậm (đã nhập), dirty (dot/viền), invalid (đỏ + tooltip).
4. Input mask số (vnđ) + traffic số nguyên; hiển thị phân cách sau blur.
5. Focus visible ring trên mọi control; tooltip lỗi truy cập được bằng keyboard.
6. Save bar sticky bottom (desktop + mobile) với `Hủy` + `Xác nhận lưu`.
7. Panel "Nhập hàng loạt" collapse/expand (ghi nhớ trạng thái), mặc định mở lần đầu.
8. Empty state + onboarding hint.
9. `beforeunload` guard khi có dirty cells.
10. P2: paste từ clipboard (Excel-like nâng cao).

**Acceptance**
- [ ] Keyboard nav hoạt động.
- [ ] Sticky header/cột Ngày.
- [ ] beforeunload guard khi dirty.
- [ ] Mobile save bar sticky.

---

## 3. Cross-cutting usability improvements (mới)

1. **State machine rõ ràng:** clean → dirty → invalid → saving → saved/error; disable control phù hợp.
2. **Pending changes guard** cho đổi Tháng/Chi nhánh (không cho filter làm mất edits — filter không mutate data).
3. **Validation tổng hợp** bao gồm cả dòng đang ẩn; link xem ô lỗi.
4. **Dirty count** bao gồm dòng ẩn: `N ô chưa lưu (gồm M dòng đang ẩn)`.
5. **aria-live** cho toast + vùng "Đã thay đổi".
6. **Last-modified metadata** bù cho việc bỏ audit (nếu backend expose).
7. **Error recovery:** save fail giữ edits; conflict (409) có hướng dẫn tải lại.
8. **Number formatting** nhất quán (vnđ, số nguyên traffic).

---

## 4. Còn thiếu gì (gaps) so với các quyết định mới

| # | Thiếu | Ưu tiên |
|---|---|---|
| 1 | Undo cho lần bulk fill gần nhất (1 bước) | P1 |
| 2 | Xử lý conflict đồng thời (409) — tải lại + giữ bản nháp | P1 |
| 3 | Traceability tối thiểu (last-modified) sau khi bỏ audit | P1 |
| 4 | Copy từ tháng/chi nhánh trước | P2 |
| 5 | Paste từ Excel | P2 |
| 6 | Autosave draft tránh mất dữ liệu | P2 |
| 7 | Mobile card view (nếu BOD dùng mobile thường xuyên) | P2 |
| 8 | Bulk across months (hiện import đã cover) | P2 |
| 9 | Onboarding tooltip cho lần đầu | P2 |
| 10 | Undo sau khi lưu (rollback) — cần versioning, chưa làm | P3 |
| 11 | Filter persistence across session | P3 |

---

## 5. Đề xuất cập nhật Plan (section cần sửa)

- **4.2 "Nút Xác nhận lưu":** đổi partial save → all-or-nothing; disable nếu có invalid; giữ dirty khi fail; đếm bao gồm dòng ẩn.
- **4.2 "Audit log" row:** xóa hoặc đổi thành "Metadata last-modified (từ UpdatedAt/UpdatorName)".
- **4.2 "Nhập hàng loạt":** scope = dòng đang hiển thị; per-metric checkbox; preview count; confirm khi ghi đè.
- **7.0 #1–#4:** phản ánh đúng quyết định mới (đã có).
- **Acceptance criteria:** cập nhật theo mục 6 bên dưới.

---

## 6. Acceptance criteria đề xuất (V2)

- [ ] All-or-nothing: 1 invalid cell → lưu disable/fail; edits được giữ; có tổng hợp lỗi + nhảy tới ô lỗi (kể cả dòng ẩn).
- [ ] Bulk fill chỉ dòng hiển thị; filter chip + count + banner khi filter active; filter rỗng → bulk disable; toast nêu phạm vi.
- [ ] Per-metric checkbox default ticked; empty input skip metric; untick + có dữ liệu đã có → confirm; preview count khớp.
- [ ] Không có UI audit; toast lưu có timestamp + người dùng; tooltip last-modified (nếu expose).
- [ ] Single branch: dropdown required; pending changes guard; tên chi nhánh + tháng ở header/save bar; empty state có hướng dẫn.
- [ ] Excel-like: keyboard nav, sticky header/cột Ngày, cell states, input mask, a11y, mobile sticky save bar, beforeunload guard.
- [ ] Save bar đếm bao gồm dòng ẩn.

---

## 7. Câu hỏi mở cho BOD/PM

1. All-or-nothing: có cần "lưu nháp" (draft) để tránh mất dữ liệu khi có lỗi?
2. Bulk scope: nếu filter đang bật, có nên thêm nút nhanh "Áp dụng toàn bộ tháng" (vẫn tôn trọng quyết định, nhưng là escape hatch)?
3. Per-metric checkbox default ticked có OK với BOD không?
4. Bỏ audit: có yêu cầu traceability tối thiểu (last-modified) hay không cần gì?
5. Có cần undo 1 bước cho bulk fill không?
6. BOD có dùng mobile thường xuyên không? (Ảnh hưởng card view.)

---

## 8. Priority summary

### P0 (bắt buộc trước khi code)
1. All-or-nothing validation tổng hợp + giữ edits khi fail + nhảy tới ô lỗi (kể cả ẩn).
2. Bulk fill scope rõ ràng: filter chip + banner + count + disable khi rỗng.
3. Per-metric checkbox default ticked + confirm khi ghi đè + preview count.
4. Pending changes guard cho đổi Tháng/Chi nhánh.
5. Input mask số + unit.
6. Keyboard nav + ARIA grid + focus visible.
7. Sticky header/cột Ngày + save bar sticky (mobile).

### P1 (nên có)
8. Undo lần bulk fill gần nhất.
9. Xử lý conflict 409.
10. Last-modified metadata + toast lưu chi tiết.
11. Tóm tắt thay đổi trước lưu (khi có overwrite).
12. Empty state + onboarding hint.
13. Collapse panel bulk fill (ghi nhớ).

### P2 (nice-to-have)
14. Copy từ tháng/chi nhánh trước.
15. Paste từ Excel.
16. Autosave draft.
17. Mobile card view.
18. Onboarding tooltip.

---

*Tài liệu này là góp ý UX, không thay thế plan kỹ thuật. Nên cập nhật `KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` section 4.2 và 7 theo các điều chỉnh P0 trước khi triển khai.*
