# Báo Cáo Đối Chiếu Chỉ Số BOD — Dashboard V2 (Gap Analysis)

**Phạm vi kiểm tra (Read-only Audit):**
- `pos.gui`: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.gui/src/pages/dashboard-v2` & `services/dashboardV2Api.ts`
- `report.api`: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api/Src/{WebApi,Application,Domain}`
- `pos.api`: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/pos.api/Src/{Domain,Infrastructure}`

**Phân loại 4 nhóm trạng thái:**
1. **Nhóm 1 — Đã đáp ứng trên Dashboard V2:** Đã có đủ cả dữ liệu gốc (`pos.api`), xử lý/API (`report.api`) và giao diện hiển thị (`pos.gui`).
2. **Nhóm 2 — Đã có sẵn Data, cần bổ sung lên Dashboard V2:** Dữ liệu gốc trong `pos.api` và/hoặc `report.api` đã có sẵn, chỉ cần bổ sung thêm cột/thẻ/chart hoặc thêm trường vào API/UI.
3. **Nhóm 3 — Đã có trên Dashboard nhưng cần điều chỉnh cấu trúc/logic:** Widget và API đã có nhưng chia dải (bucket) hoặc chiều hiển thị chưa khớp với phương án BOD chốt.
4. **Nhóm 4 — Không có Data nguồn trên POS (Hoãn):** Hệ thống `pos.api` chưa lưu trữ thực thể hoặc trường dữ liệu nghiệp vụ này.

---

## 1. Bảng Tổng Hợp Phân Loại Nhanh (Executive Summary Matrix)

| Mã | Nhóm chỉ số BOD đã chốt | Đã đáp ứng (Nhóm 1) | Có sẵn Data, cần bổ sung UI/API (Nhóm 2) | Cần sửa cấu trúc bucket (Nhóm 3) | Chưa có Data nguồn (Nhóm 4) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **M1** | **Tổng quan Tài chính & Lũy kế** (`GMV`, `DTT`, `Thực thu`, `VAT`, `Đơn gộp/Volume`, `AOV`, `UPT`, `YTD`) | Đã có 9 thẻ KPI, Waterfall, GMV vs DTT, Lũy kế YTD, Hiệu quả đơn hàng (`AOV-Volume-UPT`), Xếp hạng Chi nhánh, Chiến dịch | • Thiếu **UPT** trên Thẻ KPI Tổng quan, Bảng Xếp hạng Chi nhánh & Bảng Chiến dịch<br>• Thiếu **Số đơn, AOV, Thực thu** trên Bảng Xếp hạng Chi nhánh<br>• Thiếu hiển thị **DTT Trước VAT** trên Thẻ DTT | — | — |
| **M2** | **Đơn hàng chưa hoàn thành (Order Aging)** (`0–5, 6–10, 11–20, >20 ngày` × 2 chặng, SL & Value) | Đã có đủ trên `OrderAgingChart.vue` & `DashboardV2Service.Operational.cs` (4 mốc × 2 chặng `Đặt hàng` & `Hoàn thành đơn hàng`, toggle SL / Giá trị) | — | — | — |
| **M3** | **Phân tích Sản phẩm đa chiều** (8 chiều theo `GMV` & `Số lượng`) | Đã có đủ cả 8 chiều (`Ngành hàng`, `Nhóm tròng`, `Nhóm gọng`, `Brand tròng`, `Brand gọng`, `NCC`, `Chiết suất`, `Màu sắc`) + `Ma trận phôi tròng SPH×CYL` + `Treemap` | — | — | — |
| **M4** | **Hiệu quả CTKM / Promotion / Campaign** (`GMV`, `DTT`, `Số đơn`, `AOV`, `UPT`) | Đã có bảng `Hiệu quả Chiến dịch` (`GMV`, `DTT`, `Số đơn`, `AOV`) lấy từ `ReportRevenueEvent.CampaignCode` | • Cần bổ sung cột **UPT** vào `CampaignItemV2Dto` (`report.api`) và bảng `campaign-table` (`OperationalView.vue`) | — | — |
| **M5** | **Nhân khẩu học khách hàng** (`Giới tính` & `Nhóm tuổi` theo `GMV` & `Số đơn %`) | Đã có đủ trên `DemographicCharts.vue` (Donut Giới tính, Cột Nhóm tuổi `<25, 25–34, 35–49, ≥50, Không xác định`, Tháp dân số, toggle `% Đơn` / `GMV`) | — | — | — |
| **M6** | **Phân khúc Hóa đơn - Bill Range theo PA2** (`<1, 1–3, 3–5, 5–10, 10–20, >20 Tr` theo SL & Value) | Đã có biểu đồ Donut + toggle `Theo số lượng` / `Theo giá trị (GMV)` trên `BasketRefundCharts.vue` | — | Hiện đang chia 5 mốc cũ (`<0.5, 0.5–1, 1–3, 3–5, >5 Tr`). Cần đổi `BasketUpperBounds` (`report.api`) & `BASKET_LABELS` (`pos.gui`) sang 6 mốc **PA2** | — |
| **M7** | **Thứ trong tuần & Khung giờ bán tốt nhất / chưa tốt nhất** (`Time Peak`) | Đã có lưới nhiệt `7 Thứ × 7 Khung giờ (8–22h)` kèm dòng `Σ giờ` và cột `Σ thứ`, toggle `Đơn hàng` / `GMV` (`TimePeakChart.vue`) | • Đã có sẵn tổng theo Thứ (`dayTotal`) và tổng theo Khung giờ (`hourTotal`), cần bổ sung **Thẻ/Banner highlight Thứ bán tốt nhất – thấp nhất & Khung giờ bán tốt nhất – thấp nhất** | — | — |
| **M8** | **Hình thức thanh toán** (theo `Phiếu thu`: Tiền mặt, CK, Thẻ, Ví/App, COD, Trả góp) | Đã có thanh 100% stacked bar theo Giá trị & Tỷ trọng % Phiếu thu (`M04`) trên `OperationalView.vue` | • Nếu BOD cần xem thêm **Số lượng phiếu thu** theo từng hình thức thanh toán: `ReportPaymentStatistic` đã có sẵn, chỉ cần thêm `ReceiptCount` vào `PaymentCell` & UI tooltip | — | — |
| **M9** | **Nhân sự & Top Staff** (`PIC Sales` theo Store / Khu vực / Toàn hệ thống / Chu kỳ) | Đã có `SalesLeaderboard.vue` (`#`, Nhân viên, Chi nhánh, `GMV`, `Tỷ trọng %`, `Số đơn`, `AOV`) lọc theo Store/Khu vực/Chu kỳ | • Có thể bổ sung thêm cột **UPT** cho từng PIC Sales (tính từ `ReportRevenueEventLine.Quantity`) | — | **KTV đo & KTV mài lắp** (Chưa gắn doanh số/lệnh Lab trên POS — đã chốt Hoãn) |
| **M10** | **Bảo hành / Đổi trả / Tỷ lệ hoàn tiền** (`M12, M13, M13b, M13c` & theo Sales) | Đã có biểu đồ 4 tỷ lệ `M12, M13, M13b, M13c` (`BasketRefundCharts.vue`) và cột `Tỷ lệ trả hàng` theo Chi nhánh (`ExecutivePerformanceRanking.vue`) | • **Đổi trả theo PIC Sales:** `ReportRevenueEvent` đã lưu `StaffId` trên các sự kiện `E4 (Trả hàng)`, `E5 (Kết thúc)`, `E6 (Hủy)` — cần bổ sung cột `Giá trị / Tỷ lệ hoàn trả` vào Bảng Xếp hạng PIC Sales | — | **Bảo hành khách hàng** (`pos.api` chỉ có `SupplierWarranty*` với NCC, không có bảng bảo hành khách lẻ — đã chốt Hoãn) |
| **M11** | **Conversion Rate** (`Top Store / Khu vực / Toàn hệ thống`) | Đã có biểu đồ `Tỷ lệ chuyển đổi cửa hàng` (`OperationalView.vue`) + tab `Tỷ lệ chuyển đổi` trên Heatmap (`BranchPerformanceHeatmapV2.vue`) + nhập/import `DashboardTrafficDaily` | • Cần bổ sung toggle gộp **Theo Khu vực** và dòng **Trung bình Toàn hệ thống** ngay trên widget `Conversion Rate` ở tab Vận hành | — | *(Lưu ý: POS không có máy đếm tự động; Traffic lấy từ bảng `DashboardTrafficDaily` nhập tay / import Excel)* |
| **M12** | **Tỷ lệ tăng trưởng đa chiều & Khách hàng mới/cũ toàn diện** | • Đã có Tăng trưởng `GMV, DTT, AOV, Volume, UPT` theo kỳ (`GrowthAnalysisChart.vue`)<br>• Đã có Tăng trưởng theo `Ngành / Nhóm SP / Brand / NCC` (`ProductGrowthChart.vue`)<br>• Đã có so sánh Store/Cụm/Khu vực (`ExecutivePerformanceRanking.vue`, `RegionalBenchmark.vue`)<br>• Đã có Thẻ `Khách hàng mới (M03)` & trục `Tỷ lệ khách quay lại (M18)` | • **Phân tích & Tăng trưởng Khách hàng mới vs Khách hàng cũ toàn diện:** Bảng `ReportCustomerFirstPurchase` và `ReportRevenueEvent` đã có đủ `CustomerId` & `FirstPurchaseDate`, nhưng **chưa có API & Biểu đồ tách Doanh số (GMV), DTT, Số đơn, AOV và % Tăng trưởng giữa nhóm Khách mới vs Khách cũ theo thời gian** | — | — |

---

## 2. Chi Tiết Bằng Chứng Kỹ Thuật Theo Từng Nhóm Chỉ Số (M1 → M12)

### M1. Tổng quan Tài chính & Lũy kế (Row 4, 5, 8, 9 + AOV, UPT)
* **Đã đáp ứng (Nhóm 1):**
  * **Backend (`report.api`):** `DashboardV2RevenueCalculator.cs:160-308` tính đầy đủ `Gmv` (Có VAT), `GmvWithoutVat` (Trước VAT), `VatAmount`, `AdjustmentWithVat`, `NetRevenue` (DTT), `Aov`, `Upt`, `GrossOrderCount (M02g)`, `OrderCount (M02)`. Doanh thu thực thu (`M04`) tính tại `DashboardV2Service.Revenue.cs:55` từ `ReportPaymentStatistic`. Công nợ (`M10`) tính từ `ReportCustomerDebtSnapshot.cs`.
  * **Frontend (`pos.gui`):**
    * `ExecutiveOverviewCards.vue`: Hiển thị 9 thẻ KPI (`GMV` kèm chú thích Trước VAT + VAT, `Khách hàng mới`, `Doanh thu thực thu`, `Giá trị điều chỉnh`, `Doanh thu thuần`, `Nợ treo`, `Biên LN gộp`, `Đơn hàng (Volume)` kèm chú thích Đơn gộp & Hủy/Kết thúc, `AOV` kèm chú thích Trước VAT).
    * `ExecutiveGmvNetRevenueChart.vue` & `ExecutiveRevenueWaterfall.vue` & `ExecutiveGmvBreakdownChart.vue`.
    * `ExecutiveCumulativeTrendChart.vue`: Biểu đồ Lũy kế YTD / Lũy kế kỳ so với Mục tiêu KPI theo `Ngày / Tuần / Tháng / Quý / Năm` cho `GMV`, `DTT`, `Nợ treo`.
    * `ExecutiveOrderEfficiencyChart.vue`: Biểu đồ chuyên sâu bộ 3 `AOV – Volume – UPT` theo chu kỳ.
* **Đã có sẵn Data nhưng cần bổ sung lên UI/API (Nhóm 2):**
  1. **Thẻ KPI Tổng quan (`ExecutiveOverviewCards.vue`):** Chưa hiển thị thẻ **UPT (`M09`)** (dù `ExecutiveKpiSummaryV2Dto.Upt` đã trả về từ API) và thẻ **DTT** chưa hiển thị dòng phụ `Trước VAT` (dù tính được ngay từ `NetRevenueWithVat - VatAmount` của dòng thuần).
  2. **Bảng Xếp hạng Chi nhánh / Khu vực / Cụm (`ExecutivePerformanceRanking.vue`):** Hiện tại mới hiển thị `GMV`, `Tỷ trọng GMV`, `DTT`, `Tỷ trọng DTT`, `% Đạt mục tiêu`, `Tỷ lệ trả hàng`. **Chưa hiển thị `Doanh thu thực thu (M04)`, `Số đơn (M02g/M02)`, `AOV (M08)`, `UPT (M09)`** (dữ liệu đã có sẵn trong `DashboardV2RevenueCalculator` và `ReportPaymentStatistic` theo `SiteId`).
  3. **Bảng Hiệu quả Chiến dịch (`OperationalView.vue:334-375`):** Đã hiển thị `GMV`, `DTT`, `Đơn hàng`, `AOV`, nhưng **thiếu cột `UPT`** (trong `DashboardV2OperationalCalculator.BuildCampaigns` tại `DashboardV2Service.Operational.cs:402-423`, biến `measures.Upt` đã được tính sẵn trong `DashboardV2RevenueCalculator.Calculate` nhưng chưa gán vào `CampaignItemV2Dto`!).

---

### M2. Đơn hàng chưa hoàn thành — Order Aging (Row 6, 7)
* **Đã đáp ứng 100% (Nhóm 1):**
  * **Backend (`report.api`):** `DashboardV2Service.Operational.cs:687` & `ReportService.DashboardV2.OrderAging.cs` tính tuổi đơn theo 4 mốc rời rạc (`0–5 ngày`, `6–10 ngày`, `11–20 ngày`, `> 20 ngày`) trên 2 chặng (`DatHang` - Đơn đặt chưa ra đủ Đơn hàng, và `HoanThanhDonHang` - Đơn hàng chưa hoàn thành), trả về cả `OrderCount` (Số lượng) và `Value` (Giá trị).
  * **Frontend (`pos.gui`):** `OrderAgingChart.vue:28-40,180-220` hiển thị biểu đồ cột chồng ngang 2 chặng × 4 mốc tuổi với nút chuyển đổi `Số lượng` / `Giá trị` và Modal xem chi tiết.

---

### M3. Phân tích Sản phẩm đa chiều (Row 10, 11)
* **Đã đáp ứng 100% (Nhóm 1):**
  * **Backend (`report.api`):** `DashboardV2Service.Product.cs:900-1045` (`QueryProductDimension`) đã hỗ trợ đầy đủ cả **8 chiều** yêu cầu của BOD (cộng thêm 2 chiều mở rộng):
    1. `ProductCategory` (Ngành hàng)
    2. `LensGroup` (Nhóm ngành hàng của tròng)
    3. `FrameGroup` (Nhóm ngành hàng của gọng)
    4. `LensBrand` (Thương hiệu tròng)
    5. `FrameBrand` (Thương hiệu gọng)
    6. `Supplier` (Nhà cung cấp)
    7. `RefractiveIndex` (Chiết suất — lấy từ `ReportRevenueEventLine.RefractiveIndex`)
    8. `Color` (Màu sắc — lấy từ `ReportRevenueEventLine.ColorName`)
    * *(Mở rộng thêm: `PriceSegment` và `CustomerGroup`)*.
  * **Frontend (`pos.gui`):** `ProductView.vue:72-83` có dropdown chọn đủ 10 chiều trên và toggle chuyển đổi giữa **Doanh số (`GMV`)** và **Số lượng (`Quantity`)**, kèm `ProductTreemap.vue`, `ProductOpticalMatrix.vue` (`SPH × CYL`) và `ProductBrandDistribution.vue`.

---

### M4. Hiệu quả CTKM / Promotion / Campaign (Row 12, 13)
* **Đã đáp ứng phần lõi (Nhóm 1) + Cần bổ sung UPT (Nhóm 2):**
  * **Nguồn dữ liệu (`pos.api` → `report.api`):** Đơn hàng lưu mã chiến dịch/voucher/CTKM, được đồng bộ vào `ReportRevenueEvent.CampaignCode` & `CampaignName`.
  * **Backend & UI hiện tại:** `DashboardV2Service.Operational.cs:1066-1116` (`QueryCampaigns`) và `OperationalView.vue:334-375` đã hiển thị bảng gồm: `Tên chương trình / Campaign`, `GMV`, `DTT`, `Đơn hàng (M02g)`, `AOV`.
  * **Cần bổ sung (Nhóm 2):** Thêm trường `Upt = measures.Upt` vào `CampaignItemV2Dto` (`DashboardV2Service.Operational.cs:412`) và thêm cột `UPT` trên bảng `OperationalView.vue`.

---

### M5. Nhân khẩu học khách hàng: Giới tính & Nhóm tuổi (Row 14, 15, 16, 17)
* **Đã đáp ứng 100% (Nhóm 1):**
  * **Nguồn dữ liệu (`pos.api`):** `Customer.cs:54-57` có sẵn `Birthday` (`DateTime?`) và `Gender` (`Genders?`).
  * **Backend (`report.api`):** `DashboardV2Service.Operational.cs:915-932` (`QueryDemographics`) nhóm theo `CustomerGender` và tuổi tính tại ngày phát sinh đơn (`< 25`, `25–34`, `35–49`, `≥ 50`, `Không xác định`) cho cả `Orders` và `Gmv`.
  * **Frontend (`pos.gui`):** `DemographicCharts.vue` hiển thị Donut Giới tính, Biểu đồ cột Nhóm tuổi, và Tháp dân số (Nam/Nữ), có nút chuyển đổi giữa **Tỷ trọng Số đơn (%)** và **GMV**.

---

### M6. Phân khúc Hóa đơn — Bill Range theo PA2 (Row 18, 19)
* **Cần điều chỉnh cấu trúc dải phân khúc sang PA2 (Nhóm 3):**
  * **Hiện trạng Backend (`report.api`):** `DashboardV2Service.Operational.cs:934-962` (`QueryBasketSize`) và `DashboardV2DataAvailability.BasketUpperBounds` đang chia cứng 5 dải theo Spec cũ: `< 0,5 Tr` · `0,5–1 Tr` · `1–3 Tr` · `3–5 Tr` · `> 5 Tr`, trả về đủ cả `OrderCount` (Số lượng đơn) và `Value` (GMV).
  * **Hiện trạng Frontend (`pos.gui`):** `BasketRefundCharts.vue:28,119-122` đã có nút chọn `Theo số lượng` / `Theo giá trị (GMV)`, nhưng mảng nhãn `BASKET_LABELS` đang cố định 5 mốc cũ.
  * **Việc cần làm:** Cập nhật `BasketUpperBounds` (`report.api`) và `BASKET_LABELS` / enum `BasketSegments` (`pos.gui`) sang 6 mốc **PA2** đã chốt: **`< 1 Tr` · `1–3 Tr` · `3–5 Tr` · `5–10 Tr` · `10–20 Tr` · `> 20 Tr`**.

---

### M7. Phân tích Thứ trong tuần & Khung giờ bán tốt nhất / chưa tốt nhất (Row 20, 21, 22, 23)
* **Đã có Heatmap & Dòng tổng (Nhóm 1) + Cần thêm Highlight Tốt nhất/Thấp nhất (Nhóm 2):**
  * **Hiện trạng (`report.api` & `pos.gui`):** `DashboardV2Service.Operational.cs:895-913` (`QueryTimePeak`) và `TimePeakChart.vue` đã hiển thị bảng nhiệt `7 Thứ (Thứ 2 – CN) × 7 Khung giờ (8–10h … 20–22h)` cho kênh Cửa hàng, có toggle `Theo Đơn hàng` / `Theo GMV`, có cột `Σ theo Thứ` (`dayTotal`) và dòng `Σ theo Khung giờ` (`hourTotal`).
  * **Việc cần bổ sung (Nhóm 2):** Trên `TimePeakChart.vue`, dữ liệu `dayTotal(day)` và `hourTotal(hour)` đã tính sẵn trên FE; chỉ cần bổ sung 2 thẻ tóm tắt / badge nhận xét tự động ngay trên đầu biểu đồ:
    * **Thứ bán tốt nhất / chưa tốt nhất trong tuần** (theo GMV / Số đơn).
    * **Khung giờ bán tốt nhất / chưa tốt nhất trong ngày & trong tuần** (theo GMV / Số đơn).

---

### M8. Hình thức thanh toán (Row 24)
* **Đã đáp ứng theo Giá trị & Tỷ trọng Phiếu thu (Nhóm 1) + Có sẵn data Số lượng phiếu (Nhóm 2):**
  * **Hiện trạng (`report.api` & `pos.gui`):** `DashboardV2Service.Operational.cs:1004-1064` (`QueryPaymentMethods`) truy vấn trực tiếp từ `Db.ReportPaymentStatistic` (cùng tập phiếu thu thực thu `M04`), phân loại qua `DashboardV2PaymentClassifier` thành 6 nhóm: `Tiền mặt` · `Chuyển khoản` · `Thẻ (POS)` · `Ví điện tử (App đối tác)` · `COD (online)` · `Trả góp` (+ `Khác`). `OperationalView.vue:292-324` hiển thị thanh tỷ trọng 100% kèm số tiền.
  * **Có thể bổ sung nhẹ (Nhóm 2):** Hiện API chỉ cộng `Sum(x => x.ActualAmount)` (Giá trị). Nếu BOD muốn xem thêm **Số lượng phiếu thu** của từng phương thức thanh toán, chỉ cần thêm `Count()` vào `QueryPaymentMethods` và hiển thị trong tooltip/bảng.

---

### M9. Hiệu suất Nhân sự & Top Staff (Row 26, 27, 30)
* **Đã đáp ứng cho PIC Sales (Nhóm 1) | Hoãn KTV đo & KTV mài lắp (Nhóm 4):**
  * **PIC Sales (Nhóm 1):** `DashboardV2Service.Personnel.cs` và `SalesLeaderboard.vue` đã hiển thị Bảng xếp hạng PIC Sales (`#`, Nhân viên, Chi nhánh, `GMV`, `Tỷ trọng GMV %`, `Số đơn`, `AOV`), đáp ứng lọc theo **Store / Cụm / Khu vực / Toàn hệ thống** và theo **Chu kỳ / Khoảng ngày** trên thanh lọc chung.
  * **KTV đo & KTV mài lắp (Nhóm 4 - Đã chốt Hoãn):** Kiểm tra trong `pos.api` xác nhận `SaleOrder` chỉ có `StaffId` (PIC Sales); có bảng `MeasurementTicket.cs` (phiếu đo mắt) nhưng chưa liên kết tính doanh số/chuyển đổi KTV và hoàn toàn không có bảng Lệnh gia công Lab / KTV mài lắp.

---

### M10. Bảo hành / Đổi trả / Tỷ lệ hoàn tiền (Row 28, 32)
* **Đã đáp ứng Tỷ lệ hoàn trả cấp Hệ thống/Chi nhánh (Nhóm 1) | Cần bổ sung Đổi trả theo PIC Sales (Nhóm 2) | Không có data Bảo hành (Nhóm 4):**
  * **Đã đáp ứng (Nhóm 1):**
    * `BasketRefundCharts.vue:63-112` hiển thị biểu đồ 4 cột: `M12 Tỷ lệ trả hàng (theo GMV)`, `M13 Tỷ lệ trả hàng (theo Hóa đơn)`, `M13b Tỷ lệ đổi hàng (Đơn đặt Kết thúc)`, `M13c Tỷ lệ hủy (Đơn đặt)`.
    * `ExecutivePerformanceRanking.vue` hiển thị cột `Tỷ lệ trả hàng` theo từng Khu vực / Cụm / Chi nhánh (tô đỏ khi > 12%).
  * **Đã có sẵn Data, cần bổ sung lên UI/API (Nhóm 2):**
    * **Đổi trả / Hoàn hủy theo PIC Sales:** Trong `report.api`, bảng `ReportRevenueEvent` đã lưu `StaffId` (người bán của đơn gốc) trên các sự kiện `E4 (Returned)`, `E5 (PreOrderEnded)`, `E6 (PreOrderCancelled)`. Tuy nhiên `SalesLeaderboard.vue` hiện chỉ hiển thị `GMV, Số đơn, AOV` mà chưa hiển thị cột `Giá trị / Tỷ lệ Đổi trả` theo từng PIC Sales.
  * **Không có Data nguồn (Nhóm 4 - Đã chốt Hoãn):**
    * `pos.api` không có bảng `Warranty` cho khách hàng lẻ (chỉ có `SupplierWarranty*` làm việc với nhà cung cấp).

---

### M11. Conversion Rate (Row 31)
* **Đã đáp ứng theo Store (Nhóm 1) + Cần bổ sung chế độ gom theo Khu vực / Toàn hệ thống trên widget Operational (Nhóm 2):**
  * **Hiện trạng:**
    * Bảng `DashboardTrafficDaily` (`ReportService.DashboardV2.Traffic.cs`) lưu Traffic cửa hàng (nhập tay trên UI hoặc import Excel qua `DashboardImportModal.vue`).
    * `OperationalView.vue:206-218` hiển thị danh sách **Top Store** theo `Conversion Rate` (`M14 = Số đơn cửa hàng / Traffic`).
    * `BranchPerformanceHeatmapV2.vue` (trang Tổng quan) đã có tab `Tỷ lệ chuyển đổi` với nút chuyển đổi xem theo **Khu vực / Cụm / Chi nhánh**.
  * **Cần bổ sung nhẹ (Nhóm 2):** Ngay trên widget `Tỷ lệ chuyển đổi cửa hàng` ở tab Vận hành (`OperationalView.vue`), bổ sung thêm chỉ số **Conversion Rate Toàn hệ thống** ở header và nút gộp theo **Khu vực / Cụm** (dữ liệu đã được `DashboardV2OperationalCalculator.BuildConversion` tại `DashboardV2Service.Operational.cs:40-48` tính sẵn `TotalTraffic`, `TotalOrders`, `ConversionRate` toàn phạm vi!).

---

### M12. Tỷ lệ tăng trưởng đa chiều & Khách hàng mới/cũ toàn diện (Row 33, 34)
* **Đã đáp ứng Tăng trưởng kỳ / Cụm-Store / Sản phẩm (Nhóm 1):**
  * **Tăng trưởng `GMV / DTT / AOV / Volume / UPT` so với kỳ trước / cùng kỳ:** Đã có trên `GrowthAnalysisChart.vue` (trang Tổng quan) theo `Ngày / Tuần / Tháng / Quý / Năm`.
  * **So sánh giữa các Store trong Cụm / Khu vực / Toàn hệ thống (có chart):** Đã có trên `BranchPerformanceHeatmapV2.vue` (Heatmap), `ExecutivePerformanceRanking.vue` (Bảng xếp hạng) và `RegionalBenchmark.vue` (Biểu đồ Radar 6 trục so sánh Chi nhánh với TB Khu vực / TB Toàn hệ thống).
  * **Tăng trưởng theo Ngành hàng / Nhóm SP / Brand / Supplier:** Đã có trên `ProductGrowthChart.vue` (`DashboardV2Service.Product.cs:710-855`) với bộ chọn so sánh **Kỳ liền trước** hoặc **Cùng kỳ năm trước**.
* **Đã có sẵn Data nhưng CHƯA CÓ Biểu đồ Tăng trưởng Khách hàng mới vs Khách hàng cũ toàn diện (Nhóm 2):**
  * **Hiện trạng trên UI:** Mới chỉ có Thẻ KPI `Khách hàng mới (M03 - số lượng khách)` trên `ExecutiveOverviewCards.vue` và 1 trục `Tỷ lệ khách quay lại (M18 - %)` trên biểu đồ Radar (`RegionalBenchmark.vue`).
  * **Trạng thái Data trong `report.api`:** Bảng `ReportCustomerFirstPurchase` (`ReportService.DashboardV2.FirstPurchase.cs`) đã lưu ngày mua đầu tiên (`FirstEventDate`, `FirstRootOrderId`) của từng `CustomerId` (đã loại `KHACHLE`), và `ReportRevenueEvent` lưu toàn bộ giao dịch theo `CustomerId` & `EventDate`.
  * **Cần bổ sung (Nhóm 2):** Viết thêm 1 endpoint/query trong `report.api` join `ReportRevenueEvent` với `ReportCustomerFirstPurchase` (nếu `EventDate == FirstEventDate` hoặc `RootOrderId == FirstRootOrderId` → **Khách mới**, ngược lại → **Khách cũ/quay lại**) và thêm 1 widget/chart trên `pos.gui` hiển thị đầy đủ:
    * **Số lượng khách · Số lượng đơn · Doanh số (GMV) · Doanh thu thuần (DTT) · AOV** tách riêng **Khách mới vs Khách cũ**.
    * **Đường xu hướng & % Tăng trưởng** của nhóm **Khách mới** và nhóm **Khách cũ** qua các chu kỳ (`Tuần / Tháng / Quý / Năm`).
