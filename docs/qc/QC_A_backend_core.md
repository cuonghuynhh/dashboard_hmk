# QC-A — Rà soát backend lõi Dashboard V2 (ingestion, chỉ số tài chính, Executive)

- Phạm vi: pha 1, chỉ đọc, không sửa code. Chuẩn đối chiếu: `docs/PRODUCT_SPEC_DASHBOARD.md` v2.0 (mục 0, 2, 3, 4.1, 4.2, 9, 10, 11; lướt 7.1).
- Code được rà: `report.api` nhánh `main` @ `c6f2324` (đã gộp `929-New-Dashboard`). Nguồn dữ liệu: `pos.api` `main`. Có đọc thêm `pos.gui` (nhánh `929-new-dashboard`) chỉ để truy nguồn thông báo trên ảnh chụp màn hình.
- Quy ước đường dẫn: `RA` = `report.api/Src/...`, `PA` = `pos.api/Src/...`, `GUI` = `pos.gui/src/pages/dashboard-v2/...`. Số sau dấu `:` là số dòng.
- Mức độ lỗi theo mục 0.4 của spec (Nghiêm trọng / Lớn / Nhỏ).
- Giả định khi chạy tay bộ golden (mục 4): (A1) dữ liệu golden được nạp bằng luồng POS bình thường; (A2) `SaleOrder.ProductAmount` = Σ giá niêm yết × SL của các dòng (POS tính tại `PA/Application/Services/SaleOrderService.cs:2235`, **trước** giảm giá cấp đơn); (A3) `PaidAmount` của đơn hàng sinh từ đơn đặt đã gồm tiền cọc chuyển sang; (A4) job đồng bộ đã chạy sau 31/10/2026 cho mọi ngày. Nếu A2/A3 sai thì con số dự đoán lệch, nhưng kết luận Đạt / Không đạt không đổi (đã kiểm từng ca).

---

## (0) Tóm tắt điều hành

1. **Mô hình doanh thu của code khác hẳn spec.** Code tính trên cơ sở tiền thực thu: "Doanh thu thuần" = Σ `SaleOrder.PaidAmount` − Σ `ReturnSaleOrder.PaidAmount` (`RA/Application/Services/DashboardV2/DashboardV2Service.Executive.cs:384-386`). "Giá trị điều chỉnh" = DTT − GMV, một số dư không có ý nghĩa nghiệp vụ, có thể **dương** (vi phạm INV-02). Spec cần: DTT = GMV − (trả hàng + kết thúc + hủy đơn đặt).
2. **GMV sai gần như mọi điều kiện của M01.** GMV = Σ `SaleOrder.ProductAmount` (trước giảm giá cấp đơn, vi phạm BR-VAL-01) của đơn hàng đã hoàn thành. Đơn hàng sinh từ đơn đặt **được tính** (vi phạm INV-10). Đơn đặt "Đơn tạm" chưa chuyển đổi (O4, O7, O9) **không bao giờ** vào GMV.
3. **Ngày ghi nhận sai.** `SaleOrder.IssueAt` trong POS bị ghi đè bằng **thời điểm hoàn thành** (`PA/.../SaleOrderService.cs:1809, 1917`). Code gom theo `IssueAt` nên GMV của O10 (tạo 30/09, hoàn thành 02/10) rơi vào tháng 10, không phải tháng 9. BR-EVT-02 (và TC-05) không thể đạt.
4. **Không biểu diễn được E1, E5, E6, E9.** Thực thể `PreOrder` trong `report.api` chỉ có `StateId, CompleteAt, CancelAt, SiteId, NeedPayAmount` (`RA/Domain/Entities/Pos/PreOrder.cs`). Thiếu `SubmitAt`, `IssueAt`, `CompleteAtEnd` (cờ "Kết thúc" của POS), `ProductAmount`, `StaffId`, các dòng hàng. Nên không thể có M05b, M05c, M13b, M13c, và Volume M02 không trừ được Kết thúc/Hủy.
5. **Chưa có:** M10 Nợ treo (không có bất kỳ truy vấn công nợ nào), M09 UPT trên thẻ Executive, M12/M13 trong Executive (chỉ có ở Operational và theo cơ sở tiền thực thu), M05a/b/c tách riêng, bảng xếp hạng thiếu cột % đạt mục tiêu và tỷ lệ trả hàng.
6. **Mục tiêu (BR-TGT) lấy sai nguồn.** Executive, Branch và Heatmap dùng bảng cũ `SaleTarget` (mục tiêu theo ngày, loại ngày Trong tuần / Cuối tuần / Lễ) chứ không phải KPI "Đang áp dụng" (`DashboardV2Service.Executive.cs:1137-1161`). Cấu trúc này khớp `data-store-kpi.md` (mục tiêu ngày theo cửa hàng, trong tuần và cuối tuần). % đạt tính trên DTT không VAT thay vì GMV. Không có KPI thì trả 0% thay vì "Chưa thiết lập mục tiêu".
7. **So sánh kỳ (BR-CMP-01) khác spec.** Code dùng WoW/MoM/YoY theo lịch, mặc định `None` (không so sánh), trong khi spec yêu cầu mặc định so với kỳ liền trước cùng số ngày. Mẫu số âm vẫn ra %, spec yêu cầu "—".
8. **Cơ chế đồng bộ có lỗi cấu trúc.** Job Hangfire production chỉ ghi trạng thái cho `OrderFact` và `PaymentFact`; `PreOrderFact` và `CustomerFirstPurchaseFact` chỉ được ghi ở đường "local backfill" (`RA/Application/Services/Report/ReportService._Base.cs:437-471`). Hệ quả: trên production, thẻ KPI và Trend **luôn** báo "một phần chưa đồng bộ" (`DashboardV2DataAvailability.cs:151-152, 201-204`). Job chạy 1 lần/ngày lúc 23:45 (giờ VN).
9. **Ảnh chụp màn hình:** hai thông báo (KPI "Đang tải dữ liệu…" và Waterfall "Một phần chỉ số chưa đồng bộ") do **frontend** sinh ra khi block KPI **chưa có dữ liệu** (xem mục 6). Xác nhận bằng Network tab: request `POST /Admin/V2/Dashboard/Executive/Kpis` đang treo, hoặc trả lỗi rồi FE âm thầm fallback sang `/Executive` (nặng hơn). Nguyên nhân backend khả dĩ nhất: schema chưa áp dụng (migrations nằm ở thư mục `Pending`, chỉ chạy khi `Migration:ApplyOnStartup=true`), hoặc truy vấn quá chậm. Không phải lỗi công thức availability.
10. **Kết quả golden:** TC-01, 02, 03, 05, 08, 11 đều **Không đạt**. TC-06 đạt từng phần (POS lưu sẵn VAT theo dòng tại thời điểm tạo đơn, nhưng thẻ Executive không dùng số này). TC-11 không thể chạy (không có KPI cấp công ty).
11. **Điểm cộng:** gom theo ngày VN (UTC+7) đúng; giá trị âm được giữ; tổng theo chi nhánh = tổng khu vực (INV-03) đúng theo cấu trúc; không có số ngẫu nhiên; phí ship nằm ngoài `ProductAmount` (lưu ở `OrderShippingInfo.ShippingFee`).
12. **Lỗ hổng phân quyền** (ngoài phạm vi nhưng nghiêm trọng): `EnsureRequestedScope` đã **comment** đoạn kiểm tra chi nhánh có thuộc phạm vi tài khoản (`RA/.../DashboardV2Service._Base.cs:91-105`). Có thể truyền `SiteIds` bất kỳ.
13. **Test hiện có mã hóa sẵn hành vi sai** (mục 7 trong phần phụ lục cuối file) và phải sửa ở pha 2.

---

## (1) Bảng ánh xạ dữ liệu và trạng thái

### 1.1. Đường đi dữ liệu POS → report.api

| Bước | Mô tả | Evidence |
|---|---|---|
| Kết nối | `report.api` đọc **trực tiếp** DB POS qua `PosDb` (DbContext thứ hai, entity bản rút gọn ở `RA/Domain/Entities/Pos/*`). Không có API hay event stream. | `RA/Application/Services/Report/ReportService.Order.cs:122-155` |
| Lịch chạy | Hangfire (cron theo UTC): `Report.SyncCurrentDateData` 16:30 (=23:30 VN) → `SyncData(hôm nay)`; `Report.SyncDashboardStatisticsIncremental` 16:45 (=23:45 VN); `ReportSite.SyncFromPos` 17:00. **Mỗi ngày một lần.** | `RA/WebApi/Hangfire/HangfireStartup.cs:13-15` |
| Cửa sổ incremental | `startAt = min(OrderFact.LastSourceUpdatedAt.Date, PaymentFact.LastSourceUpdatedAt.Date)` đến `now.Date`. Mỗi ngày chạy lại ngày của lần chạy trước và hôm nay. | `ReportService.DashboardV2.Sync.cs:14-27, 69-89` |
| Mỗi ngày | `SyncDataInternal(date)` → đồng bộ chi nhánh/nhân viên/ngành hàng → `WriteReportOrder` + Rating/Product/Customer/Staff/ResponseRate. Khóa phân tán `Report.SyncData` (12 giờ) và transaction bao toàn bộ khoảng. | `ReportService._Base.cs:406-433`; `Sync.cs:91-156` |
| Bảng fact V2 | `ReportOrderStatistic` (mỗi dòng 1 đơn bán/trả/đổi), `ReportPaymentStatistic` (phiếu thu `CUSTOMERPAID`), `ReportCustomerFirstPurchase`, `ReportPreOrderStatistic` (chỉ cho widget tồn đọng), `ReportStatisticSyncState` (mốc "dữ liệu tính đến"). | `ReportService.Order.cs:260-308, 347-401`; `ReportService.DashboardV2.PreOrderSync.cs` |
| Bảng tổng hợp ngày | `ReportOrder` (hạt: chi nhánh × ngày VN × ngành hàng, dòng `ProductCategoryId = null` là tổng chi nhánh). Cột V1 (`SaleAmount`, `ReturnAmount`…) và cột V2 (`Dashboard*`). Executive đọc từ đây. | `DashboardV2ReportAggregate.cs:140-173`; `Executive.cs:884-927` |
| Cột V2 tính ở đâu | `RebuildDashboardV2ReportOrderFields` group `ReportOrderStatistic` theo (chi nhánh, ngày `IssueAt+7h`). | `ReportService.Order.cs:420-475` |
| Cache | `IApplicationMemoryCacheService`, TTL 2 giờ, không single-flight. Chỉ bị xóa khi sync commit thành công. | `ApplicationMemoryCacheService.cs:23-38`; `Sync.cs:151-155` |

**Cột POS mà report.api đọc:**
- `SaleOrder`: `IssueAt, SubmitAt, CompleteAt, CancelAt, ProductAmount, DiscountAmount, TotalDiscountAmount, PaidAmount, NeedPayAmount, NeedPayAmountBeforeRound, NeedPayAmountIgnoreVat, VatAmount, SubTotalCostPrice, Quantity, ExchangeParentId, PreOrderId, StaffId, SiteId, CustomerId`; dòng hàng `SaleOrderItem` (`Price, Quantity, SubTotal, AmountIgnoreVat, VatAmount, SubTotalCostPrice`).
- `ReturnSaleOrder`: `IssueAt, CompleteAt, CancelAt, PaidAmount, NeedPayAmount*, VatAmount, SiteId, StaffId, SaleOrderId, ExchangeSaleOrderId`.
- `PaymentOrder`: `IssueAt, CompleteAt, CancelAt, ActualAmount, PaymentMethod, PaymentType (Code = "CUSTOMERPAID"), SiteId, StaffId`.
- `PreOrder`: **chỉ** `StateId, CompleteAt, CancelAt, SiteId, NeedPayAmount` (+ `CreateAt/UpdateAt/DeleteAt`) → bảng `ReportPreOrderStatistic`.

### 1.2. Bảng ánh xạ trạng thái (spec §2.2) — đã điền

| Trạng thái nghiệp vụ | Mã / tên trạng thái trong POS | Bảng / trường | Code report.api xử lý thế nào | Evidence |
|---|---|---|---|---|
| Đơn đặt — Đơn tạm | `PRE_ORDER_DRAFT = 1` "Đơn tạm", **và** `SubmitAt != null` (khi `SubmitAt = null` là nháp chưa gửi: spec "Nháp / chưa lưu") | `PreOrder.StateId` → `WorkflowState.Code`; `PreOrder.SubmitAt`; `PreOrder.IssueAt` (= `SubmitAt` lúc gửi) | **Không tính vào GMV.** Chỉ có `ReportPreOrderStatistic.StateCode` cho widget tồn đọng. | `PA/Domain/Constants/PreOrderWorkflowStates.cs:5-7`; `PA/Domain/Entities/PreOrder.cs:23-29`; `PreOrderService.cs:1173-1177`; `RA/.../PreOrderSync.cs:92-96` |
| Đơn đặt — Đã chuyển Đơn hàng | Không có state riêng. Nhận biết bằng **tồn tại `SaleOrder.PreOrderId = PreOrder.Id`** (một PreOrder có thể có nhiều SaleOrder, có `SaledQuantity/LeftQuantity`). PreOrder đi tiếp `PRE_ORDER_VERIFIED (2)`, `PRE_ORDER_SHIPPING (3)`, `PRE_ORDER_COMPLETED (4)` "Hoàn thành". | `SaleOrder.PreOrderId`; `PreOrder.CompleteAt` | Đơn hàng sinh từ đơn đặt **được tính vào GMV** như một đơn hàng bình thường (cột `Dashboard*PreOrder*`), tại ngày hoàn thành đơn hàng. | `PA/Domain/Entities/SaleOrder.cs:211`; `PA/.../PreOrderWorkflowStates.cs:9-19`; `DashboardV2ReportAggregate.cs:162-165` |
| Đơn đặt — Kết thúc (không ra Đơn hàng) | POS dùng `PRE_ORDER_COMPLETED (4)` + trường **`PreOrder.CompleteAtEnd`** (ngày bấm Kết thúc), đặt trong `PreOrderService.Complete(id, completeAt, isEndCompleted=true)`. Nhận biết "không ra Đơn hàng": `CompleteAtEnd != null` và không có `SaleOrder` chưa hủy. | `PreOrder.CompleteAtEnd` | **Không đọc `CompleteAtEnd`.** Thực thể `PreOrder` của report.api không có trường này → E5 không biểu diễn được. | `PA/Domain/Entities/PreOrder.cs:37`; `PA/.../PreOrderService.cs:1200-1232`; `RA/Domain/Entities/Pos/PreOrder.cs` |
| Đơn đặt — Hủy | `PRE_ORDER_CANCELLED = -1` "Đã hủy"; `PreOrder.CancelAt` (gán ở `PreOrderService.cs:1111`). Phân biệt "hủy sau khi là Đơn tạm" bằng `SubmitAt != null`. | `PreOrder.CancelAt`, `PreOrder.StateId` | Có `CancelAt` trong `ReportPreOrderStatistic` nhưng **không** dùng cho M05c / M02. | `PA/.../PreOrderWorkflowStates.cs:21-23`; `RA/.../PreOrderSync.cs:107-110` |
| Đơn hàng — Hoàn thành | `SALE_ORDER_COMPLETED = 3` "Hoàn thành"; `SaleOrder.CompleteAt`. Có thêm `ACCEPTED 4`, `TRANSIT 5`, `DELIVERED 6`, `RETURN 7`. | `SaleOrder.StateId`, `SaleOrder.CompleteAt` | Hợp lệ khi `SourceDeleteAt == null && CompleteAt != null && CancelAt == null && ExchangeParentId == null` (không dùng `StateId`). | `PA/Domain/Constants/SaleOrderWorkflowStates.cs`; `DashboardV2ReportAggregate.cs:378-384` |
| Đơn hàng — Hủy | `SALE_ORDER_CANCELLED = -1`; `SaleOrder.CancelAt`. (Còn `UNDELIVERABLE = -2` "Không giao được".) | `SaleOrder.CancelAt` | Đơn hủy bị loại khỏi cột V2 (đúng E7). **Nhưng** đường V1 (`SaleAmount`) không lọc `CancelAt`/`DeleteAt` (`ReportService.Order.cs:122-126`) mà thẻ DTT đọc từ đường V1. | `DashboardV2ReportAggregate.cs:378-384`; `ReportService.Order.cs:122-126` |
| Trả hàng | `RETURN_SALE_ORDER_COMPLETED = 3` "Đã trả"; bảng `ReturnSaleOrder`; liên kết đơn gốc `SaleOrderId`; `ExchangeSaleOrderId` (đổi hàng sau bán, **không có trong spec**). | `ReturnSaleOrder.IssueAt, CompleteAt, SaleOrderId` | Tính vào `ReturnAmount` = `PaidAmount` (tiền hoàn), tại `IssueAt` của phiếu trả, theo **chi nhánh phiếu trả**. | `PA/Domain/Constants/ReturnSaleOrderWorkflowStates.cs`; `ReportService.Order.cs:199-228`; `DashboardV2ReportAggregate.cs:434-442` |
| Phiếu thu | `PAYMENT_ORDER_COMPLETED = 3`; `PaymentType.Code = "CUSTOMERPAID"`; `PaymentOrder.ObjectType`: `PreOrder 5` (cọc), `SaleOrder 2`, `ReturnSaleOrder 3` (hoàn tiền), `MultipleSaleOrder 6` (thu nợ nhiều hóa đơn). | `PaymentOrder` | `ReportPaymentStatistic` chỉ lọc `CUSTOMERPAID`, `CompleteAt != null`, `CancelAt == null`, `DeleteAt == null`. Phục vụ widget "Hình thức thanh toán". **Không dùng cho thẻ M04.** | `PA/Domain/Constants/PaymentOrderObjectTypes.cs`; `ReportService.Order.cs:144-155` |
| Công đoạn: Mài lắp / gia công | `CutTicket` (lệnh cắt), `SaleOrderItem.CutQuantity`; không có công đoạn "Mài lắp" chuẩn hóa trong `SaleOrder`. | `SaleOrder.CutTickets` | Ngoài phạm vi scope QC-A. | `PA/Domain/Entities/SaleOrder.cs:326` |
| Công đoạn: Vận chuyển | `SALE_ORDER_TRANSIT = 5`, `DELIVERED = 6`; `OrderShippingInfo.ShippingFee` (phí ship tách khỏi `ProductAmount`). | `OrderShippingInfo` | Ngoài phạm vi scope QC-A. | `PA/Domain/Entities/OrderShippingInfo.cs:7` |

### 1.3. Bảng ánh xạ thực thể (spec §11.2) — đã điền

| Thực thể nghiệp vụ | Bảng / model POS | Bảng / model report.api | Trường chính | Ghi chú |
|---|---|---|---|---|
| Đơn đặt | `PreOrder` (`PA/Domain/Entities/PreOrder.cs`) | `Pos.PreOrder` (rút gọn), `ReportPreOrderStatistic` | `Code, StateId, IssueAt, SubmitAt, CompleteAt, CancelAt, CompleteAtEnd, ProductAmount, TotalDiscountAmount, NeedPayAmount, VatAmount, PaidAmount, StaffId, SiteId, CustomerId, SaleChannelId` | **Thiếu** `SubmitAt, IssueAt, CompleteAtEnd, ProductAmount, StaffId, CustomerId` ở report.api. Có `ParentOrderId`, `PreOrderType` (Normal/ReOrdering) mà spec chưa nêu. Có nhánh Rocky (`PRE_ORDER_ROCKY_*`). |
| Đơn hàng | `SaleOrder` | `Pos.SaleOrder`, `ReportOrderStatistic` (Kind=Sale), `ReportOrder` | `IssueAt` (**= thời điểm hoàn thành**), `CreateAt` (tạo bản ghi), `SubmitAt, CompleteAt, CancelAt, ProductAmount, TotalDiscountAmount, NeedPayAmount, VatAmount, PreOrderId, ExchangeParentId, StaffId, SiteId, SaleChannelId` | "Ngày tạo đơn" theo spec ≈ `CreateAt`, nhưng code chỉ lưu `CreatedAtSource` mà không dùng để gom. `SaleChannelId`, `IntegrateSource`, `EcomSourceId` cho kênh online: report.api chưa đọc. |
| Dòng hàng | `SaleOrderItem` | `Pos.SaleOrderItem` | `Price, Quantity, SubTotal, AmountIgnoreVat, VatTypeId, VatAmount, SubTotalCostPrice` | VAT dòng được POS chốt tại thời điểm tính đơn (`SaleOrderService.cs:2316-2362`). Không có `PreOrderItem` ở report.api. |
| Phí vận chuyển | `OrderShippingInfo.ShippingFee` | Không đọc | — | Không nằm trong `ProductAmount` / `NeedPayAmount` (đạt BR-VAL-03 theo cấu trúc). |
| Trả hàng | `ReturnSaleOrder`, `ReturnSaleOrderItem` | `Pos.ReturnSaleOrder`, `ReportOrderStatistic` (Kind=Return) | `SaleOrderId, SiteId, StaffId, IssueAt, CompleteAt, PaidAmount, ProductAmount, SubTotalCostPrice` | Code dùng `SiteId`/`StaffId` của **phiếu trả**, không phải đơn gốc (PM-02). Giá trị = `PaidAmount` (tiền hoàn), không phải Σ giá trị dòng trả (BR-VAL-04). |
| Phiếu thu / chi | `PaymentOrder`, `PaymentType`, `PaymentMethod`, `PaymentRefOrder` | `Pos.PaymentOrder`, `ReportPaymentStatistic` | `IssueAt, CompleteAt, ActualAmount, PaymentTypeCode, ObjectType` | Không phân biệt cọc / thanh toán / thu nợ / hoàn tiền / chuyển cọc. Chưa thấy cách loại "chuyển cọc" (E9). |
| Sổ công nợ | `Debt` (`IssueAt, RefType, RefId, TargetType, TargetId, Value, Balance`), `Customer.CurrentDebtAmount` | **Không có** | — | M10 không thể tính. `Customer.CurrentDebtAmount` chỉ là số hiện tại, không có lịch sử cuối ngày. |
| Sản phẩm (lịch sử thuế) | `Product`, `VatType`, `SaleOrderItem.VatTypeId/VatAmount` | `Pos.Product`, `ReportProduct` | `VatTypeId` | Không cần bảng lịch sử thuế vì POS đã chốt `VatAmount` theo dòng tại lúc tạo đơn. |
| Chi nhánh / Khu vực | `Site` | `ReportSite`, `ReportRegion`, `RegionSite` (theo tài khoản) | `SiteId, RegionId, State` | Sync mỗi ngày 17:00 UTC. Khu vực theo tài khoản (`AddAccountScopedRegions`). Chi nhánh `State != Active` bị loại khỏi "Toàn hệ thống" (`Executive.cs:1106-1108`). |
| Nhân viên | `Staff` | `ReportStaff`, `ReportStaffWorkingSite` | `StaffId` | |
| Traffic | Không có ở POS | `DashboardTrafficDaily` | `AccountId, SiteId, LocalDate, TrafficCount` | Nhập tay / import. |
| KPI | Không có ở POS | `KpiPlan`, `KpiPlanScope`, `KpiPlanVersion`, `KpiMetricTarget`, `KpiActualSnapshot` (module KPI V2) **và** `SaleTarget`, `SaleTargetSite`, `Holiday` (mục tiêu cũ) | `TargetSaleAmount, DayType (Weekday/Weekend/Holiday), ApplyAllSite` | Executive dùng `SaleTarget` (cũ), không dùng KPI V2. Xem mục (8). |
| Độ hài lòng / NPS | `Rating` | `ReportRating` | `Rate1..5Count` | Ngoài phạm vi QC-A. |
| Lệnh gia công (Lab) | `CutTicket` | Không có / mock | — | Personnel Lab đang là fixture (`DashboardV2DataAvailability.cs:52, 273-287`). |

---

## (2) Bảng xử lý sự kiện E1–E9

| # | Spec | Code | Kết quả | Evidence |
|---|---|---|---|---|
| E1 | Đơn đặt thành **Đơn tạm**: +GMV, +Volume gộp, ngày tạo Đơn đặt, chi nhánh/người bán của Đơn đặt | **Không có.** `PreOrder` không được dùng cho GMV. Đơn đặt chỉ "xuất hiện" khi đơn hàng sinh ra từ nó **hoàn thành** (tính tại ngày hoàn thành đơn hàng, nằm trong cột `PreOrder*`). Đơn tạm chưa chuyển (O9, O4/O7 trước khi bị trừ) không bao giờ vào GMV. | **Không đạt** (Nghiêm trọng) | `DashboardV2ReportAggregate.cs:162-168`; `RA/Domain/Entities/Pos/PreOrder.cs`; `ReportService.Order.cs:122-126` |
| E2 | Đơn hàng không từ Đơn đặt hoàn thành: +GMV, +Volume, **ngày tạo** Đơn hàng, chi nhánh/người bán của Đơn hàng | Có tính đơn hoàn thành, không hủy, không xóa, không phải đơn đổi (`ExchangeParentId`). **Sai ngày:** gom theo `IssueAt` = thời điểm hoàn thành (POS ghi đè). Chi nhánh/người bán đúng (`SaleOrder.SiteId/StaffId`). Giá trị = `ProductAmount` trước giảm giá cấp đơn. | **Không đạt** (Nghiêm trọng, sai ngày và sai giá trị) | `ReportService.Order.cs:173`; `DashboardV2ReportAggregate.cs:149-165, 378-384`; `PA/.../SaleOrderService.cs:1809` |
| E3 | Đơn đặt chuyển thành Đơn hàng: không tác động GMV | Ngược lại: đơn hàng sinh từ đơn đặt **được cộng** vào GMV và vào `SaleOrderCount`. | **Không đạt** (Nghiêm trọng, vi phạm INV-10) | `DashboardV2ReportAggregate.cs:149, 162-165, 172` |
| E4 | Trả hàng: −điều chỉnh (Trả hàng), giá trị dòng trả gồm VAT, **ngày trả**, gán **đơn gốc** (chi nhánh và người bán) | Ngày trả đúng (`ReturnSaleOrder.IssueAt`, chỉ phiếu `CompleteAt != null`). Giá trị = `PaidAmount` (tiền hoàn, có thể khác giá trị dòng trả: phí trả hàng, làm tròn). Chi nhánh/người bán = của **phiếu trả**, không phải đơn gốc. Phiếu trả đơn **đổi** (`ExchangeSaleOrderId`) cũng bị trừ trong khi đơn mới của lần đổi không được cộng GMV. | **Không đạt** (Lớn) | `ReportService.Order.cs:127-130, 199-206`; `DashboardV2ReportAggregate.cs:434-442, 85-138` |
| E5 | Đơn đặt **Kết thúc** không ra Đơn hàng: −điều chỉnh (Đổi hàng), −Volume, ngày bấm Kết thúc | **Không có.** Không đọc `PreOrder.CompleteAtEnd`. | **Không đạt** (Nghiêm trọng, thiếu hẳn) | `RA/Domain/Entities/Pos/PreOrder.cs`; `PA/Domain/Entities/PreOrder.cs:37` |
| E6 | Đơn đặt **Hủy** sau Đơn tạm: −điều chỉnh (Hủy), −Volume, ngày hủy | **Không có.** `CancelAt` được lưu ở `ReportPreOrderStatistic` nhưng chỉ phục vụ widget tồn đọng. | **Không đạt** (Nghiêm trọng, thiếu hẳn) | `PreOrderSync.cs:107-110`; `ReportPreOrderStatistic.cs` |
| E7 | Đơn hàng Hủy (chưa hoàn thành): không tác động | Đúng ở cột V2 (`CancelAt != null` bị loại, `CompleteAt == null` bị loại). **Sai ở đường V1:** `SaleAmount += PaidAmount` cho mọi đơn `CompleteAt != null` không lọc `CancelAt/DeleteAt` (không có `HasQueryFilter` trong `PosDb`). Thẻ DTT, M04 và bảng xếp hạng đọc từ đường V1. | **Không đạt** (Lớn: đơn đã hoàn thành rồi bị hủy / xóa mềm vẫn nằm trong tiền thu) | `ReportService.Order.cs:122-126, 170-177`; `DashboardV2ReportAggregate.cs:401-414` |
| E8 | Phiếu thu: +Doanh thu thực thu, ngày thu, không gồm ship, theo đơn | Thẻ M04 = `CollectedRevenueWithVat` = Σ `SaleOrder.PaidAmount` theo **ngày đơn** (hoàn thành), không phải Σ phiếu thu theo **ngày thu**. Tiền cọc của đơn đặt chưa chuyển (O4/O7/O9) không vào M04. `ReportPaymentStatistic` có đủ phiếu thu nhưng chỉ dùng cho "Hình thức thanh toán". | **Không đạt** (Nghiêm trọng, sai số) | `Executive.cs:46-47, 988`; `DashboardV2ReportAggregate.cs:407`; `ReportService.Order.cs:347-401` |
| E9 | Chuyển cọc đơn đặt → đơn hàng mới: không phải tiền thu mới | Không có quy tắc. `PaymentOrder` lọc `CUSTOMERPAID` có thể gồm cả bút toán chuyển cọc (POS dùng `PaymentRefOrder`). Chưa kiểm chứng POS ghi "chuyển cọc" thành `PaymentOrder` hay `PaymentRefOrder`. | **Chưa xác định** (câu hỏi mở số 5) | `ReportService.Order.cs:152`; `PaymentRefOrder` |

### Quy tắc kèm theo

| Mã | Yêu cầu | Thực tế | Kết quả | Mức độ | Evidence |
|---|---|---|---|---|---|
| BR-EVT-01 | Đơn hàng sinh từ Đơn đặt = giá trị Đơn đặt; nếu lệch thì cảnh báo | Không so sánh. `DataQualityFlags` chỉ có 2 cờ (mẫu số tiền, VAT âm). Không có danh sách cảnh báo chất lượng (P2). | Không đạt (P2, không tính lỗi) | Nhỏ | `DashboardV2ReportAggregate.cs:7-9, 49-55` |
| BR-EVT-02 | GMV ngày D tăng khi đơn tạo ngày D hoàn thành sau D; header "Dữ liệu tính đến" | Ngược lại: đơn hoàn thành sau D được ghi vào **ngày hoàn thành**. "Dữ liệu tính đến" = MIN `LastCompletedAt` của `OrderFact` (đạt phần header). | **Không đạt** | Nghiêm trọng | `PA/.../SaleOrderService.cs:1809`; `ReportService._Base.cs`; `GetDashboardV2DataAsOfAsync` (`DashboardV2._Base.cs:18-36`) |
| BR-EVT-03 | Điều chỉnh có thể rơi kỳ khác; DTT có thể âm; không ép về 0 | Giá trị âm được giữ ở cấp KPI (decimal có dấu). `GrowthRate` với mẫu số âm vẫn tính ra %. | Đạt phần "không ép 0" | — | `Executive.cs:384-386` |
| BR-VAL-01 | Giá trị dòng = SL × đơn giá − giảm dòng − giảm cấp đơn phân bổ; giá gồm VAT | Code lấy `ProductAmount` = Σ `SubTotal` dòng, **không trừ** giảm giá cấp đơn (POS lưu riêng `TotalDiscountAmount`). Ngoài ra POS tính VAT **cộng thêm** vào giá chưa thuế và chỉ khi `NeedVat`: `NeedPayAmount = NeedPayAmountIgnoreVat + VatAmount`. Tức giá niêm yết của POS chưa chắc "đã gồm VAT". | **Không đạt** | Nghiêm trọng | `PA/.../SaleOrderService.cs:2235, 2284-2290, 2316-2362`; `DashboardV2ReportAggregate.cs:161` |
| BR-VAL-02 | Phân bổ giảm giá cấp đơn theo tỷ lệ, dồn lẻ vào dòng lớn nhất | POS phân bổ theo tỷ lệ (`CalculateAveragePriceTax`) để tính VAT dòng. Code report.api **không dùng** `AmountIgnoreVat` dòng cho Executive. | Không đạt (Executive), POS có sẵn dữ liệu | Lớn | `SaleOrderService.cs:2328-2345` |
| BR-VAL-03 | Giá trị đơn = Σ dòng, không gồm phí ship | `ProductAmount` không gồm ship (đạt), nhưng chưa trừ giảm giá cấp đơn. | Đạt một phần | Lớn | `OrderShippingInfo.ShippingFee` |
| BR-VAL-04 | Giá trị trả = Σ SL trả × giá trị dòng gốc (gồm VAT, không ship) | Dùng `ReturnSaleOrder.PaidAmount`. | **Không đạt** | Lớn | `DashboardV2ReportAggregate.cs:439` |
| BR-VAL-05 | VAT dòng = giá trị dòng × t/(1+t), t chốt tại lúc tạo đơn | POS chốt `SaleOrderItem.VatAmount` lúc tạo đơn (đạt QĐ-09 ở nguồn). Báo cáo Executive **không** cộng VAT theo dòng: tính `ProductAmount × (Gross − VatAmount)/Gross` ở **cấp đơn** (pha trộn thuế suất, và `ProductAmount` trước giảm giá còn `VatAmount` sau giảm giá). Cột ngành hàng có `VatAmount` theo dòng (V1). Thẻ "VAT" trên KPI là VAT **phân bổ theo tỷ lệ đã thu** (`AllocatePaidTax`), không phải VAT của GMV. | **Không đạt** (Executive), đạt ở dòng ngành hàng V1 | Lớn | `DashboardV2FormulaCatalog.cs:109-127, 139-150`; `Executive.cs:78, 427-430` |

---

## (3) Phát hiện công thức (mẫu §11.3)

Ký hiệu `EX` = `RA/Application/Services/DashboardV2/DashboardV2Service.Executive.cs`; `FC` = `.../DashboardV2FormulaCatalog.cs`; `AG` = `RA/Application/Services/Report/DashboardV2ReportAggregate.cs`; `RO` = `.../ReportService.Order.cs`.

| ID | Hạng mục | Cách kiểm | Kỳ vọng | Thực tế (code) | Kết quả | Mức độ | Bằng chứng |
|---|---|---|---|---|---|---|---|
| M01 | GMV | Đọc truy vấn + chạy TC-01 | 12.262.400 (T9) | `Σ SaleOrder.ProductAmount` (hợp lệ: hoàn thành, không hủy/xóa, không phải đơn đổi), gom `IssueAt` = ngày hoàn thành, có cả đơn sinh từ đơn đặt; không có Đơn tạm. Dự đoán T9 = **6.996.000** | Không đạt | Nghiêm trọng | `AG:149-165, 378-384`; `EX:396-399`; `RO:122-126, 173` |
| M01a | VAT / GMV trước VAT | AC-EX01-08, TC-06 | Σ VAT dòng của đơn thuộc GMV | Thẻ `VatAmount` = VAT phân bổ theo tỷ lệ đã thu, không phải VAT của GMV. "GMV trước VAT" = `ProductAmount × (Gross − Vat)/Gross` ở cấp đơn, mẫu số mix. VAT + trước VAT ≠ GMV về mặt định nghĩa (INV-07). | Không đạt | Lớn | `EX:78, 427-430`; `FC:139-150`; `AG:62-70` |
| M02g | Đơn hàng gộp | TC-01 | 8 (T9) | `SaleOrderCount = validSales.Count` (đơn hoàn thành, kể cả sinh từ đơn đặt). Không đếm Đơn tạm. Dự đoán T9 = 4 | Không đạt | Nghiêm trọng | `AG:172`; `EX:432` |
| M02 | Volume | TC-02 | M02g − Kết thúc − Hủy | `OrderCount = SaleOrderCount`, không trừ gì; Trả hàng không trừ (đúng), Kết thúc/Hủy không có dữ liệu | Không đạt | Nghiêm trọng | `EX:64`; `EX:432` |
| M03 | Khách hàng mới | Đọc `SelectFirstEligibleOrder` | Đơn đầu tiên trong lịch sử rơi vào K, đơn đó ∈ P | Đơn bán hoàn thành đầu tiên (loại `KHACHLE`, loại đơn đổi) theo `IssueAt`, chi nhánh của đơn đó. Tính từ `ReportOrderStatistic`, nên **thiếu lịch sử** nếu chưa backfill → khách cũ bị tính là mới. Không tính đơn đặt / đơn tạm là "đơn ghi nhận GMV". | Đạt một phần | Lớn | `ReportService.DashboardV2.FirstPurchase.cs:7-29, 43-80`; `EX:929-941` |
| M04 | Doanh thu thực thu | TC-01/02 | Σ phiếu thu theo ngày thu | `Σ SaleOrder.PaidAmount` theo ngày đơn (V1, không lọc hủy/xóa). Dự đoán T9 = 6.842.400 (kỳ vọng 9.422.400); T10 = 7.090.000 (kỳ vọng 6.010.000) | Không đạt | Nghiêm trọng | `AG:407`; `EX:46-47, 988` |
| M05a | Trả hàng | TC-02 | 2.200.000 (T10, O6) | `ReturnSaleOrder.PaidAmount` theo `IssueAt` phiếu trả; chi nhánh phiếu trả. Số tiền đúng trong trường hợp golden (hoàn đủ), nhưng không tách riêng M05a trên thẻ | Đạt một phần | Lớn | `AG:439`; `RO:199-228`; `EX:49` |
| M05b | Đổi hàng từ đơn đặt (Kết thúc) | TC-02 | 1.080.000 (T10) | Không tồn tại | Không đạt | Nghiêm trọng | Mục E5 |
| M05c | Hủy đơn đặt | TC-02 | 1.080.000 (T10) | Không tồn tại | Không đạt | Nghiêm trọng | Mục E6 |
| M05 | Giá trị điều chỉnh | INV-02 | −(a+b+c) ≤ 0 | `AdjustmentWithVat = NetRevenueWithVat − GmvWithVat` (số dư, **có thể dương**; test khẳng định `+100`) | Không đạt | Nghiêm trọng | `EX:50`; test `DashboardV2ExecutiveTests.cs:88-127` |
| M06 | DTT | TC-01/02 | M01 + M05 | `NetRevenueWithVat = Σ SaleAmount − Σ ReturnAmount` (tiền thu ròng). Dự đoán T9 = 6.648.000 (kỳ vọng 12.068.000); T10 = 4.890.000 (kỳ vọng 1.630.000) | Không đạt | Nghiêm trọng | `EX:384-386`; `FC:164-167` |
| M07 | Biên LN gộp | Đọc công thức | (M06 − Giá vốn thuần)/M06 | `(NetRevenueNoVat − AllocatedCost)/NetRevenueNoVat`, với giá vốn **phân bổ theo tỷ lệ đã thu** của đơn bán trừ đơn trả. Không dùng M06. M06 ≤ 0 trả 0 chứ không "—". | Không đạt | Lớn | `FC:152-155`; `EX:59-63`; `AG:77-79` |
| M08 | AOV | INV-06 | M06/M02, M02 ≤ 0 → "—" | `Aov = revenue / OrderCount`, `revenue` = DTT không VAT hoặc có VAT tùy dữ liệu (hai biến thể). `OrderCount ≤ 0` trả **0**, không phải null | Không đạt | Lớn | `FC:157-162`; `EX:65-74` |
| M09 | UPT | AC-EX04 | Σ SL / M02g | Không có ở KPI Executive (`ExecutiveKpiSummaryV2Dto` không có UPT). `SaleOrder.Quantity` có sẵn trong nguồn. | Không đạt (thiếu) | Lớn | `Dto/Admins/DashboardV2/Executive/ExecutiveDashboardV2Dto.cs:16-73` |
| M10 | Nợ treo | TC-01/02 | 1.740.000 / 1.160.000 | Không có truy vấn công nợ. `Debt` / `Customer.CurrentDebtAmount` không được đọc. | Không đạt (thiếu) | Nghiêm trọng | Grep "debt" trong `RA/Application` = 0 kết quả |
| M11 | Tỷ trọng nguồn GMV | TC-01 | Đơn đặt 52,8% / lắp sẵn 47,2% | "PreOrder GMV" = đơn hàng sinh từ đơn đặt hoàn thành (ngày hoàn thành). `BuildTrend` còn "vá": nếu `Direct + PreOrder ≠ GMV` thì `PreOrder = GMV − Direct`; nếu cả hai bằng 0 mà GMV ≠ 0 thì gán hết cho Direct. Dự đoán T9: 69,1% / 30,9% | Không đạt | Lớn | `AG:162-168`; `EX:182-187` |
| M12 | Tỷ lệ trả (giá trị) | TC-01: 1,6% | M05a/M01 | Chỉ có ở Operational: `ReturnNetRevenueNoVat / SaleNetRevenueNoVat` (cơ sở đã thu, không VAT). Bảng xếp hạng Executive không có cột này (FR-EX-07). | Không đạt | Lớn | `DashboardV2Service.Operational.cs:117-141, 617-640` |
| M13 | Tỷ lệ trả (hóa đơn) | TC-01: 12,5% | Số đơn gốc **có trả** / M02g | `ReturnOrderCount / SaleOrderCount`: đếm **phiếu trả** (không DISTINCT đơn gốc), mẫu số không gồm đơn đặt | Không đạt | Lớn | `Operational.cs:131-135`; `AG:440` |
| M13b | Tỷ lệ đổi hàng đơn đặt | TC-02: 18,0% | M05b/M01 | Không có | Không đạt (thiếu) | Nghiêm trọng | E5 |
| M13c | Tỷ lệ hủy đơn đặt | TC-02: 18,0% | M05c/M01 | Không có | Không đạt (thiếu) | Nghiêm trọng | E6 |
| M16 | % đạt mục tiêu | TC-01 (82%), TC-11 (76%) | Thực tế (GMV) / mục tiêu phân bổ | `TargetCompletion = NetRevenueNoVat / Σ target`, target từ `SaleTarget` (mục tiêu ngày theo loại ngày). `CalculateRate` trả **0** khi mẫu số 0 | Không đạt | Lớn | `EX:80-82`; `FC:379-382`; `EX:686-691` |
| M17 | Tăng trưởng % | TC-07 | (Gốc − So sánh)/So sánh; mẫu số ≤ 0 → "—" | `GrowthRate(revenue, prevRevenue)`; `previous == 0` → `current == 0 ? 0 : null` (khác spec: 0→"—"); `previous < 0` vẫn tính ra % (sai dấu). Chỉ có `GrowthRate` trên doanh thu, không có cho GMV / DTT / AOV / Volume / UPT riêng | Không đạt | Lớn | `FC:169-175`; `EX:83-86` |
| BR-CMP-01 | Kỳ so sánh = [S−n, S−1] | TC-07 | 31/08–30/09 cho T10 | `ComparisonType`: None (mặc định, trả **chính kỳ hiện tại**), WoW (−7 ngày), MoM (−1 tháng), YoY. Với T10 chọn MoM → 01/09–30/09 (30 ngày, khác 31) | Không đạt | Lớn | `FC:263-281`; `FilterExtensions.cs:12-21` |
| BR-CMP-02 | Tăng trưởng tổng độc lập chu kỳ | | | Backend trả kỳ trước theo block riêng `Executive/PreviousPeriod`, độc lập chu kỳ (đạt về cấu trúc, nhưng cơ sở số sai) | Đạt một phần | — | `EX:523-577` |
| BR-CMP-03 | Tăng trưởng bucket vs bucket liền trước | | | Không có logic backend (FE xử lý) | Chưa rà (FE) | — | — |
| BR-CMP-04 | Mẫu số 0 hoặc âm → "—" | | | Mẫu số 0 → `null` hoặc `0%`; mẫu số âm → tính ra % | Không đạt | Lớn | `FC:169-175` |
| BR-CMP-05/06/07 | Mũi tên/màu, chân thẻ, điểm % | | | Thuộc FE | Chưa rà (FE) | — | — |
| BR-TGT-01 | Nguồn duy nhất là KPI "Đang áp dụng" | Đọc `QueryExecutiveTargets` | `KpiPlan` active | Dùng `Db.SaleTarget` (bảng cũ) cho Executive, Branch, Heatmap; module KPI V2 chỉ phục vụ `ResolveKpiMetric` (tiến độ KPI) | Không đạt | Lớn | `EX:1137-1161`; `BranchPerformance.cs:13-18`; `ReportService.BranchPerformanceHeatmap.cs:48`; `ReportService.DashboardV2.Kpi.cs` |
| BR-TGT-02 | Mục tiêu theo phạm vi, fallback tổng con | | | Chỉ có cấp chi nhánh (cộng các chi nhánh trong phạm vi), không có KPI cấp Công ty / Khu vực | Đạt một phần | Lớn | `EX:686-691` |
| BR-TGT-03 | Phân bổ theo ngày thực | TC-11 | 7.500.000 | Cộng mục tiêu ngày theo loại ngày (T2–T6, T7–CN, lễ), tức là phân bổ **theo ngày** (đạt về cấu trúc, nhưng khác mô hình "KPI chu kỳ chia đều"). Có rủi ro lệch 1 ngày do so `.Date` của giá trị UTC với ngày VN. | Đạt một phần | Lớn | `EX:470-507`; `EX:1142-1143, 1167-1168` |
| BR-TGT-04 | Chiến dịch ghi đè | | | Không có | Không đạt | Lớn | — |
| BR-TGT-05 | Không KPI → "Chưa thiết lập mục tiêu" | | | `Target = 0`, `TargetCompletion = 0` (test `TargetCompletionDoesNotSubstitute…` khẳng định 0) | Không đạt | Lớn | `FC:379-382`; test `ExecutiveTests.cs:58-86` |
| BR-TGT-06 | Nhãn lũy kế | | | Trend gọi `YtdRevenue` luôn tính từ 01/01 (`ytdStart`) | Chưa rà (FE) | — | `EX:675-679` |
| FR-EX-07 | Bảng xếp hạng | AC-EX07-01 | GMV, DTT, tỷ trọng, % đạt MT, tỷ lệ trả | Có GMV, DTT (cơ sở tiền thu), `ContributionRate`, `DropRate`; **thiếu** % đạt mục tiêu và tỷ lệ trả. `BuildRankingSource` bịa GMV = tiền thu khi GMV = 0. | Không đạt | Lớn | `EX:284-351, 336-338` |
| FR-EX-06 / BuildTrend | Xu hướng lũy kế | AC-EX06-06 | Điểm cuối lũy kế DTT = thẻ DTT | `CumulativeRevenue` cộng DTT **không VAT**; thẻ DTT là **có VAT**; FE gọi trend từ 01/01 | Không đạt | Lớn | `EX:172-251` |

---

## (4) Chạy tay bộ golden qua code

**Cách mô hình hóa golden vào POS** (luồng thật): O3/O4/O7/O9/O12 là `PreOrder` (đã `SubmitAt`). O3-H và O12-H là `SaleOrder` có `PreOrderId`. O4 là `PreOrder` hoàn thành với `CompleteAtEnd = 03/10` và không có `SaleOrder`. O7 là `PreOrder` có `CancelAt = 05/10`. O8 là `SaleOrder` có `CancelAt`. O10 tạo 30/09, `CompleteAt = IssueAt = 02/10`.

Kết quả dự đoán của code (số liệu tính tay, đơn vị ₫):

| Đơn | Trong GMV của code? | Ngày gom của code | Giá trị code lấy | Ghi chú |
|---|---|---|---|---|
| O1 | Có | 05/09 | 1.100.000 | |
| O2 | Có | 10/09 | **1.536.000** (G2 1.320.000 + PK2 216.000, trước giảm 10%) | Spec: 1.382.400 |
| O3 / O3-H | Có (qua O3-H) | **20/09** (không phải 12/09) | 2.160.000 | Cùng tháng nên tổng T9 không đổi |
| O4 | **Không** | — | 0 | Đơn tạm, không có SaleOrder |
| O5 | Có | 03/10 | 1.650.000 | |
| O6 | Có | 20/09 | 2.200.000 | |
| O7 | **Không** | — | 0 | |
| O8 | Không (hủy) | — | 0 | Đúng |
| O9 | **Không** | — | 0 | |
| O10 | Có | **02/10** (tháng 10) | 1.100.000 | Spec: tháng 9 |
| O11 | Có | 10/10 | 1.100.000 | |
| O12 / O12-H | Có (qua O12-H) | **15/10** (không phải 08/10) | 3.240.000 | |

### TC-01 (T9, toàn hệ thống)

| Chỉ số | Kỳ vọng | Code dự đoán | Kết quả | Lý do |
|---|---|---|---|---|
| M01 GMV | 12.262.400 | **6.996.000** | Không đạt | Thiếu O4 (1.080.000), O7 (1.080.000), O9 (2.160.000), O10 (1.100.000); O2 dư 153.600 (chưa trừ giảm giá cấp đơn) |
| M01a VAT | 1.002.400 | Không tái tạo được (VAT cấp đơn, phân bổ theo đã thu) | Không đạt | |
| M02g | 8 | 4 | Không đạt | |
| M05a | 194.400 | 194.400 | Đạt (giá trị) | Nhưng không hiển thị riêng M05a / M05b / M05c |
| M05 | −194.400 | −348.000 (= 6.648.000 − 6.996.000) | Không đạt | Số dư tiền thu − GMV |
| M06 DTT | 12.068.000 | **6.648.000** | Không đạt | |
| M02 | 8 | 4 | Không đạt | |
| M08 AOV | 1.508.500 | 1.662.000 | Không đạt | |
| M04 | 9.422.400 | **6.842.400** | Không đạt | Thiếu cọc O4, O7, O9 và lệch ngày O10 |
| M10 | 1.740.000 | (không có) | Không đạt | |
| M11 | 52,8% / 47,2% | 30,9% / 69,1% | Không đạt | |
| M12 | 1,6% | (không có ở Executive) | Không đạt | |
| M13 | 12,5% | (không có ở Executive) | Không đạt | |
| % đạt MT Công ty | 82% | Không tính được | Không đạt | Không có KPI cấp công ty; code dùng `SaleTarget` theo cửa hàng |

### TC-02 (T10, toàn hệ thống)

| Chỉ số | Kỳ vọng | Code dự đoán | Kết quả | Lý do |
|---|---|---|---|---|
| M01 | 5.990.000 | **7.090.000** (O5 + O10 + O11 + O12-H) | Không đạt | O10 bị ghi vào T10 |
| M02g | 3 | 4 | Không đạt | |
| M05a | 2.200.000 | 2.200.000 | Đạt (giá trị) | |
| M05b | 1.080.000 | 0 | Không đạt | Không có E5 |
| M05c | 1.080.000 | 0 | Không đạt | Không có E6 |
| M05 | −4.360.000 | −2.200.000 | Không đạt | |
| M06 DTT | 1.630.000 | **4.890.000** | Không đạt | |
| M02 | 1 | 4 | Không đạt | |
| M08 | 1.630.000 | 1.222.500 | Không đạt | |
| M04 | 6.010.000 | 7.090.000 | Không đạt | |
| M10 | 1.160.000, ↓ xanh | (không có) | Không đạt | |
| M12 / M13b / M13c | 36,7% / 18,0% / 18,0% | không có | Không đạt | |

### TC-03 (theo chi nhánh)

| Kỳ | CN | Chỉ số | Kỳ vọng | Code dự đoán | Kết quả |
|---|---|---|---|---|---|
| T9 | A | GMV / DTT / M02 | 5.722.400 / 5.528.000 / 4 | 4.796.000 / 4.448.000 (tiền thu − trả) / 3 | Không đạt |
| T9 | B | GMV / DTT / M02 | 6.540.000 / 6.540.000 / 4 | 2.200.000 / 2.200.000 / 1 | Không đạt |
| T10 | A | GMV / DTT / M02 | 4.340.000 / 3.260.000 / 1 | 4.340.000 / 4.340.000 / 2 | Không đạt (GMV trùng ngẫu nhiên) |
| T10 | B | GMV / DTT / M02 / AOV | 1.650.000 / **−1.630.000** / 0 / "—" | 2.750.000 / 550.000 / 2 / 275.000 | Không đạt |

INV-03 (tổng hai chi nhánh = tổng hệ thống) đúng theo cấu trúc, nhưng trên số sai. Thứ hạng T9 sẽ là CN-A #1 (ngược với spec: CN-B #1).

### TC-05 (thời điểm dữ liệu)

Code ghi O10 vào ngày hoàn thành, nên GMV T9 = 6.996.000 cả khi "tính đến 01/10" lẫn "tính đến 31/10" (không thay đổi sau 02/10). Kỳ vọng: 11.162.400 → 12.262.400. **Không đạt.** Hành vi "số quá khứ có thể tăng" (BR-EVT-02) không tồn tại.

### TC-06 (VAT theo thời điểm)

- POS lưu `SaleOrderItem.VatAmount` tại thời điểm tính đơn từ `VatTypeId` của dòng (`SaleOrderService.cs:2328-2345`), nên không có lỗi "dùng thuế suất hiện tại cho đơn cũ" ở nguồn. Đạt về dữ liệu gốc.
- Nhưng thẻ Executive không dùng VAT từng dòng. Nó dùng VAT cấp đơn và `ProductAmount` trước giảm giá, nên O2 (hai thuế suất 10% và 8%, giảm 10%) không ra 14.400 cho PK2. **Không đạt** ở thẻ Executive. Cột ngành hàng V1 (`VatAmount` theo dòng) đạt.

### TC-08 (Waterfall)

| Phạm vi | Kỳ vọng (5 cột) | Code dự đoán (3 cột: GMV, Điều chỉnh, DTT) | Kết quả |
|---|---|---|---|
| T9 toàn HT | 12.262.400 / −194.400 / 0 / 0 / 12.068.000 | 6.996.000 / −348.000 / 6.648.000 | Không đạt |
| T10 toàn HT | 5.990.000 / −2.200.000 / −1.080.000 / −1.080.000 / 1.630.000 | 7.090.000 / −2.200.000 / 4.890.000 | Không đạt |
| T10 CN-B | 1.650.000 / −2.200.000 / −1.080.000 / 0 / −1.630.000 | 2.750.000 / −2.200.000 / 550.000 | Không đạt |

Waterfall chỉ có 3 cột (GMV, Giá trị điều chỉnh, DTT) tại `GUI/components/ExecutiveRevenueWaterfall.vue:93-96`; DTO không có tách ba khoản giảm trừ.

### TC-11 (mục tiêu phân bổ)

Không chạy được: không có KPI Công ty 15.000.000. Code đọc `SaleTarget` theo cửa hàng và so với DTT không VAT. GMV 01/09–15/09 của code = 2.636.000 (O1 + O2), kỳ vọng 5.722.400. **Không đạt.**

### Sự kiện code không thể biểu diễn

E1 (Đơn tạm), E5 (Kết thúc), E6 (Hủy sau Đơn tạm), E9 (chuyển cọc), và tách Trả hàng theo đơn gốc. Thiếu cả dữ liệu đầu vào (`PreOrder` rút gọn) lẫn bảng đích.

---

## (5) Bất biến

| INV | Đánh giá | Giải thích | Evidence |
|---|---|---|---|
| INV-01 M06 = M01 + M05 | **Đúng hình thức, vô nghĩa** | `AdjustmentWithVat` được định nghĩa là `Net − GMV` nên tautology | `EX:50` |
| INV-02 M05 ≤ 0 và = −(a+b+c) | **Vi phạm** | Số dư có thể dương (test khẳng định +100); không có a/b/c | `EX:50`; `ExecutiveTests.cs:88-127` |
| INV-03 Σ theo chi nhánh = khu vực = hệ thống | **Đảm bảo theo cấu trúc** (có điều kiện) | Mọi chỉ số cộng từ dòng `ReportOrder` theo `SiteId`. Rủi ro: chi nhánh `State != Active` không có trong "Toàn hệ thống"; nếu một chi nhánh thuộc nhiều khu vực của cùng tài khoản thì Σ khu vực > hệ thống | `EX:1101-1135` |
| INV-04 M01 = Đơn đặt + Đơn hàng lắp sẵn | **Đúng hình thức, sai nghĩa** | "PreOrder" = đơn hàng sinh từ đơn đặt hoàn thành. `BuildTrend` vá chênh lệch bằng cách gán phần dư | `EX:182-187`; `AG:162-168` |
| INV-05 Σ GMV theo ngành hàng = M01 | **Vi phạm** | Dòng ngành hàng cộng `Price × Quantity` (giá niêm yết, chưa trừ giảm dòng), dòng tổng cộng `ProductAmount` (Σ `SubTotal`). Màn Sản phẩm dùng DTT không VAT chứ không phải GMV | `AG:192`; `AG:161`; `DashboardV2Service.Product.cs:280, 357, 1005` |
| INV-06 M08 × M02 = M06 | **Đúng hình thức** | AOV = doanh thu / số đơn; nhưng có hai biến thể (có VAT / không VAT) trên cùng thẻ | `EX:65-74` |
| INV-07 VAT + GMV trước VAT = M01 | **Vi phạm** | `VatAmount` trên thẻ là VAT phân bổ theo đã thu, không phải `Gmv − GmvNoVat` | `EX:78, 427-430` |
| INV-08 Waterfall = thẻ = lũy kế cuối = dòng tổng xếp hạng | **Đạt một phần** | Waterfall và thẻ cùng một block KPI (đạt); dòng tổng xếp hạng = Σ (Sale − Return) = `NetRevenueWithVat` (đạt cùng cơ sở); lũy kế dùng DTT không VAT từ 01/01 (vi phạm) | `EX:172-251, 845-878` |
| INV-09 Σ GMV theo nhân viên = M01 | **Vi phạm** | Xếp hạng nhân viên dùng `ReportStaff.SaleAmount` (tiền đã thu), không phải GMV | `DashboardV2Service.Personnel.cs:18-46` |
| INV-10 Không đơn có `ma_don_dat` nào đóng góp vào M01/M02g | **Vi phạm trực tiếp** | Đơn hàng sinh từ đơn đặt được cộng cố ý | `AG:149, 162-165, 172` |
| INV-12 Cùng K, P, cùng thời điểm → cùng số | **Đạt (có điều kiện)** | Không có `Random`; cache theo bộ lọc; nhưng cache TTL 2 giờ nên "dữ liệu tính đến" có thể cũ; các widget Operational/Personnel trả fixture cố định (mock) | `ApplicationMemoryCacheService.cs:23-38`; `DashboardV2DataAvailability.cs:34-53` |

---

## (6) Nguyên nhân gốc của hai hiện tượng trên ảnh chụp

### 6.1. Hai thông báo xuất phát từ đâu

Cả hai đều sinh ra ở **frontend**, không phải backend.

- "Đang tải dữ liệu…" là nội dung của `DashboardV2Block.vue:26` hiển thị khi `state` là `loading` **hoặc `idle`**. Khối "Tổng quan chỉ số kinh doanh" (`ExecutiveView.vue:527-533`) rơi vào nhánh này khi `overviewStatus !== 'ready'`.
- "Một phần chỉ số chưa đồng bộ" là nhãn `partial` của `DataStatusBadge.vue:10`.
- "Chưa đủ dữ liệu để cân waterfall: GmvWithVat, AdjustmentWithVat, NetRevenueWithVat" và "Chưa đồng bộ một hoặc nhiều thành phần waterfall" nằm ở `ExecutiveRevenueWaterfall.vue:144-149`. Ba tên trường này là **danh sách mặc định trong FE** (`ExecutiveRevenueWaterfall.vue:80-83`), được dùng khi `snapshot.mockFields` rỗng và một trong `gmv/adjustment/netRevenue` là `null`. Backend không bao giờ trả `AdjustmentWithVat` trong `MockFields`: `ResolveExecutiveKpis` chỉ có `GmvWithVat, NetRevenueWithVat, OrderCount, NewCustomerCount, …` (`DashboardV2DataAvailability.cs:117-142`).

Kết luận: Waterfall hiển thị cảnh báo vì **block KPI của nó không có dữ liệu** (`data` là `undefined`), cùng lý do với thẻ KPI "đang tải". Hai khối dùng hai snapshot riêng nhưng gọi cùng `loadKpis` → cùng endpoint `POST /Admin/V2/Dashboard/Executive/Kpis`. Backend không có đường nào trả `data = null` cho KPI mà không báo `mockFields`, nên request này **chưa hoàn tất** hoặc đã thất bại.

### 6.2. Vì sao request KPI có thể "mãi đang tải"

`requestExecutiveKpis` (`GUI/services/dashboardV2Api.ts:367-386`) có hành vi dễ gây treo:
1. Gọi `Executive/Kpis`; nếu lỗi thì **nuốt lỗi** (`catch` im lặng).
2. Rơi sang gọi `POST /Executive` (composite rất nặng: KPI, Trend từ 01/01, xếp hạng, chi nhánh, 3 lần truy vấn tổng hợp).
3. Mỗi lần gọi có `retries: 1` (`useExecutiveBlockSnapshot.ts`, `load()`), nên một khối có thể phát tới 4 request tuần tự. Với hai khối KPI chạy song song, cộng thêm Trend ×3, Ranking, Branch, Growth, tạo tải lớn đồng thời. Cache backend không single-flight nên các request giống hệt đều chạy.

### 6.3. Nguyên nhân backend khả dĩ (xếp theo xác suất; cần xác minh)

| # | Giả thuyết | Dấu hiệu code | Cách xác minh |
|---|---|---|---|
| 1 | **Schema chưa được áp dụng.** Mọi migration Dashboard V2 sau `20260805044927` nằm ở `Src/Infrastructure/Migrations/Pending/` (namespace `Report.Infrastructure.Migrations.Pending`). Chúng **vẫn được biên dịch và nhận diện** (có `[DbContext]`/`[Migration]`), nên `MigrateAsync` sẽ chạy chúng, **nhưng chỉ khi `Migration:ApplyOnStartup = true`** (`WebApi/Startup.cs:91-97`). Model snapshot đã chứa các cột mới (`ReportStaffWorkingSite`, `SourceSubmitAt`…), nên nếu môi trường chạy với `ApplyOnStartup=false` và không ai chạy `dotnet ef database update`, các cột `DashboardGrossProductAmount`, `DashboardDirectGrossProductAmount`… không tồn tại → mọi truy vấn Executive trả HTTP 500. Tên thư mục "Pending" cho thấy quy trình đội ngũ coi chúng "chưa phát hành". | `SELECT "MigrationId" FROM "__EFMigrationsHistory" ORDER BY 1 DESC LIMIT 15;` phải có `20260918074703_AddDashboardV2PersonnelWorkingSites`. Xem log API khi gọi `Executive/Kpis`: lỗi `column ... does not exist` hay không. |
| 2 | **Chưa có dữ liệu đồng bộ** cho 10/2026 hoặc chưa chạy backfill. Migration không backfill (test khẳng định "MigrationIsAdditiveAndBackfillIsExplicit"). Nếu `ReportStatisticSyncState` không có dòng `DashboardOrderFact` thì KPI trả `Partial` với `MockFields = [GmvWithVat, NetRevenueWithVat, OrderCount]`, **nhưng vẫn trả 200**, và FE sẽ in danh sách này, không phải ba trường mặc định → không khớp ảnh. Nên giả thuyết này giải thích "Partial" nhưng không giải thích "đang tải". | `SELECT "DatasetCode","State","LastCompletedAt","LastErrorCode","LeaseUntil" FROM "ReportStatisticSyncState";` và `SELECT count(*), max("TimeHash") FROM "ReportOrder" WHERE "ProductCategoryId" IS NULL AND "TimeHash" BETWEEN 20261001 AND 20261031;` |
| 3 | **Truy vấn quá chậm / bị khóa.** Ba truy vấn tổng hợp `GroupBy(x => 1)` có `Any()` lồng trong `Sum()` trên `ReportOrder`, cộng đếm khách mới; endpoint cũng bị cạnh tranh với job đồng bộ đang giữ transaction dài (`Sync.cs:107-142`) và các migration `ALTER TABLE` khóa bảng. | `EX:884-927`; `Sync.cs:96-142` | `pg_stat_activity`, thời gian phản hồi của request |
| 4 | **FE bỏ lỡ lần `load()`** (trạng thái `idle` vĩnh viễn). `useExecutiveBlockSnapshot` tự `resetFromGlobal` khi `filter` đổi; `loadAllBlocks()` phải được gọi sau đó. Nếu một lần đổi bộ lọc chỉ kích hoạt reset mà không kích hoạt `loadAllBlocks`, trạng thái `idle` hiển thị y hệt "Đang tải dữ liệu…". Cần xem Network tab: nếu **không có request nào** gửi đi thì đây là nguyên nhân. | `GUI/composables/useExecutiveBlockSnapshot.ts` (khối watch(options.filter) cuối hàm); `ExecutiveView.vue:451-453` | Network tab |

**Kết luận về câu hỏi "thiếu sync, thiếu migration hay lỗi công thức":** không phải lỗi công thức availability. Khả năng cao nhất là (1) migration chưa áp dụng hoặc (3) truy vấn quá chậm, kết hợp với việc FE nuốt lỗi rồi gọi lại composite nặng. Cần 3 phép kiểm ở bảng trên để chốt. Độc lập với hiện tượng này, có **một lỗi sync có thật** (mục 6.4).

### 6.4. Lỗi sync có thật (làm khối KPI/Trend luôn "một phần")

`PreOrderFact` và `CustomerFirstPurchaseFact` chỉ được ghi ở `MarkDashboardV2LocalBackfillCompleted` (`ReportService._Base.cs:437-471`), gọi từ `SyncDataForLocalBackfill` (`_Base.cs:338-348`), tức đường **backfill chạy tay**. Job production `SyncDashboardStatisticsIncremental` chỉ ghi `OrderFact` và `PaymentFact` (`Sync.cs:113-140`). Mà `ResolveExecutiveKpis` đòi cả `firstPurchaseDataAsOf` mới báo Live (`DashboardV2DataAvailability.cs:151-152`), và `ResolveExecutiveTrend` đòi cả `preOrderDataAsOf` + `firstPurchaseDataAsOf` (`:201-204`). Kết quả: trên môi trường chỉ có Hangfire, thẻ KPI luôn Partial với `NewCustomerCount, NewCustomerAveragePerDay`, Trend luôn Partial với `DirectGmvWithVat, PreOrderGmvWithVat, …`. Dữ liệu `ReportCustomerFirstPurchase` vẫn được ghi bởi `RebuildDashboardV2FirstPurchases` (`ReportService.Order.cs:162-163`), chỉ là **mốc trạng thái** không được cập nhật.

### 6.5. Ghi chú vận hành liên quan

- Đồng bộ chỉ chạy **một lần mỗi ngày lúc 23:45** nên "Dữ liệu tính đến" thường cũ gần 24 giờ; ngày hôm nay luôn trống cho đến đêm.
- Cache 2 giờ lưu cả kết quả `Partial` (kể cả khi lỗi dữ liệu chưa đồng bộ) và chỉ xóa sau khi sync commit.
- Với bộ lọc 01/10–31/10/2026 ở ngày 17/10/2026, mọi con số của 18/10–31/10 là 0 là bình thường; không phải lỗi.

---

## (7) Kế hoạch sửa (thứ tự thực hiện)

> Mỗi mục có: file, nội dung đổi, rủi ro, cần migration / backfill hay không. Mục 7.1–7.3 là nền tảng dữ liệu; làm trước.

### 7.0. Việc chặn phải chốt trước khi code (không phải thay đổi code)
Xem mục (8): câu 1 (mô hình VAT của POS), câu 2 (ngày tạo đơn), câu 4 (đơn đặt chuyển một phần), câu 6 (KPI thật theo ngày). Nếu không chốt, F2/F3/F5 sẽ phải làm lại.

### 7.1. F1 — Ghi đủ trạng thái đồng bộ ở đường production (sửa lỗi 6.4)
- File: `RA/Application/Services/Report/ReportService.DashboardV2.Sync.cs` (khối 113-140). Tách logic của `MarkDashboardV2LocalBackfillCompleted` (`ReportService._Base.cs:437-471`) thành hàm dùng chung; gọi cho `OrderFact`, `PaymentFact`, `PreOrderFact` (sau F3) và `CustomerFirstPurchaseFact` trong cùng transaction.
- Rủi ro: thấp. Migration: không. Backfill: không (chỉ lần chạy kế tiếp sẽ ghi mốc).

### 7.2. F2 — Gom theo ngày TẠO đơn (E2) thay vì ngày hoàn thành
- File: `ReportService.Order.cs` (122-141, 173, 204, 233, 420-475), `DashboardV2ReportAggregate.cs` (`CreateSaleOrderStatistic`), `ReportOrderStatistic.cs`.
- Đổi: thêm cột `EventDate` (ngày VN của `CreatedAtSource`, hoặc quy tắc chốt ở câu hỏi 2). `RebuildDashboardV2ReportOrderFields` gom theo `EventDate`. Cửa sổ đọc POS đổi từ `IssueAt ∈ ngày` sang `CreateAt ∈ ngày` **hoặc** `UpdateAt ≥ con trỏ` để bắt đơn hoàn thành muộn; khi một đơn đổi trạng thái thì tái dựng ngày `EventDate` của nó (không chỉ ngày hôm nay).
- Rủi ro: cao (đổi hạt thời gian của toàn bộ chỉ số V1/V2). Cần feature flag + so sánh song song.
- Migration: có (cột + chỉ mục). Backfill: **toàn bộ lịch sử** (script `scripts/backfill-*.sh` sẵn có).

### 7.3. F3 — Bảng sự kiện ghi nhận E1–E6 (trọng tâm)
- File mới: `Domain/Entities/ReportRevenueEvent.cs` (`EventType` E1/E2/E4/E5/E6, `SourceId`, `OriginalOrderId`, `EventDate`, `SiteId`, `StaffId`, `CustomerId`, `GrossValue`, `VatValue`, `Quantity`, `OrderCountDelta`, `CostValue`, cờ chất lượng). Mở rộng `RA/Domain/Entities/Pos/PreOrder.cs` (+ `PreOrderItem`) với `SubmitAt, IssueAt, CompleteAtEnd, ProductAmount, TotalDiscountAmount, NeedPayAmount, VatAmount, StaffId, CustomerId`. Thêm bước `WriteDashboardV2Events` trong `WriteReportOrder`:
  - E1: `PreOrder` có `SubmitAt` ≠ null, ngày = `IssueAt/SubmitAt`.
  - E2: `SaleOrder` hoàn thành, `PreOrderId == null`, ngày = ngày tạo.
  - E4: `ReturnSaleOrder` hoàn thành, gán `SiteId/StaffId` của `SaleOrderId` (đơn gốc), giá trị = Σ dòng trả (BR-VAL-04).
  - E5: `PreOrder.CompleteAtEnd != null` và không có `SaleOrder` chưa hủy; ngày = `CompleteAtEnd`.
  - E6: `PreOrder.CancelAt != null` và `SubmitAt != null`; ngày = `CancelAt`.
  - E3/E7: không sinh sự kiện.
- Rủi ro: cao. Migration: có (bảng mới + chỉ mục `(EventDate, SiteId, EventType)`). Backfill: toàn bộ lịch sử.

### 7.4. F4 — Giá trị đơn và VAT theo BR-VAL
- File: `DashboardV2ReportAggregate.cs`, `DashboardV2FormulaCatalog.cs`.
- Đổi: giá trị đơn = `ProductAmount − TotalDiscountAmount` (và quy tắc VAT theo câu hỏi 1); VAT = Σ `SaleOrderItem.VatAmount` thực của POS (đã chốt tại lúc tạo đơn), không tính tỷ lệ ở cấp đơn. Bỏ `AllocatePaidTax` / `PaidRatio` khỏi mọi chỉ số tài chính trên Executive (chỉ giữ cho phân tích thanh toán nếu cần).
- Rủi ro: trung bình. Migration: có thể thêm cột VAT dòng. Backfill: có.

### 7.5. F5 — Viết lại công thức Executive theo spec §3.3
- File: `DashboardV2Service.Executive.cs` (`CreateMeasures`, `BuildKpis`, `BuildPreviousPeriodKpis`, `BuildTrend`, `BuildRanking`, `QueryExecutive*`), DTO `ExecutiveDashboardV2Dto.cs`.
- Đổi: M01 = Σ E1 + E2; M05a/b/c = Σ E4/E5/E6 (số âm hoặc dương nhất quán, kèm số đơn để tooltip AC-EX03-02); M05 = −(a+b+c); M06 = M01 + M05; M02g, M02 đếm từ sự kiện; M08 = M06/M02, trả `null` khi M02 ≤ 0; M09 = Σ SL/M02g; M07 theo giá vốn thuần; M12, M13, M13b, M13c; M11. M04 lấy từ `ReportPaymentStatistic` theo ngày thu. Thêm trường DTO: `ReturnWithVat, ExchangeEndWithVat, PreOrderCancelWithVat, GrossOrderCount, ReturnOrderCount, EndedOrderCount, CancelledOrderCount, UnitsPerTransaction, OutstandingDebt`. Giữ trường cũ trong một phiên bản để FE chuyển dần. Tăng `FormulaVersion` (`FC:7`) để cache cũ vô hiệu.
- Rủi ro: cao (đổi hợp đồng API; phải phối hợp FE). Migration: không (sau F3). Backfill: không thêm.

### 7.6. F6 — Nợ treo M10
- File mới: bảng `ReportCustomerDebtDaily` (số dư cuối ngày theo đơn, `Balance > 0`) dựng từ `Debt` (`RefType/RefId`, `Balance`); đồng bộ trong job ngày; truy vấn M10 theo `Đến ngày` và M10 kỳ trước theo cuối ngày trước `Từ ngày`. Cần xác minh `Debt.RefId` là đơn hàng hay khách (câu 5).
- Rủi ro: cao (chưa rõ mô hình nợ). Migration: có. Backfill: có (suy ra từ `Debt` theo `IssueAt`).

### 7.7. F7 — So sánh kỳ theo BR-CMP
- File: `FC:263-281`, `FilterExtensions.cs`, controller `DashboardV2Controller.cs` (`ExecutivePreviousPeriod`), `FC:169-175`.
- Đổi: kỳ so sánh mặc định [S−n, S−1]; giữ WoW/MoM/YoY như tùy chọn P2; `GrowthRate` trả `null` khi mẫu số ≤ 0; thêm tăng trưởng riêng cho GMV, DTT, AOV, Volume, UPT; `CalculateRate` trả `null` thay vì 0 khi mẫu số 0.
- Rủi ro: thấp–trung bình (đổi hành vi mặc định). Migration: không.

### 7.8. F8 — Mục tiêu theo BR-TGT
- File: `EX:470-507, 1137-1161`, `BranchPerformance.cs`, `ReportService.BranchPerformanceHeatmap.cs`, `ReportService.DashboardV2.Kpi.cs`.
- Đổi: bộ giải mục tiêu dùng `KpiPlan` "Đang áp dụng" (công ty → khu vực → chi nhánh), phân bổ theo ngày thực; không có KPI thì trả `Target = null` và trạng thái `NotSet` (không trả 0); % đạt tính trên **GMV** (PM-01); KPI Chiến dịch ghi đè theo ngày. Quyết định cách đưa mục tiêu "trong tuần / cuối tuần" của `data-store-kpi.md` vào KPI V2 (câu 6): chuyển `SaleTarget` thành `KpiMetricTarget` với quy tắc ngày hoặc mở rộng KPI V2.
- Rủi ro: trung bình–cao (phụ thuộc quyết định nghiệp vụ). Migration: có thể (mở rộng KPI V2, hoặc script nhập). Backfill: nhập lại mục tiêu.

### 7.9. F9 — Bảng xếp hạng, Waterfall, lũy kế
- File: `EX:284-351, 845-878, 172-251`, DTO ranking.
- Đổi: ranking trả GMV, DTT, tỷ trọng, % đạt mục tiêu, tỷ lệ trả; bỏ đoạn "bịa" GMV bằng tiền thu (`EX:336-338`); bỏ đoạn "vá" Direct/PreOrder (`EX:182-187`); waterfall có đủ 5 cột và số đơn; lũy kế cộng GMV/DTT cùng cơ sở thẻ, bắt đầu từ `Từ ngày`; dòng tổng ranking = thẻ (INV-08).
- Rủi ro: trung bình. Migration: không.

### 7.10. F10 — Phân quyền phạm vi
- File: `DashboardV2Service._Base.cs:91-105`, `EX:1101-1135`.
- Đổi: bỏ comment kiểm tra `SiteIds` thuộc phạm vi tài khoản; áp RLS cho MANAGER.
- Rủi ro: thấp–trung bình (có thể phát hiện dữ liệu cấu hình sai). Migration: không.

### 7.11. F11 — Lọc hủy / xóa ở đường V1 (nếu còn dùng)
- File: `ReportService.Order.cs:122-135`. Thêm `DeleteAt == null && CancelAt == null` cho `saleOrders`, `returnOrders`, hoặc ngừng dùng `SaleAmount/ReturnAmount` cho bất kỳ widget Dashboard V2 nào (xem F5).
- Rủi ro: thấp (nhưng đổi số V1/Dashboard cũ). Migration: không. Backfill: có.

### 7.12. F12 — Độ ổn định đồng bộ, cache, vận hành
- `HangfireStartup.cs:13-15`: tăng tần suất (ví dụ mỗi giờ) và đồng bộ theo `UpdateAt` thay vì cửa sổ ngày. `ApplicationMemoryCacheService`: single-flight, khóa theo `DataAsOf`, rút TTL. Endpoint sức khỏe trả phiên bản migration cuối, trạng thái từng dataset. Chuyển `Migrations/Pending/*` vào thư mục chính hoặc ghi rõ quy trình phát hành; đặt cảnh báo khi `ApplyOnStartup=false` mà còn migration chưa chạy.
- Rủi ro: thấp. Migration: không.

### 7.13. F13 — Gỡ dữ liệu giả
- `DashboardV2DataAvailability.cs:34-53, 211-287`: fixture mock (chiến dịch, tỷ lệ chuyển đổi/phễu, gamification, KTV, Lab, leaderboard "DEMO…") đang được trả ra API. Spec đánh [Hoãn] cho nhiều mục và cấm hiển thị (mục 0.3). Trả `204/empty` hoặc ẩn endpoint.
- Rủi ro: thấp. Migration: không.

### 7.14. F14 — Cập nhật test (phụ lục dưới)
Làm cùng F5. Thêm test chạy golden §9 qua `golden_dataset_check.py` làm tham chiếu độc lập.

### Phụ lục — Test hiện có mã hóa hành vi trái spec (phải sửa ở pha 2)

| File : test | Hành vi đang khẳng định | Mâu thuẫn spec |
|---|---|---|
| `DashboardV2ExecutiveTests.cs` `KpiCardsUseCurrentPreviousYtdTargetAndPersistedVatAggregates` (12-56) | `Revenue = DTT không VAT`; `TargetCompletion = 50` trên DTT không VAT; `GrowthRate = 25` theo doanh thu | M16 dùng GMV (PM-01); M17 theo từng chỉ số |
| `…KpiCardsHandleZeroDenominatorsWithoutNanOrInfinity` (58-72) | `Aov = 0`, `TargetCompletion = 0`, `GrowthRate = 0` khi mẫu số 0 | BR-FMT-04, BR-TGT-05, BR-CMP-04: phải là "—" / "Chưa thiết lập" |
| `…TargetCompletionDoesNotSubstituteWithVat…` (75-86) | `TargetCompletion = 0` khi thiếu DTT không VAT | BR-TGT |
| `…ExecutiveRefreshKpisExposeFinancialIdentity…` (88-127) | `AdjustmentWithVat = +100` (dương); `NetRevenueWithVat = Sale − Return` | INV-02, M06 |
| `…CashBlockUsesSaleMinusReturn` (226-239) | NetCash = bán − trả | M06 |
| `…ComparisonPeriodFilterResolvesMom…` (198-217), `…ComparisonWindowsCoverWowMomAndYoy` (350-370) | Kỳ so sánh WoW/MoM/YoY | BR-CMP-01 |
| `…TrendBuildsStableCumulativeRevenueAndTargetCompletion` (242-285) | Lũy kế DTT không VAT; completion theo doanh thu | M16, INV-08 |
| `…TargetUsesTheMostSpecificDailyRuleForEachSite` (309-347) | Mục tiêu từ `SaleTarget` theo loại ngày | BR-TGT-01 |
| `…ExecutiveQueriesAggregateInDatabaseAndBranchPerformanceUsesLiveData` (373-407) | Grep chuỗi mã nguồn (ví dụ bắt buộc có `"RevenueWithoutVat"`, `DashboardV2DataStatus.Live` trong Branch) | Kiểm thử dựa trên văn bản mã, sẽ gãy khi sửa |
| `DashboardV2FormulaPropertyTests.cs` `ExecutiveTrendPreservesGmvPartitionAndWaterfallIdentitiesAcrossBuckets` (103-157) | Chấp nhận điều chỉnh = Net − (Direct+PreOrder), PreOrder là "đơn hàng sinh từ đơn đặt" | M01, M05, INV-04 |
| `…NetCashAlwaysSubtractsReturnAmountFromSaleAmount` (259-277), `…V2FinancialFormulasAllocatePartialPayments…` (35-52), `…VatAllocationConservesPaidAmount…` (237-257) | Phân bổ VAT / doanh thu theo tỷ lệ đã thu | BR-VAL-05, QĐ-09 |
| `…ComparisonRangeUsesCalendarWeekMonthAndYearOffsets` (279-300) | WoW/MoM/YoY | BR-CMP-01 |
| `DashboardV2ReportAggregateTests.cs` `OrderStatisticCopiesPreOrderIdOnlyForSaleFacts` (162-183), `RebuildV2ReportFieldsPartitionsDirectAndPreOrderGmv` (406-436) | Đơn hàng có `PreOrderId` được cộng vào GMV | E3, M01, INV-10 |
| `…ReturnAndExchangeStatisticsDoNotCountAsNewSaleRevenue` (270-306), `…RebuildV2ReportFieldsSubtractsReturnsAndKeepsV1ValuesUntouched` (308-348) | Trả hàng = `NetRevenueNoVat` từ `PaidAmount` theo tỷ lệ | BR-VAL-04 |
| `DashboardV2DataAvailabilityTests.cs` `ExecutiveKpiAvailabilityKeepsLiveMeasuresWhenFirstPurchaseIsMissing` (269-285) | Có thể không có `FirstPurchase` mà vẫn Live một phần | Liên quan F1; cần đảo hành vi sau khi F1 xong |
| `DashboardV2OperationalTests.cs` (chưa đọc chi tiết) | Operational M12/M13 theo cơ sở đã thu | M12, M13 |

Các file test khác (Integration, Reconciliation, QueryPerformance, Sync*) chưa rà chi tiết; `DashboardV2MigrationTests.cs` ràng buộc đường dẫn `Migrations/Pending` nên cần sửa nếu chuyển thư mục (F12).

---

## (8) Câu hỏi mở

1. **VAT trong POS: giá chưa thuế + VAT cộng thêm.** POS tính `NeedPayAmount = (ProductAmount − Giảm giá) + VatAmount`, và VAT chỉ phát sinh khi `NeedVat = true` (`PA/.../SaleOrderService.cs:2301-2362`). Spec BR-VAL-01 giả định "giá đã gồm VAT". Cần chốt: "giá khách cam kết trả" = `NeedPayAmount`? Với đơn không xuất VAT thì VAT = 0? Chỉ khi chốt được mới tính M01 / M01a / M08.
2. **"Ngày tạo đơn" của Đơn hàng.** POS không có trường "ngày tạo nghiệp vụ": `IssueAt` bị ghi đè khi hoàn thành, `SubmitAt` gán bằng ngày hoàn thành nếu rỗng, `CreateAt` là ngày tạo bản ghi (kể cả bản nháp). Cần chốt dùng `CreateAt` hay mốc khác; đơn online (`IntegrateSource`, `EcomSource`) có thể có luồng khác.
3. **"Kết thúc" của đơn đặt.** POS không có state riêng; chỉ có `CompleteAtEnd` kèm `PRE_ORDER_COMPLETED`. Cần xác nhận quy tắc: Kết thúc = `CompleteAtEnd != null` và không có `SaleOrder` chưa hủy. Nếu đơn đặt có đơn hàng sinh ra nhưng vẫn "Kết thúc" thì xử lý thế nào?
4. **Đơn đặt chuyển thành nhiều đơn hàng.** `PreOrder` có `SaledQuantity` / `LeftQuantity` và `SaleOrder.PreOrderId` là 1–n. BR-EVT-01 giả định 1–1. Khi chuyển một phần thì GMV đơn đặt là toàn bộ hay theo phần? Cần quy tắc.
5. **Chuyển cọc (E9) và hoàn tiền.** Chưa xác minh POS ghi chuyển cọc là `PaymentOrder` hay `PaymentRefOrder`. Danh mục `PaymentType` chỉ có mã `CUSTOMERPAID` trong code; cần danh sách đầy đủ ở dữ liệu thật để lọc cọc / thanh toán / thu nợ / hoàn tiền. Nợ treo cần xác minh `Debt.RefType/RefId/TargetType` (nợ theo đơn hay theo khách) và lịch sử `Balance` cuối ngày.
6. **KPI thật khác mô hình trong spec.** `data-store-kpi.md` chứa 61 cửa hàng, mỗi cửa hàng hai mức mục tiêu **theo ngày**: "trong tuần" và "cuối tuần" (cộng theo 5 khu vực: HCM, Miền Tây, Miền Đông, Miền Bắc, Miền Trung). Mô hình khớp bảng `SaleTarget` (Weekday / Weekend / Holiday), không khớp mô hình "KPI theo chu kỳ" của spec §7.5 và BR-TGT-03. Ví dụ tính nhanh cho tháng 10/2026 (22 ngày trong tuần + 9 ngày cuối tuần, chưa tính ngày lễ): tổng toàn công ty ≈ 45,67 tỷ đồng. Cần quyết định: mở rộng KPI V2 để hỗ trợ quy tắc theo loại ngày, hay chuyển đổi dữ liệu này sang KPI tháng? Tên khu vực trong file khác golden ("Miền Bắc"/"Miền Nam") và spec yêu cầu danh mục khu vực duy nhất từ hệ thống nguồn (BR-MD-01).
7. **Giá vốn cho M07.** `SaleOrder.SubTotalCostPrice` có sẵn, nhưng Đơn tạm chưa xuất kho nên chưa có giá vốn thực. Cần quy tắc giá vốn cho E1 và khoản đảo của E5, E6.
8. **Đổi hàng sau bán (ngoài spec).** POS có luồng `SaleOrder.ExchangeParentId` + `ReturnSaleOrder.ExchangeSaleOrderId`. Code bỏ đơn đổi khỏi GMV nhưng vẫn trừ phiếu trả đi kèm → DTT thấp hơn thực tế. Spec không có sự kiện cho luồng này.
9. **Khách lẻ.** Code loại khách có mã `KHACHLE` khỏi M03 (spec không nêu). Cần xác nhận.
10. **Chi nhánh ngừng hoạt động.** "Toàn hệ thống" hiện chỉ gồm chi nhánh `Active`; đơn lịch sử của chi nhánh đã đóng biến mất khỏi tổng. Spec §2.1 có trường "trạng thái hoạt động" nhưng không nói cách xử lý.
11. **Khu vực theo tài khoản.** `RegionSites` có `AccountId` nên một chi nhánh có thể thuộc nhiều khu vực khác nhau theo tài khoản; nếu một chi nhánh nằm hai khu vực của cùng tài khoản thì INV-03 (Σ khu vực = hệ thống) không giữ.
12. **Ngày lễ.** `Holiday.Date` và `SaleTarget.StartAt/EndAt` được so sánh bằng `.Date` của giá trị UTC với ngày VN (`EX:483, 492-493`); nếu lưu mốc 00:00 VN thì lệch 1 ngày. Cần xác minh cách lưu.
13. **Mức tải/cache.** Chưa đo thời gian truy vấn Executive trên dữ liệu thật; cần đo trước khi chốt cách xử lý "đang tải" ở mục 6.
