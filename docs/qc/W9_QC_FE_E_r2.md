# W9 QC FE_E, vòng 2

Worktree `wt/gui-e-kpi-fe` (qc/w9-e-kpi-fe), base `81e46b90`, commit sửa `f82f0eb0`, `70665645`.

## 1. Kết luận: ĐẠT

Số liệu tự chạy (theo yêu cầu, bỏ qua bộ đầy đủ vì `executiveView.spec.ts` là flake tải đã biết):
- `vitest run` 3 spec FE_E (`dashboardImportModal`, `kpiManagementView`, `generatedClientCompleteness`): 3 file, **67/67 pass**. Lưu ý môi trường: Node mới cần `NODE_OPTIONS=--no-experimental-webstorage` thì mới chạy được (không liên quan code FE_E).
- `vue-tsc -b --noEmit`: 0 lỗi.
- `eslint src/pages/dashboard-v2`: 0 lỗi, 3 cảnh báo có sẵn (`ExecutiveChartFilters.vue`).

Không có lỗi mức Cao. Còn 3 điểm Thấp, đều không chặn.

## 2. Bảng yêu cầu (các quyết định của Lead)

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| N/số ngày của tháng, liệt kê đủ mọi ngày | Đạt | `KpiManagementView.vue` `monthDates()` + `dailyBranches`: mẫu số = `days.length` (số ngày của `dailyMonth`), ngày thiếu là `null` hiển thị `—`, mờ đi; `dayTypeOf` T7/CN = 2. Test `counts entered days out of every day of the month...` |
| Banner amber khi có dòng lỗi | Đạt | `data-test="kpi-error-banner"`, nêu số dòng lỗi, số dòng hợp lệ, link tải file lỗi. Chỉ KPI; Traffic giữ banner cũ (`v-if="isTraffic \|\| counts.error === 0"`) |
| Checkbox xác nhận bắt buộc trước khi Xác nhận | Đạt | `canConfirm` yêu cầu `acknowledgedPartial` khi KPI và `counts.error > 0`; reset ở `reset`, `uploadAndPreview`. Hàm `confirmImport` cũng kiểm tra `canConfirm` nên không bypass được bằng Enter |
| Dòng kết quả "Thêm mới · Cập nhật · Bỏ qua" + chú thích | Đạt | `data-test="result-summary"`, giữ nguyên các data-test `result-inserted/overwritten/skipped`; chú thích "Bỏ qua gồm dòng lỗi và dòng không có giá trị." Traffic vẫn dùng 3 thẻ cũ |
| Chống response cũ | Đạt | `dailyRequestSeq`, kiểm tra sau `await` ở cả nhánh thành công lẫn lỗi. Test `ignores a stale daily-target response...` |
| Khối 2 là card có viền | Đạt | `data-test="upload-block"`, `rounded-xl border border-indigo-100`; chỉ KPI. Test `renders block 2 as a bordered card` |
| Tóm tắt khoảng tháng sau preview | Đạt | `kpi-range-summary` hiện khi có `preview` hoặc `successResult`, định dạng `MM/YYYY – MM/YYYY` |
| Plan cũ: nhãn phạm vi chỉ đọc | Đạt | `legacyScopeLabel`, `data-test="kpi-legacy-scope"`; ô chọn đối tượng chỉ còn cho scope 3; `loadScopeOptions` chỉ gọi cho scope 3. Test `shows a read-only label for a legacy company plan` |
| Bỏ type thừa | Đạt | `DashboardImportConflict`, `storeFormat`, `requiresConflictPolicy`, `period`, `conflicts`, `activated`, `archived` đã bỏ; vue-tsc sạch nên không còn chỗ dùng; BE vẫn trả thì FE bỏ qua an toàn |
| Không hồi quy test | Đạt | Chỉ thêm 5 test mới, không xóa/yếu hóa test cũ; diff vòng 2 không đụng file cấm hay `report-dashboard/*` |

## 3. Lỗi phát hiện

### Cao
Không có.

### Trung bình
Không có.

### Thấp
**1. Nhãn phạm vi cũ sai với scope 4 (hoặc giá trị lạ).**
- Vị trí: `KpiConfigurationModal.vue`, `legacyScopeLabel`: `scopeType === 1 ? 'Công ty' : 'Khu vực'`, mọi giá trị khác 1 và 3 đều thành "Khu vực". Trước vòng 1 code còn nhánh `scopeType === 4` (nhập mã đối tượng), nên scope 4 là giá trị hợp lệ trong plan cũ.
- Kịch bản: mở sửa plan cũ có scope 4 thì hiện "Phạm vi cũ: Khu vực".
- Sửa đề xuất: dùng `scopeLabels[scopeType] ?? 'Khác'` (map đã có sẵn, thêm khóa 4 nếu cần) thay vì toán tử ba ngôi.

**2. Banner lỗi khi 0 dòng hợp lệ.**
- Vị trí: `DashboardImportModal.vue`, khối `kpi-error-banner`.
- Kịch bản: file toàn dòng lỗi (`valid = 0`, `canConfirm = false` từ BE) vẫn hiện "Chỉ 0 dòng hợp lệ sẽ được nhập" và checkbox xác nhận, trong khi nút Xác nhận khóa bất kể. Checkbox vô nghĩa, gây khó hiểu.
- Sửa đề xuất: khi `!preview.canConfirm` thì ẩn checkbox và đổi câu thành "Không có dòng hợp lệ để nhập, tải file lỗi để sửa".

**3. Request tháng không hợp lệ không vô hiệu hóa request đang bay.**
- Vị trí: `loadDailyTargets`, nhánh `if (!MONTH_PATTERN.test(...)) return` đứng trước `++dailyRequestSeq`.
- Kịch bản: chọn tháng hợp lệ, request chưa về, người dùng xóa ô tháng (giá trị rỗng): response cũ vẫn ghi vào state vì seq chưa tăng. Rất hiếm, hậu quả nhỏ (bảng hiện dữ liệu tháng cũ trong khi picker trống).
- Sửa đề xuất: tăng `dailyRequestSeq` trước khi kiểm tra pattern.

## 4. Ghi chú UX (tùy chọn)
- Hàng ngày đã tắt mờ (`text-slate-400`) tương phản khá thấp; cân nhắc `text-slate-500` cho a11y.
- Các ghi chú tùy chọn vòng 1 (lọc chi nhánh theo `siteIds`, dùng `gmvHidden`, nút mở import từ trạng thái rỗng) vẫn chưa làm, đúng như đã thống nhất.
