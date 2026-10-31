# Kế hoạch Triển khai: Nút Hủy Tính lại Dữ liệu (Cancel Recompute Job) trên UI & Giải phóng Khóa Đồng bộ Tức thì (BR-9)

## 1. Bối cảnh & Nguyên nhân Gốc rễ (Root Cause)
Người dùng (vai trò BOD) không thể hủy (Cancel) job đang đồng bộ / tính lại dữ liệu (`Queued` hoặc `Running`) trên giao diện Dashboard V2 vì 2 nguyên nhân:

1. **Frontend (`pos.gui`) chưa gắn nút "Hủy" và chưa nối API Cancel:**
   - Ở Backend (`report.api`), commit `90f32a5` (BR-9) đã tạo sẵn endpoint `POST /Admin/V2/Dashboard/cancel-recompute/{jobId}` trong `DashboardV2Controller.cs` (dòng 55–60) và hàm `DashboardRecomputeService.CancelRecompute(string jobId)` (dòng 266–289).
   - Tuy nhiên ở Frontend (`pos.gui`):
     - `src/pages/dashboard-v2/services/dashboardV2Api.ts` mới chỉ có `recompute` và `recomputeLatest`, **thiếu method `cancelRecompute(jobId: string)`**.
     - `src/pages/dashboard-v2/components/DashboardV2RecomputeModal.vue` (dòng 124–140): Khi `showStatusPanel && job` đang ở trạng thái `Queued (1)` hoặc `Running (2)`, UI chỉ hiển thị dòng text trạng thái và nút `Đóng`, hoàn toàn không có nút **"Hủy tính lại"**.
     - `src/pages/dashboard-v2/components/DashboardV2DataFreshness.vue` (dòng 219): Dòng trạng thái inline `Đang tính lại dữ liệu: ...` trên header không có nút **"Hủy"** nhanh.

2. **Backend (`report.api`) chưa kiểm tra trạng thái hủy bên trong vòng lặp từng ngày dẫn đến giữ khóa `Report.SyncData`:**
   - Trong `Src/Application/Services/DashboardV2/DashboardRecomputeService.cs` (`RunRecomputeRequest`, dòng 368–410):
     - Hàm `IsStillRunningAsync(request.Id)` chỉ được kiểm tra ở đầu mỗi bước lớn (`BeginStepAsync`), nhưng **không được kiểm tra trước mỗi ngày** trong vòng lặp `for (var day = from; day <= to; day = day.AddDays(1))` tại Bước 2 (`StepStatistics`) và Bước 4 (`StepPreOrders`).
     - Hệ quả: Khi người dùng bấm Hủy lúc job đang chạy ngày 1/7, DB đổi sang `Failed ("Đã hủy")` ngay, nhưng tiến trình Hangfire vẫn giữ khóa `syncLock` (`Report.SyncData`) chạy tiếp 6 ngày còn lại, làm yêu cầu tính lại mới bị báo lỗi `"Hệ thống đang đồng bộ, vui lòng thử lại sau"`.

---

## 2. Chi tiết Kế hoạch Triển khai

### 2.1. Nhánh Git (Độc lập, Không làm mất code hiện có)
- Lưu ý: Nhánh `feat/dashboard-v2-bod-metrics` đã được commit, push và tạo PR trên cả 3 repo (`report.api` PR #145, `pos.gui` PR #2910, `dashboard_hmk` PR #2). **Tuyệt đối không xóa hay force-push đè lên `feat/dashboard-v2-bod-metrics`**.
- Tạo nhánh mới từ `origin/main` trên cả `report.api` và `pos.gui`:
  - Tên nhánh: `fix/dashboard-v2-cancel-recompute-ui`

### 2.2. Backend (`report.api` — `Src/Application/Services/DashboardV2/DashboardRecomputeService.cs`)
1. Trong `RunRecomputeRequest(Guid requestId)`:
   - Ở vòng lặp Bước 2 (`StepStatistics`, khoảng dòng 370–376):
     ```csharp
     if (needsStatistics)
     {
         step = DashboardRecomputePolicy.StepStatistics;
         if (!await BeginStepAsync(request, step)) return;
         for (var day = from; day <= to; day = day.AddDays(1))
         {
             if (!await BeginStepAsync(request, step)) return;
             await Steps.BackfillLocalStatistics(DateTime.SpecifyKind(day, DateTimeKind.Utc));
         }
     }
     ```
   - Ở vòng lặp Bước 4 (`StepPreOrders`, khoảng dòng 396–404):
     ```csharp
     for (var day = from; day <= to; day = day.AddDays(1))
     {
         if (!await BeginStepAsync(request, step)) return;
         var startAt = DateTime.SpecifyKind(day, DateTimeKind.Utc);
         await Steps.BackfillPreOrders(startAt, startAt.AddDays(1));
     }
     ```
   - Việc gọi `BeginStepAsync(request, step)` trước mỗi ngày vừa kiểm tra `IsStillRunningAsync(request.Id)` (để thoát ngay và nhả `syncLock` trong khối `finally`), vừa cập nhật `HeartbeatAt = Now()` để job hợp lệ chạy nhiều ngày không bị đánh dấu stale nhầm sau 10 phút.

### 2.3. Frontend (`pos.gui`)
1. **File `src/pages/dashboard-v2/services/dashboardV2Api.ts`:**
   - Bổ sung vào `DashboardV2ApiClient`:
     ```ts
     AdminDashboardV2CancelRecompute?: (parameters?: { jobId: string } | null, data?: null, config?: Record<string, unknown>) => Promise<{ data?: unknown }>;
     ```
   - Bổ sung vào `createDashboardV2Api(client)`:
     ```ts
     cancelRecompute: (jobId: string, options?: DashboardV2RequestOptions) =>
       requestEmpty(client.AdminDashboardV2CancelRecompute, { jobId }, options),
     ```
     (hoặc gọi trực tiếp `client.AdminDashboardV2CancelRecompute?.({ jobId }, null, buildConfig(options))`)
   - Bổ sung vào `generatedDashboardV2Client`:
     ```ts
     async AdminDashboardV2CancelRecompute(parameters, _data, config) {
       const jobId = encodeURIComponent(parameters?.jobId ?? '');
       return { data: (await reportApiClient.post(`/Admin/V2/Dashboard/cancel-recompute/${jobId}`, null, { ...(config as any), toastError: false }))?.data };
     },
     ```

2. **File `src/pages/dashboard-v2/components/DashboardV2RecomputeModal.vue`:**
   - Thêm emit event `cancelled: [jobId: string]`.
   - Thêm state `cancelling = ref(false)` và computed `jobActive = computed(() => isActiveRecomputeJob(props.job))`.
   - Thêm hàm `cancelJob()`:
     ```ts
     async function cancelJob(): Promise<void> {
       if (!props.job || !jobActive.value || cancelling.value) return;
       cancelling.value = true;
       serverError.value = '';
       try {
         await props.api.cancelRecompute(props.job.id);
         submittedJobId.value = null;
         emit('cancelled', props.job.id);
       } catch (error) {
         serverError.value = error instanceof Error && error.message ? error.message : 'Không thể hủy yêu cầu tính lại.';
       } finally {
         cancelling.value = false;
       }
     }
     ```
   - Trong `<template>` tại khối `v-if="showStatusPanel && job"` (dòng 124–140):
     - Hiển thị nút **"Hủy tính lại"** (`data-test="recompute-cancel"`) khi `jobActive` (`Queued` hoặc `Running`):
       ```html
       <div v-if="jobActive" class="mt-3 flex items-center gap-2">
         <button
           type="button"
           data-test="recompute-cancel"
           :disabled="cancelling"
           class="h-9 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
           @click="cancelJob"
         >
           {{ cancelling ? 'Đang hủy...' : 'Hủy tính lại' }}
         </button>
       </div>
       <p v-if="serverError" role="alert" data-test="recompute-cancel-error" class="mt-2 text-sm text-red-600">{{ serverError }}</p>
       ```

3. **File `src/pages/dashboard-v2/components/DashboardV2DataFreshness.vue`:**
   - Thêm state `cancellingInline = ref(false)` và hàm `cancelActiveJob()`:
     - Gọi `await props.api.cancelRecompute(job.value.id)`, đánh dấu `dismissedFailedJobId.value = job.value.id` (để không hiện cảnh báo đỏ "Tính lại thất bại: Đã hủy" gây hiểu nhầm khi chính người dùng chủ động bấm hủy), và gọi `await loadLatestJob()`.
   - Cạnh dòng `<p v-if="isBod && inlineJobText" ...>` trên header (dòng 219), thêm nút bấm nhanh `Hủy` (`data-test="dashboard-recompute-inline-cancel"`).
   - Xử lý sự kiện `@cancelled="onCancelled"` từ `<DashboardV2RecomputeModal>` để tải lại `loadLatestJob()` và ẩn cảnh báo lỗi tự hủy.

---

## 3. Kiểm thử & Bàn giao
1. **Build & Type-check:**
   - `dotnet build ../report.api/Src/WebApi/WebApi.csproj` → 0 errors.
   - `npx --prefix ../pos.gui vue-tsc --noEmit` → 0 errors.
   - `npx --prefix ../pos.gui prettier --write` & `eslint` trên các file vừa sửa.
2. **Unit/Component Test & E2E Test:**
   - Cập nhật/chạy test Vitest cho `DashboardV2RecomputeModal` / `DashboardV2DataFreshness` (hoặc viết test kiểm chứng nút `recompute-cancel` và `dashboard-recompute-inline-cancel` gọi đúng `POST /Admin/V2/Dashboard/cancel-recompute/{jobId}`).
3. **Commit & Push:**
   - Commit trên nhánh `fix/dashboard-v2-cancel-recompute-ui` ở cả `report.api` và `pos.gui`, push lên `origin` và tạo PR vào `main`.
