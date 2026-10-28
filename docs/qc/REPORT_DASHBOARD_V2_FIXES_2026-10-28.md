# Báo cáo cải thiện Dashboard V2 — 28/10/2026

Nguồn lỗi: QC trên production (chỉ xem) — chi tiết ở [`PROD_UI_QC_2026-10-28.md`](PROD_UI_QC_2026-10-28.md) — cùng các lỗi anh/chị báo thêm trong ngày.
Kiểm chứng trên local stack (`hmkls`, dữ liệu dump production). Tài liệu không chứa tên khách/nhân viên; số liệu dữ liệu chỉ ở dạng số đếm/tổng.

## 1. Nhánh và PR

| Repo | Nhánh gộp | Gồm các nhánh |
|---|---|---|
| report.api | `fix/dashboard-v2-prod-qc-2026-10-28` | `fix/dashboard-v2-prod-qc-be1`, `perf/dashboard-v2-product`, `fix/dashboard-v2-vat-split` |
| pos.gui | `fix/dashboard-v2-prod-qc-2026-10-28` | `fix/dashboard-v2-unix-ts-typecheck` → `fix/dashboard-v2-total-row-label` → `fix/dashboard-v2-prod-qc-fe1`, `…-fe2a`, `…-fe2b` |

Hai PR phải deploy cùng nhau (FE CustomerGrowth đọc khóa `walk_in` và `netRevenueShare` của BE mới).

## 2. Backend — report.api

| ID | Vấn đề | Đã sửa | Kiểm chứng |
|---|---|---|---|
| **VAT** | Thẻ GMV / DTT / AOV: "Trước VAT" = giá trị gồm VAT, "VAT" = 0 ₫ ở mọi kỳ. Nguyên nhân: chỉ lấy VAT ở dòng hàng khi `NeedVat = true`, nhưng dữ liệu POS có `NeedVat = false` ở 100% đơn và VAT dòng = 0; VAT nằm ở cấp đơn và **đã nằm trong giá** | Dùng VAT dòng nếu POS có ghi; nếu không, phân bổ `VatAmount` cấp đơn theo giá trị dòng (không cộng thêm vào giá trị). `MissingVat` chỉ gắn khi đơn không có VAT ở cả hai mức | 01–07/10 sau recompute: VAT sự kiện khớp POS tuyệt đối (đơn đặt 471.408.189 ₫, bán trực tiếp 264.536.557 ₫); GMV − Trước VAT = VAT; VAT ≈ 7,3% GMV |
| BE-01 | Tăng trưởng theo tệp khách hàng trả 4 nhóm rỗng | Tính thật nhóm Khách mới / Quay lại / Khách lẻ / Tổng qua bộ tính doanh thu chuẩn; kỳ trước [S−n, S−1]; truy vấn tuần tự (DbContext không thread-safe) | Tổng = thẻ KPI (47.431 đơn), ~1,1 s; test service |
| BE-02 | Order Aging timeout trên production | Gom nhóm trong SQL (trước tải ~170k đơn đặt về bộ nhớ); giữ đủ 4 nhóm tuổi | 8/8 dòng khớp bản cũ; 4,9 s → 0,8–1,1 s |
| BE-03 | Tab Sản phẩm 22,7 s (TopProducts 15 s) | 2 index mới (`ReportProduct`, covering index `ReportRevenueEventLine`), bỏ 1 index hẹp thừa | TopProducts 15,2 s → 0,7–1,5 s |
| BE-04 | Xếp hạng Khu vực/Cụm: AOV, UPT từng dòng = "—" | Điền AOV/UPT theo từng dòng, cùng công thức dòng tổng | test service |
| BE-05 | Số đơn lệch giữa các widget | Bảng chiến dịch dùng Số đơn thuần (cùng định nghĩa thẻ KPI) | test |
| BE-06 | Biên dưới Anomaly âm | Kẹp ≥ 0 | test |

Test `DashboardV2|KpiV2`: 12 lỗi / 572 đạt — **đúng 12 lỗi đang có sẵn trên main**, không phát sinh lỗi mới. Smoke 29/29 endpoint Dashboard V2 trả 200.

## 3. Frontend — pos.gui

**Lỗi sau PR #2918 (Unix timestamp)**
- Type-check: phần `dashboard-v2` và `report-dashboard` từ ~25 lỗi → **0** (CustomerGrowth thiếu khai báo, sai tên kiểu, `regions` của tỷ lệ chuyển đổi, cancel-recompute, `WIRE_FORMAT` thừa, schema SaleTarget/Resync).
- **Lỗi chạy thật**: ngày lọc (ms) bị đọc theo UTC → ô ngày hiện 30/09 thay vì 01/10, đếm 28 ngày thay vì 27, **kỳ so sánh gửi lên API lệch** (02/09 07:00 → 30/09 06:59 thay vì 04/09 → 30/09). Đã đọc theo giờ Việt Nam; heatmap cũ và modal chi nhánh gửi ms trọn ngày VN.
- Bảng Tăng trưởng tệp khách: cột tỷ trọng đơn / DTT trước đây luôn "—" (sai tên trường) — đã sửa.

**Lỗi QC production và yêu cầu bổ sung**

| ID | Đã sửa |
|---|---|
| Dòng tổng | Lọc nhiều khu vực/cụm/chi nhánh làm dòng tổng ghép hết tên, kéo giãn cột. Nay: 1 mục → tên; nhiều mục → "Tổng 9 khu vực đã chọn", danh sách đầy đủ ở tooltip, nhãn cắt tối đa 240px. Áp dụng: Bảng xếp hạng, Bản đồ hiệu suất, legend biểu đồ Tăng trưởng |
| FE-01/02 | Tab KPI: "Cập nhật lần cuối" hiện epoch → `DD/MM/YYYY HH:mm`; ngày `DD/MM/YYYY`; ô GMV có phân cách nghìn; tên tháng tiếng Việt |
| FE-03/04 | Trục số biểu đồ theo vi-VN (Tỷ/Tr, `14.000`, `%`), trục tự đổi theo chỉ số (Anomaly: tiền/số đơn/%; Thương hiệu: số lượng khi ẩn GMV); trục AOV không còn nhãn trùng |
| FE-05 | UPT 2 số lẻ thống nhất; so sánh UPT là % thay đổi, không dùng "điểm %" |
| FE-06 | Tăng trưởng tệp khách: nhãn nhóm luôn có, trạng thái "Chưa có dữ liệu" thay cho 4 dòng trắng |
| FE-07 | Khi dữ liệu đang backfill/kỳ trước thiếu: ẩn % so sánh gây hiểu nhầm, hiện "—" |
| FE-11 | Bản đồ hiệu suất: ô tìm chi nhánh (không dấu); chi nhánh không có mục tiêu (TikTok, Shopee…) xuống cuối ở thứ tự mặc định |
| FE-12 | Tỷ lệ chuyển đổi: chỉ liệt kê cửa hàng có Traffic; "N cửa hàng chưa có Traffic · Xem danh sách" |
| FE-22 | Ẩn thanh lọc toàn cục ở tab Quản lý KPI |

Vitest `tests/dashboard-v2`: lỗi giảm so với main (47 → 38), **không có lỗi mới**; 38 lỗi còn lại đều có sẵn trên main.

## 4. Cần lưu ý khi deploy

1. **Chạy recompute "Sự kiện doanh thu"** cho các kỳ cần xem để sửa VAT dữ liệu cũ (kỳ chưa tính lại vẫn hiện VAT = 0).
2. Migration index mới (report DB) nằm ở `Src/Infrastructure/Migrations/Pending/` — 2 index tạo mới (covering index ~196 MB) + 1 index bỏ.
3. Deploy report.api và pos.gui cùng đợt.

## 5. Cần nghiệp vụ xác nhận

1. **VAT**: ~48% đơn có VAT = 0, khác giả định QĐ-16 "100% đơn xuất VAT". Đề nghị cập nhật QĐ-16 / BR-VAL-05 trong spec theo thực tế: giá đã gồm VAT, VAT lấy từ cấp đơn.
2. Các câu hỏi dữ liệu ở mục C của báo cáo QC (UPT 27,96; "Chưa phân khu vực" 16.455 đơn; tỷ lệ khách mới cao; Nợ treo chưa đồng bộ).
3. Order Aging: 78.993 đơn đặt còn mở quá 180 ngày (3.484 quá 365 ngày) — cần dọn dữ liệu hay đúng thực tế?

## 6. Chưa làm (đề xuất đợt sau)

- P2 còn lại: FE-08 (kỳ tuần chưa trọn), FE-09 (waterfall), FE-10 (nhận xét thuật ngữ), FE-13 (nhãn M12/M13), FE-14 (nhãn basket), FE-15 (dòng "Không có chiến dịch"), FE-16 (ghi chú "Không xác định"), FE-17 (tăng trưởng SP theo chu kỳ), FE-18 (bố cục thương hiệu), FE-19 (treemap), FE-20 (top SP), FE-21 (bảng nhân sự), FE-23 (chip tính lại + giãn poll).
- Main của cả hai repo đang đỏ sẵn (report.api 12 test, pos.gui 38 test sau đợt này) — đề nghị một task riêng.
- `vue-tsc` toàn repo pos.gui còn 16 lỗi ở `components/setting/*` và `attendance-setting` (client pos.api chưa sinh lại) — ngoài phạm vi dashboard.
- Local stack: recompute dừng lâu ở bước "Cập nhật trạng thái" (không ảnh hưởng dữ liệu đã kiểm); dump pos local thiếu 4 cột `MeasurementTicket` (đã thêm tạm ở local).
