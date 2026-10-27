# Kế hoạch Triển khai Dashboard V2 — 6 Hạng mục Nhóm 2 & Chỉ số Bảo hành (Row 28)

Tài liệu này đặc tả chi tiết kế hoạch kỹ thuật trên **`report.api`** và **`pos.gui`** cho **6 hạng mục thuộc Nhóm 2 (Đã có sẵn Data, cần bổ sung/điều chỉnh lên Dashboard V2)** cùng với **hạng mục Bảo hành khách hàng (Row 28 — quy tắc Đơn đổi 0đ)** đã chốt với BOD.

> [!IMPORTANT]
> **Nguyên tắc kiến trúc & UI xuyên suốt:**
> 1. **Bảo toàn 100% bất biến doanh thu (`INV-01..INV-12`):** Không làm thay đổi công thức tính `M01 (GMV)`, `M02g / M02 (Order Count)`, `M04 (Thực thu)`, `M05 (Điều chỉnh)`, `M06 (DTT)`, `M12 / M13 (Tỷ lệ hoàn/trả)` hiện hữu.
> 2. **Không cần Migration DB phá vỡ cấu trúc:** Tận dụng bảng `ReportRevenueEvent`, `ReportRevenueEventLine`, `ReportOrderStatistic` (`Kind = Exchange` / `Return`), `ReportCustomerFirstPurchase`, `ReportPaymentStatistic` đã có sẵn trong `ReportDbContext`.
> 3. **Tái sử dụng tối đa UI Component của `pos.gui`:** Sử dụng lại `MetricCard.vue`, `ScopeViewFilter.vue`, `DataStatusBadge.vue`, `ChangeBadge.vue`, `GmvHiddenNotice.vue`, ECharts theme và bộ hàm format chuẩn `executiveFormatters.ts` (`BR-FMT-01..05`).
> 4. **Phân quyền GMV (`gmvHidden`):** Mọi trường liên quan đến GMV mới bổ sung vào DTO đều được đăng ký trong `DashboardV2ResponsePostProcessor.MaskGmv` (backend) và ẩn/mask tương ứng ở frontend khi tài khoản không có quyền xem GMV.

---

## Tổng quan 7 Module triển khai

| # | Hạng mục (Row Excel) | Phạm vi Backend (`report.api`) | Phạm vi Frontend (`pos.gui`) |
| :- | :--- | :--- | :--- |
| **M1** | **Bill Range theo PA2** *(Row 18, 19)*: `< 1 Tr`, `1–3 Tr`, `3–5 Tr`, `5–10 Tr`, `10–20 Tr`, `> 20 Tr` (Số đơn + Giá trị GMV) | `DashboardV2DataAvailability.cs`, `DashboardV2BasketBuckets.cs`, `DashboardV2Service.Operational.cs`, `DashboardV2GmvQueries.cs` | `BasketRefundCharts.vue`, `DashboardV2FilterBar.vue`, `types.ts` |
| **M2** | **Bổ sung `AOV`, `UPT`, `Thực thu`, `Trước VAT`** vào Thẻ KPI Tổng quan, Bảng Xếp hạng Chi nhánh/Khu vực/Cụm, và Bảng Chiến dịch | `ExecutiveDashboardV2Dto.cs`, `OperationalDashboardV2Dto.cs`, `DashboardV2Service.Executive.cs`, `DashboardV2Service.Operational.cs`, `DashboardV2ResponsePostProcessor.cs` | `ExecutiveOverviewCards.vue`, `ExecutivePerformanceRanking.vue`, `OperationalView.vue`, `types.ts` |
| **M3** | **Tăng trưởng Khách hàng Mới vs Cũ toàn diện** *(Row 34)*: SL khách, Số đơn, GMV, DTT, AOV, UPT & % tăng trưởng cùng kỳ + biểu đồ xu hướng | `ExecutiveDashboardV2Dto.cs`, `DashboardV2Service.Executive.cs`, `DashboardV2Controller.cs` | Component mới `CustomerSegmentGrowthChart.vue` (tái sử dụng layout `GrowthAnalysisChart.vue`), gắn vào `ExecutiveView.vue` |
| **M4** | **Highlight Thứ & Khung giờ bán tốt nhất / thấp nhất** *(Row 20–23)* theo Số lượng & Giá trị (GMV) | Không cần sửa API (đã trả đủ ma trận `7 × 24` có `OrderCount` & `GmvWithVat`) | `TimePeakChart.vue` (bổ sung dải 4 thẻ Summary Insight + badge highlight trên bảng Heatmap) |
| **M5** | **Bảo hành khách hàng (Đơn đổi 0đ) & Đổi trả toàn diện** *(Row 28)* trên khối Vận hành | `OperationalDashboardV2Dto.cs` (`RefundRateV2Dto`), `DashboardV2Service.Operational.cs`, `DashboardV2RevenueEventBuilder.cs` | `BasketRefundCharts.vue` (mở rộng panel Hoàn/Trả & Bảo hành), `types.ts` |
| **M6** | **Bảo hành & Đổi trả theo Chi nhánh và PIC Sales** *(Row 28, 32)* trên Bảng xếp hạng Chi nhánh & Sales Leaderboard | `PersonnelDashboardV2Dto.cs`, `ExecutiveDashboardV2Dto.cs`, `DashboardV2Service.Personnel.cs`, `DashboardV2Service.Executive.cs` | `SalesLeaderboard.vue`, `ExecutivePerformanceRanking.vue`, `types.ts` |
| **M7** | **Conversion Rate theo Top Store / Khu vực / Toàn hệ thống** *(Row 31)* trên Tab Vận hành | `OperationalDashboardV2Dto.cs` (`ConversionSiteV2Dto`), `DashboardV2Service.Operational.cs` | `OperationalView.vue` (bổ sung KPI tổng hệ thống + toggle `Theo Cửa hàng` / `Theo Khu vực`) |

---

## Chi tiết Kỹ thuật từng Module

### Module 1: Chuẩn hóa Phân khúc Hóa đơn (Bill Range) sang PA2 (Row 18, 19)

#### 1. Quy tắc nghiệp vụ
- Thay thế 5 mốc cũ (`< 500N`, `500N–1Tr`, `1Tr–3Tr`, `3Tr–5Tr`, `> 5Tr`) bằng **6 mốc PA2**:
  - Bucket `0`: **`< 1 Tr`** (`0 <= GrossValue < 1.000.000`)
  - Bucket `1`: **`1–3 Tr`** (`1.000.000 <= GrossValue < 3.000.000`)
  - Bucket `2`: **`3–5 Tr`** (`3.000.000 <= GrossValue < 5.000.000`)
  - Bucket `3`: **`5–10 Tr`** (`5.000.000 <= GrossValue < 10.000.000`)
  - Bucket `4`: **`10–20 Tr`** (`10.000.000 <= GrossValue < 20.000.000`)
  - Bucket `5`: **`> 20 Tr`** (`GrossValue >= 20.000.000`)
- Biểu đồ và tooltip hiển thị đồng thời **Số lượng đơn (`OrderCount`)**, **Tỷ trọng đơn (`%`)**, và **Tổng giá trị GMV (`TotalValue`)** của từng phân khúc; bộ lọc đa chiều `Phân khúc hóa đơn` trên `DashboardV2FilterBar` lọc đồng bộ theo 6 mốc này.

#### 2. Thay đổi trên `report.api`
- [DashboardV2DataAvailability.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2DataAvailability.cs#L31-L39):
  - Cập nhật `BasketUpperBounds` thành `[1_000_000m, 3_000_000m, 5_000_000m, 10_000_000m, 20_000_000m]`.
- [DashboardV2Service.Operational.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs#L266-L295) & [L938-L962](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs#L938-L962):
  - Trong `QueryBasketSize`: mở rộng biểu thức phân loại `Bucket` lên 6 nhánh (`0..5`) dựa trên `b[0]..b[4]`.
  - Trong `BuildBasketSize`: khởi tạo đủ 6 bucket (`0..5`) để luôn trả về đủ 6 cột dù có phân khúc `0` đơn.
- [DashboardV2GmvQueries.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2GmvQueries.cs#L135-L175):
  - Mở rộng `ApplyEventDimensions` (nhánh `filter.BasketSegments`) từ 5 mốc (`0..4`) lên 6 mốc (`0..5`) theo `BasketUpperBounds`.
- Cập nhật enum/validator liên quan đến `BasketSegments` để chấp nhận giá trị `0..5`.

#### 3. Thay đổi trên `pos.gui`
- [BasketRefundCharts.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/BasketRefundCharts.vue#L25-L108):
  - Cập nhật `BASKET_LABELS = ['< 1 Tr', '1–3 Tr', '3–5 Tr', '5–10 Tr', '10–20 Tr', '> 20 Tr']`.
  - Bổ sung màu thứ 6 vào palette của `basketOption` và hiển thị thêm toggle hoặc sub-label tổng giá trị GMV trên biểu đồ / bảng tóm tắt dưới chân chart.
- [DashboardV2FilterBar.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/DashboardV2FilterBar.vue):
  - Cập nhật danh sách `basketSegmentOptions` sang 6 nhãn PA2 (`0..5`).

---

### Module 2: Bổ sung `AOV`, `UPT`, `Thực thu`, `Trước VAT` ở Tầng Tài chính, Chi nhánh & Chiến dịch

#### 1. Thay đổi trên `report.api`
1. **Bảng Chiến dịch (`FR-OP-06`):**
   - [OperationalDashboardV2Dto.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dto.cs#L225-L244) (`CampaignItemV2Dto`): bổ sung `public decimal? Upt { get; set; }` và `public int UnitCount { get; set; }`.
   - [DashboardV2Service.Operational.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs#L402-L423) (`BuildCampaigns`): gán `Upt = measures.Upt`, `UnitCount = measures.UnitCount` (đã có sẵn trong `measures` từ `DashboardV2RevenueCalculator.Calculate`).
2. **Bảng Xếp hạng Hiệu suất Chi nhánh / Khu vực / Cụm (`FR-EX-07`):**
   - [ExecutiveDashboardV2Dto.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Dto/Admins/DashboardV2/Executive/ExecutiveDashboardV2Dto.cs#L270-L325) (`ExecutiveRankingItemV2Dto` & `ExecutiveRankingTotalV2Dto`):
     - Bổ sung: `CollectedRevenueWithVat` (Doanh thu thực thu theo phiếu thu `M04`), `GrossOrderCount` (`M02g`), `AovWithVat` (`M08`), `Upt` (`M09`), `UnitCount`.
   - [DashboardV2Service.Executive.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Executive.cs):
     - Trong `QueryExecutiveRanking` & `BuildRanking`: truy vấn thêm `CollectedRevenue` theo `SiteId` (từ `Db.ReportPaymentStatistic`) và map `GrossOrderCount`, `AovWithVat`, `Upt`, `UnitCount` từ `DashboardV2RevenueCalculator.Calculate(...)` cho cả dòng chi tiết (Region / Cluster / Site) và dòng `Total`.

#### 2. Thay đổi trên `pos.gui`
1. **Thẻ KPI Tổng quan ([ExecutiveOverviewCards.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/ExecutiveOverviewCards.vue)):**
   - Dữ liệu `upt`, `unitCount`, `netRevenueWithoutVat` **đã có sẵn** trong `ExecutiveKpiSummaryV2Dto` và `ExecutivePreviousPeriodV2Dto`.
   - Trên thẻ **`DOANH THU THUẦN`**: cập nhật dòng `detail` hiển thị cả **`Trước VAT: <netRevenueWithoutVat> · <x,x%> GMV`**.
   - Bổ sung thẻ KPI thứ 10 **`SỐ SP / ĐƠN (UPT)`** (`M09 = Tổng SL sản phẩm thuần / M02`, subtitle hiển thị `Tổng SL: <unitCount> SP`, có so sánh kỳ trước và sparkline theo ngày), sử dụng đúng `MetricCard.vue`.
2. **Bảng Xếp hạng Hiệu suất ([ExecutivePerformanceRanking.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue)):**
   - Bổ sung các cột có thể sort: **`Thực thu`**, **`Số đơn`** (tooltip hiện `Đơn gộp: M02g`), **`AOV`**, **`UPT`** (kèm dòng Tổng cộng ở footer).
3. **Bảng Hiệu quả Chiến dịch ([OperationalView.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/views/OperationalView.vue#L345-L375)):**
   - Bổ sung cột **`UPT`** (`formatDecimal(item.upt, 2)`) bên cạnh cột `AOV`.

---

### Module 3: Phân tích & Tăng trưởng Khách hàng Mới vs Khách hàng Cũ vs Chưa định danh Toàn diện (Row 34)

#### 1. Quy tắc nghiệp vụ & Nguồn dữ liệu (Đã chốt DA & Business Owner)
- **Định danh cấp Toàn chuỗi (`Chain-wide First Purchase`):** Dựa trên `Db.ReportCustomerFirstPurchase` (`FirstEventDate` = ngày phát sinh đơn gốc đầu tiên trong toàn lịch sử hệ thống HMK, không tính đơn đổi `ExchangeParentId != null` và không tính `KHACHLE`) kết hợp với `Db.ReportRevenueEvent`:
  1. **Khách hàng mới (`New`):**
     - Áp dụng cho khách hàng định danh (`!CustomerIsWalkIn && CustomerId != null`).
     - Mọi giao dịch phát sinh trong **cùng ngày mua đầu tiên trên toàn chuỗi (`EventDate == FirstEventDate`)** khi `FirstEventDate` nằm trong kỳ báo cáo `[StartAt, EndAt]` đều được ghi nhận vào tệp **Khách hàng mới** (tránh việc khách ghé cửa hàng lần đầu nhưng tách 2 bill gọng + tròng trong cùng ngày bị tính nhầm sang khách quay lại).
  2. **Khách hàng cũ / Quay lại (`Returning`):**
     - Áp dụng cho khách hàng định danh (`!CustomerIsWalkIn && CustomerId != null`).
     - Mọi giao dịch phát sinh ở các ngày **sau ngày mua đầu tiên (`EventDate > FirstEventDate`)** — bao gồm cả trường hợp khách mua lần đầu đầu tháng và quay lại mua thêm vào cuối tháng hoặc khách đã mua từ các kỳ trước.
  3. **Khách chưa định danh / Vãng lai (`WalkIn` — Mã `KHACHLE`, Phương án A):**
     - Bao gồm mọi giao dịch có `CustomerIsWalkIn == true || CustomerId == null`.
     - Hiển thị thành **dòng thứ 3 (`Khách chưa định danh - KHACHLE`)** trên bảng để:
       - Đảm bảo **Tổng Số đơn (`M02`), Tổng GMV (`M01`), Tổng DTT (`M06`) của 3 nhóm (`New + Returning + WalkIn`) khớp 100%** với thẻ KPI Tổng quan toàn hệ thống.
       - Giúp BOD giám sát kỷ luật thu ngân (tỷ trọng đơn thu ngân không lưu SĐT/hồ sơ khách).
     - **Quy tắc hiển thị cột `Số lượng khách` (`CustomerCount`) theo Phương án A:**
       - Vì `KHACHLE` dùng chung 1 bản ghi mặc định trên POS, trường `CustomerCount` của dòng `WalkIn` trả về `null` và hiển thị **`—` *(Không định danh)*** trên UI (kèm tooltip giải thích: *"Đơn dùng chung mã KHACHLE không lưu SĐT nên chỉ thống kê theo Số đơn hàng & Doanh thu"*).
       - Dòng **`Tổng cộng (Total)`** ở cột `Số lượng khách` chỉ cộng **Tổng khách định danh (`New + Returning` duy nhất trong kỳ)**, không cộng `KHACHLE`.
- **Quy tắc xử lý Đơn bảo hành (0đ) & Đơn đổi trong phân tích Khách hàng (Chống méo số liệu Retention & AOV):**
  - **Đơn bảo hành (Mọi đơn hàng hoàn thành/ghi nhận hợp lệ có giá trị `GrossValue == 0m` — bao gồm cả Đơn đổi 0đ `ExchangeParentId != null` lẫn Đơn hàng thông thường 0đ `ExchangeParentId == null`):**
    - **Loại trừ hoàn toàn** khỏi mẫu số **Số đơn (`GrossOrderCount`, `OrderCount`)**, **Số lượng khách (`CustomerCount`)**, và **Đơn mua đầu tiên (`ReportCustomerFirstPurchase`)** của tệp Khách hàng để khách đi bảo hành không bị đếm thành "Khách mới" hoặc "Khách quay lại mua hàng" và không làm tụt ảo `AOV` của tệp Khách hàng.
  - **Đơn đổi có bù tiền (`ExchangeParentId != null && GrossValue > 0m`) và sự kiện Hoàn/Trả/Hủy (`E4/E5/E6`):**
    - Giá trị doanh thu / điều chỉnh (`GrossValue`, `M05`) vẫn được cộng/trừ vào `GMV` và `DTT` của nhóm khách tương ứng (theo phân loại của đơn gốc/khách hàng) để tổng tiền khớp 100% toàn hệ thống.
    - Nhưng bản thân sự kiện Đổi/Trả **không làm phát sinh lượt `CustomerCount` quay lại** nếu trong kỳ khách hàng đó không có đơn mua mới độc lập (`ExchangeParentId == null && GrossValue > 0m`), và **đơn đổi không cộng thêm vào mẫu số `OrderCount` độc lập của tệp khách** khi tính `AOV` khách hàng.
- **Bộ chỉ số tính cho từng tệp (`New`, `Returning`, `WalkIn`, `Total`) ở cả Kỳ hiện tại (`Current`) và Kỳ so sánh (`Previous`):**
  1. `CustomerCount` (`int?`): Số lượng khách hàng định danh duy nhất (`null` đối với dòng `WalkIn`).
  2. `GrossOrderCount` (`M02g`) & `OrderCount` (`M02` - Đơn thuần, đã loại trừ mọi đơn bảo hành 0đ).
  3. `GmvWithVat` (`M01`) & `GmvShare` (`%` đóng góp GMV trên tổng hệ thống).
  4. `NetRevenueWithVat` (`M06` - Doanh thu thuần) & `NetRevenueShare` (`%` đóng góp DTT).
  5. `AovWithVat` (`M08 = DTT / M02`) & `Upt` (`M09 = SL thuần / M02`).
  6. **Tăng trưởng (`Growth %` so với kỳ trước):** `CustomerGrowthRate` (`null` với `WalkIn`), `OrderGrowthRate`, `GmvGrowthRate`, `NetRevenueGrowthRate`, `AovGrowthRate`, `UptGrowthRate`.
- **Chuỗi thời gian (`TrendBuckets`):** Chia theo `filter.PeriodType` (Ngày / Tuần / Tháng / Quý / Năm) cho cả 3 nhóm (`New`, `Returning`, `WalkIn`) để vẽ biểu đồ cột chồng + đường tỷ trọng/tăng trưởng (tương tự `GrowthAnalysisChart.vue`).

#### 2. Thay đổi trên `report.api`
- [ExecutiveDashboardV2Dto.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Dto/Admins/DashboardV2/Executive/ExecutiveDashboardV2Dto.cs):
  - Thêm `ExecutiveCustomerGrowthV2Dto` (chứa `New`, `Returning`, `WalkIn`, `Total` kiểu `CustomerSegmentMetricsV2Dto` và `List<CustomerSegmentTrendPointV2Dto> Trend`).
  - Gắn `DashboardV2BlockAdminDto<ExecutiveCustomerGrowthV2Dto>? CustomerGrowth` vào `ExecutiveDashboardV2Dto` và tạo endpoint độc lập `POST /Admin/V2/Dashboard/Executive/CustomerGrowth` trong `DashboardV2Controller.cs` (theo đúng pattern progressive block loading của Executive).
- [DashboardV2Service.Executive.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Executive.cs) & [ReportService.DashboardV2.FirstPurchase.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/Report/ReportService.DashboardV2.FirstPurchase.cs):
  - Trong `SelectFirstEligibleEvent` / `SelectFirstEligibleOrder`: chỉ chọn đơn có giá trị `GrossValue > 0m` (`NeedPayAmount > 0`) làm đơn mua hàng đầu tiên của khách (loại bỏ đơn bảo hành 0đ).
  - Cài đặt `GetExecutiveCustomerGrowth(DashboardV2NormalizedFilter filter)` và `BuildCustomerGrowth(...)` tuân thủ đầy đủ quy tắc `EventDate == FirstEventDate` vs `EventDate > FirstEventDate`, tách dòng `WalkIn` (`CustomerCount = null`), và loại trừ mọi đơn bảo hành 0đ khỏi mẫu số đơn.
  - Đăng ký mask các trường GMV (`GmvWithVat`, `GmvShare`, `GmvGrowthRate`) trong `DashboardV2ResponsePostProcessor.cs`.

#### 3. Thay đổi trên `pos.gui`
- Tạo component [CustomerSegmentGrowthChart.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/CustomerSegmentGrowthChart.vue) tái sử dụng hoàn toàn card style của `GrowthAnalysisChart.vue` & `ExecutiveOrderEfficiencyChart.vue`:
  - **Phần trên:** Bảng so sánh đối chiếu **3 nhóm (`Khách hàng mới` · `Khách hàng cũ (Quay lại)` · `Khách chưa định danh (KHACHLE)`) + dòng `Tổng cộng`** với đầy đủ các cột: `SL Khách` (hiển thị `—` kèm tooltip cho `KHACHLE`), `Số đơn (Thuần / Gộp)`, `Doanh số (GMV & % tỷ trọng)`, `Doanh thu thuần (DTT & % tỷ trọng)`, `AOV`, `UPT`, kèm badge `% tăng trưởng` so với kỳ trước (dùng `ChangeBadge.vue`).
  - **Phần dưới:** Biểu đồ ECharts kết hợp Stacked Bar (`Khách mới` · `Khách cũ` · `KHACHLE` qua các kỳ) + Line (Tỷ trọng / Tăng trưởng), có bộ chuyển đổi chỉ số (`GMV` · `DTT` · `Số đơn` · `Số khách`).
- Gắn vào [ExecutiveView.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/views/ExecutiveView.vue) ngay bên dưới khối Tăng trưởng.

---

### Module 4: Highlight Thứ & Khung giờ Bán tốt nhất / Thấp nhất (Row 20–23)

#### 1. Quy tắc nghiệp vụ
- Trên ma trận `TimePeakChart.vue` (đã có toggle `Số lượng đơn` và `Doanh số (GMV)`):
  - Tự động xác định từ dữ liệu thực tế trong kỳ:
    1. **Thứ bán tốt nhất** (Max tổng theo Thứ) & **Thứ bán thấp nhất** (Min tổng theo Thứ có phát sinh > 0).
    2. **Khung giờ cao điểm nhất** (Max tổng theo Giờ) & **Khung giờ thấp điểm nhất** (Min tổng theo Giờ trong khung giờ hoạt động có phát sinh > 0).
    3. **Điểm rơi cao điểm nhất (Thứ × Giờ)**.

#### 2. Thay đổi trên `pos.gui`
- [TimePeakChart.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/TimePeakChart.vue):
  - Bổ sung dải **4 thẻ Insight Summary** phía trên bảng Heatmap (dùng chung CSS class card nhỏ gọn với `ExecutiveOrderEfficiencyChart.vue`):
    - **Thứ cao điểm nhất** (VD: `Chủ Nhật · 142 đơn / 385,0 Tr`)
    - **Thứ thấp điểm nhất** (VD: `Thứ Ba · 48 đơn / 112,4 Tr`)
    - **Khung giờ bán tốt nhất** (VD: `19h–20h · 96 đơn`)
    - **Khung giờ bán thấp nhất** (VD: `08h–09h · 12 đơn`)
  - Highlight viền xanh nổi bật cho cột Tổng Thứ / dòng Tổng Giờ đạt đỉnh (Peak) và badge cảnh báo nhẹ cho Thứ/Giờ thấp nhất.

---

### Module 5 & Module 6: Chỉ số Bảo hành (Đơn hàng 0đ: Đơn đổi 0đ & Đơn thường 0đ - Row 28) & Đổi trả theo Chi nhánh / PIC Sales (Row 28, 32)

#### 1. Quy tắc nghiệp vụ Bảo hành (Theo thông tin User & Business chốt)
- **Định nghĩa Đơn bảo hành (`Warranty Order`):**
  - **Mọi đơn hàng hợp lệ/hoàn thành phát sinh trong kỳ (`EventType == PreOrderCreated (E1)` hoặc `EventType == DirectSale (E2)`) có giá trị cần thanh toán bằng 0đ (`GrossValue == 0m` / `NeedPayAmount == 0`)** đều được hiểu là **Đơn bảo hành (`Warranty Order`)**, bao gồm **cả 2 luồng vận hành thực tế tại cửa hàng**:
    1. **Đơn bảo hành qua luồng đổi trả (`Exchange Warranty`):** Đơn đổi phát sinh từ phiếu trả hàng trên đơn gốc (`ExchangeParentId != null` / liên kết qua `ReturnSaleOrder.ExchangeSaleOrderId`) có giá trị `GrossValue == 0m`.
    2. **Đơn bảo hành tạo trực tiếp (`Direct Warranty`):** Đơn bán hàng thông thường (`ExchangeParentId == null`) được thu ngân tạo trực tiếp với giá trị thanh toán `GrossValue == 0m` (chiết khấu 100% / đơn 0đ xuất hàng bảo hành).
  - Ngược lại, nếu đơn đổi có `GrossValue > 0m` (khách bù thêm tiền để nâng cấp/đổi sang sản phẩm giá cao hơn) thì là **Đơn đổi hàng phát sinh doanh số (`Paid Exchange Order`)**.
- **Cách lấy thông tin & quy thuộc (Attribution):**
  - Trong `ReportDbContext`, bảng `ReportRevenueEvent` lưu tất cả các đơn `E1/E2` cùng với `GrossValue`, `CostValue`, `Quantity`, `SiteId`, `StaffId`. Do đó, mọi đơn có `(EventType == PreOrderCreated || EventType == DirectSale) && GrossValue == 0m` đều được nhận diện trực tiếp ngay trên `ReportRevenueEvent`!
  - Đồng thời, cập nhật `DashboardV2RevenueEventBuilder.BuildDirectSale` để gán `OriginalOrderId = order.ExchangeParentId ?? order.Id` (giữ nguyên `RootOrderId = order.Id` để không ảnh hưởng `M02`/`M13`) và kết hợp `ReportOrderStatistic` (`Kind == Exchange`) nhằm phân biệt rõ đơn bảo hành từ luồng đổi trả vs đơn bảo hành tạo trực tiếp.
- **Các chỉ số Bảo hành & Đổi trả cần hiển thị:**
  1. **Số đơn bảo hành (`WarrantyOrderCount`):** Tổng số đơn (`E1/E2`) trong kỳ có `GrossValue == 0m` (kèm breakdown/tooltip: bao nhiêu đơn đổi 0đ, bao nhiêu đơn thường 0đ).
  2. **Số lượng SP bảo hành (`WarrantyQuantity`):** Tổng `Quantity` sản phẩm xuất trong tất cả các đơn bảo hành 0đ.
  3. **Giá trị bảo hành (`WarrantyValueWithVat` / `WarrantyCostValue`):**
     - `WarrantyCostValue`: Tổng giá vốn (`CostValue`) của sản phẩm xuất ra trong tất cả các đơn bảo hành 0đ (luôn có sẵn cho cả đơn thường 0đ và đơn đổi 0đ).
     - `WarrantyValueWithVat`: Tổng giá trị hàng gốc được bảo hành (lấy từ sự kiện `Return` `E4` liên kết đối với đơn đổi 0đ, cộng với giá vốn/giá trị niêm yết của đơn bảo hành trực tiếp).
  4. **Tỷ lệ đơn bảo hành (`WarrantyOrderRate`):** `WarrantyOrderCount / GrossOrderCount (M02g) × 100`.
  5. **Đổi trả (`Return / Exchange`):**
     - `ReturnedOrderCount` (Số đơn gốc có phát sinh trả hàng), `ReturnEventCount` (Số phiếu trả `E4`), `ReturnQuantity` (SL hàng trả), `ReturnAdjustmentWithVat` (`M05a` - Giá trị trả hàng), `ExchangeAdjustmentWithVat` (`M05b`), `CancelAdjustmentWithVat` (`M05c`).
  6. **Quy thuộc về Chi nhánh (`SiteId`) và Nhân viên bán hàng (`PIC Sales - StaffId`):**
     - Với đơn đổi 0đ: quy thuộc theo `SiteId` và `StaffId` của đơn gốc (hoặc `StaffId` trên đơn bảo hành nếu không có đơn gốc).
     - Với đơn thường 0đ: quy thuộc trực tiếp theo `SiteId` và `StaffId` của đơn 0đ đó.

#### 2. Thay đổi trên `report.api`
1. **Builder (`DashboardV2RevenueEventBuilder.cs`):**
   - Trong `BuildDirectSale`: truyền `order.ExchangeParentId ?? order.Id` vào tham số `originalOrderId` của `CreateBundle` (giữ nguyên `rootOrderId: order.Id`).
2. **Khối Vận hành (`RefundRateV2Dto` & `DashboardV2Service.Operational.cs`):**
   - Mở rộng [RefundRateV2Dto](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dto.cs#L120-L155) thêm:
     - `WarrantyOrderCount` (Tổng số đơn bảo hành 0đ = đơn đổi 0đ + đơn thường 0đ)
     - `ExchangeWarrantyOrderCount` (Số đơn đổi 0đ) & `DirectWarrantyOrderCount` (Số đơn thường 0đ)
     - `WarrantyQuantity` (Số lượng SP bảo hành)
     - `WarrantyValueWithVat` (Giá trị hàng gốc được bảo hành)
     - `WarrantyCostValue` (Giá vốn hàng xuất bảo hành)
     - `WarrantyOrderRate` (% đơn bảo hành / tổng đơn gộp)
     - `ReturnQuantity` (Tổng SL SP trả lại)
   - Cập nhật `QueryRefundRate` & `BuildRefundRate` trong [DashboardV2Service.Operational.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs#L300-L335) và [L964-L985](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs#L964-L985) để tính đầy đủ các trường trên.
3. **Khối Nhân sự — Sales Leaderboard (`PersonnelLeaderboardItemV2Dto` & `DashboardV2Service.Personnel.cs`):**
   - Trong [PersonnelDashboardV2Dto.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Dto/Admins/DashboardV2/Personnel/PersonnelDashboardV2Dto.cs#L58-L96) (`PersonnelLeaderboardItemV2Dto`), hiện đã có `ReturnRate` (`M12`). Bổ sung thêm:
     - `ReturnOrderCount` (Số đơn trả của PIC Sales)
     - `ReturnValueWithVat` (Giá trị đổi/trả `|M05|` của PIC Sales)
     - `WarrantyOrderCount` (Tổng số đơn bảo hành 0đ của PIC Sales)
     - `WarrantyQuantity` (SL SP bảo hành)
     - `WarrantyValueWithVat` / `WarrantyCostValue` (Giá trị / Giá vốn hàng bảo hành)
   - Cập nhật `DashboardV2Service.Personnel.cs` để tổng hợp và trả về cho từng nhân viên.
4. **Khối Chi nhánh (`ExecutiveRankingItemV2Dto` & `DashboardV2Service.Executive.cs`):**
   - Bổ sung `ReturnValueWithVat`, `WarrantyOrderCount`, `WarrantyValueWithVat` vào `ExecutiveRankingItemV2Dto` & `ExecutiveRankingTotalV2Dto`.

#### 3. Thay đổi trên `pos.gui`
1. **[BasketRefundCharts.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/BasketRefundCharts.vue):**
   - Mở rộng card **Tỷ lệ Hoàn / Trả & Bảo hành**:
     - Giữ nguyên 2 gauge/card chính `M12 (Tỷ lệ giá trị hoàn/trả)` & `M13 (Tỷ lệ đơn có trả hàng)`.
     - Bổ sung khu vực **Chỉ số Bảo hành (Đơn hàng 0đ)**: hiển thị **Số đơn bảo hành** (kèm sub-text tách rõ `Đơn đổi 0đ` & `Đơn thường 0đ`), **SL sản phẩm bảo hành**, **Giá vốn / Giá trị hàng bảo hành**, **Tỷ lệ đơn bảo hành (%)** kèm tooltip giải thích rõ quy tắc nghiệp vụ *"Bao gồm cả đơn đổi 0đ phát sinh từ luồng đổi trả và đơn hàng thông thường có giá trị thanh toán 0đ"*.
2. **[SalesLeaderboard.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/SalesLeaderboard.vue):**
   - Bổ sung cột **`Giá trị Đổi/Trả`** (kèm SL đơn trả & `% M12`) và cột **`Bảo hành (Đơn / Giá trị)`** trên bảng xếp hạng PIC Sales (cho phép sort theo Giá trị trả hoặc Số đơn bảo hành).
3. **[ExecutivePerformanceRanking.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue):**
   - Bổ sung cột **`Bảo hành`** (hiển thị Số đơn bảo hành & tooltip Giá trị / Giá vốn bảo hành) bên cạnh cột `Tỷ lệ hoàn`.

---

### Module 7: Conversion Rate theo Top Store / Khu vực / Toàn hệ thống (Row 31)

#### 1. Thay đổi trên `report.api`
- [OperationalDashboardV2Dto.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dto.cs#L195-L224) (`ConversionSiteV2Dto` & `OperationalMockDataV2Dto`):
  - Bổ sung `RegionId`, `RegionName`, `ClusterId`, `ClusterName` vào `ConversionSiteV2Dto`.
  - Bổ sung danh sách tổng hợp theo khu vực `List<ConversionRegionV2Dto> Regions` (`RegionId`, `RegionName`, `Traffic`, `Orders`, `ConversionRate`) vào `OperationalMockDataV2Dto`.
- [DashboardV2Service.Operational.cs](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs#L19-L55) (`BuildConversion`) & `QueryConversion`:
  - Map `RegionId`, `RegionName`, `ClusterId`, `ClusterName` từ `ExecutiveSiteScope` (đã có sẵn khi gọi `QueryExecutiveSites(filter)`!) vào từng `ConversionSiteV2Dto` và group thành `Regions`.

#### 2. Thay đổi trên `pos.gui`
- [OperationalView.vue](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/views/OperationalView.vue#L206-L218) & [L380-L435](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2/views/OperationalView.vue#L380-L435):
  - Trên header của khối **Tỷ lệ chuyển đổi (`FR-OP-05`)**:
    - Hiển thị **KPI Badge Toàn hệ thống (phạm vi lọc):** `Toàn hệ thống: <conversionRate>% (<totalOrders> đơn / <totalTraffic> khách)`.
    - Bổ sung nút chuyển góc nhìn **`Theo Cửa hàng (Top Store)`** | **`Theo Khu vực (Region)`** (sử dụng cùng style pill button như `ScopeViewFilter.vue`).
  - Khi chọn `Theo Cửa hàng`: hiển thị bảng/thanh tiến độ Top Store kèm tên Khu vực.
  - Khi chọn `Theo Khu vực`: hiển thị bảng/thanh tiến độ so sánh Conversion Rate giữa các Khu vực.

---

## Kế hoạch Thực thi & Kiểm thử (Execution & Orca Browser E2E Waves)

> [!IMPORTANT]
> **Quy tắc cô lập File Test theo yêu cầu:**
> - **Toàn bộ các file test viết mới (Contract Tests, Data Pipeline Tests, Browser E2E Test Scripts/Fixtures)** sẽ được đặt **100% trong git repo `dashboard_hmk`** tại thư mục [`tests/`](file:///Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/dashboard_hmk/tests).
> - **Không tạo hay sửa file test** trên các git repo khác (`report.api`, `pos.gui`, `pos.api`) để giữ working tree của `report.api` và `pos.gui` chỉ chứa đúng code nghiệp vụ triển khai.

Sau khi bạn duyệt kế hoạch này, tôi sẽ điều phối triển khai theo **4 Wave** (sử dụng `/orchestration` kết hợp skill **`orca-cli` Browser Automation**):

1. **Wave 1 — Backend (`report.api` — chỉ sửa source code nghiệp vụ):**
   - **Worker 1A (Operational & Revenue Builder):** Triển khai **M1** (Bill Range PA2 `0..5`), **M2-Op** (Campaign UPT), **M5** (Warranty 0đ — cả đơn đổi 0đ & đơn thường 0đ — trong `RefundRateV2Dto`/Calculator/Builder), **M7** (Conversion Rate theo Store/Region/System).
   - **Worker 1B (Executive & Personnel):** Triển khai **M2-Ex** (Ranking Thực thu, AOV, UPT), **M3** (Customer New vs Returning vs `KHACHLE` Growth API & loại bỏ đơn 0đ khỏi `FirstPurchase` / mẫu số đơn), **M6** (Warranty & Return trên Sales Leaderboard & Branch Ranking), và cập nhật `DashboardV2ResponsePostProcessor.MaskGmv`.
   - **Verification Gate 1:** Chạy `dotnet build` kiểm tra biên dịch sạch sẽ trên `report.api`.

2. **Wave 2 — Frontend (`pos.gui` — chỉ sửa/thêm Vue component & types nghiệp vụ):**
   - **Worker 2A (Executive & Filter UI):** Cập nhật `types.ts`, `dashboardV2Api.ts`, `DashboardV2FilterBar.vue` (PA2), `ExecutiveOverviewCards.vue` (UPT & Trước VAT), `ExecutivePerformanceRanking.vue` (Thực thu, AOV, UPT, Bảo hành), và tạo mới `CustomerSegmentGrowthChart.vue` gắn vào `ExecutiveView.vue`.
   - **Worker 2B (Operational & Personnel UI):** Cập nhật `BasketRefundCharts.vue` (PA2 + Panel Bảo hành 0đ), `TimePeakChart.vue` (Highlight Thứ/Giờ tốt nhất & thấp nhất), `OperationalView.vue` (Campaign UPT + Conversion Rate System/Region/Store), `SalesLeaderboard.vue` (Cột Đổi trả & Bảo hành theo PIC Sales).
   - **Verification Gate 2:** Chạy `npm run type-check` (`vue-tsc`) trên `pos.gui`.

3. **Wave 3 — Contract & Data Logic Test Suite (Đặt tại `dashboard_hmk/tests/`):**
   - Tạo bộ test tự động ngay trên repo `dashboard_hmk` (`dashboard_hmk/tests/dashboard-v2-bod-metrics.test.ts` & `dashboard_hmk/tests/e2e-api-fixtures.ts`) để kiểm chứng:
     - 100% contract tên trường giữa C# DTO (`report.api`) và TypeScript interface (`pos.gui`).
     - Logic tính toán cho 7 module: phân loại 6 mốc PA2, công thức `WarrantyOrderCount` (đơn đổi 0đ + đơn thường 0đ), phân nhóm `New` (`EventDate == FirstEventDate`) vs `Returning` (`EventDate > FirstEventDate`) vs `WalkIn` (`KHACHLE` có `CustomerCount = null`), và bảo toàn `INV-01..INV-12`.

4. **Wave 4 — End-to-End (E2E) Testing trực tiếp trên Orca Browser (`orca-cli` skill):**
   - **Cơ chế có sẵn:** Hệ thống Orca đã tích hợp sẵn **Orca Embedded Browser** điều khiển trực tiếp qua skill **`orca-cli`** (`orca skills get orca-cli --reference references/browser.md`) với bộ lệnh:
     - `orca tab create --url <url>` / `orca tab list --json` (khởi tạo tab với `browserPageId` cố định).
     - `orca snapshot --page <id>` (đọc cây Accessibility DOM & trạng thái hiển thị thực tế).
     - `orca click --page <id> --element <ref>`, `orca fill --page <id> --element <ref> --value ...`, `orca eval --page <id> --expression ...`, và chụp ảnh nghiệm thu bằng `orca screenshot --page <id>`.
   - **Kịch bản E2E thực thi trên Orca Browser (Script điều phối lưu tại `dashboard_hmk/tests/e2e/run-orca-browser-e2e.sh`):**
     1. Khởi chạy server `pos.gui` (kết nối `report.api` / E2E fixture server từ `dashboard_hmk/tests/e2e/`) và mở trực tiếp trên **Orca Browser** (`orca tab create`).
     2. **Kiểm thử Bộ lọc đa chiều (`DashboardV2FilterBar`):** Dùng `orca click` & `orca snapshot` mở popover `Phân khúc hóa đơn`, xác nhận hiển thị đúng 6 mốc PA2 (`< 1 Tr`, `1–3 Tr`, `3–5 Tr`, `5–10 Tr`, `10–20 Tr`, `> 20 Tr`) và kiểm tra request gửi đi khi chọn mốc lọc.
     3. **Kiểm thử Tab Tổng quan (`ExecutiveView`):**
        - Xác nhận thẻ KPI `SỐ SP / ĐƠN (UPT)` và dòng `Trước VAT` trên thẻ `DOANH THU THUẦN`.
        - Xác nhận khối `CustomerSegmentGrowthChart`: hiển thị đủ 3 dòng (`Khách hàng mới`, `Khách hàng cũ (Quay lại)`, `Khách chưa định danh (KHACHLE)` với ô SL Khách là `—`) + dòng `Tổng cộng` khớp thẻ KPI; bấm chuyển đổi qua lại các tab chỉ số (`GMV`, `DTT`, `Số đơn`, `Số khách`).
        - Xác nhận `Bảng xếp hạng Hiệu suất Chi nhánh/Khu vực/Cụm` hiển thị và sort được các cột mới (`Thực thu`, `Số đơn`, `AOV`, `UPT`, `Bảo hành`).
     4. **Kiểm thử Tab Vận hành (`OperationalView`):**
        - Xác nhận biểu đồ `Phân khúc hóa đơn` hiển thị đủ 6 cột PA2 và panel `Tỷ lệ Hoàn / Trả & Bảo hành` hiển thị đúng `Số đơn bảo hành (Đơn đổi 0đ & Đơn thường 0đ)`, `SL SP bảo hành`, `Giá vốn / Giá trị bảo hành`.
        - Xác nhận 4 thẻ highlight `Thứ / Khung giờ bán tốt nhất & thấp nhất` trên `TimePeakChart` khi toggle giữa `Số lượng đơn` và `Doanh số (GMV)`.
        - Xác nhận cột `UPT` trên bảng `Hiệu quả Chiến dịch` và bấm toggle `Theo Cửa hàng` / `Theo Khu vực` kèm KPI Toàn hệ thống trên khối `Tỷ lệ chuyển đổi`.
     5. **Kiểm thử Tab Nhân sự (`PersonnelView`) & Quyền `gmvHidden`:**
        - Chuyển sang tab `Nhân sự`, kiểm tra cột `Giá trị Đổi/Trả` và `Bảo hành (Đơn / Giá trị)` trên `SalesLeaderboard`.
        - Kiểm thử kịch bản `gmvHidden = true` trên Orca Browser để xác nhận toàn bộ trường GMV mới đều được ẩn/mask đúng quy định.


---

## Phụ lục: Đặc tả Contract DTO C# (`report.api`) ↔ TypeScript (`pos.gui`)

Mọi Worker Backend và Frontend **bắt buộc** sử dụng chính xác tên trường dưới đây:

### 1. Module 1 — Bill Range PA2 (`0..5`)
- `DashboardV2DataAvailability.BasketUpperBounds`: `[1_000_000m, 3_000_000m, 5_000_000m, 10_000_000m, 20_000_000m]`
- Nhãn chuẩn (`Range`): `"< 1 Tr"`, `"1–3 Tr"`, `"3–5 Tr"`, `"5–10 Tr"`, `"10–20 Tr"`, `"> 20 Tr"` (6 buckets `0..5`).

### 2. Module 2 — Campaign & Executive Ranking
- **`CampaignItemV2Dto` (`OperationalDashboardV2Dto.cs`) / `CampaignItemV2` (`types.ts`):**
  - Thêm:
    - `public decimal? Upt { get; set; }` ↔ `upt?: number | null`
    - `public int UnitCount { get; set; }` ↔ `unitCount?: number`
- **`ExecutiveRankingItemV2Dto` & `ExecutiveRankingTotalV2Dto` (`ExecutiveDashboardV2Dto.cs`) / `ExecutiveRankingItem` & `ExecutiveRankingTotal` (`types.ts`):**
  - Thêm:
    - `public int GrossOrderCount { get; set; }` ↔ `grossOrderCount?: number`
    - `public decimal CollectedRevenueWithVat { get; set; }` ↔ `collectedRevenueWithVat?: number`
    - `public decimal? AovWithVat { get; set; }` ↔ `aovWithVat?: number | null`
    - `public decimal? Upt { get; set; }` ↔ `upt?: number | null`
    - `public int UnitCount { get; set; }` ↔ `unitCount?: number`
    - `public decimal ReturnValueWithVat { get; set; }` ↔ `returnValueWithVat?: number`
    - `public int WarrantyOrderCount { get; set; }` ↔ `warrantyOrderCount?: number`
    - `public decimal WarrantyValueWithVat { get; set; }` ↔ `warrantyValueWithVat?: number`

### 3. Module 3 — Customer Segment Growth (`ExecutiveDashboardV2Dto.cs` & `types.ts`)
- Endpoint: `POST /Admin/V2/Dashboard/Executive/CustomerGrowth` (trả về `DashboardV2BlockAdminDto<ExecutiveCustomerGrowthV2Dto>`) và trường `public DashboardV2BlockAdminDto<ExecutiveCustomerGrowthV2Dto>? CustomerGrowth { get; set; }` trong `ExecutiveDashboardV2Dto`.
- **`ExecutiveCustomerGrowthV2Dto` (`ExecutiveCustomerGrowthV2`):**
  - `New` (`new`): `CustomerSegmentMetricsV2Dto`
  - `Returning` (`returning`): `CustomerSegmentMetricsV2Dto`
  - `WalkIn` (`walkIn`): `CustomerSegmentMetricsV2Dto`
  - `Total` (`total`): `CustomerSegmentMetricsV2Dto`
  - `Trend` (`trend`): `List<CustomerSegmentTrendPointV2Dto>`
- **`CustomerSegmentMetricsV2Dto` (`CustomerSegmentMetricsV2`):**
  - `SegmentKey` (`"new" | "returning" | "walkIn" | "total"`)
  - `SegmentLabel` (`"Khách hàng mới" | "Khách hàng cũ (Quay lại)" | "Khách chưa định danh (KHACHLE)" | "Tổng cộng"`)
  - `CustomerCount` (`int?` — `null` cho `walkIn`)
  - `PreviousCustomerCount` (`int?` — `null` cho `walkIn`)
  - `CustomerGrowthRate` (`decimal?` — `null` cho `walkIn`)
  - `GrossOrderCount` (`int`)
  - `OrderCount` (`int`)
  - `PreviousOrderCount` (`int`)
  - `OrderGrowthRate` (`decimal?`)
  - `GmvWithVat` (`decimal?` — mask thành `null` khi `gmvHidden`)
  - `PreviousGmvWithVat` (`decimal?` — mask thành `null` khi `gmvHidden`)
  - `GmvShare` (`decimal?` — mask thành `null` khi `gmvHidden`)
  - `GmvGrowthRate` (`decimal?` — mask thành `null` khi `gmvHidden`)
  - `NetRevenueWithVat` (`decimal`)
  - `PreviousNetRevenueWithVat` (`decimal`)
  - `NetRevenueShare` (`decimal?`)
  - `NetRevenueGrowthRate` (`decimal?`)
  - `AovWithVat` (`decimal?`)
  - `PreviousAovWithVat` (`decimal?`)
  - `AovGrowthRate` (`decimal?`)
  - `Upt` (`decimal?`)
  - `PreviousUpt` (`decimal?`)
  - `UptGrowthRate` (`decimal?`)
  - `UnitCount` (`int`)
- **`CustomerSegmentTrendPointV2Dto` (`CustomerSegmentTrendPointV2`):**
  - `Label` (`string`), `StartDate` (`string`)
  - `NewCustomerCount` (`int`), `ReturningCustomerCount` (`int`)
  - `NewOrderCount` (`int`), `ReturningOrderCount` (`int`), `WalkInOrderCount` (`int`)
  - `NewGmvWithVat` (`decimal?`), `ReturningGmvWithVat` (`decimal?`), `WalkInGmvWithVat` (`decimal?`) — mask thành `null` khi `gmvHidden`
  - `NewNetRevenueWithVat` (`decimal`), `ReturningNetRevenueWithVat` (`decimal`), `WalkInNetRevenueWithVat` (`decimal`)

### 4. Module 5 & 6 — Warranty (Đơn 0đ) & Đổi trả (`OperationalDashboardV2Dto.cs`, `PersonnelDashboardV2Dto.cs`, `types.ts`)
- **`RefundRateV2Dto` (`RefundRateV2`):**
  - Thêm:
    - `WarrantyOrderCount` (`int`)
    - `ExchangeWarrantyOrderCount` (`int`)
    - `DirectWarrantyOrderCount` (`int`)
    - `WarrantyQuantity` (`int`)
    - `WarrantyValueWithVat` (`decimal`)
    - `WarrantyCostValue` (`decimal`)
    - `WarrantyOrderRate` (`decimal?`)
    - `ReturnQuantity` (`int`)
- **`PersonnelLeaderboardItemV2Dto` (`PersonnelLeaderboardItemV2`):**
  - Thêm:
    - `ReturnOrderCount` (`int`)
    - `ReturnValueWithVat` (`decimal`)
    - `WarrantyOrderCount` (`int`)
    - `WarrantyQuantity` (`int`)
    - `WarrantyValueWithVat` (`decimal`)
    - `WarrantyCostValue` (`decimal`)

### 5. Module 7 — Conversion Rate (`OperationalDashboardV2Dto.cs` & `types.ts`)
- **`ConversionSiteV2Dto` (`ConversionSiteV2`):**
  - Thêm: `RegionId` (`Guid?`), `RegionName` (`string?`), `ClusterId` (`Guid?`), `ClusterName` (`string?`)
- **`ConversionRegionV2Dto` (`ConversionRegionV2`):**
  - `RegionId` (`Guid?`), `RegionName` (`string`), `Traffic` (`int`), `Orders` (`int`), `ConversionRate` (`decimal?`), `SiteCount` (`int`)
- **`OperationalMockDataV2Dto` (`OperationalMockDataV2`):**
  - Thêm: `Regions` (`List<ConversionRegionV2Dto>`)
