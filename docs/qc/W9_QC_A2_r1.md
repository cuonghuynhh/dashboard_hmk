# QC W9 A2 (vòng 1): Bản đồ hiệu suất chi nhánh V2

Worktree `wt/gui-a2-heatmap`, nhánh `qc/w9-a2-heatmap`, base `222b9b26`, HEAD `7b457457` (2 commit: `517c7488`, `7b457457`).

## 1. Kết luận: ĐẠT (có 1 lỗi Trung bình về cổng ExecutiveView, nên sửa nhưng không chặn)

Số liệu tự chạy:
- `npx vue-tsc -b --noEmit`: 0 lỗi.
- `npx eslint src/pages/dashboard-v2`: 0 lỗi, 3 cảnh báo có sẵn ở `ExecutiveChartFilters.vue` (file không đổi).
- `vitest run tests/dashboard-v2 e2e/dashboard-v2` (1 lần, kèm file legacy 7 test chạy qua bản scratch): 64 file, 575 test: 574 pass, 1 fail. Lỗi duy nhất là `executiveView.spec.ts > overwrites every local period when the master period changes` bị "Test timed out in 5000ms" khi chạy song song (flake đã biết). Chạy riêng `executiveView.spec.ts` + `branchPerformanceHeatmapV2.spec.ts` (đã được lead khôi phục về HEAD): 2 file, 51/51 pass.
- 7 test legacy của `branchPerformanceHeatmapV2.spec.ts` (bản HEAD) vẫn pass với code mới.
- Đã xoá file scratch `__qc_tmp_legacy.spec.ts`; `git status` sạch.
- Component legacy: `git diff 222b9b26..HEAD -- src/components` rỗng, nên `BranchPerformanceHeatmap.vue` và `heatmapBands.ts` không đổi.

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| Component V2 mới, `<script setup lang="ts">`, mount trong ExecutiveView, legacy giữ nguyên | Đạt | `BranchPerformanceHeatmapV2.vue:1`, `ExecutiveView.vue:~800`; diff `src/components` rỗng |
| `ScopeViewFilter` testKey `heatmap`, 3 view, option giới hạn theo master | Đạt | `.vue:478-490`; spec "options limited by master" |
| `region`/`cluster`/`site` dùng `regionRows`/`clusterRows`/`siteRows` | Đạt | `scopeRows` `.vue:132-138` |
| Ids gửi server cùng ánh xạ với Xếp hạng, rỗng thì master | Đạt | `scopeRequestIds` dùng chung (`scopeViewOptions.ts`), `fetchData` `.vue:412`; `scopeViewRequest.spec.ts` |
| Mặc định `site`; đổi filter chung reset `site`, không ids | Đạt | `DEFAULT_SCOPE_VIEW`, watch `.vue:453-462`; test "reset khi đổi filter" |
| Nhãn "Đang lọc riêng: …" | Đạt | `.vue:530` |
| Header + cột đầu dính, footer tổng dính (`Tổng hệ thống`/`Tổng <master>`/`Tổng đã chọn (N)`) | Đạt | `.vue:547,577,614`; `totalsLabel` |
| Khung 12.5 hàng, hiện mọi hàng | Đạt | `scrollTableMaxHeight()` = 44 + 12.5*48 + 48 px, hàng `h-12`; dùng chung với Xếp hạng |
| Sắp mặc định GMV giảm dần (Traffic khi ẩn GMV); bấm tên sắp theo tên; bấm "Tổng kỳ" sắp theo chỉ số | Đạt | `sortMetric` `.vue:211`, `heatmapV2Sort.ts`; `heatmapV2Sort.spec.ts` |
| `PeriodSelect` thay tab, prop `options?` mặc định tất cả; truyền day/week/month | Đạt | `PeriodSelect.vue` diff, `.vue:494` |
| Đồng bộ master (quarter/year về month), override, reset, nhãn `Chu kỳ X`, refetch theo granularity | Đạt | `masterPeriod`, `periodOverridden`, `localScopeLabel`, `REQUEST_GRANULARITY` (1/2/3 khớp enum backend) |
| Dropdown `Chỉ số:` đúng 5 view đúng thứ tự | Đạt | `METRICS` `.vue:72-78` |
| Không quyền GMV: ẩn 2 view GMV, mặc định `% mục tiêu Traffic` | Đạt | `.vue:116-122`; test "không có quyền GMV" |
| Màu 3 băng, làm tròn 1 chữ số trước khi so (80 vàng, 80.1 xanh, 59.9 đỏ; chuyển đổi 75 vàng, 75.1 xanh, 49.9 đỏ) | Đạt | `heatmapV2Bands.ts` (`>80`, `>=60`; `>75`, `>=50`); `heatmapV2Bands.spec.ts`; emerald-500/amber-300/rose-500, chữ slate-900 |
| GMV/Traffic giữ thang tứ phân vị và chú giải cũ, tính trên hàng đang hiện | Đạt | `quartileScale` `.vue:177` |
| Chú giải "—" theo view | Đạt | `MISSING_TEXT` `.vue:81-87` khớp bảng task (GMV: "— Chưa có dữ liệu", không nhắc Traffic) |
| Tooltip cùng câu chữ, hiện thực tế/mục tiêu cho view % | Đạt | `tooltipLines`, `.vue:655` |
| `% mục tiêu Traffic` hiện "—" khi thiếu field | Đạt | `metricValue` trả `null` → `MISSING_VALUE_LABEL`; có test |
| Giữ nút Nhập/Import Traffic, modal, badge, loading/empty/error | Đạt | `.vue:508-534`; `DashboardV2Block` |
| API contract | Đạt | Body gồm `comparisonType`, `periodType`, `granularity`, `startAt`, `endAt`, `regionIds`, `clusterIds`, `siteIds`, khớp `DashboardV2HeatmapInputAdminDto` (Granularity Day=1/Week=2/Month=3). `trafficTarget`, `trafficTargetCompletion`, `hasTrafficTarget` khớp `HeatmapCellV2Dto` (api-int). Kiểu optional |
| Test (chuyển view/ids, option master, sticky/12.5, sort, period, 5 chỉ số, biên, chú giải, "—") | Đạt | 23 test trong `branchPerformanceHeatmapCardV2.spec.ts` + 3 spec unit; test ExecutiveView và e2e stub đã cập nhật, không xoá test |

## 3. Lỗi phát hiện

### Trung bình
**M1. Heatmap bị chặn bởi block branch performance (`ExecutiveView.vue:800`, `v-if="branchPerformance && branchState === 'ready'"`).**
Heatmap V2 tự gọi `/Heatmap` và không còn dùng dữ liệu branch performance (worker đã bỏ `branchHeatmapFilter`), nhưng vẫn phải chờ block khác. Hậu quả:
1. Nếu `/BranchPerformance` lỗi, trả rỗng hoặc chậm, heatmap không hiện dù API của nó khỏe; người dùng chỉ thấy khối lỗi mang tên "Bản đồ hiệu suất chi nhánh" với nút Thử lại gọi sai API.
2. Mỗi lần đổi bộ lọc chung, `branchState` về `loading` nên heatmap bị gỡ rồi mount lại, mất state (chỉ số `Chỉ số:` quay về mặc định, sort, tooltip). Watch `props.filter` trong component thực tế không chạy trong ExecutiveView; việc refetch đến từ `onMounted`. Trong hộp "Chỉ số:" việc mất lựa chọn là hành vi ngoài đặc tả (task chỉ yêu cầu reset scope và chu kỳ).
3. `DataStatusBadge data-test="branch-performance-status"` của block khác vẫn nằm phía trên heatmap, gây hiểu nhầm là badge của heatmap.

Đánh giá: có hại về thực tế (một block lỗi che block độc lập) nhưng không vi phạm yêu cầu nào của task A2 và worker đã ghi nhận. Đề xuất sửa: tách khối khỏi `branchPerformance`, mount `BranchPerformanceHeatmapV2` vô điều kiện trong `<section data-test="executive-heatmap-block">` (heatmap tự có loading/empty/error), và hoặc chuyển badge branch-performance sang chỗ khác, hoặc bỏ khỏi khối heatmap. Cập nhật các test ExecutiveView đang kiểm `branch-performance-status` cho phù hợp. Nên làm trong A2 hoặc một task tách riêng ngay sau.

### Thấp
**L1. `trafficSites` ở view region/cluster** (`.vue:302-306`): khi không chọn site và master không có `siteIds`, nút "Nhập Traffic" mở modal cho toàn bộ chi nhánh được phép, không giới hạn theo khu vực/cụm đang xem. Đề xuất: lọc `props.branches` theo `regionId`/`clusterId` của master hoặc của ids đã chọn (nếu `KpiScopeOption` có các field này), hoặc ghi chú là hành vi chủ ý.

**L2. `metric` bị reset khi heatmap remount** (xem M1.2); sẽ tự hết nếu sửa M1.

**L3. Tooltip view `GMV`/`Traffic`** chỉ hiện "Số đơn hàng"; không lỗi, task không yêu cầu thêm.

## 4. Ghi chú UX (tuỳ chọn)
- Tooltip ô "Tổng kỳ" và dòng tổng không bấm được: chấp nhận, khớp quyết định #5 của worker.
- Cân nhắc `aria-live` hoặc thông báo cho việc đổi chỉ số; hiện `select` có nhãn bao quanh nên a11y cơ bản ổn.
- Chưa kiểm trên trình duyệt thật (sticky, 12.5 hàng): cần kiểm tay một lần bằng mắt.
