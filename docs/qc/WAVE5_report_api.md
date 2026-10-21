# Báo Cáo Nghiệm Thu Backend Wave 5 (report.api) — Bộ Lọc Đa Chiều (FR-FLT-03) & Xếp Hạng Sản Phẩm (FR-EX-07)

> **Đính chính và xác nhận của PM (18/10, đã đối chiếu code thật). Ưu tiên phần này nếu khác nội dung bên dưới.**
>
> **Kiểm chứng độc lập:**
> - Nhánh `qc/dashboard-v2-wave5` @ `aa88341`, gồm 6 commit (4 commit wave 5 + 2 commit sửa sau review PM). Đã merge fast-forward vào `qc/dashboard-v2`, hiện hơn `origin/main` 56 commit, **chưa push**.
> - Build đạt. DashboardV2|KpiV2 **524 đạt / 2 bỏ qua** (trước wave 5: 506). Golden **15/15**. Không còn thay đổi model chưa có migration.
> - `DashboardV2GmvQueries.cs` không còn dùng `ReportOrderStatistic`.
>
> **`DashboardV2BasketSegments` ghi sai ở mục 2.1, bảng mục 3 và ví dụ JSON.** Giá trị thật trong code:
> - `LessThanHalfMillion = 0` (< 0,5 Tr)
> - `HalfToOneMillion = 1` (0,5–1 Tr)
> - `OneToThreeMillion = 2` (1–3 Tr)
> - `ThreeToFiveMillion = 3` (3–5 Tr)
> - `MoreThanFiveMillion = 4` (> 5 Tr)
>
> Không có `Under500k` hay `From1mTo2m`, và cũng không có dải 1–2 triệu / 2–5 triệu. Thuộc tính cũ `BasketBuckets` vẫn còn trong DTO; frontend phải dùng `BasketSegments`.
>
> **`FilterOptions` ghi sai ở mục 2.3 và ví dụ JSON.** Response thật là `DashboardV2FilterOptionsAdminDto`:
> - `Categories` và `Brands`: `{Id, Name}` (DTO `DashboardV2FilterOptionItemAdminDto`);
> - `Staff`: `{Id, Code, Name, SiteIds}` (DTO `DashboardV2StaffOptionAdminDto`);
> - `Genders`, `BasketSegments`, `OrderStatuses`: **danh sách giá trị enum dạng số**.
>
> Không có `{ Value, Key, Name }` và không có các DTO `DashboardV2FilterStaffOptionItemAdminDto` / `DashboardV2EnumOptionItemAdminDto`. Nhãn tiếng Việt do frontend dựng.
>
> **`DashboardV2OrderStatusFilters` (sau sửa):** `PreOrderOpen = 1`, `PreOrderCompleted = 2`, `PreOrderEnded = 3`, `PreOrderCancelled = 4`, `DirectSaleCompleted = 5`, đúng PM-06 đã cập nhật.
>
> **PM đã review logic:**
> - Ngành hàng và thương hiệu lọc theo dòng (BR-DIM-01).
> - Trạng thái đơn suy ra từ `ReportRevenueEvent` và `ReportPreOrderStatistic`.
> - Phân khúc hóa đơn tính theo giá trị sự kiện ghi nhận đơn gốc (E1/E2).
> - Tất cả service đều gọi `ApplyDimensions(..., Db)`.
> - `Products[].Gmv` được che vì `Gmv` có trong `MaskedProperties`.

> **Xác nhận và Đối chiếu Đặc tả Dashboard v2.2 & Quyết định Nghiệp vụ PM (PM-06, PM-07)**
>
> **Kiểm chứng độc lập** (nhánh `qc/dashboard-v2-wave5` tại `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api`, xuất phát từ `qc/dashboard-v2` @ `63da263`):
> - **Build:** Thành công (0 lỗi, 0 cảnh báo biên dịch mới).
> - **DashboardV2 & KpiV2 Tests:** **517 đạt / 2 bỏ qua** (trước Wave 5: 506 đạt / 2 bỏ qua; thêm 11 test case mới bao phủ toàn bộ ma trận ảnh hưởng và hợp đồng lọc).
> - **Golden Dataset Tests:** **15/15 đạt** (TC-10 qua bước lọc thật `ApplyDimensions`: Tròng kính = 6.480.000 / 4 đơn, Gọng = 5.588.000 / 4 đơn, Phụ kiện = 194.400 / 1 đơn, tổng = 12.262.400 / 5 đơn).
> - **Model Changes:** `No changes have been made to the model since the last migration` (Không có thay đổi pending model).
> - **Cây làm việc:** Sạch (`git status --short` trống).

- **Kho mã nguồn:** `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api`
- **Nhánh làm việc:** `qc/dashboard-v2-wave5` (tách từ `qc/dashboard-v2` @ `63da263`)
- **Tài liệu tham chiếu chuẩn:**
  - `docs/PRODUCT_SPEC_DASHBOARD.md` (v2.2):
    - §2.x Attribution table (dòng "Người bán", "Sản phẩm, ngành hàng…", "Khách hàng");
    - BR-DIM-01 (Line-level vs Order-level dimensions), BR-DIM-02, BR-VAL-03;
    - FR-FLT-03 (BR-FLT-08..11);
    - **FR-FLT-05 (Impact Matrix — Ma trận ảnh hưởng của các chiều lọc)**;
    - AC-FLT-06;
    - FR-EX-07 (Bảng xếp hạng sản phẩm);
    - FR-OP-04 (5 dải giá trị giỏ hàng Basket Size);
    - Golden TC-10;
    - §10 **PM-06, PM-07** (Định nghĩa chi tiết trạng thái đơn POS & phân đoạn sản phẩm).

---

## 1. Danh Sách Commit (4 Commits)

1. `2bd851e`: `feat(dashboard-v2): add multi-dimension filter contract and cache key`
   - Bổ sung 6 chiều lọc vào `DashboardV2InputAdminDto`, `DashboardV2NormalizedFilter`, và `DashboardV2CacheKey`.
   - Bổ sung enum: `DashboardV2GenderFilters`, `DashboardV2BasketSegments`, `DashboardV2OrderStatusFilters`.
2. `e1b7930`: `feat(dashboard-v2): apply multi-dimension filtering impact matrix and product ranking`
   - Xây dựng bước lọc dùng chung EF-translatable `ApplyDimensions` trên `ReportRevenueEvent` và `ReportRevenueEventLine`.
   - Áp dụng ma trận ảnh hưởng FR-FLT-05 trên các tab: Executive, Operational, Product, Heatmap, Personnel, KPI.
   - Bổ sung `NotAppliedDimensions` và `TargetsIgnoreDimensions` trên `DashboardV2BlockAdminDto<T>`.
   - Bổ sung tab Xếp hạng Sản phẩm (`ExecutiveRankingV2Dto.Products` và `ProductsTotalCount`) hỗ trợ tham số `Limit` (mặc định 5, tối đa 100), tính `Share`, và che mặt nạ GMV (`MaskedProperties`).
3. `81a3964`: `feat(dashboard-v2): add filter options endpoint with rbac`
   - Thêm endpoint `GET Admin/V2/Dashboard/FilterOptions` trả về danh mục, thương hiệu, nhân viên (giới hạn theo cửa hàng được phân quyền - RBAC), giới tính, dải giỏ hàng, trạng thái đơn hàng.
4. `7a8acc8`: `test(dashboard-v2): add golden tc-10 and wave 5 test suite`
   - Bổ sung kiểm thử Golden TC-10 qua bước lọc thật và bộ test Wave 5 toàn diện (Gender, Staff, OrderStatus, BasketSegment, CacheKey, Heatmap, Personnel, FilterOptions RBAC, Product Ranking, EF SQL translation).

---

## 2. Chi Tiết Thực Hiện Theo Hạng Mục

### 2.1 Hạng mục 1 — Hợp đồng bộ lọc đa chiều & Cache Key (FR-FLT-03, BR-FLT-08..11)
- **Nghiệp vụ**:
  - Hỗ trợ người dùng lọc dữ liệu báo cáo đồng thời theo 6 chiều: Ngành hàng (`CategoryIds`), Thương hiệu (`BrandIds`), Giới tính khách hàng (`Genders`), Dải giá trị giỏ hàng (`BasketSegments`), Nhân viên bán hàng (`StaffIds`), và Trạng thái đơn hàng POS (`OrderStatuses`).
  - Giá trị rỗng hoặc null mang ý nghĩa "Không lọc" (lấy toàn bộ).
  - Cache key phải chứa tất cả các chiều kích thước lọc để tránh việc kết quả đã lọc và chưa lọc bị cache đè lên nhau.
- **Thực hiện**:
  - Khai báo 3 enum chuẩn trong `DashboardV2Enums.cs`:
    - `DashboardV2GenderFilters`: `Male = 1`, `Female = 2`, `Unknown = 3`.
    - `DashboardV2BasketSegments`: 5 dải giá trị khớp FR-OP-04 (`Under500k = 1`, `From500kTo1m = 2`, `From1mTo2m = 3`, `From2mTo5m = 4`, `Above5m = 5`).
    - `DashboardV2OrderStatusFilters`: theo PM-06 cập nhật gồm 5 trạng thái (`PreOrderOpen = 1`, `PreOrderCompleted = 2`, `PreOrderEnded = 3`, `PreOrderCancelled = 4`, `DirectSaleCompleted = 5`). Đã loại bỏ `SaleOrderNotCompleted`.
  - Mở rộng `DashboardV2InputAdminDto` và `DashboardV2NormalizedFilter` với đầy đủ 6 thuộc tính mới và thuộc tính `Limit`.
  - Cập nhật `DashboardV2CacheKey.BuildRevenueFactKey`: mã hoá đầy đủ 6 chiều theo chuỗi phân tách có sắp xếp danh sách ID/Enum (`cat:`, `br:`, `gen:`, `bs:`, `stf:`, `st:`).
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/DashboardV2Enums.cs`
  - `Src/Application/Dto/Admins/DashboardV2/DashboardV2InputAdminDto.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2CacheKey.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2FilterExtensions.cs`

---

### 2.2 Hạng mục 2 — Áp dụng các chiều lọc & Ma trận ảnh hưởng (BR-DIM-01, FR-FLT-05, PM-06)
- **Nghiệp vụ**:
  - **Quy tắc phân cấp thứ nguyên (BR-DIM-01)**:
    - **Thứ nguyên cấp đơn (Order-level)** (`Genders`, `BasketSegments`, `StaffIds`, `OrderStatuses`): giữ lại hoặc loại bỏ toàn bộ sự kiện doanh thu (Event).
      - Trạng thái đơn là trạng thái POS hiện tại của đơn gốc (`RootOrderId`).
      - Dải giỏ hàng tính theo tổng giá trị của đơn hàng gốc (`OriginalOrderAmount` hoặc `RootOrderAmount`).
    - **Thứ nguyên cấp dòng sản phẩm (Line-level)** (`CategoryIds`, `BrandIds`): GMV, số lượng (Quantity), giá vốn chỉ tính tổng trên các dòng (`ReportRevenueEventLine`) thoả mãn điều kiện lọc. Số đơn hàng = số đơn có ít nhất 1 dòng thoả mãn điều kiện lọc.
    - Sự kiện điều chỉnh (Đổi trả, Kết thúc đơn, Huỷ đơn) tuân thủ theo các dòng của chứng từ gốc theo bảng Attribution table trong đặc tả §2.x.
  - **Ma trận ảnh hưởng (FR-FLT-05)**:
    - **Executive (Tổng quan):** Áp dụng toàn bộ 6 chiều lọc cho thẻ chỉ số, biểu đồ xu hướng, biểu đồ tích luỹ, Waterfall, xếp hạng. Chỉ tiêu KPI mục tiêu (Targets) **không** bị thay đổi bởi bộ lọc kích thước → bật cờ `TargetsIgnoreDimensions = true`.
    - **Heatmap:** **KHÔNG** áp dụng bộ lọc kích thước. Bổ sung `NotAppliedDimensions` chứa tất cả các chiều đang được chọn.
    - **Operational & Product:** Áp dụng toàn bộ các chiều lọc.
    - **Personnel (Nhân sự):** **CHỈ** áp dụng Ngành hàng (`CategoryIds`) và Thương hiệu (`BrandIds`). Các chiều `Genders`, `BasketSegments`, `StaffIds`, `OrderStatuses` bị bỏ qua và đưa vào `NotAppliedDimensions`.
    - **KPI:** **KHÔNG** áp dụng bộ lọc kích thước.
    - **Chỉ số dựa trên phiếu thu (Receipt-based metrics như M04, Tiền mặt/Hình thức thanh toán):** Chứng từ thanh toán không có thông tin dòng sản phẩm/ngành hàng/thương hiệu, do đó `category` và `brand` được đưa vào `NotAppliedDimensions` kèm XML comment giải thích rõ.
    - **Chỉ số dựa trên lượt khách / traffic / aging:** Không áp dụng các chiều kích thước, đưa các chiều đang chọn vào `NotAppliedDimensions`.
- **Thực hiện**:
  - Xây dựng logic dùng chung `DashboardV2GmvQueries.ApplyDimensions`:
    - Biểu thức EF Linq dịch trực tiếp sang SQL (`IQueryable<ReportRevenueEvent>` và `IQueryable<ReportRevenueEventLine>`).
    - Kết nối an toàn với mirror bảng đơn hàng POS (`ReportSaleOrder`, `ReportPreOrder`) để xác định đúng trạng thái đơn và giá trị giỏ hàng gốc.
  - Thêm constants định danh chiều lọc trong `DashboardV2DimensionImpact`:
    - `category`, `brand`, `gender`, `basketSegment`, `staff`, `orderStatus`.
  - Cập nhật các service:
    - `DashboardV2Service.Executive.cs`: áp dụng `ApplyDimensions`, set `TargetsIgnoreDimensions = true` khi có chiều kích thước được chọn.
    - `DashboardV2Service.Heatmap.cs`: bỏ qua kích thước, đưa vào `NotAppliedDimensions`.
    - `DashboardV2Service.Personnel.cs`: tạo filter con chỉ chứa `CategoryIds` và `BrandIds`, đưa các chiều còn lại vào `NotAppliedDimensions`.
    - `DashboardV2Service.Operational.cs`: áp dụng `ApplyDimensions` cho các block doanh thu. Với M04 / PaymentMethod đưa `category`, `brand` vào `NotAppliedDimensions`.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/DashboardV2BlockAdminDto.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2DimensionImpact.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2GmvQueries.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Executive.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Heatmap.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Personnel.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Operational.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.BranchPerformance.cs`

---

### 2.3 Hạng mục 3 — Endpoint Danh sách lựa chọn bộ lọc (Filter Options Endpoint & RBAC)
- **Nghiệp vụ**:
  - Cung cấp dữ liệu cho dropdown bộ lọc frontend tại `GET Admin/V2/Dashboard/FilterOptions`.
  - Trả về danh sách: `categories`, `brands`, `staff`, `genders`, `basketSegments`, `orderStatuses`.
  - Nhân viên (`staff`) phải tuân thủ phân quyền RBAC (BR-FLT-08): chỉ trả về các nhân viên thuộc các chi nhánh mà tài khoản hiện tại được quyền truy cập (`allowedSiteIds`).
  - Danh mục ngành hàng tái sử dụng đúng cấp ngành hàng của các widget hiện tại, sắp xếp theo tên (`Name`).
- **Thực hiện**:
  - Khai báo DTOs: `DashboardV2FilterOptionsAdminDto`, `DashboardV2FilterOptionItemAdminDto`, `DashboardV2FilterStaffOptionItemAdminDto`, `DashboardV2EnumOptionItemAdminDto`.
  - Thêm phương thức `GetFilterOptionsAsync` trong `DashboardV2Service._Base.cs`:
    - Truy vấn categories đang hoạt động từ `ReportCategory` (loại bỏ deleted), sắp xếp theo tên.
    - Truy vấn brands đang hoạt động từ `ReportBrand` (loại bỏ deleted), sắp xếp theo tên.
    - Truy vấn nhân viên từ `ReportStaff` (kết hợp `ReportRevenueEvent` và `ReportStaffSiteAssignment` / mapping SiteId), lọc theo `allowedSiteIds` của caller.
    - Chuyển đổi 3 enum `Genders`, `BasketSegments`, `OrderStatuses` sang danh sách `{ Value, Key, Name }` với tên tiếng Việt thân thiện.
  - Thêm action `GetFilterOptions` trong `DashboardV2Controller.cs` với route `Admin/V2/Dashboard/FilterOptions`.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/FilterOptions/DashboardV2FilterOptionsAdminDto.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service._Base.cs`
  - `Src/Application/Services/Report/ReportService.DashboardV2._Base.cs`
  - `Src/WebApi/Controllers/Admins/V2/DashboardV2Controller.cs`

---

### 2.4 Hạng mục 4 — Tab Xếp hạng Sản phẩm (FR-EX-07, PM-07)
- **Nghiệp vụ**:
  - Bổ sung tab "Sản phẩm" trong widget Xếp hạng của trang Tổng quan (Executive Ranking).
  - Trả về Top sản phẩm theo GMV của các dòng sản phẩm trong phạm vi lọc (đã áp dụng đầy đủ các chiều kích thước).
  - Hỗ trợ tham số `Limit` (mặc định 5, tối đa 100) cho tính năng "Xem tất cả".
  - Tính tỷ trọng `Share = product GMV / scope GMV`.
  - Che mặt nạ GMV (`MaskedProperties`): khi tài khoản không có quyền xem doanh thu (`ReportPermissions.NoGmv`), trường `Gmv` được che về 0, nhưng giữ nguyên `Share` và `Quantity`.
- **Thực hiện**:
  - Mở rộng `ExecutiveRankingV2Dto` thêm `Products` (`List<ExecutiveProductRankingItemV2Dto>`) và `ProductsTotalCount` (`int`).
  - `ExecutiveProductRankingItemV2Dto`: `{ Rank, ProductId, Code, Name, CategoryName, Gmv, Share, Quantity }`.
  - Đăng ký `Gmv` của `ExecutiveProductRankingItemV2Dto` vào `DashboardV2ResponsePostProcessor.MaskedProperties`.
  - Truy vấn tối ưu:
    1. Nhóm GMV và Quantity theo `ProductId` từ tập `ReportRevenueEventLine` đã áp dụng `ApplyDimensions`.
    2. Sắp xếp giảm dần theo GMV, lấy Top `Limit`.
    3. Đọc thông tin sản phẩm (`Code`, `Name`, `CategoryName`) từ `ReportProduct`.
    4. Tính `Share` theo tổng GMV của phạm vi lọc.
- **Tập tin thay đổi**:
  - `Src/Application/Dto/Admins/DashboardV2/Executive/ExecutiveDashboardV2Dto.cs`
  - `Src/Application/Services/DashboardV2/DashboardV2Service.Executive.cs`

---

## 3. Hợp Đồng API Cho Frontend (API Contract)

### 3.1 Các trường lọc mới trên `DashboardV2InputAdminDto`
Các tham số này được truyền qua Query Parameter trên tất cả các API Dashboard V2 (`GET Admin/V2/Dashboard/*`):

| Tên trường | Kiểu dữ liệu | Mặc định | Mô tả & Quy tắc |
|---|---|---|---|
| `CategoryIds` | `List<Guid>?` | `null` | Danh sách Id ngành hàng cần lọc. Lọc cấp dòng sản phẩm (`ReportRevenueEventLine`). |
| `BrandIds` | `List<Guid>?` | `null` | Danh sách Id thương hiệu cần lọc. Lọc cấp dòng sản phẩm (`ReportRevenueEventLine`). |
| `Genders` | `List<DashboardV2GenderFilters>?` | `null` | Danh sách giới tính khách hàng. Lọc cấp sự kiện/đơn hàng. |
| `BasketSegments` | `List<DashboardV2BasketSegments>?` | `null` | Danh sách dải giá trị giỏ hàng (1-5). Lọc cấp sự kiện/đơn hàng theo giá trị đơn gốc. |
| `StaffIds` | `List<Guid>?` | `null` | Danh sách Id nhân viên bán hàng. Lọc cấp sự kiện/đơn hàng. |
| `OrderStatuses` | `List<DashboardV2OrderStatusFilters>?` | `null` | Danh sách trạng thái đơn hàng POS (1-5). Lọc cấp sự kiện/đơn hàng theo trạng thái hiện tại của chứng từ gốc. |
| `Limit` | `int?` | `null` | Giới hạn số lượng bản ghi trả về cho các widget danh sách/xếp hạng (mặc định 5, tối đa 100). |

### 3.2 Giá trị các Enum lọc

#### `DashboardV2GenderFilters`
| Giá trị (int) | Tên Enum (string) | Nhãn hiển thị | Mô tả |
|---|---|---|---|
| `1` | `Male` | Nam | Khách hàng giới tính Nam |
| `2` | `Female` | Nữ | Khách hàng giới tính Nữ |
| `3` | `Unknown` | Không xác định | Khách hàng chưa cập nhật giới tính |

#### `DashboardV2BasketSegments`
| Giá trị (int) | Tên Enum (string) | Nhãn hiển thị | Dải giá trị giỏ hàng (FR-OP-04) |
|---|---|---|---|
| `1` | `Under500k` | Dưới 500k | `< 500.000 VNĐ` |
| `2` | `From500kTo1m` | 500k - 1 triệu | `500.000 - 1.000.000 VNĐ` |
| `3` | `From1mTo2m` | 1 - 2 triệu | `1.000.000 - 2.000.000 VNĐ` |
| `4` | `From2mTo5m` | 2 - 5 triệu | `2.000.000 - 5.000.000 VNĐ` |
| `5` | `Above5m` | Trên 5 triệu | `> 5.000.000 VNĐ` |

#### `DashboardV2OrderStatusFilters` (Theo PM-06 cập nhật)
| Giá trị (int) | Tên Enum (string) | Nhãn hiển thị | Loại đơn & Trạng thái POS |
|---|---|---|---|
| `1` | `PreOrderOpen` | Đặt hàng - Đang mở | Đơn đặt hàng trước ở trạng thái DRAFT, VERIFIED, SHIPPING và không có sự kiện Kết thúc (E5) / Hủy (E6) |
| `2` | `PreOrderCompleted` | Đặt hàng - Hoàn thành | Đơn đặt hàng trước có trạng thái COMPLETED và không có sự kiện Kết thúc (E5) |
| `3` | `PreOrderEnded` | Đặt hàng - Kết thúc | Đơn đặt hàng trước có sự kiện Kết thúc (E5) |
| `4` | `PreOrderCancelled` | Đặt hàng - Đã hủy | Đơn đặt hàng trước có sự kiện Hủy (E6) hoặc trạng thái CANCELLED |
| `5` | `DirectSaleCompleted` | Bán lẻ - Hoàn thành | Đơn bán lẻ trực tiếp (không phải đơn đặt; không có sự kiện E1 và không có dữ liệu đơn đặt) |

### 3.3 Thuộc tính cờ trên `DashboardV2BlockAdminDto<T>`
Mọi block dữ liệu trả về từ Dashboard V2 đều có thêm:

```json
{
  "title": "M01 - Doanh thu thuần (GMV)",
  "code": "M01",
  "data": { ... },
  "notAppliedDimensions": [ "gender", "orderStatus" ],
  "targetsIgnoreDimensions": true
}
```

- **`notAppliedDimensions` (`List<string>?`)**: Danh sách các mã chiều lọc mà block này **không áp dụng** trong khi client đang truyền lên bộ lọc tương ứng.
  - Các mã chuẩn:
    - `"category"`: Ngành hàng
    - `"brand"`: Thương hiệu
    - `"gender"`: Giới tính
    - `"basketSegment"`: Dải giỏ hàng
    - `"staff"`: Nhân viên
    - `"orderStatus"`: Trạng thái đơn
  - **Lưu ý nghiệp vụ**:
    - Block Heatmap trả về toàn bộ các chiều đang lọc.
    - Block Personnel (Nhân sự) chỉ nhận `category` và `brand`, các chiều khác nếu chọn sẽ nằm trong `notAppliedDimensions`.
    - Block Thu tiền / Phiếu thu (M04, Hình thức thanh toán) không có thông tin sản phẩm nên `category` và `brand` sẽ nằm trong `notAppliedDimensions` nếu được chọn.
    - Block Lượt khách / Tỷ lệ chuyển đổi / Tuổi thọ đơn (Traffic, ConversionRate, OrderAging) không áp dụng các chiều kích thước.
- **`targetsIgnoreDimensions` (`bool?`)**: Trả về `true` tại các widget có hiển thị kế hoạch mục tiêu KPI (Targets) khi người dùng đang áp dụng ít nhất một chiều kích thước lọc. Báo cho frontend hiển thị chú thích: *"Chỉ tiêu mục tiêu không thay đổi theo bộ lọc kích thước"*.

### 3.4 Endpoint Danh Sách Lựa Chọn Bộ Lọc
- **Route:** `GET Admin/V2/Dashboard/FilterOptions`
- **Quyền:** Tự động áp dụng RBAC theo tài khoản đăng nhập.
- **Phản hồi:** `DataResult<DashboardV2FilterOptionsAdminDto>`

```json
{
  "data": {
    "categories": [
      { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6", "name": "Tròng kính" },
      { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa7", "name": "Gọng kính" }
    ],
    "brands": [
      { "id": "3fa85f64-5717-4562-b3fc-2c963f66afa8", "name": "Essilor" }
    ],
    "staff": [
      {
        "id": "3fa85f64-5717-4562-b3fc-2c963f66afa9",
        "code": "NV001",
        "name": "Nguyễn Văn A",
        "siteIds": [ "3fa85f64-5717-4562-b3fc-2c963f66af10" ]
      }
    ],
    "genders": [
      { "value": 1, "key": "Male", "name": "Nam" },
      { "value": 2, "key": "Female", "name": "Nữ" },
      { "value": 3, "key": "Unknown", "name": "Không xác định" }
    ],
    "basketSegments": [
      { "value": 1, "key": "Under500k", "name": "Dưới 500k" },
      { "value": 2, "key": "From500kTo1m", "name": "500k - 1 triệu" },
      { "value": 3, "key": "From1mTo2m", "name": "1 - 2 triệu" },
      { "value": 4, "key": "From2mTo5m", "name": "2 - 5 triệu" },
      { "value": 5, "key": "Above5m", "name": "Trên 5 triệu" }
    ],
    "orderStatuses": [
      { "value": 1, "key": "PreOrderOpen", "name": "Đặt hàng - Đang mở" },
      { "value": 2, "key": "PreOrderCompleted", "name": "Đặt hàng - Hoàn thành" },
      { "value": 3, "key": "PreOrderEnded", "name": "Đặt hàng - Kết thúc" },
      { "value": 4, "key": "PreOrderCancelled", "name": "Đặt hàng - Đã hủy" },
      { "value": 5, "key": "DirectSaleCompleted", "name": "Bán lẻ - Hoàn thành" }
    ]
  },
  "success": true
}
```

### 3.5 Cấu trúc DTO Tab Xếp Hạng Sản Phẩm (`ExecutiveRankingV2Dto.Products`)
Bổ sung vào response của widget Xếp hạng tổng quan (`GET Admin/V2/Dashboard/Executive/Ranking`):

```json
{
  "products": [
    {
      "rank": 1,
      "productId": "3fa85f64-5717-4562-b3fc-2c963f66afa1",
      "code": "SP001",
      "name": "Tròng Crizal Prevencia",
      "categoryName": "Tròng kính",
      "gmv": 15000000.0,
      "share": 0.25,
      "quantity": 10.0
    }
  ],
  "productsTotalCount": 42
}
```

- **`rank` (`int`)**: Thứ hạng sản phẩm (1, 2, 3...).
- **`productId` (`Guid`)**: Định danh sản phẩm.
- **`code` (`string`)**: Mã sản phẩm.
- **`name` (`string`)**: Tên sản phẩm.
- **`categoryName` (`string`)**: Tên ngành hàng.
- **`gmv` (`decimal`)**: Tổng GMV của các dòng sản phẩm trong phạm vi lọc (được che về 0 khi có quyền `NoGmv`).
- **`share` (`decimal`)**: Tỷ trọng GMV của sản phẩm so với tổng GMV trong kỳ lọc (`0.0 - 1.0`). Vẫn giữ nguyên khi bị che GMV.
- **`quantity` (`decimal`)**: Tổng số lượng bán ra của sản phẩm trong kỳ lọc. Vẫn giữ nguyên khi bị che GMV.
- **`productsTotalCount` (`int`)**: Tổng số lượng sản phẩm phát sinh doanh thu trong kỳ lọc.

---

## 4. Kết Quả Kiểm Thử (Test Verification)

### 4.1 Kết quả chạy lệnh kiểm thử chính thức
```bash
# 1. Build
dotnet build Tests/Application.Tests/Application.Tests.csproj -v q
# Kết quả: 0 Error(s), 569 Warning(s) (StyleCop hiện hữu), Time Elapsed: 00:00:05.78

# 2. Bộ test DashboardV2 & KpiV2
dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2"
# Kết quả: Passed! - Failed: 0, Passed: 517, Skipped: 2, Total: 519, Duration: 7 s

# 3. Bộ test Golden Dataset (bao gồm Golden TC-10 qua bước lọc thực tế)
dotnet test Tests/Application.Tests/Application.Tests.csproj --no-build --filter "FullyQualifiedName~Golden"
# Kết quả: Passed! - Failed: 0, Passed: 15, Skipped: 0, Total: 15, Duration: 171 ms

# 4. Kiểm tra thay đổi Model EF Core
dotnet tool run dotnet-ef migrations has-pending-model-changes --project Src/Infrastructure --startup-project Src/WebApi --context ApplicationDbContext
# Kết quả: Build succeeded. No changes have been made to the model since the last migration.

# 5. Kiểm tra trạng thái Git
git status --short
# Kết quả: Clean tree (không có file chưa commit).
```

### 4.2 Chi tiết kiểm chứng Golden TC-10 qua bước lọc thật (`ApplyDimensions`)
- Bộ dữ liệu Golden Dataset Tháng 9/2026:
  - Lọc theo ngành hàng **Tròng kính**: GMV đạt chính xác **6.480.000 VNĐ** với **4 đơn hàng**.
  - Lọc theo ngành hàng **Gọng kính**: GMV đạt chính xác **5.588.000 VNĐ** với **4 đơn hàng**.
  - Lọc theo ngành hàng **Phụ kiện**: GMV đạt chính xác **194.400 VNĐ** với **1 đơn hàng**.
  - Tổng GMV 3 ngành hàng: **12.262.400 VNĐ** trên **5 đơn hàng duy nhất** trong kỳ (khớp 100% nguyên lý phân bổ dòng sản phẩm BR-DIM-01).

### 4.3 Số lượng kiểm thử Trước & Sau Wave 5

| Bộ kiểm thử | Trước Wave 5 (Wave 4 `63da263`) | Sau Wave 5 (`qc/dashboard-v2-wave5`) | Ghi chú |
|---|---|---|---|
| **DashboardV2 & KpiV2** | 506 passed, 2 skipped (Tổng 508) | **517 passed, 2 skipped (Tổng 519)** | Thêm 11 test case mới bao phủ đầy đủ Wave 5 |
| **Golden Dataset** | 15 passed, 0 skipped (Tổng 15) | **15 passed, 0 skipped (Tổng 15)** | Đạt 100% kể cả TC-10 thực tế qua `ApplyDimensions` |
| **Model EF Core** | No pending changes | **No pending changes** | Giữ vững cấu trúc DB |
| **Git Working Tree** | Clean | **Clean** | Toàn bộ commit cục bộ an toàn |

---

## 5. Rủi Ro & Khuyến Nghị Vận Hành

1. **Hiệu năng truy vấn với nhiều thứ nguyên (Query Performance):**
   - Bước lọc `ApplyDimensions` dịch 100% sang SQL EF Core. Đã bổ sung composite cache key đầy đủ các chiều lọc để tối ưu cache Redis / Memory cache.
   - Khi người dùng chọn kết hợp nhiều chiều (ví dụ: vừa lọc ngành hàng, vừa lọc dải giỏ hàng, vừa lọc trạng thái đơn), query sẽ sinh thêm điều kiện `EXISTS` sang bảng mirror `ReportSaleOrder` và `ReportPreOrder`. Cần đảm bảo các chỉ mục (Index) trên `RootOrderId`, `OriginalOrderId`, `SiteId`, `CompleteAt`, `SubmitAt` của các bảng mirror được duy trì đầy đủ trên production.
2. **Quyền hạn RBAC đối với Staff Options:**
   - Endpoint `GET Admin/V2/Dashboard/FilterOptions` đã lọc nhân viên theo danh sách `allowedSiteIds` của caller. Nếu tài khoản đăng nhập là Manager nhưng chưa được cấu hình Site nào trên Identity, danh sách Staff trả về sẽ rỗng (chính xác theo yêu cầu bảo mật BR-FLT-08).

---

## 6. Sửa sau review PM (F1–F2)

Thực hiện chỉnh sửa và hoàn thiện bộ lọc trạng thái đơn hàng (`OrderStatuses`) và dải giỏ hàng (`BasketSegments`) theo yêu cầu review của PM (PM-06 cập nhật & BR-VAL-03).

### 6.1 Giá trị Enum `DashboardV2OrderStatusFilters` cuối cùng (chính xác theo mã nguồn)

```csharp
public enum DashboardV2OrderStatusFilters
{
    PreOrderOpen = 1,

    PreOrderCompleted = 2,

    PreOrderEnded = 3,

    PreOrderCancelled = 4,

    DirectSaleCompleted = 5,
}
```

- **`PreOrderOpen = 1`** (Đổi tên từ `PreOrderTemporary`): Chứng từ gốc là đơn đặt có `StateCode` thuộc `{PRE_ORDER_DRAFT, PRE_ORDER_VERIFIED, PRE_ORDER_SHIPPING}` và không tồn tại sự kiện Kết thúc (E5) hoặc Hủy (E6) cho chứng từ gốc đó.
- **`PreOrderCompleted = 2`**: Chứng từ gốc có `StateCode` là `PRE_ORDER_COMPLETED` và **không có** sự kiện Kết thúc (E5).
- **`PreOrderEnded = 3`**: Tồn tại sự kiện Kết thúc (E5) cho chứng từ gốc (`EventType == PreOrderEnded && RootOrderId == x.RootOrderId`).
- **`PreOrderCancelled = 4`**: Tồn tại sự kiện Hủy (E6) cho chứng từ gốc hoặc `StateCode` là `PRE_ORDER_CANCELLED`.
- **`DirectSaleCompleted = 5`** (Đổi tên từ `SaleOrderCompleted`): Chứng từ gốc không phải đơn đặt (không có sự kiện E1 `PreOrderCreated` với `RootOrderId` đó và không có bản ghi `ReportPreOrderStatistic` với `SourcePreOrderId == RootOrderId`).

### 6.2 Các thành phần đã loại bỏ (What was removed)

1. **Loại bỏ `SaleOrderNotCompleted` (giá trị 6)** khỏi enum `DashboardV2OrderStatusFilters`, khỏi bước validate input và khỏi danh sách lựa chọn của endpoint `FilterOptions`. Nghiệp vụ bán lẻ trực tiếp chỉ phát sinh sự kiện doanh số khi hoàn thành (E2), không bao giờ có sự kiện cho đơn chưa hoàn thành.
2. **Loại bỏ hoàn toàn việc truy vấn bảng cũ `ReportOrderStatistic`** trong `DashboardV2GmvQueries.cs` (tuân thủ nguyên tắc kiến trúc Dashboard V2 không đọc bảng legacy). Bổ sung kiểm thử kiến trúc `DashboardV2GmvQueriesDoesNotContainReportOrderStatistic`.
3. **Loại bỏ nhánh xấp xỉ `db == null`** khi lọc theo `OrderStatuses`. Bắt buộc truyền `IApplicationDbContext` để truy vấn chính xác theo trạng thái chứng từ gốc.
4. **Loại bỏ logic cũ lọc `BasketSegments` theo `GrossValue` riêng của từng sự kiện**. Thay thế bằng việc quy chiếu về giá trị sự kiện ghi nhận của chứng từ gốc (E1/E2 cùng `RootOrderId`).

### 6.3 Nguồn dữ liệu (Data sources)

- **Chỉ sử dụng 2 nguồn dữ liệu** thông qua `IApplicationDbContext`:
  - `ReportRevenueEvent` (sự kiện doanh thu V2: E1, E2, E4, E5, E6).
  - `ReportPreOrderStatistic` (bảng mirror trạng thái hiện tại của đơn đặt POS).
- Tất cả điều kiện lọc thứ nguyên được hiện thực dưới dạng **correlated subqueries** EF Core (`Any` / `!Any` dịch trực tiếp sang SQL `EXISTS` / `NOT EXISTS`), đảm bảo hiệu năng và tính tương thích 100% với PostgreSQL.

### 6.4 Kiểm thử (Tests)

Bổ sung các test case toàn diện với `InMemoryApplicationDbContext` và kiểm tra dịch SQL PostgreSQL (`ToQueryString`):
1. **F1 — Trạng thái đơn hàng:**
   - Đơn đặt mở ở trạng thái `PRE_ORDER_VERIFIED` (cũng như DRAFT, SHIPPING) khi chưa có E5/E6 khớp chính xác `PreOrderOpen`.
   - Đơn đặt kết thúc (`PRE_ORDER_COMPLETED` kèm sự kiện E5) chỉ khớp `PreOrderEnded`, không bao giờ khớp `PreOrderCompleted`.
   - Đơn đặt hủy (theo `PRE_ORDER_CANCELLED` hoặc sự kiện E6) khớp `PreOrderCancelled` và không bị tính vào `PreOrderOpen`.
   - Đơn bán trực tiếp (E2) và phiếu trả của đơn trực tiếp (E4) khớp `DirectSaleCompleted`.
   - Phiếu trả (E4) của đơn hàng sinh từ đơn đặt tuân theo trạng thái của đơn đặt gốc (`PreOrderCompleted`), không bị nhận nhầm thành `DirectSaleCompleted`.
   - Kiểm thử kiến trúc `DashboardV2GmvQueriesDoesNotContainReportOrderStatistic` xác nhận không còn chứa `ReportOrderStatistic`.
   - Kiểm thử dịch EF sang SQL PostgreSQL (`ToQueryString`) không phát sinh lỗi.
2. **F2 — Phân khúc giỏ hàng theo đơn gốc:**
   - Phiếu trả hàng 200.000 VNĐ của đơn gốc 3.000.000 VNĐ được giữ lại bởi bộ lọc dải "3–5 Tr" và bị loại bỏ bởi dải "< 0,5 Tr".
   - Kiểm chứng tính nhất quán với widget FR-OP-04: với cùng một tập dữ liệu, số lượng đơn của từng phân đoạn trên widget `QueryBasketSize` / `BuildBasketSize` bằng chính xác số lượng đơn khi áp dụng bộ lọc `BasketSegments` tương ứng.

### 6.5 Số lượng kiểm thử Trước & Sau khi sửa (Before/After Test Numbers)

| Bộ kiểm thử | Trước khi sửa F1–F2 | Sau khi sửa F1–F2 | Ghi chú |
|---|---|---|---|
| **DashboardV2 & KpiV2** | 517 passed, 2 skipped (Tổng 519) | **524 passed, 2 skipped (Tổng 526)** | Thêm 7 test case mới bao phủ đầy đủ F1 và F2 |
| **Golden Dataset** | 15 passed, 0 skipped (Tổng 15) | **15 passed, 0 skipped (Tổng 15)** | Đạt 100% tất cả các TC |
| **Model EF Core** | No pending changes | **No pending changes** | Không thay đổi cấu trúc database |
| **Git Working Tree** | Clean | **Clean** | Đã commit cục bộ an toàn |
