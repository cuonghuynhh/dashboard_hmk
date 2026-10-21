# W9 QC C1, vòng 1

Worktree `wt/gui-c-polish` (nhánh `qc/w9-c-polish`), base `2e95363f`, 7 commit code + 1 commit change log. Phạm vi review: mục 1, 2, 6, 11, 13 của task C và mục epoch-ms do lead giao.

## 1. Kết luận: CHƯA ĐẠT

Lý do: có 1 lỗi Cao (nhãn trục của biểu đồ Hiệu quả đơn hàng không cập nhật khi đổi chu kỳ) và 1 lỗi Cao/Trung bình (ProductGrowthChart giả định `timeKey` luôn là tháng, sai so với backend). Phần còn lại tốt.

Số liệu tự chạy trong worktree:
- `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2`: **70 file, 717 test pass** (khớp change log).
- `npx vue-tsc -b --noEmit`: exit 0, 0 lỗi.
- `npx eslint src/pages/dashboard-v2`: exit 0, không lỗi, không cảnh báo.
- Không chạy lần hai của full suite (hạn chế bộ nhớ). `git status` worktree sạch. Không có thay đổi nào trong `src/components/report-dashboard/*`.

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| 1. Composable `useDismissable(isOpen, close, {root, clickOutside, esc})`, stack, cleanup | Đạt | `composables/useDismissable.ts`; `useDismissable.spec.ts` (stack, Esc, click ngoài, unmount, focus, modal lồng) |
| 1. Esc chỉ đóng lớp trên cùng, modal lồng đóng trong trước | Đạt | `onKeydown` chỉ gọi `topLayer()`; test "nested modals" dòng 143 |
| 1. Gỡ listener khi unmount / stack trống | Đạt | `onScopeDispose` + `detachListeners`; test "does not add listeners when no layer is open" |
| 1. Trả focus về trigger | Một phần | Chỉ khi đóng bằng Esc (không khi click ngoài hoặc đóng bằng nút). Xem lỗi 6 |
| 1. Esc cho Region, Import, Recompute, KPI modals, DataDetail, Treemap | Đạt | Đã gắn ở 8 modal; test Esc có cho region, import, recompute, dataDetail, KpiBulk. Không có test riêng cho KpiConfiguration/KpiVersionHistory/Treemap (Thấp) |
| 1. Modal VFM (heatmap): Traffic, BranchSaleDetail | Đạt | Cả hai đã có `esc-to-close` (Traffic: `!saving`; BranchSaleDetail: `true`). Không đổi legacy |
| 2. SearchableMultiSelect đóng khi click ngoài, click trong không đóng | Đạt | `searchableMultiSelect.spec.ts:87-92` |
| 2. ScopeViewFilter | Đạt | Dùng SearchableMultiSelect |
| 2. Giữ `closeOtherDropdowns` | Đạt | Không đổi; `@toggle` đồng bộ trạng thái |
| 2. Bộ lọc đa chiều, popover ⓘ MetricCard | Đạt (code) | `DashboardV2FilterBar.vue` (root bọc cả nút và panel), `MetricCard.vue`. Chưa có test riêng (Thấp) |
| 6. Formatter dùng chung trong `utils/` đủ 5 chu kỳ | Đạt | `timeAxisLabel.ts`; `timeAxisLabel.spec.ts` khớp bảng của task |
| 6. `hideOverlap: true`, `rotate: 0`, tuần 2 dòng rich | Đạt | `timeAxisLabelConfig` |
| 6. Áp dụng mọi trục thời gian | Một phần | GMV/DTT, Phân rã, Lũy kế, Tăng trưởng, GrowthChart, CashFlow, Anomaly, heatmap đã áp dụng. Hiệu quả đơn hàng sai (lỗi 1); ProductGrowth sai (lỗi 2) |
| 6. Heatmap: nhãn ngắn + `title` đầy đủ | Đạt | `BranchPerformanceHeatmapV2.vue:577` |
| 6. Khóa tuần căn đúng dữ liệu | Đạt | Formatter đọc theo index; test "week buckets stay aligned" |
| 11. Timeout 20s chỉ trong executiveView.spec | Đạt | `vi.setConfig({ testTimeout: 20000 })`. Việc stub 5 test chậm chưa làm (worker đã ghi chú) |
| 13a. Anomaly không unmount khi reload | Đạt | `loadAnomaly` chỉ `loading` khi chưa `ready`; overlay `anomaly-loading`; chống race `anomalyRequestSeq` |
| 13b. Retry và reload theo master filter đi qua `loadAnomaly` | Đạt | `loadOperationalBlock('anomaly')` ủy quyền; `@retry="loadAnomaly"` |
| 13c. Màu độ lệch tooltip zoom | Đạt | `#059669` khi ≥ 0, `#e11d48` khi < 0, xám khi null; test `orderEfficiency.spec.ts` |
| 13d. Ẩn "UPT > —" | Đạt | `template v-if="summaryUpt !== null"`; 2 test |
| Epoch-ms: hiển thị "DD/MM/YYYY HH:mm:ss" giờ VN | Đạt | `formatFreshnessDateTime`. Tôi tự tính `1792420511722` ra `19/10/2026 21:35:11` (UTC+7). Có test trong `dataFreshness.spec.ts` |
| Epoch-ms: `number\|string\|null` | Đạt | `DashboardV2Timestamp`, `normalizeTimestamp`, `toUtcMoment`, `timestampToEpochMs` |
| Recompute `fromDate`/`toDate` | Đạt | Backend (`DashboardRecomputeInputAdminDto`) nhận và trả chuỗi `yyyy-MM-dd`, không phải DateTime, nên không phải epoch; worker để nguyên, đúng. `formatJobDate` parse `YYYY-MM-DD` |
| `coveredFrom`/`coveredTo` kiểu số | Đạt | `coveredDate` quy về ngày lịch VN. Cả hai khả năng (epoch của 00:00 UTC hoặc 00:00 VN) đều ra cùng ngày, tôi đã tính thử |

## 3. Lỗi phát hiện

### Cao

**1. Nhãn trục thời gian của biểu đồ Hiệu quả đơn hàng bị "đóng băng"**
- Vị trí: `components/ExecutiveOrderEfficiencyChart.vue:123-127`.
- `const axis = { ..., axisLabel: timeAxisLabelConfig(chartPoints.value, props.granularity, ...) }` là hằng số thường, tính một lần lúc setup, không phải `computed`. `chartPoints` là `computed`, nhưng giá trị bị chụp một lần. `ExecutiveView.vue:539-547` đổi `efficiencyGranularity` (bộ chọn riêng của biểu đồ, hoặc đổi chu kỳ chung) mà không remount (không có `:key`).
- Kịch bản: mở Tuần, mount biểu đồ (nhãn `T40`...), chuyển sang Tháng. `labels.value` (khóa tooltip) đổi, nhưng formatter vẫn tra theo mảng nhãn tuần cũ. Trục hiển thị `T40`, `T41`... cho các cột tháng, hoặc rơi về nhãn dài nếu số bucket nhiều hơn mảng cũ. Cũng sai khi dữ liệu đổi (đổi bộ lọc, đổi phạm vi) mà không remount. Test hiện tại chỉ mount mới nên không bắt được.
- Sửa: biến `axis` thành `const axis = computed(() => ({ ... timeAxisLabelConfig(chartPoints.value, props.granularity, {...}) }))` và đổi 4 chỗ `...axis` thành `...axis.value` (dòng 220, 243, 287, 338). Thêm test: mount ở `week`, `setProps({ granularity: 'month' })`, kiểm `formatter('x', 0)` trả `T10/26`.

**2. ProductGrowthChart giả định `timeKey` luôn là tháng, sai với backend**
- Vị trí: `components/ProductGrowthChart.vue` (`timeAxisLabelConfig(..., 'month', ...)`).
- Đã đọc backend `report.api/Src/Application/Services/DashboardV2/DashboardV2Service.Product.cs` (`BuildGrowthPeriods`): `TimeKey` phụ thuộc loại kỳ. Tháng: `Th1` (hoặc `Th1/2026` khi phạm vi qua nhiều năm). Quý: `Q1/2026`. Năm: `2026`. Ngày: `dd/MM`. Tuần: `dd/MM–dd/MM` (ví dụ `01/08–02/08`, xem `DashboardV2ProductTests.cs:137-147`). `StartAt` là đầu kỳ (bị cắt theo phạm vi).
- Kịch bản: kỳ Ngày hoặc Tuần, mọi điểm đều ra nhãn `T8/26`, `hideOverlap` ẩn gần hết nhãn. Kỳ Quý hoặc Năm cũng hiện `T1/26`, sai nghĩa. Đây là hồi quy so với trước (trước hiện `timeKey` của server, đã đúng và đã ngắn).
- Sửa (chọn một):
  - (a) đơn giản nhất: bỏ `timeAxisLabelConfig` ở chart này, giữ `axisLabel: { color, margin, hideOverlap: true, rotate: 0 }` và `data` là `timeKey`, vì `timeKey` do server dựng đã là nhãn ngắn;
  - (b) truyền `granularity` từ filter (period của master) vào chart rồi dùng formatter chung. Cần map Ngày/Tuần/Tháng/Quý/Năm, và với tuần dùng `startAt`.

### Trung bình

**3. Chỉ "tooltip label" đầy đủ làm khóa bucket nhưng trục ngày đa năm mất năm ở nhãn ngắn**
- Vị trí: `timeAxisLabel.ts` (ngày: `DD/MM`); trước đây `formatBucketLabel` thêm năm khi phạm vi qua nhiều năm.
- Kịch bản: phạm vi 20/12/2025-10/01/2026, kỳ Ngày, trục chỉ có `31/12` rồi `01/01`, không có năm. Tooltip vẫn có năm nên chỉ ảnh hưởng đọc trục, đúng bảng của task. Ghi nhận; không bắt buộc sửa. (Xem mục 4 cho đề xuất tùy chọn.)

### Thấp

**4. Dòng import bị dính và có dòng trống thừa** do chèn tự động: `ProductGrowthChart.vue`, `AnomalyChart.vue`, `ExecutiveCumulativeTrendChart.vue`, `ExecutiveOrderEfficiencyChart.vue` có dạng `import { timeAxisLabelConfig } from '../utils/timeAxisLabel';  import { use } from 'echarts/core';` trên một dòng, và dòng trống ngay sau `<script setup>`. ESLint không bắt nên pass, nhưng xấu. Sửa: tách ra từng dòng, bỏ dòng trống thừa (chạy prettier cho các file này).

**5. Một số lớp nổi chưa đóng bằng Esc (kiểm kê, xem mục 5)**: tooltip thông tin của biểu đồ Hiệu quả đơn hàng (`ExecutiveOrderEfficiencyChart.vue:397`, hiển thị bằng CSS `group-hover`/`group-focus-within`); chỉ tắt khi rời chuột hoặc mất focus. Không chặn công việc (vi phạm nhẹ WCAG 1.4.13). Sửa nếu muốn: chuyển sang state `open` + `useDismissable` giống MetricCard.

**6. Focus return chỉ khi Esc, và click ngoài dùng `mousedown`**
- `useDismissable.ts`: đóng bằng click ngoài hoặc nút X không trả focus; `opener` là `document.activeElement` lúc mở nên với `<details>` bấm chuột trên Safari có thể là `body`. Chấp nhận được.
- Dùng `mousedown` thay vì `pointerdown`: trên thiết bị cảm ứng trình duyệt vẫn phát `mousedown` mô phỏng, nên thường vẫn chạy, nhưng `pointerdown` tin cậy hơn. Tùy chọn.

**7. `layer.close()` luôn gỡ lớp khỏi stack trước khi gọi**: nếu `close` bị chặn (ví dụ một modal chặn đóng khi đang lưu), lớp đã bị gỡ trong khi `isOpen` vẫn true; Esc lần sau sẽ không làm gì. Hiện không modal V2 nào chặn, nên chưa xảy ra. Có thể để gỡ lớp chỉ khi `isOpen` đổi sang false (watch đã làm việc này).

**8. Thiếu test**: KpiConfiguration và KpiVersionHistory Esc; Treemap Esc; MetricCard và bộ lọc đa chiều click ngoài; test năm biên (ISO tuần 53 ví dụ 28/12/2026 - 03/01/2027). Kiểm tay bằng code: `timeAxisLabel('2027-01-01','week')` cho `T53`, tooltip `Tuần 53 (28/12 – 03/01/2027)`, đúng.

**9. Mục 11**: chưa làm phần "stub 5 test chậm nhất" (đã ghi rõ trong change log); yêu cầu "full suite pass hai lần liên tiếp" mới chứng minh bằng file riêng. Chấp nhận.

## 4. Ghi chú UX (tùy chọn)
- Trục ngày qua nhiều năm: thêm năm vào `sub` dòng 2 ở ranh giới năm (ví dụ `01/01` + `2026` nhỏ).
- Với kỳ lẻ ở heatmap, `sub` hiện đầu tuần ISO chứ không phải ngày bắt đầu thật của bucket bị cắt; tooltip ghi "(một phần: n ngày)". Có thể dùng `bucket.startDate` thật cho `sub`.

## 5. Kiểm kê (extra a, b, c)

a) Lớp nổi tìm thấy bằng grep trong `src/pages/dashboard-v2`:
- Đóng được bằng Esc (và click ngoài với dropdown/popover): RegionHierarchyModal, DashboardV2RecomputeModal, DashboardImportModal, DataDetailModal, KpiConfigurationModal, KpiBulkUpdateModal, KpiVersionHistoryModal, treemap detail, SearchableMultiSelect (kể cả ScopeViewFilter), panel bộ lọc đa chiều, popover ⓘ MetricCard, hai modal VFM của heatmap (Traffic và BranchSaleDetail qua `esc-to-close`; chủ ý không đóng khi click ngoài).
- Chưa đóng bằng Esc: tooltip CSS của Hiệu quả đơn hàng (lỗi 5); tooltip heatmap (`pointer-events-none`, hover) và `v-tooltip` của DataFreshness (floating-vue, hover); các `<input type="date">` ẩn là native. Không có datepicker `@vuepic` hay menu cột/chỉ số tự dựng trong V2.
- Backdrop-click của modal: Region, Recompute, Import, DataDetail đóng; KpiConfiguration, KpiBulk, KpiVersionHistory, Treemap không có click backdrop (task không yêu cầu cho modal).

b) Stack: chỉ lớp trên cùng phản ứng; Esc gỡ lớp rồi gọi `close`; unmount gỡ qua `onScopeDispose`; listener window chỉ gắn khi có lớp. Dropdown trong modal sẽ đóng trước modal. Điểm yếu nhỏ: lỗi 7.

c) Nhãn trục: grep `bucketLabel` cho thấy nơi dùng là các chart (data category), `growthAnalysis.ts:191`, `orderEfficiency.ts:55` (chỉ hiển thị), không có sắp xếp hay khóa phụ thuộc chuỗi cũ. Tests phụ thuộc nhãn cũ đã được cập nhật (`dashboardPeriod`, `executiveTrendCharts`, `executiveFinancialCharts`), ý định giữ nguyên, không làm yếu. Nhãn ngày giờ luôn gồm năm nên khóa duy nhất qua năm. Cumulative dùng cùng `bucketLabel`; cấu hình trục theo `chartPoints` trong `computed` (đúng). Riêng Hiệu quả đơn hàng sai (lỗi 1).

d) ProductGrowthChart: xem lỗi 2.

e) Epoch-ms: xem bảng yêu cầu. Lưu ý thêm: scratchpad dùng chung trong phiên nên tôi không lưu log trong repo.
