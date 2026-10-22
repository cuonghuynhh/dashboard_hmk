# W9 FE-E: Import mục tiêu KPI theo mẫu chi nhánh x ngày; chỉ Mục tiêu GMV và Traffic

- Worktree: `dashboard_hmk/wt/gui-e-kpi-fe` (pos.gui), branch `qc/w9-e-kpi-fe`
- Id: FE_E
- Contract BE: `docs/qc/W9_BE_E.md` (branch `qc/w9-be-kpi`)

## 1. Thay đổi chính

### 1.1 Modal import KPI (`DashboardImportModal.vue`, kind KPI)
- Bỏ: checkbox "Dùng mẫu bảng mục tiêu cửa hàng", ô "Tháng áp dụng", mẫu chuẩn và các chữ mô tả cũ, bộ điều khiển applyMode / conflictPolicy và khối xung đột.
- Bước 1 là một khối có viền, tiêu đề `1. Chọn khoảng tháng & tải file mẫu`:
  - `Từ tháng` / `Đến tháng` dùng `<input type="month">` (cùng kiểu với các control khác; repo chưa dùng `@vuepic/vue-datepicker` trong dashboard-v2).
  - Mặc định: tháng hiện tại → tháng hiện tại.
  - Kiểm tra: from ≤ to, tối đa 3 tháng. Lỗi hiển thị inline bằng tiếng Việt. Khi khoảng không hợp lệ, nút tải mẫu bị disable và chọn file cũng bị chặn.
  - Nút `Tải file mẫu (.xlsx)` nằm trong cùng khối với khoảng tháng (`data-test="kpi-template-block"`), dưới nút là gợi ý `Mỗi dòng là một chi nhánh trong một ngày. Ô để trống sẽ giữ nguyên mục tiêu hiện có. Không cần nhập Khu vực.`
- Bước 2 `2. Tải lên file đã điền`: dropzone giữ nguyên. Preview gửi `fromMonth` / `toMonth`.
- Confirm KPI chỉ gửi `{ token }`. Import là **một phần** (giống Traffic): dòng hợp lệ được ghi, dòng lỗi bị bỏ qua. Banner preview là `Nhập một phần`. Màn kết quả hiện `Thêm mới`, `Cập nhật`, `Bỏ qua` (data-test `result-inserted` / `result-overwritten` / `result-skipped`). Thẻ "Đang áp dụng" chỉ có ở KPI nên đã bỏ.
- Subtitle KPI: `Nhập Mục tiêu GMV và Mục tiêu Traffic theo chi nhánh, theo ngày (.xlsx)`.
- Luồng Traffic không đổi về logic. Chỉ khác ở nhãn "Ghi đè" (vẫn giữ cho Traffic).
- Prop `initialStoreFormat` đã bỏ (không ai truyền).

### 1.2 API (`services/dashboardV2Api.ts`, `openapi/report.json`)
- `kpiTemplate(fromMonth, toMonth)`, `kpiPreview(file, fromMonth, toMonth)`, `kpiConfirm({ token })`.
- Thêm `kpiV2Api.dailyTargets({ fromDate, toDate, siteIds? })` → `GET Admin/V2/Kpi/DailyTargets`. Kiểu dữ liệu `KpiDailyTargetRow` trong `types.ts`.
- `openapi/report.json`: sửa template (fromMonth/toMonth thay storeFormat), preview (fromMonth/toMonth thay period), thêm path `/Admin/V2/Kpi/DailyTargets`. Đã chạy `npm run openapi:report` để sinh lại `src/apis/schemas/report.d.ts` và `src/apis/definitions/report.runtime.json`. Diff của typings chỉ gồm các path này (đã kiểm tra: regenerate trước khi sửa cho ra file byte-identical).
- Không thêm package mới.

### 1.3 Wizard KPI (`KpiConfigurationModal.vue`)
- Chỉ còn hai chỉ tiêu: `Mục tiêu GMV (₫)` = metric **6** (bắt buộc, > 0) và `Mục tiêu Traffic (lượt khách)` = metric **3** (tùy chọn, không âm). Unit: GMV = 1 (Amount), Traffic = 3 (Count).
- Bỏ các ô DTT (metric 1), tỷ lệ chuyển đổi (2), AOV (4), CSAT (5) và kiểm tra tỷ lệ 0–100.
- Chỉ đưa ra scope Chi nhánh (xem mục 3).
- Payload chỉ gồm metric 6 và 3, kể cả khi sửa plan cũ có chỉ tiêu khác.

### 1.4 Bảng KPI và lịch sử phiên bản
- `KpiTable.vue`: bỏ cột Mục tiêu DTT, Tỷ lệ CĐ, AOV. Giữ `Mục tiêu GMV`, đổi nhãn `Traffic` thành `Mục tiêu Traffic`. Colspan của dòng rỗng đã sửa cho đúng số cột.
- `KpiVersionHistoryModal.vue`: nhãn chỉ còn cho metric 3 và 6. Các metric khác trong lịch sử không hiển thị. Bỏ nhánh format `%`.

### 1.5 Mục tiêu theo ngày (`views/KpiManagementView.vue`)
- Section mới `Mục tiêu theo ngày` (`data-test="kpi-daily-targets"`), đặt dưới danh sách KPI.
- Month picker `type="month"`, mặc định tháng hiện tại. Đổi tháng sẽ gọi lại API với `fromDate` = ngày 1, `toDate` = ngày cuối tháng.
- Bảng theo chi nhánh: `Chi nhánh`, `Tổng mục tiêu GMV`, `Tổng mục tiêu Traffic`, `Số ngày đã nhập` (N/total ngày), nút chevron mở danh sách theo ngày (`Ngày`, `Loại ngày`, `Mục tiêu GMV`, `Mục tiêu Traffic`).
- Ngày "đã nhập" là ngày có GMV hoặc Traffic khác null.
- Tổng GMV và GMV từng ngày hiển thị `—` khi `gmvTarget` là null (người dùng không có quyền GMV).
- Định dạng dùng `utils/executiveFormatters.ts`: `formatMoney`, `formatFullVnd`, `formatCount`, `formatExecutiveDate`.
- Trạng thái loading / lỗi (có nút thử lại) / rỗng.

## 2. Các file

Commit `8b745e40` (import flow):
- `openapi/report.json`
- `src/apis/schemas/report.d.ts`, `src/apis/definitions/report.runtime.json` (sinh lại)
- `src/pages/dashboard-v2/services/dashboardV2Api.ts`
- `src/pages/dashboard-v2/types.ts`
- `src/pages/dashboard-v2/components/DashboardImportModal.vue`
- `tests/dashboard-v2/dashboardImportModal.spec.ts`

Commit `5b15b10d` (wizard, bảng, daily targets):
- `src/pages/dashboard-v2/components/KpiConfigurationModal.vue`
- `src/pages/dashboard-v2/components/KpiTable.vue`
- `src/pages/dashboard-v2/components/KpiVersionHistoryModal.vue`
- `src/pages/dashboard-v2/views/KpiManagementView.vue`
- `tests/dashboard-v2/kpiManagementView.spec.ts`

`KpiBulkUpdateModal.vue` không có chỉ tiêu nào để bỏ (chỉ có cách thay đổi, giá trị và chu kỳ), nên không sửa.

## 3. Quyết định (khi đề bài chưa rõ)
- **Scope wizard**: đề bài nói "nếu bỏ không làm vỡ danh sách plan thì bỏ". Danh sách chỉ hiển thị nhãn scope, không phụ thuộc nút chọn trong wizard, nên giới hạn wizard còn **Chi nhánh**. Mặc định của plan mới là 3 (trước là 1). Plan cũ thuộc công ty hoặc khu vực vẫn mở được và giữ scope cũ, nhưng không có nút chọn scope tương ứng.
- **Metric 1 không còn là GMV**: `KpiTable` trước đây fallback GMV sang metric 1. Theo enum BE, metric 1 là Revenue (legacy, đã chuyển thành DTT). Đã bỏ fallback, GMV chỉ đọc metric 6.
- **Test tỷ lệ (AC-KPI04-03 rate 0–100)**: không còn chỉ tiêu tỷ lệ. Test `blocks rates above 100...` được viết lại thành `blocks a negative Traffic target...`, giữ ý định kiểm tra giá trị không âm và chặn lưu.
- **Test day-type và conflict**: giữ nguyên ý định, chỉ đổi metric 1 → 6 và thêm `scopeOptionsApi` mock vì mặc định đã là Chi nhánh.
- **Plan cũ có metric legacy khi sửa**: payload chỉ gửi metric 6 và 3. Các metric legacy không còn trong form nên không được gửi (BE sẽ từ chối nếu gửi).
- **Nhãn "Cập nhật"** (KPI) thay cho "Ghi đè" để khớp yêu cầu "updated". Traffic giữ "Ghi đè".
- **Tên file mẫu**: `mau-muc-tieu-chi-nhanh-<fromMonth>-<toMonth>.xlsx`.
- **Import một phần cho KPI**: đây là quyết định đã nêu trong BE_E. Nếu PM muốn "tất cả hoặc không" thì cần đổi cả hai phía.

## 4. Phát hiện ở các phần không được sửa (chỉ ghi nhận)
- `components/ExecutivePerformanceRanking.vue` (dòng ~374–375): cột `DTT` và `Tỷ trọng DTT` (doanh thu thuần, không phải mục tiêu, nên có thể giữ).
- `components/GrowthAnalysisChart.vue` (dòng 82–83, 148, 151, 396): tab và nhãn DTT / AOV là chỉ số tăng trưởng, không phải mục tiêu.
- `components/ExecutiveOrderEfficiencyChart.vue`: series AOV và UPT.
- `components/CashFlowChart.vue` (dòng 106, 150): series `Mục tiêu thực thu`. Chưa xác định nguồn (không thuộc danh sách nhãn của đề bài). Cần BE/PM xác nhận có phải từ KPI doanh thu cũ không.
- `utils/executiveCumulative.ts` (dòng 42, 86) và `components/ExecutiveCumulativeTrendChart.vue` (dòng 322): comment và subtitle "không có mục tiêu DTT" (logic cũ, đang đúng với BE mới).
- `src/components/report-dashboard/BranchPerformanceHeatmap.vue` (dòng 105): nhãn "Tỷ lệ chuyển đổi" của heatmap legacy, đúng là thuộc phần heatmap nên không sửa.
- `components/PersonnelScorecard.vue`, `PersonnelStaffSelfView.vue`: CSAT là điểm hài lòng nhân viên, không phải mục tiêu KPI, không sửa.

## 5. Xác minh
- `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2`
  - 57 file, 515 test: 513 pass, 2 fail.
  - 2 fail đều ở `tests/dashboard-v2/executiveView.spec.ts` (`updates both child region and multi-branch filters...` và `overwrites every local period...`), lỗi `Test timed out in 5000ms` khi chạy song song cả bộ. Chạy riêng file này: 43/43 pass. File này không thuộc phạm vi đã sửa.
  - Baseline trước khi sửa: 57 file, 507 test (pass). Tăng +8 test: import +5 (2 test cũ thay bằng 7 test mới), KPI management +3 (test daily targets).
- `npx vue-tsc -b --noEmit`: 0 lỗi.
- `npx eslint src/pages/dashboard-v2`: 0 lỗi, 3 cảnh báo có sẵn trong `ExecutiveChartFilters.vue` (không thuộc phạm vi).
- `generatedClientCompleteness.spec.ts`: pass (32/32).
- Chưa chạy trên backend thật. Các test dùng mock. Chưa kiểm tra hiển thị trên trình duyệt.

## Vòng sửa 1 (sau QC round 1, `W9_QC_FE_E_r1.md`)

Commit: `f82f0eb0` (import), `70665645` (mục tiêu theo ngày, wizard).

1. **Số ngày đã nhập (cao)**: mẫu số là số ngày của tháng đang chọn (`N/31`), không phải số dòng BE trả về. Chi tiết mở rộng liệt kê đủ mọi ngày của tháng; ngày chưa có dòng hiển thị `—` và được làm mờ. Ngày đã nhập là ngày có GMV hoặc Traffic khác null. Loại ngày của ngày thiếu tính theo thứ (T7/CN = Cuối tuần). Test: 5 ngày nhập của tháng 10 → `5/31`, 31 dòng.
2. **Nhập một phần (trung bình)**: khi preview có dòng lỗi (chỉ KPI), banner màu amber hiện số dòng lỗi "N dòng lỗi sẽ không được nhập — tải file lỗi để xem chi tiết", có link tải file lỗi và checkbox "Tôi hiểu các dòng lỗi sẽ bị bỏ qua". Nút Xác nhận bị khóa đến khi tick. Không có dòng lỗi thì không cần checkbox. Màn kết quả KPI: "Thêm mới X · Cập nhật Y · Bỏ qua Z" kèm chú thích "Bỏ qua gồm dòng lỗi và dòng không có giá trị." Traffic giữ nguyên luồng (đề bài: không đổi). Test: banner, checkbox khóa/mở, dòng kết quả.
3. **Race (trung bình)**: mỗi lần tải mục tiêu theo ngày có số thứ tự; chỉ kết quả của lần mới nhất được ghi vào state. Test: yêu cầu tháng 10 trả về sau khi đã chuyển sang tháng 9 thì bị bỏ qua.
4. **Thấp**:
   - Khối 2 "2. Tải lên file đã điền" là card có viền, cùng kiểu khối 1.
   - Sau preview hiện dòng chỉ đọc `Khoảng áp dụng: MM/YYYY – MM/YYYY`.
   - Wizard: plan cũ Công ty/Khu vực hiện nhãn chỉ đọc `Phạm vi cũ: Công ty` / `Phạm vi cũ: Khu vực`, không hiện ô chọn đối tượng.
   - Bỏ field type thừa trong `DashboardImportPreview` (`storeFormat`, `requiresConflictPolicy`, `period`, `conflicts`) và `DashboardImportConfirmResult` (`activated`, `archived`). Type `DashboardImportConflict` không còn dùng nên cũng bỏ. BE vẫn trả các field này; FE chỉ không khai báo.

Không làm (QC ghi nhận là tùy chọn): bộ lọc chi nhánh theo `siteIds`; tooltip / phân biệt `gmvHidden` (BE trả thêm, FE chưa dùng); nút mở modal import từ trạng thái rỗng.

### Xác minh vòng 1
- `vitest run tests/dashboard-v2 e2e/dashboard-v2` (cả bộ): 57 file, 520 test, 512 pass, 8 fail. Cả 8 đều trong `executiveView.spec.ts` và đều `Test timed out in 5000ms` (tải song song). Chạy riêng `executiveView.spec.ts`: 43/43 pass. File này không nằm trong diff FE_E.
- Targeted: `dashboardImportModal.spec.ts` 13/13; `kpiManagementView.spec.ts` 22/22.
- `vue-tsc -b --noEmit`: 0 lỗi.
- `eslint src/pages/dashboard-v2`: 0 lỗi, 3 cảnh báo có sẵn (`ExecutiveChartFilters.vue`).
