# W9 QC C2, vòng 1 (task C: phần 3, 4, 5, 7, 8, 9, 10, 12)

Worktree `wt/gui-c2-terms` (qc/w9-c2-terms), base 2e95363f, HEAD 2eac0246. Chỉ QC read-only. Phần 1, 2, 6, 11, 13 do worker khác làm, bỏ qua.

## 1. Kết luận: ĐẠT (kèm 2 lỗi Trung bình, 4 lỗi Thấp, 1 phát hiện ngoài phạm vi cần xác minh)

Số liệu tôi tự chạy trong worktree:
- `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2`: 71 file, 691 test, tất cả pass (khớp change log).
- `npx vue-tsc -b --noEmit`: exit 0, 0 lỗi.
- `npx eslint src/pages/dashboard-v2`: exit 0, 0 lỗi.
- Không chạy lại full suite lần hai (máy hạn chế bộ nhớ).

Mọi yêu cầu của 8 phần đều có mã và test tương ứng. Các khoảng trống đều nằm ở độ phủ thuật ngữ (lỗi 1, 2, 4) và ở các component V2 đã chết (lỗi 3).

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| 3. Glossary lấy nhãn thẻ KPI làm chuẩn, đặt trong change log | Một phần | Glossary có trong `docs/qc/W9_C2.md`. Đã đổi Net Revenue/GTTB/Số đơn/Lưu lượng KH/Volume (...) sang DTT, AOV, Đơn hàng, Traffic. Còn sót `Doanh thu` trần ở 11 chỗ (xem mục 4 và lỗi 1) |
| 3. Không đổi `data-test` hay định danh | Đạt | diff chỉ đổi chuỗi hiển thị |
| 3. Guard `terminology.spec.ts` | Một phần | Chỉ có danh sách "biến thể đã bỏ" (9 regex), không có luật cho `Doanh thu` trần. Quét sạch 0 vi phạm. Xem lỗi 4 |
| 4. Combo → Kết hợp | Đạt | `ExecutiveCumulativeTrendChart.vue:271`, `ExecutiveOrderEfficiencyChart.vue:397`. `noComboLabel.spec.ts` quét `src/pages/dashboard-v2` |
| 5. Bỏ "Tốt hơn/Xấu hơn", chỉ mũi tên và % có dấu | Đạt | `MetricCard.vue` (bỏ `qualifier`). Test `metricCard.spec.ts` |
| 5. Màu theo polarity, 0 hoặc thiếu thì slate và không mũi tên | Đạt | `MetricCard.vue:106-118`, test "zero change is slate with no arrow" |
| 5. aria-label | Một phần | Có `aria-label` trên `<span>` không có role. Xem lỗi 2 |
| 5. Áp dụng cho mọi badge thay đổi khác | Một phần | Từ "Tốt hơn/Xấu hơn" không xuất hiện ở nơi khác. Nhưng các badge thay đổi khác không theo quy tắc mũi tên và màu. Xem lỗi 5 |
| 7. Bỏ "Mục tiêu thực thu" khỏi CashFlowChart | Đạt (nhưng trên component chết) | `CashFlowChart.vue`, test `cashFlowChart.spec.ts`. Xem lỗi 3 |
| 7. Bỏ target DTT, AOV, chuyển đổi, CSAT còn sót | Đạt | grep "Mục tiêu" trong V2: chỉ còn GMV và Traffic. `Mục tiêu lũy kế` ở `ExecutiveCumulativeTrendChart` là GMV (hợp lệ). Bỏ `Mục tiêu lũy kế` ở `GrowthChart` và legend mồ côi ở `GrowthAnalysisChart.vue:494` |
| 8. Bỏ emit `limitChange` của ranking | Đạt | `ExecutivePerformanceRanking.vue`, test dòng 427 |
| 8. Tên scope master dùng chung một util | Đạt | `masterScopeLabel` dùng ở `ExecutiveView.vue:274`, ranking:132, heatmap:235 |
| 8. Reset `sortOverride` khi đổi hiển thị GMV | Đạt | `watch(isGmvHidden)` trong ranking. Có test |
| 9. `legacyScopeLabel` dùng scope label map, fallback `'Khác'` | Đạt | `KpiConfigurationModal.vue:101`. Nhãn của scope 1 đổi từ `Công ty` sang `Toàn công ty` (ghi trong change log) |
| 9. Import modal ẩn checkbox và hiện "Không có dòng hợp lệ" | Đạt (lệch có lý do) | Điều kiện là `preview.counts.valid > 0`, không dùng `!canConfirm`. Quyết định chính xác vì `!canConfirm` cũng đúng khi chưa tick, nên checkbox sẽ biến mất và người dùng không xác nhận được. Test mới |
| 9. `loadDailyTargets` tăng seq trước kiểm tra tháng | Đạt | `KpiManagementView.vue:292-295`, có test |
| 10. Bỏ call `branchPerformance` trong ExecutiveView | Đạt | không còn `loadBranchPerformance`. Test khẳng định `not.toHaveBeenCalled`. Method API được giữ |
| 12. Một `scopeFilterPatch` và một `scopeFilterLabel` | Đạt | `scopeRequestIds` và `scopeIdNames` đã xóa, `grep` toàn repo 0 kết quả. Test gộp vào `scopeFilterPatch.spec.ts` |

## 3. Lỗi phát hiện

### Cao
Không có lỗi Cao trong phạm vi C2. Xem phát hiện ngoài phạm vi (A) ở dưới, mức nghiêm trọng có thể là Cao nếu xác minh đúng.

### Trung bình

**1. Thuật ngữ `Doanh thu` trần còn ở 11 chỗ trong khi thẻ KPI dùng ba khái niệm khác nhau (GMV, thực thu, DTT).**
Change log để PM quyết định, nhưng việc truy vết backend cho thấy hầu hết trường đó đã có tên chính xác. Nhãn `Doanh thu` trần vì thế sai nghĩa: người dùng thấy "Doanh thu" ở thẻ là thực thu, ở biểu đồ lại là GMV. Bảng quyết định đầy đủ ở mục 4. Sửa: áp dụng bảng đó, rồi thêm luật vào guard (lỗi 4).

**2. `aria-label` đặt trên `<span>` generic.**
`MetricCard.vue:261`. Tên truy cập trên phần tử không có role có thể bị trình đọc màn hình bỏ qua. Mũi tên là `aria-hidden` và chữ `+5,2%` vẫn được đọc, nên người dùng nghe "cộng 5,2%" mà không nghe hướng bằng từ. Sửa: thêm `role="text"`, hoặc gắn `<span class="sr-only">Tăng ... so với kỳ trước</span>` và để `aria-hidden` cho phần hiển thị.

### Thấp

**3. Phần 7 sửa trên các component không được mount ở đâu.**
`CashFlowChart.vue`, `GrowthChart.vue`, `BranchPerformance.vue` chỉ được import trong `tests/` (grep `<CashFlowChart|GrowthChart|BranchPerformance` trong `src` không có view nào). Backend đã ghi `ExecutiveCashV2Dto` là "Đã lỗi thời" và `NetCash = collectedRevenue` (`DashboardV2Service.Executive.cs:173`). Công sửa là đúng nhưng không ảnh hưởng người dùng, và sẽ lệch nếu sau này có người mount lại. Sửa: xóa cả ba component cùng test của chúng, hoặc ghi chú trong change log rằng đây là code chết. Nếu giữ thì sửa nhãn CashFlowChart (xem bảng).

**4. Guard `terminology.spec.ts` yếu.**
Chỉ bắt những biến thể đã biết. `Doanh thu` trần, `Doanh số`, `doanh số` (`SalesLeaderboard.vue:166`, `GrowthAnalysisChart.vue:150`, `ProductGrowthChart.vue:148`) đều qua được. Ngoài ra việc bỏ qua dòng chú thích dựa vào tiền tố dòng, một khối `<!-- -->` nhiều dòng vẫn bị quét. Sửa: sau khi áp dụng bảng ở mục 4, thêm `/\bDoanh thu(?! thuần)(?! \(thực thu\))/i` và `/\bdoanh số\b/i` vào `RETIRED_VARIANTS`, với danh sách cho phép gồm tiêu đề thẻ `DOANH THU (THỰC THU)` và `Doanh thu thuần`.

**5. Quy tắc mũi tên và màu chưa áp dụng cho các badge thay đổi ngoài MetricCard.**
- `PersonnelStaffSelfView.vue:18-21, 74`: viết "+x% so với kỳ trước", âm thì màu slate (không đỏ), không mũi tên.
- `BranchPerformance.vue:55-56` (chết): màu theo dấu, không mũi tên, không aria.
- `ProductGrowthChart.vue`, cột `Tăng trưởng` của `GrowthAnalysisChart.vue`: chỉ có dấu và màu của biểu đồ.
Tất cả đều là chỉ số "tăng là tốt" (GMV, DTT) nên không có lỗi polarity, chỉ thiếu mũi tên và aria. Sửa: tách một component nhỏ `ChangeBadge` (mũi tên, % có dấu, aria, polarity) dùng chung cho MetricCard và các chỗ này. Mức độ tùy chọn nếu PM chỉ muốn thẻ KPI.

**6. Heatmap tooltip `Mục tiêu:`** (`BranchPerformanceHeatmapV2.vue:278`) và ranking `% đạt mục tiêu` (`ExecutivePerformanceRanking.vue:364`) không nói rõ là mục tiêu GMV (backend M16 = GMV / mục tiêu). Sửa: `Mục tiêu GMV:` và `% đạt mục tiêu GMV`.

### Phát hiện ngoài phạm vi C2, cần xác minh (A)
Frontend đọc trường `revenue` (và `spend`, `storeAverageRevenue`) nhưng DTO backend ở nhánh `qc/dashboard-v2-wave9` chỉ trả `Gmv` và `StoreAverageGmv`:
- `PersonnelScorecard.vue:119,125` đọc `item.revenue`, `item.storeAverageRevenue`. Backend `PersonnelScorecardItemV2Dto` chỉ có `Gmv`, `StoreAverageGmv`.
- `TimePeakChart.vue:35` đọc `item.revenue`. Backend `TimePeakItemV2Dto` chỉ có `Gmv`.
- `DemographicCharts.vue:17` đọc `item.spend`. Backend `DemographicItemV2Dto` chỉ có `Gmv`.
- `ProductView.vue:96,111,145,366` đọc `item.revenue`. Backend `ProductDimensionItemV2Dto` chỉ có `Gmv` (frontend có kiểu `gmv?` nhưng view không đọc).
- `ProductGrowthChart.vue:37,38` đọc `revenue`, `revenueGrowthRate`. Backend chỉ có `Gmv`, `GmvGrowthRate`.
Tôi không thấy adapter nào trong `services/dashboardV2Api.ts` ánh xạ `gmv` sang các trường đó (chỉ có adapter cho KPI, trend, ranking). Các test dùng dữ liệu giả có `revenue` nên không bắt được. Nếu xác minh trên stack thật đúng như vậy, các chế độ "Doanh thu/chi tiêu" sẽ hiện trống hoặc NaN. Sửa: đổi view sang đọc `gmv ?? revenue` (giống `ProductTreemap`, `SalesLeaderboard` đã làm), cập nhật test với payload thật. Việc này cũng giải quyết luôn câu hỏi thuật ngữ của PM, vì các trường đó đúng là GMV.

## 4. Quyết định thuật ngữ: mỗi lần xuất hiện `Doanh thu` trần và các nhãn liên quan

Quy ước chuẩn của thẻ (khớp spec M01..M16):
- GMV (M01) = tổng giá trị đơn đặt và đơn hàng, đã gồm VAT, trừ giảm giá.
- Doanh thu (thực thu) (M04) = tiền thu theo phiếu thu, không trừ hoàn tiền.
- Doanh thu thuần (DTT) (M06) = GMV cộng giá trị điều chỉnh.

| Vị trí | Trường và nguồn backend | Tương đương | Nhãn đề xuất |
|---|---|---|---|
| `BranchPerformance.vue:23,32` (component chết) | `BranchPerformanceItemV2Dto.Revenue` = "M06 DTT (gồm VAT) của chi nhánh" | DTT | Cột `DTT`; phụ đề `10 chi nhánh có DTT cao nhất`. Hoặc xóa component |
| `GrowthChart.vue:58,76` (chết) | `ExecutiveTrendPointV2Dto.Revenue` = `NetRevenueBeforeVat` (DTT trước VAT) | DTT (khác cơ sở VAT) | Series `DTT`; phụ đề `DTT và lũy kế YTD...`. Hoặc xóa component |
| `RegionalBenchmark.vue:61` | `RegionalBenchmarkItemV2Dto.Revenue` = "DTT = M06 (gồm VAT) trong kỳ" | DTT | `Doanh thu thuần (DTT)` (cùng dạng với `Giá trị đơn TB (AOV)` bên cạnh) |
| `PersonnelScorecard.vue:63,117,123` | Backend chỉ có `Gmv` và `StoreAverageGmv` ("GMV của nhân viên", "GMV TB mỗi nhân viên") | GMV | `GMV`; `GMV TB cửa hàng`; phụ đề `So sánh GMV và AOV...` |
| `PersonnelStaffSelfView.vue` | `Gmv`, `GmvGrowthRate` | GMV | Đã dùng `gmv`; kiểm tra nhãn hiển thị khớp `GMV` |
| `ProductView.vue:94,122,142,322,339,370` | `ProductDimensionItemV2Dto.Gmv` ("GMV (M01)", Σ cột = M01) | GMV | Cột `GMV (đ)`; tooltip và series `GMV`; option `GMV`; phụ đề `GMV / Đơn hàng theo các tiêu chí phân loại`; dòng 370 `GMV theo phân khúc giá chưa được đồng bộ` |
| `ProductGrowthChart.vue:147,240` | `ProductGrowthItemV2Dto.Gmv`, `GmvGrowthRate` | GMV | `GMV` và `Theo GMV` |
| `ProductGrowthChart.vue:148` | Nút `Doanh số` dùng cho `quantity` | Số lượng | `Số lượng` (hiện gọi `Doanh số` cho số lượng là sai nghĩa) |
| `ProductTreemap.vue:89` | `Gmv` của nút treemap (Σ con = cha) | GMV | `Tỷ trọng đóng góp GMV theo ngành hàng (Treemap)` |
| `ProductBrandDistribution.vue:79` | `gmv` theo thương hiệu | GMV | `Phân bố GMV và sản lượng theo thương hiệu` |
| `TimePeakChart.vue:76,81` | `TimePeakItemV2Dto.Gmv` ("GMV M01 kênh cửa hàng") | GMV | `Theo GMV` |
| `DemographicCharts.vue:167,172` | `DemographicItemV2Dto.Gmv` ("Σ mọi nhóm = M01") | GMV | `Theo GMV`; option ẩn `Theo GMV` (bỏ `Value`, `chi tiêu`) |
| `BasketRefundCharts.vue:53` ("Giá trị đơn hàng") | `BasketSizeItemV2Dto.Gmv` ("Σ giá trị đơn của dải = một phần của M01") | GMV, không phải AOV | `GMV` (worker giữ nguyên vì đúng là tổng giá trị đơn, chấp nhận được; nhưng nên đổi cho thống nhất) |
| `BasketRefundCharts.vue:84` (`Trả hàng\n(Doanh thu)`) | `M12 = M05a / M01` | Mẫu số là GMV | `Trả hàng\n(GMV)` |
| `BasketRefundCharts.vue:129` (`Theo Doanh thu / Hóa đơn`) | M12 theo GMV, M13 theo đơn | GMV, Đơn hàng | `Theo GMV / Đơn hàng` |
| `CashFlowChart.vue:93,117-118,135,144` (chết) | Backend: `NetCash = Round(collectedRevenue)` (`Executive.cs:173`), block đã lỗi thời. Spec M04: không trừ hoàn tiền | Doanh thu (thực thu) M04 | `Doanh thu (thực thu)` trên tiêu đề, `Thực thu` trên legend. Bỏ câu "sau khi trừ giá trị đơn hoàn trả" vì sai với M04. Tốt nhất xóa component |
| `GrowthAnalysisChart.vue:149-150` | `revenue` ánh xạ `netRevenue` (`growthAnalysis.ts:70`), `grossSales` ánh xạ `gmv` | DTT, GMV | `DTT`, `GMV` (không dùng `doanh thu` và `doanh số`) |
| `SalesLeaderboard.vue:166,268` | Đọc `gmv ?? revenue` | GMV | `Hiệu quả theo GMV, AOV và số đơn`; aria `Tỷ lệ GMV so với người dẫn đầu` |
| `AnomalyChart.vue:71` | metric `revenue` = DTT | DTT | Đã đúng: `Doanh thu thuần (DTT)` |
| `ExecutiveOverviewCards.vue` thẻ `DOANH THU (THỰC THU)` | M04 | Thực thu | Giữ. Để tránh nhầm, đây là nơi duy nhất được dùng `Doanh thu` kèm `(thực thu)` |
| `utils/dataFreshness.ts:21` `Sự kiện doanh thu` | Tên dataset kỹ thuật | Không áp dụng | Giữ nguyên |

Nhận xét: không có chỗ nào cần một tên mới. Tất cả `Doanh thu` trần đều trùng với GMV hoặc DTT. Thực thu chỉ có ở thẻ M04 (và `CollectedRevenueWithVat` của PaymentMethod).

## 5. Polarity (phần 5)

Theo spec bảng 207-229, các chỉ số "nghịch" là M05, M10, M12, M13, M13b, M13c.
- Thẻ trên cùng: `adjustment` = `toward-zero-is-better` (so sánh trị tuyệt đối: giá trị điều chỉnh càng âm thì đỏ), `outstandingDebt` = `lower-is-better`, còn lại `higher-is-better`. Khớp spec. Ba nhãn polarity ở `ExecutiveOverviewCards.vue:196, 229` đúng.
- Tỷ lệ trả hàng (M12/M13) chưa có thẻ ở trên cùng nên chưa có polarity trong thẻ. Ở ranking, `isHighReturnRate` tô đỏ (`ExecutivePerformanceRanking.vue:409,437`), đúng hướng.
- Màu mũi tên theo hướng thật, màu chữ theo tốt/xấu: GMV tăng xanh, nợ tăng đỏ, điều chỉnh âm sâu hơn đỏ. Có test cho `higher` và `lower`. Chưa có test riêng cho `toward-zero-is-better` ở bộ test mới (chỉ có trong test cũ BR-CMP-05/07). Tùy chọn: thêm một ca.

## 6. Ghi chú UX (tùy chọn)

- Giá trị 0 hiện `0%` màu slate không mũi tên, trình bày rõ hơn so với `−` cũ.
- Dùng `Đơn hàng (Volume)` ở tiêu đề nhưng `Volume` ở header bảng: hợp lý theo quy ước tiêu đề/trục. Nên thống nhất ghi chú này trong glossary (đã có).
- Heatmap dùng `% chuyển đổi` còn thẻ dùng `Tỷ lệ chuyển đổi`: chấp nhận được do ô hẹp, đã ghi trong glossary.
