# WAVE 8 - report.api (nhánh `qc/dashboard-v2-wave8`)

Hai lỗi thật phát hiện khi chạy local stack trên bản sao production. Mỗi lỗi một commit, chỉ commit local.

## Bug A - Đồng bộ khu vực HRM gán 0 chi nhánh

- **Triệu chứng:** `POST /Admin/V2/Region/SyncFromHrm` trả `SitesAssignedCount=0`, `SitesWithoutClusterCount=78` dù HRM có 65 dòng `BuddyStoreGroupSite`.
- **Nguyên nhân:** DTO `HrmBuddyStoreGroupSiteItem` đọc `SiteId` phẳng và `HrmStoreClusterBuddyStoreGroupItem` đọc `BuddyStoreGroupId` phẳng. HRM thật không gửi hai trường này (xác nhận bằng cách gọi `/Admin/BuddyStoreGroupSite/GetPage` và `/Admin/StoreClusterBuddyStoreGroup/GetPage`): chỉ gửi object lồng `site` và `buddyStoreGroup` (cộng `buddyStoreGroupId` phẳng ở BuddyStoreGroupSite, `storeClusterId` ở StoreClusterBuddyStoreGroup). Id luôn là `Guid.Empty` nên không khớp chi nhánh/cụm nào. Test cũ dùng id phẳng nên không phát hiện.
- **Cách sửa:** (`Src/Application/RequestClients/Types/Hrm/HrmHierarchyDtos.cs`) getter `SiteId` ưu tiên giá trị phẳng, nếu rỗng thì lấy `Site?.Id`; `BuddyStoreGroupId` tương tự với `BuddyStoreGroup?.Id`. Mọi nơi đọc hai trường này (đều trong `DashboardRegionService.SyncFromHrmAsync`) được sửa theo. Trong service, dòng vẫn rỗng id sau khi resolve bị bỏ qua và ghi một dòng log cảnh báo kèm số lượng.
- **Test:** `Tests/Application.Tests/DashboardV2HrmNestedDtoTests.cs` - deserialize JSON đúng hình dạng HRM (chỉ `site`/`buddyStoreGroup` lồng, không có id phẳng, kèm dòng object null) bằng cùng đường `JObject.Parse(...)["data"].ToObject<List<T>>()` của `HrmRequestClient`, rồi chạy sync, kiểm tra chi nhánh được gán, cụm gắn đúng khu vực, dòng thiếu id bị bỏ qua. Thêm test id phẳng vẫn được ưu tiên.
- **Số liệu trước/sau (cùng DB local):**

| Chỉ số | Trước | Sau |
|---|---|---|
| SitesAssignedCount | 0 | 65 |
| SitesWithoutClusterCount | 78 | 13 |
| RegionsCount | - | 8 |
| ClustersCount | - | 10 |
| clusterRegionConflicts | - | 0 |
| conflicts (chi nhánh) | - | 0 |
| deactivatedRegionCodes | - | 0 |

  13 chi nhánh còn lại không có dòng liên kết cụm nào trên HRM (78 - 65), thuộc "Chưa phân cụm"; không có xung đột còn tồn tại.

## Bug B - `DashboardOperationalPreOrderFact` kẹt State=Running

- **Triệu chứng:** sau `--pre-order-backfill` 2026-09-01..2026-10-17 (rc=0), dòng `ReportStatisticSyncState` có `State=2` (Running), range 09-02..09-03, `LastErrorCode` rỗng, coverage chỉ 09-01..09-03; block Order Aging không live.
- **Nguyên nhân gốc:** `TryAcquireDashboardOperationalPreOrderLease` đọc dòng state **có tracking** rồi claim lease bằng `ExecuteUpdateAsync` (ghi `Running` thẳng DB, không qua change tracker). Khi hoàn tất, `CompleteDashboardOperationalPreOrderSync` gán `State=Idle`/`LeaseUntil=null` lên entity đã track với bản cũ `Idle` nên EF không thấy thay đổi và không lưu hai cột này (các cột khác như range, thời gian hoàn tất vẫn lưu). DB kẹt Running với lease 30 phút. CLI chạy tuần tự từng ngày cùng một DbContext: ngày 1 chạy (dòng state mới tạo), ngày 2 chạy rồi để lại Running, các ngày 3..47 không claim được lease và `RunDashboardOperationalPreOrderSync` **return im lặng**, nên rc=0 nhưng thiếu dữ liệu.
- **Cách sửa** (`ReportService.DashboardV2.PreOrderSync.cs`):
  1. Đọc dòng state bằng `AsNoTracking` khi claim lease; detach entity vừa tạo mới.
  2. `ReloadAsync` entity state trước khi hoàn tất để không dựa vào bản cũ.
  3. Backfill không còn bỏ qua im lặng khi lease đang bận: ném `pre_order_sync_lease_unavailable` (incremental vẫn bỏ qua nhẹ nhàng).
- **Test:** `Tests/Application.Tests/DashboardV2PreOrderStateRegressionTests.cs` - (a) giữ bản Idle đã track, mô phỏng claim Running ở context khác, gọi bước hoàn tất, khẳng định DB về Idle, `LeaseUntil=null`; (b) kiểm tra claim đọc AsNoTracking và backfill báo lỗi khi lease bận. Cả hai test fail khi gỡ bản sửa, pass khi có.
- **Số liệu trước/sau:**

| | Trước | Sau |
|---|---|---|
| State | 2 (Running) | 1 (Idle) |
| LeaseUntil | còn hạn | null |
| LastErrorCode | rỗng | rỗng |
| Coverage tạo đơn | 09-01..09-03 | 09-01..thời điểm chạy (2026-10-19) |
| LastRange | 09-02..09-03 | cửa sổ incremental cuối (ngữ nghĩa hiện tại: lần chạy cuối là incremental ghi đè range) |

  Lưu ý: lần chạy lại phải chờ lease cũ (do lỗi) hết hạn lúc 14:31 UTC vì không sửa tay DB. Sau chạy lại: `OrderAging` (BOD, 2026-09-01..2026-10-17) trả HTTP 200, `dataStatus=live`, 8 item.

## Kiểm tra cuối

- Build OK; `DashboardV2|KpiV2`: 532 pass, 2 skipped (baseline 528 + 4 test mới); `Golden`: 15/15; EF: không có thay đổi model chờ.
- `local-stack/scripts/smoke.py`: `FAILURES: 0`.
