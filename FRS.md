# Tài liệu Đặc tả Yêu cầu Chức năng (Functional Requirement Specification - FRS)

## 1. Giới thiệu
Tài liệu này mô tả chi tiết các chức năng, biểu đồ, và logic tính toán của hệ thống Dashboard quản lý. Hệ thống được thiết kế với giao diện hiện đại và chia thành nhiều chế độ xem (views) dựa trên vai trò của người dùng (BOD, MANAGER, STAFF).

## 2. Phân quyền Người dùng (Roles & Access)
Hệ thống hiển thị các menu và trang dựa trên quyền hạn của người dùng:
- **BOD (Ban Giám đốc):** Truy cập tất cả các trang (Tổng quan, Vận hành, Sản phẩm, Nhân sự, Quản lý KPI).
- **MANAGER (Quản lý):** Truy cập Vận hành, Sản phẩm, Nhân sự, Quản lý KPI.
- **STAFF (Nhân viên):** Truy cập giới hạn trong trang Hiệu suất Nhân sự.

## 3. Các Trang Dashboard

### 3.1. Tổng quan (Executive View)
**Mục đích:** Cung cấp cái nhìn toàn cảnh về tình hình tài chính, dòng tiền và sự tăng trưởng của doanh nghiệp dành cho cấp lãnh đạo.

**Các tính năng & Biểu đồ:**
- **Tính năng chuyển đổi VAT:** 
  - Cho phép người dùng bật/tắt (toggle) tùy chọn "Bao gồm VAT" và "Không VAT". 
  - Khi chọn "Không VAT", các chỉ số doanh thu trên các thẻ chỉ số chính sẽ được giảm trừ theo mức thuế suất quy định (mặc định giả định 10%).

- **Thẻ Chỉ số Chính (Key Metrics Cards):**
  - Các thẻ chỉ số hiển thị những con số quan trọng nhất (như Tổng Doanh thu, Tỷ suất Lợi nhuận, Số đơn hàng, Giá trị đơn trung bình, v.v.), có thể thay đổi linh hoạt theo tính năng chuyển đổi VAT.

- **Biểu đồ Xu hướng Tăng trưởng (YTD) (Growth Trend Chart):**
  - *Mô tả:* Phân tích doanh thu phát sinh và lũy kế dòng tiền từ đầu năm đến nay (YTD).
  - *Loại biểu đồ:* Biểu đồ kết hợp (Composed Chart - Cột và Đường).
  - *Dữ liệu & Logic tính toán:*
    - **Cột (Bar):** Đại diện cho Doanh thu phát sinh trong từng kỳ (Ngày/Tuần/Tháng).
    - **Đường (Line):** Biểu diễn Lũy kế Doanh thu YTD (tổng cộng dồn các kỳ trước đó).
    - **Đường tham chiếu (Reference Line):** Thể hiện Mục tiêu YTD (Target).
  - *Tính năng đi kèm:* 
    - Lọc dữ liệu theo từng chi nhánh cụ thể (Dropdown chọn đa chi nhánh).
    - Phân tích theo khung thời gian: Theo Ngày, Theo Tuần, Theo Tháng.
    - Cửa sổ xem chi tiết dữ liệu (Data detail modal) với công thức tính Tiến độ (%) = (Lũy kế YTD / Mục tiêu) * 100.

- **Biểu đồ Dòng tiền thu được - Thực thu (Actual Cash Flow Chart):**
  - *Mô tả:* Phân tích dòng tiền thực tế thu về sau khi đã trừ đi các khoản hoàn trả/hủy đơn.
  - *Loại biểu đồ:* Biểu đồ kết hợp (Composed Chart - Cột và Đường).
  - *Dữ liệu & Logic tính toán:*
    - **Cột (Bar):** Dòng tiền Thực thu phát sinh từng kỳ.
    - **Đường (Line):** Lũy kế Thực thu YTD.
    - **Đường tham chiếu (Reference Line):** Mục tiêu Thực thu.
  - *Tính năng đi kèm:* Tương tự như Biểu đồ Xu hướng Tăng trưởng (YTD) bao gồm lọc chi nhánh, khung thời gian, và bảng chi tiết dữ liệu tiến độ.

- **So sánh Doanh thu Chi nhánh (Branch Revenue Comparison):**
  - *Loại biểu đồ:* Biểu đồ cột ngang (Horizontal Bar Chart).
  - *Mục đích:* Hiển thị trực quan doanh thu đóng góp của từng chi nhánh/khu vực. Giúp nhận diện nhanh chi nhánh có hiệu suất cao nhất và thấp nhất.

- **Biểu đồ Phân tích Tăng trưởng (Growth Analysis Chart):**
  - *Loại biểu đồ:* Biểu đồ đường (Line Chart) đa tuyến.
  - *Mục đích:* Phân tích tỷ lệ tăng trưởng doanh thu so với mục tiêu đặt ra qua các khoảng thời gian (Tháng/Quý).
  - *Dữ liệu:* Thường hiển thị đường Tăng trưởng thực tế và đường Mục tiêu tăng trưởng để đánh giá khoảng cách hoàn thành (gap).

### 3.2. Vận hành & Khách hàng (Operational View)
**Mục đích:** Đánh giá chi tiết hiệu quả vận hành, phân tích hành vi tệp khách hàng, tình trạng chuyển đổi và các biến động bất thường để tối ưu hóa nguồn lực.

**Các tính năng & Biểu đồ chi tiết:**

- **Cảnh báo Tồn đọng (Order Aging):**
  - *Loại biểu đồ:* Biểu đồ cột chồng (Stacked Bar Chart).
  - *Dữ liệu:* Thể hiện số lượng hoặc giá trị đơn hàng chưa hoàn thành, được nhóm theo từng khoảng thời gian lưu đọng (1-5 ngày, 5-10 ngày, 10-20 ngày, > 20 ngày) cho từng trạng thái đơn (Ví dụ: Đóng gói, Vận chuyển).
  - *Mục đích:* Phát hiện các nút thắt cổ chai trong quy trình vận hành để xử lý kịp thời.
  - *Tính năng đi kèm:* Chuyển đổi hiển thị theo "Số lượng đơn" hoặc "Giá trị (VNĐ)".

- **Thời gian Bán hàng Tối ưu (Time Peak):**
  - *Loại biểu đồ:* Biểu đồ nhiệt (Heatmap) thiết kế dưới dạng ma trận bảng lưới.
  - *Dữ liệu:* Phân bổ cường độ, số lượng đơn hàng hoặc doanh thu theo các ngày trong tuần (Thứ 2 - Chủ Nhật) và các khung giờ trong ngày (0h - 24h). Màu sắc càng đậm thể hiện giá trị càng cao.
  - *Mục đích:* Giúp ban quản lý phân bổ nhân sự ca trực hợp lý và lên lịch các chiến dịch Flash Sale vào các khung giờ vàng.
  - *Tính năng đi kèm:* Cho phép xem heatmap theo "Lượt Đơn hàng" hoặc "Doanh thu".

- **Phân tích Nhân khẩu học Khách hàng (Customer Demographics):**
  - *Bao gồm 3 thành phần biểu đồ trực quan:*
    1. **Biểu đồ Tròn (Pie Chart):** Cơ cấu theo Giới tính (Nam, Nữ, Khác).
    2. **Biểu đồ Cột ngang (Horizontal Bar Chart):** Tỷ trọng theo từng phân khúc độ tuổi.
    3. **Biểu đồ Tháp Dân số (Population Pyramid):** Biểu đồ cột chồng nằm ngang ngược chiều, kết hợp dữ liệu giữa các nhóm tuổi (trục Y) và tách hai phía theo giới tính (Nam/Nữ trên trục X).
  - *Mục đích:* Nhận diện rõ chân dung nhóm khách hàng cốt lõi.
  - *Tính năng đi kèm:* Cửa sổ hiển thị dữ liệu chi tiết, tính năng chuyển đổi xem theo "Lượt mua" (Số lượng) hoặc "Chi tiêu" (Giá trị).

- **Phân khúc Hóa đơn (Basket Size):**
  - *Loại biểu đồ:* Biểu đồ tròn/Donut (Pie Chart).
  - *Dữ liệu:* Tỷ trọng các nhóm đơn hàng được phân loại theo từng phân khúc giá trị rổ hàng (Ví dụ: Dưới 1 Triệu, 1-3 Triệu, Trên 3 Triệu).
  - *Mục đích:* Xác định mức chi tiêu trung bình để có các chiến lược gia tăng AOV (Average Order Value).

- **Hình thức Thanh toán (Payment Methods):**
  - *Loại biểu đồ:* Biểu đồ thanh ngang tỷ trọng thành phần (Custom Stacked Horizontal Bar).
  - *Dữ liệu:* Tỷ lệ % giao dịch của các hình thức thanh toán (COD, Chuyển khoản, Thẻ, Ví điện tử).
  - *Mục đích:* Theo dõi xu hướng lựa chọn phương thức thanh toán của người dùng, làm cơ sở đàm phán phí với các đối tác thanh toán.

- **Hiệu quả Chiến dịch (Marketing & Promotions):**
  - *Loại hiển thị:* Bảng dữ liệu danh sách (Data Table).
  - *Dữ liệu:* Thống kê Doanh thu mang lại và Số lượng đơn hàng tương ứng với từng chương trình Marketing/Khuyến mãi cụ thể.

- **Tỷ lệ Chuyển đổi (Conversion Rate):**
  - *Loại biểu đồ:* Biểu đồ kết hợp (Composed Chart - Cột và Đường).
  - *Dữ liệu:* Trực quan hóa phễu bán hàng theo thời gian thực (Lượt truy cập/Khách vào cửa hàng, Lượt tư vấn/Thêm vào giỏ, và Khách mua hàng thực tế). Đường Tỷ lệ chuyển đổi (%) hiển thị sự biến động của hiệu suất chốt sale.
  - *Logic tính toán:* `Tỷ lệ chuyển đổi (%) = (Số khách mua hàng / Tổng số lượt truy cập) * 100`.

- **Tỷ lệ Hoàn tiền/Hủy đơn (Refund Rate):**
  - *Loại biểu đồ:* Biểu đồ Cột (Bar Chart).
  - *Dữ liệu:* Theo dõi lượng đơn hoặc giá trị tiền bị hoàn trả qua các kỳ.
  - *Mục đích:* Đánh giá rủi ro, chất lượng sản phẩm và dịch vụ sau bán.
  - *Logic tính toán:* `Tỷ lệ hoàn tiền (%) = (Số đơn hoàn trả / Tổng số đơn hàng) * 100`.

- **Benchmarking Hiệu suất Vùng/Khu vực (Regional Comparison):**
  - *Loại biểu đồ:* Biểu đồ Radar (Radar Chart) hoặc Biểu đồ Cột so sánh đa biến. *(Lưu ý: Thiết kế hiện tại thường dùng Radar hoặc Bar tùy dữ liệu)*
  - *Dữ liệu:* So sánh chéo các chỉ số hiệu suất (Doanh thu, Tỷ lệ chốt sale, Tăng trưởng) của các chi nhánh so với mức Trung bình hệ thống (Điểm chuẩn Index 100).

- **Phát hiện Bất thường (Anomaly Detection):**
  - *Loại biểu đồ:* Biểu đồ Đường (Line chart) kết hợp điểm phân tán (Scatter marks) cho các giá trị ngoại lai (outliers).
  - *Dữ liệu:* Theo dõi chuỗi thời gian của doanh thu/đơn hàng, tự động vẽ đường trung bình biến đổi (Moving Average) làm đường giới hạn.
  - *Mục đích:* Sử dụng hệ thống cảnh báo đánh dấu (điểm tròn đỏ/vàng) những ngày/khung giờ có lượng đơn sụt giảm hoặc tăng vọt bất thường vượt ngưỡng cho phép.

### 3.3. Sản phẩm & Tồn kho (Product View)
**Mục đích:** Quản lý vòng đời sản phẩm, đánh giá chi tiết sức khỏe của từng ngành hàng/thương hiệu và tối ưu hóa quản trị hàng tồn kho dựa trên dữ liệu tiêu thụ.

**Các tính năng & Biểu đồ chi tiết:**

- **Phân tích Tăng trưởng Sản phẩm (Product Growth Analysis):**
  - *Loại biểu đồ:* Biểu đồ Đường (Line Chart) đa tuyến kết hợp đường tham chiếu (Reference Line) tại mốc 0%.
  - *Dữ liệu:* Mức độ tăng trưởng (%) doanh thu qua các chu kỳ.
  - *Mục đích:* So sánh tốc độ tăng trưởng của các sản phẩm để đánh giá vòng đời sản phẩm (Mới ra mắt, Tăng trưởng, Bão hòa, Suy thoái).
  - *Tính năng đi kèm:* 
    - Lọc khung thời gian so sánh (Chuỗi thời gian WoW, MoM, YoY).
    - Bộ lọc đa chiều: Phân tích theo Ngành hàng (Category), Nhóm sản phẩm (Product Group), hoặc Thương hiệu (Brand).

- **Phân tích Đa chiều (Multi-dimensional Analysis):**
  - *Loại biểu đồ:* Biểu đồ Cột dọc (Vertical Bar Chart).
  - *Dữ liệu:* Phân tích chuyên sâu về tổng hiệu suất kinh doanh qua nhiều lát cắt.
  - *Mục đích:* So sánh nhanh giá trị tuyệt đối giữa các tiêu chí phân loại.
  - *Tính năng đi kèm:*
    - Chuyển đổi chỉ số (Metric): Xem theo Doanh thu (Giá trị) hoặc Số lượng bán ra (Quantity).
    - Chuyển đổi chiều dữ liệu (Dimension): Lọc theo Loại sản phẩm, Mức giá (Phân khúc giá), hoặc Đối tượng khách hàng.

- **Cấu trúc Danh mục (Product Matrix):**
  - *Loại biểu đồ:* Biểu đồ Treemap (Biểu đồ bản đồ cây phân cấp).
  - *Dữ liệu:* Thể hiện diện tích các khối hộp tương ứng với tỷ trọng đóng góp doanh thu của từng ngành hàng/danh mục con.
  - *Mục đích:* Nhận diện trực quan mức độ tập trung của danh mục sản phẩm, xem danh mục nào chiếm tỷ trọng "Cash Cow" (bò sữa sinh lời).
  - *Tính năng đi kèm:* Cho phép chuyển đổi xem theo Cấu trúc phân cấp (Mặc định) hoặc theo các lát cắt khác như Loại sản phẩm, Mức giá, Đối tượng.

- **Ma trận Phôi Tròng (Sphere vs Cylinder):**
  - *Loại biểu đồ:* Biểu đồ Phân tán (Scatter Chart).
  - *Dữ liệu:* 
    - Trục X: Độ Cận/Viễn (Sphere - SPH).
    - Trục Y: Độ Loạn (Cylinder - CYL).
    - Kích thước điểm (Z-Axis): Khối lượng/Số lượng bán ra.
    - Màu sắc: Thể hiện tính chất đặc thù của tròng (Trong suốt, Đổi màu, Đa tròng).
  - *Mục đích:* Hỗ trợ cực kỳ đắc lực trong ngành kính mắt để phòng thu mua biết chính xác các dải độ (diopters) nào tiêu thụ mạnh nhất nhằm dự báo tồn kho phôi tròng hiệu quả.

- **Thương hiệu Phân phối (Brand Distribution):**
  - *Loại biểu đồ:* Biểu đồ Cột ngang (Horizontal Bar Chart).
  - *Dữ liệu:* Bảng xếp hạng doanh thu đóng góp của các thương hiệu đối tác (Gọng kính, Tròng kính, Contact lens, v.v.).
  - *Mục đích:* Đánh giá hiệu suất đối tác, làm cơ sở đàm phán chính sách chiết khấu thương mại.

- **Top Sản phẩm & Vật tư tiêu hao (Top Products & Consumables):**
  - *Loại hiển thị:* Bảng dữ liệu (Data Table).
  - *Dữ liệu:* Thống kê chi tiết các Hero SKUs (sản phẩm bán chạy nhất) bao gồm thông tin: Tên sản phẩm, Nhà cung cấp, Thuộc tính chi tiết (Suất chiết quang/Màu sắc), và Số lượng bán ra.
  - *Mục đích:* Theo dõi sát sao lượng tiêu thụ của top sản phẩm, thiết lập mức tồn kho an toàn (Safety Stock) và cảnh báo đặt hàng (Reorder Point).

### 3.4. Hiệu suất Nhân sự (Personnel View)
**Mục đích:** Cung cấp cho nhân viên và quản lý cái nhìn chi tiết về KPI, tiến độ công việc, và hiệu suất làm việc của cá nhân hoặc đội ngũ thông qua hệ thống xếp hạng và theo dõi đa chiều.

**Các tính năng & Biểu đồ chi tiết:**

**Phân quyền hiển thị (Role-based UI):**

1. **Góc nhìn Nhân viên (Staff View):**
   - **Thẻ Điểm Cá nhân (Personal Scorecards):**
     - *Doanh số cá nhân (Tháng):* Hiển thị tổng doanh số đạt được kèm tỷ lệ % tăng/giảm so với mục tiêu định ra.
     - *Xếp hạng nội bộ:* Hiển thị thứ hạng hiện tại của nhân viên so với toàn bộ nhân sự cùng cấp (Ví dụ: Top 2/15) kèm thanh tiến độ (Progress Bar).
     - *Giá trị đơn TB (AOV - Average Order Value):* Thống kê mức chi tiêu trung bình trên mỗi đơn hàng mà nhân viên đó bán được, so sánh trực tiếp với mức trung bình của toàn cửa hàng.
     - *Đánh giá CSKH (NPS - Net Promoter Score):* Điểm số đánh giá từ khách hàng về chất lượng phục vụ của cá nhân.
   - **Tiến độ KPI Tuần (Weekly KPI Progress):**
     - *Loại hiển thị:* Danh sách các thanh tiến độ (Progress Bars).
     - *Dữ liệu:* Theo dõi chi tiết % hoàn thành mục tiêu cho từng danh mục sản phẩm cụ thể (Tròng kính cận, Gọng kính cao cấp, Kính mát, v.v.).
   - **Vinh danh / Động lực (Gamification):** Khối hiển thị thông báo "Nhân viên xuất sắc" hoặc thông báo khích lệ khi đạt chỉ tiêu sớm.

2. **Góc nhìn Quản lý/Ban Giám đốc (Manager/BOD View):**
   - **Bảng Xếp Hạng PIC Sales (Sales Leaderboard):**
     - *Loại hiển thị:* Bảng dữ liệu (Data Table) kết hợp Thanh tiến độ (Progress Bar).
     - *Dữ liệu:* Đánh giá năng lực chốt sales của nhân viên thông qua: Tiến độ Doanh số (Mức độ hoàn thành chỉ tiêu), Doanh số tuyệt đối (Số tiền mang lại), và AOV (Giá trị đơn hàng trung bình).
     - *Mục đích:* Khen thưởng kịp thời các nhân viên chốt sale tốt và tối ưu hóa doanh thu trên mỗi khách hàng.
   - **Hiệu suất KTV Khúc Xạ (Optometrist Performance):**
     - *Loại hiển thị:* Bảng dữ liệu (Data Table) kết hợp Thanh tiến độ.
     - *Dữ liệu:* Đánh giá qua Tỷ lệ chuyển đổi ra đơn (khách đo mắt xong có mua hàng không) và Độ chính xác đo khám (phản hồi cắt kính chuẩn).
   - **Hiệu suất Phòng Lab / KTV Mài Lắp (Lab/Technician Performance):**
     - *Loại hiển thị:* Bảng dữ liệu (Data Table) kết hợp Thanh tiến độ.
     - *Dữ liệu:* Theo dõi năng suất thực thi qua Tỷ lệ hoàn thành đúng hạn (tốc độ xử lý đơn hàng) và Tỷ lệ hư hao vật tư (quản trị rủi ro mài hỏng phôi tròng).

### 3.5. Quản lý KPI (KPI Management View)
**Mục đích:** Cung cấp trung tâm điều khiển (Control Center) toàn diện để Ban Giám đốc và Quản lý cấp cao thiết lập, phân bổ, theo dõi và tối ưu hóa các chỉ tiêu hiệu suất (KPI) trên toàn hệ thống đa chi nhánh.

**Các tính năng & Giao diện chi tiết:**

- **Bảng Thống kê Nhanh (Summary Cards):**
  - Hiển thị các chỉ số tổng quan ở phía trên cùng của trang:
    - *Tổng số KPI đang áp dụng:* Theo dõi khối lượng mục tiêu đang vận hành.
    - *KPI đã hoàn thành (Tháng trước):* Đánh giá nhanh tỷ lệ đạt chỉ tiêu của kỳ liền trước.
    - *Cấp độ phân bổ sâu nhất:* Hiển thị mức độ chi tiết của việc giao KPI (ví dụ: xuống đến Cấp Chi nhánh hoặc Cấp Cá nhân).

- **Danh sách Quản lý KPI (KPI Master List):**
  - *Loại hiển thị:* Bảng dữ liệu tương tác (Interactive Data Table) với thanh công cụ tìm kiếm và bộ lọc (Filter).
  - *Các trường dữ liệu (Columns):* 
    - **Phạm vi (Scope):** Toàn công ty, Vùng/Khu vực, hoặc Chi nhánh.
    - **Đối tượng (Entity):** Tên cụ thể của đối tượng chịu KPI (Ví dụ: Chi nhánh Quận 1).
    - **Chu kỳ (Period):** Tháng, Quý, Năm, hoặc theo Chiến dịch cụ thể.
    - **Phiên bản (Version):** Theo dõi lịch sử cập nhật (v1.0, v1.1).
    - **Các Chỉ số Mục tiêu:** Mục tiêu Doanh thu (Tỷ VNĐ), Tỷ lệ Chuyển đổi (%), Traffic, AOV.
    - **Trạng thái (Status):** Phân loại rõ ràng bằng nhãn màu sắc (`Đang áp dụng`, `Đã kết thúc`, `Bản nháp`, `Lưu trữ`).
  - *Tính năng đi kèm:* Chức năng tìm kiếm theo tên chi nhánh/khu vực và lọc theo trạng thái/chu kỳ.

- **Thiết lập & Cấu hình KPI (KPI Configuration Modal):**
  - *Loại giao diện:* Cửa sổ hiển thị nổi (Modal/Dialog).
  - *Chức năng:* Cho phép người quản trị tạo mới một bản ghi KPI với các tham số đa dạng (Doanh thu, Tỷ lệ chốt, Traffic).
  - *Cơ chế Xử lý Xung đột thông minh (Conflict Resolution):*
    - Khi lưu, hệ thống tự động kiểm tra xem đã có KPI nào đang "Active" (Đang áp dụng) cho cùng Đối tượng (Khu vực/Chi nhánh) trong cùng Chu kỳ thời gian hay chưa.
    - Nếu phát hiện trùng lặp, cảnh báo đỏ sẽ xuất hiện kèm các tùy chọn xử lý:
      - **Ghi đè hoàn toàn (Overwrite):** Vô hiệu hóa (Lưu trữ) KPI cũ và ưu tiên áp dụng KPI mới.
      - **Giữ mục tiêu cao nhất (Merge/Keep Highest):** Thuật toán tự động so sánh và hợp nhất các chỉ số (Doanh thu, Tỷ lệ) cao nhất từ cả 2 bản ghi.
      - **Lưu thành bản nháp (Save as Draft):** Không áp dụng ngay, chờ xem xét sau.

- **Chỉnh sửa Hàng loạt (Bulk Edit Mode):**
  - *Cơ chế kích hoạt:* Khi người dùng chọn (tick checkbox) nhiều dòng KPI trong danh sách.
  - *Giao diện:* Một thanh công cụ nổi (Floating Action Bar - FAB) sẽ trượt lên từ cạnh dưới màn hình, hiển thị số lượng bản ghi đã chọn.
  - *Tính năng cập nhật đồng loạt:*
    - Mở một Modal chỉnh sửa nhanh cho phép điều chỉnh cùng một lúc (Tăng/Giảm theo % hoặc Nhập số liệu mới tuyệt đối) cho `Mục tiêu Doanh thu`, `Tỷ lệ Chuyển đổi`.
    - Cho phép thay đổi `Chu kỳ` hoặc thời hạn áp dụng chung cho tất cả các chi nhánh đang được chọn.
  - *Mục đích:* Tiết kiệm tối đa thời gian vận hành khi cần điều chỉnh mục tiêu hệ thống (ví dụ: Tăng đồng loạt target doanh thu của tất cả chi nhánh miền Nam lên 10% trong tháng tới).
