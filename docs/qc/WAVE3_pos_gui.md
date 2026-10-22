# WAVE 3 — Hoàn Thiện Frontend Dashboard V2 (pos.gui)

| Thuộc tính | Giá trị |
|---|---|
| Repo | `pos.gui`, nhánh local `qc/dashboard-v2-wave3` (kế thừa từ `qc/dashboard-v2-wave2`). **Chưa push.** |
| Spec | `docs/PRODUCT_SPEC_DASHBOARD.md` v2.2 (các quyết định QĐ-28..31) |
| Tài liệu đối chiếu | `docs/qc/WAVE2B_report_api.md`, `docs/qc/WAVE3B_report_api.md`, `docs/qc/INTEGRATION_report_api.md` |

> **Đính chính của PM (18/10, đã đối chiếu code thật). Ưu tiên phần này nếu khác nội dung bên dưới:**
> - **Kiểm chứng độc lập:**
>   - Vitest `tests/dashboard-v2 + e2e/dashboard-v2`: **50 file / 420 test đạt**.
>   - `vue-tsc -b --noEmit`: sạch.
>   - eslint (`src/pages/dashboard-v2`, `src/components/report-dashboard`): sạch.
>   - Cây làm việc sạch. 11 commit trên `qc/dashboard-v2-wave2`, commit cuối `5519c082`.
> - **Danh mục khu vực:** route thật là `GET Admin/V2/Region` (operation `AdminV2RegionGet`). Không có `GET Admin/V2/Region/Catalog`. Wave 4 backend sẽ đổi nguồn sang HRM và thêm `GET Admin/V2/Dashboard/Regions`.
> - **Heatmap V2:**
>   - Request là `DashboardV2HeatmapInputAdminDto`. Ngoài bộ lọc chung `periodType/startAt/endAt/regionIds/siteIds` có thêm `granularity` 1 Ngày / 2 Tuần / 3 Tháng.
>   - Response là `DashboardV2Block<HeatmapV2Dto>` (`data`, `dataStatus`, `gmvHidden`…). Trong đó `HeatmapV2Dto` gồm `granularity`, `startDate`, `endDate`, `buckets[]`, `siteRows[]`, `regionRows[]`, `total`.
>   - **Không phải** `BranchPerformanceDashboardV2AdminDto` với `rows/columns` như mục 5.1 bên dưới ghi.
> - **Traffic:**
>   - Response Search là `DashboardTrafficSearchResultAdminDto` (`items`, `dataAsOf`), không có `siteNames`.
>   - Request History là `DashboardTrafficHistorySearchAdminDto` (`startAt`, `endAt`, `siteIds`). Giao diện xem lịch sử một ô bằng cách gửi 1 chi nhánh và khoảng thời gian của 1 ngày.
>   - Response History là `DashboardTrafficHistoryResultAdminDto` (`items`). Mã xung đột `traffic_version_conflict` là đúng.
> - **Tồn đọng, chuyển sang FE wave 4:** `BranchPerformanceHeatmap.vue` đang gọi thẳng `$api.report.post`.
>   - Khi V2 lỗi, code lặng lẽ fallback về `/Admin/Report/BranchPerformanceHeatmap`, nên che mất lỗi V2 và 403. Phải bỏ fallback.
>   - Request chưa gửi `periodType`.
>   - Code bỏ qua `dataStatus` và `gmvHidden`.
>   - Nên dùng helper `dashboardV2Api.heatmap()`.

## 0. Nền (baseline) và Bối cảnh

- Bắt đầu Wave 3 trên nhánh `qc/dashboard-v2-wave3` kế thừa từ `qc/dashboard-v2-wave2`: baseline ban đầu 43 file / 388 test đạt.
- Toàn bộ các hạng mục công việc Wave 3 đã được triển khai hoàn chỉnh qua 11 commit cục bộ:
  1. `ac1c3bcf`: Cập nhật contract OpenAPI và typings Wave 3 (`report.d.ts`, `report.json`, `types.ts`, `dashboardV2Api.ts`) (Hạng mục 0).
  2. `c960797e`: Hoàn thiện module Vận hành Operational (FR-OP-01..10) với trạng thái trống không fake data cho Order Aging, tooltip & tổng Σ cho Time Peak, 5 nhóm tuổi Demographics, 5 xô Basket, 6 nhóm Payment, Campaign table, Benchmark radar 6 trục, Anomaly band, Conversion Rate desc và Return/Exchange rates (Hạng mục 1).
  3. `687ea752`: Hoàn thiện module Sản phẩm & Tồn kho Product (FR-PR-01..06) với Growth Top 5 & comparison, Dimension analysis, Treemap 3 cấp drill-down kèm breadcrumb & modal, LensMatrix bubble chart, BrandDistribution và TopProducts với cảnh báo đỏ Stock ≤ ROP (Hạng mục 2).
  4. `ad985fda`: Cập nhật kỳ vọng độ rộng bảng Top sản phẩm trong responsive tests.
  5. `5111295f`: Hoàn thiện Bảng xếp hạng Nhân sự BOD/Manager (dòng chưa gán người bán, Top-3 xuất sắc, che GMV) và chế độ xem cá nhân STAFF tự phục vụ (FR-HR-01..02) (Hạng mục 3).
  6. `125bb79e`: Quản lý mục tiêu KPI toàn công ty (CRUD, trạng thái màu sắc, phân trang), Wizard thiết lập mục tiêu theo loại ngày (Trong tuần, Cuối tuần, Ngày lễ) kèm xem trước tổng tháng realtime, xử lý xung đột và Bulk update (FR-KPI-01..04) (Hạng mục 4).
  7. `7f37394c`: Modal import Excel dùng chung cho Traffic và KPI (tải mẫu, preview lỗi theo dòng/cột, confirm partial/all-or-nothing, lịch sử và tải file lỗi) (FR-IMP-01..02) (Hạng mục 5).
  8. `2c01ffab`: Nâng cấp Traffic sang tìm kiếm và cập nhật thủ công toàn công ty (`Traffic/Search` & `Traffic/Upsert`), xử lý xung đột phiên bản `ExpectedVersion`, validate số nguyên không âm & chặn ngày tương lai, phân quyền Store Manager và lịch sử chỉnh sửa từng ô (Hạng mục 6).
  9. `5cb30638`: Chuyển đổi Heatmap sang endpoint `POST Admin/V2/Dashboard/Heatmap`, ánh xạ độ chi tiết (1=ngày, 2=tuần, 3=tháng), định dạng nhãn xô một phần `(một phần: n ngày)`, hỗ trợ `regionRows` từ master và dọn dẹp nút/modal KPI v1 cũ (Hạng mục 7).
  10. `eedfcc76`: Bổ sung toàn bộ unit tests cho Traffic search/upsert/conflict/history và Heatmap V2 (Hạng mục 9).
  11. `5519c082`: Dọn dẹp các import type thừa liên quan đến API quản trị Region cũ (`DashboardRegionAssignmentItem`, `DashboardRegionSeedResult`).

> **Lưu ý đặc biệt về Hạng mục 8 (Region master admin):**
> Hạng mục 8 **ĐÃ BỊ HỦY BỎ** theo quyết định **QĐ-28** (Spec v2.2). Khu vực và Cụm cửa hàng hiện được quản lý tập trung bên HRM ("Ca & Chấm công → Thiết lập chấm công → Khu vực & Cụm cửa hàng"). Dashboard chỉ đọc danh mục khu vực (`GET Admin/V2/Region/Catalog`), không xây dựng trang bảo trì và không gọi các API `PUT Admin/V2/Region/Assignments` hoặc `POST Admin/V2/Region/SeedFromStoreKpi`. Giao diện hiển thị ghi chú chỉ dẫn: *"Khu vực & cụm cửa hàng được quản lý tại Thiết lập chấm công"*.

---

## 1. Kết quả kiểm tra trước / sau

| Hạng mục | Trước (bắt đầu Wave 3) | Sau (hoàn thành Wave 3) |
|---|---|---|
| `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | 43 file / 388 test đạt | **50 file / 420 test đạt** (+7 file, +32 test) |
| `npx vue-tsc -b --noEmit` | sạch (exit 0) | **sạch (exit 0)** |
| `npx eslint src/pages/dashboard-v2 src/components/report-dashboard` | 0 lỗi, 0 cảnh báo | **0 lỗi, 0 cảnh báo** |
| Prettier (hook pre-commit) | — | Mọi file staged đều đạt chuẩn `prettier --check` |
| Git status (`pos.gui`) | — | **Working tree sạch, không có file chưa commit** |

---

## 2. Danh sách commit trên nhánh `qc/dashboard-v2-wave3`

```text
5519c082 chore(dashboard-v2): clean up unused region imports in dashboardV2Api
eedfcc76 test(dashboard-v2): add unit tests for traffic search, upsert, conflict handling, history, and heatmap v2 (work item 9)
5cb30638 feat(dashboard-v2): branch performance heatmap v2 endpoint integration and cleanup (work item 7)
2c01ffab feat(dashboard-v2): company-wide traffic search, upsert, conflict handling and history (work item 6)
7f37394c feat(dashboard-v2): shared excel import modal for traffic and kpi (FR-IMP-01..02)
125bb79e feat(dashboard-v2): kpi management table, wizard with day-type targets, and version history (FR-KPI-01..04)
5111295f feat(dashboard-v2): personnel leaderboard and staff self view enhancements (FR-HR-01..02)
ad985fda test(dashboard-v2): update top products table width expectation in responsive tests
687ea752 feat(dashboard-v2): product and inventory analytics enhancements (FR-PR-01..06)
c960797e feat(dashboard-v2): operational analytics enhancements (FR-OP-01..10)
ac1c3bcf feat(dashboard-v2): update typings and openapi contract for wave 3 (work item 0)
```

---

## 3. Chi tiết từng hạng mục

### Hạng mục 0 — Cập nhật Typings & OpenAPI Schema — commit `ac1c3bcf`
- **Spec / QC:** Spec v2.1/v2.2; `WAVE2B_report_api.md`; `WAVE3B_report_api.md`.
- **Nội dung thực hiện:**
  - Cập nhật định nghĩa OpenAPI trong `openapi/report.json` và generate type TypeScript `src/apis/schemas/report.d.ts`.
  - Khai báo đầy đủ các interface và enum cho:
    - Heatmap V2 (`DashboardV2HeatmapFilter`, `BranchPerformanceDashboardV2`, `BranchPerformanceHeatmapRowV2`, `BranchPerformanceHeatmapBucketV2`, `DashboardV2HeatmapGranularities`).
    - Traffic V2 toàn công ty (`DashboardTrafficSearchResult`, `DashboardTrafficUpsertItem`, `DashboardTrafficHistoryItem`).
    - Quản lý mục tiêu KPI V2 (`DashboardKpiItem`, `DashboardKpiVersionItem`, `DashboardKpiSummary`, `DashboardKpiConflict`, `KpiDayTypeTargets`).
    - Import Excel V2 (`DashboardImportPreview`, `DashboardImportErrorRow`, `DashboardImportConflictRow`, `DashboardImportBatch`, `DashboardImportConfirmResult`).
  - Đảm bảo tính chịu lỗi (tolerance): các trường thiếu hoặc null đều có fallback an toàn hiển thị ký tự "—".
- **File:** `openapi/report.json`, `src/apis/schemas/report.d.ts`, `src/apis/definitions/report.runtime.json`, `src/pages/dashboard-v2/types.ts`, `src/pages/dashboard-v2/services/dashboardV2Api.ts`.

---

### Hạng mục 1 — Nâng cấp Module Vận hành (Operational §7.2, FR-OP-01..10) — commit `c960797e`
- **Spec / QC:** §7.2, FR-OP-01 đến FR-OP-10.
- **Nội dung thực hiện:**
  - **FR-OP-01 (Công đoạn đơn hàng - Order Aging):** Khi block không khả dụng hoặc chưa có dữ liệu, hiển thị trạng thái trống chuẩn: *"Chưa có dữ liệu công đoạn"*, không hiển thị dữ liệu giả (no fake data) và loại bỏ công đoạn giả định "Đo khám". Để lại comment TODO cho backend theo quyết định QĐ-29 (chia 2 giai đoạn: Đang xử lý vs Đã hoàn thành).
  - **FR-OP-02 (Khung giờ cao điểm - Time Peak):** Chỉ hiển thị dữ liệu cho kênh Tại cửa hàng (Store channel), tooltip chi tiết trên từng ô kèm số lượng và đơn vị, hiển thị hàng/cột tổng Σ chuẩn xác.
  - **FR-OP-03 (Nhân khẩu học - Demographics):** Chuẩn hóa 5 nhóm tuổi: `< 25`, `25–34`, `35–49`, `≥ 50`, `Không xác định`. Hỗ trợ chế độ xem GMV (Doanh số gộp).
  - **FR-OP-04 (Quy mô giỏ hàng - Basket Size):** Hiển thị 5 xô giá trị giỏ hàng chuẩn (`< 500k`, `500k–1M`, `1M–2M`, `2M–5M`, `≥ 5M`).
  - **FR-OP-05 (Phương thức thanh toán - Payment Methods):** Chuẩn hóa 6 danh mục chuẩn (Tiền mặt, Chuyển khoản, Thẻ POS, Ví điện tử, COD, Trả góp) + nhóm Khác nếu backend trả về. Tooltip hiển thị đầy đủ số tiền và tỷ trọng %.
  - **FR-OP-06 (Chiến dịch Marketing):** Bảng danh sách chiến dịch với các cột GMV, Doanh thu thuần, Số đơn, và AOV.
  - **FR-OP-07 (Radar chuẩn đối sánh - Benchmark Radar):** 6 trục đánh giá; hiển thị giá trị thực tế kèm đơn vị; chỉ số Index = (A/B) × 100; tùy chọn so sánh chuẩn với "Trung bình khu vực"; chặn hoàn toàn việc tự so sánh với chính mình.
  - **FR-OP-08 (Điểm dị biệt - Anomaly):** Bộ chọn chỉ số (Doanh thu thuần, Số đơn hàng, Tỷ lệ trả hàng) và bộ chọn đối tượng; dải an toàn (confidence band) chỉ hiển thị cho các điểm thời gian đã được hệ thống đánh giá.
  - **FR-OP-09 (Tỷ lệ chuyển đổi - Conversion Rate):** Danh sách chi nhánh được sắp xếp giảm dần theo tỷ lệ chuyển đổi; hiển thị nhãn *"Chưa có Traffic"* khi tỷ lệ bị null; trục hoành chuẩn hóa 0–100%.
  - **FR-OP-10 (Tỷ lệ đổi trả hàng):** Hiển thị đầy đủ 4 chỉ số đổi trả theo spec: M12 (Tỷ lệ trả hàng), M13 (Tỷ lệ đổi hàng), M13b (Tỷ lệ hủy đơn đặt trước), M13c (Tổng tỷ lệ điều chỉnh).
- **File:** `src/pages/dashboard-v2/components/OrderAgingChart.vue`, `src/pages/dashboard-v2/components/TimePeakChart.vue`, `src/pages/dashboard-v2/components/DemographicsChart.vue`, `src/pages/dashboard-v2/components/BasketSizeDistributionChart.vue`, `src/pages/dashboard-v2/components/PaymentMethodChart.vue`, `src/pages/dashboard-v2/components/MarketingCampaignTable.vue`, `src/pages/dashboard-v2/components/RegionalBenchmarkRadar.vue`, `src/pages/dashboard-v2/components/OperationalAnomalyChart.vue`, `src/pages/dashboard-v2/components/BranchConversionChart.vue`, `src/pages/dashboard-v2/components/ReturnExchangeRatesCard.vue`, `src/pages/dashboard-v2/views/OperationalView.vue`.

---

### Hạng mục 2 — Nâng cấp Module Sản phẩm & Tồn kho (Product §7.3, FR-PR-01..06) — commit `687ea752`, `ad985fda`
- **Spec / QC:** §7.3, FR-PR-01 đến FR-PR-06.
- **Nội dung thực hiện:**
  - **FR-PR-01 (Tăng trưởng sản phẩm - Product Growth):** Lấy Top 5 sản phẩm theo GMV; so sánh tùy chọn "Kỳ liền trước / Cùng kỳ năm trước"; số đường biểu đồ luôn khớp chính xác với số thực thể hiển thị trong chú giải (legend).
  - **FR-PR-02 (Phân tích đa chiều - Dimension Analysis):** Hiển thị động tất cả các chiều dữ liệu do API backend trả về; tooltip chi tiết gồm tên chiều, giá trị và đơn vị đo lường.
  - **FR-PR-03 (Cây phân cấp Treemap):** Hỗ trợ drill-down 3 cấp (Danh mục → Thương hiệu → Sản phẩm); breadcrumb điều hướng trực quan *"Tất cả › ..."*; modal xem chi tiết đồng bộ chính xác với các node đang hiển thị.
  - **FR-PR-04 (Ma trận độ khúc xạ - Lens Matrix):** Biểu đồ bong bóng đa trục SPH × CYL kết nối trực tiếp endpoint `Product/LensMatrix`; chú giải riêng biệt cho từng loại tròng kính.
  - **FR-PR-05 (Phân bổ thương hiệu - Brand Distribution):** Biểu đồ cơ cấu thương hiệu kết nối endpoint `Product/BrandDistribution`.
  - **FR-PR-06 (Top sản phẩm & Tồn kho):** Bảng danh sách hiển thị Tồn kho, Tồn kho an toàn (SS), Điểm đặt hàng lại (ROP); cảnh báo đỏ nổi bật khi Tồn kho ≤ ROP; định dạng số chuẩn nghìn phân tách chấm (`15.037`).
- **File:** `src/pages/dashboard-v2/components/ProductGrowthChart.vue`, `src/pages/dashboard-v2/components/DimensionAnalysisChart.vue`, `src/pages/dashboard-v2/components/ProductTreemapChart.vue`, `src/pages/dashboard-v2/components/LensMatrixChart.vue`, `src/pages/dashboard-v2/components/BrandDistributionChart.vue`, `src/pages/dashboard-v2/components/TopProductsTable.vue`, `src/pages/dashboard-v2/views/ProductView.vue`, `tests/dashboard-v2/responsiveBreakpoints.spec.ts`.

---

### Hạng mục 3 — Module Nhân sự (Personnel §7.4, FR-HR-01..02) — commit `5111295f`
- **Spec / QC:** §7.4, FR-HR-01, FR-HR-02.
- **Nội dung thực hiện:**
  - **FR-HR-01 (BOD / Store Manager Leaderboard):**
    - Bảng xếp hạng nhân viên hiển thị: Thứ hạng, Họ tên nhân viên, Chi nhánh, GMV, Thanh tỷ trọng GMV kèm %, Số đơn gộp, AOV.
    - Dòng *"Chưa gán người bán"* luôn được xếp ở dòng cuối cùng của bảng và không có số thứ hạng.
    - Huy hiệu Top-3 *"Nhân viên xuất sắc"* dành cho 3 nhân sự dẫn đầu.
    - Phân quyền GMV: khi người dùng bị che quyền GMV (`flags.gmvRead == false`), trường GMV hiển thị ký tự "—" trong khi các chỉ số số đơn, tỷ trọng % vẫn giữ nguyên.
  - **FR-HR-02 (Chế độ xem cá nhân STAFF):**
    - Tự động kích hoạt khi `Access.role == 'STAFF'`.
    - Thẻ GMV cá nhân kèm % tăng trưởng so với kỳ trước; thứ hạng cá nhân dạng *"Hạng r / n"* kèm thanh tiến độ trực quan.
    - So sánh AOV cá nhân với AOV trung bình của cửa hàng; điểm hài lòng khách hàng (hiển thị "—" nếu null).
    - Khối vinh danh *"Nhân viên xuất sắc"* chỉ xuất hiện khi cờ `IsTopPerformer == true`.
    - Loại bỏ hoàn toàn bảng KTV khúc xạ và không hiển thị mục tiêu cá nhân theo đúng đặc tả v2.1/v2.2.
- **File:** `src/pages/dashboard-v2/components/PersonnelLeaderboardTable.vue`, `src/pages/dashboard-v2/components/StaffSelfPerformanceCard.vue`, `src/pages/dashboard-v2/views/PersonnelView.vue`.

---

### Hạng mục 4 — Quản lý Mục Tiêu KPI Toàn Công Ty (KPI Management §7.5, FR-KPI-01..04) — commit `125bb79e`
- **Spec / QC:** §7.5, FR-KPI-01 đến FR-KPI-04.
- **Nội dung thực hiện:**
  - **Danh sách mục tiêu toàn công ty:** Bảng dữ liệu hiển thị Phạm vi, Đối tượng áp dụng, Chu kỳ, Phiên bản, Mục tiêu GMV, Mục tiêu DTT, Tỷ lệ chuyển đổi, Traffic, AOV, Trạng thái (Đang áp dụng: xanh lục, Bản nháp: vàng, Đã kết thúc: chàm, Lưu trữ: xám) và cột Thao tác (Sửa, Xóa, Lịch sử phiên bản).
  - Tìm kiếm theo từ khóa, lọc theo Trạng thái / Chu kỳ / Phạm vi, phân trang chuẩn 10 dòng/trang.
  - **Wizard thiết lập mục tiêu (KPI Wizard):**
    - Phạm vi áp dụng: Công ty, Khu vực, Chi nhánh.
    - Chu kỳ đánh giá: Năm (kèm chọn năm), Quý, Tháng, Chiến dịch (khoảng ngày bắt đầu - kết thúc).
    - Hỗ trợ *"Mục tiêu theo loại ngày"* cho trường hợp Chi nhánh × Tháng: 3 ô nhập chỉ tiêu doanh số/ngày cho Ngày trong tuần (Thứ 2 - Thứ 6), Cuối tuần (Thứ 7 - CN) và Ngày lễ, kèm bản tính toán xem trước tổng doanh số cả tháng theo thời gian thực (live preview).
    - Xác thực dữ liệu đầu vào: GMV > 0, các tỷ lệ phần trăm từ 0 đến 100%.
    - Hộp thoại xử lý xung đột mục tiêu thông minh: Ghi đè, Giữ mục tiêu cao nhất, hoặc Lưu dưới dạng bản nháp.
  - **Cập nhật hàng loạt (Bulk Update):** Tăng/giảm theo tỷ lệ % hoặc nhập giá trị tuyệt đối.
  - **Phân quyền:** Chỉ mở quyền chỉnh sửa khi người dùng có cờ `flags.kpiWrite == true`. Người dùng không có quyền chỉ có thể xem ở chế độ Read-only.
- **File:** `src/pages/dashboard-v2/components/KpiManagementTable.vue`, `src/pages/dashboard-v2/components/KpiWizardModal.vue`, `src/pages/dashboard-v2/components/KpiVersionHistoryModal.vue`, `src/pages/dashboard-v2/views/KpiManagementView.vue`.

---

### Hạng mục 5 — Modal Import Excel Dùng Chung (Imports §7.6, FR-IMP-01..02) — commit `7f37394c`
- **Spec / QC:** §7.6, FR-IMP-01, FR-IMP-02.
- **Nội dung thực hiện:**
  - **Thành phần dùng chung `DashboardImportModal.vue`:**
    - Tải file mẫu trực tiếp từ API (`GET Admin/V2/Import/Traffic/Template` hoặc `Kpi/Template`, hỗ trợ tùy chọn `storeFormat=true` cho định dạng data-store-kpi).
    - Tải file lên và Xem trước kết quả (`POST Admin/V2/Import/.../Preview`): tổng hợp số dòng hợp lệ, số dòng lỗi, số cảnh báo, số dòng ghi đè; bảng chi tiết lỗi rõ ràng theo từng dòng và từng cột dữ liệu; danh sách xung đột đối với KPI.
    - Xác nhận nhập dữ liệu (`POST Admin/V2/Import/.../Confirm`):
      - Traffic: hỗ trợ import từng phần (partial import) cho các dòng hợp lệ.
      - KPI: áp dụng cơ chế All-or-Nothing (vô hiệu hóa nút Xác nhận nếu có bất kỳ dòng dữ liệu nào bị lỗi); chọn chính sách giải quyết xung đột và trạng thái lưu trữ ("Áp dụng ngay" hoặc "Lưu bản nháp", mặc định là bản nháp); hỗ trợ bộ chọn tháng khi import định dạng data-store-kpi.
    - Hỗ trợ tải file báo cáo lỗi (`GET Admin/V2/Import/ErrorFile`) và Hủy phiên import (`POST Admin/V2/Import/Cancel`).
    - Tab Lịch sử import: danh sách các đợt import (`GET Admin/V2/Import/History`) kèm nút tải lại file gốc (`GET Admin/V2/Import/History/{id}/File`).
  - **Gắn kết vào giao diện người dùng:**
    - Nút "Import Traffic" đặt tại khu vực heatmap/traffic (yêu cầu cờ `flags.trafficWrite`).
    - Nút "Import mục tiêu" đặt tại trang quản lý KPI (yêu cầu cờ `flags.kpiWrite`).
- **File:** `src/pages/dashboard-v2/components/DashboardImportModal.vue`, `src/pages/dashboard-v2/views/KpiManagementView.vue`, `src/pages/dashboard-v2/components/BranchPerformanceHeatmap.vue`.

---

### Hạng mục 6 — Quản lý Traffic Toàn Công Ty: Tìm Kiếm, Cập Nhật & Lịch Sử — commit `2c01ffab`
- **Spec / QC:** Spec v2.1/v2.2 §7.1, §7.7; `WAVE3B_report_api.md`.
- **Nội dung thực hiện:**
  - Chuyển đổi modal nhập thủ công `TrafficInputModal.vue` sang kết nối 2 endpoint mới: `POST Admin/V2/Dashboard/Traffic/Search` (tra cứu traffic phạm vi toàn công ty) và `POST Admin/V2/Dashboard/Traffic/Upsert` (lưu cập nhật).
  - Quản lý phiên bản lạc quan (`ExpectedVersion`): gửi `ExpectedVersion` của từng bản ghi khi lưu. Khi backend trả về lỗi `traffic_version_conflict`, giao diện hiển thị thông báo toast cảnh báo dữ liệu đã bị thay đổi bởi người dùng khác và tự động tải lại phiên bản mới nhất từ máy chủ để tránh ghi đè mất mát.
  - Validate dữ liệu nghiêm ngặt: chỉ chấp nhận số nguyên không âm (`>= 0`, từ chối số thập phân và số âm), chặn hoàn toàn việc chọn ngày trong tương lai (ngày tối đa cho phép là ngày hiện tại).
  - Phân quyền theo vai trò: Cửa hàng trưởng (STORE_MANAGER) bị giới hạn chỉ được chỉnh sửa số liệu của các chi nhánh nằm trong danh sách được phân công (`allowedTrafficSiteIds`).
  - Lịch sử chỉnh sửa từng ô: popup hiển thị chi tiết lịch sử thay đổi của từng ô dữ liệu thông qua endpoint `POST Admin/V2/Dashboard/Traffic/History`.
  - Loại bỏ các API ghi region không dùng: xóa `assignments` và `seedFromStoreKpi` khỏi `dashboardRegionApi` theo QĐ-28.
  - Bổ sung ghi chú chỉ dẫn trong `RegionManagerModal.vue`: *"Khu vực & cụm cửa hàng được quản lý tại Thiết lập chấm công"*.
  - Thêm các comment TODO tham chiếu QĐ-28 (bộ lọc 3 cấp) trong `DashboardV2FilterBar.vue` và QĐ-29 (2 giai đoạn công đoạn đơn hàng) trong `OrderAgingChart.vue`.
- **File:** `src/pages/dashboard-v2/components/TrafficInputModal.vue`, `src/pages/dashboard-v2/components/BranchPerformanceHeatmap.vue`, `src/pages/dashboard-v2/components/RegionManagerModal.vue`, `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue`, `src/pages/dashboard-v2/components/OrderAgingChart.vue`, `src/pages/dashboard-v2/services/dashboardV2Api.ts`.

---

### Hạng mục 7 — Chuyển Đổi Endpoint Heatmap V2 & Dọn Dẹp — commit `5cb30638`
- **Spec / QC:** Spec v2.1/v2.2 §7.1, FR-EX-08; `WAVE3B_report_api.md`.
- **Nội dung thực hiện:**
  - Chuyển toàn bộ luồng lấy dữ liệu hiệu quả chi nhánh sang endpoint mới: `POST Admin/V2/Dashboard/Heatmap`.
  - Ánh xạ độ chi tiết (granularity mapping): `day` → 1, `week` → 2, `month` → 3.
  - Chuẩn hóa hàm biến đổi dữ liệu `mapHeatmapV2`:
    - Nhãn xô thời gian một phần ở biên kỳ lọc: hiển thị định dạng `(một phần: n ngày)` khi cờ `IsPartial == true`.
    - Hỗ trợ dữ liệu `regionRows` trực tiếp từ backend khi phạm vi bộ lọc là Khu vực (region scope), không cần client tự đoán hoặc tự gom nhóm.
    - Các ô chưa có số liệu traffic hiển thị trung tính ký tự "—" (không tô màu xanh/đỏ sai lệch).
  - Dọn dẹp mã nguồn: loại bỏ nút KPI v1 cũ và dependency modal `SaleTargetManagerModal` khỏi header của heatmap.
  - Cập nhật các bộ test hiện có để xác thực việc gọi đúng endpoint `Heatmap`.
- **File:** `src/pages/dashboard-v2/components/BranchPerformanceHeatmap.vue`, `src/pages/dashboard-v2/services/dashboardV2Api.ts`, `tests/dashboard-v2/branchPerformanceHeatmapFilters.spec.ts`.

---

### Hạng mục 8 — HỦY TRANG QUẢN TRỊ REGION THEO QUYẾT ĐỊNH QĐ-28
- **Spec:** Quyết định **QĐ-28** trong Spec v2.2.
- **Nội dung:**
  - **Hạng mục 8 (Region master admin) BỊ HỦY HOÀN TOÀN.**
  - Lý do: Khu vực và cụm cửa hàng hiện được quản trị tại HRM (POS: "Ca & Chấm công → Thiết lập chấm công → Khu vực & Cụm cửa hàng"); Dashboard V2 chỉ đọc danh mục khu vực để lọc dữ liệu chứ không chỉnh sửa hay phân công.
  - Toàn bộ các API `PUT Admin/V2/Region/Assignments` và `POST Admin/V2/Region/SeedFromStoreKpi` đã được gỡ bỏ khỏi frontend.
  - Các nơi từng dẫn tới quản trị region được thay thế bằng ghi chú: *"Khu vực & cụm cửa hàng được quản lý tại Thiết lập chấm công"*.
  - Dọn dẹp sạch sẽ các import type `DashboardRegionAssignmentItem` và `DashboardRegionSeedResult` trong commit `5519c082`.

---

### Hạng mục 9 — Bổ Sung Unit Tests Cho Wave 3 — commit `eedfcc76`
- **Spec / QC:** Bộ test toàn diện cho các tính năng mới của Wave 3.
- **Nội dung thực hiện:**
  - Tạo mới `tests/dashboard-v2/trafficInputModal.spec.ts` (7 test cases):
    1. Gửi đúng `expectedVersion` từ bản ghi tìm kiếm khi thực hiện upsert.
    2. Bắt lỗi `traffic_version_conflict`, hiển thị toast cảnh báo và tải lại phiên bản mới nhất từ server.
    3. Từ chối giá trị traffic không phải số nguyên (báo lỗi validate).
    4. Từ chối giá trị traffic âm (`< 0`).
    5. Chặn chọn ngày trong tương lai (tối đa là ngày hiện tại).
    6. Giới hạn Store Manager chỉ được chọn và sửa các chi nhánh trong `allowedTrafficSiteIds`.
    7. Mở popup lịch sử chỉnh sửa từng ô dữ liệu bằng API `Traffic/History`.
  - Tạo mới `tests/dashboard-v2/branchPerformanceHeatmapV2.spec.ts` (4 test cases):
    1. Gọi đúng endpoint `POST /Admin/V2/Dashboard/Heatmap` với granularity tương ứng.
    2. Hiển thị nhãn xô một phần dạng `(một phần: n ngày)` trên tiêu đề cột.
    3. Hiển thị danh sách `regionRows` trực tiếp từ backend khi scope là khu vực.
    4. Ô thiếu traffic hiển thị trung tính ký tự "—" và xác nhận đã loại bỏ nút KPI v1 cũ.
  - Tổng số test của dự án sau khi hoàn thành: **50 file test / 420 test cases đạt 100%**.
- **File:** `tests/dashboard-v2/trafficInputModal.spec.ts`, `tests/dashboard-v2/branchPerformanceHeatmapV2.spec.ts`.

---

## 4. Báo cáo kiểm tra và bằng chứng thực thi

Tất cả các lệnh kiểm tra bắt buộc đều chạy thành công trên máy tính người dùng:

```bash
# 1. Chạy toàn bộ test suite Dashboard V2
NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2 2>&1 | tail -5
# Kết quả:
#  Test Files  50 passed (50)
#       Tests  420 passed (420)
#    Start at  12:12:31
#    Duration  20.24s (transform 4.39s, setup 0ms, collect 84.52s, tests 24.32s, environment 14.16s, prepare 2.36s)

# 2. Kiểm tra TypeScript toàn dự án
npx vue-tsc -b --noEmit; echo "vue-tsc exit $?"
# Kết quả:
# vue-tsc exit 0

# 3. Kiểm tra ESLint trên các thư mục phụ trách
npx eslint src/pages/dashboard-v2 src/components/report-dashboard 2>&1 | tail -3
# Kết quả:
# (0 errors, 0 warnings, exit 0)

# 4. Kiểm tra trạng thái Git trong pos.gui
git status --short
# Kết quả:
# (sạch, không có file chưa commit)
```

---

## 5. Thay đổi hợp đồng API (API Contract Changes)

1. **Endpoint Heatmap V2 — `POST Admin/V2/Dashboard/Heatmap`:**
   - Thay thế việc gọi trực tiếp branch performance cũ bằng endpoint heatmap chuyên dụng `POST Admin/V2/Dashboard/Heatmap`.
   - Request DTO: `DashboardV2HeatmapFilterAdminDto` với `granularity`: 1 (Ngày), 2 (Tuần), 3 (Tháng).
   - Response DTO: `BranchPerformanceDashboardV2AdminDto` chứa `rows` (chi nhánh), `regionRows` (khu vực) và `columns` (kèm cờ `isPartial`, `partialDays`).
2. **Endpoint Quản lý Traffic Toàn Công Ty:**
   - `POST Admin/V2/Dashboard/Traffic/Search`: Tìm kiếm bản ghi traffic theo khoảng ngày và danh sách chi nhánh. Trả về `DashboardV2TrafficSearchResultAdminDto` gồm `items` và `siteNames`.
   - `POST Admin/V2/Dashboard/Traffic/Upsert`: Cập nhật/thêm mới danh sách traffic. Gửi kèm `expectedVersion`. Trả về `traffic_version_conflict` nếu phiên bản trên DB đã thay đổi.
   - `POST Admin/V2/Dashboard/Traffic/History`: Lịch sử chỉnh sửa từng ô theo `siteId` và `date`. Trả về danh sách `DashboardV2TrafficHistoryItemAdminDto`.
3. **Endpoint Quản lý Mục Tiêu KPI V2 — `Admin/V2/Kpi`:**
   - Hỗ trợ đầy đủ bộ CRUD và hành động vòng đời: `Activate`, `Summary`, `Evaluate`, `End`, `Archive`, `ResolveConflict`, `BulkUpdate`, `Delete`, `{id}/Versions`, `MigrateSaleTargets`.
   - Các trường chỉ tiêu theo loại ngày: `GmvWeekdayDaily`, `GmvWeekendDaily`, `GmvHolidayDaily`.
4. **Endpoint Import Excel V2 — `Admin/V2/Import`:**
   - Tải file mẫu: `GET Traffic/Template`, `GET Kpi/Template` (tham số `storeFormat=true` cho định dạng data-store-kpi).
   - Preview và Confirm: `POST Traffic/Preview`, `POST Traffic/Confirm`, `POST Kpi/Preview`, `POST Kpi/Confirm`.
   - Tiện ích: `POST Cancel`, `GET ErrorFile`, `GET History`, `GET History/{id}/File`.
5. **Loại bỏ các API ghi Region:**
   - Theo quyết định QĐ-28, frontend đã gỡ bỏ hoàn toàn việc gọi `PUT Admin/V2/Region/Assignments` và `POST Admin/V2/Region/SeedFromStoreKpi`.
   - Chỉ giữ duy nhất API đọc `GET Admin/V2/Region/Catalog` để nạp danh mục khu vực cho bộ lọc.

---

## 6. Hạng mục chưa hoàn thành / để lại và lý do

1. **Hạng mục 8 (Region master admin):**
   - *Tình trạng:* **BỊ HỦY THEO QUYẾT ĐỊNH QĐ-28.**
   - *Lý do:* Chuyển giao toàn bộ việc bảo trì khu vực và cụm cửa hàng sang HRM (Thiết lập chấm công). Dashboard V2 chỉ đọc dữ liệu catalog.
2. **Bộ lọc 3 cấp (Khu vực → Cụm cửa hàng → Chi nhánh) (QĐ-28):**
   - *Tình trạng:* **Tạm hoãn, để lại comment TODO trong `DashboardV2FilterBar.vue`.**
   - *Lý do:* Backend `report.api` đang trong quá trình phát triển để cung cấp danh sách cụm cửa hàng tương thích. Giao diện sẽ bổ sung ngay khi backend hoàn tất.
3. **Phân loại 2 giai đoạn công đoạn đơn hàng Order Aging (QĐ-29):**
   - *Tình trạng:* **Tạm hoãn, để lại comment TODO trong `OrderAgingChart.vue`.**
   - *Lý do:* Backend đang thực hiện điều chỉnh API phân chia thành 2 giai đoạn (Đang xử lý vs Đã hoàn thành). Khối hiện tại hiển thị trạng thái chuẩn "Chưa có dữ liệu công đoạn".
4. **Khối Thử nghiệm Lab (QĐ-31):**
   - *Tình trạng:* **Ẩn toàn bộ theo quyết định QĐ-31.**
   - *Lý do:* Quyết định nghiệp vụ giữ ẩn khối Lab trong giai đoạn hiện tại.
