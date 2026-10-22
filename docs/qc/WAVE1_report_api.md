# WAVE 1 — report.api (Dashboard V2 backend)

- Repo: `report.api`, nhánh local `qc/dashboard-v2-wave1` (tạo từ `origin/main` @ `c6f2324`). **Chưa push.**
- Phạm vi: chỉ các thay đổi không cần quyết định nghiệp vụ, không migration, không backfill. Đối chiếu `PRODUCT_SPEC_DASHBOARD.md`, QC_A, QC_B.
- Quy ước "trạng thái không khả dụng / chưa đồng bộ": **không có giá trị enum mới**. Dùng cơ chế sẵn có của block: `DataStatus = partial`, `MockFields = [<tên trường thiếu>]`, `DataAsOf = null`. Giá trị `mock` của `DashboardV2DataStatus` vẫn còn trong enum (để không vỡ hợp đồng) nhưng **backend không còn phát ra** `mock` ở bất kỳ đâu.

## 1. Commit

| # | Commit | Nội dung |
|---|--------|----------|
| 1 | `dashboard-v2: mark PreOrderFact and CustomerFirstPurchaseFact in production sync state` | Mục 1 |
| 2 | `dashboard-v2: remove fixture and demo data from Operational and Personnel responses` | Mục 2 |
| 3 | `dashboard-v2: return null growth when the comparison denominator is zero or negative` | Mục 3 |
| 4 | `dashboard-v2: return null target and null achievement when no target exists` | Mục 4 |
| 5 | `dashboard-v2: anomaly detection with 7-day sample-sigma window and k=2` | Mục 5 |
| 6 | `dashboard-v2: five basket buckets (QD-06) and spec demographic age groups` | Mục 6 |
| 7 | `dashboard-v2: M14 conversion over branch-days with traffic only ...; filter payment methods before grouping` | Mục 7 + 8 (gộp 1 commit vì cùng file) |

## 2. Chi tiết từng mục

### Mục 1 — Sync state (QC_A F1)
- **Spec**: INV dữ liệu/độ tươi (data status live/partial), liên quan 0.3 và 3.4.
- **Thay đổi**: đường Hangfire `RunDashboardStatisticsSync` giờ ghi `ReportStatisticSyncState` cho 4 dataset: `OrderFact`, `PaymentFact`, `PreOrderFact`, `CustomerFirstPurchaseFact` (danh sách tập trung ở `DashboardV2SyncStatePolicy.ProductionSyncDatasets`, upsert qua `MarkDashboardV2DatasetCompleted`: SingleOrDefault + Add nên idempotent, mỗi dataset đúng 1 dòng). Trước đây thiếu 2 dataset sau nên KPI/Trend luôn "partial" trên production.
- **File**: `Src/Application/Services/Report/ReportService.DashboardV2.Sync.cs`.
- **Test**: thêm `DashboardV2PaymentSyncTests.ProductionSyncMarksAllFourFactDatasetsIdempotently`. (Không có DB test nên kiểm tra bằng danh sách dataset + mã nguồn; test tích hợp Postgres đang bị skip như baseline.)

### Mục 2 — Bỏ mock/fixture (BR-DATA-01, §0.3, QĐ-08, QĐ-13)
- **Đã xóa**: fixture Campaign; fallback Conversion (Visit 1000 / Consultation 420 / Order 210); nhân viên demo (`DEMO001..`) khi leaderboard rỗng và scorecard demo; fixture `WeeklyKpi`, `Gamification`, `Refractionist`, `Lab`; `PersonnelPerformanceFixtures`; hằng `MockVersion`, `PersonnelMockVersion`.
- **Thay bằng**: collection rỗng + `partial` + `MockFields` + `DataAsOf = null` (`DashboardV2DataAvailability.Unavailable(...)`, `EmptyOperational()`, `EmptyPersonnel()`, `UnavailableVersion = "dashboard-v2-unavailable"`).
- **File**: `DashboardV2DataAvailability.cs`, `DashboardV2Service.Operational.cs`, `DashboardV2Service.Personnel.cs`, `Dto/.../Personnel/PersonnelDashboardV2Dto.cs`.
- **Test**: cập nhật `DashboardV2PersonnelTests`, `DashboardV2DataAvailabilityTests`; xóa test cũ `PersonnelDemoFixturesMatchTheReferenceDashboard`; thêm `ForbiddenPersonnelBlocksAreObsoleteAndAlwaysEmpty`.

### Mục 3 — Tăng trưởng, mẫu số ≤ 0 → null (BR-CMP-04)
- Helper duy nhất `DashboardV2FormulaCatalog.GrowthRate` (và `CalculateGrowthRate` trỏ vào nó): `previous <= 0` → `null`. Trước đây `0 → 0 = 0%`, và Product thay `null` bằng `0`.
- Áp dụng: Executive KPI `GrowthRate`, BranchPerformance `GrowthRate`, Product growth (category, brand, timeline). Personnel không tính tăng trưởng.
- Ngoại lệ có chủ ý: `CalculateSignedAdjustmentTrend` (dùng `|mẫu số|`, đang không được gọi ở production, có test riêng cho số âm) giữ nguyên, chờ quyết định ở wave 2 cùng mô hình điều chỉnh.
- **File**: `DashboardV2FormulaCatalog.cs`, `DashboardV2Service.Executive.cs`, `DashboardV2Service.Product.cs`, `ProductDashboardV2Dto.cs`, `BranchPerformanceV2Dto.cs`.
- **Test**: thêm theory `GrowthRateIsNullWhenDenominatorIsZeroOrNegative`, `GrowthRateIsComputedForPositiveDenominator`, `GrowthIsNullWhenThePreviousPeriodHasNoValue`; sửa `KpiCardsHandleZeroDenominators...` (0 → null).

### Mục 4 — Không có mục tiêu → null (BR-TGT-05)
- `ExecutiveCalculator.CalculateTarget` trả `decimal?` (null khi không có dòng SaleTarget nào áp dụng cho ngày nào trong kỳ); helper `SumTargets` (null nếu mọi chi nhánh đều null); helper `TargetAchievement(actual, target)` → null khi target null hoặc ≤ 0.
- Áp dụng: Executive KPI (`Target`, `TargetCompletion`), Trend (`Target`, `CumulativeTarget`, `TargetCompletion`; cumulative chỉ bắt đầu cộng khi có mục tiêu), BranchPerformance (`Target`, `TargetCompletion`).
- Heatmap (`ReportService.BranchPerformanceHeatmap.cs`) **đã** trả null cho target/score khi không có mục tiêu hoặc =0, không cần sửa. Ranking Executive không có trường mục tiêu.
- Nguồn mục tiêu vẫn là `SaleTarget` (chưa đụng KpiV2, chờ wave 3).
- **Test**: `KpiWithoutTargetReturnsNullTargetAndNullAchievement`, `BranchWithoutTargetReturnsNullTargetAndNullAchievement`, `TargetIsNullWhenNoRuleAppliesToAnyDay`, `TrendWithoutTargetKeepsTargetFieldsNull`, `TargetAchievementAndSumHelpersTreatMissingTargetsAsNull`; cập nhật `DashboardV2ContractTests` (kiểu `decimal?`).

### Mục 5 — Phát hiện bất thường (FR-OP-08)
- `AnomalyBand`: MA và σ **mẫu** (n−1) trên **đúng 7 ngày trước đó, không gồm ngày đang xét**; bất thường khi `|giá trị − MA| > k·σ`, `k = DefaultAnomalySigmaMultiplier = 2` (hằng số, tham số hàm). **Bỏ hoàn toàn `fixedMargin`** (đệm cố định) và việc cắt dải dưới ở 0. `AnomalyWindowSize` 5 → 7.
- Ngày có < 7 ngày lịch sử: không đánh giá (`IsEvaluated = false`, `IsAnomaly = false`).
- Truy vấn lấy thêm 7 ngày trước `StartAt`; chuỗi được điền ngày thiếu = 0 (`FillMissingDays`) để cửa sổ luôn là 7 ngày lịch; chỉ trả các ngày thuộc khoảng lọc. Chỉ số vẫn là `PaidAmount` như cũ (đổi chỉ số DTT/Số đơn/Tỷ lệ trả hàng thuộc wave sau).
- **File**: `DashboardV2FormulaCatalog.cs`, `DashboardV2Service.Operational.cs`, `OperationalDashboardV2Dto.cs`.
- **Test**: `AnomalySpecExampleFlagsEighthDay` (AC-OP08-01: [100,102,98,101,99,100,103] rồi 130 → bất thường), `AnomalyIsDeterministicAcrossRuns` (AC-OP08-02), `AnomalyHistoryBeforeTheRangeStartIsUsedButNotReturned`, `AnomalyExcludesTheEvaluatedDayFromItsOwnStatistics`, `FillMissingDaysTreatsDaysWithoutOrdersAsZero`, `AnomalyBand*` (σ mẫu, ngưỡng chặt, <7 ngày, cửa sổ). Xóa 2 test cũ theo thuật toán MA5/σ tổng thể.
- Lưu ý: `SettingCodes.DashboardV2AnomalyFixedMargin` (seed trong migration cũ) giữ nguyên nhưng không còn được dùng.

### Mục 6 — Bucket
- Giỏ hàng: 5 bucket **< 0,5 Tr · 0,5–1 Tr · 1–3 Tr · 3–5 Tr · ≥ 5 Tr**, nửa mở [a, b) (cả hàm `BasketBucket` lẫn truy vấn SQL; trước đây `<= 3 Tr`). `BasketUpperBounds = [0,5; 1; 3; 5] Tr`. Vẫn tính trên `NetRevenueNoVat` (chuyển GMV là wave 2).
- Nhân khẩu học: nhóm tuổi `<25`, `25-34`, `35-49`, `>=50`, `Unknown` (ngày sinh thiếu, trong tương lai, hoặc trước năm 1900). Sắp xếp theo thứ tự hiển thị. Calculator dùng chung `DashboardV2FormulaCatalog.AgeGroup` (trước đây hai bảng nhóm tuổi khác nhau).
- **File**: `DashboardV2Enums.cs`, `DashboardV2DataAvailability.cs`, `DashboardV2FormulaCatalog.cs`, `DashboardV2Service.Operational.cs`.
- **Test**: `BasketBucketsUseHalfOpenIntervalsWithFiveBuckets`, `AgeGroupsUseTheSpecBoundariesAndMarkInvalidBirthDatesUnknown`, `BasketUsesFiveHalfOpenBucketsAndAggregatesCountAndValue`, `DemographicsGroupBySpecAgeGroupsInDisplayOrder`; cập nhật test cũ.

### Mục 7 — Tỷ lệ chuyển đổi M14 (§3.3)
- Hàm mới `DashboardV2OperationalCalculator.BuildConversion`: chỉ tính trên cặp (chi nhánh, ngày) **có Traffic > 0**; cặp không có Traffic bị loại khỏi cả tử và mẫu; trả số cặp thiếu Traffic; chi nhánh không có ngày nào có Traffic → `ConversionRate = null`.
- Block `ConversionRate`: không còn fixture. Khi không có Traffic: `Items = []`, `ConversionRate = null`, `partial` + `MockFields = ["Traffic"]`.
- Benchmark khu vực (`Traffic`, `Conversion` mỗi chi nhánh) dùng cùng quy tắc (đơn theo ngày từ `ReportOrder`).
- Ngân sách truy vấn của `Operational` tăng 9 → 12 `ToListAsync` (đọc Traffic và đơn theo ngày thay cho 2 truy vấn tổng hợp vô hướng); đã cập nhật `DashboardV2QueryPerformanceTests`.
- Chưa tách kênh cửa hàng/online: hệ thống chưa có trường kênh trên Traffic/đơn (chờ quyết định ở wave sau).
- **Test**: 5 test mới trong `DashboardV2ConversionTests`.

### Mục 8 — Hình thức thanh toán
- `BuildPaymentMethods` đã lọc `CompleteAt != null && CancelAt == null && Amount > 0`. Bổ sung lọc **trước khi group** ở truy vấn: `PaymentTypeCode == "CUSTOMERPAID"` và `ActualAmount > 0`. Bảng `ReportPaymentStatistic` không có cột `CancelAt`; đường sync chỉ ghi phiếu hoàn tất và chưa hủy (đã có test cũ). Danh sách nhóm (Tiền mặt/Chuyển khoản/Thẻ/Khác) **không đổi**.
- **Test**: `PaymentMethodsIgnoreCancelledUncompletedNonCustomerAndNonPositivePayments`, `PaymentMethodsAreFilteredBeforeGroupingInTheQuery`.

## 3. THAY ĐỔI HỢP ĐỒNG API (frontend cần xử lý)

Tất cả URL, tên trường hiện có giữ nguyên. Các trường dưới đây thay đổi **kiểu nullable** hoặc **giá trị**; trường mới đều tùy chọn.

**Nullable mới (trước đây luôn có số):**
| Endpoint / DTO | Trường | Khi nào null |
|---|---|---|
| Executive KPI (`ExecutiveKpiSummaryV2Dto`) | `Target`, `TargetCompletion` | Chưa có mục tiêu (BR-TGT-05) → UI hiện "Chưa thiết lập mục tiêu" |
| Executive KPI | `GrowthRate` (đã nullable) | Nay null cả khi kỳ trước = 0 (trước là 0%) |
| Executive Trend (`ExecutiveTrendPointV2Dto`) | `Target`, `CumulativeTarget`, `TargetCompletion` | Chưa có mục tiêu |
| BranchPerformance item | `Target`, `TargetCompletion`, `GrowthRate` | Chưa có mục tiêu / kỳ trước ≤ 0 |
| Product growth item và timeline point | `RevenueGrowthRate`, `QuantityGrowthRate` | Kỳ trước ≤ 0; hoặc không chọn so sánh (trước là 0) |
| Operational Anomaly point | `MovingAverage`, `ZScore` | Ngày chưa đủ 7 ngày lịch sử; `ZScore` còn null khi σ = 0 |

**Trường mới (tùy chọn):**
- `AnomalyPointV2Dto`: `IsEvaluated` (bool), `StandardDeviation`, `LowerBound`, `UpperBound` (double?). Điểm `IsEvaluated=false` không vẽ dải/MA và không bao giờ bị tô đỏ. Số điểm trả về vẫn là các ngày trong khoảng lọc.
- `OperationalMockDataV2Dto` (dùng cho block `ConversionRate`): `ConversionRate` (decimal?, tổng M14), `MissingTrafficDayCount`, `TrafficDayCount` (int?), `Sites` (list `ConversionSiteV2Dto`: `SiteId`, `SiteName`, `ConversionRate?`, `Traffic`, `OrderCount`, `TrafficDayCount`, `MissingTrafficDayCount`). `Sites[i].ConversionRate == null` ⇒ hiển thị "Chưa có Traffic"; `MissingTrafficDayCount > 0` ⇒ hiển thị số ngày thiếu dữ liệu. Các block khác để các trường này null.

**Block/dữ liệu không còn được sinh (giữ thuộc tính để không vỡ JSON, luôn rỗng, đánh `[Obsolete]`):**
- Personnel: `WeeklyKpi` (QĐ-08), `Gamification` (QĐ-08), `Refractionist` (QĐ-13) — `Data.Items = []`, `DataStatus = partial`, `MockFields = ["Items"]`. `Lab` cũng rỗng (chưa có nguồn thật).
- Personnel `Leaderboard`/`Scorecards`: rỗng khi không có dữ liệu (không còn 5 nhân viên demo), `partial`, `MockFields = ["Data"]`, `DataAsOf = null`. Khi có dữ liệu: `partial` + `["Csat"]` như cũ.
- Operational `MarketingCampaign`: `Items = []`, `partial`, `["Items"]`. `ConversionRate`: xem trên.
- **`DataStatus = "mock"` không còn được trả**; frontend nên coi `partial` + `MockFields` là "chưa có dữ liệu / chưa đồng bộ".

**Thay đổi giá trị/ngữ nghĩa:**
- Enum `DashboardV2BasketBuckets` (filter `BasketBuckets` gửi lên là số): `0,1,2` giữ nghĩa; `3` giờ là **3–5 Tr** (`ThreeToFiveMillion`), thêm `4` = **≥ 5 Tr** (`MoreThanFiveMillion`). Tên `MoreThanThreeMillion` bị xóa. `BasketSize` trả **5** phần tử (`BucketIndex` 0–4; trước 4).
- `Demographics.AgeGroup` nhận các giá trị `"<25"`, `"25-34"`, `"35-49"`, `">=50"`, `"Unknown"` (trước: `Under18`, `18-29`, `30-39`, `40-49`, `50-59`, `60+`, `Unknown`). Nhãn hiển thị "Không xác định" do frontend ánh xạ từ `Unknown`.
- `FormulaVersion` không đổi (`dashboard-v2-v10-anomaly-paid-revenue-20260918`); nếu cache theo version, nên tăng version khi deploy (không làm trong wave 1 để khỏi đụng cache/contract test).

## 4. Kết quả test

| | Pass | Fail | Skip | Ghi chú |
|---|---|---|---|---|
| Trước (filter `DashboardV2`) | 283 | 1 | 2 | fail có sẵn: `DashboardV2PermissionTests.PermissionCatalogUsesStableIdentityScopeCodes` (không đụng) |
| Sau (filter `DashboardV2`) | 313 | 1 | 2 | tổng 316; cùng 1 fail có sẵn |
| Toàn bộ project (trừ test cần DB thật) | 380 | 1 | 2 | xem mục 6 |

Số test thêm/đổi: +30 test mới (net), cập nhật ~12 test cũ phản ánh hành vi mới (fixture, target 0 → null, thuật toán anomaly, bucket, hợp đồng kiểu). Build không có warning lỗi mới do thay đổi này ngoài các cảnh báo xUnit2031 đã có sẵn.

## 5. Không làm được / để lại

- Không có test tích hợp cho sync state (cần Postgres, đang skip); mục 1 được kiểm bằng test cấu trúc.
- Chỉ số anomaly vẫn là `PaidAmount` (đúng yêu cầu "giữ metric hiện tại"); chưa có lựa chọn DTT / Số đơn / Tỷ lệ trả hàng và thực thể khu vực/chi nhánh như FR-OP-08.
- M14 chưa tách "kênh cửa hàng" (thiếu trường kênh); `Traffic` vẫn gắn theo `AccountId = IdentityContext.Id` như cũ (Traffic ownership thuộc phạm vi ngoài wave 1).
- Chưa tăng `FormulaVersion` (xem trên).
- `CalculateSignedAdjustmentTrend` giữ nguyên (xem mục 3).
- Các hạng mục ngoài phạm vi (GMV/DTT, VAT, nợ treo, waterfall, KPI model, heatmap V2 bucketing, RLS, mã quyền, migration/backfill) không đụng.

## 6. Kết quả chạy toàn bộ project test

Chạy toàn bộ `Tests/Application.Tests` (loại trừ các test cần DB thật, vốn treo/timeout trong môi trường này và không liên quan thay đổi: `SyncResponseRateIntegrationTest.*` và các script test `*LocalParallelScript*`, `*LocalBackfill*` cần kết nối DB cục bộ; nhóm script test đã chạy được 12 test pass trước khi bị treo):

- **380 pass, 1 fail, 2 skip, tổng 383.** Fail duy nhất là `DashboardV2PermissionTests.PermissionCatalogUsesStableIdentityScopeCodes` (có sẵn từ baseline, không sửa).
- Không có test nào khác bị vỡ.
