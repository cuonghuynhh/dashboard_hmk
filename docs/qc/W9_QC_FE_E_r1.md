# W9 QC FE_E, vòng 1

Worktree: `wt/gui-e-kpi-fe` (qc/w9-e-kpi-fe), base `81e46b90`, 2 commit (`8b745e40`, `5b15b10d`). Đối chiếu BE thật: `wt/api-be-kpi` (qc/w9-be-kpi).

## 1. Kết luận: CHƯA ĐẠT

Lý do: cột "Số ngày đã nhập" (N/total) sai so với đề bài vì BE chỉ trả các dòng đã có trong DB (xem lỗi 1). Phần còn lại đạt.

Số liệu tự chạy:
- `vitest run tests/dashboard-v2 e2e/dashboard-v2` (chạy cả bộ): 57 file, 515 test, **505 pass / 10 fail**, 56 file pass. Cả 10 fail nằm trong `executiveView.spec.ts` và đều là `Test timed out in 5000ms`. Tức là nhiều hơn 2 fail worker ghi, nhưng cùng một nguyên nhân (tải song song).
- Chạy riêng `executiveView.spec.ts`: **42 pass / 1 fail** (43 test, cũng timeout 5000 ms, chạy 57 s). Worker ghi là 43/43. File này không nằm trong diff của FE_E (`git diff --stat` không đụng), nên đây là độ chậm của máy chứ không phải hồi quy. Nên xác nhận lại trên máy lúc rảnh.
- `vue-tsc -b --noEmit`: 0 lỗi.
- `eslint src/pages/dashboard-v2`: 0 lỗi, 3 cảnh báo có sẵn (ExecutiveChartFilters.vue).
- Các spec của FE_E (`dashboardImportModal`, `kpiManagementView`, `generatedClientCompleteness`) đều pass trong lần chạy cả bộ.

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| Bỏ checkbox mẫu cửa hàng, ô Tháng áp dụng, mẫu chuẩn, chữ cũ | Đạt | `DashboardImportModal.vue` diff; grep `store-format`/`Dùng mẫu bảng` không còn trong src. Test `shows no conflict policy, apply mode or store-format controls for KPI` (spec:226) |
| Khối viền `1. Chọn khoảng tháng & tải file mẫu` | Đạt | `data-test="kpi-template-block"`, rounded-xl border |
| Từ tháng / Đến tháng, mặc định tháng hiện tại | Đạt | `input type="month"`; repo dashboard-v2 chưa dùng vue-datepicker nên theo đề dùng input month. Test spec:264 |
| Validation from ≤ to, tối đa 3 tháng, lỗi inline tiếng Việt | Đạt | `rangeError` (modal), `kpi-range-error`; test spec:290, 310 |
| Nút `Tải file mẫu (.xlsx)` cùng khối, disable khi sai range | Đạt | test spec:277 kiểm tra tổ tiên DOM; spec:290 kiểm tra disabled |
| Hint dưới nút | Đạt | Đúng nguyên văn đề |
| Khối 2 `2. Tải lên file đã điền` | Một phần | Chỉ là một dòng chữ `<p>` phía trên dropzone, không phải khối có viền. Chấp nhận được (Thấp) |
| Preview gửi fromMonth/toMonth | Đạt | `kpiPreview` append `fromMonth`, `toMonth` vào FormData; test spec:320. Khớp BE `DashboardImportUploadAdminDto.FromMonth/ToMonth` |
| Template gọi `fromMonth`/`toMonth` | Đạt | `AdminV2ImportKpiTemplate({fromMonth,toMonth})`; BE `[FromQuery] fromMonth, toMonth` |
| Confirm chỉ `{token}` | Đạt | BE `DashboardKpiImportConfirmAdminDto` vẫn có ApplyMode/ConflictPolicy nhưng có giá trị mặc định, không bắt buộc, nên an toàn |
| Kết quả confirm hiện inserted/updated/skipped | Đạt | `result-inserted/overwritten/skipped`; khớp `DashboardImportConfirmResultAdminDto` (Inserted, Overwritten, Skipped) |
| Subtitle KPI | Đạt | Đúng nguyên văn |
| Traffic không đổi | Đạt | Chỉ khác `overwriteLabel` ("Ghi đè" vẫn giữ cho Traffic) |
| Route / tên field khớp BE | Đạt | `Admin/V2/Import/Kpi/{Template,Preview,Confirm}`, `Admin/V2/Kpi/DailyTargets` đều có trong controller thật |
| `DailyTargets` params, siteIds | Đạt | BE nhận `siteIds` là **string** phân tách bằng dấu phẩy; FE `siteIds.join(',')` và bỏ khi rỗng. Khớp. Hiện view chưa truyền siteIds |
| DTO DailyTargets | Đạt | `siteId, siteName, date (yyyy-MM-dd), dayType, gmvTarget, trafficTarget` khớp `KpiDailyTargetAdminDto`. Lưu ý BE còn trả `gmvHidden` mà FE bỏ qua (xem Ghi chú) |
| openapi + typings chỉ đổi phần KPI | Đạt | Diff `openapi/report.json` chỉ gồm 3 chỗ: path DailyTargets mới, Template (storeFormat→fromMonth/toMonth), Preview (period→fromMonth/toMonth). `report.d.ts` chỉ đổi đúng các operation đó; `report.runtime.json` là 1 dòng sinh lại. Không có churn ngoài KPI |
| `generatedClientCompleteness` xanh | Đạt | pass |
| Wizard chỉ GMV (6) và Traffic (3), bỏ DTT/CĐ/AOV/CSAT | Đạt | `KpiConfigurationModal.vue`; payload chỉ lọc `KPI_METRIC_IDS`. Test spec kpiManagementView:182, 385 |
| Scope wizard chỉ Chi nhánh, ghi quyết định | Đạt | Có ghi ở change log mục 3; plan cũ vẫn mở được |
| KpiTable bỏ cột DTT/CĐ/AOV | Đạt | `colspan` sửa 9/7 đúng số cột (đếm lại: canWrite = checkbox + 6 cột + trạng thái + thao tác) |
| KpiBulkUpdateModal | Đạt | Không có chỉ tiêu cần bỏ (worker báo, đã kiểm tra) |
| Section `Mục tiêu theo ngày`: month picker, bảng, chevron, formatter | Một phần | Đủ các thành phần và dùng `executiveFormatters`, nhưng cột "Số ngày đã nhập" sai mẫu số (lỗi 1) |
| Grep nhãn mục tiêu khác trong charts | Đạt | Không còn `mục tiêu DTT/AOV/chuyển đổi` trong dashboard-v2. Các file bị cấm đã được liệt kê trong change log, không bị sửa |
| Không sửa file bị cấm / legacy | Đạt | diff không đụng Executive*, GrowthAnalysis, heatmap, `report-dashboard/*` |
| Test cũ không bị bỏ ý định | Đạt | 5 test cũ bị viết lại có thay thế tương ứng và lý do rõ (change log mục 3) |
| Không thêm package | Đạt | package.json không đổi |

## 3. Lỗi phát hiện

### Cao
**1. "Số ngày đã nhập" luôn là N/N, không phải N/số ngày trong tháng**
- Vị trí: `views/KpiManagementView.vue`, computed `dailyBranches` (`totalDays += 1` cho mỗi dòng).
- BE `KpiDailyTargetService.GetDailyTargets` chỉ trả các dòng `KpiDailyTarget` đã tồn tại trong DB (không sinh dòng cho ngày chưa nhập). Vì vậy `totalDays` thực chất là số dòng nhận về, và `enteredDays` gần như bằng nó.
- Kịch bản: import mục tiêu cho 5 ngày của tháng 10 (31 ngày). Bảng hiện `5/5 ngày`, đề yêu cầu `5/31`. Người dùng không biết còn thiếu 26 ngày. Test hiện tại dùng mock có đủ dòng nên không phát hiện.
- Cách sửa đề xuất: tính `totalDays` từ tháng đang chọn (số ngày của `dailyMonth`, đã có `monthDateRange`), không đếm theo số dòng. Trong chi tiết mở rộng có thể sinh đủ các ngày của tháng, ngày chưa có dữ liệu hiển thị `—`/`—`, để người dùng thấy ngày thiếu. Thêm test với mock chỉ có vài ngày và kỳ vọng `n/31`.

### Trung bình
**2. Trải nghiệm nhập một phần chưa nêu rõ số dòng bị bỏ qua**
- Vị trí: banner trong `DashboardImportModal.vue` (`Nhập một phần: {{valid}} dòng hợp lệ sẽ được nhập... Các dòng lỗi sẽ bị bỏ qua.`) và màn kết quả.
- Trước confirm: banner có cùng một màu indigo dù có lỗi hay không; không nói số dòng lỗi (chỉ có ở thẻ đếm phía trên). Người dùng có thể bấm Xác nhận mà không để ý có N dòng sẽ bị bỏ.
- Sau confirm: "Bỏ qua" chỉ là một con số, không giải thích. Lưu ý BE tính `Skipped = tổng dòng - inserted - updated`, tức gồm cả dòng lỗi lẫn dòng không đổi nên con số có thể làm người dùng hiểu nhầm.
- Cách sửa đề xuất: khi `counts.error > 0`, đổi banner sang tone amber, ghi rõ "{error} dòng lỗi sẽ bị bỏ qua, chỉ {valid} dòng hợp lệ được nhập", kèm gợi ý tải file lỗi. Ở màn kết quả thêm một dòng chú thích "Bỏ qua gồm dòng lỗi và dòng không thay đổi" và nút tải file lỗi (nếu token còn dùng được). Nếu `canConfirm` false (0 dòng hợp lệ), nên có thông báo riêng.

**3. Không có chống race khi đổi tháng nhanh ở Mục tiêu theo ngày**
- Vị trí: `loadDailyTargets` + `watch(dailyMonth)`.
- Kịch bản: đổi tháng 10 → 11 → 12 nhanh; response cũ (tháng 10) về sau có thể ghi đè dữ liệu tháng 12 trong khi picker hiện 12.
- Cách sửa đề xuất: giữ một request id tăng dần và bỏ qua response không phải của lần gọi mới nhất.

### Thấp
**4.** Khi người dùng dùng plan cũ phạm vi Toàn công ty/Khu vực rồi mở sửa, bước 1 chỉ hiện nút Chi nhánh và không nút nào ở trạng thái chọn, dù `scopeType` vẫn là 1/2. Chấp nhận được theo quyết định đã ghi, nhưng nên hiện nhãn phạm vi hiện tại dạng chỉ đọc.
**5.** Khối 2 chỉ là tiêu đề chữ, không viền như "second block" trong đề; nên bọc cùng kiểu card cho đồng nhất.
**6.** Sau khi preview, khối chọn tháng bị ẩn nên người dùng không thấy khoảng tháng đang áp dụng khi xem kết quả. Nên hiện một dòng tóm tắt "Khoảng áp dụng: MM/YYYY – MM/YYYY".
**7.** `types.ts` vẫn còn các trường `storeFormat`, `requiresConflictPolicy`, `conflicts` trong `DashboardImportPreview` (BE vẫn trả). Không phải lỗi, chỉ là phần thừa; có thể để nguyên vì là hợp đồng BE.
**8.** Tải file mẫu: chưa có cảnh báo khi người dùng nhập tay giá trị tháng rỗng ở trình duyệt không hỗ trợ `type="month"`. Đã có thông báo `Vui lòng chọn đủ tháng...`, nên chỉ là ghi chú.

## 4. Ghi chú UX (tùy chọn)
- Trong bảng Mục tiêu theo ngày, thêm bộ lọc chi nhánh (hook `siteIds` đã sẵn trong API client).
- Bảng đang hiện trạng thái rỗng "Chưa có mục tiêu theo ngày trong tháng này"; có thể thêm link/nút mở modal import cho người có quyền ghi.
- Với người dùng không có quyền GMV, tổng GMV hiện `—`; có thể thêm tooltip "Bạn không có quyền xem GMV" để tránh nhầm với chưa nhập.
- BE trả thêm `gmvHidden` trên mỗi dòng, FE có thể dùng để phân biệt "không có quyền" với "chưa nhập".
- Mobile: bảng cuộn ngang (`min-w-[720px]`), khối chọn tháng xếp dọc ở màn nhỏ (`flex-col sm:flex-row`). Hợp lý.
