# BÁO CÁO ĐÁNH GIÁ PROTOTYPE — DASHBOARD HMK (đặc tả v1.1 kèm hiện trạng)

> **Lưu ý (16/10/2026):** Đây là **báo cáo đánh giá prototype** (bản 1.1 của đặc tả, có đánh dấu hiện trạng ✅/⚠️/❌ và danh sách GAP của prototype). Định nghĩa và yêu cầu **chuẩn** nằm ở [`../PRODUCT_SPEC_DASHBOARD.md`](../PRODUCT_SPEC_DASHBOARD.md) (bản 2.0). Khi hai tài liệu khác nhau, tài liệu chuẩn được ưu tiên — đặc biệt định nghĩa GMV đã được cập nhật sau bản này (Đơn đặt tính GMV từ trạng thái "Đơn tạm"; kết thúc/hủy đơn đặt ghi nhận tại ngày kết thúc/hủy).



| Thuộc tính | Giá trị |
|---|---|
| Phiên bản | 1.1 — Đã chốt 15 quyết định nghiệp vụ (16/10/2026) |
| Ngày | 16/10/2026 |
| Chủ sở hữu | Product Manager |
| Đóng góp | Business Analyst (Luồng 1 — mã nguồn & tài liệu) · Data Analyst (Luồng 2 — giao diện chạy thực) |
| Phạm vi đối chiếu | Repo `dashboard_hmk`, commit `c3d3cb9` (nhánh `main`); app chạy tại `localhost:3000`, múi giờ UTC+7 |
| Quan hệ với tài liệu khác | Kế thừa và **thay thế phần định nghĩa chỉ số** của `docs/FRS.md`; tham chiếu `docs/VISUALIZATION_IDEAS.md`, `docs/BRAINSTORM_RETAIL_DEBT_SOLUTION.md` |
| Người duyệt cần có | BOD (định nghĩa chỉ số, mục tiêu), Kế toán (Doanh thu, Nợ treo), Tech Lead (dữ liệu thật, phân quyền), QA (AC) |

**Lịch sử thay đổi**
| Phiên bản | Ngày | Nội dung |
|---|---|---|
| 1.0 | 16/10/2026 | Bản hợp nhất 2 luồng (BA code + DA UI), 15 quyết định chờ chốt |
| 1.1 | 16/10/2026 | Áp 15 quyết định đã chốt. Chính: định nghĩa GMV / Giá trị điều chỉnh / DTT mới (QĐ-01), Waterfall 4 cột, đơn vị hiển thị tự động, VAT theo sản phẩm (QĐ-09), bỏ KPI cá nhân (QĐ-08), thêm import Excel Traffic & mục tiêu (QĐ-11, mục 7.7), hoãn các chỉ số chưa có dữ liệu nguồn (QĐ-13), bỏ phân loại vòng đời SP (QĐ-14). Thêm mục 10.2 — điểm cần xác nhận phát sinh |

---

## 0. Cách đọc tài liệu

### 0.1. Phương pháp
Tài liệu được xây dựng theo **hai luồng song song rồi hợp nhất**:
- **Luồng 1 (BA):** đọc toàn bộ `src/` (~10,4k dòng), FRS và tài liệu ý tưởng → hành vi *được lập trình*, công thức, gap so với FRS. Số liệu kỳ vọng được tính lại trực tiếp từ `chartEngine.ts`.
- **Luồng 2 (DA):** thao tác trên UI với cả 3 vai trò, mọi điều khiển, đọc số trên màn hình và kiểm tra tính nhất quán chéo.
- **Đối chiếu chéo:** DA xác minh 27 câu hỏi của BA trên UI; BA giải thích 14 câu hỏi của DA trong code. **Mọi kết luận "High" trong tài liệu này đã được cả hai luồng xác nhận** (trừ chỗ ghi rõ "chỉ Luồng 1" hoặc "chỉ Luồng 2").

### 0.2. Quy ước
| Ký hiệu | Ý nghĩa |
|---|---|
| `FR-xx` | Yêu cầu chức năng (feature) |
| `BR-xx` | Quy tắc nghiệp vụ (business rule) — **nguồn chân lý duy nhất** cho công thức |
| `AC-xx` | Tiêu chí chấp nhận, viết dạng Given / When / Then, mô tả **hành vi mục tiêu (to-be)** |
| `GAP-xx` | Sai lệch giữa hiện trạng và mục tiêu (mục 9) |
| `QĐ-xx` | Quyết định nghiệp vụ **đã chốt** ngày 16/10/2026 (mục 10.1); điểm phát sinh còn mở ở mục 10.2 |
| ✅ / ⚠️ / ❌ / ⏸ | Hiện trạng: Đạt / Có nhưng sai lệch / Chưa có / Hoãn — chưa có dữ liệu nguồn (QĐ-13) |
| P0 / P1 / P2 | Ưu tiên: P0 = chặn phát hành (sai số liệu, sai quyền); P1 = cần cho bản dùng thật; P2 = cải tiến |

---

## 1. Tóm tắt điều hành

**Sản phẩm là gì.** Dashboard BI nội bộ cho chuỗi bán lẻ kính mắt HMK, gồm 5 trang (Tổng quan, Vận hành & Khách hàng, Sản phẩm & Tồn kho, Hiệu suất Nhân sự, Quản lý KPI) phục vụ 3 vai trò BOD / MANAGER / STAFF.

**Hiện trạng.** Đây là **prototype front-end chạy dữ liệu giả lập** (không có API/backend dữ liệu). Bố cục và tương tác đã khá đầy đủ, nhưng **số liệu chưa đủ tin cậy để ra quyết định**:

1. **Một chỉ số — nhiều con số.** Cùng một bộ lọc, *Doanh thu thuần* hiện 3 giá trị (thẻ 3.695 Tr · Waterfall 4.005 Tr · Bảng xếp hạng 3.876 Tr); *AOV* hiện 3 giá trị (0,7 Tr · 813.773 ₫ · 814.904 ₫); *Tăng trưởng GMV* hiện +21,7% ở thẻ nhưng −1,4% ở biểu đồ Tăng trưởng. Bản thân FRS cũng định nghĩa DTT theo 2 cách mâu thuẫn.
2. **Bộ lọc không đồng bộ.** 9 thẻ tài chính bỏ qua Khu vực/Chi nhánh; toàn bộ trang Vận hành, Nhân sự, KPI và gần hết trang Sản phẩm bỏ qua mọi bộ lọc; "Bộ lọc đa chiều" chỉ là giao diện.
3. **Dữ liệu ngẫu nhiên** ở Time Peak, Anomaly, Benchmark, Product Growth — số đổi khi chuyển tab/F5.
4. **Phân quyền chỉ là giao diện.** MANAGER thấy dữ liệu toàn hệ thống như BOD và tạo được KPI "Toàn công ty".
5. **Module KPI không ghi dữ liệu** và **không nối** với các mục tiêu đang hiển thị (mục tiêu Run-rate là hằng số 42 Tr/ngày).
6. **Danh mục chủ không thống nhất:** 3 miền vs 4 vùng; 5 / 10 / 80 chi nhánh tùy widget.

**Khuyến nghị.** 15 quyết định nghiệp vụ đã được chốt ngày 16/10/2026 (mục 10.1) và đã áp vào Từ điển chỉ số (mục 6). Bước tiếp theo: (1) xác nhận 9 điểm phát sinh ở mục 10.2 (chủ yếu Kế toán và Tech Lead); (2) xây **một hàm tính chỉ số dùng chung** theo mục 6 và xử lý toàn bộ GAP mức P0 (mục 9) trước khi nối dữ liệu thật.

---

## 2. Bối cảnh, mục tiêu & phạm vi

### 2.1. Vấn đề cần giải quyết
- BOD cần một bức tranh tài chính tin cậy (sức bán, dòng tiền, nợ treo, biên lợi nhuận) và tiến độ so với kế hoạch theo vùng/chi nhánh.
- Quản lý cửa hàng cần nhận diện điểm nghẽn vận hành (đơn tồn đọng, giờ cao điểm, chuyển đổi) và hiệu suất đội ngũ.
- Nhân viên cần theo dõi doanh số và thứ hạng cá nhân.
- Đặc thù ngành kính: hai luồng đơn (**Đơn đặt trước / cắt kính** có cọc và **Đơn lắp sẵn / mua thẳng**), quản trị phôi tròng theo độ SPH/CYL.

### 2.2. Mục tiêu sản phẩm & chỉ số thành công
| Mục tiêu | Chỉ số thành công | Ngưỡng chấp nhận |
|---|---|---|
| Số liệu nhất quán | Số cặp widget hiển thị cùng một chỉ số mà lệch nhau (cùng bộ lọc) | **0** |
| Số liệu khớp sổ sách | Chênh lệch GMV/DTT tháng so với báo cáo Kế toán | ≤ 0,5% |
| Bộ lọc đáng tin | Widget không phản ứng với bộ lọc mà nó tuyên bố hỗ trợ | **0** |
| Đúng quyền | Số trường hợp người dùng xem được dữ liệu ngoài phạm vi | **0** |
| Được sử dụng | BOD/Manager mở dashboard ≥ 3 lần/tuần | ≥ 80% người dùng mục tiêu |

### 2.3. Trong phạm vi
5 trang hiện có, bộ lọc toàn cục/cục bộ/đa chiều, phân quyền 3 vai trò, module KPI (thiết lập mục tiêu và liên kết mục tiêu vào biểu đồ), modal "Xem chi tiết dữ liệu".

### 2.4. Ngoài phạm vi (phiên bản này)
- Xuất Excel/CSV/PDF (chưa có yêu cầu — xem QĐ-10).
- Biểu đồ/công nợ mới ngoài thẻ "Nợ treo" (theo quyết định tại `BRAINSTORM_RETAIL_DEBT_SOLUTION.md` §2).
- Thông báo (chuông), hồ sơ người dùng, phân tích CLV (dấu vết trong `update_op_view.cjs`, chưa có yêu cầu).
- Ứng dụng di động riêng (chỉ yêu cầu hiển thị được ở độ rộng điện thoại — mục 8).
- **KPI cá nhân** (QĐ-08): không giao chỉ tiêu tới từng nhân viên; mọi phần tử "so với mục tiêu cá nhân" bị gỡ.
- **Chỉ số chưa có dữ liệu nguồn** (QĐ-13): tỷ lệ chuyển đổi KTV (cần ca đo mắt), phễu chuyển đổi (cần báo giá), nguyên nhân trả hàng/hủy, độ chính xác đo khám. Đưa vào khi hệ thống nguồn ghi nhận được.
- Phân loại vòng đời sản phẩm (QĐ-14).

### 2.5. Giả định & ràng buộc
- Dữ liệu nguồn sẽ lấy từ hệ thống POS/ERP (Order, Customer, Payment, Inventory). Tài liệu này mô tả **logic nghiệp vụ**; thiết kế API/ETL nằm ngoài phạm vi.
- Đơn vị tiền tệ VNĐ. **VAT ghi nhận theo thuế suất cấu hình trên từng sản phẩm tại thời điểm tạo đơn** (QĐ-09); không dùng một tỷ lệ cố định (thay cho "8%" ở FRS 4.4.1).
- Traffic cửa hàng là **dữ liệu nhập** (nhập tay hoặc import Excel), không có nguồn tự động (QĐ-13).
- Múi giờ nghiệp vụ: **Asia/Ho_Chi_Minh (UTC+7)** cho mọi phép cắt ngày.

---

## 3. Người dùng & phân quyền

### 3.1. Vai trò
| Vai trò | Mô tả | Phạm vi dữ liệu (to-be) |
|---|---|---|
| **BOD** — Ban Giám đốc | Ra quyết định chiến lược, giao chỉ tiêu | Toàn hệ thống |
| **MANAGER** — Quản lý cửa hàng | Vận hành 1 hoặc nhiều cửa hàng được gán | Chỉ cửa hàng được gán |
| **STAFF** — Nhân viên (PIC Sales, KTV) | Theo dõi hiệu suất cá nhân | Chỉ dữ liệu của chính mình |

### 3.2. Ma trận quyền truy cập
| Hạng mục | BOD | MANAGER | STAFF | Hiện trạng |
|---|---|---|---|---|
| Tab Tổng quan | ✔ | ✘ | ✘ | ✅ |
| Tab Vận hành & Khách hàng | ✔ | ✔ (cửa hàng mình) | ✘ | ⚠️ MANAGER thấy toàn hệ thống |
| Tab Sản phẩm & Tồn kho | ✔ | ✔ (cửa hàng mình) | ✘ | ⚠️ như trên |
| Tab Hiệu suất Nhân sự | ✔ Leaderboard toàn hệ thống | ✔ Leaderboard cửa hàng mình | ✔ Góc nhìn cá nhân | ⚠️ MANAGER thấy toàn hệ thống |
| Tab Quản lý KPI — xem | ✔ | ✔ (KPI phạm vi mình) | ✘ | ⚠️ |
| Tạo/sửa/import KPI (Công ty, Khu vực, Chi nhánh) | ✔ | ✘ (chỉ xem — xem 10.2 #6) | ✘ | ❌ MANAGER tạo được |
| KPI cá nhân | — | — | — | Bỏ tính năng (QĐ-08) |
| Nhập tay / import Excel Traffic | ✔ mọi cửa hàng | ✔ cửa hàng mình | ✘ | ⚠️ ai cũng nhập được, không lưu, chưa có import |
| Bộ chọn Khu vực/Chi nhánh toàn cục | ✔ | Chỉ các cửa hàng được gán (nếu > 1) | ✘ | ⚠️ MANAGER chỉ có chip tĩnh |
| Nút "Cấu hình KPI" trên Header | ✔ | ✘ | ✘ | ✅ |

### 3.3. Quy tắc nghiệp vụ phân quyền
- **BR-ROLE-01.** Vai trò được xác định từ tài khoản đăng nhập. **Không** cho người dùng tự chọn vai trò. *(Hiện trạng: dropdown "Quyền truy cập" chỉ dùng cho demo — phải ẩn ở bản production.)*
- **BR-ROLE-02.** Phạm vi dữ liệu phải được áp **ở tầng dữ liệu/API** (row-level security), không chỉ ẩn tab ở giao diện.
- **BR-ROLE-03.** Khi vai trò hiện tại không có quyền với tab đang mở, hệ thống chuyển về tab đầu tiên được phép (BOD → Tổng quan; MANAGER → Vận hành; STAFF → Nhân sự).
- **BR-ROLE-04.** Mọi lối vào cùng một chức năng phải áp cùng một quy tắc quyền (ví dụ: wizard KPI mở từ Header hoặc từ "Thêm KPI mới" phải cùng giới hạn phạm vi).

### 3.4. Tiêu chí chấp nhận
- **AC-ROLE-01** ✅ Given BOD đang ở Tổng quan, When chuyển sang MANAGER, Then tab Tổng quan biến mất, màn hình chuyển sang "Vận hành & Khách hàng", nút "Cấu hình KPI" ẩn.
- **AC-ROLE-02** ✅ Given đang ở tab mà vai trò mới vẫn có quyền, When đổi vai trò, Then giữ nguyên tab.
- **AC-ROLE-03** ✅ Given STAFF, Then chỉ có tab "Hiệu suất Nhân sự" (góc nhìn cá nhân) và chip "PIC: <tên>".
- **AC-ROLE-04** ❌ Given MANAGER được gán cửa hàng X, When xem bất kỳ widget nào, Then mọi số liệu chỉ thuộc cửa hàng X, và tổng của các cửa hàng ≠ X bằng 0.
- **AC-ROLE-05** ❌ Given STAFF "Nguyễn Văn A", Then số liệu cá nhân (doanh số, AOV) **bằng** số liệu của "Nguyễn Văn A" trên Leaderboard mà BOD thấy cho cùng kỳ. *(Hiện lệch: 128,5 Tr/AOV 1,8 Tr vs 1,2 Tỷ/AOV 4,5 Tr.)*
- **AC-ROLE-06** ❌ Given MANAGER ở tab Quản lý KPI, Then không có nút "Thêm KPI mới", "Import mục tiêu", Sửa, Xóa, chỉnh sửa hàng loạt; chỉ xem KPI của cửa hàng mình và của khu vực/công ty chứa cửa hàng đó.
- **AC-ROLE-07** ❌ Given người dùng gọi trực tiếp API dữ liệu ngoài phạm vi của mình, Then API trả lỗi 403 và không trả dữ liệu.

---

## 4. Khung ứng dụng & điều hướng

### FR-SHELL-01 — Header
| Thành phần | Yêu cầu | Hiện trạng |
|---|---|---|
| Nhận diện | Logo + "EBID Workspace — Eyewear Business Intelligence Dashboard". Tiêu đề tab trình duyệt dùng cùng tên | ⚠️ tab trình duyệt ghi "Dashboard Kinh Doanh" |
| "Đồng bộ: HH:MM:SS" | Thời điểm **dữ liệu** được cập nhật gần nhất (data-as-of), không phải giờ bấm nút | ⚠️ chỉ là giờ bấm nút |
| Quyền truy cập | Chỉ bản demo; production lấy từ tài khoản (BR-ROLE-01) | ⚠️ |
| Cấu hình KPI | Chỉ BOD | ✅ |
| Chuông thông báo, avatar | Ngoài phạm vi; nếu giữ thì avatar hiển thị đúng tên/vai trò người dùng | ⚠️ luôn "Admin", badge "3" tĩnh |

### FR-SHELL-02 — Thanh tab & trạng thái mặc định
- Mặc định khi mở: vai trò theo tài khoản; tab đầu tiên được phép; Chu kỳ **Theo Tuần**; khoảng ngày mặc định **từ đầu tháng hiện tại đến hôm qua** (QĐ-07; hiện trạng cố định 01/06–30/09/2026); Khu vực/Chi nhánh = Tất cả.
- **BR-SHELL-01.** Trạng thái bộ lọc nên được giữ trong URL (query string) để chia sẻ link và giữ khi F5. *(Hiện trạng: F5 mất toàn bộ trạng thái.)* — P2.
- **BR-SHELL-02.** Thanh lọc dính (sticky) ở đỉnh khi cuộn, không chồng lên Header. ✅ (DA xác nhận không chồng).

### FR-SHELL-03 — Đồng bộ dữ liệu
- **AC-SYNC-01** ⚠️ When bấm nút đồng bộ, Then hệ thống tải lại dữ liệu từ nguồn, hiển thị trạng thái đang tải và cập nhật "Đồng bộ: …" bằng thời điểm dữ liệu mới nhất. *(Hiện trạng: chỉ quay icon ~0,8 giây và đổi giờ, số liệu giữ nguyên.)*

---

## 5. Bộ lọc

### FR-FLT-01 — Thanh lọc toàn cục
| Điều khiển | Giá trị | Ai thấy |
|---|---|---|
| Chu kỳ | Theo Ngày / Tuần / Tháng / Quý / Năm | Tất cả |
| Từ ngày – Đến ngày | Date picker | Tất cả |
| Khu vực → Chi nhánh (cascade) | Theo danh mục chủ (BR-MD-01) | BOD; MANAGER có > 1 cửa hàng |
| Chip phạm vi | "Cửa hàng: …" (MANAGER 1 cửa hàng) / "PIC: …" (STAFF) | MANAGER, STAFF |
| Bộ lọc đa chiều | Xem FR-FLT-03 | BOD, MANAGER |
| Đồng bộ | FR-SHELL-03 | Tất cả |

**Quy tắc:**
- **BR-FLT-01 — Cascade.** Đổi Khu vực → danh sách Chi nhánh chỉ còn chi nhánh thuộc khu vực đó và Chi nhánh reset về "Tất cả". Chọn một chi nhánh khi Khu vực = "Tất cả" → Khu vực tự cập nhật thành khu vực của chi nhánh đó. *(Hiện trạng: phần sau chưa có.)*
- **BR-FLT-02 — Validate ngày.** Không cho Từ ngày > Đến ngày, không cho để trống; khoảng tối đa 3 năm. Vi phạm → hiển thị lỗi ngay dưới ô và **không** tính toán. *(Hiện trạng: hiện "NaN" ở thẻ, Waterfall, Run-rate; không crash.)*
- **BR-FLT-03 — Phạm vi áp dụng.** Bộ lọc toàn cục áp dụng cho **mọi widget có dữ liệu giao dịch**, trừ những widget được ghi rõ ngoại lệ trong ma trận 5.5.
- **BR-FLT-04 — Định dạng ngày hiển thị.** `DD/MM/YYYY` bất kể locale trình duyệt. *(Hiện trạng: input hiển thị mm/dd/yyyy theo locale.)*

### FR-FLT-02 — Bộ lọc cục bộ (Local Filter) trên widget
- 7 widget trang Tổng quan có cặp Khu vực/Chi nhánh riêng: GMV vs DTT, Waterfall, Hiệu quả đơn hàng, Phân rã GMV, Xu hướng lũy kế, Bảng xếp hạng, Phân tích Tăng trưởng.
- **BR-FLT-05.** Local Filter khởi tạo = giá trị toàn cục. Đổi bộ lọc toàn cục **ghi đè** mọi Local Filter. Đổi Local Filter chỉ tác động đúng widget đó, không lan sang widget khác hay lên toàn cục. ✅ (cả 2 luồng xác nhận).
- **BR-FLT-06.** Khi Local Filter khác toàn cục, widget phải có chỉ báo trực quan (ví dụ viền/nhãn "Đang lọc riêng: Miền Trung"). — P2, ❌.
- **BR-FLT-07.** Local Filter chỉ được thu hẹp **trong** phạm vi quyền của người dùng (MANAGER không chọn được cửa hàng khác).

### FR-FLT-03 — Bộ lọc đa chiều
Các nhóm: Ngành hàng & Thương hiệu · Khách hàng (Giới tính, Phân khúc hóa đơn) · Nhân sự (PIC Sales, KTV khúc xạ/mài lắp) · Trạng thái đơn.
- **BR-FLT-08.** Giá trị các dropdown lấy từ danh mục chủ (đủ ngành hàng gồm Áp tròng, Phụ kiện; PIC/KTV lấy theo danh sách nhân sự trong phạm vi). *(Hiện trạng: PIC/KTV chỉ có "Tất cả"; thiếu Áp tròng/Phụ kiện.)*
- **BR-FLT-09.** "Áp dụng bộ lọc" áp cho mọi widget có chiều dữ liệu tương ứng; widget không hỗ trợ một chiều đang lọc phải hiển thị nhãn "Không áp dụng bộ lọc: <chiều>".
- **BR-FLT-10.** Hiển thị badge số bộ lọc đang bật trên nút "Bộ lọc đa chiều" và nút "Xóa bộ lọc".
- **BR-FLT-11.** Phân khúc hóa đơn trong bộ lọc dùng **cùng dải** với widget Basket Size (QĐ-06).
- Hiện trạng: ❌ **toàn bộ panel không gắn với dữ liệu** — bấm "Áp dụng" không đổi số nào ở mọi trang.

### FR-FLT-04 — Gom nhóm theo Chu kỳ (bucketing)
| Chu kỳ | Quy tắc mục tiêu (QĐ-05) | Nhãn | Hiện trạng |
|---|---|---|---|
| Ngày | 1 điểm/ngày | `DD/MM` | ✅ (nhãn trục quá dày khi > 60 điểm — cần giãn nhãn) |
| Tuần | **Tuần lịch ISO (Thứ 2 – Chủ nhật)** | `Tuần N (DD/MM–DD/MM)` | ⚠️ cửa sổ 7 ngày tính từ "Từ ngày" |
| Tháng | Tháng lịch | `MM/YYYY` | ⚠️ nhãn thiếu năm; **mất tháng 2** khi Từ ngày = 29–31 |
| Quý | Quý lịch | `Qn/YYYY` | ⚠️ nhãn thiếu năm |
| Năm | Năm lịch | `YYYY` | ✅ |

- **BR-FLT-12 — Kỳ lẻ.** Kỳ đầu/cuối không đủ ngày (ví dụ "Quý 2" chỉ có tháng 6, "Tuần 18" chỉ 3 ngày) phải gắn nhãn "(một phần: n ngày)" và được **phân bổ mục tiêu theo số ngày thực** (BR-TGT-03). Biểu đồ cột không được so sánh trực tiếp kỳ lẻ với kỳ đủ mà không có chỉ báo.
- **AC-FLT-01** ⚠️ Given 31/01/2026–31/05/2026, Chu kỳ Tháng, Then trục có đủ 5 nhãn 01/2026…05/2026 (hiện thiếu tháng 2).
- **AC-FLT-02** ⚠️ Given 01/06–30/09/2026, Chu kỳ Quý, Then 2 cột "Q2/2026 (một phần: 30 ngày)" và "Q3/2026".

### 5.5. Ma trận tác động bộ lọc → widget
Ký hiệu: **M** = mục tiêu (to-be); **H** = hiện trạng. ✔ có tác động, ✘ không, — không áp dụng.

| Widget | Ngày M/H | Chu kỳ M/H | KV/CN M/H | Đa chiều M/H |
|---|---|---|---|---|
| 9 thẻ tài chính | ✔/✔ | —/— | ✔/**✘** | ✔/✘ |
| GMV vs DTT, Phân rã GMV, Hiệu quả đơn hàng, Tăng trưởng | ✔/✔ | ✔/✔ | ✔/✔ | ✔/✘ |
| Waterfall, Bảng xếp hạng | ✔/✔ | —/— | ✔/✔ | ✔/✘ |
| Xu hướng lũy kế | ✔/✔ | ✔/✔ | ✔/✔ (mục tiêu ✘) | ✔/✘ |
| Heatmap chi nhánh | ✔/✘ | (tab riêng)/✘ | ✔/✘ | —/— |
| Trang Vận hành (mọi widget) | ✔/✘ | ✔ nếu có trục thời gian/✘ | ✔/✘ | ✔/✘ |
| Product Growth | ✔/✔ | ✔/✔ | ✔/✘ | ✔/✘ |
| Các widget còn lại trang Sản phẩm | ✔/✘ | —/— | ✔/✘ | ✔/✘ |
| Trang Nhân sự | ✔/✘ | —/— | ✔/✘ | ✔ (PIC/KTV)/✘ |
| Trang KPI | — (lọc theo chu kỳ KPI riêng) | — | ✔ (phạm vi)/✘ | — |

---

## 6. Từ điển chỉ số & quy tắc nghiệp vụ chuẩn

> Đây là **nguồn chân lý duy nhất**. Mọi widget hiển thị một chỉ số phải dùng đúng định nghĩa ở đây; tên hiển thị khác nhau giữa các widget là **không được phép**. Các dòng có đánh dấu QĐ đang dùng **phương án PM đề xuất** và cần stakeholder chốt.

### 6.1. Định nghĩa doanh số đã chốt (QĐ-01) — văn bản chính thức

> **Phạm vi áp dụng:** định nghĩa dưới đây là **bắt buộc và duy nhất** cho mọi widget, tooltip (i), modal, bảng, API và báo cáo xuất ra của dashboard. Không widget nào được dùng công thức riêng hoặc tên gọi khác cho cùng khái niệm.

**Khái niệm nền**
- **Đơn lắp sẵn (mua thẳng)** — khách mua hàng có sẵn, thanh toán toàn bộ, thu ngân lên **Đơn hàng** ngay.
- **Đơn đặt** — khách cần đo mắt / cắt tròng / đặt mẫu không có sẵn, đặt cọc hoặc thanh toán trước. Khi hàng sẵn sàng và giao khách, Đơn đặt được xử lý thành **Đơn hàng** đi kèm.
- **Trạng thái Hoàn thành** — Đơn lắp sẵn: đã thanh toán và giao hàng. Đơn đặt: (a) đã ra Đơn hàng đi kèm và giao khách, **hoặc** (b) thu ngân bấm **"Kết thúc"** để hoàn thành mà **không** ra Đơn hàng nào.
- **Nghiệp vụ đổi hàng từ đơn đặt** — khách đã lên Đơn đặt và thanh toán nhưng muốn đổi sang hàng hóa khác: thu ngân bấm "Kết thúc" để hoàn thành Đơn đặt **không** kèm Đơn hàng, sau đó lên **Đơn hàng mới** cho hàng khách đổi. Đơn hàng mới được tính vào GMV như một đơn lắp sẵn, nên giá trị Đơn đặt đã "Kết thúc" phải được trừ ở Giá trị điều chỉnh để không tính trùng.
- **Trả hàng** — khách trả lại hàng của một đơn đã Hoàn thành.

**Định nghĩa**

> **GMV (Sức bán)** = tổng giá trị các **đơn hợp lệ** phát sinh trong kỳ, trong đó:
> - tính theo **giá khách cam kết trả**: đã trừ giảm giá trên đơn, **đã gồm VAT**;
> - **không** gồm phí vận chuyển;
> - ghi nhận theo **ngày tạo đơn**;
> - **chưa trừ** hoàn/hủy sau bán;
> - **chỉ tính đơn ở trạng thái Hoàn thành** (Đơn đặt và Đơn lắp sẵn); Đơn hàng sinh ra từ một Đơn đặt không được cộng lại.
>
> **Giá trị điều chỉnh** = − (giá trị **Trả hàng**) − (giá trị **Đơn đặt đã Hoàn thành nhưng không có Đơn hàng đi kèm**). Luôn ≤ 0.
>
> **Doanh thu thuần (DTT)** = GMV + Giá trị điều chỉnh.

**Hệ quả nghiệp vụ**
- **Đơn hủy** không bao giờ đạt trạng thái Hoàn thành → không vào GMV → không phải khoản điều chỉnh. "Hủy cọc" không còn là một bước của Waterfall.
- **Khoản Upsell/Downsell** (chênh lệch khi Đơn đặt chuyển thành Đơn hàng) **không** còn là thành phần của Giá trị điều chỉnh — xem 10.2 #2.
- **BR-GMV-01 — Số tạm tính.** Vì GMV ghi theo ngày tạo nhưng chỉ đếm đơn Hoàn thành, GMV của một kỳ **còn tăng** khi các Đơn đặt tạo trong kỳ đó hoàn thành sau này. Mọi kỳ còn Đơn đặt chưa hoàn thành phải gắn nhãn **"Tạm tính"**, kèm tooltip "Còn N đơn đặt / x Tr chưa hoàn thành". Kỳ đã đóng (không còn Đơn đặt mở) gắn nhãn "Chốt".
- **BR-GMV-02 — Ngày ghi nhận.**

| Khoản | Ngày ghi nhận |
|---|---|
| GMV (Đơn đặt, Đơn lắp sẵn) | Ngày tạo đơn |
| Trả hàng | Ngày trả hàng |
| Đơn đặt "Kết thúc" không ra Đơn hàng | Ngày tạo của Đơn đặt đó *(đề xuất — để khoản trừ triệt tiêu đúng kỳ đã ghi GMV; chờ xác nhận 10.2 #1)* |
| Doanh thu (thực thu) | Ngày thu tiền |
| Nợ treo | Số dư tại cuối ngày "Đến ngày" |

- **BR-GMV-03 — Giá trị dòng hàng.** Giá trị một đơn = Σ (đơn giá × số lượng − giảm giá dòng) − giảm giá cấp đơn, gồm VAT, không gồm phí vận chuyển. Cách phân bổ giảm giá cấp đơn xuống từng dòng (cần cho VAT theo sản phẩm) — xem 10.2 #9.

### 6.2. Bảng chỉ số tài chính & bán hàng
| Mã | Chỉ số (tên hiển thị chuẩn) | Định nghĩa | Công thức chuẩn | Đơn vị / định dạng | Chiều tốt | Hiện trạng (bằng chứng) |
|---|---|---|---|---|---|---|
| **M01** | GMV (Sức bán) | Theo văn bản mục 6.1 (QĐ-01) | Σ giá trị (giá cam kết sau giảm giá, gồm VAT, không phí ship) của Đơn đặt + Đơn lắp sẵn **trạng thái Hoàn thành**, theo **ngày tạo đơn**; Đơn hàng sinh ra từ Đơn đặt **không** cộng lại; nhãn "Tạm tính" theo BR-GMV-01 | Tự động (BR-FMT-02) | ↑ | ⚠️ nhất quán giữa các widget dùng engine, nhưng mock chưa có trạng thái đơn, phí ship, nhãn tạm tính |
| M01a | GMV trước VAT / VAT | Bóc tách VAT (QĐ-09) | VAT = Σ theo dòng hàng: giá trị dòng × t / (1 + t), với t = thuế suất cấu hình trên sản phẩm **tại thời điểm tạo đơn**; Trước VAT = GMV − VAT | Tự động | — | ❌ đang chia cố định cho 1,08 |
| **M02** | Đơn hàng (Volume) | Số đơn tạo nên GMV | COUNT(Đơn đặt + Đơn lắp sẵn) Hoàn thành theo ngày tạo, **trừ** Đơn đặt "Kết thúc" không ra Đơn hàng (để khớp M06 và không đếm trùng với Đơn hàng mới của nghiệp vụ đổi hàng — xác nhận 10.2 #4) | Đơn, phân cách nghìn | ↑ | ⚠️ cách đếm mock chưa theo trạng thái |
| **M03** | Khách hàng mới | Khách mua lần đầu trên toàn hệ thống trong kỳ | COUNT DISTINCT khách có đơn hợp lệ đầu tiên rơi vào kỳ | Khách, phân cách nghìn | ↑ | ⚠️ đang = 30% × số đơn; phụ đề "4-5 khách/ngày" hard-code |
| **M04** | Doanh thu (thực thu) | Tiền thực thu trong kỳ, trước hoàn/hủy | Σ tiền thu (cọc + thanh toán đơn lắp sẵn + thanh toán còn lại khi nhận kính + thu nợ) theo ngày thu | Tự động (BR-FMT-02) | ↑ | ❌ đang = GMV × 1,05 (hằng). *Lưu ý:* M04 **có thể** > GMV trong một kỳ (thu tiền của đơn kỳ trước) — điều này hợp lệ, nhưng phải là số thật |
| **M05** | Giá trị điều chỉnh | Phần GMV không thành doanh thu ròng (QĐ-01) | − Σ Trả hàng − Σ Đơn đặt Hoàn thành không có Đơn hàng đi kèm; luôn ≤ 0 | Tự động, dấu "−" | nghịch (độ lớn càng nhỏ càng tốt) | ❌ đang = −5% GMV cố định; % tăng trưởng hard-code 15,4%; phụ đề "Gồm Upsale & Hoàn/Hủy cọc" sai |
| **M06** | Doanh thu thuần (Net Revenue) | Giá trị bán ròng sau điều chỉnh | **GMV + Giá trị điều chỉnh** (M01 + M05) — QĐ-01 đã chốt | Tự động (BR-FMT-02) | ↑ | ❌ **3 công thức**: thẻ = netRev ngẫu nhiên 85–90% GMV (3.695 Tr); Waterfall = GMV − Hoàn/Hủy (4.005); Bảng xếp hạng = GMV × (1 − tỷ lệ băm theo tên CN) (3.876) |
| **M07** | Biên lợi nhuận gộp | Tỷ lệ lợi nhuận sau giá vốn | (DTT − Giá vốn hàng bán) / DTT × 100, **tính trên tổng kỳ** (gia quyền), không lấy trung bình theo ngày | %, 1 số lẻ | ↑ | ⚠️ đang = trung bình đơn giản biên ngày, không có giá vốn; phụ đề "trên doanh số gộp" sai |
| **M08** | AOV (Giá trị đơn TB) | Giá trị trung bình mỗi đơn | DTT / Volume (M06 / M02) — QĐ-02; **một định nghĩa duy nhất** cho mọi widget | Tự động (BR-FMT-02; thường là ₫, vd 713.200 ₫) | ↑ | ❌ 3 giá trị: thẻ 0,7 Tr (DTT/đơn, làm tròn quá thô); Hiệu quả đơn hàng 813.773 ₫ (GMV/đơn); Tăng trưởng 814.904 ₫ (TB không gia quyền) |
| **M09** | UPT (SL sản phẩm/đơn) | Số sản phẩm trung bình mỗi đơn | Σ số lượng SP / Volume | SP/đơn, 2 số lẻ | ↑ | ✅ (chưa có trong FRS → bổ sung) |
| **M10** | Nợ treo | Công nợ khách chưa thu tại thời điểm cuối kỳ | **Số dư** dư nợ dương trên sổ cái khách hàng tại cuối ngày "Đến ngày" (snapshot) — QĐ-03 | Tự động; phụ: % so với GMV kỳ | chỉ số nghịch (↓ tốt) | ⚠️ đang cộng dồn luồng phát sinh theo ngày (1,2–1,8% GMV) |
| **M11** | Tỷ trọng nguồn GMV | Cơ cấu Đơn lắp sẵn vs Đơn đặt trước | GMV từng nguồn / GMV × 100; tổng 2 nguồn = 100% và = M01 | % làm tròn, ép tổng 100 | — | ✅ |
| **M12** | Tỷ lệ trả hàng (giá trị) | | Σ giá trị Trả hàng / GMV × 100 *(đơn hủy không thuộc GMV nên không có "tỷ lệ hủy" trong nhóm doanh số)* | %, 1 số lẻ | ↓ | ❌ 3 định nghĩa: 5% cố định (engine), "Tỷ lệ trả hàng" băm 5–18,5% theo tên CN (Bảng xếp hạng), 1,2% tĩnh (Vận hành) |
| **M13** | Tỷ lệ trả hàng (hóa đơn) | | Số đơn có trả hàng / Volume × 100 | %, 1 số lẻ | ↓ | ⚠️ 1,5% tĩnh |
| **M13b** | Tỷ lệ đổi hàng từ đơn đặt | Đơn đặt "Kết thúc" không ra Đơn hàng | Σ giá trị Đơn đặt kết thúc không ra Đơn hàng / GMV × 100 | %, 1 số lẻ | ↓ | ❌ chưa có |
| **M14** | Tỷ lệ chuyển đổi cửa hàng | Lượt khách vào cửa hàng ra đơn | Số đơn / Traffic × 100; Traffic do cửa hàng nhập tay hoặc import Excel (QĐ-11, QĐ-13); chỉ kênh cửa hàng, kênh online tách riêng — QĐ-04 | %, 1 số lẻ | ↑ | ❌ 4 thang khác nhau (Heatmap 20–94%, biểu đồ Conversion 8,5–45% có cả Shopee/TikTok, Benchmark điểm 60–100, KPI 60–70%) |
| **M15** | Tỷ lệ chuyển đổi KTV | Ca đo mắt dẫn tới mua hàng | Số ca đo mắt có đơn trong 7 ngày / Tổng ca đo mắt × 100 | % | ↑ | ⏸ chưa có dữ liệu ca đo mắt (QĐ-13) — ngoài phạm vi bản 1 |
| **M16** | % đạt mục tiêu | | Thực tế lũy kế / Mục tiêu phân bổ (BR-TGT) × 100 | %, 0 số lẻ | ↑ | ❌ mục tiêu hard-code, không nối module KPI |
| **M17** | Tăng trưởng % | | (Kỳ gốc − Kỳ so sánh) / Kỳ so sánh × 100 (BR-CMP) | %, 1 số lẻ | theo chỉ số | ⚠️ đúng ở thẻ; sai ở biểu đồ Tăng trưởng & Product Growth |

**Quan hệ ràng buộc (dùng làm kiểm thử tự động):**
- `M06 = M01 + M05` cho mọi bộ lọc.
- `M05 = −(Trả hàng) − (Đơn đặt kết thúc không ra Đơn hàng)`, và Waterfall có đúng 2 cột giảm trừ tương ứng.
- Không đơn nào ở trạng thái khác Hoàn thành được góp vào M01/M02.
- `Waterfall.cột cuối = M06 (thẻ) = điểm cuối lũy kế DTT (Xu hướng) = tổng cột DTT (Bảng xếp hạng)`.
- `Σ M01 theo chi nhánh = M01 theo khu vực = M01 toàn hệ thống` (cùng khoảng ngày).
- `M11(lắp sẵn) + M11(đặt trước) = 100%` và `GMV lắp sẵn + GMV đặt trước = M01`.
- `M08 × M02 = M06` (sai số làm tròn ≤ 1 đơn vị hiển thị).
- Tổng doanh thu ở trang Vận hành, Sản phẩm, Nhân sự (cùng bộ lọc) **không được vượt** M01/M06 của trang Tổng quan. *(Hiện trạng vi phạm nặng: Nhân khẩu học 67,8 Tỷ, Đa chiều 45,2 Tỷ, Chiến dịch 33,2 Tỷ, 5 PIC 5,55 Tỷ so với GMV 4,22 Tỷ.)*

### 6.3. Quy tắc so sánh kỳ (BR-CMP)
- **BR-CMP-01 — Kỳ so sánh mặc định.** Với kỳ gốc `[S, E]` có `n` ngày (tính cả 2 đầu), kỳ so sánh là `[S − n, S − 1]` (liền kề, cùng số ngày). ✅ thẻ tài chính.
- **BR-CMP-02 — Tăng trưởng tổng.** "Tăng trưởng chung" của một widget = (Σ kỳ gốc − Σ kỳ so sánh) / Σ kỳ so sánh, với kỳ so sánh theo BR-CMP-01. Con số này **không phụ thuộc** cách gom nhóm Chu kỳ và **phải bằng** % trên thẻ tương ứng. ❌ *(Hiện trạng: "Kỳ trước" của mỗi bucket = Kỳ này ÷ hệ số ngẫu nhiên 0,82–1,18 seed theo ngày bắt đầu bucket, nên tăng trưởng chung chỉ là trung bình gia quyền các hệ số ngẫu nhiên → −1,2% / −1,4% / −2,1% / +16,1% / +13,7% cho Ngày/Tuần/Tháng/Quý/Năm, trong khi thẻ +21,7%. Ngày/Tuần nhiều bucket nên tiến về ~0%; Năm chỉ 1 bucket = hệ số 1,137.)*
- **BR-CMP-03 — Tăng trưởng từng bucket.** Mỗi bucket so với bucket liền trước **cùng độ dài** (tuần với tuần trước, tháng với tháng trước). Tùy chọn so cùng kỳ năm trước (YoY) — P2.
- **BR-CMP-04 — Mẫu số 0.** Kỳ so sánh = 0 → hiển thị "—" (không tính được), không hiển thị "0,0%" hay "+∞".
- **BR-CMP-05 — Mũi tên & màu.** **Mũi tên thể hiện chiều thay đổi của giá trị** (↑ khi tăng, ↓ khi giảm). **Màu thể hiện tốt/xấu** theo cột "Chiều tốt": chỉ số thuận tăng = xanh; chỉ số nghịch (Nợ treo, Tỷ lệ trả hàng, Tỷ lệ đổi hàng, |Giá trị điều chỉnh|) tăng = đỏ. ❌ *(Hiện trạng: thẻ Nợ treo hiện "↓ 20,9%" màu đỏ trong khi nợ đang tăng.)*
- **BR-CMP-06 — Chân thẻ.** Mỗi thẻ hiển thị khoảng kỳ gốc và kỳ so sánh dạng `DD/MM/YYYY — DD/MM/YYYY` (FRS 4.5.4). ❌ *(Hiện trạng: luôn "01/09 — 30/09/2026".)*
- **BR-CMP-07 — Thay đổi tỷ lệ.** Với chỉ số là tỷ lệ (Biên LN, các tỷ lệ chuyển đổi/hoàn), thay đổi hiển thị theo **điểm phần trăm** ("+0,3 điểm %"), không theo % tương đối. ⚠️

### 6.4. Quy tắc mục tiêu (BR-TGT)
- **BR-TGT-01 — Nguồn duy nhất.** Mọi mục tiêu hiển thị trên dashboard (Run-rate, Heatmap % Target, Bảng xếp hạng chi nhánh/khu vực) lấy từ KPI cấp Công ty / Khu vực / Chi nhánh (không có KPI cá nhân — QĐ-08) có trạng thái **"Đang áp dụng"** trong module Quản lý KPI. ❌ *(Hiện trạng: 42 Tr/ngày GMV, 35 Tr/ngày DTT, trần nợ 1,5%, chỉ tiêu heatmap tự sinh, mục tiêu PIC ngầm 2 Tỷ.)*
- **BR-TGT-02 — Co theo phạm vi.** Mục tiêu của một phạm vi = KPI của đúng phạm vi đó; nếu không có thì bằng tổng KPI các phạm vi con (chi nhánh → khu vực → công ty). ❌ *(Hiện trạng: chọn Miền Bắc vẫn so với mục tiêu toàn hệ thống 5.082 Tr → "chậm −71%".)*
- **BR-TGT-03 — Phân bổ theo ngày.** Khi khoảng ngày không trùng chu kỳ KPI, mục tiêu được phân bổ **theo số ngày** (mặc định đều theo ngày; nâng cao: theo trọng số mùa vụ/cuối tuần — P2). Đường tiến độ chuẩn (paced) tích lũy theo **số ngày thực** của từng bucket. ⚠️ *(Hiện trạng: chia đều theo số bucket — tuần 3 ngày nhận đủ 1/18 mục tiêu; số ngày tính thiếu 1.)*
- **BR-TGT-04 — Thứ tự ưu tiên khi chồng lấn.** KPI Chiến dịch/Lễ ghi đè KPI tháng trong các ngày của chiến dịch; mục tiêu phần còn lại của tháng phân bổ theo ngày (QĐ-08 đã chốt).
- **BR-TGT-05 — Không có KPI.** Hiển thị "Chưa thiết lập mục tiêu" và ẩn đường tiến độ/% đạt; không dùng giá trị mặc định ngầm.
- **BR-TGT-06 — YTD.** Nhãn "YTD/Lũy kế năm" chỉ được dùng khi lũy kế tính từ 01/01. Lũy kế tính từ "Từ ngày" phải gắn nhãn "Lũy kế trong kỳ". ⚠️

### 6.5. Dữ liệu chủ & tính xác định (BR-MD, BR-DATA)
- **BR-MD-01 — Danh mục khu vực/chi nhánh duy nhất** lấy từ hệ thống nguồn, dùng chung cho bộ lọc, Heatmap, Benchmark, Anomaly, KPI, Conversion. ❌ *(Hiện trạng: Bộ lọc dùng Miền Bắc/Trung/Nam + 5 chi nhánh; Heatmap/Benchmark/Anomaly/KPI dùng Hồ Chí Minh/Miền Bắc/Miền Trung/Đông Nam Bộ; Heatmap có 80 chi nhánh tự sinh; Conversion dùng tên thật như "HMK BÌNH DƯƠNG"; chip MANAGER "HMK ĐN LÊ DUẨN 2" không thuộc danh sách bộ lọc.)* — cấu trúc vùng cần chốt (QĐ-04).
- **BR-MD-02 — Kênh bán.** Phân biệt **kênh cửa hàng** và **kênh online** (Shopee, TikTok…). Chỉ số dựa trên Traffic cửa hàng (M14), Time Peak, KTV chỉ áp dụng kênh cửa hàng.
- **BR-MD-03 — Danh mục sản phẩm.** Ngành hàng chuẩn: Gọng kính, Tròng kính, Kính mát, Kính áp tròng, Phụ kiện & Vật tư; dùng cùng tên ở mọi widget ("Áp tròng" ≡ "Kính áp tròng (Lens)" → chọn một).
- **BR-DATA-01 — Tính xác định.** Cùng bộ lọc + cùng thời điểm dữ liệu → mọi widget cho **cùng một số** giữa các lần chuyển tab hoặc F5. Cấm sinh số ngẫu nhiên phía client. ❌ *(Time Peak và Anomaly đổi khi quay lại tab; Benchmark đổi sau F5; Product Growth đổi khi đổi tab chiều.)*
- **BR-DATA-02 — Quy mô nhất quán.** Xem ràng buộc cuối mục 6.2.

### 6.6. Định dạng hiển thị (BR-FMT)
- **BR-FMT-01.** Locale **vi-VN** cố định: phân cách nghìn bằng dấu chấm, thập phân bằng dấu phẩy (`5.181`, `21,7%`, `2,35`). Không phụ thuộc locale trình duyệt. ❌ *(Hiện lẫn "4,200", "15,037", "−12.7%", "2.35", "16.0Tr", "1554".)*
- **BR-FMT-02 — Đơn vị tiền tự động (QĐ-01).** Mỗi con số tự chọn đơn vị theo độ lớn để luôn hiển thị chính xác, không hiển thị số nhỏ hơn 1 ở đơn vị lớn:

| Độ lớn \|x\| | Đơn vị | Số lẻ | Ví dụ |
|---|---|---|---|
| ≥ 1 tỷ | Tỷ | 2 | 4,22 Tỷ |
| 1 triệu – < 1 tỷ | Tr | 0 (1 số lẻ nếu < 10 Tr) | **500 Tr** (không hiển thị "0,50 Tỷ"); 6,3 Tr |
| < 1 triệu | ₫ | 0, phân cách nghìn | 713.200 ₫ |

  - Trên **một trục biểu đồ** hoặc **một cột của bảng**, mọi giá trị dùng chung một đơn vị, chọn theo giá trị có độ lớn lớn nhất, để so sánh được bằng mắt; thẻ KPI, tooltip và nhãn đơn lẻ chọn đơn vị riêng cho từng số.
  - Tooltip và modal chi tiết luôn kèm giá trị đầy đủ bằng ₫ (vd "4,22 Tỷ — 4.216.384.000 ₫").
  - Nếu làm tròn khiến hai giá trị khác nhau trong cùng widget hiển thị giống nhau, tăng thêm 1 số lẻ.
  - Chỉ dùng ký hiệu `Tỷ`, `Tr`, `₫`; cấm "T", "M", "B", "k", "đ", "Triệu".
- **BR-FMT-03.** Số âm hiển thị dấu "−" phía trước; không hiển thị dạng "+-x%" hay "--x".
- **BR-FMT-04.** Không bao giờ hiển thị `NaN`, `undefined`, `Infinity` hoặc khóa kỹ thuật (`value`, `rate`) — thay bằng "—" hoặc nhãn nghiệp vụ.
- **BR-FMT-05.** Thuật ngữ thống nhất: "Tỷ lệ" (không "Tỉ lệ"), "Doanh thu thuần" (không dùng "Thực thu" làm tên chỉ số khác), "Đơn lắp sẵn (mua thẳng)".

---

## 7. Đặc tả chức năng theo trang

Mỗi tính năng: **Mục đích → Mô tả & tương tác → Quy tắc nghiệp vụ → Tiêu chí chấp nhận → Hiện trạng & gap.**

### 7.1. Trang Tổng quan (Executive View) — chỉ BOD
Thứ tự hiển thị: (1) 9 thẻ tài chính → (2) GMV vs DTT | Waterfall → (3) Hiệu quả đơn hàng → (4) Phân rã nguồn GMV → (5) Xu hướng lũy kế & Tiến độ kế hoạch → (6) Bảng xếp hạng → (7) Bản đồ hiệu suất chi nhánh → (8) Phân tích Tăng trưởng.

#### FR-EX-01 — Thẻ chỉ số tài chính (9 thẻ)
**Mục đích:** bức tranh tài chính tổng hợp của phạm vi đang lọc, so với kỳ trước.
**Mô tả:** Hàng trên 5 thẻ: GMV (Sức bán) · Khách hàng mới · Doanh thu · Giá trị điều chỉnh · Doanh thu thuần. Hàng dưới 4 thẻ: Nợ treo · Biên lợi nhuận gộp · Đơn hàng (Volume) · AOV. Mỗi thẻ có: giá trị + đơn vị, phụ đề, % so kỳ trước (mũi tên + màu), sparkline theo ngày, chân thẻ khoảng ngày, icon (i) với định nghĩa + công thức.
**Quy tắc:** M01–M10 (mục 6.2); BR-CMP-01, 04, 05, 06, 07; phụ đề thẻ GMV và AOV hiển thị bóc tách Trước VAT | VAT (M01a); phụ đề Nợ treo "Chiếm x,x% GMV".
**Tương tác:** hover (i) **trên icon** (không phải toàn thẻ) hiện tooltip; hover sparkline hiện giá trị ngày (P2).

| AC | Nội dung | Hiện trạng |
|---|---|---|
| AC-EX01-01 | Given bộ lọc mặc định, Then hiển thị 9 thẻ đúng thứ tự trên với giá trị, đơn vị, phụ đề, % so kỳ trước, sparkline, chân thẻ | ⚠️ chân thẻ sai |
| AC-EX01-02 | Given BOD chọn Khu vực "Miền Bắc", Then cả 9 thẻ chỉ phản ánh Miền Bắc (GMV thẻ = GMV Miền Bắc ở biểu đồ GMV vs DTT) | ❌ thẻ giữ 4,22 Tỷ khi biểu đồ = 1.476 Tr |
| AC-EX01-03 | Given khoảng [S, E], Then % tăng trưởng = so với [S − n, S − 1]; chân thẻ hiển thị cả 2 khoảng | ⚠️ công thức đúng, chân thẻ hard-code |
| AC-EX01-04 | Then thẻ DTT = thẻ GMV + thẻ Giá trị điều chỉnh (sai số làm tròn ≤ 0,01 Tỷ) và công thức trong (i) tái tạo được con số | ❌ 3,70 ≠ 4,22 − 0,211 |
| AC-EX01-05 | Then thẻ AOV = DTT / Volume, hiển thị đủ độ chính xác (₫ hoặc Tr 2 số lẻ) | ⚠️ "0,7 Tr" quá thô |
| AC-EX01-06 | Given Nợ treo kỳ này > kỳ trước, Then mũi tên ↑ màu đỏ | ❌ hiện ↓ đỏ |
| AC-EX01-07 | Then % tăng trưởng của "Giá trị điều chỉnh" được tính thật theo BR-CMP | ❌ luôn 15,4% |
| AC-EX01-08 | Then phụ đề "Khách hàng mới" = Khách mới / số ngày của kỳ (vd "Bình quân 12,7 khách/ngày") | ❌ "4-5 khách/ngày" hard-code |
| AC-EX01-09 | Given khoảng ngày không hợp lệ, Then thẻ hiển thị "—" và thanh lọc báo lỗi (BR-FLT-02) | ❌ hiện NaN |
| AC-EX01-10 | Then thay đổi Biên LN gộp hiển thị theo điểm % | ⚠️ |
| AC-EX01-11 | Given lọc 1 chi nhánh 1 tháng có GMV = 512.300.000 ₫, Then thẻ GMV hiển thị "512 Tr" (không "0,51 Tỷ"); AOV hiển thị dạng "713.200 ₫"; tooltip kèm giá trị đầy đủ bằng ₫ (BR-FMT-02) | ❌ đơn vị cố định Tỷ/Tr |
| AC-EX01-12 | Then phụ đề thẻ Giá trị điều chỉnh là "Gồm Trả hàng & Đổi hàng từ đơn đặt", và tooltip (i) nêu đúng định nghĩa mục 6.1 | ❌ "Gồm Upsale & Hoàn/Hủy cọc" |
| AC-EX01-13 | Given kỳ còn Đơn đặt chưa hoàn thành, Then thẻ GMV, DTT, Volume, AOV gắn nhãn "Tạm tính" (BR-GMV-01) | ❌ |
| AC-EX01-14 | Given đơn có sản phẩm thuế suất 8% và 10%, Then "VAT" trên thẻ GMV = Σ VAT theo từng dòng với thuế suất tại ngày tạo đơn (QĐ-09) | ❌ chia cố định 1,08 |

#### FR-EX-02 — Tương quan GMV vs Doanh thu thuần
**Mục đích:** theo dõi khoảng chênh giữa sức bán và giá trị ròng theo thời gian.
**Mô tả:** Cột GMV + đường DTT theo Chu kỳ; nhãn "−x,x%" trên đỉnh cột = (GMV − DTT)/GMV; trục Y co giãn; Local Filter.
**Quy tắc:** M01, M06; % chênh = (M01 − M06)/M01. **Trục Y của biểu đồ cột phải bắt đầu từ 0**; nếu cần phóng to biến động thì dùng đường (line), không dùng cột (BR-VIZ-01, mục 8). Tên widget: "GMV vs Doanh thu thuần theo kỳ" (không gọi "lũy kế" như FRS cũ vì đây là giá trị từng kỳ).
- **AC-EX02-01** ✅ Given Chu kỳ Tháng, 01/06–30/09, Then 4 cột Tháng 6–9 với nhãn % chênh.
- **AC-EX02-02** ✅ When hover cột, Then tooltip: GMV, DTT, Chênh lệch (Tr) và %.
- **AC-EX02-03** ⚠️ Then trục Y bắt đầu tại 0 (hiện có trường hợp 10–110 Tr, 600–1.500 Tr, 3.200–4.800 Tr).
- **AC-EX02-04** ⚠️ Then công thức trong (i) khớp M06 (hiện ghi "GMV − Hoàn/Hủy − Rớt đơn", không có "Rớt đơn" trong dữ liệu).

#### FR-EX-03 — Thác nước Doanh thu (Waterfall)
**Mục đích:** giải thích hành trình từ GMV tới Doanh thu thuần.
**Mô tả (QĐ-01):** 4 cột: **Tổng GMV** → **−Trả hàng** → **−Đổi hàng từ đơn đặt** (Đơn đặt "Kết thúc" không ra Đơn hàng) → **Doanh thu thuần**. Tổng theo cả khoảng ngày (không theo Chu kỳ). Thay cấu trúc 3 cột "GMV → Hoàn/Hủy → Thực thu" tại BRAINSTORM §2.
**Quy tắc:** cột đầu = M01; cột cuối = M06; 2 cột giữa là 2 thành phần của M05; tooltip mỗi cột giảm trừ hiển thị giá trị, % so với GMV và số đơn; đơn vị theo BR-FMT-02.
- **AC-EX03-01** ⚠️ Given bộ lọc bất kỳ, Then cột "Doanh thu thuần" = thẻ DTT = điểm cuối lũy kế DTT. *(Hiện 4.005 vs 3.695 Tr.)*
- **AC-EX03-02** ✅ When hover cột cuối, Then tooltip "+N Tr (bằng x,x% GMV)".
- **AC-EX03-03** ✅ When đổi Chu kỳ, Then Waterfall không đổi.
- **AC-EX03-04** ⚠️ Then nhãn trục X/Y hiển thị đầy đủ, không bị cắt; trục Y có phân cách nghìn. *(Hiện cắt "000Tr", "ổng GMV".)*
- **AC-EX03-05** ⚠️ Then tỷ lệ Trả hàng và Đổi hàng khác nhau theo chi nhánh/kỳ theo dữ liệu thật. *(Hiện cột "Hoàn/Hủy" luôn đúng 5,0% ở mọi phạm vi.)*
- **AC-EX03-06** ❌ Then Waterfall có đúng 4 cột theo thứ tự Tổng GMV → Trả hàng → Đổi hàng từ đơn đặt → Doanh thu thuần, và tổng 2 cột giảm trừ = thẻ Giá trị điều chỉnh.

#### FR-EX-04 — Hiệu quả đơn hàng: AOV – Volume – UPT *(chưa có trong FRS — bổ sung)*
**Mục đích:** theo dõi 3 đòn bẩy doanh thu: số đơn, giá trị đơn, số SP/đơn.
**Mô tả:** 3 thẻ tóm tắt (AOV TB, Volume TB/kỳ + tổng, UPT TB) và 3 chế độ xem: (a) "Phóng to trục Y" — 3 biểu đồ riêng có đường trung bình, cột Volume ≥ TB tô đậm; (b) "Combo" — cột Volume + đường AOV + đường UPT, chọn "Cả 2 / Chỉ AOV / Chỉ UPT"; (c) "Độ lệch % so với TB" — cột phân kỳ cho AOV/UPT/Volume. Local Filter, modal chi tiết.
**Quy tắc:** AOV dùng **M08** (một định nghĩa); AOV TB toàn kỳ là **bình quân gia quyền** (ΣDTT/ΣĐơn); UPT = M09; độ lệch % = (giá trị kỳ − TB)/TB. "Biến thiên" = (max − min)/min, đổi nhãn thành "Biên độ" (không dùng "±").
- **AC-EX04-01** ⚠️ Then AOV trên widget = AOV trên thẻ tài chính cùng bộ lọc. *(Hiện 813.773 ₫ vs 0,7 Tr.)*
- **AC-EX04-02** ⚠️ Given Combo + "Cả 2", Then AOV và UPT mỗi chuỗi có trục riêng và đều nhìn thấy được. *(Hiện UPT phẳng sát 0.)*
- **AC-EX04-03** ✅ Given chế độ Độ lệch %, Then mọi cột xuất phát từ đường 0%. *(Đã đối chiếu chéo: lần đo UI đầu tiên chụp lúc animation 0,4 s khi đổi tab chỉ số; đo lại sau 2 s, mọi cột neo đúng 0%. Ghi chú P2: cột "bay" 0,4 s giữa các tab.)*
- **AC-EX04-03b** ⚠️ Then giá trị trung bình dùng để tính độ lệch không bị méo bởi kỳ lẻ: bucket không đủ ngày (vd Tuần 18 chỉ 3 ngày, −61,5%) được chuẩn hóa theo số ngày hoặc loại khỏi trung bình (BR-FLT-12).
- **AC-EX04-04** ✅ Then tổng Volume trong modal = "Tổng" trên thẻ Volume; ΣGMV modal = "Tổng GMV đóng góp".
- **AC-EX04-05** ⚠️ Then icon (i) hiển thị định nghĩa + công thức (hiện hộp rỗng).
- **AC-EX04-06** ⚠️ Then nhãn trục X không chồng chéo ở mọi Chu kỳ (giãn nhãn tự động).
- **AC-EX04-07** ⚠️ "Nhận xét trực quan" sinh từ dữ liệu (kỳ cao/thấp nhất), không phải văn bản tĩnh — P2.

#### FR-EX-05 — Phân rã nguồn hình thành GMV
**Mục đích:** cơ cấu GMV giữa Đơn lắp sẵn và Đơn đặt trước.
**Mô tả:** cột chồng 2 nguồn + đường Tổng GMV; nhãn % trong từng khúc; Local Filter.
**Quy tắc:** M11; tổng 2 khúc = M01 của bucket.
- **AC-EX05-01** ✅ Then % 2 khúc cộng = 100% và chiều cao cột = Tổng GMV bucket.
- **AC-EX05-02** ✅ Then ΣGMV các bucket = thẻ GMV cùng phạm vi.
- **AC-EX05-03** ⚠️ Then tỷ trọng thay đổi theo chi nhánh thực tế. *(Hiện giống hệt ở mọi KV/CN vì dữ liệu khu vực = tổng × hệ số.)*
- **AC-EX05-04** ⚠️ Then nhãn % không chồng nhau ở chế độ Ngày (ẩn nhãn khi cột quá hẹp); vạch trục đều nhau.

#### FR-EX-06 — Xu hướng lũy kế & Tiến độ kế hoạch (Run-rate)
**Mục đích:** biết đang vượt hay chậm so với kế hoạch để can thiệp sớm.
**Mô tả:**
- Chế độ "Tiến độ kế hoạch" — "Đồng bộ cả 3": 3 thẻ (GMV lũy kế, DTT lũy kế, Nợ treo lũy kế) + 3 biểu đồ nhỏ (lũy kế thực tế vs đường tiến độ chuẩn) đồng bộ hover; nút phóng to từng chỉ số; "← Quay lại xem đồng bộ cả 3".
- Chế độ "Combo": cột phát sinh từng kỳ + đường lũy kế + đường kế hoạch. Khi vào Combo từ "Đồng bộ cả 3" → tự chọn GMV và ẩn nút "Đồng bộ cả 3".
- Pill trạng thái GMV: "vượt tiến độ +x%" (xanh) / "chậm tiến độ −x%" (đỏ); hộp "Nhận xét tiến độ"; Local Filter; modal chi tiết.
**Quy tắc:** BR-TGT-01…06. % lệch tiến độ = (lũy kế − tiến độ chuẩn)/tiến độ chuẩn. Trần nợ an toàn = tham số cấu hình, mặc định 1,5% GMV kế hoạch (QĐ-03). Trạng thái Nợ: ≤ trần → "An toàn" (xanh); > trần → "Vượt trần" (đỏ).
- **AC-EX06-01** ✅ Then 3 thẻ + 3 biểu đồ đồng bộ; hover 1 biểu đồ → 2 biểu đồ còn lại hiện tooltip cùng mốc.
- **AC-EX06-02** ✅ When bấm phóng to "Công nợ", Then chỉ còn biểu đồ Công nợ với đường "Trần an toàn" và nút quay lại.
- **AC-EX06-03** ✅ When vào Combo từ "Đồng bộ cả 3", Then chọn "Sức bán GMV" và ẩn "Đồng bộ cả 3".
- **AC-EX06-04** ❌ Given KPI "Đang áp dụng" cho Miền Bắc tháng 7 = X, When lọc Miền Bắc, 01/07–31/07, Then Mục tiêu GMV = X và % đạt = lũy kế/X.
- **AC-EX06-05** ❌ Given không có KPI cho phạm vi, Then hiển thị "Chưa thiết lập mục tiêu", ẩn pill và đường kế hoạch.
- **AC-EX06-06** ⚠️ Given bucket cuối chỉ 3 ngày, Then tiến độ chuẩn tăng thêm đúng 3/122 mục tiêu (không phải 1/18).
- **AC-EX06-07** ❌ Given Nợ lũy kế > trần, Then nhãn "Vượt trần" màu đỏ và chênh lệch hiển thị "+x Tr vượt trần". *(Hiện thẻ luôn "(An toàn)" xanh; tooltip biểu đồ Công nợ còn hiển thị "+x% (Vượt tiến độ)" **màu xanh** khi nợ vượt đường kế hoạch — áp sai quy tắc chỉ số thuận cho chỉ số nghịch, BR-CMP-05.)*
- **AC-EX06-08** ⚠️ Then (i) có nội dung; định dạng % thống nhất dấu phẩy.

#### FR-EX-07 — Bảng xếp hạng hiệu suất
**Mục đích:** so sánh đóng góp và chất lượng doanh thu giữa chi nhánh/khu vực, và tiến độ so với chỉ tiêu.
**Mô tả (to-be, hợp nhất FRS + hiện trạng):** 2 tab **Chi nhánh/Khu vực** (hiện có) và **Sản phẩm** (FRS yêu cầu, chưa có). Cột: #, Tên, GMV, Tỷ trọng GMV, Doanh thu thuần, Tỷ trọng DTT, **% đạt chỉ tiêu** (FRS, chưa có — chỉ tab Chi nhánh/Khu vực vì không có KPI sản phẩm), Tỷ lệ trả hàng. Mặc định Top 5, có "Xem tất cả". Dòng tổng ghi đúng phạm vi ("Tổng Hệ thống" / "Tổng Miền Bắc" / "Tổng HMK HN CN1"). Cho phép sort theo cột (P2).
**Quy tắc:** cột Doanh thu thuần = **M06** (không dùng công thức riêng); Tỷ lệ trả hàng = **M12**; tô đỏ khi M12 > ngưỡng cấu hình (QĐ-03, mặc định 12%); sắp xếp GMV giảm dần; toggle Khu vực/Chi nhánh chỉ hiện khi Local KV = "Tất cả".
- **AC-EX07-01** ⚠️ Then tổng cột Doanh thu thuần = thẻ DTT. *(Hiện 3.876 vs 3.695.)*
- **AC-EX07-02** ✅ Then sắp xếp GMV giảm dần, tỷ trọng cộng 100%.
- **AC-EX07-03** ✅ Given Local KV = Miền Nam, Then toggle ẩn và chỉ hiện chi nhánh Miền Nam.
- **AC-EX07-04** ⚠️ Given chọn 1 chi nhánh, Then dòng tổng ghi tên phạm vi đúng. *(Hiện "Tổng Hệ Thống"/"Tổng Miền Bắc" sai phạm vi.)*
- **AC-EX07-05** ❌ Then có tab Top 5 Sản phẩm theo DTT; tab Chi nhánh/Khu vực có cột % đạt chỉ tiêu (theo KPI chi nhánh/khu vực).
- **AC-EX07-06** ⚠️ Then Tỷ lệ trả hàng từng dòng lấy từ dữ liệu thật và thay đổi theo khoảng ngày. *(Hiện băm theo tên chi nhánh, cố định.)*

#### FR-EX-08 — Bản đồ hiệu suất chi nhánh (Heatmap)
**Mục đích:** nhận diện nhanh chi nhánh × thời điểm yếu/mạnh.
**Mô tả (hiện trạng được chấp nhận thay cho "thanh ngang" trong FRS — QĐ-11):** bảng nhiệt, hàng = chi nhánh (hoặc khu vực), cột = kỳ; chỉ số: % Target, Doanh thu, Traffic, Tỷ lệ chuyển đổi; toggle Chi nhánh/Khu vực; lọc theo khu vực; kỳ Ngày/Tuần/Tháng; chú thích màu theo chỉ số; tooltip ô; "Nhập Traffic".
**Quy tắc:**
- Danh mục chi nhánh/khu vực theo BR-MD-01; khoảng ngày & phạm vi theo bộ lọc toàn cục; kỳ Tuần/Tháng là **giá trị gộp** (Σ Doanh thu, Σ Traffic, Σ Đơn; % Target = ΣDT/ΣChỉ tiêu; Tỷ lệ CĐ = ΣĐơn/ΣTraffic).
- % Target theo BR-TGT; Tỷ lệ CĐ = M14.
- Thang màu % Target: ≥ 80% xanh · 60% – < 80% vàng · < 60% đỏ (11 sắc độ chi tiết như hiện trạng). Tỷ lệ CĐ: ≥ 75% xanh · 50% – < 75% vàng · < 50% đỏ. **Chú thích phải ghi đúng biên "≥"** (hiện ghi ">80%").
- Traffic là **dữ liệu nhập** (QĐ-13): nhập tay trên lưới "Nhập Traffic" hoặc **import Excel** (FR-IMP-01). Chỉ số nguyên ≥ 0; quyền: MANAGER cho cửa hàng mình, BOD mọi cửa hàng; dữ liệu **được lưu**, có lịch sử người sửa (QĐ-11).
- Ô thiếu Traffic: chỉ số Traffic và Tỷ lệ CĐ hiển thị "—" với màu trung tính, kèm tooltip "Chưa nhập Traffic" (không tính 0%).
- **AC-EX08-01** ❌ Given bộ lọc 01/09–30/09, Miền Nam, Then heatmap chỉ hiện chi nhánh Miền Nam và các ngày tháng 9.
- **AC-EX08-02** ❌ Given kỳ Tuần, Then ô = giá trị gộp 7 ngày của tuần đó. *(Hiện ô "Tuần k" = ô ngày "k/7"; chỉ tiêu cùng quy mô 400–649 Tr cho cả Ngày/Tuần/Tháng.)*
- **AC-EX08-03** ✅ Given chỉ số Tỷ lệ CĐ, When hover ô, Then tooltip có Tỷ lệ CĐ, Số đơn/Traffic, quy tắc màu.
- **AC-EX08-04** ⚠️ When nhập Traffic −10 hoặc để trống, Then báo lỗi, không nhận. *(Hiện nhận → CR −240%.)*
- **AC-EX08-05** ❌ When nhập Traffic hợp lệ và F5, Then giá trị vẫn còn.
- **AC-EX08-06** ⚠️ Then modal Nhập Traffic phân trang được toàn bộ chi nhánh × kỳ trong bộ lọc (hiện chỉ 12 × 7 "để demo").

#### FR-EX-09 — Phân tích Tăng trưởng
**Mục đích:** nhìn tốc độ tăng trưởng theo thời gian và phát hiện kỳ tăng/giảm bất thường.
**Mô tả (hiện trạng):** đường "Kỳ này", đường đứt "Kỳ trước", cột "Tăng trưởng %" (xanh ≥ 0 / đỏ < 0); 5 tab chỉ số (GMV, Doanh thu thuần, AOV, Volume, UPT); pill "Tổng/TB kỳ này | Tăng trưởng chung"; insight cao nhất/thấp nhất; Local Filter; modal.
**FRS yêu cầu khác:** scatter góc phần tư (X = tăng trưởng DT %, Y = biên LN %) theo chi nhánh. → **QĐ-12 đã chốt:** giữ biểu đồ thời gian hiện có **và** bổ sung scatter góc phần tư làm tab "Ma trận chi nhánh" (P2); ngưỡng X = 0% tăng trưởng, Y = biên LN gộp toàn hệ thống cùng kỳ.
**Quy tắc:** BR-CMP-02, 03; tab "Doanh thu" đổi tên "Doanh thu thuần"; AOV/UPT tổng kỳ dùng bình quân gia quyền.
- **AC-EX09-01** ❌ Then "Tăng trưởng chung" của GMV = % trên thẻ GMV cùng bộ lọc, và **không đổi** khi đổi Chu kỳ Ngày/Tuần/Tháng/Quý/Năm.
- **AC-EX09-02** ❌ Then giá trị "Kỳ trước" của mỗi bucket = giá trị thật của bucket liền trước cùng độ dài.
- **AC-EX09-03** ✅ When hover, Then tooltip: Kỳ này, Kỳ trước, Chênh lệch, % tăng trưởng.
- **AC-EX09-04** ⚠️ Given tăng trưởng cao nhất âm, Then insight hiển thị "−x,x%" (không phải "+-x%").
- **AC-EX09-05** ⚠️ Then (i) có nội dung.

### 7.2. Trang Vận hành & Khách hàng — BOD, MANAGER
Thứ tự: Order Aging | Time Peak → Nhân khẩu học → Basket Size | Thanh toán → Hiệu quả chiến dịch → Benchmark → Anomaly → Tỷ lệ chuyển đổi | Tỷ lệ trả hàng & đổi hàng.
**Quy tắc chung trang:** mọi widget tuân BR-FLT-03 (lọc theo ngày, phạm vi, đa chiều), BR-DATA-01, 02; MANAGER chỉ thấy cửa hàng mình. Hiện trạng: ❌ **không widget nào phản ứng bộ lọc**; MANAGER thấy y hệt BOD. Hầu hết widget có icon mở modal chi tiết.

#### FR-OP-01 — Cảnh báo tồn đọng (Order Aging)
**Mục đích:** phát hiện đơn đặt trước bị kẹt ở công đoạn nào và bao lâu.
**Mô tả:** thanh ngang chồng; hàng = công đoạn (Đo khám, Mài lắp, Vận chuyển); khúc = tuổi đơn; toggle Số lượng / Giá trị (Tr); tooltip; modal.
**Quy tắc:**
- Tuổi đơn = số ngày từ lúc đơn **vào công đoạn hiện tại** tới thời điểm "Đến ngày" (snapshot); chỉ tính đơn chưa hoàn thành.
- Nhóm tuổi **không chồng lấn**: 0–5 ngày · 6–10 · 11–20 · > 20 (hiện ghi 1-5, 5-10, 10-20 chồng biên). Màu xanh → vàng → cam → đỏ. Chú thích đúng thứ tự.
- Giá trị = Σ giá trị đơn tồn (Tr).
- **AC-OP01-01** ✅ Then 3 thanh × 4 khúc màu đúng thứ tự.
- **AC-OP01-02** ✅ When chọn "Theo giá trị", Then trục và tooltip hiển thị Tr.
- **AC-OP01-03** ⚠️ Then tooltip nêu tên công đoạn; modal có đơn vị.
- **AC-OP01-04** ❌ When click khúc đỏ (> 20 ngày) của "Mài lắp", Then mở danh sách mã đơn tương ứng (VIS §3) — P1.

#### FR-OP-02 — Thời gian bán hàng tối ưu (Time Peak)
**Mục đích:** bố trí nhân sự theo giờ cao điểm.
**Mô tả:** heatmap 7 ngày (Thứ 2–CN) × 7 khung giờ (8–10h … 20–22h); toggle Đơn hàng / Doanh thu; modal.
**Quy tắc:** giá trị ô = tổng đơn (hoặc DT) trong khung giờ đó của các ngày cùng thứ trong khoảng lọc; chỉ kênh cửa hàng (BR-MD-02); độ đậm theo giá trị chuẩn hóa min–max trong lưới; mọi ô có tooltip, kể cả ô nhỏ không in số.
- **AC-OP02-01** ❌ Given cùng bộ lọc, When rời tab rồi quay lại, Then mọi ô giữ nguyên giá trị. *(Hiện đổi mỗi lần.)*
- **AC-OP02-02** ⚠️ When hover ô bất kỳ, Then tooltip "<Thứ> <khung giờ>: N đơn / x,x Tr".
- **AC-OP02-03** ⚠️ Then phụ đề đổi theo chế độ (Đơn/Doanh thu).
- **AC-OP02-04** ⚠️ Then DT/đơn trong lưới nhất quán với AOV hệ thống (BR-DATA-02).

#### FR-OP-03 — Nhân khẩu học khách hàng
**Mô tả:** donut Giới tính, cột Nhóm tuổi, Tháp dân số (Nam trái / Nữ phải); toggle Số lượng (%) / Giá trị (Tỷ); modal.
**Quy tắc:** nhóm tuổi không chồng lấn: < 25 · 25–34 · 35–49 · ≥ 50; khách không có giới tính/tuổi → nhóm "Không xác định" (hiển thị riêng); Giá trị = DTT của nhóm (tổng = M06 trang Tổng quan).
- **AC-OP03-01** ✅ Then % giới tính = 100%, % nhóm tuổi = 100%, tháp khớp từng nhóm.
- **AC-OP03-02** ❌ Given chế độ Giá trị, Then tổng = DTT kỳ lọc. *(Hiện 67,8 Tỷ vs 3,70 Tỷ.)*
- **AC-OP03-03** ⚠️ Then tooltip không lộ khóa "value"; modal hiển thị số Nam dương; trục tháp ghi giá trị tuyệt đối 2 phía.

#### FR-OP-04 — Phân khúc hóa đơn (Basket Size)
**Mô tả:** donut tỷ trọng đơn theo dải giá trị; modal.
**Quy tắc:** dải giá trị **< 0,5 · 0,5–1 · 1–3 · 3–5 · > 5 Tr** (QĐ-06; hiệu chỉnh lại theo phân vị khi có dữ liệu thật). *(Hiện trạng: < 5 / 5–10 / 10–20 / 20–30 / > 30 Tr — không phản ánh AOV thực ~0,7–0,8 Tr.)* Dùng cùng dải với bộ lọc đa chiều. Chú thích theo thứ tự dải tăng dần, màu tách biệt.
- **AC-OP04-01** ✅ Then tổng các lát = 100%.
- **AC-OP04-02** ⚠️ Then chú thích theo thứ tự dải giá trị tăng dần.

#### FR-OP-05 — Hình thức thanh toán
**Mô tả:** thanh 100% chồng ngang; modal.
**Quy tắc:** danh mục **Tiền mặt · Chuyển khoản · Thẻ (POS) · Ví điện tử · COD (online) · Trả góp** (QĐ-06). *(Hiện trạng: Chuyển khoản, Tiền mặt, Quẹt thẻ POS, App/Trả góp.)* Tỷ trọng theo **giá trị** thanh toán (có tùy chọn theo số giao dịch — P2).
- **AC-OP05-01** ⚠️ When hover bất kỳ khúc nào, Then tooltip tên + % (hiện không có tooltip; khúc ≤ 10% không có nhãn).

#### FR-OP-06 — Hiệu quả chiến dịch
**Mô tả:** bảng Tên chương trình, DTT mang lại, Số đơn.
**Quy tắc:** đơn được gán chiến dịch theo mã khuyến mãi/chương trình áp trên đơn; DTT theo M06; chỉ chiến dịch có đơn trong khoảng lọc; sort theo DTT giảm dần; định dạng BR-FMT-01; (P2) thêm AOV chiến dịch và % so với mục tiêu chiến dịch từ KPI.
- **AC-OP06-01** ❌ Then tổng DTT các chiến dịch ≤ DTT toàn kỳ. *(Hiện 33,2 Tỷ > 4,22 Tỷ.)*
- **AC-OP06-02** ⚠️ Then số đơn hiển thị "4.200" (không "4,200"); tên chiến dịch không trông như link nếu không bấm được.

#### FR-OP-07 — Benchmarking hiệu suất (radar)
**Mô tả:** radar 6 trục (Doanh thu, Tỷ lệ chuyển đổi, AOV, Lưu lượng khách, Tỷ lệ khách quay lại, Độ hài lòng); toggle Khu vực / Chi nhánh; chọn "Phân tích" và "So với" (TB toàn quốc / TB khu vực / thực thể khác).
**Quy tắc:**
- **Index = Giá trị thực thể A / Giá trị chuẩn B × 100**; đa giác chuẩn B luôn = 100; danh sách bên cạnh hiển thị **giá trị thật có đơn vị** (vd "DTT 1.265 Tr vs 1.054 Tr") và chênh lệch = Index − 100 (%).
- "TB Khu vực" = trung bình các chi nhánh **cùng khu vực** với chi nhánh đang phân tích.
- Không cho chọn "So với" chính thực thể đang phân tích.
- Chỉ số định nghĩa theo mục 6 (Doanh thu = M06, Tỷ lệ CĐ = M14, AOV = M08…); "Độ hài lòng" lấy từ dữ liệu độ hài lòng/NPS đã có (QĐ-13); "Tỷ lệ khách quay lại" = % khách có đơn Hoàn thành trong kỳ và đã từng có đơn trước kỳ (tính từ dữ liệu đơn).
- **AC-OP07-01** ❌ When F5, Then số liệu không đổi. *(Hiện HCM Doanh thu 83 → 99.)*
- **AC-OP07-02** ⚠️ Then tiêu đề "Index 100 = <chuẩn>" khớp số hiển thị (hiện TB toàn quốc hiển thị 75/70/72 chứ không phải 100).
- **AC-OP07-03** ✅ Given Index 112, Then badge xanh "+12%"; Index 95 → đỏ "−5%".

#### FR-OP-08 — Phát hiện bất thường (Anomaly)
**Mô tả:** đường giá trị theo ngày, đường trung bình trượt (MA), dải tin cậy, điểm bất thường tô đỏ, banner tổng số điểm; chọn thực thể theo Khu vực/Chi nhánh.
**Quy tắc (đề xuất, thay thuật toán hiện tại):**
- Chuỗi theo ngày trong khoảng lọc (không cố định tháng 7).
- MA và σ (độ lệch chuẩn **mẫu**) tính trên **N = 7 ngày trước đó, không gồm ngày hiện tại**; bất thường khi |giá trị − MA| > **k·σ**, k = 2 (tham số cấu hình). Bỏ hằng số "+10" cộng vào biên.
- Chỉ số theo dõi chọn được: DTT, Số đơn, Tỷ lệ trả hàng (FRS lấy ví dụ hoàn/hủy).
- Banner liệt kê ngày bất thường, click để mở chi tiết ngày đó (P2).
- **AC-OP08-01** ❌ Given chuỗi có ngày cao hơn MA7 trước đó > 2σ, Then điểm đó được tô đỏ và đếm trong banner. *(Hiện **không thể** đánh dấu điểm nào: cửa sổ 5 điểm gồm cả điểm hiện tại nên theo bất đẳng thức Samuelson độ lệch tối đa ≤ 2σ < 2σ + 10. BA mô phỏng 20.000 chuỗi — 0 điểm; DA kiểm 7 thực thể — 0 điểm. Ngoài ra cú sốc +45/−40 được cộng vào chuỗi tích lũy nên làm dịch mức vĩnh viễn thay vì tạo gai.)*
- **AC-OP08-02** ❌ Then đổi thực thể hiển thị dữ liệu thật của thực thể đó; cùng thực thể cho cùng số.
- **AC-OP08-03** ⚠️ Then danh sách chi nhánh đầy đủ theo BR-MD-01 (hiện 3/5).

#### FR-OP-09 — Tỷ lệ chuyển đổi
**Mô tả:** thanh ngang; chọn "Top cửa hàng" / "Theo khu vực" / "Toàn hệ thống".
**Quy tắc:** M14; chỉ kênh cửa hàng (loại Shopee/TikTok, hoặc tách nhóm "Kênh online" với định nghĩa riêng); "Top" = sắp giảm dần, mặc định 5; tooltip dùng nhãn nghiệp vụ.
- **AC-OP09-01** ⚠️ Then "Top cửa hàng" sắp giảm dần. *(Hiện theo thứ tự dữ liệu.)*
- **AC-OP09-02** ⚠️ Then không lộ khóa "rate"; trục X cố định 0–100% để so sánh được giữa các chế độ.
- **AC-OP09-03** ⏸ (FRS) Biểu đồ **phễu** Khách vào → Đo mắt → Báo giá → Đặt/Mua: **ngoài phạm vi bản 1** — chưa có dữ liệu ca đo mắt và báo giá (QĐ-13).
- **AC-OP09-04** ❌ Given chi nhánh chưa nhập Traffic trong kỳ, Then thanh của chi nhánh đó hiển thị "Chưa có Traffic" thay vì 0%.

#### FR-OP-10 — Tỷ lệ trả hàng & đổi hàng
**Mô tả:** cột Tỷ lệ trả hàng (theo giá trị, theo hóa đơn) và Tỷ lệ đổi hàng từ đơn đặt; (P2) xu hướng theo Chu kỳ. *(Hiện tên widget "Tỷ lệ Hoàn tiền", 2 cột tĩnh.)*
**Quy tắc:** M12, M13, M13b — **cùng định nghĩa** với Waterfall và Bảng xếp hạng. Phân rã nguyên nhân trả hàng: **ngoài phạm vi bản 1** — chưa có mã lý do trên đơn trả (QĐ-13).
- **AC-OP10-01** ❌ Then Tỷ lệ trả hàng (giá trị) = cột "Trả hàng" của Waterfall / GMV cùng bộ lọc. *(Hiện 1,2% vs 5% vs 8,1%.)*
- **AC-OP10-02** ❌ Then Tỷ lệ đổi hàng = cột "Đổi hàng từ đơn đặt" của Waterfall / GMV cùng bộ lọc.
- **AC-OP10-03** ⏸ (FRS) Biểu đồ nguyên nhân trả hàng — chờ dữ liệu nguồn.

### 7.3. Trang Sản phẩm & Tồn kho — BOD, MANAGER
Thứ tự: Product Growth → Phân tích đa chiều → Treemap | Ma trận phôi tròng → Thương hiệu phân phối | Top sản phẩm & vật tư.
**Quy tắc chung:** BR-FLT-03 (hiện chỉ Product Growth theo ngày/chu kỳ; không widget nào theo KV/CN/đa chiều), BR-DATA-02 (tổng DT ngành hàng = M06; hiện 45,2 Tỷ), BR-MD-03.

#### FR-PR-01 — Phân tích tăng trưởng sản phẩm
**Mục đích:** so sánh tốc độ tăng trưởng doanh thu giữa ngành hàng, nhóm SP, thương hiệu, nhà cung cấp.
**Mô tả:** đường đa tuyến % tăng trưởng theo kỳ, đường tham chiếu 0%; tab chiều: Ngành hàng / Nhóm SP / Thương hiệu / Nhà cung cấp; chọn "Top 5" hoặc 1 thực thể; **bộ chọn so sánh WoW / MoM / YoY** (FRS — chưa có UI).
**Quy tắc:** giá trị mỗi điểm = M17 của DTT thực thể so với kỳ so sánh đã chọn; "Top 5" = 5 thực thể có DTT cao nhất trong khoảng lọc, sắp theo hạng. **Không** phân loại vòng đời sản phẩm tự động (QĐ-14).
- **AC-PR01-01** ❌ Given tab "Nhà cung cấp", Then hiển thị đường cho mỗi NCC trong chú thích. *(Hiện biểu đồ trống.)*
- **AC-PR01-02** ❌ Given tab "Thương hiệu", Then 5 đường cho 5 thương hiệu trong chú thích. *(Hiện 2/5.)*
- **AC-PR01-03** ❌ Given cùng bộ lọc, When chuyển tab qua lại, Then số không đổi. *(Hiện ngẫu nhiên.)*
- **AC-PR01-04** ❌ Given chọn MoM, Then điểm tháng t = (DT t − DT t−1)/DT t−1 × 100.
- **AC-PR01-05** ⚠️ Then "Top 5" sắp theo hạng doanh thu (hiện theo thứ tự danh sách/ABC); ngành hàng gồm "Kính mát".

#### FR-PR-02 — Phân tích đa chiều
**Mô tả:** cột dọc sắp giảm dần; chọn chỉ số (DTT / Số lượng) × chiều (Ngành hàng, Nhóm tròng, Nhóm gọng, Thương hiệu tròng, Thương hiệu gọng, NCC, Chiết suất, Màu sắc) + **Phân khúc giá, Đối tượng khách hàng** (FRS, chưa có); modal.
**Quy tắc:** tổng theo mọi chiều cùng cấp = DTT (hoặc số lượng) của kỳ lọc; thương hiệu tròng ⊂ ngành Tròng (Σ thương hiệu tròng = DT ngành Tròng).
- **AC-PR02-01** ⚠️ Then Σ "Thương hiệu Tròng" = DT ngành "Tròng kính". *(Hiện 20,5 > 18,1 Tỷ.)*
- **AC-PR02-02** ⚠️ Then tooltip ghi tên cột + giá trị + đơn vị.
- **AC-PR02-03** ❌ Then có chiều "Phân khúc giá" và "Đối tượng khách hàng".

#### FR-PR-03 — Cấu trúc danh mục (Treemap)
**Mô tả:** treemap tỷ trọng DTT; chế độ "Cấu trúc phân cấp" (Ngành → Nhóm/Thương hiệu → SKU) có drill-down + breadcrumb "Trở lại"; hoặc phẳng theo 1 chiều của FR-PR-02; modal.
**Quy tắc:** diện tích ô = DTT; tooltip: tên, DTT (Tỷ), % tỷ trọng trong cấp cha; cấp gốc chỉ hiển thị ô cấp 1 (không lộ SKU lồng bên trong); modal hiển thị **đúng dữ liệu của cấp đang xem** và tiêu đề cột đúng đơn vị.
- **AC-PR03-01** ❌ When click ô "Tròng kính", Then treemap hiển thị các con của "Tròng kính" và nút "Trở lại: Tất cả". *(Hiện không drill được.)*
- **AC-PR03-02** ⚠️ Then modal khớp các ô đang vẽ. *(Hiện bảng 45/40/10/4/1 %.)*
- **AC-PR03-03** ⚠️ Then nhãn ô không bị cắt giữa chừng (rút gọn bằng "…").

#### FR-PR-04 — Ma trận phôi tròng (SPH × CYL)
**Mục đích:** dự báo tồn kho phôi theo dải độ.
**Mô tả:** bubble scatter: X = SPH (D), Y = CYL (D), kích thước = số lượng bán, màu = loại tròng (Trong suốt, Đổi màu, Đa tròng, Chống ánh sáng xanh); tooltip; modal.
**Quy tắc:** độ theo bước 0,25D; gộp theo cặp (SPH, CYL); chú thích phải có **mọi** loại tròng đang vẽ; lọc theo ngày/phạm vi.
- **AC-PR04-01** ✅ Then điểm lớn nhất tại (−2,00; 0).
- **AC-PR04-02** ⚠️ Then chú thích gồm "Chống AS xanh"; tooltip nêu loại tròng.

#### FR-PR-05 — Thương hiệu phân phối
**Mô tả:** thanh ngang DTT theo thương hiệu, sắp giảm dần; modal.
- **AC-PR05-01** ❌ When mở modal, Then cột "Doanh thu (Tỷ VNĐ)" hiển thị giá trị (25,5 / 8,2 / …). *(Hiện "undefined".)*
- **AC-PR05-02** ⚠️ Then DT thương hiệu khớp FR-PR-02 cùng thương hiệu (hiện HMK Eyewear 25,5 vs 12,5 Tỷ).

#### FR-PR-06 — Top sản phẩm & vật tư tiêu hao
**Mô tả:** bảng Hero SKU: #, Sản phẩm, NCC, Thuộc tính (Suất/Màu), Số lượng bán; **(FRS) Tồn hiện tại, Tồn an toàn, Điểm đặt hàng lại, cảnh báo**; "Xem toàn bộ danh mục".
**Quy tắc (QĐ-15 đã chốt):** Tồn an toàn = z × σ(nhu cầu ngày) × √(lead time), z = 1,65 (95%); Điểm đặt hàng lại (ROP) = nhu cầu TB ngày × lead time + Tồn an toàn; cảnh báo đỏ khi Tồn hiện tại ≤ ROP.
- **AC-PR06-01** ✅ Then sắp giảm dần theo số lượng bán.
- **AC-PR06-02** ❌ Then có cột tồn kho/ROP và cảnh báo khi Tồn ≤ ROP.
- **AC-PR06-03** ❌ When bấm "Xem toàn bộ danh mục", Then mở danh sách đầy đủ có tìm kiếm/sort.
- **AC-PR06-04** ⚠️ Then định dạng "15.037".

### 7.4. Trang Hiệu suất Nhân sự
**Quy tắc chung:** dữ liệu lấy theo nhân sự gán trên đơn (PIC Sales) và lệnh gia công (Lab); lọc theo ngày/phạm vi. **Không có mục tiêu cá nhân** (QĐ-08): mọi phần tử "so với mục tiêu", "tiến độ chỉ tiêu", "KPI tuần" ở cấp cá nhân bị gỡ. Bảng KTV khúc xạ hoãn vì chưa có dữ liệu (QĐ-13). Hiện trạng: ❌ toàn trang là số tĩnh, không lọc.

#### FR-HR-01 — Góc nhìn nhân viên (STAFF)
| Thẻ | Định nghĩa to-be | Hiện trạng |
|---|---|---|
| Doanh số cá nhân | DTT các đơn có PIC = tôi trong kỳ lọc; % so với **kỳ trước** (BR-CMP) thay cho % so với mục tiêu | ⚠️ tĩnh "128.5 Tr, +15% so với mục tiêu"; nhãn "(Tháng)" không theo bộ lọc |
| Xếp hạng nội bộ | Hạng theo DTT trong nhóm cùng vai trò, cùng cửa hàng: "Top r / n" + thanh = (n − r + 1)/n | ⚠️ tĩnh |
| AOV cá nhân | M08 trên đơn của tôi; so với AOV cửa hàng | ⚠️ tĩnh |
| Điểm hài lòng KH | Lấy từ dữ liệu độ hài lòng/NPS **đã có** (QĐ-13); tên và thang hiển thị đúng theo dữ liệu nguồn (NPS: −100…+100; CSAT: /5) | ⚠️ tĩnh "4.9 / 5.0" nhưng gắn nhãn NPS |
| ~~Tiến độ KPI tuần~~ | **Gỡ bỏ** (QĐ-08 — không có KPI cá nhân) | ⚠️ đang hiển thị tĩnh |
| Vinh danh | Không còn điều kiện "đạt chỉ tiêu". Đề xuất: hiện khi nhân viên thuộc **Top 3 doanh số cửa hàng** trong kỳ; nếu BOD không chọn phương án này thì gỡ bỏ (10.2 #7) | ❌ luôn hiện |
- **AC-HR01-01** ❌ Then số cá nhân = dòng của chính nhân viên trên Leaderboard (AC-ROLE-05).
- **AC-HR01-02** ❌ Given nhân viên không thuộc Top 3 doanh số cửa hàng trong kỳ, Then không hiển thị khối "Nhân viên xuất sắc".
- **AC-HR01-03** ❌ Then góc nhìn STAFF không có thành phần nào hiển thị "mục tiêu", "chỉ tiêu" hay "Tiến độ KPI" cá nhân.

#### FR-HR-02 — Bảng xếp hạng PIC Sales (BOD, MANAGER)
Cột: #, Nhân sự, Doanh số (DTT), **Tỷ trọng đóng góp** vào DTT của phạm vi (thanh + %, thay cho "Tiến độ doanh số" vì không có mục tiêu cá nhân — QĐ-08), AOV; sắp giảm dần theo DTT; MANAGER chỉ thấy nhân sự cửa hàng mình.
- **AC-HR02-01** ✅ Then sắp giảm dần theo doanh số.
- **AC-HR02-02** ❌ Then thanh = DTT nhân sự / DTT phạm vi, hiển thị "x%"; tổng các dòng = 100% *(hiện thanh = DTT / 2 Tỷ ngầm, không hiển thị %)*.
- **AC-HR02-03** ❌ Then Σ doanh số PIC ≤ DTT phạm vi (hiện 5,55 > 4,22 Tỷ).

#### FR-HR-03 — Hiệu suất KTV khúc xạ — ⏸ ngoài phạm vi bản 1
Cả 2 chỉ số của bảng đều **chưa có dữ liệu nguồn** (QĐ-13): Tỷ lệ chuyển đổi KTV cần dữ liệu ca đo mắt; Độ chính xác đo khám chưa được ghi nhận. **Ẩn bảng** cho tới khi có dữ liệu. Định nghĩa giữ lại để triển khai sau: chuyển đổi = M15; độ chính xác = 1 − (số đơn phải làm lại do sai số đo / tổng đơn có đo).
- **AC-HR03-01** Given bản 1, Then trang Nhân sự (BOD/MANAGER) không hiển thị bảng KTV khúc xạ, và bộ lọc đa chiều không có mục "KTV khúc xạ".

#### FR-HR-04 — Hiệu suất phòng Lab / KTV mài lắp
Cột: Hoàn thành đúng hạn = số lệnh xong ≤ hạn cam kết / tổng lệnh; Tỷ lệ hư hao = số phôi hỏng / số phôi đã dùng; (P2) thời gian xử lý TB/lệnh (VIS §7). Ngưỡng màu hư hao: tham số cấu hình, mặc định > 2% đỏ (QĐ-03). Nguồn: lệnh gia công — Tech Lead xác nhận có ghi nhận hạn cam kết và phôi hỏng.
- **AC-HR04-01** ✅ Then sắp giảm dần theo đúng hạn.
- **AC-HR04-02** ⚠️ Then tỷ lệ hư hao chỉ tô đỏ khi vượt ngưỡng (hiện luôn đỏ).

### 7.5. Trang Quản lý KPI — BOD, MANAGER
**Mục đích:** thiết lập, phân bổ, theo dõi mục tiêu; là **nguồn mục tiêu duy nhất** cho dashboard (BR-TGT-01).
**Hiện trạng tổng quát:** ❌ danh sách là mảng hằng; tìm kiếm, lọc, sửa, xóa, phân trang, lưu bulk edit, lưu wizard đều không ghi dữ liệu.

#### Mô hình dữ liệu KPI (to-be)
| Trường | Mô tả | Ràng buộc |
|---|---|---|
| Phạm vi | Công ty / Khu vực / Chi nhánh (**không có Cá nhân** — QĐ-08) | bắt buộc |
| Đối tượng | Mã thực thể theo danh mục chủ | bắt buộc, khác "Tất cả" khi phạm vi ≠ Công ty |
| Chu kỳ | Năm / Quý / Tháng / Chiến dịch (có ngày bắt đầu–kết thúc) | bắt buộc; Năm phải chọn năm |
| Phiên bản | V1, V2… tự tăng theo (Đối tượng, Chu kỳ) | hệ thống sinh |
| Mục tiêu | DTT (Tỷ), Tỷ lệ chuyển đổi (%), AOV (₫), Traffic (lượt), Độ hài lòng (%) | DTT > 0; tỷ lệ 0–100; số nguyên ≥ 0 |
| Trạng thái | Bản nháp · Đang áp dụng · Đã kết thúc · Lưu trữ | xem vòng đời |
| Người tạo / sửa, thời điểm, nguồn (Wizard / Import + tên file) | Audit | hệ thống sinh |

**Vòng đời trạng thái:** Bản nháp → Đang áp dụng (khi duyệt/lưu áp dụng) → Đã kết thúc (tự động khi hết chu kỳ) ; Đang áp dụng → Lưu trữ (khi bị ghi đè). **BR-KPI-01:** tại mọi thời điểm, mỗi (Đối tượng, Chu kỳ) có **tối đa 1** KPI "Đang áp dụng".

#### FR-KPI-01 — Thẻ thống kê nhanh
Tổng KPI đang áp dụng; KPI đạt chỉ tiêu kỳ trước (đạt/tổng); cấp phân bổ sâu nhất. **Tính từ dữ liệu**, không hard-code.
- **AC-KPI01-01** ❌ Then "Tổng KPI đang áp dụng" = số dòng trạng thái "Đang áp dụng". *(Hiện 12 vs 3.)*

#### FR-KPI-02 — Danh sách KPI
Thanh công cụ: Tìm kiếm · Lọc (Trạng thái, Chu kỳ, Phạm vi) · **Import mục tiêu** (FR-IMP-02) · Thêm KPI mới. Nút Import, Thêm, Sửa, Xóa, chỉnh sửa hàng loạt **chỉ hiện với BOD**.
Cột: chọn, Phạm vi, Đối tượng, Chu kỳ, Phiên bản, Mục tiêu DTT, Tỷ lệ CĐ, **Traffic, AOV** (FRS, chưa có), Trạng thái (màu: Đang áp dụng xanh lá, Bản nháp vàng, Đã kết thúc chàm, Lưu trữ xám), Thao tác (Sửa, Xóa, Lịch sử phiên bản).
- **AC-KPI02-01** ❌ When gõ "Miền Bắc", Then chỉ còn KPI có Đối tượng chứa "Miền Bắc".
- **AC-KPI02-02** ❌ When lọc Trạng thái = "Đang áp dụng" / Chu kỳ = "Tháng", Then danh sách lọc tương ứng.
- **AC-KPI02-03** ❌ Then phân trang 10 dòng/trang; chân bảng "Hiển thị a–b của N KPI" đúng số.
- **AC-KPI02-04** ❌ When bấm Xóa, Then hộp xác nhận; xác nhận → KPI chuyển "Lưu trữ" (xóa mềm); KPI "Đang áp dụng" có dữ liệu thực tế liên kết thì không xóa cứng.
- **AC-KPI02-05** ❌ When bấm Sửa KPI "Đang áp dụng", Then tạo phiên bản mới (V+1) thay vì sửa đè.

#### FR-KPI-03 — Chỉnh sửa hàng loạt
Chọn ≥ 1 dòng → thanh hành động nổi "N KPI đã chọn | Cập nhật mục tiêu | Thay đổi thời hạn | Xóa | ×".
- **AC-KPI03-01** ✅ When chọn 2 dòng, Then thanh nổi "2 KPI đã chọn"; chọn tất cả → đủ số dòng.
- **AC-KPI03-02** ❌ Given 5 KPI chọn, When "Cập nhật mục tiêu" → "Tăng 10%" DTT → Lưu, Then DTT mỗi KPI × 1,1, tạo phiên bản mới, thông báo "Đã cập nhật 5 KPI". (Hỗ trợ cả Tăng/Giảm % và Giá trị tuyệt đối — FRS.)
- **AC-KPI03-03** ❌ When "Xóa" hàng loạt, Then hộp xác nhận nêu số KPI.

#### FR-KPI-04 — Wizard cấu hình KPI (3 bước)
B1 Phạm vi (Công ty / Khu vực / Chi nhánh) → B2 Chu kỳ (Năm có chọn năm / **Quý** / Tháng / Chiến dịch có ngày) → B3 Nhập mục tiêu → Lưu. Tóm tắt từng bước ở cột trái; "Quay lại" giữ lựa chọn.
**Phát hiện xung đột (BR-KPI-02):** khi lưu, nếu đã có KPI "Đang áp dụng" cùng Đối tượng và **chu kỳ giao nhau** → cảnh báo **đỏ** "Phát hiện trùng lặp KPI" với 3 lựa chọn:
| Lựa chọn | Kết quả |
|---|---|
| Ghi đè hoàn toàn (mặc định) | KPI cũ → Lưu trữ; KPI mới → Đang áp dụng |
| Giữ mục tiêu cao nhất | KPI mới = max(cũ, mới) cho từng chỉ số; KPI cũ → Lưu trữ |
| Lưu thành phiên bản mới (Bản nháp) | KPI mới → Bản nháp; KPI cũ giữ nguyên |
- **AC-KPI04-01** ❌ Given chọn cấp "Khu vực" và **không chạm** dropdown (hiển thị "Hồ Chí Minh"), Then đối tượng được ghi nhận là "Hồ Chí Minh" (giá trị đang hiển thị). *(Hiện ghi "Tất cả" → bỏ qua kiểm tra trùng.)*
- **AC-KPI04-02** ✅ Given KPI HCM tháng 7/2026 đang áp dụng, When tạo KPI HCM tháng 7/2026, Then hiện cảnh báo trùng với 3 lựa chọn và nút "Xác nhận & Lưu".
- **AC-KPI04-03** ❌ Given cấp "Toàn công ty" năm 2026 đã có KPI đang áp dụng, When tạo mới, Then cũng hiện cảnh báo trùng.
- **AC-KPI04-04** ❌ When lưu thành công, Then bảng có dòng mới, thẻ thống kê cập nhật, thông báo thành công; F5 vẫn còn.
- **AC-KPI04-05** ❌ Given DTT ≤ 0 hoặc tỷ lệ > 100%, When lưu, Then báo lỗi tại trường và chặn lưu. *(Hiện lưu được −5 Tỷ, 150%.)*
- **AC-KPI04-06** ❌ Given MANAGER, Then không mở được wizard (không có nút "Thêm KPI mới"), theo AC-ROLE-06.
- **AC-KPI04-07** ⚠️ When đóng wizard bằng X và mở lại, Then wizard về bước 1 với giá trị mặc định (hiện giữ dữ liệu cũ).
- **AC-KPI04-08** ❌ When KPI chuyển "Đang áp dụng", Then mục tiêu trên Run-rate, Heatmap, Bảng xếp hạng cập nhật theo (BR-TGT-01).

### 7.6. Thành phần dùng chung

#### FR-CMN-01 — Modal "Xem chi tiết dữ liệu"
Mở từ icon tài liệu trên widget. Bảng dữ liệu đúng như widget đang vẽ; ô tìm kiếm (lọc theo **giá trị đã định dạng** hiển thị, không phân biệt hoa thường); bấm tiêu đề cột để sort 3 trạng thái (tăng → giảm → mặc định); trạng thái rỗng "Không có dữ liệu".
- **AC-CMN01-01** ✅ Bấm tiêu đề cột: lần 1 tăng, lần 2 giảm, lần 3 về gốc.
- **AC-CMN01-02** ⚠️ Esc và click nền đóng modal (hiện chỉ nút X).
- **AC-CMN01-03** ⚠️ Mở lại modal → từ khóa và sort về mặc định (hiện giữ trạng thái cũ).
- **AC-CMN01-04** ⚠️ Không cột nào hiển thị "undefined"/số âm sai nghĩa; mọi cột có đơn vị.
- **AC-CMN01-05** ❌ (P2, QĐ-10) When BOD/MANAGER bấm "Xuất Excel" trong modal, Then tải file .xlsx đúng các dòng đang hiển thị (sau tìm kiếm/sort), chỉ trong phạm vi quyền.

#### FR-CMN-02 — Tooltip định nghĩa (i)
Mỗi widget/thẻ có (i) hiển thị **định nghĩa + công thức đúng theo mục 6**; hiển thị khi hover/focus vào icon (hỗ trợ bàn phím); không che thẻ bên cạnh.
- **AC-CMN02-01** ⚠️ Then không có tooltip rỗng (hiện rỗng ở Hiệu quả đơn hàng, Xu hướng lũy kế, Phân tích tăng trưởng).
- **AC-CMN02-02** ⚠️ Then công thức trong (i) tái tạo được số đang hiển thị.

#### FR-CMN-03 — Trạng thái rỗng / lỗi / đang tải
- Không có dữ liệu cho bộ lọc → "Không có dữ liệu cho bộ lọc hiện tại" + nút "Xóa bộ lọc".
- Lỗi tải → thông báo lỗi trong widget + "Thử lại"; các widget khác vẫn hoạt động.
- Đang tải → skeleton theo hình dạng widget.

### 7.7. Nhập liệu & import Excel (QĐ-11) — tính năng mới

#### Quy tắc chung cho mọi import (BR-IMP)
- **BR-IMP-01 — File mẫu.** Mỗi màn import có nút "Tải file mẫu" (.xlsx) gồm sheet dữ liệu (có hàng tiêu đề cố định) và sheet hướng dẫn (ý nghĩa cột, định dạng, danh sách mã chi nhánh/khu vực hợp lệ theo phạm vi của người dùng).
- **BR-IMP-02 — Định dạng nhận.** `.xlsx` hoặc `.csv` UTF-8; ≤ 5 MB; ≤ 10.000 dòng dữ liệu; đúng tên cột của mẫu (thứ tự cột không bắt buộc). Sai mẫu → từ chối cả file với thông báo cột thiếu/thừa.
- **BR-IMP-03 — Quy trình 3 bước, không ghi trước khi xác nhận.** (1) Tải lên → (2) **Xem trước & kiểm tra**: tổng số dòng, số dòng hợp lệ / lỗi / cảnh báo / sẽ ghi đè, bảng lỗi theo dòng–cột–nội dung → (3) **Xác nhận nhập**. Hủy ở bước 2 không thay đổi dữ liệu.
- **BR-IMP-04 — Danh mục chủ.** Mã chi nhánh/khu vực phải khớp danh mục chủ (BR-MD-01); mã không tồn tại hoặc đã ngừng hoạt động → lỗi dòng. Cột "Tên" (nếu có) chỉ để tham khảo, không dùng để đối chiếu.
- **BR-IMP-05 — Quyền.** Dòng thuộc phạm vi ngoài quyền của người import → lỗi "Không có quyền với <mã>".
- **BR-IMP-06 — Số và ngày.** Ngày định dạng `DD/MM/YYYY` (hoặc ô ngày Excel); số không có ký hiệu đơn vị; tiền nhập bằng **₫ đầy đủ** (không nhập "Tỷ"/"Tr") để tránh nhầm đơn vị.
- **BR-IMP-07 — File lỗi.** Có nút "Tải file lỗi" = file gốc + cột "Lỗi/Cảnh báo" cho từng dòng, để sửa và import lại.
- **BR-IMP-08 — Lịch sử & audit.** Lưu file gốc, người import, thời điểm, số dòng thêm/ghi đè/bỏ qua; có màn "Lịch sử import" xem lại. Giá trị cũ bị ghi đè được lưu trong lịch sử thay đổi của bản ghi.

#### FR-IMP-01 — Import Traffic
**Vị trí:** nút "Import Traffic" cạnh "Nhập Traffic" ở Bản đồ hiệu suất chi nhánh (FR-EX-08); MANAGER (cửa hàng mình) và BOD (mọi cửa hàng).
**Cột mẫu:** Mã chi nhánh · Tên chi nhánh (tham khảo) · Ngày · Traffic (lượt khách).
**Quy tắc:**
- Khóa bản ghi = (Mã chi nhánh, Ngày). Bản ghi đã tồn tại → **ghi đè**, đếm riêng ở bước xem trước.
- Traffic: số nguyên ≥ 0. Ngày: không ở tương lai. Trùng khóa trong cùng file → lỗi cả 2 dòng.
- **Cảnh báo (không chặn):** Traffic < số đơn của chi nhánh trong ngày đó (tỷ lệ chuyển đổi > 100%); Traffic = 0 ở ngày có đơn.
- **Nhập một phần:** dòng hợp lệ được nhập, dòng lỗi bị bỏ qua và nằm trong file lỗi.
- Sau khi nhập, Heatmap (chỉ số Traffic, Tỷ lệ CĐ), M14 và biểu đồ Tỷ lệ chuyển đổi cập nhật ngay.

| AC | Nội dung |
|---|---|
| AC-IMP01-01 | Given file 300 dòng hợp lệ, When xác nhận nhập, Then 300 bản ghi được lưu, Heatmap chỉ số Traffic hiển thị đúng giá trị, F5 vẫn còn |
| AC-IMP01-02 | Given 1 dòng Traffic = −5 và 1 dòng mã chi nhánh "ABC" không tồn tại, Then bước xem trước báo 2 lỗi đúng dòng/cột; các dòng khác vẫn nhập được; "Tải file lỗi" có 2 dòng kèm lý do |
| AC-IMP01-03 | Given chi nhánh X ngày 01/09 đã có Traffic 200, When import 250, Then bước xem trước hiển thị "1 dòng sẽ ghi đè (200 → 250)"; sau khi nhập, lịch sử bản ghi lưu giá trị 200 |
| AC-IMP01-04 | Given MANAGER cửa hàng X import file có dòng của cửa hàng Y, Then dòng đó lỗi "Không có quyền" |
| AC-IMP01-05 | Given Traffic 30 trong khi chi nhánh có 40 đơn hôm đó, Then dòng được nhập kèm cảnh báo "Tỷ lệ chuyển đổi > 100%" |
| AC-IMP01-06 | When bấm Hủy ở bước xem trước, Then không bản ghi nào thay đổi |

#### FR-IMP-02 — Import mục tiêu (KPI) hàng loạt
**Vị trí:** nút "Import mục tiêu" ở trang Quản lý KPI; **chỉ BOD**.
**Cột mẫu:** Phạm vi (Công ty / Khu vực / Chi nhánh) · Mã đối tượng (để trống khi Công ty) · Loại chu kỳ (Năm / Quý / Tháng / Chiến dịch) · Kỳ (`YYYY`, `Qn/YYYY`, `MM/YYYY` hoặc tên chiến dịch) · Từ ngày, Đến ngày (bắt buộc với Chiến dịch) · Mục tiêu DTT (₫) · Tỷ lệ chuyển đổi (%) · AOV (₫) · Traffic (lượt) · Độ hài lòng (%).
**Quy tắc:**
- Kiểm tra giá trị như wizard (AC-KPI04-05): DTT > 0; tỷ lệ 0–100; AOV, Traffic là số nguyên dương; chỉ DTT là bắt buộc, các chỉ số khác có thể trống. Phạm vi "Cá nhân" → lỗi (QĐ-08).
- Trùng (Đối tượng, chu kỳ giao nhau) **trong cùng file** → lỗi.
- **Xung đột với KPI đang áp dụng** (BR-KPI-02): bước xem trước liệt kê từng xung đột (giá trị cũ → mới); người dùng chọn **một chính sách cho cả file**: Ghi đè hoàn toàn / Giữ mục tiêu cao nhất / Lưu thành bản nháp.
- **Trạng thái sau nhập:** người dùng chọn "Áp dụng ngay" hoặc "Lưu bản nháp" cho cả file; mặc định **Lưu bản nháp**.
- **Tất cả hoặc không:** chỉ cần 1 dòng lỗi là không nhập dòng nào (mục tiêu ảnh hưởng tới mọi biểu đồ tiến độ nên không nhập dở dang).
- **Cảnh báo phân cấp (không chặn):** tổng mục tiêu các chi nhánh trong một khu vực ≠ mục tiêu khu vực cùng kỳ (sau khi nhập) → hiển thị chênh lệch để BOD rà soát.
- Mỗi dòng nhập thành công tạo 1 phiên bản KPI mới, ghi nguồn "Import: <tên file>".

| AC | Nội dung |
|---|---|
| AC-IMP02-01 | Given file 24 dòng mục tiêu tháng cho 2 chi nhánh × 12 tháng, không lỗi, "Lưu bản nháp", When xác nhận, Then danh sách KPI có thêm 24 dòng trạng thái "Bản nháp", nguồn "Import: <tên file>" |
| AC-IMP02-02 | Given 1 dòng có Tỷ lệ chuyển đổi 150%, Then bước xem trước báo lỗi dòng đó và nút "Xác nhận nhập" bị vô hiệu hóa; không dòng nào được nhập |
| AC-IMP02-03 | Given file có KPI HCM tháng 7/2026 trong khi đã có KPI HCM tháng 7/2026 "Đang áp dụng", Then bước xem trước hiển thị xung đột (cũ → mới) và bắt buộc chọn chính sách trước khi xác nhận |
| AC-IMP02-04 | Given chọn "Giữ mục tiêu cao nhất" + "Áp dụng ngay", Then KPI mới có từng chỉ số = max(cũ, mới), KPI cũ chuyển "Lưu trữ", và Run-rate dùng mục tiêu mới |
| AC-IMP02-05 | Given file có dòng phạm vi "Cá nhân", Then lỗi "Phạm vi không hỗ trợ" |
| AC-IMP02-06 | Given MANAGER, Then không thấy nút "Import mục tiêu" |
| AC-IMP02-07 | Given tổng mục tiêu 2 chi nhánh Miền Bắc tháng 8 = 10 tỷ trong khi KPI Miền Bắc tháng 8 = 12 tỷ, Then bước xem trước hiển thị cảnh báo chênh lệch 2 tỷ nhưng vẫn cho xác nhận |

---

## 8. Yêu cầu phi chức năng
| Mã | Yêu cầu |
|---|---|
| NFR-01 Hiệu năng | Trang Tổng quan tải xong ≤ 3 giây (P95) với khoảng 1 năm toàn hệ thống; đổi bộ lọc cập nhật ≤ 1,5 giây |
| NFR-02 Độ tươi dữ liệu | Dữ liệu giao dịch trễ ≤ 15 phút (hoặc theo lịch ETL được công bố); hiển thị "Dữ liệu tính đến HH:MM DD/MM" |
| NFR-03 Bảo mật | Xác thực SSO/tài khoản; RLS ở API (BR-ROLE-02); audit log cho thao tác KPI và nhập Traffic |
| NFR-04 Tính xác định | BR-DATA-01 |
| NFR-05 Responsive | Hiển thị được ở độ rộng 360px: thẻ xếp 1–2 cột, bảng cuộn ngang trong khung, không cuộn ngang toàn trang. *(Chưa kiểm thử ở cả 2 luồng.)* |
| NFR-06 Khả năng truy cập | Màu không là kênh duy nhất truyền tải trạng thái (kèm mũi tên/nhãn); tương phản WCAG AA; tooltip mở được bằng bàn phím |
| NFR-07 Quy ước biểu đồ (BR-VIZ-01) | Biểu đồ cột bắt đầu trục từ 0; biểu đồ đường được phép phóng to trục; nhãn trục không chồng/cắt; mỗi chuỗi có trục phù hợp đơn vị |
| NFR-08 Kiểm thử số liệu | Bộ kiểm thử tự động cho các ràng buộc ở mục 6.2 chạy trên mọi bản build |
| NFR-09 Mã nguồn | Gỡ code chết (ExecutiveView VAT toggle, `MetricCard`, mock không dùng, state không dùng ở Product Growth); gỡ phụ thuộc `@google/genai` nếu không dùng |

---

## 9. Danh sách GAP hợp nhất & ưu tiên

Cột "Xác nhận": **2L** = cả 2 luồng xác nhận; **L1** = chỉ code; **L2** = chỉ UI. Mã gốc tham chiếu báo cáo luồng (G-xx của BA, Ex/Ox/Px/Kx của DA).

### 9.1. P0 — Chặn phát hành (sai số liệu, sai quyền)
| ID | Mô tả | Xác nhận | Gốc | Hành động |
|---|---|---|---|---|
| GAP-01 | Doanh thu thuần 3 công thức / 3 giá trị (3.695 / 4.005 / 3.876 Tr); FRS tự mâu thuẫn | 2L | G-02, G-03, E2 | Áp định nghĩa QĐ-01 (mục 6.1); một hàm tính M01/M05/M06 dùng chung |
| GAP-02 | 9 thẻ tài chính bỏ qua Khu vực/Chi nhánh | 2L | G-01, E1 | Truyền phạm vi vào truy vấn thẻ |
| GAP-03 | "Doanh thu" = GMV × 1,05 hằng số | 2L | G-04 | Tính M04 từ phiếu thu |
| GAP-04 | "Giá trị điều chỉnh" = −5% GMV cố định, chưa theo định nghĩa đã chốt (Trả hàng + Đơn đặt kết thúc không ra Đơn hàng); Waterfall 3 cột cũ; % xu hướng hard-code 15,4% | 2L | G-05, E9 | Theo M05, FR-EX-03 (4 cột), BR-CMP |
| GAP-05 | AOV 3 giá trị (DTT/đơn, GMV/đơn, TB không gia quyền) | 2L | G-06, E5 | Chốt QĐ-02; dùng M08 |
| GAP-06 | Tăng trưởng: thẻ +21,7% vs biểu đồ −1,4%; "kỳ trước" giả lập; % phụ thuộc chu kỳ | 2L | G-07, E4 | BR-CMP-02/03 |
| GAP-07 | Mục tiêu hard-code (42/35 Tr/ngày, chỉ tiêu heatmap, 2 Tỷ PIC), không co theo phạm vi, không nối KPI | 2L | G-09, E6 | BR-TGT-01…05 |
| GAP-08 | Phân quyền chỉ ở giao diện; MANAGER thấy toàn hệ thống, tạo được KPI công ty | 2L | G-14, K5 | BR-ROLE-01…04 |
| GAP-09 | Dữ liệu ngẫu nhiên (Time Peak, Anomaly, Benchmark, Product Growth) | 2L | G-41, O3 | BR-DATA-01 |
| GAP-10 | Quy mô số giữa các trang mâu thuẫn (67,8 / 45,2 / 33,2 / 5,55 Tỷ vs GMV 4,22 Tỷ; 55% hóa đơn > 5 Tr vs AOV 0,7 Tr) | L2 (L1 ghi nhận mock không nhất quán) | O2, P4 | BR-DATA-02; nối chung một nguồn |
| GAP-11 | Tỷ lệ hoàn/hủy (nay chuẩn hóa thành Tỷ lệ trả hàng M12/M13) có 3 định nghĩa (5% / băm 5–18,5% / 1,2%); Tỷ lệ chuyển đổi 4 thang | 2L | G-16, O13 | M12–M15 |
| GAP-12 | Danh mục khu vực/chi nhánh không thống nhất (3 vs 4 vùng; 5/10/80 CN) | 2L | G-54, O6 | BR-MD-01, QĐ-04 |

### 9.2. P1 — Cần cho bản dùng thật
| ID | Mô tả | Xác nhận | Gốc |
|---|---|---|---|
| GAP-13 | Bộ lọc đa chiều không gắn dữ liệu; PIC/KTV rỗng | 2L | G-12 |
| GAP-14 | Trang Vận hành, Nhân sự, KPI, Heatmap, phần lớn Sản phẩm bỏ qua bộ lọc toàn cục | 2L | G-13 |
| GAP-15 | Module KPI không ghi dữ liệu (lưu, sửa, xóa, bulk, tìm kiếm, phân trang); thẻ thống kê hard-code | 2L | G-17, K1, K2, K7 |
| GAP-16 | Wizard KPI: giá trị dropdown mặc định không vào state → bỏ qua kiểm tra trùng; cấp Công ty không kiểm tra trùng; không có Quý; không validate | 2L | G-26, K3, K4 |
| GAP-17 | Product Growth: Nhà CC 0 đường, Thương hiệu 2/5 đường, không có WoW/MoM/YoY, giá trị không phải % | 2L | G-10, P1 |
| GAP-18 | Treemap không drill-down; modal không khớp ô | 2L | G-11, G-25, P3 |
| GAP-19 | Anomaly **về mặt toán học không thể** đánh dấu điểm nào (cửa sổ MA5 gồm điểm hiện tại → độ lệch ≤ 2σ theo Samuelson, ngưỡng 2σ + 10); chuỗi cố định tháng 7 | L2 phát hiện, L1 chứng minh | G-35, O4 |
| GAP-20 | Heatmap: kỳ Tuần/Tháng không gộp — ô "Tuần k"/"Tháng k" trùng giá trị ô ngày "k/7" (cùng công thức theo chỉ số cột); cố định tháng 7; Traffic không lưu/không validate | 2L | G-30, E17, E18 |
| GAP-21 | Quy tắc chỉ số nghịch áp sai: mũi tên thẻ Nợ treo bị đảo; tooltip Công nợ ở Xu hướng lũy kế tô xanh "Vượt tiến độ" khi nợ vượt kế hoạch; hư hao Lab luôn đỏ. Code đã có cờ `isInverse` đúng chuẩn nhưng chỉ trong `MetricCard` (không được dùng) → tái sử dụng làm quy tắc chung | 2L | G-19, E10, BA-trả lời #7 |
| GAP-22 | Footer thẻ hard-code "01/09 — 30/09/2026" | 2L | G-18, E8 |
| GAP-23 | Không validate khoảng ngày → NaN | 2L | G-42, E11 |
| GAP-24 | Bảng xếp hạng thiếu Top 5 SP và % đạt chỉ tiêu | L1 | G-08 |
| GAP-25 | Conversion/Refund thiếu phễu và nguyên nhân hoàn/hủy → **hoãn**, chưa có dữ liệu nguồn (QĐ-13) | L1 | G-15 |
| GAP-26 | Nợ treo cộng dồn luồng thay vì số dư; trạng thái "(An toàn)" cố định | L1 (+L2 thấy nhãn cố định) | G-22, G-28 |
| GAP-27 | Biên LN gộp: trung bình đơn giản, không có giá vốn; trend % tương đối | L1 | G-21 |
| GAP-28 | Bucket tuần không theo tuần lịch; tháng mất tháng 2; nhãn thiếu năm; paced theo bucket | 2L | G-29, G-48, E7, E16 |
| GAP-29 | Top SP thiếu tồn kho / Safety Stock / ROP | 2L | G-37 |
| GAP-30 | STAFF vs Leaderboard số không khớp; Vinh danh luôn hiện; còn các phần tử mục tiêu cá nhân (Tiến độ KPI tuần, "+15% so với mục tiêu", thanh tiến độ PIC) phải gỡ (QĐ-08); bảng KTV khúc xạ phải ẩn (QĐ-13) | L2 | 5.2 DA |
| GAP-31 | Modal Thương hiệu "undefined" | 2L | G-24, P2 |
| GAP-46 | Chưa có import Excel Traffic và import mục tiêu hàng loạt (QĐ-11, mục 7.7) | — | QĐ-11 |
| GAP-47 | VAT chia cố định 1,08 thay vì theo thuế suất từng sản phẩm tại thời điểm tạo đơn (QĐ-09) | L1 | QĐ-09 |
| GAP-48 | Đơn vị hiển thị cố định (thẻ luôn Tỷ/Tr, AOV "0,7 Tr") — chưa tự động theo độ lớn (BR-FMT-02) | 2L | QĐ-01 |
| GAP-49 | Chưa có nhãn "Tạm tính" cho kỳ còn đơn đặt chưa hoàn thành (BR-GMV-01); mock chưa mô hình hóa trạng thái đơn, phí vận chuyển, nghiệp vụ "Kết thúc" đơn đặt | — | QĐ-01 |

### 9.3. P2 — Cải tiến trải nghiệm
| ID | Mô tả | Gốc |
|---|---|---|
| GAP-32 | Combo "Cả 2" vẽ UPT trên trục AOV (đường UPT phẳng sát 0); kỳ lẻ làm méo trung bình ở chế độ Độ lệch %. *(Phát hiện "cột Độ lệch % không neo 0" (E14) đã được **rút lại** sau đối chiếu chéo — do animation.)* | G-23, E13 |
| GAP-33 | Trục Y biểu đồ cột không từ 0 (GMV vs DTT) | E15 |
| GAP-34 | InfoTooltip rỗng ở 3 widget; (i) thẻ bật khi hover toàn thẻ | G-44, E20, E24 |
| GAP-35 | Định dạng số/đơn vị lẫn lộn; "Tỉ lệ"; tooltip lộ "value"/"rate" (3 biểu đồ cột thiếu `name`: Nhóm tuổi, Tỷ lệ chuyển đổi, Tỷ lệ hoàn); tooltip tiếng Anh "Sphere/Cylinder"; modal Nhân khẩu học hiện Nam số âm (dữ liệu lưu âm để vẽ tháp, modal không lấy trị tuyệt đối) | G-49, E22, O8 |
| GAP-36 | Nhãn trục bị cắt (Waterfall), chồng chéo (Tuần/Ngày) | E12, E21 |
| GAP-37 | Chú thích sai thứ tự (Order Aging, Basket); thiếu "Chống AS xanh" (Scatter) | G-46, O10, P7 |
| GAP-38 | Conversion "Top" không sắp xếp, trộn kênh online | G-47, O7 |
| GAP-39 | Modal: Esc/click nền không đóng; giữ trạng thái tìm kiếm | G-53, E23 |
| GAP-40 | Nút không hoạt động: "Xem toàn bộ danh mục", chip MANAGER/STAFF, chuông, tên chiến dịch dạng link | G-51, O11 |
| GAP-41 | Thiếu chỉ báo Local Filter khác toàn cục; không lưu trạng thái lọc khi F5 | — |
| GAP-42 | Toggle VAT (VIS §1) đã mất, code còn sót; Order Efficiency chưa có trong FRS | G-39, G-40 |
| GAP-43 | Layout Basket/Thanh toán bỏ trống nửa phải | O9 |
| GAP-44 | Order Aging không drill-down xuống danh sách đơn | G-43 |
| GAP-45 | Benchmark: "TB Khu vực" là hằng; "Index 100" không khớp số; so sánh được với chính nó | G-34, O5 |

---

## 10. Quyết định nghiệp vụ

### 10.1. Quyết định đã chốt (16/10/2026)
| Mã | Chủ đề | Quyết định | Áp vào |
|---|---|---|---|
| **QĐ-01** | GMV, Giá trị điều chỉnh, Doanh thu thuần, đơn vị hiển thị | **GMV** = tổng giá trị đơn hợp lệ phát sinh trong kỳ, theo giá khách cam kết trả (đã trừ giảm giá trên đơn, gồm VAT), ghi nhận theo ngày tạo đơn, chưa trừ hoàn/hủy sau bán, không gồm phí vận chuyển; **chỉ tính đơn Hoàn thành**. **Giá trị điều chỉnh** = Trả hàng + Đơn đặt đã Hoàn thành nhưng không có Đơn hàng đi kèm (nghiệp vụ đổi hàng). **DTT** = GMV + Giá trị điều chỉnh. Định nghĩa được ghi thành văn bản và dùng nhất quán ở mọi widget. Widget **tự chọn đơn vị** để hiển thị số chính xác (0,5 tỷ → "500 Tr") | 6.1 (văn bản chính thức), M01, M02, M05, M06, M12–M13b, BR-FMT-02, FR-EX-01, FR-EX-03 (Waterfall 4 cột), FR-OP-10 |
| **QĐ-02** | AOV | DTT / Volume, gồm VAT, kèm bóc tách trước VAT; một định nghĩa cho mọi widget | M08, FR-EX-04, FR-EX-09 |
| **QĐ-03** | Nợ treo, ngưỡng | Nợ treo = **số dư cuối kỳ**; trần an toàn và các ngưỡng tô đỏ là **tham số cấu hình** (mặc định: trần nợ 1,5% GMV kế hoạch; tỷ lệ trả hàng 12%; hư hao Lab 2%) | M10, FR-EX-06, FR-EX-07, FR-HR-04 |
| **QĐ-04** | Tỷ lệ chuyển đổi, cơ cấu vùng | Cửa hàng: Đơn / Traffic; kênh online tách riêng; KTV dùng M15. Cơ cấu vùng theo cơ cấu quản lý thực tế — BOD cung cấp danh mục khu vực/chi nhánh chuẩn | M14, M15, BR-MD-01, BR-MD-02 |
| **QĐ-05** | Gom nhóm tuần | Tuần ISO (Thứ 2 – Chủ nhật); kỳ lẻ gắn nhãn "(một phần: n ngày)" | FR-FLT-04, BR-FLT-12 |
| **QĐ-06** | Basket Size, thanh toán | Dải < 0,5 · 0,5–1 · 1–3 · 3–5 · > 5 Tr (hiệu chỉnh lại theo phân vị khi có dữ liệu thật); danh mục thanh toán: Tiền mặt · Chuyển khoản · Thẻ (POS) · Ví điện tử · COD (online) · Trả góp | FR-OP-04, FR-OP-05, BR-FLT-11 |
| **QĐ-07** | Khoảng ngày mặc định | Từ đầu tháng hiện tại đến hôm qua | FR-SHELL-02 |
| **QĐ-08** | KPI | **Bỏ tính năng KPI cá nhân.** KPI chỉ có cấp Công ty / Khu vực / Chi nhánh. KPI chiến dịch ghi đè KPI tháng trong các ngày chiến dịch; phần còn lại của tháng phân bổ theo ngày | 2.4, 3.2, BR-TGT-01, 7.4 (gỡ mục tiêu cá nhân), 7.5 |
| **QĐ-09** | VAT | Thuế suất cấu hình trên **từng sản phẩm**; đơn tạo ra ở thời điểm thuế suất bao nhiêu thì ghi nhận bấy nhiêu | 2.5, M01a, AC-EX01-14 |
| **QĐ-10** | Xuất dữ liệu | Có xuất Excel/CSV từ modal chi tiết, P2, BOD/MANAGER, áp đúng RLS | FR-CMN-01 |
| **QĐ-11** | Heatmap, Traffic, import | Chấp nhận heatmap thay "thanh ngang"; MANAGER nhập Traffic cửa hàng mình, có lưu + audit; **bổ sung import Excel Traffic và import mục tiêu hàng loạt** | FR-EX-08, 7.7 (FR-IMP-01, FR-IMP-02), GAP-46 |
| **QĐ-12** | Phân tích Tăng trưởng | Giữ chuỗi thời gian (sửa theo BR-CMP) và thêm tab "Ma trận chi nhánh" (X = tăng trưởng DTT, Y = biên LN gộp; ngưỡng 0% và biên LN hệ thống) | FR-EX-09 |
| **QĐ-13** | Dữ liệu nguồn | Xem bảng dưới | 2.4, M14, M15, FR-OP-09, FR-OP-10, FR-HR-01, FR-HR-03 |
| **QĐ-14** | Vòng đời sản phẩm | Không thực hiện | FR-PR-01 |
| **QĐ-15** | Safety Stock / ROP | Theo đề xuất: SS = z × σ(nhu cầu ngày) × √(lead time), z = 1,65; ROP = nhu cầu TB ngày × lead time + SS | FR-PR-06 |

**Tình trạng dữ liệu nguồn (QĐ-13) và hệ quả**
| Dữ liệu | Tình trạng | Hệ quả trong bản 1 |
|---|---|---|
| Traffic cửa hàng | Cần nhập (tay / import Excel) | M14, Heatmap Traffic & Tỷ lệ CĐ, biểu đồ Tỷ lệ chuyển đổi dùng dữ liệu nhập; ô thiếu Traffic hiển thị "—" |
| Ca đo mắt | Chưa có | Hoãn M15 và bảng KTV khúc xạ (FR-HR-03); bỏ "KTV khúc xạ" khỏi bộ lọc đa chiều |
| Báo giá (phễu) | Chưa có | Hoãn biểu đồ phễu (AC-OP09-03) |
| Lý do hoàn/hủy | Chưa có | Hoãn phân rã nguyên nhân trả hàng (AC-OP10-03) |
| Độ hài lòng / NPS | Đã có | Dùng cho thẻ STAFF và trục "Độ hài lòng" của Benchmark; hiển thị đúng thang nguồn |
| Độ chính xác đo khám | Chưa có | Hoãn (cùng FR-HR-03) |

### 10.2. Điểm cần xác nhận thêm (phát sinh khi áp quyết định)
Tài liệu đang áp tạm **phương án PM** dưới đây; cần người xác nhận chốt trước khi phát triển phần liên quan.

| # | Câu hỏi | Phương án PM đang áp | Người xác nhận |
|---|---|---|---|
| 1 | Khoản trừ "Đơn đặt kết thúc không ra Đơn hàng" ghi nhận theo **ngày tạo đơn đặt** hay **ngày bấm Kết thúc**? | Ngày tạo đơn đặt — để khoản trừ triệt tiêu đúng kỳ đã ghi GMV, tránh DTT âm ở kỳ sau | Kế toán |
| 2 | Khi Đơn đặt chuyển thành Đơn hàng có giá trị khác (khách mua thêm/bớt), GMV lấy giá trị nào? Định nghĩa mới không còn khoản Upsell/Downsell | GMV lấy giá trị **Đơn đặt** (không cộng lại Đơn hàng, theo FRS 4.2); phần chênh lệch hiện **không được ghi nhận** ở đâu. Cần quyết định chấp nhận hay đưa vào Giá trị điều chỉnh | BOD + Kế toán |
| 3 | Chỉ tính đơn Hoàn thành nhưng ghi theo ngày tạo, nên GMV của các kỳ gần đây tăng dần khi đơn đặt hoàn thành. Chấp nhận số "Tạm tính"? | Chấp nhận; gắn nhãn "Tạm tính" và hiển thị giá trị đơn đặt còn mở (BR-GMV-01) | BOD |
| 4 | Volume có trừ Đơn đặt "Kết thúc" không ra Đơn hàng không? | Có — để AOV = DTT / Volume nhất quán và không đếm trùng với Đơn hàng mới | BOD |
| 5 | Giá trị Trả hàng tính thế nào? | Theo giá trị dòng hàng trả (giá cam kết sau giảm giá, gồm VAT, không phí ship), đối xứng với GMV | Kế toán |
| 6 | Sau khi bỏ KPI cá nhân, MANAGER còn quyền gì ở module KPI? | Chỉ xem KPI phạm vi mình; BOD tạo/sửa/import mọi KPI | BOD |
| 7 | Khối "Nhân viên xuất sắc" của STAFF dựa trên gì khi không còn chỉ tiêu cá nhân? | Top 3 doanh số cửa hàng trong kỳ; nếu không chọn thì gỡ khối này | BOD |
| 8 | Công đoạn "Đo khám" của Order Aging có trạng thái tương ứng trên đơn không (QĐ-13 nêu chưa có dữ liệu ca đo mắt)? | Giữ nếu đơn có trạng thái "Đang đo mắt"; nếu không thì bỏ hàng "Đo khám" | Tech Lead |
| 9 | Phí vận chuyển và giảm giá cấp đơn được lưu thế nào (dòng riêng?), phân bổ giảm giá xuống dòng hàng ra sao để tính VAT theo sản phẩm? | Phí ship là dòng riêng, loại khỏi GMV; giảm giá cấp đơn phân bổ theo tỷ lệ giá trị dòng | Tech Lead + Kế toán |

---

## Phụ lục A — Bộ số liệu đối chứng ở bộ lọc mặc định (dữ liệu giả lập)
Dùng để kiểm thử hồi quy prototype. Bộ lọc: BOD · Tuần · 01/06–30/09/2026 · Tất cả · UTC+7. **Cả 2 luồng ra cùng kết quả** (BA tính từ engine, DA đọc trên UI).

| Widget | Giá trị |
|---|---|
| Thẻ GMV | 4,22 Tỷ ↑21,7% · Trước VAT 3,90T, VAT 0,31T |
| Thẻ Khách hàng mới | 1554 ↑21,2% |
| Thẻ Doanh thu | 4,43 Tỷ |
| Thẻ Giá trị điều chỉnh | −211 Tr, ↓15,4% (đỏ, cố định) |
| Thẻ Doanh thu thuần | 3,70 Tỷ ↑21,6% |
| Thẻ Nợ treo | 63 Tr, "↓20,9%" đỏ, chiếm 1,5% GMV |
| Thẻ Biên LN gộp | 72,7% ↑0,1% |
| Thẻ Volume | 5.181 ↑21,2% |
| Thẻ AOV | 0,7 Triệu/Đơn ↑0,3% |
| Waterfall | 4.216 → −211 → 4.005 Tr (95,0%) |
| Hiệu quả đơn hàng | AOV 813.773 ₫ · Volume 288 đơn/kỳ (tổng 5.181) · UPT 2,35 |
| Xu hướng lũy kế | GMV 4.216/5.082 Tr (83%, chậm −17%) · DTT 3.695/4.235 (87%, 87,6% GMV) · Nợ 63,4/76,2 Tr |
| Bảng xếp hạng | ĐN CN2 1.265 · HN CN1 1.054 · BD CN3 843 (14,0% đỏ) · CN4 632 · HN CN5 422 · Tổng 4.216 / 3.876 / 8,1% |
| Local Miền Bắc | GMV 1.476 Tr (35,0%) |
| Chu kỳ Quý | Quý 2 = 856 Tr (chỉ tháng 6) · Quý 3 = 3.360 Tr |
| Tăng trưởng chung GMV | Ngày −1,2% · Tuần −1,4% · Tháng −2,1% · Quý +16,1% · Năm +13,7% |

## Phụ lục B — Truy vết FRS → Đặc tả
| Mục FRS | Đặc tả này | Ghi chú |
|---|---|---|
| §2 Phân quyền | Mục 3 | Bổ sung RLS, quyền KPI |
| §3.1 Tổng quan | 7.1 (FR-EX-01…09) | Bổ sung FR-EX-04 (chưa có trong FRS); QĐ-11, QĐ-12 thay đổi thiết kế Heatmap/Tăng trưởng |
| §3.2 Vận hành | 7.2 (FR-OP-01…10) | |
| §3.3 Sản phẩm | 7.3 (FR-PR-01…06) | |
| §3.4 Nhân sự | 7.4 (FR-HR-01…04) | Bỏ mục tiêu cá nhân (QĐ-08); hoãn bảng KTV (QĐ-13) |
| §3.5 KPI | 7.5 (FR-KPI-01…04) | Bổ sung mô hình dữ liệu, vòng đời, Quý |
| §4.1–4.3 Quy trình đơn, GMV, Điều chỉnh | 6.1, M01, M05, M06 | **Thay thế** bằng định nghĩa QĐ-01 (chỉ đơn Hoàn thành; Điều chỉnh = Trả hàng + Đơn đặt kết thúc không ra Đơn hàng) |
| §4.4 Checklist chỉ số | 6.2 (M01–M17) | Thay thế |
| §4.5 So sánh kỳ | 6.3 (BR-CMP) | Mở rộng cho biểu đồ theo bucket |

## Phụ lục C — Nguồn làm việc (bằng chứng chi tiết, có file:dòng và số đo UI)
- [Báo cáo Luồng 1 — BA](track1_code_BA.md): 54 gap, từ điển chỉ số, giá trị kỳ vọng, 13 câu hỏi PM + 27 câu hỏi cho DA.
- [Báo cáo Luồng 2 — DA](track2_ui_DA.md): kiểm thử UI 5 trang × 3 vai trò, kiểm tra số liệu, xác minh 27 câu hỏi BA (§8), xác minh lại Độ lệch % (§10).
- [Trả lời chéo của BA cho câu hỏi DA](track1_BA_answers.md).

**Kết quả đối chiếu chéo:** 27/27 câu hỏi của BA được DA kiểm trên UI. 25 câu xác nhận, 1 câu bác bỏ (Header chồng FilterBar — không xảy ra), 1 câu xác nhận một phần (Benchmark chỉ đổi số sau F5, không đổi khi chuyển tab). 8 câu hỏi của DA được BA giải thích trong code; 1 phát hiện của DA (E14) được rút lại sau khi đo lại.
