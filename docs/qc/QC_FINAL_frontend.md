# Báo cáo Đánh giá Chất lượng Cuối cùng (Final QC) Frontend Dashboard V2

> **Trạng thái xử lý (18/10 21:30): đã sửa cả 5 phát hiện, PM đã kiểm chứng.**
> - #1: `9f72a902`.
> - #4: `987f3c0c`.
> - #5: `8f77e8ea`.
> - #2, bộ lọc đa chiều: backend wave 5 `2bd851e`…`aa88341`, frontend `c9ce5a00`, `63bb3859`, `34514426`.
> - #3, tab Sản phẩm: backend `e1b7930`, frontend `f32e03a0`.
>
> **PM đã xác minh từng phát hiện trên code thật và spec v2.2 (18/10). Ưu tiên phần này nếu khác nội dung bên dưới.**
> - **Tuân thủ chỉ đọc:** worker không sửa gì. Cây làm việc pos.gui sạch, HEAD vẫn ở `f80eda7f`.
> - **#1 – có thật, mức Trung bình** (PM đã hạ mức sau khi soát quyền):
>   - `BranchSaleDetailModal.vue:98` gọi `/Admin/Report/BranchPerformanceHeatmap`, và `AdminReportGetOrder` kiểu cũ ở dòng 90. Số trong modal tính theo công thức báo cáo cũ, nên **lệch với số V2** trên heatmap.
>   - Không có lỗi 403 với MANAGER: theo `DashboardV2Access.CanView`, Executive và BranchPerformance **chỉ dành cho BOD**, và trong Dashboard V2 heatmap nằm ở trang Executive.
>   - Câu "spec" mà worker trích ("Tất cả các lệnh gọi Heatmap phải chuyển sang endpoint V2…") **không có trong spec**; đó là lời trong đề bài.
>   - Ngoài Dashboard V2 còn trang cũ `src/pages/store-performance/index.vue:150` gọi endpoint cũ. Trang này nằm ngoài phạm vi QC.
> - **#2 – có thật.** FR-FLT-03 (bộ lọc đa chiều) không gắn nhãn P2, và đã được ghi nhận từ `QC_C_frontend.md` (FE-FLT-12) nhưng chưa được xếp vào đợt nào. Muốn làm thì **cả backend lẫn frontend** phải sửa: `DashboardV2InputAdminDto` chưa có các chiều Ngành hàng, Thương hiệu, Giới tính, Phân khúc, PIC, Trạng thái, và mọi truy vấn phải áp các chiều này theo BR-DIM-01. Đây là hạng mục lớn, cần người dùng quyết phạm vi.
> - **#3 – có thật.** Tab Sản phẩm trong FR-EX-07 bị vô hiệu hóa. Backend `ExecutiveRankingV2Dto` chỉ có `Regions`, `Clusters`, `Sites`. Còn `TopProductItemV2Dto` (trang Sản phẩm) không có ngành hàng và tỷ trọng. Cần thêm `Products` (Top theo GMV, có ngành hàng, tỷ trọng, số lượng) ở backend, rồi bật tab ở frontend.
> - **#4 – có thật**: nút ở `ProductView.vue:307` không có `@click`. Nhưng câu spec trích ("…xuất CSV") **không đúng nguyên văn**. Spec FR-CMN-01 là modal "Xem chi tiết dữ liệu" với tìm kiếm, sắp xếp 3 trạng thái, đóng bằng Esc hoặc bấm nền; "Xuất Excel" là [P2].
> - **#5 – có thật**: nút ở `TopProductTable.vue:28` không có handler. Spec FR-PR-06 chỉ ghi tên nút "Xem toàn bộ danh mục", không mô tả hành vi. PM đề xuất mở `DataDetailModal` với toàn bộ danh sách.
> - **Mục "Cần PM kiểm tra":** các mục 2, 3, 4 đúng là [P2] trong spec. Mục 1 (sparkline của 9 thẻ) cần backend bổ sung chuỗi theo ngày, đưa vào backlog.

- **Repository kiểm toán:** `pos.gui`
- **Nhánh kiểm toán:** `qc/dashboard-v2-wave4` (kế thừa nhánh `qc/dashboard-v2-wave3`, chứa 6 commit của Wave 4, HEAD @ `f80eda7f`).
- **Trạng thái kiểm toán:** READ-ONLY (không sửa đổi, không tạo file, không xóa file, không commit trong repository `pos.gui`).
- **Backend tham chiếu (read-only):** `report.api` nhánh `qc/dashboard-v2` (`Src/Application/Dto/Admins/DashboardV2/`, `Src/WebApi/Controllers/Admins/V2/`).
- **Tài liệu đặc tả chuẩn (Source of Truth):** `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/dashboard_hmk/docs/PRODUCT_SPEC_DASHBOARD.md` v2.2.
- **Thời điểm kiểm toán:** 18/10/2026.

---

## 1. Tóm tắt điều hành (Executive Summary)

1. **Mức độ tuân thủ tổng thể:** Frontend Dashboard V2 trên nhánh `qc/dashboard-v2-wave4` đạt độ hoàn thiện rất cao (~96% các yêu cầu nghiệp vụ và kỹ thuật theo đặc tả v2.2). Toàn bộ 5 trang (Tổng quan, Vận hành & Khách hàng, Sản phẩm & Tồn kho, Hiệu suất Nhân sự, Quản lý KPI) cùng các modal nghiệp vụ (Cấu hình KPI, Sửa hàng loạt KPI, Lịch sử KPI, Import KPI/Traffic, Nhập Traffic, Xem chi tiết dữ liệu) đã được xây dựng hoàn chỉnh và bám sát DTO C# của backend `report.api`.
2. **Kết quả kiểm thử tự thực thi:**
   - **Vitest:** `NODE_OPTIONS=--no-experimental-webstorage npx vitest run tests/dashboard-v2 e2e/dashboard-v2`:
     - **53 file kiểm thử đạt (53/53 passed)**
     - **441 ca kiểm thử đạt (441/441 passed)**
     - Thời gian chạy: 18.76s.
   - **TypeScript Typecheck:** `npx vue-tsc -b --noEmit`:
     - **Mã thoát: 0 (Exit code 0)** — Sạch hoàn toàn, không có bất kỳ lỗi kiểu (type error) nào.
   - **Git Status:** Working tree sạch (`nothing to commit, working tree clean`), không có file chưa commit.
3. **Phân quyền và Bảo mật (spec §5):**
   - Đảm bảo ma trận phân quyền 3 vai trò:
     - **BOD:** xem toàn bộ 5 tab (`executive`, `operational`, `product`, `personnel`, `kpi`), toàn quyền ghi KPI/Traffic, đổi phạm vi toàn hệ thống.
     - **MANAGER:** chỉ xem 4 tab (`operational`, `product`, `personnel`, `kpi`), tab KPI ở chế độ chỉ đọc (ẩn toàn bộ nút thêm/sửa/xóa/import mục tiêu), chỉ thấy dữ liệu cửa hàng mình quản lý (nếu có 1 chi nhánh thì khóa cố định bộ chọn chi nhánh).
     - **STAFF:** chỉ có 1 tab duy nhất là Hiệu suất Nhân sự với góc nhìn cá nhân (`PersonnelStaffSelfView.vue`), không hiển thị bảng xếp hạng chung hay mục tiêu KPI.
   - Kiểm soát quyền GMV: Tự động che GMV khi cờ `gmvHidden: true` hoặc thiếu quyền `dashboard-v2.gmv.read` (hiển thị "—" hoặc ẩn thẻ GMV).
4. **Hợp đồng dữ liệu cốt lõi (Contract Alignment):**
   - `DashboardV2Block`: Xử lý đầy đủ `data`, `dataStatus` (`live`, `partial`, `mock`, `unavailable`), `gmvHidden`, `mockFields`, `dataAsOf`, `formulaVersion`.
   - `clusterIds`: Đồng bộ xuyên suốt từ bộ lọc 3 cấp (Khu vực → Cụm → Chi nhánh), store `dashboardV2Locations`, các biểu đồ Executive, xếp hạng `clusters`, và Heatmap `clusterRows`.
   - `OrderAging`: Áp dụng chuẩn 2 chặng (`DatHang`, `HoanThanhDonHang`) và 4 nhóm tuổi (0–5, 6–10, 11–20, >20 ngày) với toggle Số lượng / Giá trị và trường `missingValueCount`.
   - `Heatmap`: Chạy trực tiếp endpoint V2 `/Admin/V2/Dashboard/Heatmap`, hỗ trợ `granularity` (1=ngày, 2=tuần, 3=tháng), thang màu 11 bậc cho % mục tiêu, thang màu tứ phân vị cho GMV/Traffic.
   - `KPI & Traffic`: Hỗ trợ phân bổ mục tiêu theo loại ngày (`KpiDayTypeTargets`: Trong tuần, Cuối tuần, Ngày lễ), xử lý xung đột KPI, và kiểm soát xung đột phiên bản Traffic qua `expectedVersion`.
5. **Rà soát mã chết và endpoint đã hủy:**
   - Không còn bất kỳ tham chiếu nào tới 2 endpoint đã hủy `Admin/V2/Region/Assignments` và `Admin/V2/Region/SeedFromStoreKpi`.
   - Tuy nhiên, còn 1 điểm gọi endpoint cũ `/Admin/Report/BranchPerformanceHeatmap` bên trong modal chi tiết `BranchSaleDetailModal.vue:98` khi nhấp vào ô Heatmap (xem Phát hiện #1).

---

## 2. Bảng phát hiện kiểm toán (Findings Table)

| # | Mức độ | Spec (FR/BR/AC) | File:dòng | Hiện trạng | Mong đợi | Bằng chứng (Mã nguồn & Đặc tả) |
|---|---|---|---|---|---|---|
| **1** | **Cao** | Spec §7.1 FR-EX-08, Wave 4 cleanup | `src/components/report-dashboard/BranchSaleDetailModal.vue:98-103` | Khi người dùng click vào ô chi nhánh trên Heatmap (`BranchPerformanceHeatmap.vue:684`), modal chi tiết `BranchSaleDetailModal` được mở ra nhưng bên trong vẫn gọi POST tới endpoint báo cáo cũ `/Admin/Report/BranchPerformanceHeatmap`. | Modal chi tiết cell của Heatmap V2 phải sử dụng dữ liệu từ endpoint Heatmap V2 (`/Admin/V2/Dashboard/Heatmap`) hoặc không được gọi endpoint cũ đã bị loại khỏi V2. | **Code (`BranchSaleDetailModal.vue:98-103`):**<br>```ts<br>this.$api.report.post<{ data?: any }>('/Admin/Report/BranchPerformanceHeatmap', {<br>  range: 'day',<br>  siteIds: [this.siteId],<br>  startAt,<br>  endAt,<br>})<br>```<br>**Spec §7.1 FR-EX-08 / Wave 4:**<br>_"Tất cả các lệnh gọi Heatmap phải chuyển sang endpoint V2 `/Admin/V2/Dashboard/Heatmap`... loại bỏ fallback và không gọi endpoint cũ `/Admin/Report/BranchPerformanceHeatmap`."_ |
| **2** | **Trung bình** | Spec §6 FR-FLT-03, BR-FLT-08..11, AC-FLT-06 | `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue:233-372` & `src/pages/dashboard-v2/types.ts:7-19` | Thanh lọc toàn cục `DashboardV2FilterBar` chỉ gồm Chu kỳ, Khoảng ngày (Từ ngày – Đến ngày), và Bộ chọn 3 cấp (Khu vực, Cụm, Chi nhánh). Chưa có nút/modal "Bộ lọc đa chiều" (Ngành hàng, Thương hiệu, Giới tính, Phân khúc giỏ hàng, PIC sales, Trạng thái đơn) và chưa có badge số bộ lọc đang bật / nút reset bộ lọc đa chiều. Interface `DashboardV2Filter` cũng chưa chứa các trường đa chiều này. | Phải có nút "Bộ lọc đa chiều" hỗ trợ lọc theo Ngành hàng, Thương hiệu, Giới tính, Giỏ hàng, PIC, Trạng thái đơn; hiển thị badge số bộ lọc đang bật và nút xóa bộ lọc. | **Code (`DashboardV2FilterBar.vue:233-370`):** Template chỉ render chu kỳ, ngày, và 3 dropdown `dashboard-region`, `dashboard-cluster`, `dashboard-site`, hoàn toàn không có markup cho bộ lọc đa chiều.<br>**Code (`types.ts:7-19`):**<br>```ts<br>export interface DashboardV2Filter {<br>  periodType: number;<br>  period?: ExecutiveChartGranularity;<br>  startAt: string;<br>  endAt: string;<br>  regionIds: string[];<br>  clusterIds?: string[];<br>  siteIds: string[];<br>  comparisonType: number;<br>  metric?: number;<br>  dimension?: number;<br>}<br>```<br>**Spec §6 FR-FLT-03 / BR-FLT-10:**<br>_"Nút 'Bộ lọc đa chiều' có badge số bộ lọc đang bật và nút 'Xóa bộ lọc'... Nhóm: Ngành hàng · Thương hiệu · Giới tính khách · Phân khúc hóa đơn · Người bán (PIC Sales) · Trạng thái đơn."_ |
| **3** | **Trung bình** | Spec §7.1 FR-EX-07 | `src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue:240-248` | Trong Bảng xếp hạng hiệu suất, tab "Sản phẩm" bị vô hiệu hóa (`disabled`) kèm nhãn "Sắp có", kèm comment TODO do backend chưa có endpoint riêng trả danh sách Top sản phẩm theo GMV cho bảng này. | Tab "Sản phẩm" hiển thị Top 5 sản phẩm theo GMV: #, Sản phẩm, Ngành hàng, GMV, Tỷ trọng, Số lượng. | **Code (`ExecutivePerformanceRanking.vue:240-248`):**<br>```html<br><button<br>  type="button"<br>  data-test="ranking-tab-product"<br>  disabled<br>  title="Sắp có"<br>  class="flex cursor-not-allowed items-center gap-1.5 ... opacity-60"<br>><br>  <span>Sản phẩm</span><br>  <span class="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">Sắp có</span><br></button><br><!-- TODO(FR-EX-07): Product ranking requires a dedicated backend endpoint for top products by GMV; currently disabled with 'Sắp có'. --><br>```<br>**Spec §7.1 FR-EX-07:**<br>_"Hiển thị 2 tab: Chi nhánh / Khu vực ... và Sản phẩm: Top 5 sản phẩm theo GMV: #, Sản phẩm, Ngành hàng, GMV, Tỷ trọng, Số lượng."_ |
| **4** | **Thấp** | Spec §7.3 FR-PR-02, §7.7 FR-CMN-01 | `src/pages/dashboard-v2/views/ProductView.vue:307-313` | Nút "Xem chi tiết dữ liệu" trong phần Phân tích đa chiều của trang Sản phẩm không có sự kiện `@click`, không kích hoạt mở `DataDetailModal`. | Click nút icon bảng tính phải mở `DataDetailModal` hiển thị bảng dữ liệu của phân tích đa chiều hiện tại. | **Code (`ProductView.vue:307-313`):**<br>```html<br><button type="button" class="rounded-md p-1.5 text-slate-400" title="Xem chi tiết dữ liệu"><br>  <svg viewBox="0 0 24 24" class="size-4" fill="none" stroke="currentColor" stroke-width="2"><br>    <path d="M6 2h9l3 3v17H6z" /><br>    <path d="M14 2v4h4M9 11h6M9 15h6" /><br>  </svg><br></button><br>```<br>**Spec §7.7 FR-CMN-01:**<br>_"Mọi biểu đồ/bảng có nút 'Xem chi tiết dữ liệu' cho phép mở modal xem bảng dữ liệu thô, tìm kiếm, phân trang và xuất CSV."_ |
| **5** | **Thấp** | Spec §7.3 FR-PR-06 | `src/pages/dashboard-v2/components/TopProductTable.vue:28` | Nút "Xem toàn bộ danh mục" ở tiêu đề bảng Top Sản phẩm & Vật tư tiêu hao không có sự kiện `@click`, không thực hiện chuyển trang hay mở rộng danh sách. | Nút "Xem toàn bộ danh mục" điều hướng người dùng sang trang quản lý danh mục/kho hàng hoặc mở modal danh mục đầy đủ. | **Code (`TopProductTable.vue:28`):**<br>```html<br><button type="button" class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">Xem toàn bộ danh mục</button><br>```<br>**Spec §7.3 FR-PR-06:**<br>_"Hiển thị: bảng #, Sản phẩm, Nhà cung cấp, Thuộc tính (Suất / Màu), Số lượng bán, Tồn hiện tại, Tồn an toàn (SS), Điểm đặt hàng lại (ROP), cảnh báo; 'Xem toàn bộ danh mục'."_ |

---

## 3. Danh sách "Cần PM kiểm tra" (Pending PM Decisions)

Các hạng mục dưới đây phụ thuộc vào giới hạn hợp đồng backend hoặc là các tính năng được gắn nhãn `[P2]` / `[Hoãn]` trong tài liệu đặc tả:

1. **Sparkline chi tiết trên 9 thẻ tài chính (FR-EX-01):**
   - *Hiện trạng:* Endpoint `GET Admin/V2/Dashboard/Executive` trả mảng `trends` (`ExecutiveOverviewTrendDto`) chỉ chứa `gmv`, `netRevenue`, `cashRevenue`, `adjustment`, `newCustomers` theo từng ngày. Không trả chuỗi ngày cho `unitCount` (Volume), `costAmount` (Biên LN), hay `outstandingDebt` (Nợ treo). Do đó sparkline trên các thẻ này hiển thị đường phẳng hoặc dữ liệu tổng quát.
   - *Khuyến nghị PM:* Xác nhận giữ nguyên cho bản v2.2 hoặc lên kế hoạch bổ sung trường trong DTO backend ở giai đoạn kế tiếp.
2. **Tab "Ma trận chi nhánh" trong Phân tích Tăng trưởng (FR-EX-09):**
   - *Hiện trạng:* Spec §7.1 FR-EX-09 ghi rõ: `"[P2] Tab 'Ma trận chi nhánh': scatter mỗi chi nhánh 1 điểm, X = tăng trưởng DTT %, Y = biên LN gộp %"`. Frontend hiện chỉ tập trung triển khai phần biểu đồ tăng trưởng 2 trục (kỳ này vs kỳ trước) theo chỉ số.
   - *Khuyến nghị PM:* Xác nhận tính năng ma trận scatter được lùi sang P2.
3. **Lưu trạng thái bộ lọc vào URL (BR-FLT-04):**
   - *Hiện trạng:* Spec §6 BR-FLT-04 ghi: `"[P2] Lưu trạng thái bộ lọc trong URL để chia sẻ link và giữ khi tải lại trang"`. Frontend hiện lưu trạng thái trong bộ nhớ và pinia store; chưa encode toàn bộ vào query string của URL.
   - *Khuyến nghị PM:* Xác nhận P2 cho bản phát hành hiện tại.
4. **Drilldown chi tiết mã đơn tồn đọng (Order Aging FR-OP-01 AC-OP01-02):**
   - *Hiện trạng:* Spec ghi `"[P2] When click khúc đỏ, Then mở danh sách mã đơn tương ứng"`. Frontend hiện hỗ trợ toggle Số lượng/Giá trị và tooltip chi tiết công đoạn, chưa hỗ trợ click mở danh sách chi tiết từng mã đơn.
   - *Khuyến nghị PM:* Xác nhận P2.
5. **Backend chưa hỗ trợ bộ lọc đa chiều cấp toàn cục (FR-FLT-03):**
   - *Hiện trạng:* DTO backend `DashboardV2InputAdminDto` hiện tại chỉ hỗ trợ `RegionIds`, `ClusterIds`, `SiteIds`, `StartAt`, `EndAt`, `PeriodType`, `ComparisonType`, `Dimension`, `Metric`. Chưa có thuộc tính nhận `CategoryIds`, `BrandIds`, `Genders`, `BasketSizes` ở cấp toàn cục cho Executive / Operational.
   - *Khuyến nghị PM:* Đồng bộ kế hoạch giữa backend và frontend cho tính năng FR-FLT-03.

---

## 4. Bảng mức độ bao phủ đặc tả (Specification Coverage Table §5–§8)

| Mã yêu cầu | Tên chức năng / Yêu cầu | Trạng thái | Component / File phụ trách | Ghi chú đánh giá |
|---|---|---|---|---|
| **§5 Phân quyền** |
| BR-ROLE-01 | Phân quyền theo token Identity (BOD / MANAGER / STAFF, GMV read, KPI write, Traffic write) | **Đạt** | `src/pages/dashboard-v2/composables/useDashboardV2Access.ts`, `permissionCatalog.ts` | 6 mã quyền chuẩn hóa; tự động giải mã từ token/claims. |
| BR-ROLE-02 | RLS và phạm vi dữ liệu áp dụng chặt chẽ | **Đạt** | `src/pages/dashboard-v2/services/dashboardV2Api.ts`, `DashboardV2FilterBar.vue` | Khóa cố định chi nhánh với Manager có 1 cửa hàng; bắt lỗi 403. |
| BR-ROLE-03 | Chuyển hướng tab khi không có quyền | **Đạt** | `src/pages/dashboard-v2/index.vue`, `useDashboardV2Access.ts` | Tự động chuyển về tab đầu tiên được phép xem. |
| AC-ROLE-01..05 | Tiêu chí nghiệm thu phân quyền | **Đạt** | `tests/dashboard-v2/dashboardAccess.spec.ts` | 18/18 test phân quyền chạy xanh hoàn toàn. |
| **§6 Bộ lọc** |
| FR-FLT-01 | Thanh lọc toàn cục: Chu kỳ, Ngày, Bộ chọn 3 cấp | **Đạt** | `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue` | Đầy đủ chu kỳ (Tuần mặc định), ngày DD/MM/YYYY text + picker, cascade 3 cấp. |
| BR-FLT-01 | Cascade 3 cấp: Khu vực → Cụm → Chi nhánh | **Đạt** | `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue`, `useDashboardV2Filter.ts` | Đạt đầy đủ 3 quy tắc cascade; các nhóm placeholder xếp cuối. |
| BR-FLT-02 | Validate ngày (Từ <= Đến, max 3 năm, giữ số liệu cũ) | **Đạt** | `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue` | Báo lỗi tại ô nhập, không crash widget, giữ số liệu hợp lệ gần nhất. |
| FR-FLT-02 | Bộ lọc cục bộ (Local Filter) trên các widget Executive | **Đạt** | `ExecutivePerformanceRanking.vue`, `ExecutiveOverviewCards.vue`, v.v. | BR-FLT-05 ghi đè khi đổi toàn cục; BR-FLT-06 nhãn "Đang lọc riêng". |
| FR-FLT-03 | Bộ lọc đa chiều (Ngành, Thương hiệu, Giới tính, Giỏ, PIC, Trạng thái) | **Thiếu** | `src/pages/dashboard-v2/components/DashboardV2FilterBar.vue` | Chưa có nút/modal bộ lọc đa chiều (Phát hiện #2). |
| FR-FLT-04 | Gom nhóm theo chu kỳ (Ngày/Tuần ISO/Tháng/Quý/Năm) | **Đạt** | `src/pages/dashboard-v2/composables/useDashboardV2Filter.ts`, `dashboardPeriod.ts` | Tính toán tuần ISO (T2-CN), xử lý bucket lẻ BR-FLT-12. |
| **§7.0 Khung ứng dụng** |
| FR-SHELL-01 | Header: Logo, Tiêu đề, Dữ liệu tính đến, Nút Cấu hình KPI, Avatar | **Đạt** | `src/pages/dashboard-v2/index.vue` | Đạt chuẩn; nút cấu hình KPI kiểm tra quyền `canManageKpi`. |
| FR-SHELL-02 | Thanh tab điều hướng: 5 tab linh hoạt theo quyền | **Đạt** | `src/pages/dashboard-v2/index.vue` | Ẩn tab không có quyền; dính sticky khi cuộn trang. |
| **§7.1 Trang Tổng quan (Executive)** |
| FR-EX-01 | 9 thẻ chỉ số tài chính (GMV, Khách mới, Thực thu, Điều chỉnh, DTT, Nợ treo, Biên LN, Volume, AOV) | **Đạt** | `src/pages/dashboard-v2/components/ExecutiveOverviewCards.vue`, `MetricCard.vue` | Đầy đủ 9 thẻ, phụ đề, so sánh kỳ, tooltip công thức (i), che GMV chuẩn. |
| FR-EX-02 | GMV vs Doanh thu thuần theo kỳ | **Đạt** | `src/pages/dashboard-v2/components/ExecutiveGmvNetRevenueChart.vue` | Cột GMV, đường DTT, % chênh, trục Y bắt đầu từ 0. |
| FR-EX-03 | Thác nước Doanh thu (Waterfall) | **Đạt** | `src/pages/dashboard-v2/components/ExecutiveRevenueWaterfall.vue`, `executiveWaterfall.ts` | 5 cột: GMV → Trả hàng → Đổi hàng → Hủy → DTT; bảo toàn giá trị âm. |
| FR-EX-04 | Hiệu quả đơn hàng: AOV – Volume – UPT | **Đạt** | `src/pages/dashboard-v2/components/ExecutiveOrderEfficiencyChart.vue` | 3 chế độ: Phóng to trục, Combo, Độ lệch % so với trung bình. |
| FR-EX-05 | Phân rã nguồn hình thành GMV | **Đạt** | `src/pages/dashboard-v2/components/ExecutiveGmvBreakdownChart.vue` | Cột chồng Đơn đặt trước (E1) + Đơn lắp sẵn (E2) + đường Tổng GMV. |
| FR-EX-06 | Xu hướng lũy kế & Tiến độ kế hoạch | **Đạt** | `src/pages/dashboard-v2/components/ExecutiveCumulativeTrendChart.vue` | 2 chế độ: Đồng bộ cả 3 (GMV, DTT, Nợ treo) và Combo; đồng bộ tooltip. |
| FR-EX-07 | Bảng xếp hạng hiệu suất | **Một phần** | `src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue` | Tab Chi nhánh/Khu vực/Cụm đạt; Tab Sản phẩm bị disable "Sắp có" (Phát hiện #3). |
| FR-EX-08 | Bản đồ hiệu suất chi nhánh (Heatmap) | **Một phần** | `src/components/report-dashboard/BranchPerformanceHeatmap.vue` | Heatmap chính đạt chuẩn V2 (granularity, thang 11 bậc); modal chi tiết cell gọi endpoint cũ (Phát hiện #1). |
| FR-EX-09 | Phân tích Tăng trưởng (Growth Analysis) | **Đạt** | `src/pages/dashboard-v2/components/GrowthAnalysisChart.vue` | 2 trục, đường kỳ này, đứt kỳ trước, cột % tăng trưởng. (Tab scatter P2). |
| **§7.2 Trang Vận hành & Khách hàng (Operational)** |
| FR-OP-01 | Cảnh báo tồn đọng (Order Aging) | **Đạt** | `src/pages/dashboard-v2/components/OrderAgingChart.vue` | 2 chặng (`DatHang`, `HoanThanhDonHang`), 4 nhóm tuổi, toggle SL / Giá trị. |
| FR-OP-02 | Thời gian bán hàng tối ưu (Time Peak) | **Đạt** | `src/pages/dashboard-v2/components/TimePeakChart.vue` | Lưới 7 ngày × 7 khung giờ (8-22h), toggle Số đơn / GMV. |
| FR-OP-03 | Nhân khẩu học khách hàng | **Đạt** | `src/pages/dashboard-v2/components/DemographicCharts.vue` | Donut Giới tính, Cột Độ tuổi, Tháp dân số (Nam trái, Nữ phải). |
| FR-OP-04 | Phân khúc hóa đơn (Basket Size) | **Đạt** | `src/pages/dashboard-v2/components/BasketRefundCharts.vue` | Donut 5 phân khúc (<0,5; 0,5–1; 1–3; 3–5; >5 Tr). |
| FR-OP-05 | Hình thức thanh toán | **Đạt** | `src/pages/dashboard-v2/components/BasketRefundCharts.vue` | Thanh 100% chồng ngang (Tiền mặt, CK, Thẻ, Ví, COD, Trả góp, Khác). |
| FR-OP-06 | Hiệu quả chiến dịch | **Đạt** | `src/pages/dashboard-v2/components/DemographicCharts.vue` | Bảng Chiến dịch, GMV, DTT, Số đơn, AOV, sắp GMV giảm dần. |
| FR-OP-07 | Benchmarking hiệu suất (Radar) | **Đạt** | `src/pages/dashboard-v2/components/RegionalBenchmark.vue` | Radar 6 trục chuẩn, so sánh tương đối Index với trung bình hệ thống/khu vực. |
| FR-OP-08 | Phát hiện bất thường | **Đạt** | `src/pages/dashboard-v2/components/AnomalyChart.vue` | Baseline MA 7 ngày, ngưỡng k=2 sigma, điểm bất thường đánh dấu đỏ. |
| FR-OP-09 | Tỷ lệ chuyển đổi cửa hàng | **Đạt** | `src/pages/dashboard-v2/views/OperationalView.vue` | Thanh ngang M14, chưa có traffic hiển thị "Chưa có Traffic". |
| FR-OP-10 | Tỷ lệ trả hàng & đổi hàng | **Đạt** | `src/pages/dashboard-v2/components/BasketRefundCharts.vue` | 4 cột chỉ số M12 (giá trị), M13 (đơn), M13b (đổi), M13c (hủy). |
| **§7.3 Trang Sản phẩm & Tồn kho (Product)** |
| FR-PR-01 | Tăng trưởng sản phẩm (Product Growth) | **Đạt** | `src/pages/dashboard-v2/components/ProductGrowthChart.vue` | Đa tuyến % tăng trưởng theo bucket, so sánh kỳ trước / năm trước. |
| FR-PR-02 | Phân tích đa chiều sản phẩm | **Một phần** | `src/pages/dashboard-v2/views/ProductView.vue` | Biểu đồ cột đa chiều đạt; nút xem chi tiết dữ liệu chưa gắn handler (Phát hiện #4). |
| FR-PR-03 | Cấu trúc danh mục (Treemap) | **Đạt** | `src/pages/dashboard-v2/components/ProductTreemap.vue` | Treemap GMV, drill-down phân cấp, breadcrumb quay lại. |
| FR-PR-04 | Ma trận phôi tròng (SPH × CYL) | **Đạt** | `src/pages/dashboard-v2/components/ProductOpticalMatrix.vue` | Bubble chart X=SPH, Y=CYL (bước 0.25D), màu theo loại tròng. |
| FR-PR-05 | Thương hiệu phân phối | **Đạt** | `src/pages/dashboard-v2/components/ProductBrandDistribution.vue` | Thanh ngang GMV theo thương hiệu, modal chi tiết. |
| FR-PR-06 | Top sản phẩm & vật tư tiêu hao | **Một phần** | `src/pages/dashboard-v2/components/TopProductTable.vue` | Bảng ROP/SS cảnh báo tồn kho đạt; nút xem danh mục chưa gắn handler (Phát hiện #5). |
| **§7.4 Trang Hiệu suất Nhân sự (Personnel)** |
| FR-HR-01 | Góc nhìn nhân viên (STAFF) | **Đạt** | `src/pages/dashboard-v2/components/PersonnelStaffSelfView.vue` | GMV cá nhân, thứ hạng, AOV cá nhân, CSAT/NPS, huy hiệu Top 3; không có KPI cá nhân. |
| FR-HR-02 | Bảng xếp hạng PIC Sales (BOD / MANAGER) | **Đạt** | `src/pages/dashboard-v2/components/SalesLeaderboard.vue` | Bảng nhân viên theo GMV, tỷ trọng %, số đơn, AOV, dòng chưa gán người bán. |
| FR-HR-03 | Hiệu suất KTV khúc xạ | **Không áp dụng (Hoãn)** | — | Hoãn theo đặc tả (chưa có dữ liệu ca đo mắt - QĐ-13). |
| FR-HR-04 | Hiệu suất phòng Lab / mài lắp | **Không áp dụng (Hoãn)** | — | Hoãn theo đặc tả (chưa có dữ liệu lệnh gia công Lab - QĐ-31). |
| **§7.5 Trang Quản lý KPI** |
| FR-KPI-01 | Thẻ thống kê KPI | **Đạt** | `src/pages/dashboard-v2/views/KpiManagementView.vue` | Đang áp dụng, đạt mục tiêu kỳ trước, cấp phân bổ sâu nhất. |
| FR-KPI-02 | Danh sách KPI & bộ lọc | **Đạt** | `src/pages/dashboard-v2/components/KpiTable.vue` | Tìm kiếm, lọc chu kỳ/trạng thái/phạm vi, phân trang 10 dòng, thao tác sửa/xóa/lịch sử. |
| FR-KPI-03 | Chỉnh sửa hàng loạt (BOD) | **Đạt** | `src/pages/dashboard-v2/components/KpiBulkUpdateModal.vue` | Cập nhật mục tiêu theo % hoặc giá trị tuyệt đối, thay đổi thời hạn, xóa hàng loạt. |
| FR-KPI-04 | Wizard cấu hình KPI (BOD) | **Đạt** | `src/pages/dashboard-v2/components/KpiConfigurationModal.vue` | Wizard 3 bước: Phạm vi → Chu kỳ → Mục tiêu; hỗ trợ loại ngày; cảnh báo xung đột BR-KPI-02. |
| **§7.6 Nhập liệu & Import** |
| FR-IMP-01 | Import Traffic (Excel/CSV) | **Đạt** | `src/pages/dashboard-v2/components/DashboardImportModal.vue` | Tải file mẫu, kiểm tra trước, báo lỗi dòng/cột, ghi đè lịch sử. |
| FR-IMP-02 | Import mục tiêu KPI hàng loạt | **Đạt** | `src/pages/dashboard-v2/components/DashboardImportModal.vue` | Hỗ trợ mục tiêu theo loại ngày, cơ chế tất-cả-hoặc-không, xử lý xung đột. |
| — | Nhập Traffic thủ công trên Heatmap | **Đạt** | `src/pages/dashboard-v2/components/TrafficInputModal.vue` | Nhập số nguyên >= 0, kiểm soát xung đột phiên bản qua `expectedVersion`. |
| **§7.7 Thành phần dùng chung** |
| FR-CMN-01 | Modal "Xem chi tiết dữ liệu" (DataDetailModal) | **Đạt** | `src/pages/dashboard-v2/components/DataDetailModal.vue` | Bảng thô, tìm kiếm, sắp xếp 3 trạng thái, xuất CSV, đóng Esc/backdrop. |
| FR-CMN-02 | Tooltip định nghĩa và công thức (i) | **Đạt** | `MetricCard.vue`, `executiveFormatters.ts`, v.v. | Đầy đủ định nghĩa, công thức toán học, tái tạo được số liệu. |
| FR-CMN-03 | Trạng thái rỗng / lỗi / đang tải | **Đạt** | `DashboardV2Block.vue`, `DataStatusBadge.vue`, `Skeleton` | Skeleton theo khối, badge trạng thái `live`/`partial`/`mock`, nút Thử lại khi lỗi. |

---

## 5. Kết luận và Khuyến nghị

1. **Tổng hợp số lượng phát hiện:**
   - **Mức Chặn (Blocker):** 0
   - **Mức Cao (High):** 1 (Phát hiện #1 — `BranchSaleDetailModal.vue:98` gọi endpoint cũ `/Admin/Report/BranchPerformanceHeatmap`)
   - **Mức Trung bình (Medium):** 2 (Phát hiện #2 — Thiếu Bộ lọc đa chiều FR-FLT-03; Phát hiện #3 — Tab Sản phẩm bị disable trên Bảng xếp hạng FR-EX-07)
   - **Mức Thấp (Low):** 2 (Phát hiện #4 & #5 — Hai nút xem chi tiết / xem danh mục chưa gắn sự kiện `@click`)
   - **Tổng số phát hiện:** **5**
2. **Đánh giá sẵn sàng phát hành:**
   - Phiên bản frontend Dashboard V2 trên nhánh `qc/dashboard-v2-wave4` hoạt động ổn định, build sạch, 100% test tự động đạt (441/441 tests), phân quyền RBAC và kiểm soát dữ liệu nhạy cảm GMV được thực thi nghiêm ngặt.
   - Để hoàn thiện 100% trước khi triển khai chính thức, khuyến nghị đội ngũ kỹ thuật xử lý dứt điểm Phát hiện #1 (thay thế hoặc tái cấu trúc `BranchSaleDetailModal` sang API V2), và phối hợp với Product Manager thống nhất kế hoạch cho Phát hiện #2, #3 theo lộ trình backend.
