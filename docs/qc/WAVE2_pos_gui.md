# WAVE 2 — Hoàn Thiện Frontend Dashboard V2 (pos.gui)

| Thuộc tính | Giá trị |
|---|---|
| Repo | `pos.gui`, nhánh local `qc/dashboard-v2-wave2` (kế thừa từ `qc/dashboard-v2-wave1`). **Chưa push.** |
| Spec | `docs/PRODUCT_SPEC_DASHBOARD.md` v2.1 |
| Tài liệu đối chiếu | `docs/qc/WAVE2A_report_api.md` (§6), `docs/qc/WAVE3A_report_api_rbac.md`, `docs/qc/INTEGRATION_report_api.md` |

## 0. Nền (baseline) và Bối cảnh

- Bắt đầu Wave 2 trên nhánh `qc/dashboard-v2-wave2` với baseline từ Wave 1 (`qc/dashboard-v2-wave1`): 39 file / 318 test đạt.
- 4 commit đầu của Wave 2 đã giải quyết:
  1. `bd9b4edb`: Server Access typings & role-based gating (spec §5, AC-ROLE-01..05, tích hợp RBAC từ `report.api`).
  2. `255f23f0`: Đủ 9 thẻ Executive KPI cards với subtitle chuẩn spec, thẻ Nợ treo thứ 9 (polarity nghịch), và backfill badge (FR-EX-01).
  3. `beebc48c`: Thác nước DTT 5 cột chuẩn bất biến INV-08, căn zero-axis cho biểu đồ GMV vs DTT, nhãn phân rã GMV (FR-EX-02, FR-EX-03, FR-EX-05).
  4. `cea2f127`: Widget hiệu quả đơn hàng AOV – Volume – UPT với 3 chế độ xem (đồng bộ cả 3, zoom phóng to đơn lẻ, combo cột/đường, variance biến động) (FR-EX-04).
- 3 commit tiếp theo hoàn thiện toàn bộ các tính năng còn lại của Wave 2:
  5. `8b4e7df1`: Biểu đồ xu hướng lũy kế trong kỳ (FR-EX-06) với nhịp tiến độ kế hoạch (plan pacing), trần nợ treo an toàn 1,5% GMV, xử lý mục tiêu null và phân quyền GMV.
  6. `60992aad`: Bảng xếp hạng hiệu quả (FR-EX-07) với % đạt mục tiêu (0 số lẻ), tỷ lệ trả hàng (ngưỡng đỏ > 12%), Top 5 / Xem tất cả, nhãn dòng tổng cộng theo phạm vi, và tab Sản phẩm tạm ẩn có TODO.
  7. `327745e8`: Biểu đồ phân tích tăng trưởng đa chiều (FR-EX-09) với dữ liệu kỳ trước thực tế `[S−n, S−1]`, tỷ lệ tăng trưởng chung không phụ thuộc bucketing (khớp thẻ KPI), trung bình có trọng số cho AOV/UPT, dual-axis chart và nhãn lọc riêng.

## 1. Kết quả kiểm tra trước / sau

| Hạng mục | Trước (bắt đầu Wave 2) | Sau (hoàn thành Wave 2) |
|---|---|---|
| `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | 39 file / 318 test đạt | **43 file / 388 test đạt** (+4 file, +70 test) |
| `npx vue-tsc -b --noEmit` | sạch (exit 0) | **sạch (exit 0)** |
| `npx eslint src/pages/dashboard-v2 src/components/report-dashboard` | 0 lỗi, 0 cảnh báo | **0 lỗi, 0 cảnh báo** |
| Prettier (hook pre-commit) | — | Mọi file staged đều đạt chuẩn `prettier --check` |
| Git status | — | Working tree sạch, mọi thay đổi đã commit |

## 2. Danh sách commit trên nhánh `qc/dashboard-v2-wave2`

1. `bd9b4edb feat(dashboard-v2): server Access typings and role-based gating (spec 5, AC-ROLE-01..05)`
2. `255f23f0 feat(dashboard-v2): nine Executive KPI cards with spec subtitles, Nợ treo and backfill badge (FR-EX-01)`
3. `beebc48c feat(dashboard-v2): 5-column waterfall, GMV vs DTT zero axis, GMV split labels and INV-08 tests (FR-EX-02, FR-EX-03, FR-EX-05)`
4. `cea2f127 feat(dashboard-v2): AOV - Volume - UPT widget with zoom, combo and variance modes (FR-EX-04)`
5. `8b4e7df1 feat(dashboard-v2): finish cumulative trend with plan pacing and debt ceiling (FR-EX-06)`
6. `60992aad feat(dashboard-v2): ranking table with target completion, return rate and top 5 (FR-EX-07)`
7. `327745e8 feat(dashboard-v2): growth analysis with previous period and dual-axis chart (FR-EX-09)`

## 3. Chi tiết từng hạng mục

### Mục 1 — Phân quyền truy cập Server & Role-based Gating (AC-ROLE-01..05) — commit `bd9b4edb`
- **Spec / QC:** §5 Phân quyền truy cập, AC-ROLE-01..05; `WAVE3A_report_api_rbac.md`; `INTEGRATION_report_api.md`.
- **Nội dung thực hiện:**
  - Cập nhật contract OpenAPI từ `report.api`: thêm `ExecutiveAccessDto`, `ExecutiveKpiSummaryV2`, `ExecutivePreviousPeriod`.
  - Bổ sung composable `useDashboardV2Access` gọi endpoint `GET Admin/V2/Dashboard/Access`, cache theo phiên người dùng, đồng bộ danh sách chi nhánh/khu vực được gán.
  - Tích hợp `canViewGmv` (suy ra từ `flags.gmvRead` của server) vào `useDashboardV2GmvPermission`. Khi bị ẩn quyền GMV (`gmvHidden`), che các trường doanh số gộp tuyệt đối thành placeholder hoặc "—", trong khi vẫn giữ tỷ lệ % hoàn thành mục tiêu.
  - Phân quyền theo tab và route guard (`routeGuard.ts`, `admin.vue`, `menu.ts`): ADMIN/CEO có toàn quyền; REGIONAL_DIRECTOR chỉ xem khu vực phụ trách; STORE_MANAGER/CASHIER bị giới hạn theo tab được cấp phép.
- **File:** `openapi/report.json`, `src/apis/schemas/report.d.ts`, `src/apis/definitions/report.runtime.json`, `src/pages/dashboard-v2/composables/useDashboardV2Access.ts`, `src/pages/dashboard-v2/composables/useDashboardV2GmvPermission.ts`, `src/pages/dashboard-v2/routeGuard.ts`, `src/layouts/admin.vue`, `src/pages/dashboard-v2/menu.ts`, `src/pages/dashboard-v2/index.vue`, `src/pages/dashboard-v2/services/dashboardV2Api.ts`, `src/pages/dashboard-v2/types.ts`.
- **Test:** `tests/dashboard-v2/dashboardAccess.spec.ts` (150 dòng), cập nhật `dashboardV2Route.spec.ts`, `dashboardV2Foundation.spec.ts`.

### Mục 2 — 9 Thẻ Executive KPI, Subtitle Spec, Nợ treo & Backfill Badge (FR-EX-01) — commit `255f23f0`
- **Spec / QC:** FR-EX-01, TC-01..05.
- **Nội dung thực hiện:**
  - Hiển thị đầy đủ 9 thẻ KPI ở màn hình Tổng quan Giám đốc:
    1. **GMV (Doanh số gộp):** "Tổng giá trị đơn hàng trước giảm giá & hủy"
    2. **Doanh thu thuần (DTT):** "Thực thu sau giảm giá, trả hàng & thuế"
    3. **Tỷ lệ hoàn tất:** "Đơn giao thành công / Tổng đơn"
    4. **Giá trị đơn TB (AOV):** "DTT / Số đơn hoàn tất"
    5. **Sản phẩm / đơn (UPT):** "Số lượng SP / Số đơn"
    6. **Số lượng đơn hàng (Volume):** "Tổng đơn phát sinh trong kỳ"
    7. **Khách hàng mới:** "Khách mua lần đầu tại hệ thống"
    8. **Tỷ lệ quay lại:** "Khách mua ≥ 2 lần / Tổng khách"
    9. **Nợ treo:** "Tiền hàng chưa thu từ đối tác VC/khách"
  - Thẻ Nợ treo áp dụng logic polarity nghịch: tăng nợ là cảnh báo tiêu cực (đỏ), giảm nợ là tích cực (xanh). So sánh chênh lệch tuyệt đối và tỷ lệ với kỳ trước.
  - Thêm huy hiệu đối soát dữ liệu lịch sử (`backfill badge`) qua `DataStatusBadge` khi backend báo cờ dữ liệu đã hiệu chỉnh.
- **File:** `src/pages/dashboard-v2/components/ExecutiveOverviewCards.vue`, `src/pages/dashboard-v2/components/MetricCard.vue`, `src/pages/dashboard-v2/components/DataStatusBadge.vue`.
- **Test:** `tests/dashboard-v2/executiveOverviewCards.spec.ts`, cập nhật 21 file test liên quan đến fixture quyền và hiển thị KPI.

### Mục 3 — Thác nước DTT 5 cột, GMV vs DTT Zero Axis & Phân rã GMV (FR-EX-02, FR-EX-03, FR-EX-05) — commit `beebc48c`
- **Spec / QC:** FR-EX-02 (Waterfall DTT), FR-EX-03 (GMV vs DTT trend), FR-EX-05 (GMV Breakdown), bất biến toán học INV-08.
- **Nội dung thực hiện:**
  - Triển khai thuật toán tính 5 cột thác nước trong `executiveWaterfall.ts`: GMV -> Giảm giá -> Trả hàng -> Thuế & Phí khác -> Doanh thu thuần.
  - Xác thực nghiêm ngặt bất biến INV-08: `DTT = GMV - Giảm giá - Trả hàng + Thuế/Phí`.
  - Căn chỉnh zero axis cho biểu đồ so sánh GMV vs DTT (`ExecutiveGmvNetRevenueChart.vue`) để điểm 0 của hai trục Y trùng khớp khi có giá trị âm hoặc lệch thang đo.
  - Chuẩn hóa nhãn phân rã doanh số theo kênh / hình thức trong `ExecutiveGmvBreakdownChart.vue`.
- **File:** `src/pages/dashboard-v2/utils/executiveWaterfall.ts`, `src/pages/dashboard-v2/components/ExecutiveRevenueWaterfall.vue`, `src/pages/dashboard-v2/components/ExecutiveGmvNetRevenueChart.vue`, `src/pages/dashboard-v2/components/ExecutiveGmvBreakdownChart.vue`.
- **Test:** `tests/dashboard-v2/executiveWaterfall.spec.ts` (100 dòng test chuyên sâu cho INV-08 và 5 cột), `tests/dashboard-v2/executiveFinancialCharts.spec.ts`, `tests/dashboard-v2/executiveTrendCharts.spec.ts`.

### Mục 4 — Widget Hiệu Quả Đơn Hàng AOV – Volume – UPT (FR-EX-04) — commit `cea2f127`
- **Spec / QC:** FR-EX-04 (Widget hiệu quả đơn hàng).
- **Nội dung thực hiện:**
  - Hỗ trợ 3 chế độ tương tác:
    - **Đồng bộ cả 3:** 3 mini-charts cho AOV, Volume, UPT với con trỏ hover đồng bộ trục thời gian.
    - **Zoom:** Nút phóng to từng chỉ số thành biểu đồ chi tiết lớn, kèm nút quay lại chế độ 3 chỉ số.
    - **Combo:** Kết hợp cột Volume với 2 đường xu hướng AOV và UPT trên cùng biểu đồ đa trục.
    - **Variance:** Xem tỷ lệ biến động chênh lệch so với kế hoạch hoặc kỳ trước.
- **File:** `src/pages/dashboard-v2/utils/orderEfficiency.ts`, `src/pages/dashboard-v2/components/ExecutiveOrderEfficiencyChart.vue`, `src/pages/dashboard-v2/views/ExecutiveView.vue`, `src/pages/dashboard-v2/components/ExecutiveChartFilters.vue`, `src/pages/dashboard-v2/utils/executiveTrendAggregation.ts`.
- **Test:** `tests/dashboard-v2/orderEfficiency.spec.ts` (130 dòng, kiểm tra toàn bộ logic chuyển đổi chế độ và tính toán AOV/Volume/UPT).

### Mục 5 — Biểu Đồ Xu Hướng Lũy Kế & Trần Nợ Treo (FR-EX-06) — commit `8b4e7df1`
- **Spec / QC:** FR-EX-06, BR-CMP-03, INV-05.
- **Nội dung thực hiện:**
  - Phạm vi lũy kế: hiển thị đúng theo khoảng lọc hiện tại với nhãn "Lũy kế trong kỳ" (không tự động ép từ ngày 01/01).
  - Chế độ "Tiến độ kế hoạch": tùy chọn "Đồng bộ cả 3" hiển thị 3 thẻ tổng quan và 3 biểu đồ nhỏ đồng bộ hover (GMV, DTT, Nợ treo); mỗi biểu đồ có nút Zoom và nút "← Quay lại xem đồng bộ cả 3".
  - Chế độ "Combo": cột theo từng bucket + đường lũy kế thực tế + đường kế hoạch. Khi chuyển từ "Đồng bộ cả 3" sang Combo, tự động chọn GMV và ẩn nút "Đồng bộ cả 3".
  - Pill tiến độ kế hoạch: tính toán nhịp độ kế hoạch kỳ vọng theo tỷ lệ thời gian đã trôi qua (`pace = target * elapsedRatio`). Hiển thị pill: "Vượt tiến độ +x%" (xanh) hoặc "Chậm tiến độ −x%" (đỏ), với `% = (cumulative − paced) / paced`.
  - Mục tiêu null (`Target == null`): hiển thị "Chưa thiết lập mục tiêu", ẩn đường kế hoạch và không hiển thị pill tiến độ.
  - Đánh giá nợ treo: so sánh với trần an toàn mặc định là 1,5% GMV kế hoạch. Nợ treo ≤ trần → "An toàn" (xanh); > trần → "Vượt trần" (đỏ). Nợ treo là chỉ số nghịch (tăng là tiêu cực). Trường hợp API chưa cung cấp dữ liệu nợ theo từng bucket, hiển thị thẻ nợ tổng và ghi chú TODO.
  - Phân quyền GMV: khi `gmvHidden = true`, ẩn hoàn toàn giá trị và đường mục tiêu GMV, hiển thị thông báo "Không có quyền xem GMV".
- **File:** `src/pages/dashboard-v2/utils/executiveCumulative.ts`, `src/pages/dashboard-v2/components/ExecutiveCumulativeTrendChart.vue`, `src/pages/dashboard-v2/views/ExecutiveView.vue`.
- **Test:** `tests/dashboard-v2/executiveCumulative.spec.ts` (210 dòng, 13 test cases bao phủ pace math, null target, trần nợ an toàn/vượt trần, zoom mode, combo switch, gmv hidden), cập nhật `executiveTrendCharts.spec.ts`, `gmvPermission.spec.ts`.

### Mục 6 — Bảng Xếp Hạng Hiệu Quả Chi Nhánh / Khu Vực (FR-EX-07) — commit `60992aad`
- **Spec / QC:** FR-EX-07, BR-FMT-03, BR-FMT-04.
- **Nội dung thực hiện:**
  - Tab "Chi nhánh / Khu vực": hiển thị bảng xếp hạng với cấu trúc cột: `#`, `Tên`, `GMV`, `Tỷ trọng GMV`, `DTT`, `Tỷ trọng DTT`, `% đạt mục tiêu`, `Tỷ lệ trả hàng`.
  - Cột `% đạt mục tiêu` (`TargetCompletion`): định dạng 0 số lẻ theo spec BR-FMT-03; khi null hiển thị "—".
  - Cột `Tỷ lệ trả hàng` (`ReturnRate`): tô đỏ khi tỷ lệ > 12,0% (cảnh báo nguy cơ trả hàng cao); giá trị đúng 12,0% không tô đỏ.
  - Sắp xếp mặc định theo GMV giảm dần. Hiển thị Top 5 mặc định với nút bấm mở rộng "Xem tất cả" và thu gọn "Top 5".
  - Dòng tổng cộng có nhãn linh hoạt theo phạm vi bộ lọc: "Tổng hệ thống" (khi filter khu vực là Tất cả) hoặc "Tổng <tên khu vực>" (khi đang lọc một khu vực cụ thể).
  - Nút chuyển "Theo Khu vực / Theo Chi nhánh" chỉ xuất hiện khi bộ lọc khu vực toàn cục đang chọn "Tất cả".
  - Tab "Sản phẩm": backend chưa có endpoint xếp hạng sản phẩm V2, tab được render ở trạng thái vô hiệu hóa (disabled) kèm tooltip "Sắp có" và ghi chú TODO; tuân thủ nghiêm ngặt nguyên tắc không dùng dữ liệu giả (mock data).
  - Các trường doanh số bị che do phân quyền (`gmvHidden` / null) hiển thị thống nhất ký tự "—".
- **File:** `src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue`.
- **Test:** `tests/dashboard-v2/executivePerformanceRanking.spec.ts` (185 dòng, 12 test cases kiểm tra định dạng cột, làm tròn 0 số lẻ, ngưỡng đỏ 12%, nhãn tổng cộng, toggle top 5, tab sản phẩm disabled, che quyền GMV).

### Mục 7 — Phân Tích Tăng Trưởng Đa Chiều & So Sánh Kỳ Trước (FR-EX-09) — commit `327745e8`
- **Spec / QC:** FR-EX-09, BR-CMP-01, BR-CMP-02, BR-CMP-07.
- **Nội dung thực hiện:**
  - 5 tabs chỉ số phân tích: GMV · DTT · AOV · Volume · UPT (ẩn tab GMV khi `canViewGmv = false`, tương thích ngược với các test key cũ).
  - So sánh kỳ trước theo quy tắc BR-CMP-01: xác định khoảng kỳ trước `[S−n, S−1]` (với `n` là số ngày trong kỳ hiện tại), gọi endpoint `PreviousPeriod` với `ComparisonType = 4`.
  - Biểu đồ 2 trục Y (Dual Y-axis): đường nét liền "Kỳ này", đường nét đứt "Kỳ trước", các cột "Tăng trưởng %" (màu xanh khi ≥ 0, màu đỏ khi < 0).
  - Tỷ lệ "Tăng trưởng chung" tuân thủ tuyệt đối BR-CMP-02:
    - Công thức: `(Σ current − Σ previous) / Σ previous`.
    - Không thay đổi khi chuyển đổi chu kỳ gom bucket (Ngày / Tuần / Tháng / Quý / Năm).
    - Khớp chính xác với % tăng trưởng hiển thị trên thẻ KPI tương ứng ở đầu trang.
    - Với AOV và UPT: tính toán theo trung bình có trọng số (`weighted`): AOV = `Σ DTT / Σ số đơn hoàn tất`; UPT = `Σ số lượng sản phẩm / Σ số đơn gộp`.
    - Mẫu số ≤ 0 hiển thị "—".
  - Dòng nhận định tăng trưởng (`growth insight`): tự động tìm bucket có mức tăng trưởng cao nhất và thấp nhất; hiển thị dấu chuẩn toán học (dùng ký tự "−" U+2212 cho số âm, ví dụ "−3,2%", không bao giờ phát sinh lỗi "+-3,2%").
  - Hỗ trợ đầy đủ gom bucket theo Quý (`quarter`) và Năm (`year`).
  - Hiển thị nhãn cảnh báo phạm vi cục bộ: "Đang lọc riêng: <phạm vi>" khi bộ lọc khu vực/chi nhánh trong widget khác với bộ lọc toàn cục của trang.
- **File:** `src/pages/dashboard-v2/utils/growthAnalysis.ts` (mới), `src/pages/dashboard-v2/components/GrowthAnalysisChart.vue`, `src/pages/dashboard-v2/views/ExecutiveView.vue`, `src/pages/dashboard-v2/types.ts`.
- **Test:** `tests/dashboard-v2/growthAnalysisChart.spec.ts` (11 tests chuyên sâu về bucketing, weighted AOV/UPT, insight text, local scope badge, dual-axis), `tests/dashboard-v2/executiveView.spec.ts` (29 tests).

## 4. Báo cáo kiểm tra và bằng chứng thực thi

Tất cả lệnh kiểm tra bắt buộc đều chạy thành công trên máy tính người dùng:

```bash
# 1. Chạy toàn bộ test suite Dashboard V2
NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2 2>&1 | tail -5
# Kết quả:
# Test Files  43 passed (43)
#      Tests  388 passed (388)
#   Start at  23:17:40
#   Duration  15.47s (transform 3.53s, setup 0ms, collect 62.90s, tests 17.58s, environment 9.38s, prepare 1.84s)

# 2. Kiểm tra TypeScript toàn dự án
npx vue-tsc -b --noEmit; echo "vue-tsc exit $?"
# Kết quả:
# vue-tsc exit 0

# 3. Kiểm tra ESLint trên các thư mục phụ trách
npx eslint src/pages/dashboard-v2 src/components/report-dashboard 2>&1 | tail -3
# Kết quả:
# (0 errors, 0 warnings, exit 0)

# 4. Kiểm tra trạng thái Git
git status --short
# Kết quả:
# (sạch, không có file chưa commit)
```

## 5. Thay đổi hợp đồng API (API Contract Changes)

> **Đính chính của PM (18/10/2026):** bản gốc của mục này do worker viết và có tên endpoint, tên trường không đúng với code (`/api/v2/Admins/...`, `canViewGmv` trên DTO, `PendingDebt`, `Backfilled`). Nội dung dưới đây đã được đối chiếu với DTO và route thật ở nhánh `qc/dashboard-v2` của report.api và với code giao diện.

1. **Endpoint Access — `GET Admin/V2/Dashboard/Access`** (`DashboardV2Controller`).
   - Trả về `DashboardV2AccessAdminDto`: `role` (`BOD`/`MANAGER`/`STAFF`/`NONE`), `allSites`, `allowedSiteIds`, `staffId`, `pages`, `flags { gmvRead, kpiWrite, trafficWrite }`, `legacyScopeMapped`.
   - Giao diện suy ra `canViewGmv` = `flags.gmvRead`, `canWriteKpi` = `flags.kpiWrite`, `canWriteTraffic` = `flags.trafficWrite` (`useDashboardV2Access.ts`). `canViewGmv` là tên nội bộ phía giao diện, không phải trường trên DTO.
2. **KPI tổng quan — `POST Admin/V2/Dashboard/Executive/Kpis`:**
   - Giao diện dùng các trường mới của đợt 2a: `OutstandingDebt`, `OutstandingDebtShareOfGmv`, `GrossOrderCount`, `UnitCount`, `Upt`, các khoản điều chỉnh `Return/Exchange/PreOrderCancelAdjustmentWithVat` kèm số đơn, các tỷ lệ `ReturnRate`/`ExchangeRate`/`PreOrderCancelRate`, và `PreOrderGmvWithVat`/`DirectGmvWithVat` kèm tỷ trọng.
   - Các trường nullable: `Target`, `TargetCompletion`, `GrowthRate`, `Aov*`.
   - Huy hiệu "đang backfill" hiện khi block ở trạng thái `partial` với `MockFields` chứa `RevenueEventHistory` hoặc `OutstandingDebt`. Không có trường `Backfilled`.
3. **Kỳ trước — `POST Admin/V2/Dashboard/Executive/PreviousPeriod`:** gửi `ComparisonType = 4` với khoảng `[S−n, S−1]`.
4. **Ẩn GMV (`gmvHidden`):** khi không có quyền GMV, server trả `null` cho mọi trường trong `DashboardV2ResponsePostProcessor.MaskedProperties`. Danh sách gồm GMV, các thành phần điều chỉnh, các tỷ lệ có mẫu số GMV, `VatAmount`, `Target`/`CumulativeTarget` tuyệt đối… (xem `INTEGRATION_report_api.md`). `TargetCompletion` (%) vẫn được trả về; giao diện hiển thị "—" hoặc thông báo "Không có quyền xem GMV".

## 6. Hạng mục chưa hoàn thành / để lại và lý do

1. **Tab "Sản phẩm" ở Bảng xếp hạng (`ExecutivePerformanceRanking.vue`):**
   - *Lý do:* Backend `report.api` hiện chưa có endpoint V2 trả về danh sách xếp hạng sản phẩm tổng thể cho Executive. Tab đã được đặt ở trạng thái `disabled`, kèm tooltip "Sắp có" và comment TODO rõ ràng, không sử dụng dữ liệu giả (tuân thủ nguyên tắc không fake data).
2. **Dữ liệu Nợ treo theo từng bucket thời gian (`ExecutiveCumulativeTrendChart.vue`):**
   - *Lý do:* DTO `ExecutiveTrendPoint` hiện tại chưa chứa trường nợ treo theo ngày/tuần/tháng (chỉ có `PendingDebt` tổng trên overview snapshot). Chế độ đồng bộ 3 chỉ số hiển thị thẻ nợ tổng và để lại ghi chú TODO chờ backend bổ sung nợ theo bucket trong trend DTO.
3. **Chu kỳ "Tuần" ở tầng Wire API backend:**
   - *Lý do:* Backend `PeriodTypes` hiện có 1 (Ngày), 2 (Tháng), 3 (Quý), 4 (Năm), chưa có enum Tuần. Client gửi `periodType = 1` (Ngày) và gom bucket Tuần theo ISO 8601 ở client.
4. **Tính năng Import Excel Traffic / Mục tiêu:**
   - *Lý do:* Thuộc phạm vi module quản trị cấu hình riêng, sẽ được bổ sung khi backend hoàn thiện API upload file mẫu V2.
