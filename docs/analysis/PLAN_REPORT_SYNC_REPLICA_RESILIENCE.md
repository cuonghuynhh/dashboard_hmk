# Plan: report.api sync chịu được replica POS (lỗi 40001) và có thể test trước khi lên production

Ngày: 30/10/2026. Phạm vi: chỉ code `report.api` (nhánh riêng từ `origin/main`, không push). Không đổi cấu hình hạ tầng.

## 1. Bối cảnh (đã xác nhận bằng DB production, read-only)
- Sync đọc POS qua **replica** (`pg_is_in_recovery=true`); `pos` có `confl_snapshot=225`; `max_standby_streaming_delay=60s`, `hot_standby_feedback=off`.
- Job `Report.SyncDashboardStatisticsIncremental` 23:45 ngày 29/10 lỗi `40001: conflict with recovery` 2 lần, rồi Hangfire báo Succeeded nhưng `DashboardOrderFact` kẹt `State=Running`, lease hết hạn, watermark dừng 24/10 (Payment: 30/06). Ngày 29/10 chỉ có 3 `ReportRevenueEvent`.
- Một transaction duy nhất cho cả khoảng ngày (`RunDashboardStatisticsSync`), lease 10 phút không gia hạn, đọc POS dài hơn 60s thì bị replica hủy.
- Lỗi phụ: `AutoRecoverFailedSyncs` lấy khóa `Report.SyncData` rồi gọi lại đường cũng lấy khóa đó; `RunCompletenessCheck` so sai tập dữ liệu và dùng biên ngày UTC.

## 2. Mục tiêu và tiêu chí hoàn thành
| # | Mục tiêu | Chứng minh bằng |
|---|---|---|
| G1 | Một lần `40001` (hoặc timeout POS) không làm rollback cả khoảng; tự retry từng đơn vị nhỏ | Unit test tiêm `PostgresException 40001` |
| G2 | Mỗi ngày là một đơn vị commit riêng, watermark tiến theo từng ngày đã xong | Test: lỗi ở ngày D thì D-1 đã commit, watermark = D-1 |
| G3 | Truy vấn đọc POS chia lô, mỗi lô chạy dưới 60s kể cả đơn lớn | Test + đo thời gian trên stack local |
| G4 | Dataset không bao giờ kẹt `Running`: lease được gia hạn hoặc tự dọn khi quá hạn | Test: state `Running` + lease hết hạn thì bị thu hồi ở lần chạy kế |
| G5 | Không còn tự khóa 12h trong `AutoRecoverFailedSyncs` | Test lock không lồng nhau |
| G6 | `RunCompletenessCheck` so cùng tập lọc, cùng biên ngày VN, không tự đánh Failed oan | Test với dữ liệu có đơn nháp/đổi/hủy |
| G7 | Lỗi sync không bị che: job fail thì Hangfire fail, `lease_conflict` không còn "return im lặng" | Test |

Không làm: không đổi lịch cron, không sửa hạ tầng/Postgres config, không backfill production, không sửa pos.api.

## 3. Cách test trước khi lên production
1. **Unit/integration test trong repo** (`report.api` tests): tiêm lỗi `40001`, timeout, hủy giữa chừng; chạy bằng `dotnet test --filter` theo từng nhóm.
2. **Local stack** (`local-stack/`, project `hmkls`, dump production, mạng `backend` cô lập): chạy sync thật cho khoảng 24/10–30/10 trên bản copy.
   - Đối chiếu số `ReportRevenueEvent`, `ReportOrderStatistic`, `ReportPaymentStatistic` từng ngày với số đếm từ `pos` copy.
   - Dashboard V2 (`:3000`, `bod.local`) hiển thị 29/10 có dữ liệu, không còn "Chưa đồng bộ".
3. **Mô phỏng replica conflict (tùy chọn, bước W4):** dựng replica Postgres local với `max_standby_streaming_delay=1s`, chạy sync song song với ghi vào `pos` để tái hiện `40001`, xác nhận code mới vượt qua.
4. **Kiểm tra tái chạy (idempotent):** chạy sync 2 lần liên tiếp cho cùng khoảng, số liệu không đổi.
5. **Cổng trước production (do bạn duyệt):** báo cáo kết quả đối chiếu, review diff, rồi mới quyết định deploy và backfill 24/10–30/10 theo runbook `Report.SequentialSync` (thử trên DB copy trước).

## 4. Phân công worker (tối đa 2 chạy song song)
Quy tắc chung mỗi worker: nhánh riêng từ `origin/main` (worktree riêng, map file chống trùng), 1 commit nhỏ mỗi bước, không push, in ra chỉ count/UUID/status khi đụng dữ liệu production-dump, báo kết quả qua file.

| Bước | Việc | File chính (report.api) | Phụ thuộc |
|---|---|---|---|
| W1 | Retry có phân loại lỗi (`40001`, `pos_timeout`, lỗi tạm thời) bằng helper dùng chung + test | `ReportService.DashboardV2.Sync.cs` (`SanitizeErrorCode`, vùng `RunDashboardStatisticsSync`) | không |
| W2 | Chia sync thành từng ngày: transaction + watermark theo ngày; chia lô khi đọc POS | `ReportService.DashboardV2.Sync.cs`, `ReportService.Order.cs`, `ReportDailySyncWindow.cs` | sau W1 |
| W3 | Lease: gia hạn trong khi chạy, thu hồi state `Running` quá hạn; bỏ khóa lồng ở `AutoRecoverFailedSyncs`; không return im lặng khi `lease_conflict` | `ReportService.DashboardV2.Sync.cs` (`TryAcquireDashboardV2Lease`, `AutoRecoverFailedSyncs`) | song song được với W1 nếu khác file; nếu cùng file thì xếp sau W2 |
| W4 | `RunCompletenessCheck`: cùng tập lọc + biên ngày VN; thêm kịch bản replica conflict local | `ReportService.DashboardV2.Sync.cs`, tests, `local-stack/` | sau W2 |
| W5 | Chạy sync 24/10–30/10 trên local stack, đối chiếu từng ngày với `pos` copy, viết báo cáo | `docs/qc/` | sau W1–W4 |

Thứ tự chạy với giới hạn 2 worker: (W1 + W3) → W2 → W4 → W5. Nếu W1 và W3 cùng sửa một file thì giao W1 trước, W3 sau để tránh xung đột.

## 5. Rủi ro và cách giảm
- Chia transaction theo ngày có thể làm dashboard thấy dữ liệu ngày đầu trước ngày cuối: chấp nhận được vì mỗi ngày độc lập; cache vẫn được xóa sau mỗi ngày commit.
- Retry vô hạn có thể giữ worker: đặt trần số lần và tổng thời gian, hết trần thì đánh `Failed` kèm mã lỗi rõ.
- Thay đổi watermark có thể làm lệch dữ liệu cũ: kiểm bằng so khớp số đếm trên local trước khi nghĩ đến production.
- Máy yếu: chạy test theo từng filter, chỉ 2 worker, tránh chạy full suite cùng lúc.

## 6. Việc cần bạn quyết sau cùng (ngoài phạm vi worker)
- Có đổi `hot_standby_feedback` / `max_standby_streaming_delay` trên replica không (DevOps).
- Thời điểm deploy và backfill 24/10–30/10 trên production.
