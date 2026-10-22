# W9 FE_F: "Cập nhật gần nhất" và tính lại dữ liệu thủ công (frontend)

- Worktree: `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/wt/gui-f-fresh-fe`
- Branch: `qc/w9-f-fresh-fe` (commit local, chưa push)
- Phạm vi: frontend cho user task 15 (Cập nhật gần nhất) và task 14 (tính lại dữ liệu, BOD). Backend được mock trong test.

## Commit

| Hash | Subject |
|---|---|
| `6d7c4b74` | feat(dashboard-v2): add data freshness and recompute API operations |
| `f5517baf` | feat(dashboard-v2): show "Cập nhật gần nhất" and manual recompute for BOD |

## Thay đổi

### 1. API contract (`services/dashboardV2Api.ts`, `types.ts`)
- Thêm 3 operation vào `DashboardV2ApiClient`, `generatedDashboardV2Client` và `DashboardV2Api`:
  - `dataFreshness()` → `GET Admin/V2/Dashboard/DataFreshness` (mọi role dashboard).
  - `recompute({ fromDate, toDate })` → `POST Admin/V2/Dashboard/Recompute` (BOD).
  - `recomputeLatest()` → `GET Admin/V2/Dashboard/Recompute/Latest` (BOD).
- Normalizer chịu lỗi: `normalizeDataFreshness` (bỏ dataset thiếu `code`), `normalizeRecomputeJob` (null khi payload rỗng).
- Types mới: `DashboardV2DataFreshness`, `DashboardV2DatasetFreshness`, `DashboardV2RecomputeJob`, `DashboardV2RecomputeRequest`, `RECOMPUTE_STATUS` (1 Queued, 2 Running, 3 Succeeded, 4 Failed).
- 3 operation chưa có trong `src/apis/schemas/report.d.ts` (schema sinh từ `openapi/report.json`, chưa regenerate vì backend đang làm song song). Generated client gọi chúng qua một view type cục bộ `FreshnessOperationMethods`. Khi regenerate schema thì bỏ view này.
- Lỗi của `DataFreshness` và `Recompute/Latest` không toast (`toastError: false`). Lỗi `Recompute` cũng không toast để modal hiển thị message server inline.

### 2. Dòng "Cập nhật gần nhất" (`components/DashboardV2DataFreshness.vue`, `DashboardV2Header.vue`)
- Đặt cạnh tiêu đề "Dashboard V2" trong header dùng chung của mọi tab.
- Nội dung: `Cập nhật gần nhất DD/MM/YYYY HH:mm:ss` (giờ VN, 24h, moment-timezone), chữ nhỏ slate, có icon đồng hồ. Khi `lastUpdatedAt` null: `Cập nhật gần nhất: chưa có dữ liệu`.
- Tooltip dùng `v-tooltip` của floating-vue (repo đã cài global). Nội dung liệt kê từng dataset: nhãn, thời điểm thành công gần nhất, khoảng ngày đã phủ. Nội dung được escape.
- Lỗi fetch: ẩn dòng, `console.warn`. Tải khi mount và refresh mỗi 5 phút (`setInterval`, clear khi unmount).

### 3. Tính lại dữ liệu (`components/DashboardV2RecomputeModal.vue`)
- Nút `Tính lại dữ liệu` (icon refresh, style secondary) chỉ render khi `role === 'BOD'`. MANAGER và STAFF không gọi endpoint BOD.
- Modal: tiêu đề, giải thích đúng nội dung task, hai ô `Từ ngày` / `Đến ngày` (DD/MM/YYYY, có nút lịch và input date ẩn như filter bar), mặc định hôm qua → hôm qua.
- Validation client mirror server: from ≤ to, to ≤ hôm nay (giờ VN), tối đa 7 ngày bao gồm hai đầu. Bộ đếm `Đã chọn N/7 ngày`. Nút `Bắt đầu tính lại` disabled khi không hợp lệ hoặc đang có job chạy.
- Lỗi server (ví dụ "đang có job khác") hiển thị inline.
- Status panel: `Đang chờ` / `Đang chạy: <currentStep>` / `Hoàn tất lúc HH:mm:ss` / `Thất bại: <errorMessage>` (kèm nút Thử lại).
- Polling `Recompute/Latest` mỗi 5 giây khi job Queued hoặc Running, dừng khi unmount. Job đang chạy lúc mở modal thì hiển thị status panel thay cho form.
- Esc và click backdrop đóng modal.
- Khi job chuyển sang Succeeded trong phiên hiện tại: refresh freshness và toast `Đã tính lại dữ liệu từ … đến …. Tải lại dashboard để xem số liệu mới.` kèm nút `Tải lại`.
- Khi có job đang chạy, dòng trạng thái nhỏ hiện dưới dòng "Cập nhật gần nhất".

### 4. Quyết định
- **Reload dashboard:** dùng `setFilter({ startAt, endAt })` với đúng giá trị hiện tại. `mergeFilter` luôn tạo object mới và `ExecutiveView` (và các view khác) đang `watch(filter, …, { deep: true })`, nên mọi block tải lại. Không thêm reload hook mới.
- **Nhãn dataset:** `DATASET_LABELS` đang rỗng vì repo chưa có mã dataset chính thức (không tìm thấy trong report.api hay worktree). Hiện mã gốc. Khi backend chốt mã thì bổ sung map trong `utils/dataFreshness.ts`.
- **Vị trí polling:** một vòng polling duy nhất nằm ở `DashboardV2DataFreshness`. Modal nhận `job` qua prop, nên dòng trạng thái inline và status panel luôn đồng bộ.
- **Toast:** dùng `vue3-toastify` với VNode để có nút `Tải lại` (repo đã dùng `vue3-toastify`).
- **Modal:** dùng overlay `v-if` như `DashboardImportModal` (không dùng vue-final-modal). Không đổi component legacy trong `components/report-dashboard/`.
- Không thêm package mới.

## Files

Mới:
- `src/pages/dashboard-v2/components/DashboardV2DataFreshness.vue`
- `src/pages/dashboard-v2/components/DashboardV2RecomputeModal.vue`
- `src/pages/dashboard-v2/utils/dataFreshness.ts`
- `tests/dashboard-v2/dataFreshness.spec.ts`
- `tests/dashboard-v2/recomputeModal.spec.ts`

Sửa:
- `src/pages/dashboard-v2/components/DashboardV2Header.vue`
- `src/pages/dashboard-v2/services/dashboardV2Api.ts`
- `src/pages/dashboard-v2/types.ts`
- `tests/dashboard-v2/generatedClientCompleteness.spec.ts` (thêm 3 operation vào danh sách bắt buộc)

## Test

Test mới (28 test trong 2 file, cộng 3 test từ vòng lặp completeness):
- Freshness: định dạng UTC → VN, text null, tooltip liệt kê dataset và escape, refresh 5 phút (fake timers), lỗi fetch ẩn dòng và warn, MANAGER không thấy nút và không gọi endpoint BOD, toast sau recompute thành công kèm action Tải lại, job đang chạy lúc mở hiện status panel.
- Recompute: chỉ BOD thấy nút, validation (8 ngày, ngày tương lai, from > to), submit rồi polling đến Succeeded và refresh freshness, Failed hiện message, lỗi server inline, Esc đóng modal.
- API: normalizer, gọi POST với body đúng, `recomputeLatest` trả null.

## Số liệu verification

| Lệnh | Kết quả |
|---|---|
| `npx vue-tsc -b --noEmit` | 0 lỗi |
| `npx eslint src/pages/dashboard-v2` | 0 lỗi, 3 warning có sẵn (`ExecutiveChartFilters.vue`) |
| `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2` | Lần 1: 58/59 file pass, 536/538 test pass (2 timeout trong `executiveView.spec.ts`). Lần 2: 58/59 file, 536/538 test (2 timeout khác trong cùng file). |

- Baseline ban đầu: 57 file / 507 test, 1 timeout trong `executiveView.spec.ts`.
- Hiện tại: 59 file / 538 test (+2 file, +31 test).
- `executiveView.spec.ts` chạy riêng: 43/43 pass. Các test timeout thay đổi giữa các lần chạy full suite, và file này không mount header hay modal mới. Đây là flake do tải khi chạy song song, không phải do thay đổi này.

## Chưa làm / lưu ý
- Chưa regenerate `src/apis/schemas/report.d.ts` và `openapi/report.json`; cần làm khi backend merge.
- Chưa có nhãn tiếng Việt cho dataset (xem mục Quyết định).
- Chưa kiểm tra trên UI thật với backend thật.
- Commit trailer dùng `Co-Authored-By: Claude Haiku 5.5` theo hướng dẫn attribution của phiên làm việc. RULES.md ghi Opus 5.5. Nếu cần đổi theo RULES thì sửa trailer khi merge.

## Vòng sửa 1

Commit: `79309b3a` fix(dashboard-v2): label freshness datasets, state badges and failed recompute line (Co-Authored-By: Claude Opus 5.5, theo RULES.md).

1. **Nhãn dataset:** `DATASET_LABELS` ánh xạ đủ 7 mã: DashboardOrderFact → Đơn hàng, DashboardPaymentFact → Thanh toán, DashboardPreOrderFact → Đơn đặt, DashboardOperationalPreOrderFact → Vận hành đơn đặt, DashboardCustomerFirstPurchaseFact → Khách mua lần đầu, DashboardRevenueEventFact → Sự kiện doanh thu, DashboardCustomerDebtFact → Công nợ. Mã lạ vẫn hiện nguyên mã. Test: `maps every known dataset code...`.
2. **State dataset là số:** `DashboardV2DatasetFreshness.state` đổi sang `number | null`, hằng `DATASET_STATE` (1 Idle, 2 Running, 3 Failed). Normalizer dùng `numberOrNull`. Tooltip (`buildFreshnessTooltipHtml`) có badge "Đang chạy" (vàng nhạt) cho state 2 và "Lỗi" (đỏ nhạt) cho state 3. State 1 không có badge. Test: `shows Đang chạy for state 2 and Lỗi for state 3 only`, `renders state badges in the tooltip HTML...`.
3. **Dòng lỗi tính lại cho BOD:** khi job mới nhất ở trạng thái Failed và (kết thúc sau lúc tải trang, hoặc job này từng chạy trong phiên và thất bại), hiện dưới header dòng `Tính lại thất bại: <errorMessage>` kèm nút × (`dashboard-recompute-failed-dismiss`). Bấm × thì ẩn cho đúng job đó. Chỉ BOD. Test (4 case): hiện khi kết thúc sau lúc tải trang; không hiện khi kết thúc trước lúc tải trang; × ẩn dòng; lỗi xảy ra trong phiên khi modal đã đóng vẫn hiện; MANAGER không thấy và không gọi endpoint.

Không làm: focus management (việc khác xử lý).

Kiểm tra:
- `npx vue-tsc -b --noEmit`: 0 lỗi.
- `npx eslint src/pages/dashboard-v2 tests/dashboard-v2/dataFreshness.spec.ts tests/dashboard-v2/recomputeModal.spec.ts`: 0 lỗi, 3 warning có sẵn.
- Vitest, file liên quan (dataFreshness, recomputeModal, generatedClientCompleteness): 3 file, 71/71 test pass.
- Chưa chạy lại full suite dashboard-v2 ở vòng này. Vòng trước full suite có 2 timeout flake trong executiveView.spec.ts (không liên quan).
