import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  CreditCard, 
  XCircle, 
  FilePlus,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Receipt,
  ShoppingBasket
} from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { useAppContext } from "../AppContext";
import { aggregateMetrics, getDailyMetrics } from "../utils/chartEngine";

interface SparklineData {
  value: number;
}

interface FinancialCardProps {
  title: string;
  tooltipDesc: string;
  tooltipFormula?: string;
  tooltipPosition?: "left" | "center" | "right";
  value: string;
  unit: string;
  subInfo: string;
  trendValue: string;
  isPositive: boolean;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  sparklineData: SparklineData[];
  sparklineColor: string;
  footerCurr?: string;
  footerPrev?: string;
}

const generateSparklineData = (base: number, variance: number, trend: 'up' | 'down' | 'flat' = 'up'): SparklineData[] => {
  return Array.from({ length: 30 }).map((_, i) => {
    let trendFactor = 0;
    if (trend === 'up') trendFactor = i * (variance / 15);
    if (trend === 'down') trendFactor = -i * (variance / 15);
    
    // Add some random spikes and drops
    const isSpike = Math.random() > 0.8;
    const spikeMult = isSpike ? (Math.random() > 0.5 ? 1.5 : 0.5) : 1;
    
    return {
      value: (base + trendFactor + (Math.random() * variance - variance / 2)) * spikeMult
    };
  });
};

const FinancialCard: React.FC<FinancialCardProps> = ({
  title,
  tooltipDesc,
  tooltipFormula,
  value,
  unit,
  subInfo,
  trendValue,
  isPositive,
  icon,
  iconBgColor,
  iconColor,
  sparklineData,
  sparklineColor,
  tooltipPosition,
  footerCurr,
  footerPrev
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col hover:border-indigo-200 hover:shadow-md transition-all duration-300 relative group">
      {/* Top Header */}
      <div className="flex justify-between items-start mb-3">
        <InfoTooltip
          label={<span className="text-xs font-bold text-slate-500 tracking-wider">{title}</span>}
          description={tooltipDesc}
          formula={tooltipFormula}
          tooltipWidth="w-56"
          labelClassName=""
          tooltipPosition={tooltipPosition}
        />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
      </div>
      
      {/* Value */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold text-slate-800 tracking-tight">{value}</span>
        <span className="text-sm font-semibold text-slate-500">{unit}</span>
      </div>
      
      {/* Sub Info */}
      <p className="text-xs text-slate-500 mb-2 truncate" title={subInfo}>{subInfo}</p>
      
      {/* Trend */}
      <div className={`flex items-center text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'} mb-4`}>
        {isPositive ? <ArrowUp className="w-3 h-3 mr-0.5" strokeWidth={3} /> : <ArrowDown className="w-3 h-3 mr-0.5" strokeWidth={3} />}
        {trendValue}
        <span className="text-slate-400 font-normal ml-1">so với kỳ trước</span>
      </div>

      {/* Sparkline Chart */}
      <div className="h-12 w-full mt-auto relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Line 
              type="step" 
              dataKey="value" 
              stroke={sparklineColor} 
              strokeWidth={1.5} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Footer Dates */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1 border-t border-slate-100 pt-2">
        <span>01/09 — 30/09/2026</span>
        <span className="text-[9px]">{subInfo.includes("VAT") ? "" : ""}</span>
      </div>
    </div>
  );
};

export const FinancialOverviewCards = () => {
  const { dateRange, globalRegion, globalBranch } = useAppContext();

  const metrics = useMemo(() => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    const agg = aggregateMetrics(start, end);
    
    const ms = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - ms - 86400000);
    const prevEnd = new Date(end.getTime() - ms - 86400000);
    const prevAgg = aggregateMetrics(prevStart, prevEnd);

    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return { val: "0,0", isPos: true };
      const diff = ((curr - prev) / prev) * 100;
      return { val: Math.abs(diff).toFixed(1).replace('.', ','), isPos: diff >= 0 };
    };

    // Generate real sparklines for the selected period
    const sparklines = {
      gmv: [] as any[], newCustomers: [] as any[], gross: [] as any[], adjust: [] as any[], net: [] as any[], margin: [] as any[], volume: [] as any[], aov: [] as any[]
    };
    
    let current = new Date(start);
    while (current <= end) {
      const daily = getDailyMetrics(current);
      sparklines.gmv.push({ value: daily.gmv });
      sparklines.newCustomers.push({ value: daily.orders * 0.3 }); // estimate 30% new
      sparklines.gross.push({ value: daily.gmv * 1.05 });
      sparklines.adjust.push({ value: -daily.refunds });
      sparklines.net.push({ value: daily.netRev });
      sparklines.margin.push({ value: daily.grossMargin * 100 });
      sparklines.volume.push({ value: daily.orders });
      sparklines.aov.push({ value: daily.netRev / daily.orders });
      current.setDate(current.getDate() + 1);
    }
    
    const format = (n: number) => (n / 1000).toFixed(2).replace('.', ',');

    const gmvTotalBillion = agg.gmv / 1000;
    const gmvPreVat = gmvTotalBillion / 1.08;
    const gmvVat = gmvTotalBillion - gmvPreVat;
    const gmvSubInfo = `Trước VAT: ${gmvPreVat.toFixed(2).replace('.', ',')}T | VAT: ${gmvVat.toFixed(2).replace('.', ',')}T`;

    const aovTotalMillion = agg.netRev / agg.orders;
    const aovPreVat = aovTotalMillion / 1.08;
    const aovVat = aovTotalMillion - aovPreVat;
    const aovSubInfo = `Trước VAT: ${aovPreVat.toFixed(2).replace('.', ',')}Tr | VAT: ${aovVat.toFixed(2).replace('.', ',')}Tr`;

    return {
      gmv: { val: format(agg.gmv), trend: calcGrowth(agg.gmv, prevAgg.gmv), data: sparklines.gmv, subInfo: gmvSubInfo },
      newCustomers: { val: Math.round(agg.orders * 0.3).toString(), trend: calcGrowth(agg.orders, prevAgg.orders), data: sparklines.newCustomers },
      gross: { val: format(agg.gmv * 1.05), trend: calcGrowth(agg.gmv * 1.05, prevAgg.gmv * 1.05), data: sparklines.gross },
      adjust: { val: "-" + Math.round(agg.refunds).toString(), trend: { val: "15,4", isPos: false }, data: sparklines.adjust },
      net: { val: format(agg.netRev), trend: calcGrowth(agg.netRev, prevAgg.netRev), data: sparklines.net },
      margin: { val: (agg.avgGrossMargin * 100).toFixed(1).replace('.', ','), trend: calcGrowth(agg.avgGrossMargin, prevAgg.avgGrossMargin), data: sparklines.margin },
      volume: { val: agg.orders.toLocaleString('vi-VN'), trend: calcGrowth(agg.orders, prevAgg.orders), data: sparklines.volume },
      aov: { val: aovTotalMillion.toFixed(1).replace('.', ','), trend: calcGrowth(agg.netRev/agg.orders, prevAgg.netRev/prevAgg.orders), data: sparklines.aov, subInfo: aovSubInfo },
      dates: {
        curr: `${start.toLocaleDateString('vi-VN')} — ${end.toLocaleDateString('vi-VN')}`,
        prev: `${prevStart.toLocaleDateString('vi-VN')} — ${prevEnd.toLocaleDateString('vi-VN')}`
      }
    };
  }, [dateRange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <FinancialCard
        title="GMV (SỨC BÁN)"
        tooltipPosition="left"
        tooltipDesc="Tổng sức bán phát sinh trong kỳ."
        tooltipFormula="Giá trị Đơn Đặt + Giá trị Đơn mua thẳng (không qua Đơn Đặt)"
        value={metrics.gmv.val} footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
        unit="Tỷ VNĐ"
        subInfo={metrics.gmv.subInfo}
        trendValue={metrics.gmv.trend.val + "%"}
        isPositive={metrics.gmv.trend.isPos}
        icon={<FilePlus className="w-4 h-4" />}
        iconBgColor="bg-indigo-50"
        iconColor="text-indigo-600"
        sparklineData={metrics.gmv.data}
        sparklineColor="#4f46e5"
      />
      
      <FinancialCard
        title="KHÁCH HÀNG MỚI"
        tooltipPosition="center"
        tooltipDesc="Số lượng khách hàng lần đầu mua sắm tại hệ thống trong kỳ."
        value={metrics.newCustomers.val} footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
        unit="Khách"
        subInfo="Bình quân 4-5 khách/ngày"
        trendValue={metrics.newCustomers.trend.val + "%"}
        isPositive={metrics.newCustomers.trend.isPos}
        icon={<Users className="w-4 h-4" />}
        iconBgColor="bg-sky-50"
        iconColor="text-sky-600"
        sparklineData={metrics.newCustomers.data}
        sparklineColor="#0284c7"
      />

      <FinancialCard
        title="DOANH THU"
        tooltipPosition="center"
        tooltipDesc="Doanh thu dựa trên dòng tiền thực tế (Cash-basis) trước khi trừ các khoản hoàn/hủy."
        value={metrics.gross.val} unit="Tỷ VNĐ" footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
        subInfo="Dòng tiền thực thu (Trước điều chỉnh)"
        trendValue={metrics.gross.trend.val + "%"}
        isPositive={metrics.gross.trend.isPos}
        icon={<DollarSign className="w-4 h-4" />}
        iconBgColor="bg-emerald-50"
        iconColor="text-emerald-600"
        sparklineData={metrics.gross.data}
        sparklineColor="#10b981"
      />

      <FinancialCard
        title="GIÁ TRỊ ĐIỀU CHỈNH"
        tooltipPosition="right"
        tooltipDesc="Bao gồm tổng giá trị chênh lệch do thay đổi từ Đơn Đặt -> Đơn hàng (mua thêm/bỏ bớt) và các khoản hoàn/hủy trong kỳ."
        value={metrics.adjust.val} footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
        unit="Tr VNĐ"
        subInfo="Gồm Upsale & Hoàn/Hủy cọc"
        trendValue={metrics.adjust.trend.val + "%"}
        isPositive={metrics.adjust.trend.isPos}
        icon={<XCircle className="w-4 h-4" />}
        iconBgColor="bg-rose-50"
        iconColor="text-rose-600"
        sparklineData={metrics.adjust.data}
        sparklineColor="#e11d48"
      />

      <FinancialCard
        title="DOANH THU THUẦN"
        tooltipPosition="right"
        tooltipDesc="Dòng tiền thực tế đã thu về (Net Revenue) sau khi cấn trừ tất cả các khoản hoàn/hủy."
        tooltipFormula="GMV + Điều chỉnh GMV"
        value={metrics.net.val} unit="Tỷ VNĐ" footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
        subInfo="Net Revenue (Dòng tiền ròng)"
        trendValue={metrics.net.trend.val + "%"}
        isPositive={metrics.net.trend.isPos}
        icon={<CreditCard className="w-4 h-4" />}
        iconBgColor="bg-emerald-100"
        iconColor="text-emerald-700"
        sparklineData={metrics.net.data}

        sparklineColor="#047857"
      />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FinancialCard
          title="BIÊN LỢI NHUẬN GỘP"
          tooltipPosition="left"
          tooltipDesc="Tỷ lệ lợi nhuận giữ lại được sau khi trừ đi chi phí cấu thành sản phẩm (Giá vốn hàng bán). Đo lường hiệu quả sinh lời cốt lõi của việc bán kính."
          tooltipFormula="((Doanh thu thuần - Giá vốn) / Doanh thu thuần) * 100"
          value={metrics.margin.val} footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
          unit="%"
          subInfo="Tỷ lệ lợi nhuận trên doanh số gộp"
          trendValue={metrics.margin.trend.val + "%"}
          isPositive={metrics.margin.trend.isPos}
          icon={<BarChart3 className="w-4 h-4" />}
          iconBgColor="bg-emerald-100"
          iconColor="text-emerald-700"
          sparklineData={metrics.margin.data}
          sparklineColor="#10b981"
        />
        
        <FinancialCard
          title="ĐƠN HÀNG (VOLUME)"
          tooltipPosition="center"
          tooltipDesc="Tổng số lượng đơn hàng đã được tạo và xử lý thành công trong kỳ (Bao gồm cả khách cắt kính và khách mua mang đi)."
          tooltipFormula="Tổng Đơn Đặt + Đơn mua thẳng (không qua Đơn Đặt)"
          value={metrics.volume.val} footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
          unit="Đơn"
          subInfo="Đã hoàn thành"
          trendValue={metrics.volume.trend.val + "%"}
          isPositive={metrics.volume.trend.isPos}
          icon={<Receipt className="w-4 h-4" />}
          iconBgColor="bg-blue-100"
          iconColor="text-blue-700"
          sparklineData={metrics.volume.data}
          sparklineColor="#10b981"
        />

        <FinancialCard
          title="GIÁ TRỊ ĐƠN TB (AOV)"
          tooltipPosition="right"
          tooltipDesc="Số tiền trung bình mà một khách hàng chi trả trên mỗi đơn hàng. Chỉ số quan trọng để đánh giá hiệu quả Upsale (bán chéo thêm tròng kính, phụ kiện)."
          tooltipFormula="Doanh thu thuần / Tổng số đơn hàng"
          value={metrics.aov.val} footerCurr={metrics.dates.curr} footerPrev={metrics.dates.prev}
          unit="Triệu/Đơn"
          subInfo={metrics.aov.subInfo}
          trendValue={metrics.aov.trend.val + "%"}
          isPositive={metrics.aov.trend.isPos}
          icon={<ShoppingBasket className="w-4 h-4" />}
          iconBgColor="bg-indigo-100"
          iconColor="text-indigo-700"
          sparklineData={metrics.aov.data}
          sparklineColor="#10b981"
        />
      </div>
    </div>
  );
};
