import { BRANCH_TO_REGION } from "./constants";
import { Period } from "../AppContext";

export interface ChartDataPoint {
  label: string;
  startDate: Date;
  endDate: Date;
  [key: string]: any;
}

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

export const getDailyMetrics = (date: Date, region: string = "Tất cả Khu vực", branch: string = "Tất cả Chi nhánh") => {
  const dateStr = date.toISOString().split('T')[0];
  const seed = hashString(dateStr);
  const rand = seededRandom(seed);

  const month = date.getMonth() + 1; // 1-12
  const dayOfWeek = date.getDay(); // 0-6

  // Base metrics: ~20-30 million VNĐ
  let baseGmv = 20 + (rand * 10); 
  
  // Seasonality: Back to school peak
  if (month === 8) baseGmv *= 1.5; 
  if (month === 9) baseGmv *= 1.3;
  if (month === 7) baseGmv *= 1.1;

  // Weekend bump
  if (dayOfWeek === 0 || dayOfWeek === 6) baseGmv *= 1.4;

  const gmv = baseGmv;
  const netRev = gmv * (0.85 + seededRandom(seed+1) * 0.05); // 85-90%
  const orders = Math.floor(gmv / (0.7 + seededRandom(seed+2) * 0.2)); // AOV ~0.7-0.9m
  
  const baseBranches = {
      'HMK ĐN Chi nhánh 2': gmv * 0.3,
      'HMK HN Chi nhánh 1': gmv * 0.25,
      'HMK BD Chi nhánh 3': gmv * 0.2,
      'HMK Chi nhánh 4': gmv * 0.15,
      'HMK HN Chi nhánh 5': gmv * 0.1,
    };

    let filteredGmv = 0;
    const filteredBranches: Record<string, number> = {};

    Object.keys(baseBranches).forEach(bName => {
      const bRegion = BRANCH_TO_REGION[bName] || 'Khác';
      const matchRegion = region === 'Tất cả Khu vực' || region === bRegion;
      const matchBranch = branch === 'Tất cả Chi nhánh' || branch === bName;

      if (matchRegion && matchBranch) {
        const val = baseBranches[bName as keyof typeof baseBranches];
        filteredGmv += val;
        filteredBranches[bName] = val;
      }
    });

    const ratio = gmv > 0 ? filteredGmv / gmv : 0;

    return {
      gmv: filteredGmv,
      netRev: netRev * ratio,
      orders: Math.round(orders * ratio),
      frames: gmv * 0.4 * ratio,
      lenses: gmv * 0.45 * ratio,
      contactLenses: gmv * 0.1 * ratio,
      accessories: gmv * 0.05 * ratio,
      branches: filteredBranches,
      refunds: gmv * 0.05 * ratio,
      upsale: gmv * 0.1 * ratio,
      directOrder: gmv * (0.35 + seededRandom(seed+4) * 0.05) * ratio,
      preOrder: gmv * (0.65 - seededRandom(seed+4) * 0.05) * ratio,
      grossMargin: 0.7 + (seededRandom(seed+3) * 0.05)
    };
};

export const aggregateMetrics = (start: Date, end: Date, region: string = "Tất cả Khu vực", branch: string = "Tất cả Chi nhánh") => {
  let current = new Date(start);
  current.setHours(0,0,0,0);
  const endDay = new Date(end);
  endDay.setHours(0,0,0,0);

  const total = {
    gmv: 0, netRev: 0, orders: 0, frames: 0, lenses: 0, contactLenses: 0, accessories: 0, refunds: 0, upsale: 0, directOrder: 0, preOrder: 0,
    branches: {} as Record<string, number>,
    days: 0,
    avgGrossMargin: 0
  };

  let sumMargin = 0;

  while (current <= endDay) {
    const daily = getDailyMetrics(current, region, branch);
    total.gmv += daily.gmv;
    total.netRev += daily.netRev;
    total.orders += daily.orders;
    total.frames += daily.frames;
    total.lenses += daily.lenses;
    total.contactLenses += daily.contactLenses;
    total.accessories += daily.accessories;
    total.refunds += daily.refunds;
    total.upsale += daily.upsale;
    total.directOrder += daily.directOrder;
    total.preOrder += daily.preOrder;
    
    Object.keys(daily.branches).forEach(k => {
      total.branches[k] = (total.branches[k] || 0) + daily.branches[k];
    });
    
    sumMargin += daily.grossMargin;
    total.days++;
    
    current.setDate(current.getDate() + 1);
  }
  
  if (total.days > 0) {
    total.avgGrossMargin = sumMargin / total.days;
  }

  return total;
};

export const generateChartDataByPeriod = (
  startDateStr: string,
  endDateStr: string,
  period: Period,
  generatorFunc: (periodStart: Date, periodEnd: Date) => { [key: string]: any }
): ChartDataPoint[] => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const data: ChartDataPoint[] = [];
  
  if (start > end) return data;

  let currentStart = new Date(start);
  let index = 0;

  while (currentStart <= end) {
    const periodStart = new Date(currentStart);
    let currentEnd = new Date(currentStart);
    let label = "";

    switch (period) {
      case "day":
        label = currentStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
        currentEnd = new Date(currentStart);
        currentStart.setDate(currentStart.getDate() + 1);
        break;
      case "week":
        currentEnd.setDate(currentStart.getDate() + 6);
        if (currentEnd > end) currentEnd = new Date(end);
        label = `Tuần ${index + 1} (${periodStart.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })})`;
        currentStart.setDate(currentStart.getDate() + 7);
        break;
      case "month":
        currentEnd = new Date(currentStart.getFullYear(), currentStart.getMonth() + 1, 0);
        if (currentEnd > end) currentEnd = new Date(end);
        label = `Tháng ${currentStart.getMonth() + 1}`;
        currentStart.setMonth(currentStart.getMonth() + 1);
        currentStart.setDate(1);
        break;
      case "quarter":
        const quarter = Math.floor(currentStart.getMonth() / 3) + 1;
        currentEnd = new Date(currentStart.getFullYear(), quarter * 3, 0);
        if (currentEnd > end) currentEnd = new Date(end);
        label = `Quý ${quarter}`;
        currentStart.setMonth(quarter * 3);
        currentStart.setDate(1);
        break;
      case "year":
        currentEnd = new Date(currentStart.getFullYear(), 11, 31);
        if (currentEnd > end) currentEnd = new Date(end);
        label = `Năm ${currentStart.getFullYear()}`;
        currentStart.setFullYear(currentStart.getFullYear() + 1);
        currentStart.setMonth(0);
        currentStart.setDate(1);
        break;
    }

    data.push({
      label,
      startDate: periodStart,
      endDate: currentEnd,
      ...generatorFunc(periodStart, currentEnd)
    });
    
    index++;
  }

  return data;
};
