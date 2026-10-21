# W9 BE-F: Độ tươi dữ liệu, tính lại thủ công (≤ 7 ngày) và UPT theo điểm xu hướng

- Worktree: `dashboard_hmk/wt/api-be-fresh` (report.api, nhánh `qc/w9-be-fresh`)
- Mã nhật ký: `BE_F`
- Phục vụ task người dùng 15, 14 và 3

## 1. Thay đổi

### 1.1 Mốc làm mới dữ liệu: `GET Admin/V2/Dashboard/DataFreshness`
- Trả về `{ lastUpdatedAt, datasets: [{ code, lastSucceededAt, coveredFrom, coveredTo, state }] }`, lấy từ `ReportStatisticSyncState`.
- `lastSucceededAt` = `LastCompletedAt`; `coveredFrom` / `coveredTo` = `LastRangeStartAt` / `LastRangeEndAt`; `state` = `State`.
- `lastUpdatedAt` = giá trị nhỏ nhất của `LastCompletedAt` trong các dataset đã từng thành công. Null khi chưa có dataset nào.
- Chỉ lấy 7 dataset Dashboard V2 (`DashboardV2DataSets`). Không lấy watermark `DashboardV1Resync`, vì nó sẽ làm mốc bị kéo sai.
- Không lọc theo phạm vi chi nhánh vì không có dữ liệu nghiệp vụ. Endpoint nằm dưới `[RequireDashboardV2Access]`, nên mọi vai trò BOD, MANAGER, STAFF đều gọi được.

### 1.2 Tính lại thủ công
- Entity `DashboardRecomputeRequest` và enum `DashboardRecomputeStatuses` (Queued=1, Running=2, Succeeded=3, Failed=4). Migration `AddDashboardRecomputeRequest` nằm trong thư mục `Migrations/Pending/`, chỉ thêm bảng mới.
- `POST Admin/V2/Dashboard/Recompute` `{ fromDate, toDate }` (yyyy-MM-dd), chỉ BOD. Kiểm tra theo thứ tự:
  1. ngày đúng định dạng;
  2. từ ≤ đến;
  3. đến ≤ hôm nay theo giờ Việt Nam;
  4. tối đa 7 ngày bao gồm hai đầu (`Chỉ được tính lại tối đa 7 ngày mỗi lần`);
  5. không có yêu cầu nào ở trạng thái Queued hoặc Running (`Đang có một yêu cầu tính lại chưa hoàn tất`).
- Sau khi kiểm tra, lưu yêu cầu và đưa job vào hàng đợi `report` bằng `EnqueueReportJob`, rồi ghi `HangfireJobId`.
- `GET Admin/V2/Dashboard/Recompute/Latest` (BOD): trả về yêu cầu gần nhất hoặc null.
- Job `RunRecomputeRequest` (`[AutomaticRetry(Attempts = 0)]`):
  - bỏ qua nếu yêu cầu không còn ở trạng thái Queued (chống chạy lại khi Hangfire giao lại job);
  - chuyển sang Running, rồi chạy theo thứ tự: `Sự kiện doanh thu`, `Thống kê`, `Công nợ`, `Đơn đặt`, `Cập nhật trạng thái`. `CurrentStep` được cập nhật trước mỗi bước;
  - thành công: Succeeded, ghi `FinishedAt`;
  - lỗi: Failed, `ErrorMessage` là thông điệp lỗi rút gọn tối đa 1000 ký tự (không có stack trace), ghi log, rồi ném lại lỗi để Hangfire hiển thị job thất bại.

### 1.3 UPT theo điểm xu hướng (task 3)
- `ExecutiveTrendPointV2Dto` có thêm `UnitCount` (`int?`) và `Upt` (`decimal?`).
- Lấy từ cùng bộ tính `DashboardV2RevenueCalculator` như KPI tổng hợp: `UnitCount = m.Units`, `Upt = m.Upt` (làm tròn 4 chữ số, giống KPI). `Upt` là null khi số đơn gốc bằng 0.
- Tổng `UnitCount` chia tổng `GrossOrderCount` trên các điểm xu hướng bằng đúng UPT của KPI tổng hợp cho cùng kỳ. Có test kiểm chứng.

## 2. Các file

Sửa:
- `Src/Domain/DataContext/IApplicationDbContext.cs`
- `Src/Infrastructure/DataContext/ApplicationDbContext.DbSet.cs`
- `Src/Infrastructure/Migrations/ApplicationDbContextModelSnapshot.cs`
- `Src/Application/Dto/Admins/DashboardV2/Executive/ExecutiveDashboardV2Dto.cs`
- `Src/Application/Services/DashboardV2/DashboardV2Service.Executive.cs`
- `Src/WebApi/Controllers/Admins/V2/DashboardV2Controller.cs`

Thêm mới:
- `Src/Domain/Entities/DashboardRecomputeRequest.cs`
- `Src/Infrastructure/Migrations/Pending/20261020043301_AddDashboardRecomputeRequest.cs` và `.Designer.cs`
- `Src/Application/Dto/Admins/DashboardV2/Recompute/DashboardRecomputeAdminDto.cs`
- `Src/Application/Services/DashboardV2/DashboardRecomputeService.cs` (gồm `IDashboardRecomputeService`, `DashboardRecomputeService`, `IDashboardRecomputeSteps` / `DashboardRecomputeSteps`, `DashboardRecomputePolicy`)
- `Tests/Application.Tests/DashboardV2TrendUptTests.cs` (2 test)
- `Tests/Application.Tests/DashboardV2RecomputeTests.cs` (13 test)

## 3. Quyết định

1. **Các bước job gọi đúng method của CLI.** Doanh thu và công nợ gọi một lần cho cả khoảng, với `chunkDays = 7`. Thống kê cục bộ và đơn đặt gọi theo từng ngày, với ngày kiểu UTC, đúng như `Report.SequentialSync`. Bước cập nhật trạng thái gọi `SyncDashboardStatisticsIncremental`. Các method đó tự đánh dấu hoàn tất dataset tương ứng.
2. **Seam `IDashboardRecomputeSteps`.** Repo không có thư viện mock, và không được thêm package NuGet. Interface này cho phép test ghi lại thứ tự bước mà không cần `IReportService` đầy đủ. Lớp cài đặt chỉ chuyển tiếp sang `IReportService`.
3. **Kiểm tra BOD trong service, không chỉ ở controller.** `RequireBodAsync` dùng `DashboardV2Role.Bod`, nên cả `dashboard-v2.bod` lẫn scope cũ `manager.dashboard.read` đều được coi là BOD. Non-BOD nhận `ForbiddenException` (403).
4. **Lỗi validation dùng `DashboardValidationException` (400).** Các lỗi này khớp với các lỗi nghiệp vụ hiện có của Dashboard V2.
5. **Yêu cầu Queued bị lỗi enqueue được đánh dấu Failed**, rồi ném lại lỗi.
6. **Mốc làm mới chỉ tính dataset đã thành công.** Dataset chưa từng thành công chỉ xuất hiện trong danh sách với `lastSucceededAt` null.

## 4. Kiểm chứng

Lệnh đã chạy (luôn có filter):

| Lệnh | Trước thay đổi (baseline) | Sau thay đổi |
|---|---|---|
| `dotnet build Tests/Application.Tests/Application.Tests.csproj -v q` | 0 lỗi | 0 lỗi |
| `dotnet test ... --filter "FullyQualifiedName~DashboardV2\|FullyQualifiedName~KpiV2"` | 532 passed / 2 skipped | 547 passed / 2 skipped (+15 test mới) |
| `dotnet test ... --filter "FullyQualifiedName~Golden"` | 15/15 | 15/15 |
| `dotnet ef migrations has-pending-model-changes` | — | "No changes have been made to the model since the last migration." |

Test theo yêu cầu của task:
- Mốc làm mới: min trên các dataset đã thành công, bỏ qua dataset chưa thành công và watermark V1; null khi không có dataset nào.
- Validation: hơn 7 ngày (từ chối), đúng 7 ngày (chấp nhận), ngày kết thúc trong tương lai theo giờ VN (từ chối), từ > đến (từ chối), yêu cầu đồng thời ở Queued và Running (từ chối), caller không phải BOD (403 cho POST và GET Latest).
- Job: thứ tự bước đúng, trạng thái Running trong lúc chạy, kết thúc Succeeded. Lỗi: Failed, thông điệp dài bị cắt còn 1000 ký tự, bước sau lỗi không chạy. Yêu cầu không còn Queued: không chạy bước nào.
- Enqueue: job đúng tên method và có id yêu cầu trong tham số; `HangfireJobId` được lưu.
- Trend: `UnitCount` và `Upt` theo ngày, `Upt` null khi không có đơn gốc, và tổng khớp KPI tổng hợp.

## 5. Hạn chế và rủi ro (chưa làm)

- **Không chạy thử end-to-end.** Chưa có Postgres và Hangfire trong môi trường này. Đăng ký DI của `DashboardRecomputeSteps` và `DashboardRecomputeService` theo quy ước `RegisterAllService` như các service khác nhưng chưa được kiểm chứng khi chạy thật.
- **Chống trùng yêu cầu chỉ kiểm tra rồi mới ghi.** Hai POST gần như đồng thời có thể cùng vượt qua kiểm tra. Chưa dùng distributed lock như `TryBeginResync`, vì lock đó cần `JobStorage`, không có trong unit test.
- **Yêu cầu Running bị treo sẽ chặn mọi yêu cầu sau.** Nếu process chết giữa chừng, bản ghi vẫn ở Running và không có lease hay timeout để tự giải phóng. Spec không yêu cầu, nên tôi chưa thêm. Cần lead quyết định.
- **Cấu hình CLI không được áp dụng.** `--local-backfill` của CLI đặt `Command Timeout=600` và tùy chọn song song cho POS. Job không đổi chuỗi kết nối nên dùng cấu hình mặc định của app. Có thể chậm hoặc timeout khi tính lại 7 ngày nặng.
- **`status` và `state` là số.** Serializer Newtonsoft mặc định ghi enum dưới dạng số (1-4 và 1-3). Repo không cấu hình `JsonStringEnumConverter`. Frontend cần dùng số, hoặc lead yêu cầu đổi thành chuỗi.
- **Thông điệp lỗi có thể chứa chi tiết kỹ thuật.** Thông điệp exception được cắt còn 1000 ký tự và lưu nguyên văn. Có thể chứa chi tiết kết nối DB. Nếu cần, nên thay bằng mã lỗi ngắn như `SyncDashboardStatisticsIncremental` làm.

## 6. Thay đổi contract API

- Mới: `GET Admin/V2/Dashboard/DataFreshness` → `{ lastUpdatedAt: string|null, datasets: [{ code, lastSucceededAt, coveredFrom, coveredTo, state }] }`.
- Mới: `POST Admin/V2/Dashboard/Recompute` body `{ fromDate, toDate }` → request DTO `{ id, fromDate, toDate, status, currentStep, errorMessage, requestedAt, startedAt, finishedAt }`.
- Mới: `GET Admin/V2/Dashboard/Recompute/Latest` → request DTO | null.
- Thêm trường: điểm xu hướng `unitCount` (int?) và `upt` (decimal?). Không đổi trường cũ.
- Migration thêm bảng `DashboardRecomputeRequest`. Snapshot đã cập nhật; lead cần xử lý khi merge với migration song song.

## 7. Vòng sửa 1

Theo quyết định của lead sau QC vòng 1 (`W9_QC_BE_F_r1.md`). Commit: `e5d742b` (chỉ số unique, migration và entity), `868ed14` (job, khóa, cấu hình backfill, test).

### 7.1 Yêu cầu bị kẹt (L1)
- `DashboardRecomputePolicy.StaleAfter = 3 giờ`. Mốc quá hạn là `StartedAt ?? RequestedAt`.
- `RequestRecompute` đánh dấu Failed với `Quá thời gian, đã hủy` cho các yêu cầu Queued/Running quá hạn, và lưu trước khi kiểm tra yêu cầu đang chạy.
- Job đọc lại trạng thái từ DB trước mỗi bước và trước khi ghi kết quả. Nếu yêu cầu không còn Running, job dừng âm thầm (không ném lỗi) và không ghi đè trạng thái đã hủy bằng Succeeded.
- Test: Queued quá hạn bị hủy, Running quá hạn (theo StartedAt) bị hủy, Running còn mới vẫn chặn, ranh giới 3 giờ, job dừng khi bị hủy giữa chừng.

### 7.2 Ràng buộc đồng thời (L2)
- Migration `AddDashboardRecomputeRequest` thêm `CREATE UNIQUE INDEX "UX_DashboardRecomputeRequest_Active" ON "DashboardRecomputeRequest" ((1)) WHERE "Status" IN (1, 2)`. `Down` xóa chỉ số đó. Entity có ghi chú về chỉ số thô này.
- `RequestRecompute` bắt `DbUpdateException` có `InnerException` là `PostgresException` với `SqlState = 23505` và ném `Đang có một yêu cầu tính lại chưa hoàn tất`. Thực thể chưa lưu được gỡ khỏi change tracker bằng `Remove`.
- Tầng Application không tham chiếu Npgsql, nên nhận diện lỗi dùng reflection theo tên kiểu và thuộc tính `SqlState`. Test ánh xạ dùng một lớp đứng thay tên `PostgresException`.
- `AnyAsync` vẫn được giữ làm đường báo lỗi sớm.

### 7.3 Cấu hình kết nối backfill (L3)
Chọn hướng child lifetime scope, không dùng phương án dự phòng.
- Lý do: `PosDbContext` đọc `LocalBackfill:Enabled` từ cấu hình của chính nó, và `RegisterDbContext(...).WithParameter("configuration", ...)` ở `Infrastructure/AutofacModule.cs` chỉ có hiệu lực khi dựng container. Đăng ký lại trong scope con sẽ ghi đè được, nên không cần `SetCommandTimeout` hay sửa chuỗi kết nối thủ công trong job.
- `DashboardLocalBackfillSettings.CreateOverrides(IConfiguration)` (Application) tạo các khóa: `LocalBackfill:Enabled`, và `ConnectionStrings:Default|Pos|Zns` với hậu tố `Command Timeout=600;` (cộng `Options=-c max_parallel_workers_per_gather=0;` cho Pos). CLI dùng hàm này thay cho vòng lặp cũ, không đổi hành vi.
- `IDashboardBackfillContextRegistrar` (Application) được cài đặt bởi `DashboardBackfillContextRegistrar` (Infrastructure). Hàm này đăng ký lại ba DbContext với cấu hình đã ghi đè trong scope con.
- `DashboardRecomputeSteps` mở một scope con cho từng lời gọi backfill (bước 1 đến 4), và resolve `IReportService` trong scope đó. Mỗi lời gọi có DbContext mới, nên không tích lũy theo ngày.
- Bước 5 (`SyncDashboardStatisticsIncremental`) chạy trong scope thường, không ghi đè, giống job hằng ngày.
- Process-wide configuration không đổi.

### 7.4 Khóa đồng bộ (M1 và mục 4)
- Bước 1 đến 4 chạy dưới khóa `Report.SyncData`, chờ tối đa 2 phút. Nếu không lấy được, yêu cầu Failed với `Hệ thống đang đồng bộ, vui lòng thử lại sau`.
- Khóa được giải phóng trước bước 5, vì bước 5 tự lấy khóa cùng tên trong `RunDashboardStatisticsSync`. Giữ khóa đến hết job sẽ làm bước 5 chờ chính nó.
- Bước 5 trả về `true` chỉ khi `LastCompletedAt` của dataset `OrderFact` không nhỏ hơn thời điểm job bắt đầu. Nếu lease bị giữ (`RunDashboardStatisticsSync` trả về sớm), yêu cầu Failed với thông điệp đồng bộ bận, không bao giờ Succeeded.

### 7.5 Thông điệp lỗi (T1)
- `ErrorMessage` là `Lỗi ở bước <bước>, xem log hệ thống`. Exception đầy đủ được ghi vào log hệ thống.

### 7.6 Kiểm chứng
| Lệnh | Kết quả |
|---|---|
| `dotnet build Src/WebApi -v q` | 0 lỗi, 0 cảnh báo |
| `dotnet build Tests/Application.Tests -v q` | 0 lỗi |
| `dotnet build tools/Report.SequentialSync` | 0 lỗi |
| `dotnet test ... --filter "FullyQualifiedName~DashboardV2\|FullyQualifiedName~KpiV2"` | 560 passed / 2 skipped (sau vòng 1 có 13 test mới) |
| `dotnet test ... --filter "FullyQualifiedName~Golden"` | 15/15 |
| `dotnet ef migrations has-pending-model-changes` | "No changes have been made to the model since the last migration." |

- Test resolve từ module thật (`DashboardV2RecomputeAutofacTests`) có. Container dựng bằng `Report.Domain`, `Report.Application` và `Report.Infrastructure` với cấu hình giả (có `Service:Identity` giả). Test kiểm tra dịch vụ resolve được, scope backfill có `Command Timeout=600` và tùy chọn POS, còn container gốc không đổi.

### 7.7 Chưa làm / rủi ro còn lại
- Chống trùng vẫn có khoảng hở nhỏ: lần kiểm tra trong `CancelStaleRequestsAsync` và `BeginStepAsync` không atomic với lần ghi. Chỉ số unique ở DB đảm bảo không có hai yêu cầu active, nên rủi ro này chỉ ảnh hưởng đến thời điểm hủy quá hạn.
- Chưa chạy end-to-end với Postgres và Hangfire thật. Test kiểm tra logic, DI và ánh xạ lỗi, nhưng không kiểm tra chỉ số unique trên DB thật.
- `status` và `state` vẫn là số (T3). Cần frontend xác nhận.

## 8. Vòng sửa 2

Theo QC vòng 2 (`W9_QC_BE_F_r2.md`). Commit: `eb74ee9`.

### 8.1 Tự chặn ở bước 4 (H1)
- Khóa `Report.SyncData` của job chỉ giữ cho bước 1 đến 3. Khóa được giải phóng trước bước 4, vì `BackfillDashboardOperationalPreOrders` tự lấy `Report.SyncData` trên kết nối riêng và khóa không tái nhập giữa các kết nối.
- Bước 4 và bước 5 tự lấy khóa của chúng. Thứ tự là: lock, bước 1, 2, 3, unlock, bước 4, bước 5.
- Test `JobLockIsReleasedBeforeThePreOrderStepRuns` kiểm tra đúng một lần lock, unlock trước bước đơn đặt, và bước đơn đặt trước bước trạng thái. Test thứ tự đầy đủ `RunCallsStepsInOrderAndEndsSucceeded` cũng được cập nhật theo.

### 8.2 Không che lỗi gốc (T3)
- `FinishFailedAsync` bọc toàn bộ thân hàm trong `try/catch`. Lỗi khi ghi trạng thái được ghi log riêng; lỗi gốc của bước vẫn được ghi log trước đó trong `HandleStepFailureAsync` và được ném lại bởi `throw;`.
- Test `OriginalStepErrorIsNotMaskedWhenRecordingTheFailureAlsoFails`: bước công nợ hủy DbContext rồi ném lỗi gốc. Ghi trạng thái Failed sau đó lỗi, nhưng exception được job ném ra vẫn là lỗi gốc.

### 8.3 Test Autofac (T1)
- `ReportServiceResolvedInTheBackfillScopeUsesTheOverriddenContexts`: resolve `IReportService` trong scope backfill. Vì nó là proxy của interceptor, lấy đối tượng thật qua `IProxyTargetAccessor`. Kiểm tra `Db` và `PosDb` là đúng instance đã resolve trong scope đó, chuỗi kết nối có `Command Timeout=600`, và `Db` khác instance của container gốc.

### 8.4 Kiểm chứng
| Lệnh | Kết quả |
|---|---|
| `dotnet build Src/WebApi -v q` | 0 lỗi |
| `dotnet build Tests/Application.Tests -v q` | 0 lỗi |
| `dotnet build tools/Report.SequentialSync` | 0 lỗi |
| `FullyQualifiedName~DashboardV2\|FullyQualifiedName~KpiV2` | 563 passed / 2 skipped (sau vòng 2 có 16 test mới so với vòng 1) |
| `FullyQualifiedName~Golden` | 15/15 |
| `FullyQualifiedName~Recompute` | 33/33 |

### 8.5 Còn lại (không đổi so với vòng 1)
- T2 (stale 3 giờ có thể hủy job hợp lệ chạy lâu): theo quyết định của lead, không sửa.
- Chưa chạy end-to-end với Postgres và Hangfire thật. Test kiểm tra thứ tự lock bằng bản giả, không kiểm tra khóa thật trên Postgres.
- Có khoảng hở nhỏ giữa unlock sau bước 3 và lock của bước 4. Đây là hệ quả của quyết định giải phóng khóa trước bước 4 (theo lead).
