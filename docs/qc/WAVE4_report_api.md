# Báo Cáo Nghiệm Thu Backend Wave 4 (report.api) — Áp Dụng Toàn Bộ Quyết Định Nghiệp Vụ Cuối Cùng

> **Đính chính và xác nhận của PM (18/10, đã đối chiếu code thật). Ưu tiên phần này nếu khác nội dung bên dưới.**
>
> **Kiểm chứng độc lập** (nhánh `qc/dashboard-v2-wave4` @ `63da263`, đã merge fast-forward vào `qc/dashboard-v2`, hơn `origin/main` 50 commit, **chưa push**):
> - build đạt;
> - DashboardV2|KpiV2 **506 đạt / 2 bỏ qua** (trước wave 4: 489);
> - Golden **15/15**;
> - `has-pending-model-changes`: không còn thay đổi;
> - cây làm việc sạch.
>
> **Tên chuẩn lấy từ code:**
> - DTO bộ lọc là `DashboardV2InputAdminDto` (không phải `DashboardV2FilterAdminDto`). Trường mới: `ClusterIds`.
> - Cây khu vực trả về `DataResult<List<DashboardRegionTreeAdminDto>>`:
>   - `DashboardRegionTreeAdminDto { Id, Code, Name, SortOrder, Clusters[], Sites[] }`;
>   - `DashboardClusterTreeAdminDto { Id, Code, Name, SortOrder, Sites[] }`;
>   - `DashboardRegionSiteAdminDto { SiteId, SiteName, SiteCode, IsClosed }`.
>   - Không có `DashboardRegionTreeNodeV2Dto`.
> - Order Aging: `OrderAgingItemV2Dto { Stage: "DatHang" | "HoanThanhDonHang", Bucket, OrderCount, Value, MissingValueCount, IsValueComplete }`. Bucket dùng các giá trị 1 = 0–5 ngày, 2 = 6–10, 3 = 11–20, 4 = > 20.
>
> **Mã phương thức thanh toán:**
> - POS **chỉ có** `CASH`, `CARD`, `WALLET`, `TRANSFER`, `VOUCHER`, `MIXTURE` (pos.api `SaleOrderService.cs` ~3982-3987).
> - POS **không có** mã `COD` / `INSTALLMENT`. Mục QĐ-30 bên dưới liệt kê hai mã này như mã POS là sai. Sau F5, chúng đã bị xóa khỏi bảng ánh xạ mặc định: hai nhóm COD / Trả góp bằng 0 cho tới khi vận hành cấu hình mã.
> - `VOUCHER` và `MIXTURE` rơi vào "Khác" và được liệt kê trong `UnmappedPaymentMethods`.
>
> **PM đã review và xác nhận:**
> - **QĐ-17:** E2 lấy `SubmitAt`, chỉ khi null mới lùi về `CompleteAt` rồi `IssueAt`.
> - **QĐ-27:** Identity `GET /Admin/AccountSite/AppCodeAccountSite/All`, `AppCode` = `POS` (trùng Issuer của pos.api). Lọc bỏ `NOAUTHORIZED` và scope rỗng; cache 5 phút; lỗi trả 503.
> - **QĐ-28:** 4 route HRM `POST Admin/<Entity>/GetPage` khớp hrm.api.
> - **QĐ-29:** dựng lại trạng thái tại thời điểm T từ các mốc thời gian.
> - **F1–F5:** M04 có thêm phiếu thu chi nhánh `CUSTOMERPAID`, dùng biểu thức EF dịch được sang SQL; HRM lỗi trả 503 và không xóa dữ liệu; tắt khu vực / cụm không còn trong HRM; cụm thuộc nhiều khu vực chọn mã nhỏ nhất; tổng widget thanh toán bằng M04.
>
> **Rủi ro còn lại khi triển khai:**
> - Response `PagingResult` của HRM (`data`, `meta.success`, `meta.total`) mới được kiểm bằng client giả. Phải chạy `POST Admin/V2/Region/SyncFromHrm` một lần trên staging và xem kết quả (số khu vực, cụm, xung đột) trước khi bật job hằng ngày.

- **Nhánh làm việc**: `qc/dashboard-v2-wave4`
- **Kho mã nguồn**: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api`
- **Tài liệu tham chiếu chuẩn**:
  - Đặc tả Dashboard: `docs/PRODUCT_SPEC_DASHBOARD.md` (v2.2) §2.3 (BR-EVT-04), §2.4, §3.3 (M04), §4.4 (BR-MD-01), §5 (BR-ROLE-01), §6 (FR-FLT-01, BR-FLT-01), §7.2 (FR-OP-01, FR-OP-05, FR-OP-06), §10 (QĐ-16 … QĐ-31).
  - Quyết định nghiệp vụ của khách hàng: `docs/qc/QC_TONG_HOP.md` §3.0 (QĐ-16 … QĐ-31).

---

## 1. Danh Sách Commit (7 Commits)

1. `df66446`: `feat(dashboard-v2): use SaleOrder.SubmitAt for E2 revenue event date (QD-17)`
2. `adafe6f`: `feat(dashboard-v2): flag MissingVat on orders with NeedVat=false (QD-16)`
3. `d25886f`: `feat(dashboard-v2): compute M04 collected revenue as sum of receipt documents (QD-26)`
4. `b95c5bf`: `feat(dashboard-v2): resolve MANAGER scope from Identity managed sites (QD-27)`
5. `0fef8a9`: `feat(dashboard-v2): sync region and cluster hierarchy from HRM (QD-28)`
6. `18b1556`: `feat(dashboard-v2): implement two-stage order aging (QD-29)`
7. `32c3e0a`: `feat(dashboard-v2): verify campaign and payment method code mappings (QD-30, QD-31)`

---

## 2. Chi Tiết Thực Hiện Theo Từng Quyết Định Nghiệp Vụ

### 2.1 QĐ-17 — Ngày ghi nhận sự kiện doanh thu E2 của Đơn hàng = `SubmitAt`
- **Nghiệp vụ**:
  - Khi thu ngân mở đơn mới trên POS, POS lập tức tạo một bản ghi draft (`SALE_ORDER_DRAFT`). Do đó trường `CreateAt` là thời điểm mở đơn nháp, không phải thời điểm bán/hoàn tất đơn.
  - Với đơn bán tại quầy, POS gán `SubmitAt` bằng thời điểm hoàn tất thanh toán (`pos.api/Src/Application/Services/SaleOrderService.cs` dòng 1806-1809, 1914-1917).
  - Sự kiện doanh thu E2 của `SaleOrder` phải sử dụng `SaleOrder.SubmitAt` chuyển sang múi giờ `Asia/Ho_Chi_Minh` làm ngày sự kiện (`EventDate`), thay vì `CreateAt`.
  - Fallback: với các đơn hàng legacy cũ bị `SubmitAt == null`, sử dụng thời điểm hoàn tất đơn (`CompleteAt` / `CompleteAtEnd`).
  - Đơn đặt hàng trước (`PreOrder`) vốn đã dùng `SubmitAt` thì tiếp tục giữ nguyên.
- **Thực hiện**:
  - Bổ sung trường `SubmitAt` vào entity mirror `ReportSaleOrder` và cập nhật logic chiếu dữ liệu từ POS.
  - Cập nhật `ReportService.DashboardV2.RevenueEvents.cs` để lấy `SubmitAt` cho sự kiện E2 `SaleOrderCompleted`.
  - Giữ vững toàn bộ 15 bộ dữ liệu kiểm thử Golden dataset (ngày tạo trong test mang nghĩa ngày gửi/submit đơn).
  - **Lưu ý Vận hành**: Cần chạy lại lệnh/job backfill revenue events để cập nhật lại `EventDate` cho các bản ghi cũ theo `SubmitAt`.
- **Tập tin thay đổi**:
  - `Src/Domain/Entities/ReportSaleOrder.cs`
  - `Src/Application/Services/Report/ReportService.DashboardV2.RevenueEvents.cs`
  - `Src/Application/Services/Report/ReportService.DashboardV2.PosProjection.cs`
  - `Tests/Application.Tests/DashboardV2RevenueInvariantTests.cs`
  - `Tests/Application.Tests/DashboardV2GoldenDatasetTests.cs`

---

### 2.2 QĐ-16 — 100% Đơn hàng đều có thuế GTGT (VAT)
- **Nghiệp vụ**:
  - Theo quyết định QĐ-16, 100% đơn hàng tại hệ thống đều chịu thuế GTGT. Không có ngoại lệ đơn không VAT trong quy trình nghiệp vụ thông thường.
  - Nếu xuất hiện đơn hàng có `NeedVat == false`, đây là dữ liệu bất thường cần được cảnh báo/giám sát kỹ thuật để đội ngũ vận hành đối soát lỗi dữ liệu.
- **Thực hiện**:
  - Bổ sung cờ `MissingVat` trên `ReportRevenueEvent` và `ReportRevenueOrderDailyStatistic` được đánh dấu khi đơn hàng có `NeedVat == false`.
  - Xóa bỏ toàn bộ các comment cũ trong mã nguồn gợi ý rằng đơn hàng có thể hợp lệ với VAT = 0.
- **Tập tin thay đổi**:
  - `Src/Domain/Entities/ReportRevenueEvent.cs`
  - `Src/Domain/Entities/ReportRevenueOrderDailyStatistic.cs`
  - `Src/Application/Services/Report/ReportService.DashboardV2.RevenueEvents.cs`
  - `Tests/Application.Tests/DashboardV2RevenueInvariantTests.cs`

---

### 2.3 QĐ-26 — M04 Doanh thu thực thu = Tổng tiền các chứng từ phiếu thu (Receipt Documents)
- **Nghiệp vụ**:
  - Tại POS chỉ có duy nhất một loại chứng từ thu là phiếu thu (`PaymentOrder` loại Thu / Receipt); không có sự phân biệt giữa cọc, thanh toán hay thu nợ.
  - M04 Doanh thu thực thu = Tổng tiền tất cả các chứng từ phiếu thu phát sinh trong kỳ theo ngày phiếu thu (VN), thuộc phạm vi cửa hàng được truy cập, trừ đi phần phí vận chuyển nếu tách rời.
  - Phiếu chi (Payment-out document / hoàn tiền) không bị trừ vào M04 (doanh thu thực thu là dòng tiền thu vào). Việc chuyển cọc khi đổi hàng không tạo ra phiếu thu mới.
  - Loại bỏ hoàn toàn việc lọc theo `DashboardV2:PaymentTypeMapping` cho M04. Đánh dấu obsolete cấu hình này nhưng vẫn giữ để tương thích ngược.
  - Golden test TC-01 M04 = 9.422.400 VNĐ và TC-02 M04 = 6.010.000 VNĐ phải đảm bảo pass chính xác 100%.
- **Thực hiện**:
  - Sửa `DashboardV2PaymentClassifier.IsCollectedRevenueReceipt`: chấp nhận toàn bộ chứng từ có `DocumentType` là phiếu thu / receipt liên quan đến đơn hàng, không lọc theo `PaymentTypeCode`.
  - Cập nhật `ReportService.DashboardV2._Base.cs` và `DashboardV2Service.Operational.cs` để query đúng tập phiếu thu.
  - Đánh dấu `[Obsolete]` trên `DashboardV2PaymentTypeMappingSetting`.
- **Tập tin thay đổi**:
  - `Src/Domain/AppsettingTypes/DashboardV2Appsetting.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2PaymentClassifier.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs`
  - `Src/Application/Services/Report/ReportService.DashboardV2._Base.cs`
  - `Tests/Application.Tests/DashboardV2OperationalTests.cs`
  - `Tests/Application.Tests/DashboardV2GoldenDatasetTests.cs`

---

### 2.4 QĐ-27 — Phạm vi MANAGER = "Cửa hàng đang quản lý" từ Identity
- **Nghiệp vụ**:
  - Vai trò MANAGER không còn lấy từ bảng phân công nhân sự nội bộ `ReportStaffWorkingSite`, mà lấy chính xác danh sách cửa hàng đang quản lý từ Identity service.
  - Gọi endpoint: `GET {IdentityHost}/Admin/AccountSite/AppCodeAccountSite/All?appCode={AppCode}&accountId={accountId}` tương đương với pos.api `EggstechIdentityRequestClient.GetAllPermissionBySite` (dòng 473).
  - Cửa hàng đang quản lý = các bản ghi có `roleCode != "NOAUTHORIZED"` và `scope` không rỗng (giống logic `fetchManagedSites` trong `StaffProfileEditor.vue` của pos.gui).
  - Sử dụng cấu hình `AppCode` (mặc định `"POS"` giống pos.api).
  - Caching 5 phút theo `AccountId`.
  - Khi Identity bị lỗi mạng hoặc timeout: trả về HTTP 503 `ServiceUnavailableException` cho các endpoint dữ liệu; tuyệt đối không fallback sang "toàn bộ cửa hàng" (tránh lộ dữ liệu nhạy cảm).
  - Vai trò STAFF vẫn giữ nguyên phạm vi cá nhân (self-only).
- **Thực hiện**:
  - Bổ sung `GetAllPermissionBySiteAsync` vào `IIdentityRequestClient` và `IdentityRequestClient`.
  - Cập nhật `DashboardV2AccessService` để gọi `GetAllPermissionBySiteAsync` cho vai trò MANAGER, trích xuất danh sách `siteId` quản lý, và ném `ServiceUnavailableException` khi client Identity gặp lỗi.
  - Giả lập `FakeIdentityRequestClient` trong các unit test.
- **Tập tin thay đổi**:
  - `Src/Application/RequestClients/IdentityRequestClient.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2AccessService.cs`
  - `Tests/Application.Tests/DashboardV2RbacTests.cs`

---

### 2.5 QĐ-28 — Phân Cấp Khu Vực & Cụm Cửa Hàng Đồng Bộ Từ HRM
- **Nghiệp vụ**:
  - Nguồn dữ liệu duy nhất (source of truth) cho Khu vực (Region) và Cụm cửa hàng (Cluster) là HRM:
    - `StoreCluster` = **Khu vực**
    - `StoreClusterBuddyStoreGroup` = Liên kết Khu vực với Cụm
    - `BuddyStoreGroup` = **Cụm cửa hàng** (mã cụm định dạng BG00000005)
    - `BuddyStoreGroupSite` = Liên kết Cụm với Cửa hàng (`SiteId` là mã GUID chi nhánh POS)
  - Thêm client `HrmRequestClient` với cấu hình `Hrm:Host`, `Hrm:AccessToken`.
  - Xây dựng quy trình đồng bộ phân cấp 3 tầng HRM vào report.api:
    - Bảng `DashboardRegion` (Khu vực) -> `DashboardCluster` (Cụm) -> `DashboardClusterSite` (Cửa hàng).
    - Cửa hàng chưa thuộc cụm nào được tự động xếp vào "Chưa phân khu vực".
    - Khi một cửa hàng bị phân vào nhiều cụm/khu vực trên HRM, hệ thống chọn cụm có mã nhỏ nhất theo thứ tự từ điển, đồng thời ghi log cảnh báo conflict.
  - Lập lịch Hangfire job chạy hàng ngày và cung cấp endpoint đồng bộ thủ công dành riêng cho BOD: `POST Admin/V2/Region/SyncFromHrm`.
  - Vô hiệu hóa/loại bỏ các endpoint gán khu vực thủ công: `PUT Admin/V2/Region/Assignments` và `POST Admin/V2/Region/SeedFromStoreKpi` trả về `410 Gone`.
  - Mở rộng bộ lọc: thêm `ClusterIds` vào DTO lọc Dashboard V2 (`DashboardV2FilterAdminDto`, `DashboardV2NormalizedFilter`). Thực hiện cascade: Region -> Cluster -> Site kết hợp với RBAC allowed sites của người dùng.
  - Thêm endpoint mới `GET Admin/V2/Dashboard/Regions`: trả về cây phân cấp Region -> Cluster -> Site đã được cắt gọt theo allowed sites của người gọi, phục vụ bộ lọc frontend.
  - Executive Ranking và Heatmap hỗ trợ nhóm theo Cụm cửa hàng (`Clusters` và `ClusterRows`).
  - Migration EF Core `20261018051700_DashboardV2HrmRegionClusterHierarchy` được tạo và kiểm tra không còn pending model changes.
- **Tập tin thay đổi**:
  - `Src/Domain/Entities/DashboardRegion.cs`
  - `Src/Domain/Entities/DashboardCluster.cs`
  - `Src/Domain/Entities/DashboardClusterSite.cs`
  - `Src/Application/RequestClients/HrmRequestClient.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2RegionSyncService.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2RegionSyncJob.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Executive.cs`
  - `Src/Application/Dto/Admins/DashboardV2/DashboardV2FilterAdminDto.cs`
  - `Src/Application/Dto/Admins/DashboardV2/Region/DashboardRegionDtos.cs`
  - `Src/WebApi/Controllers/Admins/V2/DashboardV2Controller.cs`
  - `Src/WebApi/Controllers/Admins/V2/RegionAdminController.cs`
  - `Src/Infrastructure/Migrations/20261018051700_DashboardV2HrmRegionClusterHierarchy.cs`
  - `Tests/Application.Tests/DashboardV2RegionTests.cs`
  - `Tests/Application.Tests/RegionReportingContractTests.cs`

---

### 2.6 QĐ-29 — Báo Cáo Tuổi Đơn Hàng (Order Aging) Với 2 Giai Đoạn
- **Nghiệp vụ**:
  - Thay thế trạng thái "Unavailable" cũ của widget Tuổi đơn hàng (Order Aging, FR-OP-01) bằng việc tính toán thực tế qua 2 giai đoạn:
    1. **Giai đoạn "DatHang" (Đặt hàng)**: Các đơn đặt hàng (`PreOrder`) đã submit (`SubmitAt <= T`) và vẫn đang mở tại thời điểm chốt T (cuối ngày "Đến ngày" theo giờ VN). Đơn mở nghĩa là tại T chưa hoàn thành (`CompleteAt == null || CompleteAt > T`), chưa kết thúc (`CompleteAtEnd == null || CompleteAtEnd > T`), và chưa hủy (`CancelAt == null || CancelAt > T`). Tuổi đơn = Số ngày từ `SubmitAt` của PreOrder đến T. Giá trị = Giá trị còn lại chưa chuyển đổi (`UnconvertedRemainingValue` / `NeedPayAmount`).
    2. **Giai đoạn "HoanThanhDonHang" (Hoàn thành đơn hàng)**: Các đơn bán hàng tạo từ đơn đặt hàng (`SaleOrder` có `PreOrderId != null`), đã submit (`SubmitAt <= T`), và tại T chưa hoàn thành (`CompleteAt == null || CompleteAt > T`) và chưa hủy (`CancelAt == null || CancelAt > T`). Tuổi đơn = Số ngày từ `SubmitAt` của SaleOrder đến T. Giá trị = Giá trị đơn hàng (`TotalAmount`).
  - Tái lập trạng thái lịch sử tại mốc T dựa trên các mốc thời gian lưu vết, không dùng trạng thái hiện tại.
  - Chia 4 nhóm tuổi: 0-5 ngày, 6-10 ngày, 11-20 ngày, >20 ngày; báo cáo số lượng đơn và tổng giá trị; phân theo từng chi nhánh.
- **Thực hiện**:
  - Bổ sung trường `Stage` ("DatHang" | "HoanThanhDonHang") vào `OrderAgingItemV2Dto`.
  - Triển khai phương thức ảo `QueryOperationalOrderAging` trên `DashboardV2Service.Operational.cs` và override trong `ReportService.DashboardV2._Base.cs` để query dữ liệu thực từ `PosDb.PreOrder` và `PosDb.SaleOrder` (tuân thủ quy tắc kiến trúc không tham chiếu `PosDb` trực tiếp từ các file `DashboardV2Service*.cs`).
  - Viết unit test xác thực tái lập lịch sử tại mốc T và kiểm tra 2 giai đoạn đặt hàng / hoàn thành đơn hàng.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dto.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs`
  - `Src/Application/Services/Report/ReportService.DashboardV2._Base.cs`
  - `Tests/Application.Tests/DashboardV2OperationalTests.cs`

---

### 2.7 QĐ-30 — Mã Chiến Dịch & Nhóm Phương Thức Thanh Toán Từ POS
- **Nghiệp vụ & Khảo sát mã nguồn POS (`pos.api`)**:
  - **Mã chiến dịch khuyến mãi / voucher / coupon trên POS**:
    - Chương trình khuyến mãi đơn bán hàng: `pos.api/Src/Domain/Entities/PromotionCampaignSaleOrder.cs` (`PromotionCampaignId`, `SaleOrderId`) liên kết với `pos.api/Src/Domain/Entities/PromotionCampaign.cs` (dòng 9-15: trường `Code`, `Name`).
    - Chương trình khuyến mãi đơn đặt hàng: `pos.api/Src/Domain/Entities/PromotionCampaignPreOrder.cs` (`PromotionCampaignId`, `PreOrderId`).
    - Đợt phát hành voucher đơn bán hàng: `pos.api/Src/Domain/Entities/VoucherCampaignSaleOrder.cs` (`VoucherCampaignId`, `SaleOrderId`) liên kết với `pos.api/Src/Domain/Entities/VoucherCampaign.cs` (trường `Code`, `Name`).
    - Đợt phát hành voucher đơn đặt hàng: `pos.api/Src/Domain/Entities/VoucherCampaignPreOrder.cs` (`VoucherCampaignId`, `PreOrderId`).
    - Đợt phát hành coupon đơn bán hàng: `pos.api/Src/Domain/Entities/CouponCampaignSaleOrder.cs` (`CouponCampaignId`, `SaleOrderId`) liên kết với `pos.api/Src/Domain/Entities/CouponCampaign.cs` (trường `Code`, `Name`).
    - Báo cáo Marketing Campaign widget đọc các mã chiến dịch trên; đơn không có mã được gom vào dòng `"Không có chiến dịch"` (`IsNoCampaign = true`) và luôn xếp ở cuối bảng.
  - **Mã phương thức thanh toán trên POS**:
    - Bảng định nghĩa phương thức thanh toán: `pos.api/Src/Domain/Entities/PaymentMethod.cs` (dòng 8: `Code` MaxLength 100, dòng 12: `Name` MaxLength 200).
    - Khóa ngoại chứng từ thanh toán: `pos.api/Src/Domain/Entities/PaymentOrder.cs` (dòng 79-82: `PaymentMethodId`).
    - Các mã phương thức thanh toán thực tế được dùng trong mã nguồn POS (`pos.api/Src/Application/Services/SaleOrderService.cs` dòng 3981-3986):
      - `"CASH"`: Tiền mặt -> nhóm `Cash`
      - `"CARD"`: Quẹt thẻ -> nhóm `Card`
      - `"WALLET"`: Ví điện tử -> nhóm `EWallet`
      - `"TRANSFER"`: Chuyển khoản -> nhóm `Transfer`
      - `"COD"`: Thu hộ COD -> nhóm `Cod`
      - `"INSTALLMENT"`: Trả góp -> nhóm `Installment`
      - `"VOUCHER"`, `"MIXTURE"`: Thanh toán hỗn hợp / Voucher -> chưa được ánh xạ trong cấu hình mặc định nên tự động rơi vào nhóm `Other` ("Khác") và được ghi nhận trong danh sách `UnmappedPaymentMethods`.
- **Thực hiện**:
  - `DashboardV2Options.PaymentMethodRules` ánh xạ chuẩn xác 6 nhóm. Mọi mã không khớp rơi vào `Other` và liệt kê trong `UnmappedPaymentMethods` để quản trị viên có thể theo dõi và bổ sung cấu hình.
  - Viết unit test xác nhận gom nhóm chiến dịch không mã vào "Không có chiến dịch" và phân loại chính xác các mã thanh toán POS.
- **Tập tin thay đổi & kiểm thử**:
  - `Src/Application/Services/Report/ReportService.DashboardV2.RevenueEventContext.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Options.cs`
  - `Tests/Application.Tests/DashboardV2OperationalTests.cs`

---

### 2.8 QĐ-31 — Khối Lab Tiếp Tục Hoãn Lại (Deferred)
- **Nghiệp vụ**:
  - Khối Lab thuộc Nhân sự / Vận hành tiếp tục được hoãn lại theo đúng quyết định nghiệp vụ.
  - Khối `Lab` trên `PersonnelDashboardV2Dto` giữ nguyên dữ liệu rỗng và cờ trạng thái `Partial` với danh sách mock fields `["Items"]` thông qua `DashboardV2DataAvailability.PersonnelLab`.
- **Tập tin liên quan**:
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Personnel.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2DataAvailability.cs`
  - `Tests/Application.Tests/DashboardV2PersonnelTests.cs`
  - `Tests/Application.Tests/DashboardV2OperationalTests.cs`

---

## 3. Thay Đổi Hợp Đồng API Cho Frontend (API Contract Changes)

| Thay đổi | Endpoint / DTO | Mô tả chi tiết cho Frontend |
|---|---|---|
| **Bộ lọc Cụm cửa hàng** | `DashboardV2FilterAdminDto.ClusterIds` (`List<Guid>?`) | Cho phép lọc theo danh sách Cụm cửa hàng (`ClusterIds`). Server tự động cascade Region -> Cluster -> Site và giao với quyền chi nhánh của người dùng. |
| **Cây phân cấp Khu vực - Cụm - Chi nhánh** | `GET Admin/V2/Dashboard/Regions` | Trả về cây 3 cấp `DashboardRegionTreeNodeV2Dto`: Khu vực (`Region`) -> Cụm (`Cluster`) -> Cửa hàng (`Site`). Chỉ trả về các nút chứa chi nhánh mà người dùng hiện tại có quyền truy cập. |
| **Đồng bộ phân cấp HRM** | `POST Admin/V2/Region/SyncFromHrm` | Endpoint dành riêng cho BOD kích hoạt đồng bộ toàn bộ Khu vực và Cụm từ HRM về Dashboard. |
| **Vô hiệu hóa endpoint thủ công cũ** | `PUT Admin/V2/Region/Assignments`<br>`POST Admin/V2/Region/SeedFromStoreKpi` | Các endpoint gán khu vực thủ công cũ trả về `410 Gone`. Frontend không gọi các endpoint này nữa. |
| **Nhóm theo Cụm trong Executive Ranking & Heatmap** | `DashboardExecutiveDashboardV2Dto.Ranking.Clusters`<br>`DashboardExecutiveDashboardV2Dto.Heatmap.ClusterRows` | Bổ sung danh sách xếp hạng và heatmap theo Cụm cửa hàng (`DashboardRankingClusterV2Dto`, `DashboardHeatmapRowV2Dto`). |
| **Giai đoạn tuổi đơn hàng** | `OrderAgingItemV2Dto.Stage` (`string`) | Giá trị nhận diện giai đoạn tuổi đơn: `"DatHang"` (Đơn đặt hàng chưa hoàn tất) hoặc `"HoanThanhDonHang"` (Đơn bán hàng từ đơn đặt hàng đang trong tiến trình giao nhận/hoàn tất). |

---

## 4. Kết Quả Kiểm Thử & Nghiệm Thu (Verification Results)

- **Lệnh biên dịch**:
  ```bash
  export PATH="$HOME/.dotnet:$PATH" DOTNET_ROOT="$HOME/.dotnet" DOTNET_CLI_TELEMETRY_OPTOUT=1
  dotnet build Tests/Application.Tests/Application.Tests.csproj -v q
  ```
  - Kết quả: `0 Error(s)`, `Build succeeded.`

- **Lệnh kiểm thử DashboardV2 & KpiV2**:
  ```bash
  dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2"
  ```
  - Kết quả: `Passed! - Failed: 0, Passed: 500, Skipped: 2, Total: 502, Duration: 7 s`

- **Lệnh kiểm thử Golden Dataset**:
  ```bash
  dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~Golden"
  ```
  - Kết quả: `Passed! - Failed: 0, Passed: 15, Skipped: 0, Total: 15, Duration: 183 ms`

- **Lệnh kiểm tra EF Model Changes**:
  ```bash
  dotnet tool run dotnet-ef migrations has-pending-model-changes --project Src/Infrastructure --startup-project Src/WebApi --context ApplicationDbContext
  ```
  - Kết quả: `No changes have been made to the model since the last migration.`

---

## Sửa sau review PM (F1–F5)

### 1. Chi tiết thực hiện theo từng mục (item → files → tests)

#### F1 — M04 bao gồm phiếu thu công nợ từ màn hình khách hàng (QĐ-26)
- **Vấn đề**: Trước đây `DashboardV2PaymentClassifier.IsCollectedRevenueReceipt` và các câu truy vấn M04 chỉ lấy phiếu thu có `ObjectType` ∈ {2, 5, 6}, bỏ sót `ObjectType = 4` (Site). Tuy nhiên trên POS, khi khách hàng thanh toán công nợ từ màn hình khách hàng (`pos.api/Src/Application/Services/CustomerService.cs` dòng 459-475, `Payment`), POS tạo phiếu thu có `PaymentTypeCode = "CUSTOMERPAID"` và `ObjectType = 4` (Site). Đây là dòng tiền thực thu từ khách và phải được tính vào M04. Các phiếu thu `ObjectType = 4` khác (như "Thu nhập khác" `OTHERINCOME` từ `VoucherService.cs` dòng 350-365) không phải doanh thu khách hàng và không được tính.
- **Quy tắc**: M04 = Σ phiếu thu (`DocumentType = 1`) có `ObjectType` ∈ {2, 5, 6}, cộng các phiếu thu có `ObjectType = 4` VÀ `PaymentTypeCode = "CUSTOMERPAID"`. Triển khai thông qua biểu thức dịch EF Core `IsCollectedRevenueReceiptPredicate`.
- **Tập tin thay đổi**:
  - `Src/Application/Services/DashboardV2/DashboardV2PaymentClassifier.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Revenue.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs`
- **Kiểm thử**:
  - `Tests/Application.Tests/DashboardV2RevenueModelTests.cs`: `CustomerPaidReceiptWithSiteObjectTypeIsIncludedInM04`, `OtherSiteReceiptDoesNotCountInM04`.
  - `Tests/Application.Tests/DashboardV2Wave2bQueryTranslationTests.cs`: `CollectedRevenueReceiptQueryTranslatesToSql`.
  - `Tests/Application.Tests/DashboardV2GoldenDatasetTests.cs`: Golden TC-01 M04 9.422.400 và TC-02 M04 6.010.000 không thay đổi (15/15 pass).

#### F2 — HRM client báo lỗi rõ ràng (503), bảo vệ phân cấp khu vực khi đồng bộ (QĐ-28)
- **Vấn đề**: `HrmRequestClient.FetchPagedList` trước đây gặp lỗi HTTP, response rỗng, parse JSON thất bại hoặc `meta.success != true` chỉ `break` vòng lặp và trả về danh sách rỗng/thiếu. Khi đó `SyncFromHrmAsync` bị gán nhầm toàn bộ cửa hàng vào "Chưa phân khu vực".
- **Giải pháp**:
  - `FetchPagedList`: Ném `ServiceUnavailableException` (HTTP 503) ghi rõ tên endpoint và status code khi request thất bại, body rỗng, lỗi parse JSON hoặc `meta.success != true`. Truyền `status = 1` (HRM `StatusFilters.ActiveOnly`) trong body phân trang để chỉ lấy các dòng đang hoạt động trên HRM.
  - Trong `SyncFromHrmAsync`: Lấy đủ 4 danh sách từ HRM trước khi thực hiện bất kỳ thao tác ghi DB nào.
  - Safety guard: Nếu HRM trả về 0 cụm (`StoreCluster`) hoặc 0 liên kết nhóm-cửa hàng (`BuddyStoreGroupSite`) trong khi DB đang có phân công thực tế (khác "Chưa phân"), hàm dừng ngay và ném `DashboardValidationException` yêu cầu thêm tham số `force = true` để ghi đè.
  - Thêm tham số `bool force = false` vào service và query string `?force=true` trên endpoint `POST Admin/V2/Region/SyncFromHrm`.
  - Toàn bộ thao tác ghi DB trong service chạy trong 1 transaction nội bộ (`await using var transaction = await Db.BeginTransactionAsync()`). Đã gỡ attribute `[Transactional]` trên controller endpoint `SyncFromHrm` để tránh lỗi lồng transaction trên PostgreSQL.
  - Job Hangfire `SyncFromHrmJobAsync`: bắt và ghi log lỗi nếu đồng bộ thất bại, không để crash scheduler và giữ nguyên dữ liệu hiện có trong DB.
- **Tập tin thay đổi**:
  - `Src/Application/RequestClients/HrmRequestClient.cs`
  - `Src/Application/Services/DashboardV2/DashboardRegionService.cs`
  - `Src/WebApi/Controllers/Admins/V2/DashboardRegionController.cs`
  - `Src/WebApi/Hangfire/HangfireStartup.cs`
- **Kiểm thử**:
  - `Tests/Application.Tests/DashboardV2HrmRegionSyncTests.cs`:
    - `SyncFromHrm_HrmFailure_ThrowsServiceUnavailable_AndLeavesAssignmentsUntouched`: kiểm tra client lỗi trả 503 và dữ liệu giữ nguyên; verify Hangfire daily job nuốt lỗi và không thay đổi DB.
    - `SyncFromHrm_EmptyHrmGuard_ProtectsExistingAssignments_UnlessForced`: kiểm tra guard chặn danh sách rỗng khi không có `force`, và cho phép tiếp tục khi `force = true`.

#### F3 — Vô hiệu hoá khu vực và cụm không còn tồn tại trên HRM (QĐ-28)
- **Vấn đề**: Các khu vực/cụm bị xoá trên HRM hoặc các khu vực thủ công cũ (`HrmId == null`) từ wave 3b vẫn mang `IsActive = true`, tiếp tục xuất hiện trên cây khu vực, bộ lọc và heatmap.
- **Giải pháp**:
  - Sau khi đồng bộ thành công, gán `IsActive = false` cho mọi `DashboardRegion` và `DashboardCluster` không có mặt trong kết quả đồng bộ này (ngoại trừ các bản ghi giữ chỗ `CHUA_PHAN_KHU_VUC` và `CHUA_PHAN_CUM`).
  - Bổ sung `DeactivatedRegionCodes` (`List<string>`) và `DeactivatedClusterCodes` (`List<string>`) vào kết quả trả về `DashboardRegionSyncResultAdminDto`.
  - `GetTreeAsync`, `GetCatalog`, bộ lọc phân cấp (`EnsureRequestedScope`) và heatmap (`QueryExecutiveSites`) chỉ truy vấn và trả về các khu vực/cụm đang hoạt động (`IsActive = true`).
  - Các dòng KPI V2 phạm vi Khu vực (`KpiPlanScope` với `ScopeType == KpiScopeTypes.Region`) trỏ tới khu vực đã bị vô hiệu hoá vẫn được giữ nguyên trong DB (không bao giờ xoá) và được liệt kê trong `UnmatchedKpiRegionScopes`.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/Region/DashboardRegionDtos.cs`
  - `Src/Application/Services/DashboardV2/DashboardRegionService.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service._Base.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Executive.cs`
- **Kiểm thử**:
  - `Tests/Application.Tests/DashboardV2HrmRegionSyncTests.cs`: `SyncFromHrm_DeactivatesMissingAndLegacyRegionsAndClusters_ExcludesFromTree_AndTracksUnmatchedKpiScopes`.

#### F4 — Liên kết cụm → khu vực xác định (deterministic) (QĐ-28)
- **Vấn đề**: Trong `SyncFromHrmAsync`, `clusterLinks` trước đây dùng `g.First()` khi một `BuddyStoreGroup` liên kết với nhiều `StoreCluster`, dẫn đến việc chọn khu vực không xác định phụ thuộc thứ tự từ HRM.
- **Giải pháp**: Chọn khu vực có mã `StoreCluster.Code` nhỏ nhất theo thứ tự từ điển (ordinal). Báo cáo xung đột trong trường `ClusterRegionConflicts` (`List<DashboardClusterRegionSyncConflictAdminDto>`) của kết quả đồng bộ gồm `ClusterCode`, `RegionCodes`, `ChosenRegionCode` (và alias `ChosenCode`). Ghi thêm log cảnh báo `Logger.LogWarning`.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/Region/DashboardRegionDtos.cs`
  - `Src/Application/Services/DashboardV2/DashboardRegionService.cs`
- **Kiểm thử**:
  - `Tests/Application.Tests/DashboardV2HrmRegionSyncTests.cs`: `SyncFromHrm_ClusterLinkedToMultipleRegions_PicksLowestRegionCode_AndReportsConflict`.

#### F5 — Tổng widget hình thức thanh toán bằng chính xác M04 (FR-OP-05, AC-OP05-01)
- **Vấn đề & Nghiệp vụ**:
  - Mã hình thức thanh toán thực tế trên POS (`pos.api/Src/Application/Services/SaleOrderService.cs` dòng 3982-3987) gồm: `CASH`, `CARD`, `WALLET`, `TRANSFER`, `VOUCHER`, `MIXTURE`.
  - POS không có mã `COD` hoặc `INSTALLMENT`. Do đó các quy tắc mặc định trong `DashboardV2Options.PaymentMethodRules` không map 2 nhóm này với mã nào (giữ nguyên 0 cho đến khi vận hành cấu hình mã).
  - Giữ nguyên 6 nhóm (`cash`, `transfer`, `card`, `ewallet`, `cod`, `installment`) cùng cơ chế cấu hình linh hoạt. Bổ sung XML comment tiếng Việt giải thích COD / INSTALLMENT chưa có mã và `VOUCHER` / `MIXTURE` mặc định rơi vào nhóm "Khác" (`Other`). Tuyệt đối không tự bịa mã.
  - Widget hình thức thanh toán sử dụng cùng biểu thức lọc phiếu thu với M04 (`DashboardV2PaymentClassifier.IsCollectedRevenueReceiptPredicate`), đảm bảo tổng widget `CollectedRevenueWithVat` và tổng các `Items` bằng chính xác M04 trên cùng tập lọc dữ liệu.
- **Tập tin thay đổi**:
  - `Src/Application/Services/DashboardV2/DashboardV2Options.cs`
  - `Tests/Application.Tests/DashboardV2OperationalTests.cs`
- **Kiểm thử**:
  - `Tests/Application.Tests/DashboardV2OperationalTests.cs`:
    - `CampaignWidgetGroupsMissingCampaignCodesUnderNoCampaignAndGroupsPaymentMethods`: kiểm tra nhóm theo mã thật POS và COD/INSTALLMENT = 0.
    - `PaymentMethodWidgetTotalEqualsM04_IncludingSiteCustomerPaidReceipt`: kiểm tra trên cùng 1 dataset chứa phiếu thu đơn hàng, phiếu thu cọc, phiếu thu công nợ đơn hàng, phiếu thu công nợ khách hàng từ màn hình khách (Site `CUSTOMERPAID`), loại bỏ phiếu thu ngoài kỳ/khác chi nhánh/thu nhập khác/phiếu chi hoàn tiền. Kết quả: tổng widget bằng chính xác M04 = 9.500.000 VNĐ.

---

### 2. Thay đổi hợp đồng API (API Contract Changes)

| Endpoint / DTO | Kiểu thay đổi | Chi tiết |
|---|---|---|
| `POST Admin/V2/Region/SyncFromHrm?force=true` | Thêm query parameter | Tham số `force` (`bool`, mặc định `false`). Khi danh sách cụm/cửa hàng từ HRM rỗng trong khi DB đang có phân công, API chặn và trả lỗi cảnh báo; chỉ khi truyền `?force=true` mới cho phép ghi đè. |
| `POST Admin/V2/Region/SyncFromHrm` | Hành vi lỗi (Error behavior) | Khi kết nối HRM gặp lỗi mạng, HTTP != 200, parse JSON thất bại hoặc `meta.success != true`, endpoint trả về HTTP 503 `ServiceUnavailableException`. Không làm mất dữ liệu phân cấp hiện có. |
| `DashboardRegionSyncResultAdminDto.DeactivatedRegionCodes` | Thêm trường kết quả (`List<string>`) | Danh sách mã khu vực bị vô hiệu hoá (`IsActive = false`) do không còn tồn tại trên HRM hoặc là khu vực thủ công cũ. |
| `DashboardRegionSyncResultAdminDto.DeactivatedClusterCodes` | Thêm trường kết quả (`List<string>`) | Danh sách mã cụm bị vô hiệu hoá (`IsActive = false`) do không còn tồn tại trên HRM. |
| `DashboardRegionSyncResultAdminDto.ClusterRegionConflicts` | Thêm trường kết quả (`List<DashboardClusterRegionSyncConflictAdminDto>`) | Danh sách các cụm liên kết với nhiều khu vực HRM. Mỗi phần tử chứa: `ClusterCode` (`string`), `RegionCodes` (`List<string>`), `ChosenRegionCode` (`string`) và alias `ChosenCode` (`string`). |

---

### 3. Số lượng kiểm thử trước và sau (Before / After Test Numbers)

| Bộ kiểm thử | Trước review PM (Wave 4 ban đầu) | Sau khi sửa F1–F5 | Trạng thái |
|---|---|---|---|
| **DashboardV2 & KpiV2** | 500 passed, 2 skipped (Tổng 502) | **506 passed, 2 skipped (Tổng 508)** | Passed 100% |
| **Golden Dataset** | 15 passed (Tổng 15) | **15 passed (Tổng 15)** | Passed 100% (TC-01 & TC-02 M04 bất biến) |
| **Model Changes** | No pending changes | **No pending changes** | Khớp 100% snapshot EF Core |
