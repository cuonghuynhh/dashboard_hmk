# QC-B — Kiểm tra backend các module Vận hành, Sản phẩm, Nhân sự, KPI, Traffic, Heatmap, Phân quyền, Bộ lọc/Cache

- Phạm vi: phase 1, chỉ đọc code, không sửa. Đối chiếu `PRODUCT_SPEC_DASHBOARD.md` v2.0.
- Code: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api` (main @ c6f2324). Mọi đường dẫn `file:dòng` bên dưới tính từ `report.api/Src/` (test từ `report.api/Tests/`).
- Không trùng việc với agent khác: công thức GMV/DTT lõi, ingestion/sync, service Executive chỉ được dẫn chiếu.
- Viết tắt file: `OP` = `Application/Services/DashboardV2/DashboardV2Service.Operational.cs`; `PRD` = `.Product.cs`; `PER` = `.Personnel.cs`; `BP` = `.BranchPerformance.cs`; `BASE` = `._Base.cs`; `DA` = `DashboardV2DataAvailability.cs`; `FC` = `DashboardV2FormulaCatalog.cs`; `CTL` = `WebApi/Controllers/Admins/V2/DashboardV2Controller.cs`; `AGE` = `Application/Services/Report/ReportService.DashboardV2.OrderAging.cs`; `EXE` = `.Executive.cs`.

---

## (0) Tóm tắt điều hành

1. Mô hình dữ liệu của backend cho các trang này là mô hình "net revenue không VAT" (`NetRevenueNoVat`, `DashboardNetRevenueNoVat`, `PaidAmount`), KHÔNG phải GMV theo QĐ-01. Ngoại lệ: nhóm "Operational" dùng Sale hoàn thành (không tính Đơn đặt ở Đơn tạm). Hậu quả: hầu hết tổng tiền ở Vận hành, Sản phẩm, Nhân sự không thể khớp M01 (vi phạm INV-05, INV-09, INV-11, BR-DIM-02).
2. **Không có row-level security.** `EnsureRequestedScope` đã bị comment phần kiểm tra chi nhánh (`BASE:91-105`). `QueryExecutiveSites` (`EXE:1101`) trả mọi chi nhánh Active khi không truyền khu vực. Quyền chỉ là 1 scope chung `manager.dashboard.read`, dùng cho cả đọc, ghi KPI, ghi Traffic. Không có khái niệm BOD/MANAGER/STAFF ở server. Vi phạm BR-ROLE-02, AC-ROLE-01..05 (Nghiêm trọng).
3. "Quyền GMV" (`manager.dashboard-v2.gmv.read`) chỉ là ẩn ở frontend. Report API không kiểm tra mã này; response vẫn trả GMV cho mọi người có quyền Dashboard chung (xác nhận bằng grep: không có mã này trong report.api).
4. Dữ liệu mock/hard-code vẫn chảy ra API: Chiến dịch (luôn fixture), Conversion fallback (Visit 1000/Consultation 420/Order 210), Personnel (bảng xếp hạng demo "Lê Văn C…" khi rỗng, WeeklyKpi, Gamification, KTV khúc xạ, Lab). Vi phạm BR-DATA-01, QĐ-08, QĐ-13 (mock bị gắn cờ `DataStatus=Mock` nhưng vẫn là số giả).
5. Order Aging chỉ có 3 nhóm tuổi (5–10, 11–20, >20), không có công đoạn (Mài lắp, Vận chuyển), không có nhóm 0–5; dựa trên pre-order nháp. Basket có 4 nhóm (thiếu 3–5 và >5 Tr). Nhân khẩu học dùng nhóm tuổi sai (<18, 18–29…), không phải <25/25–34/35–49/≥50. Thanh toán có 4 nhóm thay vì 6.
6. Anomaly dùng cửa sổ 5 ngày, độ lệch chuẩn tổng thể (population), và chuỗi chỉ lấy trong khoảng lọc (5 ngày đầu không có lịch sử); chỉ số là `PaidAmount` (thực thu), không phải DTT/Số đơn/Tỷ lệ trả. Spec: 7 ngày trước, σ mẫu, k=2, 3 chỉ số.
7. Product/Personnel thiếu: ma trận SPH×CYL, Thương hiệu phân phối (block riêng), SS/ROP (QĐ-15), chiều NCC/chiết suất/màu/nhóm KH; Top-3 "Nhân viên xuất sắc"; góc nhìn STAFF; Lab đúng hạn/hư hao thật. Chỉ lọc Ngành hàng/Thương hiệu được áp; Giới tính/Phân khúc/PIC/Trạng thái bị bỏ qua ở Sản phẩm.
8. KPI: có KpiV2 (plan/version/scope/conflict/snapshot) nhưng (a) scope có `Staff` (trái QĐ-08), (b) chỉ một metric tiền "Revenue" (không tách GMV/DTT), (c) KPI thuộc `AccountId` người tạo nên MANAGER không thấy KPI của BOD, (d) không có phân bổ theo ngày, chiến dịch ghi đè, rollup, tự động "Đã kết thúc", import Excel. Dashboard (Executive, Heatmap) vẫn đọc bảng cũ `SaleTarget`, KHÔNG đọc KpiV2. `data-store-kpi.md` (61 cửa hàng, mục tiêu ngày thường/cuối tuần) khớp `SaleTarget.DayType`, không biểu diễn được trong KpiV2.
9. Traffic: lưu theo (AccountId, SiteId, Ngày) nên mỗi tài khoản có bộ Traffic riêng (BOD nhập, MANAGER không thấy). Không có Excel import, xem trước, lịch sử người sửa, chặn ngày tương lai, kiểm tra quyền theo cửa hàng. Chỉ có `Version` để khóa lạc quan.
10. Heatmap: endpoint V2 `BranchPerformance` chỉ trả tổng theo chi nhánh (không bucket, `Traffic`/`Conversion` luôn null, `EXE:278-279`). Heatmap cũ (`ReportController.BranchPerformanceHeatmap`) có bucket nhưng tuần = 7 ngày từ ngày bắt đầu (không phải ISO), mẫu số là `SaleAmount - ReturnAmount` (không phải GMV), thang trạng thái 4 mức (không phải 11 mức), nhãn "một phần" thiếu, và không nằm sau scope Dashboard.
11. Cache key tốt: gồm AccountId và mọi chiều lọc, không có rò rỉ chéo tài khoản qua key. Rủi ro còn lại: key không gồm phạm vi site hiệu lực nên khi RLS được bổ sung phải thêm phạm vi vào key; TTL 2 giờ so với NFR-02 (15 phút) chỉ được bù bằng `Invalidate()` sau sync.
12. Test hiện hành thừa nhận thiết kế sai (`PersonnelDemoFixturesMatchTheReferenceDashboard`, `AllV2ControllersUseTheSharedDashboardScope…` cấm chữ BOD/MANAGER/STAFF) và có 1 test lệch code (`Dashboard = "manager.dashboard"` trong test, trong code là `"manager.dashboard.read"`).

Thống kê mức độ trong bảng (1), khoảng: Nghiêm trọng 35 · Lớn 65 · Nhỏ 14 (có hàng đạt không tính mức).

---

## (1) Bảng phát hiện theo module

Quy ước cột "Kết quả": Đạt / Không đạt / Một phần / Chưa xác minh (cần dữ liệu thật hoặc sync).

### 1.1. Vận hành & Khách hàng (§7.2, FR-OP-01..10)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| OP-01a | Công đoạn Order Aging | Đọc query `BuildAggregateQuery` | Hàng = Mài lắp, Vận chuyển; chỉ đơn chưa hoàn thành công đoạn | Không có chiều công đoạn. Chỉ đếm pre-order trạng thái `PRE_ORDER_DRAFT`, chưa hoàn thành/hủy | Không đạt | Lớn | `AGE:14-98` |
| OP-01b | Không có "Đo khám" | grep | Không có | Không có (đạt do thiếu công đoạn nói chung) | Đạt | — | `AGE`, `DA` |
| OP-01c | Nhóm tuổi 0–5/6–10/11–20/>20 | Đọc ranh giới | 4 nhóm | 3 nhóm 5–10, 11–20, >20; bỏ đơn tuổi <5 ngày (`CreatedAtSource < today-4`). Enum thừa `LessThanOneDay`, `OneToFiveDays`. Test khẳng định "excludes younger than five days" | Không đạt | Lớn | `AGE:69-89,100-129`; `DashboardV2OperationalTests.cs:58` |
| OP-01d | Tuổi tính tới "Đến ngày" | Đọc | Tuổi = từ lúc vào công đoạn đến cuối ngày "Đến ngày" | Tính tới `now` (ngày hiện tại VN), và tuổi tính từ `CreatedAtSource` (ngày tạo), không phải ngày vào công đoạn. Còn lọc đơn theo khoảng ngày TẠO nằm trong [Từ, Đến) – không có trong spec | Không đạt | Lớn | `AGE:66,83,139-148` |
| OP-01e | Toggle Số lượng/Giá trị | DTO | Σ giá trị đơn | Có `OrderCount`, `Value` (= `NeedPayAmount`, null thì tính 0 và gắn `IsValueComplete=false`) | Một phần | Nhỏ | `AGE:94-95` |
| OP-02a | Time Peak: chỉ kênh cửa hàng | Đọc `QueryTimePeak` | Chỉ kênh cửa hàng | Không có khái niệm kênh trong `ReportSite`/`ReportOrderStatistic`; lấy mọi chi nhánh trong phạm vi | Không đạt | Lớn | `OP:499-532`; grep `channel` trống |
| OP-02b | Time Peak: khung giờ & GMV | Đọc | 7 khung 2 giờ (8–22h); Σ ô (GMV) = GMV cửa hàng | Trả theo từng giờ 0–23 (UTC+7 cố định), Revenue = `NetRevenueNoVat`; chỉ đơn Sale hoàn thành, không gồm Đơn đặt ở Đơn tạm; không báo số đơn ngoài khung | Không đạt | Nghiêm trọng | `OP:517-528` |
| OP-02c | Tính xác định | grep Random | Ổn định | Không có Random; thứ tự ổn định | Đạt | — | `OP:529-530` |
| OP-03a | Nhóm tuổi | Đọc `GetAgeGroup` | <25, 25–34, 35–49, ≥50, Không xác định | `Under18, 18-29, 30-39, 40-49, 50-59, 60+, Unknown`. Hàm đúng spec (`FC.AgeGroup`) tồn tại nhưng không được dùng | Không đạt | Lớn | `OP:287-305`; `FC:214-230` |
| OP-03b | Σ GMV demographics = M01 | Đọc `QueryDemographics` | Σ = M01; tổng % = 100 | Loại đơn `CustomerId == null` (khách lẻ), dùng `NetRevenueNoVat`, chỉ Sale hoàn thành; gom theo (khách, giới, ngày sinh) nên `PurchaseCount` = số đơn nhưng nhóm tuổi tính theo `endAt` (tuổi tại cuối kỳ), spec: theo hồ sơ tại lúc tạo đơn | Không đạt | Nghiêm trọng | `OP:534-564` |
| OP-04a | Dải Basket | Đọc `BasketUpperBounds` | <0,5 / 0,5–1 / 1–3 / 3–5 / >5 Tr | Chỉ 3 ngưỡng → 4 nhóm (<0,5/0,5–1/1–3/>3). Thiếu 3–5 và >5. Biên: `<0,5`, `<1`, `<=3` | Không đạt | Lớn | `DA:28-29`; `OP:566-615`; `FC:203-212` |
| OP-04b | Giá trị đơn & tổng = M02g | Đọc | Giá trị đơn theo BR-VAL-03 (gồm VAT), Σ số đơn = M02g | Dùng `NetRevenueNoVat` (không VAT), chỉ Sale hoàn thành, không gồm Đơn đặt tạm → Σ ≠ M02g | Không đạt | Nghiêm trọng | `OP:575-596` |
| OP-04c | Lọc Phân khúc hóa đơn | Đọc | Áp cho mọi widget có chiều (BR-FLT-09) | Chỉ làm số của chính widget này về 0 cho các bucket không chọn, không loại đơn khỏi widget khác | Không đạt | Lớn | `OP:599-613` |
| OP-05a | 6 nhóm thanh toán | Đọc `BuildPaymentMethods` | Tiền mặt, Chuyển khoản, Thẻ (POS), Ví điện tử, COD, Trả góp | Chỉ CASH/TRANSFER/CARD, còn lại gom "Khác" (hiện khi có). Thiếu ví điện tử, COD, trả góp | Không đạt | Lớn | `OP:155-189` |
| OP-05b | Tỷ trọng theo giá trị phiếu thu, Σ = M04 | Đọc `QueryPaymentMethods` | Σ = M04 (E8, theo ngày thu) | Lọc theo `IssueAt` (không phải ngày thu); `CompleteAt` lấy `Max` của nhóm rồi lọc `!= null` SAU gom nhóm (nên phiếu chưa hoàn thành trong cùng nhóm vẫn bị cộng); `CancelAt` không được chọn nên luôn null → phiếu hủy không bị loại; chỉ `CUSTOMERPAID`; có lọc StaffIds | Không đạt | Nghiêm trọng | `OP:684-705`, `OP:160-163` |
| OP-06 | Hiệu quả chiến dịch | Đọc | Bảng Chiến dịch / GMV / DTT / Số đơn / AOV từ mã chiến dịch trên đơn | Luôn trả fixture "Khách hàng thân thiết 120", "Tái kích hoạt 80"; không có mã chiến dịch trong fact | Không đạt | Nghiêm trọng | `OP:387-394,481-483`; `DA:211-216` |
| OP-07a | Benchmark: 6 trục | Đọc `QueryRegionalBenchmark` | DTT, M14, AOV, Traffic, M18, M19 | Có Revenue, Aov, ReturningCustomerRate, Csat, Traffic, Conversion theo chi nhánh. Backend KHÔNG tính Index = A/B×100 và không có "Trung bình khu vực" / "Trung bình hệ thống" | Một phần | Lớn | `OP:721-826`; `OP:230-265` |
| OP-07b | Trục thiếu dữ liệu hiển thị "—" | Đọc `BuildRegionalBenchmark` | Giữ chi nhánh, trục thiếu = null | Loại hẳn chi nhánh không có Traffic (`Traffic > 0`) | Không đạt | Lớn | `OP:236` |
| OP-07c | M18 đúng định nghĩa | Đọc | Khách có đơn trong kỳ và đã có đơn trước kỳ / khách có đơn trong kỳ | Tính `SaleCount > 1` TRONG kỳ (khách mua ≥2 lần trong kỳ), không xét lịch sử trước kỳ | Không đạt | Nghiêm trọng | `OP:753-768` |
| OP-07d | M19 theo thang nguồn | Đọc | Trung bình điểm theo thang nguồn (NPS/CSAT) | Trung bình 1–5 từ `ReportRating`, gọi là Csat | Chưa xác minh | Nhỏ | `OP:770-790` |
| OP-07e | Chọn "Phân tích/So với" | Controller | Dùng `BenchmarkAId/BenchmarkBId` | Chỉ dùng để lọc danh sách chi nhánh (`SelectBenchmarkSites`); không cho Khu vực; không chặn chọn chính nó | Một phần | Lớn | `OP:876-887` |
| OP-08a | Cửa sổ MA/σ | Đọc `AnomalyBand` | 7 ngày trước, không gồm ngày xét, σ mẫu | Cửa sổ `AnomalyWindowSize = 5`; σ tổng thể (chia N, `.Average()`); ngày <5 lịch sử không đánh giá. Cửa sổ lấy từ `values.Skip(index-window)` nên không gồm ngày hiện tại (đúng) | Không đạt | Nghiêm trọng | `FC:9,232-262`; `OP:204-210` |
| OP-08b | Lịch sử trước kỳ lọc | Đọc `QueryAnomaly` | Ngày đầu kỳ vẫn đánh giá được (cần 7 ngày trước kỳ) | Chỉ truy vấn trong [Từ, Đến]; 5 ngày đầu luôn "Unavailable" | Không đạt | Lớn | `OP:649-655` |
| OP-08c | Chỉ số | Đọc | DTT / Số đơn / Tỷ lệ trả hàng, chọn thực thể | Một chỉ số duy nhất `PaidAmount` (Sale + Exchange). `filter.Metric`, `Dimension` bị bỏ qua. Phiên bản công thức tự ghi "anomaly-paid-revenue" | Không đạt | Lớn | `OP:651-668`; `FC:7` |
| OP-08d | Ngưỡng k=2, cấu hình | Đọc | k=2 cấu hình | Hard-code `2d`; dải dưới kẹp ≥0; dùng `<`/`>` chứ không `>`. ZScore chia σ=0 → 0 | Một phần | Nhỏ | `FC:249-251` |
| OP-08e | AC-OP08-01 (100,102,98,101,99,100,103 rồi 130) | Tính tay | Ngày 8 bất thường | Cửa sổ 5 ngày cuối (98,101,99,100,103): MA 100,2, σ tổng thể ≈1,6 → 130 vẫn bị đánh dấu; kết quả đúng nhưng bằng công thức sai (xem OP-08a), có thể lệch ở ca biên | Chưa xác minh | Nhỏ | `OP:206-208` |
| OP-09a | M14 chỉ cửa hàng, cặp có Traffic | Đọc `QueryConversionRate` | Loại cặp (chi nhánh, ngày) thiếu Traffic khỏi cả tử và mẫu; hiển thị số ngày thiếu | Tử = toàn bộ số đơn Sale trong phạm vi; mẫu = tổng Traffic có nhập → khi thiếu ngày, M14 bị thổi phồng | Không đạt | Nghiêm trọng | `OP:836-857` |
| OP-09b | "Chưa có Traffic" thay vì 0% | Đọc | "Chưa có Traffic" | Khi Traffic ≤ 0 trả fixture Visit 1000/Consultation 420/Order 210, `DataStatus=Mock`. Không trả theo chi nhánh/khu vực (chỉ 1 tổng) | Không đạt | Nghiêm trọng | `OP:849-855`; `DA:218-224` |
| OP-09c | Dùng M02g (có Đơn đặt) | Đọc | M02g | Đếm Sale hoàn thành ở `ReportOrderStatistic`, không gồm Đơn đặt tạm | Không đạt | Lớn | `OP:841-847` |
| OP-10a | M12 | Đọc `QueryRefundRate` | M05a/M01 | `DashboardReturnNetRevenueNoVat / DashboardSaleNetRevenueNoVat` (không VAT, mẫu số là DTT-sale chứ không phải GMV) | Không đạt | Nghiêm trọng | `OP:622-642`; `FC:54` |
| OP-10b | M13 | Đọc | Số đơn gốc có trả / M02g | `ReturnOrderCount / SaleOrderCount` – mẫu số là SaleOrderCount (khác M02g nếu không tính Đơn đặt); chưa xác minh DISTINCT đơn gốc | Chưa xác minh | Lớn | `OP:130-135` |
| OP-10c | M13b, M13c | DTO | Có đủ 4 tỷ lệ | `RefundRateV2Dto` chỉ có OrderRate/ValueRate. Thiếu đổi hàng từ đơn đặt (Kết thúc) và hủy đơn đặt | Không đạt | Lớn | `OperationalDashboardV2Dto.cs:76-89` |
| OP-10d | Khớp Waterfall | So AC-OP10-01 | M12×M01 = cột Trả hàng Waterfall | Nguồn `ReportOrder.ProductCategoryId == null` (khác nguồn Waterfall?) – cần đối chiếu với Executive | Chưa xác minh | Lớn | `OP:622-635` |
| OP-X1 | Mock/random | grep | Không có | Không có `Random`; có fixture tĩnh (xem mục 2) | Một phần | Nghiêm trọng | mục (2) |
| OP-X2 | Lọc đa chiều | Đọc | BR-FLT-09: áp mọi widget có chiều | `CategoryIds`, `BrandIds`, `OrderStatuses` bị bỏ qua ở toàn bộ Vận hành. `Genders` chỉ ở demographics. `StaffIds` chỉ ở time-peak và payment. Không có thông báo "Không áp dụng bộ lọc" | Không đạt | Lớn | `OP:313-417` |
| OP-X3 | Biên thời gian | Đọc | Bao gồm cả ngày "Đến ngày" | Hầu hết dùng `IssueAt < endAtUtc`; anomaly dùng `<=`; hai quy ước khác nhau cùng 1 request (phụ thuộc FE gửi EndAt là cuối ngày hay đầu ngày hôm sau) | Chưa xác minh | Lớn | `OP:510,655` |

### 1.2. Sản phẩm & Tồn kho (§7.3, FR-PR-01..06)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| PR-01a | Chỉ số dùng GMV (BR-DIM-02) | Đọc mọi query `ReportProduct` | GMV và số lượng | Toàn bộ dùng `DashboardNetRevenueNoVat` (nhãn DTO là `Revenue`). Σ ngành ≠ M01 (INV-05, INV-11) | Không đạt | Nghiêm trọng | `PRD:1005,1039,1126,1198` |
| PR-01b | Tăng trưởng GMV: kỳ liền trước / cùng kỳ năm | `GetComparisonRange` | `[S−n, S−1]` hoặc cùng kỳ năm trước | Dùng WoW (−7 ngày), MoM (−1 tháng), YoY (−1 năm), không phải "n ngày liền trước" (BR-CMP-01). Với kỳ >7 ngày WoW chồng lấn kỳ gốc | Không đạt | Lớn | `FC:263-282` (hàm `GetComparisonRange`) |
| PR-01c | Top 5 theo GMV | Đọc `BuildCategoryHierarchyGrowth` | Top 5 hoặc 1 thực thể | `limit` 20/50/100/200; không có tham số "1 thực thể"; mặc định 20 | Không đạt | Lớn | `ProductGrowthInputAdminDto` (`DashboardV2InputAdminDto.cs:257-302`); `PRD:54-99` |
| PR-01d | Mẫu số 0 → "—" | Đọc | "—" | `?? 0m` → trả 0 tăng trưởng thay vì "—" | Không đạt | Lớn | `PRD:40-45` |
| PR-01e | Tab chiều Ngành/Nhóm SP/Thương hiệu/NCC | Đọc | 4 chiều | Có Ngành hàng (cấp phân cấp `HierarchyLevel` 0–5) và Thương hiệu. Thiếu NCC | Một phần | Lớn | `PRD:554-620` |
| PR-01f | Không phân loại vòng đời | grep | Không có | Không có phân loại (đạt). Nhưng tồn tại `IsDeadStock` ở Inventory (QĐ-14 chỉ cấm vòng đời; dead-stock không bị cấm rõ) | Đạt | Nhỏ | `PRD:403` |
| PR-02a | Chiều phân tích | Đọc `GetProductDimensionAnalysis` | Ngành, Nhóm tròng, Nhóm gọng, TH tròng, TH gọng, NCC, Chiết suất, Màu, Phân khúc giá, Nhóm KH | Chỉ `ProductCategory` (theo nhóm cha/con của danh mục) và `PriceSegment`. Phân khúc giá trả `Revenue = null` (chỉ số lượng), thuộc dải 0,5/1/3 Tr | Không đạt | Lớn | `PRD:276-322,639-683` |
| PR-02b | Σ chiều cùng cấp = M01; Σ TH tròng = GMV Tròng | Suy luận | Khớp | Do PR-01a và nhóm `ProductCategoryId=null`, không bảo đảm; không có kiểm INV-05 trong test | Không đạt | Nghiêm trọng | `PRD:283-294` |
| PR-03a | Treemap phân cấp + drill-down | Đọc `BuildTreemap` | Ngành → Nhóm/Thương hiệu → Sản phẩm, breadcrumb | API phẳng 1 cấp danh mục (GroupBy `ProductCategoryId`); không có tham số cha để drill-down; thiếu cấp Sản phẩm | Không đạt | Lớn | `PRD:324-347,685-704` |
| PR-03b | % tỷ trọng | Đọc | Có | `RevenueShare` = revenue/total (làm tròn 2) | Đạt | — | `PRD:339-342` |
| PR-04 | Ma trận phôi SPH×CYL | grep `Sph\|Cyl` | Bubble SPH×CYL, loại tròng | Không có endpoint/DTO/entity; `TopProducts.Power = null` | Không đạt | Lớn | `PRD:371-373`; thiếu trong `CTL` |
| PR-05 | Thương hiệu phân phối | Đọc | Thanh ngang GMV theo TH, khớp FR-PR-02 | Chỉ có qua `BreakdownType=Brand` của Growth; không có block riêng, và dùng net no VAT | Một phần | Lớn | `PRD:101-123,969-1023` |
| PR-06a | Top sản phẩm | Đọc `BuildTopProducts` | Cột #, SP, NCC, Suất/Màu, SL bán, Tồn, SS, ROP, cảnh báo | Chỉ top 10 theo net revenue (spec: theo số lượng bán giảm dần); `Supplier/Power/Color = null` (cờ Partial) | Không đạt | Lớn | `PRD:349-377,705-717` |
| PR-06b | SS/ROP (QĐ-15) | grep `SafetyStock\|Rop\|LeadTime` | SS = 1,65σ√LT; ROP; 90 ngày; cảnh báo Tồn ≤ ROP | Không có công thức, không có nguồn lead time, không có cảnh báo. Có `InventoryTurnover`, `IsDeadStock` thay thế | Không đạt | Lớn | `PRD:379-410` |
| PR-06c | Tồn hiện tại | Đọc `QueryProducts` | Tồn tại thời điểm hiện tại | Lấy tồn của dòng thống kê MỚI NHẤT trong khoảng lọc (theo `TimeHash`), không phải tồn hiện tại; sản phẩm không phát sinh trong kỳ không xuất hiện | Không đạt | Lớn | `PRD:1151-1210` |
| PR-F1 | Lọc đa chiều | Đọc | Ngành, TH, Giới, Phân khúc, PIC, Trạng thái đều áp | Chỉ `CategoryIds` + `BrandIds`. Còn lại bị bỏ qua (bảng `ReportProduct` không có các chiều này) | Không đạt | Lớn | `PRD:891-1210` |
| PR-F2 | BR-DIM-01 đếm đơn theo dòng | Đọc | GMV = Σ dòng khớp; số đơn = đơn có ≥1 dòng | Bảng gom theo (ngày, sản phẩm) nên không có số đơn DISTINCT; chỉ có SaleCount (số lượng) | Không đạt | Lớn | `PRD:1151-1200` |
| PR-F3 | Phạm vi site | Đọc | Chỉ site trong quyền | `QueryExecutiveSites` (không RLS) – xem mục 3 | Không đạt | Nghiêm trọng | `EXE:1101` |

### 1.3. Hiệu suất Nhân sự (§7.4, FR-HR-01..04)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| HR-01a | Xếp hạng theo GMV người bán | Đọc `QueryPersonnelStaff` | GMV theo người bán gán trên đơn; điều chỉnh gán người bán đơn gốc | `SUM(DashboardNetRevenueNoVat)` theo `ReportStaff` (nguồn sync, chưa xác minh gán người bán của đơn gốc cho điều chỉnh). Không phải GMV | Không đạt | Nghiêm trọng | `PER:271-285` |
| HR-01b | Σ GMV = M01, dòng "Chưa gán" | Đọc | Có dòng "Chưa gán người bán" | Không có dòng này; đơn không gán người bán không xuất hiện → INV-09 vỡ | Không đạt | Nghiêm trọng | `PER:5-50` |
| HR-01c | Hạng/Top-3 "Nhân viên xuất sắc" | grep | Top 3 GMV cửa hàng | Có `Rank` (xếp hạng thi đấu, hòa chung hạng); không có cờ Top 3, không có "hạng r / n theo cửa hàng và vai trò" | Không đạt | Lớn | `PER:24-50` |
| HR-01d | AOV = M08 | Đọc | M06/M02 | `CalculateAov(SaleAmount, SaleOrderCount)` với SaleAmount = net no VAT (gần M06) và `DashboardSaleOrderCount` (cần đối chiếu M02) | Chưa xác minh | Lớn | `PER:41-44,280-281` |
| HR-01e | Góc nhìn STAFF | Đọc controller | STAFF chỉ thấy dữ liệu của mình (AC-ROLE-03) | Không có endpoint/bộ lọc ràng buộc theo người dùng; STAFF chỉ bị giới hạn nếu client tự gửi `StaffIds`. Không có thẻ Hài lòng cá nhân (`Csat = null`) | Không đạt | Nghiêm trọng | `PER:188-249`; `CTL:344-358` |
| HR-01f | Không có KPI/mục tiêu cá nhân (QĐ-08) | Đọc DTO | Không có | `WeeklyKpi` trả fixture "Tròng kính cận/đa tròng 80 / Gọng cao cấp 65 / Kính mát 110" (KPI tuần cá nhân giả), `Gamification` trả "Điểm gamification 0" | Không đạt | Nghiêm trọng | `PER:233-241`; `PersonnelDashboardV2Dto.cs:9-11` |
| HR-02a | Bảng xếp hạng PIC | Đọc | #, NV, Chi nhánh, GMV, Tỷ trọng, M02g, M08 | Có hạng, doanh thu, số đơn, AOV; không có chi nhánh, tỷ trọng; nhân viên làm nhiều chi nhánh gộp 1 `SiteId` đầu tiên | Một phần | Lớn | `PER:10-23` |
| HR-02b | Dữ liệu demo khi rỗng | Đọc | Trạng thái rỗng, không số giả | Khi leaderboard rỗng thì trả 5 nhân viên demo "Lê Văn C 1,5 tỷ…" (`DataStatus=Mock`). Test `PersonnelDemoFixturesMatchTheReferenceDashboard` giữ lại điều này | Không đạt | Nghiêm trọng | `PER:212-219`; `DA:242-271`; `DashboardV2PersonnelTests.cs:299` |
| HR-03 | KTV khúc xạ phải KHÔNG hiển thị (QĐ-13) | Đọc | Không có | `Refractionist` luôn trả fixture "BS. My 95 / 99,5…" | Không đạt | Nghiêm trọng | `PER:242-244`; `DA:273-287` |
| HR-04 | Lab đúng hạn / hư hao | Đọc | Số lệnh xong ≤ hạn / tổng; hư hao > 2% tô đỏ | Luôn trả fixture "Lab - Hùng 95/1,2…"; chưa có entity lệnh gia công trong report.api | Không đạt | Lớn | `PER:245-247`; `DA:282-286` |
| HR-F1 | Lọc Nhân sự | Đọc | Ngày, khu vực/chi nhánh, Ngành hàng, Thương hiệu | Có site/staff; Ngành hàng/Thương hiệu bị bỏ qua | Không đạt | Lớn | `PER:188-211` |
| HR-F2 | Chu kỳ không áp | FR-FLT-05 | Chu kỳ "—" | Không dùng PeriodType | Đạt | — | `PER:266-285` |

### 1.4. KPI và mục tiêu (§4.2, §7.5, §7.6 FR-IMP-02)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| KPI-01 | Phạm vi Company/Region/Branch, không Staff | Đọc enum | 3 phạm vi | Enum có `Staff = 4`; validator chỉ `Enum.IsDefined`; `ResolveKpiMetric` còn xử lý Staff | Không đạt | Nghiêm trọng | `Domain/Entities/KpiPlan.cs:3-9`; `KpiV2Service.cs:37`; `ReportService.DashboardV2.Kpi.cs:17,53-54` |
| KPI-02 | Mục tiêu GMV bắt buộc >0, DTT tùy chọn | Đọc validator | GMV >0, DTT>0 tùy chọn | Metric `Revenue` (không có `Gmv`, `Dtt`); cho phép `Value = 0`; không bắt buộc metric tiền; không kiểm tỷ lệ ≤100; Evaluate "Revenue" = net no VAT (sale − return) → là DTT không VAT | Không đạt | Nghiêm trọng | `KpiPlan.cs:19-26`; `KpiV2Service.cs:42-49`; `KpiV2EvaluationService.cs:25-27` |
| KPI-03 | Chu kỳ Năm/Quý/Tháng/Chiến dịch | Đọc | Chu kỳ phải khớp ngày | Có enum; không kiểm ngày Bắt đầu/Kết thúc khớp loại chu kỳ (Năm 01/01–31/12…) | Một phần | Lớn | `KpiV2Service.cs:31-34` |
| KPI-04 | Phiên bản | Đọc | Sinh bởi hệ thống, tăng; sửa Active tạo phiên bản mới | `CurrentVersion++`, bảng `KpiPlanVersion` + `KpiMetricTarget`; `Update` xóa `Scopes` cũ (`RemoveRange`) → mất lịch sử phạm vi giữa các phiên bản; sửa Active không kiểm xung đột lại | Một phần | Lớn | `KpiV2Service.cs:223-259` |
| KPI-05 | Trạng thái và vòng đời | Đọc | Nháp → Đang áp dụng → Đã kết thúc (tự động khi hết chu kỳ) → Lưu trữ | 4 trạng thái đủ; "Đã kết thúc" chỉ khi gọi `/End` thủ công, không có job tự động; `Archive` cho cả Draft | Một phần | Lớn | `KpiV2Service.cs:274-287`; `KpiV2Service.cs:79-124` |
| KPI-06 | Xung đột BR-KPI-02 | Đọc | 3 lựa chọn Ghi đè / Giữ cao nhất / Lưu nháp | Có đủ 3 (`Overwrite`, `KeepHighest`, `SaveDraft`); xung đột xét theo giao phạm vi + giao metric; mặc định không chọn "Ghi đè" | Đạt | Nhỏ | `KpiV2Service.Conflict.cs:35-110`; `KpiV2ConflictService.cs:5-36` |
| KPI-07 | Xóa mềm | Đọc | Xóa = Lưu trữ | Không có endpoint xóa; `Archive` đóng vai xóa mềm; `SaleTarget` có xóa mềm riêng | Đạt | — | `KpiV2Controller.cs:79-87` |
| KPI-08 | Phân bổ theo ngày (BR-TGT-03) | Đọc | Mục tiêu = Σ (mục tiêu/ngày chu kỳ) × ngày giao | KpiV2 đánh giá cả plan theo khoảng plan, không phân bổ khi khoảng lọc ≠ chu kỳ. Chỉ phân theo ngày/loại ngày ở nhánh `SaleTarget` cũ | Không đạt | Nghiêm trọng | `KpiV2EvaluationService.cs:166-190`; `EXE:1137-1161`; `ReportService.BranchPerformanceHeatmap.cs:193-247` |
| KPI-09 | Chiến dịch ghi đè (BR-TGT-04) | Đọc | Ngày chiến dịch lấy KPI chiến dịch, ngày còn lại chia đều phần còn lại | Không có; chiến dịch giao tháng bị coi là xung đột | Không đạt | Lớn | `KpiV2ConflictService.cs:14-29` |
| KPI-10 | Rollup từ con (BR-TGT-02) | Đọc | Không có KPI → tổng con | Không có | Không đạt | Lớn | không có mã |
| KPI-11 | Không có KPI → "Chưa thiết lập mục tiêu" (BR-TGT-05) | Đọc | Ẩn % | `TargetCompletion` trả `0m` khi mẫu số 0 (`CalculateRate`), FE không phân biệt "0%" với "chưa có" | Không đạt | Lớn | `FC:376-380` |
| KPI-12 | Dashboard dùng KPI "Đang áp dụng" (BR-TGT-01, AC-KPI04-05) | grep `KpiPlan` ngoài KpiV2 | Mọi mục tiêu từ KpiV2 | Executive/Heatmap/BranchPerformance đọc `SaleTarget`, không đọc KpiPlan. Hai nguồn song song; "Không có giá trị mục tiêu mặc định ngầm" vẫn thỏa nhưng nguồn sai | Không đạt | Nghiêm trọng | `EXE:1144`; `ReportService.BranchPerformanceHeatmap.cs:48` |
| KPI-13 | Sở hữu theo tài khoản | Đọc `Search` | Mọi người có quyền xem cùng KPI | Mọi truy vấn lọc `AccountId == accountId` → MANAGER không thấy KPI do BOD tạo; 2 BOD có 2 bộ KPI riêng | Không đạt | Nghiêm trọng | `KpiV2Service.cs:145-148`; `KpiV2EvaluationService.cs:105-111,266-272` |
| KPI-14 | Quyền ghi chỉ BOD | Đọc controller | Ghi chỉ BOD; MANAGER chỉ xem | `KpiRead = KpiWrite = "manager.dashboard.read"`; mọi POST/PUT dùng chung scope với GET | Không đạt | Nghiêm trọng | `DashboardV2PermissionCodes.cs:15-17`; `KpiV2Controller.cs:20-105` |
| KPI-15 | Bulk update | Đọc | Tăng/giảm % hoặc tuyệt đối cho nhiều KPI, đổi thời hạn | Có, tạo phiên bản mới; ràng buộc "cùng scope + metric" (spec không yêu cầu); `Absolute` ghi đè mọi metric cùng 1 giá trị (kể cả Traffic/Conversion) | Một phần | Lớn | `KpiV2Service.Bulk.cs:5-110` |
| KPI-16 | Import mục tiêu Excel (FR-IMP-02) | grep | Template, Xem trước, Tất cả-hoặc-không, chính sách xung đột chung | KHÔNG có. Chỉ có `ImportSaleTargets`: chuyển TẤT CẢ bảng `SaleTarget` cũ thành KPI Draft (không giới hạn tài khoản, chỉ metric Revenue, chu kỳ Campaign, khóa idempotent bằng tên) | Không đạt | Lớn | `KpiV2Controller.cs:106-113`; `KpiV2SaleTargetImportService.cs:42-110` |
| KPI-17 | CRUD `SaleTarget` cũ | Đọc | Chỉ BOD | `SaleTargetController` chỉ có `[RequireScope("admin")]` kế thừa, không scope Dashboard; ai có `admin` đều sửa mục tiêu mà Executive đang dùng | Không đạt | Lớn | `SaleTargetController.cs`; `AdminController.cs:5` |
| KPI-18 | Audit (người tạo/sửa, nguồn) | Đọc | Người, thời điểm, nguồn Wizard/Import + tên file | Có `CreateAt/UpdateAt` (StrongEntity) và `Reason`; không lưu người sửa, nguồn, tên file | Không đạt | Lớn | `KpiPlan.cs` (entity); `KpiV2Service.cs:195-218` |
| KPI-19 | FR-KPI-01 thẻ thống kê "đạt/tổng" | Đọc `GetSummary` | KPI kỳ trước đạt/tổng | Trả danh sách Active/Completed + Actuals của 1 plan được chọn | Một phần | Nhỏ | `KpiV2EvaluationService.cs:92-141` |

### 1.5. Traffic (§7.6 FR-IMP-01, FR-EX-08, §5)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| TR-01 | Lưu trữ | Đọc entity | Khóa (chi nhánh, ngày), 1 nguồn duy nhất | `DashboardTrafficDaily` khóa duy nhất (AccountId, SiteId, LocalDate) – dữ liệu theo từng tài khoản, mọi truy vấn lọc `AccountId == IdentityContext.Id` | Không đạt | Nghiêm trọng | `Domain/Entities/DashboardTrafficDaily.cs:6,22`; `OP:742-745,836-840` |
| TR-02 | Nhập tay | Đọc | Số nguyên ≥0, lưu ngay | `/Traffic/Upsert` nhận mảng; `long TrafficCount ≥ 0` (cả check constraint DB); thiếu → ném `ArgumentException` (có thể ra 500 thay vì lỗi hợp lệ) | Một phần | Nhỏ | `ReportService.DashboardV2.Traffic.cs:7-36`; `DashboardTrafficDaily.cs:24` |
| TR-03 | Ngày không ở tương lai | Đọc | Chặn | Không kiểm | Không đạt | Lớn | `Traffic.cs:12-28` |
| TR-04 | Import Excel (template, xem trước, báo lỗi dòng–cột, nhập một phần, file lỗi) | grep | Có | Không có endpoint nào nhận file; không có template; không có xem trước | Không đạt | Lớn | `CTL:376-394` |
| TR-05 | Ghi đè và lịch sử | Đọc | Giữ giá trị cũ vào lịch sử; báo "200 → 250" | Chỉ tăng `Version`; không bảng lịch sử, không lưu người sửa | Không đạt | Lớn | `Traffic.cs:100-123` |
| TR-06 | Cảnh báo Traffic < số đơn | Đọc | Cảnh báo không chặn | Không có | Không đạt | Nhỏ | — |
| TR-07 | Quyền: MANAGER chỉ cửa hàng mình | Đọc | Kiểm quyền theo cửa hàng | Chỉ kiểm chi nhánh tồn tại & Active (`EnsureDashboardTrafficSites`); không kiểm người dùng có được gán cửa hàng đó; scope dùng chung `Dashboard` | Không đạt | Nghiêm trọng | `Traffic.cs:147-161`; `CTL:376-394` |
| TR-08 | Search | Đọc | Trong phạm vi quyền | Không giới hạn khoảng ngày, trả toàn bộ site đang Active khi không truyền `SiteIds`; `DataAsOf` = ngày lớn nhất (không phải thời điểm cập nhật) | Một phần | Lớn | `Traffic.cs:41-78` |
| TR-09 | Hủy cache sau ghi | Đọc | Heatmap/V2 cập nhật | Có `DashboardV2CacheService.Invalidate` và xóa khóa heatmap cũ | Đạt | — | `Traffic.cs:127-130` |

### 1.6. Heatmap chi nhánh (FR-EX-08)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| HM-01 | Endpoint V2 trả bucket | Đọc `GetBranchPerformance` | Hàng chi nhánh × cột bucket | Chỉ 1 giá trị tổng/chi nhánh, không bucket Ngày/Tuần/Tháng | Không đạt | Lớn | `BP:36-115` |
| HM-02 | Traffic, Tỷ lệ chuyển đổi | Đọc `BuildBranch` | Có | Cứng `Traffic = null; Conversion = null` | Không đạt | Lớn | `EXE:278-279` |
| HM-03 | Heatmap cũ: bucket Tuần ISO | Đọc `GenerateBranchPerformanceHeatmapPeriods` | Tuần ISO Thứ 2–CN; nhãn "(một phần: n ngày)" | Tuần = 7 ngày liên tiếp bắt đầu từ ngày bắt đầu lọc; key `W{index}`; ngày/tháng có cắt biên nhưng không gắn nhãn một phần | Không đạt | Lớn | `ReportService.BranchPerformanceHeatmap.cs:92-135,308-336` |
| HM-04 | Giá trị gộp | Đọc `GenerateBranchPerformanceHeatmapItem` | Σ GMV / Σ mục tiêu phân bổ; chuyển đổi = M14 của bucket | `% mục tiêu = Σ(SaleAmount − ReturnAmount) / Σ target` (cash net, không GMV); Σ đơn là `SaleOrderCount`; bucket chỉ cần có 1 ngày Traffic là cộng và chia cho toàn bộ đơn của bucket (OP-09a lặp lại) | Không đạt | Nghiêm trọng | `...Heatmap.cs:146-167`; `BranchPerformanceHeatmapCalculator.cs:5-12` |
| HM-05 | Mục tiêu phân bổ | Đọc `GenerateBranchPerformanceTargetAmount` | Σ mục tiêu ngày theo loại ngày | Đúng với mô hình `SaleTarget` (ngày thường/cuối tuần/lễ, ưu tiên chi nhánh cụ thể, rồi mới mới nhất); nhưng nguồn là `SaleTarget`, không phải KPI "Đang áp dụng"; chọn target không theo trạng thái | Một phần | Lớn | `...Heatmap.cs:193-247` |
| HM-06 | Thang màu | Đọc `GenerateBranchPerformanceStatus` | % mục tiêu: 11 mức (≥115, 100–114…<30); chuyển đổi 11 mức; GMV/Traffic tứ phân vị | Backend chỉ trả 4 trạng thái (`<0,3` danger, `<0,6` warning, `<0,8` good, còn lại excellent). Ngưỡng 80% là biên xanh ĐÚNG (AC-EX08-03: 80,0 → xanh), phần còn lại chia tay | Không đạt | Lớn | `...Heatmap.cs:269-280` |
| HM-07 | Ô thiếu Traffic "—" | Đọc | Null | `trafficCount == null` nếu không có dòng nào trong bucket → đạt; thiếu một phần ngày → vẫn tính | Một phần | Lớn | `...Heatmap.cs:158-167` |
| HM-08 | Khu vực từ danh mục chủ | Đọc | 1 danh mục khu vực duy nhất | `Region` thuộc `AccountId` (mỗi tài khoản tự có danh mục khu vực); `RegionSite` theo tài khoản | Không đạt | Lớn | `Domain/Entities/Region.cs:21-26`; `...Heatmap.cs:70-78` |
| HM-09 | Chuỗi cache | Đọc | Có account trong key | `CacheParameters` có AccountId; đạt | Đạt | — | `ReportController.cs:176-183` |
| HM-10 | Phân quyền endpoint | Đọc | Chỉ BOD | `ReportController.BranchPerformanceHeatmap` không có `RequireScope` Dashboard (chỉ `admin`) | Không đạt | Lớn | `ReportController.cs:149-158` |
| HM-11 | Hàng Khu vực, toggle | Đọc | Gộp theo khu vực | Backend không gộp theo khu vực | Không đạt | Lớn | `...Heatmap.cs:68-87` |

### 1.7. Phân quyền và RLS (§5, BR-ROLE-01..04, AC-ROLE-01..05)

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| RLS-01 | Vai trò từ tài khoản (BR-ROLE-01) | Đọc controller | Vai trò BOD/MANAGER/STAFF từ tài khoản | Không có vai trò; chỉ scope `admin` + `manager.dashboard.read`. Test cấm các chữ BOD/MANAGER/STAFF trong controller | Không đạt | Nghiêm trọng | `AdminController.cs:3-6`; `DashboardV2PermissionCodes.cs:5-17`; `DashboardV2PermissionTests.cs:77-82` |
| RLS-02 | RLS tầng dữ liệu (BR-ROLE-02, AC-ROLE-01/02) | Đọc `QueryExecutiveSites`, `EnsureRequestedScope` | Mọi query lọc theo cửa hàng được gán; 403 khi gọi cửa hàng khác | Không có danh sách cửa hàng gán cho người dùng; site không lọc theo tài khoản; kiểm tra `SiteIds` đã bị comment; không có 403 (chỉ `AppException`). Khu vực lọc theo `Region.AccountId` (không phải quyền) | Không đạt | Nghiêm trọng | `BASE:70-106`; `EXE:1101-1135` |
| RLS-03 | Tab theo vai trò (AC-ROLE-05) | Đọc | Tổng quan chỉ BOD; Vận hành/Sản phẩm BOD+MANAGER; Nhân sự cả STAFF | Mọi trang cùng 1 scope; không phân biệt | Không đạt | Nghiêm trọng | `DashboardV2PermissionCodes.cs:7-15` |
| RLS-04 | KPI ghi chỉ BOD (AC-ROLE-04) | Đọc | Chỉ BOD | Xem KPI-14 | Không đạt | Nghiêm trọng | `KpiV2Controller.cs` |
| RLS-05 | STAFF chỉ dữ liệu của mình (AC-ROLE-03) | Đọc | Ép `StaffId` = người đăng nhập | Không ánh xạ tài khoản ↔ nhân viên; `StaffIds` do client gửi | Không đạt | Nghiêm trọng | `PER:188-211` |
| RLS-06 | Quyền GMV | Đọc doc pos.gui + grep report.api | Server loại bỏ/từ chối trường GMV nếu thiếu quyền | `manager.dashboard-v2.gmv.read` chỉ ở pos.gui (kiểm soát hiển thị). Report API không đọc mã này; tự tài liệu ghi "Report API phải kiểm tra… chưa nằm trong thay đổi này" | Không đạt | Nghiêm trọng | `pos.gui/docs/dashboard-v2-gmv-permission.md`; grep report.api trống |
| RLS-07 | BR-ROLE-04 mọi lối vào | Đọc | Cùng quy tắc | Có lối vào song song: `ReportController.*` (cũ), `SaleTargetController`, V2; mỗi nơi 1 kiểu phân quyền khác nhau | Không đạt | Lớn | `ReportController.cs`; `SaleTargetController.cs` |
| RLS-08 | Test phân quyền | Đọc test | Đảm bảo hành vi | Test đọc source bằng regex; một test lệch code: kỳ vọng `Dashboard = "manager.dashboard"` nhưng code là `"manager.dashboard.read"` → test thất bại hoặc scope thật khác | Chưa xác minh | Lớn | `DashboardV2PermissionTests.cs:52-55` vs `DashboardV2PermissionCodes.cs:5` |

### 1.8. Bộ lọc, FR-FLT-05, INV-11/12 và Cache

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| FLT-01 | Ngày | Đọc `OnValidate` | Từ ≤ Đến, ≤3 năm, không trống | `StartAt >= EndAt` lỗi (không cho một ngày nếu EndAt = StartAt 00:00), không giới hạn 3 năm; ngày bị đổi UTC→UTC+7 | Một phần | Lớn | `DashboardV2InputAdminDto.cs:76-94,163-173` |
| FLT-02 | Khu vực/Chi nhánh cascade | Đọc | Server kiểm chi nhánh ∈ khu vực | Không kiểm chéo; `SiteIds` + `RegionIds` giao nhau không báo lỗi | Một phần | Nhỏ | `EXE:1109-1118` |
| FLT-03 | Ngành hàng, Thương hiệu | Đọc | Áp ở Sản phẩm/Nhân sự/Tổng quan | Sản phẩm có; Vận hành & Nhân sự không | Không đạt | Lớn | xem OP-X2, HR-F1 |
| FLT-04 | Giới tính, Phân khúc HĐ, PIC, Trạng thái đơn | Đọc | Áp mọi widget có chiều | `Genders`: demographics; `BasketBuckets`: basket; `StaffIds`: time-peak, payment, personnel; `OrderStatuses`: không dùng ở đâu (AGE test cũng khẳng định `DoesNotContain("OrderStatuses")`) | Không đạt | Lớn | `OP:313-417`; `DashboardV2PermissionTests.cs:128` |
| FLT-05 | Thông báo "Không áp dụng bộ lọc: <chiều>" | Đọc DTO | BR-FLT-09 | Block DTO không có trường danh sách bộ lọc không áp | Không đạt | Lớn | `DashboardV2BlockAdminDto.cs` |
| FLT-06 | Chu kỳ ISO | Đọc | Tuần ISO | Product timeline dùng `PeriodTypes.Month/Quarter/Year/ngày`; `WoW` gọi tuần riêng; heatmap tuần không ISO | Không đạt | Lớn | `PRD:188-249` |
| FLT-07 | INV-12 xác định | grep Random | Không ngẫu nhiên | Không có Random; thời điểm hiện tại (`now`) tham gia Order Aging, heatmap run-rate (`DateTime.UtcNow`) → kết quả đổi theo thời gian | Một phần | Nhỏ | `...Heatmap.cs:254`; `AGE:139` |
| CA-01 | Key gồm mọi chiều lọc | Đọc `DashboardV2CacheKey.Create` | Mọi chiều | Có: PeriodType, Start/End, Region, Site, Category, Brand, Gender, Basket, Staff, OrderStatus, Benchmark A/B, Comparison, Metric, Dimension, FormulaVersion, extra | Đạt | — | `DashboardV2CacheKey.cs:30-57` |
| CA-02 | Key gồm quyền người dùng | Đọc | AccountId/phạm vi | Có `AccountId`. Vì phạm vi hiện chỉ suy ra từ tài khoản nên không rò rỉ chéo tài khoản. Nếu bổ sung RLS theo vai trò/cửa hàng, phải đưa vai trò/danh sách site hiệu lực vào key | Đạt (hiện tại) | Nhỏ | `DashboardV2CacheKey.cs:33` |
| CA-03 | Cache lệ thuộc dữ liệu | Đọc | Mới ≤15 phút (NFR-02) | TTL 2 giờ; làm mới bằng `Invalidate()` sau sync/ghi KPI/traffic (toàn bộ prefix); Operational thêm sync-version, các block khác không | Một phần | Nhỏ | `ApplicationMemoryCacheService.cs:15-30`; `CTL:98-134` |
| CA-04 | Executive bỏ ComparisonType khỏi key | Tham khảo | — | Nằm trong phạm vi agent khác | — | — | `DashboardV2CacheKey.cs:18-25` |

---

## (2) Kiểm kê dữ liệu mock / ngẫu nhiên / hard-code

Không có `Random` trong module. Có các mục sau:

| # | Vị trí | Nội dung | Trạng thái | Spec bị vi phạm |
|---|---|---|---|---|
| M1 | `DA:211-216`, dùng ở `OP:391-393,481-483` | Chiến dịch luôn trả "Khách hàng thân thiết 120", "Tái kích hoạt 80" (`MockVersion = dashboard-v2-operational-mock-v1`) | `Mock` | FR-OP-06, BR-DATA-01 |
| M2 | `DA:218-224`, dùng ở `OP:851-855` | Conversion khi chưa có Traffic: Visit 1.000 / Consultation 420 / Order 210 (phễu, phần Hoãn QĐ-13) | `Mock` | FR-OP-09 (AC-OP09-01), QĐ-13 |
| M3 | `DA:242-252`, `PER:212-219` | Bảng xếp hạng demo: "Lê Văn C 1,5 tỷ", "Nguyễn Văn A", "Hoàng Văn E", "Trần Thị B", "Phạm Thị D"; mã `DEMO001..005`, Id giả `00000000-…-000000000001` | `Mock` khi rỗng | FR-HR-02, BR-DATA-01 |
| M4 | `DA:254-271` | Scorecard demo: trung bình cửa hàng 1,11 tỷ, AOV 3,88 Tr | `Mock` | FR-HR-01 |
| M5 | `PER:233-238` | `WeeklyKpi`: "Tròng kính cận / đa tròng 80", "Gọng kính cao cấp 65", "Kính mát 110" (KPI cá nhân theo tuần) | `Mock` | QĐ-08, AC-HR01-03 |
| M6 | `PER:239-241` | `Gamification`: "Điểm gamification 0" | `Mock` | Không có trong spec |
| M7 | `DA:273-287`, `PER:242-247` | `Refractionist` ("BS. My 95/99,5"…), `Lab` ("Lab - Hùng 95/1,2"…) | `Mock` | QĐ-13 (phải ẩn), FR-HR-04 |
| M8 | `FC:9` | Cửa sổ anomaly 5 ngày, hệ số 2σ cứng | Hard-code | FR-OP-08 (7 ngày, k cấu hình) |
| M9 | `DA:28-29`, `FC:203-212` | Ngưỡng basket cứng 500k/1M/3M | Hard-code | FR-OP-04 (thiếu 5M) |
| M10 | `PRD:412-415` | Ngưỡng phân khúc giá 500k/1M/3M | Hard-code | FR-PR-02 (cần dải giá chuẩn) |
| M11 | `OP:519,525`, `...Heatmap.cs:95,254`, `OP:660-662` | Múi giờ +7 cứng `AddHours(7)` | Hard-code | Chấp nhận (VN không DST) nhưng không đồng nhất với `TimeZoneInfo` |
| M12 | `...Heatmap.cs:273-306` | Ngưỡng 0,3/0,6/0,8 và câu insight tiếng Việt sinh ở server | Hard-code | FR-EX-08 (11 mức) |
| M13 | `PRD:371-373` | `Supplier/Power/Color = null` kèm cờ Partial | Thiếu dữ liệu | FR-PR-06 |
| M14 | `PER:44` | `Csat = null` ở xếp hạng/scorecard | Thiếu dữ liệu | FR-HR-01 (M19) |

Đã xác nhận: dữ liệu mock bị gắn `DataStatus = Mock` và `MockFields`, nhưng spec yêu cầu bỏ hẳn số giả (BR-DATA-01) hoặc hiển thị trạng thái rỗng (FR-CMN-03). Các test (`DashboardV2PersonnelTests`, `DashboardV2DataAvailabilityTests`) hiện đang bảo vệ hành vi mock.

---

## (3) Đánh giá phân quyền và RLS

### 3.1. Cơ chế thực tế
1. Mọi controller kế thừa `AdminController` với `[Authorize]` + `[RequireScope("admin")]` (`AdminController.cs:4-5`).
2. `DashboardV2Controller` thêm `[RequireScope(DashboardV2PermissionCodes.X)]` ở từng action. Tất cả mã đều là `"manager.dashboard.read"` (`DashboardV2PermissionCodes.cs:5-17`). Nghĩa là: một người có scope này xem được Tổng quan, Vận hành, Sản phẩm, Nhân sự, ghi Traffic, và gọi mọi API KPI (kể cả sửa, bulk, import).
3. `IdentityContext.Id` chỉ dùng làm "AccountId" để: lọc khu vực (`Region.AccountId`), ánh xạ chi nhánh–khu vực (`RegionSite.AccountId`), lưu KPI, lưu Traffic. Không dùng để giới hạn tập cửa hàng được xem.
4. `EnsureRequestedScope` chỉ kiểm tra khu vực thuộc tài khoản. Phần kiểm tra chi nhánh bị comment (`BASE:91-105`).
5. `QueryExecutiveSites` (`EXE:1101-1135`): khi không có `RegionIds`/`SiteIds` trả TẤT CẢ chi nhánh Active. Khi có `SiteIds`, chỉ lọc `Id in SiteIds` mà không giao với phạm vi được gán.
6. Ngoại lệ có phạm vi: `BuildAuthorizedSiteIdQuery` của Order Aging yêu cầu chi nhánh có `RegionSite` của tài khoản (`AGE:18-47`), nên Order Aging là block duy nhất bị giới hạn theo ánh xạ, nhưng ánh xạ này do chính người dùng cấu hình.

### 3.2. Kết luận theo AC
| AC | Kết quả | Lý do |
|---|---|---|
| AC-ROLE-01 | Không đạt | MANAGER thấy mọi chi nhánh |
| AC-ROLE-02 | Không đạt | Gọi cửa hàng khác: không 403, trả dữ liệu |
| AC-ROLE-03 | Không đạt | Không ràng buộc STAFF với nhân viên; bảng xếp hạng dùng nguồn net no VAT |
| AC-ROLE-04 | Không đạt (server) | Server không phân biệt MANAGER, mọi ghi KPI được phép nếu có scope chung |
| AC-ROLE-05 | Không đạt | Không có tab/vai trò ở server |

### 3.3. Khái niệm "quyền GMV"
- Tài liệu `pos.gui/docs/dashboard-v2-gmv-permission.md` định nghĩa scope `manager.dashboard-v2.gmv.read` (dương cấp, `-…` thu hồi; không thay thế `manager.dashboard.read`).
- Report API không tham chiếu mã này (grep trống). Tài liệu nêu rõ đây là kiểm soát hiển thị ở frontend; KPI/Trend vẫn trả GMV. Do đó mọi người có quyền Dashboard chung đọc được GMV, grossSales, adjustments, cumulative GMV, Direct/PreOrder GMV qua gọi API trực tiếp.
- Đề xuất: tạo `DashboardV2PermissionCodes.GmvRead = "manager.dashboard-v2.gmv.read"`, kiểm tra thủ công bằng `IdentityContext` (scope âm thắng) rồi loại các trường GMV khỏi DTO hoặc trả 403 theo block. Cần quyết định kinh doanh: khi thiếu quyền, nên trả `null` hay 403.

### 3.4. Rò rỉ cache
- Key có `AccountId` + mọi chiều lọc + `FormulaVersion` + tham số bổ sung (Limit, BreakdownType, HierarchyLevel, sync-version của Order Aging). Không phát hiện đường rò rỉ chéo tài khoản.
- Rủi ro: (a) khi sau này RLS suy ra từ vai trò/danh sách cửa hàng thì key phải chứa chữ ký phạm vi hiệu lực (hash danh sách site) vì quyền có thể đổi trong lúc token còn sống; (b) cache lưu cùng một đối tượng tham chiếu cho mọi lần gọi (không clone) – an toàn nếu DTO không bị đổi; (c) `Clear(predicate)` mặc định xóa toàn bộ cache (interface mặc định `Clear()`), `ApplicationMemoryCacheService` đã override – OK.
- Heatmap/ReportController cũ: `CacheParameters` có `AccountId`, đạt.

---

## (4) Khoảng cách mô hình KPI

### 4.1. So với spec §7.5/§4.2
| Yêu cầu spec | KpiV2 hiện tại | Khoảng cách |
|---|---|---|
| Phạm vi Công ty/Khu vực/Chi nhánh | Thêm `Staff` | Phải loại Staff (QĐ-08) |
| Đối tượng theo danh mục chủ | `KpiPlanScope(ScopeType, EntityId)`; Company = AccountId; Region = `Region` của tài khoản | Danh mục khu vực theo tài khoản, không phải danh mục chủ (BR-MD-01) |
| Chu kỳ Năm/Quý/Tháng/Chiến dịch | Có enum, không kiểm khớp | Thêm kiểm khớp và cấm chồng lấn |
| Mục tiêu GMV bắt buộc >0, DTT tùy chọn >0 | `Metric=Revenue` (và Conversion/Traffic/Aov/Csat), `Value ≥ 0` | Tách `Gmv`, `Dtt`; bắt buộc Gmv; cấm 0; kiểm thang tỷ lệ |
| Phiên bản hệ thống sinh theo (Đối tượng, Chu kỳ) | Theo plan (`CurrentVersion`) | Chấp nhận theo plan, cần chốt |
| Trạng thái Nháp/Đang áp dụng/Đã kết thúc/Lưu trữ | Đủ | "Đã kết thúc" tự động chưa có |
| Audit: người, thời điểm, nguồn (Wizard/Import + tên file) | Chỉ CreateAt/UpdateAt, `Reason` | Thêm `CreatedBy/UpdatedBy/Source/SourceFile` |
| BR-KPI-01: 1 KPI Active/(Đối tượng, ngày) trừ chiến dịch | Kiểm xung đột khi Activate theo giao phạm vi+metric | Cần ngoại lệ chiến dịch (BR-TGT-04) |
| BR-KPI-02: 3 chính sách | Có | Đạt |
| BR-KPI-03: sửa Active → phiên bản mới; xóa mềm | Có (Update tạo version; Archive) | `Update` không kiểm lại xung đột, xóa lịch sử scope |
| BR-TGT-02 rollup | Không | Cần |
| BR-TGT-03 phân bổ theo ngày | Không (chỉ SaleTarget) | Cần |
| BR-TGT-04 chiến dịch ghi đè | Không | Cần |
| BR-TGT-05 không có KPI → "Chưa thiết lập" | Trả 0% | Cần tách null |
| Quyền ghi BOD, MANAGER chỉ xem KPI chi nhánh mình + cha | Mọi người có scope chung; KPI theo AccountId | Cần quyền và nguồn dùng chung |
| FR-IMP-02 import Excel | Không (chỉ chuyển từ `SaleTarget`) | Cần xây mới |
| Dashboard đọc KPI Đang áp dụng | Đọc `SaleTarget` | Cần chuyển nguồn |

### 4.2. So với `data-store-kpi.md`
- File có 61 cửa hàng (5 khu vực: HCM 24, Miền Đông 11, Miền Tây 10, Miền Bắc 8, Miền Trung 8), mỗi cửa hàng có HAI giá trị mục tiêu theo NGÀY: "Trong tuần" và "Cuối tuần". Tổng cộng hệ thống: ngày thường 1,169 tỷ/ngày, cuối tuần 2,217 tỷ/ngày (ví dụ tháng 22 ngày thường + 8 cuối tuần ≈ 43,4 tỷ).
- Mô hình này khớp `SaleTarget` + `DayType` (Weekday/Weekend/Holiday) + `HolidayId` + `SaleTargetSite` + `TargetSaleAmount` (mục tiêu mỗi ngày), và hàm `GenerateBranchPerformanceTargetAmount` cộng theo từng ngày.
- Spec §7.5 giả định mục tiêu TỔNG theo chu kỳ (năm/quý/tháng/chiến dịch) rồi chia đều theo ngày (BR-TGT-03). KpiV2 cũng giả định một số tổng cho cả chu kỳ. Hai mô hình không biểu diễn được loại ngày (ngày thường vs cuối tuần) → nếu chuyển sang KpiV2 mà không đổi, mục tiêu ngày bị san phẳng, % đạt từng ngày/tuần/bucket sẽ lệch so với KPI thực tế mà vận hành đang dùng.
- Dữ liệu trong file chỉ có cấp Chi nhánh (cột Khu vực chỉ là nhãn); mục tiêu Khu vực/Công ty phải suy ra bằng cộng. File không có mục tiêu GMV so với DTT, không có DTT, Traffic, Conversion.
- Lựa chọn (cần quyết định kinh doanh): (A) thêm vào KpiV2 hai mục tiêu ngày `GmvWeekdayDaily`/`GmvWeekendDaily` (và loại ngày lễ), phân bổ theo lịch ngày; hoặc (B) đổi sang tổng tháng = Σ ngày theo lịch và để BR-TGT-03 chia theo ngày thực; hoặc (C) sửa spec để công nhận KPI ngày theo loại ngày.
- Tên cửa hàng trong file ("HMK BÌNH THẠNH"…) cần ánh xạ sang `ReportSite.Id`; chưa có công cụ nạp. Dòng đầu bảng `---` (không phải dữ liệu).

---

## (5) Kế hoạch sửa (thứ tự ưu tiên)

Ký hiệu: [MIG] cần migration; [BF] cần backfill; [DS] cần nguồn dữ liệu mới; [BD] cần quyết định kinh doanh.

1. **Bật RLS ở tầng truy vấn (Nghiêm trọng).**
   - File: `DashboardV2Service._Base.cs`, `DashboardV2Service.Executive.cs` (`QueryExecutiveSites`), `ReportService.DashboardV2.Kpi.cs`, `Traffic.cs`, `DashboardV2Controller.cs`, `KpiV2*`.
   - Làm: tạo dịch vụ `IDashboardV2AccessService` trả `{Role, AllowedSiteIds, StaffId}` từ Identity/scope; mọi truy vấn giao `siteIds` với `AllowedSiteIds`; ném 403 khi `SiteIds` yêu cầu nằm ngoài; thêm chữ ký phạm vi vào cache key.
   - Rủi ro: cao (đổi toàn bộ số cho MANAGER). [DS] cần nguồn "cửa hàng được gán" (Identity hoặc bảng `ReportStaffWorkingSite`/POS). [BD] ánh xạ scope → vai trò.
2. **Tách quyền và hạn chế KPI/Traffic/Quyền GMV (Nghiêm trọng).**
   - File: `DashboardV2PermissionCodes.cs`, `DashboardV2Controller.cs`, `KpiV2Controller.cs`, `SaleTargetController.cs`, `ReportController.cs` (heatmap).
   - Làm: mã riêng cho Executive/Operational/Product/Personnel/PersonnelSelf/KpiRead/KpiWrite/TrafficWrite/GmvRead; chặn `SaleTarget` CRUD và `BranchPerformanceHeatmap` bằng cùng scope; kiểm tra GMV permission ở server và ẩn trường GMV. Cập nhật `DashboardV2PermissionTests`.
   - Rủi ro: trung bình; cần Identity phát hành scope mới (pos.api). Không migration.
3. **Thay chỉ số tiền của Vận hành, Sản phẩm, Nhân sự bằng GMV/M02g (Nghiêm trọng).**
   - File: `OP`, `PRD`, `PER`, `DashboardV2OperationalCalculator`, entity `ReportProduct`, `ReportStaff`, `ReportOrder`, `ReportOrderStatistic` (xem agent sync).
   - Làm: dùng cột GMV (có VAT) đã nằm trong fact của agent khác; thêm cột `Gmv`/`OrderCountGross` vào aggregate `ReportProduct`, `ReportStaff` nếu chưa có; Time Peak, Basket, Demographics tính trên Đơn đặt ở Đơn tạm + Đơn hàng lắp sẵn hoàn thành. Thêm test INV-05/09/11.
   - Rủi ro: cao; cần [MIG] + [BF] cho `ReportProduct`/`ReportStaff`. Phụ thuộc kết quả agent GMV.
4. **Gỡ toàn bộ mock/fixture khỏi API (Nghiêm trọng).**
   - File: `DA` (xóa `CreateCampaignFixture`, `CreateConversionFixture`, `CreatePersonnel*Fixture`), `PER:212-247`, `OP:387-394,849-855`, `PersonnelDashboardV2Dto` (xóa `WeeklyKpi`, `Gamification`, `Refractionist`), tests liên quan.
   - Làm: trả danh sách rỗng + `DataStatus=Partial` + `MockFields` hoặc trạng thái "Chưa có dữ liệu"; Chiến dịch: [DS] cần mã chiến dịch trên đơn (POS) rồi mới tính GMV/DTT/AOV theo chiến dịch.
   - Rủi ro: thấp tới trung bình (FE cần xử lý rỗng).
5. **Sửa M14 và cơ chế Traffic (Nghiêm trọng).**
   - File: `OP:828-874`, `Traffic.cs`, `DashboardTrafficDaily.cs`, heatmap, `KpiV2` evaluator.
   - Làm: M14 chỉ trên các cặp (chi nhánh, ngày) có Traffic; trả số ngày thiếu và "Chưa có Traffic" theo chi nhánh/khu vực/hệ thống; M02g thay cho Sale hoàn thành. Bỏ `AccountId` khỏi khóa Traffic (toàn công ty dùng 1 bộ) – [MIG] + [BF] gộp dữ liệu hiện có (chọn bản mới nhất theo ngày) và đổi chỉ mục duy nhất; thêm bảng `DashboardTrafficHistory` (giá trị cũ, người sửa, thời điểm, nguồn). [BD] cách gộp khi hai tài khoản nhập khác nhau.
6. **Import Traffic và Import mục tiêu bằng Excel (Lớn).**
   - File mới: `Traffic/Import` (template, preview, confirm), `Kpi/Import`; thư viện đọc xlsx; bảng `ImportBatch` (file, người, số dòng thêm/ghi đè/bỏ qua) [MIG].
   - Làm: theo BR-IMP-01..08; Traffic nhập một phần, KPI tất cả-hoặc-không; kiểm quyền theo cửa hàng; chặn ngày tương lai; cảnh báo Traffic < số đơn.
   - [DS] danh mục chi nhánh/khu vực chủ. Rủi ro trung bình.
7. **Sửa mô hình KPI (Lớn/Nghiêm trọng).**
   - File: `KpiPlan.cs`, `KpiMetricTarget.cs`, `KpiV2Service*`, `KpiV2EvaluationService`, `KpiV2ConflictService`, `ReportService.DashboardV2.Kpi.cs`, `DashboardV2Service.Executive.cs`, `BP`, `ReportService.BranchPerformanceHeatmap.cs`.
   - Làm: bỏ `Staff`; thêm metric `Gmv` (bắt buộc >0) và `Dtt`; cho KPI không thuộc `AccountId` (dùng chung công ty, thêm `CreatedBy`, `Source`, `SourceFile`); kiểm khớp chu kỳ; job tự chuyển "Đã kết thúc"; bộ phân giải mục tiêu dùng chung `KpiTargetResolver` thực hiện: phân bổ theo ngày, chiến dịch ghi đè, rollup từ con, trả `null` khi không có KPI; chuyển Executive/Heatmap từ `SaleTarget` sang resolver; migration dữ liệu `SaleTarget` → KpiV2.
   - [MIG] + [BF] (chuyển `AccountId`→dùng chung, backfill `SaleTarget`). [BD] chọn A/B/C ở mục 4.2 và nguồn nạp `data-store-kpi.md`.
8. **Sửa các widget Vận hành sai công thức (Lớn).**
   - Order Aging: [DS] cần trạng thái công đoạn Mài lắp/Vận chuyển và ngày vào công đoạn (nguồn POS); đổi nhóm tuổi thành 0–5/6–10/11–20/>20; tuổi tới "Đến ngày"; bỏ lọc ngày tạo. File `AGE`, entity `ReportPreOrderStatistic`, DTO `OrderAgingItemV2Dto`.
   - Basket: thêm ngưỡng 5.000.000 (5 nhóm), giá trị gồm VAT. `DA:28`, `FC:203`, enum `DashboardV2BasketBuckets` (đổi giá trị enum cần tương thích FE).
   - Demographics: dùng `FC.AgeGroup` (<25/25–34/35–49/≥50/Unknown), tuổi tại ngày tạo đơn, gom khách vãng lai vào "Không xác định".
   - Payment: 6 nhóm; theo ngày thu (E8); lọc `CompleteAt != null`/`CancelAt == null` TRƯỚC khi gom nhóm; Σ = M04. [DS] cần mã phương thức cho ví điện tử, COD, trả góp.
   - Anomaly: cửa sổ 7 ngày trước kỳ lọc (truy vấn thêm 7 ngày trước `StartAt`), σ mẫu (n−1), k cấu hình, chỉ số DTT/Số đơn/Tỷ lệ trả hàng, thực thể khu vực/chi nhánh. `FC:9,232-262`, `OP:644-676`. Cập nhật test và `FormulaVersion`.
   - Benchmark: thêm trường Index, giá trị chuẩn B (hệ thống/khu vực của chính chi nhánh), M18 đúng định nghĩa, giữ chi nhánh thiếu Traffic với giá trị null.
   - Refund: thêm M13b/M13c, mẫu số M01, khớp Waterfall.
9. **Hoàn thiện Sản phẩm (Lớn).**
   - Thêm: ma trận SPH×CYL [DS] (cần SPH/CYL/loại tròng ở dòng hàng), block Thương hiệu phân phối, chiều NCC/Chiết suất/Màu/Nhóm KH [DS], treemap phân cấp có tham số cha (drill-down), SS/ROP theo QĐ-15 [DS] (lead time NCC, nhu cầu theo ngày 90 ngày), tồn hiện tại thực, Top theo số lượng; sửa tăng trưởng "n ngày liền trước", Top 5, mẫu số 0 → null.
   - Lọc Giới tính/Phân khúc/PIC/Trạng thái cho Sản phẩm: [MIG] thêm cột chiều vào `ReportProduct` hoặc truy vấn từ dòng hàng; BR-DIM-01 cần số đơn DISTINCT.
10. **Nhân sự (Lớn).**
    - Điều chỉnh gán người bán đơn gốc; dòng "Chưa gán"; tỷ trọng GMV; Top-3 cờ `IsTopPerformer` theo cửa hàng; endpoint "me" cho STAFF (ép `StaffId` từ Identity) [DS: ánh xạ tài khoản → nhân viên]; Lab từ lệnh gia công [DS] (POS); M19 theo nguồn.
11. **Heatmap V2 (Lớn).**
    - `BranchPerformance` nhận `Range=day|week|month`, trả bucket ISO với `PartialDays`, giá trị gộp (Σ GMV, Σ Traffic, Σ đơn, % mục tiêu, M14), hàng Khu vực; trả `Status` 11 mức theo spec hoặc chỉ trả số cho FE tô màu; loại bỏ `Insight` sinh sẵn. Gỡ heatmap cũ hoặc đặt sau cùng scope.
12. **Bộ lọc/Cache (Lớn/Nhỏ).**
    - Hợp nhất lọc đa chiều: định nghĩa ma trận widget × chiều, trả `UnsupportedFilters` trong `DashboardV2BlockAdminDto`; áp `CategoryIds/BrandIds/OrderStatuses` ở Vận hành, Nhân sự; kiểm `Từ ≤ Đến` và 3 năm; chuẩn hóa biên `EndAt` thành "hết ngày" ở một chỗ (`Normalize`); giảm TTL hoặc gắn sync-version cho mọi block; sửa test lệch `manager.dashboard`.
13. **Dọn test (Nhỏ).** Bỏ các test chốt hành vi mock (`PersonnelDemoFixturesMatchTheReferenceDashboard`, `PersonnelResponseUsesCsatAndMockMetadata…`), bổ sung test theo TC/INV trong spec §9.

---

## (6) Câu hỏi mở

1. Mapping vai trò: `manager.dashboard.read` + `admin` → BOD/MANAGER/STAFF được suy ra thế nào? Có scope theo chi nhánh trong Identity (pos.api) mà Report API có thể đọc từ token không, hay phải gọi POS?
2. "Cửa hàng được gán" của MANAGER lấy từ đâu: Identity scope, `ReportStaffWorkingSite`, hay `RegionSite` của tài khoản? Hiện `RegionSite` do từng tài khoản tự cấu hình.
3. Danh mục khu vực chủ (BR-MD-01, QĐ-04: HCM/Miền Đông/Miền Tây/Miền Bắc/Miền Trung) hiện nằm ở đâu? `Region` đang thuộc từng tài khoản. Cần một danh mục toàn công ty không?
4. Traffic: giữ phân theo tài khoản (mỗi người nhập riêng) hay chuyển thành dữ liệu chung toàn công ty? Nếu chung, xử lý dữ liệu hiện có của nhiều tài khoản thế nào?
5. KPI: chọn phương án A/B/C ở mục 4.2 cho mục tiêu theo loại ngày; ai nhập `data-store-kpi.md` và đối chiếu tên cửa hàng với `ReportSite`.
6. KPI "Revenue" hiện tính trên net no VAT: giữ làm DTT hay đổi sang GMV (PM-01 yêu cầu % đạt dùng GMV)?
7. Order Aging: POS có trạng thái/ngày vào công đoạn "Mài lắp" và "Vận chuyển" ở Order/WMS không? Nếu không, widget phải hoãn như QĐ-13.
8. Kênh cửa hàng vs online: trường nào trong POS phân biệt (Site type, nguồn đơn)? Cần cho Time Peak và M14.
9. Mã chiến dịch trên đơn (FR-OP-06) và mã phương thức thanh toán cho ví điện tử/COD/trả góp có trong POS không?
10. Quyền GMV khi bị thu hồi: trả 403 cho block hay trả `null` trường GMV (FE hiện ẩn thẻ)?
11. Ngày "EndAt" gửi từ FE là 00:00 ngày hôm sau hay 23:59:59 của ngày chọn? Cần chốt để thống nhất `<` và `<=`.
12. Test `DashboardV2PermissionTests` chờ `"manager.dashboard"` còn code là `"manager.dashboard.read"`: scope thực tế phát hành bởi Identity là chuỗi nào?
13. Điều chỉnh (trả hàng, kết thúc, hủy) trong `ReportStaff`/`ReportProduct`: sync có gán theo người bán/dòng hàng của đơn gốc (PM-02, §2.5) không? (Phần ingestion do agent khác kiểm tra; cần xác nhận kết quả.)
