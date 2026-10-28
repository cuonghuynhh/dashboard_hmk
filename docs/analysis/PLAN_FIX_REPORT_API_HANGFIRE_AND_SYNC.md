# Kế Hoạch Sửa Triệt Để Trong Code `report.api` (Đã Tích Hợp Review SRE & Architect)

## 1. Mục Tiêu & Bối Cảnh
Từ dữ liệu truy vấn trực tiếp DB `hangfire` và `report` trên production (`<prod-db-host>:5432`):
1. **Yêu cầu Recompute bị kẹt ở queue `"default"`:** Khi Hangfire tự retry (`AutomaticRetry`), method `IDashboardRecomputeService.RunRecomputeRequest` không có attribute `[Queue("report")]`, khiến scheduler đẩy job sang queue `"default"`. Các worker `pos`/`epc` nhặt job và ném `FileNotFoundException: Could not resolve assembly 'Report.Application'`, sau đó job nằm chết do không có worker `report` nào nghe queue `"default"`.
2. **`AutoRecoverFailedSyncs` chồng chéo & giữ DB lock > 34 phút:** Định kỳ 30 phút/lần (`*/30 * * * *`), nhưng job chạy kéo dài > 30 phút và không có `[DisableConcurrentExecution]`. Kết quả là 2 instance chạy song song, mở transaction lớn (`pid = 1744`), giữ `RowExclusiveLock` trên 4 bảng và chiếm giữ `hangfire:Report.SyncData`.
3. **`SyncData` ban đêm bị Timeout khi lưu Site:** `SyncReportSitesFromPos()` được gọi trong `SyncDataInternal` mỗi đêm. Phương thức này luôn cập nhật `LastSyncedAt` và ghi đè toàn bộ 78 sites vào `ReportSite`, gây đụng độ lock với các transaction dài khác và vượt quá `CommandTimeout` mặc định (30s) của Npgsql.

---

## 2. Chi Tiết Kế Hoạch Sửa Đổi (Đã Bổ Sung Điều Kiện SRE & Architect)

### Gói 1: Ngăn Chặn Job Rơi Vào Queue `"default"` & Bảo Toàn Trạng Thái Recompute
- **File cần sửa:**
  - `report.api/Src/Application/Services/DashboardV2/DashboardRecomputeService.cs`
  - `report.api/Src/Application/Services/Report/ReportService._Base.cs`
  - `report.api/Src/Application/Services/Report/ReportService.DashboardV2.Sync.cs`
- **Nội dung thay đổi:**
  1. Thêm attribute `[Queue(ReportHangfireQueues.Default)]` trên cả **Interface lẫn Implementation**:
     - `IDashboardRecomputeService.RunRecomputeRequest(Guid requestId)` & `DashboardRecomputeService.RunRecomputeRequest`
     - `IReportService.SyncData(DateTime date)` & `ReportService.SyncData`
     - `IReportService.SyncDashboardStatisticsIncremental()` & `ReportService.SyncDashboardStatisticsIncremental`
     - `IReportService.AutoRecoverFailedSyncs()` & `ReportService.AutoRecoverFailedSyncs`
  2. Bổ sung `[AutomaticRetry(Attempts = 0)]` trên `RunRecomputeRequest`.
  3. **[Architect/SRE Khuyến nghị]:** Đảm bảo trong thân hàm `RunRecomputeRequest(Guid requestId)` có bọc khối `try / catch (Exception ex)`. Khi xảy ra lỗi chưa xử lý, cập nhật ngay `request.Status = DashboardRecomputeStatuses.Failed`, `request.ErrorMessage = ex.Message`, `request.FinishedAt = Now()` và `await Db.SaveChangesAsync()` trước khi rethrow để tránh trường hợp UI bị treo vĩnh viễn ở trạng thái `Running (2)`.

---

### Gói 2: Chống Chồng Chéo, Giải Phóng Lock & Chống Rò Rỉ Bộ Nhớ EF Core
- **File cần sửa:**
  - `report.api/Src/Application/Services/Report/ReportService.DashboardV2.Sync.cs`
- **Nội dung thay đổi:**
  1. **Chống chạy đồng thời (Graceful Skip):**
     - Gắn attribute `[DisableConcurrentExecution(timeoutInSeconds: 0)]` kèm `[AutomaticRetry(Attempts = 0, LogEvents = false)]` trên `IReportService.AutoRecoverFailedSyncs()`.
     - Trong thân hàm `AutoRecoverFailedSyncs`, kiểm tra chủ động lease/lock hoặc `ReportStatisticSyncState`: nếu phát hiện phiên recovery trước đó vẫn đang chạy hợp lệ (chưa hết `LeaseUntil`), ghi log `_logger.LogInformation("Quá trình recovery trước đó vẫn đang chạy. Bỏ qua chu kỳ này.")` và `return` êm đẹp (tránh ném `DistributedLockTimeoutException` làm đỏ Hangfire Dashboard).
  2. **Tách Transaction lớn thành các đơn vị nhỏ (Batch/Step) & Clear ChangeTracker:**
     - Thay vì mở 1 transaction duy nhất kéo dài 34 phút bao trùm toàn bộ vòng lặp 13 ngày trong `RunDashboardStatisticsSync`:
       - Mỗi ngày (hoặc mỗi chunk ngày) chạy trong một transaction ngắn riêng biệt và `await transaction.CommitAsync()`.
       - **[Architect/SRE Khuyến nghị]:** Ngay sau khi commit mỗi ngày, gọi `Db.ChangeTracker.Clear()` để giải phóng toàn bộ thực thể đã theo dõi. Tránh tình trạng tích lũy hàng chục nghìn entity gây suy giảm tốc độ `DetectChanges()` theo cấp số nhân và rò rỉ bộ nhớ.
       - Cập nhật tiến độ `ReportStatisticSyncState` cho từng ngày ngay trong transaction của ngày đó để nếu đứt quãng ở ngày N thì các ngày 1..N-1 đã hoàn tất và phục vụ ngay cho báo cáo kinh doanh của BOD.
  3. **Kiểm tra trạng thái & reset RetryCount:**
     - Nếu `failedStates` có dataset nào đã vượt ngưỡng retry (`RetryCount >= 3` - `auto_recovery_disabled`), bỏ qua không gọi vô tận mỗi 30 phút.
     - Khi một dataset recovery thành công, tự động reset `RetryCount = 0` và xóa `LastErrorCode`.

---

### Gói 3: Tối Ưu `SyncReportSitesFromPos()` Tránh Timeout Ban Đêm
- **File cần sửa:**
  - `report.api/Src/Application/Services/Report/ReportService._Base.cs`
- **Nội dung thay đổi:**
  1. **Thêm `AsNoTracking()` khi đọc POS Site:**
     - `await PosDb.Site.AsNoTracking().WhereNotDeleted().ToListAsync()`.
  2. **Chỉ update bản ghi thực sự có thay đổi:**
     - So sánh diff các trường (`Code`, `Name`, `Phone`, `Address`, `ProvinceCode`, `State`). Nếu không thay đổi gì thì **không cập nhật `LastSyncedAt`** và không gán modified.
     - Triệt tiêu 78 câu UPDATE vô nghĩa mỗi đêm, thời gian thực thi giảm từ >30s xuống <100ms.
  3. **Tránh gọi lặp lại trong vòng lặp batch:**
     - Đảm bảo trong `RunDashboardStatisticsSync`, `SyncReportSitesFromPos()` chỉ được gọi 1 lần duy nhất ở đầu quy trình, không gọi lặp lại 13 lần cho 13 ngày.
  4. **Safety net CommandTimeout:**
     - Cấu hình timeout an toàn (ví dụ 120s) cho tác vụ batch đêm để tránh ngắt kết nối do I/O mạng đột xuất.

---

## 3. Kịch Bản Rollout & Thao Tác Production DB (Pre-Deployment Cleanup)

Trước khi kích hoạt container `report.api` mang code mới, kỹ sư triển khai thực hiện script SQL sau trên `<prod-db-host>:5432`:

```sql
-- 1. Giải phóng job mồ côi #8874781 đang kẹt ở queue 'default' trên DB hangfire:
DELETE FROM hangfire.jobqueue WHERE jobid = 8874781 AND queue = 'default';

-- 2. Giải phóng distributed lock nếu còn treo:
DELETE FROM hangfire.lock WHERE resource = 'hangfire:Report.SyncData';

-- 3. Cập nhật request Recompute kẹt trên DB report về trạng thái Canceled/Failed:
UPDATE "DashboardRecomputeRequest" 
SET "Status" = 4, "ErrorMessage" = 'Đã hủy do nâng cấp hệ thống (tránh kẹt queue)', "FinishedAt" = NOW()
WHERE "Id" = '01a17e12-bb5d-7f1a-bc99-bbd5a4cd804f' AND "Status" = 2;

-- 4. Reset trạng thái dataset bị disabled trong ReportStatisticSyncState:
UPDATE "ReportStatisticSyncState" 
SET "State" = 1, "RetryCount" = 0, "LeaseUntil" = NULL, "LastErrorCode" = NULL 
WHERE "DatasetCode" = 'DashboardOperationalPreOrderFact';

UPDATE "ReportStatisticSyncState" 
SET "State" = 1, "LeaseUntil" = NULL 
WHERE "DatasetCode" = 'DashboardOrderFact' AND "State" = 2;
```

---

## 4. Các Bước Triển Khai & Nghiệm Thu (Checklist)

| Bước | Hành Động | Tiêu Chí Nghiệm Thu |
| :---: | :--- | :--- |
| **B1** | Tạo nhánh `fix/hangfire-queue-and-sync-timeout` trên `report.api` | Nhánh mới sạch sẽ từ `main` |
| **B2** | Triển khai Gói 1: Queue attributes + Try/Catch Status update | Build PASS, `RunRecomputeRequest` có Queue rõ ràng |
| **B3** | Triển khai Gói 2: Graceful Skip + Batch Commit + `ChangeTracker.Clear()` | Không rò rỉ memory, lock nhả sau từng ngày |
| **B4** | Triển khai Gói 3: Site diff check + `AsNoTracking()` | 0 query update thừa nếu site không đổi |
| **B5** | Chạy toàn bộ Unit & Integration Test của `report.api` | 100% tests PASS |
| **B6** | Tạo PR vào `main` và `development` của `report.api` | Sẵn sàng review và merge |
| **B7** | Chạy Pre-deployment SQL Script trên DB Production | Job kẹt được dọn sạch, lock được giải phóng |
| **B8** | Deploy container `report.api` mới và trigger bù dữ liệu 26/10 & 27/10 | Báo cáo Dashboard V2 cập nhật đầy đủ dữ liệu mới nhất |
