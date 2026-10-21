# WAVE 2b — report.api: Chuyển đổi Vận hành (Operational), Sản phẩm (Product), Nhân sự (Personnel) sang cơ sở GMV / Sự kiện doanh thu

- **Repository:** `report.api`, nhánh local `qc/dashboard-v2-wave2b` (kế thừa từ `qc/dashboard-v2-wave2a`). **Chưa push.**
- **Tài liệu đặc tả chuẩn:** `docs/PRODUCT_SPEC_DASHBOARD.md` (v2.1) mục 2.5, 4.2, 4.3, 4.4, 7.3, 7.4, 9; quyết định QĐ-08, QĐ-13, BR-DIM-01, BR-DIM-02, BR-DATA-01, INV-05, INV-09, INV-11.
- **Phạm vi hoàn thành:** Chuyển đổi toàn diện 3 module Vận hành, Sản phẩm, Nhân sự từ cơ sở doanh thu thuần không VAT cũ sang cơ sở GMV và sự kiện doanh thu chuẩn (`ReportRevenueEvent`, `ReportRevenueEventLine`). Hoàn thiện logic bảng xếp hạng người bán, dòng "Chưa gán người bán", gắn cờ Top-3 "Nhân viên xuất sắc", góc nhìn cá nhân (SelfView), che quyền GMV (RBAC Masking) và bộ kiểm thử bất biến/golden dataset.

---

## 1. Danh sách Commit (nhánh `qc/dashboard-v2-wave2b`)

| # | Commit | Nội dung tóm tắt |
|---|---|---|
| 1 | `769402e` | **Data Model Wave 2b:** Bổ sung thực thể POS mirror, các cột thuộc tính kênh bán (`SalesChannel`), chiến dịch (`CampaignCode`, `CampaignName`), thông tin khách hàng (`CustomerGender`, `CustomerBirthday`, `CustomerGroupId`), thuộc tính dòng hàng (`SupplierId`, `SupplierName`, `BrandId`, `BrandName`, `CategoryId`, `CategoryName`, `IsLens`, `Sph`, `Cyl`, `Axis`, `Add`, `LensType`, `Color`, `Material`) trên `ReportRevenueEvent` & `ReportRevenueEventLine`; mở rộng cấu hình `DashboardV2Appsetting`. |
| 2 | `8943def` | **Đồng bộ dữ liệu đa chiều:** Đồng bộ kênh bán (Store vs Online), chiến dịch khuyến mãi/voucher/coupon, hồ sơ khách hàng, nhà cung cấp, thương hiệu, phân khúc tròng kính vào sự kiện doanh thu; migration `20261017131707_AddDashboardV2WaveTwoBDimensions`. |
| 3 | `ada1395` | **Vận hành (Operational) trên cơ sở GMV:** Khung giờ cao điểm (Time Peak) theo kênh cửa hàng, nhân khẩu học (Demographics), cơ cấu giỏ hàng (Basket), tỷ lệ trả hàng, phân loại 6 nhóm hình thức thanh toán (CASH, TRANSFER, CARD, WALLET, COD, INSTALLMENT), hiệu quả chiến dịch, benchmark M18/M14 kèm chỉ số Index; đánh dấu Order Aging là `Unavailable` (do thiếu log công đoạn POS). |
| 4 | `4aa6b7d` | **Sản phẩm (Product) trên cơ sở dòng GMV:** Top-5 tăng trưởng/suy giảm, phân tích 10 chiều (Ngành hàng, Nhà cung cấp, Thương hiệu tròng, Phân khúc giá, Nhóm khách, Kênh bán, v.v.), biểu đồ Treemap phân cấp 3 tầng, ma trận độ cận/loạn SPH x CYL, cơ cấu thương hiệu gọng/kính mát, top sản phẩm cảnh báo tồn kho an toàn (SS/ROP) theo BR-DIM-01. |
| 5 | `09453fa` | **Nhân sự (Personnel) trên cơ sở sự kiện GMV:** Bảng xếp hạng PIC bán hàng xếp theo GMV, bổ sung dòng "Chưa gán người bán" bảo toàn INV-09, cờ Top-3 người bán xuất sắc theo từng cửa hàng (`IsTopPerformer`), khối góc nhìn cá nhân `SelfView` (tăng trưởng GMV so với kỳ trước, thứ hạng $r/n$ cùng vai trò trong cửa hàng, thanh tỷ lệ `RankBar`, so sánh AOV cá nhân với cửa hàng), bảo lưu các khối cấm/không có nguồn (`WeeklyKpi`, `Gamification`, `Refractionist`, `Lab`) ở trạng thái rỗng/obsolete, đăng ký thuộc tính che quyền GMV (`StoreAverageGmv`, `GmvGrowthRate`), bổ sung test TC-04, TC-10, INV-09, INV-11 và query translation. |

---

## 2. Quyết định đã áp dụng trong Wave 2b

### 2.1. Vận hành (Operational)
- **Cơ sở tính toán:** Toàn bộ chỉ số doanh thu trong trang Vận hành chuyển sang cơ sở sự kiện GMV (`ReportRevenueEvent.InScope(...)`).
- **Khung giờ cao điểm (TimePeak):** Lọc theo kênh bán tại cửa hàng (`StoreChannelOnly()`), gom nhóm theo ngày trong tuần (`DayOfWeek`) và giờ trong ngày (`Hour`), phân loại ma trận nhiệt độ (Heatmap) theo GMV và số lượt đơn.
- **Nhân khẩu học & Khách hàng:** Phân tích độ tuổi và giới tính từ ngày sinh (`CustomerBirthday`) và giới tính (`CustomerGender`) đồng bộ từ bảng khách hàng POS; tỷ lệ khách quay lại (`ReturningCustomers`) đếm các khách hàng đã có đơn trước khoảng lọc.
- **Hình thức thanh toán:** Áp dụng bộ phân loại thanh toán chia thành 6 nhóm chuẩn (`CASH`, `TRANSFER`, `CARD`, `WALLET`, `COD`, `INSTALLMENT`), đối soát với M04 (tổng tiền thu).
- **Chiến dịch (Campaigns):** Gom nhóm sự kiện theo mã chiến dịch (`CampaignCode`), tên chiến dịch (`CampaignName`), phân tách GMV, số đơn và tỷ lệ đóng góp.
- **Order Aging (Tuổi thọ đơn theo công đoạn):** Đánh dấu trạng thái `Unavailable` (Status = Unavailable, MockFields chứa các trường công đoạn) vì POS không ghi nhận mốc thời gian chuyển giao công đoạn mài lắp (xem mục 3 - D1).

### 2.2. Sản phẩm (Product)
- **Cơ sở dòng hàng:** Dùng bảng dòng sự kiện doanh thu `ReportRevenueEventLine` liên kết qua `InScope` và `RevenueLineFilter`.
- **Top 5 tăng trưởng / suy giảm:** So sánh GMV giữa kỳ hiện tại và kỳ trước $[S-n, S-1]$, tính tỷ lệ phần trăm tăng trưởng và giá trị tuyệt đối.
- **10 chiều phân tích (BR-DIM-01):**
  1. Ngành hàng (Category): Tròng kính, Gọng kính, Kính mát, Phụ kiện, v.v. Bảo toàn $\Sigma \text{Category GMV} = M01$ (INV-05).
  2. Nhà cung cấp (Supplier): Gom theo `SupplierId` lấy từ đơn mua gần nhất của sản phẩm.
  3. Thương hiệu tròng kính (Lens Brand): Lọc riêng cho sản phẩm ngành tròng.
  4. Phân khúc giá (Price Segment): Gom nhóm theo đơn giá dòng hàng ($\le 500k, 500k-1M, 1M-3M, > 3M$).
  5. Nhóm khách hàng (Customer Group): Đồng bộ từ `CustomerGroup` của POS.
  6. Kênh bán hàng (Sales Channel): Cửa hàng vs Online.
  7. Thương hiệu gọng / kính mát (Frame/Sunglasses Brand).
  8. Thuộc tính tròng kính (Chỉ số khúc xạ, chiết suất, tính năng tròng).
  9. Ma trận độ cầu x độ trụ (SPH x CYL): Lấy từ độ đo mắt kính của đơn hàng (`MeasurementTicket`).
  10. Tồn kho cảnh báo (SS/ROP): Kết hợp số bán kỳ này và mức tồn kho cuối ngày từ `ReportProduct`.
- **Treemap phân cấp:** Cấu trúc 3 cấp (Ngành hàng -> Thương hiệu -> Sản phẩm) với diện tích tỷ lệ theo GMV.

### 2.3. Nhân sự (Personnel)
- **Bảng xếp hạng người bán (Leaderboard):**
  - Xếp hạng theo **GMV người bán** (`Gmv`) từ các sự kiện tạo đơn (`PreOrderCreated`, `DirectSale`) có gán nhân viên.
  - Sử dụng phương pháp xếp hạng chuẩn (Competition Ranking: cùng GMV đồng hạng, người kế tiếp nhảy bước).
  - Tỷ trọng đóng góp (`GmvShare`): Tính theo tỷ lệ $\%$ trên tổng GMV phạm vi, tổng các dòng luôn bảo toàn 100%.
  - Số lượng đơn (`OrderCount`): Là tổng số đơn phát sinh GMV ($M02g$).
  - Giá trị đơn trung bình (`Aov`): Bằng doanh thu thuần có VAT chia cho số đơn thuần ($M06 / M02$). Các sự kiện điều chỉnh (Trả hàng, Kết thúc, Hủy) được quy về đúng người bán của đơn gốc. Khi số đơn thuần $\le 0$, giá trị AOV trả về `null` ("—").
- **Dòng "Chưa gán người bán" (Unassigned Row):**
  - Các sự kiện doanh thu không có `StaffId` (hoặc `StaffId = null`) được gom thành một dòng riêng biệt: `StaffId = Guid.Empty`, `StaffName = "Chưa gán người bán"`, `IsUnassigned = true`, `Rank = null`, `StoreRank = null`.
  - Đảm bảo bất biến **INV-09**: Tổng GMV tất cả các dòng trên Leaderboard (kể cả dòng chưa gán) luôn bằng $M01$ của phạm vi lọc.
- **Cờ Top-3 nhân viên xuất sắc (`IsTopPerformer`):**
  - Đánh dấu `true` cho 3 nhân viên có GMV cao nhất trong nội bộ từng cửa hàng trong kỳ lọc (ngưỡng $N=3$ cấu hình qua `DashboardV2Options.TopStaffCount`, chỉ áp dụng khi GMV $> 0$).
- **Góc nhìn nhân viên (SelfView - STAFF view):**
  - Dành riêng cho nhân viên xem hiệu quả của chính mình (hoặc quản lý xem chi tiết nhân viên được chọn).
  - Hiển thị GMV cá nhân (`Gmv`) và tỷ lệ tăng trưởng so với kỳ trước $[S-n, S-1]$ (`GmvGrowthRate`).
  - Thứ hạng nội bộ cửa hàng: Thứ hạng `RoleRank` trên tổng số nhân viên cùng vai trò `RoleCount` ($r/n$).
  - Thanh xếp hạng `RankBar`: $(n - r + 1) / n$.
  - So sánh AOV: AOV cá nhân (`Aov`) đặt cạnh AOV trung bình của cửa hàng (`StoreAov`).
  - Mức độ hài lòng (`Satisfaction`): Luôn trả về `null` do POS chưa có dữ liệu đánh giá CSAT/NPS theo từng nhân viên.
  - Bảo đảm RBAC: Endpoint tự động gán `StaffIds = [User.StaffId]` đối với tài khoản vai trò STAFF (`DashboardV2AccessService`).
- **Loại bỏ hoàn toàn chỉ tiêu / gamification cá nhân (QĐ-08, QĐ-13):**
  - Các khối `WeeklyKpi`, `Gamification`, `Refractionist` đánh dấu `[Obsolete]` và luôn trả về khối rỗng (`EmptyPersonnel`), không còn tạo fixture hoặc mock status (BR-DATA-01).

---

## 3. Khảo sát mã nguồn POS (`pos.api`, nhánh main)

| Quyết định | Nội dung khảo sát | Vị trí mã nguồn (`pos.api`) | Kết luận áp dụng |
|---|---|---|---|
| **D1: Order Aging** (Tuổi thọ đơn theo công đoạn) | POS chỉ lưu chuyển trạng thái cho đơn hàng thông qua `ObjectStateLog` (với `TargetType = SaleOrder = 1`). Không có bất kỳ bảng hay log nào ghi nhận thời điểm chuyển giao các công đoạn gia công mài lắp ("Chờ mài", "Đang mài", "Lắp ráp", "KCS", v.v.). Đơn đặt `PreOrder` hoàn toàn không có `ObjectStateLog`. | `pos.api/Src/Domain/Entities/ObjectStateLog.cs:4-45`<br>`pos.api/Src/Domain/Constants/ObjectStateLogTargetTypes.cs:3-9`<br>`pos.api/Src/Application/Services/SaleOrderService.cs:4946-4960` | Không thể dựng lại thời gian nằm tại từng công đoạn nếu không giả lập dữ liệu. Theo quy tắc BR-DATA-01 và chỉ đạo lead, khối Order Aging được đánh dấu **Unavailable**. |
| **D2: Kênh bán (Store vs Online)** | POS phân định cửa hàng trực tiếp và sàn/kênh online qua trường `Site.EcomSourceId`. Nếu chi nhánh có liên kết sàn e-com (`Site.EcomSourceId != null`) thì thuộc kênh Online, ngược lại là Cửa hàng (Store). Ngoài ra trên đơn hàng có trường `SaleOrder.IntegrateSource` và `SaleOrder.EcomSourceId`. | `pos.api/Src/Domain/Entities/Site.cs`<br>`pos.api/Src/Domain/Entities/SaleOrder.cs:133,211` | Đồng bộ trường `SalesChannel` trên `ReportRevenueEvent` thành `"Online"` khi `Site.EcomSourceId != null` hoặc đơn có nguồn tích hợp, ngược lại là `"Store"`. |
| **D3: Mã chiến dịch & Phương thức TT** | 1. **Khuyến mãi/Voucher/Coupon:** POS liên kết đơn hàng với chiến dịch qua các bảng quan hệ nhiều-nhiều: `PromotionCampaignSaleOrder`, `VoucherCampaignPreOrder`, `CouponCampaignSaleOrder` nối tới bảng định nghĩa chiến dịch `PromotionCampaign`, `VoucherCampaign`, `CouponCampaign`.<br>2. **Mã thanh toán:** POS định nghĩa danh mục tại `PaymentTypeController` với các mã chuẩn: `CASH`, `TRANSFER`, `CARD`, `WALLET`, `COD`, `INSTALLMENT`. | `pos.api/Src/Domain/Entities/PromotionCampaignSaleOrder.cs`<br>`pos.api/Src/Domain/Entities/VoucherCampaignPreOrder.cs`<br>`pos.api/Src/Domain/Entities/CouponCampaignSaleOrder.cs`<br>`pos.api/Src/WebApi/Controllers/Commons/PaymentTypeController.cs:11-88` | Bổ sung đồng bộ `CampaignCode` và `CampaignName` vào `ReportRevenueEvent`. Áp dụng bảng ánh xạ 6 nhóm phương thức thanh toán chuẩn đồng nhất giữa M04 và widget phân tích thanh toán. |
| **D4: Dữ liệu Lab & Hao hụt** | Khảo sát toàn bộ thực thể POS cho thấy: không tồn tại bảng hay dịch vụ quản lý phòng Lab quang học (ngày hẹn trả kính mài, tiến độ gia công). Dịch vụ duy nhất có chữ "Scrap" trong POS là `EcomUninspectedScrapService`, dùng để xử lý hàng hóa sàn thương mại điện tử bị lỗi/hỏng hoàn về kho, hoàn toàn không liên quan đến hao hụt gia công mài tròng. | `pos.api/Src/Application/Services/EcomUninspectedScrapService.cs:1-60` | Khối `Lab` trên trang Nhân sự không có nguồn dữ liệu thực tế từ POS. Khối này được trả về ở trạng thái `Partial` với danh sách `MockFields` tương ứng, không sinh số liệu giả. |

---

## 4. Migrations Cơ sở dữ liệu

Trong wave 2b, migration sau đã được bổ sung vào `Src/Infrastructure/Migrations/Pending/`:
- **`20261017131707_AddDashboardV2WaveTwoBDimensions`**:
  - Mở rộng bảng `ReportRevenueEvent`: thêm các cột `SalesChannel`, `CampaignCode`, `CampaignName`, `CustomerGender`, `CustomerBirthday`, `CustomerGroupId`, `CustomerGroupName`.
  - Mở rộng bảng `ReportRevenueEventLine`: thêm các cột `SupplierId`, `SupplierName`, `BrandId`, `BrandName`, `CategoryId`, `CategoryName`, `IsLens`, `Sph`, `Cyl`, `Axis`, `Add`, `LensType`, `Color`, `Material`.
  - Tạo các chỉ mục tối ưu hóa truy vấn tổng hợp đa chiều theo `(SiteId, EventDate)`, `(CategoryId)`, `(SupplierId)`, `(BrandId)`.

---

## 5. Thay đổi Hợp đồng API (API Contract Changes)

> **Đính chính của PM (18/10/2026):** đường dẫn endpoint trong bản gốc do worker ghi không đúng. Route thật nằm trong `report.api/Src/WebApi/Controllers/Admins/V2/DashboardV2Controller.cs` và đã được sửa ở các tiêu đề mục 5.

### 5.1. Vận hành (`POST Admin/V2/Dashboard/Operational` và các endpoint con `Operational/*`)
- **Khung giờ cao điểm (`TimePeak`):**
  - Trả về danh sách ma trận nhiệt độ theo `DayOfWeek` (0..6) và `Hour` (0..23), kèm `OrderCountDelta` và `GrossValue`.
- **Phương thức thanh toán (`PaymentMethods`):**
  - Trả về danh sách chuẩn hóa 6 nhóm: `CASH`, `TRANSFER`, `CARD`, `WALLET`, `COD`, `INSTALLMENT`. Tổng giá trị các nhóm khớp với số liệu thu thực tế M04.
- **Tuổi thọ đơn hàng (`OrderAging`):**
  - Trả về `Status = "Unavailable"`, `Data = null`, `MockFields = ["PendingLensOrders", "InLabOrders", "CompletedLabOrders", "AverageAgingHours"]`.

### 5.2. Sản phẩm (`POST Admin/V2/Dashboard/Product` và các endpoint con `Product/*` (Growth, DimensionAnalysis, Treemap, LensMatrix, BrandDistribution, TopProducts, Inventory))
- **Top tăng trưởng / suy giảm (`TopGrowth` / `TopDecline`):**
  - Trả về Top 5 sản phẩm có mức tăng/giảm GMV lớn nhất kèm tỷ lệ $\%$ tăng trưởng (`GrowthRate`) và chênh lệch tuyệt đối (`GrowthAmount`).
- **Phân khúc giá (`PriceSegments`):**
  - Chuẩn hóa 4 phân khúc giá dòng hàng: `Under500k`, `From500kTo1M`, `From1MTo3M`, `Above3M`.
- **Ma trận khúc xạ (`LensPowerMatrix`):**
  - Danh sách tọa độ `(Sph, Cyl, LensType, Quantity)` phục vụ vẽ heatmap độ cận x loạn thị.
- **Biểu đồ Treemap (`Treemap`):**
  - Cấu trúc cây 3 tầng phân cấp `Category -> Brand -> Product` với `Gmv` và `Quantity`.

### 5.3. Nhân sự (`POST Admin/V2/Dashboard/Personnel`)
- **Bảng xếp hạng (`Leaderboard`):**
  - Thêm trường `IsUnassigned` (`bool`): Đánh dấu dòng tổng hợp doanh thu chưa gán nhân viên.
  - Khi `IsUnassigned = true`: `StaffId = Guid.Empty`, `StaffName = "Chưa gán người bán"`, `Rank = null`, `StoreRank = null`, `IsTopPerformer = false`.
  - Thêm trường `GmvShare` (`decimal?`): Tỷ trọng $\%$ GMV trên tổng doanh thu phạm vi.
  - Thêm trường `IsTopPerformer` (`bool`): Cờ đánh dấu Top-3 nhân viên xuất sắc nhất chi nhánh.
  - Trường `Aov` chuyển thành nullable: Trả về `null` khi số đơn thuần $\le 0$.
- **Góc nhìn nhân viên (`SelfView`):**
  - Danh sách `PersonnelSelfViewV2Dto`:
    - `Gmv`: GMV cá nhân trong kỳ.
    - `GmvGrowthRate`: $\%$ tăng trưởng GMV so với kỳ liền trước.
    - `RoleRank`: Hạng của nhân viên trong cửa hàng (cùng vai trò).
    - `RoleCount`: Tổng số nhân viên cùng vai trò tại cửa hàng ($n$).
    - `RankBar`: Tỷ lệ thanh xếp hạng $(n - r + 1) / n$.
    - `Aov`: AOV cá nhân.
    - `StoreAov`: AOV trung bình của toàn cửa hàng.
    - `IsTopPerformer`: Đạt danh hiệu nhân viên xuất sắc của cửa hàng.
    - `Satisfaction`: Luôn là `null` ("—").
- **Các khối loại bỏ (`WeeklyKpi`, `Gamification`, `Refractionist`):**
  - Đánh dấu `[Obsolete]`, dữ liệu trả về mảng rỗng `Items = []` với `Status = "Partial"` để tương thích giao diện cũ mà không vi phạm quy tắc cấm chỉ tiêu cá nhân.

---

## 6. Các trường mới được cấu hình Che quyền GMV (RBAC Masking)

Theo quy định RBAC của Dashboard V2, người dùng thiếu quyền xem doanh thu (`manager.dashboard.read_revenue`) sẽ bị che các giá trị liên quan đến tiền GMV. Các trường mới trong wave 2b đã được đăng ký vào `DashboardV2ResponsePostProcessor.MaskedProperties`:
- `"StoreAverageGmv"`: GMV trung bình cửa hàng trong khối thẻ điểm nhân sự.
- `"GmvGrowthRate"`: Tỷ lệ tăng trưởng GMV cá nhân trong khối SelfView.
- `"GrowthAmount"`: Số tiền tăng trưởng GMV tuyệt đối trong khối Top sản phẩm.

Các trường trên đều được khai báo kiểu nullable (`decimal?`) để thỏa mãn điều kiện kiểm thử phản xạ (`ReflectionTest`) của hệ thống RBAC.

---

## 7. Kết quả Kiểm thử (Verification & Test Results)

### 7.1. Lệnh kiểm tra bắt buộc (Verification Commands)
```bash
cd /Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api
dotnet build Tests/Application.Tests/Application.Tests.csproj -v q 2>&1 | tail -3
dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2" 2>&1 | tail -3
dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~Golden" 2>&1 | tail -3
```

### 7.2. Kết quả thực thi
1. **Biên dịch (Build):**
   ```text
       0 Error(s)

   Time Elapsed 00:00:01.71
   ```
2. **Kiểm thử Dashboard V2 & KPI V2:**
   ```text
     Skipped Report.Application.Tests.DashboardV2OperationalPreOrderSourceTests.PosProjectionReadsCurrentStateAndNullableAmountOnIsolatedPostgres [1 ms]

   Passed!  - Failed:     0, Passed:   440, Skipped:     2, Total:   442, Duration: 6 s - Application.Tests.dll (net9.0)
   ```
   *(Số lượng test pass đạt 440, vượt mức cơ sở 438 test trước wave 2b; 2 test Postgres độc lập được skip theo thiết kế).*
3. **Kiểm thử Bộ dữ liệu Golden (Golden Dataset):**
   ```text
   A total of 1 test files matched the specified pattern.

   Passed!  - Failed:     0, Passed:    15, Skipped:     0, Total:    15, Duration: 173 ms - Application.Tests.dll (net9.0)
   ```

### 7.3. Các ca kiểm thử cốt lõi đã xác minh
- **TC-04 (Xếp hạng nhân viên theo GMV & Điều chỉnh theo đơn gốc):**
  - Toàn hệ thống Tháng 9/2026: NV3 đạt 6.540.000 ₫ (Hạng 1), NV1 đạt 3.260.000 ₫ (Hạng 2), NV2 đạt 2.462.400 ₫ (Hạng 3).
  - Toàn hệ thống Tháng 10/2026: NV2 đạt 4.340.000 ₫ (Hạng 1), NV3 đạt 1.650.000 ₫ (Hạng 2), NV1 đạt 0 ₫ (Hạng 3).
  - Lọc theo chi nhánh CN-A Tháng 9/2026: NV1 đạt Hạng 1/2, NV2 đạt Hạng 2/2.
- **TC-10 (Lọc đa chiều & Ngành hàng theo GMV dòng):**
  - Tròng kính: 6.480.000 ₫ / 4 đơn.
  - Gọng kính: 5.588.000 ₫ / 4 đơn.
  - Phụ kiện: 194.400 ₫ / 1 đơn.
  - Tổng GMV 3 ngành hàng: 12.262.400 ₫ = M01 (INV-05).
- **INV-09 (Bảo toàn tổng GMV người bán):**
  - Tổng GMV của tất cả các dòng trên bảng xếp hạng (bao gồm cả dòng "Chưa gán người bán") luôn chính xác bằng $M01$ của phạm vi lọc.
  - Tỷ trọng GMV (`GmvShare`) của các dòng cộng lại chính xác bằng 100%.
- **INV-11 (Khớp nối số tiền giữa các trang):**
  - Tổng GMV và Doanh thu thuần có VAT hiển thị trên các trang Vận hành, Sản phẩm, Nhân sự đối soát hoàn toàn khớp với chỉ số tài chính $M01$ và $M06$ trên trang Tổng quan (Executive) cho cùng điều kiện lọc.
- **Dịch truy vấn sang SQL (Query Translation):**
  - Toàn bộ truy vấn sự kiện GMV đa chiều (Operational, Product, Personnel) đều dịch thành công sang câu lệnh SQL native PostgreSQL với `GROUP BY`, `SUM`, `IN`, v.v., không bị lỗi evaluation ở phía client.

---

## 8. Giới hạn còn lại (Limitations)

1. **Dữ liệu tuổi thọ đơn hàng (Order Aging):** POS không có bảng lưu lịch sử thời điểm chuyển giao các công đoạn gia công mài kính nên khối này tiếp tục để `Unavailable`. Khi nào POS phát triển tính năng tracking công đoạn mài lắp thì backend mới có thể kết nối dữ liệu thật.
2. **Dữ liệu phòng Lab (Lab Scrap & Due Date):** Chưa có bảng quản lý tiến độ gia công và tỷ lệ hao hụt tròng tại phòng Lab, khối Lab tiếp tục để `Partial` (không hiển thị fixture).
3. **Mức độ hài lòng theo nhân viên (CSAT cá nhân):** POS chỉ có bảng đánh giá chung hoặc theo đơn, chưa định danh nhân viên phục vụ trên phiếu đánh giá; trường `Satisfaction` trong `SelfView` trả về `null`.
