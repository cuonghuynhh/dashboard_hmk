# TỔNG HỢP QC DASHBOARD V2 & KẾ HOẠCH ĐIỀU CHỈNH

| Thuộc tính | Giá trị |
|---|---|
| Ngày | 17/10/2026 |
| Chuẩn đối chiếu | `docs/PRODUCT_SPEC_DASHBOARD.md` v2.0 |
| Code được QC | `report.api` @ `main` c6f2324 (backend Dashboard V2) · `pos.gui` @ `929-new-dashboard` 6ab6f78e (giao diện) · `pos.api` @ `main` 4495b18e9 (mô hình dữ liệu POS) |
| Báo cáo chi tiết | [QC_A — backend lõi](QC_A_backend_core.md) · [QC_B — backend phân hệ & phân quyền](QC_B_backend_modules.md) · [QC_C — frontend](QC_C_frontend.md) |

> **Lưu ý:** backend thật của Dashboard V2 là repo **`eggstech/report.api`** (endpoint `/Admin/V2/Dashboard/*`), không phải pos.api. pos.api là hệ thống POS nguồn; report.api đồng bộ dữ liệu từ POS vào các bảng tổng hợp.

---

## 1. Kết luận

Dashboard V2 hiện tại **lệch tài liệu chuẩn ở mức mô hình dữ liệu**, không chỉ ở giao diện. Sửa giao diện thôi sẽ không làm số liệu đúng.

| # | Vấn đề gốc | Mức | Nguồn |
|---|---|---|---|
| 1 | "Doanh thu thuần" đang là **tiền thực thu** (Σ PaidAmount đơn − Σ PaidAmount trả). "Giá trị điều chỉnh" = DTT − GMV nên có thể dương | Nghiêm trọng | QC_A |
| 2 | GMV cộng giá **trước giảm giá cấp đơn**; **cộng trùng** đơn hàng sinh từ đơn đặt; **bỏ sót** đơn đặt ở trạng thái Đơn tạm | Nghiêm trọng | QC_A |
| 3 | Số liệu gom theo `IssueAt`, mà POS ghi đè `IssueAt` bằng **ngày hoàn thành**, nên đơn tạo ngày 30/09 hoàn thành 02/10 bị tính vào tháng 10 | Nghiêm trọng | QC_A |
| 4 | report.api **không có dữ liệu** để biểu diễn Kết thúc / Hủy đơn đặt, chuyển cọc, Nợ treo (thiếu trường trên `PreOrder`, chưa có snapshot công nợ) | Nghiêm trọng | QC_A |
| 5 | Trang Vận hành / Sản phẩm / Nhân sự tính tiền theo **doanh thu thuần không VAT**, không phải GMV, nên tổng các trang không khớp nhau | Nghiêm trọng | QC_B |
| 6 | **Không có phân quyền theo phạm vi ở server:** đoạn kiểm tra chi nhánh bị comment; mọi trang và quyền ghi KPI/Traffic dùng chung một mã `manager.dashboard.read`; quyền GMV chỉ ẩn ở giao diện | Nghiêm trọng | QC_B, QC_C |
| 7 | **Dữ liệu giả** trả ra từ API và hiển thị trên UI: Chiến dịch, Chuyển đổi, Nhân sự (KPI tuần, gamification, KTV khúc xạ, Lab), Thanh toán, Benchmark | Nghiêm trọng | QC_B, QC_C |
| 8 | Mục tiêu lấy từ bảng `SaleTarget` cũ (theo ngày trong tuần / cuối tuần / lễ), không từ KPI V2; không có KPI thì trả 0% | Lớn | QC_A, QC_B |
| 9 | Đồng bộ production không ghi trạng thái `PreOrderFact` / `CustomerFirstPurchaseFact`, nên Executive luôn bị coi là "một phần"; job chỉ chạy 1 lần/ngày lúc 23:45 | Lớn | QC_A |
| 10 | Giao diện: chưa có định dạng đơn vị tự động (512 Tr hiện "0,5 Tỷ"); lỗi **"Đang tải dữ liệu..." treo** do trạng thái `idle` hiển thị như `loading`, không timeout, fallback tuần tự tới 4 request; Waterfall 3 cột; bộ lọc thiếu Tuần/Tháng; thiếu thẻ Nợ treo, FR-EX-04 | Nghiêm trọng / Lớn | QC_C |

**Về ảnh chụp màn hình:** dòng đỏ "Chưa đủ dữ liệu để cân waterfall: GmvWithVat, AdjustmentWithVat, NetRevenueWithVat" là **chuỗi mặc định của frontend** khi block KPI chưa có dữ liệu (`ExecutiveRevenueWaterfall.vue:80-83`). Backend chưa bao giờ trả `AdjustmentWithVat`. Nguyên nhân thật là request `Executive/Kpis` bị treo hoặc lỗi. Có hai khả năng chính:
1. Các migration Dashboard V2 trong `Migrations/Pending/` chưa được áp dụng ở môi trường đó.
2. Truy vấn quá chậm cộng với cơ chế fallback/retry của frontend.

Cần mở Network tab hoặc hỏi đội vận hành để chốt.

**Kết quả chạy bộ dữ liệu chuẩn (dự đoán từ code):** TC-01, 02, 03, 05, 08, 11 đều **không đạt**. Ví dụ tháng 9: GMV 6.996.000 (chuẩn 12.262.400), DTT 6.648.000 (chuẩn 12.068.000).

**Test hiện có:** report.api có 283/286 test Dashboard V2 đạt, pos.gui có 188/188 đạt. Nhưng nhiều test đang **khóa hành vi sai chuẩn** (Waterfall 3 cột, "Tỷ VNĐ", điều chỉnh dương, mục tiêu = 0, các khối mock), nên test xanh không có nghĩa là đạt chuẩn.

---

## 2. Kế hoạch theo đợt

| Đợt | Nội dung | Điều kiện | Trạng thái |
|---|---|---|---|
| **1** | Các sửa không cần quyết định nghiệp vụ, không migration. **Backend:** ghi trạng thái sync PreOrder/FirstPurchase; gỡ mọi dữ liệu giả; tăng trưởng "—" khi mẫu số ≤ 0; không có mục tiêu thì `null`; thuật toán bất thường (7 ngày trước, σ mẫu, k=2); 5 nhóm Basket; nhóm tuổi; tỷ lệ chuyển đổi bỏ ngày thiếu Traffic. **Frontend:** định dạng đơn vị tự động; sửa treo "Đang tải"; ẩn khối hoãn và khối mock; bộ lọc Ngày/Tuần/Tháng/Quý/Năm, tuần ISO, mặc định đầu tháng → hôm qua, DD/MM/YYYY; kỳ so sánh n ngày liền trước; mũi tên/màu; sparkline; Heatmap 11 mức; validate KPI | Không | **Xong**, nhánh cục bộ `qc/dashboard-v2-wave1`, chưa push. report.api: 7 commit, 313/316 test (1 lỗi có sẵn, 2 cần Postgres) — [WAVE1_report_api.md](WAVE1_report_api.md). pos.gui: 11 commit, 318/318 test, type-check và lint sạch — [WAVE1_pos_gui.md](WAVE1_pos_gui.md) |
| **2** | **Mô hình doanh số theo chuẩn:** bảng sự kiện E1–E9; mở rộng `PreOrder` (ngày tạo, Kết thúc, Hủy, giá trị, người bán); gom theo ngày tạo; GMV/điều chỉnh/DTT/Volume/AOV/VAT theo mục 3; Nợ treo; chuyển Vận hành/Sản phẩm/Nhân sự sang GMV; Waterfall 5 cột; thẻ thứ 9; FR-EX-04; kèm migration + backfill lịch sử + test bộ dữ liệu chuẩn mục 9 | Cần trả lời **Nhóm A** | **2a xong** (6 commit, bộ dữ liệu chuẩn đạt 11/11 ca, xem [WAVE2A_report_api.md](WAVE2A_report_api.md)). **Đã gộp 2a + 3a** vào nhánh tích hợp `qc/dashboard-v2`: 438/440 test đạt, xem [INTEGRATION_report_api.md](INTEGRATION_report_api.md). **Đang làm:** 2b (Vận hành/Sản phẩm/Nhân sự sang GMV, nhánh `qc/dashboard-v2-wave2b`) và giao diện đợt 2/3 (pos.gui nhánh `qc/dashboard-v2-wave2`) |
| **3** | **Phân quyền & dữ liệu chủ:** vai trò BOD/MANAGER/STAFF, phạm vi cửa hàng ở server, mã quyền tách theo trang/ghi, quyền GMV ở server; danh mục khu vực chung; **KPI V2** theo chuẩn và chuyển Executive/Heatmap sang KPI V2; **Traffic** dùng chung; **import Excel** Traffic và mục tiêu; Heatmap V2 | Cần trả lời **Nhóm B, C** | **3a xong** (phân quyền và phạm vi ở server), nhánh `qc/dashboard-v2-wave3-rbac`: 5 commit, 381/381 test DashboardV2 + KpiV2 đạt — [WAVE3A_report_api_rbac.md](WAVE3A_report_api_rbac.md). **Điều kiện khi triển khai:** merge nhánh `pos.api` `1001-phan-quyen-cum-chi-so-dashboard` (thêm mã `manager.dashboard-v2.gmv.read`) và cấp quyền GMV cho BOD **trước**, nếu không mọi người sẽ bị ẩn GMV; giữ `DashboardV2:LegacyScopeMapping=true` tới khi Identity cấp các mã quyền mới. 3b (KPI V2, Traffic chung, import, danh mục khu vực) làm sau khi 2a xong vì cùng đụng migration |
| **4** | Các widget còn thiếu phụ thuộc dữ liệu: Order Aging theo công đoạn, Ma trận SPH×CYL, SS/ROP, chiến dịch, phương thức thanh toán 6 nhóm, kênh cửa hàng/online | Cần trả lời **Nhóm D** | Chờ quyết định |

Mọi thay đổi chỉ commit trên nhánh cục bộ, **không push**. Anh/chị duyệt rồi mới tạo PR.

---

### 2.1. Trạng thái tích hợp (cập nhật 18/10/2026 21:30)
Tất cả các nhánh chỉ nằm trên máy, **chưa push** lên repo nào.

| Repo | Nhánh | Nội dung | Kiểm chứng độc lập của PM |
|---|---|---|---|
| report.api | `qc/dashboard-v2` @ `aa88341`, hơn `origin/main` 56 commit | Đợt 1 → 4 (QĐ-16…31) cùng các bản sửa F1–F5; **đợt 5:** bộ lọc đa chiều FR-FLT-03 (PM-06), `GET Admin/V2/Dashboard/FilterOptions`, `NotAppliedDimensions` / `TargetsIgnoreDimensions`, tab Sản phẩm của bảng xếp hạng (PM-07) ([WAVE5_report_api.md](WAVE5_report_api.md)) | Build sạch; DashboardV2 + KpiV2 **524/526 đạt** (2 bỏ qua do cần Postgres); bộ dữ liệu chuẩn **15/15** (TC-10 chạy qua bước lọc thật); EF không còn thay đổi model chưa có migration |
| pos.gui | `qc/dashboard-v2-wave5` @ `f32e03a0` (nối tiếp wave2 → 3 → 4 → 5) | Như đợt 4, thêm: 5 lỗi của QC cuối ([QC_FINAL_frontend.md](QC_FINAL_frontend.md)); panel bộ lọc đa chiều có badge; nhãn "Không áp dụng bộ lọc"; tab Sản phẩm ([WAVE5A_pos_gui.md](WAVE5A_pos_gui.md), [WAVE5B_pos_gui.md](WAVE5B_pos_gui.md)) | Vitest **56 file / 461 test đạt**; vue-tsc sạch; eslint sạch |
| pos.api | `qc/dashboard-v2-permissions` @ `f38f44545` (từ nhánh `1001`) | Thêm 5 mã quyền Dashboard V2 | Build sạch |

**Các lỗi PM tự tìm khi review, đã sửa và kiểm lại:**
- **Đợt 4:**
  - M04 thiếu phiếu thu nợ;
  - đồng bộ HRM có thể xóa trắng cây khu vực;
  - khu vực / cụm cũ không bị tắt;
  - cụm thuộc nhiều khu vực;
  - tổng widget thanh toán ≠ M04;
  - Heatmap fallback ngầm về endpoint cũ.
- **Đợt 5:**
  - lọc trạng thái đơn dùng bảng cũ `ReportOrderStatistic` và mã `PRE_ORDER_ENDED` không tồn tại;
  - phân khúc hóa đơn tính theo giá trị sự kiện thay vì đơn gốc.

PM-06 đã được chỉnh cho khớp mô hình sự kiện.

**Trước khi triển khai:**
1. Merge quyền của pos.api, và cấp `manager.dashboard-v2.gmv.read` cho BOD.
2. Giữ `DashboardV2:LegacyScopeMapping=true`.
3. Cấu hình `Hrm:Host`, `Hrm:AccessToken` và `Identity:AppCode=POS`.
4. Chạy các migration trong thư mục `Pending`.
5. Chạy `POST Admin/V2/Region/SyncFromHrm` **một lần trên staging** và xem kết quả.
6. Chạy lại backfill sự kiện doanh thu (QĐ-17 `SubmitAt`).
7. COD / Trả góp chưa có mã trong POS.
8. **Lọc đa chiều dùng truy vấn con tương quan trên `ReportRevenueEvent`.** Nên đo hiệu năng trên dữ liệu thật; có thể cần index `(RootOrderId, EventType)`.

**Còn lại:**
- Anh/chị quyết định push / tạo PR.
- Backlog: sparkline theo ngày cho thẻ Volume / Biên LN / Nợ treo; các mục [P2] của spec.

Từ 17/10 22:36, phần thực thi do worker **agy** (model `gemini-3.8-flash-high`) làm. PM lập kế hoạch, viết đề bài, kiểm chứng và gộp nhánh. Change log từng đợt có trong các file `WAVE*`, `INTEGRATION_*`, `FIX1_*`; các file đều có khối "Đính chính / Xác nhận của PM" khi worker ghi sai so với code.

## 3. Câu hỏi cần chốt

### 3.0. Câu trả lời của anh/chị (18/10/2026) — đã chốt, áp vào tài liệu chuẩn v2.2
| Câu | Trả lời | Áp dụng |
|---|---|---|
| A1 | Theo đề xuất; **100% đơn đều xuất VAT** (không có trường hợp VAT = 0) | QĐ-16 |
| A2 | Chỉ tính đơn thật sự được lập; đơn tại quầy trả tiền mặt hoàn thành ngay. PM đã kiểm tra code POS: "tạo mới đơn" ghi ngay bản nháp `SALE_ORDER_DRAFT` (`CreateAt` = lúc mở nháp); mốc lập đơn thật là `SubmitAt` (đơn tại quầy: `SubmitAt` = lúc hoàn thành, `SaleOrderService.cs:1806-1809`) | QĐ-17 → `SubmitAt` |
| A3 | Đúng: "Kết thúc" là nút hoàn thành đơn đặt thủ công; ra đủ số lượng thì đơn đặt tự Hoàn thành | QĐ-18 |
| A4–A9 | Theo đề xuất | QĐ-18 … QĐ-21 |
| A10 | Không phân biệt cọc / thu nợ / chuyển cọc; chỉ có chứng từ phiếu thu | QĐ-26: M04 = Σ phiếu thu |
| B1, B4, B5 | Theo đề xuất | QĐ-22 |
| B2 | MANAGER quản lý các cửa hàng ở mục "Cửa hàng đang quản lý" trong hồ sơ nhân viên. PM đã lần theo code: danh sách này đến từ Identity `GET /Admin/AccountSite/AppCodeAccountSite/All` (bỏ vai trò `NOAUTHORIZED`) | QĐ-27 |
| B3 | Khu vực & Cụm cửa hàng lấy từ HRM (Thiết lập chấm công): `StoreCluster` → `BuddyStoreGroup` → `BuddyStoreGroupSite` (repo `eggstech/hrm.api`) | QĐ-28: bộ lọc 3 cấp |
| C1–C4 | Theo đề xuất | QĐ-24, QĐ-25 |
| D1 | Không có công đoạn mài lắp; dùng 2 chặng Đặt hàng → Hoàn thành đơn hàng | QĐ-29 |
| D2 | Theo đề xuất | — |
| D3 | Đơn áp CTKM / voucher có mã chiến dịch; phương thức thanh toán có mã riêng | QĐ-30 |
| D4 | Chưa có Lab — hoãn | QĐ-31 |


Cột "Đề xuất" là phương án tôi sẽ áp nếu anh/chị trả lời "theo đề xuất".

### Nhóm A — Mô hình doanh số trên dữ liệu POS thật (chặn đợt 2)
| # | Câu hỏi | Phát hiện từ code POS | Đề xuất |
|---|---|---|---|
| A1 | "Giá khách cam kết trả" là gì khi POS lưu **giá chưa VAT, VAT cộng thêm chỉ khi `NeedVat = true`** (`NeedPayAmount = (ProductAmount − giảm giá) + VatAmount`)? | Tài liệu chuẩn giả định giá đã gồm VAT | GMV = `NeedPayAmount` không gồm phí ship (sau giảm giá, cộng VAT nếu đơn có xuất VAT). VAT = Σ `SaleOrderItem.VatAmount` (bằng 0 nếu đơn không xuất VAT). Sửa BR-VAL-01 thành "gồm VAT nếu có". |
| A2 | "Ngày tạo đơn" của Đơn hàng lấy trường nào? `IssueAt` bị ghi đè khi hoàn thành; `SubmitAt` gán bằng ngày hoàn thành nếu rỗng; `CreateAt` là ngày tạo bản ghi (kể cả nháp) | | Dùng `CreateAt` cho cả đơn tại quầy và đơn online |
| A3 | Nhận biết **"Kết thúc"**: POS không có trạng thái riêng, chỉ có `CompleteAtEnd` kèm `PRE_ORDER_COMPLETED` | | Kết thúc = `CompleteAtEnd` có giá trị **và** phần còn lại chưa chuyển thành đơn hàng; khoản trừ = giá trị phần chưa chuyển, ghi ngày `CompleteAtEnd` |
| A4 | Đơn đặt **chuyển một phần thành nhiều đơn hàng** (`SaledQuantity` / `LeftQuantity`, quan hệ 1–n) | Tài liệu chuẩn giả định 1–1 | GMV ghi **toàn bộ** giá trị đơn đặt ở ngày tạo; các đơn hàng sinh ra không cộng lại; phần còn lại khi Kết thúc/Hủy bị trừ (theo A3) |
| A5 | **Đổi hàng sau bán** (`ExchangeParentId`): POS tạo phiếu trả + đơn đổi mới. Code hiện bỏ đơn đổi khỏi GMV nhưng vẫn trừ phiếu trả, nên DTT bị thấp | Tài liệu chuẩn chưa có sự kiện này | Phiếu trả = Trả hàng (E4); đơn đổi = đơn hàng mới (E2) tính GMV bình thường |
| A6 | Giá vốn cho Biên LN gộp khi đơn đặt chưa xuất kho | | Dùng giá vốn hiện hành của sản phẩm tại ngày tạo đơn đặt; khi Kết thúc/Hủy thì đảo đúng giá vốn đó |
| A7 | Khách `KHACHLE` (khách lẻ không định danh) có tính "Khách hàng mới"? | Code đang loại | Loại (không xác định được là khách mới) |
| A8 | Chi nhánh đã **ngừng hoạt động**: số liệu lịch sử có tính vào tổng toàn hệ thống? | Code đang loại | Có tính; bộ lọc hiển thị chi nhánh đóng trong nhóm "Đã đóng" |
| A9 | **Nợ treo:** nguồn là sổ `Debt` của POS (nợ theo khách hay theo đơn)? Có lịch sử số dư cuối ngày không? | Chưa có truy vấn công nợ nào | report.api đồng bộ snapshot số dư công nợ **theo khách** cuối mỗi ngày từ `Debt`; Nợ treo = Σ số dư dương. **Cần đội dev xác nhận cấu trúc `Debt`.** |
| A10 | Danh sách mã `PaymentType` / chứng từ: phân biệt cọc / thanh toán / thu nợ / hoàn tiền / **chuyển cọc** (đổi hàng từ đơn đặt) | Code chỉ thấy `CUSTOMERPAID` | **Cần đội dev cung cấp danh sách mã** — không đoán được từ code |

### Nhóm B — Phân quyền & dữ liệu chủ (chặn đợt 3)
| # | Câu hỏi | Đề xuất |
|---|---|---|
| B1 | Xác định vai trò BOD / MANAGER / STAFF thế nào? Hiện Identity chỉ cấp `manager.dashboard.read` | Cấp mã quyền riêng trong Identity: `dashboard-v2.bod`, `dashboard-v2.manager`, `dashboard-v2.staff`, cộng `dashboard-v2.gmv.read`, `dashboard-v2.kpi.write`, `dashboard-v2.traffic.write`; report.api đọc từ token |
| B2 | "Cửa hàng được gán" của MANAGER lấy từ đâu? | Danh sách chi nhánh làm việc của tài khoản trong POS (đồng bộ sang report.api); không dùng `RegionSite` do từng tài khoản tự cấu hình |
| B3 | Danh mục khu vực: hiện **mỗi tài khoản tự tạo khu vực riêng** (`Region`/`RegionSite` theo `AccountId`), nên một chi nhánh có thể thuộc nhiều khu vực | Một danh mục khu vực **chung toàn công ty** do BOD quản lý: HCM · Miền Đông · Miền Tây · Miền Bắc · Miền Trung (theo `data-store-kpi.md`); mỗi chi nhánh thuộc đúng 1 khu vực |
| B4 | Khi tài khoản không có quyền GMV: API trả 403 cho cả block hay trả `null` các trường GMV? | Trả `null` các trường GMV kèm cờ `gmvHidden`; trang vẫn dùng được |
| B5 | Bật lại kiểm tra phạm vi chi nhánh ở server (đang bị comment). Hiện ai cũng truyền được `SiteIds` bất kỳ | Bật lại ngay khi có B1–B2 (ưu tiên cao nhất của đợt 3) |

### Nhóm C — KPI & Traffic (chặn đợt 3)
| # | Câu hỏi | Đề xuất |
|---|---|---|
| C1 | KPI thật (`data-store-kpi.md`, 61 cửa hàng) là **mục tiêu theo ngày**: một mức **trong tuần** và một mức **cuối tuần** (cộng ngày lễ trong bảng `SaleTarget`). Mô hình KPI trong tài liệu chuẩn là mục tiêu theo chu kỳ | Mở rộng KPI V2: KPI chi nhánh khai báo theo tháng bằng **mục tiêu ngày theo loại ngày** (Trong tuần / Cuối tuần / Lễ). Mục tiêu một khoảng ngày = Σ mục tiêu từng ngày (thay cho chia đều theo ngày ở BR-TGT-03). Khu vực / công ty = tổng các chi nhánh. Cập nhật tài liệu chuẩn |
| C2 | Mục tiêu trong `data-store-kpi.md` (vd HMK BÌNH THẠNH 45 Tr/ngày thường) là **GMV** hay **doanh thu thuần**? KPI V2 hiện tính trên doanh thu thuần không VAT | Coi là **GMV** (PM-01); % đạt = GMV / mục tiêu |
| C3 | Traffic hiện lưu **theo tài khoản người nhập** (người khác không thấy) | Traffic dùng chung theo (chi nhánh, ngày), có lịch sử sửa. Dữ liệu cũ của nhiều tài khoản: lấy bản cập nhật gần nhất |
| C4 | Bảng `SaleTarget` cũ và nút "KPI" v1 trong Heatmap | Chuyển dữ liệu `SaleTarget` sang KPI V2 (qua tính năng import), rồi gỡ v1 khỏi Dashboard V2 |

### Nhóm D — Dữ liệu cho các widget còn thiếu (chặn đợt 4)
| # | Câu hỏi | Đề xuất |
|---|---|---|
| D1 | POS/WMS có ghi **công đoạn và thời điểm vào công đoạn** "Mài lắp", "Vận chuyển" không? | Nếu có: dùng cho Order Aging. Nếu không: hoãn Order Aging như QĐ-13 |
| D2 | Trường nào phân biệt **kênh cửa hàng / online** (loại Site, nguồn đơn `IntegrateSource` / `EcomSource`)? | Đơn có `EcomSource`/`IntegrateSource` hoặc thuộc Site online = kênh online |
| D3 | Đơn có **mã chiến dịch** không? POS có mã phương thức thanh toán cho **Ví điện tử / COD / Trả góp** không? | Cần đội dev xác nhận; nếu chưa có thì hoãn 2 widget tương ứng |
| D4 | Lab: có dữ liệu **hạn cam kết** và **phôi hỏng** trên lệnh gia công không? | Nếu không: hoãn bảng Lab |

### Nhóm E — Môi trường (để xác minh lỗi "Đang tải")
| # | Câu hỏi |
|---|---|
| E1 | Môi trường trong ảnh chạy build nhánh nào của pos.gui / report.api? Các migration trong `report.api/Src/Infrastructure/Migrations/Pending/` đã được áp dụng ở đó chưa? |
| E2 | (Tùy chọn) Ảnh Network tab của `Executive/Kpis`, `Executive/Trend`, `BranchPerformance` (mã lỗi, thời gian) |
