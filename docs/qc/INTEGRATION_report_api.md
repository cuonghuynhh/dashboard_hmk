# INTEGRATION — report.api: hợp nhất wave 2a (mô hình doanh thu) + wave 3a (RBAC)

Nhánh `qc/dashboard-v2` = `qc/dashboard-v2-wave2` + merge `--no-ff` `qc/dashboard-v2-wave3-rbac`. Chỉ commit local, chưa push.

## 1. Xung đột và cách giải quyết

| File | Xung đột | Cách giải quyết |
|---|---|---|
| `ExecutiveDashboardV2Dto.cs` | Ranking item/total: wave 2a thêm `ReturnRate`, `Target`, `TargetCompletion`, `OrderCount`; RBAC đổi `ContributionRate` thành `decimal?` | Giữ toàn bộ trường wave 2a, `ContributionRate` là `decimal?`. Phần auto-merge: các trường GMV/`Rank` nullable của RBAC + trường mới của 2a. `VatAmount` đổi sang `decimal?` (xem mục 2) |
| `DashboardV2Appsetting.cs` (add/add) | 2a thêm `PaymentTypeMapping`, RBAC thêm `LegacyScopeMapping` | Giữ cả hai trong cùng một lớp (mặc định `LegacyScopeMapping=true`) |
| `DashboardV2Service.Executive.cs` | Auto-merge không xung đột; đã kiểm `QueryExecutiveSites` | Có giao với `GetAllowedSiteIds()` (RBAC) và KHÔNG còn lọc `State == Active` (quyết định A8). Công thức 2a giữ nguyên |
| `ReportService.DashboardV2.OrderAging.cs` | Auto-merge | Giữ tham số `allowedSiteIds` của `BuildAuthorizedSiteIdQuery` |
| `DashboardV2ContractTests`, `DashboardV2PermissionTests` | Auto-merge | Giữ chuỗi scope `manager.dashboard.read` của RBAC |
| `DashboardV2GoldenDatasetTests.cs` | Lỗi biên dịch sau merge: `ContributionRate` giờ nullable | Dùng `.ContributionRate!.Value` |
| Migration / `ApplicationDbContextModelSnapshot` | RBAC không đổi entity, DbContext hay migration (đã kiểm bằng diff từ merge-base) | Migration 2a áp dụng nguyên vẹn. `dotnet ef` không cài trong máy nên không chạy `has-pending-model-changes`; thay bằng build + test migration/golden |

## 2. Danh sách trường bị che cuối cùng (thiếu `gmv.read` => `null` + `gmvHidden=true`)

Một danh sách duy nhất `DashboardV2ResponsePostProcessor.MaskedProperties` (che theo tên, mọi DTO phản hồi), cộng `MaskedPropertiesByType`:

- GMV: `GmvWithVat`, `GmvWithoutVat`, `DirectGmvWithVat`, `DirectGmvWithoutVat`, `PreOrderGmvWithVat`, `PreOrderGmvWithoutVat`, `CumulativeGmvWithVat`, `Gmv` (BranchPerformanceItemV2Dto, dùng cho TopBranches và BranchPerformance).
- Tỷ trọng GMV: `PreOrderGmvShare`, `DirectGmvShare`.
- Bí danh: `GrossSales`, `GrossSalesWithVat`, `GrossSalesWithoutVat`.
- Thành phần điều chỉnh (suy ra GMV khi DTT hiển thị): `AdjustmentWithVat`, `AdjustmentWithoutVat`, `ReturnAdjustmentWithVat`, `ExchangeAdjustmentWithVat`, `PreOrderCancelAdjustmentWithVat`.
- Tỷ lệ mẫu số GMV: `ReturnRate` (KPI, kỳ trước, ranking item/total, branch performance), `ExchangeRate`, `PreOrderCancelRate`, `OutstandingDebtShareOfGmv`.
- `VatAmount` (M01a, VAT của đơn thuộc GMV; đổi `decimal` -> `decimal?` ở `ExecutiveKpiSummaryV2Dto` và `ExecutivePreviousPeriodV2Dto`).
- Riêng `ExecutiveRankingItemV2Dto`: `Rank`, `DropRate`, `ContributionRate`; `ExecutiveRankingTotalV2Dto`: `DropRate`, `ContributionRate`.
- Trend: GMV, Direct/PreOrder GMV, cumulative GMV, 3 thành phần điều chỉnh, `AdjustmentWithVat`.

Không che: doanh thu thuần (M06), AOV, số đơn, đơn gộp, số phiếu/đơn trả/đổi/hủy, UPT, `UnitCount`, thu tiền (M04), nợ treo (M10 `OutstandingDebt`), `ReturnInvoiceRate` (M13, theo số đơn), `Target`, `TargetCompletion`, `GrowthRate`, `GrossMarginRate`, Traffic/Conversion.

## 3. Kết quả test

- Build: 0 lỗi, 236 cảnh báo (chủ yếu StyleCop/analyzer, đã có từ trước).
- `FullyQualifiedName~DashboardV2|FullyQualifiedName~KpiV2`: 438 pass, 0 fail, 2 skip (Postgres).
- `Golden`, `Rbac`, `Migration`: 65 pass, 0 fail.
- Toàn project (loại `SyncResponseRateIntegrationTest`, `*LocalParallelScript*`, `*LocalBackfill*`, `*ParallelBackfillScript*`): 477 pass, 0 fail, 2 skip.
- Test mới/mở rộng: `DashboardV2RbacTests` (che các trường 2a, kiểm tra các trường không che, `TopBranches.Gmv`, ranking `ReturnRate`; test phản chiếu nullable tự bao phủ `VatAmount`, `Gmv`...).

## 4. Rủi ro hành vi sau merge

1. `TargetCompletion` (M16 = GMV / mục tiêu) và `Target` KHÔNG che theo yêu cầu: người không có quyền GMV có thể suy GMV = `Target` x `TargetCompletion` / 100. Cần PM xác nhận chấp nhận, hoặc che `TargetCompletion` ở ranking/KPI.
2. Thứ tự `TopBranches`/BranchPerformance vẫn sắp theo GMV (`OrderByDescending(x => x.Gmv)`) nên lộ thứ hạng tương đối dù `Gmv` null. Ranking đã che `Rank` nhưng thứ tự danh sách vẫn theo GMV.
3. `GrowthRate` tính trên DTT, không che; nếu về sau đổi sang cơ sở GMV phải thêm vào danh sách.
4. Mọi `ReturnRate` bị che theo tên toàn cục: nếu DTO mới có `ReturnRate` với mẫu số khác GMV cũng sẽ bị che.
5. Khối RLS bỏ lọc Active (A8): MANAGER/STAFF thấy cả chi nhánh đã đóng nếu được gán; BOD tính cả chi nhánh đã đóng vào tổng.
6. Giữ nguyên các rủi ro của RBAC: scope `dashboard-v2.*` chưa được Identity cấp, BOD legacy sẽ thấy GMV null cho tới khi cấp `gmv.read`; Traffic/KPI theo `AccountId` với MANAGER.
7. Chưa kiểm chứng trên Postgres thật (test tích hợp bị skip) và chưa chạy `dotnet ef has-pending-model-changes`.
