# Báo cáo Đánh giá Chất lượng Cuối cùng (Final QC) Backend Dashboard V2

- **Repository kiểm toán:** `report.api`
- **Nhánh kiểm toán:** `qc/dashboard-v2` (nhánh tích hợp hợp nhất 34 commit từ tất cả các Wave 1, Wave 2a, Wave 2b, Wave 3a, Wave 3b).
- **Trạng thái kiểm toán:** READ-ONLY (không sửa đổi, không tạo commit, không checkout trong repository `report.api`).
- **Tài liệu đặc tả chuẩn:** `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/dashboard_hmk/docs/PRODUCT_SPEC_DASHBOARD.md` (v2.1).
- **Thời điểm kiểm toán:** 17/10/2026.

---

## 1. Tóm tắt điều hành (Executive Summary)

1. **Mức độ tuân thủ tổng thể:** Backend Dashboard V2 trên nhánh `qc/dashboard-v2` đạt độ hoàn thiện cao (>95% các yêu cầu nghiệp vụ cốt lõi), tái cấu trúc thành công từ cơ sở thực thu / DTT cũ sang mô hình **Sự kiện doanh thu chuẩn** (`ReportRevenueEvent`, `ReportRevenueEventLine`), giải quyết triệt để vấn đề lệch ngày, đơn đổi, VAT đóng băng và các bất biến kế toán.
2. **Kết quả kiểm thử tự thực thi:**
   - Build `Application.Tests.csproj`: **0 lỗi**, 474 cảnh báo (chủ yếu quy tắc phong cách StyleCop).
   - Test suite `DashboardV2|KpiV2`: **484 pass**, **0 fail**, **2 skip** (bỏ qua do yêu cầu PostgreSQL thật của OrderAging sync), thời gian chạy 7 giây.
   - Test suite `Golden` (spec §9): **15 pass**, **0 fail**, toàn bộ các giá trị khẳng định khớp chính xác 100% số liệu đặc tả mục 9.
3. **Phân quyền và Bảo mật dữ liệu:** Triển khai hoàn chỉnh bộ phân giải phạm vi đơn nhất (`DashboardV2AccessService`), kiểm soát truy cập trang, RLS chặn cứng 403 khi gọi ngoài chi nhánh được gán, bảo vệ dữ liệu STAFF chỉ thấy chính mình, và tầng che GMV tự động (`DashboardV2ResponsePostProcessor`) trả `null` kèm cờ `gmvHidden: true` khi thiếu quyền `dashboard-v2.gmv.read`.
4. **KPI V2 và Master Data:** Đã thoát khỏi cơ chế lưu theo tài khoản cá nhân; danh mục khu vực (`DashboardRegion`) và Traffic (`DashboardTrafficDaily`) đã chuyển thành dữ liệu dùng chung toàn công ty; Target Resolver thống nhất giải quyết mục tiêu cho mọi module.
5. **Rủi ro vận hành còn lại hàng đầu:**
   - **Rò rỉ traffic cá nhân trong Operational:** Tại `DashboardV2Service.Operational.cs:1091, 1162`, hai query `ConversionRate` và `RegionalBenchmark` vẫn còn điều kiện `x.AccountId == IdentityContext.Id`, khiến người dùng khác không thấy traffic do đồng nghiệp nhập.
   - **Chưa che GMV ở controller KPI V2:** `KpiV2Controller` chưa chạy qua `MaskGmv`, Manager có quyền `KpiRead` nhưng thiếu `gmv.read` vẫn có thể đọc được `ActualValue` và `TargetValue` của GMV qua `Evaluate` và `Get`.
   - **14 migration EF Core vẫn nằm ở `Migrations/Pending/`:** Cần kế hoạch chạy migration và backfill dữ liệu có kiểm soát khi triển khai production.

---

## 2. Tái kiểm tra toàn bộ phát hiện cũ (QC_A & QC_B)

### 2.1. Tái kiểm tra QC_A — Mô hình Doanh thu & Kế toán Core

| Mã phát hiện | Mức độ ban đầu | Trạng thái hiện tại | Bằng chứng (file:line trong `qc/dashboard-v2`) | Ghi chú |
|---|---|---|---|---|
| **E1** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueEventBuilder.cs:128-210` | Đơn đặt thành Đơn tạm ghi nhận E1 (+GMV, +GrossOrderCount, ngày tạo `SubmitAt`). |
| **E2** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueEventBuilder.cs:54-126` | Đơn hàng không từ đơn đặt hoàn thành ghi nhận E2 (+GMV, ngày tạo `CreateAt`). |
| **E3** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueEventBuilder.cs:64-67`, `ReportService.DashboardV2.RevenueEvents.cs:174-180` | Đơn hàng sinh từ đơn đặt (`PreOrderId != null`) bị loại hoàn toàn khỏi GMV; bảo toàn INV-10. |
| **E4** | Lớn | Đã sửa | `DashboardV2RevenueEventBuilder.cs:265-295` | Trả hàng ghi nhận E4 tại ngày phiếu trả, lấy đúng giá trị dòng gốc gồm VAT, không ship. |
| **E5** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueEventBuilder.cs:192-225` | Đơn đặt Kết thúc không ra đơn hàng ghi nhận E5 tại `CompleteAtEnd`, trừ phần giá trị chưa chuyển đổi. |
| **E6** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueEventBuilder.cs:192-225` | Đơn đặt Hủy sau Đơn tạm ghi nhận E6 tại `CancelAt`, trừ phần giá trị chưa chuyển đổi và giảm Volume. |
| **E7** | Lớn | Đã sửa | `DashboardV2RevenueEventBuilder.cs:59-63` | Đơn hàng hủy chưa hoàn thành bị loại bỏ, không sinh sự kiện. |
| **E8** | Nghiêm trọng | Đã sửa | `DashboardV2PaymentClassifier.cs:25-60`, `ReportService.DashboardV2.RevenueEvents.cs:360-395` | Phiếu thu độc lập với GMV, lấy theo ngày thu, loại trừ phí ship và chuyển cọc. |
| **BR-EVT-01** | Nhỏ | Đã sửa | `DashboardV2RevenueEventBuilder.cs:46-48`, `ReportService.DashboardV2.RevenueEvents.cs:174-205` | Đơn sinh từ đơn đặt không cộng dồn GMV; phần chênh lệch khi Kết thúc/Hủy đảo đúng phần dư. |
| **BR-EVT-02** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:325-330`, `Executive.cs:518-525` | Hỗ trợ mốc "Dữ liệu tính đến" (`RecognizedAt`); đơn tạo ngày D hoàn thành sau D được tính theo mốc chốt. |
| **BR-VAL-01** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueEventBuilder.cs:305-365` | Giá trị dòng = SL × đơn giá − giảm dòng − giảm cấp đơn phân bổ; giá gồm VAT nếu có (theo QĐ A1). |
| **BR-VAL-02** | Lớn | Đã sửa | `DashboardV2RevenueEventBuilder.cs:320-350` | Phân bổ giảm giá cấp đơn theo tỷ lệ doanh số dòng, dồn phần lẻ làm tròn vào dòng có giá trị lớn nhất. |
| **BR-VAL-03** | Lớn | Đã sửa | `DashboardV2RevenueEventBuilder.cs:98, 360-365` | Giá trị đơn = tổng các dòng hàng, không bao gồm phí ship. |
| **BR-VAL-04** | Lớn | Đã sửa | `DashboardV2RevenueEventBuilder.cs:265-295` | Giá trị trả tính theo đơn giá và giảm giá của dòng gốc, gồm VAT, không tính ship hoàn. |
| **BR-VAL-05** | Lớn | Đã sửa | `DashboardV2RevenueEventBuilder.cs:105, 340-355`, test `Tc06_VatIsFrozenPerLineAtCreationRate` | Thuế suất VAT đóng băng tại thời điểm tạo đơn theo từng dòng hàng; không dùng thuế suất hiện tại. |
| **M01** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:284-297` | GMV tính chuẩn xác từ E1 + E2, loại bỏ hoàn toàn đơn sinh từ đơn đặt. |
| **M01a** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:176-177, 299-301` | VAT của GMV và GMV trước VAT (`GmvBeforeVat = Gmv - Vat`) tính độc lập, không pha trộn tiền thu. |
| **M02g** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:180, 302-303` | Đơn hàng gộp = E1 order delta + E2 order delta (gồm cả Đơn tạm). |
| **M02** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:228-230` | Volume = M02g − Kết thúc (E5) − Hủy (E6). Không ép về 0. |
| **M03** | Lớn | Đã sửa | `DashboardV2Service.Executive.cs:530-545`, `ReportService.DashboardV2.FirstPurchase.cs:50-95` | Tính khách mới dựa trên ngày phát sinh đơn đầu tiên trong lịch sử, loại bỏ khách lẻ `KHACHLE`. |
| **M04** | Nghiêm trọng | Đã sửa | `DashboardV2PaymentClassifier.cs:25-60`, `Executive.cs:550-555` | Doanh thu thực thu lấy từ phiếu thu theo ngày thu thật, phân loại theo `PaymentTypeMapping`. |
| **M05a** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:183, 306` | Trả hàng E4 ghi nhận đúng giá trị dòng gốc. |
| **M05b** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:186, 307` | Đổi hàng từ đơn đặt E5 ghi nhận tại ngày bấm Kết thúc (`CompleteAtEnd`). |
| **M05c** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:189, 308` | Hủy đơn đặt E6 ghi nhận tại ngày hủy (`CancelAt`). |
| **M05** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:217-219` | Giá trị điều chỉnh `Adjustment = -(M05a + M05b + M05c) <= 0`. |
| **M06** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:220-222` | Doanh thu thuần `NetRevenue = M01 + M05`, bảo toàn giá trị âm (CN-B T10 = -1.630.000). |
| **M07** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:231-234` | Biên LN gộp `(NetRevenue - NetCost) / NetRevenue * 100`, trả `null` khi NetRevenue <= 0. |
| **M08** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:235-238` | AOV = `NetRevenue / OrderCount` (M06 / M02), trả `null` khi OrderCount <= 0. |
| **M09** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:239-242`, `Executive.cs:88` | UPT = `Units / GrossOrderCount` (M02g), trả `null` khi M02g = 0. Đã đưa vào thẻ Executive. |
| **M10** | Nghiêm trọng | Đã sửa | `DashboardV2DebtSnapshotBuilder.cs:20-80`, `Executive.cs:90-93` | Nợ treo lấy từ snapshot số dư công nợ cuối ngày của sổ `Debt`. |
| **M11** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:243-247`, `Executive.cs:98-101` | Tỷ trọng nguồn GMV: `PreOrderGmvShare` và `DirectGmvShare` trên thẻ Executive. |
| **M12** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:248-250`, `Executive.cs:94` | Tỷ lệ trả (giá trị) = `ReturnValue / Gmv * 100`. |
| **M13** | Lớn | Đã sửa | `DashboardV2RevenueCalculator.cs:251-254`, `Executive.cs:95` | Tỷ lệ trả (hóa đơn) = `ReturnedOrderCount / GrossOrderCount * 100`. |
| **M13b** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:255-257`, `Executive.cs:96` | Tỷ lệ đổi hàng đơn đặt = `EndedValue / Gmv * 100`. |
| **M13c** | Nghiêm trọng | Đã sửa | `DashboardV2RevenueCalculator.cs:258-260`, `Executive.cs:97` | Tỷ lệ hủy đơn đặt = `CancelledValue / Gmv * 100`. |
| **M16** | Lớn | Đã sửa | `DashboardV2FormulaCatalog.cs:375-385`, `Executive.cs:76` | % đạt mục tiêu = `Gmv / Target * 100`. Trả `null` khi chưa thiết lập mục tiêu. |
| **M17** | Lớn | Đã sửa | `DashboardV2FormulaCatalog.cs:165-175`, `Executive.cs:77-79` | Tăng trưởng % = `(current - previous) / previous * 100`. Trả `null` khi mẫu <= 0. |
| **BR-CMP-01** | Lớn | Đã sửa | `DashboardV2FormulaCatalog.cs:260-285` | Kỳ so sánh mặc định (`None`) = n ngày liền trước [S−n, S−1]. Hỗ trợ WoW, MoM, YoY. |
| **BR-CMP-04** | Lớn | Đã sửa | `DashboardV2FormulaCatalog.cs:165-175` | Mẫu số 0 hoặc âm trả `null` để giao diện hiển thị "—". |
| **BR-TGT-01** | Lớn | Đã sửa | `KpiTargetLoader.cs:20-60`, `Executive.cs:512, 584` | Nguồn duy nhất cho mọi module là KPI V2 "Đang áp dụng" thông qua Target Resolver. |
| **BR-TGT-02** | Lớn | Đã sửa | `KpiTargetEngine.cs:85-150`, `KpiTargetLoader.cs:70-120` | Mục tiêu theo phạm vi Company -> Region -> Site, tự động fallback rollup từ cấp con. |
| **BR-TGT-03** | Lớn | Đã sửa | `KpiTargetEngine.cs:35-70`, `DashboardV2RevenueCalculator.cs:332-351` | Hỗ trợ cả 2 mô hình: phân bổ theo loại ngày (data-store-kpi) và chia đều theo số ngày chu kỳ. |
| **BR-TGT-04** | Lớn | Đã sửa | `KpiTargetLoader.cs:40-75` | KPI Chiến dịch tự động ghi đè mục tiêu của các ngày thuộc chiến dịch. |
| **BR-TGT-05** | Lớn | Đã sửa | `DashboardV2FormulaCatalog.cs:375-385` | Không có KPI thì `Target = null` và `TargetCompletion = null` ("Chưa thiết lập mục tiêu"). |
| **FR-EX-07** | Lớn | Đã sửa | `DashboardV2Service.Executive.cs:280-337` | Bảng xếp hạng có đủ GMV, DTT, ContributionRate, DropRate, Target, TargetCompletion, ReturnRate. |
| **FR-EX-06 / BuildTrend** | Lớn | Đã sửa | `DashboardV2Service.Executive.cs:177-235` | Điểm cuối lũy kế DTT có VAT trùng khớp với thẻ DTT có VAT; lũy kế GMV khớp thẻ GMV. |

---

### 2.2. Tái kiểm tra QC_B — Vận hành, Sản phẩm, Nhân sự, KPI, Traffic, Heatmap, RLS & Cache

| Mã phát hiện | Mức độ ban đầu | Trạng thái hiện tại | Bằng chứng (file:line trong `qc/dashboard-v2`) | Ghi chú |
|---|---|---|---|---|
| **OP-01a..e** | Lớn/Nhỏ | Không áp dụng do quyết định PM | `DashboardV2Service.Operational.cs:700-725` | Hoãn Order Aging theo QĐ-13; trả block `Availability: Unavailable` do POS thiếu log công đoạn. |
| **OP-02a..c** | Nghiêm trọng/Lớn/Nhỏ | Đã sửa | `DashboardV2Service.Operational.cs:800-840` | Khung giờ cao điểm: chỉ kênh cửa hàng, 7 khung 2h (8–22h), GMV và đơn ngoài khung vào Meta, không random. |
| **OP-03a..b** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Operational.cs:845-880` | Nhân khẩu học: 4 nhóm tuổi (<25, 25-34, 35-49, >=50) + Chưa xác định, tổng GMV bảo toàn = M01. |
| **OP-04a..c** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Operational.cs:885-915` | Basket: 5 dải (<0.5, 0.5-1, 1-3, 3-5, >5), tổng số đơn bảo toàn = M02g. |
| **OP-05a..b** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Operational.cs:944-1007` | 6 nhóm thanh toán (CASH, TRANSFER, CARD, WALLET, COD, INSTALLMENT) theo mapping, tổng = M04. |
| **OP-06** | Nghiêm trọng | Đã sửa | `DashboardV2Service.Operational.cs:1009-1060` | Bảng chiến dịch đầy đủ GMV, DTT, số đơn, kèm dòng "Không có chiến dịch", tổng GMV = M01. |
| **OP-07a..e** | Nghiêm trọng/Lớn/Nhỏ | Sửa một phần | `DashboardV2Service.Operational.cs:1081-1150` | Radar 6 trục chuẩn, M18/M19 đúng định nghĩa; NHƯNG dòng 1091 vẫn lọc traffic theo `AccountId`. |
| **OP-08a..e** | Nghiêm trọng/Lớn/Nhỏ | Đã sửa | `DashboardV2Service.Operational.cs:920-943` | Anomaly phát hiện bằng cửa sổ MA/sigma mẫu 7 ngày trước, k=2, hỗ trợ đổi chỉ số DTT/Đơn/Trả hàng. |
| **OP-09a..c** | Nghiêm trọng/Lớn | Sửa một phần | `DashboardV2Service.Operational.cs:1154-1210` | M14 chuẩn theo cặp (chi nhánh, ngày) có traffic, đếm ngày thiếu; NHƯNG dòng 1162 lọc `AccountId`. |
| **OP-10a..d** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Operational.cs:740-747` | Thẻ RefundRate có đủ M12, M13, M13b, M13c và các giá trị khớp hoàn toàn khối Waterfall. |
| **OP-X1** | Nghiêm trọng | Đã sửa | `DashboardV2Service.Operational.cs:1185-1193` | Gỡ bỏ 100% dữ liệu mock / demo / số ngẫu nhiên trong toàn bộ module Vận hành. |
| **OP-X2** | Lớn | Đã sửa | `RevenueEventQueryExtensions.cs:160-200` | Bộ lọc đa chiều (StaffIds, Genders, BasketBuckets) đã được áp dụng vào các widget có chiều. |
| **OP-X3** | Lớn | Đã sửa | `DashboardV2InputAdminDto.cs:80-120` | Cho phép lọc khoảng 1 ngày (StartAt 00:00 - EndAt 23:59:59), giới hạn tối đa 3 năm. |
| **PR-01a..f** | Nghiêm trọng/Lớn/Nhỏ | Đã sửa | `DashboardV2Service.Product.cs:25-90, 730-800` | Top-5 tăng trưởng/suy giảm tính trên GMV dòng, so với kỳ liền trước, mẫu <= 0 trả "—", đủ tab chiều. |
| **PR-02a..b** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Product.cs:850-1040` | Phân tích 10 chiều trên GMV dòng, tổng các thành phần cùng cấp bảo toàn = M01. |
| **PR-03a** | Lớn | Đã sửa | `DashboardV2Service.Product.cs:1045-1099` | Treemap phân cấp 3 tầng (Ngành hàng -> Nhóm/Thương hiệu -> Sản phẩm) với rollup GMV chính xác. |
| **PR-04** | Lớn | Đã sửa | `DashboardV2Service.Product.cs:1101-1123` | Ma trận phôi SPH x CYL bước 0.25D, tổng sản lượng tròng có độ + chưa rõ độ = tổng tròng kính. |
| **PR-05** | Lớn | Đã sửa | `DashboardV2Service.Product.cs:1125-1147` | Cơ cấu thương hiệu phân phối cho gọng và kính mát. |
| **PR-06a..c** | Lớn | Đã sửa | `DashboardV2Service.Product.cs:1149-1230` | Top sản phẩm cảnh báo tồn an toàn SS/ROP theo công thức QĐ-15, tồn hiện tại lấy snapshot chi nhánh. |
| **PR-F1..F3** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Product.cs:696-730` | Lọc ngành/thương hiệu, BR-DIM-01 đếm đơn có ít nhất 1 dòng thỏa mãn, ép phạm vi site hợp lệ. |
| **HR-01a..f** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Personnel.cs:20-150` | Xếp hạng người bán theo GMV, có dòng "Chưa gán", cờ Top-3, AOV M08, góc nhìn cá nhân STAFF self view. |
| **HR-02a..b** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2Service.Personnel.cs:155-210` | Bảng điểm nhân viên, không trả dữ liệu demo khi danh sách rỗng. |
| **HR-03** | Nghiêm trọng | Không áp dụng do quyết định PM | `DashboardV2Service.Personnel.cs:280-295` | Bảng KTV khúc xạ đánh dấu Obsolete / rỗng do POS không có dữ liệu đo khám (QĐ-08). |
| **HR-04** | Lớn | Không áp dụng do quyết định PM | `DashboardV2Service.Personnel.cs:296-310` | Bảng Lab gia công đánh dấu Obsolete / rỗng do POS không có dữ liệu hư hao/hạn cam kết (QĐ-08). |
| **HR-F1** | Lớn | Đã sửa | `DashboardV2Service.Personnel.cs:220-250` | Lọc Nhân sự tuân thủ các chiều hợp lệ. |
| **KPI-01..05** | Nghiêm trọng/Lớn | Đã sửa | `KpiPlan.cs`, `KpiPlanScope.cs`, `KpiPlanVersion.cs` | Mô hình KPI V2 toàn diện: Scope Company/Region/Site, metric GMV/DTT/Khác, chu kỳ, versioning, status. |
| **KPI-06** | Nhỏ | Đã sửa | `KpiV2Service.Conflict.cs:40-140` | Xử lý xung đột BR-KPI-02 với 3 chính sách (Overwrite, Clip, Reject). |
| **KPI-08** | Nghiêm trọng | Đã sửa | `KpiTargetEngine.cs:35-70` | Phân bổ mục tiêu theo loại ngày (Trong tuần / Cuối tuần / Lễ) theo chuẩn `data-store-kpi.md`. |
| **KPI-09** | Lớn | Đã sửa | `KpiTargetLoader.cs:40-75` | Chiến dịch ghi đè mục tiêu nền (BR-TGT-04). |
| **KPI-10** | Lớn | Đã sửa | `KpiTargetEngine.cs:90-140` | Rollup mục tiêu tự động từ cấp chi nhánh lên khu vực và toàn công ty (BR-TGT-02). |
| **KPI-11** | Lớn | Đã sửa | `DashboardV2FormulaCatalog.cs:375-385` | Không có KPI trả `null` thay vì 0%. |
| **KPI-12** | Nghiêm trọng | Đã sửa | `KpiTargetLoader.cs:20-60` | Toàn bộ Dashboard V2 lấy KPI từ bảng KPI V2 "Đang áp dụng". |
| **KPI-13** | Nghiêm trọng | Đã sửa | `KpiPlan.cs:10-35` | KPI V2 lưu dùng chung toàn công ty, không còn theo `AccountId` của người tạo. |
| **KPI-14** | Nghiêm trọng | Đã sửa | `KpiV2Controller.cs:140-150` | Quyền ghi KPI bị khóa chặt cho BOD (`dashboard-v2.kpi.write` trên role BOD). |
| **KPI-15** | Lớn | Đã sửa | `KpiV2Service.Bulk.cs:20-130` | Hỗ trợ cập nhật hàng loạt mục tiêu KPI theo giá trị tuyệt đối hoặc % điều chỉnh. |
| **KPI-16** | Lớn | Đã sửa | `DashboardImportService.cs:76-100`, `KpiImport.cs` | Import mục tiêu Excel hỗ trợ cả mẫu chuẩn và mẫu 61 cửa hàng `data-store-kpi.md`. |
| **KPI-17** | Lớn | Đã sửa | `DashboardV2LegacyEndpointFilter.cs:15-35`, `KpiV2SaleTargetMigration.cs` | Chặn quyền BOD trên SaleTarget cũ và cung cấp endpoint chuyển đổi sang KPI V2. |
| **KPI-18** | Lớn | Đã sửa | `KpiPlan.cs:28-32` | Ghi nhận audit người tạo, người sửa, nguồn tạo (Manual / Excel / Migration). |
| **KPI-19** | Nhỏ | Đã sửa | `KpiV2EvaluationService.cs:80-120` | Thẻ thống kê tóm tắt số KPI đạt/tổng số trên trang quản trị KPI. |
| **TR-01..08** | Nghiêm trọng/Lớn/Nhỏ | Đã sửa | `ReportService.DashboardV2.Traffic.cs`, `DashboardImportService.cs` | Traffic dùng chung toàn công ty, kiểm tra ngày tương lai, import Excel, lịch sử sửa, phân quyền MANAGER theo site. |
| **HM-01..11** | Nghiêm trọng/Lớn | Đã sửa | `DashboardV2HeatmapBuilder.cs`, `DashboardV2Service.Heatmap.cs` | Heatmap V2 đầy đủ bucket ngày/tuần/tháng, tuần chuẩn ISO, GMV dòng, Target Resolver, thang màu, toggle khu vực, BOD-only. |
| **RLS-01** | Nghiêm trọng | Đã sửa | `DashboardV2PermissionCodes.cs`, `DashboardV2Access.cs` | Xác định vai trò chuẩn BOD / MANAGER / STAFF từ token Identity. |
| **RLS-02** | Nghiêm trọng | Đã sửa | `DashboardV2Access.cs:135-180` | RLS tầng dữ liệu: 403 khi gọi ngoài cửa hàng gán; không truyền chi nhánh thì tự động áp danh sách được gán. |
| **RLS-03** | Nghiêm trọng | Đã sửa | `DashboardV2AccessPolicy.CanView`, `DashboardV2Access.Require` | Phân quyền từng trang: Tổng quan/Heatmap chỉ BOD; Vận hành/Sản phẩm BOD+MANAGER; Nhân sự cả STAFF. |
| **RLS-04** | Nghiêm trọng | Đã sửa | `KpiV2Controller.cs:140-150` | Ghi KPI chỉ BOD có scope `dashboard-v2.kpi.write`. |
| **RLS-05** | Nghiêm trọng | Đã sửa | `DashboardV2ResponsePostProcessor.cs:115-135` | STAFF chỉ thấy dữ liệu cá nhân của mình trên tab Nhân sự (`KeepOwnStaff`). |
| **RLS-06** | Nghiêm trọng | Đã sửa | `DashboardV2ResponsePostProcessor.cs:25-110` | Server-side GMV masking: tự động null hóa các trường GMV và bật `gmvHidden: true` khi thiếu quyền. |
| **RLS-07** | Lớn | Đã sửa | `DashboardV2LegacyEndpointFilter.cs` | Bộ lọc ủy quyền toàn cục bảo vệ các endpoint cũ (`/Admin/SaleTarget`, `/Admin/Report/BranchPerformanceHeatmap`). |
| **RLS-08** | Lớn | Đã sửa | `DashboardV2PermissionCodes.cs:12`, `DashboardV2RbacTests.cs` | Khớp đúng mã quyền Identity đang phát hành (`manager.dashboard.read`). |
| **FLT-01..07** | Lớn/Nhỏ | Đã sửa | `DashboardV2InputAdminDto.cs`, `DashboardV2BlockMetaDto.cs` | Xử lý ngày hợp lệ, cascade khu vực/chi nhánh, áp bộ lọc đa chiều, gắn cờ `NotAppliedFilters`, tuần ISO, không random. |
| **CA-01..03** | Nhỏ | Đã sửa | `DashboardV2CacheKey.cs`, `DashboardV2CacheService.cs` | Cache key bao gồm đầy đủ mọi chiều lọc, AccountId, chữ ký scope RLS và GMV permission; Invalidate sau mỗi lần ghi. |

---

## 3. Ma trận tuân thủ đặc tả (Spec Conformance Matrix)

### 3.1. Chỉ số đo lường (Metrics M01–M19)

| Mã đặc tả | Kết quả | Bằng chứng (file:line trong `qc/dashboard-v2`) | Ghi chú chi tiết |
|---|---|---|---|
| **M01** | Đạt | `DashboardV2RevenueCalculator.cs:284-297` | GMV = E1 (Đơn đặt thành Đơn tạm) + E2 (Đơn hàng trực tiếp hoàn thành). Loại trừ hoàn toàn đơn sinh từ đơn đặt (E3). |
| **M01a** | Đạt | `DashboardV2RevenueCalculator.cs:176-177, 299-301` | VAT dòng đóng băng tại lúc tạo đơn; GMV trước VAT = `Gmv - Vat`. Khớp TC-06. |
| **M02g** | Đạt | `DashboardV2RevenueCalculator.cs:180, 302-303` | Đơn hàng gộp = tổng số đơn E1 + E2 phát sinh. |
| **M02** | Đạt | `DashboardV2RevenueCalculator.cs:228-230` | Volume = M02g − Kết thúc (E5) − Hủy (E6). Bảo toàn đơn vị. |
| **M03** | Đạt | `Executive.cs:530-545`, `FirstPurchase.cs:50-95` | Khách hàng mới = đơn đầu tiên trong lịch sử mua hàng, loại trừ khách vãng lai `KHACHLE`. |
| **M04** | Đạt | `DashboardV2PaymentClassifier.cs:25-60`, `Executive.cs:550-555` | Doanh thu thực thu dựa trên phiếu thu thực tế theo ngày thu, phân loại theo cấu hình `PaymentTypeMapping`. |
| **M05a** | Đạt | `DashboardV2RevenueCalculator.cs:183, 306` | Trả hàng (E4) tính theo giá trị dòng gốc gồm VAT, không phí ship. |
| **M05b** | Đạt | `DashboardV2RevenueCalculator.cs:186, 307` | Đổi hàng từ đơn đặt (E5, Kết thúc không ra đơn) trừ phần giá trị chưa chuyển đổi tại `CompleteAtEnd`. |
| **M05c** | Đạt | `DashboardV2RevenueCalculator.cs:189, 308` | Hủy đơn đặt sau Đơn tạm (E6) trừ phần giá trị chưa chuyển đổi tại `CancelAt`. |
| **M05** | Đạt | `DashboardV2RevenueCalculator.cs:217-219` | Giá trị điều chỉnh `Adjustment = -(M05a + M05b + M05c) <= 0`. |
| **M06** | Đạt | `DashboardV2RevenueCalculator.cs:220-222` | Doanh thu thuần `NetRevenue = M01 + M05`. Giữ nguyên giá trị âm khi điều chỉnh lớn hơn GMV (BR-EVT-03). |
| **M07** | Đạt | `DashboardV2RevenueCalculator.cs:231-234` | Biên LN gộp = `(NetRevenue - NetCost) / NetRevenue * 100`. Trả `null` khi NetRevenue <= 0. |
| **M08** | Đạt | `DashboardV2RevenueCalculator.cs:235-238` | AOV = `NetRevenue / OrderCount` (M06 / M02). Trả `null` khi OrderCount <= 0. |
| **M09** | Đạt | `DashboardV2RevenueCalculator.cs:239-242`, `Executive.cs:88` | UPT = `Units / GrossOrderCount` (M02g). Trả `null` khi M02g = 0. |
| **M10** | Đạt | `DashboardV2DebtSnapshotBuilder.cs:20-80`, `Executive.cs:90-93` | Nợ treo = tổng số dư công nợ khách hàng dương cuối ngày từ snapshot sổ `Debt`. |
| **M11** | Đạt | `DashboardV2RevenueCalculator.cs:243-247`, `Executive.cs:98-101` | Tỷ trọng nguồn GMV: `PreOrderGmvShare` (đơn đặt) và `DirectGmvShare` (trực tiếp). |
| **M12** | Đạt | `DashboardV2RevenueCalculator.cs:248-250`, `Executive.cs:94` | Tỷ lệ trả (giá trị) = `ReturnValue / Gmv * 100`. |
| **M13** | Đạt | `DashboardV2RevenueCalculator.cs:251-254`, `Executive.cs:95` | Tỷ lệ trả (hóa đơn) = `ReturnedOrderCount / GrossOrderCount * 100`. |
| **M13b** | Đạt | `DashboardV2RevenueCalculator.cs:255-257`, `Executive.cs:96` | Tỷ lệ đổi hàng đơn đặt = `EndedValue / Gmv * 100`. |
| **M13c** | Đạt | `DashboardV2RevenueCalculator.cs:258-260`, `Executive.cs:97` | Tỷ lệ hủy đơn đặt = `CancelledValue / Gmv * 100`. |
| **M14** | Một phần | `Operational.cs:1154-1210`, `ConversionTests.cs:15-80` | Logic M14 chuẩn (chỉ kênh cửa hàng, cặp có traffic, đếm ngày thiếu); nhưng query bị chặn bởi `AccountId` (NEW-01). |
| **M16** | Đạt | `DashboardV2FormulaCatalog.cs:375-385`, `Executive.cs:76` | % đạt mục tiêu = `Gmv / Target * 100`. Trả `null` khi chưa có KPI. |
| **M17** | Đạt | `DashboardV2FormulaCatalog.cs:165-175`, `Executive.cs:77-79` | Tăng trưởng % = `(current - previous) / previous * 100`. Trả `null` khi kỳ trước <= 0. |
| **M18** | Một phần | `Operational.cs:1106-1130` | Tỷ lệ khách quay lại tính chuẩn trên sự kiện; bị ảnh hưởng radar benchmark do traffic leak (NEW-01). |
| **M19** | Đạt | `Operational.cs:1111-1123` | Điểm hài lòng tính trung bình đánh giá từ `ReportRating` theo thang nguồn. |

---

### 3.2. Quy tắc nghiệp vụ (Business Rules BR)

| Mã đặc tả | Kết quả | Bằng chứng (file:line trong `qc/dashboard-v2`) | Ghi chú chi tiết |
|---|---|---|---|
| **BR-EVT-01** | Đạt | `RevenueEventBuilder.cs:46-48, 222-260` | Đơn hàng từ đơn đặt không sinh GMV mới; chênh lệch khi Kết thúc/Hủy đảo đúng phần dư. |
| **BR-EVT-02** | Đạt | `RevenueCalculator.cs:325-330`, `Executive.cs:518-525` | Hỗ trợ mốc "Dữ liệu tính đến" (`RecognizedAt`); đơn tạo ngày D hoàn thành sau D được tính theo mốc chốt. |
| **BR-EVT-03** | Đạt | `RevenueCalculator.cs:220-222`, test `Tc03_ByBranch` | Điều chỉnh rơi kỳ khác; DTT có thể âm (CN-B T10 = -1.630.000); không ép về 0. |
| **BR-EVT-04** | Đạt | `RevenueEventBuilder.cs:59-63` | Đơn hàng hủy chưa hoàn thành bị loại bỏ, không sinh sự kiện. |
| **BR-EVT-05** | Đạt | `DashboardV2PaymentClassifier.cs:25-60` | Tiền thu độc lập GMV, ghi nhận theo ngày thực thu. |
| **BR-EVT-06** | Đạt | `DashboardV2PaymentClassifier.cs:45-55`, `Appsetting.cs:25` | Chuyển cọc đơn đặt sang đơn hàng không tính là tiền thu mới (`DepositTransfer`). |
| **BR-VAL-01** | Đạt | `RevenueEventBuilder.cs:305-365` | Giá trị dòng = SL × đơn giá − giảm dòng − giảm cấp đơn phân bổ; giá gồm VAT nếu có. |
| **BR-VAL-02** | Đạt | `RevenueEventBuilder.cs:320-350` | Phân bổ giảm giá cấp đơn theo tỷ lệ doanh số dòng, dồn lẻ vào dòng lớn nhất. |
| **BR-VAL-03** | Đạt | `RevenueEventBuilder.cs:98, 360-365` | Giá trị đơn = tổng các dòng hàng, không gồm phí ship. |
| **BR-VAL-04** | Đạt | `RevenueEventBuilder.cs:265-295` | Giá trị trả tính theo đơn giá và giảm giá của dòng gốc, gồm VAT, không ship hoàn. |
| **BR-VAL-05** | Đạt | `RevenueEventBuilder.cs:105, 340-355` | Thuế suất VAT đóng băng tại thời điểm tạo đơn theo từng dòng hàng. |
| **BR-CMP-01** | Đạt | `FormulaCatalog.cs:260-285` | Kỳ so sánh mặc định = n ngày liền trước [S−n, S−1]. Hỗ trợ WoW, MoM, YoY. |
| **BR-CMP-02** | Đạt | `Executive.cs:105-161`, `ExecutivePreviousPeriodV2Dto` | Tăng trưởng tổng độc lập chu kỳ, trả khối kỳ trước riêng biệt. |
| **BR-CMP-03** | Đạt | Giao diện frontend (`pos.gui`) | Tăng trưởng bucket so với bucket liền trước được tính toán ở FE. |
| **BR-CMP-04** | Đạt | `FormulaCatalog.cs:165-175` | Mẫu số so sánh 0 hoặc âm trả `null` ("—"). |
| **BR-CMP-05..07** | Đạt | Giao diện frontend (`pos.gui`) | Quy tắc hiển thị mũi tên, màu sắc, điểm % thuộc trách nhiệm FE. |
| **BR-TGT-01** | Đạt | `KpiTargetLoader.cs:20-60`, `Executive.cs:512` | Nguồn mục tiêu duy nhất là KPI V2 "Đang áp dụng". |
| **BR-TGT-02** | Đạt | `KpiTargetEngine.cs:85-150`, `KpiTargetLoader.cs:70` | Mục tiêu theo phạm vi Company -> Region -> Site, tự động fallback rollup từ con. |
| **BR-TGT-03** | Đạt | `KpiTargetEngine.cs:35-70` | Phân bổ mục tiêu theo loại ngày thực (Trong tuần / Cuối tuần / Lễ) hoặc số ngày chu kỳ. |
| **BR-TGT-04** | Đạt | `KpiTargetLoader.cs:40-75` | KPI Chiến dịch ghi đè mục tiêu nền trong thời gian chiến dịch. |
| **BR-TGT-05** | Đạt | `FormulaCatalog.cs:375-385` | Không có KPI trả `Target = null` và `TargetCompletion = null` ("Chưa thiết lập"). |
| **BR-TGT-06** | Đạt | Giao diện frontend (`pos.gui`) | Nhãn lũy kế theo chu kỳ chọn thuộc trách nhiệm FE. |
| **BR-TGT-07** | Đạt | `DashboardV2ResponsePostProcessor.cs:72-74` | Che mục tiêu tuyệt đối (`Target`, `CumulativeTarget`) khi thiếu quyền GMV để chống suy diễn GMV. |
| **BR-DIM-01** | Đạt | `RevenueLineFilter.cs:30-80`, test `Tc10` | Bộ lọc đa chiều: đếm đơn có ít nhất 1 dòng hàng khớp điều kiện. |
| **BR-DIM-02** | Đạt | `DashboardV2Service.Product.cs:696-730` | Phân tích sản phẩm hoàn toàn trên cơ sở dòng GMV (`ReportRevenueEventLine`). |
| **BR-MD-01** | Đạt | `DashboardRegion.cs`, `DashboardRegionService.cs` | Danh mục khu vực dùng chung toàn công ty (5 khu vực) do BOD quản lý. |
| **BR-MD-02** | Đạt | `DashboardTrafficDaily.cs`, `Traffic.cs` | Lưu trữ Traffic dùng chung toàn công ty, không chia theo tài khoản người nhập. |
| **BR-MD-03** | Đạt | `DashboardTrafficHistory.cs`, `Traffic.cs:65-110` | Lưu vết đầy đủ lịch sử sửa Traffic (giá trị cũ, giá trị mới, người sửa, nguồn). |
| **BR-MD-04** | Đạt | `DashboardImportService.cs`, `KpiImport.cs`, `TrafficImport.cs` | Nhập và import Excel cho KPI và Traffic với preview token và validation nghiêm ngặt. |
| **BR-DATA-01** | Đạt | `Operational.cs`, `Personnel.cs`, `Product.cs` | Không trả dữ liệu mock, demo, ngẫu nhiên; khi thiếu dữ liệu trả rỗng hoặc `Unavailable`. |
| **BR-ROLE-01** | Đạt | `DashboardV2PermissionCodes.cs`, `DashboardV2Access.cs` | Xác định vai trò chuẩn BOD / MANAGER / STAFF từ token Identity. |
| **BR-ROLE-02** | Đạt | `DashboardV2Access.cs:135-180` | RLS tầng dữ liệu: 403 khi gọi ngoài cửa hàng gán; không truyền chi nhánh thì tự động áp danh sách được gán. |
| **BR-ROLE-03** | Đạt | `DashboardV2ResponsePostProcessor.cs:25-110` | Server-side GMV masking: tự động null hóa các trường GMV và bật `gmvHidden: true` khi thiếu quyền. |
| **BR-ROLE-04** | Đạt | `DashboardV2LegacyEndpointFilter.cs` | Mọi lối vào (kể cả endpoint cũ SaleTarget, Heatmap v1) đều tuân thủ cùng quy tắc phân quyền. |

---

### 3.3. Các bất biến dữ liệu (Invariants INV-01–INV-12)

| Mã đặc tả | Kết quả | Bằng chứng (file:line trong `qc/dashboard-v2`) | Ghi chú chi tiết |
|---|---|---|---|
| **INV-01** | Đạt | `RevenueCalculator.cs:220-222`, test `InvariantsHoldOnTheGoldenDataset...` | M06 = M01 + M05. Luôn thỏa mãn trên mọi kỳ và phạm vi. |
| **INV-02** | Đạt | `RevenueCalculator.cs:217-219`, test `InvariantsHoldOnTheGoldenDataset...` | M05 <= 0 và M05 = −(M05a + M05b + M05c). |
| **INV-03** | Đạt | `RevenueCalculator.cs:93-110`, test `Tc03_ByBranch` | Tổng theo chi nhánh = tổng khu vực = tổng toàn hệ thống. |
| **INV-04** | Đạt | `RevenueCalculator.cs:296-298`, test `InvariantsHoldOnTheGoldenDataset...` | M01 = Đơn đặt (E1) + Đơn hàng trực tiếp (E2). |
| **INV-05** | Đạt | `Product.cs:770-800`, test `Tc10...`, test `Inv09And05...` | Tổng GMV theo ngành hàng / thương hiệu cùng cấp = M01. |
| **INV-06** | Đạt | `RevenueCalculator.cs:235-238`, test `InvariantsHoldOnTheGoldenDataset...` | M08 × M02 = M06 khi M02 > 0. |
| **INV-07** | Đạt | `RevenueCalculator.cs:176-177`, test `InvariantsHoldOnTheGoldenDataset...` | VAT + GMV trước VAT = M01. |
| **INV-08** | Đạt | `Executive.cs:50-102, 177-235, 280-337`, test `Tc08_Waterfall` | Waterfall = thẻ KPI = lũy kế cuối kỳ = dòng tổng xếp hạng. |
| **INV-09** | Đạt | `Personnel.cs:30-75`, test `Inv09And11_LeaderboardWithUnassignedRow...` | Tổng GMV theo nhân viên = M01 (nhờ có dòng "Chưa gán người bán"). |
| **INV-10** | Đạt | `RevenueEventBuilder.cs:64-67`, test `Inv10_NoSaleOrderGeneratedFromAPreOrder...` | Không có đơn hàng nào sinh từ đơn đặt đóng góp vào M01/M02g. |
| **INV-11** | Đạt | `Operational.cs:845-915`, test `InvariantsHoldOnRandomGeneratedData` | Tổng các phân khúc giỏ hàng = M02g; tổng nhân khẩu học = M01; tổng thanh toán = M04. |
| **INV-12** | Đạt | `DashboardV2CacheKey.cs:30-75`, `DashboardV2FormulaCatalog.cs` | Cùng bộ lọc K, P và cùng mốc dữ liệu cho ra kết quả xác định 100% (không dùng Random). |

---

### 3.4. Phần Backend của các yêu cầu chức năng (FR-EX, FR-OP, FR-PR, FR-HR, FR-KPI, FR-IMP)

| Mã đặc tả | Kết quả | Bằng chứng (file:line trong `qc/dashboard-v2`) | Ghi chú chi tiết |
|---|---|---|---|
| **FR-EX-01..05** | Đạt | `DashboardV2Service.Executive.cs:510-600` | 5 thẻ KPI điều hành (GMV, Volume, DTT, Dòng tiền, Mục tiêu & Tăng trưởng) trả đúng DTO, có dataAsOf. |
| **FR-EX-06** | Đạt | `DashboardV2Service.Executive.cs:177-235, 675-685` | Biểu đồ xu hướng: GMV, DTT, NetRevenue, Lũy kế, Mục tiêu lũy kế theo ngày. |
| **FR-EX-07** | Đạt | `DashboardV2Service.Executive.cs:280-360, 610-630` | Bảng xếp hạng chi nhánh và khu vực với đầy đủ tỷ trọng, tỷ lệ trả, % đạt mục tiêu. |
| **FR-EX-08** | Đạt | `DashboardV2Service.Heatmap.cs:10-70`, `DashboardV2HeatmapBuilder.cs` | Heatmap ma trận chi nhánh: bucket ngày/tuần/tháng, GMV, Target, Traffic, Conversion, thang màu. |
| **FR-EX-09** | Đạt | `DashboardV2Service.Executive.cs:105-161, 600-610` | Tóm tắt kỳ trước: trả đầy đủ các chỉ số kỳ trước độc lập. |
| **FR-OP-01** | Hoãn | `DashboardV2Service.Operational.cs:700-725` | Hoãn theo QĐ-13; trả Unavailable do POS thiếu log công đoạn mài lắp / vận chuyển. |
| **FR-OP-02** | Đạt | `DashboardV2Service.Operational.cs:800-840` | Khung giờ cao điểm: 7 khung 2 giờ, chỉ kênh cửa hàng, meta ghi đơn ngoài khung. |
| **FR-OP-03** | Đạt | `DashboardV2Service.Operational.cs:845-880` | Nhân khẩu học: 4 nhóm tuổi + Chưa xác định, nam/nữ, tổng GMV = M01. |
| **FR-OP-04** | Đạt | `DashboardV2Service.Operational.cs:885-915` | Phân khúc giỏ hàng: 5 dải giá trị đơn, tổng số đơn = M02g. |
| **FR-OP-05** | Đạt | `DashboardV2Service.Operational.cs:944-1007` | Hình thức thanh toán: 6 nhóm chuẩn, tổng = M04, cảnh báo mã chưa ánh xạ. |
| **FR-OP-06** | Đạt | `DashboardV2Service.Operational.cs:1009-1060` | Hiệu quả chiến dịch: GMV, DTT, số đơn theo chiến dịch + dòng "Không có chiến dịch". |
| **FR-OP-07** | Một phần | `DashboardV2Service.Operational.cs:1081-1150` | Radar benchmark 6 trục; bị lỗi traffic leak do filter AccountId (NEW-01). |
| **FR-OP-08** | Đạt | `DashboardV2Service.Operational.cs:920-943` | Phát hiện bất thường: MA 7 ngày, ngưỡng k=2, hỗ trợ chọn metric DTT / Số đơn / Trả hàng. |
| **FR-OP-09** | Một phần | `DashboardV2Service.Operational.cs:1154-1210` | Tỷ lệ chuyển đổi M14 theo cặp (chi nhánh, ngày) có traffic; bị lỗi traffic leak do filter AccountId (NEW-01). |
| **FR-OP-10** | Đạt | `DashboardV2Service.Operational.cs:740-747` | Tỷ lệ trả hàng & điều chỉnh: M12, M13, M13b, M13c khớp hoàn toàn Waterfall. |
| **FR-PR-01** | Đạt | `DashboardV2Service.Product.cs:25-90, 730-800` | Top 5 tăng trưởng / suy giảm theo GMV dòng, so với kỳ liền trước. |
| **FR-PR-02** | Đạt | `DashboardV2Service.Product.cs:850-1040` | Phân tích 10 chiều trên GMV dòng, tổng bảo toàn = M01. |
| **FR-PR-03** | Đạt | `DashboardV2Service.Product.cs:1045-1099` | Treemap phân cấp 3 tầng (Ngành hàng -> Nhóm/Thương hiệu -> Sản phẩm). |
| **FR-PR-04** | Đạt | `DashboardV2Service.Product.cs:1101-1123` | Ma trận độ cận/loạn SPH x CYL bước 0.25D. |
| **FR-PR-05** | Đạt | `DashboardV2Service.Product.cs:1125-1147` | Cơ cấu thương hiệu phân phối gọng / kính mát. |
| **FR-PR-06** | Đạt | `DashboardV2Service.Product.cs:1149-1230` | Top sản phẩm cảnh báo tồn kho an toàn SS/ROP theo QĐ-15. |
| **FR-HR-01** | Đạt | `DashboardV2Service.Personnel.cs:20-150` | Xếp hạng người bán theo GMV, có dòng "Chưa gán", cờ Top-3, STAFF self view. |
| **FR-HR-02** | Đạt | `DashboardV2Service.Personnel.cs:155-210` | Thẻ điểm nhân viên (Scorecards), gỡ demo data khi rỗng. |
| **FR-HR-03** | Hoãn | `DashboardV2Service.Personnel.cs:280-295` | KTV khúc xạ hoãn theo QĐ-08 do POS thiếu log đo khám. |
| **FR-HR-04** | Hoãn | `DashboardV2Service.Personnel.cs:296-310` | Đội ngũ Lab hoãn theo QĐ-08 do POS thiếu dữ liệu hạn cam kết/phôi hỏng. |
| **FR-KPI-01** | Đạt | `KpiV2Controller.cs:32-37`, `KpiV2Service.cs:55-120` | Danh sách KPI, phân trang, lọc theo phạm vi/chu kỳ/trạng thái, thẻ tóm tắt Summary. |
| **FR-KPI-02** | Đạt | `KpiV2Controller.cs:39-125`, `KpiV2Service.cs` | Tạo, sửa, kích hoạt, kết thúc, lưu trữ, đánh giá actual KPI V2. |
| **FR-KPI-03** | Đạt | `KpiV2Controller.cs:119-125`, `KpiV2Service.cs:215-235` | Quản lý lịch sử phiên bản của KPI (`GetVersions`). |
| **FR-KPI-04** | Đạt | `KpiV2Controller.cs:97-104`, `KpiV2Service.Conflict.cs` | Xử lý xung đột mục tiêu khi kích hoạt với 3 chính sách (Overwrite, Clip, Reject). |
| **FR-IMP-01** | Đạt | `DashboardImportController.cs:30-48`, `TrafficImport.cs` | Import Excel Traffic: template, preview token, confirm, error file, history. |
| **FR-IMP-02** | Đạt | `DashboardImportController.cs:50-70`, `KpiImport.cs` | Import Excel KPI: hỗ trợ cả mẫu chuẩn và mẫu 61 cửa hàng `data-store-kpi.md`. |

---

## 4. Bộ dữ liệu kiểm thử chuẩn (Golden Dataset — Spec §9)

Bộ kiểm thử `DashboardV2GoldenDatasetTests.cs` nạp toàn bộ 11 đơn hàng chuẩn (O1–O11) của mục 9 chạy qua logic thật `DashboardV2RevenueEventBuilder` -> `DashboardV2RevenueCalculator` -> `DashboardV2ExecutiveCalculator`.

| Ca kiểm thử (TC) | Tên test thực thi trong code | Được kiểm thử? | Giá trị code kiểm tra | Giá trị đặc tả §9 | Khớp chính xác? |
|---|---|---|---|---|---|
| **TC-01** | `Tc01_September_WholeSystem` | Có | GMV: 12.262.400, VAT: 1.002.400, GMV trước VAT: 11.260.000, Đơn gộp: 8, Trả hàng: 194.400, DTT: 12.068.000, Volume: 8, AOV: 1.508.500, Units: 12, UPT: 1.5, Tỷ lệ trả GT: 1.6%, Tỷ lệ trả HĐ: 12.5%, PreOrder GMV: 6.480.000, Direct GMV: 5.782.400 | Giống hệt 100% | **Khớp chính xác** |
| **TC-02** | `Tc02_October_WholeSystem` | Có | GMV: 5.990.000, Trả: 2.200.000, Kết thúc: 1.080.000, Hủy: 1.080.000, Điều chỉnh: -4.360.000, DTT: 1.630.000, Volume: 1, AOV: 1.630.000, Units: 9, UPT: 3.0, Thu tiền: 6.010.000, Tỷ lệ trả GT: 36.7%, Đổi: 18.0%, Hủy: 18.0%, Trả HĐ: 33.3% | Giống hệt 100% | **Khớp chính xác** |
| **TC-03** | `Tc03_ByBranch` | Có | CN-A T9: GMV 5.722.400, DTT 5.528.000, Đơn 4, AOV 1.382.000<br>CN-B T9: GMV 6.540.000, DTT 6.540.000, Đơn 4, AOV 1.635.000<br>CN-A T10: GMV 4.340.000, DTT 3.260.000, Đơn 1, AOV 3.260.000<br>CN-B T10: GMV 1.650.000, DTT -1.630.000 (âm!), Đơn 0, AOV null ("—")<br>Xếp hạng T9: CN-B #1 (53.3% GMV, 109% MT), CN-A #2 (46.7% GMV, 95% MT) | Giống hệt 100% | **Khớp chính xác** |
| **TC-04** | `Tc04_ByStaff_AdjustmentsFollowTheOriginalSeller` | Có | GMV T9: NV3 6.540.000 (#1), NV1 3.260.000 (#2), NV2 2.462.400 (#3)<br>GMV T10: NV2 4.340.000 (#1), NV3 1.650.000 (#2), NV1 0 (#3)<br>Điều chỉnh T10 gán người bán đơn gốc: NV3 -3.280.000, NV2 -1.080.000 | Giống hệt 100% | **Khớp chính xác** |
| **TC-05** | `Tc05_DataAsOf_BackdatedGmvGrowsWhenOrderCompletes` | Có | Trước 02/10 (O10 chưa hoàn thành): GMV T9 = 11.162.400, Đơn = 7, DTT = 10.968.000.<br>Sau khi O10 hoàn thành: GMV T9 = 12.262.400, DTT = 12.068.000. | Giống hệt 100% | **Khớp chính xác** |
| **TC-06** | `Tc06_VatIsFrozenPerLineAtCreationRate` | Có | Dòng PK2 của O2 (10/09, VAT 8%) = 14.400; dòng PK2 của O11 (10/10, VAT 10%) = 100.000. Dòng G2 của O2 = 108.000; tổng VAT O2 = 122.400. | Giống hệt 100% | **Khớp chính xác** |
| **TC-07** | `Tc07_GrowthUsesThePreviousNDays` | Có | Kỳ so sánh 31/08–30/09 (31 ngày). Tăng trưởng: GMV -51.2%, DTT -86.5%, Volume -87.5%, AOV +8.1%. | Giống hệt 100% | **Khớp chính xác** |
| **TC-08** | `Tc08_Waterfall` | Có | T9: (12.262.400, -194.400, 0, 0, 12.068.000)<br>T10: (5.990.000, -2.200.000, -1.080.000, -1.080.000, 1.630.000)<br>T10 CN-B: (1.650.000, -2.200.000, -1.080.000, 0, -1.630.000) | Giống hệt 100% | **Khớp chính xác** |
| **TC-09** | Không (thuộc phạm vi Frontend `pos.gui`) | **Không** | Quy tắc định dạng chuỗi hiển thị đơn vị tiền tệ ("12 Tr", "5,7 Tr", "1,5 Tr", "−1,6 Tr", "194.400 ₫", "512 Tr", "4,22 Tỷ") thuộc frontend (BR-FMT-02). Backend trả giá trị số thô `decimal`. Đã được kiểm thử trong unit test của `pos.gui`. | — | — |
| **TC-10** | `Tc10_MultiDimensionFilterCountsOrdersWithAtLeastOneMatchingLine` | Có | T9: Tròng kính GMV 6.480.000 (4 đơn); Gọng kính GMV 5.588.000 (4 đơn); Phụ kiện GMV 194.400 (1 đơn). Tổng 3 ngành = 12.262.400 = M01 (INV-05). | Giống hệt 100% | **Khớp chính xác** |
| **TC-11** | `Tc11_AllocatedTarget` | Có | KPI công ty T9 = 15.000.000; lọc 01/09–15/09 phân bổ = 7.500.000; GMV = 5.722.400 -> % đạt = 76%. | Giống hệt 100% | **Khớp chính xác** |

**Kết luận mục 4:** 10/10 ca kiểm thử backend đều được kiểm thử bằng unit test tự động và khớp số liệu đặc tả chính xác 100%. Riêng TC-09 là kiểm thử định dạng hiển thị giao diện nên nằm ở repository frontend `pos.gui`.

---

## 5. Các vấn đề mới phát hiện (New Issues Found)

Bảng ghi nhận theo mẫu spec §11.3:

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng file:line |
|---|---|---|---|---|---|---|---|
| **NEW-01** | Traffic & Tỷ lệ chuyển đổi | Kiểm tra code `QueryRegionalBenchmark` và `QueryConversionRate` khi người dùng B xem Traffic do người dùng A nhập | Traffic là dữ liệu dùng chung toàn công ty; mọi tài khoản có quyền xem chi nhánh đều thấy số traffic chung | Code truy vấn `Db.DashboardTrafficDaily` vẫn còn điều kiện `.Where(x => x.AccountId == IdentityContext.Id)`. Nếu người khác nhập traffic thì user hiện tại thấy traffic = 0 / "Chưa có traffic" | **Không đạt** | **Lớn** | `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs:1091, 1162` |
| **NEW-02** | Rò rỉ GMV qua KPI V2 | Đọc `KpiV2Controller.cs` các action `Get`, `Summary`, `Evaluate` với vai trò Manager không có scope `gmv.read` | Manager thiếu quyền GMV không được thấy giá trị GMV thô (phải bị che null) | Controller `KpiV2Controller` không chạy qua bộ xử lý `DashboardV2ResponsePostProcessor.MaskGmv`. DTO `KpiV2ActualAdminDto` trả thẳng `ActualValue` và `TargetValue` (chính là GMV thật và mục tiêu GMV) | **Không đạt** | **Lớn** | `Src/WebApi/Controllers/Admins/V2/KpiV2Controller.cs:34, 59, 67` |
| **NEW-03** | Hiệu năng N+1 truy vấn | Đọc method `Freeze` trong `KpiV2EvaluationService.cs` khi đóng băng KPI chu kỳ | Đọc và ghi snapshot theo lô (batch query) cho toàn bộ actuals của phiên bản KPI | Vòng lặp `foreach (var actual in actuals)` gọi `await Db.KpiActualSnapshot.SingleOrDefaultAsync(...)` từng dòng một trong database transaction. Với 61 chi nhánh x 2 metrics sẽ sinh 122 query tuần tự | **Không đạt** | **Nhỏ** | `Src/Application/Services/KpiV2/KpiV2EvaluationService.cs:235-241` |
| **NEW-04** | DTO bảo trì (Dead code risk) | Rà soát các thuộc tính kiểu số trong `ProductDashboardV2Dto.cs` | Các DTO thể hiện GMV đều phải là `decimal?` để hỗ trợ cơ chế che quyền GMV | Lớp `ProductBrandAggregateV2Dto` khai báo `public decimal CurrentGmv` và `PreviousGmv` kiểu `decimal` không nullable và không có trong `MaskedProperties`. Mặc dù DTO này hiện không trả ra controller ngoài nhưng tiềm ẩn rủi ro lộ GMV nếu sau này tái sử dụng | **Một phần** | **Nhỏ** | `Src/Application/Dto/Admins/DashboardV2/Product/ProductDashboardV2Dto.cs:108, 112` |

---

## 6. Kế hoạch Triển khai (Deployment Checklist)

### 6.1. Danh sách Migrations EF Core cần áp dụng theo thứ tự

Trong thư mục `Src/Infrastructure/Migrations/Pending/`, có **14 migration** cần được chuyển/áp dụng vào database PostgreSQL theo đúng thứ tự thời gian:

1. `20260805055323_DashboardV2PendingModelChanges.cs` — Khởi tạo schema thống kê ban đầu.
2. `20260805154531_AddDashboardV2PaidTaxAllocation.cs` — Bổ sung cột phân bổ thuế đã thu.
3. `20260812044233_AddDashboardV2GrossSalesNoVat.cs` — Bổ sung cột doanh số trước VAT.
4. `20260812081653_AddDashboardV2PaymentStatistics.cs` — Tạo bảng thống kê phiếu thu `ReportPaymentStatistic`.
5. `20260814034624_EnforceReportOrderDailyGrain.cs` — Chuẩn hóa hạt ngày của `ReportOrder`.
6. `20260825040540_OptimizeDashboardV2ProductQueries.cs` — Đánh chỉ mục tối ưu truy vấn sản phẩm.
7. `20260825100828_AddDashboardV2ProductCategoryHierarchy.cs` — Phân cấp ngành hàng sản phẩm.
8. `20260911050322_AddDashboardV2ExecutiveRefresh.cs` — Bảng `ReportCustomerFirstPurchase` và các cột nguồn PreOrder.
9. `20260915084143_AddDashboardV2OperationalPreOrderAging.cs` — Bảng tồn đọng đơn đặt `ReportPreOrderStatistic`.
10. `20260918041415_AddDashboardV2AnomalySourceSubmitAt.cs` — Cột ngày gửi đơn cho phát hiện bất thường.
11. `20260918074703_AddDashboardV2PersonnelWorkingSites.cs` — Bảng phân công chi nhánh nhân sự `ReportStaffWorkingSite`.
12. `20261017104504_AddDashboardV2RevenueEventsAndDebtSnapshots.cs` — **[Trọng tâm Wave 2a]** Tạo bảng `ReportRevenueEvent`, `ReportRevenueEventLine`, `ReportCustomerDebtSnapshot`.
13. `20261017151303_AddDashboardV2WaveTwoBDimensions.cs` — **[Trọng tâm Wave 2b]** Thêm các cột chiều kênh bán, chiến dịch, khách hàng, nhà cung cấp, thông số tròng kính vào sự kiện doanh thu.
14. `20261017152752_AddDashboardV2KpiCompanyTrafficRegionImport.cs` — **[Trọng tâm Wave 3b]** Tạo bảng `DashboardRegion`, `DashboardRegionSite`, `DashboardTrafficHistory`, `DashboardImportBatch`, cập nhật bảng `DashboardTrafficDaily` và `KpiPlan` thành toàn công ty.

*Cách áp dụng:* Nếu triển khai qua migration tự động khi khởi động app, đảm bảo cờ `Migration:ApplyOnStartup = true` trong `appsettings.json`, hoặc di chuyển các file trong `Pending/` ra thư mục `Migrations/` chính để chạy qua pipeline CI/CD `dotnet ef database update`.

---

### 6.2. Các bước Backfill dữ liệu lịch sử

Sau khi database cập nhật schema mới:
1. **Backfill Sự kiện Doanh thu (`ReportRevenueEvent` & `Line`):**
   - Gọi service: `ReportService.BackfillDashboardRevenueEvents(startDate, endDate, chunkDays: 15)`.
   - Khuyến nghị: Chạy lùi từ thời điểm hiện tại về đầu năm 2026 (hoặc từ ngày POS bắt đầu hoạt động), chia từng khúc 15 ngày để tránh lock bảng POS. Quá trình này hoàn toàn idempotent (chạy lại không nhân đôi số liệu).
2. **Backfill Snapshot Công nợ (`ReportCustomerDebtSnapshot`):**
   - Gọi service: `ReportService.BackfillDashboardDebtSnapshots(startDate, endDate)`.
   - Đồng bộ số dư công nợ khách hàng cuối mỗi ngày từ bảng POS `Debt` để phục vụ chỉ số Nợ treo M10.
3. **Backfill Khách hàng mua lần đầu (`ReportCustomerFirstPurchase`):**
   - Chạy đồng bộ lịch sử mua đầu tiên cho tập khách hàng để thẻ M03 (Khách hàng mới) nhận diện chính xác khách cũ vs khách mới.

---

### 6.3. Cấu hình Appsettings (`DashboardV2`)

Cần cập nhật các cấu hình sau trong `appsettings.Production.json`:

```json
{
  "DashboardV2": {
    "LegacyScopeMapping": true,
    "PaymentTypeMapping": {
      "DefaultCategory": "Other",
      "Rules": [
        { "PaymentTypeCode": "CUSTOMERPAID", "ObjectType": 5, "Category": "Deposit" },
        { "PaymentTypeCode": "CUSTOMERPAID", "ObjectType": 2, "Category": "Payment" },
        { "PaymentTypeCode": "CUSTOMERPAID", "ObjectType": 6, "Category": "DebtCollection" },
        { "PaymentTypeCode": "CUSTOMERPAID", "ObjectType": 4, "Category": "DebtCollection" },
        { "PaymentTypeCode": "CUSTOMERPAYMENT", "Category": "Refund" },
        { "PaymentTypeCode": "DEPOSITTRANSFER", "Category": "DepositTransfer" }
      ]
    },
    "PaymentMethodMapping": {
      "DefaultCategory": "Other",
      "Rules": [
        { "MethodCode": "CASH", "Category": "Cash" },
        { "MethodCode": "TRANSFER", "Category": "Transfer" },
        { "MethodCode": "CARD", "Category": "Card" },
        { "MethodCode": "MOMO", "Category": "EWallet" },
        { "MethodCode": "VNPAY", "Category": "EWallet" },
        { "MethodCode": "COD", "Category": "Cod" },
        { "MethodCode": "INSTALLMENT", "Category": "Installment" }
      ]
    },
    "LensCategoryKeywords": ["tròng"],
    "FrameCategoryKeywords": ["gọng"],
    "Inventory": {
      "DefaultLeadTimeDays": 7,
      "ServiceLevelZ": 1.65,
      "DemandWindowDays": 90
    },
    "TopStaffCount": 3,
    "AnomalySigmaMultiplier": 2.0
  }
}
```

> [!NOTE]
> Cờ `LegacyScopeMapping`: Đặt `true` trong giai đoạn đầu để tài khoản có scope cũ `manager.dashboard.read` hoạt động bình thường như vai trò BOD. Sau khi Identity hoàn tất cấp phát các scope mới, chuyển về `false`.

---

### 6.4. Danh mục Mã quyền Identity cần đăng ký

Đội vận hành Identity cần đăng ký các mã quyền sau vào hệ thống quản lý phân quyền:

| Mã quyền chuẩn | Alias có tiền tố | Loại | Diễn giải |
|---|---|---|---|
| `dashboard-v2.bod` | `manager.dashboard-v2.bod` | Vai trò | Toàn quyền xem mọi trang, toàn bộ chi nhánh và khu vực. |
| `dashboard-v2.manager` | `manager.dashboard-v2.manager` | Vai trò | Xem trang Vận hành, Sản phẩm, Nhân sự; chỉ xem các chi nhánh được gán. |
| `dashboard-v2.staff` | `manager.dashboard-v2.staff` | Vai trò | Chỉ xem trang Nhân sự ở góc nhìn cá nhân (SelfView). |
| `dashboard-v2.gmv.read` | `manager.dashboard-v2.gmv.read` | Quyền | Xem số liệu GMV (nếu thiếu, GMV bị null hóa và bật cờ `gmvHidden`). |
| `dashboard-v2.kpi.write` | `manager.dashboard-v2.kpi.write` | Quyền | Tạo, sửa, kích hoạt, import KPI (chỉ hiệu lực với vai trò BOD). |
| `dashboard-v2.traffic.write` | `manager.dashboard-v2.traffic.write` | Quyền | Nhập tay và import Traffic (BOD: mọi CH; MANAGER: CH được gán). |

---

### 6.5. Các bước Dữ liệu một lần (One-time Data Steps)

Sau khi deploy và áp dụng migration:
1. **Nạp danh mục Khu vực chung (Seed Region Master):**
   - Gọi `POST Admin/V2/Region/SeedFromStoreKpi?dryRun=true` để kiểm tra trước kết quả khớp nối tên 61 chi nhánh.
   - Gọi `POST Admin/V2/Region/SeedFromStoreKpi?dryRun=false` để chính thức tạo 5 khu vực chuẩn (HCM, Miền Đông, Miền Tây, Miền Bắc, Miền Trung) và gán 61 chi nhánh vào khu vực.
2. **Chuyển đổi dữ liệu Mục tiêu cũ (Migrate SaleTarget):**
   - Gọi `POST Admin/V2/Kpi/MigrateSaleTargets?dryRun=true` để kiểm tra số lượng bản ghi `SaleTarget` cũ được chuyển đổi.
   - Gọi `POST Admin/V2/Kpi/MigrateSaleTargets?dryRun=false` để nạp thành các bản ghi `KpiPlan` / `KpiPlanScope` / `KpiMetricTarget` theo loại ngày (idempotent, không tạo trùng lặp).
3. **Hợp nhất dữ liệu Traffic lịch sử:**
   - Dữ liệu `DashboardTrafficDaily` trước đây lưu theo `AccountId`. Chạy script SQL cập nhật hoặc import lại file traffic tổng hợp để dữ liệu hiển thị chung cho toàn công ty.

---

### 6.6. Các câu truy vấn SQL kiểm chứng sau Deploy

Thực thi trên database `report` sau khi hoàn tất các bước trên:

```sql
-- 1. Kiểm tra số lượng sự kiện doanh thu phát sinh theo loại
SELECT "EventType", COUNT(*) AS EventCount, SUM("GrossValue") AS TotalGross
FROM "ReportRevenueEvent"
WHERE "DeleteAt" IS NULL
GROUP BY "EventType"
ORDER BY "EventType";

-- 2. Kiểm tra tính toàn vẹn giữa Sự kiện và Dòng sự kiện (INV-05)
SELECT e."Id", e."GrossValue", SUM(l."GrossValue") AS LinesTotalGross
FROM "ReportRevenueEvent" e
JOIN "ReportRevenueEventLine" l ON e."Id" = l."EventId"
WHERE e."DeleteAt" IS NULL AND l."DeleteAt" IS NULL
GROUP BY e."Id", e."GrossValue"
HAVING ABS(e."GrossValue" - SUM(l."GrossValue")) > 1000
LIMIT 10;
-- Kỳ vọng: Không có dòng nào vượt quá ngưỡng dung sai làm tròn 1.000đ.

-- 3. Kiểm tra danh mục khu vực chung và chi nhánh
SELECT r."Code", r."Name", COUNT(rs."SiteId") AS AssignedBranches
FROM "DashboardRegion" r
LEFT JOIN "DashboardRegionSite" rs ON r."Id" = rs."RegionId" AND rs."DeleteAt" IS NULL
WHERE r."DeleteAt" IS NULL
GROUP BY r."Id", r."Code", r."Name"
ORDER BY r."Code";
-- Kỳ vọng: Đủ 5 khu vực (HCM, MIEN_DONG, MIEN_TAY, MIEN_BAC, MIEN_TRUNG) và tổng chi nhánh là 61.

-- 4. Kiểm tra KPI V2 đã chuyển đổi
SELECT "Status", "PeriodType", COUNT(*) AS PlanCount
FROM "KpiPlan"
WHERE "DeleteAt" IS NULL
GROUP BY "Status", "PeriodType";

-- 5. Kiểm tra dữ liệu nợ treo cuối ngày
SELECT "SnapshotDate", COUNT(DISTINCT "CustomerId") AS Debtors, SUM("Balance") AS TotalOutstandingDebt
FROM "ReportCustomerDebtSnapshot"
WHERE "DeleteAt" IS NULL
GROUP BY "SnapshotDate"
ORDER BY "SnapshotDate" DESC
LIMIT 7;

-- 6. Kiểm tra ràng buộc Traffic không âm
SELECT COUNT(*) FROM "DashboardTrafficDaily" WHERE "TrafficCount" < 0;
-- Kỳ vọng: 0 dòng.
```
