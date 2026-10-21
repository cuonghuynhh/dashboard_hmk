# WAVE 2a — report.api: mô hình sự kiện doanh thu chuẩn (GMV / DTT / Nợ treo)

- Repo: `report.api`, nhánh local `qc/dashboard-v2-wave2` (dựa trên `qc/dashboard-v2-wave1`). **Chưa push.**
- Nguồn chuẩn: `docs/PRODUCT_SPEC_DASHBOARD.md` mục 2, 3, 4.1, 9; bằng chứng QC: `QC_A_backend_core.md`, `QC_TONG_HOP.md` §3; quyết định PM tạm thời A1..A10, BR-CMP-01 (đề bài).
- Phạm vi: nền dữ liệu sự kiện E1..E6, công thức Executive M01..M13c, nợ treo M10, M04 theo phiếu thu, so sánh kỳ mặc định, bộ golden và bất biến. **Không** gồm: chuyển Operational/Product/Personnel sang GMV (wave 2b), RBAC, mô hình KPI, Traffic, import, danh mục Region, frontend.

## 1. Commit (nhánh `qc/dashboard-v2-wave2`)

| # | Commit | Nội dung |
|---|--------|----------|
| 1 | `c0a0a45` | Thực thể `ReportRevenueEvent`, `ReportRevenueEventLine`, `ReportCustomerDebtSnapshot`; trường POS cần thêm (`PreOrder`, `PreOrderItem`, `Debt`, `PaymentOrder.ObjectType/DocumentType`, `SaleOrderItem.PreOrderItemId`); builder sự kiện, calculator M01..M13c, bộ phân loại phiếu thu, builder nợ treo |
| 2 | `a11e5fc` | Executive (KPI, PreviousPeriod, Trend, Ranking, TopBranches, Branch) tính từ sự kiện; bỏ cơ sở thực thu và các "vá"; `FormulaVersion`; kỳ so sánh mặc định; bộ golden; sửa test cũ |
| 3 | `15b78d3` | Đồng bộ sự kiện (idempotent, theo khúc), phiếu thu theo ngày thu, nợ treo hằng ngày, backfill (service + CLI + script), M03 từ sự kiện, widget Hình thức thanh toán dùng cùng mapping với M04 |
| 4 | `84751b2` | Migration `20261017104504_AddDashboardV2RevenueEventsAndDebtSnapshots` trong `Migrations/Pending` (+ snapshot) |
| 5 | `96c43c9` | Test schema / ngữ nghĩa builder / bất biến INV-01..INV-10 (golden + ngẫu nhiên) |
| 6 | `0744cac` | Theo dõi phạm vi phủ liên tục của sự kiện; Executive báo "một phần" cho kỳ trước mốc backfill |

## 2. Quyết định đã áp dụng (và chênh lệch so với đề bài/spec)

### A1 — Giá trị đơn và VAT
- **Giá trị đơn (GMV)** = `NeedPayAmount` của POS = (Σ thành tiền dòng − giảm giá cấp đơn) + VAT nếu `NeedVat` (đã làm tròn nghìn nếu `IsRound`). **Phí vận chuyển không nằm trong `NeedPayAmount`**: `OrderShippingInfo` thuộc `SupplierOrder`, không thuộc `SaleOrder`/`PreOrder` (xem §3), nên không cần trừ ship.
- **Dòng hàng:** giá trị dòng = thành tiền dòng − giảm giá cấp đơn phân bổ theo tỷ lệ (phần lẻ dồn vào dòng lớn nhất, BR-VAL-02) + `VatAmount` dòng. Chênh lệch giữa Σ dòng và `NeedPayAmount` (do làm tròn nghìn của POS) dồn vào dòng lớn nhất → **Σ dòng luôn bằng giá trị sự kiện** (INV-05 giữ chính xác). Chênh lệch > 1.000 ₫ bật cờ chất lượng `LineValueMismatch`.
- **VAT** = Σ `VatAmount` dòng **chỉ khi `NeedVat = true`**. POS không xóa `VatAmount` dòng khi tắt `NeedVat` (`SaleOrderService.SyncWithTax`, nhánh `!NeedVat` có dòng `//saleOrder.VatAmount = null` bị comment) nên dữ liệu cũ có thể còn VAT "mồ côi"; builder bỏ qua.
- **Đơn đặt** có đủ `AmountIgnoreVat`/`VatAmount` theo dòng (`PreOrderItem`), cùng công thức tính như đơn hàng (`PreOrderService.SyncWithTax`) → dùng cùng quy tắc, không phải suy ra.
- *Chênh lệch nhỏ:* giá trị đã gồm `RoundAmount` (làm tròn đến nghìn) vì đề bài chọn `NeedPayAmount`; M04 (tiền thu) cũng đã gồm làm tròn nên hai số cùng cơ sở.

### A2 — Ngày ghi nhận
- **Đơn hàng (E2):** `SaleOrder.CreateAt` đổi sang giờ VN (không dùng `IssueAt`, POS ghi đè bằng thời điểm hoàn thành, `SaleOrderService.cs:1809,1917`). Sự kiện chỉ xuất hiện khi đơn **Hoàn thành** (`RecognizedAt = CompleteAt`) → số quá khứ có thể tăng (BR-EVT-02, TC-05).
- **Đơn đặt (E1): dùng `SubmitAt`, không dùng `CreateAt`.** Lý do đã xác minh: bản ghi `PreOrder` được tạo ở dạng **nháp** (`SubmitAt = null`) từ lúc mở giỏ hàng, có thể nhiều ngày trước khi nhân viên bấm "Đặt hàng" (`PreOrderService.Order`, `:1139-1177`, gán `SubmitAt` và `IssueAt`). Spec chỉ cho tính GMV khi đơn ở trạng thái **Đơn tạm**; ngày hợp lệ sớm nhất là ngày gửi đơn. Dùng `CreateAt` sẽ ghi GMV vào ngày mà đơn chưa phải Đơn tạm. *(Đây là điểm lệch nhẹ so với câu "CreateAt hoặc SubmitAt nếu đúng là lúc tạo"; PM xác nhận lại nếu muốn đổi.)*
- **Trả hàng (E4), Kết thúc (E5), Hủy (E6):** `ReturnSaleOrder.CompleteAt` (= `IssueAt`, `ReturnSaleOrderService.cs:1053`), `PreOrder.CompleteAtEnd`, `PreOrder.CancelAt`.
- Đơn nhập lịch sử (import) có `CreateAt` lấy từ file (`SaleOrderService.cs:3246,3344`, `PreOrderService.cs:1792,1889`) nên vẫn đúng ngày.

### A3/A4 — Đơn đặt, kết thúc, hủy, chuyển một phần
- **Nháp vs Đơn tạm:** cả hai cùng mang state `PRE_ORDER_DRAFT` ("Đơn tạm"); phân biệt bằng `SubmitAt` (null = nháp, không tính; khác null = Đơn tạm, tính E1). State `VERIFIED/SHIPPING/COMPLETED` không đổi E1.
- Đơn hàng có `SaleOrder.PreOrderId` **không bao giờ** sinh sự kiện (E3 = không tác động; INV-10). Đơn hàng đó vẫn được dùng để tính phần đã chuyển.
- **Phần đã chuyển** = số lượng trong các `SaleOrderItem` của đơn hàng **chưa hủy, chưa xóa** có `PreOrderId` đó, khớp theo `PreOrderItemId`, phần còn lại khớp theo sản phẩm (POS 1–n: `PreOrderItemService.Sync :162-206`).
- **E5 Kết thúc** (`CompleteAtEnd != null`): giá trị = **phần chưa chuyển** theo từng dòng (giá trị dòng × SL chưa chuyển / SL), ghi tại ngày `CompleteAtEnd`, **trừ M02 một đơn chỉ khi chưa chuyển gì**; chuyển một phần thì M05b ghi nhận phần chưa chuyển nhưng M02 **không** giảm (mặc định PM). Chuyển hết thì không sinh E5.
- **E6 Hủy sau Đơn tạm** (`CancelAt != null` và `SubmitAt != null`): toàn bộ giá trị, ngày hủy, M02 −1. POS không cho hủy khi đã có đơn hàng (`PreOrderService.Cancel :1098-1101`) nên luôn là phần chưa chuyển 100%.
- Đơn đặt đã xóa mềm (`DeleteAt`) không sinh sự kiện.

### A5 — Đổi hàng sau bán
- Phiếu trả (`ReturnSaleOrder`, kể cả có `ExchangeSaleOrderId`) là **Trả hàng E4** bình thường. Đơn đổi (`SaleOrder.ExchangeParentId != null`) là **Đơn hàng bình thường E2** (code cũ bỏ đơn đổi nhưng vẫn trừ phiếu trả). Có test riêng và kịch bản ngẫu nhiên có đơn đổi.

### Trả hàng (BR-VAL-04, §2.5)
- Giá trị = Σ SL trả × (giá trị dòng gốc / SL dòng gốc), dòng gốc được định giá lại bằng đúng quy tắc A1 (gồm VAT, sau giảm giá, không ship); VAT và giá vốn cũng theo dòng gốc. **Không dùng** `ReturnSaleOrder.PaidAmount` (tiền hoàn, có phí trả hàng).
- Gán **chi nhánh, người bán, khách hàng của đơn gốc** (test: phiếu trả lập ở chi nhánh khác vẫn về đơn gốc). Dòng trả không khớp được dòng gốc → dùng `SubTotal + VatAmount` của dòng trả và bật cờ `UnmatchedReturnLine`.
- `RootOrderId` = `PreOrderId` nếu đơn gốc sinh từ đơn đặt, ngược lại là Id đơn hàng; dùng để đếm **đơn gốc khác nhau có trả** cho M13.

### A6 — Giá vốn (M07)
- Đơn hàng: `SaleOrderItem.SubTotalCostPrice` (hoặc `CostPrice × SL`). Đơn đặt: `Product.CostPrice` hiện tại **tại lần đồng bộ đầu tiên** của đơn đó, **chốt cứng** theo từng dòng (các lần đồng bộ sau đọc lại giá vốn đã chốt từ `ReportRevenueEventLine.CostValue` của E1). E5/E6 đảo đúng giá vốn đã chốt theo tỷ lệ phần chưa chuyển. Giá vốn thuần = Σ(E1,E2) − Σ(E4,E5,E6); M07 = (M06 − giá vốn thuần)/M06, `null` khi M06 ≤ 0.
- *Giới hạn:* backfill lịch sử đơn đặt dùng giá vốn **hiện tại** của sản phẩm (POS không lưu giá vốn lúc tạo đơn đặt).

### A7, A8
- A7: M03 loại khách có `Code = KHACHLE`. M03 nay lấy từ sự kiện E1/E2 (đơn ghi nhận GMV đầu tiên theo thời điểm ghi nhận), không còn từ `ReportOrderStatistic.IssueAt`.
- A8: `QueryExecutiveSites` bỏ bộ lọc `State == Active`. Chi nhánh đóng vẫn nằm trong tổng hệ thống/khu vực; việc ẩn khỏi bộ chọn là việc của UI.

### A9 — Nợ treo M10
- POS: sổ `Debt` là **sổ nợ theo khách** (`TargetType = Customer`), `Value` có dấu (bán +, thanh toán/trả −), `Balance` là **dư nợ lũy kế sau bút toán**, được tính lại cho toàn bộ bút toán của khách mỗi lần `CustomerService.SyncWithDebt` (`CustomerService.cs:1020-1054`). Vì vậy **lịch sử số dư cuối ngày dựng lại được** = `Balance` của bút toán cuối (theo `IssueAt`, `CreateAt`) trước mốc cuối ngày VN.
- Bảng `ReportCustomerDebtSnapshot(SnapshotDate, CustomerId, SiteId, Balance>0)`, một dòng mỗi khách mỗi ngày còn dư nợ dương. M10 = Σ `Balance` tại `SnapshotDate = Đến ngày`, theo chi nhánh; kỳ trước = cuối ngày của kỳ so sánh.
- Job hằng ngày: chụp lại khoảng [watermark, hôm nay] cho khách còn dư nợ hiện tại, khách có bút toán mới, khách đã có bản chụp trong khoảng. **Backfill lịch sử** `BackfillDashboardDebtSnapshots`: quét sổ nợ theo trang 500 khách, dựng lại toàn bộ ngày trong khoảng.
- **Quy gán chi nhánh:** POS không lưu chi nhánh trên nợ → gán theo chi nhánh của đơn hàng hoàn thành gần nhất của khách tính đến cuối ngày đó; thiếu thì chi nhánh tạo khách; không có thì bỏ qua. Mỗi khách đúng một chi nhánh mỗi ngày nên INV-03 giữ.
- **Giới hạn quan trọng:** spec định nghĩa theo (khách, đơn); POS chỉ có số dư **theo khách** → M10 = Σ max(0, dư nợ khách). Số "O7 580.000 / O9 1.160.000" của golden là **số dư còn lại của đơn đặt**, POS **không** ghi vào sổ nợ (đơn đặt chưa là hóa đơn bán) nên không có trong sổ `Debt`; bộ golden nạp thẳng sổ nợ tổng hợp tương ứng.
- Phạm vi phủ: trạng thái đồng bộ `DashboardCustomerDebtFact` lưu khoảng ngày phủ liên tục (`LastRangeStartAt..LastRangeEndAt`, gộp qua các lần chạy, reset khi có khoảng trống). Ngày "Đến ngày" ngoài khoảng → `OutstandingDebt = null` ("—") và `MockFields += OutstandingDebt`.

### A10 — Loại phiếu thu (M04 và nhóm thanh toán)
- POS (`PaymentTypeController.cs:11-88` seed; `PaymentOrderObjectTypes`, `PaymentOrderDocumentTypes`): mã `PaymentType` = `CUSTOMERPAID` (Tiền khách trả, Thu), `CUSTOMERPAYMENT` (Tiền trả khách, Chi), `SUPPLIERPAYMENT`, `TRANSFER`, `COLLECT`, `INTERNAL`, `OTHERCOST`, `OTHERINCOME`. Không có mã riêng cho cọc / thanh toán / thu nợ: phân biệt bằng **`ObjectType`**: `PreOrder(5)` = cọc, `SaleOrder(2)` = thanh toán đơn, `MultipleSaleOrder(6)` và `Site(4)` = thu nợ từ màn khách hàng (`CustomerService.Payment :481-500`), `ReturnSaleOrder(3)` = hoàn tiền.
- **Chuyển cọc không sinh `PaymentOrder` mới**: khi đơn hàng sinh từ đơn đặt, POS ghi `AdvanceAmount = PreOrder.PaidAmount` trên phiếu thu của đơn hàng (`SaleOrderService.cs:1143`), `ActualAmount` chỉ là phần trả thêm (570.000 trong O5). Cộng `ActualAmount` các phiếu thu hoàn tất nên **không đếm hai lần** tiền cọc (E9 tự đúng). Quy tắc `DepositTransfer` vẫn có sẵn trong cấu hình để dự phòng.
- Cấu hình: section appsettings **`DashboardV2:PaymentTypeMapping`** (`Src/Domain/Appsettings/appsettings.json`), danh sách `Rules[{PaymentTypeCode?, ObjectType?, DocumentType?, Category}]`, quy tắc đầu tiên khớp thắng, `DefaultCategory`. Category: `Deposit, Payment, DebtCollection, Refund, DepositTransfer, Other`. Mặc định như bảng trên. Thiếu cấu hình → dùng mặc định trong code.
- M04 = Σ `ActualAmount` loại Deposit + Payment + DebtCollection, theo **ngày thu** (`CompleteAt` đổi giờ VN, cột `ReceiptDate`). Không có phần ship trong phiếu thu (POS không thu ship ở cấp `SaleOrder`).
- **Phiếu cọc của đơn đặt bị hủy được giữ lại** (`ObjectType = 5` và `CancelAt != null`): POS hủy phiếu cọc khi hủy đơn đặt (`PreOrderService.Cancel`), nhưng spec yêu cầu M04 không trừ hoàn tiền (O7: cọc 500.000 vẫn nằm ở tháng 9). Phiếu bị hủy loại khác vẫn bị loại.
- Widget "Hình thức thanh toán" dùng cùng tập phiếu (ReceiptDate, cùng mapping) nên tổng các nhóm = thẻ M04.

### BR-CMP-01
- `GetComparisonRange(None)` và enum mới `PreviousPeriod = 4` → `[S − n, S − 1]`. WoW/MoM/YoY giữ nguyên. Endpoint `Executive/PreviousPeriod` (`ToComparisonPeriod`) và composite dùng mặc định này. Endpoint `Executive/Kpis` vẫn không tính kỳ trước (khối KPI "không so sánh" để giữ khóa cache; kỳ trước lấy qua `PreviousPeriod`).
- `FormulaVersion` = `dashboard-v2-v11-revenue-events-gmv-20261017`.

### Mục tiêu và tỷ lệ đạt
- M16 = **GMV** / mục tiêu (KPI, Ranking, Branch, Trend lũy kế). Nguồn mục tiêu vẫn là `SaleTarget` như wave 1 (mô hình KPI thuộc wave 3). Đã thêm `AllocateCycleTarget` (BR-TGT-03: mục tiêu chu kỳ ÷ số ngày × số ngày giao) và dùng trong test TC-11; chưa nối vào truy vấn production vì KPI chu kỳ chưa tồn tại.

## 3. Ánh xạ trường POS đã xác minh (pos.api, nhánh main)

| Nội dung | Vị trí |
|---|---|
| State đơn đặt `PRE_ORDER_DRAFT=1 "Đơn tạm"`, `VERIFIED=2`, `SHIPPING=3`, `COMPLETED=4`, `CANCELLED=-1` | `Src/Domain/Constants/PreOrderWorkflowStates.cs:5-23` |
| `PreOrder.SubmitAt` (null = nháp), `CompleteAtEnd`, `ProductAmount`, `TotalDiscountAmount`, `NeedPayAmount*`, `NeedVat`, `VatAmount`, `SaledQuantity/LeftQuantity` | `Src/Domain/Entities/PreOrder.cs:29,38` và các trường cùng file |
| Gửi đơn: gán `SubmitAt` + `IssueAt`, state về `PRE_ORDER_DRAFT` | `Src/Application/Services/PreOrderService.cs:1139-1177` |
| Kết thúc: `CompleteAtEnd = completeAt` khi `isEndCompleted`; cho phép khi các đơn hàng con đã Hoàn thành/Hủy | `PreOrderService.cs:1200-1228` |
| Hủy: `CancelAt`; cấm nếu đã có đơn hàng hoặc đã hoàn thành; hủy cả phiếu thu | `PreOrderService.cs:1093-1137` (`:1101`, `:1111`) |
| Giá trị / VAT đơn đặt: `SyncWithDiscountAmount/SyncWithTax/SyncWithRoundAmount` | `PreOrderService.cs:1424-1530` |
| `PreOrderItem` (`SubTotal`, `AmountIgnoreVat`, `VatAmount`, `SaledQuantity`, `LeftQuantity`) và đồng bộ SL đã bán theo `SaleOrderItem` hoàn thành | `Src/Domain/Entities/PreOrderItem.cs`, `PreOrderItemService.cs:162-206` |
| `SaleOrder.PreOrderId`, `ExchangeParentId`; `SaleOrderItem.PreOrderItemId` | `SaleOrder.cs:133,211`; `SaleOrderItem.cs:77` |
| `IssueAt` bị ghi đè bằng thời điểm hoàn thành | `SaleOrderService.cs:1809,1917` |
| Giá trị đơn: `NeedPayAmountIgnoreVat = ProductAmount − TotalDiscountAmount`; VAT dòng chỉ khi `NeedVat`; `NeedPayAmount = ignoreVat + Σ VAT`; làm tròn nghìn (đơn đổi bỏ qua làm tròn) | `SaleOrderService.cs:2301-2400` (`SyncWithDiscountAmount :2301`, `SyncWithTax :2323`, `SyncWithRoundAmount :2367`) |
| Phí ship nằm ở `OrderShippingInfo` thuộc `SupplierOrder`, không thuộc `SaleOrder` | `Src/Domain/Entities/OrderShippingInfo.cs:7-18` |
| `SyncWithPreOrder` cập nhật state đơn đặt khi đơn hàng hoàn thành | `SaleOrderService.cs:2051-2085` |
| Phiếu thu khi đơn hàng sinh từ đơn đặt: `AdvanceAmount = PreOrder.PaidAmount` | `SaleOrderService.cs:1130-1160` (`:1143`) |
| Trả hàng: `IssueAt = completeAt`, `ExchangeSaleOrderId` | `ReturnSaleOrderService.cs:1053`; `ReturnSaleOrder.cs:123` |
| Sổ nợ: `Debt{IssueAt, RefType, RefId, TargetType, TargetId, Value, Balance, IsCancel}`; `Balance` lũy kế do `SyncWithDebt` | `Src/Domain/Entities/Debt.cs`, `CustomerService.cs:1020-1054`, `DebtService.cs:30-42` |
| Bút toán nợ: bán hàng (+), thanh toán (−), trả hàng (−) | `SaleOrderService.cs:2848,2903`; `PaymentOrderService.cs:1270-1330`; `ReturnSaleOrderService.cs:939,1640` |
| Mã `PaymentType` | `Src/WebApi/Controllers/Commons/PaymentTypeController.cs:11-88` |
| `PaymentOrderObjectTypes` / `PaymentOrderDocumentTypes` | `Src/Domain/Constants/PaymentOrderObjectTypes.cs`, `PaymentOrderDocumentTypes.cs` |

## 4. Mô hình dữ liệu và công thức

### Bảng mới (Report DB)
- **`ReportRevenueEvent`** — một dòng cho mỗi (`EventType`, `SourceId`) (chỉ mục duy nhất): `EventType` (1=E1, 2=E2, 4=E4, 5=E5, 6=E6), `SourceId/SourceCode`, `OriginalOrderId`, `RootOrderId`, `EventDate` (ngày VN, kiểu `date`), `EventAt` (UTC), `RecognizedAt`, `SiteId`, `StaffId`, `CustomerId`, `GrossValue`, `VatValue`, `CostValue` (đều ≥ 0, dấu do loại sự kiện quyết định), `Quantity`, `OrderCountDelta`, `ConvertedQuantity/TotalQuantity`, `DataQualityFlags`.
- **`ReportRevenueEventLine`** — dòng hàng của sự kiện (cascade): `SourceItemId`, `ProductId`, `CategoryId`, `BrandId`, `StaffId`, `SiteId`, `CustomerId`, `EventDate`, `EventAt`, `Quantity`, `GrossValue`, `VatValue`, `CostValue`. Chỉ mục `(ProductId|CategoryId|BrandId|StaffId, EventDate)` và `(EventDate, SiteId)`. **Dùng cho wave 2b:** GMV theo sản phẩm / ngành hàng / thương hiệu / người bán / chi nhánh / giờ (`EventAt`) / khách hàng đều là `SUM` trực tiếp trên bảng này; Σ dòng = giá trị sự kiện nên INV-05, INV-09 giữ. Khu vực: join `ReportSite`/`RegionSite` (không lưu).
- **`ReportCustomerDebtSnapshot`**, và 4 cột mới của `ReportPaymentStatistic`: `ObjectType`, `ObjectId`, `DocumentType`, `CancelAt`, `ReceiptDate`.
- Datasets mới trong `ReportStatisticSyncState`: `DashboardRevenueEventFact`, `DashboardCustomerDebtFact` (đã vào `ProductionSyncDatasets`).

### Công thức (calculator thuần `DashboardV2RevenueCalculator`, dùng chung cho DB và test)
M01 = Σ E1 + Σ E2; M01a = Σ VAT dòng; M02g = Σ delta(E1,E2); M02 = M02g − Σ delta(E5) − Σ delta(E6); M05a/b/c = Σ E4/E5/E6; M05 = −(a+b+c); M06 = M01 + M05 (có thể âm); M07 theo giá vốn thuần; M08 = M06/M02 (`null` khi M02 ≤ 0); M09 = Σ SL(E1,E2)/M02g; M10 = Σ dư nợ dương cuối ngày "Đến ngày"; M11 = E1/M01 và E2/M01; M12 = M05a/M01; M13 = số đơn gốc khác nhau có trả / M02g; M13b = M05b/M01; M13c = M05c/M01. Mẫu số ≤ 0 → `null`.
Đã gỡ khỏi Executive: DTT cơ sở tiền thu, "GMV = tiền thu" khi thiếu GMV (`BuildRankingSource`), vá Direct/PreOrder (`BuildTrend`), `AllocatePaidTax`/`PaidRatio`, đọc `ReportOrder`. Hàm catalog cũ (`NetCash`, `PaidRatio`…) vẫn còn vì Operational/Product (wave 2b) và `ReportOrderStatistic` cũ còn dùng; Executive không còn gọi.

## 5. Migration, áp dụng và backfill

### `Migrations/Pending` hoạt động thế nào
- Thư mục `Src/Infrastructure/Migrations/Pending/` (namespace `Report.Infrastructure.Migrations.Pending`) **vẫn được biên dịch** và có `[DbContext]/[Migration]`, nên `MigrateAsync` nhận ra chúng. Tên "Pending" chỉ là quy ước "chưa được phát hành/áp dụng ở mọi môi trường"; **không** có cơ chế bỏ qua. Snapshot (`Migrations/ApplicationDbContextModelSnapshot.cs`) luôn chứa mô hình mới nhất.
- Migration chỉ chạy khi `Migration:ApplyOnStartup = true` (`WebApi/Startup.cs`, `Domain/Appsettings/appsettings.json` đặt `true`; môi trường nào đặt `false` thì phải chạy tay). Nếu thiếu migration, truy vấn Executive trả HTTP 500 vì thiếu bảng/cột.
- Migration mới (thêm sinh bằng `dotnet ef migrations add ... --output-dir Migrations/Pending`, dotnet-ef 9.0): `20261017104504_AddDashboardV2RevenueEventsAndDebtSnapshots`. Thuần cộng thêm (3 bảng, 5 cột, chỉ mục), không `Drop/Rename/Sql`. Down có sẵn.
- Áp dụng: bật `Migration:ApplyOnStartup=true` rồi khởi động WebApi, hoặc
  `dotnet ef database update --project Src/Infrastructure --startup-project Src/WebApi --context ApplicationDbContext`.
- **Hàng cũ của `ReportPaymentStatistic`** có `ReceiptDate = 0001-01-01` và `ObjectType = 0` cho đến khi dựng lại (migration không backfill, theo quy ước của repo). Xem bước 4 dưới.

### Quy trình triển khai + backfill (idempotent, chạy lại được)
1. Áp migration (như trên). Không cần dừng job.
2. **Sự kiện doanh thu lịch sử:**
   `scripts/backfill-dashboard-v2-revenue-events-local.sh 2025-01-01 2026-10-17`
   (hoặc `dotnet run --project tools/Report.SequentialSync -- --from … --to … --revenue-events-backfill --chunk-days 7 --checkpoint <file> --local-backfill`). Chạy theo khúc 7 ngày (1–31), ghi checkpoint sau mỗi khúc, chạy lại cùng khoảng không nhân đôi (xóa rồi ghi lại theo `(loại, chứng từ)`; ràng buộc duy nhất bảo vệ). Backfill chọn chứng từ theo ngày hoàn thành/hủy/gửi đơn (đã có chỉ mục ở POS), **không quét `UpdateAt`**. Không chạy hai tiến trình trùng khoảng cùng lúc (script có khóa thư mục).
3. **Nợ treo lịch sử:** `REPORT_DASHBOARD_V2_MODE=debt scripts/backfill-dashboard-v2-revenue-events-local.sh <từ> <đến>` (`--debt-snapshot-backfill`).
4. **Phiếu thu (M04):** chạy lại đường đồng bộ ngày cho khoảng cần xem (ví dụ các script `backfill-report-*` hiện có, hoặc `BackfillDashboardStatistics(from,to)`) để ghi `ReceiptDate/ObjectType/DocumentType` cho các phiếu cũ (`WriteReportOrder` ghi lại `ReportPaymentStatistic` theo ngày thu).
5. M03 (khách mới) được dựng lại tự động từ sự kiện ở bước 2 (theo lô khách).
6. Job production (`Report.SyncDashboardStatisticsIncremental`, 16:45 UTC) từ nay tự đồng bộ sự kiện theo `UpdateAt` của cả khoảng + chụp nợ hằng ngày trong cùng giao dịch và đánh dấu 6 dataset. Không thêm cron mới.
- Cho đến khi backfill xong, các khối Executive trả `DataStatus = partial` với `MockFields ∋ "RevenueEventHistory"` cho kỳ bắt đầu trước mốc phủ liên tục của sự kiện (và `OutstandingDebt` cho M10), thay vì hiển thị 0.

## 6. Thay đổi hợp đồng API (cho frontend)

Mọi URL giữ nguyên. Trường mới đều **tùy chọn/nullable**. Cần xử lý các thay đổi **ngữ nghĩa** (đánh dấu ⚠).

### `POST Executive/Kpis` (`ExecutiveKpiSummaryV2Dto`) và `Executive` composite `Kpis`
- ⚠ `AdjustmentWithVat` giờ **luôn ≤ 0** = −(trả hàng + kết thúc + hủy) (trước: DTT − GMV, có thể dương). `AdjustmentWithoutVat` tương tự (bỏ VAT của các khoản).
- ⚠ `NetRevenueWithVat`/`RevenueWithVat` = M06 = GMV + điều chỉnh (không còn "tiền thu − tiền hoàn"); `Revenue`/`RevenueWithoutVat`/`NetRevenueWithoutVat` = M06 trước VAT; `YtdRevenue` = M06 trước VAT từ 01/01.
- ⚠ `GmvWithVat`/`GrossSales*` = M01 (đã gồm Đơn tạm, ngày tạo, trừ giảm giá, gồm VAT); `GmvWithoutVat` = M01 − VAT; `VatAmount` = M01a (VAT của GMV).
- ⚠ `CollectedRevenueWithVat` = M04 theo phiếu thu (ngày thu). `CollectedRevenueWithoutVat` luôn `null`. `RefundWithVat` = M05a (trả hàng, giá trị dòng trả); `RefundWithoutVat` = M05a trước VAT.
- ⚠ `Aov`/`AovWithVat` đổi từ `decimal` sang **`decimal?`** (`null` khi M02 ≤ 0 → hiển thị "—"); `AovWithVat = Aov = M06/M02`, `AovWithoutVat = M06 trước VAT / M02`. `GrossMarginRate` = M07 (%) `null` khi M06 ≤ 0. `OrderCount` = **M02** (đã trừ Kết thúc/Hủy).
- ⚠ `TargetCompletion` = **GMV**/mục tiêu (trước: DTT không VAT). `GrowthRate` = tăng trưởng M06 so với kỳ so sánh, `null` khi mẫu số ≤ 0 (endpoint `Kpis` luôn `null`, dùng `PreviousPeriod`).
- Mới (nullable): `GrossOrderCount` (M02g), `ReturnAdjustmentWithVat` (M05a, dương), `ExchangeAdjustmentWithVat` (M05b, dương), `PreOrderCancelAdjustmentWithVat` (M05c, dương), `ReturnSlipCount`, `ReturnOrderCount` (số đơn gốc có trả), `ExchangeOrderCount` (đơn đặt Kết thúc bị trừ M02), `PreOrderCancelOrderCount`, `Upt` (M09), `UnitCount`, `OutstandingDebt` (M10), `OutstandingDebtShareOfGmv` (%), `ReturnRate` (M12), `ReturnInvoiceRate` (M13), `ExchangeRate` (M13b), `PreOrderCancelRate` (M13c), `PreOrderGmvWithVat`, `DirectGmvWithVat`, `PreOrderGmvShare`, `DirectGmvShare` (M11).
- Phụ đề thẻ Volume: "Gộp: `GrossOrderCount` · Kết thúc/Hủy: −(`ExchangeOrderCount` + `PreOrderCancelOrderCount`)". Waterfall 5 cột: `GmvWithVat`, −`ReturnAdjustmentWithVat`, −`ExchangeAdjustmentWithVat`, −`PreOrderCancelAdjustmentWithVat`, `NetRevenueWithVat`.

### `POST Executive/PreviousPeriod` (`ExecutivePreviousPeriodV2Dto`)
- Cùng ngữ nghĩa như trên cho kỳ so sánh. Mới: `VatAmount`, `GrossOrderCount`, các trường điều chỉnh/đếm/tỷ lệ/`Upt`/`UnitCount`/`PreOrder*/Direct*Gmv`, `OutstandingDebt` (cuối ngày "Đến ngày" của kỳ so sánh = cuối ngày trước "Từ ngày" của kỳ gốc). `AovWithVat`/`AovWithoutVat` nullable.
- ⚠ **Mặc định kỳ so sánh = n ngày liền trước** `[S−n, S−1]` khi request không chọn so sánh (`ComparisonType = 0`). Có thể gửi `ComparisonType = 4` (`PreviousPeriod`) tường minh; WoW=1, MoM=2, YoY=3 giữ nguyên. Frontend hiện đã gửi sẵn khoảng kỳ trước nên không bị ảnh hưởng.

### `POST Executive/Trend` (`ExecutiveTrendPointV2Dto`)
- ⚠ Một điểm mỗi ngày **ngày ghi nhận** của sự kiện: `GmvWithVat`, `AdjustmentWithVat` (≤ 0, rơi vào ngày phát sinh trả/kết thúc/hủy), `NetRevenueWithVat` (có thể âm); `DirectGmvWithVat + PreOrderGmvWithVat = GmvWithVat` luôn đúng (không còn vá phần dư). `CumulativeRevenue`/`CumulativeNetRevenueWithoutVat` cộng M06 trước VAT, `CumulativeNetRevenueWithVat` cộng M06; `TargetCompletion` = GMV lũy kế / mục tiêu lũy kế. Composite giờ tính Trend trong **khoảng lọc** (không còn từ 01/01). `CollectedRevenueWithVat` = M04 theo ngày thu.
- Mới: `ReturnAdjustmentWithVat`, `ExchangeAdjustmentWithVat`, `PreOrderCancelAdjustmentWithVat`, `GrossOrderCount`. `AovWithVat`/`AovWithoutVat`/`GrossMarginRate` nullable.

### `POST Executive/Ranking` (`ExecutiveRankingV2Dto`) và `TopBranches`/Branch performance
- Ranking: `GmvWithVat` = M01, `NetRevenueWithVat` = M06 (điều chỉnh gán theo **chi nhánh của đơn gốc**); xếp hạng theo GMV; dòng `Total` khớp thẻ KPI (INV-08). Mới trên `Sites[]`, `Regions[]` và `Total`: `ReturnRate` (M12), `Target`, `TargetCompletion` (GMV/mục tiêu, `null` khi chưa thiết lập), `OrderCount` (M02).
- `BranchPerformanceItemV2Dto`: ⚠ `Revenue` = M06 (gồm VAT); mới `Gmv`, `OrderCount`, `ReturnRate`; `TargetCompletion` = GMV/mục tiêu; `GrowthRate` = tăng trưởng M06 (so với kỳ so sánh mặc định, `null` khi mẫu số ≤ 0).

### Composite `Executive`
- `Cash` ⚠ **đã lỗi thời**: `SaleAmount = NetCash =` M04, `ReturnAmount = 0`, `DataStatus = partial`, `MockFields = ["ReturnAmount"]`. Nên bỏ khối này ở UI.

### Khối trạng thái dữ liệu
- Tên `MockFields` mới: `RevenueEventHistory` (kỳ bắt đầu trước mốc phủ của sự kiện doanh thu), `OutstandingDebt`/`OutstandingDebtShareOfGmv` (chưa có bản chụp nợ cho ngày "Đến ngày"), `CollectedRevenueWithVat` (chưa đồng bộ phiếu thu). Không còn `GmvWithoutVat/NetRevenueWithoutVat...` vì VAT luôn có.

### Operational → "Hình thức thanh toán"
- ⚠ Chỉ tính phiếu cọc + thanh toán + thu nợ theo **ngày thu** (không còn lọc `IssueAt`); tổng các nhóm = `CollectedRevenueWithVat`. Các widget Operational/Product/Personnel khác **chưa đổi** (vẫn cơ sở cũ, chờ wave 2b).

## 7. Kết quả kiểm thử

### Golden dataset (spec mục 9) qua lớp tính thật
Nạp bằng chứng từ POS dịch ngữ nghĩa POS: giá niêm yết **chưa VAT**, VAT cộng thêm theo dòng (`NeedVat = true`), O3-H/O12-H là `SaleOrder` có `PreOrderId` + `PreOrderItemId`, O4 `CompleteAtEnd = 03/10`, O7 `CancelAt = 05/10`, O8 `CancelAt = 28/09`, O10 tạo 30/09 hoàn thành 02/10 (`IssueAt` = ngày hoàn thành), phiếu trả lập ở chi nhánh khác O6. Giá chưa VAT chọn sao cho giá cam kết khớp spec (G1 1.000.000+10%, G2 1.200.000+10%, G3 1.500.000+10%, T1 1.000.000+8%, PK2 200.000 + 8%/10%; O2 giảm 10% cấp đơn → 1.382.400; VAT dòng đúng 108.000 và 14.400). Kỳ vọng độc lập với `docs/analysis/golden_dataset_check.py` (đã chạy, khớp).

| TC | Nội dung | Kết quả |
|---|---|---|
| TC-01 | T9 toàn hệ thống: M01 12.262.400; M01a 1.002.400; M02g 8; M05a 194.400; M06 12.068.000; M02 8; M08 1.508.500; M09 1,5; M04 9.422.400; M12 1,6%; M13 12,5%; M11 52,8/47,2; % đạt 82% | **Đạt** |
| TC-02 | T10: M01 5.990.000; VAT 490.000; M02g 3; M05a/b/c 2.200.000/1.080.000/1.080.000; M05 −4.360.000; M06 1.630.000; M02 1; AOV 1.630.000; UPT 3,0; M04 6.010.000; M12/M13b/M13c 36,7/18,0/18,0%; M13 33,3% | **Đạt** |
| TC-03 | Theo chi nhánh (GMV/M05/DTT/M02/AOV cả 4 ô; CN-B T10 DTT −1.630.000, M02 0, AOV "—"); xếp hạng T9 CN-B #1 (53,3% / 54,2% / trả 0,0%), CN-A #2 (46,7% / 45,8% / 3,4%); % đạt CN-A 95%, CN-B 109%; INV-03 | **Đạt** |
| TC-04 | (bổ sung) GMV theo nhân viên + điều chỉnh gán người bán đơn gốc | **Đạt** |
| TC-05 | Dữ liệu tính đến 01/10 23:59: GMV T9 11.162.400, M02 7, DTT 10.968.000 → sau khi O10 hoàn thành 12.262.400 | **Đạt** |
| TC-06 | VAT theo thời điểm: PK2 O2 = 14.400, G2 108.000, PK2 O11 = 100.000 | **Đạt** |
| TC-07 | Tăng trưởng T10 vs [31/08–30/09]: GMV −51,2%, DTT −86,5%, Volume −87,5%, AOV +8,1% | **Đạt** |
| TC-08 | Waterfall 5 cột: T9, T10, T10 CN-B (−1.630.000) | **Đạt** |
| TC-10 | Lọc đa chiều T9: Tròng 6.480.000 (4 đơn), Gọng 5.588.000 (4), Phụ kiện 194.400 (1); Σ = M01 | **Đạt** |
| TC-11 | Mục tiêu phân bổ 15.000.000 × 15/30 = 7.500.000; GMV 5.722.400 → 76% | **Đạt** |
| M10 | Cuối 30/09 = 1.740.000, cuối 31/10 = 1.160.000 (−33,3%), 14,2% GMV | **Đạt** |

TC-09 (định dạng hiển thị) thuộc frontend, không nằm trong phạm vi.

### Bất biến
INV-01, 02, 03 (chi nhánh = khu vực = hệ thống), 04, 06, 07, 08 (Waterfall = thẻ = lũy kế cuối = dòng tổng xếp hạng), 10 chạy trên golden (5 kỳ × 3 phạm vi) và trên **120 kịch bản ngẫu nhiên cố định hạt giống** × 4 kỳ/phạm vi ngẫu nhiên; thêm INV-05 (Σ ngành hàng = M01), INV-09 (Σ nhân viên = M01), oracle độc lập M01 và M02g từ chứng từ POS, trả toàn bộ = giá trị đơn, và kiểm tra kịch bản ngẫu nhiên thực sự phủ cả 5 loại sự kiện, kết thúc một phần/không chuyển, đơn đổi, phiếu trả chi nhánh khác, nháp.

### Số test
| | Pass | Fail | Skip |
|---|---|---|---|
| Trước (filter `DashboardV2`, wave 1) | 313 | 1 | 2 |
| Sau (filter `DashboardV2`) | **370** | 1 | 2 |
| Toàn project (trừ test treo DB: `SyncResponseRateIntegrationTest`, `*LocalParallelScript*`, `*LocalBackfill*`) trước → sau | 380 → **437** | 1 | 2 |

Fail duy nhất vẫn là `DashboardV2PermissionTests.PermissionCatalogUsesStableIdentityScopeCodes` (thuộc agent RBAC, không đụng). Test mới: 55 (golden 12, mô hình/sync/builder 36, bất biến 7) + các test viết lại. Truy vấn mới được kiểm dịch sang SQL bằng `ToQueryString()` (Report và Pos DbContext, không cần DB thật); không có test tích hợp Postgres (môi trường không có DB).

### Test cũ đã sửa (hành vi cũ → mới)
| Test | Lý do |
|---|---|
| `DashboardV2ExecutiveTests` (viết lại toàn bộ; bỏ phản chiếu) | Điều chỉnh dương (+100), DTT = thu − hoàn, `CashBlockUsesSaleMinusReturn`, Aov = 0 khi mẫu số 0, target trên DTT không VAT, `Db.ReportOrder`, `SiteStates.Active` đều trái spec; thay bằng khẳng định M05 ≤ 0, M16 trên GMV, AOV `null`, kỳ so sánh mặc định, A8 |
| `DashboardV2FormulaPropertyTests` (3 test) | Trend "vá" Direct/PreOrder và `RankingSource` bịa GMV bằng tiền thu → khẳng định phân hoạch không cần vá, nguồn xếp hạng không có dòng = 0; version |
| `DashboardV2ContractTests` | `Aov*` thành `decimal?`; thêm kiểm tra trường mới; version |
| `DashboardV2ArchitectureTests`, `DashboardV2IntegrationTests`, `DashboardV2QueryPerformanceTests` | Executive/Branch đọc `ReportRevenueEvent` qua `InScope` thay vì `ReportOrder`+`TimeHash`; Branch 2 truy vấn thay vì 1; M03 3 truy vấn |
| `DashboardV2PaymentSyncTests` | Phiếu thu theo `CompleteAt` (bỏ cửa sổ `CreateAt ±7 ngày`), giữ cọc đơn đặt hủy; 6 dataset sản xuất |
| `DashboardV2FirstPurchaseTests` | M03 lấy từ sự kiện (E1/E2, `EventAt`) |
| `DashboardV2OperationalTests` (payment-method) | Lọc theo `ReceiptDate` + phân loại bằng mapping thay cho cứng `CUSTOMERPAID` |

## 8. Giới hạn, rủi ro, việc còn lại

1. **Chưa chạy trên DB thật:** schema/truy vấn đã kiểm bằng dịch SQL và migration sinh bằng EF, nhưng chưa có DB Report/POS để chạy backfill. Cần chạy thử khoảng nhỏ (1 tuần) trước, đối chiếu golden thủ công trên UI, rồi mới backfill toàn bộ.
2. **Hiệu năng truy vấn POS chưa đo:** sync chọn chứng từ theo `CompleteAt/CancelAt/SubmitAt` (có chỉ mục ở POS) và, ở job hằng ngày, theo `UpdateAt` (có thể quét tuần tự vài trăm nghìn dòng mỗi lần chạy). Backfill đã tránh `UpdateAt`. Nên kiểm tra kế hoạch truy vấn `SaleOrder/PreOrder/ReturnSaleOrder WHERE "UpdateAt" >= …`; nếu chậm thì thêm chỉ mục ở POS hoặc thu hẹp cửa sổ.
3. **Phiếu thu hủy muộn:** chỉ phiếu có `CompleteAt` trong cửa sổ đồng bộ mới được dựng lại; phiếu hoàn tất rồi mới bị hủy sau vài ngày (không phải cọc đơn đặt) có thể còn lưu trong `ReportPaymentStatistic` đến khi chạy lại ngày đó. Hoàn tiền (`CUSTOMERPAYMENT`) không được đồng bộ (khối `Cash.ReturnAmount = 0`).
4. **M10 theo khách, không theo đơn;** quy gán chi nhánh theo đơn gần nhất. Nợ của đơn đặt (còn lại sau cọc) không nằm trong sổ nợ POS. Khách không xác định được chi nhánh bị bỏ khỏi M10. Số liệu trước mốc bản chụp đầu tiên: `null` ("—").
5. **Giá vốn đơn đặt lịch sử** dùng giá vốn hiện tại; ngành hàng/thương hiệu/khách lấy tại thời điểm đồng bộ (không lịch sử).
6. **Ngày ghi nhận Đơn đặt = `SubmitAt`** (lệch nhẹ với câu "CreateAt"); **UPT đếm cả dòng quà tặng** (spec không nói); **làm tròn nghìn** của POS nằm trong giá trị đơn.
7. **Mục tiêu** vẫn từ `SaleTarget` (KPI V2 thuộc wave 3); `AllocateCycleTarget` mới chỉ dùng trong test.
8. **Chưa chuyển sang GMV:** Operational (anomaly, basket, refund rate, regional benchmark, time-peak...), Product, Personnel — wave 2b, dùng `ReportRevenueEventLine`. Công cụ `tools/Report.SequentialSync` `--reconcile` vẫn đối soát bảng cũ (`ReportOrder` ↔ `ReportOrderStatistic`), chưa đối soát sự kiện.
9. Cột V1 và `ReportOrderStatistic` vẫn được ghi (cần cho các widget chưa chuyển); chi phí lưu thêm và đồng bộ hai nguồn tạm thời.
10. **Merge với agent RBAC:** không sửa `DashboardV2Service._Base.cs`, `DashboardV2Controller.cs`, `DashboardV2PermissionCodes.cs`, `DashboardV2CacheKey.cs`. Đụng chạm duy nhất gần phạm vi RBAC: `DashboardV2Service.Executive.cs` → `QueryExecutiveSites` chỉ **xóa một dòng** `.Where(x => x.State == SiteStates.Active)` (A8); các phần còn lại của hàm giữ nguyên từng byte. File Executive bị viết lại phần lớn nên nếu agent RBAC cũng sửa file này thì nên giải quyết xung đột bằng cách giữ khối `QueryExecutiveSites` của họ và áp lại một dòng này.
