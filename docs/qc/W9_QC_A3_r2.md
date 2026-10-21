# W9 QC A3 vòng 2

- Worktree `wt/gui-a3-cards` (`qc/w9-a3-cards`), base `222b9b26`, fix `a578a4de`, `ffeb6487`, `ee8c6da3`.

## 1. Kết luận: ĐẠT (0 Cao, 2 Trung bình, 3 Thấp; không chặn)

| Lệnh | Kết quả |
|---|---|
| `vitest run tests/dashboard-v2 e2e/dashboard-v2` | 61 file, 561 test pass |
| `vue-tsc -b --noEmit` | 0 lỗi |
| `eslint src/pages/dashboard-v2` | 0 lỗi, 0 cảnh báo |

## 2. Bảng yêu cầu (quyết định của lead)

| Quyết định | Kết quả | Bằng chứng |
|---|---|---|
| Zoom = 3 biểu đồ AOV/Volume/UPT như prototype | Đạt | `ExecutiveOrderEfficiencyChart.vue` `lg:grid-cols-3`, thứ tự AOV, Volume, UPT; AOV có trục phóng to, TB, footer Thấp/Cao nhất |
| Tooltip UPT/AOV như prototype | Đạt | `zoomTooltip`: giá trị, độ lệch vs TB, tổng SP + tổng đơn (UPT), Volume (AOV); bỏ GMV (đúng quyền) |
| Pill `Chênh lệch: x SP`, banner nhận xét, tooltip Best Practice | Đạt | `efficiency-upt-spread`, `efficiency-insight`, `efficiency-info` (hover + focus-within, aria-describedby). Chuỗi v-if/v-else-if sau banner vẫn đúng (banner mở chuỗi mới, combo/variance không bị ảnh hưởng) |
| Một định nghĩa độ lệch (chuẩn hóa theo ngày) | Đạt | tooltip zoom và variance cùng đọc `variance` (`buildVarianceSeries`); `EfficiencyBucket.partial` + ghi chú "Kỳ lẻ n ngày"; cột `volumeDev` thừa trong bảng chi tiết đã bỏ |
| flex-wrap mobile | Đạt (chỉ xác minh theo class) | 3 nhóm nút có `flex-wrap max-w-full` |
| AnomalyChart dùng ScopeViewFilter, dimension cố định, `scopeFilterPatch`, reset master, nhãn | Đạt | `OperationalView.vue` `loadAnomaly` (`dimension: 1`, patch từ `masterScope`), watch filter reset `{region, []}`, `anomaly-local-scope`; `anomalyChart.spec.ts`, `operationalView.spec.ts` |
| Growth tối đa 5 + disable + hint | Đạt | `SearchableMultiSelect.maxSelect` disable ô chưa chọn khi đủ, cắt `slice(0,max)`; hint `growth-max-hint` |
| Nhãn "So với" nêu cửa sổ thực | Đạt | `comparisonBasisText` dùng `getPreviousPeriodRange`, YoY trừ 1 năm; không còn WoW/MoM |
| Loading state | Đạt | "Đang tải dữ liệu so sánh…" thay cho hint chọn |
| Dòng tóm tắt theo series | Đạt | `growth-series-summary`, `growth-series-row-<id>` |
| Promise.all | Đạt | `ExecutiveView.vue` loadGrowthAnalysis: current, previous, yoy song song; số request không đổi; `previousYoy` null khi không YoY |
| `maxSelect` không đổi hành vi mặc định | Đạt | mặc định `undefined`: `maxReached` false, emit không cắt, `disabled` false. Chỉ `GrowthAnalysisChart` truyền; grep không nơi khác |

## 3. Lỗi phát hiện

### Cao: không có.

### Trung bình

**A3R2-01. Chọn entity ở AnomalyChart làm biểu đồ unmount, popover đóng sau mỗi lần chọn.**
`OperationalView.loadAnomaly` gọi `setState('anomaly','loading')`, mà `AnomalyChart` chỉ render khi `blockStates.anomaly === 'ready'`, nên cả card (kể cả `ScopeViewFilter` đang mở) biến mất và dựng lại. Chọn nhiều chi nhánh phải mở lại dropdown cho mỗi lựa chọn; select cũ không gặp vấn đề này vì chỉ chọn một lần. Sửa: giữ AnomalyChart mounted khi tải lại (truyền `loading` xuống/overlay như các card Executive) thay vì đổi `blockStates`; hoặc debounce áp dụng khi đóng popover.

**A3R2-02. Retry và tải lại theo bộ lọc chung của khối Bất thường bỏ qua metric/phạm vi đang chọn.**
`@retry="loadOperational('anomaly')"` và watch `filter` gọi `loadOperationalBlock('anomaly')` với `filter.value` thuần (không `metric`, không `dimension`). Hệ quả: đổi bộ lọc chung reset scope về master (đúng) nhưng `anomalyMetric` vẫn là `orderCount` trong khi dữ liệu tải về là metric mặc định; nút Thử lại sau lỗi cũng mất scope đã chọn. Phần metric đã có từ trước, nhưng giờ phạm vi cũng bị ảnh hưởng. Sửa: cho khối `anomaly` trong `loadOperational` gọi `loadAnomaly()` (và reset metric hoặc dùng metric hiện tại), `@retry` gọi `loadAnomaly`.

### Thấp

- **A3R2-03.** Tooltip độ lệch zoom không tô màu xanh/đỏ như prototype (chỉ chữ); tùy chọn dùng `<span style="color">`.
- **A3R2-04.** Banner nhận xét hiện `UPT > —` khi chưa có UPT (`formatUpt(null)`); nên ẩn vế đó khi thiếu dữ liệu.
- **A3R2-05.** Kiểm mobile 360px chỉ qua class, chưa có ảnh/đo thực; lead nên mở nhanh bằng trình duyệt nếu cần.

## 4. Hồi quy

Không thấy: test không bị xóa/làm yếu (561 > 553), component legacy `report-dashboard` không bị đụng, `ScopeViewFilter`/`SearchableMultiSelect` giữ nguyên mặc định. CashFlowChart/GrowthChart chết vẫn như vòng 1.
