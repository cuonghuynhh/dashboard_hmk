# KPI Management — Đánh giá UX (Góc nhìn UX Designer)

**Tài liệu tham chiếu:** `docs/KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` (Option C v2 — Excel-like Grid Edit)
**Đối tượng người dùng:** BOD (Business Operations Director) — không chuyên kỹ thuật, dùng dashboard hằng ngày.
**Phạm vi:** Plan đề xuất (1) grid một màn hình, (2) Nhập hàng loạt theo loại ngày, (3) filter loại ngày/trạng thái, (4) inline edit cell, (5) bỏ 3 summary cards, (6) bỏ wizard/modal thêm KPI.

---

## 1. Kết luận tổng quan

Plan đi đúng hướng: giảm tải nhận thức, đưa thao tác về một màn hình, Excel-like quen thuộc. Tuy nhiên **"Nhập hàng loạt theo loại ngày"** là tính năng rủi ro cao nhất (ghi nhiều cell cùng lúc, có thể ghi đè dữ liệu đã có) và hiện mô tả chưa đủ để BOD dùng an toàn. Cần bổ sung: xem trước tác động, mặc định an toàn (chỉ điền ô trống), xác nhận khi ghi đè, hoàn tác, cảnh báo thay đổi chưa lưu, và thông báo kết quả rõ ràng.

**Khuyến nghị:** Không triển khai nguyên trạng. Áp dụng các điều chỉnh P0/P1 bên dưới trước khi code.

---

## 2. Đánh giá "Nhập hàng loạt theo loại ngày" (trọng tâm)

### 2.1 Điểm mạnh
- Tách rõ **Trong tuần** vs **Cuối tuần** — khớp tư duy BOD (giá trị khác nhau theo ngày).
- Checkbox "không ghi đè" thể hiện ý thức an toàn.
- Nút riêng cho từng loại ngày → tránh áp dụng nhầm cả tháng.

### 2.2 Vấn đề phát hiện

| # | Vấn đề | Mức | Ảnh hưởng |
|---|---|---|---|
| 1 | **Không rõ "Áp dụng" làm gì**: điền vào grid (chưa lưu DB) hay lưu luôn? BOD dễ tưởng đã lưu. | Cao | Mất dữ liệu / hiểu nhầm |
| 2 | **Checkbox mặc định không được định nghĩa**. Nếu mặc định không tick → ghi đè toàn bộ (nguy hiểm). | Cao | Mất dữ liệu |
| 3 | **Không có xem trước tác động** (sẽ điền bao nhiêu ngày, bao nhiêu bị bỏ qua). | Cao | Thiếu kiểm soát |
| 4 | **Không có hoàn tác từng thao tác**; "Hủy" reset toàn bộ (cả sửa tay). | Trung bình | Mất công |
| 5 | **Nhập trống một metric**: Nếu chỉ nhập GMV, Traffic trống → áp dụng Traffic = 0 hay bỏ qua? Chưa rõ. | Trung bình | Sai dữ liệu |
| 6 | **Filter đang bật** có thể làm BOD tưởng chỉ điền các dòng đang thấy. | Trung bình | Sai kỳ vọng |
| 7 | **Không xác nhận khi ghi đè** (khi untick checkbox). | Cao | Mất dữ liệu |
| 8 | **Không thông báo kết quả** sau khi áp dụng. | Thấp | Thiếu feedback |
| 9 | **Hai nút "Áp dụng" gần nhau**, dễ bấm nhầm loại ngày. | Thấp | Lỗi thao tác |
| 10 | **Input số chưa có mask định dạng** (₫, dấu phân cách). | Trung bình | Khó đọc/nhập |

### 2.3 Đề xuất cải tiến (P0)

1. **Mặc định checkbox = tick** (chỉ điền ô trống). Label đổi thành câu khẳng định rõ:  
   `☑ Chỉ điền vào ngày chưa có giá trị (an toàn — không ghi đè dữ liệu đã nhập)`  
   Thêm toggle phụ `Ghi đè dữ liệu đã có` (mặc định tắt) thay cho checkbox phủ định.

2. **Xem trước trực tiếp (live preview)** dưới mỗi nút:  
   `Sẽ điền: 10 ngày trong tuần (8 ô trống · 2 đã có giá trị sẽ bị bỏ qua)`  
   Cập nhật khi gõ số.

3. **Xác nhận khi ghi đè**: nếu untick "chỉ ô trống" và có ngày đã có giá trị → dialog `Ghi đè X ngày đã có dữ liệu? [Hủy] [Ghi đè]`.

4. **Thông báo kết quả** (toast + aria-live): `Đã điền 10 ngày trong tuần (GMV 50.000.000₫ · Traffic 100 lượt). Nhấn "Xác nhận lưu" để lưu.`

5. **Nút "Áp dụng" rõ là thao tác grid, không phải lưu**: đổi tên `Điền vào các ngày trong tuần` + icon bút; nút lưu giữ nguyên `Xác nhận lưu mục tiêu`. Thêm text nhỏ: `Thay đổi chỉ được lưu sau khi nhấn "Xác nhận lưu"`.

6. **Metric trống = không thay đổi metric đó**: nếu GMV trống → không điền GMV; Traffic trống → không điền Traffic. Yêu cầu ít nhất 1 metric. Hiển thị `Chỉ điền Traffic, giữ nguyên GMV`.

7. **Hoàn tác**: nút `Hoàn tác lần điền gần nhất` (undo stack 1 bước) bên cạnh "Hủy". "Hủy" vẫn reset toàn bộ nhưng có confirm nếu có thay đổi.

8. **Filter không ảnh hưởng bulk**: bulk luôn áp dụng toàn bộ ngày của loại ngày trong tháng đã chọn; khi filter đang bật → banner `Đang lọc hiển thị. "Điền" sẽ áp dụng cho tất cả ngày trong tuần của tháng, không chỉ các dòng đang hiển thị.`

9. **Input mask**: dùng input type number với `inputmode="numeric"`, định dạng hiển thị sau blur (vnđ). Cho phép nhập `50000000` → hiển thị `50.000.000`. Traffic chỉ số nguyên.

10. **Nút cách nhau / phân nhóm rõ**: mỗi khối day-type trong card riêng, nút primary màu khác nhau (Trong tuần = indigo, Cuối tuần = amber) để giảm nhầm.

---

## 3. Discoverability & Cognitive Load

- **Bỏ 3 summary cards**: đồng ý (không actionable), nhưng BOD mất "bức tranh nhanh". Thay bằng **badge nhỏ trong header**: `Tháng 10/2026: 18/31 ngày đã nhập · 5 KPI đang áp dụng`. Không chiếm diện tích, vẫn cho orientation.
- **Hai bảng trên cùng trang** (Danh sách KPI + Mục tiêu theo ngày) dễ gây nhầm. Đổi tiêu đề/hint:
  - "Danh sách KPI (kế hoạch)" — quản lý trạng thái/activate/archive.
  - "Mục tiêu theo ngày (nhập số)" — nơi nhập GMV/Traffic.
  - Bulk fill chỉ tác động bảng thứ hai.
- **Panel "Nhập hàng loạt"** nên đặt ngay trên bảng Mục tiêu theo ngày, không tách xa. Có thể **collapse/expand** (mặc định mở lần đầu, ghi nhớ trạng thái).
- **Filters** nên là thanh ngang gọn, không ẩn trong toggle (hiện tại `filtersOpen` ẩn). BOD dùng hằng ngày → filter luôn thấy. Nếu cần gọn: đặt inline, không modal.
- **"Thêm KPI mới"**: Option B (form đơn giản) hợp lý. Nhưng "bỏ modal" hoàn toàn có thể làm mất focus management. Khuyến nghị **modal nhẹ** (dialog) với focus trap, Esc đóng, thay vì wizard nhiều bước. Hoặc panel inline có nút "Hủy/Thêm". Tránh form dài trên cùng màn hình.
- **Empty state** cần hướng dẫn: `Chưa có mục tiêu theo ngày. Dùng "Điền vào các ngày..." hoặc "Import mục tiêu" để bắt đầu.`

---

## 4. Error Prevention & Recovery

- **Thay đổi chưa lưu khi đổi Tháng/Chi nhánh**: hiện `watch(dailyMonth)` reload và mất edits. Thêm guard: nếu có pending changes → confirm `Bạn có thay đổi chưa lưu. Hủy thay đổi và tải tháng mới?`.
- **Validation per-cell**: GMV >0, Traffic ≥0. Khi invalid: viền đỏ + tooltip + `aria-invalid`. Nút lưu disable. Hiển thị danh sách `3 ô không hợp lệ` với link nhảy tới ô (scroll).
- **Audit log**: giữ; thêm hiển thị "ai sửa" trong tooltip cell (hover) để BOD yên tâm.
- **Partial save**: giữ; toast `Đã lưu X ngày (Y lỗi bị bỏ qua)`.
- **Xung đột activate**: hiện chỉ set state error. Cải thiện: dialog 3 lựa chọn (Ghi đè / Giữ / Hủy) thay vì thông báo mơ hồ.
- **Archive**: thêm confirm (đã có) + undo toast 5s.
- **Concurrent**: nếu 2 người cùng sửa, lưu sau ghi đè; hiển thị `Dữ liệu đã thay đổi bởi người khác. Tải lại?` (so sánh version/timestamp).

---

## 5. Accessibility (A11y)

- **Grid ARIA**: `<table role="grid">` hoặc `<div role="grid">` với `aria-rowcount/colcount`; header `role="columnheader"`; cell editable `role="gridcell"` + `aria-label="Mục tiêu GMV ngày 01/10/2026, Trong tuần, đã nhập 50 triệu"`.
- **Keyboard**: стрелки điều hướng cell, `Enter`/`F2` vào edit, `Tab`/`Shift+Tab` cell tiếp, `Esc` hủy edit, `Ctrl+S` lưu. Hiện chỉ Enter/Tab → chưa đủ.
- **Focus visible**: ring rõ (`focus:ring-2 focus:ring-indigo-500`) trên mọi control; không dùng outline:none không thay thế.
- **Tooltip lỗi**: phải truy cập được bằng keyboard (`aria-describedby`, focus trigger) + hover. Không chỉ hover.
- **Checkbox**: `<input type="checkbox">` với `<label>` bao trùm; vùng click ≥44px.
- **Màu không phải tín hiệu duy nhất**: trạng thái ✓/— + text; không chỉ màu slate-400.
- **Contrast**: placeholder `—` slate-400 trên trắng có thể <4.5:1 → dùng slate-500.
- **aria-live**: vùng "Đã thay đổi: N ngày" + toast kết quả `role="status"`/`aria-live="polite"`.
- **Modal focus trap** (import/add) + restore focus khi đóng.
- **Reduced motion**: respect `prefers-reduced-motion` cho animation fade-in.
- **Screen reader**: thông báo số ô invalid và vị trí.

---

## 6. Mobile Responsiveness

- Grid hiện `min-w-[720px]` → cuộn ngang trên điện thoại. Chấp nhận cho bảng số, nhưng cần:
  - **Cột đầu (Ngày) sticky left** khi cuộn ngang.
  - **Touch target ≥44px** cho nút expand branch, cell edit.
  - **Cell edit mở input full-width** trong hàng, tránh bàn phím che.
- **Bulk panel**: stack dọc, input full-width, nút full-width, spacing đủ.
- **Filters**: accordion/collapsible, mặc định mở trên mobile? → collapsed để tiết kiệm chỗ, có badge số filter đang bật.
- **Save bar sticky bottom** trên mobile: `Hủy` + `Xác nhận lưu` luôn nhìn thấy.
- **Month picker native** (`type="month"`) OK; đảm bảo label rõ.
- **Consider card view** cho mobile: mỗi ngày một card (Ngày, Loại, GMV, Traffic) thay vì bảng ngang — tùy ưu tiên. Nếu BOD chủ yếu desktop, giữ bảng + sticky.

---

## 7. Đề xuất thay đổi Plan (cụ thể)

### P0 (bắt buộc trước khi code)
1. Định nghĩa mặc định checkbox = tick (chỉ ô trống); đổi label sang câu khẳng định.
2. Thêm live preview tác động + confirm khi ghi đè.
3. Thông báo kết quả sau "Áp dụng".
4. Guard thay đổi chưa lưu khi đổi Tháng/Chi nhánh.
5. Input mask số + unit.
6. Metric trống = skip metric đó.

### P1 (nên có)
7. Undo lần điền gần nhất.
8. Filter không ảnh hưởng bulk + banner giải thích.
9. Badge nhỏ thay 3 cards.
10. Đổi tiêu đề 2 bảng + empty state hướng dẫn.
11. Validation list + nhảy tới ô invalid.
12. Keyboard navigation đầy đủ + ARIA grid.
13. Sticky cột Ngày trên mobile + save bar sticky.

### P2 (nice-to-have)
14. Collapse panel Nhập hàng loạt (ghi nhớ).
15. Card view mobile.
16. "Sao chép từ tháng trước".
17. Dialog 3 lựa chọn khi activate conflict.
18. Concurrent edit detection.

---

## 8. Acceptance Criteria đề xuất (để QC)

- [ ] Mặc định checkbox tick; bulk fill không ghi đè dữ liệu đã có.
- [ ] Khi untick và có dữ liệu đã có → dialog xác nhận; hủy thì không thay đổi.
- [ ] Live preview hiển thị số ngày sẽ điền / bị bỏ qua; cập nhật khi gõ.
- [ ] Toast kết quả sau áp dụng; vùng "Đã thay đổi" cập nhật.
- [ ] Đổi Tháng khi có pending changes → confirm; xác nhận thì discard.
- [ ] GMV trống → không điền GMV; Traffic trống → không điền Traffic; yêu cầu ≥1 metric.
- [ ] Invalid cell → viền đỏ + tooltip + aria-invalid; lưu disable; danh sách invalid.
- [ ] Keyboard: ↑↓←→, Enter, Tab, Esc, Ctrl+S hoạt động.
- [ ] Screen reader đọc được label cell và trạng thái.
- [ ] Mobile: sticky cột Ngày, touch target ≥44px, save bar sticky.
- [ ] Empty state có hướng dẫn.
- [ ] Audit log ghi mỗi cell thay đổi.

---

## 9. Câu hỏi mở cho BOD/PM

1. "Áp dụng" có nên lưu luôn vào DB hay chỉ điền grid? (Khuyến nghị: chỉ grid, lưu qua "Xác nhận lưu".)
2. Khi chỉ nhập 1 metric, metric kia giữ nguyên hay set 0? (Khuyến nghị: giữ nguyên.)
3. Có cần "Sao chép từ tháng trước" không?
4. BOD có dùng mobile thường xuyên không? (Ảnh hưởng card view.)
5. Có cần undo nhiều bước hay 1 bước đủ?

---

*Tài liệu này là góp ý UX, không thay thế plan kỹ thuật. Nên cập nhật `KPI_MANAGEMENT_SIMPLIFICATION_PLAN.md` section 4.2 theo các điều chỉnh P0 trước khi triển khai.*