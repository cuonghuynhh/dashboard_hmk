# Production Deployment Checklist — Dashboard V2

## Phase 1: Pre-merge verification (trước khi merge feature branches)

### 1.1 Code cleanliness
- [ ] `git status` clean on both repos (report.api + pos.gui)
- [ ] No dev-only changes (auth bypass, hardcoded URLs, mock data)
- [ ] No `console.log` / debug statements in frontend
- [ ] No temporary proxy config in vite.config.ts
- [ ] `appsettings.json` trỏ đúng production URLs (Hrm Host = "http://hrm.api", Identity Host = "http://identity.api")
- [ ] No leftover `TODO: dev` or `DEV ONLY` comments

### 1.2 Build verification
- [ ] report.api: `dotnet build` → 0 errors
- [ ] report.api: `dotnet test` → all pass
- [ ] pos.gui: `npm run build` → 0 errors
- [ ] pos.gui: `npm run type-check` → 0 errors (pre-existing vue-tsc warnings OK)
- [ ] pos.gui: `npm test` → all pass (pre-existing failures documented)

### 1.3 Branch verification
- [ ] Worker team 1: all BR tasks on `feat/smart-recompute` (pushed)
- [ ] Worker team 2: KPI simplification on `feat/kpi-management-simplification` (pushed)
- [ ] No direct commits on `feat/dashboard-v2-improvements` (only merges)
- [ ] No commits on `main` or `production-hmk` from workers

## Phase 2: Merge feature branches

### 2.1 Merge order (report.api + pos.gui)
- [ ] Merge `feat/smart-recompute` → `feat/dashboard-v2-improvements`
- [ ] Merge `feat/kpi-management-simplification` → `feat/dashboard-v2-improvements`
- [ ] Resolve conflicts (if any) — prioritize keeping both changes
- [ ] Verify build after each merge: `dotnet build` + `npm run build`

### 2.2 Conflict resolution rules
- [ ] Smart Recompute changes take priority for report.api
- [ ] KPI simplification changes take priority for pos.gui
- [ ] Shared files (dashboardV2Api.ts, types.ts): merge both changes manually
- [ ] No duplicate imports or conflicting route definitions

## Phase 3: E2E testing on common branch

### 3.1 Backend E2E
- [ ] report.api boots locally with production DB
- [ ] All migrations applied (check `__EFMigrationsHistory`)
- [ ] Auth middleware active (no bypass)
- [ ] Scope checks active (RequireDashboardV2Access)
- [ ] KPI endpoints return correct data
- [ ] Smart Recompute endpoint works

### 3.2 Frontend E2E
- [ ] pos.gui builds with production env (no .env.local overrides)
- [ ] VITE_API_REPORT points to production report API
- [ ] VITE_API_POS points to production POS API
- [ ] No proxy config in vite.config.ts
- [ ] KPI Management page renders correctly
- [ ] Branch list loads from POS API (not mock)
- [ ] Daily targets grid displays real data
- [ ] Inline edit works
- [ ] Bulk fill works
- [ ] Save (all-or-nothing) works

### 3.3 Integration E2E
- [ ] Login with real HMK account works
- [ ] Dashboard V2 access check works (BOD/Manager/Staff roles)
- [ ] KPI Management tab visible for authorized users
- [ ] KPI Management tab hidden for unauthorized users
- [ ] No CORS errors in browser console
- [ ] No "Mất kết nối Internet" toasts

## Phase 4: Pre-production verification

### 4.1 Code review
- [ ] Review all changed files in both repos
- [ ] Verify no sensitive data (tokens, passwords) in code
- [ ] Verify no debug statements
- [ ] Verify no commented-out code blocks

### 4.2 Database
- [ ] All pending migrations applied to production DB
- [ ] Migration order verified (Pending/ → Migrations/ if needed)
- [ ] No data loss risk from schema changes
- [ ] Backup production DB before migration

### 4.3 Environment config
- [ ] Production appsettings.json has correct URLs:
  - Hrm Host = "http://hrm.api" (Docker internal)
  - Identity Host = "http://identity.api" (Docker internal)
  - ConnectionStrings.Default = production DB
- [ ] No .env.local overrides in production build
- [ ] CORS configured for production origin only

## Phase 5: Deploy to production

### 5.1 Merge to main
- [ ] Create PR: `feat/dashboard-v2-improvements` → `main`
- [ ] Code review approved
- [ ] CI/CD pipeline passes (build + tests)
- [ ] Merge to main

### 5.2 Deploy
- [ ] Deploy report.api to production server
- [ ] Deploy pos.gui to production server
- [ ] Verify health endpoints
- [ ] Verify database migrations applied

### 5.3 Post-deploy verification
- [ ] Login with production account
- [ ] Dashboard V2 loads
- [ ] KPI Management page accessible
- [ ] Branch list loads
- [ ] Daily targets display correctly
- [ ] No errors in production logs
- [ ] No CORS errors in browser

## Phase 6: Rollback plan (if needed)
- [ ] Previous production version tagged
- [ ] Database backup available
- [ ] Rollback procedure documented
- [ ] Estimated rollback time: < 15 minutes

## Files changed (summary)

### report.api (feature branches)
- Smart Recompute implementation
- BR-10 (coverage metadata decoupling)
- BR-6 (data completeness validation)
- BR-5 (gap detection)
- BR-8 (auto-recovery)
- BR-9 (cancel/retry)
- BR-1 (alerting)
- BR-2 (dual freshness labels)
- BR-3 (per-dataset health badges)
- KPI DailyTargets PATCH endpoint
- KpiDailyTarget Version column + LastModifiedBy/At

### pos.gui (feature branches)
- KPI Management simplification (Option C v2)
- Inline edit on grid
- Bulk fill by day-type
- Filter combos (day-type, status)
- Dirty tracking + cancel/reset
- Legacy component removal (4 components)
- Debug text removal (formulaVersion)
- UX conditional render for % labels

## Dev-only changes (MUST be reverted before merge)
| File | Change | Status |
|---|---|---|
| Startup.cs | Auth bypass middleware | Reverted ✅ |
| AdminController.cs | Removed [Authorize] | Reverted ✅ |
| RequireDashboardV2AccessAttribute.cs | Changed scopes | Reverted ✅ |
| DashboardV2Controller.cs | Access() bypass | Reverted ✅ |
| KpiV2Controller.cs | Removed auth attribute | Reverted ✅ |
| DashboardV2AccessService.cs | Dev fallback in Resolve() | Reverted ✅ |
| posApiClient.ts | Hardcoded /pos-api | Reverted ✅ |
| reportApiClient.ts | Hardcoded localhost:5080 | Reverted ✅ |
| KpiManagementView.vue | Mock branch fallback | Reverted ✅ |
| App.vue | SignalR URL change | Reverted ✅ |
| vite.config.ts | Proxy config | Reverted ✅ |
| appsettings.json | Hrm host change | Reverted ✅ |
