# Giải pháp Quản trị & Theo dõi Chỉ số Công nợ cho Mô hình Bán lẻ (Retail Store Debt Solution)

## 1. Bản chất Công nợ trong Mô hình Bán lẻ (Retail Reality)

Trong chuỗi bán lẻ mắt kính:
* **Khách hàng cá nhân trả tiền ngay:** Đại đa số giao dịch thanh toán dứt điểm tại quầy bằng tiền mặt, thẻ, chuyển khoản hoặc ví điện tử.
* **Không có nợ dài hạn hay cấp hạn mức tín dụng:** Khác biệt với B2B (30–90 ngày), bán lẻ không có hợp đồng công nợ hay phân tầng tuổi nợ phức tạp.
* **Bản chất các khoản nợ trên sổ cái bán lẻ:**
  1. **Nợ đơn đặt cọc cắt kính (Pre-order):** Khách cọc 30–50% để gia công tròng mắt, phần còn lại tạm ghi nhận là nợ và sẽ tất toán khi khách quay lại nhận kính tại quầy (hoặc giao qua shipper).
  2. **Nợ kỹ thuật / Chờ chuyển khoản:** Mạng lỗi, hẹn chuyển khoản sau trong ngày, hoặc khách thiếu một khoản tiền lẻ.
  3. **Dư nợ âm:** Tiền khách đặt cọc trước (doanh nghiệp đang giữ tiền trước của khách).

---

## 2. Kết luận Rà soát & Thống nhất Phạm vi Triển khai (Final Scope Decision)

Dựa trên phản hồi và thẩm định thực tế của Ban Quản lý & Data Analyst:

| Hạng mục xem xét | Đánh giá & Quyết định | Trạng thái |
| :--- | :--- | :---: |
| **Mục 1: Revenue Waterfall Chart** | Phân tích giảm trừ từ GMV xuống Thực thu. | Giữ nguyên hiện trạng (GMV $\rightarrow$ Hoàn/Hủy $\rightarrow$ Thực thu) |
| **Mục 2: GMV Breakdown Chart** | Biểu đồ thể hiện cơ cấu Sức bán (Đơn đặt vs Đơn mua thẳng), không phải chart phản ánh dòng tiền thực thu $\rightarrow$ Không cần tách cọc/nợ. | **Loại bỏ / Không cập nhật** |
| **Mục 3: Thẻ Tài chính (Financial Overview Cards)** | Bổ sung **1 thẻ chỉ số độc lập: "NỢ TREO"** (bỏ chữ "bán lẻ") vào khối Scorecard điều hành trung tâm. | **PHÊ DUYỆT & ĐÃ TRIỂN KHAI** |
| **Mục 4: GMV & Net Revenue Trend** | Giữ đồ thị xu hướng thanh thoát, không vẽ thêm đường nợ gây rối mắt. | **Loại bỏ / Không thực hiện** |
| **Mục 5: Bản đồ Chi nhánh & Bảng Top** | Không gắn thêm tag nợ lên thanh doanh thu để tránh nhiễu thông tin. | **Loại bỏ / Không thực hiện** |
| **Nhóm B: Phân hệ Vận hành** | Không bổ sung nợ vào Phương thức thanh toán, Order Aging, Anomaly. | **Loại bỏ / Không thực hiện** |
| **Nhóm C: Phân hệ Nhân sự** | Không can thiệp vào Sales Leaderboard. | **Loại bỏ / Không thực hiện** |
| **Đề xuất Chart / Widget mới** | Không bổ sung biểu đồ nợ mới; giữ dashboard tập trung tối đa vào hiệu suất kinh doanh cốt lõi. | **Loại bỏ / Không thực hiện** |

---

## 3. Đặc tả Chi tiết Thẻ Chỉ số "NỢ TREO" (Financial Scorecard Specification)

### 3.1. Vị trí & Bố cục Giao diện
* **Vị trí:** Đặt tại Khối thẻ chỉ số tài chính (Financial Overview Cards) thuộc trang **Tổng quan (Executive View)**.
* **Cấu trúc lưới:**
  * **Hàng trên (5 thẻ):** `GMV (SỨC BÁN)` | `KHÁCH HÀNG MỚI` | `DOANH THU` | `GIÁ TRỊ ĐIỀU CHỈNH` | `DOANH THU THUẦN`
  * **Hàng dưới (4 thẻ):** `NỢ TREO` | `BIÊN LỢI NHUẬN GỘP` | `ĐƠN HÀNG (VOLUME)` | `GIÁ TRỊ ĐƠN TB (AOV)`

### 3.2. Nội dung Thẻ "NỢ TREO"
* **Tiêu đề:** `NỢ TREO`
* **Giá trị hiển thị:** Làm tròn theo đơn vị `Tr VNĐ` (Ví dụ: `28 Tr VNĐ` hoặc `149.000 VNĐ` đối với từng khách).
* **Đơn vị (Unit):** `Tr VNĐ`
* **Dòng thông tin phụ (Sub-info):** `Chiếm X,X% GMV` (Đo lường tỷ lệ nợ treo trên tổng sức bán trong kỳ, chuẩn bán lẻ thường an toàn khi $< 1.5\%$).
* **So sánh kỳ trước (Trend):** 
  * Tỷ lệ % tăng/giảm so với kỳ liền trước.
  * **Logic màu sắc thông minh:** Khi Nợ treo **giảm** $\rightarrow$ Hiển thị **Xanh lá** (tích cực); khi Nợ treo **tăng** $\rightarrow$ Hiển thị **Đỏ** (cảnh báo).
* **Biểu đồ tia mini (Sparkline):** Biểu đồ bước (step line) màu hổ phách/amber (`#d97706`), phản ánh xu hướng biến động nợ treo từng ngày theo bộ lọc thời gian.
* **Tooltip giải nghĩa:**
  * *Mô tả:* "Tổng công nợ tạm thời chưa thu về két (chủ yếu từ đơn đặt cọc cắt kính chờ lấy hoặc khách hẹn chuyển khoản sau)."
  * *Công thức:* "Tổng dư nợ dương trên sổ cái khách hàng"
* **Icon & Nhận diện thị giác:**
  * Icon: Đồng hồ thời gian (`Clock` - phản ánh nợ chờ xử lý).
  * Background icon: `bg-amber-50`, Icon color: `text-amber-600`.
