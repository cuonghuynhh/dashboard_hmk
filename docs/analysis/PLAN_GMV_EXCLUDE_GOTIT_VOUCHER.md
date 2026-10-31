# Kế hoạch rà soát và tính lại GMV khi loại GOTIT và VOUCHER

Lập 31/10/2026. Trạng thái: **kế hoạch, chưa code**. Nguồn dữ kiện: điều tra chỉ đọc B1 (worker) và đối chiếu code `report.api` nhánh `release/report-sync-g0-2026-10-31`.

## 1. Bối cảnh và quyết định đã có
- 31/10/2026 chủ sở hữu quyết định: phiếu thu có phương thức **GOTIT** và **VOUCHER** là giảm giá do brand phát hành, không phải tiền thu thật.
  - Đã loại khỏi Doanh thu thực thu (M04), ở bước truy vấn. Nhánh `feat/thuc-thu-exclude-gotit-voucher`, commit `ef9b685`.
  - Yêu cầu mới: **trừ chúng ra khỏi GMV (M01)** và mọi chỉ số suy ra từ GMV.
- Phạm vi dữ liệu 30 ngày gần đây (POS, chỉ đếm): GOTIT 77 phiếu ≈ 58,8 triệu; VOUCHER 24 phiếu ≈ 17 triệu. Chủ yếu `ObjectType` 2 (đơn bán) và 5 (cọc đơn đặt).

## 2. Hiện trạng GMV (đã xác minh)
- M01 = Σ `GrossValue` của sự kiện E1 (đơn đặt thành đơn tạm) và E2 (đơn hàng không từ đơn đặt hoàn thành) trong `ReportRevenueEvent`, theo `EventDate` (UTC+7, mốc `SubmitAt`). Truy vấn chung: `DashboardV2GmvQueries.GmvOnly`.
- Giá trị đơn là **giá sau giảm giá thương mại, đã gồm VAT** (BR-VAL-01), không có phí ship. GOTIT/VOUCHER chưa bị trừ vì chúng là **phương thức thanh toán** chứ không phải giảm giá trên đơn.
- Chỉ số phụ thuộc GMV (cùng `GmvOnly`): M02/M02g, M06 Doanh thu thuần (= M01 + M05), M08 AOV, M09 UPT, M10 nợ treo % GMV, M11–M18, KPI mục tiêu (M16), heatmap, bảng xếp hạng, xu hướng, xuất file.

## 3. Vấn đề cốt lõi
1. **Lệch mốc thời gian:** GMV tính ở ngày tạo đơn; phiếu thu tính ở ngày thu. Một phiếu VOUCHER có thể nằm ở ngày khác ngày GMV của đơn đó.
2. **Đơn đặt:** GMV ghi toàn bộ giá trị ở E1; tiền cọc là phiếu `ObjectType = 5`; đơn hàng sinh ra sau đó (`ObjectType = 2`) không cộng GMV (E3). Phiếu VOUCHER ở đơn hàng con phải quy về **ngày E1 của đơn đặt gốc** (`RootOrderId`).
3. **Phiếu đến muộn:** phiếu có thể phát sinh sau khi sự kiện GMV của đơn đã được đồng bộ; nếu chỉ sửa lúc dựng sự kiện từ đơn thì sẽ bỏ sót.
4. **Trả hàng / hủy / kết thúc:** nếu đơn dùng voucher bị trả hoặc hủy thì phần trừ GMV có được hoàn lại không (câu hỏi cho chủ sở hữu).
5. **VAT:** `GrossValue` gồm VAT; phần trừ phải tách VAT để M01a "Trước VAT" đúng.

## 4. Phương án
| | A. Điều chỉnh lúc truy vấn | B. Sự kiện điều chỉnh E7 (khuyến nghị) | C. Sửa trực tiếp `GrossValue` của E1/E2 |
|---|---|---|---|
| Cách làm | Mỗi truy vấn GMV join `ReportPaymentStatistic` theo đơn gốc và trừ | Thêm sự kiện loại mới `BrandVoucherDiscount` (giá trị âm, một sự kiện cho mỗi phiếu, `SourceId` = Id phiếu) ngày = `EventDate` của đơn gốc | Dựng lại E1/E2 đã trừ sẵn |
| Phiếu đến muộn | Tự đúng | Đúng: phiếu mới sinh sự kiện mới | Phải dựng lại sự kiện khi phiếu đổi |
| Ảnh hưởng truy vấn | Rất rộng: mọi nơi dùng `GmvOnly` phải sửa và đều chậm hơn | Một chỗ: `GmvOnly` thêm loại E7 | Không đổi truy vấn |
| Lịch sử | Tự áp dụng cho mọi kỳ | Cần dựng lại sự kiện cho kỳ muốn áp dụng | Cần dựng lại toàn bộ sự kiện |
| Rủi ro | Hiệu năng, sai chỗ quên join | Trùng/lệch nếu phiếu đổi phương thức; phải làm idempotent | Dễ sai khi đơn đổi, khó kiểm toán |

**Khuyến nghị: B.** Sự kiện E7 tách riêng, kiểm toán được, xử lý được phiếu đến muộn, và chỉ phải sửa một điểm truy vấn.

## 5. Các bước rà soát và thực hiện
**Bước 0. Chủ sở hữu quyết (chặn mọi bước sau):**
1. Phiếu GOTIT/VOUCHER trên đơn bị trả hoặc hủy: hoàn lại phần đã trừ GMV hay giữ nguyên?
2. Trừ vào **ngày GMV của đơn** (khuyến nghị) hay ngày thu?
3. Áp dụng cho lịch sử từ ngày nào (toàn bộ, hay từ 01/2026, hay chỉ từ ngày triển khai)? Các kỳ so sánh trước ngày đổi có chấp nhận lệch số không?
4. Mục tiêu KPI (M16) đang đặt theo GMV cũ: giữ nguyên hay đặt lại?
5. Giảm giá khác của brand (không qua phương thức GOTIT/VOUCHER) có cần trừ nữa không?

**Bước 1. Kiểm chứng dữ liệu (chỉ đọc, chỉ in số đếm):**
- Với phiếu GOTIT/VOUCHER ở 12 tháng gần nhất: tỷ lệ phiếu có `ObjectId` truy ra được đơn và đơn đó có sự kiện E1/E2 trong `ReportRevenueEvent`.
- Số phiếu mà tổng GOTIT/VOUCHER của một đơn vượt giá trị đơn; số đơn thanh toán toàn bộ bằng voucher.
- Số phiếu có `ObjectType` 4/6 (không gắn một đơn cụ thể): cách quy về đơn nào.
- Số phiếu nằm ở ngày khác ngày GMV của đơn (độ lệch thời gian).

**Bước 2. Thiết kế chi tiết:** loại sự kiện E7 (giá trị âm, tách VAT theo tỷ lệ VAT của đơn gốc), khóa idempotent, cách tìm `EventDate` của đơn gốc (đơn đặt: ngày E1; đơn hàng thường: ngày E2), xử lý phiếu bị hủy/đổi phương thức, cập nhật `GmvOnly`, `DashboardV2RevenueEventBuilder`, `SyncRevenueEventsWindow`.

**Bước 3. Cài đặt (report.api), mỗi việc một PR nhỏ:**
1. Hằng số loại sự kiện E7 + builder + đồng bộ từ `ReportPaymentStatistic`.
2. `GmvOnly` gồm E7; rà từng chỉ số phụ thuộc (danh sách ở mục 2) xem có truy vấn nào tự lọc loại sự kiện không qua `GmvOnly`.
3. Test: cập nhật `DashboardV2GoldenDatasetTests` (TC-01..TC-11), `DashboardV2RevenueInvariantTests`, `DashboardV2RevenueModelTests`, `DashboardV2ExecutiveTests`; thêm ca đơn đặt có voucher, đơn đặt chuyển thành đơn hàng, phiếu đến muộn, trả hàng.
4. Spec: cập nhật `PRODUCT_SPEC_DASHBOARD.md` (M01, M04, BR-VAL, bảng sự kiện, QĐ mới) lên v2.3; cập nhật QC.

**Bước 4. Tính lại lịch sử:** theo runbook backfill trên bản sao DB (`docs/ops`), không chạy trực tiếp trên production. So sánh M01 trước và sau theo tháng; kỳ vọng chênh bằng đúng tổng GOTIT+VOUCHER đã quy về ngày GMV.

**Bước 5. Triển khai:** deploy khi không có sync chạy; bấm "tính lại dữ liệu" cho các kỳ đã chọn; kiểm tra thẻ GMV, Doanh thu thuần, AOV, KPI.

**Bước 6. Giao diện pos.gui:** ghi chú "đã trừ GotIT và Voucher" ở thẻ GMV và định nghĩa; nhãn kỳ so sánh trước ngày đổi.

## 6. Rủi ro
- Số GMV và DTT lịch sử thay đổi, nên báo cáo đã gửi trước đây sẽ lệch.
- Tiến độ KPI theo GMV có thể giảm đột ngột.
- Phiếu không gắn được đơn sẽ không trừ được (cần số liệu ở bước 1).
- Việc tính lại tốn thời gian sync; làm sau khi pipeline G0 (PR #170) ổn định.
