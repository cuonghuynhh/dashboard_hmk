# QC-C — Kiểm toán Frontend Dashboard V2 (pos.gui) so với PRODUCT_SPEC_DASHBOARD.md v2.0

| Thuộc tính | Giá trị |
|---|---|
| Phạm vi | Phase 1 (audit, không sửa mã). Frontend `pos.gui`, nhánh `929-new-dashboard` @ `6ab6f78e` |
| Gốc đối chiếu | `docs/PRODUCT_SPEC_DASHBOARD.md` v2.0 (§0, 1, 3.1–3.3, 4, 5, 6, 7, 11) |
| Cách làm | Đọc tĩnh toàn bộ `src/pages/dashboard-v2/**`, `src/components/report-dashboard/{BranchPerformanceHeatmap,TrafficInputModal}.vue`, `src/apis/{apiClient.ts,helpers/cancelRequestInterceptor.ts}`; chạy `npm ci`, `vue-tsc`, `eslint`, `vitest`. Không chạy được app với backend thật nên mục (4) là suy luận từ mã, kèm cách xác nhận. |
| Mức độ | Theo §0.4: Nghiêm trọng / Lớn / Nhỏ |

---

## 0. Tóm tắt điều hành

1. **Mã V2 trên `origin/main` và `929-new-dashboard` gần như giống hệt về logic.** `main` chỉ khác ở việc đã format lại (dấu chấm phẩy, printWidth 200); `929` hơn `main` đúng 1 commit (`6ab6f78e`, quyền GMV). Đề xuất: làm phase 2 trên nhánh mới cắt từ `origin/main` rồi cherry-pick `6ab6f78e`.
2. **Dashboard V2 hiện chưa đạt spec v2.0 ở mức cấu trúc.** Trong 9 thẻ tài chính thiếu **Nợ treo**. Waterfall chỉ có 3 cột, không đủ 5 cột. Bảng xếp hạng thiếu tab Sản phẩm, % đạt mục tiêu và Tỷ lệ trả hàng. Xu hướng lũy kế thiếu chế độ "Đồng bộ cả 3", Combo và Nợ treo. Phân tích tăng trưởng thiếu các tab AOV, Volume, UPT và đường "Kỳ trước". Hiệu quả đơn hàng AOV–Volume–UPT (FR-EX-04) **hoàn toàn không có**.
3. **Định dạng tiền sai nghiêm trọng so với BR-FMT-02.** Không có hàm tự chọn đơn vị. Thẻ KPI chia cứng cho 1 tỷ nên 512.300.000 ₫ hiển thị "0,5 Tỷ VNĐ" (spec: "512 Tr"). Trục biểu đồ dùng "T/M/K", chú thích thẻ dùng "T", bảng dùng ₫ đầy đủ. Không đạt TC-09 (0/7 ca đạt).
4. **Trạng thái "Đang tải dữ liệu..." vĩnh viễn:** có 3 cơ chế trong mã (xem §4). (a) Trạng thái `idle` bị hiển thị y như `loading`. (b) Không có timeout, kèm chuỗi retry/fallback tuần tự và request trùng lặp. (c) Widget Waterfall và GMV-vs-DTT tự suy ra "một phần chỉ số chưa đồng bộ" từ việc **chưa có dữ liệu**, nên dòng chữ đỏ trong ảnh chụp là **chẩn đoán sai**, không phản ánh backend trả thiếu.
5. **Bộ lọc:** chu kỳ chỉ có Ngày / Tùy chọn ngày / Quý / Năm (không có Tuần, Tháng, và Quý/Năm bị ánh xạ nhầm sang tuần/tháng). Mặc định là **cả tháng hiện tại (đến 31/10, gồm ngày tương lai)**, không phải "đến hôm qua". Ô ngày dùng `<input type=date>` nên hiển thị theo locale trình duyệt (MM/DD/YYYY). Không validate Từ > Đến. Không có bộ lọc đa chiều, không có nhãn "Đang lọc riêng", không lưu URL, không cascade chi nhánh → khu vực.
6. **Phân quyền UI:** mọi tab và quyền ghi KPI đều dùng chung `manager.dashboard.read` (`routeGuard.ts:2-9`). Không phân biệt BOD, MANAGER, STAFF nên MANAGER thấy tab Tổng quan và **có quyền ghi KPI** (vi phạm AC-ROLE-04, mức Nghiêm trọng). Chỉ GMV có cổng quyền riêng.
7. **Dữ liệu mock / hoãn đang hiển thị:** bảng KTV khúc xạ [Hoãn], "Tiến độ KPI tuần" và Gamification (KPI cá nhân, cấm theo QĐ-08), Hình thức thanh toán (mock 42/58), Chiến dịch (mock), Traffic/Tỷ lệ chuyển đổi của Benchmark (mock). Tất cả vi phạm BR-DATA-01 / QĐ-13.
8. **Công thức tính ở client:** gom tuần/tháng, AOV theo bucket, biên LN theo bucket, tăng trưởng theo bucket, "Trung bình hệ thống" của radar. AOV gom bucket đúng dạng gia quyền (ΣDTT/ΣĐơn). Nhưng so sánh kỳ dùng "−1 tháng / −7 ngày / −1 năm" thay vì BR-CMP-01 (n ngày liền trước), và mẫu số âm vẫn tính tăng trưởng (vi phạm BR-CMP-04).
9. **Mũi tên thẻ KPI** suy từ "tốt/xấu" chứ không theo chiều thay đổi thực (vi phạm BR-CMP-05). Sparkline của thẻ dùng dữ liệu của widget GMV-vs-DTT, nên bị **ảnh hưởng bởi bộ lọc cục bộ và bị cắt 3 tháng** (FE-EX-12).
10. **Chất lượng build:** `vue-tsc` sạch; ESLint 0 lỗi / 151 cảnh báo style; vitest **188/188 đạt** (33 file) khi dùng `NODE_OPTIONS=--no-experimental-webstorage`. Dưới Node v26.7.0 mặc định, 15/33 file lỗi do `localStorage` (lỗi môi trường, không phải mã). Các test hiện tại **khóa các hành vi sai so với spec** (ví dụ 3 cột Waterfall, chuỗi "T/M/K") nên pass không có nghĩa là đạt spec.
11. Tổng hợp 150 dòng kiểm ở §3: **Nghiêm trọng 15 · Lớn 70 · Nhỏ 53**, còn lại 12 dòng Đạt (ghi "—"). Một số dòng "Đạt một phần" vẫn được tính vào mức độ của phần chưa đạt.

---

## 1. Khuyến nghị nhánh nền (baseline)

**Lệnh đã chạy:**
- `git log --oneline origin/929-new-dashboard..origin/main -- src/pages/dashboard-v2 src/components/report-dashboard tests/dashboard-v2 e2e/dashboard-v2` trả về 10 commit, gồm 2 commit format (`9bd67f16` "format lại 200 printWidth", `cc131c86` "update format code") và 8 merge/PR của chính `929-new-dashboard` vào `main`/`production-hmk`.
- Chiều ngược lại `origin/main..origin/929-new-dashboard` trả về **1 commit**: `6ab6f78e` "1001-up phan quyen dashboard" (21 file, +321/−19; thêm quyền `manager.dashboard-v2.gmv.read`, ẩn GMV, test, doc).

**Kiểm chứng "chỉ khác format":** chuẩn hóa (bỏ khoảng trắng, `;`, `,`, nháy) rồi so MD5 giữa 2 nhánh. Các file sau trùng khớp: `dashboardV2Api.ts`, `useExecutiveBlockSnapshot.ts`, `OperationalView.vue`, `PersonnelView.vue`, `ProductView.vue`, `MetricCard.vue`, `ExecutiveRevenueWaterfall.vue`, `executiveTrendAggregation.ts`. Hai file khác (`types.ts`, `KpiManagementView.vue`) chỉ khác ngắt dòng / quyền. `git diff --stat origin/main...origin/929-new-dashboard` chỉ 21 file đúng như commit quyền. Phần còn lại của 86 file khác biệt khi `git diff` trực tiếp là do format.

**Kết luận:** `origin/main` **không mới hơn về tính năng**, chỉ mới hơn về format (và có các thay đổi ngoài phạm vi V2, ví dụ RFID, "vượt định mức tồn"). `929-new-dashboard` mới hơn về **quyền GMV**.

**Khuyến nghị:**
1. Cắt nhánh phase 2 từ `origin/main` (đích merge cuối cùng, và lưu theo chuẩn format printWidth 200 có `;`).
2. `git cherry-pick 6ab6f78e`. Sẽ có xung đột do khác format; giải quyết bằng cách áp lại thay đổi rồi chạy prettier/eslint theo cấu hình của `main`. Cách khác: merge `main` vào `929` rồi `prettier --write`, nhưng diff lớn khó review.
3. Trước khi sửa, chạy lại `tests/dashboard-v2` trên nhánh mới để có baseline xanh (cần `NODE_OPTIONS=--no-experimental-webstorage` nếu dùng Node ≥ 25, hoặc dùng Node 20 trong `~/.nvm`).
4. Cần xác nhận môi trường người dùng chụp ảnh đang chạy build nào (xem §7 Câu hỏi 1). Ảnh có GMV hiển thị nên hoặc là `main` (không có cổng quyền GMV), hoặc tài khoản có quyền `manager.dashboard-v2.gmv.read`.

---

## 2. Kiểm kê widget so với spec

Thứ tự hiển thị trong code (`index.vue:50-62`, `ExecutiveView.vue:493-662`, các view khác).

### 2.1. Tab Tổng quan (BOD) — thứ tự spec: thẻ → GMV vs DTT | Waterfall → Hiệu quả đơn hàng → Phân rã GMV → Lũy kế → Xếp hạng → Heatmap → Tăng trưởng

| # | Widget trong code | File | FR spec | Trạng thái | Dữ liệu |
|---|---|---|---|---|---|
| 1 | Khối "TỔNG QUAN CHỈ SỐ KINH DOANH" (8 thẻ) | `ExecutiveOverviewCards.vue` | FR-EX-01 (9 thẻ) | **Thiếu thẻ Nợ treo**; phụ đề sai; đơn vị sai | Live (API V2) |
| 2 | GMV so với Doanh thu thuần (cột + đường) | `ExecutiveGmvNetRevenueChart.vue` | FR-EX-02 | Thiếu nhãn "−x,x%" trên cột, tooltip dùng "Drop rate"; có bộ lọc cục bộ + Ngày/Tuần/Tháng (thiếu Quý/Năm) | Live |
| 3 | Waterfall doanh thu | `ExecutiveRevenueWaterfall.vue` | FR-EX-03 | **3 cột** (spec 5 cột); không chia 3 khoản điều chỉnh; không tooltip % GMV / số đơn | Live |
| 4 | — | — | **FR-EX-04 Hiệu quả đơn hàng AOV–Volume–UPT** | **THIẾU hoàn toàn** (3 thẻ, 3 chế độ phóng to / Combo / độ lệch %) | — |
| 5 | Phân rã GMV | `ExecutiveGmvBreakdownChart.vue` | FR-EX-05 | Nhãn "Direct/PreOrder" (spec "Đơn lắp sẵn/Đơn đặt trước"); không nhãn % trong khúc | Live |
| 6 | Xu hướng lũy kế | `ExecutiveCumulativeTrendChart.vue` | FR-EX-06 | Chỉ 1 chế độ. Thiếu 3 thẻ đồng bộ, Nợ treo, Combo, "Vượt/Chậm tiến độ", Nhận xét, trần nợ; luôn từ 01/01 | Live (target từ backend) |
| 7 | Xếp hạng hiệu suất | `ExecutivePerformanceRanking.vue` | FR-EX-07 | Thiếu tab Sản phẩm, #, Tỷ trọng, % đạt MT, Tỷ lệ trả hàng (có "Drop Rate"/"Contribution"), Top 5 + "Xem tất cả" | Live |
| 8 | Bản đồ hiệu suất chi nhánh | `BranchPerformanceHeatmap.vue` (shared) | FR-EX-08 | Thang màu 4 mức sai; gọi API cũ `/Admin/Report/BranchPerformanceHeatmap`; chỉ Top-10 chi nhánh; có "Nhập Traffic"; **thiếu "Import Traffic"** | Live (nhưng lệ thuộc `branchPerformance`) |
| 9 | Phân tích Tăng trưởng | `GrowthAnalysisChart.vue` | FR-EX-09 | Metric GMV/Net Revenue/Doanh thu/Doanh số (spec GMV/DTT/AOV/Volume/UPT); chỉ cột growth bucket-vs-bucket | Live |
| — | Extra: bộ chọn "So sánh" WoW/MoM/YoY ẩn (`sr-only`) | `ExecutiveView.vue:508-516` | không có trong spec | Extra (kỳ so sánh phải là n ngày liền trước) | — |
| — | Extra: công tắc Có VAT / Không VAT (đang tắt `showVatSwitch=false`) | `ExecutiveView.vue:100` | không có | Extra, đã ẩn | — |

### 2.2. Tab Vận hành & Khách hàng

| # | Widget | File | FR | Trạng thái | Dữ liệu |
|---|---|---|---|---|---|
| 1 | Cảnh báo tồn đọng | `OrderAgingChart.vue` | FR-OP-01 | Chỉ nhóm tuổi 5–10 / 10–20 / >20 ngày (bỏ nhóm 0–5, 6–10…); **không có hàng theo công đoạn Mài lắp / Vận chuyển**; nhãn "Theo Value"; modal tự dựng không Esc | Live / `partial` |
| 2 | Time Peak | `TimePeakChart.vue` | FR-OP-02 | Đúng 7×7; toggle "Theo Doanh thu" (spec GMV); không chú thích số đơn ngoài khung | Live |
| 3 | Nhân khẩu học | `DemographicCharts.vue` | FR-OP-03 | Có donut, cột tuổi, tháp; nhãn English; thứ tự nhóm tuổi theo dữ liệu | Live |
| 4 | Phân khúc hóa đơn | `BasketRefundCharts.vue` (show=basket) | FR-OP-04 | Có; đơn vị "đ" | Live |
| 5 | Hình thức thanh toán | `OperationalView.vue:~190` | FR-OP-05 | Chỉ 2 khúc mock (Tiền mặt 42% / Chuyển khoản 58%); thiếu 4 phương thức; không tooltip | **MOCK** |
| 6 | Hiệu quả chiến dịch | `OperationalView.vue:~215` | FR-OP-06 | Bảng 3 cột "Tên / Giá trị / Trạng thái dữ liệu: Minh họa"; thiếu GMV/DTT/Số đơn/AOV | **MOCK** |
| 7 | Benchmark (radar) | `RegionalBenchmark.vue` | FR-OP-07 | Chọn "Phân tích" nhưng **không có "So với"**, không toggle Khu vực/Chi nhánh; Traffic, Conversion, CSAT mock | Live + **MOCK** |
| 8 | Phát hiện bất thường | `AnomalyChart.vue` | FR-OP-08 | Label cứng "Theo Khu vực" (không chọn được); không chọn chỉ số / thực thể; không dải tin cậy | Live (do backend tính) |
| 9 | Tỷ lệ chuyển đổi | `OperationalView.vue:~245` | FR-OP-09 | Thanh ngang giá trị `item.value` (đơn vị không rõ), không trục 0–100%, không "Chưa có Traffic" | **MOCK** (traffic) |
| 10 | Tỷ lệ trả hàng | `BasketRefundCharts.vue` (show=refund) | FR-OP-10 | Chỉ 2 cột (M12, M13) và gọi "hoàn tiền"; thiếu M13b, M13c | Live |

Phải ẩn theo QĐ-13: phễu chuyển đổi, nguyên nhân trả hàng/hủy, công đoạn "Đo khám" → **không thấy trong code** (đạt). Nhưng bảng **KTV khúc xạ nằm ở tab Nhân sự** (xem 2.4).

### 2.3. Tab Sản phẩm & Tồn kho

| # | Widget | File | FR | Trạng thái | Dữ liệu |
|---|---|---|---|---|---|
| 1 | Tăng trưởng sản phẩm | `ProductGrowthChart.vue` | FR-PR-01 | Có tab ngành/nhóm/thương hiệu; chưa đối chiếu chi tiết (không đọc hết 197 dòng) | Live |
| 2 | Phân tích đa chiều | `ProductView.vue:~175` | FR-PR-02 | Chỉ 2 chiều ("Từng ngành hàng", "Phân khúc giá") trên 10 chiều spec; metric "Doanh thu" (spec GMV); nút xem chi tiết không có handler | Live / `partial` |
| 3 | Cấu trúc danh mục (Treemap) | `ProductTreemap.vue` | FR-PR-03 | `nodeClick:false`, `breadcrumb.show:false` → **không drill-down**; không modal; dùng `revenue` | Live |
| 4 | Ma trận phôi tròng | `ProductOpticalMatrix.vue` | FR-PR-04 | **Placeholder tĩnh** "Dữ liệu Sphere và Cylinder chưa được đồng bộ" | Không có |
| 5 | Thương hiệu phân phối | `ProductBrandDistribution.vue` | FR-PR-05 | **Component mồ côi, không được dùng** trong `ProductView` → widget không xuất hiện | — |
| 6 | Top sản phẩm & vật tư | `TopProductTable.vue` | FR-PR-06 | Thiếu NCC, Tồn hiện tại, SS, ROP, cảnh báo đỏ; "Xem toàn bộ danh mục" không có handler | Live |
| 7 | Tồn kho sản phẩm | `InventoryDrilldown.vue` | không có trong spec | Extra (Tồn/Nhập/Vòng quay/Dead stock) | Live |

### 2.4. Tab Hiệu suất Nhân sự

| # | Widget | File | FR | Trạng thái | Dữ liệu |
|---|---|---|---|---|---|
| 1 | Bảng xếp hạng PIC Sales | `SalesLeaderboard.vue` | FR-HR-02 | Xếp theo `rank` backend (field `revenue`, chưa rõ GMV hay DTT); phân trang 5; thanh so với người đứng đầu (spec: tỷ trọng trong phạm vi); thiếu cột Chi nhánh, dòng "Chưa gán người bán" | Live |
| 2 | Hiệu suất KTV Khúc Xạ | `PersonnelMockBlocks.vue:~30` | **FR-HR-03 [Hoãn] — không được hiển thị** | **ĐANG HIỂN THỊ** | **MOCK** |
| 3 | Hiệu suất Phòng Lab | `PersonnelMockBlocks.vue:~85` | FR-HR-04 | Hàng theo "Phòng Lab" (spec: theo KTV mài lắp); không tô đỏ hư hao > 2% | **MOCK** |
| 4 | Tiến độ KPI tuần | `PersonnelMockBlocks.vue:130` | **không có; vi phạm QĐ-08 (KPI cá nhân)** | ĐANG HIỂN THỊ | **MOCK** |
| 5 | Gamification | `PersonnelMockBlocks.vue:130` | không có trong spec | Extra | **MOCK** |
| 6 | Scorecard hiệu suất nhân sự | `PersonnelScorecard.vue` | FR-HR-01 (góc nhìn STAFF) | Hiển thị cả cho MANAGER; so với TB cửa hàng; CSAT chia /5; **không có thẻ Xếp hạng nội bộ "Hạng r/n" và "Nhân viên xuất sắc" Top-3** | Live |

### 2.5. Tab Quản lý KPI

| # | Widget | File | FR | Trạng thái |
|---|---|---|---|---|
| 1 | Thẻ thống kê (3) | `KpiManagementView.vue:153-194` | FR-KPI-01 | Tính **trên trang hiện tại (20 dòng)** chứ không phải toàn bộ; "KPI đạt mục tiêu kỳ trước" thực chất là `endedCount/total` (đếm trạng thái Đã kết thúc) |
| 2 | Danh sách KPI | `KpiTable.vue` | FR-KPI-02 | Page size 20 (spec 10); có tìm kiếm + lọc; thiếu nút **Import mục tiêu**; cột thiếu Tỷ lệ chuyển đổi/Traffic/AOV (chưa kiểm hết); thiếu "Lịch sử phiên bản" |
| 3 | Chỉnh sửa hàng loạt | `KpiBulkActionBar.vue`, `KpiBulkUpdateModal.vue` | FR-KPI-03 | Có; chưa kiểm chi tiết |
| 4 | Wizard cấu hình KPI | `KpiConfigurationModal.vue` | FR-KPI-04 | Có 3 bước + xung đột 3 lựa chọn (`KpiConflictResolution.vue`, màu **vàng** thay vì đỏ); trường chính là "Doanh thu (VNĐ)" (không phải "Mục tiêu GMV" bắt buộc); cho phép giá trị 0; có phạm vi **Nhân viên** (cấm theo QĐ-08) |
| 5 | Import mục tiêu hàng loạt | — | FR-IMP-02 | **THIẾU** |
| 6 | Import Traffic (Excel) | — | FR-IMP-01 | **THIẾU** (chỉ có nhập tay `TrafficInputModal`) |

### 2.6. Khung ứng dụng và thành phần chung

| Hạng mục | FR | Trạng thái |
|---|---|---|
| Header: tên "EBID Workspace", "Dữ liệu tính đến", nút Cấu hình KPI, avatar | FR-SHELL-01 | Header chỉ có `<h1>Dashboard V2</h1>` + tab (`DashboardV2Header.vue:13-15`); `dataAsOf` có trong type nhưng **không hiển thị ở đâu** |
| Nút Đồng bộ | AC-SHELL-01 | Nút "↻ Làm mới bộ lọc" chỉ tải lại danh mục khu vực/chi nhánh (`DashboardV2FilterBar.vue:155`), **không tải lại dữ liệu** |
| Modal "Xem chi tiết dữ liệu" | FR-CMN-01 | Chỉ có modal Order Aging và Inventory, tự dựng; **không Esc / click nền**; không tìm kiếm / sort / "Không có dữ liệu" |
| Tooltip (i) | FR-CMN-02 | Chỉ ở thẻ KPI, mở bằng **click**, công thức kỹ thuật ("Σ ProductAmount của Valid Sale Order") không phải công thức spec |
| Trạng thái rỗng / lỗi / đang tải | FR-CMN-03 | Rỗng: "Không có dữ liệu" không có "Xóa bộ lọc"; lỗi có "Thử lại" (đạt); đang tải: chữ nhấp nháy, **không skeleton** |

---

## 3. Phát hiện (mẫu §11.3)

Kết quả: **KĐ** = Không đạt, **Đ** = Đạt, **KĐ-1P** = đạt một phần.
Bằng chứng ghi `file:dòng` (đường dẫn tính từ `pos.gui/src/pages/dashboard-v2/` nếu không ghi tiền tố khác).

### 3.A. Tab Tổng quan

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| FE-EX-01 | 9 thẻ tài chính | Đọc `definitions[]` | 9 thẻ: GMV, KH mới, Doanh thu thực thu, Điều chỉnh, DTT, **Nợ treo**, Biên LN, Volume, AOV (AC-EX01-01) | Chỉ 8 thẻ, **không có Nợ treo** (M10); không có trường nợ trong `types.ts` | KĐ | Lớn | `components/ExecutiveOverviewCards.vue:122-240`; grep "Nợ treo" = 0 kết quả |
| FE-EX-02 | Phụ đề 9 thẻ | So bảng FR-EX-01 | GMV: "Trước VAT … · VAT …"; DTT: "x,x% GMV"; Điều chỉnh: "Trả hàng −a · Đổi hàng −b · Hủy −c"; Volume: "Gộp: M02g · Kết thúc/Hủy: −k"; AOV: "Trước VAT: …" | Tất cả dùng "Có VAT: … \| Không VAT: …"; Volume ghi "Đã hoàn thành"; Điều chỉnh ghi "Có VAT · Không VAT"; DTT thiếu "% GMV" | KĐ | Lớn | `ExecutiveOverviewCards.vue:118-120,136,150,165,180,195,209,223,238` |
| FE-EX-03 | Tên thẻ | BR-FMT-05 | "Doanh thu (thực thu)", "Đơn hàng (Volume)", "AOV" | "DOANH THU ĐÃ THU", "GIÁ TRỊ ĐƠN TB (AOV)" | KĐ | Nhỏ | `ExecutiveOverviewCards.vue:155,227` |
| FE-EX-04 | Đơn vị tiền thẻ KPI | TC-09, AC-EX01-05: 512.300.000 → "512 Tr" | Tự động Tỷ/Tr/₫ (BR-FMT-02) | Thang cứng: GMV/Thu/Điều chỉnh/DTT chia 1e9, 1 số lẻ, hậu tố "Tỷ VNĐ". 512.300.000 → "0,5 Tỷ VNĐ"; 5.722.400 → "0 Tỷ VNĐ"; −1.630.000 → "-0 Tỷ VNĐ"; 194.400 → "0 Tỷ VNĐ"; 4.216.000.000 → "4,2 Tỷ VNĐ" (spec 4,22 Tỷ) | KĐ | **Nghiêm trọng** (hiển thị gây hiểu sai số; nhóm Định dạng nhưng ảnh hưởng đọc số liệu BOD) | `ExecutiveOverviewCards.vue:78-94,130-131,174-175,189-190` |
| FE-EX-05 | Hậu tố "T", "VNĐ", "Triệu/Đơn" | BR-FMT-02 chỉ cho phép Tỷ/Tr/₫ | Không dùng "T", "đ", "Triệu" | Chi tiết thẻ dùng `'T'` và `'Tr'`; đơn vị thẻ "Tỷ VNĐ", "Triệu/Đơn" | KĐ | Nhỏ | `ExecutiveOverviewCards.vue:119,180,238,130,240` |
| FE-EX-06 | Tooltip hiển thị đủ ₫ | AC-EX01-05 | Tooltip có "512.300.000 ₫" | Thẻ không có tooltip giá trị; (i) chỉ chứa mô tả/công thức | KĐ | Nhỏ | `components/MetricCard.vue:153-160` |
| FE-EX-07 | Mũi tên theo chiều thay đổi thực | BR-CMP-05, AC-EX01-04 | ↑ khi tăng, ↓ khi giảm; màu theo tốt/xấu; Nợ treo tăng → ↑ đỏ | Mũi tên = `trendDirection === 'positive' ? '↑' : '↓'`, mà `positive` nghĩa là "tốt". Với chỉ số nghịch (Điều chỉnh), độ lớn giảm → "↑" xanh dù giá trị tăng/giảm khác chiều. Không có chỉ số nghịch thật nào khác (Nợ treo vắng, tỷ lệ không có) | KĐ | **Nghiêm trọng** (vi phạm trực tiếp lỗi mẫu §11.4 #12) | `components/MetricCard.vue:63-74,219` |
| FE-EX-08 | Tăng trưởng mẫu số 0/âm | BR-CMP-04 | "—" khi mẫu số ≤ 0 | `calculateGrowth` chỉ chặn `previous === 0`, mẫu âm vẫn tính bằng `/ Math.abs(previous)` (DTT kỳ trước âm cho ra % hợp lệ nhưng sai quy ước) | KĐ | Lớn | `ExecutiveOverviewCards.vue:113-116` |
| FE-EX-09 | Chỉ số dạng tỷ lệ theo điểm % | BR-CMP-07 | Biên LN: "+0,3 điểm %" | Biên LN dùng % tương đối như các thẻ khác | KĐ | Lớn | `ExecutiveOverviewCards.vue:113-116,198-210`; `MetricCard.vue:82-94` |
| FE-EX-10 | Chân thẻ 2 kỳ (BR-CMP-06) | Đọc `periodLabel`, `comparisonPeriodLabel` | `DD/MM/YYYY — DD/MM/YYYY` cho cả 2 kỳ | Kỳ gốc đúng; kỳ so sánh lấy từ backend (`previous.data.startAt`) và chỉ hiện khi API trả | KĐ-1P | Nhỏ | `ExecutiveOverviewCards.vue:242-264` |
| FE-EX-11 | Kỳ so sánh = n ngày liền trước | BR-CMP-01, AC-EX01-03 | `[S−n, S−1]` | Mặc định `comparisonType: 2` (MoM). Fallback client dịch kỳ "−7 ngày / −1 tháng / −1 năm" (`moment.subtract(1,'month')`), không phải n ngày. Với 17–19 ngày lẻ cho kết quả khác spec | KĐ | **Nghiêm trọng** (sai số so sánh kỳ) — còn phụ thuộc cách backend tính; cần backend xác nhận | `composables/useDashboardV2Filter.ts:16`; `services/dashboardV2Api.ts:141-162` |
| FE-EX-12 | Sparkline thẻ | FR-EX-01: sparkline theo ngày của (K,P) | Dữ liệu ngày của bộ lọc toàn cục | Sparkline lấy từ `gmvNetData` (= snapshot của widget GMV-vs-DTT). Snapshot đó bị đổi khu vực/chi nhánh cục bộ và bị cắt "3 tháng gần nhất" khi Chu kỳ ≠ Năm. Đổi bộ lọc cục bộ của widget làm **sparkline các thẻ KPI thay đổi** | KĐ | **Nghiêm trọng** (INV-12/BR-FLT-05: bộ lọc cục bộ rò sang widget khác) | `views/ExecutiveView.vue:524`, `204-216`, `226` |
| FE-EX-13 | Thẻ VAT/GMV bị lệch ngữ nghĩa | M01a | "Trước VAT … · VAT …" | Hiển thị "Có VAT" vs "Không VAT" (không tách VAT riêng) | KĐ | Nhỏ | `ExecutiveOverviewCards.vue:118-120` |
| FE-EX-14 | Thiếu giá trị → hiển thị | BR-FMT-04 | "—" | "Chưa đồng bộ" ở mọi nơi (EXECUTIVE_UNAVAILABLE_LABEL) | KĐ | Nhỏ | `utils/executiveFormatters.ts:4`; `MetricCard.vue:60-61` |
| FE-EX-15 | GMV vs DTT: nhãn "−x,x%" trên cột | AC-EX02-01 | Mỗi bucket có % chênh trên đỉnh cột | Chỉ có trong tooltip ("Drop rate"), không nhãn trên cột | KĐ | Lớn | `components/ExecutiveGmvNetRevenueChart.vue:119-133,150-166` |
| FE-EX-16 | GMV vs DTT: tooltip | AC-EX02-02 | GMV, DTT, Chênh lệch, % chênh + giá trị ₫ | Có đủ, nhưng nhãn English "Drop rate" | KĐ-1P | Nhỏ | `ExecutiveGmvNetRevenueChart.vue:126-132` |
| FE-EX-17 | Trục Y bắt đầu từ 0 | NFR-07 | Cột bắt đầu 0 | `yAxis: {type:'value'}` không đặt `min`; ECharts với series bar mặc định có 0, nhưng khi có DTT âm trục tự mở rộng. Chưa đặt tường minh | KĐ-1P | Nhỏ | `ExecutiveGmvNetRevenueChart.vue:145-149` |
| FE-EX-18 | Nhãn trục + đơn vị trục | BR-FMT-02, FR-FLT-04 | Nhãn bucket `DD/MM`, `Tuần NN (DD/MM–DD/MM)`, `MM/YYYY`; đơn vị Tỷ/Tr dùng chung | Nhãn luôn `DD/MM/YYYY` của ngày đầu bucket (kể cả theo tuần/tháng); trục "T/M/K" (1,2T / 450M / 3K) | KĐ | Lớn | `ExecutiveGmvNetRevenueChart.vue:68-83` (lặp ở `ExecutiveGmvBreakdownChart.vue:68-83`, `ExecutiveCumulativeTrendChart.vue:~65-80`) |
| FE-EX-19 | Gom bucket: tuần ISO | FR-FLT-04, BR-FLT-12 | Tuần ISO; "(một phần: n ngày)" | `startOf('isoWeek')` đúng. **Không** gắn nhãn "một phần", không chuẩn hóa theo ngày; **không có bucket Quý, Năm** | KĐ | Lớn | `utils/executiveTrendAggregation.ts:42-47`, `121-159` |
| FE-EX-20 | Σ bucket = thẻ (AC-EX02-03) | INV-08 | Σ GMV bucket = thẻ GMV | Thẻ lấy KPI cả khoảng; biểu đồ bị `filterExecutiveTrendByRange` + giới hạn 3 tháng (`recentTrendDateRange`) nên Σ bucket **≠** thẻ khi khoảng lọc > 3 tháng và Chu kỳ ≠ tháng | KĐ | **Nghiêm trọng** (vi phạm INV-08) | `ExecutiveView.vue:204-216`; `ExecutiveGmvNetRevenueChart.vue:91-93` |
| FE-EX-21 | Waterfall 5 cột | AC-EX03-01 | Tổng GMV → Trả hàng → Đổi hàng từ đơn đặt → Hủy đơn đặt → DTT | **3 cột**: `['GMV','Giá trị điều chỉnh','Doanh thu thuần']`, 1 series bar thường (không phải thác nước) | KĐ | Lớn | `components/ExecutiveRevenueWaterfall.vue:94-114` |
| FE-EX-22 | Waterfall: DTT âm / cột 0 | FR-EX-03 | Cột DTT dưới trục 0; cột 0 vẫn hiện nhãn "0" | Một series bar nên giá trị âm vẽ dưới trục (OK); cột 0 không có nhãn; không có nhãn giá trị | KĐ-1P | Nhỏ | `ExecutiveRevenueWaterfall.vue:107-114` |
| FE-EX-23 | Waterfall: tooltip % GMV + số đơn | AC-EX03-02 | Giá trị, % so GMV, số đơn liên quan | Chỉ giá trị `x ₫` | KĐ | Lớn | `ExecutiveRevenueWaterfall.vue:84-90` |
| FE-EX-24 | Waterfall: cân bằng đúng/sai | INV-01/08 | Kiểm `GMV + Điều chỉnh = DTT` | Kiểm ở client `|gmv + adj − net| ≤ 0,01` và ghi "Đã cân bằng theo response backend" (hợp lý); nhưng **dùng chung `loadKpis` với thẻ** (đúng INV-08) | Đ | — | `ExecutiveRevenueWaterfall.vue:74-78,155-158`; `ExecutiveView.vue:64,67` |
| FE-EX-25 | Waterfall: bộ lọc Ngày/Tuần/Tháng | FR-FLT-05: Waterfall không phụ thuộc Chu kỳ (AC-EX03-03) | Không có nút Chu kỳ | Hiển thị cả nút "Theo Ngày/Tuần/Tháng" nhưng không tác dụng (`@granularity-change="waterfallGranularity = $event"` chỉ gán biến) | KĐ | Nhỏ | `ExecutiveView.vue:573`; `ExecutiveChartFilters.vue:51-70` |
| FE-EX-26 | FR-EX-04 Hiệu quả đơn hàng | AC-EX04-01..03 | 3 thẻ + 3 chế độ (a/b/c) | **Không có widget** | KĐ | Lớn (thiếu hẳn chức năng bắt buộc của BOD, theo §0.4) | — |
| FE-EX-27 | Phân rã GMV: nhãn nguồn | BR-FMT-05, FR-EX-05 | "Đơn đặt trước" / "Đơn lắp sẵn" | "Direct" / "PreOrder" | KĐ | Nhỏ | `ExecutiveGmvBreakdownChart.vue:115-127,149-165`; subtitle "Direct và PreOrder phải phân hoạch đúng tổng GMV" (ghi chú nội bộ lọt ra UI) |
| FE-EX-28 | Phân rã GMV: nhãn % trong khúc | AC-EX05-01/02 | % trong từng khúc, ẩn khi nhỏ | Không có nhãn % trong khúc; % chỉ trong tooltip | KĐ | Lớn | `ExecutiveGmvBreakdownChart.vue:147-168` |
| FE-EX-29 | Lũy kế: chế độ | AC-EX06-04..06 | "Đồng bộ cả 3" (GMV, DTT, Nợ treo), Combo, trạng thái "Vượt/Chậm tiến độ", Nhận xét, trần nợ | Một biểu đồ (cột phát sinh + đường lũy kế + mục tiêu). Toggle GMV/Net Revenue, Ngày/Tuần/Tháng. Không Nợ treo, không nhãn tiến độ, không nhận xét | KĐ | Lớn | `components/ExecutiveCumulativeTrendChart.vue:67-100,121-170` |
| FE-EX-30 | Lũy kế: phạm vi và nhãn | BR-TGT-06, FR-FLT-05 | Lũy kế trong khoảng lọc; "YTD" chỉ khi từ 01/01 | Luôn tải từ 01/01 năm của "Đến ngày" (`loadCumulativeTrend`) và ghi "YTD luôn bắt đầu từ 01/01, độc lập với khoảng KPI đang lọc" | KĐ | Lớn | `ExecutiveView.vue:175-184`; `ExecutiveCumulativeTrendChart.vue:166` |
| FE-EX-31 | Lũy kế: mục tiêu và ghi chú | BR-TGT-05, FR-FLT-05 | "Chưa thiết lập mục tiêu" khi không KPI; chú thích mục tiêu không đổi theo đa chiều | Nếu `cumulativeTarget` null: hiện "Chưa đồng bộ một hoặc nhiều điểm lũy kế"; không phân biệt "chưa có KPI" | KĐ | Lớn | `ExecutiveCumulativeTrendChart.vue:93-101,189-195` |
| FE-EX-32 | Lũy kế: "Net Revenue" | BR-FMT-05 | "Doanh thu thuần" | Nút "Net Revenue", series "Lũy kế Net Revenue" | KĐ | Nhỏ | `ExecutiveCumulativeTrendChart.vue:83,~190` |
| FE-EX-33 | Xếp hạng: cột và tab | AC-EX07-01..03 | Cột #, Tên, GMV, Tỷ trọng GMV, DTT, Tỷ trọng DTT, % đạt MT (M01/Mục tiêu GMV), Tỷ lệ trả hàng (M12) + tab Sản phẩm Top 5 | Cột: Khu vực/Chi nhánh, GMV, DTT, "Drop Rate", "Contribution"; không tab Sản phẩm; không Top 5/"Xem tất cả"; không tô đỏ trả hàng > 12% | KĐ | Lớn | `components/ExecutivePerformanceRanking.vue:84-93,166-190` |
| FE-EX-34 | Xếp hạng: dòng tổng | AC-EX07-02 | "Tổng hệ thống" / "Tổng <khu vực>" | Luôn "Tổng"; toggle Khu vực/Chi nhánh luôn hiện (spec: chỉ khi Khu vực cục bộ = Tất cả) | KĐ | Nhỏ | `ExecutivePerformanceRanking.vue:~228`, `100-115` |
| FE-EX-35 | Xếp hạng: đơn vị tiền | BR-FMT-02 (cột bảng dùng chung đơn vị) | Cột GMV dùng "Tr"/"Tỷ" chung | `formatExecutiveCurrency` = `"12.262.400 ₫"` đầy đủ, không rút gọn | KĐ | Nhỏ | `utils/executiveFormatters.ts:36-38`; `ExecutivePerformanceRanking.vue:~210` |
| FE-EX-36 | Xếp hạng: sắp xếp phía client | BR-DIM-02 | GMV giảm dần | Client sort `gmvWithVat` desc (đúng), null xuống cuối | Đ | — | `ExecutivePerformanceRanking.vue:56-63` |
| FE-EX-37 | Heatmap: thang màu % Mục tiêu | AC-EX08-03 (80,0% xanh; 79,9% vàng) | 11 mức, ranh ≥80% | 4 mức: <30% đỏ, <60% vàng, <80% **xanh nhạt**, ≥80% xanh đậm. 79,9% → xanh (spec: vàng). 30–59% → vàng (spec: đỏ) | KĐ | Lớn (sai ngưỡng đánh giá hiệu suất) | `components/report-dashboard/BranchPerformanceHeatmap.vue:436-456` |
| FE-EX-38 | Heatmap: thang Tỷ lệ chuyển đổi, GMV, Traffic | FR-EX-08 | Chuyển đổi theo ngưỡng 90/85/…; GMV/Traffic theo tứ phân vị | Chuyển đổi dùng `rate/100` rồi áp thang 30/60/80 như % mục tiêu; GMV/Traffic dùng `value / max` | KĐ | Lớn | `BranchPerformanceHeatmap.vue:424-433` |
| FE-EX-39 | Heatmap: tab chỉ số + nhãn | FR-EX-08 | % Mục tiêu · GMV · Traffic · Tỷ lệ chuyển đổi | "% Target", "Doanh thu", "Traffic", "Tỷ lệ CĐ" | KĐ | Nhỏ | `BranchPerformanceHeatmap.vue:92-97` |
| FE-EX-40 | Heatmap: phạm vi chi nhánh | FR-EX-08, FR-FLT-05 | Mọi chi nhánh trong bộ lọc | Chỉ **Top-10 chi nhánh theo `revenue`** của block branchPerformance (`slice(0,10)`) | KĐ | **Nghiêm trọng** (che chi nhánh, AC-EX08-01) | `views/ExecutiveView.vue:331-341` |
| FE-EX-41 | Heatmap phụ thuộc block khác | FR-CMN-03 | Widget độc lập | Heatmap chỉ render khi `branchPerformance` (V2) ready; lỗi/tải chậm của `/BranchPerformance` làm "Bản đồ hiệu suất" kẹt "Đang tải" | KĐ | Lớn | `ExecutiveView.vue:626-642` |
| FE-EX-42 | Heatmap: API cũ | BR-MD-01 | Dùng nguồn V2 thống nhất | Gọi `/Admin/Report/BranchPerformanceHeatmap` (v1) trong khi các widget khác dùng `/Admin/V2/Dashboard/*` → khác nguồn/định nghĩa GMV | KĐ | Lớn | `BranchPerformanceHeatmap.vue:~268` |
| FE-EX-43 | Heatmap: Import Traffic | FR-IMP-01 | "Nhập Traffic" + "Import Traffic" | Chỉ nhập tay; không có tải file mẫu / xem trước / import | KĐ | Lớn | `BranchPerformanceHeatmap.vue:630-640`; `TrafficInputModal.vue` |
| FE-EX-44 | Traffic modal: Esc + validate | AC-EX08-04, FR-CMN-01 | Số nguyên ≥ 0, có lịch sử sửa, Esc đóng | Validate số nguyên ≥ 0 (đạt); dùng `VueFinalModal` (Esc mặc định bật); không lịch sử người sửa ở UI | KĐ-1P | Nhỏ | `TrafficInputModal.vue:106-120` |
| FE-EX-45 | Heatmap: nút KPI dùng quyền khác | BR-ROLE-04 | Cùng quy tắc quyền | Nút "KPI" mở `SaleTargetManagerModal` (hệ KPI **v1**) với quyền `manager.dashboard.report.kpi.read` — song song với tab Quản lý KPI V2 | KĐ | Lớn | `BranchPerformanceHeatmap.vue:635-640` |
| FE-EX-46 | Heatmap: đơn vị | BR-FMT-02 | "Tỷ", "Tr" (viết hoa) | `tỷ`, `tr` thường, 1 số lẻ | KĐ | Nhỏ | `BranchPerformanceHeatmap.vue:463-464` |
| FE-EX-47 | Tăng trưởng: metric | FR-EX-09 | GMV · DTT · AOV · Volume · UPT | GMV · Net Revenue · Doanh thu · Doanh số (hai tên trùng nghĩa với GMV/DTT gây nhầm) | KĐ | Lớn | `components/GrowthAnalysisChart.vue:56-61` |
| FE-EX-48 | Tăng trưởng: BR-CMP-02/03, AC-EX09-01/02 | Đường "Kỳ này"/"Kỳ trước"; cột growth; "Tăng trưởng chung" = thẻ | Chỉ tính % bucket so bucket liền trước (BR-CMP-03 đạt một phần); không có "Tăng trưởng chung" nên không so được với thẻ; không có đường "Kỳ trước" | KĐ | Lớn | `GrowthAnalysisChart.vue:~190-215` |
| FE-EX-49 | Tăng trưởng: gom ở client | M08/M09 weighted | AOV/UPT tổng kỳ gia quyền | Hàm `growthValues` cộng `value` theo tháng/tuần ISO — chỉ phù hợp chỉ số cộng được (GMV/DTT). AOV/UPT chưa hỗ trợ nên không sai nhưng cũng không có | KĐ-1P | Nhỏ | `GrowthAnalysisChart.vue:~175-215` |
| FE-EX-50 | Tăng trưởng: chu kỳ YoY | PR-01 | Cùng kỳ năm trước | `previousYear()` đổi năm trong chuỗi ISO (`value.replace(/^(\d{4})/...)`) — mong manh với `+07:00`/29-02 | KĐ-1P | Nhỏ | `ExecutiveView.vue:349-351` |
| FE-EX-51 | Tăng trưởng khởi tạo chỉ sau khi mọi block xong | FR-CMN-03 (widget độc lập) | Mỗi widget tự tải | `loadGrowthAnalysis` được gọi **sau** `await Promise.all(requests)`; bất kỳ block nào kẹt thì Tăng trưởng không bắt đầu | KĐ | Lớn | `ExecutiveView.vue:448-462` |
| FE-EX-52 | Nhãn "Đang lọc riêng" | BR-FLT-06 | Hiển thị khi bộ lọc cục bộ ≠ toàn cục | Không có ở đâu (grep rỗng) | KĐ | Lớn | — |

### 3.B. Bộ lọc toàn cục (FR-FLT, §6)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| FE-FLT-01 | Tùy chọn Chu kỳ | FR-FLT-01 | Ngày / Tuần / Tháng / Quý / Năm; mặc định **Tuần** | `<option>`: 1 "Ngày", 2 "Tùy chọn ngày" (**mặc định**), 3 "Quý", 4 "Năm". Không có Tuần, Tháng | KĐ | Lớn | `components/DashboardV2FilterBar.vue:93-100`; `useDashboardV2Filter.ts:11` |
| FE-FLT-02 | Ánh xạ Chu kỳ → bucket | FR-FLT-04 | Quý → Qn/YYYY; Năm → YYYY | `granularityFromPeriodType`: 4→`'month'`, 3→`'week'`. Tức chọn "Quý" ra bucket **tuần**, chọn "Năm" ra bucket **tháng**, chọn "Tùy chọn ngày/Ngày" ra bucket ngày | KĐ | **Nghiêm trọng** (nhãn Chu kỳ gây hiểu nhầm cho toàn bộ biểu đồ; AC-FLT-04/05 không đạt) | `views/ExecutiveView.vue:198-202`; `composables/useExecutiveBlockSnapshot.ts:~60` |
| FE-FLT-03 | Khoảng ngày mặc định | QĐ-07 | Từ ngày 1 tháng hiện tại → **hôm qua** (ngày 1: cả tháng trước) | Mặc định `startOf('month')` → `endOf('month')` (hôm nay 17/10 → đến 31/10, gồm 14 ngày tương lai) | KĐ | Lớn | `composables/useDashboardV2Filter.ts:9-16` |
| FE-FLT-04 | Hiển thị ngày DD/MM/YYYY | BR-FMT-05 | `DD/MM/YYYY` | `<input type="date">` hiển thị theo locale trình duyệt (ảnh: 10/01/2026 – 10/31/2026 kiểu Mỹ). Không dùng date picker cố định định dạng | KĐ | Nhỏ | `DashboardV2FilterBar.vue:104,107` |
| FE-FLT-05 | Validate ngày | BR-FLT-02, AC-FLT-03 | Chặn Từ > Đến, để trống, > 3 năm; lỗi tại ô; giữ số liệu hợp lệ gần nhất | Không có validate. Đặt Từ > Đến sẽ gọi API với khoảng ngược; xóa ô → `moment.tz('')` = Invalid date → `format()` trả "Invalid date" đẩy vào filter | KĐ | **Nghiêm trọng** (AC-FLT-03: "không widget nào hiển thị NaN") | `DashboardV2FilterBar.vue:31-44` |
| FE-FLT-06 | Cascade Khu vực → Chi nhánh | BR-FLT-01, AC-FLT-01 | Đổi khu vực → chi nhánh rỗng, danh sách chỉ còn chi nhánh khu vực | Có: `changeRegionSelection` reset `siteIds`, `availableBranches` lọc theo khu vực | Đ | — | `DashboardV2FilterBar.vue:46-58` |
| FE-FLT-07 | Cascade ngược Chi nhánh → Khu vực | BR-FLT-01 | Chọn chi nhánh khi Khu vực = Tất cả → khu vực tự đặt | Không có | KĐ | Nhỏ | `DashboardV2FilterBar.vue:60-62` |
| FE-FLT-08 | Khu vực đa chọn | FR-FLT-01 | Khu vực (1 giá trị) | Chọn nhiều khu vực (`regionIds: string[]`) nhưng các widget lấy `regionIds[0]` (`filter.value.regionIds[0]`) → khi chọn ≥ 2 khu vực, widget con chỉ dùng khu vực đầu | KĐ | Lớn | `ExecutiveView.vue:220,324` |
| FE-FLT-09 | Bộ lọc cục bộ bị ghi đè | BR-FLT-05, AC-FLT-02 | Đổi toàn cục → ghi đè cục bộ | Có (`syncChildFilters` + `resetFromGlobal`) | Đ | — | `ExecutiveView.vue:218-248,472-475` |
| FE-FLT-10 | Nhãn "Đang lọc riêng" | BR-FLT-06 | Có | Không | KĐ | Lớn | (FE-EX-52) |
| FE-FLT-11 | Phạm vi áp dụng cục bộ | FR-FLT-02: 7 widget (EX-02..07, 09) | Cả Tăng trưởng (EX-09) có bộ lọc Khu vực/Chi nhánh riêng | Tăng trưởng có chiều Hệ thống/Khu vực/Chi nhánh (đạt một phần); Lũy kế (EX-06) **không** có bộ lọc cục bộ; Waterfall/Phân rã có | KĐ-1P | Nhỏ | `ExecutiveView.vue:597-606` |
| FE-FLT-12 | Bộ lọc đa chiều | FR-FLT-03 | Ngành hàng · Thương hiệu · Giới tính · Phân khúc · PIC · Trạng thái, badge, "Xóa bộ lọc" | **Không có** (không UI, không field trong `DashboardV2Filter`) | KĐ | Lớn | `types.ts:3-11`; `DashboardV2FilterBar.vue` |
| FE-FLT-13 | Lưu trạng thái trong URL | BR-FLT-04 [P2] | Giữ khi tải lại | Chỉ lưu `?tab=` | KĐ (P2, không tính lỗi) | Nhỏ | `index.vue:36-46` |
| FE-FLT-14 | Nút Đồng bộ + "Dữ liệu tính đến" | AC-SHELL-01 | Tải lại dữ liệu, cập nhật "Dữ liệu tính đến" | "↻" chỉ tải lại danh mục khu vực/chi nhánh | KĐ | Lớn | `DashboardV2FilterBar.vue:155`; `DashboardV2Header.vue` |
| FE-FLT-15 | Rò trường lọc giữa tab | FR-FLT-01 | Bộ lọc dùng chung chỉ chứa các trường chuẩn | `ProductView` gọi `setFilter({metric,dimension,comparisonType})` làm filter **toàn cục** chứa `metric`, `dimension`; các tab khác (Executive) gửi các trường thừa này và `comparisonType` bị đổi theo | KĐ | Lớn | `views/ProductView.vue:~125-155` |
| FE-FLT-16 | Tải danh mục lỗi bị nuốt | FR-CMN-03 | Báo lỗi | `locationStore.load` có thể `throw` khi cả hai lỗi, `void loadLocations()` → unhandled rejection, bộ lọc trống, không thông báo | KĐ | Nhỏ | `stores/dashboardV2Locations.ts:33-37`; `ExecutiveView.vue:431-433` |

### 3.C. Định dạng và công thức ở client

| ID | Hạng mục | Cách kiểm (TC-09 mô phỏng) | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| FE-FMT-01 | Hàm định dạng tiền chung | Đọc `executiveFormatters.ts`; đưa 7 giá trị TC-09 | 12.262.400→"12 Tr"; 5.722.400→"5,7 Tr"; 1.508.500→"1,5 Tr"; −1.630.000→"−1,6 Tr"; 194.400→"194.400 ₫"; 512.300.000→"512 Tr"; 4.216.000.000→"4,22 Tỷ" | `formatExecutiveCurrency` trả `"{n} ₫"` đầy đủ: "12.262.400 ₫", "5.722.400 ₫", "1.508.500 ₫", "-1.630.000 ₫", "194.400 ₫" (đúng ca này), "512.300.000 ₫", "4.216.000.000 ₫". **Chỉ 1/7 khớp (ngẫu nhiên)**. Không có hàm tự chọn đơn vị | KĐ | **Nghiêm trọng** | `utils/executiveFormatters.ts:7-9,36-38` |
| FE-FMT-02 | Đơn vị dùng chung trục / cột | BR-FMT-02 | Cùng đơn vị trong 1 trục/cột; tăng số lẻ nếu trùng | Trục: `formatAxisValue` hậu tố `T/M/K` mỗi nhãn tự chọn đơn vị riêng ("1,2T", "450M", "3K" cùng trục); không xử lý trùng nhãn | KĐ | Lớn | `ExecutiveGmvNetRevenueChart.vue:68-74` (+2 file sao chép) |
| FE-FMT-03 | Tooltip luôn kèm ₫ đầy đủ | BR-FMT-02 | Có | Tooltip các biểu đồ Executive dùng ₫ đầy đủ (đạt); thẻ KPI không có tooltip giá trị | KĐ-1P | Nhỏ | `ExecutiveGmvNetRevenueChart.vue:64-66` |
| FE-FMT-04 | Locale vi-VN cố định | BR-FMT-01 | Dấu chấm nghìn, phẩy thập phân | Dùng `Intl.NumberFormat('vi-VN')`/`toLocaleString('vi-VN')` (đạt). Một số nơi dùng `en-GB` để ghép ngày (`ExecutiveOverviewCards.vue:250-264`) | Đ / KĐ-1P | Nhỏ | `utils/executiveFormatters.ts:6-16` |
| FE-FMT-05 | Tỷ lệ 1 số lẻ, số âm dấu "−" | BR-FMT-03 | `21,7%`; "−1,6" | `maximumFractionDigits: 1` (đạt); dấu âm của `Intl` là "-" (ASCII), không phải "−" (U+2212) | KĐ-1P | Nhỏ | `executiveFormatters.ts:14-16` |
| FE-FMT-06 | NaN/undefined/Infinity | BR-FMT-04 | "—" | `null`→"Chưa đồng bộ"; `undefined` được `== null` chặn; nhưng `RegionalBenchmark.indexValue` trả 0, `OperationalView` có `item.value.toLocaleString` không guard; Giá trị `NaN` đi qua `formatNullable` ra "NaN ₫" | KĐ-1P | Nhỏ | `executiveFormatters.ts:19-21` |
| FE-FMT-07 | Thuật ngữ | BR-FMT-05 | "Tỷ lệ", "Doanh thu thuần", "Đơn lắp sẵn", "Đơn đặt trước" | "Net Revenue", "Direct/PreOrder", "Drop Rate", "Contribution", "Tỷ lệ Hoàn tiền (Refund Rate)", "Theo Value", "Order Aging", "Time Peak", "Basket Size", "Payment Method"… (tiêu đề song ngữ tùy chỗ). Không thấy "Tỉ lệ" | KĐ | Nhỏ | rải rác (xem 3.A, 3.D) |
| FE-FRM-01 | Gom bucket AOV | M08: ΣDTT/ΣĐơn | Gia quyền | `calculateAov(netRevenue, orderCount)` sau khi cộng DTT và Đơn của bucket (đúng gia quyền) | Đ | — | `utils/executiveTrendAggregation.ts:99-107,148-153` |
| FE-FRM-02 | Gom bucket biên LN | M07: gia quyền theo DTT | `Σ(margin×DTT)/ΣDTT` | `aggregateRate` gia quyền theo **grossSales (GMV)**, không phải DTT; khi thiếu mẫu số lấy giá trị cuối cùng | KĐ | Lớn | `executiveTrendAggregation.ts:78-97,147` |
| FE-FRM-03 | Cộng `target` | BR-TGT-03 | Mục tiêu bucket phân bổ theo ngày | `target` được cộng; `cumulativeTarget` lấy giá trị cuối. Phụ thuộc backend đã phân bổ ngày hay chưa | KĐ-1P | Nhỏ | `executiveTrendAggregation.ts:19-21,121-135` |
| FE-FRM-04 | Bucket "một phần" không chuẩn hóa | BR-FLT-12 | Gắn nhãn, chuẩn hóa theo ngày | Không gắn nhãn; không dùng trung bình nên chủ yếu ảnh hưởng nhãn | KĐ | Nhỏ | `executiveTrendAggregation.ts` |
| FE-FRM-05 | Mức "TB hệ thống" của radar | M14, M08 gia quyền | Trung bình **gia quyền** (hoặc do backend) | `average()` = trung bình cộng đơn giản của các chi nhánh (kể cả tỷ lệ chuyển đổi, AOV) | KĐ | Lớn | `components/RegionalBenchmark.vue:18-22` |
| FE-FRM-06 | Chỉ số index radar | FR-OP-07 | Index = A/B×100, không giới hạn 140; trục thiếu dữ liệu "—" | `Math.min(140, …)`, trục thiếu dữ liệu vẽ 0 hoặc null; "TB hệ thống" thay vì chọn "So với" | KĐ | Lớn | `RegionalBenchmark.vue:34-38,58-66` |
| FE-FRM-07 | Tỷ lệ phần trăm khoản điều chỉnh Waterfall | M05a..c / M01 | % so GMV | Không tính | KĐ | Lớn | (FE-EX-23) |
| FE-FRM-08 | Cột chiều giảm GMV→DTT (Drop rate) | FR-EX-02: (M01−M06)/M01 | Tính ở client trong tooltip `gap/gmv*100` | Đúng công thức, chia 0 trả null | Đ | — | `ExecutiveGmvNetRevenueChart.vue:124-125` |
| FE-FRM-09 | Fallback AOV trên client | M08 | AOV từ backend | `readLegacyCompatibleAov` tự chia `revenueWithVat / orderCount` khi thiếu `aovWithVat`; `executiveToPreviousPeriod` cũng tự tính. Hợp lệ nếu `orderCount`=M02; ghi nhận **công thức tính ở FE** | KĐ-1P | Nhỏ | `ExecutiveOverviewCards.vue:64-76`; `services/dashboardV2Api.ts:164-189` |
| FE-FRM-10 | Dữ liệu cũ bị coi là "partial" mãi | FR-CMN-03 | Chỉ partial khi backend nói partial | `normalizeKpiBlock` (response cũ) ép `dataStatus='partial'` + mock `GmvWithoutVat, NewCustomerCount, CollectedRevenueWithVat, RefundWithVat, NetRevenueWithoutVat` | KĐ-1P | Nhỏ | `dashboardV2Api.ts:295-309` |
| FE-FRM-11 | Biên độ, tooltip % | — | — | Không áp dụng (không có FR-EX-04) | — | — | — |

### 3.D. Tab Vận hành & Khách hàng

| ID | Hạng mục | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|
| FE-OP-01 | Order Aging: hàng theo công đoạn | Hàng = Mài lắp, Vận chuyển; khúc 0–5, 6–10, 11–20, >20 | Một thanh theo nhóm tuổi (bucket 2/3/4 = 5–10, 10–20, >20), **không** có công đoạn, **mất nhóm 0–5/6–10**; màu cam/đỏ (3 màu) thay vì xanh→vàng→cam→đỏ | KĐ | Lớn | `components/OrderAgingChart.vue:17-35,76-90` |
| FE-OP-02 | Order Aging: modal | Esc / click nền / X; đơn vị | Modal tự dựng, chỉ nút "Đóng", không Esc/click nền; số giá trị không có ₫/Tr | KĐ | Nhỏ | `views/OperationalView.vue:~185-215` |
| FE-OP-03 | Order Aging: nhãn | "Theo giá trị" | "Theo Value" | KĐ | Nhỏ | `OrderAgingChart.vue:106-110` |
| FE-OP-04 | Time Peak: GMV | Toggle Số đơn / GMV | "Theo Doanh thu" dùng `item.revenue` (chưa rõ GMV hay DTT); `Tr` không viết hoa đúng | KĐ | Lớn | `components/TimePeakChart.vue:19-22,40-43` |
| FE-OP-05 | Time Peak: chú thích đơn ngoài khung 8–22h | Có | Không | KĐ | Nhỏ | `TimePeakChart.vue` |
| FE-OP-06 | Time Peak: màu theo min–max | Theo min–max lưới | Theo `value/max` (min=0) | KĐ-1P | Nhỏ | `TimePeakChart.vue:25-28` |
| FE-OP-07 | Nhân khẩu học | Nhóm tuổi: <25, 25–34, 35–49, ≥50, Không xác định; tooltip dương | Thứ tự nhóm tuổi theo thứ tự đến từ backend (Map), tháp: nam số âm nhưng trục `Math.abs` (đạt); tooltip của tháp hiển thị **giá trị âm** cho Nam (series data âm không có formatter) | KĐ | Lớn (AC-OP03-02) | `components/DemographicCharts.vue:59-66` |
| FE-OP-08 | Basket Size: nhãn/đơn vị | `<0,5 · 0,5–1 · 1–3 · 3–5 · >5 Tr`, tăng dần | Nhãn dựng từ ranh backend; tooltip `đ`; thứ tự theo backend | KĐ-1P | Nhỏ | `BasketRefundCharts.vue:17-22,24-30` |
| FE-OP-09 | Payment Method | 6 phương thức, tổng = M04, tooltip | Chỉ 2 mục mock; không tooltip; nhãn "Payment Method" khi lỗi | KĐ | **Nghiêm trọng** (mock vi phạm BR-DATA-01; INV-11 không kiểm được) | `OperationalView.vue:~190-215`; `mocks/index.ts:9-14` |
| FE-OP-10 | Chiến dịch | Bảng Chiến dịch · GMV · DTT · Số đơn · AOV | 3 cột giá trị/"Minh họa", mock "Chưa có nguồn CampaignId" | KĐ | Lớn | `OperationalView.vue:~225-245` |
| FE-OP-11 | Benchmark: chọn So với / toggle | "Phân tích"+"So với"+Khu vực/Chi nhánh | Chỉ "Phân tích" chi nhánh vs TB hệ thống | KĐ | Lớn | `RegionalBenchmark.vue:62-69,90-96` |
| FE-OP-12 | Benchmark: dữ liệu mock | Traffic, Chuyển đổi live | `mocks/index.ts` fixture `regionalBenchmark {traffic:1280, conversion:0.24}` (backend gán `dataStatus=mock`); badge hiển thị | KĐ | Nghiêm trọng nếu chạy với mock (BR-DATA-01) — phụ thuộc backend | `mocks/index.ts:4-8`; `RegionalBenchmark.vue:24-30` |
| FE-OP-13 | Anomaly: chọn chỉ số/thực thể + dải tin cậy | DTT · Số đơn · Tỷ lệ trả hàng; khu vực/chi nhánh | Chip tĩnh "Theo Khu vực"; chỉ "Doanh thu thực tế"; không dải tin cậy | KĐ | Lớn | `AnomalyChart.vue:46-55` |
| FE-OP-14 | Anomaly: công thức ở client | MA/σ 7 ngày trước, k=2 | FE không tính (đọc `isAnomaly`/`zScore` từ backend) | Đ (phụ thuộc backend) | — | `AnomalyChart.vue` |
| FE-OP-15 | Conversion Rate | M14, 0–100%, "Chưa có Traffic" | Thanh theo `item.value` (không chuẩn hóa 0–100, `Math.max(1, …)`), không "Chưa có Traffic"; dữ liệu mock/partial | KĐ | Lớn | `OperationalView.vue:~245-265` |
| FE-OP-16 | Refund: M13b, M13c | 4 cột | Chỉ 2 cột; nhãn "hoàn tiền"; trục `value%` | KĐ | Lớn | `BasketRefundCharts.vue:50-62` |

### 3.E. Tab Sản phẩm & Tồn kho

| ID | Hạng mục | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|
| FE-PR-01 | Phân tích đa chiều: số chiều | 10 chiều × (GMV, Số lượng) | 2 chiều (`4`=ngành hàng, `5`=phân khúc giá); metric `1=Doanh thu`, `5=Số lượng` | KĐ | Lớn | `views/ProductView.vue:47-48,175-200` |
| FE-PR-02 | Chỉ số GMV vs Doanh thu | BR-DIM-02: xếp hạng bán dùng GMV | "Doanh thu" ở Đa chiều, Treemap (`revenue`), Top | KĐ | Lớn (ngữ nghĩa lẫn GMV/DTT; cần backend xác nhận field) | `ProductView.vue:66`; `ProductTreemap.vue:40-46` |
| FE-PR-03 | Treemap drill-down + breadcrumb + modal | AC-PR03-01/02 | `nodeClick:false`, `breadcrumb.show:false` | KĐ | Lớn | `components/ProductTreemap.vue:30-35` |
| FE-PR-04 | Ma trận phôi tròng | Bubble SPH×CYL | Placeholder tĩnh | KĐ | Lớn (phụ thuộc backend thiếu dữ liệu SPH/CYL) | `components/ProductOpticalMatrix.vue` |
| FE-PR-05 | Thương hiệu phân phối | Thanh GMV theo thương hiệu | Component không được mount; (và nếu mount sẽ gom theo **nhà cung cấp**, đo bằng **số lượng**) | KĐ | Lớn | `components/ProductBrandDistribution.vue`; không có import ở `ProductView.vue` |
| FE-PR-06 | Top SP & vật tư | Thêm NCC, Tồn, SS, ROP, cảnh báo đỏ khi Tồn ≤ ROP | Chỉ #, Sản phẩm, Suất/Màu, Số lượng bán; nút "Xem toàn bộ danh mục" không handler | KĐ | Lớn | `components/TopProductTable.vue:33-66` |
| FE-PR-07 | Tăng trưởng SP: so sánh | Kỳ liền trước / Cùng kỳ năm trước | Dùng chung `filter.comparisonType` toàn cục (đổi sẽ ảnh hưởng tab Tổng quan) | KĐ | Lớn | `ProductView.vue:~125` (FE-FLT-15) |
| FE-PR-08 | Nút "Xem chi tiết dữ liệu" Đa chiều | Mở modal | Nút không có handler | KĐ | Nhỏ | `ProductView.vue:~210` |
| FE-PR-09 | Lỗi một khối → kéo cả trang | FR-CMN-03 | `loadProductBlocks` gọi `api.product` composite (retries 0), nếu lỗi mới tải riêng từng khối | KĐ-1P | Nhỏ | `ProductView.vue:97-130` |

### 3.F. Tab Hiệu suất Nhân sự

| ID | Hạng mục | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|
| FE-HR-01 | KTV khúc xạ [Hoãn] | Không hiển thị | Bảng "Hiệu suất KTV Khúc Xạ" (mock) hiển thị cho BOD/MANAGER | KĐ | Lớn (QĐ-13, §0.3 "không được hiển thị") | `components/PersonnelMockBlocks.vue:~30-70`; `views/PersonnelView.vue:~60-68` |
| FE-HR-02 | KPI cá nhân (cấm) | AC-HR01-03, QĐ-08 | "Tiến độ KPI tuần" (mock) hiển thị cho mọi vai trò kể cả STAFF (mode="support" ở ngoài `v-if`) | KĐ | Lớn | `PersonnelMockBlocks.vue:130`; `PersonnelView.vue:~72-79` |
| FE-HR-03 | Gamification | Không có trong spec | Hiển thị (mock) | KĐ (extra) | Nhỏ | `PersonnelMockBlocks.vue:130` |
| FE-HR-04 | Bảng PIC Sales | Xếp hạng theo **GMV**; cột Chi nhánh; Tỷ trọng; "Chưa gán" | Xếp theo `rank` của backend (field `revenue`); thanh so với người đứng đầu; không cột chi nhánh; không dòng "Chưa gán"; phân trang 5 | KĐ | Lớn | `components/SalesLeaderboard.vue:11,21,206-211` |
| FE-HR-05 | Top-3 badge | Top 3 GMV "Nhân viên xuất sắc" | Huy hiệu số hạng 1/2/3 trong bảng nhưng **không** có thẻ "Nhân viên xuất sắc" ở góc nhìn STAFF; không thẻ "Hạng r/n" | KĐ | Lớn | `SalesLeaderboard.vue:74-90`; `PersonnelScorecard.vue` |
| FE-HR-06 | STAFF chỉ thấy dữ liệu của chính mình | AC-ROLE-03/05 | `PersonnelView` lọc `scorecards` theo `staffId`; `role==='STAFF'` suy từ "chỉ có tab personnel"; `leaderboard` không render cho STAFF (đạt UI). Nhưng **rò dữ liệu qua API** (toàn bộ scorecards về client rồi lọc ở FE) | KĐ | **Nghiêm trọng** (BR-ROLE-02 — phụ thuộc backend; FE lọc client) | `views/PersonnelView.vue:31-39` |
| FE-HR-07 | STAFF: `staffId` | AC-ROLE-03 | `staffId = identityStore.user?.id` | Giả định `user.id` = mã nhân viên của `scorecards.staffId` — cần xác nhận | Câu hỏi mở | — | `index.vue:63` |
| FE-HR-08 | Lab | Theo KTV mài lắp; hư hao > 2% đỏ | Hàng "Phòng Lab" mock, hư hao luôn đỏ (`text-rose-500`) | KĐ | Lớn | `PersonnelMockBlocks.vue:~105-122` |
| FE-HR-09 | Scorecard dùng thuật ngữ | M08 / AOV | "Doanh thu" thay vì GMV; `formatNumber` không có đơn vị ("1.234.567") | KĐ | Nhỏ | `PersonnelScorecard.vue:~110-140` |

### 3.G. Tab Quản lý KPI và Import

| ID | Hạng mục | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|
| FE-KPI-01 | MANAGER chỉ xem | AC-ROLE-04 | `canWrite = scope.includes('manager.dashboard.read')`, mà `kpiWrite === kpiRead === 'manager.dashboard.read'` ⇒ mọi người vào được tab đều **ghi được** (Thêm, Sửa, Xóa, Kích hoạt, hàng loạt) | KĐ | **Nghiêm trọng** (phân quyền) | `views/KpiManagementView.vue:33`; `routeGuard.ts:3-9` |
| FE-KPI-02 | Nút Import mục tiêu | FR-IMP-02 (BOD) | Không có | KĐ | Lớn | — |
| FE-KPI-03 | Thẻ thống kê | AC-KPI01-01 | "Đang áp dụng" = số dòng **trong trang** (20); "đã hoàn thành" = `ended/total` sai nghĩa; "cấp sâu nhất" cũng chỉ trên trang | KĐ | Lớn | `KpiManagementView.vue:153-160,183-194` |
| FE-KPI-04 | Phân trang | 10 dòng | `size = 20` | KĐ | Nhỏ | `KpiManagementView.vue:39` |
| FE-KPI-05 | Wizard: trường bắt buộc/ràng buộc | AC-KPI04-03: Mục tiêu GMV > 0, tỷ lệ ≤ 100 | Chỉ chặn `< 0`, **cho phép 0**; không chặn tỷ lệ > 100; trường chính "Doanh thu (VNĐ)" (không phải "Mục tiêu GMV") và không bắt buộc | KĐ | Lớn | `components/KpiConfigurationModal.vue:116,259` |
| FE-KPI-06 | Wizard: phạm vi Nhân viên | QĐ-08 | `scopeLabels[4]='Nhân viên'` (chỉ cho khi sửa KPI cũ); tạo mới không cho — nhưng danh sách vẫn hiện | KĐ-1P | Nhỏ | `KpiConfigurationModal.vue:26-30` |
| FE-KPI-07 | Xung đột (BR-KPI-02) | Cảnh báo **đỏ**, 3 lựa chọn | Có 3 nút đúng nghĩa; màu vàng (amber) | KĐ-1P | Nhỏ | `components/KpiConflictResolution.vue:13-26` |
| FE-KPI-08 | `companyId` | KPI Công ty có mã đối tượng | `companyId = identityStore.user.id` (id **người dùng**, không phải công ty) | KĐ | Lớn | `KpiManagementView.vue:34` |
| FE-KPI-09 | Activate xung đột ở danh sách | BR-KPI-02 | `activate()` chỉ đặt `state='error'` và thông báo; không mở 3 lựa chọn | KĐ | Lớn | `KpiManagementView.vue:120-137` |
| FE-KPI-10 | Xóa → Lưu trữ + xác nhận | AC-KPI02-03 | Nút lưu trữ gọi `archive` trực tiếp (chưa thấy hộp xác nhận) | KĐ | Nhỏ | `KpiManagementView.vue:107-118`; `KpiTable.vue` |
| FE-KPI-11 | Màu trạng thái | Đang áp dụng xanh lá · Bản nháp vàng · Đã kết thúc **chàm** · Lưu trữ xám | Đã kết thúc: chưa kiểm (dòng 47-49 không nêu màu chàm) | KĐ-1P | Nhỏ | `KpiTable.vue:44-50` |
| FE-IMP-01 | Import Traffic | BR-IMP-01..08 | Không có (xem FE-EX-43) | KĐ | Lớn | — |
| FE-IMP-02 | Import mục tiêu | BR-IMP | Không có | KĐ | Lớn | — |

### 3.H. Phân quyền UI (§5, §8 của đề bài)

| ID | Hạng mục | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|
| FE-PERM-01 | Phân biệt vai trò | Tab Tổng quan chỉ BOD; Vận hành/Sản phẩm: BOD+MANAGER; Nhân sự: cả 3; KPI: BOD ghi / MANAGER xem | Cả 5 tab dùng `manager.dashboard.read`; không có ánh xạ BOD/MANAGER/STAFF | KĐ | **Nghiêm trọng** (BR-ROLE-01, AC-ROLE-05: STAFF có thể thấy mọi tab nếu có scope này) | `routeGuard.ts:2-10,22-28`; `menu.ts:13` |
| FE-PERM-02 | `personnelRole` | Vai trò từ tài khoản | Suy từ số tab: `tabs.length===1 && personnel` ⇒ STAFF, ngược lại MANAGER; **BOD** chưa bao giờ xuất hiện | KĐ | Lớn | `index.vue:33` |
| FE-PERM-03 | Quyền GMV | Cổng quyền độc lập | Đúng thiết kế: `manager.dashboard-v2.gmv.read` và scope phủ định `-…`; ẩn thẻ GMV/Điều chỉnh, 3 widget GMV, lựa chọn GMV. **Chỉ ẩn ở UI**; tài liệu nêu rõ API vẫn trả GMV | KĐ-1P | Lớn (RLS thuộc backend) | `composables/useDashboardV2GmvPermission.ts:5-11`; `docs/dashboard-v2-gmv-permission.md` |
| FE-PERM-04 | Quyền GMV: tính nhất quán | BR-ROLE-04 | Không ẩn DTT+Điều chỉnh+… ở widget **Lũy kế "Net Revenue"** và **Tăng trưởng "Doanh thu"**: GMV có thể suy ra qua Điều chỉnh/Waterfall (đã ẩn) nhưng `ExecutiveCumulativeTrendChart` hiển thị `Mục tiêu`… (OK). Ranking ẩn cả DTT (`v-if=canViewGmv`) dù DTT không phải GMV | KĐ-1P | Nhỏ | `ExecutiveView.vue:541,578,609` |
| FE-PERM-05 | `canViewGmv` khi scope đổi | UI cập nhật | `watch(canViewGmv)` reset & tải lại; khi mất quyền, snapshot về `idle` không nạp lại (widget ẩn, không ảnh hưởng) | Đ | — | `ExecutiveView.vue:477-484` |
| FE-PERM-06 | Bộ chọn Khu vực/Chi nhánh theo phạm vi | BR-FLT-07 | Danh sách lấy từ `AdminSiteGetAllSiteWithAnyScope` / `AdminRegionGetList` (theo scope API); FE không hạn chế thêm | KĐ-1P | Nhỏ | `services/dashboardV2Api.ts:~680-712` |
| FE-PERM-07 | Cấu hình KPI ở header chỉ BOD | FR-SHELL-01 | Không có nút "Cấu hình KPI" ở header | KĐ | Nhỏ | `DashboardV2Header.vue` |

### 3.I. Trạng thái rỗng / lỗi / đang tải và các thành phần chung

| ID | Hạng mục | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|
| FE-CMN-01 | `idle` = "Đang tải" | Idle không phải loading | `DashboardV2Block` hiển thị "Đang tải dữ liệu…" cho cả `idle` | KĐ | Lớn | `components/DashboardV2Block.vue:20,25` |
| FE-CMN-02 | Không timeout | FR-CMN-03 / NFR-01 | Không `timeout` axios, không `AbortSignal.timeout`, không quá hạn client | KĐ | Lớn | `services/dashboardV2Api.ts:121-139`; `apis/` (grep timeout = 0) |
| FE-CMN-03 | Cảnh báo "partial" giả khi chưa có dữ liệu | FR-CMN-03 | Waterfall hiện huy hiệu + 2 dòng đỏ khi `snapshot` undefined | KĐ | **Nghiêm trọng** (thông báo sai về chất lượng dữ liệu cho BOD) | `ExecutiveRevenueWaterfall.vue:68-85,127-133` |
| FE-CMN-04 | Skeleton | Skeleton đúng hình dạng | Chỉ chữ nhấp nháy | KĐ | Nhỏ | `DashboardV2Block.vue:25` |
| FE-CMN-05 | Rỗng có "Xóa bộ lọc" | Có nút | Chỉ chữ "Không có dữ liệu" | KĐ | Nhỏ | `DashboardV2Block.vue:28` |
| FE-CMN-06 | Lỗi: "Thử lại" + widget khác chạy tiếp | Đạt | Mỗi block có trạng thái riêng, nút "Thử lại" | Đ | — | `DashboardV2Block.vue:30-36` |
| FE-CMN-07 | Modal Esc/click nền/reset | FR-CMN-01 | Modal Order Aging & Inventory tự dựng: chỉ nút Đóng; Esc chỉ xóa ô tìm kiếm | KĐ | Lớn | `OperationalView.vue:~185`; `InventoryDrilldown.vue:~168` |
| FE-CMN-08 | Tooltip (i) bằng hover/focus | FR-CMN-02 | Mở bằng click/Enter/Space; công thức nội bộ | KĐ | Nhỏ | `MetricCard.vue:137-160` |
| FE-CMN-09 | Số ngẫu nhiên | BR-DATA-01 | Không có `Math.random` | Đ | — | grep rỗng |
| FE-CMN-10 | Dữ liệu minh họa hiện cho người dùng | BR-DATA-01 | Badge "Dữ liệu minh họa"/"Một phần chỉ số chưa đồng bộ" lộ cho BOD; `getDashboardV2Mock()` là mã chết ở FE | KĐ | Lớn | `DataStatusBadge.vue`; `mocks/index.ts` |

---

## 4. Nguyên nhân khiến "Đang tải dữ liệu..." không dứt

Ảnh chụp: khối "TỔNG QUAN CHỈ SỐ KINH DOANH", "GMV so với Doanh thu thuần" và "Waterfall doanh thu" đều kẹt loading, đồng thời Waterfall hiện huy hiệu "Một phần chỉ số chưa đồng bộ" và 2 dòng đỏ. Dưới đây là kết quả truy vết (`ExecutiveView.vue`, `useExecutiveBlockSnapshot.ts`, `dashboardV2Api.ts`, `apiClient.ts`).

### 4.1. Cơ chế hoạt động

- Mỗi widget có một `useExecutiveBlockSnapshot` với trạng thái `idle | loading | ready | empty | error`.
- Thẻ KPI (`overviewSnapshot`) và Waterfall (`waterfallSnapshot`) dùng **cùng** loader `loadKpis` → `executiveKpis` (`ExecutiveView.vue:64,67`). GMV-vs-DTT (`gmvNetSnapshot`), Phân rã GMV và Tăng trưởng dùng `loadTrend` (`:66,68,400`).
- Khi hiển thị: `ExecutiveOverviewCards` chỉ render khi `overviewStatus==='ready' && overviewData`; ngược lại `DashboardV2Block` với `state=overviewStatus` (`:520-535`).
- `DashboardV2Block` coi `idle` **và** `loading` đều là "Đang tải dữ liệu…" (`DashboardV2Block.vue:25`).

### 4.2. Lý do 1 (chắc chắn): thông báo "partial" đỏ là kết quả suy diễn sai, không phải backend

`ExecutiveRevenueWaterfall.vue:68-85`:

```
const snapshot = computed(() => props.block ?? props.kpis)   // undefined khi chưa có dữ liệu
const gmv = computed(() => readNumber(data.value, [...]))     // null khi data undefined
const hasUnavailableValue = computed(() => gmv === null || adjustment === null || netRevenue === null)  // => true
const hasPartialData = ... || hasUnavailableValue.value       // => true
const partialFields  = ... ['GmvWithVat','AdjustmentWithVat','NetRevenueWithVat']  // chuỗi cứng
```

Template (`:127-133`) in huy hiệu + "Chưa đủ dữ liệu để cân waterfall: GmvWithVat, AdjustmentWithVat, NetRevenueWithVat" + "Chưa đồng bộ một hoặc nhiều thành phần waterfall" **ngay cả khi `status` là `idle/loading/error`** (các dòng này nằm ngoài `v-if="status !== 'ready'"`).

⇒ Ba nhãn đỏ trong ảnh trùng khít chuỗi cứng này, và xuất hiện đúng khi snapshot chưa có dữ liệu. Chúng **không chứng minh backend trả thiếu trường**. Đây là triệu chứng của việc "chưa nhận được dữ liệu", không phải nguyên nhân. (Tương tự ở `ExecutiveGmvNetRevenueChart` khi `chartPoints` rỗng chỉ hiện "Chưa đồng bộ"; widget này ít sai hơn.)

### 4.3. Lý do 2 (chắc chắn về mã): `idle` bị hiển thị là loading, và có đường dẫn tạo `idle` mà không có lần `load()` nào theo sau

- `invalidateState()` (gọi từ `resetFromGlobal`, `patchLocalFilter`) đặt `status='idle'`, xóa `data`, hủy request đang chạy và tăng `requestId` (`useExecutiveBlockSnapshot.ts:~100-112`).
- **Mọi** snapshot gắn `watch(filter, resetFromGlobal, {deep:true})` ngay trong composable (`:~160`). Sau đó chỉ `loadAllBlocks()` mới nạp lại, và chỉ nạp waterfall/breakdown/ranking **khi `canViewGmv`** (`ExecutiveView.vue:456`). `canViewGmv` phụ thuộc `identityStore.user.scope` và có thể `false`→`true` trễ hoặc không bao giờ đúng với tài khoản không có `manager.dashboard-v2.gmv.read`; widget bị ẩn (`v-if="canViewGmv"`), nhưng với trường hợp quyền chuyển `true` sau đó, `watch(canViewGmv)` mới nạp (`:477-484`), còn nếu khác thứ tự (token làm mới sau khi mount) vẫn có cửa sổ `idle`.
- Trong `load()`, nếu request bị coi là "stale" (`requestId !== state.requestId || controller.signal.aborted`) thì `return` **im lặng, không đặt lại trạng thái** (`:~125-130`). Khi một `invalidateState` xảy ra mà không có `load()` đi kèm (ví dụ `patchLocalFilter` bên trong `syncChildFilters()` gọi trước `loadAllBlocks`, hay `previousSnapshot.resetFromGlobal` khi `comparisonType===0`), widget kẹt `idle` = "Đang tải" vĩnh viễn.
- Tương tự `growthAnalysisState` khởi tạo `'idle'` và chỉ được cập nhật sau `await Promise.all(requests)` (`ExecutiveView.vue:448-462`): **một request treo ⇒ Tăng trưởng treo theo**.

### 4.4. Lý do 3 (khả năng cao, cần xác nhận bằng Network tab): request không bao giờ kết thúc hoặc kết thúc rất chậm, không có giới hạn thời gian

- Không có timeout ở bất kỳ tầng nào (`grep timeout src/apis/*.ts` = rỗng; `request()` trong `dashboardV2Api.ts:121-139` chỉ truyền `signal` do snapshot tạo, snapshot không đặt hạn).
- `request()` retry ngay lập tức, không backoff (`while(true)`, `retries: 1` mặc định từ `load()`), nên mỗi endpoint có 2 lần thử.
- `requestExecutiveKpis/Trend/Ranking` nuốt lỗi của endpoint chuyên biệt (`catch {}`) rồi **gọi tiếp endpoint tổng hợp `AdminV2DashboardExecutive`** (kpis+trend+ranking), cũng 2 lần thử: tối đa 4 request **tuần tự** cho một widget (`dashboardV2Api.ts:367-407`). Khi backend chậm / 5xx, người dùng thấy "Đang tải…" suốt vài phút rồi mới ra lỗi, hoặc không bao giờ nếu kết nối treo.
- Lượng request song song cao: một lần vào trang bắn ≥ 9 request (KPI ×2 trùng nội dung cho thẻ và Waterfall, Trend ×3 gồm GMV-vs-DTT, Phân rã và Tăng trưởng, Lũy kế từ 01/01 cả năm, Ranking, Previous, BranchPerformance, Heatmap, Traffic, danh mục khu vực/chi nhánh); chạy HTTP/1.1 sẽ bị xếp hàng sau giới hạn 6 kết nối/host, làm các widget đầu tiên chờ lâu hơn.
- Khoảng ngày mặc định kéo dài đến 31/10 (ngày tương lai) làm backend có thể quét thừa; Lũy kế luôn quét cả năm.
- `apiClient.request` còn **nuốt lỗi hủy**: trả `undefined` (không throw) khi request bị hủy (`apiClient.ts:~268-275`). Nếu một hủy không do snapshot chủ động (ví dụ interceptor toàn cục hủy request trùng khóa khi thiếu `ignoreCancel`), `load()` nhận `undefined` → `empty` hoặc, nếu rơi vào nhánh stale, im lặng → `idle`.

### 4.5. Đường dẫn "huy hiệu partial" khi dữ liệu thật về nhưng thiếu

Nếu backend đã trả nhưng là phiên bản cũ (không có khóa `gmvWithVat`), `normalizeKpiBlock` ép `dataStatus='partial'` và gắn 5 trường mock cố định (`dashboardV2Api.ts:295-309`), nên huy hiệu "Một phần chỉ số chưa đồng bộ" luôn hiện dù backend không nói thế (FE-FRM-10). Đây là nguồn thứ hai của huy hiệu, độc lập với 4.2.

### 4.6. Cách xác nhận nguyên nhân thực tế (cho người sở hữu môi trường)

1. Mở Network, lọc `Admin/V2/Dashboard/Executive`: kiểm tra từng request có status/độ trễ ra sao (pending vô hạn → Lý do 3; 4xx/5xx → chuỗi retry/fallback; 200 → Lý do 2).
2. Console: `useExecutiveBlockSnapshot` không log; có thể đặt tạm `console.log` trên `state.status`. Nếu status luôn là `idle` ⇒ Lý do 2 (không `load()`).
3. Kiểm tra `identityStore.user.scope` có chứa `manager.dashboard-v2.gmv.read`? Nếu không, Waterfall/GMV-vs-DTT không hiện; ảnh cho thấy hiện nên tài khoản có quyền (hoặc build là `main`).

### 4.7. Cách sửa (tóm tắt, chi tiết ở §6)

Tách trạng thái `idle` (không hiển thị loading), thêm timeout + hủy sau N giây, bỏ chuỗi fallback tuần tự (hoặc chạy sau timeout ngắn), gộp request trùng (`loadKpis` dùng chung cho thẻ và Waterfall), bỏ cảnh báo "partial" khi chưa có dữ liệu, khởi tạo Tăng trưởng độc lập với `Promise.all`.

---

## 5. Trạng thái test và type-check

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| Cài đặt | `npm ci --no-audit --no-fund` | **Thành công** (exit 0, nhiều cảnh báo deprecate). Lưu ý: lệnh làm đổi `yarn.lock` (533 dòng thêm); đã `git checkout yarn.lock` để trả về nguyên trạng. Không có thay đổi mã nguồn nào được commit |
| Type-check | `npx vue-tsc -b --noEmit` | **Sạch**, exit 0, 0 lỗi |
| Lint | `npx eslint src/pages/dashboard-v2 src/components/report-dashboard tests/dashboard-v2` | **0 lỗi, 151 cảnh báo** (đều `vue/singleline-html-element-content-newline`, style, có thể `--fix`) |
| Test (mặc định) | `npx vitest run tests/dashboard-v2 e2e/dashboard-v2` trên Node **v26.7.0** | **15/33 file lỗi, 18 file đạt (55 test đạt)**. Lỗi: `TypeError: Cannot read properties of undefined (reading 'getItem')` tại `src/plugins/i18n.ts:13` (`localStorage` không có). Nguyên nhân là môi trường Node ≥ 25 (webstorage thử nghiệm xung đột jsdom), **không phải lỗi mã** |
| Test (khắc phục môi trường) | `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | **33/33 file đạt, 188/188 test đạt**, thời gian ≈ 4 giây |

Ghi chú: `e2e/dashboard-v2/*.spec.ts` thực chất là test vitest (script `test:e2e` = `vitest run e2e/dashboard-v2`), không phải trình duyệt thật, nên không bắt được lỗi trạng thái tải hay định dạng hiển thị trên trình duyệt. Bộ test hiện **mã hóa hành vi hiện tại**: `executiveFinancialCharts.spec.ts`, `executiveOverviewCards.spec.ts`, `metricCard.spec.ts` kiểm các chuỗi hiện có (3 cột, "Tỷ VNĐ"); cần cập nhật khi sửa theo spec, và cần thêm test cho TC-09, BR-CMP-05, bucket Quý/Năm, trạng thái `idle`.

---

## 6. Kế hoạch sửa (Fix plan) — theo thứ tự ưu tiên

Ký hiệu: **[BE]** = phụ thuộc đổi API backend (nêu trường/endpoint cần). **[FE]** = chỉ thuộc frontend. Đường dẫn gốc `pos.gui/src/`.

**Giai đoạn 0 — nền**
0. Tạo nhánh từ `origin/main`, cherry-pick `6ab6f78e`, chạy prettier/eslint theo cấu hình `main`, chạy test baseline với `NODE_OPTIONS=--no-experimental-webstorage`. [FE]

**Giai đoạn 1 — Nghiêm trọng (sai số liệu, phân quyền, hiển thị gây hiểu nhầm)**

1. **Hàm định dạng tiền tự động (BR-FMT-02, TC-09, FE-EX-04/FE-FMT-01/02)** [FE]
   - `pages/dashboard-v2/utils/executiveFormatters.ts`: thêm `formatMoney(value, {unit?})` (≥1e9 → "x,xx Tỷ"; ≥1e7 → "N Tr"; ≥1e6 → "x,x Tr"; còn lại "N ₫"; dấu âm "−"; null/NaN → "—"); thêm `pickAxisUnit(values)` và `formatAxis(value, unit)` để dùng chung đơn vị cho 1 trục/cột; `formatFullVnd(value)` cho tooltip. Bổ sung test TC-09 (7 ca).
   - Thay trong: `ExecutiveOverviewCards.vue` (bỏ `scale/unit`, `formatScaled`, `'T'`), `ExecutiveGmvNetRevenueChart.vue`, `ExecutiveGmvBreakdownChart.vue`, `ExecutiveCumulativeTrendChart.vue`, `ExecutiveRevenueWaterfall.vue`, `ExecutivePerformanceRanking.vue`, `BranchPerformanceHeatmap.vue:459-466`, `SalesLeaderboard.vue`, `PersonnelScorecard.vue`, `DemographicCharts/TimePeak`.

2. **Sửa trạng thái tải (Mục 4)** [FE]
   - `components/DashboardV2Block.vue`: tách `idle` khỏi `loading` (idle → không render hoặc skeleton trung tính); thêm skeleton; thêm slot "Xóa bộ lọc" cho `empty`.
   - `composables/useExecutiveBlockSnapshot.ts`: thêm `timeoutMs` (ví dụ 20–30 giây) bằng `AbortSignal.timeout`/`setTimeout`, khi hết giờ đặt `error` "Quá thời gian"; trong `load()` nhánh stale phải đảm bảo snapshot vẫn sẽ được nạp (gọi `load` kế tiếp) hoặc đặt trạng thái hợp lệ; `invalidateState` nên đặt `loading` nếu có `autoload`.
   - `views/ExecutiveView.vue`: gọi `load()` trực tiếp trong watcher của composable (thêm option `autoLoad`) để không có khoảng `idle`; bỏ `await Promise.all` trước `loadGrowthAnalysis` (chạy độc lập); dùng chung 1 request cho `overviewSnapshot` và `waterfallSnapshot` (và `gmvNet`/`breakdown`/growth dùng chung `trend`).
   - `services/dashboardV2Api.ts`: bỏ fallback tuần tự sang `AdminV2DashboardExecutive` (hoặc chỉ chạy khi endpoint chuyên biệt trả 404), thêm backoff, giữ `retries ≤ 1`.
   - `components/ExecutiveRevenueWaterfall.vue`: chỉ hiển thị cảnh báo/huy hiệu partial khi `status==='ready'` **và** `data` tồn tại.

3. **Chu kỳ & bộ lọc ngày (FE-FLT-01..05)** [FE]
   - `components/DashboardV2FilterBar.vue`: đổi option Chu kỳ thành Ngày/Tuần/Tháng/Quý/Năm (mặc định Tuần); dùng date picker định dạng DD/MM/YYYY (đã có `@vuepic/vue-datepicker` trong dependencies); validate Từ ≤ Đến, không trống, ≤ 3 năm, hiện lỗi tại ô, giữ filter hợp lệ gần nhất.
   - `composables/useDashboardV2Filter.ts`: mặc định `startOf('month')` → **hôm qua** (ngày 1 → tháng trước), chuẩn hóa `periodType`.
   - `views/ExecutiveView.vue:198-202` + `composables/useExecutiveBlockSnapshot.ts:~60`: ánh xạ đúng `day|week|month|quarter|year`; mở rộng `ExecutiveChartGranularity` (`types.ts`) và `utils/executiveTrendAggregation.ts` (thêm Quý/Năm, nhãn bucket theo FR-FLT-04, nhãn "(một phần: n ngày)"). Test AC-FLT-04/05.

4. **Phân quyền UI (FE-PERM-01/02, FE-KPI-01)** [FE + BE]
   - `routeGuard.ts`: định nghĩa mã quyền riêng theo tab (`...executive.read`, `...operational.read`, `...product.read`, `...personnel.read`, `...kpi.read`, `...kpi.write`) hoặc ánh xạ vai trò. **[BE]** Identity/pos.api cần cấp danh mục quyền tương ứng và phạm vi dữ liệu (RLS) ở Report API.
   - `views/KpiManagementView.vue:33`: `canWrite` dùng `kpiWrite` riêng; MANAGER mặc định chỉ đọc; ẩn Thêm/Import/Sửa/Xóa/hàng loạt (AC-ROLE-04).
   - `index.vue:33`: `personnelRole` lấy từ vai trò thật (BOD/MANAGER/STAFF), không suy từ số tab.

5. **Sparkline/Σ bucket không phụ thuộc bộ lọc cục bộ (FE-EX-12/20)** [FE]
   - `views/ExecutiveView.vue:524`: truyền cho `ExecutiveOverviewCards` một snapshot trend toàn cục riêng (khoảng ngày = bộ lọc toàn cục, khu vực/chi nhánh toàn cục), không dùng `gmvNetData`. Bỏ `recentTrendDateRange` (cắt 3 tháng) hoặc chỉ cắt khi hiển thị, không cắt dữ liệu. Thêm test INV-08 (Σ bucket = thẻ).

6. **Ẩn widget hoãn / KPI cá nhân (FE-HR-01..03)** [FE]
   - `views/PersonnelView.vue` + `components/PersonnelMockBlocks.vue`: bỏ render `refractionist`, `weeklyKpi`, `gamification`; giữ Lab chỉ khi có dữ liệu live theo KTV (FR-HR-04). Xóa/ẩn Scorecard "Tiến độ KPI". **[BE]** ngừng trả các khối mock.

7. **Heatmap: ngưỡng màu + nguồn + phạm vi (FE-EX-37..42)** [FE + BE]
   - `components/report-dashboard/BranchPerformanceHeatmap.vue:424-456`: thay `ratioClass` bằng 11 mức theo FR-EX-08 (% mục tiêu, Tỷ lệ chuyển đổi) và 4 mức tứ phân vị cho GMV/Traffic; chú thích biên "≥ 80%"; đổi tab thành "% Mục tiêu · GMV · Traffic · Tỷ lệ chuyển đổi".
   - `views/ExecutiveView.vue:331-341`: bỏ `.slice(0,10)`.
   - **[BE]** chuyển heatmap sang endpoint V2 (ví dụ `/Admin/V2/Dashboard/Executive/BranchPerformance` với bucket ISO tuần, Σ GMV, Σ Traffic, Σ đơn).

8. **Dữ liệu mock/placeholder (FE-OP-09/10/12/15, FE-CMN-10)** [FE + BE]
   - `views/OperationalView.vue`: không render khối `paymentMethod`, `marketingCampaign`, `conversionRate` khi `dataStatus==='mock'`; hiện "Chưa có dữ liệu" thay vì số minh họa. **[BE]** cung cấp `paymentMethod` live (6 phương thức theo giá trị phiếu thu), `campaign` (GMV, DTT, Số đơn, AOV), `conversionRate` (M14 + `trafficDays missing`).
   - Xóa `mocks/index.ts` nếu không dùng.

**Giai đoạn 2 — Lớn (thiếu tính năng, bộ lọc không tác động)**

9. **Đủ 9 thẻ (FE-EX-01/02/03/07/08/09)** [FE + BE]: thêm thẻ Nợ treo (đảo màu), phụ đề đúng bảng FR-EX-01, mũi tên theo chiều thực (`Math.sign(current - previous)`), màu theo `polarity` (`higher|lower-is-better`), điểm % cho tỷ lệ (BR-CMP-07), mẫu số ≤ 0 → "—" (`components/MetricCard.vue`, `ExecutiveOverviewCards.vue`). **[BE]** trường `outstandingDebt`, `outstandingDebtShareOfGmv`, `previousPeriod.outstandingDebt`, `adjustment.{returns,exchange,cancel}`, `vatAmount`, `orderCountGross` (M02g), `canceledOrFinishedOrderCount`.
10. **Waterfall 5 cột (FE-EX-21..25)** [FE + BE]: `ExecutiveRevenueWaterfall.vue` dựng thác nước (stack ẩn + cột) với 5 cột, tooltip %GMV + số đơn, cột 0 vẫn có nhãn, bỏ nút Chu kỳ. **[BE]** trường `returnAmount`, `exchangeAmount` (Kết thúc), `cancelAmount`, và `returnOrderCount`, `finishedOrderCount`, `canceledOrderCount`.
11. **FR-EX-04 Hiệu quả đơn hàng (FE-EX-26)** [FE + BE]: tạo `ExecutiveOrderEfficiencyChart.vue` với 3 thẻ + 3 chế độ. **[BE]** `trend[].orderCount (M02), orderCountGross (M02g), unitCount (Σ số lượng)` để tính UPT = Σ SL / M02g và AOV gia quyền ΣDTT/ΣM02.
12. **Bảng xếp hạng đúng spec (FE-EX-33/34)** [FE + BE]: tab Sản phẩm, #, Tỷ trọng, % đạt MT, Tỷ lệ trả hàng (đỏ > 12%), Top 5 + "Xem tất cả", dòng "Tổng <phạm vi>". **[BE]** `ranking.items[].{gmvShare,netRevenueShare,targetAttainment,returnRate}` và `ranking.products[]`.
13. **Lũy kế (FE-EX-29..31)** [FE + BE]: 3 thẻ + 3 biểu đồ đồng bộ hover, Combo, nhãn "Vượt/Chậm tiến độ", nhận xét, Nợ treo vs trần; theo khoảng lọc; "Chưa thiết lập mục tiêu". **[BE]** `cumulativeDebt`, `debtCeiling`, cờ `hasTarget`.
14. **Tăng trưởng (FE-EX-47..51)** [FE]: metric GMV/DTT/AOV/Volume/UPT, đường Kỳ này/Kỳ trước, "Tăng trưởng chung" = thẻ, nhận xét cao/thấp nhất; khởi tạo độc lập.
15. **Bộ lọc đa chiều + "Đang lọc riêng" + URL (FE-FLT-10/12/13)**: thêm panel FR-FLT-03, badge, `types.ts DashboardV2Filter` bổ sung chiều; nhãn "Đang lọc riêng: <phạm vi>" ở 7 widget. [FE + BE: cần các tham số `productCategoryIds, brandIds, customerGender, basketSegment, picIds, orderStatus`]
16. **Vận hành (FE-OP-01,04,07,11,13,16)** [FE + BE]: Order Aging theo công đoạn + 4 nhóm tuổi; Time Peak theo GMV; tooltip dương cho Nam; Benchmark "So với" + toggle; Anomaly chọn chỉ số/thực thể + dải tin cậy; Refund thêm M13b/M13c. **[BE]** `orderAging[].{stage, bucket 0-5/6-10/11-20/>20}`, `refundRate.{exchangeRate, cancelRate}`, `benchmark` trung bình gia quyền do backend tính.
17. **Sản phẩm (FE-PR-01..08)** [FE + BE]: đủ 10 chiều × GMV/Số lượng; Treemap drill-down + breadcrumb + modal; mount `ProductBrandDistribution` và đổi sang GMV theo thương hiệu; Top SP thêm NCC/Tồn/SS/ROP/cảnh báo; Ma trận phôi tròng. **[BE]** SPH/CYL/loại tròng, SS/ROP (QĐ-15).
18. **Nhân sự (FE-HR-04..06)** [FE + BE]: PIC Sales xếp theo GMV, cột Chi nhánh/Tỷ trọng/Số đơn (M02g)/AOV, dòng "Chưa gán"; thẻ Hạng r/n + "Nhân viên xuất sắc" (Top 3); STAFF chỉ nhận dữ liệu của chính mình **[BE]**.
19. **KPI & Import (FE-KPI-02..09, FE-IMP-01/02)** [FE + BE]: tính thẻ thống kê từ endpoint tổng hợp **[BE]**; page size 10; wizard bắt buộc Mục tiêu GMV > 0, DTT tùy chọn, % ≤ 100; xung đột khi kích hoạt ngay ở danh sách; `companyId` lấy từ danh mục công ty; thêm Import Traffic (`/Admin/V2/Dashboard/Traffic/Import` xem trước/xác nhận) và Import mục tiêu (`/Admin/V2/Kpi/Import`) theo BR-IMP.
20. **Chỉ số hóa Header/Đồng bộ (FE-FLT-14, FR-SHELL-01)** [FE + BE]: hiển thị "Dữ liệu tính đến" từ `dataAsOf`, nút Đồng bộ thật sự tải lại tất cả block, nút "Cấu hình KPI" chỉ BOD, avatar + vai trò, tiêu đề "EBID Workspace".
21. **Modal chung (FE-CMN-07)** [FE]: tạo component `DataDetailModal` dùng `VueFinalModal` (Esc, click nền, reset), có tìm kiếm / sort 3 trạng thái / đơn vị cột; thay modal tự dựng.
22. **Bộ lọc đa khu vực (FE-FLT-08)** [FE]: hoặc giới hạn UI về 1 khu vực, hoặc truyền toàn bộ `regionIds` vào widget con.
23. **Tách `metric/dimension/comparisonType` khỏi filter toàn cục (FE-FLT-15)** [FE]: đưa vào state cục bộ của `ProductView`.

**Giai đoạn 3 — Nhỏ (định dạng, nhãn)**

24. Việt hóa thuật ngữ (Net Revenue → Doanh thu thuần, Direct/PreOrder → Đơn lắp sẵn/Đơn đặt trước, Drop Rate/Contribution, Order Aging, Theo Value…), dùng "−" (U+2212) cho số âm, "—" cho thiếu dữ liệu, bỏ ghi chú nội bộ lọt ra UI (subtitle "…phải phân hoạch đúng tổng GMV"), tooltip (i) hover/focus với công thức theo mục 3. [FE]
25. Skeleton theo hình dạng widget, "Xóa bộ lọc" khi rỗng. [FE]
26. Cập nhật toàn bộ test để khớp spec; thêm test cho TC-09, BR-CMP-05, AC-FLT-03/04/05, AC-EX03-01 (5 cột), AC-ROLE-04, trạng thái `idle`. Bổ sung workflow CI với `--no-experimental-webstorage` hoặc cố định Node 20 (`.nvmrc`). [FE]

---

## 7. Câu hỏi mở

1. **Build nào đang chạy ở môi trường chụp ảnh?** `main` (không có cổng quyền GMV) hay `929-new-dashboard`? Ảnh có widget GMV nên cần xác nhận tài khoản có `manager.dashboard-v2.gmv.read` hay build là `main`.
2. **Request nào treo?** Cần ảnh Network tab (status + thời gian) của `Executive/Kpis`, `Executive/Trend`, `BranchPerformance` để chốt Lý do 3. Backend có endpoint chuyên biệt (`/Kpis`, `/Trend`, `/Ranking`, `/PreviousPeriod`) đã deploy ở môi trường đó chưa?
3. **Quyền V2 riêng:** `routeGuard.ts` ghi chú "Temporary rollout: reuse existing dashboard permission until dedicated V2 scopes are provisioned". Có lịch cấp các mã quyền V2 riêng theo vai trò không, và Identity sẽ trả vai trò (BOD/MANAGER/STAFF) ở trường nào?
4. **Trường `revenue` ở Nhân sự / Time Peak / Treemap / Đa chiều là GMV hay DTT?** BR-DIM-02 yêu cầu GMV cho xếp hạng bán; FE đang gọi "Doanh thu". Cần xác nhận với đội backend (đã ghi nhận để QC backend đối chiếu).
5. **`comparisonType` mặc định MoM và dịch kỳ theo tháng**: có chủ ý nghiệp vụ không? Spec BR-CMP-01 yêu cầu kỳ liền trước cùng số ngày. Backend xử lý `comparisonType` thế nào (đã được agent backend kiểm)?
6. **Heatmap v1 hay V2?** Có kế hoạch chuyển `/Admin/Report/BranchPerformanceHeatmap` sang V2 không? Hiện hai nguồn có thể khác định nghĩa GMV/DTT.
7. **Nút "KPI" trong Heatmap** (`manager.dashboard.report.kpi.read`) mở hệ KPI v1; spec chỉ có một nguồn KPI (BR-TGT-01). Có loại bỏ hệ v1 khỏi Dashboard V2 không?
8. **`staffId = identityStore.user.id`** có đúng với `scorecards[].staffId` không (FE-HR-07)?
9. **Dữ liệu Lab/Traffic/CSAT:** nguồn có sẵn để thay mock? (QĐ-13 nói NPS đã có; Lab chưa rõ.)
10. **Ranh giới mức độ:** một số mục (FE-EX-26 thiếu FR-EX-04, FE-HR-01 KTV khúc xạ) có thể xếp "Nghiêm trọng" nếu PM coi vi phạm §0.3 là lỗi nghiêm trọng; báo cáo này theo đúng §0.4 (thiếu tính năng = Lớn).
