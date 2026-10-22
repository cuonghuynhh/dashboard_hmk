# W9 BE-E: Mục tiêu GMV / Traffic theo ngày của chi nhánh

- Worktree: `dashboard_hmk/wt/api-be-kpi` (report.api), branch `qc/w9-be-kpi`
- Id: BE_E

## 1. Thay đổi chính

### 1.1 Thực thể và migration
- `KpiDailyTarget` (mới): `SiteId`, `Date` (kiểu `date`, ngày lịch VN), `DayType` (`KpiDayTypes`: 1 Trong tuần, 2 Cuối tuần), `GmvTarget` (decimal(18,2), null được), `TrafficTarget` (int, null được), `ImportBatchId`, cùng trường audit của `StrongEntity`.
- Unique index `(SiteId, Date)`; check constraint cho GMV và Traffic >= 0.
- Migration `20261020043128_AddKpiDailyTarget`: chỉ thêm bảng, không đụng dữ liệu cũ. `dotnet ef migrations has-pending-model-changes` báo không có thay đổi chờ.

### 1.2 Mẫu import (một mẫu duy nhất)
- `GET Admin/V2/Import/Kpi/Template?fromMonth=yyyy-MM&toMonth=yyyy-MM` trả xlsx, tên `mau-muc-tieu-chi-nhanh-<from>-<to>.xlsx`.
- Cột: `Chi nhánh | Ngày áp dụng | Loại ngày | Mục tiêu GMV | Mục tiêu Traffic`.
- Dòng = mọi chi nhánh active trong phạm vi người gọi x mọi ngày trong khoảng, sắp theo tên chi nhánh rồi ngày.
- Ngày là chuỗi `DD/MM/YYYY`. Loại ngày tính theo thứ (Thứ 7 / CN = Cuối tuần). GMV và Traffic được điền sẵn nếu đã có bản ghi, định dạng `#,##0`.
- Sheet `Hướng dẫn`. Đóng băng dòng tiêu đề, có auto-filter.
- Giới hạn: `fromMonth` và `toMonth` bắt buộc, from <= to, tối đa 3 tháng (`Chỉ tải mẫu tối đa 3 tháng mỗi lần`).
- Đã xóa: mẫu đa phạm vi cũ và mẫu `storeFormat` (data-store-kpi). Tham số `storeFormat` không còn.

### 1.3 Xem trước / xác nhận
- `POST Admin/V2/Import/Kpi/Preview` (multipart `file`, `fromMonth`, `toMonth`). Token, error file, cancel, history, confirm giữ nguyên quy trình.
- File sai định dạng (không có đủ 5 cột mới) trả: `Chỉ hỗ trợ mẫu mục tiêu theo ngày của chi nhánh. Vui lòng tải mẫu mới.`
- Quy tắc dòng:
  - Chi nhánh: phải resolve được (tên hoặc mã), active và trong phạm vi, nếu không là lỗi.
  - Ngày: `DD/MM/YYYY` hoặc ô ngày Excel; phải nằm trong các tháng đã chọn, nếu không là lỗi.
  - Trùng (chi nhánh, ngày) trong file: lỗi ở mọi dòng trùng.
  - Loại ngày: tính lại theo ngày. Nếu file khác, thêm cảnh báo và dùng giá trị tính.
  - GMV / Traffic: tùy chọn; trống = giữ giá trị hiện có; phải là số >= 0 (Traffic là số nguyên).
  - Cả hai ô trống: dòng bị bỏ qua, cảnh báo `Không có giá trị, bỏ qua`.
- Xác nhận: upsert theo (chi nhánh, ngày) trong một transaction, chỉ ghi các ô không trống, lưu `ImportBatchId`. Kết quả: `Inserted` (thêm mới), `Overwritten` (cập nhật), `Skipped` (dòng lỗi + dòng bỏ qua + dòng không đổi).
- `applyMode` và `conflictPolicy` bị bỏ qua (giữ trong DTO để không đổi contract).

### 1.4 Mục tiêu dùng trong dashboard
- Thứ tự ưu tiên trong `KpiTargetModel.DirectDaily`: nếu có `KpiDailyTarget.GmvTarget` của (chi nhánh, ngày) thì thắng; nếu không thì rơi về phân bổ KPI cũ.
- Điểm áp dụng duy nhất: `KpiTargetLoader.Load` nạp các mục tiêu theo ngày vào `KpiTargetModel`. Mọi nơi dùng loader (ranking, mục tiêu lũy kế, heatmap, branch performance, executive) được hưởng cùng một quy tắc.
- Khu vực / công ty: nếu có chi nhánh bên trong có mục tiêu theo ngày trong ngày đó thì tổng = Σ chi nhánh (không lấy KPI cấp trên). Nếu không thì giữ hành vi cũ.
- Traffic: `KpiDailyTarget.TrafficTarget`, không có fallback.

### 1.5 Heatmap
`HeatmapCellV2Dto` có thêm:
- `trafficTarget` (long?): Σ mục tiêu Traffic theo các ngày có mục tiêu trong bucket; null nếu không có.
- `trafficTargetCompletion` (decimal?, %): Σ Traffic / Σ mục tiêu trên các ngày có cả Traffic lẫn mục tiêu, x 100; null nếu không có ngày nào như vậy (hoặc tổng mục tiêu = 0).
- `hasTrafficTarget` (bool).
- Điền cho ô chi nhánh, khu vực, cụm, tổng và summary. Không bị che theo quyền GMV.

### 1.6 Chỉ còn GMV và Traffic
- `KpiV2PlanValidator.Validate`: mọi chỉ tiêu khác Gmv và Traffic bị từ chối với `Chỉ hỗ trợ Mục tiêu GMV và Mục tiêu Traffic`. Áp dụng khi tạo / sửa KPI.
- Enum không xóa. Dữ liệu cũ trong DB không đổi, không có migration dữ liệu.
- `KpiV2MetricEvaluator.Evaluate`: chỉ GMV và Traffic có giá trị thực tế. DTT, Revenue (cũ), AOV, Conversion, CSAT trả `ActualValue = null`, nên `CompletionRate` cũng null.
- Dashboard / Executive / Operational DTO: không có trường tỷ lệ đạt cho DTT, conversion hay AOV (đã kiểm tra bằng grep), nên không có trường nào phải null hóa thêm.
- Frontend `pos.gui/src/pages/dashboard-v2/components/KpiTable.vue` (chỉ đọc, không sửa) vẫn hiển thị các nhãn "Mục tiêu DTT", "Conversion", "AOV" lấy từ `plan.metrics` cũ. Đây là dữ liệu đã lưu, không còn được tính tỷ lệ đạt, nên cần frontend quyết định có ẩn cột này hay không.

### 1.7 API đọc mục tiêu theo ngày
- `GET Admin/V2/Kpi/DailyTargets?fromDate=yyyy-MM-dd&toDate=yyyy-MM-dd&siteIds=…` (siteIds cách nhau bằng dấu phẩy, tùy chọn).
- Trả `[{ siteId, siteName, date: 'yyyy-MM-dd', dayType: 1|2, gmvTarget, trafficTarget }]`, lọc theo phạm vi người gọi, sắp theo tên chi nhánh rồi ngày.
- Tối đa 93 ngày. Quyền: KpiRead. `gmvTarget` bị che khi không có quyền GMV (thêm `GmvTarget` vào danh sách che).

## 2. Các file

Đã sửa:
- `Src/Domain/DataContext/IApplicationDbContext.cs`, `Src/Infrastructure/DataContext/ApplicationDbContext.DbSet.cs`
- `Src/Infrastructure/Migrations/ApplicationDbContextModelSnapshot.cs`
- `Src/Application/Services/KpiV2/KpiTargetEngine.cs`, `KpiTargetLoader.cs`, `KpiV2Rules.cs`, `KpiV2EvaluationService.cs`
- `Src/Application/Services/Import/KpiImport.cs` (viết lại), `DashboardImportService.cs`
- `Src/Application/Services/DashboardV2/DashboardV2HeatmapBuilder.cs`, `DashboardV2Service.Heatmap.cs`, `DashboardV2ResponsePostProcessor.cs`
- `Src/Application/Dto/Admins/DashboardV2/Executive/HeatmapV2Dto.cs`
- `Src/WebApi/Controllers/Admins/V2/DashboardImportController.cs`, `KpiV2Controller.cs`
- Test: `Tests/Application.Tests/DashboardV2ImportTests.cs`, `KpiV2CrudTests.cs`, `KpiV2EvaluationTests.cs`

Mới:
- `Src/Domain/Entities/KpiDailyTarget.cs`
- `Src/Infrastructure/Migrations/20261020043128_AddKpiDailyTarget.cs` và `.Designer.cs`
- `Src/Application/Services/KpiV2/KpiDailyTargetService.cs`
- `Src/Application/Dto/Admins/KpiV2/KpiDailyTargetDtos.cs`
- `Tests/Application.Tests/KpiDailyTargetTests.cs`

## 3. Quyết định (khi đề bài chưa rõ)
- **Xác nhận từng phần, không tất cả hoặc không.** Mỗi (chi nhánh, ngày) là độc lập, và Traffic đã làm theo cách này. Dòng lỗi bị bỏ qua, dòng hợp lệ vẫn được ghi. Nếu PM muốn "tất cả hoặc không" như import KPI cũ, đây là một chỗ cần đổi.
- **Ô trống của cả hai cột**: bỏ qua với cảnh báo, tính vào `Skipped`.
- **Ghi đè**: chỉ đánh dấu `overwrite` khi có ô không trống và khác giá trị hiện có. Ô trống không xóa giá trị.
- **Khu vực / công ty** được tổng từ chi nhánh khi có một chi nhánh bên trong có mục tiêu theo ngày trong ngày đó. Lý do: mục tiêu theo ngày là số chốt của từng chi nhánh, nên không để KPI khu vực cũ cộng vào làm lệch.
- **Trường DTO giữ lại để không đổi contract**: `DashboardImportPreviewAdminDto.StoreFormat` (luôn false), `Conflicts` (luôn rỗng), `RequiresConflictPolicy` (luôn false), `DashboardKpiImportConfirmAdminDto.ApplyMode/ConflictPolicy` (bị bỏ qua). `Period` của preview = `MM/yyyy - MM/yyyy`.
- **Upload DTO**: `Period` đổi thành `FromMonth` / `ToMonth`.
- **Dữ liệu KPI cũ**: plan cũ (kể cả có DTT, Conversion, AOV) vẫn nằm trong DB. Chúng không còn được đánh giá, nhưng sẽ không sửa được cho đến khi bỏ các chỉ tiêu đó (validator chặn khi sửa).
- **DI**: `KpiDailyTargetService` đăng ký theo quy ước `IService` như các service khác. Chưa kiểm tra bằng cách khởi động WebApi.

## 4. Xác minh
- Build: `dotnet build Tests/Application.Tests/Application.Tests.csproj -v q` → 0 error.
- Baseline trước thay đổi: DashboardV2|KpiV2 532 passed / 2 skipped.
- Sau thay đổi:
  - `--filter "FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2"`: 533 passed / 2 skipped.
  - `--filter "FullyQualifiedName~KpiDailyTarget"`: 7 passed.
  - `--filter "FullyQualifiedName~Golden"`: 15 passed.
- `dotnet ef migrations has-pending-model-changes`: không có thay đổi chờ.
- Test mới:
  - Mẫu: số dòng = chi nhánh x ngày, ngày dạng text, loại ngày cuối tuần, điền sẵn, giới hạn 3 tháng, thứ tự tháng.
  - Import: định dạng cũ bị từ chối, từng quy tắc dòng, error file, blank giữ giá trị, upsert và đếm kết quả.
  - Resolver: daily thắng plan, rơi về plan, khu vực tổng từ chi nhánh, loader nạp đúng từ DB.
  - Heatmap: trafficTarget, completion chỉ tính ngày có cả hai, tổng theo bucket.
  - Validator từ chối DTT / Conversion / AOV; evaluator không đánh giá DTT / AOV / CSAT / Conversion.
- Test cũ được cập nhật (giữ ý định): `KpiV2EvaluationTests` (DTT/AOV/CSAT không còn đánh giá), `KpiV2CrudTests` (chỉ GMV và Traffic được phép), `DashboardV2ImportTests` (hai test KPI cũ thay bằng test định dạng theo ngày). Không xóa test nào.

## 5. Chưa làm / ngoài phạm vi
- Không sửa frontend (`pos.gui`), chỉ đọc để kiểm tra. Xem mục 1.6 về nhãn DTT/Conversion/AOV.
- Không chạy WebApi để kiểm tra DI và endpoint end-to-end; đã kiểm tra bằng build, test đơn vị và test với in-memory DB.
- Không có migration dữ liệu cho plan cũ (theo đề bài).

---

## Vòng sửa 1 (theo QC `W9_QC_BE_E_r1.md`)

Commit: xem `git log` của `qc/w9-be-kpi` (commit sửa vòng 1 nằm sau `74383b7`).

### H1. KPI cũ có DTT / AOV / Conversion
- Create vẫn chặt: chỉ nhận Gmv và Traffic.
- Update và Bulk: bỏ im lặng chỉ tiêu không hỗ trợ trước khi validate (`KpiV2PlanValidator.StripUnsupportedMetrics`). Phiên bản mới chỉ có Gmv / Traffic; phiên bản cũ giữ nguyên lịch sử.
- Bỏ câu "dùng Gmv hoặc Dtt" ở `ValidateMetric` (còn "Chỉ tiêu Revenue không còn dùng").
- Test `KpiV2LegacyPlanTests`: update plan có `[Gmv, Dtt, Aov]` thành công, phiên bản 2 chỉ có Gmv, phiên bản 1 còn 3 chỉ tiêu; bulk trên plan cũ thành công (chỉ Gmv được đổi); Create vẫn từ chối DTT.
- Lỗi phát hiện khi viết test (sửa luôn, cùng nguyên nhân với H1): Update và Bulk gắn phiên bản mới và các chỉ tiêu mới qua navigation của plan đang theo dõi, và gán lại `plan.Scopes`. EF coi các thực thể mới có khóa gán sẵn là đã tồn tại (Modified), rồi báo `DbUpdateConcurrencyException`. Đây là lỗi chung của mọi lần sửa KPI, không riêng KPI cũ. Sửa: thêm tường minh `Db.KpiPlanVersion.Add`, `Db.KpiMetricTarget.AddRange`, `Db.KpiPlanScope.AddRange`; scope xóa bằng `RemoveRange(plan.Scopes.ToList())` rồi thay bằng `Clear()` + `Add`, không gán lại collection.

### M1. Khu vực / công ty tụt khi chỉ nhập một phần chi nhánh
- Quy tắc mới (`KpiTargetModel.CoveredByBranches`): chỉ cộng các chi nhánh khi (a) có ít nhất một chi nhánh có mục tiêu theo ngày và (b) mọi chi nhánh trong phạm vi đều có số ngày đó (theo ngày hoặc KPI chi nhánh). Ngược lại giữ KPI khu vực / công ty như cũ.
- Test: `TargetModel_RegionKeepsRegionPlanWhenNotEveryBranchHasAValue`, `TargetModel_RegionSumsBranchesWhenEveryBranchHasAValueOnTheDay`, `TargetModel_CompanySumsOnlyWhenEveryBranchIsCovered` (cả hai trường hợp, khu vực và công ty).

### M2. Xác nhận từng phần
- Giữ nguyên (partial). Phía frontend cần hiển thị "N dòng lỗi sẽ không được nhập" trước khi xác nhận; backend đã trả đúng `Skipped`.

### L1. Giá trị tràn
- `KpiImport.Evaluate`: Traffic > 2.147.483.647 và GMV >= 10^16 là lỗi dòng "Giá trị quá lớn ...".
- Test: `KpiImport_RevivesSoftDeletedRowAndRejectsOversizedValues` (GMV 100000000000000000000 và Traffic 3.000.000.000 bị từ chối).

### L2. Xóa mềm nhất quán
- Có `WhereNotDeleted` ở `KpiDailyTargetService`, truy vấn Traffic của heatmap, và `LoadKpiDailyValues` (prefill mẫu, đánh dấu ghi đè).
- Xác nhận import: truy vấn tìm dòng hiện có KHÔNG lọc xóa mềm, để không insert trùng khóa unique. Nếu dòng đã xóa mềm: khôi phục (`DeleteAt = null`), ghi đúng giá trị của file, đếm vào `Overwritten`.
- Test: `KpiImport_RevivesSoftDeletedRowAndRejectsOversizedValues`.

### L3. Thiếu tham số tháng
- `fromMonth` / `toMonth` là `string?` ở controller, service và interface. Thiếu tham số trả "Chọn tháng bắt đầu và tháng kết thúc".
- Test: `KpiTemplate_MissingMonthParametersReturnVietnameseMessage`.

### T1. Test phạm vi và giới hạn (MANAGER)
- Lưu ý: nhập / tải mẫu KPI yêu cầu quyền ghi KPI (`KpiWrite`), và vai trò MANAGER mặc định không có quyền này. Test dùng vai trò MANAGER có `KpiWrite` và chỉ được một chi nhánh (CN-A) để kiểm phạm vi.
- `KpiScope_ManagerWithKpiWriteSeesOnlyItsBranch`: mẫu chỉ có chi nhánh A (32 dòng); preview dòng CN-B bị lỗi "Không có quyền với CN-B"; xác nhận chỉ ghi A.
- `KpiScope_DailyTargetsAreScopedToCaller`: DailyTargets chỉ trả chi nhánh A; `siteIds` = B trả rỗng.
- `KpiDailyTargets_RangeLimitsParametersAndGmvMasking`: 93 ngày được phép, 94 ngày bị từ chối; toDate < fromDate, siteIds sai, ngày sai định dạng bị từ chối; `gmvTarget` bị che khi không có quyền GMV, `trafficTarget` giữ nguyên.

### Xác minh (chỉ dùng filter)
- Build `Tests/Application.Tests`: 0 error. Build `Src/WebApi`: 0 error, 0 warning.
- `FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2`: 541 passed / 2 skipped / 0 failed.
- `FullyQualifiedName~Golden`: 15 / 15.
- `FullyQualifiedName~KpiDailyTarget`: 10 / 10.
- `dotnet ef migrations has-pending-model-changes`: không có thay đổi chờ.
- Không xóa test nào. Test mới: `KpiV2LegacyPlanTests.cs` (3); bổ sung trong `DashboardV2ImportTests.cs`, `KpiDailyTargetTests.cs`.

### Thay đổi file (vòng 1)
- Sửa: `KpiV2Rules.cs`, `KpiV2Service.cs`, `KpiV2Service.Bulk.cs`, `KpiTargetEngine.cs`, `KpiImport.cs`, `DashboardImportService.cs`, `DashboardImportController.cs`, `KpiDailyTargetService.cs`, `DashboardV2Service.Heatmap.cs`.
- Test: `DashboardV2ImportTests.cs`, `KpiDailyTargetTests.cs`; mới: `KpiV2LegacyPlanTests.cs`.

### Chưa làm
- Frontend (`KpiTable.vue`, cảnh báo dòng lỗi trước khi xác nhận) và sheet `Hướng dẫn` nhắc ngày lễ: ngoài phạm vi BE, để PM / FE.
