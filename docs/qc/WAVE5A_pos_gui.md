# Nhật ký thay đổi Frontend Wave 5a (pos.gui) — QC Fixes #1, #4, #5

- **Ngày thực hiện:** 18/10/2026
- **Kho lưu trữ:** `pos.gui`
- **Nhánh thực hiện:** `qc/dashboard-v2-wave5` (tách từ `qc/dashboard-v2-wave4`)
- **Tài liệu tham chiếu:**
  - `PRODUCT_SPEC_DASHBOARD.md` (v2.2): FR-EX-08, FR-PR-02, FR-PR-06, FR-CMN-01, §10 PM-08.
  - `QC_FINAL_frontend.md`: Phát hiện #1 (Cao), Phát hiện #4 (Thấp), Phát hiện #5 (Thấp).

---

## 1. Tóm tắt kết quả kiểm thử (Before / After Test Numbers)

| Chỉ số | Baseline (Wave 4) | Wave 5a (Hoàn thành) | Chênh lệch |
|---|---|---|---|
| **Số file kiểm thử (Test files)** | 53 files | 54 files | +1 file (`tests/dashboard-v2/branchSaleDetailModalV2.spec.ts`) |
| **Số ca kiểm thử (Tests)** | 441 passed | 447 passed | +6 tests (+4 modal heatmap, +1 product dimension modal, +1 top product catalog modal) |
| **Trạng thái kiểm thử** | 53/53 passed | 54/54 passed (100%) | Đạt |
| **TypeScript check (`vue-tsc -b`)** | Sạch (Exit code 0) | Sạch (Exit code 0) | Không có lỗi kiểu |
| **ESLint (`pages/dashboard-v2`, `report-dashboard`)** | Sạch | Sạch | Không có lỗi lint |
| **Git working tree** | Clean | Clean | 3 commit độc lập theo đúng quy ước |

---

## 2. Chi tiết từng hạng mục thực hiện

### Hạng mục 1: Modal chi tiết ô Heatmap chỉ dùng endpoint V2 (QC #1, Mức Cao - High)

- **Phát hiện QC #1:** `src/components/report-dashboard/BranchSaleDetailModal.vue` (~dòng 88-103) gọi endpoint báo cáo cũ `AdminReportGetOrder` và `/Admin/Report/BranchPerformanceHeatmap`. Backend hạn chế endpoint cũ chỉ cho vai trò BOD, dẫn đến vai trò MANAGER bị lỗi 403 Forbidden và hiển thị số liệu theo công thức cũ.
- **Giải pháp triển khai:**
  - Tái cấu trúc toàn bộ việc tải dữ liệu trong `BranchSaleDetailModal.vue` chỉ sử dụng các endpoint Dashboard V2 qua `dashboardV2Api`.
  - Dữ liệu chi tiết từng ngày (GMV, Mục tiêu, Traffic, Tỷ lệ chuyển đổi) được lấy qua:
    - Endpoint V2: `dashboardV2Api.heatmap` (`/Admin/V2/Dashboard/Heatmap`) với tham số `siteIds: [this.siteId]`, `granularity: 1` và khoảng ngày từ `startAt` đến `endAt` của bucket được click.
  - Tóm tắt đơn hàng (GMV, Doanh thu thuần, Số lượng đơn, AOV) được lấy qua:
    - Endpoint V2: `dashboardV2Api.executiveKpis` (`/Admin/V2/Dashboard/Executive/Kpis`) cho `siteIds: [this.siteId]` và khoảng thời gian đó.
  - Kiểm soát quyền GMV (`gmvHidden`):
    - Khi `gmvHidden === true` (hoặc thiếu quyền xem GMV), tự động ẩn các số liệu và cột GMV, Mục tiêu, % Đạt, AOV; giữ nguyên hiển thị Số đơn, Lượt traffic và Tỷ lệ chuyển đổi.
  - Trạng thái lỗi: Xử lý trạng thái lỗi chuẩn Dashboard V2 khi API thất bại kèm nút "Thử lại", loại bỏ hoàn toàn fallback sang endpoint legacy.
  - Cập nhật `BranchPerformanceHeatmap.vue` để truyền `api: this.api` và `gmvHidden: this.gmvHidden` sang `BranchSaleDetailModal`.
- **Tập tin thay đổi:**
  - `src/components/report-dashboard/BranchPerformanceHeatmap.vue`
  - `src/components/report-dashboard/BranchSaleDetailModal.vue`
  - `tests/dashboard-v2/branchSaleDetailModalV2.spec.ts` (mới)
- **Tên endpoint chính xác trong mã nguồn:**
  - `dashboardV2Api.heatmap` (`/Admin/V2/Dashboard/Heatmap`)
  - `dashboardV2Api.executiveKpis` (`/Admin/V2/Dashboard/Executive/Kpis`)
- **Kiểm thử bổ sung:**
  - `tests/dashboard-v2/branchSaleDetailModalV2.spec.ts`: 4 test cases kiểm tra:
    1. Modal chỉ gọi endpoint V2 (`/Admin/V2/Dashboard/Heatmap`, `/Admin/V2/Dashboard/Executive/Kpis`), không gọi bất kỳ endpoint cũ nào.
    2. Người dùng MANAGER xem modal bình thường không bị 403 từ endpoint cũ.
    3. Che dấu GMV khi `gmvHidden: true` (ẩn GMV, Target, % Đạt, AOV; giữ Traffic và Conversion).
    4. Hiển thị khối lỗi V2 chuẩn kèm nút thử lại khi endpoint gặp sự cố.
- **Commit:** `9f72a902` - `fix: rebuild heatmap cell modal using dashboard v2 endpoints only`

---

### Hạng mục 2: Nút "Xem chi tiết dữ liệu" trong Phân tích đa chiều sản phẩm (QC #4, Mức Thấp)

- **Phát hiện QC #4:** `src/pages/dashboard-v2/views/ProductView.vue` ~dòng 307 có nút icon bảng tính "Xem chi tiết dữ liệu" ở tiêu đề widget Phân tích Đa chiều (Multi-dimensional Analysis) nhưng chưa được gắn sự kiện `@click`, không mở modal xem bảng dữ liệu thô.
- **Giải pháp triển khai:**
  - Gắn sự kiện `@click="showDimensionDetails = true"` cho nút `[data-test="open-dimension-details"]`.
  - Tích hợp component `DataDetailModal` (tuân thủ FR-CMN-01) để hiển thị toàn bộ danh sách các hàng dữ liệu hiện tại của biểu đồ phân tích đa chiều (`dimensionAnalysis.data`).
  - Cấu hình các cột hiển thị mang đơn vị rõ ràng ở tiêu đề (Columns carry units in header):
    - Cột phân loại: Theo chiều được chọn (ví dụ: `Ngành hàng`, `Nhóm tròng`, `Nhà cung cấp`...).
    - Doanh thu: `Doanh thu (đ)` (định dạng gọn chuẩn Việt Nam qua `formatMoney`).
    - Số lượng: `Số lượng (SP)` (định dạng số qua `formatCount(quantity) SP`).
  - Thừa hưởng toàn bộ tính năng chuẩn của `DataDetailModal`: tìm kiếm tiếng Việt không dấu (diacritic-insensitive), sắp xếp 3 trạng thái (none -> asc -> desc -> none), hiển thị trạng thái rỗng và đóng bằng phím Escape / click backdrop / nút Đóng.
- **Tập tin thay đổi:**
  - `src/pages/dashboard-v2/views/ProductView.vue`
  - `tests/dashboard-v2/productView.spec.ts`
- **Tên endpoint chính xác trong mã nguồn:**
  - `dashboardV2Api.product` (`/Admin/V2/Dashboard/Product`)
  - `dashboardV2Api.productDimensionAnalysis` (`/Admin/V2/Dashboard/Product/DimensionAnalysis`)
- **Kiểm thử bổ sung:**
  - `tests/dashboard-v2/productView.spec.ts`: Bổ sung test kiểm tra click nút mở `DataDetailModal`, hiển thị đúng các tiêu đề cột có đơn vị (`Ngành hàng`, `Doanh thu (đ)`, `Số lượng (SP)`), hiển thị 2 dòng dữ liệu với số liệu chính xác và đóng modal.
- **Commit:** `987f3c0c` - `feat: wire data detail modal for product dimension analysis`

---

### Hạng mục 3: Nút "Xem toàn bộ danh mục" trong Top sản phẩm (QC #5, PM-08, Mức Thấp)

- **Phát hiện QC #5 & §10 PM-08:** `src/pages/dashboard-v2/components/TopProductTable.vue` ~dòng 28 có nút "Xem toàn bộ danh mục" ở tiêu đề bảng Top Sản phẩm & Vật tư tiêu hao nhưng chưa được gắn sự kiện `@click`.
- **Giải pháp triển khai:**
  - Đối chiếu hợp đồng backend C# DTO (`report.api`, branch `qc/dashboard-v2`):
    - Đã kiểm tra `DashboardV2InputAdminDto` và controller `ProductTopProducts`: DTO hiện tại không có tham số `Limit` riêng cho endpoint TopProducts (khác với `ProductGrowth` hay `ProductTreemap`). Vì vậy, theo đúng yêu cầu đặc tả và hướng dẫn task, modal hiển thị toàn bộ các dòng sản phẩm hiện có trong response (`block.data`).
  - Gắn sự kiện `@click="showFullCatalog = true"` cho nút `[data-test="open-full-catalog"]`.
  - Mở `DataDetailModal` (FR-CMN-01) với tiêu đề `Danh mục Sản phẩm & Vật tư tiêu hao`.
  - Cấu hình các cột hiển thị chi tiết:
    - `#`: Thứ hạng sản phẩm (`rank`).
    - `Sản phẩm`: Tên sản phẩm kèm mã SKU (`name (code)`).
    - `Nhà cung cấp`: Tên nhà cung cấp (`supplier`).
    - `Thuộc tính (Suất / Màu)`: Ghép thông số độ chiết suất và màu sắc (`power`, `color`).
    - `Số lượng bán (SP)`: Số lượng bán ra trong kỳ (`saleQuantity`).
    - `Tồn hiện tại (SP)`: Tồn kho thực tế (`stockQuantity`).
    - `Tồn an toàn (SS)`: Ngưỡng tồn kho an toàn (`safetyStock`).
    - `Điểm đặt hàng lại (ROP)`: Ngưỡng đặt hàng lại (`reorderPoint`).
    - `Cảnh báo`: Trạng thái cảnh báo tồn kho (`Tồn ≤ ROP` khi stock <= ROP hoặc cờ `belowReorderPoint: true`, ngược lại `Bình thường`).
- **Tập tin thay đổi:**
  - `src/pages/dashboard-v2/components/TopProductTable.vue`
  - `tests/dashboard-v2/topProductTable.spec.ts`
- **Tên endpoint chính xác trong mã nguồn:**
  - `dashboardV2Api.productTopProducts` (`/Admin/V2/Dashboard/Product/TopProducts`)
  - `dashboardV2Api.product` (`/Admin/V2/Dashboard/Product`)
- **Kiểm thử bổ sung:**
  - `tests/dashboard-v2/topProductTable.spec.ts`: Bổ sung test kiểm tra click nút mở `DataDetailModal`, hiển thị tiêu đề và đầy đủ các cột thông tin có đơn vị, kiểm tra hiển thị dòng sản phẩm, cảnh báo `Tồn ≤ ROP`, và đóng modal.
- **Commit:** `8f77e8ea` - `feat: wire full catalog detail modal in top products table`

---

## 3. Thay đổi hợp đồng API (API Contract Changes)

- Không có endpoint mới nào được yêu cầu tạo từ backend.
- Đã loại bỏ hoàn toàn việc gọi các endpoint legacy khỏi frontend:
  - Loại bỏ lệnh gọi POST tới `/Admin/Report/BranchPerformanceHeatmap`
  - Loại bỏ lệnh gọi `AdminReportGetOrder`
- Sử dụng hoàn toàn các endpoint Dashboard V2 chính thức:
  - `GET /Admin/V2/Dashboard/Heatmap`
  - `GET /Admin/V2/Dashboard/Executive/Kpis`
  - `GET /Admin/V2/Dashboard/Product`
  - `GET /Admin/V2/Dashboard/Product/DimensionAnalysis`
  - `GET /Admin/V2/Dashboard/Product/TopProducts`
