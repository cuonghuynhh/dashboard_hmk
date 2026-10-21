# WAVE 4 — Bộ Lọc 3 Cấp, Order Aging 2 Giai Đoạn, Xếp Hạng & Heatmap Theo Cụm, Xử Lý Identity 503 (pos.gui)

> **Đính chính và xác nhận của PM (18/10, đã đối chiếu code thật). Ưu tiên phần này nếu khác nội dung bên dưới.**
> - **Kiểm chứng độc lập:**
>   - Nhánh `qc/dashboard-v2-wave4` @ `f80eda7f`, 6 commit trên `qc/dashboard-v2-wave3`, **chưa push**.
>   - Vitest `tests/dashboard-v2 + e2e/dashboard-v2`: **53 file / 441 test đạt** (trước wave là 420).
>   - `vue-tsc -b --noEmit` sạch; eslint sạch; cây làm việc sạch.
> - **Tên DTO sai ở bảng mục 4:**
>   - Response của `GET Admin/V2/Dashboard/Access` là `DataResult<DashboardV2AccessAdminDto>`. Không có `DashboardAccessResultAdminDto`.
>   - Response của `GET Admin/V2/Region` là `DataResult<DashboardRegionCatalogAdminDto>`. Không có `List<RegionAdminDto>`.
> - **PM đã soát và xác nhận:**
>   - **Bộ lọc 3 cấp:** cascade đúng BR-FLT-01. `clusterIds` đi theo request vì các request sao chép toàn bộ bộ lọc.
>   - **Order Aging:** dùng `stage` `DatHang` / `HoanThanhDonHang` và bucket 1–4, có toggle Số lượng / Giá trị.
>   - **Heatmap:** đã bỏ fallback ngầm về `/Admin/Report/BranchPerformanceHeatmap`, nên lỗi V2 hiện thành trạng thái lỗi. Request gửi `periodType` và `clusterIds`; component đọc `dataStatus` / `gmvHidden`.
>   - **Identity 503:** màn hình báo lỗi kèm nút thử lại.
>   - Code `src/` không còn gọi `Region/Assignments` / `SeedFromStoreKpi`.
> - **Tồn đọng nhỏ (không chặn):** `BranchPerformanceHeatmap.vue` vẫn gọi `this.$api.report.post('/Admin/V2/Dashboard/Heatmap')` khi có `$api`, chỉ dùng `dashboardV2Api.heatmap()` khi không có. Hành vi vẫn đúng, nhưng nên gom về helper chung cho thống nhất.

| Thuộc tính | Giá trị |
|---|---|
| Repo | `pos.gui`, nhánh local `qc/dashboard-v2-wave4` (kế thừa từ `qc/dashboard-v2-wave3`). **Chưa push.** |
| Spec | `docs/PRODUCT_SPEC_DASHBOARD.md` v2.2 (các quyết định QĐ-28, QĐ-29, FR-FLT-01, BR-FLT-01, FR-FLT-02, FR-OP-01, FR-OP-05, FR-EX-08) |
| Backend tham chiếu | `report.api` nhánh `qc/dashboard-v2-wave4`, các C# DTO tại `Src/Application/Dto/Admins/DashboardV2/` và controller `Src/WebApi/Controllers/Admins/V2/` |
| Tài liệu đối chiếu | `docs/qc/WAVE3_pos_gui.md`, `docs/qc/WAVE4_report_api.md` |

---

## 1. Kết quả kiểm tra trước / sau

| Hạng mục | Trước (bắt đầu Wave 4) | Sau (hoàn thành Wave 4) |
|---|---|---|
| `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | 50 file / 420 test đạt | **53 file / 441 test đạt** (+3 file mới, +21 test đạt) |
| `npx vue-tsc -b --noEmit` | sạch (exit 0) | **sạch (exit 0)** |
| `npx eslint src/pages/dashboard-v2 src/components/report-dashboard` | 0 lỗi, 0 cảnh báo | **0 lỗi, 0 cảnh báo** |
| Prettier (hook pre-commit) | — | Mọi file staged đều đạt chuẩn `prettier --check` (`printWidth: 200`) |
| Git status (`pos.gui`) | — | **Working tree sạch, không có file chưa commit** |

---

## 2. Danh sách commit trên nhánh `qc/dashboard-v2-wave4`

```text
f80eda7f feat(dashboard-v2): handle identity 503 error with retry state (work item 6)
0e4726fd fix(dashboard-v2): branch performance heatmap v2 api integration and error handling (work item 5)
55f86796 feat(dashboard-v2): 2-stage order aging chart with quantity-value toggle (work item 4)
9feb386c feat(dashboard-v2): add cluster grouping to executive charts and ranking (work item 3)
c0ed119b feat(dashboard-v2): implement 3-level region cluster site cascade filter (work item 2)
cd2535f2 feat(dashboard-v2): update typings and openapi contract for wave 4 (work item 1)
```

---

## 3. Chi tiết từng hạng mục

### Hạng mục 1 — Typings và API Client Wave 4 — commit `cd2535f2`
- **Spec / Contract:**
  - C# DTOs: `Src/Application/Dto/Admins/DashboardV2/Region/DashboardRegionDtos.cs`, `Src/Application/Dto/Admins/DashboardV2/Executive/ExecutiveDtos.cs`, `Src/Application/Dto/Admins/DashboardV2/Executive/HeatmapV2Dto.cs`, `Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dtos.cs`.
- **Nội dung thực hiện:**
  - Cập nhật định nghĩa OpenAPI trong `src/apis/schemas/report.d.ts` và types nội bộ trong `src/pages/dashboard-v2/types.ts`:
    - Bổ sung cấu trúc cây khu vực: `DashboardRegionTreeAdminDto` (`id`, `code`, `name`, `sortOrder`, `clusters`, `sites`), `DashboardClusterTreeAdminDto` (`id`, `code`, `name`, `sortOrder`, `sites`), `DashboardRegionSiteAdminDto` (`siteId`, `siteName`, `siteCode`, `isClosed`).
    - Bổ sung `clusterIds?: string[]` (tương ứng `clusterIds?: Guid[]` trong C#) vào `DashboardV2InputAdminDto` / `DashboardFilter` / `DashboardV2HeatmapFilter`.
    - Thêm `clusters?: ExecutiveRankingItemV2[]` vào `ExecutiveRankingV2Dto` / `ExecutiveRankingV2`.
    - Thêm `clusterRows?: BranchPerformanceHeatmapRowV2[]` vào `HeatmapV2Dto` / `HeatmapV2`. Định nghĩa dimension `Cluster = 15`.
    - Cập nhật `OrderAgingItemV2Dto` / `OperationalOrderAgingItem`: `stage: 'DatHang' | 'HoanThanhDonHang'`, `bucket: DashboardV2AgingBuckets` (1 = 0–5 ngày, 2 = 6–10 ngày, 3 = 11–20 ngày, 4 = > 20 ngày; 0 = LessThanOneDay), `orderCount`, `value`, `missingValueCount`, `isValueComplete`.
  - Cập nhật `src/pages/dashboard-v2/services/dashboardV2Api.ts`:
    - Thêm phương thức `regions(): Promise<DashboardRegionTree[]>` gọi API `GET Admin/V2/Dashboard/Regions` (operation `AdminV2DashboardRegions`).
    - Xóa hoàn toàn các client function và typings liên quan đến 2 endpoint 410 đã bị hủy: `PUT Admin/V2/Region/Assignments` (`AdminV2RegionAssignmentsPut`) và `POST Admin/V2/Region/SeedFromStoreKpi` (`AdminV2RegionSeedFromStoreKpiPost`).
- **File:** `src/apis/schemas/report.d.ts`, `src/pages/dashboard-v2/types.ts`, `src/pages/dashboard-v2/services/dashboardV2Api.ts`.

---

### Hạng mục 2 — Bộ Lọc Toàn Cục 3 Cấp & Bộ Lọc Cục Bộ (QĐ-28, FR-FLT-01, BR-FLT-01, FR-FLT-02) — commit `c0ed119b`
- **Spec / Quy tắc:** QĐ-28, FR-FLT-01, BR-FLT-01, BR-FLT-05, BR-FLT-06.
- **Nội dung thực hiện:**
  - Nâng cấp `DashboardV2FilterBar.vue`:
    - Thay thế bộ chọn 2 cấp cũ (Khu vực / Chi nhánh) bằng 3 cấp hoàn chỉnh: **Khu vực → Cụm cửa hàng → Chi nhánh**. Xóa bỏ comment `TODO(QĐ-28)`.
    - Dựng danh sách lựa chọn trực tiếp từ Cây khu vực `GET Admin/V2/Dashboard/Regions`.
    - Các nút placeholder với mã `CHUA_PHAN_KHU_VUC` ("Chưa phân khu vực") và `CHUA_PHAN_CUM` ("Chưa phân cụm") được sắp xếp hiển thị ở cuối danh sách.
    - **Quy tắc cascade:**
      1. Đổi Khu vực: thu hẹp danh sách Cụm và Chi nhánh tương ứng, tự động reset Cụm và Chi nhánh về "Tất cả".
      2. Đổi Cụm: thu hẹp danh sách Chi nhánh thuộc cụm đó, tự động reset Chi nhánh về "Tất cả".
      3. Chọn Chi nhánh khi cấp trên đang là "Tất cả": tự động nhận diện và điền đúng Cụm và Khu vực chứa chi nhánh đó.
    - Đồng bộ `regionIds`, `clusterIds`, `siteIds` vào payload lọc toàn cục.
    - Với MANAGER/STAFF có đúng 1 chi nhánh được phân quyền: khóa cố định bộ chọn (disabled) vào chi nhánh đó, không cho phép chọn rộng ra ngoài phạm vi.
  - Cập nhật composable `useDashboardV2Filter.ts`: thêm `clusterIds`, chuẩn hóa mảng chuỗi loại bỏ giá trị rỗng/trắng.
  - Cập nhật store `src/stores/dashboardV2Locations.ts`: nạp đồng thời `tree`, `regions`, `clusters`, `branches` từ `api.tree()` với fallback an toàn.
  - Hỗ trợ bộ lọc cục bộ (FR-FLT-02): Các widget có bộ lọc riêng được cập nhật nhận đủ 3 cấp, thay đổi toàn cục ghi đè bộ lọc riêng (BR-FLT-05), hiển thị nhãn "Đang lọc riêng: …" theo BR-FLT-06.
- **File:** `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue`, `src/pages/dashboard-v2/composables/useDashboardV2Filter.ts`, `src/stores/dashboardV2Locations.ts`, `src/types/dashboard.d.ts`.
- **Test mới:** `tests/dashboard-v2/filterCascadeV2.spec.ts` (6/6 tests đạt).
  - Kiểm tra 3 quy tắc cascade.
  - Kiểm tra payload chứa `clusterIds`.
  - Kiểm tra các nút placeholder `CHUA_PHAN_KHU_VUC`, `CHUA_PHAN_CUM` được xếp cuối.
  - Kiểm tra khóa cố định khi MANAGER chỉ có 1 chi nhánh.

---

### Hạng mục 3 — Bảng Xếp Hạng và Heatmap Theo Cụm — commit `9feb386c`
- **Spec / Quy tắc:** FR-EX-07, FR-EX-08.
- **Nội dung thực hiện:**
  - Bổ sung phạm vi xem **Theo cụm** (bên cạnh Toàn hệ thống, Theo khu vực, Theo chi nhánh):
    - `ExecutivePerformanceRanking.vue`: Thêm nút chuyển scope `Theo cụm` (`data-test="ranking-scope-cluster"`), hiển thị cột tiêu đề "Cụm cửa hàng" khi chọn dimension `cluster`, đọc dữ liệu từ `ranking.clusters[]` mang `clusterId`, `clusterName`, `regionName`.
    - `BranchPerformanceHeatmap.vue`: Bổ sung `heatmapScope === 'cluster'` (`data-test="branch-heatmap-scope-cluster"`), hiển thị tiêu đề "Cụm cửa hàng", đọc trực tiếp các hàng từ `block.data.clusterRows[]`.
    - `ExecutiveChartFilters.vue`, `ExecutiveGmvNetRevenueChart.vue`, `ExecutiveRevenueWaterfall.vue`, `ExecutiveOrderEfficiencyChart.vue`, `ExecutiveGmvBreakdownChart.vue`, `ExecutiveView.vue`: Bổ sung thuộc tính `clusters`, `clusterId`, sự kiện `@cluster-change` và cập nhật nhãn phạm vi lọc cục bộ.
- **File:**
  - `src/pages/dashboard-v2/components/ExecutiveChartFilters.vue`
  - `src/pages/dashboard-v2/components/ExecutiveGmvBreakdownChart.vue`
  - `src/pages/dashboard-v2/components/ExecutiveGmvNetRevenueChart.vue`
  - `src/pages/dashboard-v2/components/ExecutiveOrderEfficiencyChart.vue`
  - `src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue`
  - `src/pages/dashboard-v2/components/ExecutiveRevenueWaterfall.vue`
  - `src/pages/dashboard-v2/views/ExecutiveView.vue`
  - `tests/dashboard-v2/executivePerformanceRanking.spec.ts`
- **Test:**
  - `tests/dashboard-v2/executivePerformanceRanking.spec.ts`: test chuyển grouping "Theo cụm" hiển thị hàng cụm từ `clusters[]` và đổi header sang "Cụm cửa hàng" (9/9 tests đạt).

---

### Hạng mục 4 — Biểu Đồ Order Aging 2 Giai Đoạn (QĐ-29, FR-OP-01) — commit `55f86796`
- **Spec / Quy tắc:** QĐ-29, FR-OP-01, AC-OP01-01.
- **Nội dung thực hiện:**
  - Viết lại `OrderAgingChart.vue`:
    - Hiển thị 2 hàng giai đoạn nằm ngang: **Đặt hàng** (`DatHang`) và **Hoàn thành đơn hàng** (`HoanThanhDonHang`). Xóa bỏ placeholder cũ và comment `TODO(QĐ-29)`.
    - Mỗi hàng xếp chồng (stacked horizontal bar) 4 xô thời gian:
      - 0–5 ngày: màu xanh `#10b981` (xô 1)
      - 6–10 ngày: màu vàng `#eab308` (xô 2)
      - 11–20 ngày: màu cam `#f97316` (xô 3)
      - > 20 ngày: màu đỏ `#ef4444` (xô 4)
    - Bộ chuyển đổi chỉ số **Số lượng** (`data-test="aging-toggle-quantity"`) / **Giá trị** (`data-test="aging-toggle-value"`).
    - Tooltip chi tiết theo chuẩn AC-OP01-01: hiển thị Giai đoạn, Tên xô tuổi, Số đơn (`formatCount` + "đơn"), Giá trị (`formatMoneyTooltip`).
    - Đánh dấu giá trị một phần khi `isValueComplete === false` hoặc `missingValueCount > 0`: hiển thị dòng ghi chú vàng cam *"Giá trị một phần (thiếu n đơn)"*.
    - Tôn trọng phân quyền và trạng thái block:
      - Khi `block.gmvHidden === true`: ẩn nút chuyển "Giá trị", ẩn số tiền trong tooltip, chỉ hiển thị số lượng đơn hàng.
      - Khi `block.dataStatus === 'unavailable'` hoặc không có dữ liệu: hiển thị khung trống chuẩn *"Không có dữ liệu tồn đọng"*.
    - Cơ chế tương thích ngược an toàn (backward compatibility) cho dữ liệu test cũ chưa có thuộc tính `stage`.
- **File:** `src/pages/dashboard-v2/components/OrderAgingChart.vue`.
- **Test mới:** `tests/dashboard-v2/orderAgingChartV2.spec.ts` (6/6 tests đạt).
  - Ánh xạ đúng 2 hàng `DatHang` và `HoanThanhDonHang` với 4 xô màu.
  - Kiểm tra toggle chuyển đổi Số lượng / Giá trị.
  - Kiểm tra đánh dấu giá trị một phần kèm `missingValueCount`.
  - Kiểm tra hành vi che giấu GMV (`gmvHidden`).
  - Kiểm tra tooltip hiển thị đúng định dạng.
  - Kiểm tra trạng thái trống khi không có dữ liệu hoặc `dataStatus === 'unavailable'`.

---

### Hạng mục 5 — Khắc Phục Tồn Đọng Heatmap V2 — commit `0e4726fd`
- **Spec / Review:** Phản hồi review Wave 3 (commit `5cb30638`), FR-EX-08.
- **Nội dung thực hiện:**
  - Cập nhật `src/components/report-dashboard/BranchPerformanceHeatmap.vue`:
    - Sử dụng helper `dashboardV2Api.heatmap()` (hoặc `this.api.heatmap`), loại bỏ hoàn toàn việc gọi raw không kiểm soát.
    - **Loại bỏ hoàn toàn fallback âm thầm** về endpoint legacy `/Admin/Report/BranchPerformanceHeatmap`. Khi API V2 trả về lỗi (kể cả 403 hoặc 503), hiển thị rõ ràng giao diện báo lỗi kèm nút "Thử lại" (`data-test="heatmap-error-state"`, `data-test="heatmap-retry-button"`).
    - Gửi đầy đủ bộ lọc toàn cục: `periodType`, `granularity`, `siteIds`, `clusterIds`, `regionIds`, `startAt`, `endAt`, `comparisonType`.
    - Tôn trọng thuộc tính block: hiển thị badge dữ liệu khi `dataStatus === 'partial'`, ẩn các chỉ số tiền tệ GMV / % Mục tiêu khi `gmvHidden === true`.
- **File:** `src/components/report-dashboard/BranchPerformanceHeatmap.vue`, `tests/dashboard-v2/branchPerformanceHeatmapV2.spec.ts`.
- **Test cập nhật:**
  - `tests/dashboard-v2/branchPerformanceHeatmapV2.spec.ts`:
    - Kiểm tra khi API V2 gặp lỗi (ví dụ 503), giao diện hiển thị trạng thái lỗi và **tuyệt đối không gọi** sang endpoint legacy `/Admin/Report/BranchPerformanceHeatmap`.
    - Kiểm tra request gửi đúng `periodType`.
    - Kiểm tra hiển thị `clusterRows` khi chuyển sang scope "Theo cụm".
    - Kiểm tra tôn trọng `dataStatus` và `gmvHidden`.

---

### Hạng mục 6 — Xử Lý Lỗi Identity 503 — commit `f80eda7f`
- **Spec / Contract:** Xử lý ngoại lệ dịch vụ Identity gặp sự cố (503 Service Unavailable).
- **Nội dung thực hiện:**
  - Cập nhật `src/pages/dashboard-v2/services/dashboardV2Api.ts`:
    - Khai báo thông điệp chuẩn: `IDENTITY_503_MESSAGE = 'Không kiểm tra được quyền truy cập (Identity). Vui lòng thử lại.'`.
    - Thêm helper `isIdentity503Error(error)` nhận diện mã lỗi 503 từ Axios response, fetch response hoặc error message.
    - Cập nhật `describeBlockFailure(error, fallback)`: khi phát hiện lỗi 503, trả về `{ state: 'error', message: IDENTITY_503_MESSAGE }`.
  - Cập nhật composable `useDashboardV2Access.ts`:
    - Bổ sung trạng thái `identity_error`, getter `isIdentityError`.
    - Khi API `Admin/V2/Dashboard/Access` trả về 503: ghi nhận trạng thái `identity_error`, **không** tự động fallback âm thầm sang phân quyền legacy trên token, giữ trang thái an toàn và cho phép gọi lại với cờ `{ force: true }`.
  - Cập nhật `src/pages/dashboard-v2/index.vue`:
    - Khi quyền truy cập gặp lỗi Identity 503 (`isIdentityError`): hiển thị khối thông báo lỗi chuẩn `IDENTITY_503_MESSAGE` với nút "Thử lại" (`data-test="dashboard-access-identity-503"`), không hiển thị dashboard rỗng.
- **File:** `src/pages/dashboard-v2/services/dashboardV2Api.ts`, `src/pages/dashboard-v2/composables/useDashboardV2Access.ts`, `src/pages/dashboard-v2/index.vue`, `tests/dashboard-v2/dashboardAccess.spec.ts`.
- **Test mới & cập nhật:**
  - `tests/dashboard-v2/identity503.spec.ts` (3/3 tests đạt):
    - Kiểm tra helper `isIdentity503Error` và `describeBlockFailure` xử lý chính xác status 503.
    - Kiểm tra `useDashboardV2Access` chuyển sang `identity_error` khi nhận 503 và không fallback legacy.
    - Kiểm tra `index.vue` hiển thị thông báo lỗi `IDENTITY_503_MESSAGE` và nút retry khi Access 503.
  - `tests/dashboard-v2/dashboardAccess.spec.ts`: cập nhật kiểm tra 503 và `describeBlockFailure` (18/18 tests đạt).

---

## 4. Danh sách các API Endpoint sử dụng

| Endpoint | Method | DTO Request | DTO Response | Mục đích sử dụng |
|---|---|---|---|---|
| `Admin/V2/Dashboard/Regions` | `GET` | — | `DataResult<List<DashboardRegionTreeAdminDto>>` | Lấy cây phân cấp Khu vực → Cụm cửa hàng → Chi nhánh phục vụ bộ lọc 3 cấp |
| `Admin/V2/Dashboard/Access` | `GET` | — | `DataResult<DashboardAccessResultAdminDto>` | Kiểm tra quyền truy cập Dashboard V2 và danh sách cửa hàng được phép |
| `Admin/V2/Dashboard/Executive` | `POST` | `DashboardV2InputAdminDto` (`regionIds`, `clusterIds`, `siteIds`, `periodType`, `startAt`, `endAt`) | `DataResult<ExecutiveDashboardV2Dto>` | Dữ liệu màn hình điều hành (bao gồm `ExecutiveRankingV2Dto.clusters[]`) |
| `Admin/V2/Dashboard/Heatmap` | `POST` | `DashboardV2HeatmapInputAdminDto` (`granularity`, `periodType`, `regionIds`, `clusterIds`, `siteIds`, `startAt`, `endAt`, `comparisonType`) | `DataResult<DashboardV2Block<HeatmapV2Dto>>` | Bản đồ nhiệt hiệu suất chi nhánh/cụm/khu vực (bao gồm `clusterRows[]`) |
| `Admin/V2/Dashboard/Operational` | `POST` | `DashboardV2InputAdminDto` | `DataResult<OperationalDashboardV2Dto>` | Dữ liệu vận hành (bao gồm `orderAging: DashboardV2Block<OrderAgingItemV2Dto[]>`) |
| `Admin/V2/Dashboard/Product` | `POST` | `DashboardV2InputAdminDto` | `DataResult<ProductDashboardV2Dto>` | Dữ liệu sản phẩm & tồn kho |
| `Admin/V2/Dashboard/Personnel` | `POST` | `DashboardV2InputAdminDto` | `DataResult<PersonnelDashboardV2Dto>` | Dữ liệu nhân sự |
| `Admin/V2/Region` | `GET` | — | `DataResult<List<RegionAdminDto>>` | Đọc danh mục khu vực (fallback) |

> **Lưu ý về các endpoint đã hủy (HTTP 410 Gone):**
> - `PUT Admin/V2/Region/Assignments` và `POST Admin/V2/Region/SeedFromStoreKpi` đã được loại bỏ hoàn toàn khỏi API client và typings của frontend. Toàn bộ thiết lập khu vực và cụm cửa hàng được quản lý tập trung tại HRM.
