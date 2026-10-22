# W9 FIX_MARKLINE: nhãn TB của đường trung bình bị cắt ở biểu đồ "Phóng to trục Y"

Worktree: `wt/gui-fix-markline` (branch `qc/w9-fix-markline`), chỉ sửa trong pos.gui.

## Vấn đề

Ở `ExecutiveOrderEfficiencyChart.vue`, chế độ "Phóng to trục Y (Chuẩn)" vẽ 3 biểu đồ (AOV, Volume, UPT) mỗi biểu đồ rộng khoảng 430px, xếp cạnh nhau trên màn 1430px và xếp chồng trên mobile. Đường trung bình (markLine) dashed có nhãn cuối ở vị trí mặc định `end`, nên nhãn đẩy ra quá mép phải và bị cắt: chỉ còn "TB 8", "TB:", "TB 3".

## Thay đổi

- `src/pages/dashboard-v2/components/ExecutiveOrderEfficiencyChart.vue`: hàm `averageLine` đặt `label.position: 'insideEndTop'`. Nhãn nằm trong vùng vẽ, phía trên đường, ở đầu phải. Nội dung nhãn giữ nguyên, không đổi formatter, vì chiều rộng nhãn (khoảng 90px) vừa với vùng vẽ.
- `tests/dashboard-v2/orderEfficiency.spec.ts`: thêm assert cho cả 3 biểu đồ zoom: `label.position === 'insideEndTop'` và formatter (`TB 1.000.000 ₫`, `TB: 4`, `TB 1,5`). Import thêm `formatMoney`.

## Quyết định

- Chọn `insideEndTop` thay vì tăng `grid.right`. Tăng lề phải sẽ làm hẹp vùng vẽ đã nhỏ (430px) và không đảm bảo nhãn không bị cắt trên mobile. Nhãn trong vùng vẽ không phụ thuộc chiều rộng card.
- Không đổi formatter (không rút gọn số AOV). Nhãn ngắn đủ, và tooltip vẫn hiển thị số đầy đủ.
- Các markLine khác trong dashboard-v2 (`ProductGrowthChart.vue`, `GrowthAnalysisChart.vue`, và markLine độ lệch trong chế độ variance của chính component này) đều có `label: { show: false }`, nên không có nhãn cuối để bị cắt. Không sửa.
- `src/components/report-dashboard/` không đụng tới.

## Kiểm chứng

- `npx vitest run tests/dashboard-v2/orderEfficiency.spec.ts`: 16/16 passed.
- `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2`: 74 files / 752 tests passed. Con số này khác baseline 57 files / 507 tests trong RULES.md, vì worktree này có thêm test trên nhánh hiện tại; không có test nào fail.
- `npx vue-tsc -b --noEmit`: exit 0.
- `npx eslint src/pages/dashboard-v2`: exit 0.

## Chưa làm

- Chưa kiểm tra trực quan trên trình duyệt thật. Cần QC xác nhận nhãn không chồng lên đường dữ liệu ở đầu phải khi giá trị cuối gần đường TB.
- Không có thay đổi API contract.
