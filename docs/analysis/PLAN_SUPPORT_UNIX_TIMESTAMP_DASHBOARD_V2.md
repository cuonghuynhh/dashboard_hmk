# Kế Hoạch Kỹ Thuật: Hỗ Trợ Chuẩn Unix Timestamp (ms) Cho API Dashboard V2 & Đồng Bộ Swagger Client

## 1. Mục Tiêu & Vấn Đề Cần Giải Quyết
- **Vấn đề phía FE (`pos.gui`):** Toàn bộ hệ thống POS dùng Moment.js `this.$moment(...).valueOf()` trả về số nguyên milliseconds (`number`, định dạng Swagger `int64`). Riêng Dashboard V2 trên `report.api` trước đây gắn cứng `IsoDateTimeConverter` làm Swagger sinh ra kiểu `string` (date-time), dẫn đến TypeScript compiler chặn build (`Type 'number' is not assignable to type 'string'`) và backend ném lỗi 400 Bad Request nếu gửi số nguyên.
- **Mục tiêu:**
  1. `report.api` hỗ trợ linh hoạt cả 2 định dạng: **Unix Timestamp (ms/s)** và **ISO 8601 string** mà không làm vỡ các client hiện hữu.
  2. Swagger của `report.api` định nghĩa `StartAt` và `EndAt` ở dạng `integer` (`int64`), giúp auto-generate client TypeScript trên `pos.gui` thành kiểu `number`.
  3. Cập nhật `openapi/report.json` trên `pos.gui` và chạy `npm run openapi:report` để xác nhận TypeScript build xanh 100%.

---

## 2. Các Bước Triển Khai Chi Tiết

### Bước 1: Backend `report.api` - Xây dựng `FlexibleDateTimeConverter`
- **File mới:** `Src/Application/Common/Converters/FlexibleDateTimeConverter.cs` (hoặc vị trí phù hợp trong `Src/Application/Dto/Admins/DashboardV2/Converters/`)
- **Nội dung:**
  - Kế thừa `Newtonsoft.Json.JsonConverter<DateTime>` và `FlexibleNullableDateTimeConverter` (cho `DateTime?`).
  - Hỗ trợ `ReadJson`:
    - `JsonToken.Integer`: Đọc giá trị `long`. Nếu `> 10_000_000_000` -> Unix ms (`DateTimeOffset.FromUnixTimeMilliseconds(val).UtcDateTime`). Nếu `<= 10_000_000_000` -> Unix s (`DateTimeOffset.FromUnixTimeSeconds(val).UtcDateTime`).
    - `JsonToken.String`: Thử parse `long` (nếu client gửi timestamp dạng chuỗi số); nếu không được thì parse ISO 8601 (`DateTimeOffset.Parse` hoặc `DateTime.Parse`).
    - `JsonToken.Date`: Trả về trực tiếp `reader.Value`.
  - Hỗ trợ `WriteJson`: Xuất định dạng Unix timestamp ms (`long`) hoặc ISO string tương thích.

### Bước 2: Cập Nhật DTOs Trong `report.api`
- **File cần cập nhật:**
  - `Src/Application/Dto/Admins/DashboardV2/DashboardV2InputAdminDto.cs`
  - Thay thế `[JsonConverter(typeof(Newtonsoft.Json.Converters.IsoDateTimeConverter))]` bằng `[JsonConverter(typeof(FlexibleDateTimeConverter))]` trên:
    - `public DateTime StartAt { get; set; }`
    - `public DateTime EndAt { get; set; }`
  - Áp dụng tương tự cho các DTO liên quan trong Dashboard V2 (Traffic, Heatmap, KPI nếu cần).

### Bước 3: Cấu Hình Swagger Schema Cho `StartAt` / `EndAt`
- Để Swagger generate ra `type: "integer", format: "int64"` cho TypeScript nhận diện `number`:
- **File cập nhật:** `Src/WebApi/Startup.cs` (hoặc tạo `DashboardV2DateTimeSchemaFilter.cs` trong `Src/WebApi/Swaggers/Filters/` hoặc cấu hình AddSwagger):
  - Áp dụng SchemaFilter cho các thuộc tính `StartAt` và `EndAt` thuộc `DashboardV2InputAdminDto`:
    ```csharp
    schema.Type = "integer";
    schema.Format = "int64";
    schema.Description = (schema.Description ?? "") + " (Unix timestamp in milliseconds)";
    ```

### Bước 4: Viết Unit Tests Trên `report.api`
- **File mới:** `Tests/Application.Tests/DashboardV2DateTimeConverterTests.cs`
- Kiểm tra các ca:
  1. Deserialize từ Unix timestamp milliseconds: `{"startAt": 1730048400000, "endAt": 1730134800000, "periodType": 1}` -> Parse đúng `DateTime`.
  2. Deserialize từ ISO string: `{"startAt": "2026-10-28T00:00:00Z", "endAt": "2026-10-28T23:59:59Z", "periodType": 1}` -> Parse đúng `DateTime`.
  3. Validate logic nghiệp vụ: `StartAt > EndAt` vẫn bị chặn bởi FluentValidation.

### Bước 5: Cập Nhật Swagger Client Trên `pos.gui`
1. Cập nhật `openapi/report.json` trên `pos.gui` phản ánh schema mới:
   - `startAt` & `endAt` của `DashboardV2Input` chuyển thành:
     ```json
     "startAt": { "type": "integer", "format": "int64" },
     "endAt": { "type": "integer", "format": "int64" }
     ```
2. Chạy `npm run openapi:report` trên `pos.gui`.
3. Kiểm tra file `src/apis/schemas/report.d.ts` để đảm bảo `startAt?: number; // int64`.
4. Chạy `npm run type-check` (`vue-tsc -b`) để đảm bảo không còn lỗi TypeScript.

---

## 3. Tiêu Chí Nghiệm Thu (Acceptance Criteria)
1. `dotnet build` và `dotnet test` trên `report.api` PASS 100%.
2. Cả request gửi `startAt: 1730048400000` (number) và `"2026-10-28T00:00:00Z"` (string) đều thành công.
3. `openapi/report.json` và `src/apis/schemas/report.d.ts` trên `pos.gui` có `startAt: number; endAt: number;`.
4. `npm run type-check` trên `pos.gui` hoàn toàn sạch lỗi (0 errors).
5. File Swagger JSON mới sẵn sàng để gửi cho FE developer.
