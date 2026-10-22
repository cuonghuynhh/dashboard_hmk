# W9 FIX_OPENAPI: thiếu operation OpenAPI cho "Cập nhật gần nhất" và "Tính lại dữ liệu"

- Worktree: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/wt/gui-fix-openapi`, branch `qc/w9-fix-openapi` (từ `qc/dashboard-v2-wave9`, pos.gui)
- Commit (local, chưa push):
  - `a69b2293` fix(dashboard-v2): add DataFreshness and Recompute operations to report OpenAPI

## 1. Lỗi

`src/pages/dashboard-v2/services/dashboardV2Api.ts` gọi 3 operation `AdminV2DashboardDataFreshness`, `AdminV2DashboardRecompute`, `AdminV2DashboardRecomputeLatest`. Các operation này không có trong `openapi/report.json`, nên không có trong `src/apis/definitions/report.runtime.json`. Khi chạy thật, client gọi `client[method] is not a function`, nên "Cập nhật gần nhất" và "Tính lại dữ liệu" không hoạt động. Unit test không bắt được lỗi vì mock client.

## 2. Thay đổi

### 2.1 Contract OpenAPI (`openapi/report.json`)
Thêm 3 path, khai báo theo đúng kiểu các op `Admin/V2/Dashboard/*` khác (tag `Dashboard V2`, `security: AccessToken/admin`, response dạng DataResult):

| Method | Path | operationId | Request | Response |
|---|---|---|---|---|
| GET | `/Admin/V2/Dashboard/DataFreshness` | `AdminV2DashboardDataFreshness` | không | `DashboardDataFreshnessDataResult` |
| POST | `/Admin/V2/Dashboard/Recompute` | `AdminV2DashboardRecompute` | body `DashboardRecomputeInputAdminDto` `{fromDate, toDate}` | `DashboardRecomputeRequestDataResult` |
| GET | `/Admin/V2/Dashboard/Recompute/Latest` | `AdminV2DashboardRecomputeLatest` | không | `DashboardRecomputeRequestDataResult` (data nullable) |

Các path được chèn ngay sau `/Admin/V2/Dashboard/FilterOptions`.

Thêm 7 schema trong `components.schemas`: `DashboardFreshnessDatasetAdminDto`, `DashboardDataFreshnessAdminDto`, `DashboardDataFreshnessDataResult`, `DashboardRecomputeInputAdminDto`, `DashboardRecomputeRequestAdminDto`, `DashboardRecomputeRequestDataResult`.

Nguồn contract: `report.api` (branch `qc/dashboard-v2-wave9`, chỉ đọc) `Src/WebApi/Controllers/Admins/V2/DashboardV2Controller.cs` và `Src/Application/Dto/Admins/DashboardV2/Recompute/DashboardRecomputeAdminDto.cs`. Enum được serialize thành số nguyên (không có `JsonStringEnumConverter`), nên `state` và `status` là `integer int32`.

Diff `openapi/report.json`: 221 dòng thêm, 0 dòng xóa. Không có churn ở phần khác.

### 2.2 Regenerate
- Chạy `npm run openapi:report`.
- `src/apis/schemas/report.d.ts`: 108 dòng thêm, 0 dòng xóa.
- `src/apis/definitions/report.runtime.json`: được minify lại (một dòng), chứa 3 operation mới.

### 2.3 Gỡ typed view tạm (`dashboardV2Api.ts`)
- Xóa `FreshnessOperationMethods` và `freshnessOperations`. Đã có type generated nên không cần view tạm.
- Ba method của `generatedDashboardV2Client` và `requestDataFreshness`, `requestRecompute`, `requestRecomputeLatest` gọi trực tiếp `client.AdminV2Dashboard…`.
- Bỏ generic `request<{ data?: unknown }>` trên 3 method này để type generated đi qua. Bỏ import `OperationResponse` không còn dùng.
- Hành vi không đổi: `toastError: false`, `freshnessConfig`, `normalizeDataFreshness` và `normalizeRecomputeJob` giữ nguyên.

### 2.4 Audit operation trong `src/pages/dashboard-v2/**`
Quét toàn bộ `reportApiClient.request` và `posApiClient.request` (71 call site, gồm cả `.vue`), đối chiếu với `operationId` trong runtime json:
- Report: chỉ 3 operation trên là thiếu. Đã bổ sung.
- Đã kiểm tra, đều có: `AdminV2ImportKpiTemplate` (query `fromMonth`, `toMonth`), `AdminV2ImportKpiPreview` (multipart/form-data), `AdminV2KpiDailyTargets` (query `fromDate`, `toDate`, `siteIds`), `AdminV2RegionSyncFromHrm` (POST không body), và toàn bộ `AdminV2Dashboard*Traffic*`.
- Pos: `AdminSiteGetAllSiteWithAnyScope` có trong `pos.runtime.json`.

### 2.5 Test guard `tests/dashboard-v2/runtimeOperations.spec.ts` (mới)
- Quét tĩnh `src/pages/dashboard-v2` (`.ts`, `.vue`, bỏ `.spec.ts`) để tìm `reportApiClient|posApiClient.request((x) => x.Op…)`. Regex chấp nhận mọi tên tham số, ví dụ `(c) =>`.
- Test 1 (sanity): số operation bắt được bằng số call site `request(` đếm được. Đồng thời kiểm tra có `AdminV2DashboardDataFreshness`, `AdminV2DashboardRecompute`, `AdminV2DashboardRecomputeLatest`. Nếu regex bỏ sót một call site, test này fail.
- Test 2: mỗi operation phải có `operationId` trong `report.runtime.json` (client report) hoặc `pos.runtime.json` (client pos).
- Đã kiểm chứng: thay `report.runtime.json` bằng bản HEAD (trước fix) thì test 2 fail đúng 3 operation thiếu. Sau đó khôi phục bản đã regenerate.

## 3. Quyết định
- Schema DTO: đặt tên theo tên DTO backend (`DashboardDataFreshnessAdminDto`, `DashboardRecomputeRequestAdminDto`, ...), để dễ đối chiếu với `report.api`.
- Một `DataResult` cho `Recompute` và `Recompute/Latest` (`DashboardRecomputeRequestDataResult`). `data` là nullable nên vẫn đúng cho trường hợp "chưa có job".
- Trường ngày trong DTO (`lastSucceededAt`, `coveredFrom`, `coveredTo`, `requestedAt`, ...) khai báo `date-time`, giống các DateTime khác trong spec. Backend dùng `yyyy-MM-dd` cho `fromDate` và `toDate` của request, và schema khai báo `string` thuần, đúng với backend.
- Trailer commit dùng `Co-Authored-By: Claude Opus 5.5` theo RULES.md (không dùng Haiku trong hướng dẫn chung của phiên).
- Không push, không sửa `report.api`.

## 4. Không làm / ghi nhận
- Phát hiện nhưng không sửa (ngoài phạm vi): schema response của `GET /Admin/V2/Dashboard/Regions` trong `openapi/report.json` đang là `{"": "#/components/schemas/DashboardRegionTreeListDataResult"}` (key rỗng, không phải `$ref`). Kiểu response của op này vì vậy không được generate đúng. Nên sửa riêng để không làm lẫn diff.
- Change log này được ghi vào `docs/qc/` của repo docs (`dashboard_hmk/dashboard_hmk`), không nằm trong pos.gui, theo đúng RULES.md và yêu cầu của lead. File chưa được commit.

## 5. Kiểm thử

| Lệnh | Kết quả |
|---|---|
| `npx vue-tsc -b --noEmit` | exit 0, 0 lỗi |
| `npx eslint src/pages/dashboard-v2` | exit 0, 0 lỗi |
| `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | 74 file / 752 test pass, 0 fail (trong đó `runtimeOperations.spec.ts` có 2 test) |
| `vitest run tests/dashboard-v2/runtimeOperations.spec.ts` trên runtime bản HEAD | fail đúng 3 operation thiếu (kiểm chứng guard) |

Lưu ý: baseline trong RULES.md ghi 57 file / 507 test. Nhánh hiện tại có 74 file / 752 test, số đếm này không đối chiếu được với baseline cũ nên chỉ ghi số đo được.
