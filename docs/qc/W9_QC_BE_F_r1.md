# QC W9 BE_F, vòng 1

Worktree: `wt/api-be-fresh` (nhánh `qc/w9-be-fresh`), base `075eac1`. Commit: `420a4f6`, `e0a9407`, `a51c123`.

## 1. Kết luận: CHƯA ĐẠT

Chức năng theo task đã đủ và đúng. Tuy vậy 3 điều chỉnh mà lead đã quyết (a, b, c) đều chưa có trong code. Cần sửa trước khi merge.

Số liệu tôi tự chạy trong worktree:
- `dotnet build Src/WebApi -v q`: thành công, 0 warning, 0 lỗi.
- `dotnet build Tests/Application.Tests -v q`: 0 lỗi.
- `dotnet test --filter "DashboardV2|KpiV2"`: 547 passed, 2 skipped, 0 failed (khớp change log; baseline 532, thêm 15 test).
- `dotnet test --filter "Golden"`: 15/15 passed.
- Chưa chạy `has-pending-model-changes`; tin theo change log. Không có test nào bị xóa hoặc làm yếu (diff chỉ thêm file test và 2 dòng DTO/service).

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| GET DataFreshness, mọi vai trò | Đạt | `DashboardV2Controller.cs` `DataFreshness`; controller có `[RequireDashboardV2Access]` ở cấp class |
| `lastUpdatedAt` = min `LastCompletedAt`, null nếu không có | Đạt | `DashboardRecomputePolicy.ResolveLastUpdatedAt`; có test |
| Chỉ lấy 7 dataset V2, bỏ watermark V1 | Đạt | `DashboardDatasetCodes` |
| Entity + enum + migration thêm bảng | Đạt | `DashboardRecomputeRequest.cs`, `Migrations/Pending/20261020043301_...` (chỉ CreateTable + index) |
| POST Recompute, chỉ BOD | Đạt | `RequireBodAsync` trong service (non-BOD nhận Forbidden, có test) |
| Validation: từ ≤ đến, đến ≤ hôm nay giờ VN, ≤ 7 ngày, thông điệp tiếng Việt | Đạt | `ValidateRange` (`utcNow.AddHours(7).Date`) |
| Chặn khi có yêu cầu Queued hoặc Running | Một phần | `AnyAsync` kiểm tra rồi mới ghi, không có ràng buộc DB (xem L2) |
| Enqueue lên queue `report`, trả DTO | Đạt | `EnqueueReportJob` với `ReportHangfireAppsetting`; `HangfireJobId` được lưu |
| GET Recompute/Latest (BOD) | Đạt | `GetLatestRecompute` |
| Thứ tự job và đúng lệnh gọi như CLI | Đạt | Doanh thu và nợ gọi 1 lần cho cả khoảng với chunk 7; thống kê (`SyncDataForLocalBackfill`) và đơn đặt gọi theo từng ngày, kiểu UTC; cuối cùng gọi `SyncDashboardStatisticsIncremental`. Khớp `Program.cs` |
| `CurrentStep` bằng tiếng Việt trước mỗi bước | Đạt | `SetStepAsync` |
| Failed + thông điệp ngắn, ghi log; Succeeded | Đạt | `TruncateError` ≤ 1000 ký tự, không có stack trace; ném lại lỗi sau khi lưu |
| `[AutomaticRetry(Attempts = 0)]` và an toàn khi Hangfire giao lại | Đạt | Attribute đặt trên method của interface; job bỏ qua nếu trạng thái khác Queued (cùng kiểu với `ReportService.Resync.cs`) |
| Áp cấu hình kết nối / timeout của CLI cho job | Không đạt | L3 |
| Yêu cầu quá hạn không chặn mãi | Không đạt | L1 |
| `UnitCount`, `Upt` trên điểm xu hướng, cùng nguồn M09 | Đạt | `DashboardV2Service.Executive.cs:218-219` dùng `m.Units` và `m.Upt` từ `DashboardV2RevenueCalculator` (cùng calculator với KPI, dòng 88/148); `Units` = Quantity của PreOrderCreated + DirectSale, trả hàng không trừ, giống KPI M09 |
| Ngày theo giờ VN | Đạt | Điểm xu hướng nhóm theo `EventDate.Date` như KPI; không có logic ngày mới |
| Tổng units / tổng đơn gốc = UPT của KPI, có test | Đạt | `DashboardV2TrendUptTests` (2 test) |
| Test: freshness, validation, job, enqueue, trend | Đạt | `DashboardV2RecomputeTests` (13 test) và `DashboardV2TrendUptTests` (2 test) |
| Đăng ký DI các service mới | Một phần | Biên dịch qua; theo quy ước `RegisterAllService` (property injection, `IService`) giống `DashboardRegionService`. Chưa có test resolve thực tế (xem T2) |
| Contract JSON camelCase, DataResult | Đạt | Controller dùng `DataResult(...)`. `status` và `state` là số (xem T3) |

## 3. Lỗi phát hiện

### Cao

**L1. Yêu cầu Queued hoặc Running bị kẹt sẽ chặn mọi lần tính lại sau đó (mục a của lead chưa có).**
- Vị trí: `DashboardRecomputeService.RequestRecompute`, đoạn `hasActive`.
- Kịch bản: process chết giữa job (Running mãi), hoặc job Hangfire bị xóa hoặc không bao giờ chạy (Queued mãi). Mọi POST sau đó đều bị từ chối "Đang có một yêu cầu...", không có lối thoát.
- Cách sửa: trước khi kiểm tra `hasActive`, tải các request có Status thuộc {Queued, Running}. Request nào có `(StartedAt ?? RequestedAt) < now - 3h` thì chuyển sang Failed với `ErrorMessage = "Quá thời gian, đã hủy"`, `FinishedAt = now`, rồi `SaveChanges` TRƯỚC khi insert request mới. Chỉ khi còn request active chưa quá hạn mới ném "Đang có một yêu cầu tính lại chưa hoàn tất". Hằng số `StaleAfter = TimeSpan.FromHours(3)` đặt trong `DashboardRecomputePolicy` để dễ test; thêm test cho Queued quá hạn, Running quá hạn, và Running còn mới.
- Bổ sung: để request bị đánh dấu Failed không bị job zombie ghi đè thành Succeeded, `SetStepAsync` nên nạp lại trạng thái từ DB, và job dừng nếu trạng thái không còn là Running. Bước chốt cũng chỉ ghi Succeeded khi vẫn còn Running.

**L2. Không có ràng buộc DB cho "chỉ một yêu cầu active" (mục b chưa có).**
- Vị trí: entity `Configure` và migration; `RequestRecompute`.
- Kịch bản: hai BOD, hoặc một lần bấm đúp, gửi POST gần như đồng thời. Cả hai đều qua `AnyAsync`, và hai job cùng chạy backfill song song, ghi chồng lên các fact. Change log cũng thừa nhận rủi ro này.
- Cách sửa: trong cùng migration Pending, thêm bằng `migrationBuilder.Sql`:
  `CREATE UNIQUE INDEX "UX_DashboardRecomputeRequest_Active" ON "DashboardRecomputeRequest" ((1)) WHERE "Status" IN (1, 2);`
  Down: `DROP INDEX "UX_DashboardRecomputeRequest_Active";`.
  Index biểu thức hằng này cho phép đúng 1 dòng active. Đừng dùng unique trên cột `Status`, vì cách đó vẫn cho phép 1 Queued cộng 1 Running.
  Index SQL thô không nằm trong model EF nên `has-pending-model-changes` không đổi; nên thêm ghi chú trong entity.
  Trong `RequestRecompute`, bọc `SaveChangesAsync` của lần insert: bắt `DbUpdateException` có `InnerException` là `PostgresException` với `SqlState == "23505"` (`PostgresErrorCodes.UniqueViolation`) rồi ném `DashboardValidationException("Đang có một yêu cầu tính lại chưa hoàn tất")`. Giữ lại `AnyAsync` để báo lỗi sớm.
  Thứ tự: đánh dấu stale xong rồi mới insert (L1) để không đụng index.
  Khi bắt lỗi, nhớ `Db.Entry(request).State = Detached` để context không mang theo thực thể lỗi.

**L3. Job không áp cấu hình CLI cho backfill local (mục c chưa có).**
- Vị trí: `DashboardRecomputeSteps`. Trong `tools/Report.SequentialSync/Program.cs` khối `if (options.LocalBackfill)`, CLI đặt `LocalBackfill:Enabled=true` và thêm `;Command Timeout=600;` cho cả 3 chuỗi `Default`, `Pos`, `Zns`; riêng `Pos` thêm `Options=-c max_parallel_workers_per_gather=0;`. Job chạy trong process WebApi với timeout mặc định (30s), nên bước `SyncDataForLocalBackfill` cho 7 ngày dễ timeout giữa chừng, và `PosDbContext` cũng không bật SplitQuery + retry (`40001`).
- Vì sao không đơn giản đặt `configuration[...]` như CLI: cấu hình process-wide, sẽ làm hỏng mọi request khác của WebApi. Hơn nữa `RegisterDbContext<...>().WithParameter("configuration", Configuration)` trong `Src/Infrastructure/AutofacModule.cs` gắn cứng object cấu hình lúc build container, nên không thể ghi đè bằng `IConfiguration` ở lifetime scope con.
- Thiết kế đề xuất:
  1. Tách phần tính override ra một hàm tĩnh dùng chung, ví dụ `LocalBackfillConfiguration.CreateOverrides(IConfiguration)` trả về `Dictionary<string,string?>`, đặt trong Application. Gồm `LocalBackfill:Enabled`, `ConnectionStrings:Default|Pos|Zns` với hậu tố timeout 600 và tùy chọn Pos. CLI gọi lại hàm này thay cho vòng `foreach` hiện tại (không đổi hành vi CLI).
  2. Trong job, tạo `new ConfigurationBuilder().AddConfiguration(config).AddInMemoryCollection(overrides).Build()`. Từ `ILifetimeScope` hiện tại, mở một child scope `BeginLifetimeScope(b => { b.RegisterDbContext<ApplicationDbContext>().WithParameter("configuration", cfg); ... Pos, Zns ...; })` (đăng ký đè, đăng ký sau thắng). Resolve `IReportService` mới từ child scope này rồi chạy cả 5 bước qua scope đó. Để service/job không phụ thuộc Autofac trực tiếp, giấu việc này sau `IDashboardRecomputeSteps` (một `IDashboardRecomputeStepsFactory`, hoặc `Steps` tự tạo scope), vì seam này đã có sẵn cho test.
  3. Chỉ áp `Command Timeout=600` và `LocalBackfill:Enabled` cho các bước backfill (1 đến 4). Bước 5 (incremental) có thể dùng scope thường. CLI chỉ dùng override này cho `--local-backfill`, các mode backfill khác chạy cấu hình mặc định; áp 600s cho bước 1, 3, 4 là an toàn và chỉ nới timeout.
  4. Mở rộng test `IDashboardRecomputeSteps`: kiểm tra hàm override tạo đúng khóa và giá trị (thuần, không cần DB).
- Nếu lead chọn hướng đơn giản hơn: tạo thêm một appsettings, nhưng chuỗi kết nối nằm ở secrets, nên vẫn nên dùng cách nối chuỗi như trên.

### Trung bình

**M1. Bước backfill local không giữ distributed lock `Report.SyncData` hay lease, nên có thể chạy chồng với sync hằng ngày.**
- Vị trí: `SyncDataForLocalBackfill` (`ReportService._Base.cs:338`) không lấy lock như `SyncData` (`AcquireDistributedLock("Report.SyncData")`) và `RunDashboardStatisticsSync`.
- Kịch bản: BOD bấm tính lại gần 23:30 giờ VN (cron `30 16 * * *` UTC), cả hai ghi cùng fact.
- Cách sửa: bọc cả job (hoặc bước 2) trong `JobStorage.Current.GetConnection().AcquireDistributedLock("Report.SyncData", ...)` bên trong `DashboardRecomputeSteps` (tách khỏi `IDashboardRecomputeService` để unit test không cần `JobStorage`). Lưu ý bước 5 tự lấy lock cùng tên và cùng thread, Hangfire cho phép lock tái nhập trong cùng connection nhưng khác connection thì sẽ chờ: nên giải phóng lock trước bước 5, hoặc chỉ lock bước 2.

**M2. Bước 5 có thể bỏ qua âm thầm nhưng job vẫn ghi Succeeded.**
- Vị trí: `RunDashboardStatisticsSync` trả về sớm khi `TryAcquireDashboardV2Lease` trả false (`ReportService.DashboardV2.Sync.cs:147-148`), nên "Cập nhật trạng thái" không làm gì mà request vẫn Succeeded.
- Cách sửa: sau bước 5, đọc lại `LastCompletedAt` của dataset `OrderFact` trong cùng DB và so với `StartedAt`. Nếu không được cập nhật, ghi Failed với thông điệp "Chưa cập nhật được trạng thái dữ liệu, thử lại sau", hoặc ít nhất ghi cảnh báo. Có thể chấp nhận bỏ qua nếu lead coi bước 5 chỉ là tiện ích; hãy ghi rõ quyết định.

### Thấp

**T1. `ErrorMessage` lưu nguyên `ex.Message`.** Có thể chứa chi tiết kết nối DB hoặc câu SQL (change log đã nêu). Nên lưu thông điệp chung theo bước, ví dụ `$"Lỗi ở bước {CurrentStep}. Xem nhật ký máy chủ (mã {requestId})"`, còn `ex` đã được log. BOD thấy thông điệp này trên UI.

**T2. Không có kiểm tra DI thực tế.** Compile được và theo quy ước giống các service khác, nhưng chưa có bằng chứng resolve được `IDashboardRecomputeSteps` (cần `IReportService`), `IBackgroundJobClient`, `ReportHangfireAppsetting`, `TimeProvider` (không chắc đã đăng ký; mặc định `TimeProvider.System` giữ lại nếu không được tiêm, vẫn đúng). Nên chạy WebApi một lần và gọi `GET DataFreshness`, hoặc thêm test resolve từ container với các module thật.

**T3. `status` và `state` serialize thành số (1-4 và 1-3).** Đúng với contract nếu frontend dùng số; cần báo worker frontend. Không phải lỗi, chỉ là rủi ro lệch contract.

**T4. Kiểm tra định dạng ngày là bước đầu tiên.** Đúng nhưng thông điệp "Ngày không đúng định dạng yyyy-MM-dd." không nằm trong task; chấp nhận được.

## 4. Ghi chú UX (tùy chọn)
- Nên trả `errorMessage` mang tính hướng dẫn cho BOD (ví dụ "Quá thời gian, đã hủy" cho request stale) và để frontend hiển thị nguyên văn.
- `GET Latest` nên trả thêm `isStale` hoặc để frontend tự tính từ `startedAt`, để nút "Tính lại" không bị khóa mãi nếu request cũ kẹt.
