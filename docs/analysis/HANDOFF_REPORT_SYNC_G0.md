# Handoff: sửa pipeline sync Dashboard V2 của report.api (giai đoạn 0)

Lập lúc 00:20 ngày 31/10/2026 (giờ VN). Dành cho session mới, không có context trước. Đọc hết file này trước khi làm gì.

## 1. Mục tiêu
Dashboard V2 (pos.hmkeyewear.com) chưa có số liệu đơn hàng ngày 29/10 và 30/10. Sync `DashboardOrderFact` của report.api không tiến được qua ngày 23/10. Cần sửa code report.api để sync tiến được, rồi người dùng deploy và bấm "tính lại dữ liệu" trên UI.

Phạm vi session này: **giai đoạn 0 (GĐ0)** trong báo cáo thiết kế, làm theo thứ tự ở mục 5. Không làm GĐ1/GĐ2.

## 2. Hệ thống (rút gọn, đọc thêm `CLAUDE.md` cùng thư mục cha)
- `pos` DB (Postgres) → job sync → `report` DB → report.api `/Admin/V2/Dashboard/*` → pos.gui dashboard-v2.
- report.api: .NET 9, EF Core/Npgsql, Hangfire.PostgreSql 1.20.12. Nhánh release: `main` → PR → `production-hmk` (người dùng tự tạo/merge PR này; session này chỉ PR vào `main`).
- Sync đọc POS qua **replica** (hot standby, `max_standby_streaming_delay=60s`, `hot_standby_feedback=off`; lỗi `40001` khi truy vấn >60s). Người dùng đã quyết **không đổi cấu hình replica**.
- Mã nguồn: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api` (checkout đã có PR #168). Làm việc trong worktree riêng từ `origin/main`, không làm trực tiếp trên checkout chính.

## 3. Trạng thái production lúc 00:15 ngày 31/10
| Mục | Giá trị |
|---|---|
| `DashboardOrderFact` | State 3 (Failed), `LastErrorCode=timeout`, watermark **23/10**, RetryCount 1 |
| 6 dataset còn lại | Idle, watermark 23/10 |
| Khóa Hangfire `Report.SyncData` | không ai giữ |
| `DashboardRecomputeRequest` mới nhất | Status 4, 30/10 17:51 "Quá thời gian, đã hủy" (do server restart khi deploy) |
| Code đã deploy | report.api đến PR #168 (merge `1879e1f`). `origin/main` có thêm #169 (merge main) |
| pos.gui | PR #2928 (sửa nút KPI "Xác nhận mục tiêu") đã merge vào main |

Diễn biến: sau khi bật code chia theo ngày (A2), sync chỉ commit được **một ngày** (23/10 lúc 20:30 VN) rồi chạy ~3 giờ 40 phút không commit thêm ngày nào; AutoRecover mỗi 30 phút lại làm lại ngày 24/10 từ đầu.

## 4. Nguyên nhân (đã đo hoặc suy luận, nguồn: `docs/analysis/DESIGN_REPORT_SYNC_PIPELINE.md`)
1. **Hangfire chạy lại job sau đúng 30 phút** (cao). `InvisibilityTimeout` mặc định 30 phút, không trượt; `Src/WebApi/Startup.cs:71` gọi `UsePostgreSqlStorage` không truyền option. Đo: 9/9 job dài có `Processing` thứ hai đúng +30 phút. Kết hợp lease OrderFact mất hiệu lực sau ngày đầu (`ApplyCompleted` đặt Idle, `LeaseUntil=null`) nên hai bản chạy chồng nhau, tranh khóa dòng, rollback, làm lại.
2. **Đọc `PaymentOrder` lọc theo `CompleteAt`, cột không có chỉ mục** (cao về việc câu chậm ~30s/lô 15 phút, đúng `CommandTimeout` mặc định của Npgsql; trung bình–cao rằng đây là lỗi làm hỏng ngày vì chưa có log ứng dụng). Cũng là lý do watermark Payment từng kẹt ở 30/06.
3. **Ghi từng dòng (N+1) trong các writer cũ** (`WriteReportOrder/Product/Customer/Staff`) trong một transaction cả ngày (cao rằng có, trung bình về tỷ trọng). `SyncData` riêng cho 29/10 mất 24,3 phút cho ~2.000 đơn.
4. **Bước nợ treo quét toàn bảng Customer** (>58s trên replica).
- Lỗi logic phụ: ngày đã commit bị làm lại; đường hằng ngày đánh dấu `PreOrderFact`/`OperationalPreOrderFact` là xong dù không sync; `AutoRecoverFailedSyncs` nuốt mọi lỗi nên job Hangfire luôn `Succeeded`; `RunRecomputeRequest` có NullReferenceException (~dòng 442 `DashboardRecomputeService.cs`).
- Chưa biết: thời gian từng bước (code không ghi, `pg_stat_statements` chưa nạp); vì sao khóa `Report.SyncData` biến mất giữa chừng (nghi `DistributedLockTimeout` 10 phút của Hangfire, chưa kiểm chứng); nguồn 4 truy vấn StockHistory dài 4–5 phút trên POS replica.

## 5. Việc cần làm (GĐ0): mỗi mục một PR nhỏ vào `main`
Bảng đầy đủ, kèm tiêu chí hoàn thành đo được: `docs/analysis/DESIGN_REPORT_SYNC_PIPELINE.md` mục 7. Các mục cùng file phải làm tuần tự.

**Đợt 1 (làm trước):**
- **G0-1** `Src/WebApi/Startup.cs:71` (và `tools/Report.SequentialSync/Program.cs:56` nếu dùng chung DB Hangfire): truyền `PostgreSqlStorageOptions { UseSlidingInvisibilityTimeout = true, InvisibilityTimeout = 5 phút }`. Tiêu chí: job dài 15' chỉ có 1 trạng thái `Processing` (thí nghiệm E3 trên local); sau deploy 3 ngày không còn job report có `Processing` thứ hai.
- **G0-2** `ReportService.DashboardV2.Sync.cs`, `ReportService.Order.cs` (`WriteReportOrder`), `RunCompletenessCheck`: bỏ lọc `CompleteAt`; đọc bằng `IssueAt` (có `IX_PaymentOrder_DailyReport_IssueAt`) trong cửa sổ [ngày−7, ngày+1] hoặc `UpdateAt`, rồi lọc `CompleteAt` trong bộ nhớ, dùng projection `AsNoTracking`. Tiêu chí: EXPLAIN mỗi lô dùng Index Scan; đọc PaymentOrder một ngày <30s tổng trên local; tập Id **trùng 100%** với câu cũ cho 23–29/10 (diff). **Không thêm chỉ mục mới** (chưa được cấp phép).
- **G0-9** `DashboardV2DailySyncRunner` và các bước trong `RunDashboardStatisticsSync`: `Stopwatch` theo bước (`revenue, order, payment, rating, product, stock, customer, staff, responseRate, debt, commit`), log có cấu trúc.

**Đợt 2:** G0-3 (`ApplyCompleted` không đặt Idle/xóa lease khi run chưa xong), G0-4 (`LeaseHeartbeat` mỗi 60s, `LeaseDuration` 5', mất lease thì hủy token), G0-5 (`AutoRecoverFailedSyncs` bỏ `catch {}`, throw lại), G0-6 (`ResolveIncrementalStartAt` bắt đầu từ watermark+1 ngày; ngày hôm nay luôn chạy lại).

**Đợt 3:** G0-7 (`useBatchedStockHistory: true`; chỉ bật sau khi diff `EndStock/CostPrice` = 0 cho 23/10, thí nghiệm E5), G0-8 (nợ treo dùng snapshot D−1 thay vì quét Customer), G0-10 (bỏ `PreOrderFact`/`OperationalPreOrderFact` khỏi `MarkCompleted` đường hằng ngày hoặc thêm job), G0-11 (`DashboardRecomputeService.SyncLockWait` và sửa NRE ~dòng 442), G0-12 (`ApplyCompleted` backfill dùng `max(cũ, endDate)`, không lùi watermark).

Chỉ làm đợt 1 trong session này; xong thì báo, đợi người dùng duyệt rồi mới sang đợt 2.

## 6. Quy tắc bắt buộc
- Không push lên `production-hmk`; chỉ PR vào `main`, người dùng tự merge và deploy. **Không bao giờ push khi chưa được yêu cầu.** Mỗi PR một thay đổi nhỏ; body bằng tiếng Việt, gồm bảng test so với baseline, rủi ro, bước sau deploy.
- Nhánh từ `origin/main`, worktree riêng dưới `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/wt/`.
- Test: `dotnet test Tests/Application.Tests --filter 'FullyQualifiedName!~SyncResponseRateIntegrationTest'`. Baseline `origin/main` sau #168: **683 pass, 12 fail, 2 skip**; 12 test fail sẵn có liệt kê ở `docs/analysis/report_api_baseline_failing_tests.txt` (loại `SyncResponseRateIntegrationTest` vì làm sập test host, cũng là lỗi cũ). PR không được thêm test fail nào. Không tin kết quả chạy theo filter con của worker; tự chạy bộ đầy đủ. macOS không có lệnh `timeout`.
- Mỗi thay đổi hành vi phải có test thật (test nằm trong diff). Review diff trước khi báo xong.
- **Tối đa 2 worker chạy song song** (máy lag nếu hơn).
- Không đổi cấu hình replica; không thêm chỉ mục trên POS hoặc report; không backfill production.
- Dữ liệu production: chỉ SELECT, chỉ in số đếm/UUID/mã trạng thái/thời gian, không in thông tin khách hàng, không ghi chuỗi kết nối hay mật khẩu vào file.
- `local-stack` (Docker, project `hmkls`): không chạy `down -v`, `volume rm`, prune; dùng `scripts/resume.sh` để bật.
- **Không deploy hay restart server khi sync đang chạy**: kiểm tra `ReportStatisticSyncState` và `hangfire.lock` (resource `hangfire:Report.SyncData`) trước khi khuyên người dùng merge/deploy. Restart giữa chừng để lại khóa mồ côi, tự hết sau ≤60 phút.

## 7. Cách xem trạng thái production (chỉ đọc)
Script trợ giúp (có thể đã mất vì nằm trong thư mục tạm): `/private/tmp/claude-502/-Users-gryffindor-Desktop-antigra-conversation-dashboard-hmk-dashboard-hmk/b4161eb8-147c-4116-a835-760945135c89/scratchpad/q.sh REPORT|POS|HANGFIRE "<sql>"`. Nếu mất, tạo lại: chạy `psql` qua `docker run --rm` với biến môi trường từ `/Users/gryffindor/Desktop/db hmk/hmk_prod_ro.env` (cần VPN và Docker). **Profile `HANGFIRE` là primary** (`pg_is_in_recovery=false`, cùng cụm với `pos` và `report`); `POS` là replica. Chỉ SELECT nhẹ có LIMIT; `statement_timeout` ngắn.

```sql
-- REPORT: trạng thái sync
select "DatasetCode","State","LastErrorCode","LastSourceUpdatedAt","LeaseUntil","RetryCount" from "ReportStatisticSyncState";
-- REPORT: request tính lại gần nhất (Status 2=Running, 4=Failed)
select "Status","CreateAt","ErrorMessage" from "DashboardRecomputeRequest" order by "CreateAt" desc limit 3;
-- HANGFIRE: khóa đang giữ
select resource, acquired from hangfire.lock where resource not like '%state-lock';
```
Lịch Hangfire (UTC): `Report.SyncCurrentDateData` 16:30, `Report.SyncDashboardStatisticsIncremental` 16:45, `Report.AutoRecoverFailedSyncs` mỗi 30 phút (chỉ chạy lại dataset `Failed`).

## 8. Câu hỏi mở cần người dùng quyết (mục 8 của báo cáo thiết kế)
1. Được đổi cấu hình Hangfire storage không? (G0-1 giả định **có**, chưa xác nhận.)
2. Có được thêm chỉ mục trên report/POS không? (GĐ0 không cần.)
3. Các bảng legacy `ReportProduct/Customer/Staff/Rating/ResponseRate` còn màn hình nào dùng không? (Quyết định lớn nhất về thời gian.)
4. Stock snapshot cuối ngày có cần đúng theo ngày không?
5. Cận thời gian khi quy nợ treo (toàn lịch sử hay N tháng)?
6. Thứ tự đuổi kịp: hôm nay và hôm qua trước, rồi mới lấp 23–28/10?
7. Chấp nhận dashboard hiển thị "dữ liệu tới ngày X" theo từng dataset?
8. Có cấp quyền đọc log ứng dụng report.api không? (Lỗi thật đang bị `catch {}` nuốt.)
9. Ai đang chạy 4 truy vấn StockHistory dài trên POS replica ~14:13–14:40 UTC ngày 30/10?
10. Sửa NRE `RunRecomputeRequest` và recompute tự hủy do heartbeat 10' trong GĐ0 hay để GĐ2?

Nếu câu 1 chưa được trả lời, hỏi người dùng trước khi mở PR G0-1.

## 9. Tệp liên quan
- Báo cáo thiết kế đầy đủ: `docs/analysis/DESIGN_REPORT_SYNC_PIPELINE.md` (bản đồ bước sync, số đo, nút thắt, 3 phương án, so sánh, thí nghiệm E0–E9, lộ trình, rủi ro).
- Kế hoạch trước đó: `docs/analysis/PLAN_REPORT_SYNC_REPLICA_RESILIENCE.md`.
- Baseline test: `docs/analysis/report_api_baseline_failing_tests.txt`.
- Mã đã có: `Src/Application/Services/Report/{ReportService.DashboardV2.Sync.cs, DashboardV2DailySyncRunner.cs, ReportDailySyncWindow.cs, ReportSyncRetryPolicy.cs, ReportSyncLocks.cs, ReportService.DashboardV2.RevenueEvents.cs}`, `Src/Application/Services/DashboardV2/{DashboardRecomputeService.cs, DashboardLocalBackfillSettings.cs}`.
- Việc ngoài phạm vi session này: người dùng tự tạo PR `main → production-hmk` cho report.api và pos.gui khi muốn deploy; sau khi deploy, bấm "tính lại dữ liệu" (nên chỉ cho ngày 29/10 nếu UI cho chọn ngày).
