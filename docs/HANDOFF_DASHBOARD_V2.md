# Handoff — Dashboard V2 (`report.api` + `pos.gui` + Production Hangfire Sync)

**Compiled:** 2026-10-28 10:15 (+07:00)  
**Purpose:** Resume point for the next agent/session. Contains full status of BOD Metrics & Cancel Recompute implementation, merged/open PRs, and the active investigation into Production Hangfire & `report` DB sync issues (`<prod-db-host>:5432`).

---

## 1. Completed Work in Session (2026-10-27 → 2026-10-28)

### 1.1 BOD Metrics (Bucket 2 — 6 Metrics + Customer Warranty 0đ Orders) & Cancel Recompute UI (`BR-9`)
All 6 Bucket-2 metrics requested by BOD + Customer Warranty (`0đ` completed orders) + Cancel Recompute UI & backend lock release were implemented, verified with unit/integration tests, and synced across all 3 repos (`report.api`, `pos.gui`, `dashboard_hmk`):
1. **Top SKU / Sản phẩm bán chạy & biến động mạnh (tăng/giảm):**
   - Backend (`report.api`): Extended `DashboardStoreOverviewDto` / `DashboardStoreProductBreakdownRowDto` and `DashboardAnalyticsService.StoreOverview.cs` with `PreviousQuantity`, `QuantityDelta`, `QuantityGrowthPct`, `PreviousRevenue`, `RevenueDelta`, `RevenueGrowthPct` (comparing current period vs previous equivalent period).
   - Frontend (`pos.gui` & `dashboard_hmk`): Added segmented toggle in `ProductMixChart.vue` (`Tất cả` / `Tăng mạnh` / `Giảm mạnh`) with delta badges (`+X%`, `-Y%`, `Mới`).
2. **Bảo hành khách hàng (`CustomerWarrantyOrderCount` — Đơn hoàn tất giá = 0đ):**
   - Backend (`report.api`): Added `CustomerWarrantyOrderCount` to `DashboardOverviewSummaryDto`, `DashboardOrderOverviewSummaryDto`, `DashboardStoreOverviewSummaryDto`, and `DashboardStoreOverviewComparisonRowDto`, counting completed orders (`State == Completed`) where `TotalAmount == 0`.
   - Frontend (`pos.gui` & `dashboard_hmk`): Displayed on Overview KPI strip, Order Overview KPI strip, and Store Overview table/summary.
3. **Cancel Recompute UI & `syncLock` Release (`BR-9`):**
   - Backend (`report.api`): `DashboardRecomputeService.CancelRequest` now releases the active lease on `ReportStatisticSyncState` (`State = Idle`, `LeaseUntil = null`) when canceling a `Running` (`Status = 2`) recompute request.
   - Frontend (`pos.gui` & `dashboard_hmk`): Added **Hủy** button (`POST /api/report/dashboard/recompute-requests/{id}/cancel`) in `DashboardSettingsDialog.vue` for `Queued (1)` and `Running (2)` requests.
4. **BOD Status Report Excel Updated:**
   - Updated both `/Users/gryffindor/Downloads/Input POS HMK dashboard.xlsx` and `docs/analysis/Input POS HMK dashboard - BOD Status Report.xlsx` with 3 final columns: `STATUS CUỐI CÙNG`, `PHƯƠNG ÁN CHỐT & VỊ TRÍ HIỂN THỊ TRÊN DASHBOARD V2`, and `GIẢI THÍCH CHI TIẾT`.

### 1.2 Git Branches & Pull Requests Status
- **`report.api`** (`/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api`):
  - Source branch: `feat/bod-metrics-bucket2` (commit `e7eb7de`)
  - **PR #145** (`feat/bod-metrics-bucket2` → `main`): **MERGED**
  - **PR #146** (`feat/bod-metrics-bucket2` → `development`): **MERGED**
  - **PR #148** (`main` → `production-hmk`): **MERGED**
  - **Fix branch:** `fix/hangfire-queue-and-sync-timeout` (commit `258f5ce`)
  - **PR #149** (`fix/hangfire-queue-and-sync-timeout` → `main`): **MERGED**
  - **PR #150** (`fix/hangfire-queue-and-sync-timeout` → `development`): **OPEN** (`https://github.com/eggstech/report.api/pull/150`)
  - **PR #151** (`main` → `production-hmk`): **OPEN** (`https://github.com/eggstech/report.api/pull/151` — ready to merge for deployment)
- **`pos.gui`** (`/Users/gryffindor/teamwork_projects/glasses_crm_ecommerce/pos.gui`):
  - Source branch: `feat/bod-metrics-bucket2` (commit `8cdbb169`)
  - **PR #2910** (`feat/bod-metrics-bucket2` → `main`): **MERGED**
  - **PR #2911** (`feat/bod-metrics-bucket2` → `development`): **MERGED**
  - **PR #2914** (`main` → `production-hmk`): **OPEN** (`https://github.com/eggstech/pos.gui/pull/2914` — ready to merge when deploying frontend to production)
- **`dashboard_hmk`** (`/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/dashboard_hmk`):
  - Branch `main` pushed to `origin/main` (commit `5aa781b`).

---

## 2. Active Investigation — Production Hangfire & `report` DB Sync Issues

### 2.1 How to Query Production DB (`<prod-db-host>:5432`)
The production PostgreSQL server `<prod-db-host>:5432` hosts both `hangfire` and `report` (as well as `pos`, `pos_hrm`, `epc`).
You can run queries from the local machine using the `hmkls_postgres` Docker container's `psql` client:

```bash
# Query hangfire DB
docker exec -e PGPASSWORD='<đã ẩn>' hmkls_postgres psql -h <prod-db-host> -p 5432 -U root -d hangfire -c "..."

# Query report DB
docker exec -e PGPASSWORD='<đã ẩn>' hmkls_postgres psql -h <prod-db-host> -p 5432 -U root -d report -c "..."
```

### 2.2 Current State of `"ReportStatisticSyncState"` in Production `report` DB
As of `2026-10-28 03:10 UTC` (`10:10 VN`), the 7 Dashboard V2 datasets in `"ReportStatisticSyncState"` are stuck at older dates:

| DatasetCode | State | `LastSourceUpdatedAt` | `LastCompletedAt` | `RetryCount` | `LastErrorCode` / Note |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `DashboardOperationalPreOrderFact` | `3` (Failed) | `2026-10-24 05:07:03+00` | `2026-10-24 05:07:40+00` | `43` | `auto_recovery_disabled` |
| `DashboardOrderFact` | `2` (Running) | `2026-10-15 00:00:00+00` | `2026-10-25 16:49:06+00` | `12` | `LeaseUntil = 2026-10-28 02:45:54+00` |
| `DashboardRevenueEventFact` | `1` (Idle) | `2026-10-17 00:00:00+00` | `2026-10-27 15:56:51+00` | `0` | Range `2026-10-11` → `2026-10-17` |
| `DashboardCustomerDebtFact` | `1` (Idle) | `2026-10-15 00:00:00+00` | `2026-10-25 17:23:03+00` | `0` | Stuck at `2026-10-15` |
| `DashboardCustomerFirstPurchaseFact` | `1` (Idle) | `2026-10-15 00:00:00+00` | `2026-10-25 16:49:06+00` | `0` | Stuck at `2026-10-15` |
| `DashboardPreOrderFact` | `1` (Idle) | `2026-10-15 00:00:00+00` | `2026-10-25 16:49:06+00` | `0` | Stuck at `2026-10-15` |
| `DashboardPaymentFact` | `1` (Idle) | `2026-06-30 00:00:00+00` | `2026-09-18 06:46:49+00` | `0` | Stuck at `2026-06-30` |

*(Note: Real-time webhook rows in `"ReportOrderStatistic"` and `"ReportRevenueEvent"` exist up to `2026-10-27 16:58 UTC`, but the batch sync & recompute pipeline is blocked by the 3 root causes below.)*

---

### 2.3 Three Root Causes Diagnosed

#### Root Cause 1: `Report.AutoRecoverFailedSyncs` (`*/30 * * * *`) Runs in a Single Giant Transaction (> 34 Minutes), Overlapping with Itself and Holding DB & Hangfire Locks
- **Evidence in `hangfire.jobqueue` & `hangfire.lock`:**
  - Two instances of `AutoRecoverFailedSyncs` (`jobid = 8978012` created `02:30 UTC` and `jobid = 8980353` created `03:00 UTC`) were simultaneously in `Processing` (`fetchedat IS NOT NULL`) on queue `report`.
  - `hangfire.lock` has `hangfire:Report.SyncData` perpetually held.
- **Evidence in `pg_stat_activity` & `pg_locks` on `report` DB:**
  - Backend `pid = 1744` was in `idle in transaction` for **34+ minutes** (`xact_duration = 00:34:19`), executing queries on `"ReportCustomerFirstPurchase"` while holding `RowExclusiveLock` on `"ReportCustomerFirstPurchase"`, `"ReportRevenueEvent"`, `"ReportRevenueEventLine"`, and `AccessShareLock` on `"ReportSite"`.

#### Root Cause 2: Nightly `Report.SyncData` (`30 16 * * *` UTC = `23:30 VN`) Fails with `NpgsqlException: Timeout during reading attempt`
- **Evidence in `hangfire.job` & `hangfire.state`:**
  - `Job #8883915` (`SyncData` for `1793059200000` = `2026-10-27`): Created at `2026-10-27 16:30:03 UTC`. Failed all 10 retry attempts (between `16:30 UTC` and `22:10 UTC`) at:
    `Report.Application.Services.ReportService.SyncReportSitesFromPos() in /build/Src/Application/Services/Report/ReportService._Base.cs:line 256` (`SaveChangesAsync` on 78 rows of `"ReportSite"` timed out after 30s due to DB lock/load contention).
  - `Job #8624694` (`SyncData` for `1792972800000` = `2026-10-26`): Created at `2026-10-26 16:30:10 UTC`. Failed all 10 retry attempts at `ReportService.WriteReportOrder(...) in ReportService.Order.cs:line 144`.

#### Root Cause 3: Manual `RunRecomputeRequest` (`Job #8874781`) Falls Back to `"default"` Queue on Retry and Gets Stranded
- **Evidence in `"DashboardRecomputeRequest"` & `hangfire.state`:**
  - Request `01a17e12-bb5d-7f1a-bc99-bbd5a4cd804f` (`2026-10-11` → `2026-10-17`, `HangfireJobId = 8874781`) is stuck at `Status = 2` (`Running`), step `"Thống kê"`.
  - Attempt 1 started on queue `"report"` at `2026-10-27 15:55:19 UTC` and was interrupted at `16:10:19 UTC` when `report.api` container restarted (`57P01: terminating connection due to administrator command`).
  - When Hangfire's `AutomaticRetry` re-enqueued the job, `DelayedJobScheduler` enqueued it into **`{"Queue": "default"}`** because `IDashboardRecomputeService.RunRecomputeRequest` (and `DashboardRecomputeService.RunRecomputeRequest`) does **NOT** have a `[Queue("report")]` attribute!
  - Other services' Hangfire servers (`pos`, `epc`) picked it up from `"default"` and failed with `System.IO.FileNotFoundException: Could not resolve assembly 'Report.Application'`, and currently `Job #8874781` sits un-fetched in `hangfire.jobqueue` with `queue = 'default'` (`fetchedat IS NULL`) because no server listens to `"default"`.

---

## 3. Recommended Next Steps (Action Plan for Next Agent)

### Step 1: Code Fixes in `report.api` (Permanent Prevention)
1. **Add `[Queue("report")]` to Recompute & Sync Job Entrypoints:**
   - In `report.api/Src/Application/Services/Report/IDashboardRecomputeService.cs` (and `DashboardRecomputeService.cs`), decorate `RunRecomputeRequest(Guid requestId)` with `[Hangfire.Queue("report")]` (or `[Queue(HangfireConstant.Queue)]`) so Hangfire automatic retries always stay on the `"report"` queue instead of falling back to `"default"`.
   - Verify all methods invoked via `HangfireStartup.cs` (`SyncData`, `AutoRecoverFailedSyncs`, `SyncStaffs`, `CleanupExpiredDashboardImports`, `BackfillFirstPurchaseSnapshots`, `ReconcileRecentWindow`, `ReconcileRolling30DaysWindow`) also preserve queue `"report"` on retry.
2. **Prevent Long-Living Transactions & Overlapping in `AutoRecoverFailedSyncs`:**
   - Inspect `ReportService.AutoRecoverFailedSyncs()` (`report.api/Src/Application/Services/Report/ReportService._Base.cs`): ensure each dataset/day recovery commits its own short transaction (`SaveChangesAsync`) rather than keeping one overarching transaction open for 30+ minutes, and ensure `[DisableConcurrentExecution]` / distributed lock prevents overlapping runs.
3. **Investigate & Harden `SyncReportSitesFromPos()` (`ReportService._Base.cs:line 256`):**
   - Check why `SyncReportSitesFromPos()` calls `SaveChangesAsync()` across all sites on every `SyncData` run even when unchanged, or increase `CommandTimeout` / only update modified `ReportSite` entities.

### Step 2: Unblock Production DB (`<prod-db-host>:5432`) *(Requires User Confirmation Before Mutating DB)*
1. **Fix Stranded Recompute Request (`01a17e12-bb5d-7f1a-bc99-bbd5a4cd804f` / `Job #8874781`):**
   - Either update `hangfire.jobqueue` to move `jobid = 8874781` from `queue = 'default'` to `queue = 'report'`:
     ```sql
     UPDATE hangfire.jobqueue SET queue = 'report' WHERE jobid = 8874781 AND queue = 'default';
     ```
   - Or mark request `01a17e12-bb5d-7f1a-bc99-bbd5a4cd804f` as Canceled/Failed in `"DashboardRecomputeRequest"` and delete `jobid = 8874781` from `hangfire.jobqueue` so the user can re-trigger cleanly from UI.
2. **Reset Disabled Recovery State on `"ReportStatisticSyncState"`:**
   - Once the long-running transaction (`pid 1744`) finishes or is cleaned up, reset `DashboardOperationalPreOrderFact` (`State = 3`, `LastErrorCode = 'auto_recovery_disabled'`) and stale leases so datasets can sync forward from `2026-10-15` → `2026-10-28`.
3. **Re-trigger Failed `SyncData` Jobs (`2026-10-26` & `2026-10-27`):**
   - Re-enqueue `Job #8624694` (`2026-10-26`) and `Job #8883915` (`2026-10-27`) on queue `'report'` (via Hangfire Dashboard or `hangfire.jobqueue`).

---

## 4. Key Workspace Paths & Worker Terminals
- **Dashboard Prototype & Docs Repo:** `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/dashboard_hmk`
- **Backend Repo (`report.api`):** `/Users/gryffindor/Desktop/antigra_conversation/dashboard_hmk/report.api`
- **Frontend Repo (`pos.gui`):** `/Users/gryffindor/teamwork_projects/glasses_crm_ecommerce/pos.gui`
- **Active Orca Worker Terminals:**
  - `term_8148abc7-ecd3-404e-a4e8-8d884e4927f3` (`report.api` worker — idle, ready)
  - `term_2d92a39b-4449-4510-b2a1-c9e76be31263` (`pos.gui` worker — idle, ready)
