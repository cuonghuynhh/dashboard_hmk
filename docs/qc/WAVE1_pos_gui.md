# WAVE 1 — Sửa Frontend Dashboard V2 (pos.gui)

| Thuộc tính | Giá trị |
|---|---|
| Repo | `pos.gui`, nhánh local `qc/dashboard-v2-wave1` (cắt từ `origin/main`, cherry-pick `6ab6f78e`). **Chưa push.** |
| Spec | `docs/PRODUCT_SPEC_DASHBOARD.md` v2.0 |
| Phát hiện gốc | `docs/qc/QC_C_frontend.md` (§3, §4, §6) |
| Hợp đồng API mới | `docs/qc/WAVE1_report_api.md` (backend wave 1) |

## 0. Nền (baseline)

- `git cherry-pick 6ab6f78e` xung đột 6 file do khác format. Cách xử lý: 4 file V2 lấy bản `929` rồi chạy prettier theo cấu hình `main` (diff so với `main` đúng bằng các hunk của commit quyền GMV); 2 file `StaffPermissionEditor.vue`, `StaffRoleEditorModal.vue` giữ bản `main` rồi áp tay hunk (import `withDashboardV2GmvPermission` và gọi hàm này). Commit `9ab13a9f` bổ sung phần `StaffRoleEditorModal`.
- `main` đã tổ chức lại dependency: chạy lại `npm ci` (không còn thay đổi `yarn.lock` / `package-lock.json`).
- Test hợp đồng OpenAPI đọc `src/apis/definitions/report.json` (không còn trên `main`) nên trỏ sang `openapi/report.json` (commit `ed7b7019`).
- Commitlint của repo bắt buộc `<type>: ...` nên tiền tố là `feat(dashboard-v2):`, `fix(dashboard-v2):`, `test(dashboard-v2):` thay vì `dashboard-v2:` thuần.

## 1. Kết quả trước / sau

| Hạng mục | Trước (baseline trên nhánh mới) | Sau |
|---|---|---|
| `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | 33 file / 188 test đạt | **39 file / 318 test đạt** |
| `npx vue-tsc -b --noEmit` | sạch | **sạch** (exit 0) |
| `npx eslint src/pages/dashboard-v2 src/components/report-dashboard` | 0 lỗi, 0 cảnh báo | **0 lỗi, 0 cảnh báo** |
| Prettier (hook pre-commit) | — | các file thay đổi đều đã `--write` theo cấu hình `main` |

## 2. Từng hạng mục

### Mục 1 — Bộ định dạng tiền (BR-FMT-01/02/03/04) — commit `a94e96ef`
- **Spec / QC:** BR-FMT-01..04, TC-09, AC-EX01-05; FE-EX-04/05/06, FE-FMT-01..06, FE-EX-14.
- **File:** `utils/executiveFormatters.ts` (mới: `formatMoney`, `formatMoneyList` thêm 1 số lẻ khi làm tròn trùng nhau, `formatMoneyColumn` một đơn vị cho cả cột, `createMoneyAxisFormatter` một đơn vị cho cả trục theo max |x|, `formatMoneyTooltip`, `formatFullVnd`, `formatPercent`, `formatSignedPercent`, `formatTargetAchievement` (0 số lẻ), `formatPercentagePoints`, `formatCount`, `formatDecimal`; dấu "−" U+2212; "—" cho null/NaN/Infinity). Áp dụng trong `ExecutiveOverviewCards`, `MetricCard` (tooltip ₫ đầy đủ ở `title`), `ExecutiveGmvNetRevenueChart`, `ExecutiveGmvBreakdownChart`, `ExecutiveCumulativeTrendChart`, `ExecutiveRevenueWaterfall`, `ExecutivePerformanceRanking`, `CashFlowChart`, `BasketRefundCharts`, `TimePeakChart`, `OrderAgingChart`, `PersonnelScorecard`, `SalesLeaderboard`, `RegionalBenchmark`, `GrowthAnalysisChart`, `ProductGrowthChart`, `ProductView`, `KpiConfigurationModal` (nhãn "(₫)").
- **Test:** `tests/dashboard-v2/moneyFormatters.spec.ts` (đủ 7 ca TC-09: 12.262.400→"12 Tr", 5.722.400→"5,7 Tr", 1.508.500→"1,5 Tr", −1.630.000→"−1,6 Tr", 194.400→"194.400 ₫", 512.300.000→"512 Tr", 4.216.000.000→"4,22 Tỷ"; biên đơn vị; null/NaN/∞; cột/trục một đơn vị; tooltip); cập nhật `executiveOverviewCards`, `metricCard`, `executiveView`, `executiveChartAggregation`, `operationalView`, `personnelView`, `salesLeaderboard`, `dataStatus`, e2e (bỏ chuỗi "Tỷ VNĐ", "T/Tr", "Chưa đồng bộ" khi null).
- **Ghi chú:** thang hiển thị `Heatmap` (v1) được xử lý ở mục 7.

### Mục 2 — "Đang tải dữ liệu…" kẹt vĩnh viễn (QC_C §4) — commit `9ac126e3`
- **Spec / QC:** FR-CMN-03; FE-CMN-01..04, FE-FRM-10, FE-EX-51, §4.2–4.5.
- **File:** `components/DashboardV2Block.vue` (idle không còn hiển thị loading; loading = skeleton; rỗng = "Không có dữ liệu cho bộ lọc hiện tại"; lỗi = thông báo + "Thử lại"), `composables/useExecutiveBlockSnapshot.ts` (tự `load()` sau mọi lần invalidate nếu còn `idle` trừ widget bị ẩn, `timeoutMs` 30 s → lỗi "Quá thời gian…", `retries: 0`), `services/dashboardV2Api.ts` (cache in-flight theo endpoint + filter có đếm số bên chờ, hủy HTTP khi bên chờ cuối hủy, timeout 30 s, bỏ chuỗi fallback tuần tự: chỉ rơi về endpoint tổng hợp khi endpoint riêng trả 404/501; `normalizeKpiBlock` không còn tự gán `partial` + mock field; không gửi trường UI `period` lên API), `ExecutiveRevenueWaterfall.vue` + 3 biểu đồ (huy hiệu "Một phần chỉ số chưa đồng bộ" và danh sách trường thiếu chỉ khi `status = ready` **và** backend báo `mockFields`/`partial`), `views/ExecutiveView.vue` (Tăng trưởng chạy độc lập với `Promise.all`; widget ẩn do quyền GMV và khối so sánh khi tắt so sánh không tự tải).
- **Test:** `loadingStates.spec.ts` (idle ≠ loading, skeleton, empty, error + retry, Waterfall không hiện badge khi idle/loading/error, state machine idle→loading→ready, timeout, dedup, hủy khi mọi bên chờ hủy, không gửi `period`), `dashboardV2Api.spec.ts` (không chuỗi fallback, 404 mới fallback), cập nhật `retries: 0`.

### Mục 3 — Ẩn khối hoãn / cấm, không dùng mock (QĐ-08, QĐ-13, BR-DATA-01) — commit `926390c7`
- **QC:** FE-HR-01..03, FE-OP-09/10/12/15, FE-CMN-10.
- **File:** xóa `components/PersonnelMockBlocks.vue`; `views/PersonnelView.vue` (không còn KTV khúc xạ, Tiến độ KPI tuần, Gamification, Lab; để TODO FR-HR-04; leaderboard/scorecard rỗng → empty state); `views/OperationalView.vue` (Hình thức thanh toán / Chiến dịch / Tỷ lệ chuyển đổi chỉ hiển thị khi có dữ liệu thật; khối `mock` hoặc `partial` + rỗng → empty state; bỏ cột "Trạng thái dữ liệu: Minh họa"); Tỷ lệ chuyển đổi mới theo `Sites[]` với "Chưa có Traffic" khi `ConversionRate == null` và dòng "Thiếu Traffic n ngày"; `components/RegionalBenchmark.vue` (bỏ trục Traffic/Conversion/CSAT khi backend báo mock/thiếu); `mocks/index.ts` chỉ còn dùng cho test (có chú thích, không import runtime — test e2e kiểm tra).
- **Hợp đồng API mới (WAVE1_report_api):**
  - Trường nullable: KPI `Target/TargetCompletion/GrowthRate`, Trend `Target/CumulativeTarget/TargetCompletion`, Branch `Target/TargetCompletion/GrowthRate`, Product growth `RevenueGrowthRate/QuantityGrowthRate` (kể cả timeline), Anomaly `MovingAverage/ZScore`. UI hiển thị "—" / "Chưa thiết lập mục tiêu"; `BranchPerformance`, `ProductGrowthChart`, `AnomalyChart`, bộ gom bucket (target chỉ null khi mọi ngày null) xử lý null.
  - Trường mới: Anomaly `IsEvaluated/StandardDeviation/LowerBound/UpperBound` → `AnomalyChart` chỉ vẽ dải tin cậy cho điểm `IsEvaluated`.
  - **Enum giỏ hàng 5 mức** (<0,5 / 0,5–1 / 1–3 / 3–5 / >5 Tr): FE không có enum riêng (nhãn dựng theo `bucketIndex`) nên `BasketRefundCharts` dùng nhãn cố định `< 0,5 Tr · 0,5–1 Tr · 1–3 Tr · 3–5 Tr · > 5 Tr`, sắp theo `bucketIndex`. `src/apis/schemas/report.d.ts` và `openapi/report.json` không chứa enum này nên **không cần sửa tay**.
  - **Nhóm tuổi mới** `"<25"`, `"25-34"`, `"35-49"`, `">=50"`, `"Unknown"` → hiển thị `< 25`, `25–34`, `35–49`, `≥ 50`, `Không xác định`, có sắp thứ tự; tooltip tháp dân số hiển thị số dương (FE-OP-07).
  - Khối bị gỡ (WeeklyKpi, Gamification, Refractionist, Lab, MarketingCampaign trống, trạng thái `mock` không còn): coi `partial` + rỗng là empty state.
- **Test:** `operationalView.spec.ts` (fixture mới, payment live, campaign rỗng, conversion theo site, "Chưa có Traffic", dạng mock cũ → rỗng, trục benchmark bị bỏ), `personnelView.spec.ts`, `anomalyChart.spec.ts`, e2e.

### Mục 4 — Bộ lọc (§6, FR-FLT-01/02/04) và Mục 6 — Sparkline / INV-08 — commit `83048c42`
(Hai mục chung một commit vì cùng sửa `ExecutiveView.vue`.)
- **QC:** FE-FLT-01..07, FE-FLT-10, FE-EX-18..20, FE-EX-12, FE-FRM-04.
- **File:** `utils/dashboardPeriod.ts` (mới: Ngày/Tuần/Tháng/Quý/Năm mặc định Tuần, `defaultDateRange` — ngày 1 → cả tháng trước, `previousPeriodRange`, `validateDateRange` ≤ 3 năm, định dạng/parse DD/MM/YYYY), `composables/useDashboardV2Filter.ts` (`period` UI + `periodType` wire; từ chối khoảng ngày không hợp lệ, giữ khoảng hợp lệ gần nhất), `utils/executiveTrendAggregation.ts` (bucket ngày/tuần ISO/tháng/quý/năm, nhãn `DD/MM`, `Tuần NN (DD/MM–DD/MM)`, `MM/YYYY`, `Qn/YYYY`, `YYYY`, hậu tố `(một phần: n ngày)`), `components/DashboardV2FilterBar.vue` (select Chu kỳ, ô ngày dạng chữ DD/MM/YYYY kèm lịch ẩn, lỗi inline, cascade Chi nhánh → Khu vực), `ExecutiveChartFilters.vue` (thêm Theo Quý / Theo Năm, nhãn "Đang lọc riêng: <phạm vi>"), `ExecutiveView.vue` (sửa ánh xạ Quý→tuần / Năm→tháng; bỏ `recentTrendDateRange` cắt 3 tháng; đổi bucket không tải lại; `sparklineSnapshot` riêng theo bộ lọc toàn cục nuôi sparkline thẻ KPI).
- **Test:** `dashboardPeriod.spec.ts` (mặc định khoảng ngày kể cả ngày 1 và múi giờ VN, kỳ trước, validate, bucket tuần ISO + một phần, AC-FLT-04/05, Σ bucket = Σ ngày, null target, Quý/Năm, filter bar: danh sách chu kỳ, mặc định Tuần, DD/MM/YYYY, lỗi inline, giữ dữ liệu hợp lệ, > 3 năm, cascade), `executiveView.spec.ts` (nhãn "Đang lọc riêng", không cắt 3 tháng, sparkline không đổi theo bộ lọc cục bộ).
- **Ghi chú / quyết định:** backend `PeriodTypes` chưa có Tuần → Tuần gửi `periodType = 1` (Ngày) và gom tuần ở client (`PERIOD_WIRE_TYPE`, có TODO). Heatmap giữ quy ước tab riêng (3 = tuần, 4 = tháng).

### Mục 5 — So sánh kỳ và mũi tên (BR-CMP-01/04/05/06/07) — commit `5656fc2b`
- **QC:** FE-EX-07..11, FE-EX-13.
- **File:** `services/dashboardV2Api.ts` (`previousPeriodFilter` = `[S−n, S−1]`, gửi `comparisonType = 0` tới endpoint `Executive/PreviousPeriod`, backend đọc nguyên khoảng ngày), `ExecutiveOverviewCards.vue` (`calculateChange`: mẫu số ≤ 0 → null "—", tỷ lệ → điểm %, điều chỉnh so theo độ lớn; chân thẻ lấy kỳ so sánh từ `[S−n,S−1]`; TODO thẻ Nợ treo FR-EX-01), `MetricCard.vue` (mũi tên theo chiều thay đổi thật; màu theo `polarity`: thuận / nghịch / hướng về 0; "−" cho giảm; "+0,3 điểm %"), `ExecutiveCumulativeTrendChart.vue` ("Chưa thiết lập mục tiêu", ẩn đường kế hoạch).
- **Test:** `metricCard.spec.ts`, `executiveOverviewCards.spec.ts`, `dashboardV2Api.spec.ts`, `executiveTrendCharts.spec.ts`.

### Mục 7 — Heatmap (FR-EX-08) — commit `86c4890f`
- **QC:** FE-EX-37..40, FE-EX-46.
- **File:** `components/report-dashboard/heatmapBands.ts` (mới: 11 mức % Mục tiêu, 11 mức chuyển đổi, thang tứ phân vị 4 mức cho GMV/Traffic), `BranchPerformanceHeatmap.vue` (dùng thang mới, tab "% Mục tiêu · GMV · Traffic · Tỷ lệ chuyển đổi", thiếu Traffic → "—" màu trung tính + tooltip "Chưa nhập Traffic", chú thích màu, tiền theo `formatMoney`/`formatFullVnd`), `ExecutiveView.vue` (bỏ `.slice(0,10)`). Vẫn gọi endpoint v1.
- **Test:** `heatmapBands.spec.ts` (mọi biên: 80,0 xanh / 79,9 vàng, 115/100/90/…/30; chuyển đổi 90/85/80/75/67/58/50/40/30/20), `branchPerformanceHeatmapFilters.spec.ts`, `executiveView.spec.ts`.
- **Quyết định:** nhãn ô % Mục tiêu hiển thị **1 số lẻ** (khác BR-FMT-03 "0 số lẻ cho đạt mục tiêu") để 79,9% (vàng) không bị in thành "80%" (xanh); mức màu tính trên giá trị làm tròn 1 số lẻ.

### Mục 8 — Wizard KPI (AC-KPI04-03) — commit `c207f95c`
- **File:** `components/KpiConfigurationModal.vue` (doanh thu > 0 và bắt buộc, tỷ lệ chuyển đổi / độ hài lòng 0–100, không âm; lỗi inline `kpi-metric-error-n`; nút lưu bị chặn). Không đổi model KPI.
- **companyId:** `KpiManagementView` giữ `identityStore.user.id`. Đối chiếu backend: `KpiV2SaleTargetImportService` gán scope Công ty bằng **accountId** của người đăng nhập, nên giá trị hiện tại đúng quy ước backend; đã thêm chú thích, không đổi.
- **Test:** `kpiManagementView.spec.ts` (rỗng / 0 / âm / tỷ lệ > 100 / < 0 bị chặn; sửa xong lưu được).

### Mục 9 — Modal dữ liệu (FR-CMN-01) — commit `22c4e3f8`
- **File:** `components/DataDetailModal.vue` (mới: Esc, click nền, nút Đóng, tìm kiếm không dấu, sort 3 trạng thái, "Không có dữ liệu"; mở lại là mount mới nên reset tìm kiếm và sort), dùng cho chi tiết Order Aging (`OperationalView.vue`, giá trị có đơn vị) và chi tiết tồn kho (`InventoryDrilldown.vue`, slot).
- **Test:** `dataDetailModal.spec.ts`.

### Mục 10 — Cập nhật test
Các test khóa hành vi sai spec đã được sửa (chuỗi "Tỷ VNĐ" / "T" / "Tr", 3 cột, mock payment/campaign/conversion, `Drop rate`, giới hạn 3 tháng, Top-10 heatmap, `retries: 1`, nhóm tuổi / bucket cũ…). Bộ test mới: `moneyFormatters`, `loadingStates`, `dashboardPeriod`, `heatmapBands`, `dataDetailModal`, `anomalyChart`.

## 3. Không làm / để lại và lý do

- Ngoài phạm vi wave 1 (cần backend wave 2/3): thẻ Nợ treo thứ 9 (có TODO ở `ExecutiveOverviewCards.vue`), Waterfall 5 cột, FR-EX-04 AOV/Volume/UPT, tab Sản phẩm của bảng xếp hạng, import Traffic / mục tiêu Excel, phân quyền theo vai trò / MANAGER chỉ đọc KPI, chuyển heatmap sang V2, bộ lọc đa chiều (FR-FLT-03), lưu bộ lọc trên URL.
- Chu kỳ **Tuần** chưa có giá trị wire riêng ở `report.api` (xem mục 4). Product Growth dùng `periodType` do FE gửi nên chọn Tuần sẽ gom theo ngày ở backend.
- Widget Phân tích Tăng trưởng tự gom tuần/tháng theo logic riêng (chưa nhận Quý/Năm); bộ lọc cục bộ "Đang lọc riêng" chưa gắn nhãn cho Tăng trưởng và Lũy kế (Lũy kế không có bộ lọc cục bộ). Lũy kế vẫn tải từ 01/01 (FE-EX-30, ngoài danh sách wave 1).
- Nhãn bucket của Lũy kế theo khoảng lọc toàn cục nên các bucket trước ngày bắt đầu không gắn "(một phần)".
- Nút "KPI" v1 trong heatmap, tab Chu kỳ riêng của heatmap (Ngày/Tuần/Tháng) và `TrafficInputModal` giữ nguyên.
- Một số thuật ngữ tiếng Anh còn lại ("Net Revenue", "Direct/PreOrder", "Drop Rate"…) thuộc nhóm nhãn nhỏ, chưa sửa ở wave này.
- `ExecutiveMetricsGrid.vue` / `BranchExecutiveScorecards.vue` (v1, chứa "VNĐ") không được Dashboard V2 sử dụng nên không đổi.
- Giữ `retries: 1` ở Operational / Personnel (đã có timeout 30 s và dedup); chỉ các lời gọi Executive về `retries: 0`.
