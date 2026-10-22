# W9 QC FE_F, vòng 1

Worktree: `wt/gui-f-fresh-fe` (branch `qc/w9-f-fresh-fe`), base `81e46b90`. Hai commit: `6d7c4b74`, `f5517baf`.
Đối chiếu backend thật: `wt/api-be-fresh` (branch `qc/w9-be-fresh`), chỉ đọc.

## 1. Kết luận: ĐẠT

Số liệu tự chạy trong worktree:

| Lệnh | Kết quả |
|---|---|
| `npx vue-tsc -b --noEmit` | 0 lỗi |
| `npx eslint src/pages/dashboard-v2` | 0 lỗi, 3 warning có sẵn (`ExecutiveChartFilters.vue`) |
| `vitest run tests/dashboard-v2 e2e/dashboard-v2` (chạy cả bộ) | 58/59 file, 537/538 test. 1 timeout 5000ms ở `executiveView.spec.ts` ("overwrites every local period when the master period changes") |
| Chạy riêng `executiveView.spec.ts` + `dataFreshness.spec.ts` + `recomputeModal.spec.ts` + `generatedClientCompleteness.spec.ts` | 4/4 file, 106/106 test pass |

Timeout của `executiveView.spec.ts` là flake do tải khi chạy song song (test khác nhau mỗi lần chạy, chạy riêng thì qua, header mới không được mount trong file đó). Không tính là lỗi của worker.
Không có test bị xóa hay làm yếu: diff chỉ thêm 3 dòng vào `generatedClientCompleteness.spec.ts`. Không đụng `src/components/report-dashboard/*`. Không thêm package.

Không có lỗi mức Cao. Có 1 lỗi Trung bình (thiếu nhãn dataset) và các lỗi Thấp bên dưới.

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| 3 operation trong generated client, interface `DashboardV2Api`, mock; completeness xanh | Đạt | `dashboardV2Api.ts` (`DashboardV2ApiClient`, `generatedDashboardV2Client`, `createDashboardV2Api`); `generatedClientCompleteness.spec.ts` +3 dòng, pass |
| Route/body khớp backend | Đạt | GET `DataFreshness`, POST `Recompute` body `{fromDate,toDate}` (`yyyy-MM-dd` string, khớp `DashboardRecomputeInputAdminDto`), GET `Recompute/Latest`; khớp `DashboardV2Controller.cs` |
| Enum status 1-4 | Đạt | `RECOMPUTE_STATUS` Queued 1, Running 2, Succeeded 3, Failed 4 = `DashboardRecomputeStatuses` |
| Envelope `DataResult`, `Latest` null | Đạt | `(result.data ?? result)` rồi `normalizeRecomputeJob` trả null khi không có `id`; `applyJob(latest ?? null)` |
| Passthrough thông báo tiếng Việt của server | Đạt | `apiClient.ts:338-359` bọc `error.message` từ `error.message` của envelope. `toastError:false` nên modal hiện inline (`serverError`). Các message BE ("Chỉ được tính lại tối đa 7 ngày mỗi lần", "Đang có một yêu cầu tính lại chưa hoàn tất"...) hiển thị nguyên văn |
| MANAGER/STAFF không gọi endpoint BOD | Đạt | `loadLatestJob` có guard `!isBod.value`; modal và nút `v-if="isBod"`; test "MANAGER không thấy nút và không gọi endpoint BOD". BE cũng chặn bằng `RequireBodAsync` (Forbidden) |
| Dòng "Cập nhật gần nhất" ở header dùng chung | Đạt | `DashboardV2Header.vue` đặt cạnh h1, mọi tab đều có |
| Định dạng `DD/MM/YYYY HH:mm:ss` giờ VN 24h, chữ slate nhỏ, icon đồng hồ | Đạt | `formatFreshnessDateTime` (moment.utc rồi tz `Asia/Ho_Chi_Minh`); `text-xs text-slate-500` + svg đồng hồ |
| Tooltip liệt kê dataset (nhãn/mã, thời gian, khoảng ngày), hover + focus | Một phần | `v-tooltip` floating-vue html, `tabindex=0`, nội dung đã escape. Nhãn rỗng, chỉ hiện mã (xem lỗi TB-1) |
| `lastUpdatedAt` null: "Cập nhật gần nhất: chưa có dữ liệu" | Đạt | `freshnessLabel`, có test |
| Lỗi fetch: ẩn dòng, `console.warn` | Đạt | `freshnessHidden`, `console.warn`; có test |
| Load khi mount, refresh 5 phút, clear khi unmount | Đạt | `FRESHNESS_REFRESH_MS`, `clearInterval` trong `onBeforeUnmount`; test fake timers |
| Refresh ngay sau recompute thành công | Đạt | `notifyRecomputeSucceeded` gọi `loadFreshness()` |
| Nút "Tính lại dữ liệu" chỉ BOD, icon refresh, secondary | Đạt | `DashboardV2DataFreshness.vue` template, `v-if="isBod"` |
| Modal: tiêu đề, giải thích, Esc + backdrop đóng | Đạt | Văn bản khớp task; listener `keydown` Escape; backdrop `@click`; test Esc |
| Từ ngày / Đến ngày DD/MM/YYYY, mặc định hôm qua | Đạt | `resetForm`; ô text + nút lịch + `<input type=date>` ẩn như filter bar. Không dùng cùng component picker nhưng cùng cơ chế với filter bar (ghi trong change log) |
| Validation: from ≤ to, to ≤ hôm nay (giờ VN), tối đa 7 ngày; đếm "Đã chọn N/7 ngày"; disable submit | Đạt | `validateRecomputeRange`, `canSubmit`, `dayCounterText`; test 8 ngày, ngày tương lai, from > to |
| Submit gọi POST, thành công hiện status panel, lỗi validation hiện inline | Đạt | `submit()`, `submittedJobId`, `serverError` |
| Status panel 4 trạng thái; inline dưới dòng header khi job active | Đạt | `describeRecomputeStatus`; `inlineJobText` có `role="status"` |
| Poll `Latest` mỗi 5 giây khi Queued/Running, dừng khi unmount | Đạt | `startPolling`/`stopPolling`, `RECOMPUTE_POLL_MS`; test submit rồi poll đến Succeeded |
| Xong: refresh freshness + toast + nút "Tải lại" | Đạt | Toast VNode, `reloadDashboard()` gọi `setFilter` với đúng giá trị hiện tại. Các view `watch(filter, deep)` nên tải lại; chấp nhận được |
| Mở modal khi job đang chạy: hiện status panel, submit khóa | Đạt | `showStatusPanel` ưu tiên hơn form; `canSubmit` có `!jobActive`; test |
| Test freshness / recompute theo mục 3 | Đạt | 2 file mới (dataFreshness 15, recomputeModal 13 theo change log), pass |

## 3. Lỗi phát hiện

### Trung bình

**TB-1. `DATASET_LABELS` rỗng, tooltip hiện mã tiếng Anh.**
- Vị trí: `src/pages/dashboard-v2/utils/dataFreshness.ts` (`DATASET_LABELS = {}`).
- Kịch bản: BOD/MANAGER hover vào dòng "Cập nhật gần nhất" thấy `DashboardOrderFact: 20/10/2026 ...`, không có nhãn tiếng Việt. Worker ghi là không tìm thấy mã trong repo, nhưng lead đã chốt 7 mã.
- Sửa đề xuất: điền map:
  - `DashboardOrderFact`: `Đơn hàng`
  - `DashboardPaymentFact`: `Thanh toán`
  - `DashboardPreOrderFact`: `Đơn đặt`
  - `DashboardOperationalPreOrderFact`: `Vận hành đơn đặt`
  - `DashboardCustomerFirstPurchaseFact`: `Khách mua lần đầu`
  - `DashboardRevenueEventFact`: `Sự kiện doanh thu`
  - `DashboardCustomerDebtFact`: `Công nợ`

  Giữ fallback về mã cho mã lạ. Thêm 1 test khẳng định nhãn của 7 mã.

### Thấp

**T-1. `state` của dataset bị chuẩn hóa thành `null`.**
- Vị trí: `normalizeDataFreshness` (`normalizeNullableString(item.state)`), `types.ts` (`state: string | null`).
- BE trả `state` là số enum (`ReportStatisticSyncStates`: 1 Idle, 2 Running, 3 Failed). `normalizeNullableString` chỉ nhận string, nên số bị đổi thành `null`. Hiện UI không dùng `state` nên chưa lỗi hiển thị, nhưng nếu sau này hiện "đang chạy/lỗi" trong tooltip sẽ mất dữ liệu.
- Sửa đề xuất: kiểu `state: 1 | 2 | 3 | null`, dùng `numberOrNull`; thêm hằng `DATASET_STATE`. Tùy chọn: tooltip đánh dấu dataset Failed (`Lỗi`) hoặc Running (`Đang chạy`).

**T-2. Job thất bại khi modal đóng không được báo.**
- Vị trí: `DashboardV2DataFreshness.vue`, `applyJob`.
- Job chuyển Failed lúc BOD đã đóng modal: không toast, không dòng inline (inline chỉ cho job active). Mở lại modal sẽ thấy form trống vì `showStatusPanel` chỉ true cho job active hoặc job vừa submit trong phiên modal. Kết quả thất bại bị "mất" với người dùng.
- Sửa đề xuất: khi `seenActiveJobId` chuyển sang Failed, `toast(..., { type: 'error' })` với `errorMessage`, hoặc cho `showStatusPanel` hiển thị khi job Failed gần nhất chưa được xác nhận. Task không đòi hỏi, nên chỉ ưu tiên thấp.

**T-3. Modal thiếu quản lý focus (a11y).**
- Vị trí: `DashboardV2RecomputeModal.vue`.
- Có `role="dialog"`, `aria-modal`, `aria-labelledby`, nhưng khi mở không chuyển focus vào modal, không focus trap, không trả focus về nút "Tính lại dữ liệu" khi đóng. Người dùng bàn phím vẫn Tab ra nền phía sau.
- Sửa đề xuất: `nextTick` focus ô "Từ ngày" khi mở, lưu `document.activeElement` để khôi phục khi đóng; trap Tab đơn giản.

**T-4. Generated client dùng cast cục bộ.**
- Vị trí: `dashboardV2Api.ts` (`FreshnessOperationMethods`, `freshnessOperations`).
- Đã được ghi trong change log. Phải gỡ cast và regenerate `report.d.ts`/`openapi/report.json` sau khi backend merge, nếu không sẽ thành mã chết.
- Sửa đề xuất: tạo việc theo dõi trước merge.

**T-5. Commit trailer.**
- Hai commit dùng `Co-Authored-By: Claude Haiku 5.5`, khác trailer `Claude Opus 5.5` của RULES.md. Chỉ ghi nhận, sửa khi merge nếu cần.

**T-6. Tooltip không dùng được trên cảm ứng.**
- Hover không có trên mobile. Dòng có `tabindex=0` nên tap có thể focus, nhưng trên iOS focus không chắc kích hoạt floating-vue. Chấp nhận được vì tooltip là thông tin phụ.

## 4. Ghi chú UX (tùy chọn)

- Ô nhập ngày dùng emoji lịch (`&#128197;`) và ký tự `✕` làm nút đóng; có `aria-label`. Có thể đổi sang svg cho đồng nhất với các icon svg khác của V2 (tùy chọn).
- Khi submit đang chạy (`submitting`), nút chưa đổi nhãn sang "Đang gửi..."; chỉ disabled. Tùy chọn thêm trạng thái.
- Toast thành công dùng thời gian mặc định của vue3-toastify; nút "Tải lại" có thể biến mất trước khi người dùng bấm. Cân nhắc `autoClose: false` hoặc 15 giây (tùy chọn).
- Header trên mobile: dòng cập nhật + nút wrap xuống dưới tiêu đề (`flex-wrap`, `items-start sm:items-end`), không tràn ngang. Đạt.
- Phân quyền hiển thị: BOD thấy nút; MANAGER/STAFF chỉ thấy dòng "Cập nhật gần nhất". Không liên quan GMV.
