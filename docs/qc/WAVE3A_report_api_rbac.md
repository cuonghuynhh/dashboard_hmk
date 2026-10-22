# WAVE 3A — report.api: vai trò, scope quyền và phạm vi dữ liệu (RLS)

Nhánh: `qc/dashboard-v2-wave3-rbac` (worktree `report.api-rbac`, dựa trên wave 1). Chỉ commit local, chưa push.
Tham chiếu: PRODUCT_SPEC §5 (BR-ROLE-01..04, AC-ROLE-01..05), §7.5, §7.6, NFR-03; QC_B mục (3), RLS-01..08, TR-07, HM-10, KPI-14/17, CA-02.

## 1. Danh mục scope (gửi Identity team)

Scope thật Identity đang phát hành (bằng chứng): `manager.dashboard.read` (`pos.api/Src/WebApi/Controllers/Commons/PermissionController.cs:43`, `pos.gui/src/layouts/admin.vue:28`, `pos.gui/src/pages/dashboard-v2/routeGuard.ts:3-8`). Test cũ kỳ vọng `manager.dashboard` là SAI -> đã sửa test theo chuỗi thật. GMV: `manager.dashboard-v2.gmv.read` (`pos.gui/.../routeGuard.ts:3`, `pos.gui/docs/dashboard-v2-gmv-permission.md`).

Nguồn duy nhất trong code: `Src/Domain/Constants/DashboardV2PermissionCodes.cs`.

| Scope (mã chuẩn PM) | Alias có tiền tố Identity | Loại | Ý nghĩa |
|---|---|---|---|
| `dashboard-v2.bod` | `manager.dashboard-v2.bod` | Vai trò | Mọi trang, mọi chi nhánh |
| `dashboard-v2.manager` | `manager.dashboard-v2.manager` | Vai trò | Vận hành, Sản phẩm, Nhân sự, xem KPI; chỉ chi nhánh được gán |
| `dashboard-v2.staff` | `manager.dashboard-v2.staff` | Vai trò | Chỉ tab Nhân sự, góc nhìn cá nhân |
| `dashboard-v2.gmv.read` | `manager.dashboard-v2.gmv.read` | Quyền | Xem GMV (thiếu -> trường GMV = null, `gmvHidden: true`) |
| `dashboard-v2.kpi.write` | `manager.dashboard-v2.kpi.write` | Quyền | Tạo/sửa/xóa/import KPI. Chỉ có hiệu lực khi vai trò = BOD |
| `dashboard-v2.traffic.write` | `manager.dashboard-v2.traffic.write` | Quyền | Nhập/import Traffic. BOD: mọi CH; MANAGER: chỉ CH được gán; STAFF: không bao giờ |
| `manager.dashboard.read` | (legacy) | Legacy | Map thành BOD-tương-đương khi cờ `LegacyScopeMapping` = true |

Quy ước: server nhận cả dạng không tiền tố và dạng `manager.` (pos.gui đang dùng dạng có tiền tố cho GMV). Scope bắt đầu bằng `-` thu hồi scope đó (đúng quy ước pos.gui `-manager.dashboard-v2.gmv.read`). Ưu tiên khi có nhiều vai trò: BOD > MANAGER > STAFF.

Hành vi legacy (cờ ON): `manager.dashboard.read` => vai trò BOD + ghi KPI + ghi Traffic (giữ hành vi hiện tại). GMV KHÔNG tự cấp (đúng với GUI hiện tại đã ẩn GMV khi thiếu scope GMV). Cờ OFF: chỉ scope mới có hiệu lực; token chỉ có `manager.dashboard.read` nhận 403.

## 2. Ma trận vai trò -> quyền truy cập (đã triển khai)

| Hạng mục | BOD | MANAGER | STAFF |
|---|---|---|---|
| Phạm vi dữ liệu | Toàn hệ thống | Chỉ CH được gán | Chỉ CH làm việc của mình, chỉ hàng của mình |
| Executive (5 endpoint) + BranchPerformance | có | 403 | 403 |
| Operational (+ 10 block), Product (+ 5 block) | có | có (trong phạm vi) | 403 |
| Personnel | BXH toàn hệ thống | BXH CH mình | Chỉ dòng của chính mình (Leaderboard + Scorecards lọc theo `StaffId`; `StaffIds` do client gửi bị ghi đè) |
| KPI đọc (`KpiV2` GET/Summary/Evaluate) | có | có | 403 |
| KPI ghi (Create/Update/Activate/End/Archive/ResolveConflict/BulkUpdate/ImportSaleTargets) | cần `kpi.write` (hoặc legacy) | 403 | 403 |
| Traffic Search | có | chỉ CH gán (không gửi SiteIds => toàn phạm vi được gán) | 403 |
| Traffic Upsert | cần `traffic.write` (hoặc legacy) | cần `traffic.write` + mọi CH trong batch phải được gán, nếu không 403 | 403 |
| `SaleTarget` cũ (CRUD) | đọc: BOD; ghi: BOD có `kpi.write` | 403 | 403 |
| Heatmap cũ `Report/BranchPerformanceHeatmap` | BOD | 403 | 403 |

Thực thi ở 4 lớp (BR-ROLE-04):
1. Cổng thô: `[RequireDashboardV2Access]` (any-scope trong danh sách vai trò) trên `DashboardV2Controller` và `KpiV2Controller` (`Src/WebApi/Abstracts/RequireDashboardV2AccessAttribute.cs`); cộng `[RequireScope("admin")]` kế thừa từ `AdminController`.
2. Cổng trang + RLS ở controller: mọi endpoint dữ liệu đi qua `Run(...)` (`DashboardV2Controller.cs`, cuối file) -> `RequirePageAsync(page)` -> `ScopeFilter(filter)`.
3. Service: `DashboardV2Service._Base.cs` — mọi hàm biên gọi `ScopeAsync(filter)` (idempotent) trước khi gọi `ReportService`; `EnsureRequestedScope` kiểm quyền + `EnsureSitesAllowed`; `QueryExecutiveSites` luôn giao với `GetAllowedSiteIds()` (`DashboardV2Service.Executive.cs`, hàm `QueryExecutiveSites`); `GetOperationalPreOrderSiteIds` truyền allowed sites (`ReportService.DashboardV2.OrderAging.cs`).
4. Bộ lọc toàn cục `DashboardV2LegacyEndpointFilter` (đăng ký ở `Startup.cs`) cho `SaleTarget` (endpoint sinh tự động) và heatmap cũ.

Quy tắc phạm vi (`DashboardV2AccessContext.ScopeFilter`, `DashboardV2Access.cs`): site yêu cầu nằm ngoài phạm vi => `ForbiddenException` (HTTP 403); không yêu cầu site => toàn bộ site được gán (không bao giờ "mọi site Active" cho MANAGER/STAFF); MANAGER không có site nào => 403 trên endpoint dữ liệu; STAFF không có hồ sơ nhân viên => 403.

## 3. Nguồn dữ liệu cửa hàng được gán và ánh xạ nhân viên

- Tài khoản -> nhân viên: `PosDb.Staff.AccountId` (một tài khoản có thể ứng với nhiều dòng; lấy hết): `Src/Application/Services/DashboardV2/DashboardV2AccessService.cs:49-52`. Cột nguồn: `Src/Domain/Entities/Pos/Staff.cs:56` (`AccountId`), tương ứng `pos.api/Src/Domain/Entities/Staff.cs:67` (unique index `Staff.cs:173`).
- Nhân viên -> chi nhánh làm việc: `Db.ReportStaffWorkingSite` (`DashboardV2AccessService.cs:56-62`), bảng do `SyncStaffWorkingSites` đồng bộ từ POS `SiteStaff`: `Src/Application/Services/Report/ReportService.Staff.cs:40-86` (gọi tại `ReportService._Base.cs:409`). Migration đã có: `AddDashboardV2PersonnelWorkingSites`.
- KHÔNG dùng `RegionSite` (cấu hình riêng từng tài khoản). Riêng `RegionIds` trong bộ lọc vẫn kiểm theo `Region.AccountId` như cũ.
- BOD không cần tra DB (bỏ qua truy vấn). Bộ nhớ đệm trong phạm vi request (service là per-request).

## 4. Che GMV (B4)

Không thiếu quyền => KHÔNG 403 block; trả `null` + cờ `gmvHidden: true`. Thực hiện ở lớp hậu xử lý `DashboardV2ResponsePostProcessor.MaskGmv` (`Src/Application/Services/DashboardV2/DashboardV2ResponsePostProcessor.cs`), gọi trong factory trước khi cache (khóa cache đã gồm cờ GMV) — công thức không bị sửa.

Trường bị che (theo tên, mọi DTO phản hồi):
- GMV: `GmvWithVat`, `GmvWithoutVat`, `DirectGmvWithVat`, `DirectGmvWithoutVat`, `PreOrderGmvWithVat`, `PreOrderGmvWithoutVat`, `CumulativeGmvWithVat`.
- Bí danh GMV: `GrossSales`, `GrossSalesWithVat`, `GrossSalesWithoutVat`.
- Suy ra GMV: `AdjustmentWithVat`, `AdjustmentWithoutVat` (= doanh thu thuần - GMV).
- Chỉ trên `ExecutiveRankingItemV2Dto`: `Rank`, `DropRate`, `ContributionRate`; trên `ExecutiveRankingTotalV2Dto`: `DropRate`, `ContributionRate` (đều tính từ GMV; thứ hạng xếp theo GMV).
- Áp dụng cho: `ExecutiveKpiSummaryV2Dto`, `ExecutivePreviousPeriodV2Dto`, `ExecutiveTrendPointV2Dto`, `ExecutiveRankingItemV2Dto/TotalV2Dto` (qua Executive, Executive/Kpis, PreviousPeriod, Trend, Ranking).
- KHÔNG che (không tiết lộ GMV): doanh thu thuần, thu tiền, hoàn tiền, AOV, số đơn, `Target`, `TargetCompletion` (hiện tính trên doanh thu thuần không VAT). Nếu wave 2 đổi `TargetCompletion`/`GrowthRate` sang cơ sở GMV thì thêm tên vào `MaskedProperties` (một danh sách duy nhất).
- Thay đổi DTO: các thuộc tính trên đổi `decimal`->`decimal?` (và `Rank` `int`->`int?`, `ContributionRate` `decimal`->`decimal?` ở ranking). Test phản chiếu `EveryMaskedPropertyOnAResponseDtoIsNullable` giữ ràng buộc này.

## 5. Cờ cấu hình

| Cờ | Mặc định | Ý nghĩa |
|---|---|---|
| `DashboardV2:LegacyScopeMapping` (appsettings hoặc biến môi trường `DashboardV2__LegacyScopeMapping`) | `true` | ON: `manager.dashboard.read` = BOD-tương-đương (giữ hành vi cũ). OFF: chỉ scope `dashboard-v2.*` |

Lớp: `Src/Domain/AppsettingTypes/DashboardV2Appsetting.cs`. Chưa thêm khóa vào `appsettings*.json` (mặc định trong code = true).

## 6. Thay đổi hợp đồng API cho frontend

1. **Mới** `GET /Admin/V2/Dashboard/Access` trả `DataResult<{ role, allSites, allowedSiteIds, staffId, pages, flags: { gmvRead, kpiWrite, trafficWrite }, legacyScopeMapped }>`.
   - `role`: `BOD | MANAGER | STAFF | NONE`; `allSites=true` (BOD) thì `allowedSiteIds=[]`; `pages` thuộc `executive|operational|product|personnel|kpi`.
   - FE nên dựng tab/nút từ endpoint này thay vì tự suy từ scope token; ghi KPI/Traffic dựa vào `flags`.
2. **`gmvHidden`**: thêm vào `DashboardV2BlockAdminDto` (mọi block) và các DTO trang (Executive, Operational, Product, Personnel, BranchPerformance). `true` khi thiếu quyền GMV. Các trường ở mục 4 trả `null`; FE phải chịu `null` (`gmvWithVat`, `grossSales*`, `adjustment*`, `directGmv*`, `preOrderGmv*`, `cumulativeGmvWithVat`, ranking `rank/dropRate/contributionRate`).
3. **HTTP 403** (`ForbiddenException`, body lỗi chuẩn của framework) trong các trường hợp: không có vai trò Dashboard V2; trang không thuộc vai trò (MANAGER vào Executive/BranchPerformance, STAFF vào Operational/Product/KPI/Traffic); site yêu cầu nằm ngoài phạm vi; MANAGER chưa được gán CH; STAFF chưa liên kết nhân viên; ghi KPI không có `kpi.write` hoặc không phải BOD; ghi Traffic thiếu `traffic.write` hoặc CH ngoài phạm vi; `SaleTarget` cũ/heatmap cũ không phải BOD.
4. MANAGER không gửi `siteIds`: server tự lấy toàn bộ CH được gán (không còn "tất cả CH Active"). STAFF: `staffIds` luôn bị ghi đè = chính mình.
5. Không đổi đường dẫn endpoint hiện có.

## 7. Kết quả test

- Lệnh: `dotnet test Tests/Application.Tests/Application.Tests.csproj --filter "FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2"`: **381 pass, 0 fail, 2 skip** (baseline 313 pass / 1 fail / 2 skip; 1 fail cũ đã xử lý đúng gốc rễ: test sai chuỗi, scope thật là `manager.dashboard.read`).
- Test mới `Tests/Application.Tests/DashboardV2RbacTests.cs` (43 case): ánh xạ scope -> vai trò (BOD/MANAGER/STAFF), legacy ON/OFF, scope âm, mặc định cờ; ma trận vai trò x trang; BOD thấy tất cả; MANAGER bị giới hạn và 403 site ngoài phạm vi, không site => toàn phạm vi gán, không gán => 403, không ghi KPI, ghi Traffic chỉ CH gán; STAFF chỉ self-view và bị ghi đè `StaffIds`; che GMV (từng trường), không che khi có quyền, mọi trường che đều nullable; khóa cache khác nhau theo phạm vi và GMV; bộ lọc legacy `SaleTarget`/heatmap.
- Cập nhật test cũ theo hợp đồng mới: `DashboardV2PermissionTests` (viết lại theo cổng trang), `DashboardV2ApiContractTests`, `DashboardV2ContractTests`, `DashboardV2TrafficTests`, `KpiV2CrudTests`.
- Chưa chạy được: toàn bộ solution test chậm >2 phút (có test cần Postgres); chưa kiểm chứng trên môi trường chạy thật (không có DB trong sandbox). Cần smoke test sau deploy.

## 8. Rủi ro còn lại / việc chờ

1. **Identity/DevOps**: chưa có scope `dashboard-v2.*` trong `PermissionController.cs` (pos.api). Cho tới khi cấp, giữ `LegacyScopeMapping=true`. Sau khi cấp scope và đăng nhập lại token mới mới tắt cờ.
2. **GMV**: mặc định không ai có GMV cho tới khi scope `dashboard-v2.gmv.read` (hoặc `manager.dashboard-v2.gmv.read`) được cấp; sau deploy, BOD legacy sẽ thấy GMV = null (UI hiện đã ẩn nên nhất quán). Cần cấp scope GMV trước/cùng lúc bật.
3. **Giả định cần xác nhận**: `IdentityContext.Id` (token) = `Staff.AccountId` bên POS; một tài khoản MANAGER phải có `Staff` + `SiteStaff` trên POS, nếu không sẽ bị 403 "chưa được gán". Cần kiểm dữ liệu thật trước khi bật.
4. **Merge với wave 2**: đổi kiểu thuộc tính ở `ExecutiveDashboardV2Dto.cs` (nullable) và thêm tham số ở `ReportService.DashboardV2.OrderAging.cs` (`BuildAuthorizedSiteIdQuery(..., allowedSiteIds)`), `DashboardV2Service.Executive.cs` (khối RLS trong `QueryExecutiveSites`) — điểm xung đột tiềm năng. Công thức mới có đọc ngược các trường này dưới dạng `decimal` sẽ cần `.GetValueOrDefault()`.
5. **Traffic theo tài khoản**: `DashboardTrafficDaily` khóa theo `AccountId` (`Traffic.cs` Search/Upsert; Operational đọc `AccountId == IdentityContext.Id`). MANAGER chỉ thấy Traffic do chính mình nhập, không thấy Traffic BOD nhập -> tỷ lệ chuyển đổi của MANAGER có thể thiếu. Cần quyết định (bỏ AccountId khỏi khóa, migration) ở wave sau; không đổi trong wave này.
6. **KPI V2 theo `AccountId`** (QC KPI-c): MANAGER được phép đọc nhưng danh sách KPI lọc theo người tạo -> MANAGER sẽ không thấy KPI do BOD tạo. Cần wave KPI (quyền đọc theo CH + khu vực/công ty chứa nó).
7. **OrderAging (BOD)** vẫn yêu cầu `RegionSite` của tài khoản (hành vi cũ giữ nguyên cho BOD); MANAGER/STAFF dùng CH được gán. Có thể lệch giữa các block đối với BOD chưa cấu hình khu vực.
8. **Các endpoint `ReportController` cũ khác** (Order, Product, ResponseRate…) chưa đưa vào bộ lọc (chỉ SaleTarget + heatmap theo yêu cầu).
9. **Hiệu năng**: mỗi request MANAGER/STAFF thêm 2 truy vấn nhẹ (POS Staff, ReportStaffWorkingSite). Khóa cache có chữ ký phạm vi (băm danh sách site) nên đổi gán CH được phản ánh ngay ở request kế tiếp, không cần chờ hết token.
10. Legacy filter nhận diện endpoint `SaleTarget` bằng đường dẫn/HTTP method (GET = đọc, còn lại = ghi) vì endpoint sinh tự động; nếu có endpoint đọc dạng POST (vd. search) sẽ bị coi là ghi (an toàn hơn).
