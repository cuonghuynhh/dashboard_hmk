import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORT_API_DIR = path.join(ROOT_DIR, 'report.api');
const POS_GUI_DIR = path.join(ROOT_DIR, 'pos.gui');

function readFile(relRoot, relPath) {
  const fullPath = path.join(relRoot, relPath);
  assert.ok(fs.existsSync(fullPath), `Expected file to exist: ${fullPath}`);
  return fs.readFileSync(fullPath, 'utf8');
}

test('M1: Bill Range PA2 (6 buckets: < 1 Tr, 1–3 Tr, 3–5 Tr, 5–10 Tr, 10–20 Tr, > 20 Tr) in report.api and pos.gui', () => {
  const availabilityCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Services/DashboardV2/DashboardV2DataAvailability.cs'
  );
  assert.match(
    availabilityCs,
    /1_000_000m,\s*3_000_000m,\s*5_000_000m,\s*10_000_000m,\s*20_000_000m/,
    'BasketUpperBounds in DashboardV2DataAvailability.cs must be [1M, 3M, 5M, 10M, 20M]'
  );

  const basketVue = readFile(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/components/BasketRefundCharts.vue'
  );
  for (const label of ['< 1 Tr', '1–3 Tr', '3–5 Tr', '5–10 Tr', '10–20 Tr', '> 20 Tr']) {
    assert.ok(
      basketVue.includes(label),
      `BasketRefundCharts.vue must include PA2 bucket label "${label}"`
    );
  }

  const filterBarVue = readFile(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/components/DashboardV2FilterBar.vue'
  );
  for (const label of ['10–20 Tr', '> 20 Tr']) {
    assert.ok(
      filterBarVue.includes(label) || filterBarVue.includes('10-20') || filterBarVue.includes('20 Tr'),
      `DashboardV2FilterBar.vue must include PA2 option "${label}"`
    );
  }
});

test('M2: AOV, UPT, Thực thu, Trước VAT in Executive Cards, Executive Ranking, and Campaign Table', () => {
  const opDtoCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dto.cs'
  );
  assert.match(opDtoCs, /public\s+decimal\?\s+Upt\s*\{\s*get;\s*set;\s*\}/, 'CampaignItemV2Dto must expose Upt');

  const execDtoCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Dto/Admins/DashboardV2/Executive/ExecutiveDashboardV2Dto.cs'
  );
  for (const prop of [
    'GrossOrderCount',
    'CollectedRevenueWithVat',
    'AovWithVat',
    'Upt',
    'WarrantyOrderCount',
    'WarrantyValueWithVat',
  ]) {
    assert.ok(
      execDtoCs.includes(prop),
      `ExecutiveDashboardV2Dto.cs must include ranking property ${prop}`
    );
  }

  const overviewCardsVue = readFile(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/components/ExecutiveOverviewCards.vue'
  );
  assert.ok(
    overviewCardsVue.includes('netRevenueWithoutVat') || overviewCardsVue.includes('Trước VAT'),
    'ExecutiveOverviewCards.vue must display Trước VAT on Net Revenue card'
  );
  assert.ok(
    overviewCardsVue.includes("'upt'") || overviewCardsVue.includes('UPT'),
    'ExecutiveOverviewCards.vue must include UPT MetricCard'
  );

  const rankingVue = readFile(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/components/ExecutivePerformanceRanking.vue'
  );
  for (const col of ['collectedRevenueWithVat', 'aovWithVat', 'upt', 'warrantyOrderCount']) {
    assert.ok(
      rankingVue.includes(col),
      `ExecutivePerformanceRanking.vue must render ${col}`
    );
  }
});

test('M3: Customer New vs Returning vs WalkIn (KHACHLE Option A) Growth & 0đ Warranty Exclusion', () => {
  const firstPurchaseCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Services/Report/ReportService.DashboardV2.FirstPurchase.cs'
  );
  assert.ok(
    firstPurchaseCs.includes('GrossValue > 0') || firstPurchaseCs.includes('NeedPayAmount > 0'),
    'ReportService.DashboardV2.FirstPurchase.cs must exclude 0đ warranty orders from first purchase eligibility'
  );

  const execDtoCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Dto/Admins/DashboardV2/Executive/ExecutiveDashboardV2Dto.cs'
  );
  for (const dtoName of [
    'ExecutiveCustomerGrowthV2Dto',
    'CustomerSegmentMetricsV2Dto',
    'CustomerSegmentTrendPointV2Dto',
  ]) {
    assert.ok(
      execDtoCs.includes(dtoName),
      `ExecutiveDashboardV2Dto.cs must define ${dtoName}`
    );
  }

  const customerGrowthVuePath = path.join(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/components/CustomerSegmentGrowthChart.vue'
  );
  assert.ok(
    fs.existsSync(customerGrowthVuePath),
    'CustomerSegmentGrowthChart.vue must exist in pos.gui'
  );
  const customerGrowthVue = fs.readFileSync(customerGrowthVuePath, 'utf8');
  assert.ok(
    customerGrowthVue.includes('KHACHLE') || customerGrowthVue.includes('walkIn'),
    'CustomerSegmentGrowthChart.vue must render the WalkIn (KHACHLE) row'
  );
});

test('M4: TimePeakChart highlights Best & Worst Day of Week and Hour Slot', () => {
  const timePeakVue = readFile(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/components/TimePeakChart.vue'
  );
  assert.ok(
    timePeakVue.includes('bestDay') ||
      timePeakVue.includes('worstDay') ||
      timePeakVue.includes('cao điểm') ||
      timePeakVue.includes('thấp điểm') ||
      timePeakVue.includes('tốt nhất') ||
      timePeakVue.includes('thấp nhất'),
    'TimePeakChart.vue must highlight best and worst day/hour slots'
  );
});

test('M5 & M6: Customer Warranty (All 0đ orders: Exchange 0đ + Direct 0đ) & Return by Store and PIC Sales', () => {
  const builderCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Services/DashboardV2/DashboardV2RevenueEventBuilder.cs'
  );
  assert.ok(
    builderCs.includes('order.ExchangeParentId ?? order.Id'),
    'DashboardV2RevenueEventBuilder.BuildDirectSale must pass order.ExchangeParentId ?? order.Id as OriginalOrderId'
  );

  const opDtoCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dto.cs'
  );
  for (const prop of [
    'WarrantyOrderCount',
    'ExchangeWarrantyOrderCount',
    'DirectWarrantyOrderCount',
    'WarrantyQuantity',
    'WarrantyValueWithVat',
    'WarrantyCostValue',
    'WarrantyOrderRate',
  ]) {
    assert.ok(
      opDtoCs.includes(prop),
      `RefundRateV2Dto must include warranty property ${prop}`
    );
  }

  const personnelDtoCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Dto/Admins/DashboardV2/Personnel/PersonnelDashboardV2Dto.cs'
  );
  for (const prop of [
    'ReturnOrderCount',
    'ReturnValueWithVat',
    'WarrantyOrderCount',
    'WarrantyQuantity',
    'WarrantyValueWithVat',
  ]) {
    assert.ok(
      personnelDtoCs.includes(prop),
      `PersonnelLeaderboardItemV2Dto must include ${prop}`
    );
  }

  const salesLeaderboardVue = readFile(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/components/SalesLeaderboard.vue'
  );
  assert.ok(
    salesLeaderboardVue.includes('warrantyOrderCount') &&
      salesLeaderboardVue.includes('returnValueWithVat'),
    'SalesLeaderboard.vue must display warrantyOrderCount and returnValueWithVat columns'
  );
});

test('M7: Conversion Rate by Store, Region, and System-wide in report.api and pos.gui', () => {
  const opDtoCs = readFile(
    REPORT_API_DIR,
    'Src/Application/Dto/Admins/DashboardV2/Operational/OperationalDashboardV2Dto.cs'
  );
  assert.ok(
    opDtoCs.includes('ConversionRegionV2Dto') && opDtoCs.includes('Regions'),
    'OperationalDashboardV2Dto.cs must define ConversionRegionV2Dto and Regions list'
  );

  const opViewVue = readFile(
    POS_GUI_DIR,
    'src/pages/dashboard-v2/views/OperationalView.vue'
  );
  assert.ok(
    opViewVue.includes('regions') &&
      (opViewVue.includes('Khu vực') || opViewVue.includes('region')),
    'OperationalView.vue must support Region view toggle and System-wide badge in Conversion Rate card'
  );
});
