# Báo Cáo Khắc Phục 4 Lỗi QC Backend (report.api) — FIX1

- **Nhánh làm việc**: `qc/dashboard-v2-fix1`
- **Kho mã nguồn**: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api`
- **Tài liệu tham chiếu**:
  - Đặc tả Dashboard: `docs/PRODUCT_SPEC_DASHBOARD.md` (v2.1) §5 (BR-ROLE-01 GMV masking), §7.6, NFR-01
  - Biên bản QC backend: `docs/qc/QC_FINAL_backend.md` mục 5

---

## 1. Danh sách Commit

1. `d04ac9f`: `fix(dashboard-v2): make traffic company-wide in operational conversion and benchmark queries (NEW-01)`
2. `5cc197c`: `fix(kpi-v2): add gmv masking for kpi v2 responses (NEW-02)`
3. `c3deeb1`: `perf(kpi-v2): batch load snapshots in freeze to eliminate n+1 queries (NEW-03)`
4. `5fc7b69`: `fix(dashboard-v2): make product gmv fields nullable and maskable (NEW-04)`

---

## 2. Chi tiết từng lỗi & giải pháp khắc phục

### 2.1 NEW-01 (Lớn) — Traffic phải dùng chung toàn công ty (Company-wide) ở mọi nơi

- **Hiện trạng**:
  - Tại `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs`, hai hàm `QueryRegionalBenchmark` và `QueryConversionRate` vẫn còn áp điều kiện `x.AccountId == IdentityContext.Id` khi truy vấn bảng `DashboardTrafficDaily`.
  - Điều này vi phạm quy tắc Wave 3b: Traffic là dữ liệu toàn công ty tính theo cặp `(SiteId, Date)` do chi nhánh nhập, người dùng A nhập thì người dùng B (có cùng phạm vi chi nhánh) phải xem được.
- **Giải pháp**:
  - Loại bỏ hoàn toàn điều kiện `x.AccountId == IdentityContext.Id` trong các truy vấn traffic tại `DashboardV2Service.Operational.cs`, chỉ lọc theo phạm vi chi nhánh được phép truy cập (`siteIds`).
  - Quét toàn bộ cây thư mục `Src/` để đảm bảo không còn bất kỳ truy vấn đọc nào của `DashboardTrafficDaily` hoặc `DashboardTrafficHistory` bị giới hạn theo `AccountId`.
  - Trong `DashboardV2GmvQueries.cs` (`ReturningCustomerRows`), tối ưu phép `Distinct()` trên composite key `new { x.SiteId, x.CustomerId }` trước khi chiếu sang `ReturningCustomerRow` để đảm bảo tương thích cả SQL translation của PostgreSQL và EF Core In-Memory provider.
- **Tập tin thay đổi**:
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2GmvQueries.cs`
  - `Tests/Application.Tests/DashboardV2ConversionTests.cs`
- **Kiểm thử**:
  - Thêm test `TrafficEnteredByAccountAIsVisibleToAccountBWithSameScopeForConversionAndBenchmark` trong `DashboardV2ConversionTests.cs`: xác nhận Account A nhập traffic, Account B có cùng site scope truy vấn M14 conversion và regional benchmark đều thấy đầy đủ số liệu traffic của Account A.

---

### 2.2 NEW-02 (Lớn) — GMV masking cho KPI V2

- **Hiện trạng**:
  - Các endpoint trong `Src/WebApi/Controllers/Admins/V2/KpiV2Controller.cs` (`Get`, `Create`, `Update`, `Activate`, `Summary`, `Evaluate`, `ResolveConflict`, `Versions`) để lộ các trường giá trị mục tiêu và thực tế GMV (`TargetValue`, `ActualValue`, `DayTypeTargets` - `Weekday`/`Weekend`/`Holiday`, `MetricTarget.Value`, `OldGmv`/`NewGmv`) ngay cả khi người dùng không có quyền đọc GMV (`gmvRead == false`).
- **Giải pháp**:
  - Bổ sung interface `IDashboardV2GmvAware` (`GmvHidden`) vào các DTO phản hồi của KPI V2: `KpiV2PagedResultAdminDto`, `KpiV2PlanAdminDto`, `KpiV2VersionAdminDto`, `KpiV2ActualAdminDto`, `KpiV2SummaryAdminDto`, `KpiV2ConflictResultAdminDto`.
  - Đổi kiểu `TargetValue` trong `KpiV2ActualAdminDto` và `Value` trong `KpiV2MetricTargetAdminDto` sang `decimal?` để cho phép gán `null`.
  - Trong `DashboardV2ResponsePostProcessor.Walk`:
    - Khi `gmvRead == false`, đặt cờ `GmvHidden = true` trên response.
    - Với `KpiV2ActualAdminDto`: nếu `Metric == KpiMetricTypes.Gmv`, null hóa `TargetValue` và `ActualValue`, nhưng vẫn giữ nguyên tỷ lệ hoàn thành `CompletionRate` (%).
    - Với `KpiV2MetricTargetAdminDto`: nếu `Metric == KpiMetricTypes.Gmv`, null hóa `Value`.
    - Với `KpiV2DayTypeTargetsAdminDto`: null hóa `Weekday`, `Weekend`, `Holiday`.
    - Với `KpiV2PlanConflictAdminDto`: null hóa `OldGmv`, `NewGmv`.
    - Các chỉ tiêu phi-GMV (`Conversion`, `Aov`, `Traffic`, `Csat`) hoàn toàn không bị che.
  - Cập nhật `KpiV2Controller`: `RequireKpiRead()` và `RequireKpiWrite()` trả về `DashboardV2AccessContext`, sau đó wrap kết quả trả về của tất cả các action qua `DashboardV2ResponsePostProcessor.MaskGmv(result, access.GmvRead)`.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/KpiV2/KpiV2Dtos.cs`
  - `Src/Application/Services/KpiV2/KpiV2EvaluationService.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2ResponsePostProcessor.cs`
  - `Src/WebApi/Controllers/Admins/V2/KpiV2Controller.cs`
  - `Tests/Application.Tests/DashboardV2RbacTests.cs`
- **Kiểm thử**:
  - Thêm test `ManagerWithoutGmvPermissionHasGmvMaskedInKpiResponses`: MANAGER không có quyền GMV thì các giá trị GMV bị null, `gmvHidden: true`, % hoàn thành giữ nguyên, các chỉ tiêu phi-GMV (Conversion, AOV, Traffic) không bị che.
  - Thêm test `BodWithGmvPermissionHasGmvValuesPresentInKpiResponses`: BOD có quyền GMV thì toàn bộ giá trị hiển thị bình thường, `gmvHidden: false`.

---

### 2.3 NEW-03 (Nhỏ) — Loại bỏ N+1 query trong `KpiV2EvaluationService.Freeze`

- **Hiện trạng**:
  - Tại `Src/Application/Services/KpiV2/KpiV2EvaluationService.cs`, phương thức `Freeze` thực hiện vòng lặp `foreach (var actual in actuals)` và gọi `Db.KpiActualSnapshot.SingleOrDefaultAsync(...)` cho từng actual riêng lẻ, gây ra hiện tượng N+1 truy vấn vào cơ sở dữ liệu.
- **Giải pháp**:
  - Tải trước toàn bộ snapshot đã có của batch trong một truy vấn duy nhất:
    `Db.KpiActualSnapshot.Where(x => versionIds.Contains(x.KpiPlanVersionId)).ToListAsync()`.
  - Khởi tạo `HashSet` in-memory chứa khóa `(PlanVersionId, ScopeType, EntityId, Metric)` để kiểm tra sự tồn tại trong $O(1)$.
  - Vòng lặp chỉ tạo mới và đưa vào danh sách `toAdd` các snapshot chưa từng tồn tại, sau đó lưu hàng loạt qua `Db.KpiActualSnapshot.AddRange(toAdd)` và `SaveChangesAsync()`.
  - Giữ vững tính chất idempotent: gọi lại freeze nhiều lần không ghi đè giá trị cũ và không tạo bản ghi trùng lặp.
- **Tập tin thay đổi**:
  - `Src/Application/Services/KpiV2/KpiV2EvaluationService.cs`
  - `Tests/Application.Tests/KpiV2EvaluationTests.cs`
- **Kiểm thử**:
  - Thêm test `Freeze_BatchLoadsExistingSnapshotsAndOnlyAddsMissingOnesIdempotently` trong `KpiV2EvaluationTests.cs`: kiểm tra batch loading, bảo toàn snapshot cũ, chỉ thêm mới bản ghi thiếu, và bảo đảm tính idempotent khi gọi lặp lại.

---

### 2.4 NEW-04 (Nhỏ) — Trường GMV chưa nullable hoặc chưa hỗ trợ masking

- **Hiện trạng**:
  - Tại `Src/Application/Dto/Admins/DashboardV2/Product/ProductDashboardV2Dto.cs`, hai thuộc tính `CurrentGmv` và `PreviousGmv` của `ProductBrandAggregateV2Dto` là kiểu `decimal` không nullable và chưa nằm trong `DashboardV2ResponsePostProcessor.MaskedProperties`.
- **Giải pháp**:
  - Chuyển `CurrentGmv` và `PreviousGmv` thành `decimal?`.
  - Bổ sung `CurrentGmv`, `PreviousGmv`, `OldGmv`, `NewGmv` vào `MaskedProperties`.
  - Rà soát toàn bộ các DTO dưới `Src/Application/Dto/Admins/DashboardV2/`: chuyển `ProductCategoryAggregateV2Dto.Gmv` sang `decimal?`, đảm bảo 100% trường chứa GMV đều là `decimal?` và có thể bị che.
  - Cập nhật test reflection `EveryMaskedPropertyOnAResponseDtoIsNullable` để quét cả `ProductBrandAggregateV2Dto`.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/Product/ProductDashboardV2Dto.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2ResponsePostProcessor.cs`
  - `Tests/Application.Tests/DashboardV2RbacTests.cs`
- **Kiểm thử**:
  - Cập nhật `EveryMaskedPropertyOnAResponseDtoIsNullable` trong `DashboardV2RbacTests.cs` xác nhận mọi property bị che trên DTO đều là nullable.
  - Thêm test `ProductBrandAggregateGmvPropertiesAreMaskedWhenGmvReadIsFalse` xác nhận `CurrentGmv` và `PreviousGmv` bị che về `null` khi `gmvRead == false`, số lượng giữ nguyên.

---

## 3. Kết Quả Kiểm Tra (Verification)

### 3.1 Thống kê số lượng Test Trước và Sau

| Bộ Test | Trước Fix (Baseline) | Sau Fix (Final) | Chênh lệch |
| :--- | :---: | :---: | :---: |
| **Build Warnings / Errors** | 474 warnings, 0 error | 475 warnings, 0 error | 0 error |
| **DashboardV2 \| KpiV2** | 484 pass, 2 skipped | 489 pass, 2 skipped | +5 pass |
| **Golden Dataset** | 15 pass, 0 skipped | 15 pass, 0 skipped | 15 pass (ổn định) |

### 3.2 Dòng tóm tắt của các lệnh kiểm tra bắt buộc

**Lệnh 1: Build Test Project**
```bash
dotnet build Tests/Application.Tests/Application.Tests.csproj -v q
```
> `475 Warning(s)`
> `0 Error(s)`
> `Time Elapsed 00:00:05.83`

**Lệnh 2: DashboardV2 & KpiV2 Tests**
```bash
dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2"
```
> `Passed!  - Failed:     0, Passed:   489, Skipped:     2, Total:   491, Duration: 7 s - Application.Tests.dll (net9.0)`

**Lệnh 3: Golden Dataset Tests**
```bash
dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~Golden"
```
> `Passed!  - Failed:     0, Passed:    15, Skipped:     0, Total:    15, Duration: 170 ms - Application.Tests.dll (net9.0)`

**Trạng thái Git Repository**:
```bash
git status --short
```
> *(Empty - working tree clean)*
