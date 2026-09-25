import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Clock,
  AlertCircle,
  LayoutGrid,
  Maximize2,
  FileText,
  SlidersHorizontal,
  Sparkles,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics } from "../utils/chartEngine";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";
import { InfoTooltip } from "./InfoTooltip";
import { DataDetailModal, Column } from "./DataDetailModal";

type ChartMode = "pace" | "combo";
type MetricFocus = "all" | "gmv" | "netRev" | "debt";

export const RevenueTrendChart: React.FC = () => {
  const { dateRange, period } = useAppContext();
  const { localRegion, setLocalRegion, localBranch, setLocalBranch } = useLocalFilter();
  const [chartMode, setChartMode] = useState<ChartMode>("pace");
  const [metricFocus, setMetricFocus] = useState<MetricFocus>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute aggregated and paced cumulative data
  const { enrichedData, totals, targets, paceInsight } = useMemo(() => {
    let cumulativeGmv = 0;
    let cumulativeNet = 0;
    let cumulativeDebt = 0;

    let sumGmv = 0;
    let sumNet = 0;
    let sumDebt = 0;

    // Generate basic chart data
    const rawChartData = generateChartDataByPeriod(
      dateRange.start,
      dateRange.end,
      period,
      (s, e) => {
        const agg = aggregateMetrics(s, e, localRegion, localBranch);
        cumulativeGmv += agg.gmv;
        cumulativeNet += agg.netRev;
        cumulativeDebt += agg.debt;

        sumGmv += agg.gmv;
        sumNet += agg.netRev;
        sumDebt += agg.debt;

        return {
          gmvCurrent: agg.gmv,
          gmvCumulative: cumulativeGmv,
          netCurrent: agg.netRev,
          netCumulative: cumulativeNet,
          debtCurrent: agg.debt,
          debtCumulative: cumulativeDebt,
        };
      }
    );

    // Target calculations
    const days = Math.max(1, (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / 86400000);
    const targetGmv = Math.round(days * 42);
    const targetNet = Math.round(days * 35);
    const targetDebt = Number((days * 42 * 0.015).toFixed(2)); // Ngưỡng trần an toàn nợ (~1.5% GMV)

    const totalSteps = Math.max(1, rawChartData.length);

    // Enrich data with Paced Targets (Kế hoạch tiến độ lũy kế) and % Variances
    const enriched = rawChartData.map((d, idx) => {
      const stepRatio = (idx + 1) / totalSteps;
      const gmvPacedTarget = Math.round(targetGmv * stepRatio);
      const netPacedTarget = Math.round(targetNet * stepRatio);
      const debtPacedTarget = Number((targetDebt * stepRatio).toFixed(2));

      // % Deviation vs Paced Target (Run-rate pace)
      const gmvPaceDev = gmvPacedTarget > 0 ? Number((((d.gmvCumulative - gmvPacedTarget) / gmvPacedTarget) * 100).toFixed(1)) : 0;
      const netPaceDev = netPacedTarget > 0 ? Number((((d.netCumulative - netPacedTarget) / netPacedTarget) * 100).toFixed(1)) : 0;
      const debtPaceDev = debtPacedTarget > 0 ? Number((((d.debtCumulative - debtPacedTarget) / debtPacedTarget) * 100).toFixed(1)) : 0;

      // Attainment % of total target at this step
      const gmvAttainStep = targetGmv > 0 ? Number(((d.gmvCumulative / targetGmv) * 100).toFixed(1)) : 0;
      const netAttainStep = targetNet > 0 ? Number(((d.netCumulative / targetNet) * 100).toFixed(1)) : 0;

      return {
        ...d,
        gmvPacedTarget,
        netPacedTarget,
        debtPacedTarget,
        gmvPaceDev,
        netPaceDev,
        debtPaceDev,
        gmvAttainStep,
        netAttainStep,
      };
    });

    const finalStep = enriched[enriched.length - 1];
    const finalGmvPaceDev = finalStep ? finalStep.gmvPaceDev : 0;
    const finalNetPaceDev = finalStep ? finalStep.netPaceDev : 0;

    return {
      enrichedData: enriched,
      totals: {
        gmv: sumGmv,
        net: sumNet,
        debt: sumDebt,
        finalGmvCumulative: cumulativeGmv,
        finalNetCumulative: cumulativeNet,
        finalDebtCumulative: cumulativeDebt,
      },
      targets: {
        gmv: targetGmv,
        net: targetNet,
        debt: targetDebt,
      },
      paceInsight: {
        finalGmvPaceDev,
        finalNetPaceDev,
        isGmvAhead: finalGmvPaceDev >= 0,
        isNetAhead: finalNetPaceDev >= 0,
      },
    };
  }, [dateRange, period, localRegion, localBranch]);

  // Overall key ratios
  const netRatio = totals.gmv > 0 ? ((totals.net / totals.gmv) * 100).toFixed(1).replace('.', ',') : "0";
  const debtRatio = totals.gmv > 0 ? ((totals.debt / totals.gmv) * 100).toFixed(1).replace('.', ',') : "0";
  const gmvAttainment = targets.gmv > 0 ? Math.round((totals.finalGmvCumulative / targets.gmv) * 100) : 0;
  const netAttainment = targets.net > 0 ? Math.round((totals.finalNetCumulative / targets.net) * 100) : 0;

  // Single metric active color styling
  const activeColor =
    metricFocus === "gmv"
      ? "#10b981"
      : metricFocus === "netRev"
      ? "#4f46e5"
      : metricFocus === "debt"
      ? "#d97706"
      : "#4f46e5";

  // Dedicated Tooltips
  const renderPaceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isGmv = metricFocus === "gmv" || metricFocus === "all";
      const isNet = metricFocus === "netRev";
      const isDebt = metricFocus === "debt";

      const metricTitle = isDebt ? "Công nợ treo" : isNet ? "Doanh thu thuần" : "Sức bán GMV";
      const actualVal = isDebt ? `${point.debtCumulative.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netCumulative).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvCumulative).toLocaleString('vi-VN')} Tr`;
      const targetVal = isDebt ? `${point.debtPacedTarget.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netPacedTarget).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvPacedTarget).toLocaleString('vi-VN')} Tr`;
      const paceDev = isDebt ? point.debtPaceDev : isNet ? point.netPaceDev : point.gmvPaceDev;
      const currentVal = isDebt ? `${point.debtCurrent.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netCurrent).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvCurrent).toLocaleString('vi-VN')} Tr`;

      return (
        <div className="bg-white p-3.5 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[240px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2.5 flex justify-between items-center">
            <span>{label}</span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{metricTitle}</span>
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Lũy kế thực tế:</span>
              <span className="font-bold text-slate-900 text-sm">{actualVal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tiến độ chuẩn kế hoạch:</span>
              <span className="font-semibold text-slate-700">{targetVal}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <span className="text-slate-600">Độ lệch tiến độ:</span>
              <span className={`font-bold ${paceDev >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {paceDev >= 0 ? `+${paceDev}% (Vượt tiến độ)` : `${paceDev}% (Trễ tiến độ)`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Phát sinh riêng kỳ này:</span>
              <span className="font-semibold text-slate-700">{currentVal}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderComboTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isGmv = metricFocus === "gmv" || metricFocus === "all";
      const isNet = metricFocus === "netRev";
      const isDebt = metricFocus === "debt";

      const currentVal = isDebt ? `${point.debtCurrent.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netCurrent).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvCurrent).toLocaleString('vi-VN')} Tr`;
      const cumVal = isDebt ? `${point.debtCumulative.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netCumulative).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvCumulative).toLocaleString('vi-VN')} Tr`;
      const targetVal = isDebt ? `${point.debtPacedTarget.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netPacedTarget).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvPacedTarget).toLocaleString('vi-VN')} Tr`;

      return (
        <div className="bg-white p-3.5 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[240px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-indigo-300" />
                Phát sinh kỳ này (Cột):
              </span>
              <span className="font-bold text-slate-800">{currentVal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                Lũy kế cộng dồn (Đường):
              </span>
              <span className="font-bold text-indigo-700 text-sm">{cumVal}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-100">
              <span>Tiến độ kế hoạch kỳ vọng:</span>
              <span className="font-semibold text-slate-700">{targetVal}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Mini tooltip for 3-card sync view
  const renderMiniSyncTooltip = ({ active, payload, label, type }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const isGmv = type === "gmv";
      const isNet = type === "netRev";
      const isDebt = type === "debt";

      const cumVal = isDebt ? `${point.debtCumulative.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netCumulative).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvCumulative).toLocaleString('vi-VN')} Tr`;
      const paceVal = isDebt ? `${point.debtPacedTarget.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netPacedTarget).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvPacedTarget).toLocaleString('vi-VN')} Tr`;
      const dev = isDebt ? point.debtPaceDev : isNet ? point.netPaceDev : point.gmvPaceDev;
      const current = isDebt ? `${point.debtCurrent.toFixed(2).replace('.', ',')} Tr` : isNet ? `${Math.round(point.netCurrent).toLocaleString('vi-VN')} Tr` : `${Math.round(point.gmvCurrent).toLocaleString('vi-VN')} Tr`;

      return (
        <div className="bg-white p-2.5 border border-slate-200 shadow-lg rounded-lg text-xs min-w-[190px]">
          <p className="font-bold text-slate-800 pb-1 mb-1.5 border-b border-slate-100 flex justify-between">
            <span>{label}</span>
            <span className={`text-[10px] font-semibold ${dev >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {dev >= 0 ? `+${dev}%` : `${dev}%`}
            </span>
          </p>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Lũy kế:</span>
              <span className="font-bold text-slate-800">{cumVal}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Kế hoạch:</span>
              <span>{paceVal}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Kỳ này:</span>
              <span>{current}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Data detail modal columns
  const modalColumns: Column<any>[] = [
    { key: "label", header: "Thời gian" },
    {
      key: "gmvCurrent",
      header: "GMV Kỳ này",
      render: (v) => `${Math.round(Number(v)).toLocaleString('vi-VN')} Tr`,
      align: "right",
    },
    {
      key: "gmvCumulative",
      header: "GMV Lũy kế",
      render: (v) => `${Math.round(Number(v)).toLocaleString('vi-VN')} Tr`,
      align: "right",
    },
    {
      key: "gmvPacedTarget",
      header: "Tiến độ Kế hoạch GMV",
      render: (v) => `${Math.round(Number(v)).toLocaleString('vi-VN')} Tr`,
      align: "right",
    },
    {
      key: "gmvPaceDev",
      header: "% Lệch GMV",
      render: (v) => (
        <span className={Number(v) >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
          {Number(v) >= 0 ? `+${v}%` : `${v}%`}
        </span>
      ),
      align: "right",
    },
    {
      key: "netCurrent",
      header: "Doanh thu thuần kỳ này",
      render: (v) => `${Math.round(Number(v)).toLocaleString('vi-VN')} Tr`,
      align: "right",
    },
    {
      key: "netCumulative",
      header: "Doanh thu thuần Lũy kế",
      render: (v) => `${Math.round(Number(v)).toLocaleString('vi-VN')} Tr`,
      align: "right",
    },
    {
      key: "netPaceDev",
      header: "% Lệch DTT",
      render: (v) => (
        <span className={Number(v) >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
          {Number(v) >= 0 ? `+${v}%` : `${v}%`}
        </span>
      ),
      align: "right",
    },
    {
      key: "debtCumulative",
      header: "Nợ Lũy kế",
      render: (v) => `${Number(v).toFixed(2).replace('.', ',')} Tr`,
      align: "right",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Xu hướng Lũy kế &amp; Tiến độ Kế hoạch (Run-rate Tracking)
            </h2>
            <InfoTooltip
              title="Best Practice cho Biểu đồ Xu hướng Lũy kế"
              content="Đường lũy kế luôn dốc lên theo thời gian. Nếu chỉ đặt 1 đường tham chiếu ngang cố định ở đỉnh, người xem không thể biết tại giữa chu kỳ ta đang chạy nhanh hơn (Ahead of Pace) hay tụt lại phía sau (Behind Pace).
Theo Best Practice trong Business Intelligence:
1. Đường tiến độ kế hoạch (Paced Run-rate Line): So sánh đường thực tế lũy kế song song với đường kế hoạch lũy kế tăng dần đều theo thời gian để nhận diện ngay độ trễ tiến độ.
2. Biểu đồ kết hợp (Combo Dual-Axis Chart): Trục trái đo lường phát sinh độc lập từng chu kỳ (cột), trục phải đo lường tốc độ gia tăng lũy kế cộng dồn (đường), giúp tách biệt quy mô mà không bị đè bẹp tỷ lệ trục."
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đánh giá tiến độ tích lũy thực tế so với đường kế hoạch chuẩn (Paced Target) và độ lệch nhịp độ điều hành
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chart Display Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setChartMode("pace")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                chartMode === "pace"
                  ? "bg-white text-indigo-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Target className="w-3.5 h-3.5 text-indigo-600" />
              <span>Tiến độ Kế hoạch (Chuẩn)</span>
            </button>
            <button
              onClick={() => {
                setChartMode("combo");
                if (metricFocus === "all") {
                  setMetricFocus("gmv");
                }
              }}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                chartMode === "combo"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Biểu đồ kết hợp (Combo)</span>
            </button>
          </div>

          {/* Local Filter */}
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
            title="Xem bảng chi tiết dữ liệu lũy kế"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Focus Selector & Executive Relationship Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-slate-500 font-medium px-1.5">Chỉ số:</span>
          {chartMode !== "combo" && (
            <button
              onClick={() => setMetricFocus("all")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                metricFocus === "all"
                  ? "bg-white shadow-xs text-slate-900 font-bold border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3 h-3 text-indigo-600" />
              <span>Đồng bộ cả 3</span>
            </button>
          )}
          <button
            onClick={() => setMetricFocus("gmv")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              metricFocus === "gmv" || (chartMode === "combo" && metricFocus === "all")
                ? "bg-emerald-600 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sức bán GMV
          </button>
          <button
            onClick={() => setMetricFocus("netRev")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              metricFocus === "netRev"
                ? "bg-indigo-600 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Doanh thu thuần
          </button>
          <button
            onClick={() => setMetricFocus("debt")}
            className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
              metricFocus === "debt"
                ? "bg-amber-600 text-white shadow-xs font-semibold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3 h-3" />
            Công nợ
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 text-xs">
          {paceInsight.isGmvAhead ? (
            <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>GMV đang <strong>vượt tiến độ +{paceInsight.finalGmvPaceDev}%</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>GMV đang <strong>chậm tiến độ {paceInsight.finalGmvPaceDev}%</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards: Paced Attainment & Target Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* GMV Target Card */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-50/60 to-white rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Lũy kế Sức bán GMV
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Đạt {gmvAttainment}% Target
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {Math.round(totals.finalGmvCumulative).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">Tr</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Mục tiêu: {Math.round(targets.gmv).toLocaleString('vi-VN')} Tr
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100/70 text-[11px] text-slate-500 flex justify-between">
            <span>Tiến độ nhịp chạy:</span>
            <span className={`font-semibold ${paceInsight.finalGmvPaceDev >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
              {paceInsight.finalGmvPaceDev >= 0 ? `+${paceInsight.finalGmvPaceDev}% so với chuẩn` : `${paceInsight.finalGmvPaceDev}% so với chuẩn`}
            </span>
          </div>
        </div>

        {/* Net Revenue Target Card */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 to-white rounded-xl border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              Lũy kế Doanh thu thuần
            </span>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded">
              {netRatio}% GMV
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {Math.round(totals.finalNetCumulative).toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">Tr</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Đạt {netAttainment}% Target ({Math.round(targets.net).toLocaleString('vi-VN')} Tr)
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-indigo-100/70 text-[11px] text-slate-500 flex justify-between">
            <span>Tiến độ nhịp chạy:</span>
            <span className={`font-semibold ${paceInsight.finalNetPaceDev >= 0 ? "text-indigo-700" : "text-rose-600"}`}>
              {paceInsight.finalNetPaceDev >= 0 ? `+${paceInsight.finalNetPaceDev}% so với chuẩn` : `${paceInsight.finalNetPaceDev}% so với chuẩn`}
            </span>
          </div>
        </div>

        {/* Debt Target Card */}
        <div className="p-3.5 bg-gradient-to-br from-amber-50/60 to-white rounded-xl border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Lũy kế Công nợ treo
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
              {debtRatio}% GMV (An toàn)
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {totals.finalDebtCumulative.toFixed(1).replace('.', ',')} <span className="text-sm font-semibold text-slate-500">Tr</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Trần an toàn: {targets.debt.toFixed(1).replace('.', ',')} Tr
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100/70 text-[11px] text-slate-500 flex justify-between">
            <span>Dưới ngưỡng trần an toàn:</span>
            <span className="font-semibold text-emerald-700">
              -{(targets.debt - totals.finalDebtCumulative).toFixed(1).replace('.', ',')} Tr
            </span>
          </div>
        </div>
      </div>

      {/* MAIN CHART VISUALIZATION */}

      {/* MODE 1: PACED TARGET TRACKING (BEST PRACTICE - RUN-RATE S-CURVE) */}
      {chartMode === "pace" && (
        <div className="space-y-4">
          {metricFocus === "all" ? (
            /* 3 Synchronized Cards View */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Card 1: GMV Paced Area */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Lũy kế GMV vs Tiến độ Kế hoạch
                    </h3>
                    <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                      Đạt {Math.round(totals.finalGmvCumulative).toLocaleString('vi-VN')} / {Math.round(targets.gmv).toLocaleString('vi-VN')} Tr
                    </p>
                  </div>
                  <button
                    onClick={() => setMetricFocus("gmv")}
                    className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors text-xs"
                    title="Phóng to biểu đồ GMV"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart syncId="cum-pace-sync" data={enrichedData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="gmvPaceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${Math.round(v)}Tr`} />
                      <Tooltip content={(props) => renderMiniSyncTooltip({ ...props, type: "gmv" })} />
                      <Area type="monotone" dataKey="gmvCumulative" stroke="#10b981" strokeWidth={2.5} fill="url(#gmvPaceGrad)" name="Lũy kế thực tế" />
                      <Line type="monotone" dataKey="gmvPacedTarget" stroke="#047857" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Tiến độ chuẩn" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-200/60">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <span className="w-2 h-0.5 bg-emerald-500" /> Thực tế lũy kế
                  </span>
                  <span className="flex items-center gap-1 text-emerald-800">
                    <span className="w-2 h-0.5 border-t border-emerald-800 border-dashed" /> Tiến độ chuẩn (Paced)
                  </span>
                </div>
              </div>

              {/* Card 2: Net Revenue Paced Area */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      Lũy kế DTT vs Tiến độ Kế hoạch
                    </h3>
                    <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                      Đạt {Math.round(totals.finalNetCumulative).toLocaleString('vi-VN')} / {Math.round(targets.net).toLocaleString('vi-VN')} Tr
                    </p>
                  </div>
                  <button
                    onClick={() => setMetricFocus("netRev")}
                    className="p-1 rounded text-slate-400 hover:text-indigo-700 hover:bg-indigo-50 transition-colors text-xs"
                    title="Phóng to biểu đồ Doanh thu thuần"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart syncId="cum-pace-sync" data={enrichedData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="netPaceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${Math.round(v)}Tr`} />
                      <Tooltip content={(props) => renderMiniSyncTooltip({ ...props, type: "netRev" })} />
                      <Area type="monotone" dataKey="netCumulative" stroke="#4f46e5" strokeWidth={2.5} fill="url(#netPaceGrad)" name="Lũy kế thực tế" />
                      <Line type="monotone" dataKey="netPacedTarget" stroke="#312e81" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Tiến độ chuẩn" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-200/60">
                  <span className="flex items-center gap-1 text-indigo-700 font-medium">
                    <span className="w-2 h-0.5 bg-indigo-500" /> Thực tế lũy kế
                  </span>
                  <span className="flex items-center gap-1 text-indigo-800">
                    <span className="w-2 h-0.5 border-t border-indigo-800 border-dashed" /> Tiến độ chuẩn (Paced)
                  </span>
                </div>
              </div>

              {/* Card 3: Debt Paced Area */}
              <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Lũy kế Nợ vs Ngưỡng Kế hoạch
                    </h3>
                    <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                      Nợ treo: {totals.finalDebtCumulative.toFixed(1).replace('.', ',')} / {targets.debt.toFixed(1).replace('.', ',')} Tr (Trần)
                    </p>
                  </div>
                  <button
                    onClick={() => setMetricFocus("debt")}
                    className="p-1 rounded text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors text-xs"
                    title="Phóng to biểu đồ Công nợ"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart syncId="cum-pace-sync" data={enrichedData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                      <defs>
                        <linearGradient id="debtPaceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} angle={-25} textAnchor="end" interval={0} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${v.toFixed(1)}Tr`} />
                      <Tooltip content={(props) => renderMiniSyncTooltip({ ...props, type: "debt" })} />
                      <Area type="monotone" dataKey="debtCumulative" stroke="#d97706" strokeWidth={2.5} fill="url(#debtPaceGrad)" name="Lũy kế thực tế" />
                      <Line type="monotone" dataKey="debtPacedTarget" stroke="#b45309" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Ngưỡng trần tiến độ" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-200/60">
                  <span className="flex items-center gap-1 text-amber-700 font-medium">
                    <span className="w-2 h-0.5 bg-amber-500" /> Thực tế nợ treo
                  </span>
                  <span className="flex items-center gap-1 text-amber-800">
                    <span className="w-2 h-0.5 border-t border-amber-800 border-dashed" /> Trần an toàn tiến độ
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Single Expanded Paced Chart */
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColor }} />
                    Tiến độ Lũy kế Thực tế vs Kế hoạch Chuẩn:{" "}
                    {metricFocus === "gmv" ? "Sức bán GMV" : metricFocus === "netRev" ? "Doanh thu thuần" : "Công nợ treo"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đường nét đứt thể hiện tiến độ kế hoạch phân bổ đều (Paced Run-rate). Vùng tô màu cho thấy kết quả lũy kế thực tế.
                  </p>
                </div>
                <button
                  onClick={() => setMetricFocus("all")}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-md"
                >
                  ← Quay lại xem đồng bộ cả 3
                </button>
              </div>

              <div className="h-[340px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={enrichedData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                    <defs>
                      <linearGradient id="singlePaceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={activeColor} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(val) => metricFocus === "debt" ? `${val.toFixed(1).replace('.', ',')} Tr` : `${Math.round(val).toLocaleString('vi-VN')} Tr`}
                    />
                    <Tooltip content={renderPaceTooltip} />
                    <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                    <Area
                      type="monotone"
                      name={metricFocus === "debt" ? "Lũy kế nợ treo" : "Lũy kế thực tế"}
                      dataKey={metricFocus === "debt" ? "debtCumulative" : metricFocus === "netRev" ? "netCumulative" : "gmvCumulative"}
                      stroke={activeColor}
                      strokeWidth={3}
                      fill="url(#singlePaceGrad)"
                      dot={{ r: 3.5, fill: activeColor, stroke: "#fff", strokeWidth: 1.5 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      name="Tiến độ kế hoạch (Paced Run-rate)"
                      dataKey={metricFocus === "debt" ? "debtPacedTarget" : metricFocus === "netRev" ? "netPacedTarget" : "gmvPacedTarget"}
                      stroke="#475569"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                    <ReferenceLine
                      y={metricFocus === "debt" ? targets.debt : metricFocus === "netRev" ? targets.net : targets.gmv}
                      stroke={metricFocus === "debt" ? "#b45309" : "#059669"}
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        position: "insideTopLeft",
                        value: metricFocus === "debt" ? `Trần an toàn: ${targets.debt.toFixed(1).replace('.', ',')} Tr` : `Target cuối kỳ: ${Math.round(metricFocus === "netRev" ? targets.net : targets.gmv).toLocaleString('vi-VN')} Tr`,
                        fill: metricFocus === "debt" ? "#b45309" : "#059669",
                        fontSize: 11,
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-100 rounded-lg p-2.5 text-xs text-emerald-950">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Nhận xét tiến độ:</strong> So sánh đường lũy kế thực tế với đường tiến độ phân bổ (Paced Line) cho biết ngay từ giữa kỳ ta đang dẫn trước hay bị chậm.
              Hiện GMV đang đạt <strong>{Math.round(totals.finalGmvCumulative).toLocaleString('vi-VN')} Tr</strong> ({gmvAttainment}% Target tổng kỳ), độ lệch tiến độ là <strong>{paceInsight.finalGmvPaceDev >= 0 ? `+${paceInsight.finalGmvPaceDev}%` : `${paceInsight.finalGmvPaceDev}%`}</strong>.
            </span>
          </div>
        </div>
      )}

      {/* MODE 2: COMBO CHART (Period Bar + Cumulative Line) */}
      {chartMode === "combo" && (
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col gap-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Biểu đồ kết hợp: Phát sinh trong kỳ (Cột) đối ứng Lũy kế cộng dồn (Đường)
              </h3>
              <p className="text-xs text-slate-500">
                Trục trái đo lường giá trị phát sinh độc lập mỗi chu kỳ; Trục phải đo lường tốc độ gia tăng lũy kế cộng dồn.
              </p>
            </div>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={enrichedData} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
                {/* Left Axis: Period Current */}
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => metricFocus === "debt" ? `${val.toFixed(1).replace('.', ',')} Tr` : `${Math.round(val).toLocaleString('vi-VN')} Tr`}
                />
                {/* Right Axis: Cumulative */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: activeColor }}
                  tickFormatter={(val) => metricFocus === "debt" ? `${val.toFixed(1).replace('.', ',')} Tr` : `${Math.round(val).toLocaleString('vi-VN')} Tr`}
                />
                <Tooltip content={renderComboTooltip} />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }} />
                <Bar
                  yAxisId="left"
                  name={metricFocus === "debt" ? "Nợ phát sinh trong kỳ" : "Phát sinh kỳ này"}
                  dataKey={metricFocus === "debt" ? "debtCurrent" : metricFocus === "netRev" ? "netCurrent" : "gmvCurrent"}
                  fill={metricFocus === "debt" ? "#fcd34d" : metricFocus === "netRev" ? "#93c5fd" : "#6ee7b7"}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  name={metricFocus === "debt" ? "Lũy kế nợ treo" : "Lũy kế cộng dồn"}
                  dataKey={metricFocus === "debt" ? "debtCumulative" : metricFocus === "netRev" ? "netCumulative" : "gmvCumulative"}
                  stroke={activeColor}
                  strokeWidth={3}
                  dot={{ r: 3.5, fill: activeColor, stroke: "#fff", strokeWidth: 1.5 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  name="Tiến độ kế hoạch chuẩn"
                  dataKey={metricFocus === "debt" ? "debtPacedTarget" : metricFocus === "netRev" ? "netPacedTarget" : "gmvPacedTarget"}
                  stroke="#475569"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: metricFocus === "debt" ? "#fcd34d" : metricFocus === "netRev" ? "#93c5fd" : "#6ee7b7" }} />
              Cột: Phát sinh trong từng chu kỳ (Trục trái)
            </span>
            <span className="flex items-center gap-1.5 font-medium" style={{ color: activeColor }}>
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeColor }} />
              Đường nét liền: Lũy kế cộng dồn thực tế (Trục phải)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="w-2.5 h-0.5 border-t border-slate-600 border-dashed" />
              Đường nét đứt: Đường tiến độ kế hoạch chuẩn
            </span>
          </div>
        </div>
      )}

      {/* Data Detail Modal */}
      <DataDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dữ liệu chi tiết: Xu hướng Lũy kế & Tiến độ Kế hoạch"
        data={enrichedData}
        columns={modalColumns}
      />
    </div>
  );
};
