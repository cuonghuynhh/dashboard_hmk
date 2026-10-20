# Checklist go-live phân quyền Dashboard V2

Nhánh/commit liên quan:
| Repo | Nhánh | Nội dung |
|---|---|---|
| pos.api | `feat/dashboard-v2-full-role` | Role `DASHBOARD_V2_FULL` + `docs/dashboard-v2-rollout-runbook.md` |
| report.api | `feat/dashboard-v2-rbac-rollout` | `docs/ops/verify-dashboard-v2-accounts.sql`, `docs/ops/dashboard-v2-appsettings.md` |
| pos.gui | `feat/dashboard-v2-rbac-rollout` | Không đổi mã (nhánh `qc/dashboard-v2-wave9`) |

## 6 mã quyền cần có trên Identity (AppCode=POS)
`manager.dashboard-v2.bod`, `.manager`, `.staff`, `.gmv.read`, `.kpi.write`, `.traffic.write`

## Tài khoản đảm bảo toàn quyền xem
Nhân viên có `Staff.Code` = **`KHOA.ND`** và **`PRODUCT`** -> gán role `DASHBOARD_V2_FULL` (BOD + GMV + ghi KPI + ghi Traffic).

## Các bước (theo thứ tự)
- [ ] 1. Deploy pos.api, gọi `Permission/Init` -> Identity có mã quyền + role mới
- [ ] 2. Chạy `verify-dashboard-v2-accounts.sql` (chỉ đọc): `KHOA.ND`, `PRODUCT` mỗi mã 1 dòng, có `AccountId`
- [ ] 3. Gán role `DASHBOARD_V2_FULL` cho 2 tài khoản trên Identity; đăng nhập lại
- [ ] 4. Cấp `manager.dashboard-v2.gmv.read` cho mọi BOD hiện có
- [ ] 5. Deploy report.api với `DashboardV2__LegacyScopeMapping=true`
- [ ] 6. Deploy pos.gui
- [ ] 7. `GET /Admin/V2/Dashboard/Access` của 2 tài khoản: `role=BOD`, `gmvRead/kpiWrite/trafficWrite=true`, 5 trang
- [ ] 8. Kiểm MANAGER/STAFF có `Staff` + `SiteStaff` trên POS
- [ ] 9. Chuyển `LegacyScopeMapping=false` khi mọi người đã có role mới

## Ghi chú kiểm chứng (20/10/2026)
- pos.api: các mã trong role mới đều có định nghĩa trong `Init()`. Chưa build được trên máy này (thiếu `dotnet`), cần CI build.
- pos.gui: `vitest tests/dashboard-v2` -> 286 test pass, 32 file lỗi ở bước collect với `localStorage.getItem` undefined (Node v26.7.0 trên máy). Không do thay đổi này; chạy lại bằng Node LTS.
