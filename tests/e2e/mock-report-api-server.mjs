import http from 'node:http';

const PORT = Number(process.env.E2E_API_PORT || 4199);

let gmvHiddenMode = false;
const requestLog = [];

function liveBlock(data, gmvHidden = gmvHiddenMode) {
  return {
    data,
    dataStatus: 'live',
    mockFields: [],
    dataAsOf: '2026-10-27T10:00:00+07:00',
    formulaVersion: 'dashboard-v2-formula-1',
    gmvHidden,
  };
}

function getExecutiveKpis() {
  const gmv = gmvHiddenMode ? null : 1_850_000_000;
  const gmvNoVat = gmvHiddenMode ? null : 1_681_818_182;
  const vat = gmvHiddenMode ? null : 168_181_818;
  const adj = gmvHiddenMode ? null : -90_000_000;
  return liveBlock({
    gmvWithVat: gmv,
    gmvWithoutVat: gmvNoVat,
    vatAmount: vat,
    newCustomerCount: 312,
    newCustomerAveragePerDay: 11.5,
    collectedRevenueWithVat: 1_720_000_000,
    collectedRevenueWithoutVat: 1_563_636_364,
    refundWithVat: 35_000_000,
    refundWithoutVat: 31_818_182,
    adjustmentWithVat: adj,
    adjustmentWithoutVat: gmvHiddenMode ? null : -81_818_182,
    returnAdjustmentWithVat: gmvHiddenMode ? null : 45_000_000,
    exchangeAdjustmentWithVat: gmvHiddenMode ? null : 25_000_000,
    preOrderCancelAdjustmentWithVat: gmvHiddenMode ? null : 20_000_000,
    netRevenueWithVat: 1_760_000_000,
    netRevenueWithoutVat: 1_600_000_000,
    outstandingDebt: 85_000_000,
    outstandingDebtShareOfGmv: gmvHiddenMode ? null : 4.59,
    grossMarginRate: 58.4,
    grossOrderCount: 920,
    exchangeOrderCount: 18,
    preOrderCancelOrderCount: 12,
    orderCount: 890,
    unitCount: 2_047,
    upt: 2.3,
    aovWithVat: 1_977_528,
    aovWithoutVat: 1_797_753,
    revenue: 1_600_000_000,
    revenueWithVat: 1_760_000_000,
    revenueWithoutVat: 1_600_000_000,
    grossSales: gmv,
    grossSalesWithVat: gmv,
    grossSalesWithoutVat: gmvNoVat,
    aov: 1_977_528,
    ytdRevenue: 14_500_000_000,
    target: 2_000_000_000,
    targetCompletion: 88.0,
    growthRate: 14.2,
  });
}

function getExecutivePrevious() {
  return liveBlock({
    gmvWithVat: gmvHiddenMode ? null : 1_620_000_000,
    newCustomerCount: 275,
    collectedRevenueWithVat: 1_510_000_000,
    adjustmentWithVat: gmvHiddenMode ? null : -80_000_000,
    netRevenueWithVat: 1_540_000_000,
    netRevenueWithoutVat: 1_400_000_000,
    outstandingDebt: 92_000_000,
    grossMarginRate: 56.8,
    orderCount: 810,
    unitCount: 1_701,
    upt: 2.1,
    aovWithVat: 1_901_235,
    aovWithoutVat: 1_728_395,
  });
}

function getExecutiveTrend() {
  return liveBlock([
    {
      date: '2026-10-01',
      gmvWithVat: gmvHiddenMode ? null : 620_000_000,
      gmvWithoutVat: gmvHiddenMode ? null : 563_636_364,
      directGmvWithVat: gmvHiddenMode ? null : 420_000_000,
      preOrderGmvWithVat: gmvHiddenMode ? null : 200_000_000,
      collectedRevenueWithVat: 580_000_000,
      refundWithVat: 10_000_000,
      adjustmentWithVat: gmvHiddenMode ? null : -30_000_000,
      netRevenueWithVat: 590_000_000,
      netRevenueWithoutVat: 536_363_636,
      newCustomerCount: 104,
      orderCount: 295,
      unitCount: 649,
      upt: 2.2,
      aovWithVat: 2_000_000,
      grossMarginRate: 57.5,
      revenue: 590_000_000,
      grossSales: gmvHiddenMode ? null : 620_000_000,
      cumulativeRevenue: 590_000_000,
      cumulativeGmvWithVat: gmvHiddenMode ? null : 620_000_000,
      cumulativeNetRevenueWithVat: 590_000_000,
      target: 650_000_000,
      cumulativeTarget: 650_000_000,
      targetCompletion: 90.7,
    },
    {
      date: '2026-10-02',
      gmvWithVat: gmvHiddenMode ? null : 1_230_000_000,
      gmvWithoutVat: gmvHiddenMode ? null : 1_118_181_818,
      directGmvWithVat: gmvHiddenMode ? null : 830_000_000,
      preOrderGmvWithVat: gmvHiddenMode ? null : 400_000_000,
      collectedRevenueWithVat: 1_140_000_000,
      refundWithVat: 25_000_000,
      adjustmentWithVat: gmvHiddenMode ? null : -60_000_000,
      netRevenueWithVat: 1_170_000_000,
      netRevenueWithoutVat: 1_063_636_364,
      newCustomerCount: 208,
      orderCount: 595,
      unitCount: 1_398,
      upt: 2.35,
      aovWithVat: 1_966_387,
      grossMarginRate: 58.9,
      revenue: 1_170_000_000,
      grossSales: gmvHiddenMode ? null : 1_230_000_000,
      cumulativeRevenue: 1_760_000_000,
      cumulativeGmvWithVat: gmvHiddenMode ? null : 1_850_000_000,
      cumulativeNetRevenueWithVat: 1_760_000_000,
      target: 1_350_000_000,
      cumulativeTarget: 2_000_000_000,
      targetCompletion: 88.0,
    },
  ]);
}

function getExecutiveRanking() {
  const item1 = {
    id: 'site-1',
    name: 'HMK Quận 1',
    regionId: 'reg-hcm',
    regionName: 'Hồ Chí Minh',
    clusterId: 'clu-hcm-1',
    clusterName: 'Cụm Trung Tâm',
    grossOrderCount: 520,
    orderCount: 500,
    unitCount: 1_200,
    upt: 2.4,
    aovWithVat: 2_040_000,
    collectedRevenueWithVat: 1_000_000_000,
    gmvWithVat: gmvHiddenMode ? null : 1_070_000_000,
    netRevenueWithVat: 1_020_000_000,
    contributionRate: 57.95,
    returnRate: gmvHiddenMode ? null : 4.67,
    returnValueWithVat: 50_000_000,
    warrantyOrderCount: 14,
    warrantyValueWithVat: 18_500_000,
    target: 1_100_000_000,
    targetCompletion: 92.73,
  };
  const item2 = {
    id: 'site-2',
    name: 'HMK Thủ Đức',
    regionId: 'reg-hcm',
    regionName: 'Hồ Chí Minh',
    clusterId: 'clu-hcm-2',
    clusterName: 'Cụm Khu Đông',
    grossOrderCount: 400,
    orderCount: 390,
    unitCount: 847,
    upt: 2.17,
    aovWithVat: 1_897_436,
    collectedRevenueWithVat: 720_000_000,
    gmvWithVat: gmvHiddenMode ? null : 780_000_000,
    netRevenueWithVat: 740_000_000,
    contributionRate: 42.05,
    returnRate: gmvHiddenMode ? null : 5.13,
    returnValueWithVat: 40_000_000,
    warrantyOrderCount: 9,
    warrantyValueWithVat: 11_200_000,
    target: 900_000_000,
    targetCompletion: 82.22,
  };
  const total = {
    grossOrderCount: 920,
    orderCount: 890,
    unitCount: 2_047,
    upt: 2.3,
    aovWithVat: 1_977_528,
    collectedRevenueWithVat: 1_720_000_000,
    gmvWithVat: gmvHiddenMode ? null : 1_850_000_000,
    netRevenueWithVat: 1_760_000_000,
    contributionRate: 100,
    returnRate: gmvHiddenMode ? null : 4.86,
    returnValueWithVat: 90_000_000,
    warrantyOrderCount: 23,
    warrantyValueWithVat: 29_700_000,
    target: 2_000_000_000,
    targetCompletion: 88.0,
  };
  return liveBlock({
    regions: [
      {
        ...total,
        id: 'reg-hcm',
        name: 'Hồ Chí Minh',
      },
    ],
    clusters: [item1, item2],
    sites: [item1, item2],
    total,
  });
}

function getExecutiveCustomerGrowth() {
  return liveBlock({
    new: {
      segmentKey: 'new',
      segmentLabel: 'Khách hàng mới',
      customerCount: 312,
      previousCustomerCount: 275,
      customerGrowthRate: 13.45,
      grossOrderCount: 340,
      orderCount: 330,
      previousOrderCount: 290,
      orderGrowthRate: 13.79,
      gmvWithVat: gmvHiddenMode ? null : 740_000_000,
      previousGmvWithVat: gmvHiddenMode ? null : 640_000_000,
      gmvShare: gmvHiddenMode ? null : 40.0,
      gmvGrowthRate: gmvHiddenMode ? null : 15.63,
      netRevenueWithVat: 710_000_000,
      previousNetRevenueWithVat: 615_000_000,
      netRevenueShare: 40.34,
      netRevenueGrowthRate: 15.45,
      aovWithVat: 2_151_515,
      previousAovWithVat: 2_120_690,
      aovGrowthRate: 1.45,
      upt: 2.35,
      previousUpt: 2.2,
      uptGrowthRate: 6.82,
      unitCount: 776,
    },
    returning: {
      segmentKey: 'returning',
      segmentLabel: 'Khách hàng cũ (Quay lại)',
      customerCount: 428,
      previousCustomerCount: 390,
      customerGrowthRate: 9.74,
      grossOrderCount: 510,
      orderCount: 492,
      previousOrderCount: 450,
      orderGrowthRate: 9.33,
      gmvWithVat: gmvHiddenMode ? null : 999_000_000,
      previousGmvWithVat: gmvHiddenMode ? null : 880_000_000,
      gmvShare: gmvHiddenMode ? null : 54.0,
      gmvGrowthRate: gmvHiddenMode ? null : 13.52,
      netRevenueWithVat: 945_000_000,
      previousNetRevenueWithVat: 830_000_000,
      netRevenueShare: 53.69,
      netRevenueGrowthRate: 13.86,
      aovWithVat: 1_920_732,
      previousAovWithVat: 1_844_444,
      aovGrowthRate: 4.14,
      upt: 2.32,
      previousUpt: 2.15,
      uptGrowthRate: 7.91,
      unitCount: 1_141,
    },
    walkIn: {
      segmentKey: 'walkIn',
      segmentLabel: 'Khách chưa định danh (KHACHLE)',
      customerCount: null,
      previousCustomerCount: null,
      customerGrowthRate: null,
      grossOrderCount: 70,
      orderCount: 68,
      previousOrderCount: 70,
      orderGrowthRate: -2.86,
      gmvWithVat: gmvHiddenMode ? null : 111_000_000,
      previousGmvWithVat: gmvHiddenMode ? null : 100_000_000,
      gmvShare: gmvHiddenMode ? null : 6.0,
      gmvGrowthRate: gmvHiddenMode ? null : 11.0,
      netRevenueWithVat: 105_000_000,
      previousNetRevenueWithVat: 95_000_000,
      netRevenueShare: 5.97,
      netRevenueGrowthRate: 10.53,
      aovWithVat: 1_544_118,
      previousAovWithVat: 1_357_143,
      aovGrowthRate: 13.78,
      upt: 1.91,
      previousUpt: 1.85,
      uptGrowthRate: 3.24,
      unitCount: 130,
    },
    total: {
      segmentKey: 'total',
      segmentLabel: 'Tổng cộng',
      customerCount: 740,
      previousCustomerCount: 665,
      customerGrowthRate: 11.28,
      grossOrderCount: 920,
      orderCount: 890,
      previousOrderCount: 810,
      orderGrowthRate: 9.88,
      gmvWithVat: gmvHiddenMode ? null : 1_850_000_000,
      previousGmvWithVat: gmvHiddenMode ? null : 1_620_000_000,
      gmvShare: gmvHiddenMode ? null : 100.0,
      gmvGrowthRate: gmvHiddenMode ? null : 14.2,
      netRevenueWithVat: 1_760_000_000,
      previousNetRevenueWithVat: 1_540_000_000,
      netRevenueShare: 100.0,
      netRevenueGrowthRate: 14.29,
      aovWithVat: 1_977_528,
      previousAovWithVat: 1_901_235,
      aovGrowthRate: 4.01,
      upt: 2.3,
      previousUpt: 2.1,
      uptGrowthRate: 9.52,
      unitCount: 2_047,
    },
    trend: [
      {
        label: 'Tuần 1',
        startDate: '2026-10-01',
        newCustomerCount: 150,
        returningCustomerCount: 210,
        newOrderCount: 160,
        returningOrderCount: 240,
        walkInOrderCount: 35,
        newGmvWithVat: gmvHiddenMode ? null : 350_000_000,
        returningGmvWithVat: gmvHiddenMode ? null : 480_000_000,
        walkInGmvWithVat: gmvHiddenMode ? null : 55_000_000,
        newNetRevenueWithVat: 335_000_000,
        returningNetRevenueWithVat: 455_000_000,
        walkInNetRevenueWithVat: 52_000_000,
      },
      {
        label: 'Tuần 2',
        startDate: '2026-10-08',
        newCustomerCount: 162,
        returningCustomerCount: 218,
        newOrderCount: 170,
        returningOrderCount: 252,
        walkInOrderCount: 33,
        newGmvWithVat: gmvHiddenMode ? null : 390_000_000,
        returningGmvWithVat: gmvHiddenMode ? null : 519_000_000,
        walkInGmvWithVat: gmvHiddenMode ? null : 56_000_000,
        newNetRevenueWithVat: 375_000_000,
        returningNetRevenueWithVat: 490_000_000,
        walkInNetRevenueWithVat: 53_000_000,
      },
    ],
  });
}

function getOperationalBasketSize() {
  return liveBlock([
    { range: '< 1 Tr', orderCount: 220, totalValue: gmvHiddenMode ? 0 : 145_000_000, percentage: 23.91 },
    { range: '1–3 Tr', orderCount: 380, totalValue: gmvHiddenMode ? 0 : 720_000_000, percentage: 41.3 },
    { range: '3–5 Tr', orderCount: 190, totalValue: gmvHiddenMode ? 0 : 695_000_000, percentage: 20.65 },
    { range: '5–10 Tr', orderCount: 95, totalValue: gmvHiddenMode ? 0 : 185_000_000, percentage: 10.33 },
    { range: '10–20 Tr', orderCount: 25, totalValue: gmvHiddenMode ? 0 : 65_000_000, percentage: 2.72 },
    { range: '> 20 Tr', orderCount: 10, totalValue: gmvHiddenMode ? 0 : 40_000_000, percentage: 1.09 },
  ]);
}

function getOperationalRefundRate() {
  return liveBlock({
    refundRate: gmvHiddenMode ? null : 4.86,
    refundOrderRate: 3.26,
    totalOrders: 920,
    refundedOrders: 30,
    grossSalesWithVat: gmvHiddenMode ? null : 1_850_000_000,
    refundAmountWithVat: 90_000_000,
    gmvWithVat: gmvHiddenMode ? null : 1_850_000_000,
    adjustmentAmountWithVat: 90_000_000,
    returnAdjustmentWithVat: 45_000_000,
    exchangeAdjustmentWithVat: 25_000_000,
    cancelAdjustmentWithVat: 20_000_000,
    grossOrderCount: 920,
    returnedOrderCount: 30,
    cancelledPreOrderCount: 12,
    endedPreOrderUnconvertedCount: 18,
    preOrderCancelRate: 3.16,
    preOrderExchangeRate: 4.74,
    warrantyOrderCount: 23,
    exchangeWarrantyOrderCount: 15,
    directWarrantyOrderCount: 8,
    warrantyQuantity: 29,
    warrantyValueWithVat: gmvHiddenMode ? 0 : 29_700_000,
    warrantyCostValue: 11_400_000,
    warrantyOrderRate: 2.5,
    returnQuantity: 38,
  });
}

function getOperationalTimePeak() {
  const items = [];
  for (let day = 0; day <= 6; day++) {
    for (let hour = 8; hour <= 21; hour++) {
      const isBest = day === 0 && hour === 19; // Chủ Nhật 19h
      const isWorst = day === 2 && hour === 8; // Thứ Ba 8h
      const baseOrders = isBest ? 42 : isWorst ? 1 : (day === 0 ? 12 : day === 2 ? 4 : 8) + (hour === 19 ? 10 : hour === 8 ? 1 : 4);
      const baseGmv = baseOrders * 2_000_000;
      items.push({
        dayOfWeek: day,
        hour,
        orderCount: baseOrders,
        revenueWithVat: baseGmv,
        gmvWithVat: gmvHiddenMode ? 0 : baseGmv,
      });
    }
  }
  return liveBlock(items);
}

function getOperationalCampaigns() {
  return liveBlock({
    version: 'dashboard-v2-live-v1',
    items: [],
    campaigns: [
      {
        code: 'CAMP1',
        name: 'Ưu đãi Mùa Tựu Trường',
        campaignName: 'Ưu đãi Mùa Tựu Trường',
        campaignType: 'Promotion',
        orderCount: 310,
        unitCount: 744,
        upt: 2.4,
        revenueWithVat: 620_000_000,
        gmvWithVat: gmvHiddenMode ? null : 650_000_000,
        netRevenueWithVat: 620_000_000,
        aov: 2_000_000,
        contributionRate: gmvHiddenMode ? null : 35.14,
      },
      {
        code: 'CAMP2',
        name: 'Voucher Khách Thân Thiết',
        campaignName: 'Voucher Khách Thân Thiết',
        campaignType: 'Voucher',
        orderCount: 185,
        unitCount: 389,
        upt: 2.1,
        revenueWithVat: 370_000_000,
        gmvWithVat: gmvHiddenMode ? null : 390_000_000,
        netRevenueWithVat: 370_000_000,
        aov: 2_000_000,
        contributionRate: gmvHiddenMode ? null : 21.08,
      },
    ],
  });
}

function getOperationalConversion() {
  return liveBlock({
    version: 'dashboard-v2-live-v1',
    items: [],
    conversionRate: 38.33,
    totalTraffic: 2_400,
    totalOrders: 920,
    sites: [
      {
        siteId: 'site-1',
        siteName: 'HMK Quận 1',
        regionId: 'reg-hcm',
        regionName: 'Hồ Chí Minh',
        clusterId: 'clu-hcm-1',
        clusterName: 'Cụm Trung Tâm',
        traffic: 1_250,
        orders: 520,
        conversionRate: 41.6,
      },
      {
        siteId: 'site-2',
        siteName: 'HMK Thủ Đức',
        regionId: 'reg-hcm',
        regionName: 'Hồ Chí Minh',
        clusterId: 'clu-hcm-2',
        clusterName: 'Cụm Khu Đông',
        traffic: 1_150,
        orders: 400,
        conversionRate: 34.78,
      },
    ],
    regions: [
      {
        regionId: 'reg-hcm',
        regionName: 'TP. Hồ Chí Minh',
        traffic: 2_400,
        orders: 920,
        conversionRate: 38.33,
        siteCount: 2,
      },
      {
        regionId: 'reg-mt',
        regionName: 'Miền Tây',
        traffic: 800,
        orders: 280,
        conversionRate: 35.0,
        siteCount: 1,
      },
    ],
  });
}

function getPersonnel() {
  return {
    scorecards: liveBlock([
      {
        staffId: 'staff-1',
        staffName: 'Nguyễn Thị Minh Anh',
        siteName: 'HMK Quận 1',
        revenueWithVat: 420_000_000,
        gmvWithVat: gmvHiddenMode ? null : 445_000_000,
        netRevenueWithVat: 420_000_000,
        orderCount: 210,
        aov: 2_000_000,
        upt: 2.45,
        target: 450_000_000,
        targetCompletion: 93.33,
      },
    ]),
    leaderboard: liveBlock([
      {
        rank: 1,
        staffId: 'staff-1',
        staffCode: 'NV01',
        staffName: 'Nguyễn Thị Minh Anh',
        siteName: 'HMK Quận 1',
        revenue: 420_000_000,
        gmv: gmvHiddenMode ? null : 445_000_000,
        revenueWithVat: 420_000_000,
        gmvWithVat: gmvHiddenMode ? null : 445_000_000,
        netRevenueWithVat: 420_000_000,
        orderCount: 210,
        aov: 2_000_000,
        upt: 2.45,
        returnRate: gmvHiddenMode ? null : 5.62,
        returnOrderCount: 8,
        returnValueWithVat: 25_000_000,
        warrantyOrderCount: 6,
        warrantyQuantity: 7,
        warrantyValueWithVat: gmvHiddenMode ? 0 : 8_200_000,
        warrantyCostValue: 3_100_000,
      },
      {
        rank: 2,
        staffId: 'staff-2',
        staffCode: 'NV02',
        staffName: 'Trần Hoàng Nam',
        siteName: 'HMK Thủ Đức',
        revenue: 360_000_000,
        gmv: gmvHiddenMode ? null : 380_000_000,
        revenueWithVat: 360_000_000,
        gmvWithVat: gmvHiddenMode ? null : 380_000_000,
        netRevenueWithVat: 360_000_000,
        orderCount: 180,
        aov: 2_000_000,
        upt: 2.2,
        returnRate: gmvHiddenMode ? null : 5.26,
        returnOrderCount: 6,
        returnValueWithVat: 20_000_000,
        warrantyOrderCount: 4,
        warrantyQuantity: 5,
        warrantyValueWithVat: gmvHiddenMode ? 0 : 5_400_000,
        warrantyCostValue: 2_050_000,
      },
    ]),
  };
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    const url = (req.url || '/').split('?')[0];
    let parsedBody = null;
    try {
      parsedBody = body ? JSON.parse(body) : null;
    } catch {
      parsedBody = body;
    }
    requestLog.push({ method: req.method, url, body: parsedBody, at: new Date().toISOString() });

    const jsonRaw = (payload, status = 200) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(payload));
    };
    const json = (payload, status = 200) => jsonRaw({ data: payload }, status);

    if (url === '/__e2e/mode' && req.method === 'POST') {
      gmvHiddenMode = Boolean(parsedBody?.gmvHidden);
      return jsonRaw({ ok: true, gmvHidden: gmvHiddenMode });
    }
    if (url === '/__e2e/requests') {
      return jsonRaw({ gmvHidden: gmvHiddenMode, requests: requestLog });
    }

    // Identity & POS layout calls required by src/layouts/admin.vue
    if (url.includes('ForceLogout')) {
      return json(false);
    }
    if (url.includes('/Identity/Field') || url.includes('GetField')) {
      return json({ fieldName: '{}' });
    }
    if (url.includes('/Identity/SetSite') || url.includes('UpdateLastSiteSession')) {
      return json(true);
    }
    if (url.includes('RefreshToken')) {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({
          id: '00000000-0000-0000-0000-000000000001',
          name: 'BOD E2E Tester',
          exp: Math.floor(Date.now() / 1000) + 86400,
          scope: [
            'manager.dashboard.read',
            'manager.dashboard-v2.bod',
            ...(gmvHiddenMode ? [] : ['manager.dashboard-v2.gmv.read']),
            'manager.dashboard-v2.kpi.write',
            'manager.dashboard-v2.traffic.write',
          ].join(' '),
          roleCode: 'BOD',
          roleName: 'Ban Giám Đốc',
        })
      ).toString('base64url');
      return json({
        accessToken: `${header}.${payload}.e2e`,
        refreshToken: 'e2e-refresh-token',
      });
    }
    if (url.includes('/Admin/Site/')) {
      return json([
        { id: 'site-1', code: 'Q1', name: 'HMK Quận 1' },
        { id: 'site-2', code: 'TD', name: 'HMK Thủ Đức' },
      ]);
    }
    if (url.includes('/Admin/Staff/')) {
      return json([
        { id: 'staff-1', code: 'NV01', name: 'Nguyễn Thị Minh Anh', sites: [{ id: 'site-1', name: 'HMK Quận 1' }] },
      ]);
    }

    if (url.endsWith('/Admin/V2/Dashboard/Access')) {
      return json({
        role: 'BOD',
        allSites: true,
        allowedSiteIds: ['site-1', 'site-2'],
        pages: ['executive', 'operational', 'product', 'personnel', 'kpi'],
        flags: {
          gmvRead: !gmvHiddenMode,
          kpiWrite: true,
          trafficWrite: true,
        },
        legacyScopeMapped: false,
        staffId: null,
      });
    }
    if (url.endsWith('/Admin/V2/Dashboard/Regions')) {
      return json([
        {
          id: 'reg-hcm',
          code: 'HCM',
          name: 'TP. Hồ Chí Minh',
          sortOrder: 1,
          clusters: [
            {
              id: 'clu-hcm-1',
              code: 'CLU1',
              name: 'Cụm Trung Tâm',
              sortOrder: 1,
              sites: [{ id: 'site-1', code: 'Q1', name: 'HMK Quận 1' }],
            },
            {
              id: 'clu-hcm-2',
              code: 'CLU2',
              name: 'Cụm Khu Đông',
              sortOrder: 2,
              sites: [{ id: 'site-2', code: 'TD', name: 'HMK Thủ Đức' }],
            },
          ],
          sites: [
            { id: 'site-1', code: 'Q1', name: 'HMK Quận 1', clusterId: 'clu-hcm-1', clusterName: 'Cụm Trung Tâm' },
            { id: 'site-2', code: 'TD', name: 'HMK Thủ Đức', clusterId: 'clu-hcm-2', clusterName: 'Cụm Khu Đông' },
          ],
        },
      ]);
    }
    if (url.endsWith('/Admin/V2/Dashboard/FilterOptions')) {
      return json({
        categories: [{ id: 'cat-1', name: 'Gọng kính' }],
        brands: [{ id: 'brand-1', name: 'HMK Eyewear' }],
        staff: [{ id: 'staff-1', code: 'NV01', name: 'Nguyễn Thị Minh Anh', siteIds: ['site-1'] }],
        genders: [0, 1, 2],
        basketSegments: [0, 1, 2, 3, 4, 5],
        orderStatuses: [0, 1, 2, 3, 4],
      });
    }
    if (url.endsWith('/Admin/V2/Dashboard/DataFreshness')) {
      return json({
        lastUpdatedAt: '2026-10-27T10:00:00+07:00',
        isStale: false,
        datasets: [],
      });
    }
    if (url.endsWith('/Admin/V2/Dashboard/Recompute/Latest')) {
      return json(null);
    }
    if (url.endsWith('/Admin/V2/Dashboard/Executive/Kpis')) return json(getExecutiveKpis());
    if (url.endsWith('/Admin/V2/Dashboard/Executive/PreviousPeriod')) return json(getExecutivePrevious());
    if (url.endsWith('/Admin/V2/Dashboard/Executive/Trend')) return json(getExecutiveTrend());
    if (url.endsWith('/Admin/V2/Dashboard/Executive/Ranking')) return json(getExecutiveRanking());
    if (url.endsWith('/Admin/V2/Dashboard/Executive/CustomerGrowth')) return json(getExecutiveCustomerGrowth());
    if (url.endsWith('/Admin/V2/Dashboard/Executive')) {
      return json({
        kpis: getExecutiveKpis(),
        previousPeriod: getExecutivePrevious(),
        trend: getExecutiveTrend(),
        ranking: getExecutiveRanking(),
        customerGrowth: getExecutiveCustomerGrowth(),
        topBranches: liveBlock([]),
        topProducts: liveBlock([]),
      });
    }
    if (url.endsWith('/Admin/V2/Dashboard/Operational/BasketSize')) return json(getOperationalBasketSize());
    if (url.endsWith('/Admin/V2/Dashboard/Operational/RefundRate')) return json(getOperationalRefundRate());
    if (url.endsWith('/Admin/V2/Dashboard/Operational/TimePeak')) return json(getOperationalTimePeak());
    if (url.endsWith('/Admin/V2/Dashboard/Operational/MarketingCampaign')) return json(getOperationalCampaigns());
    if (url.endsWith('/Admin/V2/Dashboard/Operational/ConversionRate')) return json(getOperationalConversion());
    if (url.endsWith('/Admin/V2/Dashboard/Operational/OrderAging')) return json(liveBlock([]));
    if (url.endsWith('/Admin/V2/Dashboard/Operational/Demographics')) return json(liveBlock([]));
    if (url.endsWith('/Admin/V2/Dashboard/Operational/Anomaly')) return json(liveBlock([]));
    if (url.endsWith('/Admin/V2/Dashboard/Operational/PaymentMethod')) {
      return json(liveBlock({ version: 'dashboard-v2-live-v1', items: [], paymentMethods: [] }));
    }
    if (url.endsWith('/Admin/V2/Dashboard/Operational/RegionalBenchmark')) return json(liveBlock([]));
    if (url.endsWith('/Admin/V2/Dashboard/Operational')) {
      return json({
        orderAging: liveBlock([]),
        timePeak: getOperationalTimePeak(),
        demographics: liveBlock([]),
        basketSize: getOperationalBasketSize(),
        refundRate: getOperationalRefundRate(),
        anomaly: liveBlock([]),
        paymentMethod: liveBlock({ version: 'dashboard-v2-live-v1', items: [], paymentMethods: [] }),
        marketingCampaign: getOperationalCampaigns(),
        conversionRate: getOperationalConversion(),
        regionalBenchmark: liveBlock([]),
      });
    }
    if (url.endsWith('/Admin/V2/Dashboard/Personnel')) return json(getPersonnel());
    if (url.endsWith('/Admin/V2/Dashboard/Heatmap')) {
      return json(liveBlock({ granularity: 0, columns: [], rows: [] }));
    }
    return json([]);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`E2E Mock Report API listening on http://127.0.0.1:${PORT}`);
});
