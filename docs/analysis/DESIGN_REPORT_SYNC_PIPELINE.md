# Thiết kế lại pipeline đồng bộ Dashboard V2 (report.api)

Ngày lập: 30/10/2026. Người lập: Senior Data Engineer (agent). Trạng thái: bản đề xuất để chủ hệ thống quyết.

Nguồn: đọc code tại `wt/report-sync-write-timeout` (chỉ đọc), và truy vấn chỉ đọc lúc 14:20–15:05 UTC ngày 30/10/2026 vào POS replica, report replica và DB Hangfire. Tài liệu chỉ ghi số đếm, UUID job, mã trạng thái và thời gian. Không có dữ liệu cá nhân.

Mỗi khẳng định có một nhãn:
- **[ĐO]**: số liệu đã đo hoặc truy vấn được.
- **[CODE]**: đọc thấy trực tiếp trong code.
- **[SUY LUẬN]**: suy ra từ hai loại trên, chưa kiểm chứng.

---

## 0. Tóm tắt điều hành

1. **Một ngày không thật sự cần 30 phút để xử lý.** Hiện tượng "30 phút mỗi ngày" là tổng của hai thứ:
   - **(a) Job bị Hangfire chạy lại sau đúng 30 phút.** Hangfire.PostgreSql dùng mặc định `InvisibilityTimeout` = 30 phút, không trượt. Sau 30 phút nó phát lại cùng một job trong khi bản gốc vẫn chạy. **[ĐO]**: 9/9 job dài trong 24 giờ có trạng thái `Processing` thứ hai đúng +30 phút. Tôi dự đoán điều này cho job 9600915 và nó xảy ra lúc 14:30:11.
   - **(b) Chi phí N+1 trong các writer "legacy".** `WriteReportOrder`, `WriteReportProduct` (kèm truy vấn StockHistory theo từng dòng), `WriteReportCustomer` và `WriteReportStaff` đều chạy trong cùng transaction ngày. **[ĐO]**: một ngày chỉ có khoảng 1.800–2.100 đơn, khoảng 7.000 dòng hàng và khoảng 4.300 dòng ReportProduct. Riêng `SyncData` (chỉ chạy phần legacy) cho ngày 29/10 đã mất 24,3 phút. **[SUY LUẬN]**: mỗi ngày tốn khoảng 40–50 nghìn round-trip tuần tự.
   - **(c) Đọc `PaymentOrder` theo `CompleteAt`, không có chỉ mục.** Ngày có 96 lô, mỗi lô duyệt gần toàn bảng và chạm `CommandTimeout` 30s. **[ĐO]** Lần chạy 22:00 VN: 3 lần thử của ngày 23/10 đều rollback với lỗi `timeout`, sau khoảng 16,5' (mục 2.5).
2. **Lease và khóa không bảo vệ được job.**
   - `ApplyCompleted` đặt OrderFact về `Idle` và `LeaseUntil = null` ngay sau ngày đầu tiên. **[CODE]**
   - Hangfire phát lại job ở phút 30, cộng với `ReclaimExpiredLeases`, dẫn tới hai lần chạy chồng nhau trên cùng một ngày. Hệ quả là chờ khóa dòng (lỗi 600s/60s), rollback và làm lại từ đầu.
   - **[ĐO]**: lúc 14:38 dòng khóa `Report.SyncData` đã biến mất, trong khi vẫn có transaction ngày mở từ 14:26:25 đang đọc POS. Lần chạy đó cuối cùng rollback, và watermark vẫn ở 23/10.
3. **Khuyến nghị: làm theo lộ trình 3 giai đoạn, trên cùng một kiến trúc đích.** Kiến trúc đích là **phân vùng (dataset × ngày) có lease theo thời gian, tách Extract khỏi Load, tính tổng hợp set-based ngay trong DB report.**
   - **Giai đoạn 0 (2–4 ngày công):** sửa cấu hình Hangfire, sửa lease, đổi sang batched stock history, sửa watermark, ghi log thời gian từng bước. Mục tiêu: dừng việc chạy trùng và đuổi kịp 7 ngày trong vài giờ.
   - **Giai đoạn 1 (1–2 tuần):** thay N+1 bằng tính trong bộ nhớ rồi ghi hàng loạt, mỗi dataset-ngày một transaction ngắn.
   - **Giai đoạn 2 (3–4 tuần):** bảng phân vùng, coordinator, CDC theo `UpdateAt`, đối soát và API độ tươi dữ liệu.
4. **Cảnh báo về hạ tầng [ĐO].** Profile `HANGFIRE` trong `q.sh` **không phải replica**: `pg_is_in_recovery() = false`. Đây là primary, và cùng cụm này còn chứa DB `report` và `pos`. Chủ hệ thống cần biết điều này. Điểm tốt là ta xem được `pg_stat_activity` của primary, trái với giả định "không thấy primary". Điểm cần lưu ý là mọi truy vấn qua profile này đều chạm vào production primary.

---

## 1. Bản đồ các bước trong một ngày sync (đường production hiện tại)

Chuỗi gọi **[CODE]**:
- `AutoRecoverFailedSyncs` (mỗi 30 phút) và `SyncDashboardStatisticsIncremental` (16:45 UTC) đều gọi `RunDashboardStatisticsSync(startAt, endAt)`.
  - Trong đó:
    - `AcquireDistributedLock("Report.SyncData", 60')`
    - `TryAcquireDashboardV2Lease` (OrderFact, 30')
    - `SyncReportSitesFromPos`
    - `DashboardV2DailySyncRunner.RunAsync`: với mỗi ngày D, chạy **một transaction report**, có `SET LOCAL lock_timeout = '60s'` và retry tối đa 3 lần (lỗi tạm thời, tổng chờ ≤ 2 phút):
      1. `SyncRevenueEventsWindow(D, D, includeUpdatedAt: true)`
      2. `SyncDataInternal(D)`: sites, staff-sites, category, rồi `SyncDailyReportData`
      3. `SyncDashboardDebtSnapshotsIncremental(D, D)`
      4. `MarkCompleted` cho cả 7 dataset, rồi COMMIT
      5. Sau commit: xóa cache, gia hạn lease thêm 30'
    - `RunCompletenessCheck(start, end)`
- `startAt` = min(watermark Order, watermark Payment), bị chặn ở 7 ngày. `endAt` = hôm nay theo giờ VN.
  - Watermark lưu bằng **chính ngày đã commit**, nên lần chạy sau **làm lại ngày đó**. **[CODE]**

### 1.1 Bảng các bước

POS và report là hai kết nối khác nhau. Đọc POS không nằm trong transaction report. Ghi report đều nằm trong transaction ngày. Ước lượng dùng N≈2.000 đơn/ngày, I≈7.000 dòng hàng, P≈2.250 sản phẩm khác nhau, RP≈4.300 dòng ReportProduct/ngày, C≈số khách bị ảnh hưởng.

| # | Bước (file) | Đọc POS | Ghi report | Số round-trip ước lượng / ngày | Điểm đắt | Nhãn |
|---|---|---|---|---|---|---|
| 0 | `SyncReportSitesFromPos` (_Base.cs) | toàn bộ Site (~100) | upsert khi đổi | ~3 | rẻ | CODE |
| 1 | `SyncRevenueEventsWindow` (RevenueEvents.cs) | 10 truy vấn lấy Id theo CompleteAt, CancelAt, SubmitAt, UpdateAt trên SaleOrder, PreOrder, ReturnSaleOrder (không chia lô 15'), rồi mỗi lô 200 Id thêm 5–7 truy vấn | `ReplaceRevenueEvents`: SELECT khách cũ, `ExecuteDelete` theo cụm 500, INSERT, rồi `RebuildDashboardV2FirstPurchases` | ~150–300 | khoảng 2.600 SaleOrder và 936 PreOrder có `UpdateAt` trong ngày 23/10 **[ĐO]**. Lệnh xóa-chèn lại chạm vào dòng mà bản chạy trùng cũng chạm, nên có thể chờ khóa | CODE + ĐO |
| 2a | `SyncStaffWorkingSites`, `SyncProductCategoryHierarchy` | toàn bảng nhỏ | upsert | ~5 | rẻ | CODE |
| 2b | `WriteReportOrder` (Order.cs) | 6 lần đọc theo lô 15' (96 lô × 6 = **576 truy vấn**). Thực thể POS **tracking với lazy-loading proxy**: `Customer`, `SaleOrderItems`, `Item.Product` được nạp lười theo từng đơn hoặc dòng | `WriteDashboardV2OrderStatistics`: một SELECT điều kiện `IssueAt` **OR** `SourceOrderId IN (~2.000)` rồi SaveChanges lớn. Sau đó `HardDelete ReportOrder`. Rồi **mỗi đơn**: `EnsureReportOrder` (1 + số category, lọc theo Day/Month/Year, không theo TimeHash) và **một SaveChanges riêng mỗi đơn** | lazy ~2N + P ≈ 6.000. Ensure ≈ 4N ≈ 8.000. SaveChanges ≈ N ≈ 2.000. **≈ 16.000** | N+1 lazy load và SaveChanges theo từng đơn | CODE, SUY LUẬN về số |
| 2c | `RebuildDashboardV2ReportOrderFields` | – | mỗi (site, ngày) 1 SELECT ReportOrder (~100) | ~100 | lọc `IssueAt` trên ReportOrderStatistic **không có chỉ mục bắt đầu bằng IssueAt**. EXPLAIN cho thấy quét toàn index `CustomerId_IssueAt` (~828 nghìn dòng) **[ĐO]** | CODE + ĐO |
| 2d | `WriteReportRating` + notes | đọc trong ngày | Ensure + SaveChanges mỗi rating | vài trăm | N+1 | CODE |
| 2e | `WriteReportProduct` (Product.cs) | 4 truy vấn cả ngày, **không chia lô 15'** | `HardDelete ReportProduct`. **Mỗi dòng hàng**: `EnsureReportProduct` + SaveChanges (~2I = 14.000). **Đợt 2**: nhánh `useBatchedStockHistory: false` (production) thì **mỗi dòng ReportProduct** chạy 1 truy vấn StockHistory POS + 1 SaveChanges (2 × RP ≈ 8.600) | **≈ 23.000** | **đắt nhất theo số round-trip.** Code đã có sẵn nhánh batched (`LoadLatestStockHistories`) nhưng chỉ dùng cho backfill hoặc recompute | CODE + ĐO (RP/ngày) |
| 2f | `WriteReportCustomer`, `WriteReportStaff` | 3 truy vấn cả ngày mỗi bước | Ensure + SaveChanges mỗi đơn | ≈ 4N × 2 ≈ 16.000 | N+1 | CODE |
| 2g | `WriteReportResponseRate` | SaleOrder + ZNS | Ensure + SaveChanges mỗi tin | vài trăm | N+1 | CODE |
| 3 | `SyncDashboardDebtSnapshotsIncremental` | `Customer WHERE CurrentDebtAmount > 0` (**không có chỉ mục**, Parallel Seq Scan 1,1 triệu dòng, 1,7 GB). `Debt WHERE CreateAt >= D OR UpdateAt >= D` (**OR, không cận trên**, Seq Scan 2,07 triệu dòng). Mỗi trang 500 khách: ledger, rồi SaleOrder theo khách **trên toàn bộ lịch sử** | xóa và chèn lại snapshot | vài chục, nhưng **từng truy vấn dài** | **[ĐO]**: đếm bằng câu Customer này vượt 58s trên replica. Sync thật chạy câu này từ 14:37:37 tới khoảng 14:39:32. Rủi ro 40001 cao | CODE + ĐO |
| 4 | `MarkCompleted` × 7 rồi COMMIT | – | 7 UPDATE | 7 | đánh dấu cả `OperationalPreOrderFact` và `PreOrderFact` hoàn thành. Nhưng **đường hằng ngày không gọi** `SyncDashboardOperationalPreOrdersIncremental` (không có recurring job nào gọi nó) | CODE |
| 5 | `RunCompletenessCheck` | mỗi ngày 2 COUNT trên POS (không chia lô) | COUNT trên report (không có chỉ mục IssueAt) | 4/ngày | rẻ về số lượng, chậm về chỉ mục | CODE |

**Tổng ước lượng [SUY LUẬN]:** khoảng 45–55 nghìn round-trip tuần tự mỗi ngày, gần như tất cả nằm trong một transaction report kéo dài 25–40 phút.
- Nếu trung bình 25–40 ms mỗi round-trip (mạng giữa các host, cộng I/O replica đang bận, cộng SaveChanges): 19–37 phút. Con số này khớp với 24,3 phút đo được của `SyncData` và khoảng 30 phút/ngày.
- **Chưa đo được** phân rã thời gian theo bước, vì code không ghi thời gian từng bước và không có `pg_stat_statements` (extension có, nhưng chưa nạp qua `shared_preload_libraries`). Mục 6 có thí nghiệm E1 để đo.

### 1.2 Lỗi logic phát hiện khi đọc code [CODE]

1. **Lease mất hiệu lực sau ngày đầu tiên.**
   - `ApplyCompleted(OrderFact)` đặt `State = Idle` và `LeaseUntil = null` ngay trong transaction ngày. Sau đó bước gia hạn chỉ set `LeaseUntil` mà không đặt lại `Running`.
   - Từ ngày thứ 2 trở đi, `CanAcquire` và `TryAcquireDashboardV2Lease` của job khác đều thành công. Tức là chỉ còn khóa Hangfire bảo vệ.
2. **Lease 30' chỉ gia hạn sau commit.** Nếu một ngày kéo dài hơn 30', `AutoRecover` chạy lúc :00 hoặc :30 sẽ `ReclaimExpiredLeases`, chuyển trạng thái sang `Failed (lease_expired)` và kích hoạt một lần sync mới **trong khi lần cũ vẫn chạy**.
3. **Ngưỡng khóa mồ côi ngắn hơn thời gian giữ khóa.**
   - Theo mô tả hạ tầng, timeout của `AcquireDistributedLock` cũng là ngưỡng coi khóa cũ là mồ côi. Khi đó `DashboardRecomputeService.SyncLockWait = 2 phút` có thể "dọn" một khóa `Report.SyncData` đang được giữ hợp lệ quá 2 phút.
   - Sync dài 3,5 giờ cũng vượt ngưỡng 60' của chính nó.
   - Tôi chưa kiểm chứng được bằng mã nguồn Hangfire.PostgreSql 1.20.12, vì chuỗi SQL dọn khóa không lộ trong DLL.
4. **Watermark = ngày đã commit, start lấy chính ngày đó**, nên mỗi lần chạy làm lại ngày cuối. Với 7 ngày, phải xử lý 8 đơn vị. Mỗi lần lỗi lại làm lại ngày 23/10.
5. **Backfill lùi watermark.** `ApplyCompleted` gán `LastSourceUpdatedAt = endDate`, kể cả khi backfill một ngày cũ, ví dụ recompute 01–07/09.
6. **Dataset chưa sync bị báo đã xong.** `PreOrderFact` và `OperationalPreOrderFact` được đánh dấu hoàn thành bởi đường hằng ngày, trong khi đường này không sync chúng.
7. **Lỗi bị nuốt.** `AutoRecoverFailedSyncs` bắt mọi exception (`catch {}`), nên job Hangfire luôn `Succeeded`. Lỗi thật chỉ còn trong log ứng dụng. EventLog chỉ có 1 dòng (`WATERMARK_LOOKBACK_CAPPED`).
8. **Timeout có thể vượt heartbeat của recompute.** `RunRecomputeRequest` chỉ cập nhật heartbeat giữa các ngày, mà heartbeat quá 10 phút bị coi là kẹt. Một ngày backfill dài hơn 10 phút sẽ bị tự hủy. Lỗi NRE ở khoảng dòng 442 (`syncLock.Dispose()` trong `finally`) tôi chưa phân tích sâu.

---

## 2. Số liệu đo được [ĐO]

### 2.1 Hạ tầng

| Mục | Giá trị |
|---|---|
| POS replica | `pg_is_in_recovery = t`, replay lag ~2s, `max_standby_streaming_delay = 60s`, `hot_standby_feedback = off`, `statement_timeout = 30s` (của role), `max_parallel_workers_per_gather = 2` |
| `confl_snapshot` (pos) | 295 lúc 14:5x, tăng từ mức ~225 được báo trước đó |
| Report replica | `pg_is_in_recovery = t`, lag ~8s, PG 16.9. Truy vấn đếm có chỉ mục mất 28s, tức I/O rất chậm hoặc đang tranh tài nguyên |
| Profile HANGFIRE | **primary** (`pg_is_in_recovery = f`). Cùng cụm có DB `report` và `pos`, `max_connections = 3000` |
| RTT q.sh `SELECT 1` | ~0,3s, gồm cả khởi động container. Không dùng được làm RTT của ứng dụng |
| `pg_stat_statements` | extension có, nhưng chưa nạp qua `shared_preload_libraries` nên không đọc được |

### 2.2 Khối lượng dữ liệu

| Mục | Giá trị |
|---|---|
| SaleOrder/ngày (IssueAt, giờ VN) | 23/10: 2.036 (1.873 hoàn thành, không phải đơn đổi). 26/10: 1.776 (1.546). 28/10: 2.141 (1.713) |
| SaleOrderItem ngày 23/10 | 6.959 dòng, 2.257 sản phẩm khác nhau |
| SaleOrder có `UpdateAt` trong ngày 23/10 | 2.623. PreOrder: 936 |
| ReportProduct/ngày | 20/10: 3.795. 21/10: 6.676. 22/10: 4.303. 23/10: 4.314. 24/10: 2.979. 25/10: 2.879. 26–27/10: **0** (chưa sync). 28/10: 4.035. 29/10: 4.153 |
| ReportOrder ngày 23/10 | 1.287 dòng |
| ReportRevenueEvent/ngày | 1.000–2.259 (20–29/10 đều có dữ liệu) |
| Ước lượng số dòng bảng POS | StockHistory 14,3 triệu (6,7 GB). SaleOrder 2,3 triệu (5,7 GB). PaymentOrder 2,3 triệu. Debt 2,1 triệu. Customer 1,1 triệu |
| Ước lượng số dòng bảng report | ReportProduct 1,39 triệu (2 GB). ReportOrderStatistic 828 nghìn (949 MB). ReportPaymentStatistic 643 nghìn. ReportOrder 503 nghìn. ReportRevenueEvent 145 nghìn |
| Chỉ mục còn thiếu | POS: `Customer.CurrentDebtAmount`. Report: `ReportOrderStatistic(IssueAt)` và `ReportPaymentStatistic(CompleteAt)`. Các lọc theo IssueAt/CompleteAt đang dùng index không có cột này đứng đầu, hoặc quét toàn bộ |
| Truy vấn StockHistory từng dòng | thực thi trên server 0,4–2 ms, lập kế hoạch ~5 ms (EXPLAIN ANALYZE). Thời gian giữa hai lần gọi liên tiếp của sync thật lúc 14:36: 1,5–3,2s. Nghĩa là thời gian nằm ngoài câu SQL: ghi report, SaveChanges, mạng, chờ |

### 2.3 Hangfire và trạng thái sync

| Mục | Giá trị |
|---|---|
| `SyncData` 29/10 (job 9364843) | 3 lần lỗi tạm thời (16:30, 16:31, 16:49). Lần cuối chạy 16:50:31 tới 17:14:51, **24,3 phút** (`PerformanceDuration = 1.459.092`) |
| Phát lại ở phút 30 | Job 9558449, 9560158, 9568898, 9575217 (2 lần), 9585404, 9593176, 9600915 đều có `Processing` lần 2 đúng khoảng +30 phút, cùng server hoặc server khác. `hangfire.jobqueue.fetchedat` của 9600915 là 14:00:02, lần `Processing` thứ hai lúc 14:30:11 |
| Job 9593176 | `PerformanceDuration` 1.924.935 ms, tức 32 phút. Đây chính là "job 20:00 VN". Trong đó có một bản thứ hai bắt đầu lúc 13:30:02 (khớp `LastCompletedAt = 13:30:02.369`). **[SUY LUẬN]**: ngày 23/10 được commit bởi bản thứ hai. Con số 32' không phải thời gian xử lý của một ngày |
| Lúc 14:27 | OrderFact `Running`, lease tới 14:30:02. Dòng khóa `hangfire:Report.SyncData` có `acquired` = 14:00:02 |
| Lúc 14:38 | OrderFact `Failed / timeout`, RetryCount 1. **Dòng khóa đã mất.** Nhưng trên primary vẫn có transaction report mở từ 14:26:25 (`idle in transaction`), và POS replica vẫn nhận truy vấn sync (StockHistory, rồi SaleOrder, Customer, Debt) |
| Khoảng 14:40 | Transaction trên kết thúc mà không commit. Watermark vẫn là 23/10, `LastCompletedAt` không đổi. Khoảng 14 phút công bị bỏ |
| Watermark (30/10 14:40) | Cả 7 dataset `LastSourceUpdatedAt = 23/10`. RevenueEvent coverage 23–29/10. Watermark Payment thô là 30/06 và bị chặn về 23/10 (EventLog) |
| `DashboardRecomputeRequest` hôm nay | 5 yêu cầu (23–29/10). 4 cái `Failed` (Status 4) ở bước "Thống kê" hoặc "Sự kiện doanh thu" sau khoảng 10–25 phút. Job Hangfire 9577267 và 9548947 ghi `Succeeded` dù request vẫn Failed |
| Truy vấn lạ trên POS replica | 4 kết nối (cùng IP client với sync) chạy truy vấn StockHistory dạng `GROUP BY ProductId, WarehouseId … LEFT JOIN`, mỗi câu hơn 4–5 phút, chờ `DataFileRead/BufferIO`. Dạng câu **không khớp** `LoadLatestStockHistories` trong checkout này (lọc `WarehouseId = ANY`). **Chưa xác định nguồn**: có thể là pos.api hoặc một backfill khác. Chúng làm replica nặng I/O |

### 2.4 Cấu hình Hangfire.PostgreSql thực tế [CODE + ĐO]

- `Src/Infrastructure/Infrastructure.csproj:18` dùng `Hangfire.PostgreSql` **1.20.12**.
- `Src/WebApi/Startup.cs:71` gọi `options.UsePostgreSqlStorage(c => c.UseNpgsqlConnection(setting.ConnectionString))`. Lời gọi này **không truyền `PostgreSqlStorageOptions`**, nên mọi giá trị là mặc định.
- Giá trị mặc định đọc bằng reflection trên chính gói 1.20.12 trong cache NuGet (`new PostgreSqlStorageOptions()`, project tạm ở `scratchpad/hfdef`):

| Option | Mặc định 1.20.12 |
|---|---|
| `InvisibilityTimeout` | **00:30:00** |
| `UseSlidingInvisibilityTimeout` | **False** |
| `DistributedLockTimeout` | **00:10:00** |
| `JobExpirationCheckInterval` | 01:00:00 |
| `QueuePollInterval` | 00:00:15 |

- Câu fetch trong DLL là `fetchedat IS NULL OR fetchedat < NOW() + INTERVAL '-<InvisibilityTimeout> SECONDS'`. Không bật sliding thì job chạy quá 30' sẽ bị worker khác (hoặc chính server đó) lấy lại. Điều này khớp 9/9 job dài ở mục 2.3.
- `DistributedLockTimeout = 10'` **[SUY LUẬN, chưa kiểm chứng trong mã nguồn]**: nếu option này được dùng để dọn các dòng `lock` cũ, nó giải thích được vì sao dòng khóa `Report.SyncData` (acquired 14:00:02) còn ở 14:27 nhưng biến mất trước 14:38, trong khi sync vẫn chạy.
- Npgsql: `CommandTimeout` mặc định **30s** (đọc bằng reflection). Các file `appsettings*.json` trong repo **không** đặt `Command Timeout` cho kết nối Pos. Cấu hình production được mount từ ngoài và tôi chưa xem được.

### 2.5 Diễn biến lần chạy 22:00 VN (15:00 UTC), sampler mỗi 5 giây [ĐO]

- Nguồn: `pg_stat_activity` của POS replica (pid sync 1505) và của primary (DB `report`, transaction mở quá 20s), cùng với `ReportStatisticSyncState`.
- Sampler chỉ lấy 2 câu mới nhất mỗi 5s, nên mốc từng bước có sai số khoảng ±5s.
- Không có dữ liệu cho lần 23:00 VN (16:00 UTC), vì sampler dừng lúc khoảng 15:30 UTC.

| Thời gian (UTC) | Sự kiện |
|---|---|
| 15:00:12 | Job AutoRecover giành lease (OrderFact `Running`, `LeaseUntil = 15:30:12`) và bắt đầu ngày **23/10** |
| 15:00:12 – ~15:01:08 | Transaction report #1 (pid 101508). Bước sự kiện doanh thu: quét Id PreOrder/SaleOrder, rồi các lô SaleOrder, SaleOrderItem, LensPower, Product, rồi INSERT `ReportRevenueEventLine` |
| 15:01:11 – ~15:07:26 | Transaction #2 (pid 101509), khoảng 6,3'. Lô PreOrder (15:01:26–15:02:07). Sau đó **từ 15:02:14 là đọc `PaymentOrder` theo lô 15'** của `WriteReportOrder` |
| 15:02:14 – 15:05:49 | Đọc PaymentOrder: `query_start` đổi lần lượt lúc 15:02:14, :43, 15:03:15, :49, 15:04:19, :49, 15:05:21. Nghĩa là **mỗi câu khoảng 30s**, đúng bằng `CommandTimeout` 30s, và luôn ở trạng thái `active` |
| 15:07:31 – ~15:16:40 | Transaction #3 (pid 102259), khoảng 9,2'. Chạy lại từ bước sự kiện doanh thu, rồi lazy-load Customer và Product (15:13), rồi `InboundDelivery` (15:16:13, đã tới `WriteReportProduct`) |
| 15:16:45 | OrderFact `Failed`, `LastErrorCode = timeout`. **Không ngày nào được commit.** Watermark vẫn là 23/10 |

**Đọc kết quả:**
- Cả 3 transaction đều là 3 lần thử của `ReportSyncRetryPolicy` (MaxAttempts = 3) cho cùng ngày 23/10. Cả 3 đều rollback, tốn khoảng 16,5' mà không ra kết quả.
- Lỗi "timeout" **gần như chắc chắn** đến từ các câu POS chạm ngưỡng 30s **[SUY LUẬN mạnh]**. Bằng chứng: nhịp 30s đều đặn, và lần 14:00–14:40 cũng kết thúc với `timeout`.

**Các lần chạy sau đó, tới 17:13 UTC ngày 30/10 (hangfire.state, không có sampler) [ĐO]:**

| Job | Diễn biến |
|---|---|
| 9613879 AutoRecover 15:30 | `Succeeded` 15:55:45, perf 1.543.380 ms (khoảng 25,7'). Không ngày nào được commit (`LastCompletedAt` vẫn 13:30) |
| 9615064 AutoRecover **16:00 (23:00 VN)** | `Succeeded` 16:10:23, perf 606.860 ms (khoảng 10,1'). Không commit |
| 9623608 AutoRecover 16:30 | `Processing` lần 2 lúc 17:00:05 (**lại phát lại ở +30'**), `Succeeded` 17:01:42 |
| 9623632 `SyncData(30/10)` | Lần đầu 16:30:05 → `Failed` 16:40:36. Sau đó **6 lần liên tiếp, mỗi lần `Failed` khoảng 30s sau `Processing`** (16:41:00 → 16:41:30, …, 17:07:28 → 17:07:59). Exception: `InvalidOperationException: … likely due to a transient failure`. Nhịp 30s khớp `CommandTimeout` |
| 9626142 `SyncDashboardStatisticsIncremental` 16:45 | 6 lần `DashboardV2LeaseConflictException` (lease OrderFact do AutoRecover 16:30 giữ tới 17:00:04). Lần thứ 7 lúc 17:09:37 lỗi transient |

- Kết quả cuối ngày 30/10: **cả 7 dataset vẫn có watermark 23/10**, và OrderFact ở `Failed/timeout`.
- Ngày hôm nay (30/10) cũng không vào được báo cáo legacy, vì `SyncData` lỗi liên tục.
- Sau lần commit ngày 23/10 (bởi lần chạy bắt đầu 13:30:02 UTC), tới 17:13 UTC là khoảng 3 giờ 40 phút sync liên tục mà không commit thêm được ngày nào.

**Câu PaymentOrder theo lô 15' [ĐO]:**
- Bảng `PaymentOrder` **không có chỉ mục nào trên `CompleteAt`**.
- Planner chọn `BitmapAnd(IX_PaymentOrder_PaymentTypeId, IX_PaymentOrder_DeleteAt)` với ước lượng sai: rows = 2.850 và 12.199. Thực tế CUSTOMERPAID chiếm phần lớn của 2,3 triệu dòng.
- EXPLAIN ANALYZE cho một lô 15' **không có dòng nào** (00:00–00:15 VN): 1,87s và 116.679 buffer, đều nằm sẵn trong cache. Nghĩa là mỗi lô duyệt gần toàn bộ bảng (khoảng 900 MB).
- Trong lúc sync, replica đang nặng I/O (mục 2.3), nên mỗi lô chạm 30s.
- Một ngày có 96 lô. Ngay cả khi cache nóng (khoảng 2s mỗi lô) cũng mất khoảng 3', còn khi cache lạnh thì timeout.
- **Đây là nguyên nhân trực tiếp hợp lý nhất khiến watermark Payment kẹt từ 30/06 và ngày 23/10 không qua được. Chủ yếu là CPU và I/O, không phải 40001.**
- Điều chưa biết: trong một lô, `ReadBatchWithHalvingAsync` có chia đôi khi timeout (khoảng 1 lần thử lại rồi chia đôi tới 5') hay không. Tôi không có log ứng dụng để xác nhận đường đi.

---

## 3. Nút thắt (xếp theo tác động)

| Hạng | Nút thắt | Bằng chứng | Mức chắc chắn |
|---|---|---|---|
| 0 | **Đọc `PaymentOrder` theo `CompleteAt` không có chỉ mục.** 96 lô mỗi ngày, mỗi lô duyệt gần toàn bảng 2,3 triệu dòng. Khi có tải, mỗi lô chạm `CommandTimeout` 30s, nên ngày bị rollback sau 3 lần thử (mục 2.5) | ĐO: nhịp 30s/câu lúc 15:02–15:05, 3 transaction rollback, `timeout`. EXPLAIN: BitmapAnd, 116 nghìn buffer cho một lô rỗng | **Cao** rằng câu này chậm và chạm 30s. **Trung bình–cao** rằng đây là lỗi làm hỏng ngày (thiếu log) |
| 1 | **Thực thi trùng do Hangfire `InvisibilityTimeout` 30' (mặc định, không trượt), cộng lease mất hiệu lực sau ngày 1, cộng reclaim lease khi job vẫn sống.** Hệ quả: hai bản sync ghi cùng một ngày, chờ khóa dòng (lock_timeout 60s, lệnh 600s), rollback, làm lại. "Mỗi ngày 30 phút" phần lớn là chu kỳ 30' này | ĐO: 9/9 job dài có `Processing` thứ hai ở +30'. Dự đoán cho 14:30 và thấy đúng. CODE: `ApplyCompleted` và reclaim | **Cao** cho việc phát lại. **Trung bình** cho chuỗi hệ quả chính xác (thiếu log ứng dụng) |
| 2 | **N+1 trong các writer legacy chạy trong transaction ngày** (ReportOrder, ReportProduct gồm StockHistory từng dòng, ReportCustomer, ReportStaff, Rating, ResponseRate): khoảng 45–55 nghìn round-trip | ĐO: `SyncData` (chỉ legacy) mất 24,3' cho khoảng 2.000 đơn. Nhịp truy vấn StockHistory 1,5–3s/lần. ReportProduct khoảng 4.300 dòng/ngày. CODE: SaveChanges mỗi đơn hoặc dòng, lazy-loading | **Cao** về sự tồn tại. **Trung bình–cao** về việc đây là phần lớn thời gian (chưa có phân rã theo bước) |
| 3 | **Transaction report quá lớn và gắn chặt 7 dataset, cộng các truy vấn POS dài trong bước nợ treo.** Một transaction 25–40' giữ khóa dòng, chặn bản ghi khác, chặn vacuum. Một lỗi bất kỳ làm rollback cả ngày. Câu quét Customer theo `CurrentDebtAmount` vượt 58s, Debt OR không cận trên → nguy cơ 40001 và timeout | ĐO: câu Customer > 58s. Sync thật mất khoảng 2' riêng câu này. Transaction 14:26 rollback sau khoảng 14'. CODE | **Cao** |
| 4 | Watermark làm lại ngày đã commit. Đọc POS không chia lô ở WriteReportProduct, Customer, Staff, Debt và RevenueEvent id-scan. Report thiếu chỉ mục `IssueAt/CompleteAt`. Lỗi bị nuốt, không có số đo từng bước | CODE + ĐO (EXPLAIN) | Cao (tác động vừa) |

---

## 4. Thiết kế đề xuất

### 4.1 Nguyên tắc

1. **Đơn vị commit nhỏ và đo được bằng thời gian.** Mỗi transaction ghi report dưới 30s. Mỗi câu đọc POS dưới 10s (xa ngưỡng 60s).
2. **Tách Extract (POS → staging) khỏi Transform/Load (staging → bảng fact và tổng hợp, set-based trong report).** Không giữ transaction report trong lúc đọc POS.
3. **Idempotent theo khóa tự nhiên.** Fact theo `SourceId` dùng upsert (`INSERT … ON CONFLICT DO UPDATE`) cộng tombstone. Bảng tổng hợp theo ngày được tính lại từ fact và thay cả phân vùng trong một transaction ngắn.
4. **Lease có heartbeat theo thời gian và fencing token.** Không phụ thuộc vào thời gian của "ngày" hay vào khóa Hangfire.
5. **Không thay đổi replica.** Mọi thứ phải chịu được 40001 bằng truy vấn ngắn và retry từng trang.
6. **Quan sát được.** Mỗi bước có thời gian, số dòng và số truy vấn. Độ tươi dữ liệu là một chỉ số có cảnh báo.

### 4.2 Đơn vị công việc

| Lựa chọn | Ưu | Nhược | Kết luận |
|---|---|---|---|
| Ngày (hiện tại) | đơn giản, khớp TimeHash | quá lớn khi có N+1. Một lỗi mất cả ngày | giữ làm **đơn vị publish** |
| Giờ hoặc 15' | đọc ngắn | tổng hợp vẫn theo ngày. Nhiều phân vùng | dùng làm **trang Extract** |
| Theo store | song song tự nhiên | khoảng 100 store × 7 dataset × ngày là quá nhiều phân vùng. Đơn đổi hoặc trả liên store | không cần ở quy mô 2.000 đơn/ngày |
| Theo `UpdateAt` (CDC) với keyset `(UpdateAt, Id)` | bắt được thay đổi muộn (hoàn thành hoặc hủy trễ). Đọc theo index `IX_*_UpdateAt` có sẵn | cần biết ngày nghiệp vụ nào bị chạm để đánh dấu phân vùng "bẩn" | dùng cho **incremental** (giai đoạn 2) |

**Chọn:** phân vùng publish là **(dataset, ngày VN)**. Extract chạy theo **trang keyset**, mỗi trang tối đa 500 Id hoặc 15' thời gian, mỗi trang có checkpoint. Incremental dùng CDC theo `UpdateAt` để đánh dấu phân vùng bẩn.

### 4.3 Mô hình dữ liệu điều phối (bảng mới trong DB report)

```text
SyncPartition(
  DatasetCode, BusinessDate,              -- PK
  Status: Pending|Extracting|Extracted|Loading|Published|Failed|Dirty,
  RunId uuid, Attempt int,                -- fencing token
  LeaseOwner text, LeaseUntil timestamptz,-- heartbeat 30s, TTL 3'
  ExtractCursor jsonb,                    -- vị trí keyset của trang cuối đã commit
  SourceCount int, LoadedCount int, SourceChecksum bigint,
  PublishedAt, LastErrorCode, NextRetryAt)
SyncCursor(DatasetCode PK, LastUpdateAt, LastId)   -- CDC watermark (cấp nguồn)
SyncRunStep(RunId, DatasetCode, BusinessDate, Step, StartedAt, DurationMs, Rows, Queries, ErrorCode)
stg_*(RunId, BusinessDate, ... )         -- staging, UNLOGGED, xóa sau khi publish
```

- **Watermark cấp dataset** là ngày lớn nhất D sao cho mọi phân vùng ≤ D đều `Published`. Watermark này được tính từ bảng, không ghi tay. Cách này loại bỏ được lỗi lùi watermark và lỗi đánh dấu nhầm dataset chưa sync.
- **Watermark CDC** (`SyncCursor`) chỉ tiến tới bản ghi `(UpdateAt, Id)` của trang đã commit vào staging.

### 4.4 Luồng xử lý

```text
Coordinator (recurring 5', chạy ngắn, giữ pg_try_advisory_lock trên DB report — tự nhả khi mất kết nối)
  1. Thu hồi lease hết hạn (LeaseUntil < now) → Status về Pending/Dirty, Attempt+1
  2. CDC: đọc POS theo trang (UpdateAt, Id) > cursor, LIMIT 500, dưới 5s mỗi trang → xác định ngày VN bị chạm → đánh dấu Dirty
  3. Phát hiện khoảng trống: ngày ≤ hôm nay mà chưa Published → Pending
  4. Enqueue tối đa K=2 work item (ưu tiên: hôm nay, rồi các ngày cũ hơn), mỗi item = (dataset nhóm, ngày)

Worker(item)  [Hangfire job ngắn, < 10']
  a. Claim: UPDATE SyncPartition SET RunId=@new, LeaseUntil=now()+3', Status='Extracting'
            WHERE pk AND (LeaseUntil IS NULL OR LeaseUntil < now()) RETURNING Attempt
  b. Heartbeat: Timer 30s → UPDATE … SET LeaseUntil=now()+3' WHERE pk AND RunId=@me (0 dòng → hủy CancellationToken)
  c. Extract: theo trang keyset từ ExtractCursor; mỗi trang: đọc POS (AsNoTracking, projection, Include tường minh hoặc truy vấn theo Id-batch, không lazy) → COPY/bulk insert stg_* (RunId) → cập nhật ExtractCursor (cùng transaction ngắn)
     40001/timeout: retry trang với backoff 2s→30s + jitter, giảm kích thước trang (500→250→100)
  d. Load (1 transaction, < 30s, SET LOCAL lock_timeout='10s', statement_timeout='60s'):
     - kiểm tra fencing: SELECT … FOR UPDATE SyncPartition WHERE RunId=@me (không còn → abort)
     - fact: INSERT … SELECT FROM stg ON CONFLICT (SourceId) DO UPDATE; DELETE fact của ngày không còn trong stg (tombstone)
     - tổng hợp ngày: DELETE ReportOrder/Product/Customer/Staff WHERE TimeHash=D; INSERT … SELECT … GROUP BY từ fact/stg
     - Status='Published', PublishedAt=now(), counts/checksum
  e. Sau commit: xóa stg của RunId, invalidate cache theo ngày, ghi SyncRunStep
```

- **Song song an toàn:** tối đa 2 worker. Phân vùng nào có lease của phân vùng đó. Các dataset phụ thuộc chạy theo thứ tự trong cùng item:
  - FirstPurchase phụ thuộc RevenueEvent.
  - ReportOrder V2 phụ thuộc OrderStatistic.
  - Nợ treo tách thành dataset độc lập, chạy job riêng.
  - Hai ngày khác nhau chạy song song được, vì khóa dòng không giao nhau.
- **Restart giữa chừng:**
  - Mất tối đa một trang Extract, vì cursor đã commit.
  - Lease hết hạn trong ≤ 3', và coordinator chạy lại từ cursor.
  - Advisory lock tự nhả khi process chết, nên không còn khóa mồ côi.
  - Hangfire nên bật `UseSlidingInvisibilityTimeout = true`, kết hợp job ngắn, để không còn phát lại sau 30 phút.
- **Chặn dữ liệu nửa vời:**
  - Dashboard chỉ đọc bảng chính.
  - Staging không bao giờ được truy vấn.
  - Tổng hợp của một ngày được thay trong một transaction.
  - API trả `DataFreshness` theo dataset (ngày Published lớn nhất, kèm phân vùng Dirty) để UI hiển thị "dữ liệu tới …" và cờ "một phần".
- **Đối soát (thay `RunCompletenessCheck`):**
  - Hằng ngày, đếm POS theo lát 1 giờ (index IssueAt hoặc CompleteAt) so với fact report.
  - Lệch quá 0,1% thì đánh dấu Dirty. Lệch quá 5% thì cảnh báo.
- **Stock snapshot:**
  - Tách khỏi đường quan trọng thành dataset `ProductStockSnapshot`, chạy sau khi ReportProduct đã publish.
  - Dùng truy vấn LATERAL theo lô khoảng 500 cặp (ProductId, WarehouseId). Mỗi lô dùng index `(ProductId, WarehouseId, CreateAt DESC)` với `LIMIT 1`. Dự kiến dưới 5s mỗi lô (cần đo, xem E5).
- **Nợ treo:**
  - Bỏ câu quét `Customer.CurrentDebtAmount`. Thay bằng hợp của (khách trong snapshot ngày D-1) và (Debt theo `CreateAt ∈ [D, D+1)`, câu riêng) và (Debt theo `UpdateAt ∈ [D, D+1)`, câu riêng). Hai câu sau đều dùng index sẵn có và có cận trên.
  - Chỉ đọc SaleOrder để quy store theo trang khách, có cận thời gian (ví dụ 24 tháng; cần chủ nghiệp vụ xác nhận).
- **Retry và backoff:**
  - Lỗi tạm thời: retry theo trang hoặc theo Load.
  - Lỗi nghiệp vụ: `Failed` và cảnh báo.
  - Quá 5 lần thì cách ly phân vùng (`NextRetryAt` +1h) và cảnh báo.
- **Quan sát:**
  - Bảng `SyncRunStep` cộng log có cấu trúc (`dataset`, `date`, `step`, `ms`, `rows`, `queries`).
  - Chỉ số: `freshness_lag_hours` theo dataset, `partition_failed_total`, `extract_page_ms_p95`, `load_ms_p95`, `replica_conflict_total`.
  - Cảnh báo: độ trễ vượt 2 giờ trong giờ làm việc, hoặc vượt 26 giờ bất kỳ lúc nào. Một phân vùng Failed quá 3 lần. Một worker chạy quá 10'.
  - Bỏ `catch {}` trong AutoRecover. Job lỗi phải hiện `Failed` trên Hangfire.

### 4.5 Ba phương án

| | **A. Sửa nhanh (Giai đoạn 0)** | **B. Tái cấu trúc writer (Giai đoạn 1)** | **C. Pipeline phân vùng (Giai đoạn 2)** |
|---|---|---|---|
| Nội dung | (1) Hangfire `UseSlidingInvisibilityTimeout=true`, hoặc tăng `InvisibilityTimeout` lên 6h. (2) Lease theo timer: heartbeat 1'/TTL 5', tách "lease của lần chạy" khỏi trạng thái dataset, `ApplyCompleted` không đặt Idle khi run chưa xong. (3) AutoRecover không reclaim khi run còn heartbeat. Bỏ `catch {}`. (4) Đường production dùng `useBatchedStockHistory: true` (code đã có). (5) start = ngày đã commit + 1, trừ hôm nay. (6) Debt dùng 2 câu Debt có cận trên, bỏ quét Customer. (7) Stopwatch và log theo bước. (8) Không mark PreOrder/OperationalPreOrder nếu không sync, hoặc gọi sync của chúng. (9) Recompute dùng cùng thời gian chờ khóa (không để 2') | Viết lại WriteReportOrder/Product/Customer/Staff/Rating: đọc POS projection AsNoTracking theo lô Id, tính tổng hợp trong bộ nhớ, `DELETE` theo TimeHash và bulk INSERT trong **một SaveChanges** hoặc `COPY`. Mỗi dataset-ngày một transaction ngắn. Thêm chỉ mục report `(IssueAt)` và `(CompleteAt)` | Như mục 4.3 và 4.4: SyncPartition, staging, coordinator, CDC, đối soát, API độ tươi |
| Công sức | 2–4 ngày công | 5–8 ngày công | 12–20 ngày công |
| Thời gian/ngày (ước lượng, cần đo) | khoảng 10–20' (bỏ ~8.600 round-trip StockHistory, bỏ câu Customer ~2', hết chạy trùng) | khoảng 1–3' | khoảng 1–2' mỗi phân vùng, 2 phân vùng song song |
| Đuổi kịp 7 ngày | khoảng 1,5–2,5h, và **không bị quay vòng** | khoảng 10–20' | khoảng 10' |
| Rủi ro | thấp. Đổi cấu hình Hangfire ảnh hưởng mọi job report (cần xem các job dài khác) | trung bình. Phải khớp từng con số với writer cũ (cần diff) | trung bình–cao. Nhiều thành phần mới |

**Khuyến nghị:** làm **A ngay** (tuần này), rồi **B** (tuần sau), rồi **C** khi B đã ổn định 2 tuần.
- A và B nằm trên đường đi tới C, không bỏ đi phần nào:
  - lease heartbeat, log theo bước, writer set-based đều tái sử dụng trong C.
- Không đề nghị nhảy thẳng tới C, vì:
  - nút thắt 1 và 2 sửa được rẻ;
  - rủi ro deploy lớn trong lúc dashboard đang thiếu dữ liệu.

---

## 5. So sánh: hiện tại và đề xuất

| Tiêu chí | Hiện tại (đã deploy) | Sau A | Sau A+B | Đích C |
|---|---|---|---|---|
| Độ tin cậy | thấp: chạy trùng ở phút 30, rollback cả ngày, lỗi bị nuốt | trung bình: một bản chạy, lease đúng, lỗi hiện rõ | khá: transaction ngắn, ít khóa | cao: fencing, checkpoint, đối soát |
| Thời gian/ngày | khoảng 25–40' xử lý, cộng chu kỳ phát lại 30' | khoảng 10–20' (ước lượng) | khoảng 1–3' (ước lượng) | khoảng 1–2' mỗi phân vùng |
| Resume sau restart | mất cả ngày dở. Khóa hoặc lease mồ côi tới 60' | mất ngày dở. Lease hết sau ≤ 5' | mất dataset-ngày dở (≤ 3') | mất ≤ 1 trang, khoảng vài giây |
| Độ phức tạp | trung bình nhưng khó hiểu (3 cơ chế khóa chồng nhau) | như cũ, ít bẫy hơn | giảm (bỏ N+1) | tăng (bảng điều phối), nhưng tường minh |
| Rủi ro deploy | – | thấp | trung bình (sai số liệu tổng hợp) | trung bình–cao |
| Chặn dữ liệu nửa vời | cache bị xóa sau mỗi ngày commit, nhưng 7 dataset bị đánh dấu xong cùng lúc (kể cả dataset không sync) | sửa đánh dấu sai | như A | publish theo phân vùng cộng API độ tươi |
| Test trước production | unit test hiện có | local stack cộng giả lập thời gian chạy dài | local stack, diff số liệu cũ và mới 7 ngày | như B, cộng chaos (kill hoặc restart) và replica giả lập |

---

## 6. Thí nghiệm kiểm chứng (làm TRƯỚC khi code)

Tất cả chạy trên local stack (`dashboard_hmk/local-stack`, compose `hmkls`, mạng `backend` cô lập, dump production). Không đụng production, trừ E0 (chỉ đọc). Không `down -v`, không xóa volume.

| # | Mục tiêu | Cách làm | Tiêu chí kết luận |
|---|---|---|---|
| E0 | Xác nhận phát lại ở phút 30 trên production (chỉ đọc) | Lặp lại truy vấn `hangfire.state` cho các job report dài trong 7 ngày: đếm số job có `Processing` lần 2 trong khoảng [+29', +31'] | Hơn 90% job dài có mẫu này thì nút thắt 1 được xác nhận |
| E1 | Phân rã thời gian một ngày theo bước và theo câu SQL | Bật `shared_preload_libraries=pg_stat_statements` cho container `hmkls_postgres` qua file override, rồi restart **container** (không xóa volume). `pg_stat_statements_reset()`. Chạy `SyncDashboardStatistics(23/10, 23/10)` bằng `report-sync` hoặc gọi trực tiếp. Đọc `calls`, `total_exec_time` theo câu, kèm log `log_min_duration_statement` | Có bảng: bước, số câu, ms. Xác nhận hoặc bác bỏ ước lượng 45–55 nghìn round-trip |
| E2 | Mô phỏng độ trễ mạng production | Đặt toxiproxy (hoặc `tc netem` trong container) giữa `report-sync` và postgres, thêm 5–20 ms. Lặp E1 | Ngoại suy thời gian/ngày theo RTT. Nếu tăng tuyến tính theo RTT thì N+1 là nguyên nhân |
| E3 | Tái hiện chạy trùng | Hangfire local: `InvisibilityTimeout = 2'`. Chạy sync của một ngày dài hơn 2' | Thấy 2 `Processing`, lease reclaim, 2 transaction song song. Sau khi bật sliding thì không còn |
| E4 | Restart giữa chừng | `docker restart hmkls_report_api` khi đang ở giữa ngày | Đo thời gian khóa hoặc lease được giải phóng, và việc resume. So sánh cũ và mới |
| E5 | Batched stock history | So sánh nhánh `useBatchedStockHistory` true và false cho 23/10: thời gian, kết quả `EndStock/CostPrice` từng dòng (diff) | Diff = 0 và thời gian giảm rõ thì cho phép bật ở production (A4) |
| E6 | Replica conflict | Thêm container hot standby (`max_standby_streaming_delay=60s`, `hot_standby_feedback=off`), trỏ `Pos` vào standby. Tạo tải UPDATE và VACUUM trên primary | Đo tỷ lệ 40001 theo kích thước trang. Chọn kích thước trang mặc định |
| E7 | Độ đúng số liệu B và C so với cũ | Chạy pipeline cũ và mới cho 23–29/10 trên hai bản DB report. Diff: fact theo `SourceId`, tổng theo (TimeHash, SiteId, ProductCategoryId) cho mọi cột tiền và số lượng | Lệch bằng 0 (hoặc giải thích được từng trường hợp) trước khi deploy |
| E8 | Chi phí câu nợ treo | EXPLAIN ANALYZE trên local: câu cũ (quét Customer, Debt OR) và câu mới (2 câu Debt có cận trên, cộng snapshot D-1) | Câu mới dưới 2s, cho cùng tập khách |
| E9 | Nguồn của 4 truy vấn StockHistory dài trên POS replica | Hỏi đội pos.api hoặc người đang chạy backfill (chỉ đọc `pg_stat_activity` khi chúng xuất hiện: `application_name`, `client_addr`) | Biết ai đang làm replica nặng I/O |

---

## 7. Lộ trình và tiêu chí hoàn thành

### Giai đoạn 0 (A), 2–4 ngày công

- **Nội dung:** A1–A9 ở mục 4.5. Deploy ngoài giờ cao điểm và **không** deploy khi đang có sync chạy (kiểm tra `hangfire.lock` và `ReportStatisticSyncState`).
- **Danh sách việc giao worker** (mỗi mục là một PR nhỏ; các mục cùng file phải làm tuần tự):

| ID | File / hàm | Thay đổi cụ thể | Tiêu chí hoàn thành đo được |
|---|---|---|---|
| G0-1 | `Src/WebApi/Startup.cs:71` (và `tools/Report.SequentialSync/Program.cs:56` nếu dùng chung DB Hangfire) | Truyền `new PostgreSqlStorageOptions { UseSlidingInvisibilityTimeout = true, InvisibilityTimeout = TimeSpan.FromMinutes(5) }`. Ghi rõ trong PR rằng mọi server dùng chung storage (report-kpi) đều phải bật. Kiểm tra không có server nào `IsLightweightServer` | Trên local (E3): job dài 15' chỉ có **1** trạng thái `Processing`. Trên production 3 ngày sau deploy: truy vấn `hangfire.state` đếm job report có `Processing` thứ hai = **0** |
| G0-2 | `ReportService.DashboardV2.Sync.cs`, `ReportService.Order.cs` (đọc PaymentOrder trong `WriteReportOrder`), `RunCompletenessCheck` | Bỏ lọc `CompleteAt` không có chỉ mục. Đọc bằng `IssueAt` (có `IX_PaymentOrder_DailyReport_IssueAt`) trong cửa sổ [ngày − 7, ngày + 1], **hoặc** bằng `UpdateAt` (có chỉ mục), rồi lọc `CompleteAt` trong bộ nhớ. Dùng projection `AsNoTracking`, `Include` thay bằng join đã chiếu. Chủ hệ thống quyết phương án, và có thể chọn thêm chỉ mục POS (câu hỏi mở 2) | EXPLAIN mỗi lô dùng Index Scan, không còn BitmapAnd trên `PaymentTypeId/DeleteAt`. Trên local cộng dump: đọc PaymentOrder một ngày **< 30s tổng**. Tập Id trả về **trùng 100%** với câu cũ cho 23–29/10 (diff) |
| G0-3 | `DashboardV2SyncStatePolicy.ApplyCompleted`, `DashboardV2DailySyncRunner.RunAsync` | Khi run chưa xong, `ApplyCompleted` cho OrderFact **không** đặt `State = Idle` và `LeaseUntil = null`. Chỉ cập nhật watermark và coverage. Run kết thúc mới đặt Idle (trong `RunDashboardStatisticsSync`) | Unit test: sau ngày 1 của run 3 ngày, `CanAcquire(OrderFact)` = false. Test hiện có vẫn xanh |
| G0-4 | `DashboardV2DailySyncRunner` (mới: `LeaseHeartbeat`) | Timer mỗi 60s gia hạn `LeaseUntil = now + 5'` với điều kiện `WHERE DatasetCode = OrderFact AND State = Running AND LeaseUntil = @expected`, dùng `DbContext` riêng (không đi chung transaction ngày). Mất lease (0 dòng) thì hủy `CancellationToken` và rollback. Đổi `LeaseDuration` sang 5' | Test với `FakeTimeProvider`: ngày dài 40' không bị `ReclaimExpiredLeases`. Mất lease thì runner dừng trong ≤ 60s |
| G0-5 | `ReportService.AutoRecoverFailedSyncs` | Bỏ `catch {}`. Ghi `RetryCount`/`LastErrorCode` xong thì `throw` lại để Hangfire hiện `Failed`. Không reclaim khi lease còn hạn (sau G0-4, lease luôn tươi) | Ép lỗi trên local thì job Hangfire `Failed`, có exception trong state data |
| G0-6 | `ReportService.SyncDashboardStatisticsIncremental` / `ResolveIncrementalStartAt` | start = watermark + 1 ngày nếu watermark < hôm nay (VN). Ngày hôm nay luôn chạy lại | Unit test: watermark = 23/10, hôm nay = 30/10 cho start = 24/10. Watermark = 30/10 cho start = 30/10 |
| G0-7 | `ReportService._Base.SyncDailyReportData` gọi từ `SyncDataInternal` | Đặt `useBatchedStockHistory: true` cho đường production (nhánh `LoadLatestStockHistories` đã có). Trước khi bật phải qua E5 | E5: diff `EndStock/CostPrice` = 0 cho 23/10. Số câu StockHistory/ngày giảm từ khoảng 4.300 xuống ≤ 20 (đếm bằng `pg_stat_statements` local) |
| G0-8 | `ReportService.DashboardV2.RevenueEvents.SyncDashboardDebtSnapshotsIncremental` | Thay câu `Customer.CurrentDebtAmount > 0` bằng các khách trong `ReportCustomerDebtSnapshot` của ngày D-1, hợp với 2 câu Debt riêng theo `CreateAt` và `UpdateAt` (mỗi câu có cận trên D+1) | EXPLAIN không còn Seq Scan Customer/Debt. Bước nợ một ngày < 60s trên local. Tập khách trùng với câu cũ (diff, E8) |
| G0-9 | `DashboardV2DailySyncRunner` cộng mọi bước trong `RunDashboardStatisticsSync` | `Stopwatch` theo bước (`revenue`, `order`, `payment`, `rating`, `product`, `stock`, `customer`, `staff`, `responseRate`, `debt`, `commit`). Log có cấu trúc `{dataset, date, step, ms, rows, attempt}` và ghi `EventLog` key `sync-step:<date>:<step>` | Mỗi ngày sync có đủ 11 dòng bước trong log hoặc EventLog. Tổng ms khớp ±5% với `PerformanceDuration` |
| G0-10 | `DashboardV2SyncStatePolicy.ProductionSyncDatasets` / runner | Bỏ `PreOrderFact` và `OperationalPreOrderFact` khỏi danh sách `MarkCompleted` của đường hằng ngày, **hoặc** thêm recurring job gọi `SyncDashboardOperationalPreOrdersIncremental` (chủ hệ thống chọn) | Không dataset nào có `LastSourceUpdatedAt` tiến lên mà không có bước sync tương ứng (test) |
| G0-11 | `DashboardRecomputeService.SyncLockWait` | Đặt bằng `ReportSyncLocks.Timeout`, hoặc giữ thời gian chờ ngắn bằng cách thử lấy khóa nhiều lần với timeout 60'. Sửa NRE ở `finally` (khoảng dòng 442) | Test: recompute đang chờ khóa không làm mất dòng `lock` của sync đang giữ. Không còn NRE trong log recompute |
| G0-12 | `ApplyCompleted` (đường backfill) | Không lùi `LastSourceUpdatedAt`: `= max(cũ, endDate)` | Unit test: backfill 01/09 khi watermark 23/10 thì watermark vẫn 23/10 |

- **Thứ tự đề xuất:** G0-1, G0-2, G0-9 trước (dừng chạy trùng, gỡ timeout PaymentOrder, có số đo). Rồi G0-3, G0-4, G0-5, G0-6. Rồi G0-7, G0-8. Rồi G0-10, G0-11, G0-12.
- **Tiêu chí hoàn thành:**
  - Không còn job report nào có `Processing` lần 2 trong 3 ngày.
  - Log có thời gian từng bước cho mỗi ngày.
  - 23–29/10 được Published. Watermark Order/Payment tới hôm qua trong vòng 24 giờ sau deploy.
  - AutoRecover lỗi thì hiện `Failed` trên Hangfire.

### Giai đoạn 1 (B), 1–2 tuần

- **Nội dung:**
  - Writer set-based.
  - Transaction riêng cho từng dataset-ngày.
  - Chỉ mục report `IssueAt/CompleteAt`, tạo bằng `CREATE INDEX CONCURRENTLY` trong migration riêng.
- **Tiêu chí hoàn thành:**
  - E7 diff bằng 0 cho 7 ngày.
  - Mỗi ngày dưới 5' trên production, theo log bước.
  - Transaction report dài nhất dưới 60s.

### Giai đoạn 2 (C), 3–4 tuần

- **Nội dung:**
  - `SyncPartition`, staging, coordinator, CDC.
  - Tách stock snapshot và nợ treo thành dataset riêng.
  - API `DataFreshness`, cảnh báo.
  - Bỏ khóa Hangfire `Report.SyncData` khỏi đường dài.
- **Tiêu chí hoàn thành:**
  - Độ trễ freshness p95 dưới 1 giờ trong giờ làm việc.
  - Kill hoặc restart ngẫu nhiên (E4) mất dưới 1'.
  - Đối soát hằng ngày không còn lệch quá 0,1%.
  - Có dashboard theo dõi.

---

## 8. Rủi ro và câu hỏi mở (chủ hệ thống quyết)

### Rủi ro

1. **Đổi `InvisibilityTimeout` hoặc sliding trong Hangfire.PostgreSql 1.20.12 ảnh hưởng mọi job của report.api**, kể cả KPI. Cần xác nhận hành vi sliding với `IsLightweightServer` (tài liệu ghi là không chạy ở chế độ này), và kiểm tra có job nào đang dựa vào cơ chế phát lại để tự phục hồi hay không.
2. Writer mới (B) có thể lệch số với writer cũ ở các trường hợp biên: đơn đổi, trả liên store, `PaidRatio`, sản phẩm không có category. Bắt buộc làm E7.
3. Tách 7 dataset ra thì UI có thể hiển thị các dataset ở độ tươi khác nhau. Cần thiết kế thông báo "một phần".
4. Thêm chỉ mục trên report primary (B) tốn I/O. Phải dùng `CONCURRENTLY`.
5. Profile `HANGFIRE` trỏ vào **primary**. Chạy truy vấn đo đạc ở đây có thể ảnh hưởng production. Đề nghị cấp một tài khoản chỉ đọc có giới hạn tài nguyên, hoặc chỉ dùng replica.
6. Có tiến trình lạ đang chạy truy vấn StockHistory dài trên POS replica (E9). Nếu đó là một backfill khác đang ghi report, nó có thể chạy chồng với sync production.

### Câu hỏi mở

1. Có cho phép đổi cấu hình Hangfire storage (`UseSlidingInvisibilityTimeout`, `InvisibilityTimeout`) của report.api không?
2. Có được thêm chỉ mục trên **report** không (`ReportOrderStatistic.IssueAt`, `ReportPaymentStatistic.CompleteAt`)? Có được đề xuất chỉ mục trên **POS** primary (`Customer.CurrentDebtAmount` partial) không, hay POS là bất khả xâm phạm? Thiết kế ở đây không cần chỉ mục POS.
3. Các bảng legacy (ReportProduct, ReportCustomer, ReportStaff, ReportRating, ReportResponseRate) có còn được màn hình nào dùng không? Nếu không, có thể bỏ khỏi đường Dashboard V2 hoặc chuyển sang job ban đêm. Đây là cách giảm thời gian lớn nhất và rẻ nhất.
4. Stock snapshot (EndStock/CostPrice cuối ngày) có cần chính xác theo ngày cho dashboard không, hay chấp nhận chạy sau?
5. Cận thời gian khi quy store cho nợ treo (toàn lịch sử hay N tháng)?
6. Thứ tự ưu tiên đuổi kịp: ưu tiên hôm nay và hôm qua trước, rồi mới lấp 23–28/10?
7. Có chấp nhận dashboard hiển thị "dữ liệu tới ngày X" theo từng dataset (thay vì một mốc chung) không?
8. Có được cấp quyền đọc log ứng dụng report.api không? Lỗi thật của các lần sync đang bị `catch {}` nuốt và chỉ còn trong log.
9. Ai đang chạy 4 truy vấn StockHistory dài trên POS replica lúc khoảng 14:13–14:40 UTC ngày 30/10?
10. Lỗi NRE trong `RunRecomputeRequest` (khoảng dòng 442) và việc recompute tự hủy do heartbeat 10' cần được sửa trong A hay để sang C (C thay thế luồng recompute)?
