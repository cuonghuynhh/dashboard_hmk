# QC W9 BE_F (vòng 2): Data freshness, tính lại thủ công, UPT theo điểm xu hướng

Worktree `wt/api-be-fresh` (branch `qc/w9-be-fresh`), base `075eac1`, commit sửa `e5d742b`, `868ed14` (sau `a51c123`).

## 1. Kết luận: CHƯA ĐẠT

Các quyết định của lead về stale 3 giờ, chỉ số unique một phần cộng ánh xạ 23505, child scope với cấu hình CLI, thông điệp lỗi chung, không bao giờ Succeeded khi bước 5 bị bỏ qua và test Autofac đều đã có và đúng. Tuy vậy phần khóa `Report.SyncData` mới thêm gây ra một lỗi Cao: job tự khóa chết ở bước 4 (đơn đặt). Lỗi này không bị test nào bắt vì test mock `IDashboardRecomputeSteps`.

Số liệu tự chạy (chỉ dùng filter, tuần tự sau BE_E):
- `dotnet build Tests/Application.Tests`: 0 error (585 warning có sẵn).
- `dotnet build tools/Report.SequentialSync`: 0 error.
- Filter `DashboardV2|KpiV2`: 560 passed / 2 skipped / 0 failed.
- Filter `Golden`: 15/15.
- Filter `Recompute`: 30/30.
- Không chạy lại `has-pending-model-changes` (vòng 2 chỉ thêm SQL thô vào migration, model EF không đổi).

## 2. Kiểm các quyết định của lead

| Quyết định | Kết quả | Bằng chứng |
|---|---|---|
| Stale 3 giờ, mốc `StartedAt ?? RequestedAt`, đánh dấu Failed "Quá thời gian, đã hủy" và lưu trước khi kiểm tra active | Đạt | `DashboardRecomputePolicy.StaleAfter`, `IsStale`, `CancelStaleRequestsAsync`. Job đọc lại trạng thái DB ở `BeginStepAsync`, `FinishSucceededAsync`, `FinishFailedAsync` nên job zombie không ghi đè request đã hủy. Job bị hủy khi còn Queued bị bỏ qua (`Status != Queued`). |
| Chỉ số unique một phần và ánh xạ 23505 | Đạt | Migration: `CREATE UNIQUE INDEX "UX_DashboardRecomputeRequest_Active" ON ... ((1)) WHERE "Status" IN (1, 2)`; `Down` dùng `DROP INDEX IF EXISTS`. `IsActiveRequestUniqueViolation` nhận `DbUpdateException` có inner type `PostgresException` và `SqlState == 23505`; request chưa lưu được gỡ bằng `Remove`. `AnyAsync` giữ lại. |
| Child Autofac scope với override CLI | Đạt, có ghi chú | `DashboardLocalBackfillSettings.CreateOverrides` dùng chung với CLI (hành vi CLI không đổi: cùng khóa, cùng hậu tố `Command Timeout=600;`, Pos thêm `Options=...`). `DashboardBackfillContextRegistrar` (Infrastructure, đăng ký SingleInstance) đăng ký lại ba DbContext trong scope con; cấu hình gốc của process không đổi (test). Bước 1 đến 4 mỗi bước một scope; bước 5 dùng scope thường. Xem T1. |
| Khóa SyncData chờ 2 phút | Không đạt | Xem H1. Việc đặt khóa quanh bước 1 đến 4 làm bước 4 tự chờ chính khóa của job. |
| Không Succeeded khi bước 5 bị bỏ qua | Đạt | `SyncIncrementalStatistics(startedAt)` trả false nếu `LastCompletedAt` của `OrderFact` nhỏ hơn mốc bắt đầu; job ghi Failed, không bao giờ Succeeded. `RunDashboardStatisticsSync` luôn cập nhật `LastCompletedAt` khi chạy thật, nên không có báo Failed giả. |
| Thông điệp lỗi chung | Đạt | `StepFailedMessage` = "Lỗi ở bước X, xem log hệ thống"; chi tiết vào log. Thông điệp lỗi khóa bận cũng là hằng. |
| Test resolve Autofac thật | Đạt, có ghi chú | `DashboardV2RecomputeAutofacTests`: dựng container bằng ba module thật, resolve service và steps, kiểm chuỗi kết nối Pos trong scope backfill và container gốc. Xem T1. |
| Không xóa/làm yếu test | Đạt | Chỉ thêm. |

## 3. Lỗi phát hiện

### Cao

**H1. Job tự khóa chết ở bước 4 (đơn đặt): khóa `Report.SyncData` của job chặn chính nó.**
- Vị trí: `DashboardRecomputeService.RunRecomputeRequest` (giữ `syncLock` từ trước bước 1 đến hết bước 4) và `ReportService.RunDashboardOperationalPreOrderSync` (`ReportService.DashboardV2.PreOrderSync.cs:224`), được gọi bởi `BackfillDashboardOperationalPreOrders` = bước 4.
- Bằng chứng: `RunDashboardOperationalPreOrderSync` tự lấy `AcquireDistributedLock("Report.SyncData", TimeSpan.FromHours(12))` trên một kết nối Hangfire riêng. Tôi kiểm bằng thực nghiệm (ứng dụng thử ngoài repo, dùng đúng `Hangfire.PostgreSql 1.20.12`, chạy trong container cùng mạng với Postgres cục bộ, DB và role tạm đã xóa sau khi chạy): khi kết nối A giữ `Report.SyncData`, kết nối B (`JobStorage.Current.GetConnection()` khác) không lấy được dù cùng thread hay khác thread, lỗi `PostgreSqlDistributedLockException` (kế thừa `DistributedLockTimeoutException`, nên ánh xạ "hệ thống bận" ở `AcquireSyncLock` là đúng). Khóa không tái nhập giữa hai kết nối.
- Kịch bản: BOD tính lại một khoảng. Bước 1 đến 3 chạy xong, đến bước 4 `BackfillPreOrders` chờ khóa mà chính job đang giữ, tối đa 12 giờ. Request ở trạng thái Running, `CurrentStep = "Đơn đặt"`. Sau 3 giờ request bị đánh dấu "Quá thời gian, đã hủy" nhưng job zombie vẫn giữ khóa `Report.SyncData` và chặn cả sync hằng ngày cho đến khi tiến trình dừng hoặc hết 12 giờ. Đây là hồi quy do chính thay đổi khóa của vòng 2 gây ra (vòng 1 chưa có khóa). Khóa của bước 5 thì đã được giải phóng đúng.
- Bước 2 (`SyncDataForLocalBackfill`), bước 1 (revenue events) và bước 3 (debt) không tự lấy khóa (`grep AcquireDistributedLock` trong `Src` chỉ thấy `SyncData`, `ResyncData`, `RunDashboardStatisticsSync`, `RunDashboardOperationalPreOrderSync`), nên chỉ bước 4 và 5 bị ảnh hưởng.
- Cách sửa đề xuất: giữ `syncLock` chỉ quanh bước 1 đến 3. Giải phóng khóa trước bước 4 (cả bước 4 và 5 tự lấy khóa của chúng, nên đã được bảo vệ khỏi sync hằng ngày). Cụ thể: bọc bước 1 đến 3 trong `try/finally { syncLock.Dispose(); }` rồi mở một `try` riêng cho bước 4 và bước 5 (đã có `HandleStepFailureAsync`). Khoảng hở nhỏ giữa hai bước chấp nhận được. Nếu muốn giữ bảo vệ trọn vẹn thì phải bỏ khóa riêng của job, vì khóa không tái nhập.
- Test cần thêm: Steps mock không chứng minh được vấn đề này. Hai cách: (a) test thứ tự gọi trong job kiểm tra `unlock` xuất hiện trước `preorder` (và trước `statistics`), dùng bản `Steps` giả đã có (`Calls` ghi "lock"/"unlock"); (b) test tích hợp với Hangfire.PostgreSql tùy chọn nếu có hạ tầng. Test (a) bắt đúng hồi quy này.

### Trung bình
Không có.

### Thấp

**T1. Test Autofac chưa chứng minh `IReportService` trong scope con dùng DbContext đã ghi đè.**
- Test chỉ resolve `IPosDbContext` trực tiếp từ scope con. Chưa resolve `IReportService` từ scope đó và kiểm `Db`/`PosDb` bên trong là cùng instance với scope con (phụ thuộc vào việc `RegisterAllService` đăng ký service theo lifetime scope, không phải SingleInstance). Rủi ro thấp vì `ReportService` đã dùng property injection theo scope, nhưng nên thêm một dòng kiểm: lấy `IReportService` từ scope con và so sánh chuỗi kết nối của DbContext được tiêm (qua `IApplicationDbContext` resolve cùng scope), hoặc đọc `Db` bằng reflection trong test.

**T2. Stale 3 giờ có thể hủy một job hợp lệ đang chạy lâu.**
- Backfill 7 ngày với timeout 600 giây từng bước có thể vượt 3 giờ trong trường hợp xấu. Lúc đó request bị đánh dấu Failed trong khi job vẫn chạy; job tự dừng ở ranh giới bước kế tiếp (đã xử lý), nhưng bước hiện tại chạy tiếp. Đây là hệ quả của quyết định 3 giờ mà lead đã chốt; nêu để biết, không yêu cầu sửa.

**T3. `FinishFailedAsync` trong `catch` có thể che lỗi gốc nếu chính nó ném (DB lỗi).** Cân nhắc bọc `try/catch` ghi log trong `HandleStepFailureAsync` để `throw;` luôn ném lỗi gốc của bước. Ảnh hưởng nhỏ.

## 4. Ghi chú
- `status` và `state` vẫn là số (T3 vòng 1); cần frontend xác nhận.
- Sau khi sửa H1 nên chạy lại bộ test `Recompute` và thêm test (a) ở trên; các mục còn lại của vòng 2 không cần làm lại.
