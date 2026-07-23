import { MetricData, BranchPerformance, ProductData } from "./types";

// Helper for generating sparkline data
const generateSparkline = (
  points: number,
  min: number,
  max: number,
  spikeIdx: number = -1,
  spikeVal: number = 0,
) => {
  return Array.from({ length: points }).map((_, i) => ({
    value: i === spikeIdx ? spikeVal : Math.random() * (max - min) + min,
  }));
};

// CHƯƠNG 1: Nhịp đập kinh doanh
export const executiveMetrics: MetricData[] = [
  {
    title: "DOANH THU (REVENUE)",
    unit: "Tỷ VNĐ",
    subValue: "Có VAT: 45.2T | Không VAT: 41.1T",
    currentValueNumber: 45.2,
    currentValueNumberNoVat: 41.1,
    previousValueNumber: 40.17,
    previousValueNumberNoVat: 36.5,
    formatType: "number",
    sparklineData: generateSparkline(30, 1.2, 1.8),
    iconType: "money",
  },
  {
    title: "DOANH SỐ (GROSS SALES)",
    unit: "Tỷ VNĐ",
    subValue: "Có VAT: 48.5T | Không VAT: 44.1T",
    currentValueNumber: 48.5,
    currentValueNumberNoVat: 44.1,
    previousValueNumber: 44.01,
    previousValueNumberNoVat: 40.0,
    formatType: "number",
    sparklineData: generateSparkline(30, 1.3, 1.9),
    iconType: "chart",
  },
  {
    title: "BIÊN LỢI NHUẬN GỘP",
    unit: "%",
    subValue: "Cơ cấu gọng kính cao",
    currentValueNumber: 68.5,
    currentValueNumberNoVat: 68.5,
    previousValueNumber: 65.2,
    previousValueNumberNoVat: 65.2,
    formatType: "number",
    sparklineData: generateSparkline(30, 60, 75),
    iconType: "chart",
  },
  {
    title: "ĐƠN HÀNG (VOLUME)",
    unit: "Đơn",
    subValue: "Đã hoàn thành",
    currentValueNumber: 12450,
    previousValueNumber: 11812,
    formatType: "number",
    sparklineData: generateSparkline(30, 300, 500),
    iconType: "receipt",
  },
  {
    title: "GIÁ TRỊ ĐƠN TB (AOV)",
    unit: "Triệu/Đơn",
    subValue: "Năng lực up-sell",
    currentValueNumber: 3.6,
    currentValueNumberNoVat: 3.27,
    previousValueNumber: 3.33,
    previousValueNumberNoVat: 3.03,
    formatType: "number",
    sparklineData: generateSparkline(30, 3.2, 3.8),
    iconType: "basket",
  },
];

// CHƯƠNG 2: Xu hướng thời gian (YTD)
export const timeTrendData = Array.from({ length: 30 }).map((_, i) => {
  const dailyTarget = 150;
  const target = (i + 1) * dailyTarget;
  const revenue = Math.floor(Math.random() * 80) + 110;
  const revenueYTD = target - (30 - i) * 15 + Math.random() * 20;
  
  // Mock actual collection (Thực thu)
  const actualCollection = Math.floor(revenue * (0.85 + Math.random() * 0.1));
  const actualCollectionYTD = revenueYTD * 0.9;
  const actualTarget = target * 0.9;

  return {
    date: `2026-07-${(i + 1).toString().padStart(2, "0")}`,
    revenue: revenue,
    revenueYTD: Math.floor(revenueYTD),
    actualCollection: actualCollection,
    actualCollectionYTD: Math.floor(actualCollectionYTD),
    target: target,
    actualTarget: actualTarget,
  };
});

// CHƯƠNG 3: Điểm nghẽn vận hành (Order Aging)
export const orderAgingData = {
  quantity: [
    { stage: "Đo khám", day1_5: 150, day5_10: 25, day10_20: 10, dayOver20: 5 },
    {
      stage: "Mài lắp",
      day1_5: 850,
      day5_10: 250,
      day10_20: 50,
      dayOver20: 20,
    },
    {
      stage: "Vận chuyển",
      day1_5: 250,
      day5_10: 175,
      day10_20: 80,
      dayOver20: 60,
    },
  ],
  value: [
    { stage: "Đo khám", day1_5: 450, day5_10: 80, day10_20: 35, dayOver20: 20 },
    {
      stage: "Mài lắp",
      day1_5: 2800,
      day5_10: 850,
      day10_20: 180,
      dayOver20: 75,
    },
    {
      stage: "Vận chuyển",
      day1_5: 750,
      day5_10: 525,
      day10_20: 240,
      dayOver20: 190,
    },
  ],
};

// CHƯƠNG 4: Chân dung khách hàng
export const populationData = {
  quantity: [
    { age: "HS-SV (<25)", male: -15, female: 25 },
    { age: "VP (25-35)", male: -12, female: 23 },
    { age: "Trung niên (35-50)", male: -6, female: 9 },
    { age: "Lớn tuổi (>50)", male: -4, female: 6 },
  ],
  value: [
    { age: "HS-SV (<25)", male: -5.5, female: 8.2 },
    { age: "VP (25-35)", male: -10.2, female: 15.5 },
    { age: "Trung niên (35-50)", male: -7.5, female: 10.2 },
    { age: "Lớn tuổi (>50)", male: -4.2, female: 6.5 },
  ],
};

export const basketSizeData = [
  { name: "< 5 Tr", value: 45, fill: "#94a3b8" },
  { name: "5 - 10 Tr", value: 30, fill: "#3b82f6" },
  { name: "10 - 20 Tr", value: 15, fill: "#6366f1" },
  { name: "20 - 30 Tr", value: 7, fill: "#8b5cf6" },
  { name: "> 30 Tr", value: 3, fill: "#d946ef" },
];

// CHƯƠNG 5: Thời gian bán hàng tối ưu & Hình thức thanh toán
export const dayOfWeekData = [
  { name: "Thứ 2", value: 450 },
  { name: "Thứ 3", value: 500 },
  { name: "Thứ 4", value: 480 },
  { name: "Thứ 5", value: 550 },
  { name: "Thứ 6", value: 800 },
  { name: "Thứ 7", value: 1200 },
  { name: "Chủ Nhật", value: 1100 },
];

export const hourOfDayData = [
  { name: "8-10h", value: 200 },
  { name: "10-12h", value: 450 },
  { name: "12-14h", value: 300 },
  { name: "14-16h", value: 400 },
  { name: "16-18h", value: 850 },
  { name: "18-20h", value: 1100 },
  { name: "20-22h", value: 600 },
];

export const paymentData = [
  { name: "Chuyển khoản (CK)", value: 65, fill: "#3b82f6" },
  { name: "Tiền mặt", value: 20, fill: "#10b981" },
  { name: "Quẹt thẻ (POS)", value: 10, fill: "#f59e0b" },
  { name: "App / Trả góp", value: 5, fill: "#8b5cf6" },
];

export const marketingCampaignsData = [
  { name: "Back to School 2026", revenue: 15.2, orders: 4200 },
  { name: "Khai trương Chi nhánh mới", revenue: 8.5, orders: 2100 },
  { name: "Summer Sale", revenue: 5.4, orders: 1500 },
  { name: "Combo Đa tròng", revenue: 4.1, orders: 850 },
];

// CHƯƠNG 6: Sản phẩm
export const treemapData = [
  { name: "Gọng kính", size: 45, fill: "#6366f1" },
  { name: "Tròng kính", size: 40, fill: "#10b981" },
  { name: "Kính mát", size: 10, fill: "#f59e0b" },
  { name: "Áp tròng", size: 4, fill: "#ec4899" },
  { name: "Phụ kiện", size: 1, fill: "#94a3b8" },
];

export const scatterData = [
  // Cận thị (Myopia) không loạn
  { sphere: -1.0, cylinder: 0, quantity: 850, fill: "#3b82f6", color: "Trong suốt" },
  { sphere: -1.5, cylinder: 0, quantity: 1200, fill: "#3b82f6", color: "Trong suốt" },
  { sphere: -2.0, cylinder: 0, quantity: 1500, fill: "#3b82f6", color: "Trong suốt" },
  { sphere: -3.0, cylinder: 0, quantity: 600, fill: "#8b5cf6", color: "Đổi màu" },
  
  // Cận thị có loạn (Myopia + Astigmatism)
  { sphere: -1.5, cylinder: -0.5, quantity: 500, fill: "#3b82f6", color: "Trong suốt" },
  { sphere: -2.0, cylinder: -1.0, quantity: 950, fill: "#8b5cf6", color: "Đổi màu" },
  { sphere: -3.5, cylinder: -1.5, quantity: 300, fill: "#f59e0b", color: "Đa tròng" },
  { sphere: -4.5, cylinder: -2.0, quantity: 80, fill: "#ec4899", color: "Chống AS Xanh" },

  // Viễn thị (Hyperopia)
  { sphere: 1.0, cylinder: 0, quantity: 450, fill: "#3b82f6", color: "Trong suốt" },
  { sphere: 1.5, cylinder: -0.5, quantity: 200, fill: "#f59e0b", color: "Đa tròng" },
  { sphere: 2.0, cylinder: 0, quantity: 150, fill: "#8b5cf6", color: "Đổi màu" },
  { sphere: 2.5, cylinder: -1.0, quantity: 80, fill: "#3b82f6", color: "Trong suốt" },
];

export const categoryData = [
  { name: "Gọng kính", value: 45, fill: "#6366f1" },
  { name: "Tròng kính", value: 40, fill: "#10b981" },
  { name: "Kính mát", value: 10, fill: "#f59e0b" },
  { name: "Áp tròng", value: 4, fill: "#ec4899" },
  { name: "Phụ kiện", value: 1, fill: "#94a3b8" },
];

export const lensTypeData = [
  { name: "Đơn tròng thường", value: 45, fill: "#94a3b8" },
  { name: "Chống AS Xanh", value: 35, fill: "#3b82f6" },
  { name: "Đổi màu", value: 12, fill: "#8b5cf6" },
  { name: "Đa tròng", value: 8, fill: "#f59e0b" },
];

export const frameTypeData = [
  { name: "Gọng Nhựa", value: 55, fill: "#6366f1" },
  { name: "Gọng Kim Loại", value: 35, fill: "#06b6d4" },
  { name: "Gọng Khoan", value: 10, fill: "#ec4899" },
];

export const brandPerformanceData = [
  { name: "HMK Eyewear", value: 25.5, share: 55 },
  { name: "Essilor", value: 8.2, share: 18 },
  { name: "Chemi", value: 6.5, share: 14 },
  { name: "Zeiss", value: 3.5, share: 8 },
  { name: "Hoya", value: 2.3, share: 5 },
];

export const multidimensionalAnalysisData = {
  category: [
    { name: "Gọng kính", value: 20.3, quantity: 8500 },
    { name: "Tròng kính", value: 18.1, quantity: 7200 },
    { name: "Kính mát", value: 4.5, quantity: 1800 },
    { name: "Áp tròng", value: 1.8, quantity: 750 },
    { name: "Phụ kiện", value: 0.5, quantity: 3000 },
  ],
  subCategoryLens: [
    { name: "Chống tia UV", value: 6.5, quantity: 3000 },
    { name: "Chống ánh sáng xanh", value: 5.2, quantity: 2000 },
    { name: "Đổi màu", value: 4.1, quantity: 1500 },
    { name: "Đa tròng", value: 2.3, quantity: 700 },
  ],
  subCategoryFrame: [
    { name: "Nhựa Acetate", value: 9.5, quantity: 4000 },
    { name: "Kim loại Titanium", value: 7.2, quantity: 2500 },
    { name: "Nhựa TR90", value: 3.6, quantity: 2000 },
  ],
  brandLens: [
    { name: "Essilor", value: 8.2, quantity: 2100 },
    { name: "Chemi", value: 6.5, quantity: 3500 },
    { name: "Zeiss", value: 3.5, quantity: 500 },
    { name: "Hoya", value: 2.3, quantity: 900 },
  ],
  brandFrame: [
    { name: "HMK Eyewear", value: 12.5, quantity: 5500 },
    { name: "Ray-Ban", value: 4.2, quantity: 800 },
    { name: "Gentle Monster", value: 2.8, quantity: 500 },
    { name: "Bolon", value: 0.8, quantity: 1700 },
  ],
  supplier: [
    { name: "Nhà cung cấp A", value: 15.5, quantity: 7500 },
    { name: "Nhà cung cấp B", value: 12.2, quantity: 5200 },
    { name: "Nhà cung cấp C", value: 8.5, quantity: 4100 },
    { name: "Nhà cung cấp D", value: 5.8, quantity: 2300 },
    { name: "Khác", value: 3.2, quantity: 2150 },
  ],
  refractiveIndex: [
    { name: "1.56", value: 7.5, quantity: 4200 },
    { name: "1.61", value: 5.2, quantity: 1800 },
    { name: "1.67", value: 3.8, quantity: 900 },
    { name: "1.74", value: 1.6, quantity: 300 },
  ],
  color: [
    { name: "Trong suốt (Clear)", value: 12.5, quantity: 5500 },
    { name: "Đen (Black)", value: 5.2, quantity: 2800 },
    { name: "Đồi mồi (Tortoise)", value: 3.8, quantity: 1500 },
    { name: "Khói (Smoke)", value: 2.6, quantity: 900 },
    { name: "Khác", value: 1.2, quantity: 550 },
  ],
};

export const topProductsData: ProductData[] = [
  {
    id: "1",
    name: "NƯỚC RỬA KÍNH",
    quantity: 15037,
    supplier: "HMK Eyewear",
    power: "N/A",
    color: "N/A",
  },
  {
    id: "2",
    name: "Tròng Chemi U2 1.60",
    quantity: 11991,
    supplier: "Chemi",
    power: "-2.00",
    color: "Trong suốt",
  },
  {
    id: "3",
    name: "Gọng ECMM5016",
    quantity: 7908,
    supplier: "HMK Eyewear",
    power: "N/A",
    color: "Nâu Hồng",
  },
  {
    id: "4",
    name: "Tròng Essilor Crizal",
    quantity: 2622,
    supplier: "Essilor",
    power: "-3.50",
    color: "Trong suốt",
  },
  {
    id: "5",
    name: "Nước ngâm lens Eye Multi",
    quantity: 1484,
    supplier: "Eye Multi",
    power: "N/A",
    color: "N/A",
  },
  {
    id: "6",
    name: "HỘP MẮT (BẠC)",
    quantity: 1283,
    supplier: "Phụ kiện HMK",
    power: "N/A",
    color: "Bạc",
  },
  {
    id: "7",
    name: "Tròng Zeiss MyoVision",
    quantity: 1228,
    supplier: "Zeiss",
    power: "-1.50",
    color: "Trong suốt",
  },
  {
    id: "8",
    name: "Gọng Titanium T8012",
    quantity: 1108,
    supplier: "HMK Eyewear",
    power: "N/A",
    color: "Đen nhám",
  },
];

// CHƯƠNG 7: Nhân sự (Human Performance)
export const picSalesData = [
  { name: "Nguyễn Văn A", revenue: 1.2, aov: 4.5 },
  { name: "Trần Thị B", revenue: 0.95, aov: 3.2 },
  { name: "Lê Văn C", revenue: 1.5, aov: 5.1 },
  { name: "Phạm Thị D", revenue: 0.8, aov: 2.8 },
  { name: "Hoàng Văn E", revenue: 1.1, aov: 3.8 },
];

export const picKtvDoData = [
  { name: "BS. Tuấn", conversion: 92, accuracy: 99 },
  { name: "KTV. Hoàng", conversion: 85, accuracy: 95 },
  { name: "KTV. Linh", conversion: 88, accuracy: 97 },
  { name: "BS. My", conversion: 95, accuracy: 99.5 },
];

export const picKtvMaiData = [
  { name: "Lab - Hùng", speed: 95, defect: 1.2 },
  { name: "Lab - Dũng", speed: 88, defect: 2.5 },
  { name: "Lab - Tuấn", speed: 92, defect: 1.5 },
];

export const branchPerformanceData: BranchPerformance[] = [
  {
    id: "1",
    name: "HMK BÌNH DƯƠNG",
    revenue: 763.7,
    target: 1285.7,
    previousRevenue: 845.7,
    gpm: 70.3,
    upt: 5.63,
    atv: 1.4,
    remakeRate: 0,
    returnRate: 0,
  },
  {
    id: "2",
    name: "Shopee - HMK Eyewear",
    revenue: 697.1,
    target: 700.0,
    previousRevenue: 726.1,
    gpm: 100,
    upt: 1.38,
    atv: 0.15,
    remakeRate: 0,
    returnRate: 0,
  },
  {
    id: "3",
    name: "HMK Q10 SVH",
    revenue: 674.8,
    target: 1554.8,
    previousRevenue: 683.0,
    gpm: 70.5,
    upt: 4.97,
    atv: 1.5,
    remakeRate: 0,
    returnRate: 0.4,
  },
  {
    id: "4",
    name: "HMK ĐN LÊ DUẨN 2",
    revenue: 663.8,
    target: 1250.1,
    previousRevenue: 727.1,
    gpm: 74.8,
    upt: 4.73,
    atv: 1.1,
    remakeRate: 0.2,
    returnRate: 0,
  },
  {
    id: "5",
    name: "TikTok - HMK Eyewear",
    revenue: 621.6,
    target: 630.0,
    previousRevenue: 662.0,
    gpm: 100,
    upt: 1.65,
    atv: 0.15,
    remakeRate: 0,
    returnRate: 0.7,
  },
  {
    id: "6",
    name: "HMK NGUYỄN TRÃI Q1.2",
    revenue: 527.2,
    target: 1044.0,
    previousRevenue: 559.1,
    gpm: 70.3,
    upt: 5.18,
    atv: 1.3,
    remakeRate: 0,
    returnRate: 1.3,
  },
  {
    id: "7",
    name: "HMK BÌNH THẠNH",
    revenue: 481.8,
    target: 1672.9,
    previousRevenue: 543.8,
    gpm: 206.5,
    upt: 4.97,
    atv: 0.9,
    remakeRate: 0.4,
    returnRate: 0.4,
  },
  {
    id: "8",
    name: "HMK TĐ VVN 1",
    revenue: 475.8,
    target: 934.8,
    previousRevenue: 628.5,
    gpm: 72.1,
    upt: 4.18,
    atv: 1.1,
    remakeRate: 0,
    returnRate: 0,
  },
  {
    id: "9",
    name: "HMK Q7.2",
    revenue: 470.0,
    target: 1056.2,
    previousRevenue: 486.0,
    gpm: 71.9,
    upt: 4.45,
    atv: 1.1,
    remakeRate: 0,
    returnRate: 0,
  },
  {
    id: "10",
    name: "HMK CẦN THƠ 128",
    revenue: 466.5,
    target: 1187.0,
    previousRevenue: 497.9,
    gpm: 71.9,
    upt: 4.49,
    atv: 1.1,
    remakeRate: 0.2,
    returnRate: 0.2,
  },
];

// CHƯƠNG 8: Tăng trưởng (Growth Analysis)
export const growthTimeData = [
  { period: "Tuần này (WoW)", revenueGrowth: 5.2, orderGrowth: 4.8 },
  { period: "Tháng này (MoM)", revenueGrowth: 12.5, orderGrowth: 15.1 },
  { period: "Năm nay (YoY)", revenueGrowth: 28.4, orderGrowth: 32.6 },
];

export const growthStoreData = [
  { name: "Cửa hàng hiện tại", revenueGrowth: 12.5, orderGrowth: 15.1 },
  { name: "Trung bình Cụm", revenueGrowth: 8.2, orderGrowth: 9.5 },
  { name: "Toàn hệ thống", revenueGrowth: 10.5, orderGrowth: 11.2 },
];

export const growthCategoryData = [
  { category: "Tròng kính", orderGrowth: 25.4 },
  { category: "Gọng kính", orderGrowth: 18.2 },
  { category: "Kính mát", orderGrowth: 45.5 },
  { category: "Áp tròng", orderGrowth: 12.1 },
  { category: "Phụ kiện", orderGrowth: 5.5 },
];

export const growthCustomerTypeData = [
  { name: "Khách hàng mới", value: 45, growth: 22.5 },
  { name: "Khách hàng cũ", value: 55, growth: 12.4 },
];

export const growthDimensionsData = {
  category: [
    { name: "Tròng kính", orderGrowth: 25.4 },
    { name: "Gọng kính", orderGrowth: 18.2 },
    { name: "Kính mát", orderGrowth: 45.5 },
    { name: "Áp tròng", orderGrowth: 12.1 },
    { name: "Phụ kiện", orderGrowth: 5.5 },
  ],
  subCategory: [
    { name: "Chống ánh sáng xanh", orderGrowth: 32.1 },
    { name: "Đổi màu", orderGrowth: 28.5 },
    { name: "Chống tia UV", orderGrowth: 15.4 },
    { name: "Nhựa Acetate", orderGrowth: 18.2 },
    { name: "Kim loại Titanium", orderGrowth: 14.5 },
  ],
  brand: [
    { name: "HMK Eyewear", orderGrowth: 20.1 },
    { name: "Essilor", orderGrowth: 12.5 },
    { name: "Chemi", orderGrowth: 18.2 },
    { name: "Zeiss", orderGrowth: 5.4 },
    { name: "Hoya", orderGrowth: 8.5 },
  ],
  lensFrame: [
    { name: "Tròng kính", orderGrowth: 22.5 },
    { name: "Gọng kính", orderGrowth: 15.8 },
    { name: "Kính mát", orderGrowth: 12.4 },
  ],
  supplier: [
    { name: "Nhà cung cấp A", orderGrowth: 14.5 },
    { name: "Nhà cung cấp B", orderGrowth: 18.2 },
    { name: "Nhà cung cấp C", orderGrowth: -5.4 },
    { name: "Khác", orderGrowth: 2.1 },
  ],
};

export const conversionRateData = {
  store: [
    { name: "HMK BÌNH DƯƠNG", rate: 45.2 },
    { name: "Shopee - HMK Eyewear", rate: 12.5 },
    { name: "HMK Q10 SVH", rate: 38.4 },
    { name: "HMK ĐN LÊ DUẨN 2", rate: 42.1 },
    { name: "TikTok - HMK Eyewear", rate: 8.5 },
  ],
  region: [
    { name: "Miền Bắc", rate: 32.5 },
    { name: "Miền Trung", rate: 28.4 },
    { name: "Miền Nam", rate: 41.2 },
  ],
  system: [{ name: "Toàn hệ thống", rate: 35.8 }],
};

export const refundRateData = [
  { name: "Tỷ lệ hoàn tiền (Doanh thu)", value: 1.2, fill: "#f43f5e" },
  { name: "Tỷ lệ hoàn tiền (Hóa đơn)", value: 1.5, fill: "#f59e0b" },
];

export interface TreemapNode {
  name: string;
  size?: number;
  fill?: string;
  children?: TreemapNode[];
}

export const hierarchicalTreemapData: TreemapNode[] = [
  {
    name: "Gọng kính",
    fill: "#6366f1",
    children: [
      {
        name: "Nhựa Acetate",
        fill: "#6366f1",
        children: [
          { name: "Gọng Acetate Vuông (HMK)", size: 15, fill: "#818cf8" },
          { name: "Gọng Acetate Tròn (HMK)", size: 10, fill: "#a5b4fc" },
        ],
      },
      {
        name: "Kim Loại Titanium",
        fill: "#4f46e5",
        children: [
          { name: "Titanium T8012", size: 12, fill: "#6366f1" },
          { name: "Titanium T8013", size: 8, fill: "#818cf8" },
        ],
      },
    ],
  },
  {
    name: "Tròng kính",
    fill: "#10b981",
    children: [
      {
        name: "Essilor",
        fill: "#10b981",
        children: [
          { name: "Crizal Sapphire 1.60", size: 12, fill: "#34d399" },
          { name: "Crizal Prevencia 1.56", size: 8, fill: "#6ee7b7" },
        ],
      },
      {
        name: "Chemi",
        fill: "#059669",
        children: [
          { name: "Chemi U2 1.60", size: 12, fill: "#10b981" },
          { name: "Chemi U6 1.67", size: 8, fill: "#34d399" },
        ],
      },
    ],
  },
  {
    name: "Kính mát",
    fill: "#f59e0b",
    children: [
      { name: "Ray-Ban", size: 6, fill: "#fbbf24" },
      { name: "Gentle Monster", size: 4, fill: "#fcd34d" },
    ],
  },
  {
    name: "Áp tròng",
    fill: "#ec4899",
    children: [
      { name: "1 Day Acuvue", size: 2, fill: "#f472b6" },
      { name: "Olens", size: 2, fill: "#fbcfe8" },
    ],
  },
  {
    name: "Phụ kiện",
    fill: "#94a3b8",
    children: [
      { name: "Khăn lau kính", size: 0.5, fill: "#cbd5e1" },
      { name: "Nước rửa kính", size: 0.5, fill: "#e2e8f0" },
    ],
  },
];

export const branchRevenueByPeriod = {
  week: [
    { period: "Tuần 1", "Chi nhánh Q1": 120, "Chi nhánh Q3": 95, "Chi nhánh Thủ Đức": 150, "Chi nhánh Gò Vấp": 80 },
    { period: "Tuần 2", "Chi nhánh Q1": 130, "Chi nhánh Q3": 105, "Chi nhánh Thủ Đức": 140, "Chi nhánh Gò Vấp": 90 },
    { period: "Tuần 3", "Chi nhánh Q1": 110, "Chi nhánh Q3": 115, "Chi nhánh Thủ Đức": 160, "Chi nhánh Gò Vấp": 85 },
    { period: "Tuần 4", "Chi nhánh Q1": 140, "Chi nhánh Q3": 125, "Chi nhánh Thủ Đức": 155, "Chi nhánh Gò Vấp": 100 },
  ],
  month: [
    { period: "Tháng 1", "Chi nhánh Q1": 450, "Chi nhánh Q3": 380, "Chi nhánh Thủ Đức": 520, "Chi nhánh Gò Vấp": 310 },
    { period: "Tháng 2", "Chi nhánh Q1": 420, "Chi nhánh Q3": 410, "Chi nhánh Thủ Đức": 540, "Chi nhánh Gò Vấp": 350 },
    { period: "Tháng 3", "Chi nhánh Q1": 510, "Chi nhánh Q3": 450, "Chi nhánh Thủ Đức": 600, "Chi nhánh Gò Vấp": 400 },
    { period: "Tháng 4", "Chi nhánh Q1": 480, "Chi nhánh Q3": 430, "Chi nhánh Thủ Đức": 580, "Chi nhánh Gò Vấp": 380 },
    { period: "Tháng 5", "Chi nhánh Q1": 550, "Chi nhánh Q3": 480, "Chi nhánh Thủ Đức": 620, "Chi nhánh Gò Vấp": 420 },
    { period: "Tháng 6", "Chi nhánh Q1": 600, "Chi nhánh Q3": 520, "Chi nhánh Thủ Đức": 680, "Chi nhánh Gò Vấp": 450 },
  ],
  quarter: [
    { period: "Q1 2026", "Chi nhánh Q1": 1380, "Chi nhánh Q3": 1240, "Chi nhánh Thủ Đức": 1660, "Chi nhánh Gò Vấp": 1060 },
    { period: "Q2 2026", "Chi nhánh Q1": 1630, "Chi nhánh Q3": 1430, "Chi nhánh Thủ Đức": 1880, "Chi nhánh Gò Vấp": 1250 },
  ],
  year: [
    { period: "2025", "Chi nhánh Q1": 5200, "Chi nhánh Q3": 4800, "Chi nhánh Thủ Đức": 6500, "Chi nhánh Gò Vấp": 4100 },
    { period: "2026", "Chi nhánh Q1": 3010, "Chi nhánh Q3": 2670, "Chi nhánh Thủ Đức": 3540, "Chi nhánh Gò Vấp": 2310 },
  ]
};
