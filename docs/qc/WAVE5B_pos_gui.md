# Nhật ký thay đổi Frontend Wave 5b (pos.gui) — Bộ lọc đa chiều & Tab Xếp hạng sản phẩm

> **Xác nhận của PM (18/10, đã đối chiếu code thật).**
> - **Kiểm chứng độc lập:**
>   - Nhánh pos.gui `qc/dashboard-v2-wave5` @ `f32e03a0`: 3 commit của 5a và 4 commit của 5b, nối tiếp `qc/dashboard-v2-wave4`. **Chưa push.**
>   - Vitest **56 file / 461 test đạt** (trước wave 5: 441). vue-tsc sạch, eslint sạch, cây làm việc sạch.
> - **Bộ lọc đa chiều:** dùng `basketSegments`, không còn `basketBuckets`. Badge đếm số chiều đang bật. Nhãn "Không áp dụng bộ lọc: …" nằm ở `DashboardV2Block.vue` và bảng xếp hạng. Ghi chú "Mục tiêu không đổi theo bộ lọc đa chiều" hiện khi `targetsIgnoreDimensions`.
> - **Tab Sản phẩm:**
>   - `Share` backend trả theo % (×100); frontend hiển thị trực tiếp, đúng đơn vị.
>   - "Xem tất cả" gửi `limit: 100`.
>   - Cột GMV ẩn khi `gmvHidden`.
> - **Ghi chú nhỏ:** nút "Xóa bộ lọc" chỉ xóa bản nháp trong panel, cần bấm "Áp dụng". Spec không quy định chi tiết này.

- **Ngày thực hiện:** 18/10/2026
- **Kho lưu trữ:** `pos.gui`
- **Nhánh thực hiện:** `qc/dashboard-v2-wave5` (HEAD `f32e03a0`)
- **Tài liệu tham chiếu:**
  - `PRODUCT_SPEC_DASHBOARD.md` (v2.2):
    - FR-FLT-03 (BR-FLT-08..11: Bộ lọc đa chiều);
    - FR-FLT-05 (Ma trận áp dụng bộ lọc đa chiều);
    - AC-FLT-06 (Quy tắc đếm badge theo số chiều kích hoạt);
    - FR-EX-07 (Bảng xếp hạng hiệu suất & Tab Sản phẩm);
    - §10 PM-06 (Quy tắc lọc theo dòng hàng, chứng từ gốc, phân khúc, trạng thái đơn), PM-07 (Tab sản phẩm, ẩn GMV giữ tỷ trọng và số lượng).
  - Hợp đồng Backend (`report.api` / C# DTO contract):
    - Tham số lọc `DashboardV2InputAdminDto`: `categoryIds`, `brandIds`, `genders`, `basketSegments`, `staffIds`, `orderStatuses`, `limit`.
    - Endpoint danh mục: `GET Admin/V2/Dashboard/FilterOptions` trả về `DataResult<DashboardV2FilterOptionsAdminDto>`.
    - Thuộc tính khối `DashboardV2Block<T>`: `notAppliedDimensions: string[]`, `targetsIgnoreDimensions: boolean`.
    - Xếp hạng `ExecutiveRankingV2Dto`: `products: ExecutiveProductRankingItemV2Dto[]`, `productsTotalCount: number`, che dấu `gmv: null` khi `gmvHidden = true`.

---

## 1. Tóm tắt kết quả kiểm thử (Before / After Test Numbers)

| Chỉ số | Baseline (Wave 5a) | Wave 5b (Hoàn thành) | Chênh lệch |
|---|---|---|---|
| **Số file kiểm thử (Test files)** | 54 files | 56 files | +2 files (`dashboardV2MultiDimFilter.spec.ts`, `blockDimensionNotes.spec.ts`) |
| **Số ca kiểm thử (Tests)** | 447 passed | 461 passed | +14 tests net (+4 multi-dim filter, +5 dimension notes, +5 product ranking & api, -1 disabled tab test cũ) |
| **Trạng thái kiểm thử** | 54/54 passed | 56/56 passed (100%) | Đạt toàn bộ |
| **TypeScript check (`vue-tsc -b`)** | Sạch (Exit code 0) | Sạch (Exit code 0) | Không có lỗi kiểu |
| **ESLint (`pages/dashboard-v2`, `report-dashboard`)** | Sạch | Sạch | Không có lỗi lint |
| **Prettier check** | Sạch | Sạch | Tuân thủ formatting chuẩn |
| **Git working tree** | Clean | Clean | 4 commit độc lập theo đúng quy ước |

---

## 2. Chi tiết từng hạng mục thực hiện

### Hạng mục 1: Khai báo Contract OpenAPI, Typings và API Client (Commit `c9ce5a00`)

- **Nội dung triển khai:**
  - Bổ sung schema và endpoint `AdminV2DashboardFilterOptions` (`GET /Admin/V2/Dashboard/FilterOptions`) vào `openapi/report.json` và `src/apis/definitions/report.runtime.json`.
  - Cập nhật định nghĩa TypeScript trong `src/apis/schemas/report.d.ts` cho `DashboardV2FilterOptionsAdminDto`, `ExecutiveProductRankingItemV2Dto`, bổ sung các trường chiều lọc và `limit` vào `DashboardV2InputAdminDto`.
  - Cập nhật `src/pages/dashboard-v2/types.ts`:
    - Khai báo 6 trường chiều lọc vào `DashboardV2Filter`: `categoryIds`, `brandIds`, `genders`, `basketSegments`, `staffIds`, `orderStatuses`, cùng `limit?: number`.
    - Bổ sung `notAppliedDimensions?: string[]` và `targetsIgnoreDimensions?: boolean` vào interface `DashboardV2Block<T>`.
    - Khai báo kiểu `ExecutiveProductRankingItemV2` và bổ sung `products`, `productsTotalCount` vào `ExecutiveRankingV2`.
    - Khai báo enum và nhãn tiếng Việt chuẩn:
      - Giới tính: `1`: Nam, `2`: Nữ, `3`: Không xác định.
      - Phân khúc hóa đơn: `0`: < 0,5 Tr, `1`: 0,5–1 Tr, `2`: 1–3 Tr, `3`: 3–5 Tr, `4`: > 5 Tr.
      - Trạng thái đơn: `1`: Đơn đặt đang mở, `2`: Đơn đặt hoàn thành, `3`: Đơn đặt kết thúc, `4`: Đơn đặt đã hủy, `5`: Đơn hàng bán trực tiếp.
      - Tên chiều tiếng Việt (`DIMENSION_LABELS`): category → Ngành hàng, brand → Thương hiệu, gender → Giới tính khách, basketSegment → Phân khúc hóa đơn, staff → Người bán, orderStatus → Trạng thái đơn.
  - Cập nhật `src/pages/dashboard-v2/services/dashboardV2Api.ts`:
    - Thêm hàm `filterOptions(options?: DashboardV2RequestOptions)` gọi `client.AdminV2DashboardFilterOptions()`.
    - Cập nhật `buildExecutiveRankingParams`, `buildProductParams`, `buildOperationalParams` để tuần tự hóa đầy đủ 6 chiều kích thước và `limit`.
- **Tập tin thay đổi:**
  - `openapi/report.json`
  - `src/apis/definitions/report.runtime.json`
  - `src/apis/schemas/report.d.ts`
  - `src/pages/dashboard-v2/types.ts`
  - `src/pages/dashboard-v2/services/dashboardV2Api.ts`
  - `tests/dashboard-v2/dashboardV2Api.spec.ts`
- **Commit:** `c9ce5a00` - `feat: declare multi-dimension filter and product ranking contract in openapi and typings`

---

### Hạng mục 2: Bảng điều khiển bộ lọc đa chiều (FR-FLT-03, BR-FLT-08..11, AC-FLT-06) (Commit `63bb3859`)

- **Nội dung triển khai:**
  - Thêm nút "Bộ lọc đa chiều" trên thanh lọc toàn cục `DashboardV2FilterBar.vue`.
  - Hiển thị badge số lượng chiều đang lọc trên nút:
    - Tuân thủ nghiêm ngặt **AC-FLT-06**: Đếm số chiều kích hoạt (0 đến 6), không đếm số giá trị (chọn 2 ngành hàng thì badge vẫn là "1").
    - Cung cấp hàm tiện ích `countActiveDimensions(filter)` trong `useDashboardV2Filter.ts`.
  - Panel popup bộ lọc gồm 6 nhóm chiều:
    1. **Ngành hàng**: Searchable multi-select từ danh sách `FilterOptions.categories`.
    2. **Thương hiệu**: Searchable multi-select từ danh sách `FilterOptions.brands`.
    3. **Giới tính khách**: Nhóm checkbox (Nam, Nữ, Không xác định).
    4. **Phân khúc hóa đơn**: Nhóm checkbox (< 0,5 Tr, 0,5–1 Tr, 1–3 Tr, 3–5 Tr, > 5 Tr).
    5. **Trạng thái đơn**: Nhóm checkbox (Đơn đặt đang mở, Đơn đặt hoàn thành, Đơn đặt kết thúc, Đơn đặt đã hủy, Đơn hàng bán trực tiếp).
    6. **Người bán / PIC Sales**: Searchable multi-select từ danh sách nhân viên của các chi nhánh đang được chọn (filtered by active siteIds).
  - Tải danh mục `FilterOptions` một lần cho mỗi phiên (cached in session); tự động cập nhật danh sách nhân viên theo các chi nhánh được chọn trong bộ lọc 3 cấp.
  - Cơ chế bản nháp (Draft state): Các thay đổi trong panel chỉ được áp dụng khi bấm nút "Áp dụng", hoặc khôi phục/xóa sạch khi bấm "Xóa bộ lọc".
- **Tập tin thay đổi:**
  - `src/pages/dashboard-v2/composables/useDashboardV2Filter.ts`
  - `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue`
  - `tests/dashboard-v2/dashboardV2Foundation.spec.ts`
  - `tests/dashboard-v2/dashboardV2MultiDimFilter.spec.ts` (mới)
- **Commit:** `63bb3859` - `feat: add multi-dimension filter panel and active dimension badge`

---

### Hạng mục 3: Nhãn "Không áp dụng bộ lọc" và ghi chú mục tiêu (BR-FLT-09, FR-FLT-05) (Commit `34514426`)

- **Nội dung triển khai:**
  - Trong `DashboardV2Block.vue`: Khi `notAppliedDimensions` có phần tử, hiển thị nhãn màu xám mờ (muted) `Không áp dụng bộ lọc: <tên tiếng Việt các chiều, phân tách bằng dấu phẩy>`.
  - Khi `targetsIgnoreDimensions === true`: Hiển thị dòng ghi chú `Mục tiêu không đổi theo bộ lọc đa chiều`.
  - Áp dụng hiển thị nhãn và ghi chú tại các thành phần hiển thị mục tiêu và bảng xếp hạng:
    - `DashboardV2Block.vue`
    - `ExecutiveCumulativeTrendChart.vue` (vùng ghi chú lũy kế)
    - `ExecutivePerformanceRanking.vue` (tiêu đề và cột % đạt mục tiêu)
- **Tập tin thay đổi:**
  - `src/pages/dashboard-v2/components/DashboardV2Block.vue`
  - `src/pages/dashboard-v2/components/ExecutiveCumulativeTrendChart.vue`
  - `src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue`
  - `tests/dashboard-v2/blockDimensionNotes.spec.ts` (mới)
- **Commit:** `34514426` - `feat: display not applied dimensions label and target note on blocks and charts`

---

### Hạng mục 4: Tab "Sản phẩm" của bảng xếp hạng hiệu suất (FR-EX-07, PM-07) (Commit `f32e03a0`)

- **Nội dung triển khai:**
  - Kích hoạt tab "Sản phẩm" trong `ExecutivePerformanceRanking.vue`: Bỏ cờ `disabled`, bỏ thuộc tính `title="Sắp có"`, bỏ huy hiệu "Sắp có" và xóa TODO comment.
  - Xây dựng bảng xếp hạng sản phẩm với các cột chuẩn theo đặc tả:
    1. `#`: Thứ hạng sản phẩm (`rank`).
    2. `Sản phẩm`: Tên sản phẩm in đậm kèm mã SKU nhỏ bên dưới (`name`, `code`).
    3. `Ngành hàng`: Tên ngành hàng (`categoryName` hoặc `—` nếu rỗng).
    4. `GMV`: Giá trị GMV định dạng gọn chuẩn tiền tệ Việt Nam (`productGmvLabels`).
    5. `Tỷ trọng`: Tỷ trọng GMV sản phẩm so với phạm vi (`formatPercent(share)` với 1 chữ số thập phân).
    6. `Số lượng`: Số lượng bán ra (`formatCount(quantity)`).
  - Mặc định hiển thị Top 5 sản phẩm.
  - Nút "Xem tất cả":
    - Hiển thị tổng số lượng sản phẩm: `Xem tất cả (${productsTotalCount})`.
    - Khi bấm "Xem tất cả", phát sự kiện `@limit-change="100"` và mở rộng danh sách sản phẩm.
    - Khi bấm "Thu gọn", phát sự kiện `@limit-change="5"` và thu gọn về Top 5.
  - Đấu nối sự kiện `@limit-change="changeRankingLimit"` trong `ExecutiveView.vue`, gọi `patchAndLoad(rankingSnapshot, { limit })` để refetch dữ liệu theo limit mới.
  - Cơ chế bảo mật GMV (`gmvHidden`):
    - Khi `gmvHidden: true` (hoặc khối `block.gmvHidden === true`), ẩn hoàn toàn cột GMV (ở cả `<th>` và `<td>`), giữ nguyên hiển thị cột `Tỷ trọng` và `Số lượng`.
- **Tập tin thay đổi:**
  - `src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue`
  - `src/pages/dashboard-v2/views/ExecutiveView.vue`
  - `tests/dashboard-v2/executivePerformanceRanking.spec.ts`
- **Commit:** `f32e03a0` - `feat: enable product ranking tab with top products and limit toggle`

---

## 3. Danh sách Commit trên nhánh `qc/dashboard-v2-wave5`

```
f32e03a0 feat: enable product ranking tab with top products and limit toggle
34514426 feat: display not applied dimensions label and target note on blocks and charts
63bb3859 feat: add multi-dimension filter panel and active dimension badge
c9ce5a00 feat: declare multi-dimension filter and product ranking contract in openapi and typings
8f77e8ea feat: wire full catalog detail modal in top products table (Wave 5a HEAD)
```

---

## 4. Kết quả chạy lệnh kiểm tra nghiệm thu (Verification Results)

### 4.1. Unit & Integration Tests (Vitest)
```bash
NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2
```
**Kết quả đầu ra:**
```text
 Test Files  56 passed (56)
      Tests  461 passed (461)
   Start at  21:22:53
   Duration  21.48s (transform 4.41s, setup 0ms, collect 94.86s, tests 28.17s, environment 13.19s, prepare 2.28s)
```

### 4.2. TypeScript Typecheck
```bash
npx vue-tsc -b --noEmit
```
**Kết quả đầu ra:**
```text
(Clean - Exit code 0, không có lỗi kiểu)
```

### 4.3. ESLint Check
```bash
npx eslint src/pages/dashboard-v2 src/components/report-dashboard
```
**Kết quả đầu ra:**
```text
(Clean - Exit code 0, không có lỗi lint)
```

### 4.4. Prettier Check
```bash
npx prettier --check src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue src/pages/dashboard-v2/views/ExecutiveView.vue tests/dashboard-v2/executivePerformanceRanking.spec.ts
```
**Kết quả đầu ra:**
```text
Checking formatting...
All matched files use Prettier code style!
```

### 4.5. Git Status Check
```bash
git status --short
```
**Kết quả đầu ra:**
```text
(Clean working tree - không còn file unstaged/untracked)
```
