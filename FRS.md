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
**Mục đích:** Bảng điều khiển trung tâm dành cho Ban Giám đốc (BOD), cung cấp bức tranh toàn cảnh về sức khỏe tài chính và tiến độ thực hiện mục tiêu kinh doanh (KPI) của toàn bộ hệ thống.

**Các tính năng & Giao diện chi tiết:**

- **Thanh Lọc Toàn cục (Master Filter Bar):**
  - Chức năng lọc Chu kỳ (Ngày/Tuần/Tháng/Quý/Năm) và khoảng thời gian (Từ ngày - Đến ngày).
  - Lọc Khu vực/Chi nhánh toàn cục để đồng bộ dữ liệu toàn trang.
  - Tích hợp Bộ lọc Đa chiều mở rộng (Ngành hàng, Khách hàng, Nhân sự, Trạng thái).

- **Thẻ Chỉ số Tài chính (Financial Overview Cards):**
  - Hiển thị các chỉ số vĩ mô cốt lõi: **GMV**, **Khách hàng mới**, **Doanh thu**, **Giá trị điều chỉnh**, **Doanh thu thuần**, **Biên lợi nhuận gộp**, **Volume**, **AOV**. (Logic được định nghĩa chi tiết tại Mục 4.4).
  - Tích hợp biểu đồ tia (Sparklines) nhỏ gọn bên trong mỗi thẻ để thể hiện xu hướng biến động nhanh của kỳ trước.

- **Biểu đồ Xu hướng Lũy kế GMV & Net Revenue (GMV & Net Revenue Trend):**
  - *Loại biểu đồ:* Biểu đồ kết hợp (Cột và Đường).
  - *Dữ liệu:* So sánh trực quan khoảng cách giữa Sức bán (GMV) và Dòng tiền Thực thu (Net Revenue) theo từng khoảng thời gian.

- **Phân tích Thác nước Doanh thu (Revenue Waterfall Chart):**
  - *Loại biểu đồ:* Biểu đồ Thác nước (Waterfall Chart).
  - *Dữ liệu:* Trực quan hóa hành trình dòng tiền từ Tổng Sức bán (GMV) đến Doanh thu thuần (Net Revenue). Cột giảm trừ bao gồm: Hoàn/Hủy.

- **Biểu đồ Cấu trúc Sức bán (GMV Breakdown Chart):**
  - *Loại biểu đồ:* Biểu đồ cột chồng (Stacked Bar Chart).
  - *Dữ liệu:* Thể hiện tỷ trọng đóng góp của 2 luồng doanh thu chính: Đơn đặt hàng (Pre-order) và Đơn mua thẳng (Direct Order).

- **Biểu đồ Xu hướng & Mục tiêu YTD (Revenue Trend & Target):**
  - *Loại biểu đồ:* Biểu đồ kết hợp (Composed Chart - Cột và Đường).
  - *Dữ liệu:* So sánh Doanh thu thực tế lũy kế (Actual YTD) với Mục tiêu lũy kế (Target YTD) qua các mốc thời gian.
  - *Tính năng đi kèm:* Bộ lọc độc lập (Local Filter) cho phép tuỳ biến dữ liệu khu vực/chi nhánh không ảnh hưởng đến Filter chung.

- **Bảng Xếp Hạng Hiệu suất (Top Performance Table):**
  - *Loại hiển thị:* Bảng dữ liệu (Data Table).
  - *Dữ liệu:* Vinh danh Top 5 Chi nhánh và Top 5 Sản phẩm mang lại doanh thu cao nhất, kèm theo đánh giá mức độ hoàn thành chỉ tiêu tương ứng của từng đối tượng.

- **Bản đồ hiệu suất chi nhánh (Branch Performance Map):**
  - *Loại biểu đồ:* Danh sách kết hợp đồ thị thanh ngang (Horizontal Bars).
  - *Mục đích:* Hiển thị trực quan doanh thu đóng góp của từng chi nhánh/khu vực. Giúp nhận diện nhanh các chi nhánh đang dẫn đầu hoặc cần cải thiện.

- **Phân tích Tăng trưởng (Growth Analysis Chart):**
  - *Loại biểu đồ:* Biểu đồ phân tán (Scatter Plot) kết hợp phân chia góc phần tư (Quadrant).
  - *Dữ liệu:* Phân bố các cụm Chi nhánh dựa trên hai trục: Trục X (Tăng trưởng Doanh thu %) và Trục Y (Biên lợi nhuận %).

### 3.2. Vận hành & Khách hàng (Operational View)
**Mục đích:** Đánh giá chi tiết hiệu quả vận hành, phân tích hành vi tệp khách hàng, tình trạng chuyển đổi và các biến động bất thường để tối ưu hóa nguồn lực.

**Các tính năng & Biểu đồ chi tiết:**

- **Cảnh báo Tồn đọng (Order Aging):**
  - *Loại biểu đồ:* Biểu đồ cột chồng (Stacked Bar Chart).
  - *Dữ liệu:* Thể hiện số lượng hoặc giá trị đơn hàng chưa hoàn thành, phân nhóm theo thời gian lưu đọng.

- **Thời gian Bán hàng Tối ưu (Time Peak):**
  - *Loại biểu đồ:* Biểu đồ nhiệt (Heatmap) thiết kế dưới dạng ma trận.
  - *Dữ liệu:* Phân bổ cường độ đơn hàng/doanh thu theo các ngày trong tuần và khung giờ trong ngày.

- **Phân tích Nhân khẩu học Khách hàng (Customer Demographics):**
  - Bao gồm Biểu đồ Tròn (Pie Chart - Giới tính), Biểu đồ Cột ngang (Độ tuổi), và Biểu đồ Tháp Dân số (Population Pyramid).

- **Phân khúc Hóa đơn (Basket Size):**
  - *Loại biểu đồ:* Biểu đồ tròn/Donut (Pie Chart).
  - *Dữ liệu:* Tỷ trọng các nhóm đơn hàng phân theo giá trị (Dưới 1 Triệu, 1-3 Triệu, Trên 3 Triệu).

- **Hình thức Thanh toán (Payment Methods):**
  - *Loại biểu đồ:* Biểu đồ thanh ngang (Stacked Horizontal Bar).
  - *Dữ liệu:* Tỷ lệ % giao dịch của các hình thức thanh toán (COD, Chuyển khoản, Thẻ, Ví điện tử).

- **Hiệu quả Chiến dịch (Marketing & Promotions):**
  - *Loại hiển thị:* Bảng dữ liệu (Data Table).
  - *Dữ liệu:* Thống kê Doanh thu và Số lượng đơn hàng tương ứng với từng chương trình Marketing.

- **So sánh Khu vực (Regional Comparison):**
  - So sánh trực tiếp hiệu suất (Doanh thu, Đơn hàng) giữa các vùng miền/khu vực kinh doanh.

- **Phát hiện Cảnh báo Bất thường (Anomaly Detection):**
  - Phân tích các điểm dữ liệu dị thường (ví dụ: Tỷ lệ hoàn/hủy tăng đột biến) để đưa ra cảnh báo sớm.

- **Phân tích Chuyển đổi và Hoàn/Hủy (Conversion & Refund Analysis):**
  - Cung cấp góc nhìn về hành trình chuyển đổi (Phễu) và nguyên nhân chi tiết dẫn đến hoàn trả/hủy đơn.

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

## 4. Quy trình Xử lý Đơn hàng & Định nghĩa Dữ liệu (Order Processing & Data Definitions)

### 4.1. Quy trình xử lý Đơn đặt hàng và Đơn hàng
Hệ thống quản lý bán hàng vận hành dựa trên hai luồng tạo đơn chính:
- **Luồng 1 (Khách mua trực tiếp):** Khách hàng chọn sản phẩm (gọng, tròng có sẵn) và thanh toán toàn bộ. Thu ngân sẽ lên trực tiếp **Đơn hàng (Direct Order)**.
- **Luồng 2 (Khách đặt cọc/cắt kính):** Khách hàng cần đo mắt, cắt tròng theo yêu cầu hoặc đặt mẫu không có sẵn tại cửa hàng. Thu ngân thu tiền cọc và lên **Đơn đặt hàng (Pre-order)**. Sau khi hàng hóa sẵn sàng và giao cho khách, Đơn đặt hàng này mới được chuyển đổi trạng thái thành **Đơn hàng**.

### 4.2. Định nghĩa Gross Merchandise Value (GMV)
Trong báo cáo tài chính của hệ thống, chỉ số **DOANH SỐ (GMV)** được tính toán theo thời gian thực dựa trên luồng xử lý trên:
- **Công thức GMV:** `Tổng giá trị Đơn đặt phát sinh trong kỳ + Tổng giá trị Đơn mua thẳng (không qua đơn đặt) phát sinh trong kỳ`.
- *Lưu ý:* Khi một Đơn đặt hàng được xử lý và chuyển thành Đơn hàng trong tương lai, giá trị gốc của đơn đó KHÔNG được cộng lại vào GMV để tránh tình trạng tính trùng (double-counting).

### 4.3. Ghi nhận Giá trị Điều chỉnh (GMV Adjustment)
Thực tế kinh doanh thường phát sinh sự thay đổi giá trị trong quá trình xử lý từ Đơn đặt hàng thành Đơn hàng (Khách mua thêm phụ kiện, đổi gọng kính đắt/rẻ tiền hơn, hoặc hủy đơn). 
Để đảm bảo tính minh bạch dữ liệu tài chính:
- **Điều chỉnh tăng/giảm (Upsell/Downsell):** Giá trị chênh lệch (nếu có) khi xử lý từ Đơn đặt thành Đơn hàng sẽ được ghi nhận vào một dòng dữ liệu riêng biệt gọi là **"Điều chỉnh GMV"** (Chênh lệch chuyển đổi).
- **Hoàn/Hủy:** Dòng tiền bị rút ra do khách trả hàng hoặc hủy cọc cũng được hạch toán vào Điều chỉnh.
- **Doanh thu thuần (Net Revenue):** Căn cứ theo dòng sự kiện trên, Doanh thu thuần cuối cùng sẽ là: `GMV + Điều chỉnh GMV (bao gồm cả giá trị chênh lệch đơn đặt và các khoản hoàn/hủy)`. Sự dịch chuyển này được thể hiện trực quan qua Biểu đồ Thác nước (Waterfall Chart).

### 4.4. Checklist Các Chỉ số Tài chính & Vận hành (Financial Metrics Spec)

Dưới đây là đặc tả logic tính toán cho các chỉ số tài chính và vận hành cốt lõi (Overview Cards) hiển thị trên bảng điều khiển:

**1. GMV (SỨC BÁN)**
- **Ý nghĩa:** Tổng sức bán phát sinh (Gross Merchandise Value) trong kỳ hiện tại.
- **Công thức (Logic):** `Tổng giá trị Đơn Đặt + Giá trị Đơn mua thẳng` (Không bao gồm đơn chuyển đổi từ Đơn Đặt cũ để tránh tính trùng).
- **Format UI:** Tỷ VNĐ.
- **Bóc tách Sub-info:** `Sức bán Trước VAT = Tổng GMV / 1.08`, `VAT = Tổng GMV - Sức bán Trước VAT`.

**2. KHÁCH HÀNG MỚI**
- **Ý nghĩa:** Số lượng khách hàng lần đầu mua sắm tại hệ thống trong kỳ.
- **Công thức (Logic):** Đếm số khách hàng có `isFirstTimeBuyer == true`. (Hiện tại mock = `30% x Tổng số đơn hàng`).
- **Format UI:** Khách.

**3. DOANH THU (GROSS REVENUE)**
- **Ý nghĩa:** Doanh thu thu về dựa trên dòng tiền thực tế (Cash-basis) trước khi trừ các khoản hoàn/hủy/chiết khấu sau bán.
- **Công thức (Logic):** `Tổng toàn bộ dòng tiền thực thu (Cash in)` từ các Đơn mua thẳng, Đơn đặt (cọc), và thanh toán nốt phần còn lại.
- **Format UI:** Tỷ VNĐ.

**4. GIÁ TRỊ ĐIỀU CHỈNH**
- **Ý nghĩa:** Tổng số tiền bị hao hụt hoặc sinh thêm từ các nghiệp vụ thay đổi sau khi chốt đơn.
- **Công thức (Logic):** `(Chênh lệch Upsell/Downsell từ Đơn Đặt thành Đơn hàng) + (Các khoản Hoàn/Hủy cọc)`.
- **Format UI:** Triệu VNĐ (luôn có dấu `-` đằng trước nếu giảm trừ).

**5. DOANH THU THUẦN (NET REVENUE)**
- **Ý nghĩa:** Dòng tiền ròng thực tế doanh nghiệp bỏ túi sau khi đã cấn trừ hoàn/hủy.
- **Công thức (Logic):** `GMV (Sức bán) - Hoàn/Hủy` (Logic được áp dụng trên biểu đồ Thác nước).
- **Format UI:** Tỷ VNĐ.

**6. BIÊN LỢI NHUẬN GỘP (GROSS MARGIN)**
- **Ý nghĩa:** Tỷ lệ lợi nhuận giữ lại được sau khi trừ đi chi phí cấu thành sản phẩm.
- **Công thức (Logic):** `((Doanh thu thuần - Giá vốn hàng bán) / Doanh thu thuần) * 100`
- **Format UI:** % (Làm tròn 1 chữ số thập phân).

**7. ĐƠN HÀNG (VOLUME)**
- **Ý nghĩa:** Số lượng giao dịch thành công.
- **Công thức (Logic):** `Tổng số lượng Đơn Đặt + Tổng số lượng Đơn mua thẳng` (Đếm số `OrderID` phát sinh không bị Hủy).
- **Format UI:** Đơn (Format hàng nghìn: `1.234`).

**8. GIÁ TRỊ ĐƠN TB (AOV)**
- **Ý nghĩa:** Số tiền trung bình mà một khách hàng chi trả trên mỗi hóa đơn.
- **Công thức (Logic):** `Doanh thu thuần / Tổng số đơn hàng (Volume)`.
- **Format UI:** Triệu/Đơn. Bóc tách Sub-info tương tự GMV (Trước VAT và VAT).

### 4.5. Logic So sánh Lũy kế (Trend / Growth Rate)

Áp dụng chung cho tất cả các chỉ số (Trend %):
1. **Dữ liệu kỳ gốc (Base Data):** Lấy dữ liệu thuộc khoảng `[dateRange.start, dateRange.end]`.
2. **Dữ liệu kỳ so sánh (Previous Period):** 
   - `Diff = dateRange.end - dateRange.start`.
   - Kỳ so sánh: `[dateRange.start - Diff, dateRange.start - 1 ngày]`.
3. **Công thức Growth Rate:** `((Giá trị kỳ gốc - Giá trị kỳ so sánh) / Giá trị kỳ so sánh) * 100`.
4. **UI Tooltip:** Luôn in ra dải ngày của kỳ gốc và kỳ so sánh dưới dạng `DD/MM/YYYY — DD/MM/YYYY` ở dưới cùng (footer) của mỗi chỉ số.
