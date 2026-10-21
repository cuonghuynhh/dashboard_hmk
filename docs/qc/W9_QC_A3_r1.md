# W9 QC A3 vòng 1: bộ lọc phạm vi, Phân tích tăng trưởng, Hiệu quả đơn hàng, UPT

- Worktree: `wt/gui-a3-cards`, nhánh `qc/w9-a3-cards`, base `222b9b26`, 5 commit (`b2b36b8a`, `9d67a96d`, `093a0f01`, `6c577066`, `79254fa2`).
- Phạm vi review: `git diff 222b9b26..HEAD` (21 file). Không có A2/D/FE-E/FE-F trong worktree.

## 1. Kết luận: CHƯA ĐẠT (1 lỗi Cao về diễn giải prototype, còn lại là Trung bình/Thấp; phần lõi mục 1, 2, 4 đạt)

Số liệu tôi tự chạy trong worktree:

| Lệnh | Kết quả |
|---|---|
| `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | 61 file, 553 test: pass hết, không timeout (khớp change log) |
| `npx vue-tsc -b --noEmit` | exit 0, 0 lỗi |
| `npx eslint src/pages/dashboard-v2` | không output, 0 lỗi, 0 cảnh báo |

Lý do CHƯA ĐẠT: chế độ "Phóng to trục Y" mất biểu đồ AOV mà prototype có (lỗi A3-01). Đây là quyết định diễn giải của worker, sửa rẻ (khôi phục 1 biểu đồ), nhưng cần lead/user chốt trước.

## 2. Bảng yêu cầu

| # | Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|---|
| 1.1 | 4 card (GMV/DTT, Waterfall, Hiệu quả đơn hàng, Phân rã GMV) dùng `ScopeViewFilter`, bỏ select khu vực/cụm/multi-select chi nhánh | Đạt | `ExecutiveChartFilters.vue` viết lại (chỉ ScopeViewFilter + PeriodSelect + nhãn); 4 card truyền `scopeView/scopeIds/master*Ids` và phát `scopeChange` |
| 1.2 | Giữ `PeriodSelect` + override/reset; Waterfall không có chu kỳ | Đạt | `showPeriod` prop; test `executiveChartFilters.spec.ts` (không có period trên Waterfall) |
| 1.3 | Ngữ nghĩa: view+ids thành scope request, ids rỗng giữ master, aggregate của lựa chọn | Đạt | `utils/scopeFilterPatch.ts:13-23`; test `scopeFilterPatch.spec.ts` (9 test) và `executiveView.spec.ts` (region/site gửi đúng request) |
| 1.4 | Mặc định `region` + ids rỗng; đổi global reset | Đạt | `ExecutiveView.vue` `scopes` reactive và `syncChildFilters` (vòng lặp đặt lại `{region, []}`); test reset toàn cục |
| 1.5 | Nhãn BR-FLT-06 `Đang lọc riêng: <tên> · Chu kỳ X` | Đạt | `ExecutiveChartFilters.vue` `localScopeText`; `scopeFilterLabel` |
| 1.6 | Refactor ExecutiveView: bỏ bộ ba `xxxRegionId/ClusterId/SiteIds` và handler; một handler chung + util có test | Đạt | `changeCardScope`, `cardScopeLabel`, `scopeFilterPatch`; grep không còn `changeXxxRegion` |
| 1.7 | Quét tab Product/Operational/Personnel | Một phần | Change log kết luận đúng: chỉ còn AnomalyChart và RegionalBenchmark; xem mục 3 (A3-03) và đánh giá (b), (c) |
| 1.8 | CashFlowChart/GrowthChart (dead code) vẫn dùng ExecutiveChartFilters | Đạt (chấp nhận) | Đổi props để `vue-tsc` pass, không xóa file. Gợi ý lead cân nhắc xóa 2 file chết ở task khác |
| 2.1 | Bỏ tab WoW/MoM/YoY, so sánh theo `comparisonType` master, master 0 dùng `previousPeriodFilter` | Đạt | `GrowthAnalysisChart.vue` (không còn tab); `loadGrowthAnalysis` luôn tải kỳ trước; test "master Không so sánh" |
| 2.2 | Dòng `So với: ...` | Đạt, có sai lệch nhỏ | `COMPARISON_BASIS`; xem A3-06 |
| 2.3 | Thay selector chiều bằng `ScopeViewFilter` testKey `growth`; ids rỗng một series tên master; có ids mỗi entity một series, region/cluster/site gửi đúng list | Đạt | `growthAnalysisScopeFilter` + `scopeFilterPatch(view,[id],master)`; 3 test region/cluster/site |
| 2.4 | Cap 5 + hint `Chọn tối đa 5` | Đạt | `MAX_SERIES`, `data-test="growth-max-hint"`; cắt ở `changeScope`, `chartSeries`, `loadGrowthAnalysis` |
| 2.5 | Giữ metric selector, PeriodSelect, summary; nhãn local khi có ids | Đạt | Template `GrowthAnalysisChart.vue` |
| 3a | AOV-only chart thành Volume chart (theo prototype) | Một phần | Có Volume (màu đậm/nhạt theo TB, đường TB, footer) nhưng AOV zoom bị bỏ, khác prototype: A3-01 |
| 3b | Variance: segmented một lựa chọn `% Lệch AOV/UPT/Volume`, xanh/đỏ, gốc 0, tooltip thực tế + TB + lệch | Đạt | `varianceOption`, `efficiency-variance-*`; test "one metric at a time" |
| 3c | Nhãn `Kết hợp`, sub-toggle `Cả hai/Chỉ AOV/Chỉ UPT` | Đạt | `modes`, `COMBO_MODE_LABELS` |
| 3d | Giữ zoom trục Y cho chỉ số tỷ lệ | Một phần | UPT zoom có; AOV zoom chỉ còn trong Kết hợp (trục `scale`): A3-01 |
| 4.1 | Type optional `unitCount`, `upt` | Đạt | `types.ts` `ExecutiveTrendPointV2`; backend `ExecutiveDashboardV2Dto.cs:286-289` có `UnitCount`/`Upt` (camelCase khớp) |
| 4.2 | UPT bucket = Σ unitCount / Σ grossOrderCount; null khi thiếu | Đạt | `orderEfficiency.ts` `buildEfficiencyBuckets`/`summarizeEfficiency`; `executiveTrendAggregation.ts` cộng `unitCount`; test "UPT per bucket" |
| 4.3 | Bỏ fallback "Chưa có dữ liệu UPT" khi có data; `fallbackUpt` chỉ khi điểm thiếu `unitCount` | Đạt | `pointsCarryUnits`, `summaryUpt` (cũng chặn fallback khi lọc riêng) |
| 4.4 | Growth UPT dùng `unitCount/grossOrderCount` theo điểm | Đạt | `growthAnalysis.ts:159` (đã có sẵn, có test) |
| 4.5 | Bảng audit UPT prototype → pos.gui | Đạt | Change log mục 3 trung thực; xem so sánh đầy đủ dưới đây |
| T | Test cho mọi hành vi | Đạt | +4 file/+46 test so với baseline. Một số test cũ bị xóa vì UI gốc bị gỡ (nhãn "giống master", multi-select cũ); ý định chính được viết lại. Ghi chú Thấp: không còn test "chỉnh 1 card không đụng card anh em" ở dạng chung, nhưng test region/site từ card vẫn kiểm request |

## 3. Lỗi phát hiện

### Cao

**A3-01. Mất biểu đồ AOV ở chế độ "Phóng to trục Y" (đánh giá vị trí (a) của lead)**
- Vị trí: `ExecutiveOrderEfficiencyChart.vue` khối `data-test="efficiency-zoom"` (2 biểu đồ Volume + UPT, `xl:grid-cols-2`); test `orderEfficiency.spec.ts` "no AOV-only chart".
- Sự thật: base (`222b9b26`) đã có sẵn 3 biểu đồ Volume, AOV, UPT. Prototype `OrderEfficiencyMetricsChart.tsx:551-770` cũng có 3 biểu đồ: AOV vùng (trục Y phóng to + nhãn "TB: xxk" + footer Thấp/Cao nhất), Volume cột, UPT vùng. Worker không thêm Volume (đã có) mà chỉ gỡ AOV. Kết quả là chế độ mặc định không còn xu hướng AOV. AOV chỉ còn trong Kết hợp (trục `scale`, chia với 2 đường khác) và trong `% Lệch AOV`. Prototype nhấn mạnh (InfoTooltip, "Best Practice") rằng AOV là chỉ số tỷ lệ cần zoom riêng; worker làm ngược ý đó.
- Lời của user "thay biểu đồ thể hiện AOV thành Volume (tham khảo UI của prototype)" mơ hồ, vì Volume đã tồn tại. Cách đọc hợp lý nhất là "làm lại UI cho giống prototype" (3 biểu đồ, Volume theo kiểu prototype), không phải "bỏ AOV". Nếu user thật sự muốn bỏ AOV khỏi mặc định thì nên hỏi lại.
- Sửa đề xuất: khôi phục biểu đồ AOV vùng (dùng lại `lineOption('AOV', aovs, COLORS.aov, summary.aov, formatAov, createMoneyAxisFormatter(aovs))`, tiêu đề `AOV (Giá trị TB đơn)`, dòng `Trục Y phóng to: Xk - Yk ₫`, pill `TB`, footer Thấp nhất/Cao nhất), grid `xl:grid-cols-3` như prototype; sửa test "no AOV-only chart" thành kiểm tra 3 biểu đồ (`efficiency-aov-chart`, `efficiency-volume-chart`, `efficiency-upt-chart`). Bước này lead nên xác nhận với user trước khi giao lại.

### Trung bình

**A3-02. Chế độ "Phóng to trục Y" không có tooltip độ lệch cho UPT và AOV (prototype có)**
- Vị trí: `lineOption()` dùng `valueFormatter` đơn giản. Prototype `renderUPTTooltip`/`renderAOVTooltip` có: giá trị, độ lệch so với TB (màu xanh/đỏ), tổng SP, tổng đơn (UPT), Volume (AOV). Change log đã thừa nhận cho UPT.
- Sửa: dùng `formatter` như `volumeOption`: tiêu đề kỳ, giá trị, `Độ lệch so với TB (x): ±y%` (lấy từ `buildVarianceSeries`), `Tổng SP bán ra` (`bucket.units`), `Tổng số đơn` (`bucket.grossOrders`). Không đưa GMV vào tooltip (an toàn quyền BOD/GMV ẩn).

**A3-03. Tooltip Volume (zoom) và Variance Volume tính độ lệch khác nhau ở kỳ lẻ**
- Vị trí: `volumeOption` tooltip: `(bucket.volume - average) / average` theo kỳ; `buildVarianceSeries` chuẩn hóa theo ngày (BR-FLT-12). Với bucket đầu/cuối thiếu ngày, cùng một kỳ hiện hai % khác nhau giữa chế độ zoom và chế độ lệch (ví dụ kỳ 3/7 ngày: zoom báo ~-57%, lệch báo ~0%).
- Change log (quyết định 5) chỉ nêu mâu thuẫn giữa % và số trong tooltip variance. Sửa: tooltip zoom lấy `variance.value.volume[entry.dataIndex]`, và trong cả hai tooltip thêm dòng `(chuẩn hóa theo ngày, kỳ n ngày)` khi `bucket.days` khác độ dài đầy đủ.

**A3-04. Nhóm nút chế độ tràn ngang trên mobile trong card `overflow-hidden`**
- Vị trí: nhóm `aria-label="Chế độ hiển thị"` là `flex rounded-lg bg-slate-100 p-1` không wrap; nhãn dài hơn base (`Phóng to trục Y (Chuẩn)`, `Kết hợp`, `Độ lệch % so với TB`, tổng khoảng 410px). Ở 360px (khả dụng khoảng 296px) nút cuối bị cắt vì `<section class="overflow-hidden">`, không cuộn được. Tương tự nhóm `% Lệch AOV | % Lệch UPT | % Lệch Volume` (khoảng 330px).
- Sửa: thêm `flex-wrap` vào hai nhóm (và `max-w-full`), hoặc `overflow-x-auto`. Có thể rút nhãn nút thành `Phóng to trục Y` (giữ "(Chuẩn)" ở tiêu đề).

### Thấp

**A3-05. Cap 5 cắt im lặng.** `GrowthAnalysisChart.changeScope` cắt `payload.ids.slice(0, 5)`; chọn mục thứ 6 thì mục đó biến mất mà không báo. Hint "Chọn tối đa 5" luôn hiện nhưng không đổi trạng thái. Đề xuất: khi `ids.length > 5` hiện hint màu cảnh báo "Đã đạt tối đa 5" hoặc vô hiệu hóa chọn thêm (nếu `ScopeViewFilter` có prop giới hạn thì dùng; nếu không, thêm prop `max` vào `ScopeViewFilter` ở task khác).

**A3-06. Nhãn `So với: tuần trước / tháng trước` chưa chắc đúng.** `previousPeriodFilter` luôn trả "kỳ liền trước cùng độ dài" (cũng gán `comparisonType` về COMPARISON_PREVIOUS_PERIOD) cho cả WoW và MoM; nên với khoảng ngày tùy ý (ví dụ 10 ngày, master = WoW) nhãn "tuần trước" sai nghĩa. Đề xuất: dùng nhãn trung tính `kỳ trước (cùng độ dài)` cho 0/1/2, giữ `cùng kỳ năm trước` cho 3 (hoặc kiểm tra spec BR-CMP-01 xem backend có dịch 7 ngày/1 tháng thật hay không rồi chỉnh theo).

**A3-07. Thoáng hiện thông báo sai khi vừa chọn entity.** Sau `changeScope`, `props.series` vẫn là series cũ (`id: 'system'`) cho đến khi tải xong, `chartSeries` lọc ra rỗng nên khối hiển thị "Chọn ít nhất một khu vực để so sánh" dù đã chọn (có overlay loading nhưng chữ vẫn bên dưới). Sửa: trong template, nếu `loading` thì không hiện chuỗi này (`v-else-if="loading"` hiển thị rỗng).

**A3-08. Summary Growth dùng series đầu tiên khi chọn nhiều entity.** `resolved` lấy `chartSeries[0]`; "Tổng kỳ này" và "Tăng trưởng chung" chỉ phản ánh entity đầu, không phải tổng. Gần như chắc chắn có từ base, nhưng giờ dễ gặp hơn (chọn nhiều là ca chính). Đề xuất: khi `chartSeries.length > 1` ẩn summary hoặc ghi rõ "theo <tên entity đầu>".

**A3-09. Request Growth tăng khi master = 0 (đánh giá vị trí (d)).**
- Base: master 0 chỉ 1 request/series; sau A3: 2 request/series (+1 và +1 nữa nếu YoY, tổng 3). Tối đa 5 series: 10 request song song (15 nếu YoY) so với 5 trước đây. Trong mỗi series, các request chạy tuần tự (`await loadTrend(current)` rồi `await loadTrend(prev)` rồi YoY), nên độ trễ mỗi series là tổng 2-3 lần gọi.
- Tính đúng: tên series đúng (`masterScopeName` khi rỗng, tên entity từ pool khi có ids), nhãn `So với: kỳ trước` khớp dữ liệu tải; không lỗi chức năng. Cache/dedupe: `loadTrend` không dùng chung với `gmvNet` snapshot nên không tái sử dụng.
- Đề xuất tối ưu (không bắt buộc): chạy `current`, `previous`, `yoy` bằng `Promise.all` trong mỗi series (giảm độ trễ khoảng 2 lần mà số request giữ nguyên). Chấp nhận tăng request vì task yêu cầu so sánh kỳ trước khi master = 0.

**A3-10. Thiếu một số chi tiết UI của prototype (xem bảng so sánh dưới).** Pill `Chênh lệch: x SP`, banner nhận xét, tooltip trợ giúp. Không bắt buộc theo task nhưng nên liệt kê cho lead.

## 4. Đối chiếu Hiệu quả đơn hàng với prototype (mọi khác biệt nhìn thấy)

| Khu vực | Prototype `OrderEfficiencyMetricsChart.tsx` | pos.gui sau A3 | Đánh giá |
|---|---|---|---|
| Tiêu đề | `Hiệu quả đơn hàng: AOV - Volume - SL sản phẩm/đơn` + icon + `InfoTooltip` "Best Practice" + mô tả phụ về best practice | Cùng tiêu đề, mô tả khác ("Giá trị đơn trung bình, số đơn và số sản phẩm trên mỗi đơn theo kỳ"), không icon, không InfoTooltip | Khác, tùy chọn (A3-10) |
| Bộ lọc cục bộ | `LocalFilterUI` (khu vực/chi nhánh) | `ScopeViewFilter` + `PeriodSelect` (đúng theo task 17) | Đúng ý task |
| Nút bảng | icon file, tooltip "Xem bảng chi tiết dữ liệu" | Nút chữ `Bảng chi tiết` | Khác nhẹ, ổn |
| Nhãn chế độ | `Phóng to trục Y (Chuẩn)`, `Biểu đồ kết hợp (Combo)`, `Độ lệch % so với TB` + icon màu | `Phóng to trục Y (Chuẩn)`, `Kết hợp` (theo task), `Độ lệch % so với TB`, không icon, chọn = nền trắng chung | Đúng task; mobile tràn (A3-04) |
| Tile AOV | Giá trị TB, pill `Biến thiên: ±x%`, dòng `Biên độ dao động: xk ~ yk ₫` | Có (AOV gia quyền, `Biến thiên`, `Biên độ dao động`) | Đạt. Prototype tính TB giản đơn, ta gia quyền (đúng spec) |
| Tile Volume | Giá trị chính = **TB đơn/kỳ**, pill `Tổng: x đơn`, dòng `Tổng GMV đóng góp` | Giá trị chính = **tổng đơn**, dòng TB/kỳ + biên độ, dòng `Biên độ dao động`; không có GMV | Khác về nhấn mạnh; bỏ GMV là đúng quyền; ổn |
| Tile UPT | Giá trị TB, pill `Chênh lệch: x SP`, dòng `Biên độ dao động: a ~ b SP / đơn` | Có TB, `Biên độ: x%`, `Biên độ dao động`; không có pill `Chênh lệch: x SP` | Thiếu pill (đã ghi) |
| Zoom: số biểu đồ | 3 (AOV vùng, Volume cột, UPT vùng), `lg:grid-cols-3` | 2 (Volume, UPT), `xl:grid-cols-2` | **Khác lớn: A3-01** |
| Zoom: AOV | Vùng gradient, trục Y phóng to, đường TB có nhãn, pill TB, footer Thấp/Cao nhất | Không có | A3-01 |
| Zoom: Volume | Cột bo góc, màu `#10b981` ≥ TB / `#6ee7b7` < TB, đường TB, footer Cột đậm/nhạt | Giống (cùng màu, đường TB, footer) | Đạt |
| Zoom: UPT | Vùng gradient, trục phóng to, TB, footer | Vùng tô nhạt (`areaStyle` opacity 0.12, không gradient), TB, footer | Đạt (gradient khác nhỏ) |
| Tooltip AOV (zoom) | Giá trị, lệch %, GMV, số đơn | Không có tooltip riêng (không có chart) | A3-01/02 |
| Tooltip Volume (zoom) | Volume, lệch %, GMV, AOV tương ứng | Volume, lệch %, AOV tương ứng (không GMV) | Đạt; lệch % có thể lệch với variance: A3-03 |
| Tooltip UPT (zoom) | Giá trị, lệch %, tổng SP, tổng đơn | Chỉ giá trị | A3-02 |
| Dải nhận xét (Sparkles) | Có, ở cuối chế độ zoom | Không có | Tùy chọn |
| Kết hợp: cấu trúc | Volume cột xanh + AOV + UPT; cột `#10b981` opacity 0.85 | Cột `#93c5fd` (xanh dương nhạt, khác prototype xanh lá), AOV, UPT | Khác màu cột; nên dùng `#10b981` để đồng nhất với Volume chế độ zoom |
| Kết hợp: sub-toggle | `Cả 2 (AOV & UPT)`, `Chỉ AOV`, `Chỉ UPT` (nút đặc) | `Cả hai`, `Chỉ AOV`, `Chỉ UPT` (theo task) | Đạt |
| Kết hợp: trục | `both`: UPT dùng chung trục AOV (lỗi của prototype); `upt`: trục phải UPT | Ba trục riêng, UPT nét đứt, có tên trục | Ta tốt hơn prototype |
| Kết hợp: tooltip | Volume, AOV, UPT (có chấm màu), GMV | Volume, AOV, UPT (không chấm màu, không GMV) | Đạt |
| Kết hợp: chú giải | Legend trên phải + dải chú thích ba mục | Legend dưới | Khác nhẹ |
| Lệch: selector | Ba nút, nhãn kèm chuẩn `(Chuẩn: xk)`, `(Chuẩn: x SP)`, `(Chuẩn: x đơn)`, nút chọn có màu riêng (indigo/amber/emerald) | Ba nút trắng/xám, không kèm chuẩn (chuẩn nằm ở dòng mô tả bên dưới) | Khác nhẹ, ổn |
| Lệch: cột | Xanh `#10b981` ≥ 0, đỏ `#f43f5e` < 0, đường 0 đậm, tick `+x%` | Cùng màu; đường 0; trục dùng `formatPercent` (không dấu `+`) | Đạt; tick thiếu dấu `+` (cosmetic) |
| Lệch: tooltip | Độ lệch, giá trị thực tế, mức chuẩn trung bình | Giống, thêm cho Volume "đơn / kỳ" | Đạt |
| Lệch: chú giải | Dải hai ý xanh/đỏ | Một dòng mô tả | Đạt |
| Bảng chi tiết | Modal, cột Thời gian, AOV, %AOV, Volume, UPT, %UPT, Tổng SP, **Tổng GMV** | `DataDetailModal` cùng cột trừ GMV, thêm cột `% Lệch Volume` không có (prototype không có) | Bỏ GMV là đúng quyền; ổn |
| Loading/lỗi/rỗng | Không có | `DashboardV2Block` (loading/error/empty), badge partial | Ta có đầy đủ |

## 5. Đánh giá bốn vị trí của lead

**(a) AOV chart thành Volume.** Không đồng ý với cách làm của worker (xem A3-01). Căn cứ: base đã có Volume; prototype giữ AOV zoom (3 biểu đồ). Đề xuất: giữ 3 biểu đồ, Volume theo kiểu prototype (đã làm), thêm lại AOV zoom; hỏi user nếu "thay AOV" thực ra chỉ đến thứ khác (ví dụ thay thanh AOV trong Kết hợp hoặc tile). Zoom AOV trong Kết hợp vẫn giữ.

**(b) AnomalyChart "Toàn hệ thống / Theo Khu vực / Theo Chi nhánh".** Khả thi và nên chuyển. Phát hiện quan trọng khi đọc backend (`wt/api-int`):
- `OperationalView.handleAnomalyChange` gửi `dimension` = 1 (System), 2 (Region), 3 (Site) kèm `...filter.value`.
- `DashboardV2Service.Operational.cs` `GetOperationalAnomaly` → `QueryAnomaly(siteIds, filter)` luôn gộp một chuỗi ngày duy nhất của tập site trong phạm vi (`AggregateByDay`). Tham số `Dimension` không đổi kết quả (nó chỉ dùng ở `RegionalBenchmark` dòng ~1204 và các block Product). Tức là select hiện tại là điều khiển không có tác dụng thật (cùng dữ liệu cho cả ba lựa chọn), chỉ đổi nhãn.
- Vì vậy ý nghĩa đúng là "phạm vi" chứ không phải "nhóm theo". Mapping đề xuất:
  - Thay select `anomaly-entity` bằng `ScopeViewFilter` (testKey `anomaly`), state `{view, ids}` trong `OperationalView`, mặc định `region` + ids rỗng.
  - Gọi `scopeFilterPatch(view, ids, masterScope)` và trải vào filter gửi API (`regionIds/clusterIds/siteIds`), đặt `dimension` cố định 1 (hoặc bỏ field), giữ `metric`.
  - Ids rỗng = phạm vi master (tương ứng "Toàn hệ thống" cũ); region/cluster/site ids = chuỗi tổng hợp của lựa chọn (cùng ngữ nghĩa task 17).
  - Reset khi bộ lọc chung đổi; thêm nhãn `Đang lọc riêng` theo `scopeFilterLabel`.
  - Cập nhật test `anomalyChart` / `operationalView` (đổi `anomaly-entity` thành thao tác ScopeViewFilter; kiểm request có đúng list). Nếu sau này muốn một đường cho mỗi entity thì cần backend trả nhiều series (chưa có), không làm ở task này.
- Rủi ro: BOD/MANAGER đã bị giới hạn site bởi `GetOperationalSites`; `ScopeViewFilter` chỉ liệt kê option trong master nên không mở rộng quyền.

**(c) RegionalBenchmark chọn một chi nhánh.** Đồng ý giữ nguyên: nó chọn một chi nhánh mục tiêu (`benchmarkAId`) để so sánh với các chi nhánh khác, không phải phạm vi lọc nhiều chọn. Xác nhận không cần chuyển.

**(d) Growth luôn tải kỳ trước.** Đúng chức năng và đúng yêu cầu task (master 0 vẫn so với kỳ trước); xem A3-09 (số request, thứ tự tuần tự, đề xuất `Promise.all`) và A3-06 (nhãn). Tên series đúng: ids rỗng dùng `masterScopeName`, có ids dùng tên entity; thứ tự series lấy theo thứ tự pool (không phải thứ tự chọn), thấp quan trọng.

## 6. Ghi chú UX (tùy chọn)

- Đồng bộ màu cột Volume giữa Kết hợp (`#93c5fd`) và Zoom (`#10b981`/`#6ee7b7`).
- Tick trục Lệch thêm dấu `+` như prototype (`+5%`).
- Thêm lại banner nhận xét (Sparkles) và `InfoTooltip` "Best Practice" của prototype để giải thích vì sao zoom trục Y.
- Pill `Chênh lệch: x SP` cho tile UPT (max - min), một dòng code từ `uptSpan`.
- `CashFlowChart.vue` và `GrowthChart.vue` là code chết nhưng phải sửa theo contract mới: cân nhắc xóa ở task dọn dẹp.
- Phân quyền: không phát hiện rò GMV (tooltip/ bảng/tile Efficiency không chứa GMV; Growth vẫn ẩn metric GMV khi `canViewGmv` false).
