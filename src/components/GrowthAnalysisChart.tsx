import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  FileText,
  DollarSign,
  Receipt,
  ShoppingBag,
  Layers,
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics, seededRandom } from "../utils/chartEngine";
import { InfoTooltip } from "./InfoTooltip";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";
import { DataDetailModal, Column } from "./DataDetailModal";

export type GrowthMetric = "gmv" | "netRev" | "aov" | "volume" | "upt";

interface MetricMeta {
  key: GrowthMetric;
  label: string;
  shortLabel: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  formula: string;
  formatValue: (v: number) => string;
  formatYAxis: (v: number) => string;
  isAverage: boolean;
}

const METRIC_CONFIGS: Record<GrowthMetric, MetricMeta> = {
  gmv: {
    key: "gmv",
    label: "Sức bán GMV",
    shortLabel: "GMV",
    unit: "Triệu VNĐ",
    icon: DollarSign,
    description: "So sánh tổng giá trị giao dịch hàng hóa (GMV) kỳ này so với kỳ trước để đo lường sức tăng trưởng tổng thể.",
    formula: "Tăng trưởng GMV (%) = ((GMV Kỳ này - GMV Kỳ trước) / GMV Kỳ trước) * 100",
    formatValue: (v) => `${Math.round(v).toLocaleString('vi-VN')} Tr`,
    formatYAxis: (v) => `${Math.round(v).toLocaleString('vi-VN')}Tr`,
    isAverage: false,
  },
  netRev: {
    key: "netRev",
    label: "Doanh thu (Thực thu)",
    shortLabel: "Doanh thu",
    unit: "Triệu VNĐ",
    icon: Receipt,
    description: "So sánh Doanh thu thuần thực tế sau giảm trừ, chiết khấu và hoàn hủy giữa kỳ này với kỳ trước.",
    formula: "Tăng trưởng Doanh thu (%) = ((Doanh thu Kỳ này - Doanh thu Kỳ trước) / Doanh thu Kỳ trước) * 100",
    formatValue: (v) => `${Math.round(v).toLocaleString('vi-VN')} Tr`,
    formatYAxis: (v) => `${Math.round(v).toLocaleString('vi-VN')}Tr`,
    isAverage: false,
  },
  aov: {
    key: "aov",
    label: "Giá trị trung bình đơn (AOV)",
    shortLabel: "AOV",
    unit: "VNĐ/đơn",
    icon: ShoppingBag,
    description: "Đo lường quy mô chi tiêu trung bình của một đơn hàng thành công, phản ánh xu hướng giỏ hàng cao cấp hay phổ thông.",
    formula: "AOV = GMV / Số đơn hàng; Tăng trưởng AOV (%) = ((AOV Kỳ này - AOV Kỳ trước) / AOV Kỳ trước) * 100",
    formatValue: (v) => `${Math.round(v).toLocaleString('vi-VN')} đ`,
    formatYAxis: (v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.', ',')}M` : `${Math.round(v / 1_000)}k`,
    isAverage: true,
  },
  volume: {
    key: "volume",
    label: "Volume (Số lượng đơn hàng)",
    shortLabel: "Volume",
    unit: "Đơn hàng",
    icon: Layers,
    description: "Đo lường số lượng giao dịch thành công trong kỳ, phản ánh lượng khách mua và năng lực chốt đơn của hệ thống.",
    formula: "Tăng trưởng Volume (%) = ((Số đơn Kỳ này - Số đơn Kỳ trước) / Số đơn Kỳ trước) * 100",
    formatValue: (v) => `${Math.round(v).toLocaleString('vi-VN')} đơn`,
    formatYAxis: (v) => `${Math.round(v).toLocaleString('vi-VN')}`,
    isAverage: false,
  },
  upt: {
    key: "upt",
    label: "Số lượng sản phẩm/đơn (UPT)",
    shortLabel: "Số lượng SP/đơn",
    unit: "SP/đơn",
    icon: Boxes,
    description: "Đo lường số sản phẩm trung bình trên một hóa đơn (Units Per Transaction), thể hiện năng lực bán chéo (Cross-sell/Up-sell).",
    formula: "UPT = Tổng số sản phẩm bán / Số đơn hàng; Tăng trưởng UPT (%) = ((UPT Kỳ này - UPT Kỳ trước) / UPT Kỳ trước) * 100",
    formatValue: (v) => `${v.toFixed(2).replace('.', ',')} SP/đơn`,
    formatYAxis: (v) => `${v.toFixed(1).replace('.', ',')}`,
    isAverage: true,
  },
};

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  metricMeta: MetricMeta;
}

const CustomGrowthTooltip: React.FC<TooltipProps> = ({ active, payload, label, metricMeta }) => {
  if (active && payload && payload.length) {
    const current = payload.find((p: any) => p.dataKey === 'current')?.value ?? 0;
    const previous = payload.find((p: any) => p.dataKey === 'previous')?.value ?? 0;
    const growth = payload.find((p: any) => p.dataKey === 'growth')?.value ?? 0;
    const diff = current - previous;
    const isPositive = growth >= 0;

    return (
      <div className="bg-white p-3.5 border border-slate-200 shadow-xl rounded-xl min-w-[220px] text-xs">
        <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
          <span className="font-bold text-slate-800">{label}</span>
          <span className="text-[11px] text-slate-500 font-medium">{metricMeta.unit}</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              Kỳ này (Current):
            </span>
            <span className="font-bold text-slate-800">{metricMeta.formatValue(current)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 bg-transparent" />
              Kỳ trước (Previous):
            </span>
            <span className="font-medium text-slate-600">{metricMeta.formatValue(previous)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-100">
            <span>Chênh lệch:</span>
            <span className={`font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {diff >= 0 ? '+' : ''}{metricMeta.formatValue(diff)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1 font-semibold">
            <span className="text-slate-700">Tỷ lệ Tăng trưởng:</span>
            <span className={`font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? '+' : ''}{growth.toFixed(1).replace('.', ',')}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const GrowthAnalysisChart: React.FC = () => {
  const { dateRange, period } = useAppContext();
  const { localRegion, setLocalRegion, localBranch, setLocalBranch } = useLocalFilter();
  const [metric, setMetric] = useState<GrowthMetric>("gmv");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeMeta = METRIC_CONFIGS[metric];

  // Process time series data with current vs previous comparison
  const { chartData, summary } = useMemo(() => {
    let sumCurrent = 0;
    let sumPrev = 0;
    let count = 0;
    let maxGrowth = -Infinity;
    let minGrowth = Infinity;

    const items = generateChartDataByPeriod(
      dateRange.start,
      dateRange.end,
      period,
      (s, e) => {
        const agg = aggregateMetrics(s, e, localRegion, localBranch);

        const currentGmv = agg.gmv;
        const currentNet = agg.netRev;
        const currentOrders = agg.orders;
        const currentUnits = agg.units || Math.round(currentOrders * 2.3);

        const currentAov = currentOrders > 0 ? (currentGmv * 1_000_000) / currentOrders : 0;
        const currentUpt = currentOrders > 0 ? currentUnits / currentOrders : 0;

        // Deterministic previous-period variation based on timestamp seed
        const seed = s.getTime();
        const variation = 0.82 + (seededRandom(seed) * 0.36);
        const orderVariation = 0.85 + (seededRandom(seed + 1) * 0.3);
        const unitVariation = 0.88 + (seededRandom(seed + 2) * 0.24);

        const prevGmv = currentGmv / variation;
        const prevNet = currentNet / variation;
        const prevOrders = Math.max(1, Math.round(currentOrders / orderVariation));
        const prevUnits = Math.max(1, Math.round(currentUnits / unitVariation));

        const prevAov = prevOrders > 0 ? (prevGmv * 1_000_000) / prevOrders : 0;
        const prevUpt = prevOrders > 0 ? prevUnits / prevOrders : 0;

        let currentVal = currentGmv;
        let prevVal = prevGmv;

        if (metric === "netRev") {
          currentVal = currentNet;
          prevVal = prevNet;
        } else if (metric === "aov") {
          currentVal = Math.round(currentAov);
          prevVal = Math.round(prevAov);
        } else if (metric === "volume") {
          currentVal = currentOrders;
          prevVal = prevOrders;
        } else if (metric === "upt") {
          currentVal = Number(currentUpt.toFixed(2));
          prevVal = Number(prevUpt.toFixed(2));
        }

        const growth = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;
        const roundedGrowth = Number(growth.toFixed(1));

        sumCurrent += currentVal;
        sumPrev += prevVal;
        count++;

        if (roundedGrowth > maxGrowth) maxGrowth = roundedGrowth;
        if (roundedGrowth < minGrowth) minGrowth = roundedGrowth;

        return {
          current: currentVal,
          previous: prevVal,
          growth: roundedGrowth,
        };
      }
    ).map(d => ({
      name: d.label,
      current: d.current,
      previous: d.previous,
      growth: d.growth,
    }));

    const avgCurrent = count > 0 ? (activeMeta.isAverage ? sumCurrent / count : sumCurrent) : 0;
    const avgPrev = count > 0 ? (activeMeta.isAverage ? sumPrev / count : sumPrev) : 0;
    const overallGrowth = avgPrev > 0 ? ((avgCurrent - avgPrev) / avgPrev) * 100 : 0;

    return {
      chartData: items,
      summary: {
        totalCurrent: avgCurrent,
        totalPrev: avgPrev,
        overallGrowth: Number(overallGrowth.toFixed(1)),
        maxGrowth: maxGrowth === -Infinity ? 0 : maxGrowth,
        minGrowth: minGrowth === Infinity ? 0 : minGrowth,
      },
    };
  }, [dateRange, period, metric, localRegion, localBranch, activeMeta]);

  // Modal table columns
  const modalColumns: Column<any>[] = [
    { key: "name", header: "Mốc thời gian" },
    {
      key: "current",
      header: `Kỳ này (${activeMeta.unit})`,
      render: (v) => activeMeta.formatValue(Number(v)),
      align: "right",
    },
    {
      key: "previous",
      header: `Kỳ trước (${activeMeta.unit})`,
      render: (v) => activeMeta.formatValue(Number(v)),
      align: "right",
    },
    {
      key: "growth",
      header: "Tăng trưởng (%)",
      render: (v) => (
        <span className={`font-semibold ${Number(v) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
          {Number(v) >= 0 ? `+${v}%` : `${v}%`}
        </span>
      ),
      align: "right",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col mt-6">
      {/* Header and Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Phân tích Tăng trưởng (Growth Rate Analysis)
              </h2>
              <InfoTooltip
                title={activeMeta.label}
                content={`${activeMeta.description}\nCông thức: ${activeMeta.formula}`}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              So sánh nhịp độ phát triển kỳ này với kỳ đối ứng trước (Base vs Actual) và tỷ lệ tăng trưởng (%)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <LocalFilterUI
              localRegion={localRegion}
              setLocalRegion={setLocalRegion}
              localBranch={localBranch}
              setLocalBranch={setLocalBranch}
            />

            {/* Modal trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Xem bảng chi tiết dữ liệu tăng trưởng"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Metric Segmented Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg text-xs font-medium gap-1">
            {(Object.keys(METRIC_CONFIGS) as GrowthMetric[]).map((key) => {
              const meta = METRIC_CONFIGS[key];
              const Icon = meta.icon;
              const isSelected = metric === key;
              return (
                <button
                  key={key}
                  onClick={() => setMetric(key)}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-white text-indigo-700 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-indigo-600" : "text-slate-500"}`} />
                  <span>{meta.shortLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span>{activeMeta.isAverage ? "TB Kỳ này:" : "Tổng Kỳ này:"}</span>
              <span className="font-bold text-slate-800">{activeMeta.formatValue(summary.totalCurrent)}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Tăng trưởng chung:</span>
              <span
                className={`font-bold flex items-center gap-0.5 ${
                  summary.overallGrowth >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {summary.overallGrowth >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {summary.overallGrowth >= 0 ? `+${summary.overallGrowth}%` : `${summary.overallGrowth}%`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="p-5">
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 15, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dy={6}
              />

              {/* Left YAxis: Absolute values */}
              <YAxis
                yAxisId="left"
                tickFormatter={activeMeta.formatYAxis}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />

              {/* Right YAxis: Growth % */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(val) => `${val > 0 ? `+${val}` : val}%`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
              />

              <Tooltip
                content={(props) => <CustomGrowthTooltip {...props} metricMeta={activeMeta} />}
                cursor={{ fill: "#f8fafc" }}
              />

              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
              />

              <ReferenceLine yAxisId="right" y={0} stroke="#cbd5e1" strokeWidth={1} />

              {/* Base line (Previous period) */}
              <Line
                yAxisId="left"
                type="monotone"
                name={`Kỳ trước (${activeMeta.shortLabel})`}
                dataKey="previous"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "white", stroke: "#94a3b8", strokeWidth: 2 }}
                activeDot={{ r: 5 }}
              />

              {/* Actual line (Current period) */}
              <Line
                yAxisId="left"
                type="monotone"
                name={`Kỳ này (${activeMeta.shortLabel})`}
                dataKey="current"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4, fill: "white", stroke: "#4f46e5", strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />

              {/* Growth rate bars */}
              <Bar
                yAxisId="right"
                dataKey="growth"
                name="Tăng trưởng (%)"
                radius={[4, 4, 4, 4]}
                maxBarSize={38}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.growth >= 0 ? "#10b981" : "#f43f5e"}
                  />
                ))}
              </Bar>
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Insight note */}
        <div className="mt-3 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-slate-600">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Chỉ số <strong>{activeMeta.label}</strong>: Tăng trưởng cao nhất đạt{" "}
              <strong className="text-emerald-600">+{summary.maxGrowth}%</strong>, thấp nhất là{" "}
              <strong className={summary.minGrowth >= 0 ? "text-emerald-600" : "text-rose-600"}>
                {summary.minGrowth >= 0 ? `+${summary.minGrowth}%` : `${summary.minGrowth}%`}
              </strong>.
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Cột xanh: Tăng trưởng dương
            </span>
            <span className="flex items-center gap-1.5 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Cột đỏ: Tăng trưởng âm
            </span>
          </div>
        </div>
      </div>

      {/* Data Detail Modal */}
      <DataDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Dữ liệu chi tiết: Tăng trưởng ${activeMeta.label}`}
        data={chartData}
        columns={modalColumns}
      />
    </div>
  );
};
