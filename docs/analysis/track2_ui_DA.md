# TRACK 2 — Kiểm thử & Phân tích từ giao diện chạy thực (Data Analyst)

- **Ứng dụng:** EBID Workspace – "Eyewear Business Intelligence Dashboard" (`http://localhost:3000`, tiêu đề tab "Dashboard Kinh Doanh")
- **Phương pháp:** thao tác trực tiếp trên Chrome (tab riêng), đọc số trên màn hình, hover tooltip, mở modal, đổi bộ lọc rồi so sánh text/SVG trước-sau bằng script đọc DOM (chỉ đọc, không sửa dữ liệu). Không đọc mã nguồn để rút kết luận; chỉ đọc mục 11 & 13 trong báo cáo BA để đối chiếu.
- **Môi trường:** múi giờ máy `Asia/Saigon` (UTC+7). Viewport ~2048×1065 (ảnh chụp scale 1512×786). Không kiểm tra responsive (không đổi kích thước cửa sổ).
- **Bộ lọc mặc định khi tải trang:** Vai trò BOD · Chu kỳ "Theo Tuần" · Từ 01/06/2026 → Đến 30/09/2026 · Tất cả Khu vực · Tất cả Chi nhánh.
- **Quy ước mức độ:** High = sai số liệu/nghiệp vụ hoặc chức năng không chạy; Medium = gây hiểu sai/UX đáng kể; Low = thẩm mỹ, nhãn.
- Ghi chú: mọi thay đổi dữ liệu thử (Traffic, KPI) chỉ tồn tại trong bộ nhớ trình duyệt; đã khôi phục giá trị Traffic và F5 trang, không có gì được lưu (localStorage rỗng).

---

## 0. Tóm tắt phát hiện quan trọng nhất

| # | Phát hiện | Mức |
|---|---|---|
| 1 | **9 thẻ tài chính không phản ứng với bộ lọc Khu vực/Chi nhánh toàn cục** (GMV vẫn 4,22 Tỷ khi chọn Miền Bắc), trong khi các biểu đồ bên dưới đổi theo (GMV Miền Bắc = 1.476 Tr). Thẻ chỉ phản ứng với khoảng ngày. | High |
| 2 | **Ba con số "Doanh thu thuần/Thực thu" khác nhau cùng một bộ lọc**: Thẻ DTT 3,70 Tỷ (= 3.695 Tr, 87,6% GMV) · Waterfall "Thực thu" 4.005 Tr (95,0% GMV) · Bảng xếp hạng "Doanh thu" tổng 3.876 Tr (91,9%). Tooltip thẻ DTT ghi "GMV + Điều chỉnh GMV" = 4.216 − 211 = 4.005 ≠ 3.695. | High |
| 3 | **"So với kỳ trước" mâu thuẫn**: thẻ GMV ↑21,7% nhưng widget Phân tích Tăng trưởng "Tăng trưởng chung" GMV −1,4% (Tuần), −1,2% (Ngày), −2,1% (Tháng), +16,1% (Quý), +13,7% (Năm) cho **cùng một khoảng ngày**. | High |
| 4 | **AOV có 3 định nghĩa/3 giá trị**: thẻ 0,7 Tr (= DTT/đơn ≈ 713k) · widget Hiệu quả đơn hàng 813.773 ₫ (= GMV/đơn) · Tăng trưởng (AOV) "TB Kỳ này 814.904 ₫" (trung bình đơn giản theo tuần). | High |
| 5 | **Quy mô số liệu giữa các trang không khớp nhau**: Tổng quan GMV 4 tháng = 4,22 Tỷ; nhưng Vận hành: Nhân khẩu học (Value) = 67,8 Tỷ, Chiến dịch "Back to School" = 15,2 Tỷ/4.200 đơn; Sản phẩm: Đa chiều tổng 45,2 Tỷ, "Nước rửa kính" bán 15.037 chai (> 5.181 đơn); Nhân sự: 5 PIC Sales cộng 5,55 Tỷ; Heatmap: 1 chi nhánh ~100–434 Tr/ngày; Tồn đọng Mài lắp 3.905 Tr. Phân khúc hóa đơn 55% đơn > 5 Tr trong khi AOV ≈ 0,7–0,8 Tr. | High |
| 6 | **Bộ lọc đa chiều + "Áp dụng bộ lọc" không làm đổi bất kỳ số nào** trên mọi trang; không có chỉ báo bộ lọc đang bật; dropdown PIC Sales / KTV rỗng (chỉ có "Tất cả"). | High |
| 7 | **Trang Vận hành, Nhân sự, phần lớn Sản phẩm, Heatmap không phản ứng với bộ lọc toàn cục** (ngày/chu kỳ/khu vực); Heatmap luôn hiển thị 1/7–31/7 cho 80 chi nhánh (danh mục khác hẳn 5 chi nhánh ở bộ lọc). | High |
| 8 | **Dữ liệu ngẫu nhiên**: Time Peak, Anomaly, Product Growth (Ngành hàng) đổi số mỗi lần chuyển tab; Benchmark đổi số sau F5 (HCM Doanh thu 83 → 99). | High |
| 9 | **Vai trò MANAGER thấy dữ liệu y hệt BOD** (trang Vận hành/Nhân sự giống từng dòng), dù header hiển thị chip cửa hàng "HMK ĐN LÊ DUẨN 2"; MANAGER vẫn mở được wizard KPI và chọn phạm vi "Toàn công ty". | High |
| 10 | **Module KPI phần lớn không hoạt động**: tìm kiếm, phân trang, sửa/xóa/menu "…", nút lọc, lưu bulk-edit, xóa hàng loạt đều không làm thay đổi bảng; Lưu KPI mới báo "Đã lưu KPI" nhưng bảng không thêm dòng; không validate (Doanh thu −5, CĐ 150% được chấp nhận). Phát hiện trùng lặp có hoạt động nhưng bị bỏ qua khi giữ giá trị dropdown mặc định. | High |
| 11 | Mục tiêu Run-rate **không co theo Khu vực/Chi nhánh** (Miền Bắc: 1.476 / 5.082 → "chậm −71%"; CN1: −79,3%). | High |
| 12 | Ngày không hợp lệ (Từ > Đến hoặc xóa trống) → hiển thị "NaN" ở nhiều nơi; không có validate. Chân thẻ luôn "01/09 — 30/09/2026" bất kể khoảng ngày. | Medium |

---

## 1. Khung ứng dụng, Điều hướng & Phân quyền

### 1.1. Header & Thanh lọc

| Thành phần | Mô tả quan sát | Tương tác | Quan sát/Vấn đề |
|---|---|---|---|
| Logo "EBID Workspace" + "Eyewear Business Intelligence Dashboard" | Góc trái | Không | — |
| "Đồng bộ: HH:MM:SS" | Giờ đồng bộ gần nhất | Cập nhật khi bấm nút ⟳ ở cuối thanh lọc (14:55:49 → 15:04:16) | Bấm đồng bộ không làm đổi bất kỳ số liệu nào |
| "Quyền truy cập" (select) | Ban Giám Đốc (Toàn hệ thống)=BOD · Quản lý (Cửa hàng)=MANAGER · Nhân viên (Cá nhân)=STAFF | Đổi vai trò tức thì, không cần reload | Đây là role switcher dạng demo, ai cũng đổi được |
| "Cấu hình KPI" | Chỉ hiện với BOD | Mở wizard "Cấu hình Mục tiêu & KPI" | MANAGER không có nút này nhưng vẫn mở được wizard qua "Thêm KPI mới" |
| Chuông (badge 3) | — | Bấm không có gì xảy ra | Low |
| "Admin / admin@hmkeyewear.com" | Avatar | Bấm không có menu | Không đổi theo vai trò (STAFF vẫn hiện "Admin") – Low |
| Chu kỳ (select) | Theo Ngày / Tuần (mặc định) / Tháng / Quý / Năm | Đổi gom nhóm trục thời gian ở các biểu đồ Tổng quan & Product Growth | Không ảnh hưởng thẻ KPI (đúng), Vận hành, Nhân sự, Heatmap |
| Từ ngày – Đến ngày | `input type=date` (hiển thị mm/dd/yyyy theo locale trình duyệt) 06/01/2026 – 09/30/2026 | Đổi thẻ KPI + biểu đồ Tổng quan + Product Growth | Không có min/max, không chặn Từ > Đến → NaN |
| Khu vực (BOD) | Tất cả / Miền Bắc / Miền Trung / Miền Nam | Lan xuống tất cả Local Filter của Tổng quan | Không áp vào 9 thẻ |
| Chi nhánh (BOD) | Tất cả + HMK HN Chi nhánh 1, HMK HN Chi nhánh 5 (Bắc), HMK ĐN Chi nhánh 2 (Trung), HMK BD Chi nhánh 3, HMK Chi nhánh 4 (Nam) | Lọc theo Khu vực đang chọn (cascade); đổi Khu vực → reset Chi nhánh về "Tất cả" | Chọn chi nhánh khi Khu vực = Tất cả thì Khu vực không tự cập nhật |
| Chip thay thế | MANAGER: "HMK ĐN LÊ DUẨN 2"; STAFF: "PIC: Nguyễn Văn A" | Bấm không có gì | Tên cửa hàng "HMK ĐN LÊ DUẨN 2" không có trong danh sách 5 chi nhánh (chỉ xuất hiện ở biểu đồ Tỷ lệ chuyển đổi) |
| "Bộ lọc đa chiều" | Mở panel 4 nhóm: Ngành hàng & SP (Ngành hàng: Tròng kính/Gọng kính/Kính mát; Thương hiệu: HMK Eyewear/Essilor/Chemi), Khách hàng (Giới tính Nam/Nữ; Phân khúc HĐ <5 / 5–10 / >10 Tr), Nhân sự PIC (PIC Sales, KTV Khúc xạ/Mài lắp – **chỉ có "Tất cả"**), Trạng thái (Đã hoàn thành/Đang đo mắt/Đang mài lắp/Đang vận chuyển) + nút "Áp dụng bộ lọc" | Không có số nào thay đổi ở bất kỳ trang nào; không có badge "đang lọc"; panel không tự đóng | Có cả ở vai trò STAFF |
| Thanh lọc khi cuộn | Header cuộn đi, thanh lọc dính (sticky) ở đỉnh | — | Không thấy chồng lấn header/thanh lọc |

### 1.2. Ma trận menu theo vai trò (quan sát)

| Tab | BOD | MANAGER | STAFF |
|---|---|---|---|
| Tổng quan | ✔ | ✘ | ✘ |
| Vận hành & Khách hàng | ✔ | ✔ | ✘ |
| Sản phẩm & Tồn kho | ✔ | ✔ | ✘ |
| Hiệu suất Nhân sự | ✔ (bảng xếp hạng toàn đội) | ✔ (giống BOD) | ✔ (giao diện cá nhân) |
| Quản lý KPI | ✔ | ✔ | ✘ |
| Nút "Cấu hình KPI" ở header | ✔ | ✘ | ✘ |
| Bộ lọc KV/CN | Select | Chip cửa hàng | Chip PIC |

**Hành vi khi đổi vai trò:**
- Nếu tab hiện tại vẫn được phép → giữ nguyên tab (BOD@Sản phẩm → MANAGER vẫn ở Sản phẩm; STAFF@Nhân sự → BOD vẫn ở Nhân sự).
- Nếu không được phép → chuyển về tab đầu tiên được phép (BOD@Tổng quan → MANAGER: Vận hành; → STAFF: Hiệu suất Nhân sự).
- F5 → về BOD, Tổng quan, bộ lọc mặc định (không lưu trạng thái).

### 1.3. Bộ lọc toàn cục vs Local Filter (Tổng quan)
- 7 widget có cặp Local Filter (KV + CN): Tương quan GMV vs DTT, Waterfall, Hiệu quả đơn hàng, Phân rã nguồn GMV, Xu hướng lũy kế, Bảng xếp hạng, Phân tích tăng trưởng.
- Đổi KV/CN toàn cục → **ghi đè** tất cả Local Filter về cùng giá trị (kiểm tra: cả 7 cặp select chuyển sang "Miền Bắc").
- Đổi Local Filter của 1 widget (vd. Tương quan → Miền Trung) → **chỉ widget đó đổi**, global và các widget khác giữ nguyên.
- Heatmap có bộ lọc riêng (Tất cả chi nhánh / Hồ Chí Minh / Miền Bắc / Miền Trung / Đông Nam Bộ) – không liên quan bộ lọc toàn cục.

### 1.4. Acceptance criteria (khung)
- **AC-F1** Given BOD ở Tổng quan, When chọn vai trò MANAGER, Then tab Tổng quan biến mất và màn hình chuyển sang "Vận hành & Khách hàng"; nút "Cấu hình KPI" ẩn; bộ lọc KV/CN được thay bằng chip cửa hàng.
- **AC-F2** Given vai trò STAFF, Then chỉ có tab "Hiệu suất Nhân sự" (giao diện cá nhân) và chip "PIC: <tên>".
- **AC-F3** Given đang ở tab được phép của vai trò mới, When đổi vai trò, Then giữ nguyên tab.
- **AC-F4** Given Khu vực = Miền Nam, Then dropdown Chi nhánh chỉ còn "Tất cả, HMK BD Chi nhánh 3, HMK Chi nhánh 4"; When đổi Khu vực, Then Chi nhánh reset "Tất cả Chi nhánh".
- **AC-F5** Given đổi KV toàn cục, Then mọi Local Filter của Tổng quan nhận cùng giá trị; When đổi Local Filter 1 widget, Then chỉ widget đó cập nhật.
- **AC-F6 (đề xuất, hiện FAIL)** When Từ ngày > Đến ngày hoặc ô ngày trống, Then hiển thị thông báo lỗi và không tính toán (hiện tại hiện NaN).
- **AC-F7 (đề xuất, hiện FAIL)** When Áp dụng Bộ lọc đa chiều, Then mọi widget lọc theo tiêu chí và hiển thị badge số bộ lọc đang bật.

---

## 2. Tổng quan (Executive View) — chỉ BOD

### 2.1. Bảng widget (theo thứ tự hiển thị)

| Widget | Loại biểu đồ | Chỉ số | Định dạng | Tương tác | Quan sát |
|---|---|---|---|---|---|
| **GMV (SỨC BÁN)** | Thẻ KPI + sparkline dạng bậc thang | 4,22 Tỷ VNĐ; "Trước VAT: 3,90T \| VAT: 0,31T"; ↑21,7% so với kỳ trước (xanh) | Tỷ, dấu phẩy thập phân | (i) tooltip: "Tổng sức bán phát sinh trong kỳ. Công thức: Giá trị Đơn Đặt + Giá trị Đơn mua thẳng (không qua Đơn Đặt)" | Tooltip (i) bật khi hover **bất kỳ đâu trên thẻ**, không chỉ icon; sparkline không có tooltip; click thẻ không có hành động; footer "01/09 — 30/09/2026" cố định |
| **KHÁCH HÀNG MỚI** | Thẻ + sparkline | 1554 Khách; "Bình quân 4-5 khách/ngày"; ↑21,2% | Số nguyên, không dấu phân cách nghìn ("1554" vs "5.181" ở thẻ Volume) | (i): "Số lượng khách hàng lần đầu mua sắm tại hệ thống trong kỳ." | "4-5 khách/ngày" tĩnh; thực tế 1554/122 ngày = 12,7/ngày. KH mới luôn = 30% số đơn (1554 = 0,3×5181; T7: 345 = 0,3×1150) |
| **DOANH THU** | Thẻ + sparkline | 4,43 Tỷ VNĐ; "Dòng tiền thực thu (Trước điều chỉnh)"; ↑21,7% | Tỷ | (i): "Doanh thu dựa trên dòng tiền thực tế (Cash-basis) trước khi trừ các khoản hoàn/hủy." | = GMV × 1,05 ở mọi khoảng ngày thử (4,216→4,43; T7 0,93→0,98). Doanh thu > GMV |
| **GIÁ TRỊ ĐIỀU CHỈNH** | Thẻ + sparkline (đỏ) | −211 Tr VNĐ; "Gồm Upsale & Hoàn/Hủy cọc"; ↓15,4% (đỏ) | Tr | (i): "Bao gồm tổng giá trị chênh lệch do thay đổi từ Đơn Đặt -> Đơn hàng (mua thêm/bỏ bớt) và các khoản hoàn/hủy trong kỳ." | = −5% GMV; % tăng trưởng **luôn 15,4%** ở mọi khoảng ngày (T6–T9, T9, T7) |
| **DOANH THU THUẦN** | Thẻ + sparkline | 3,70 Tỷ VNĐ; "Net Revenue (Dòng tiền ròng)"; ↑21,6% | Tỷ | (i): "Dòng tiền thực tế đã thu về (Net Revenue) sau khi cấn trừ tất cả các khoản hoàn/hủy. Công thức: GMV + Điều chỉnh GMV" | 3,70 ≠ 4,22 − 0,211 = 4,005 (trái với công thức chính nó hiển thị) |
| **NỢ TREO** | Thẻ + sparkline (cam) | 63 Tr VNĐ; "Chiếm 1,5% GMV"; **↓20,9% màu đỏ** | Tr | (i): "Tổng công nợ tạm thời chưa thu về két (chủ yếu từ đơn đặt cọc cắt kính chờ lấy hoặc khách hẹn chuyển khoản sau). Công thức: Tổng dư nợ dương trên sổ cái khách hàng" | Mũi tên xuống + đỏ: không rõ là "giảm" hay "tăng (xấu)"; các chỉ số khác đều tăng ~21% nên nhiều khả năng nợ tăng nhưng mũi tên chỉ xuống |
| **BIÊN LỢI NHUẬN GỘP** | Thẻ + sparkline | 72,7 %; "Tỷ lệ lợi nhuận trên doanh số gộp"; ↑0,1% | % | (i): "Tỷ lệ lợi nhuận giữ lại được sau khi trừ đi chi phí cấu thành sản phẩm (Giá vốn hàng bán)… Công thức: ((Doanh thu thuần - Giá vốn) / Doanh thu thuần) * 100" | Phụ đề "trên doanh số gộp" mâu thuẫn công thức "trên Doanh thu thuần" |
| **ĐƠN HÀNG (VOLUME)** | Thẻ + sparkline | 5.181 Đơn; "Đã hoàn thành"; ↑21,2% | dấu chấm nghìn | (i): "Tổng số lượng đơn hàng đã được tạo và xử lý thành công trong kỳ… Công thức: Tổng Đơn Đặt + Đơn mua thẳng" | Phụ đề "Đã hoàn thành" vs định nghĩa "đã tạo và xử lý" |
| **GIÁ TRỊ ĐƠN TB (AOV)** | Thẻ + sparkline | 0,7 Triệu/Đơn; "Trước VAT: 0,66Tr \| VAT: 0,05Tr"; ↑0,3% | 1 chữ số thập phân | (i): "Số tiền trung bình… Công thức: Doanh thu thuần / Tổng số đơn hàng" | Làm tròn 0,7 quá thô; = 3.695/5.181 = 713k |
| **Tương quan: GMV vs Doanh thu thuần** | Combo: cột GMV (xanh nhạt) + đường DTT (tím); nhãn % trên cột | Theo tuần (18 tuần); % chênh lệch −11,4% → −13,5% | Trục "Tr" | Local KV/CN; tooltip: "Tuần 10 (03-08): GMV 295 Tr, DTT 258 Tr, Chênh lệch 37 Tr, −12,6%"; (i): "Theo dõi độ trễ giữa Sức chốt sale và Thực thu tiền. Công thức: Thực thu = GMV - Hoàn/Hủy - Rớt đơn" | Tuần 18 chỉ 3 ngày (28–30/09) → cột tụt mạnh, dễ hiểu nhầm; trục Y không bắt đầu từ 0 khi Local = Miền Trung (10–110 Tr), chế độ Quý (600–1.500 Tr), Năm (3.200–4.800 Tr); tick bất thường (0/25/50/75/90 khi chọn CN1). Nhãn trục X chỉ hiện mỗi 3 tuần |
| **Thác nước Doanh thu (Waterfall)** | Waterfall 3 cột: Tổng GMV (xanh nhạt) → Hoàn/Hủy (đỏ, lơ lửng) → Thực thu (xanh lá) | 4.216 → −211 → 4.005 Tr ("Bằng 95,0% so với GMV") | Tr | Local KV/CN; tooltip từng cột; (i): "Phân tích các khoản giảm trừ… Công thức: Thực thu = GMV - Hoàn/Hủy" | Nhãn trục Y bị cắt ("000Tr", "500Tr"), nhãn trục X xoay bị cắt ("ổng GMV", "loàn/Hủy"); Thực thu luôn = 95,0% GMV ở mọi KV/CN (Miền Bắc 1.476→1.402; CN1 1.054→1.001); trục tới 6.000 Tr dư nhiều |
| **Hiệu quả đơn hàng: AOV - Volume - SL sản phẩm/đơn** | 3 thẻ tóm tắt + 3 chế độ: (a) "Phóng to trục Y (Chuẩn)": 3 biểu đồ – AOV area zoom (750k–910k, đường TB 814k), Volume cột gốc 0 (TB 288; cột đậm = trên TB), UPT line zoom (2,16–2,56); (b) "Biểu đồ kết hợp (Combo)": cột Volume + đường AOV + đường đứt UPT, nút "Đường hiển thị: Cả 2 / Chỉ AOV / Chỉ UPT"; (c) "Độ lệch % so với TB": cột phân kỳ với tab % Lệch AOV (Chuẩn 814k) / UPT (2,35 SP) / Volume (288 đơn) | AOV 813.773 ₫ (Biến thiên ±11,5%, 785k~875k); Volume 288 đơn/kỳ (Tổng 5.181; GMV đóng góp 4.216 Triệu); UPT 2,35 SP/đơn (Chênh lệch 0,16; 2,28~2,44) | ₫ đầy đủ, "k", dấu chấm thập phân (2.35) | Local KV/CN; icon tài liệu → modal "Dữ liệu chi tiết"; tooltip AOV "Tuần 4 (22-06): 875.117 ₫, lệch +7,5%, GMV 213 Tr, 243 đơn"; tooltip Volume "Tuần 10: 373 đơn, +29,5%, GMV 295 Tr, AOV 791.943 ₫"; (i) **rỗng** | Nhãn trục X xoay chồng lên nhau (Tuần), thành vệt đen ở chế độ Ngày; Combo "Cả 2": UPT vẽ trên trục AOV → phẳng sát 0; Combo trục trái "380 đơn" xuống dòng; chế độ Độ lệch Volume: cột không xuất phát từ 0 (Tuần 4 −15,6% vẽ thành cột ngắn từ ~−10% đến −15%); "Nhận xét trực quan" là đoạn text tĩnh |
| **Phân rã Nguồn hình thành GMV** | Cột chồng (Đơn lắp sẵn – xanh dương; Đơn đặt trước – cam) + đường Tổng GMV; nhãn % trong cột | ~37–39% lắp sẵn / 61–63% đặt trước | Tr, % làm tròn | Local KV/CN; tooltip "Tuần 10: Lắp sẵn 109 Tr (36,9%), Đặt trước 186 Tr (63,1%), Tổng 295 Tr"; (i): "Tỷ trọng đóng góp giữa Đơn lắp sẵn (nhận ngay) và Đơn đặt trước (chờ sản xuất). Công thức: GMV Đặt trước = Các đơn hàng có cọc, chờ sản xuất/lắp ráp" | Tỷ trọng giống hệt nhau ở mọi KV/CN (chỉ quy mô đổi); tick trục 0/90/180/270/350 không đều; chế độ Ngày nhãn % chồng chéo |
| **Xu hướng Lũy kế & Tiến độ Kế hoạch (Run-rate Tracking)** | Chế độ "Tiến độ Kế hoạch (Chuẩn)": 3 thẻ + 3 mini area chart (thực tế vs đường Paced đứt) hoặc 1 biểu đồ lớn khi chọn 1 chỉ số; Chế độ "Combo": cột phát sinh kỳ + đường lũy kế + đường kế hoạch (2 trục) | GMV 4.216 Tr / Mục tiêu 5.082 Tr ("Đạt 83% Target", "−17% so với chuẩn"); DTT 3.695 Tr (87,6% GMV; "Đạt 87% Target (4.235 Tr)", −12.7%); Nợ treo 63,4 Tr (1,5% GMV "An toàn"; Trần 76,2 Tr; "Dưới ngưỡng trần −12,8 Tr"); pill đỏ "GMV đang chậm tiến độ −17%" | Tr, lẫn "−12.7%" (chấm) và "87,6%" (phẩy) | Tab "Chỉ số": Đồng bộ cả 3 / Sức bán GMV / Doanh thu thuần / Công nợ; icon ⤢ trên mini chart = chuyển sang chỉ số đó; nút "← Quay lại xem đồng bộ cả 3"; tooltip đồng bộ 3 mini chart ("Tuần 10: GMV LK 2.192 vs KH 2.823 (−22,4%), kỳ này 295; DTT 1.921 vs 2.353 (−18,4%), 258; Nợ 32,80 vs 42,35 (−22,6%), 4,09"); modal chi tiết; vào Combo thì ẩn "Đồng bộ cả 3" và tự chọn "Sức bán GMV"; (i) **rỗng** | Mục tiêu không co theo KV/CN (xem Kiểm tra số liệu); đường Paced chia đều 282,3 Tr/tuần kể cả tuần 18 chỉ 3 ngày |
| **Bảng xếp hạng Hiệu suất** | Bảng | #, Tên Chi nhánh, GMV, Tỷ trọng GMV, Doanh thu, Tỷ trọng Doanh thu, Tỷ lệ trả hàng; dòng "Tổng Hệ Thống" | Tr, % 1 chữ số | Local KV/CN; toggle "Theo Khu vực / Theo Chi nhánh" (ẩn khi Local KV ≠ Tất cả); tiêu đề cột **không sort**; ô "14,0%" (BD CN3) tô đỏ | Xem số liệu chi tiết bên dưới |
| **Bản đồ hiệu suất chi nhánh** | Heatmap bảng (hàng = chi nhánh/khu vực, cột = ngày) | % Target / Doanh thu (M) / Traffic / Tỷ lệ CĐ | %, "100M" (M thay vì Tr), CR có 1 chữ số thập phân với dấu chấm | Toggle Chi nhánh/Khu vực; select (Tất cả chi nhánh/Hồ Chí Minh/Miền Bắc/Miền Trung/Đông Nam Bộ – lọc còn 20 chi nhánh); Ngày/Tuần/Tháng; tab chỉ số; "Nhập Traffic" (modal); tooltip ô: "HMK Chi nhánh 1 – Kỳ 1/7: Doanh thu 100M, Chỉ tiêu 400M, Đạt 25,0%, Quy tắc màu <60% Đỏ (Đỏ rất đậm); Tỉ lệ chuyển đổi 20,0% (24/120), quy tắc <50% Đỏ (Đỏ đậm); Lưu lượng 120 lượt; Số đơn hoàn tất 24"; chú thích màu đổi theo chỉ số (% Target & Doanh thu: <60/60–80/>80; CR: <50/50–75/>75; Traffic: sắc độ) | 80 chi nhánh "HMK Chi nhánh 1…80" + 4 vùng khác bộ lọc chính; luôn 1/7–31/7; bảng cuộn nội bộ; "Tỉ lệ" vs "Tỷ lệ" |
| **Phân tích Tăng trưởng (Growth Rate Analysis)** | Combo: cột tăng trưởng % (xanh dương/đỏ âm, trục phải) + đường Kỳ này + đường đứt Kỳ trước (trục trái) | Tab GMV/Doanh thu/AOV/Volume/Số lượng SP/đơn; "Tổng Kỳ này: 4.216 Tr \| Tăng trưởng chung: −1,4%" | Tr; % dấu chấm | Local KV/CN; tooltip "Tuần 2 (08-06): Kỳ này 200 Tr, Kỳ trước 184 Tr, Chênh lệch +16 Tr, +8,9%"; modal "Dữ liệu chi tiết: Tăng trưởng Sức bán GMV"; dòng chú thích "Tăng trưởng cao nhất +16.9%, thấp nhất −17.5%"; (i) **rỗng** | Tab "Doanh thu" thực chất = DTT (3.695); tab AOV hiển thị "TB Kỳ này: 814.904 đ \| −0,9%"; Volume 5.181 \| −1,9%; tab AOV/UPT tooltip "Tuần 4: 875.117 vs 727.270 (+20,3%)" |

### 2.2. Modal "Dữ liệu chi tiết" (dùng chung)
- Mở bằng icon tài liệu (Hiệu quả đơn hàng, Xu hướng lũy kế, Tăng trưởng). Có ô "Tìm kiếm dữ liệu…" (lọc chuỗi con: "Tuần 1" → Tuần 1, 10–18), header cột bấm được để sort tăng/giảm, trạng thái rỗng "Không có dữ liệu".
- Đóng chỉ bằng nút X; **Esc và click nền không đóng**.
- Đóng rồi mở lại: **giữ nguyên** từ khóa và thứ tự sort.
- Không có xuất Excel/CSV.

### 2.3. Kiểm tra số liệu (Tổng quan, bộ lọc mặc định trừ khi ghi chú)

| Kiểm tra | Số thấy trên UI | Kết quả |
|---|---|---|
| GMV = Trước VAT + VAT | 3,90 + 0,31 = 4,21 ≈ 4,22 | OK (VAT ≈ 7,9%) |
| AOV thẻ ≈ DTT/Volume | 3.695/5.181 = 713k → "0,7 Tr"; 0,66 + 0,05 = 0,71 | OK nhưng làm tròn thô |
| AOV widget ≈ GMV/Volume | 4.216/5.181 = 813,7k = "813.773 ₫" | OK nhưng **khác định nghĩa thẻ** |
| Nợ treo % GMV | 63/4.216 = 1,49% → "1,5%" | OK |
| DTT = GMV + Điều chỉnh (theo tooltip) | 4.216 − 211 = 4.005 ≠ 3.695 | **SAI** |
| Waterfall đầu/cuối vs thẻ | Đầu 4.216 = GMV ✔; cuối 4.005 ≠ DTT 3.695 | **SAI** (lệch 310 Tr) |
| Bảng xếp hạng tổng | GMV 4.216 = thẻ ✔; "Doanh thu" 3.876 ≠ 3.695 ≠ 4.005 ≠ 4,43 Tỷ (thẻ "Doanh thu") | **SAI/không nhất quán nhãn** |
| Bảng xếp hạng: Doanh thu = GMV × (1 − tỷ lệ trả) | CN2: 1.265×0,935 = 1.183 ✔; CN1: 1.054×0,95 = 1.001 ✔; tổng trả hàng (4.216−3.876)/4.216 = 8,06% → "8,1%" ✔ | Nhất quán nội bộ |
| Tỷ trọng cộng 100% | GMV: 30+25+20+15+10 = 100 ✔; DT: 30,5+25,8+18,7+15,3+9,7 = 100 ✔ | OK. Tỷ trọng GMV tròn đúng 30/25/20/15/10 → dữ liệu phân bổ theo hệ số cố định |
| Xếp hạng giảm dần | 1.265 > 1.054 > 843 > 632 > 422 | OK |
| Theo Khu vực | Nam 1.476 (35%) = 843+632 ✔; Bắc 1.476 (35%) = 1.054+422 ✔; Trung 1.265 (30%) ✔ | OK; Nam và Bắc hòa, Nam xếp #1. DT Miền Nam: 1.318 (Theo KV) vs 1.316 (Local = Miền Nam) – lệch 2 Tr do làm tròn |
| Modal Hiệu quả đơn hàng | Σ Volume 5.181 ✔; Σ GMV 4.215 ≈ 4.216 ✔; Σ SP 12.179/5.181 = 2,351 ✔; Tuần 1: 191 Tr/233 = 819.789 ✔ | OK. "TB 814k" trên biểu đồ là trung bình đơn giản (814.904) ≠ 813.773 (bình quân gia quyền) |
| Lũy kế đơn điệu tăng | Modal Run-rate 18 dòng: GMV LK, DTT LK, Nợ LK tăng dần; Σ GMV kỳ = 4.215 = LK cuối 4.216 ✔; Σ DTT 3.696 ✔ | OK |
| Run-rate % | 4.216/5.082 = 83,0% ✔; 3.695/4.235 = 87,2% ✔; 63,4 − 76,2 = −12,8 ✔; Tuần 10: 2.192/2.823 − 1 = −22,35% ✔ | OK |
| Paced target | Tuần 1: 282 Tr; Tuần 2: 565 Tr; … Tuần 18: 5.082 → +282,3/tuần đều nhau, kể cả tuần 18 (3 ngày) | Cảnh báo: tuần lẻ được cộng đủ mục tiêu cả tuần |
| Mục tiêu theo KV | Miền Bắc: GMV 1.476 / Mục tiêu **5.082** → "Đạt 29%, −71%"; DTT 1.293 / 4.235 (31%); Nợ 22,2 Tr; CN1: 1.054/5.082 → −79,3%, DTT 924 | **SAI** – mục tiêu không co theo phạm vi |
| Mục tiêu theo ngày | 01–30/09: GMV 1.122 / Mục tiêu 1.218 (Đạt 92%, −7,8%), DTT 87,9% GMV | Co theo khoảng ngày (OK) |
| Combo GMV vs DTT | Tuần 10: 295 − 258 = 37; 37/295 = 12,5% ≈ "−12,6%" | OK; DTT/GMV theo tuần 0,859–0,887 |
| Phân rã nguồn | 109 + 186 = 295 = GMV tuần 10 ✔ (khớp combo) | OK |
| Tăng trưởng chung | Modal: Σ kỳ này 4.215, Σ kỳ trước 4.277 → −1,45% = "−1,4%" ✔ | Nhất quán nội bộ, nhưng mâu thuẫn thẻ (+21,7% ⇒ kỳ trước ≈ 3.464) |
| Tăng trưởng chung theo chu kỳ (cùng 01/06–30/09) | Ngày −1,2% · Tuần −1,4% · Tháng −2,1% · Quý +16,1% · Năm +13,7% | **SAI** – tổng kỳ giống nhau phải cho cùng % |
| Đổi KV toàn cục = Miền Bắc | 9 thẻ: không đổi (GMV 4,22). Combo trục 0–140 Tr nhưng các nhãn % **giống hệt** toàn hệ thống; Waterfall 1.476→1.402; Hiệu quả: AOV 812.586, 1.816 đơn (101/kỳ), GMV 1.476; Phân rã: % giống hệt; Bảng xếp hạng: CN1 1.054 (71,4%), CN5 422 (28,6%), "Tổng Miền Bắc 1.476 / 1.377 / 6,7%"; Tăng trưởng: 1.476 Tr, −1,4% (giống hệt); Heatmap không đổi | Dữ liệu khu vực = dữ liệu tổng × hệ số (35%) |
| Đổi chi nhánh = HMK HN CN1 | Thẻ không đổi; Waterfall 1.001 (95%); Hiệu quả AOV 805.841, 1.308 đơn (73/kỳ), GMV 1.054; Bảng xếp hạng 1 dòng 100% "Tổng Miền Bắc"; chọn CN2 khi KV = Tất cả → dòng tổng "Tổng Hệ Thống" | Nhãn tổng không phản ánh phạm vi |
| Đổi ngày 01/09–30/09 | GMV 1,12 Tỷ ↑10,0%; KH mới 410 ↑11,8%; DT 1,18; ĐC −56 (↓15,4%); DTT 0,99 ↑9,4%; Nợ 17 Tr (5,8%); GM 72,8% ↑0,4%; AOV 0,7 (0,67+0,05) ↑2,6%; Waterfall 1.066; Hiệu quả AOV 821.707, 1.366 đơn, 1.122 Tr; Tăng trưởng 1.122 Tr, −5,2% | Thẻ & biểu đồ đổi theo ngày ✔; footer thẻ vẫn "01/09 — 30/09/2026" |
| Đổi ngày 01/07–31/07 | GMV 0,93 ↑4,4%; KH mới 345 ↑6,8%; DTT 0,81 ↑3,7%; Volume 1.150 ↑6,8%; AOV 0,7 ↑2,9%; DT 0,98; ĐC −47 (15,4%); Nợ 14 (5,4%); GM 72,5% | Footer vẫn "01/09 — 30/09/2026" → **hardcode** |
| Chu kỳ Quý | Hai cột "Quý 2" (856 Tr – chỉ tháng 6) và "Quý 3" (3.360 Tr); Tăng trưởng Q2 856 vs 753 (+13,7%), Q3 3.360 vs 2.877 (+16,8%) | Kỳ lẻ (Q2 chỉ 1 tháng) so với kỳ trước không rõ phạm vi |
| Chu kỳ Tháng 31/01–31/05/2026 | Trục hiện "Tháng 1, Tháng 3, Tháng 4, Tháng 5" | **Thiếu Tháng 2** |

### 2.4. Vấn đề phát hiện (Tổng quan)

| # | Vấn đề | Mức |
|---|---|---|
| E1 | 9 thẻ KPI bỏ qua KV/CN toàn cục | High |
| E2 | DTT thẻ (3.695) ≠ Waterfall Thực thu (4.005) ≠ Bảng xếp hạng Doanh thu (3.876); công thức tooltip DTT không khớp số | High |
| E3 | "Doanh thu" có 3 nghĩa: thẻ Doanh thu 4,43 Tỷ (gross, > GMV), cột "Doanh thu" bảng xếp hạng 3.876, tab "Doanh thu" của Tăng trưởng = DTT 3.695 | High |
| E4 | Tăng trưởng thẻ (+21,7%) vs Tăng trưởng chung (−1,4%); % thay đổi theo độ chi tiết chu kỳ | High |
| E5 | AOV 3 giá trị (0,7 Tr / 813.773 / 814.904) | High |
| E6 | Mục tiêu Run-rate không co theo KV/CN; paced cộng đủ tuần cho tuần lẻ | High |
| E7 | Thiếu "Tháng 2" khi Từ ngày = 31/01 | Medium |
| E8 | Footer thẻ hardcode "01/09 — 30/09/2026" | Medium |
| E9 | Tăng trưởng của "Giá trị điều chỉnh" luôn 15,4%; "Bình quân 4-5 khách/ngày" tĩnh; KH mới = 30% số đơn | Medium |
| E10 | Mũi tên + màu thẻ Nợ treo/Điều chỉnh mơ hồ (↓ đỏ) | Medium |
| E11 | NaN khi ngày không hợp lệ (xem §7) | Medium |
| E12 | Waterfall: nhãn trục bị cắt; trục 6.000 dư | Medium |
| E13 | Combo "Cả 2": UPT phẳng ở 0 (vẽ trên trục AOV) | Medium |
| E14 | Độ lệch % Volume: cột không xuất phát từ 0 → độ dài cột sai | Medium |
| E15 | Trục Y không từ 0 cho biểu đồ cột (Local Miền Trung, Quý, Năm) → phóng đại chênh lệch | Medium |
| E16 | Tuần/kỳ cuối không đủ ngày vẫn so sánh như kỳ đủ (tụt −13,5%, −16,2%) | Medium |
| E17 | Heatmap: danh mục 80 chi nhánh/4 vùng khác bộ lọc chính, cố định tháng 7, bỏ qua mọi bộ lọc; chế độ Tuần/Tháng **không gộp** mà lấy N giá trị ngày đầu (Tuần 1 = 25% = ngày 1/7; Tháng 1..7 = 7 ngày đầu); quy mô 100–434 M/ngày/chi nhánh không khớp GMV hệ thống | High |
| E18 | Nhập Traffic: không validate (−10 → CR −240%; để trống → 0 → CR 0%); chỉ 12 chi nhánh × 7 ngày (84 ô) trong khi bảng có 80 × 31; mất khi F5 | Medium |
| E19 | Ngưỡng màu biên: 80% → xanh, 75,0% CR → xanh trong khi chú thích ghi "60%-80% Vàng / >80% Xanh" | Low |
| E20 | InfoTooltip (i) rỗng ở Hiệu quả đơn hàng, Xu hướng Lũy kế, Phân tích Tăng trưởng (hộp đen trống) | Low |
| E21 | Nhãn trục X chồng chéo (Tuần) và không đọc được (Ngày); nhãn % Phân rã chồng nhau ở chế độ Ngày | Medium |
| E22 | Định dạng số không thống nhất: "21,7%" vs "−12.7%", "2.35 SP", "±11.5%"; "1554" không phân cách nghìn; "Tỉ lệ" vs "Tỷ lệ"; đơn vị "T", "Tr", "Triệu", "M", "k ₫" | Low |
| E23 | Modal: Esc / click nền không đóng | Low |
| E24 | Tooltip (i) thẻ KPI bật khi hover bất kỳ đâu trên thẻ, che thẻ bên cạnh | Low |
| E25 | Bảng xếp hạng không sort được; nhãn dòng tổng sai phạm vi | Low |

### 2.5. Draft Acceptance Criteria (Tổng quan)
- **AC-E1** Given BOD, bộ lọc mặc định, Then hiển thị 9 thẻ theo thứ tự GMV, KH mới, Doanh thu, Giá trị điều chỉnh, DTT, Nợ treo, Biên LN gộp, Đơn hàng, AOV; mỗi thẻ có giá trị + đơn vị, phụ đề, % so kỳ trước có mũi tên và màu, sparkline, khoảng ngày.
- **AC-E2** When đổi Từ/Đến ngày, Then giá trị thẻ và **dòng khoảng ngày ở chân thẻ** cập nhật theo khoảng mới (hiện FAIL phần chân thẻ).
- **AC-E3 (đề xuất)** When đổi Khu vực/Chi nhánh toàn cục, Then 9 thẻ phản ánh phạm vi đó (hiện FAIL).
- **AC-E4** Given cùng bộ lọc, Then DTT trên thẻ = điểm cuối Waterfall = tổng cột DTT ở Bảng xếp hạng = điểm cuối lũy kế DTT (hiện chỉ thẻ = lũy kế).
- **AC-E5** Hover (i) → hiển thị định nghĩa + công thức; công thức phải tái tạo được số trên thẻ.
- **AC-E6** Waterfall: cột đầu = GMV thẻ; mỗi bước hiển thị tooltip giá trị có dấu; cột cuối hiển thị "% so với GMV".
- **AC-E7** Hiệu quả đơn hàng: 3 chế độ xem chuyển được; Combo có chọn Cả 2/Chỉ AOV/Chỉ UPT và UPT dùng trục riêng; icon tài liệu mở modal có tìm kiếm + sort; tổng Volume modal = "Tổng" trên thẻ.
- **AC-E8** Run-rate: Đồng bộ cả 3 hiển thị 3 thẻ + 3 mini chart có tooltip đồng bộ; chọn 1 chỉ số → 1 biểu đồ lớn + nút quay lại; Combo ẩn "Đồng bộ cả 3"; mục tiêu co theo phạm vi KV/CN và số ngày thực trong kỳ.
- **AC-E9** Bảng xếp hạng: sắp xếp giảm dần theo GMV; tỷ trọng cộng 100%; toggle Theo KV/Theo CN chỉ hiện khi Local KV = Tất cả; tỷ lệ trả hàng vượt ngưỡng (≥ ~10%?) tô đỏ.
- **AC-E10** Heatmap: chọn chỉ số đổi chú thích màu; Tuần/Tháng phải là giá trị gộp; Nhập Traffic chỉ nhận số nguyên ≥ 0 và cập nhật CR ngay.
- **AC-E11** Tăng trưởng: 5 tab chỉ số; "Tăng trưởng chung" = Σ kỳ này/Σ kỳ trước − 1 và không phụ thuộc chu kỳ gom nhóm.

---

## 3. Vận hành & Khách hàng (BOD, MANAGER)

### 3.1. Bảng widget

| Widget | Loại biểu đồ | Chỉ số | Định dạng | Tương tác | Quan sát |
|---|---|---|---|---|---|
| **Cảnh báo Tồn đọng (Order Aging)** | Thanh ngang chồng: Đo khám / Mài lắp / Vận chuyển × 1-5, 5-10, 10-20, >20 ngày | Số lượng: Đo khám 150/25/10/5; Mài lắp 850/250/50/20; Vận chuyển 250/175/80/60. Value (Tr): 450/80/35/20; 2.800/850/180/75; 750/525/240/190 | Trục 0–1200 / 0–4000Tr | Toggle Theo số lượng / Theo Value; tooltip "TỒN ĐỌNG: 1-5 ngày 850 đơn…"; icon → modal "Dữ liệu Cảnh báo Tồn đọng" (theo chế độ đang chọn, **không có đơn vị**) | Chú thích sai thứ tự (1-5, **10-20, 5-10**, >20); tooltip không nêu tên công đoạn; ổn định giữa các lần tải |
| **Thời gian Bán hàng Tối ưu (Time Peak)** | Heatmap 7 ngày × 7 khung giờ (8-10h…20-22h) | Số đơn (vd. T7 16-18h 121–132, CN 18-20h 108–134) / Doanh thu (Tr) | "16.0Tr" dấu chấm | Toggle Theo Đơn hàng / Theo Doanh thu; icon → modal 49 dòng (Ngày, Khung giờ, Doanh thu (Tr)) | **Đổi số mỗi lần mở lại tab** (Thứ 2: 51,28,74,74,21 → 53,29,55,48,13 → 39,20,53,47…); ô giá trị nhỏ để trống (thực tế 2,3–2,5 Tr có trong modal); không tooltip; phụ đề "số lượng đơn hàng" không đổi khi xem Doanh thu; DT/đơn ≈ 0,3 Tr |
| **Phân tích Nhân khẩu học Khách hàng** | Donut giới tính + cột nhóm tuổi + tháp dân số | Số lượng: Nữ 63% / Nam 37%; tuổi 40/35/15/10%; tháp HS-SV Nam 15 / Nữ 25… Value: Nữ 40,4 Tỷ; HS-SV 13,7 Tỷ; tổng ≈ 67,8 Tỷ | %, "T"/"Tỷ" | Toggle Theo số lượng (Đơn hàng) / Theo Value (Doanh thu); tooltip; modal "Dữ liệu Chân dung Khách hàng" | Tooltip nhóm tuổi hiện khóa thô **"value"**; modal hiện **Nam là số âm** (−15, −12…); tháp chế độ số lượng trục lệch (15 \| 0 \| 15 \| 30 \| 45, phía Nam không có dấu −); tổng Value 67,8 Tỷ ≫ GMV 4,22 Tỷ |
| **Phân khúc Hóa đơn (Basket Size)** | Donut | <5 Tr 45%; 5-10 Tr 30%; 10-20 Tr 15%; 20-30 Tr 7%; >30 Tr 3% (Σ 100) | % | Tooltip "PHÂN KHÚC 5 - 10 Tr: 30%"; modal | Chú thích không theo thứ tự (10-20, 20-30, 5-10, <5, >30), 2 màu tím gần giống nhau; mâu thuẫn AOV 0,7–0,8 Tr |
| **Hình thức Thanh toán** | Thanh 100% chồng ngang | CK 65%, Tiền mặt 20%, POS 10%, App/Trả góp 5% | % | Modal | Chỉ có nhãn trên 2 đoạn lớn; **không tooltip** khi hover |
| **Hiệu quả Chiến dịch (Marketing & Promotions)** | Bảng | Back to School 2026 – 15.2 Tỷ VNĐ – 4,200 đơn; Khai trương CN mới – 8.5 Tỷ – 2,100; Summer Sale – 5.4 Tỷ – 1,500; Combo Đa tròng – 4.1 Tỷ – 850 | **"4,200" dấu phẩy nghìn** (khác "5.181") | Tên chiến dịch kiểu link xanh nhưng **click không làm gì**; không sort, không modal | Tổng 33,2 Tỷ/8.650 đơn > toàn hệ thống; DT/đơn ~3,6 Tr |
| **Benchmarking Hiệu suất** | Radar 6 trục + danh sách so sánh | Doanh thu, Tỷ lệ CĐ, GTTB đơn, Lưu lượng KH, Khách quay lại, Độ hài lòng. Mặc định HCM vs TB Toàn quốc: 83 vs 75 (↗11%), 76/70 (9%), 88/72 (22%), 84/78 (8%), 97/68 (43%), 90/85 (6%) | Chỉ số index, % chênh | Toggle Khu vực/Chi nhánh (đổi mode reset lựa chọn); "Phân tích" (HCM/Bắc/Trung/ĐNB hoặc 5 CN); "So với" (TB toàn quốc/4 vùng; mode CN thêm "Trung bình Khu vực" – mặc định); mũi tên ↗ xanh/↘ đỏ | Tiêu đề "Index: 100 = Trung bình Toàn quốc" nhưng TB toàn quốc = 75/70/72… (không phải 100); radar ghi "(Chuẩn 100)" nhưng vẽ giá trị thô; cho phép so sánh với chính nó (0%); **số đổi sau F5** (HCM DT 83 → 99); khoảng trống lớn bên trái radar; select "So với" bị cắt chữ |
| **Phát hiện Bất thường (Anomaly Detection)** | Line doanh thu + MA (đứt) + dải tin cậy (vùng xám) + điểm "Bất thường" | Doanh thu/ngày 1/7–30/7 (vd. HCM 97,9 → 156,9 Tr) | Tr | Select Theo Khu vực (4 vùng) / Theo Chi nhánh (**chỉ 3 CN**: HN CN1, ĐN CN2, BD CN3); tooltip "10/7: Doanh thu 156,9 Tr, MA 120,1 Tr, Ngưỡng cảnh báo 72,8 – 167,3" | **Không có điểm bất thường nào** ở cả 7 lựa chọn (dải tin cậy giãn theo chính cú sốc 10/7 & 22/7); thiếu ngày 31/7; số đổi mỗi lần mở lại tab; quy mô 1 CN ~110–175 Tr/ngày |
| **Tỷ lệ Chuyển đổi (Conversion Rate)** | Thanh ngang | Top Cửa hàng: HMK BÌNH DƯƠNG 45,2%, Shopee-HMK Eyewear ~12,5%, HMK Q10 SVH ~38%, HMK ĐN LÊ DUẨN 2 ~42%, TikTok-HMK Eyewear 8,5%; Theo Khu vực: Bắc ~32,6%, Trung ~28,5%, Nam ~41,3%; Toàn hệ thống 35,8% | % | Select Top Cửa hàng / Theo Khu vực / Toàn Hệ thống; tooltip "PHÂN TÍCH – **rate**: 45.2%" | "Top" nhưng **không sắp xếp**; gồm kênh online (Shopee/TikTok) dù phụ đề "tại cửa hàng"; trục X tự co (Toàn hệ thống 1 thanh full chiều rộng, trục 0–36%); tên cửa hàng khác danh mục chi nhánh; dùng Bắc/Trung/Nam trong khi widget khác trên trang dùng HCM/ĐNB |
| **Tỷ lệ Hoàn tiền (Refund Rate)** | 2 cột | Theo Doanh thu 1,2%; Theo Hóa đơn 1,5% | % | Tooltip "CHỈ SỐ – **value**: 1.2%" | Mâu thuẫn "Tỷ lệ trả hàng" 8,1% ở Tổng quan; không có xu hướng/thời gian |

### 3.2. Kiểm tra số liệu (Vận hành)
- Tổng % các donut/thanh = 100 (giới tính 63+37; tuổi 40+35+15+10; basket 45+30+15+7+3; thanh toán 65+20+10+5) ✔.
- Tháp dân số khớp nhóm tuổi: HS-SV 15+25 = 40 ✔; VP 12+23 = 35 ✔; Trung niên 6+9 = 15 ✔; Lớn tuổi 4+6 = 10 ✔; Nam 37/Nữ 63 ✔.
- Value mode: Σ = 40,4 (Nữ) + 27,4 (Nam) = 67,8 Tỷ – **không khớp** quy mô GMV 4,22 Tỷ (×16).
- Tồn đọng: tổng 1.925 đơn chưa hoàn thành (190 + 1.170 + 565) so với 5.181 đơn hoàn thành/4 tháng; giá trị/đơn tồn đọng 3,0–3,3 Tr (450/150; 2.800/850) vs AOV 0,7–0,8 Tr – **không nhất quán**.
- Time Peak (Doanh thu)/(Đơn) ≈ 0,3 Tr/đơn – **không khớp** AOV.
- Chiến dịch 33,2 Tỷ > tổng GMV – **không khớp**.
- Tỷ lệ CĐ Toàn hệ thống 35,8% nằm trong khoảng các vùng (28,5–41,3%) ✔.
- **Không bộ lọc toàn cục nào tác động** (KV, ngày, chu kỳ, bộ lọc đa chiều): text và hình SVG giống hệt trước/sau.
- MANAGER vs BOD: nội dung giống từng dòng (chỉ khác thiếu tab Tổng quan).

### 3.3. Vấn đề phát hiện (Vận hành)

| # | Vấn đề | Mức |
|---|---|---|
| O1 | Toàn bộ trang bỏ qua bộ lọc toàn cục; MANAGER không bị giới hạn theo cửa hàng | High |
| O2 | Quy mô số (Nhân khẩu học Value, Chiến dịch, Tồn đọng value, Anomaly) không khớp Tổng quan | High |
| O3 | Time Peak & Anomaly random mỗi lần mount tab; Benchmark random mỗi lần tải trang | High |
| O4 | Anomaly không bao giờ đánh dấu điểm bất thường (thuật toán dải tin cậy bao luôn điểm sốc) | High |
| O5 | Benchmark: "Index 100" không đúng với số hiển thị; radar không chuẩn hóa | Medium |
| O6 | Taxonomy vùng không nhất quán trong cùng trang (HCM/Bắc/Trung/ĐNB vs Bắc/Trung/Nam); Anomaly chỉ 3/5 CN | Medium |
| O7 | Conversion "Top" không sắp xếp; trộn kênh online | Medium |
| O8 | Tooltip lộ khóa kỹ thuật "value", "rate"; modal Nhân khẩu học hiện số âm cho Nam; modal Tồn đọng thiếu đơn vị | Medium |
| O9 | Layout: khối Basket/Thanh toán chỉ chiếm nửa trái, nửa phải trống | Low |
| O10 | Chú thích Order Aging & Basket sai thứ tự; màu gần nhau | Low |
| O11 | Tên chiến dịch trông như link nhưng không bấm được; định dạng "4,200" | Low |
| O12 | Time Peak ẩn số ở ô nhỏ, không tooltip; Payment không tooltip | Low |
| O13 | Refund 1,2–1,5% vs "Tỷ lệ trả hàng" 8,1% ở Tổng quan (cần phân biệt định nghĩa) | Medium |

### 3.4. Draft Acceptance Criteria (Vận hành)
- **AC-O1** Given BOD/MANAGER mở tab Vận hành, Then thấy theo thứ tự: Order Aging, Time Peak, Nhân khẩu học, Basket + Thanh toán, Chiến dịch, Benchmark, Anomaly, Conversion + Refund.
- **AC-O2** Order Aging: toggle Số lượng/Value đổi trục và tooltip; modal phản ánh chế độ đang chọn và có đơn vị.
- **AC-O3** Time Peak: cùng bộ lọc thì số không đổi giữa các lần mở tab; mọi ô có tooltip giá trị.
- **AC-O4** Nhân khẩu học: % giới tính = 100%, % nhóm tuổi = 100%, tháp khớp từng nhóm; Value mode tổng = doanh thu của kỳ lọc.
- **AC-O5** Benchmark: chọn đối tượng và chuẩn; % chênh = đối tượng/chuẩn − 1 với mũi tên đúng chiều; không cho chọn so sánh với chính nó.
- **AC-O6** Anomaly: điểm vượt ngưỡng (ngưỡng tính từ dữ liệu quá khứ, không gồm điểm hiện tại) được tô đỏ và liệt kê.
- **AC-O7 (đề xuất)** MANAGER chỉ thấy dữ liệu cửa hàng được gán; đổi bộ lọc ngày ảnh hưởng mọi widget có trục thời gian.

---

## 4. Sản phẩm & Tồn kho (BOD, MANAGER)

### 4.1. Bảng widget

| Widget | Loại biểu đồ | Chỉ số | Định dạng | Tương tác | Quan sát |
|---|---|---|---|---|---|
| **Phân tích Tăng trưởng Sản phẩm** | Multi-line (spline) % tăng trưởng theo kỳ | Ngành hàng: 4 đường (Gọng kính, Kính áp tròng (Lens), Phụ kiện, Tròng kính), trục ±0,6%; Nhóm SP: 5 đường (Gọng kim loại, Gọng nhựa, Lens 1 ngày, Tròng đa tròng, Tròng đơn tròng), ±0,7%; Thương hiệu: chú thích 5 (Chemi, Essilor, HMK Eyewear, Hoya, Zeiss) nhưng **chỉ 2 đường** (Chemi, Essilor), 0–0,28%; Nhà CC: chú thích 4 "Nhà cung cấp A–D" nhưng **biểu đồ trống** (không trục, không đường) | % dấu chấm | Tab Ngành hàng/Nhóm SP/Thương hiệu/Nhà CC; select "Top 5 (Tất cả)" + từng mục (chọn 1 mục → còn 1 đường); (i): "Phân tích mức độ tiêu thụ… Công thức: Tăng trưởng (%) = ((Kỳ hiện tại - Kỳ trước) / Kỳ trước) * 100" | Đổi theo Chu kỳ & ngày ✔ (Tháng: ±4%); **không** đổi theo KV/bộ lọc đa chiều; **số Ngành hàng đổi mỗi lần chuyển tab qua lại** (random); "Top 5" sắp theo ABC không theo hạng; thiếu "Kính mát" trong khi các widget khác có |
| **Phân tích Đa chiều** | Cột dọc | Doanh thu (Tỷ VNĐ) / Số lượng (Đơn hàng/Sản phẩm) × 8 chiều: Từng ngành hàng, Nhóm ngành Tròng, Nhóm ngành Gọng, Thương hiệu Tròng, Thương hiệu Gọng, Nhà cung cấp, Chiết suất (Tròng), Màu sắc | Trục "T" | 2 select; icon → modal "Dữ liệu Phân tích: <chỉ số> theo <chiều>" | Ngành hàng: Gọng 20,3 / Tròng 18,1 / Kính mát 4,5 / Áp tròng 1,8 / Phụ kiện 0,5 Tỷ (Σ 45,2); Số lượng: Gọng 8.500 / Tròng 7.200 / Phụ kiện 3.000 / Kính mát 1.800 / Áp tròng 750; Thương hiệu Tròng: Essilor 8,2 / Chemi 6,5 / Zeiss 3,5 / Hoya 2,3 (Σ 20,5 > Tròng kính 18,1); Nhà CC: A 15,5 / B 12,2 / C 8,5 / D 5,8 / Khác 3,2 (Σ 45,2). Tooltip chỉ ghi tên chiều ("TỪNG NGÀNH HÀNG") **không ghi tên cột** |
| **Cấu trúc Danh mục (Product Matrix)** | Treemap | Mặc định "Cấu trúc phân cấp": các ô lá Gọng Acetate Vuông/Tròn (HMK), Titanium T8012/T8013, Crizal Sapphire 1.60, Crizal Prevencia 1.56, Chemi U2 1.60, Chemi U6 1.67, Ray-Ban, Gentle Monster + ô nhỏ không nhãn (Áp tròng, Phụ kiện) | Tooltip "TỶ TRỌNG / GIÁ TRỊ – Chemi U2 1.60: 12", "Crizal Prevencia 1.56: 8" (không đơn vị) | Select 9 chế độ (Phân cấp + 8 chiều như Đa chiều); modal | **Không drill-down** khi click ô (cả ô lá và nhãn nhóm "Tròng kính" – nhãn nhóm bị che dưới các ô con); nhãn bị cắt ("Gọng Acetate Tròn (HM"); modal chế độ phân cấp: Gọng 45 / Tròng 40 / Kính mát 10 / Áp tròng 4 / Phụ kiện 1 (%) – không phải dữ liệu ô đang vẽ; modal chế độ "Từng ngành hàng" có tiêu đề cột "Tỷ trọng (%)" nhưng giá trị 20,3/18,1… (Tỷ VNĐ) |
| **Ma trận Phôi Tròng (Sphere vs Cylinder)** | Bubble scatter (X = Sphere −6D…+6D, Y = CYL 0…−2D, kích thước = số lượng) | 12 điểm, Σ 6.860; lớn nhất (−2, 0) 1.500 | D | Tooltip "THUỘC TÍNH: Sphere −2, Cylinder 0, Số lượng 1500"; modal "Ma trận Phôi Tròng" (có cột Phân loại) | Chú thích 3 loại (Trong suốt/Đổi màu/Đa tròng) nhưng có điểm hồng loại thứ 4 "Chống AS Xanh" (−4,5; −2; 80) không có trong chú thích; tooltip không nêu loại |
| **Thương hiệu Phân phối** | Thanh ngang | HMK Eyewear 25,5 Tỷ; Essilor 8,2; Chemi ~6,5; Zeiss ~3,5; Hoya ~2,3 | Tỷ | Tooltip "THƯƠNG HIỆU – Doanh thu (Tỷ): 25.5 Tỷ VNĐ"; modal | **Modal hiển thị "undefined"** ở mọi dòng cột "Doanh thu (Tỷ VNĐ)" |
| **Top Sản phẩm & Vật tư tiêu hao** | Bảng 8 dòng | NƯỚC RỬA KÍNH (HMK Eyewear) 15,037; Tròng Chemi U2 1.60 (Suất −2.00, Trong suốt) 11,991; Gọng ECMM5016 (Nâu Hồng) 7,908; Tròng Essilor Crizal (−3.50) 2,622; Nước ngâm lens Eye Multi 1,484; HỘP MẮT (BẠC) (Phụ kiện HMK) 1,283; Tròng Zeiss MyoVision (−1.50) 1,228; Gọng Titanium T8012 (Đen nhám) 1,108 | "15,037" dấu phẩy | "Xem toàn bộ danh mục" **không làm gì**; không sort | Sắp giảm dần ✔; số lượng bán > tổng số đơn; tiêu đề "Hỗ trợ quản trị tồn kho" nhưng không có cột tồn kho |

### 4.2. Kiểm tra số liệu (Sản phẩm)
- Đa chiều theo Ngành hàng Σ 45,2 Tỷ = theo Nhà CC Σ 45,2 ✔ (nhất quán nội bộ) nhưng ≫ GMV 4,22 Tỷ ✘.
- Thương hiệu Tròng Σ 20,5 Tỷ > ngành Tròng kính 18,1 Tỷ ✘. Thương hiệu Phân phối Essilor 8,2 = Đa chiều 8,2 ✔.
- Treemap phân cấp % (45/40/10/4/1) ≈ tỷ trọng doanh thu ngành (20,3/45,2 = 44,9% …) ✔.
- Gọng kính 8.500 SP vs 5.181 đơn toàn hệ thống ✘.
- Bộ lọc: Product Growth đổi theo Chu kỳ & ngày; các widget khác không đổi theo bất kỳ bộ lọc nào; KV và bộ lọc đa chiều không ảnh hưởng gì.

### 4.3. Vấn đề phát hiện (Sản phẩm)

| # | Vấn đề | Mức |
|---|---|---|
| P1 | Product Growth: Nhà CC trống; Thương hiệu 2/5 đường; Ngành hàng random khi đổi tab | High |
| P2 | Modal Thương hiệu Phân phối hiển thị "undefined" | High |
| P3 | Treemap không drill-down; modal phân cấp không khớp ô | Medium |
| P4 | Quy mô doanh thu/số lượng không khớp Tổng quan; Thương hiệu Tròng > Ngành Tròng | High |
| P5 | Widget (trừ Product Growth) không phản ứng bộ lọc | High |
| P6 | Tooltip Đa chiều thiếu tên cột; tooltip Treemap thiếu đơn vị; tiêu đề modal "Tỷ trọng (%)" sai | Medium |
| P7 | Scatter: loại "Chống AS Xanh" không có chú thích | Low |
| P8 | "Xem toàn bộ danh mục" không hoạt động; "Top 5" sắp ABC | Low |
| P9 | Tên danh mục không thống nhất: "Kính áp tròng (Lens)" vs "Áp tròng"; bộ lọc đa chiều không có Lens/Phụ kiện; nhà cung cấp placeholder "Nhà cung cấp A–D" | Low |

### 4.4. Draft Acceptance Criteria (Sản phẩm)
- **AC-P1** Product Growth: mỗi tab hiển thị đủ số đường bằng số mục trong chú thích (tối đa Top 5 theo doanh thu, sắp theo hạng); cùng bộ lọc → cùng số giữa các lần chuyển tab.
- **AC-P2** Đa chiều: chọn chỉ số × chiều → cột tương ứng; tooltip ghi tên cột + giá trị + đơn vị; tổng theo mọi chiều bằng nhau và bằng doanh thu kỳ lọc.
- **AC-P3** Treemap phân cấp: click nhóm → drill vào cấp con, có breadcrumb quay lại; tooltip có đơn vị và % tỷ trọng.
- **AC-P4** Modal mọi widget hiển thị đúng số như biểu đồ (không "undefined").
- **AC-P5** Top SP: sắp giảm dần theo số lượng; "Xem toàn bộ danh mục" mở danh sách đầy đủ.

---

## 5. Hiệu suất Nhân sự

### 5.1. Bảng widget

| Widget | Vai trò | Loại | Chỉ số | Tương tác | Quan sát |
|---|---|---|---|---|---|
| **Bảng Xếp Hạng PIC Sales** | BOD, MANAGER | Bảng + thanh tiến độ | Lê Văn C 1.5 Tỷ / AOV 5.1; Nguyễn Văn A 1.2 / 4.5; Hoàng Văn E 1.1 / 3.8; Trần Thị B 0.95 / 3.2; Phạm Thị D 0.8 / 2.8 (Tr/Đơn) | Không | Thanh "Tiến độ Doanh số" không có % hay mục tiêu; Σ 5,55 Tỷ > GMV 4,22 Tỷ; AOV 2,8–5,1 Tr vs 0,7–0,8 Tr toàn hệ thống |
| **Hiệu suất KTV Khúc Xạ** | BOD, MANAGER | Bảng + thanh | BS. My 95% / 99,5%; BS. Tuấn 92% / 99%; KTV. Linh 88% / 97%; KTV. Hoàng 85% / 95% (Tỷ lệ chuyển đổi / Chính xác) | Không | — |
| **Hiệu suất Phòng Lab** | BOD, MANAGER | Bảng + thanh | Lab-Hùng 95% / 1,2%; Lab-Tuấn 92% / 1,5%; Lab-Dũng 88% / 2,5% (Đúng hạn / Hư hao) | Không | — |
| **Thẻ cá nhân** | STAFF | 4 thẻ | Doanh số cá nhân (Tháng) 128.5 Tr "+15% so với mục tiêu"; Xếp hạng nội bộ Top 2 / 15 Sales (thanh); AOV 1.8 Tr/đơn "+0.2 Tr so với TB Cửa hàng"; Đánh giá CSKH (NPS) 4.9 / 5.0 ★★★★★ | Không | "NPS" nhưng thang 5 sao (NPS chuẩn −100…+100); nhãn "(Tháng)" khi bộ lọc là Tuần/4 tháng |
| **Tiến độ KPI Tuần** | STAFF | 3 thanh tiến độ | Tròng kính cận/đa tròng 80%; Gọng kính cao cấp 65%; Kính mát 110% | Không | — |
| **Nhân viên xuất sắc** | STAFF | Thẻ thông điệp | "Chúc mừng bạn đã đạt chỉ tiêu sớm 5 ngày trong chu kỳ tuần này…" | Không | Mâu thuẫn: 2/3 chỉ tiêu tuần chưa đạt (80%, 65%) |

### 5.2. Kiểm tra số liệu & Vấn đề
- Nguyễn Văn A: BOD thấy 1,2 Tỷ / AOV 4,5 Tr; STAFF (chính A) thấy 128,5 Tr/tháng, AOV 1,8 Tr – **không khớp** (High).
- Toàn bộ trang **tĩnh**: đổi KV, ngày (01/09), chu kỳ (Tháng) → không đổi gì (High). MANAGER thấy y hệt BOD (High).
- Bảng không sort, không có mục tiêu/% hoàn thành, không drill vào nhân sự (Medium).
- Bộ lọc đa chiều vẫn hiển thị "PIC Sales (Tất cả)" khi STAFF đã bị khóa PIC (Low).

### 5.3. Draft Acceptance Criteria
- **AC-H1** BOD/MANAGER thấy 3 bảng: PIC Sales (sắp theo doanh số giảm dần), KTV Khúc xạ, Phòng Lab.
- **AC-H2** STAFF chỉ thấy số liệu của chính mình (chip PIC), 4 thẻ + Tiến độ KPI tuần + thẻ khen thưởng chỉ hiện khi đạt tất cả chỉ tiêu.
- **AC-H3 (đề xuất)** Số liệu PIC ở góc nhìn BOD và STAFF khớp nhau cho cùng kỳ; đổi bộ lọc ngày cập nhật bảng.

---

## 6. Quản lý KPI (BOD, MANAGER)

### 6.1. Bảng widget / chức năng

| Thành phần | Quan sát | Tương tác | Kết quả |
|---|---|---|---|
| Tiêu đề "Quản lý Mục tiêu & KPI" + nút "+ Thêm KPI mới" | — | Mở wizard (cả BOD và MANAGER) | MANAGER chọn được "Toàn công ty" (High) |
| 3 thẻ | Tổng số KPI đang áp dụng **12**; KPI đã hoàn thành (Tháng trước) **8 / 10**; Cấp độ phân bổ sâu nhất **Cấp Chi nhánh** | Không | "Đang áp dụng 12" nhưng bảng chỉ có 3 dòng "Đang áp dụng" (Medium) |
| Bảng "Danh sách KPI đã thiết lập" | Cột: ☐, Phạm vi, Đối tượng, Chu kỳ, Phiên bản, Mục tiêu Doanh thu, Tỷ lệ CĐ, Trạng thái, Thao tác. 7 dòng: Toàn công ty/Tất cả/2026 Năm/V1 (Chính thức)/180 Tỷ/68%/Đang áp dụng; KV HCM/T7-2026/V2 (Đã điều chỉnh)/15 Tỷ/65%/Đang áp dụng; KV HCM/T7/V3 (Bản nháp)/16,5 Tỷ/68%/Bản nháp; KV HCM/T7/V1 (Lưu trữ)/14 Tỷ/62%/Lưu trữ; KV Miền Bắc/T7/V1 (Chính thức)/12 Tỷ/62%/Đang áp dụng; CN HMK HN CN1/Lễ 30/4-1/5 Chiến dịch/V1/1,5 Tỷ/70%/Đã kết thúc; KV Miền Trung/T6-2026/V1/8 Tỷ/60%/Đã kết thúc | — | Mục tiêu 180 Tỷ/năm, 15 Tỷ/tháng HCM ≫ thực tế (GMV 4,22 Tỷ/4 tháng toàn hệ thống); mục tiêu Run-rate 5.082 Tr không thấy liên hệ với bảng này |
| Tìm kiếm "Tìm kiếm khu vực, chi nhánh…" | Gõ "Miền Bắc", "Chi nhánh 1", "zzz", "15 Tỷ" | — | **Không lọc** (vẫn 7 dòng) – High |
| Nút lọc (phễu) | — | Click | Không có gì – Medium |
| Phân trang | "Hiển thị 1 - 5 của 12 KPI", nút Trước/1/2/3/Sau | Click 2, 3 | **Không chuyển trang**; đang hiển thị 7 dòng chứ không phải 5 – High |
| Thao tác dòng: ✎ / 🗑 / … | — | Click (đã chặn dialog) | Không có phản hồi, không confirm – High |
| Checkbox chọn dòng / chọn tất cả | Thanh nổi "N KPI đã chọn \| Cập nhật mục tiêu \| Thay đổi thời hạn \| Xóa \| ×" | Chọn tất cả → "7 KPI đã chọn" | OK |
| Bulk "Cập nhật mục tiêu" | Modal "Cập nhật mục tiêu hàng loạt": "Bạn đang chỉnh sửa 7 KPI…", Mục tiêu Doanh thu mới (Tỷ VNĐ), Tỷ lệ Chuyển đổi mới (%), Hủy bỏ / Lưu thay đổi | Nhập 20 / 70 → Lưu | Modal đóng, bỏ chọn, **bảng không đổi**, không thông báo – High |
| Bulk "Thay đổi thời hạn" | Modal: Chu kỳ mới (Tháng/Quý/Năm/Chiến dịch), Thời gian | Hủy bỏ | — |
| Bulk "Xóa" | — | Click | Không confirm, không xóa – Medium |
| **Wizard "Cấu hình Mục tiêu & KPI"** – B1 Phạm vi | Toàn công ty / Khu vực (HCM, Miền Bắc, Miền Trung, Đông Nam Bộ) / Chi nhánh (chỉ HN CN1, ĐN CN2, BD CN3) | Tiếp tục | Nếu **không chạm dropdown**, tóm tắt bước ghi "Khu vực: Tất cả"/"Chi nhánh: Tất cả" dù dropdown hiển thị HCM/HN CN1 – High |
| B2 Chu kỳ | Độ phân giải: Cả năm (không có chọn năm) / Theo tháng (Tháng 1–12, 2026; mặc định Tháng 7) / Chiến dịch-Lễ (Black Friday, Tết Nguyên Đán 2026, Lễ 8/3, Lễ 30/4-1/5; ghi chú "sẽ ghi đè lên mục tiêu ngày/tháng") | Quay lại / Tiếp tục | Chiến dịch không có ngày cụ thể |
| B3 Nhập liệu | Doanh thu (Tỷ VNĐ) 15; Tỷ lệ CĐ (%) 65; GTTB đơn (VNĐ) 850000; Lưu lượng KH 25000; Độ hài lòng (%) 90 – nhãn "Mục tiêu: Tháng 7, 2026" | Lưu cấu hình KPI | **Không validate** (−5 Tỷ, 150% được lưu); giá trị nhập giữ lại cho lần mở sau; nút chuyển "✓ Đã lưu KPI" nhưng **bảng không thêm dòng**, số thẻ vẫn 12 – High |
| Phát hiện trùng lặp | Khi chọn tường minh KV = HCM, T7/2026 → khung vàng "Phát hiện trùng lặp KPI – Đã tồn tại bộ KPI đang áp dụng cho Hồ Chí Minh trong khoảng thời gian Tháng 7, 2026": ◉ Ghi đè hoàn toàn (mặc định) / ○ Giữ mục tiêu cao nhất / ○ Lưu thành phiên bản mới (Bản nháp); nút đổi thành "Xác nhận & Lưu" | Chọn "Bản nháp" → Xác nhận | Modal đóng, bảng không đổi. Khi để dropdown mặc định (HCM hiển thị nhưng tóm tắt "Tất cả") → **không cảnh báo**, báo "Đã lưu KPI" |

### 6.2. Vấn đề phát hiện (KPI)

| # | Vấn đề | Mức |
|---|---|---|
| K1 | Lưu KPI / bulk edit / xóa / sửa không thay đổi dữ liệu (không persist, không phản hồi) | High |
| K2 | Tìm kiếm, phân trang, nút lọc không hoạt động; footer "1-5 của 12" sai với 7 dòng | High |
| K3 | Không validate giá trị (âm, > 100%) | High |
| K4 | Giá trị mặc định dropdown không được ghi nhận → bỏ qua kiểm tra trùng lặp | High |
| K5 | MANAGER đặt được KPI toàn công ty/khu vực khác | High |
| K6 | Danh sách CN trong wizard (3) ≠ bộ lọc (5); KV dùng HCM/ĐNB | Medium |
| K7 | Thẻ "đang áp dụng 12" không khớp bảng | Medium |
| K8 | "Cả năm" không chọn được năm; chiến dịch không có ngày | Low |

### 6.3. Draft Acceptance Criteria (KPI)
- **AC-K1** Given BOD bấm "Thêm KPI mới"/"Cấu hình KPI", Then wizard 3 bước (Phạm vi → Chu kỳ → Nhập liệu) với tóm tắt từng bước ở cột trái; "Quay lại" giữ lựa chọn.
- **AC-K2** When lưu KPI hợp lệ, Then bảng thêm dòng mới, thẻ tổng tăng, hiển thị thông báo thành công.
- **AC-K3** When trùng phạm vi + chu kỳ với KPI "Đang áp dụng", Then hiện cảnh báo trùng lặp với 3 lựa chọn; mặc định "Ghi đè hoàn toàn"; nút đổi thành "Xác nhận & Lưu".
- **AC-K4** Doanh thu > 0; tỷ lệ 0–100%; GTTB, lưu lượng là số nguyên dương; sai → báo lỗi, không lưu.
- **AC-K5** Tìm kiếm lọc theo Đối tượng/Phạm vi; phân trang 5 dòng/trang; footer đúng số.
- **AC-K6** Chọn ≥ 1 dòng → thanh hành động hàng loạt hiển thị đúng số; "Cập nhật mục tiêu" áp dụng cho mọi dòng chọn; "Xóa" có xác nhận.
- **AC-K7 (đề xuất)** MANAGER chỉ tạo/sửa KPI cho cửa hàng của mình.

---

## 7. Lỗi nhập ngày, Console, Định dạng chung

- **Từ ngày (30/09) > Đến ngày (01/06):** mọi thẻ = 0; "Chiếm NaN% GMV", AOV "NaN", "Trước VAT: NaNTr | VAT: NaNTr", "NaN%", Waterfall "(Bằng NaN% so với GMV)"; các biểu đồ trống; không thông báo lỗi; không crash.
- **Xóa trống Từ ngày:** như trên + Run-rate "Mục tiêu: NaN Tr", "Đạt 0% Target (NaN Tr)", "Trần an toàn: NaN Tr", "−NaN Tr".
- **Console:** không có error/warning trong suốt phiên (kể cả sau F5 và các trường hợp NaN).
- **Lưu trạng thái:** localStorage rỗng; F5 mất mọi thay đổi (vai trò, bộ lọc, Traffic nhập tay, KPI).
- **Định dạng không thống nhất:** dấu thập phân phẩy (21,7%) và chấm (−12.7%, 2.35, 16.0Tr); nghìn chấm (5.181) và phẩy (4,200; 15,037); đơn vị Tỷ/T/Tr/Triệu/M/k ₫/đ; "1554" không phân cách.
- **Không kiểm tra:** responsive/mobile (không đổi kích thước cửa sổ).

---

## 8. Xác minh câu hỏi của BA

| # | Câu hỏi (PM/BA) | Kết luận | Số liệu / bằng chứng thấy trên UI |
|---|---|---|---|
| 1 (DA-Q1) | Đổi KV/CN toàn cục, 9 thẻ tài chính có đổi? | **Xác nhận (không đổi)** | Miền Bắc: GMV vẫn 4,22 Tỷ ↑21,7%, DTT 3,70, Volume 5.181…; HN CN1: giống hệt. Biểu đồ đổi (GMV Miền Bắc 1.476 Tr; CN1 1.054 Tr) |
| 2 (DA-Q2) | Global có ghi đè Local? Local 1 chart có ảnh hưởng chart khác? | **Xác nhận** | Global = Miền Bắc → cả 7 cặp Local đổi thành "Miền Bắc"/chi nhánh tương ứng. Local Tương quan = Miền Trung → chỉ biểu đồ đó đổi (trục 10–110 Tr), Waterfall vẫn 4.005, global vẫn "Tất cả" |
| 3 (DA-Q3) | Bộ lọc đa chiều + Áp dụng có đổi số? | **Xác nhận (không đổi)** | Ngành hàng = Tròng kính, Giới tính = Nữ, Trạng thái = Đã hoàn thành → Áp dụng: Tổng quan, Sản phẩm không đổi dòng nào; PIC Sales/KTV chỉ có "Tất cả" |
| 4 (DA-Q4) | Treemap phân cấp drill-down? | **Xác nhận (không drill)** | Click ô "Chemi U2 1.60" → chỉ hiện tooltip "12"; nhãn nhóm "Tròng kính" tồn tại nhưng bị ô con che, click (giả lập) không đổi gì; không thấy breadcrumb |
| 5 (DA-Q5) | Product Growth: số đường Nhà CC/Thương hiệu; nhảy số khi đổi tab? | **Xác nhận** | Nhà CC: 0 đường (biểu đồ trống, chú thích 4 NCC); Thương hiệu: 2 đường (Chemi, Essilor) dù chú thích 5; Ngành hàng: path đường đầu `M60,186.13…` → sau khi qua các tab và quay lại `M60,148.88…` (số đổi) |
| 6 (DA-Q6) | Footer thẻ đổi theo khoảng ngày? | **Xác nhận (hardcode)** | 01/06–30/09, 01/09–30/09, 01/07–31/07 đều hiện "01/09 — 30/09/2026" |
| 7 (DA-Q7) | Combo "Cả 2": UPT có nhìn thấy? | **Xác nhận (gần như không)** | UPT (~2,35) vẽ trên trục phải AOV (0–910k ₫) → đường cam đứt nằm sát 0; chỉ thấy rõ khi chọn "Chỉ UPT" (trục 2,16–2,56) |
| 8 (DA-Q8) | Thẻ NỢ TREO: % đỏ thì mũi tên hướng? | **Xác nhận (xuống)** | "↓ 20,9% so với kỳ trước" màu đỏ (giống "Giá trị điều chỉnh ↓15,4%" đỏ). UI không cho biết số kỳ trước nên không xác định được nợ tăng hay giảm |
| 9 (DA-Q9) | 3 số DTT: thẻ / Waterfall / Bảng xếp hạng | **Xác nhận** | Thẻ 3,70 Tỷ (Run-rate hiển thị 3.695 Tr) · Waterfall "Thực thu +4.005 Tr (95,0%)" · Bảng xếp hạng "Doanh thu" Tổng 3.876 Tr |
| 10 (DA-Q10) | Modal Thương hiệu Phân phối có "undefined"? | **Xác nhận** | 5 dòng HMK Eyewear/Essilor/Chemi/Zeiss/Hoya đều "undefined" ở cột "Doanh thu (Tỷ VNĐ)"; biểu đồ vẫn đúng (25,5; 8,2…) |
| 11 (DA-Q12) | Từ > Đến hoặc xóa ngày: NaN hay crash? | **Xác nhận (NaN, không crash)** | Xem §7; console sạch |
| 12 (DA-Q13) | Time Peak / Benchmark / Anomaly đổi khi chuyển tab hoặc F5? | **Xác nhận một phần** | Time Peak: đổi mỗi lần quay lại tab (Thứ 2: 51,28,74… → 53,29,55…). Anomaly: đổi mỗi lần quay lại tab (cy điểm đầu 144,97 → 148,62) và sau F5. Benchmark: **không** đổi khi chuyển tab (83 vs 75) nhưng **đổi sau F5** (HCM Doanh thu 99 vs 75). Anomaly: đổi thực thể không bao giờ có điểm bất thường (0 điểm đỏ ở cả 7 lựa chọn) |
| 13 (DA-Q14/Q15) | MANAGER thấy dữ liệu khác BOD? Mở được modal KPI qua "Thêm KPI mới"? | **Xác nhận** | Vận hành & Nhân sự: diff text BOD vs MANAGER chỉ khác dòng "Tổng quan" (tab). Chip "HMK ĐN LÊ DUẨN 2" click không làm gì. MANAGER mở wizard, chọn được "Toàn công ty", lưu → "Đã lưu KPI" |
| 14 (DA-Q16/Q17) | KPI: tìm kiếm, phân trang, bulk save, trùng lặp | **Xác nhận** | Tìm kiếm: không lọc (7 dòng với mọi từ khóa). Phân trang: trang 2/3 giống trang 1. Bulk "Lưu thay đổi" (20 Tỷ, 70%): bảng giữ 180/15/16,5/14/12/1,5/8 Tỷ. Trùng lặp: để mặc định HCM → không cảnh báo (tóm tắt "Khu vực: Tất cả"); chọn lại HCM thủ công → có cảnh báo 3 lựa chọn. (Không thử riêng "Miền Bắc" nhưng hành vi tương tự HCM) |
| 15 (DA-Q19) | Chu kỳ Quý: "Quý 2" chỉ có tháng 6? | **Xác nhận** | Hai cột Quý 2 / Quý 3; modal: Quý 2 = 856 Tr, 1.038 đơn (= tháng 6); Quý 3 = 3.360 Tr, 4.143 đơn. Theo Ngày: nhãn trục dày đặc, không đọc được |
| 16 (DA-Q21) | InfoTooltip rỗng ở 3 widget? | **Xác nhận** | Hover (i) cạnh "Xu hướng Lũy kế" → hộp đen trống; wrapper text rỗng ở Hiệu quả đơn hàng, Xu hướng Lũy kế, Phân tích Tăng trưởng (các widget khác có nội dung) |
| 17 (DA-Q23) | Múi giờ & giá trị mặc định | **Xác nhận (khớp)** | TZ máy Asia/Saigon (UTC+7). GMV 4,22 Tỷ ↑21,7% ✔; DTT 3,70 Tỷ ↑21,6% ✔; Volume 5.181 ✔; AOV 0,7 Tr ✔; Nợ treo 63 Tr ✔; GM 72,7% ✔; Xu hướng Đạt 83% Target ✔; KH mới 1554 ↑21,2% ✔; Doanh thu 4,43 ✔; Điều chỉnh −211 ↓15,4% ✔; Waterfall 4.216/−211/4.005 ✔; Bảng xếp hạng 4.216/3.876/8,1% ✔; Local Miền Bắc 1.476 (35%) ✔; Hiệu quả 813.773 / 288 / 2,35 ✔; GMV theo Tháng: Q2 856 (T6) ✔ |
| DA-Q11 | Modal Cấu trúc Danh mục (phân cấp) khớp ô vẽ? | **Xác nhận (không khớp)** | Modal: Gọng 45 / Tròng 40 / Kính mát 10 / Áp tròng 4 / Phụ kiện 1 (%) trong khi ô vẽ là SKU lá |
| DA-Q18 | Ngưỡng màu Heatmap; Nhập Traffic | **Xác nhận** | % Target: 80% → xanh (emerald-400), 60% → vàng nhạt (amber-200), 79% → vàng đậm; CR: 75,0% → xanh, 50,8–51,9% → vàng nhạt, 49,x% → đỏ nhạt. Traffic 120 → 240: CR 20,0% → 10,0% ngay; F5 mất (localStorage rỗng) |
| DA-Q20 | 31/01–31/05, Theo Tháng có Tháng 2? | **Xác nhận (thiếu)** | Trục: Tháng 1, Tháng 3, Tháng 4, Tháng 5 |
| DA-Q22 | Header & FilterBar chồng nhau khi cuộn? | **Bác bỏ** | Khi cuộn header cuộn đi, chỉ thanh lọc dính đỉnh; không thấy chồng |
| DA-Q24 | Local KV ≠ Tất cả: toggle ẩn? BD CN3 tô đỏ? | **Xác nhận** | Local = Miền Nam → nút Theo KV/Theo CN biến mất; "14,0%" có class đỏ (bg-rose-50 text-rose-600) |
| DA-Q25 | Combo khi "Đồng bộ cả 3" → tự chọn GMV, ẩn nút? Tooltip đồng bộ? | **Xác nhận** | Vào Combo: chỉ còn Sức bán GMV (được chọn)/DTT/Công nợ; hover mini GMV Tuần 10 → 2 mini chart còn lại cùng hiện tooltip Tuần 10 |
| DA-Q26 | Định dạng Marketing & Top SP | **Xác nhận** | "4,200 đơn", "15,037" (phẩy) trong khi Tổng quan "5.181" (chấm) |
| DA-Q27 | Modal giữ từ khóa/sort khi mở lại? | **Xác nhận** | Gõ "Tuần 1" + sort AOV → đóng → mở lại: ô tìm kiếm vẫn "Tuần 1", 10 dòng, dòng đầu Tuần 10 (791.943 ₫) |

---

## 9. Câu hỏi mở đề nghị BA kiểm trong code
1. Vì sao 9 thẻ tài chính chỉ dùng khoảng ngày mà bỏ qua KV/CN – thiết kế hay thiếu sót?
2. DTT thẻ = GMV × ~0,876 lấy từ đâu? Waterfall Thực thu = GMV × 0,95 cố định? Cột "Doanh thu" bảng xếp hạng = GMV × (1 − tỷ lệ trả hàng cố định theo chi nhánh)? Nguồn nào là chuẩn?
3. "Kỳ trước" của thẻ (↑21,7%) và của Growth Analysis (−1,4%) được định nghĩa thế nào? Vì sao "Tăng trưởng chung" phụ thuộc chu kỳ gom nhóm?
4. Tăng trưởng của "Giá trị điều chỉnh" có hardcode 15,4%? "Bình quân 4-5 khách/ngày" có hardcode? KH mới có được tính = 30% số đơn?
5. Mục tiêu Run-rate (5.082 Tr) lấy từ module KPI hay hằng số? Có co theo KV/CN không?
6. Heatmap chế độ Tuần/Tháng có thực sự cắt N giá trị đầu thay vì gộp?
7. Anomaly: công thức MA/ngưỡng có gồm điểm hiện tại? Có điều kiện nào đánh dấu "Bất thường"?
8. Benchmark: "Index 100" được tính ở đâu? Có random seed theo phiên?
9. Tooltip "value"/"rate" và số âm trong modal Nhân khẩu học – do key dữ liệu chưa map nhãn?
10. KPI wizard: vì sao giá trị dropdown mặc định không vào state ("Tất cả")? Store KPI có ghi được không (Lưu báo thành công nhưng bảng không đổi)?
11. Có dự định RLS cho MANAGER (cửa hàng "HMK ĐN LÊ DUẨN 2") và STAFF không? Mapping cửa hàng này với 5 chi nhánh?
12. Hai bộ danh mục vùng (Bắc/Trung/Nam vs HCM/Bắc/Trung/ĐNB) và chi nhánh (5 vs 80 vs tên thật như "HMK BÌNH DƯƠNG") – nguồn nào là chuẩn?
13. Chế độ Độ lệch % (Volume) – vì sao cột không neo ở 0?
14. Mũi tên/màu của chỉ số "ngược" (Nợ treo, Điều chỉnh): quy tắc là gì?

---

## 10. Xác minh lại: Độ lệch % Volume

**Kết luận: BA đúng. Cột được neo ở 0%. Quan sát trước đây của tôi chụp đúng lúc đang chạy animation.** Vì vậy rút lại E14 (§2.4), dòng tương ứng trong §0/§2.1 ("cột không xuất phát từ 0") và câu hỏi mở số 13 (§9).

Cách kiểm: mở tab mới, vai trò BOD, Tổng quan, bộ lọc mặc định → Hiệu quả đơn hàng → "Độ lệch % so với TB" → "% Lệch Volume". Chờ ≥ 2 giây rồi đọc `getBBox()` của từng `path` trong `.recharts-bar-rectangle` và `y1` của ReferenceLine 0%.

- **Đường 0% (ReferenceLine):** y = 81,25.
- **Trạng thái cuối:** mọi cột đều chạm 81,3.
  - Cột âm chạy từ 81,3 xuống. Tuần 1: 81,3–120,2. Tuần 4: 81,3–113,1 (cao 31,8 px). Tuần 18: 81,3–206,8 (125,6 px).
  - Cột dương chạy từ 81,3 lên. Tuần 10: 21,0–81,3 (60,2 px). Tuần 11: 30,2–81,3. Tuần 9: 76,3–81,3.
- **Tỷ lệ chiều cao đúng:** khoảng 2,04 px cho mỗi 1%.
  - Tuần 10: 60,2 px ⇔ +29,5% (373 so với TB 288).
  - Tuần 4: 31,8 px ⇔ −15,6% (243 so với 288).
  - Tuần 18: 125,6 px ⇔ −61,5% (111 so với 288).
- **Khi chuyển AOV → Volume** (lấy mẫu mỗi 60 ms, đường 0% luôn ở y = 81,25):
  - 61 ms: Tuần 4 nằm ở 89–202, vẫn là hình của AOV.
  - 183 ms: Tuần 4 ở 103–133.
  - 305 ms: Tuần 4 ở 92–111, tức cột lơ lửng không chạm 0.
  - Từ ~427 ms: Tuần 4 ở 81–113, cố định.
  - Như vậy animation kéo dài khoảng 400 ms. Trong lúc đó cột chuyển dần từ hình của AOV sang hình của Volume nên nhìn như "lơ lửng". Đây là hiện tượng trình bày, không phải lỗi dữ liệu.
- **F5 thẳng vào Volume:** không làm được. Sau F5 widget về chế độ mặc định "Phóng to trục Y (Chuẩn)" vì URL vẫn là `/` và localStorage rỗng, nên chế độ xem không được lưu.
- **Còn lại (Low, UX):** chuyển tab chỉ số làm cột "bay" từ vị trí của chỉ số cũ trong khoảng 0,4 giây, có thể gây nhầm khi chụp màn hình hoặc trình chiếu. Nên cân nhắc bỏ animation hoặc remount Bar khi đổi dataKey.
