# W9 QC C1, vòng 2

Worktree `wt/gui-c-polish` (`qc/w9-c-polish`), HEAD `899e24c3`. Đã review merge `28144753` và 5 commit sửa.

## 1. Kết luận: ĐẠT

Số liệu tự chạy (một lần): `vue-tsc -b --noEmit` 0 lỗi; `eslint src/pages/dashboard-v2 tests/dashboard-v2` 0 lỗi, 2 cảnh báo `vue/one-component-per-file` trong `useDismissable.spec.ts`; `vitest run tests/dashboard-v2 e2e/dashboard-v2`: 73 file, 750 test pass. Worktree sạch. Không đụng `src/components/report-dashboard/*`.

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| Merge: diff chỉ gồm thay đổi của C1 | Đạt | Integration đã tiến thêm 1 commit (`f55c3f61`, chuyển `docs/qc/W9_C2.md` ra khỏi pos.gui), nên `git diff qc/dashboard-v2-wave9..HEAD` hiện thêm dòng `docs/qc/W9_C2.md` (chỉ là lệch nhánh, không phải thay đổi C1). So với merge-base `14b8236a`: chỉ file C1 (useDismissable, timeAxisLabel, các chart/modal, test). Không có file bị xóa/đảo ngoài 4 file thêm mới |
| C2 không bị mất: ChangeBadge trong MetricCard | Đạt | `MetricCard.vue` vẫn import `ChangeBadge`; diff C1 chỉ thêm `useDismissable` + `ref="infoRoot"`. ChangeBadge còn dùng ở PersonnelStaffSelfView, GrowthAnalysisChart, ProductGrowthChart |
| "Mục tiêu GMV:" tooltip heatmap; "% đạt mục tiêu GMV" | Đạt | `BranchPerformanceHeatmapV2.vue:279`; `ExecutivePerformanceRanking.vue:364` |
| CashFlowChart/GrowthChart/BranchPerformance giữ đã xóa | Đạt | `ls components` chỉ còn `BranchPerformanceHeatmapV2.vue` |
| Helper đổi tên `scopeFilterLabel/scopeFilterPatch`, guard thuật ngữ, fallback gmv | Đạt | import còn trong heatmap; `terminology.spec.ts`, `noComboLabel.spec.ts` pass; không còn "Tốt hơn/Xấu hơn", không còn "Combo" hiển thị (chỉ comment/identifier) |
| Lỗi 1: trục Hiệu quả đơn hàng | Đạt | `axis` là `computed` dựa `chartPoints`+`props.granularity`; 4 chỗ `axis.value`; test đổi tuần/tháng/quý + đổi dữ liệu không remount |
| Lỗi 2: ProductGrowthChart dùng `timeKey` server | Đạt | `axisLabel` chỉ `rotate:0, hideOverlap:true`; test `it.each` 6 dạng |
| Lỗi 3: ngày đa năm có năm | Đạt | `timeAxisLabelConfig` tính `withYear` khi >1 năm lịch VN; nhãn `DD/MM/YY`; có test |
| Lỗi 4: import dính, tooltip Esc | Một phần | Tooltip ⓘ dùng `infoOpen` + `useDismissable` (hover/focus/click, Esc, click ngoài), có test. Import chưa gọn hẳn, xem lỗi Thấp 1 |
| useDismissable: `pointerdown`, chỉ gỡ lớp khi đã đóng, focus | Đạt | `onPointerDown` (capture), `dismiss()` gỡ lớp chỉ khi `isOpen=false`, watcher gỡ khi prop đổi; trả focus khi Esc và khi click ngoài vào vùng không nhận focus; test stack khi `close` không đổi `isOpen` |
| Test mới (Esc KpiConfig/KpiVersion/Treemap, outside click MetricCard + bộ lọc đa chiều, ISO tuần 53) | Đạt | trong 750 test pass |
| Change log không nằm trong pos.gui | Đạt | `git ls-files docs` không có `W9_C1.md`; commit `899e24c3` xóa; bản ở `dashboard_hmk/docs/qc/W9_C1.md` |
| Không hồi quy từ sửa | Đạt | Không thấy; số test tăng 717 -> 750, không test bị xóa/làm yếu trong diff C1 |

## 3. Lỗi phát hiện

Cao: 0. Trung bình: 0.

Thấp (1):
1. Định dạng import vẫn lệch dù change log nói đã tách. `ExecutiveOrderEfficiencyChart.vue` dòng 3 `import { useDismissable }` và `import {` (đầu khối `buildEfficiencyBuckets...`) bị mất thụt lề, có dòng trống thừa trước `import { timeAxisLabelConfig }`; `ProductGrowthChart.vue` còn dòng trống thừa sau `import { computed, ref }`. ESLint không bắt. Sửa: chạy prettier trên hai file đó.

## 4. Ghi chú UX (tùy chọn)
- Tooltip ⓘ Hiệu quả đơn hàng mở khi hover và đóng khi `mouseleave`; click rồi rời chuột sẽ đóng lại. Có thể cho click giữ mở (toggle riêng) nếu muốn dùng trên cảm ứng.
