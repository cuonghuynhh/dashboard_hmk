# QC W9 BE_E (vòng 2): Mục tiêu GMV / Traffic theo ngày của chi nhánh

Worktree `wt/api-be-kpi` (branch `qc/w9-be-kpi`), base `075eac1`, commit sửa `5409db6` (sau `74383b7`).

## 1. Kết luận: ĐẠT

Mọi lỗi vòng 1 (H1, M1, L1, L2, L3, L4/T1) đã được sửa đúng quyết định của lead; M2 giữ partial. Không có lỗi Cao hay Trung bình mới. Còn 3 điểm Thấp (thiếu test cho thay đổi persistence, lệch số liệu preview/confirm với dòng xóa mềm, rủi ro chưa kiểm trên Postgres).

Số liệu tự chạy (chỉ dùng filter, tuần tự):
- `dotnet build Tests/Application.Tests`: 0 error (608 warning analyzer có sẵn).
- Filter `DashboardV2|KpiV2`: 541 passed / 2 skipped / 0 failed (khớp change log; vòng 1 là 533).
- Filter `Golden`: 15/15.
- Filter `KpiDailyTarget`: 10/10.
- Không chạy lại `has-pending-model-changes` (vòng 2 không đổi entity/migration; diff `74383b7..HEAD` chỉ gồm Services, Controller và Tests).

## 2. Bảng kiểm các lỗi vòng 1 và quyết định của lead

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| H1: Update/Bulk bỏ im lặng chỉ tiêu không hỗ trợ, Create vẫn chặt | Đạt | `KpiV2PlanValidator.StripUnsupportedMetrics` (`KpiV2Rules.cs`). Gọi ở `KpiV2Service.Update` ngay trước `Validate`, và ở `KpiV2Service.Bulk.cs` trước `Validate`. `Create` (`BuildNewPlan`) không strip nên vẫn bị validator từ chối. Test `UpdateLegacyPlanWithDttAndAovStripsUnsupportedMetricsInNewVersion` (v2 chỉ còn Gmv, v1 còn đủ 3), `BulkUpdateLegacyPlanWithDttAndAovSucceedsAndKeepsOnlyGmv` (1000 -> 1100), `CreateStillRejectsDttMetric`. Thông báo "dùng Gmv hoặc Dtt" đã dọn. |
| M1: khu vực/công ty = Σ chi nhánh chỉ khi mọi chi nhánh có số | Đạt | `KpiTargetModel.CoveredByBranches` (`KpiTargetEngine.cs:~208`): cần ít nhất một chi nhánh có số theo ngày và `sites.All(DirectDaily(Site).HasValue)`; ngược lại giữ KPI cấp trên. Ba test `TargetModel_Region...` và `TargetModel_CompanySumsOnlyWhenEveryBranchIsCovered`. Mọi nhánh trong `Daily` còn lại không đổi. |
| Range check (Traffic > int.MaxValue, GMV >= 1e16) | Đạt | `KpiImport.Evaluate`: lỗi dòng "Giá trị quá lớn". `MaxGmv = 10^16` khớp numeric(18,2). Test `KpiImport_RevivesSoftDeletedRowAndRejectsOversizedValues`. |
| Soft-delete nhất quán | Đạt | `WhereNotDeleted()` thêm ở `KpiDailyTargetService`, heatmap traffic, `LoadKpiDailyValues`. Confirm cố ý không lọc để không vi phạm unique, và khôi phục dòng xóa mềm (`DeleteAt = null`, ghi đúng giá trị file, tính vào `Overwritten`). Logic đúng; xem L2. |
| Tham số tháng nullable | Đạt | Controller, interface và service đều `string?`; `ParseMonthRange` ném thông báo Việt. Test `KpiTemplate_MissingMonthParametersReturnVietnameseMessage`. |
| Test phạm vi / giới hạn / che GMV | Đạt | `KpiScope_ManagerWithKpiWriteSeesOnlyItsBranch`, `KpiScope_DailyTargetsAreScopedToCaller`, `KpiDailyTargets_RangeLimitsParametersAndGmvMasking` (93 ngày được, 94 bị từ chối). |
| M2: giữ partial | Đạt | Không đổi; ghi chú FE cần cảnh báo dòng lỗi. |
| Không xóa/làm yếu test | Đạt | Chỉ thêm test. |

## 3. Review thay đổi persistence của Update/Bulk (thay đổi production)

Nguyên nhân gốc mà worker mô tả là hợp lý: `CreateVersion` gán sẵn `Guid.NewGuid()` cho version và metric; thêm qua navigation của plan đang được theo dõi thì EF coi thực thể có khóa gán sẵn là Modified và SaveChanges báo `DbUpdateConcurrencyException`. Cách sửa là mẫu chuẩn.

Đã kiểm:
- `Update`: `plan.Versions.Add(version)` kèm `Db.KpiPlanVersion.Add(version)` và `Db.KpiMetricTarget.AddRange(version.MetricTargets)`. Metric mang `KpiPlanId` và `KpiPlanVersionId` nên fixup vẫn đưa chúng vào `plan.MetricTargets` và `version.MetricTargets`. Việc bỏ `plan.MetricTargets.AddRange` không làm mất dữ liệu: `ToDto` và `FindActiveConflicts` đọc từ `Versions` và `GetCurrentContent`, đều đã có version mới.
- Scope: `RemoveRange(plan.Scopes.ToList())`, `Clear()`, rồi thêm scope mới có `KpiPlanId` kèm `Db.KpiPlanScope.AddRange`. Không còn gán lại collection. Không có interceptor xóa mềm cho entity này (không tìm thấy `EntityState.Deleted` trong `Src`), tức là xóa cứng như trước; hành vi xóa rồi thêm cùng khóa unique `(KpiPlanId, ScopeType, EntityId)` giống trước khi sửa.
- `ToDto(plan, LoadScopeNames(plan.Scopes))` dùng danh sách scope mới, đúng.
- Bulk nằm trong `ExecuteInTransaction`; chỉ thêm `Db.KpiPlanVersion.Add` và `AddRange`, scope không đổi.
- Create không đụng tới (vẫn `Db.KpiPlan.Add(plan)` đồ thị mới, nên khóa gán sẵn là Added, đúng).
- Không thấy hồi quy: `KpiV2*` 541 test xanh, gồm cả test Update/Bulk hiện có.

## 4. Lỗi phát hiện

### Cao
Không có.

### Trung bình
Không có.

### Thấp

**L1. Thiếu test cho phần persistence vừa đổi.**
- Hai test legacy chỉ chạy Update với scope giữ nguyên và plan Draft, trên provider InMemory. Chưa có test: (a) Update đổi scope (thêm/bớt) rồi đọc lại bằng context mới; (b) Update trên plan Active (đường `FindActiveConflicts` sau khi thêm version); (c) Update/Bulk giữ chỉ tiêu Traffic (chỉ kiểm Gmv).
- InMemory không thực thi unique index nên không chứng minh được thứ tự xóa/chèn scope cùng khóa trên Postgres. Rủi ro thấp vì EF Core sắp xếp xóa trước chèn khi có unique index, và hành vi này giống trước khi sửa. Đề nghị thêm test (a), (b), (c) với InMemory và một lần chạy tay trên Postgres cục bộ nếu có.

**L2. Preview và Confirm lệch số với dòng xóa mềm.**
- Preview (`LoadKpiDailyValues` có `WhereNotDeleted`) coi dòng xóa mềm là "mới"; Confirm khôi phục và đếm vào `Overwritten`. Hiện chưa có đường xóa mềm nên chưa xảy ra. Nếu muốn nhất quán, chấp nhận như hiện tại và ghi chú; không cần sửa gấp.

**L3. Trạng thái "khôi phục" ghi đè cả ô trống.**
- Khi khôi phục dòng xóa mềm, ô trống trong file đặt giá trị về null (không giữ giá trị cũ). Đây là chủ ý đã ghi trong comment và change log (giá trị cũ đã xóa không còn hiệu lực), chỉ nêu để lead biết; không cần sửa.

## 5. Ghi chú UX (tùy chọn)
- Vẫn nên có FE: cảnh báo "N dòng lỗi sẽ không được nhập" trước khi xác nhận, và ẩn nhãn DTT/Conversion/AOV của KPI cũ. Đã ghi "Chưa làm" trong change log (ngoài phạm vi BE).
