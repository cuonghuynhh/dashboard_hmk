# WAVE 7 – pos.gui: bộ chọn "Chu kỳ" trong thẻ biểu đồ

Nhánh: `qc/dashboard-v2-wave7` (từ `qc/dashboard-v2-wave5` @ `de9d4a78`). Chỉ commit local, chưa push.

## Mục tiêu
Bộ chọn "Chu kỳ" trong mỗi thẻ biểu đồ là dropdown giống hệt bộ lọc chung, đồng bộ với bộ lọc chung và vẫn cho phép ghi đè cục bộ (FR-FLT-02, BR-FLT-05, BR-FLT-06, FR-FLT-05).

## Các bước

| Bước | Nội dung | File chính | Test |
|---|---|---|---|
| 1 | Component dùng chung `PeriodSelect` (cùng `PERIOD_OPTIONS`, h-9, rounded-lg, border-slate-200; khi `overridden` viền indigo + nút "↺ Theo bộ lọc chung" emit `reset`). Master filter dùng lại, giữ `data-test="dashboard-period"`. `ExecutiveChartGranularity` và `DashboardPeriod` là cùng một kiểu (`day/week/month/quarter/year`), không cần mapping. | `components/PeriodSelect.vue`, `components/DashboardV2FilterBar.vue` | 493 test cũ vẫn pass |
| 2 | Các thẻ GMV-vs-DTT, Hiệu quả đơn, Phân rã GMV (qua `ExecutiveChartFilters`), Xu hướng lũy kế và Phân tích tăng trưởng dùng `PeriodSelect` thay chip "Theo Ngày … Theo Năm". `ExecutiveView` tính `overridden = chu kỳ thẻ !== resolvePeriod(filter)`; `reset` đưa về chu kỳ chung; `syncChildFilters()` vẫn ghi đè tất cả khi đổi bộ lọc chung. **Phát hiện:** Phân tích tăng trưởng trước đây không nhận chu kỳ chung (mặc định `day`); nay nhận qua `growthGranularity` + ghi đè cục bộ. | `ExecutiveChartFilters.vue`, `ExecutiveCumulativeTrendChart.vue`, `GrowthAnalysisChart.vue`, `ExecutiveGmvNetRevenueChart.vue`, `ExecutiveGmvBreakdownChart.vue`, `ExecutiveOrderEfficiencyChart.vue`, `views/ExecutiveView.vue` | xem bước 5 |
| 3 | Nhãn BR-FLT-06 gồm chu kỳ: "Đang lọc riêng: <phạm vi> · Chu kỳ <nhãn>" (hoặc chỉ "Chu kỳ <nhãn>"). Ghép trong `ExecutiveChartFilters`/Cumulative/Growth nên `scopeLabel` (chỉ khu vực/chi nhánh) không đổi. | như bước 2 | |
| 4 | Waterfall không có chu kỳ (ma trận FR-FLT-05): prop `showPeriod=false`. Waterfall không dùng `granularity` để tính; request vẫn lấy từ snapshot với `periodType` của bộ lọc chung (trường `period` UI bị loại khỏi wire), nên dữ liệu không đổi. Bỏ `waterfallGranularity` khỏi view. Ranking không có bộ chọn chu kỳ (đã kiểm). | `ExecutiveRevenueWaterfall.vue`, `ExecutiveChartFilters.vue`, `ExecutiveView.vue` | |
| 5 | Cập nhật test dùng chip cũ sang dropdown (giữ ý định) và thêm 7 test mới: đồng bộ chu kỳ chung, không refetch khi thẻ đổi, chỉ thẻ đó đổi + nhãn "Chu kỳ", nhãn kết hợp khu vực, cumulative/growth, tự xóa override khi trùng giá trị chung / reset, đổi chung ghi đè mọi thẻ, Waterfall/Ranking không có chu kỳ. | `tests/dashboard-v2/executiveView.spec.ts`, `executiveTrendCharts.spec.ts`, `growthAnalysisChart.spec.ts`, `e2e/dashboard-v2/dashboardV2.spec.ts` | |
| 6 | Spec: thêm câu về chu kỳ cục bộ vào BR-FLT-05 và nhãn + nút "↺ Theo bộ lọc chung" vào BR-FLT-06. | `docs/PRODUCT_SPEC_DASHBOARD.md` (repo này, chưa commit) | |

## Số liệu
- Trước: 57 file / 493 test pass.
- Sau: 57 file / 500 test pass (+7). `vue-tsc` sạch; eslint 0 lỗi (chỉ cảnh báo `vue/require-default-prop` sẵn có).

## Lưu ý
- Đổi chu kỳ ở thẻ chỉ gom lại dữ liệu phía client (INV-08), không gọi lại API; vì vậy "request" của thẻ không đổi khi override.
- ~~Nhãn "Đang lọc riêng" của Phân tích tăng trưởng vẫn hiện "Toàn hệ thống" khi bộ lọc chung có khu vực/chi nhánh.~~ **Đã sửa ở `81e46b90`** (xem mục "Sửa phạm vi Phân tích tăng trưởng" bên dưới).

## Sửa phạm vi Phân tích tăng trưởng
**Nguyên nhân**
- Chế độ "Toàn hệ thống": request đã dùng phạm vi bộ lọc chung (khu vực/cụm/chi nhánh) nhưng chuỗi/legend vẫn ghi "Toàn hệ thống" và nhãn BR-FLT-06 hiện "Toàn hệ thống" -> số đúng, nhãn sai.
- Chiều Khu vực giữ lại `clusterIds` của bộ lọc chung; chiều Chi nhánh giữ lại `regionIds` + `clusterIds` -> giao với cụm/khu vực cũ, có thể sai hoặc rỗng.
- Kiểm tra "giống bộ lọc chung" không xét `clusterIds`.

**Cách sửa** (`ExecutiveView.vue`)
- Thêm `masterScopeName` (chi nhánh đã chọn, else cụm, else khu vực, else "Toàn hệ thống"); chuỗi ở chế độ system dùng tên này.
- `growthAnalysisScopeLabel` trả `''` ở chế độ system (vẫn giữ phần "Chu kỳ <x>" khi đổi chu kỳ).
- `growthAnalysisScopeFilter`: region -> `regionIds=[id]`, `clusterIds=[]`, `siteIds=[]`; branch -> `siteIds=[id]`, `regionIds=[]`, `clusterIds=[]`; system giữ nguyên phạm vi chung.
- "Giống chung": region chỉ khi chung có đúng 1 khu vực đó và không cụm/chi nhánh; branch chỉ khi tập chi nhánh bằng nhau và chung không có khu vực/cụm.

**Test** (`tests/dashboard-v2/executiveView.spec.ts`, +7): system theo khu vực chung (request `regionIds=[X]`, tên X, không nhãn); tên theo chi nhánh/cụm; không phạm vi -> "Toàn hệ thống"; cụm C chung + chiều region R -> `clusterIds=[]`, `siteIds=[]`, nhãn R; chiều branch chỉ có `siteIds`; bằng nhau region/branch không nhãn, có cụm/khu vực thì có nhãn. Test wave 7 về chu kỳ vẫn pass (một assertion nhãn Growth được chỉnh vì nhãn nay biến mất khi hết override).

**Số liệu:** trước 57 file / 500 test; sau 57 file / 507 test pass. `vue-tsc` sạch; eslint 0 lỗi.
