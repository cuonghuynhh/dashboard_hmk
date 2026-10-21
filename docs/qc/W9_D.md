# W9 / D: Cơ cấu khu vực (xem chỉ đọc)

- Worktree: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/wt/gui-d-region`
- Branch: `qc/w9-d-region` (pos.gui)
- Commit:
  - `ad5eb2fb` refactor(dashboard-v2): share diacritic-insensitive search normaliser
  - `0cae9331` feat(dashboard-v2): read-only region hierarchy viewer replaces region editor

## Nội dung thay đổi

Trên V2, nút mở modal quản lý khu vực cũ (tạo, sửa, xóa) được thay bằng một modal **chỉ xem** cơ cấu Khu vực → Cụm → Chi nhánh, lấy từ dữ liệu đồng bộ HRM. Modal cũ `components/report-dashboard/RegionManagerModal.vue` vẫn được dùng bởi dashboard cũ và không bị sửa.

- **Thanh bộ lọc V2** (`DashboardV2FilterBar.vue`):
  - Nút đổi tên thành `Cơ cấu khu vực`, có icon sơ đồ cây, giữ `data-test="dashboard-region-manager"`.
  - Nút hiện cho mọi vai trò trừ STAFF. Trước đây chỉ hiện khi `allSites` (BOD).
  - Bỏ prop `openRegionManager` và toàn bộ luồng tạo, sửa, xóa khu vực trong V2.
- **Modal mới** `components/RegionHierarchyModal.vue`:
  - Theo mẫu `isOpen` và `update:isOpen` của `DashboardImportModal`.
  - Header: tiêu đề, dòng phụ "Dữ liệu đồng bộ từ HRM — chỉ xem", nút ×.
  - Chip tổng: số khu vực, cụm, chi nhánh. Chip hổ phách "N chi nhánh chưa phân cụm" hiện khi N > 0.
  - Ô tìm kiếm: không phân biệt dấu, tự focus khi mở. Lọc theo cây, tô sáng phần khớp, các nhóm khớp luôn mở.
  - Thân: danh sách khu vực bên trái (≈240px, có "Tất cả khu vực"). Bên phải là thẻ cho từng cụm, có tiêu đề nhóm khu vực khi chọn "Tất cả". Chi nhánh chưa thuộc cụm nằm trong thẻ nét đứt hổ phách. Chi nhánh không thuộc khu vực nào nằm trong nhóm "Chưa thuộc khu vực".
  - Esc hoặc bấm nền để đóng.
  - Trạng thái tải, lỗi (có nút Thử lại), rỗng.
  - Footer "Đồng bộ lại từ HRM" chỉ hiện cho BOD. Trong lúc chạy có spinner. Xong thì toast số liệu và tải lại store. Lỗi thì toast lỗi.
- **Store và API**:
  - `dashboardV2LocationApi.syncFromHrm()` gọi `AdminV2RegionSyncFromHrm` (`POST /Admin/V2/Region/SyncFromHrm`) với `toastError: false`, để modal tự hiển thị toast.
  - Kiểu `DashboardRegionSyncResult` đã có sẵn trong `types.ts`.
  - Store `useDashboardV2LocationStore` không đổi.
- **Logic dữ liệu** `utils/regionHierarchy.ts` (mới):
  - `buildRegionHierarchy` dựng mô hình từ cây HRM, nhận tập chi nhánh được phép (null với BOD).
  - `filterRegionHierarchy` giữ các nút khớp và tổ tiên.
  - `highlightSegments` tô sáng kết quả khớp không phân biệt dấu, ánh xạ vị trí về chuỗi gốc.
  - Cụm placeholder (`CHUA_PHAN_CUM` hoặc tên "Chưa phân cụm") được gom vào "Chưa phân cụm" của khu vực đó. Khu vực placeholder (`CHUA_PHAN_KHU_VUC`) được gom vào "Chưa thuộc khu vực".
- **Chuẩn hóa tìm kiếm** `utils/searchText.ts` (mới): hàm `normalizeSearchText` lấy từ `SearchableMultiSelect`, `SearchableMultiSelect` nay import từ đây. Hành vi không đổi.

## File

| File | Loại |
|---|---|
| `src/pages/dashboard-v2/components/RegionHierarchyModal.vue` | mới |
| `src/pages/dashboard-v2/utils/regionHierarchy.ts` | mới |
| `src/pages/dashboard-v2/utils/searchText.ts` | mới |
| `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue` | sửa |
| `src/pages/dashboard-v2/components/SearchableMultiSelect.vue` | sửa (chỉ import hàm chuẩn hóa) |
| `src/pages/dashboard-v2/services/dashboardV2Api.ts` | sửa (thêm `syncFromHrm`) |
| `tests/dashboard-v2/regionHierarchyModal.spec.ts` | mới, 17 test |
| `tests/dashboard-v2/dashboardV2Foundation.spec.ts` | sửa test mở modal |
| `tests/dashboard-v2/dashboardAccess.spec.ts` | sửa test quyền |

## Quyết định

1. **Đếm chi nhánh.** Tổng chi nhánh là số chi nhánh khác nhau trong phạm vi hiện tại, gồm cả nhóm chưa phân cụm và nhóm chưa thuộc khu vực. "Chưa phân cụm" là mọi chi nhánh không thuộc cụm thật nào, kể cả chi nhánh không thuộc khu vực. Với dữ liệu test: 9 chi nhánh, 3 chưa phân cụm.
2. **Nút mở cho MANAGER.** Brief chỉ nói STAFF không có nút. Test cũ "MANAGER nhiều chi nhánh không có nút" đã được đổi thành "có nút", vì MANAGER cần xem cơ cấu trong phạm vi của mình. Ý định của test (chỉ thấy chi nhánh được gán) vẫn được giữ.
3. **Nút ẩn với chi nhánh đơn.** Nút nằm ngoài nhánh `showSelectors`, nên MANAGER chỉ có một chi nhánh vẫn thấy nút, dù chip chi nhánh đơn thay bộ chọn.
4. **Thu gọn cụm.** Mỗi thẻ cụm có nút thu gọn, mặc định mở. Khi đang tìm kiếm, mọi nhóm khớp luôn mở. Khi xóa tìm kiếm, trạng thái thu gọn của người dùng được khôi phục. Yêu cầu "cụm duy nhất mở sẵn" được thỏa tự nhiên vì mặc định đã mở.
5. **Khu vực chỉ có một.** Ẩn cột trái và hiện tên khu vực làm tiêu đề bên phải. Với MANAGER, chi nhánh ngoài phạm vi bị lọc ở phía client, kể cả khi server đã giới hạn.
6. **Khu vực toàn ngoài phạm vi.** Khu vực có chi nhánh nhưng không còn chi nhánh nào trong phạm vi sẽ bị ẩn, không hiện khung rỗng.
7. **Giả định về `region.sites`.** Giả định trường `sites` ở cấp khu vực trong cây HRM là các chi nhánh không thuộc cụm nào. Các chi nhánh đã có trong cụm sẽ được loại trùng.
8. **Thông báo xung đột.** Nếu sync trả về `conflicts`, hiện thêm một toast cảnh báo. Không có xung đột thì không hiện.
9. **Prop `openRegionManager` bị bỏ.** Test foundation được viết lại theo hướng mở modal, kiểm tra modal và reload store, không còn dựa vào callback cũ.

## Xác minh

- `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2`: **58 file / 524 test đạt, 0 lỗi.** Mốc ban đầu 57 file / 507 test, tăng thêm 1 file và 17 test mới.
- `npx vue-tsc -b --noEmit`: **0 lỗi.**
- `npx eslint src/pages/dashboard-v2`: **0 lỗi, 3 cảnh báo** có sẵn trong `ExecutiveChartFilters.vue` (prop thiếu default), không thuộc phạm vi thay đổi.
- Legacy: `tests/dashboard-v2/regionManagerModal.spec.ts` vẫn đạt. Không sửa file dưới `components/report-dashboard/`.

## Chưa làm

- Không kiểm tra trên trình duyệt thật. Chỉ có test component (jsdom). Nên QC bằng mắt trên màn hình hẹp (< md) và kiểm tra focus, Esc.
- Chưa có test cho nhánh xung đột sync (toast cảnh báo).
- Không thay đổi API phía server.

## Vòng sửa 1

Commit: `acd07e29` fix(dashboard-v2): region hierarchy review round 1. Nguồn: `docs/qc/W9_QC_D_r1.md` và quyết định của lead.

- **M1, nhóm "Chưa thuộc khu vực" khi phạm vi có một khu vực.** Nhóm này nay hiện cả khi chỉ có một khu vực. Điều kiện là `(singleRegion || chưa chọn khu vực) && có chi nhánh`. Khi chọn một khu vực ở chế độ nhiều khu vực thì vẫn ẩn. Test: "still shows the no-region branches when the scope has a single region".
- **M2, đồng bộ rồi tải lại trong thanh lọc.** Test mới trong `dashboardAccess.spec.ts`: BOD bấm đồng bộ trong modal, store tải lại, tùy chọn khu vực trong thanh lọc có thêm khu vực mới. Test cũ trong `dashboardV2Foundation.spec.ts` không đổi.
- **Thấp, focus.** Khi mở, modal ghi nhớ phần tử đang có focus. Khi đóng, focus quay lại phần tử đó (nút "Cơ cấu khu vực"). Test: "returns focus to the element that opened the modal".
- **Thấp, số đếm bên trái.** Số đếm luôn là tổng chưa lọc. Khi tìm kiếm, khu vực không khớp được làm mờ và hiện "0 kết quả". Khu vực đang chọn vẫn hiện. Test: "keeps left-pane totals while searching and dims regions with no match".
- **Thấp, toast cảnh báo xung đột.** Test: "warns with a toast when the sync reports branches in more than one cluster".
- Lỗi thấp 4 (store fallback tạo cụm giả) giữ nguyên theo quyết định của lead.
- Chưa làm (không nằm trong quyết định của lead): focus trap trong modal, icon SVG thay ✕ và emoji kính lúp, tách công thức đếm lặp thành helper (đã làm một phần qua `regionTotals`).

### Số liệu xác minh (vòng 1)

- `npx vitest run tests/dashboard-v2 e2e/dashboard-v2`: lần chạy sạch gần nhất **525 đạt / 4 lỗi trên 529**. Có 3 lỗi trong `executiveView.spec.ts` và 1 lỗi snapshot trong `e2e/dashboard-v2/dashboardV2Responsive.spec.ts`. Các lỗi này là timeout phụ thuộc tải (`Test timed out in 5000ms`). Chạy riêng từng file thì `dashboardV2Responsive.spec.ts` đạt 7/7. `executiveView.spec.ts` lúc đạt 43/43, lúc lỗi 1–2 test khác nhau, và file này không import module nào đã thay đổi. Đây là lỗi flaky có sẵn, chưa xác minh được nguyên nhân gốc.
- Các file liên quan đạt: `regionHierarchyModal.spec.ts` 21/21, `dashboardAccess.spec.ts` 19/19, `dashboardV2Foundation.spec.ts` 7/7.
- `npx vue-tsc -b --noEmit`: **0 lỗi.**
- `npx eslint src/pages/dashboard-v2`: **0 lỗi, 3 cảnh báo** có sẵn trong `ExecutiveChartFilters.vue`.
