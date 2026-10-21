# W9 QC D (vòng 1): Cơ cấu khu vực (chỉ xem)

Worktree `wt/gui-d-region`, nhánh `qc/w9-d-region`, base `81e46b90`. Commit: `ad5eb2fb`, `0cae9331`.

## 1. Kết luận: ĐẠT

Có 0 lỗi mức Cao, 2 lỗi mức Trung bình, 4 lỗi mức Thấp. Các lỗi Trung bình không chặn merge. Nên sửa trong vòng sau hoặc ghi vào backlog.

Số liệu tôi tự chạy trong worktree:
- `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2`: **58 file / 524 test đạt, 0 lỗi** (baseline 57 / 507). Khớp change log.
- `npx vue-tsc -b --noEmit`: **0 lỗi**.
- `npx eslint src/pages/dashboard-v2`: **0 lỗi, 3 cảnh báo**. Cảnh báo `vue/require-default-prop` nằm ở `ExecutiveChartFilters.vue`, có từ trước, không thuộc phạm vi thay đổi.
- Không có file nào dưới `src/components/report-dashboard/` bị sửa (kiểm tra bằng `git diff --stat`). Modal cũ `RegionManagerModal` còn nguyên.
- Không có test bị xóa. Hai test cũ được đổi theo hành vi mới (xem lỗi 2).

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| Component mới `RegionHierarchyModal.vue`, không sửa modal cũ | Đạt | File mới, `isOpen` / `update:isOpen`. Modal cũ không nằm trong diff. |
| Rộng `max-w-5xl`, cao `85vh`, cuộn trong | Đạt | `RegionHierarchyModal.vue:147` (`max-h-[85vh] max-w-5xl`), vùng thân `:196` (`overflow-y-auto`). |
| Header: tiêu đề, dòng phụ, nút × | Đạt | `:151-162`. Nút × có `aria-label="Đóng"`. |
| Chip tổng khu vực / cụm / chi nhánh, chip hổ phách chưa phân cụm khi N > 0 | Đạt | `:166-177`. Chip hổ phách có `v-if > 0`. |
| Ô tìm kiếm không phân biệt dấu, dùng lại chuẩn hóa của SearchableMultiSelect | Đạt | `utils/searchText.ts` được tách ra, `SearchableMultiSelect` import lại. Test "search filters...". |
| Tìm: lọc cây giữ tổ tiên, tô sáng, tự mở nhóm khớp | Đạt | `filterRegionHierarchy`, `highlightSegments`, `isCollapsed` bỏ qua trạng thái thu gọn khi đang tìm (`:48-50`). |
| Hai pane, xếp chồng dưới md | Đạt | `md:flex`, `md:w-60` (240px), aside `border-b` trên mobile. Chưa xem trên trình duyệt thật. |
| Pane trái: "Tất cả khu vực" + từng khu vực kèm `N cụm · M CN` | Đạt | `:224-247`. |
| Pane phải: thẻ cho từng cụm, `M chi nhánh`, chip tròn `rounded-full bg-slate-100 px-2.5 py-1 text-xs` | Đạt | `:265-299`. |
| Tiêu đề khu vực khi chọn "Tất cả" | Đạt | `showRegionHeadings`, `:258`. |
| Thẻ nét đứt hổ phách "Chưa phân cụm" kèm gợi ý "Chi nhánh chưa có trong cấu hình cụm của HRM" | Đạt | `:301-315`. |
| Nhóm cuối "Chưa thuộc khu vực" (UI vẫn tách khỏi "Chưa phân cụm") | Đạt | `:318-332`, thẻ riêng nét đứt xám, `data-test="region-hierarchy-orphan-card"`. Chip tổng gộp cả hai loại (đúng ghi chú của lead). Xem lỗi 1 về trường hợp một khu vực. |
| BOD: nút "Đồng bộ lại từ HRM", spinner, toast số liệu, tải lại store, toast lỗi | Đạt | `:97-114`, `:337-353`. Gọi `locationStore.refresh`. Test "BOD sync..." và "error toast". |
| API `syncFromHrm` | Đạt | `dashboardV2Api.ts`: `AdminV2RegionSyncFromHrm`, `toastError:false`. Kiểu `DashboardRegionSyncResult` có sẵn. |
| MANAGER: dòng thông tin phạm vi | Đạt | `:178`, hiện khi `!allSites`, đúng chữ yêu cầu. |
| Một khu vực: ẩn pane trái, hiện tên khu vực làm tiêu đề | Đạt | `singleRegion`, `showRegionHeadings`. |
| Một cụm: hiện mở sẵn | Đạt | Mặc định mở. |
| STAFF không có nút ở filter bar | Đạt | `v-if="!isStaff"`. Test `dashboardAccess.spec.ts` có assertion mới. |
| MANAGER thấy nút (ý định của lead) | Đạt | Test được đổi sang `toBe(true)`. |
| Đổi tên nút "Cơ cấu khu vực", icon sơ đồ cây, giữ `data-test` | Đạt | `DashboardV2FilterBar.vue`, hunk `@@ -420`. |
| Bỏ mọi thao tác tạo / sửa / xóa khu vực ở V2 | Đạt | Bỏ prop `openRegionManager`, `showRegionManager`, `useModal`. Test "no create/edit/delete". |
| Trạng thái tải / rỗng / lỗi có "Thử lại" | Đạt | `:198-214`. Store ném lỗi khi cả 3 nguồn thất bại, nên nhánh lỗi chạy được. |
| a11y: `role=dialog`, `aria-modal`, `aria-labelledby`, focus ô tìm, Esc, bấm nền | Đạt | `:143-148`, `:116-131`, `:82-84`, backdrop `:141`. Test "closes on Escape...", "focuses the search box...". |
| Test: BOD, lọc khu vực, tìm, MANAGER một khu vực, STAFF, Esc, không có điều khiển sửa | Đạt | 17 test mới trong `regionHierarchyModal.spec.ts`. Có thêm test sync, lỗi, rỗng. |
| Cập nhật test filter bar | Một phần | Test foundation bị đơn giản hóa (xem lỗi 2). |

## 3. Lỗi phát hiện

### Trung bình

**1. Chi nhánh "Chưa thuộc khu vực" bị ẩn khi phạm vi chỉ có một khu vực, nhưng chip vẫn đếm chúng.**
- Vị trí: `RegionHierarchyModal.vue:43`, `:60`. `showOrphans = !effectiveRegionId && ...`, và `effectiveRegionId` luôn có giá trị khi `singleRegion`.
- Kịch bản: MANAGER (hoặc BOD, nếu HRM chỉ có một khu vực) có chi nhánh được gán nhưng không nằm trong cây HRM. `buildRegionHierarchy` đưa chi nhánh đó vào `orphanSites`, nên chip hổ phách báo "N chi nhánh chưa phân cụm". Khung "Chưa thuộc khu vực" không hiện vì `effectiveRegionId` khác null. Người dùng thấy con số nhưng không thấy chi nhánh nào. Đúng là kiểu dữ liệu sai lệch mà modal này cần giúp phát hiện.
- Sửa đề xuất: đổi `showOrphans` thành `(singleRegion.value || !selectedRegionId.value) && filtered.value.orphanSites.length > 0`. Khi người dùng chọn một khu vực cụ thể ở chế độ nhiều khu vực thì vẫn ẩn. Thêm một test: một khu vực + một chi nhánh mồ côi thì thẻ `region-hierarchy-orphan-card` hiện.

**2. Test foundation mất assertion về đồng bộ tải lại khu vực.**
- Vị trí: `tests/dashboard-v2/dashboardV2Foundation.spec.ts`, test "opens the read-only region hierarchy...".
- Test cũ kiểm tra rằng sau khi lưu, `locationApi.regions` được gọi lần 2 và cả hai filter bar cùng nhận danh sách mới ('Miền Bắc'). Test mới chỉ kiểm tra mở modal, Esc đóng, và số lần gọi vẫn là 1. Đường "sync xong thì filter bar cập nhật cùng store" không được test ở mức filter bar. Test sync trong `regionHierarchyModal.spec.ts` chỉ kiểm tra store, không kiểm tra filter bar.
- Kịch bản rủi ro: sau này ai đó đổi `refresh` sang store riêng thì filter bar giữ danh sách khu vực cũ mà không có test nào báo.
- Sửa đề xuất: thêm một test mount `DashboardV2FilterBar` kèm modal, bấm "Đồng bộ lại từ HRM" (mock `syncFromHrm` và `regions` trả danh sách mới ở lần gọi thứ 2). Sau đó kiểm tra `dashboard-region-option` đã cập nhật.

### Thấp

**3.** Modal không có focus trap và không trả focus về nút "Cơ cấu khu vực" khi đóng. Với `aria-modal="true"`, bàn phím có thể Tab ra ngoài modal. Đề xuất: lưu `document.activeElement` khi mở và `focus()` lại khi đóng. Có thể thêm trap Tab đơn giản. Hoặc dùng cùng cơ chế với modal V2 khác nếu có.

**4.** Khi store dùng nhánh dự phòng (cây HRM trống, `dashboardV2Locations.ts` tổng hợp "cụm" tên trùng tên khu vực), modal hiển thị các cụm giả mang tên khu vực. Đây là hành vi sẵn có của store, ngoài phạm vi task D. Ghi nhận để lead biết. Nếu muốn tránh, modal nên đọc `locationApi.tree` trực tiếp thay vì `tree` của store.

**5.** Pane trái dùng `filtered.regions`, nên khi đang tìm kiếm số `N cụm · M CN` là số sau lọc, không phải tổng thật của khu vực. Khu vực đang chọn có thể biến mất khỏi danh sách trong lúc tìm. Pane phải khi đó hiện "Không tìm thấy". Đề xuất: pane trái luôn dùng `model.regions` cho số đếm, hoặc tự về "Tất cả" khi khu vực đang chọn không còn kết quả.

**6.** Chưa có test cho nhánh toast cảnh báo khi sync trả `conflicts` (change log đã tự nêu). Nên thêm một test nhỏ.

## 4. Ghi chú UX (tùy chọn)

- Mỗi thẻ cụm có nút thu gọn, ngoài yêu cầu nhưng hợp lý. Có thể thêm nút "Mở/Thu gọn tất cả" khi số cụm lớn.
- Nút × dùng ký tự `✕` và icon kính lúp dùng emoji `&#128269;`. Dễ lệch giữa các hệ điều hành. Nên dùng SVG như các icon khác trong V2.
- Chip hổ phách gộp "chưa phân cụm" và "chưa thuộc khu vực". Theo ý lead là chấp nhận được. Có thể thêm `title` giải thích để người dùng hiểu số này gồm cả hai nhóm.
- Hai khối `N cụm · M CN` bị lặp công thức (`:246`, `:262`). Nên tách thành computed hoặc thêm trường vào model.
- Chưa kiểm tra trên trình duyệt thật, đặc biệt ở màn hẹp (< md) và hành vi focus. Đánh giá dựa trên template và test jsdom.
