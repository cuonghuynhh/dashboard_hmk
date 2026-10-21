# QC W9 A1 vòng 1: ScopeViewFilter và bảng Xếp hạng hiệu suất

Worktree `wt/gui-a1-scope`, nhánh `qc/w9-a1-scope`, base `81e46b90`, 3 commit (8f0eb651, 9bb0e0b7, 222b9b26).

## 1. Kết luận: ĐẠT

Số liệu tự chạy:
- `vitest run tests/dashboard-v2 e2e/dashboard-v2` (full, song song): 60 file, 537 test, 533 pass, 4 fail. Cả 4 đều là timeout 5s trong `executiveView.spec.ts` (máy thiếu RAM, nhiều agent chạy cùng lúc).
- Chạy riêng 5 file liên quan (executiveView, executivePerformanceRanking, scopeViewFilter, scopeViewOptions, executiveRankingSort): 5 file, 85 test, 85 pass. Vậy 4 fail là do tải, không phải lỗi code.
- `vue-tsc -b --noEmit`: 0 lỗi.
- `eslint src/pages/dashboard-v2`: 0 lỗi, 3 cảnh báo có sẵn (ExecutiveChartFilters.vue).
- Không đổi `src/components/report-dashboard/*`. Không xóa test.

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| ScopeViewFilter: segmented Khu vực/Cụm/Chi nhánh, aria-pressed, data-test `${testKey}-view-*` | Đạt | ScopeViewFilter.vue:63-76 |
| Multi-select theo view, entity-label và nhãn rỗng đúng bảng, data-test `${testKey}-scope-select` | Đạt | scopeViewOptions.ts:49-53; ScopeViewFilter.vue:77-87 |
| Nhãn cụm `"<cụm> · <khu vực>"` khi biết khu vực | Đạt | scopeViewOptions.ts:157-160 |
| Props đủ (view, selectedIds, regions, clusters, branches, loading, master*, testKey, views) | Đạt | ScopeViewFilter.vue:12-34 |
| Options giới hạn theo master (site > cụm > khu vực > tất cả), util thuần có test | Đạt | scopeViewOptions.ts:63-179; scopeViewOptions.spec.ts (7) |
| Emit `change {view, ids}`; đổi view thì ids rỗng | Đạt | ScopeViewFilter.vue:51-58; scopeViewFilter.spec.ts |
| Doc comment "bộ lọc chuẩn" BR-FLT-05/06 | Đạt | ScopeViewFilter.vue:2-7 |
| Ranking dùng ScopeViewFilter (testKey `ranking`), bỏ toggle, select khu vực, multi-select chi nhánh | Đạt | ExecutivePerformanceRanking.vue:203-215 |
| View quyết định mảng regions/clusters/sites | Đạt | ExecutivePerformanceRanking.vue:94-98 |
| Ids gửi server đúng theo view; ids rỗng giữ master | Đạt | ExecutiveView.vue `rankingFilterPatch`; executiveView.spec (test mới) |
| Mặc định view region, reset khi global đổi | Đạt | ExecutiveView.vue `syncChildFilters` |
| Bỏ `hasLocalRegion` | Đạt | không còn trong diff |
| Nhãn "Đang lọc riêng" chỉ khi có ids, liệt kê tên | Đạt | ExecutiveView.vue `rankingScopeLabel` |
| Tab entity không collapse; request không cap | Đạt | `RANKING_ROW_LIMIT = 200`, report.api không cap entity (Lead xác nhận) |
| Tab Sản phẩm giữ nguyên, "Xem tất cả" đến 100 | Đạt | Ranking.vue:114-124, 289-298; server clamp products 100 nên `productsTotalCount` vẫn đúng |
| Hàng `h-12`, `whitespace-nowrap`, tên `truncate` + `title` | Đạt | Ranking.vue:390-395 |
| Khung cuộn max-height 12.5 dòng | Đạt | xem phân tích bên dưới |
| Thead sticky top-0, tfoot sticky bottom-0 nền đặc, viền + bóng, cột đầu sticky ngang | Đạt | Ranking.vue:311, 423-426 |
| Sắp xếp: mặc định GMV giảm, giảm rồi tăng, ▲/▼, aria-sort, tên vi-VN, null cuối, `#` theo thứ tự hiện tại, tổng không sắp, client-side | Đạt | executiveRankingSort.ts; Ranking.vue:150-157, 313-386; executiveRankingSort.spec.ts (10) |
| GMV ẩn thì sắp mặc định theo DTT | Đạt | `defaultRankingSort(gmvHidden)` |
| Nhãn tổng 3 biến thể, số từ `snapshot.total` | Đạt | Ranking.vue:145-148 |
| Test unit và component yêu cầu; cập nhật test cũ; e2e | Đạt | e2e không dùng toggle/`ranking-toggle-all` ở tab entity (grep rỗng) |
| >= 3 commit, change log | Đạt | 3 commit; docs/qc/W9_A1.md |

Phân tích toán 12.5 dòng: max-height = 44 + 12.5*48 + 48 = 692px (box-sizing border-box, trừ 2px viền khung còn khoảng 690). Có 12 dòng: nội dung 44 + 576 + 48 = 668, nhỏ hơn 690, không có thanh cuộn. Có 13 dòng: 716 > 690, cuộn. Khi cuộn, vùng thân nhìn thấy = 690 - 44 - 48 = 598px, tức khoảng 12.46 dòng, đúng ý "12.5 dòng thân + dòng tổng sticky". Cộng thêm 48px của worker là hợp lý; công thức gốc trong task sẽ chỉ còn 11.5 dòng thân. Chấp nhận. (Chỉ kiểm bằng tính toán và jsdom, chưa xem bằng mắt.)

## 3. Lỗi phát hiện

Cao: không có.

Trung bình: không có.

Thấp:
1. Mã chết: `ExecutivePerformanceRanking.vue` vẫn emit `limitChange` (5/100 ở `toggleProductsLimit`) nhưng `ExecutiveView` đã bỏ listener. Gợi ý: xóa emit và sửa test cũ nếu còn assert, hoặc ghi chú rõ để giữ tương thích.
2. Trùng lặp: tên master scope được tính ở hai nơi (`masterScopeName` trong Ranking.vue:132-143 và trong ExecutiveView.vue). Gợi ý: gom vào một util khi A2/A3 dùng chung.
3. `sortOverride` không reset khi quyền GMV đổi: nếu sortOverride là `gmv` mà GMV bị ẩn (hiếm, quyền đổi giữa phiên) thì sắp theo cột đã ẩn. Gợi ý: trong `activeSort`, nếu `isGmvHidden` và key là gmv/gmvShare thì dùng default.
4. Về API cho tái sử dụng (A2/A3): `ScopeViewFilter` không cắt `selectedIds` cũ không còn nằm trong options khi master đổi. Hiện ranking tự reset ở `syncChildFilters` nên ổn; A2/A3 phải tự reset tương tự. Gợi ý: ghi chú vào doc comment, hoặc thêm cắt ids phía component.

## 4. Ghi chú UX và API tái sử dụng

Kiểm tra tái sử dụng cho heatmap (hàng khu vực/cụm/chi nhánh) và Growth Analysis (một series cho mỗi id được chọn): hình dạng API phù hợp, không có vấn đề chặn.
- Heatmap: `view` quyết định loại hàng, `ids` là lọc; map thẳng.
- Growth Analysis: `{view, ids}` đủ để tạo một series/id. Người gọi cần định nghĩa ids rỗng nghĩa là gì (ranking: giữ master; Growth: có thể là một series "hệ thống"). Component không áp quy ước này nên trung lập. Tốt.
- `views` cho phép giới hạn view (ví dụ Growth chỉ khu vực + chi nhánh). Khi `view` truyền vào không nằm trong `views` thì không nút nào được bật; người gọi phải đảm bảo (tùy chọn: fallback sang view đầu tiên).
- Khi chọn ids ở view region, request bỏ cluster/site của master (theo đúng task), nên hàng khu vực có thể rộng hơn master site; đây là hành vi task yêu cầu.

Tùy chọn: kiểm bằng mắt trên trình duyệt sticky tfoot cùng cột đầu khi cuộn ngang (z-index th tfoot 30, th tbody 10, thead 20) vì jsdom không xác nhận được.
