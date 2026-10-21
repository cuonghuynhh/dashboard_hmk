# WAVE 6 - report.api: lỗi 500 DateTime Kind=Unspecified (Dashboard V2)

Nhánh `qc/dashboard-v2-wave6` (report.api). Commit: `dca3a2f` (fix gốc), `34627b9` (convention + test).

## Bug
- **File/dòng:** `Src/Application/Services/KpiV2/KpiV2Service.cs`, `KpiV2Holidays.Load` (~dòng 511-513).
- **Nguyên nhân:** `from`/`to` là `DateTime` Kind=Unspecified, so sánh với `Holiday.Date` (`timestamptz`); Npgsql 9 từ chối. Đi qua `KpiTargetLoader.Load` -> `QueryExecutiveKpiSnapshot` nên mọi endpoint Executive/Dashboard V2 (BOD) trả 500.
- **Sửa:** `KpiV2DateTime.NormalizeUtc(...)` cho `from`/`to` (chỉ gán Kind, giữ nguyên ticks nên ngữ nghĩa ngày nghiệp vụ không đổi).
- **Test:** `Tests/Application.Tests/KpiV2UtcKindTests.cs` (`NormalizeUtcOfBusinessDateKeepsTicksAndSetsUtc`; InMemory không kiểm Kind nên test chốt ở helper + convention).

## Convention chống cả lớp lỗi
- `ApplicationDbContext.ConfigureConventions` (chỉ context report; `PosDbContext` không đổi): mọi `DateTime` và `DateTime?` dùng `ValueConverter` -> provider: Unspecified => Utc, Local => `ToUniversalTime()`, Utc giữ nguyên; từ provider: gán Utc. Áp dụng cả cho tham số truy vấn nên mọi `Where(x => x.Date >= from)` kể cả code sau này đều an toàn.
- Không đổi kiểu cột: `has-pending-model-changes` = không có thay đổi, không thêm migration.
- Test: `EveryDateTimePropertyCarriesUtcConverter` (Holiday, ReportRevenueEvent, DashboardTrafficDaily) dựng model bằng `UseNpgsql` (không mở kết nối), kiểm converter có mặt và Kind=Utc.

## Smoke test (`local-stack/scripts/smoke.py`, Npgsql thật, 36 lời gọi/persona)
| | BOD | MANAGER | STAFF |
|---|---|---|---|
| Trước (image cũ) | 28x200, **8x500** | 27x200, 9x403, 0x5xx | 4x200, 32x403, 0x5xx |
| Sau (rebuild report-api) | 36x200, 0x5xx | 27x200, 9x403, 0x5xx | 4x200, 32x403, 0x5xx |

Tất cả 8 lỗi 500 trước đó cùng một frame: `KpiV2Holidays.Load` (KpiV2Service.cs:513). Không phát hiện frame lỗi nào khác.

## Test trước/sau
- DashboardV2|KpiV2: 524 pass / 2 skip -> 528 pass / 2 skip (+4 test mới).
- Golden: 15 pass -> 15 pass. EF: không có pending model changes.

## Chưa sửa / lưu ý
- Smoke test chỉ chấp nhận 200/403 cho MANAGER/STAFF (không đối chiếu ma trận quyền chi tiết); 403 của STAFF/MANAGER chưa được xác minh là đúng theo spec.
- Chưa gọi endpoint ghi (Traffic/Upsert, Kpi create/update/import) và các POST đọc khác của Kpi (Summary...), nên chưa được kiểm bằng Npgsql thật.
- DB đang nạp dở, nhiều endpoint trả dữ liệu rỗng; chỉ xác nhận không có 5xx.
- `local-stack` không phải git repo nên `smoke.py` không có commit.
