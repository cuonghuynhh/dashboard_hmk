# QC W9 BE_E (vòng 1): Mục tiêu GMV / Traffic theo ngày của chi nhánh

Worktree: `wt/api-be-kpi` (branch `qc/w9-be-kpi`), base `075eac1`, 3 commit (`c91a6e6`, `3eff598`, `74383b7`).

## 1. Kết luận: CHƯA ĐẠT

Lý do: 1 lỗi Cao (kế hoạch KPI cũ có DTT/Conversion/AOV không sửa được và không bulk được) và 2 lỗi Trung bình (mục tiêu khu vực/công ty bị tụt khi mới nhập một phần chi nhánh; xác nhận từng phần có rủi ro). Phần còn lại đúng yêu cầu.

Số liệu tự chạy trong worktree:
- `dotnet build Tests/Application.Tests` có 0 error (602 warning, đều là cảnh báo analyzer có sẵn).
- `dotnet build Src/WebApi -v q` có 0 error, 0 warning.
- Filter `DashboardV2|KpiV2`: 533 passed / 2 skipped / 0 failed (baseline 532/2).
- Filter `Golden`: 15/15.
- Filter `KpiDailyTarget`: 7/7.
- Không chạy lại `has-pending-model-changes` (chỉ tin change log). Migration và snapshot cùng có trong diff.
- Không test nào bị xóa. Các test cũ được sửa đúng ý định: `KpiV2CrudTests`, `KpiV2EvaluationTests`, `DashboardV2ImportTests`.

## 2. Bảng yêu cầu

| Yêu cầu | Kết quả | Bằng chứng |
|---|---|---|
| Entity `KpiDailyTarget` (SiteId, Date, DayType, GmvTarget, TrafficTarget, ImportBatchId), unique `(SiteId, Date)`, DbSet, migration thuần thêm | Đạt | `Src/Domain/Entities/KpiDailyTarget.cs`; migration `20261020043128_AddKpiDailyTarget`; `IApplicationDbContext` và `ApplicationDbContext.DbSet.cs`. Có thêm check constraint >= 0 và index phụ. |
| Quy ước khóa ngày | Đạt | `Date` là cột `date`, giống `ReportRevenueEvent.EventDate` (`ReportRevenueEvent.cs:133`). Không đổi múi giờ. Import và template dùng `.Date` (Kind bị bỏ qua khi so khóa). Heatmap/loader dùng cùng ngày lịch VN của `start`/`end`. Không lệch ngày. |
| Template GET `fromMonth`/`toMonth`, bỏ `storeFormat` | Đạt | `DashboardImportController.KpiTemplate`; `DashboardImportService.KpiTemplate`. |
| Validate template: bắt buộc cả hai tháng, from <= to, tối đa 3 tháng, thông báo tiếng Việt | Đạt (trong service) | `ParseMonthRange`; test `KpiTemplate_EnforcesThreeMonthLimitAndMonthOrder`. Xem lỗi L3 về trường hợp thiếu tham số. |
| Dòng = chi nhánh active trong phạm vi x mọi ngày, sắp theo tên rồi ngày | Đạt | `access.AllSites ? null : AllowedSiteIds` rồi `LoadSites(allowed)`, đúng helper của Traffic template. `BuildTemplate` lọc `Active` và sắp theo tên. Test đếm 63 dòng. |
| Cột, ngày là text `DD/MM/YYYY`, loại ngày, prefill, `#,##0`, freeze, auto-filter, sheet Hướng dẫn, tên file | Đạt | `KpiImport.BuildTemplate`. ClosedXML 0.104.2 gán string thành Text. Test `KpiTemplate_RowsPerBranch...`. Prefill chỉ lấy dữ liệu trong phạm vi (`LoadKpiDailyValues(from,to,allowed)`). |
| Preview: phát hiện sai định dạng, trả đúng thông báo | Đạt | `KpiImport.Read` bắt "Sai mẫu file" và đổi thành `WrongFormatMessage`. Test `KpiImport_OldFormatIsRejectedWithNewTemplateMessage`. |
| Quy tắc dòng: chi nhánh resolve, active, trong phạm vi | Đạt | `KpiImport.Evaluate`, `AllowedSiteIds` kiểm ở cả Preview và Confirm, vì Confirm đánh giá lại với `access` của người xác nhận. Không có test cho trường hợp người không phải BOD (xem T1). |
| Quy tắc dòng: ngày DD/MM/YYYY hoặc ô ngày Excel, trong khoảng tháng, trùng khóa báo lỗi cả hai dòng, loại ngày tính lại kèm cảnh báo, GMV/Traffic tùy chọn và >= 0, cả hai trống thì bỏ qua với cảnh báo | Đạt | `Evaluate`. Test `KpiImport_RowRulesPreviewAndErrorFile`. |
| Confirm upsert theo (chi nhánh, ngày), chỉ ghi ô không trống, lưu `ImportBatchId`, một transaction, đếm inserted/updated/skipped, bỏ qua `applyMode`/`conflictPolicy` | Đạt | `ConfirmKpi`; test `KpiImport_ConfirmUpsertsOnlyNonBlankValuesAndCounts`. Quyết định "từng phần" xem M2. |
| Mục tiêu GMV theo ngày thắng, rơi về phân bổ plan, đặt ở một chỗ duy nhất | Đạt | `KpiTargetModel.DirectDaily` (`KpiTargetEngine.cs:144`) nạp từ `KpiTargetLoader.Load`. Xem mục 5 (điểm 1). |
| Khu vực / công ty = Σ chi nhánh | Một phần | Đúng khi mọi chi nhánh đều có số. Lỗi M1 khi chỉ một phần chi nhánh có số. |
| Traffic target, không fallback | Đạt | `DashboardV2Service.Heatmap.cs` đọc `KpiDailyTarget.TrafficTarget` trực tiếp. |
| `HeatmapCellV2Dto`: `TrafficTarget` (long?), `TrafficTargetCompletion` (%), `HasTrafficTarget`; điền cho ô chi nhánh/khu vực/cụm/tổng/summary; không che GMV | Đạt | `HeatmapV2Dto.cs`; `TrafficTargetOf` trong `DashboardV2HeatmapBuilder.cs`. Quy tắc "cả hai ngày": chỉ cộng vào mẫu số và tử số khi có cả traffic và target, null khi không có ngày nào hoặc mẫu số 0. Test `Heatmap_TrafficTargetSums...`. Tên field không nằm trong danh sách che, không bị che. |
| Validator chỉ nhận Gmv và Traffic, thông báo tiếng Việt, không xóa enum, không migrate dữ liệu cũ | Đạt (xem H1) | `KpiV2Rules.cs:62`; test `Validator_OnlyGmvAndTrafficMetricsAreAccepted`. |
| DTO dashboard/KPI không còn tính hoặc hiển thị đạt mục tiêu DTT/conversion/AOV | Đạt | `KpiV2MetricEvaluator.Evaluate` chỉ còn GMV và Traffic. Change log ghi không có field nào khác; tôi không phát hiện field nào bị sót. |
| `GET Admin/V2/Kpi/DailyTargets`, tối đa 93 ngày, KpiRead, che GMV | Đạt | `KpiDailyTargetService` và `KpiV2Controller.DailyTargets`. `GmvTarget` đã thêm vào danh sách che. Thiếu test (T1). |
| Test cập nhật đủ | Một phần | Thiếu test phạm vi (người không phải BOD) cho template, preview và DailyTargets; thiếu test hết hạn 93 ngày và test bulk với plan cũ. |

## 3. Lỗi phát hiện

### Cao

**H1. Kế hoạch KPI cũ có DTT/Conversion/AOV không còn sửa được và không bulk được.**
- Vị trí: `KpiV2PlanValidator.Validate` (`KpiV2Rules.cs:62`), được gọi từ:
  - Create (`KpiV2Service.cs:163`);
  - Update (`KpiV2Service.cs:275`);
  - Bulk (`KpiV2Service.Bulk.cs:104`).
- Kịch bản:
  - Plan cũ có `[Gmv, Dtt, Aov]`. Người dùng đổi GMV, form gửi lại cả danh sách chỉ tiêu, validator ném "Chỉ hỗ trợ Mục tiêu GMV và Mục tiêu Traffic". Plan không sửa được.
  - Bulk (đổi ngày, đổi giá trị theo %) lấy nội dung hiện tại của plan, trong đó có DTT, nên cũng ném lỗi. Một plan cũ trong lô làm hỏng cả bulk.
  - Frontend `KpiTable.vue` còn hiển thị các chỉ tiêu này nên người dùng thấy sẵn rồi mới bị chặn.
- Phương án sửa tốt nhất: giữ validator chặt cho Create, nhưng khi Update và Bulk thì tự lọc chỉ tiêu không hỗ trợ trước khi validate.
  - Thêm helper trong `KpiV2PlanValidator` (hoặc `KpiV2Content`): `StripUnsupportedMetrics(content)` giữ lại `Gmv` và `Traffic`.
  - Gọi ở `KpiV2Service.cs` ngay trước dòng 275 (Update) và `KpiV2Service.Bulk.cs` ngay trước dòng 104.
  - Bản version mới của plan sẽ không còn DTT/AOV. Version cũ vẫn lưu lịch sử. Phù hợp quyết định bỏ hẳn các mục tiêu này khỏi sản phẩm.
  - Tùy chọn: ghi cảnh báo vào kết quả ("đã bỏ các chỉ tiêu không còn hỗ trợ").
  - Create vẫn từ chối, vì dữ liệu mới không được chứa chỉ tiêu cũ.
  - Thêm test: update plan có `[Gmv, Dtt]` thành công và kết quả chỉ còn Gmv; bulk plan cũ thành công.
  - Cân nhắc phương án thay thế: nếu muốn không đụng DB cũ thì chỉ validate các chỉ tiêu đã đổi. Phương án này để lại chỉ tiêu chết, nên không khuyến nghị.
- Thêm vào đó: `KpiV2Rules.cs` `ValidateMetric` còn câu "dùng Gmv hoặc Dtt" ở nhánh Revenue. Nhánh này nay không bao giờ chạy tới và lời nhắn sai, nên dọn đi.

### Trung bình

**M1. Mục tiêu khu vực/công ty bị tụt khi chỉ nhập một phần chi nhánh.**
- Vị trí: `KpiTargetModel.Daily` / `HasDailySiteTarget` (`KpiTargetEngine.cs:190`, `~208`).
- Kịch bản:
  - Công ty hoặc khu vực có KPI cấp công ty/khu vực, các chi nhánh không có KPI chi nhánh.
  - Người dùng chỉ nhập số ngày 05/10 cho 1 chi nhánh trong 15 chi nhánh. Từ lúc đó mục tiêu của khu vực/công ty ngày 05/10 bị thay bằng số của đúng chi nhánh đó, bỏ qua KPI cấp trên.
  - Mục tiêu cả khu vực/công ty (ranking, mục tiêu lũy kế, heatmap tổng) tụt mạnh một cách vô hình. `targetCompletion` bị phóng lên.
- Cách sửa: chỉ dùng quy tắc "Σ chi nhánh" khi mọi chi nhánh thuộc phạm vi đó đều có số cho ngày đó, tức là `daily ?? plan chi nhánh`. Nếu còn chi nhánh không có số nào (không daily, không plan chi nhánh) thì giữ hành vi cũ (dùng KPI cấp trên). Thêm test hai trường hợp (đủ và thiếu).

**M2. Xác nhận "từng phần" (dòng hợp lệ ghi, dòng lỗi bỏ qua).**
- Vị trí: `ConfirmKpi`; `canConfirm: counts.Valid > 0` ở `PreviewKpi`.
- Đánh giá: nhất quán với import Traffic và an toàn dữ liệu. Mỗi cặp (chi nhánh, ngày) độc lập, upsert chỉ ghi ô không trống, ghi lại được và có `ImportBatchId`. Không có bất biến toàn file (không như plan KPI tổng) nên "tất cả hoặc không" không cần thiết.
- Rủi ro thật nằm ở UX: người dùng bấm xác nhận mà không để ý còn dòng lỗi, rồi nghĩ cả tháng đã nhập. Một chi nhánh thiếu vài ngày làm KPI ngày đó rơi về phân bổ cũ (và kéo theo M1).
- Đề nghị: giữ partial. Frontend phải hiển thị rõ "N dòng lỗi sẽ bị bỏ qua" ngay trên nút xác nhận, kèm checkbox hoặc câu xác nhận khi `errors > 0`, cộng nút tải file lỗi. Backend trả đúng `Skipped` ở kết quả xác nhận. Điều này đã làm đúng.
- Một ràng buộc đáng ghi: Confirm đánh giá lại file cùng với dữ liệu hiện tại. Nếu giữa preview và confirm người khác đã sửa, số "ghi đè" có thể khác preview. Chấp nhận được.

### Thấp

**L1. Tràn giá trị khi ghi (`Evaluate` và `ConfirmKpi`).**
- Traffic được phân tích thành `long` rồi ép `(int)traffic.Value` không kiểm tra (`KpiImport.cs`). Giá trị > 2.147.483.647 bị quấn vòng, có thể thành số âm, vi phạm check constraint khi confirm và làm rollback cả lô (lỗi 500).
- GMV vượt precision (18,2) cũng sẽ lỗi tương tự ở DB.
- Sửa: trong `Evaluate` báo lỗi dòng nếu Traffic > `int.MaxValue` hoặc GMV >= 1e16 ("Giá trị quá lớn").

**L2. Xóa mềm không nhất quán.**
- `KpiTargetLoader` dùng `WhereNotDeleted()`, nhưng `KpiDailyTargetService`, truy vấn Traffic của heatmap (`DashboardV2Service.Heatmap.cs`) và `LoadKpiDailyValues`/Confirm không lọc.
- Hiện chưa có đường xóa nên chưa gây lỗi. Nếu sau này có xóa mềm thì sẽ lệch (và unique index vẫn chặn thêm mới trùng khóa).
- Sửa: thêm `WhereNotDeleted()` ở các chỗ còn lại, hoặc ghi chú rõ là entity không xóa mềm.

**L3. Template thiếu tham số.**
- `KpiTemplate([FromQuery] string fromMonth, [FromQuery] string toMonth)` là reference type không nullable trong dự án bật `Nullable`. MVC có thể tự trả 400 với thông điệp tiếng Anh trước khi vào service, nên thông báo Việt "Chọn tháng bắt đầu và tháng kết thúc" không tới được người dùng. Tôi chưa chạy endpoint nên đây là suy luận.
- Sửa: đổi thành `string?` để service ném thông báo Việt.

**L4. Thiếu test (T1).**
- Không test nào chạy với vai trò không phải BOD cho template, preview hay `DailyTargets`.
- Không test phạm vi 93 ngày, ngày `toDate < fromDate`, `siteIds` sai.
- Không test mask GMV (`GmvTarget` ẩn).
- Điểm lead cần kiểm (import scope) chỉ được xác minh bằng đọc code, chưa có test chứng minh.
- Sửa: thêm test dùng `CreateTestHarness` với vai trò MANAGER có `AllowedSiteIds` chỉ 1 chi nhánh.

## 4. Trả lời các điểm lead yêu cầu

1. **Điểm áp dụng duy nhất.** Mục tiêu theo ngày được nạp trong `KpiTargetLoader.Load` và chỉ phân giải trong `KpiTargetModel.DirectDaily`.
   - Mọi chỗ tạo `KpiTargetModel` đều đi qua `KpiTargetLoader.Load`: `DashboardV2Service.BranchPerformance.cs:15`, `Heatmap.cs:46`, `Executive.cs:482/505/545/634`. Không có chỗ nào khác khởi tạo model ngoài `KpiTargetModel.Empty`.
   - Ranking (`targetCompletion`), mục tiêu lũy kế và heatmap đều lấy từ `SiteRange` / `SelectionRange` / `Daily`, nên cùng một quy tắc.
   - Ngoại lệ hợp lý: `KpiV2EvaluationService` đánh giá một plan so với chính mục tiêu của plan đó, không dùng model này. Đúng chủ ý.
   - Khóa ngày: cột `date`, ngày lịch VN, không chuyển múi giờ, giống `EventDate`. Không phát hiện lệch ngày.
   - Đảo quyền ưu tiên: `DirectDaily` cho site thắng cả campaign. Hợp với "daily wins".
   - Còn vấn đề M1 ở cấp khu vực/công ty.
2. **DI.** `IKpiDailyTargetService : IService`, class public trong namespace `Report.Application.Services`, property injection `Db` và `DashboardV2AccessService`. Cùng quy ước với `IKpiV2EvaluationService`. Controller cũng dùng property injection. `dotnet build Src/WebApi` xanh. Không có chỗ đăng ký thủ công trong repo, việc đăng ký đi qua cơ chế quét `IService` có sẵn của framework. Tôi không khởi động WebApi, nên chưa xác nhận lúc chạy thật, nhưng rủi ro thấp.
3. **Xác nhận từng phần.** Xem M2: chấp nhận được, cần UX cảnh báo.
4. **Plan cũ DTT/AOV.** Xem H1: lọc bỏ chỉ tiêu không hỗ trợ ở Update và Bulk, giữ Create chặt.
5. **Template và import scope.**
   - Template dùng `AllSites ? null : AllowedSiteIds` giống Traffic. Số dòng đúng. Ngày là text. Có giới hạn 3 tháng. Prefill chỉ trong phạm vi.
   - Import: `AllowedSiteIds` được kiểm ở cả Preview và Confirm. Người gọi không thể nhập cho chi nhánh ngoài phạm vi, lỗi "Không có quyền với <tên>".
   - Chưa có test chứng minh (L4).

## 5. Ghi chú UX (tùy chọn)

- Frontend: khi `errors > 0` hiện cảnh báo "N dòng lỗi sẽ không được nhập" bên cạnh nút xác nhận (xem M2).
- Frontend `KpiTable.vue` còn nhãn DTT/Conversion/AOV từ plan cũ. Nên ẩn hoặc ghi "không còn đánh giá", như change log đã nêu.
- Nên thêm sheet `Hướng dẫn` một dòng nhắc "Ngày lễ / ngày đặc biệt: tự chỉnh số" để khớp quyết định không có logic ngày lễ.
