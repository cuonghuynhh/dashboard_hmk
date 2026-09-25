import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  AreaChart,
  LineChart,
  BarChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from 'recharts';
import {
  Layers,
  ShoppingBag,
  Boxes,
  FileText,
  TrendingUp,
  BarChart2,
  GitCommit,
  Percent,
  SlidersHorizontal,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  HelpCircle,
} from 'lucide-react';
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics } from "../utils/chartEngine";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";
import { InfoTooltip } from "./InfoTooltip";
import { DataDetailModal, Column } from "./DataDetailModal";

type DisplayMode = "specialized" | "combo" | "variance";

export const OrderEfficiencyMetricsChart: React.FC = () => {
  const { dateRange, period } = useAppContext();
  const { localRegion, setLocalRegion, localBranch, setLocalBranch } = useLocalFilter();
  const [displayMode, setDisplayMode] = useState<DisplayMode>("specialized");
  const [varianceMetric, setVarianceMetric] = useState<"aov" | "upt" | "volume">("aov");
  const [comboSecondary, setComboSecondary] = useState<"aov" | "upt" | "both">("both");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Generate time series data for AOV, Volume, and Products/Order
  const rawData = useMemo(() => {
    return generateChartDataByPeriod(
      dateRange.start,
      dateRange.end,
      period,
      (s, e) => {
        const agg = aggregateMetrics(s, e, localRegion, localBranch);
        const orders = agg.orders || 0;
        const gmv = agg.gmv || 0;
        const units = (agg as any).units !== undefined ? (agg as any).units : Math.round(orders * 2.3);

        const aov = orders > 0 ? Math.round((gmv * 1_000_000) / orders) : 0;
        const upt = orders > 0 ? Number((units / orders).toFixed(2)) : 0;

        return {
          orders,
          gmv,
          units,
          aov,
          upt,
        };
      }
    );
  }, [dateRange, period, localRegion, localBranch]);

  // Overall totals, averages, min/max for dynamic scaling
  const summary = useMemo(() => {
    if (!rawData.length) {
      return {
        totalOrders: 0,
        totalGmv: 0,
        totalUnits: 0,
        avgAov: 0,
        avgUpt: 0,
        avgOrders: 0,
        aovMin: 0,
        aovMax: 0,
        uptMin: 0,
        uptMax: 0,
        aovSpreadPct: 0,
        uptSpread: 0,
      };
    }

    const totalOrders = rawData.reduce((acc, curr) => acc + curr.orders, 0);
    const totalGmv = rawData.reduce((acc, curr) => acc + curr.gmv, 0);
    const totalUnits = rawData.reduce((acc, curr) => acc + curr.units, 0);

    const avgAov = totalOrders > 0 ? Math.round((totalGmv * 1_000_000) / totalOrders) : 0;
    const avgUpt = totalOrders > 0 ? Number((totalUnits / totalOrders).toFixed(2)) : 0;
    const avgOrders = Math.round(totalOrders / rawData.length);

    const aovValues = rawData.map(d => d.aov).filter(v => v > 0);
    const uptValues = rawData.map(d => d.upt).filter(v => v > 0);

    const aovMin = aovValues.length ? Math.min(...aovValues) : 0;
    const aovMax = aovValues.length ? Math.max(...aovValues) : 0;
    const uptMin = uptValues.length ? Math.min(...uptValues) : 0;
    const uptMax = uptValues.length ? Math.max(...uptValues) : 0;

    const aovSpreadPct = aovMin > 0 ? Number((((aovMax - aovMin) / aovMin) * 100).toFixed(1)) : 0;
    const uptSpread = Number((uptMax - uptMin).toFixed(2));

    return {
      totalOrders,
      totalGmv,
      totalUnits,
      avgAov,
      avgUpt,
      avgOrders,
      aovMin,
      aovMax,
      uptMin,
      uptMax,
      aovSpreadPct,
      uptSpread,
    };
  }, [rawData]);

  // Enriched data with % deviations from mean
  const data = useMemo(() => {
    return rawData.map(d => {
      const aovDev = summary.avgAov > 0 ? Number((((d.aov - summary.avgAov) / summary.avgAov) * 100).toFixed(1)) : 0;
      const uptDev = summary.avgUpt > 0 ? Number((((d.upt - summary.avgUpt) / summary.avgUpt) * 100).toFixed(1)) : 0;
      const volDev = summary.avgOrders > 0 ? Number((((d.orders - summary.avgOrders) / summary.avgOrders) * 100).toFixed(1)) : 0;

      return {
        ...d,
        aovDev,
        uptDev,
        volDev,
      };
    });
  }, [rawData, summary]);

  // Dynamic axis domains to zoom into the real variations
  const aovDynamicDomain = useMemo(() => {
    if (!summary.aovMin || !summary.aovMax) return [0, 1000000];
    const diff = summary.aovMax - summary.aovMin;
    const pad = Math.max(15000, Math.round(diff * 0.35));
    const minVal = Math.max(0, Math.floor((summary.aovMin - pad) / 10000) * 10000);
    const maxVal = Math.ceil((summary.aovMax + pad) / 10000) * 10000;
    return [minVal, maxVal];
  }, [summary]);

  const uptDynamicDomain = useMemo(() => {
    if (!summary.uptMin || !summary.uptMax) return [1, 4];
    const diff = summary.uptMax - summary.uptMin;
    const pad = Math.max(0.12, Number((diff * 0.35).toFixed(2)));
    const minVal = Math.max(0, Number((summary.uptMin - pad).toFixed(2)));
    const maxVal = Number((summary.uptMax + pad).toFixed(2));
    return [minVal, maxVal];
  }, [summary]);

  // Tooltips
  const renderAOVTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[220px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">AOV (Giá trị TB đơn):</span>
              <span className="font-bold text-indigo-600 text-sm">{val.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Độ lệch so với TB ({summary.avgAov.toLocaleString('vi-VN')} ₫):</span>
              <span className={`font-semibold ${point.aovDev >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {point.aovDev >= 0 ? `+${point.aovDev}%` : `${point.aovDev}%`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Doanh số GMV:</span>
              <span className="font-semibold">{Math.round(point.gmv).toLocaleString('vi-VN')} Tr</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Số lượng đơn (Volume):</span>
              <span className="font-semibold">{point.orders.toLocaleString('vi-VN')} đơn</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderUPTTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[220px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">SL sản phẩm/đơn (UPT):</span>
              <span className="font-bold text-amber-600 text-sm">{val} SP/đơn</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Độ lệch so với TB ({summary.avgUpt} SP):</span>
              <span className={`font-semibold ${point.uptDev >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {point.uptDev >= 0 ? `+${point.uptDev}%` : `${point.uptDev}%`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tổng SP bán ra:</span>
              <span className="font-semibold">{point.units.toLocaleString('vi-VN')} SP</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Tổng số đơn:</span>
              <span className="font-semibold">{point.orders.toLocaleString('vi-VN')} đơn</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderVolumeTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const point = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[220px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Volume (Sản lượng đơn):</span>
              <span className="font-bold text-emerald-600 text-sm">{val.toLocaleString('vi-VN')} đơn</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Độ lệch so với TB ({summary.avgOrders} đơn):</span>
              <span className={`font-semibold ${point.volDev >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {point.volDev >= 0 ? `+${point.volDev}%` : `${point.volDev}%`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Doanh số GMV:</span>
              <span className="font-semibold">{Math.round(point.gmv).toLocaleString('vi-VN')} Tr</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>AOV tương ứng:</span>
              <span className="font-semibold text-indigo-600">{point.aov.toLocaleString('vi-VN')} ₫</span>
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
      return (
        <div className="bg-white p-3.5 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[250px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2.5">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                Volume (Số đơn):
              </span>
              <span className="font-bold text-emerald-700">{point.orders.toLocaleString('vi-VN')} đơn</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                AOV (Giá trị TB đơn):
              </span>
              <span className="font-bold text-indigo-700">{point.aov.toLocaleString('vi-VN')} ₫</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                SL sản phẩm/đơn (UPT):
              </span>
              <span className="font-bold text-amber-700">{point.upt} SP</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-slate-600">
              <span>Doanh số GMV:</span>
              <span className="font-bold text-slate-800">{Math.round(point.gmv).toLocaleString('vi-VN')} Tr</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderVarianceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const point = payload[0].payload;
      const metricLabel = varianceMetric === "aov" ? "AOV" : varianceMetric === "upt" ? "UPT" : "Volume";
      const actualVal = varianceMetric === "aov" ? `${point.aov.toLocaleString('vi-VN')} ₫` : varianceMetric === "upt" ? `${point.upt} SP` : `${point.orders.toLocaleString('vi-VN')} đơn`;
      const avgVal = varianceMetric === "aov" ? `${summary.avgAov.toLocaleString('vi-VN')} ₫` : varianceMetric === "upt" ? `${summary.avgUpt} SP` : `${summary.avgOrders.toLocaleString('vi-VN')} đơn`;

      return (
        <div className="bg-white p-3 border border-slate-200 shadow-xl rounded-lg text-xs min-w-[220px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Độ lệch % so với TB:</span>
              <span className={`font-bold text-sm ${val >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {val >= 0 ? `+${val}%` : `${val}%`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Giá trị thực tế {metricLabel}:</span>
              <span className="font-semibold">{actualVal}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-[11px]">
              <span>Mức chuẩn trung bình:</span>
              <span>{avgVal}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const modalColumns: Column<any>[] = [
    { key: "label", header: "Thời gian" },
    {
      key: "aov",
      header: "AOV (Giá trị TB đơn)",
      render: (v) => `${Number(v).toLocaleString('vi-VN')} ₫`,
      align: "right",
    },
    {
      key: "aovDev",
      header: "% Lệch AOV",
      render: (v) => (
        <span className={Number(v) >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
          {Number(v) >= 0 ? `+${v}%` : `${v}%`}
        </span>
      ),
      align: "right",
    },
    {
      key: "orders",
      header: "Volume (Số đơn)",
      render: (v) => `${Number(v).toLocaleString('vi-VN')} đơn`,
      align: "right",
    },
    {
      key: "upt",
      header: "SL SP/đơn (UPT)",
      render: (v) => `${v} SP`,
      align: "right",
    },
    {
      key: "uptDev",
      header: "% Lệch UPT",
      render: (v) => (
        <span className={Number(v) >= 0 ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
          {Number(v) >= 0 ? `+${v}%` : `${v}%`}
        </span>
      ),
      align: "right",
    },
    {
      key: "units",
      header: "Tổng sản phẩm",
      render: (v) => `${Number(v).toLocaleString('vi-VN')} SP`,
      align: "right",
    },
    {
      key: "gmv",
      header: "Tổng GMV",
      render: (v) => `${Math.round(Number(v)).toLocaleString('vi-VN')} Tr`,
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
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Hiệu quả đơn hàng: AOV - Volume - SL sản phẩm/đơn
            </h2>
            <InfoTooltip
              title="Best Practice cho chỉ số AOV & UPT"
              content="AOV và UPT là các chỉ số tỷ lệ (ratio/intensity metrics) có biên độ biến động thấp (±3% - 10%). Khi vẽ cột với gốc 0, các cột sẽ bằng phẳng và triệt tiêu thông tin thị giác.
Theo Best Practice trong Business Intelligence:
1. Xu hướng chuyên biệt (Focused Zoom): Dùng đường/vùng với trục Y phóng to theo biên độ dao động thực tế để làm rõ xu hướng, đỉnh và đáy.
2. Biểu đồ kết hợp (Combo Chart): Volume làm cột (Base 0), AOV & UPT làm đường để đối chiếu tương quan (vd: khuyến mãi làm tăng đơn nhưng có làm giảm AOV không?).
3. Độ lệch % (Variance): Chuyển sang cột phân kỳ % so với trung bình để nhận diện các kỳ vượt chuẩn (+%) hoặc hụt chuẩn (-%)."
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Áp dụng Best Practice trực quan hóa cho chỉ số có biên độ hẹp: phóng to trục Y, biểu đồ kết hợp và phân tích độ lệch %
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Display Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDisplayMode("specialized")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                displayMode === "specialized"
                  ? "bg-white text-indigo-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              <span>Phóng to trục Y (Chuẩn)</span>
            </button>
            <button
              onClick={() => setDisplayMode("combo")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                displayMode === "combo"
                  ? "bg-white text-emerald-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Biểu đồ kết hợp (Combo)</span>
            </button>
            <button
              onClick={() => setDisplayMode("variance")}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                displayMode === "variance"
                  ? "bg-white text-amber-700 shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-amber-600" />
              <span>Độ lệch % so với TB</span>
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
            title="Xem bảng chi tiết dữ liệu"
          >
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Insight & Spread Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* AOV KPI Card */}
        <div className="p-3.5 bg-gradient-to-br from-indigo-50/60 to-white rounded-xl border border-indigo-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              AOV (Giá trị TB đơn)
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100/70 px-1.5 py-0.5 rounded">
              Biến thiên: ±{summary.aovSpreadPct}%
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {summary.avgAov.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">₫</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-indigo-100/70 text-[11px] text-slate-500 flex justify-between">
            <span>Biên độ dao động:</span>
            <span className="font-semibold text-slate-700">
              {Math.round(summary.aovMin / 1000)}k ~ {Math.round(summary.aovMax / 1000)}k ₫
            </span>
          </div>
        </div>

        {/* Volume KPI Card */}
        <div className="p-3.5 bg-gradient-to-br from-emerald-50/60 to-white rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Volume (Sản lượng đơn)
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
              Tổng: {summary.totalOrders.toLocaleString('vi-VN')} đơn
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {summary.avgOrders.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-slate-500">đơn / kỳ</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-emerald-100/70 text-[11px] text-slate-500 flex justify-between">
            <span>Tổng GMV đóng góp:</span>
            <span className="font-semibold text-slate-700">
              {Math.round(summary.totalGmv).toLocaleString('vi-VN')} Triệu
            </span>
          </div>
        </div>

        {/* UPT KPI Card */}
        <div className="p-3.5 bg-gradient-to-br from-amber-50/60 to-white rounded-xl border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-amber-600" />
              SL sản phẩm/đơn (UPT)
            </span>
            <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded">
              Chênh lệch: {summary.uptSpread} SP
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-black text-slate-800 tracking-tight">
              {summary.avgUpt} <span className="text-sm font-semibold text-slate-500">SP / đơn</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-amber-100/70 text-[11px] text-slate-500 flex justify-between">
            <span>Biên độ dao động:</span>
            <span className="font-semibold text-slate-700">
              {summary.uptMin} ~ {summary.uptMax} SP / đơn
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Area based on Best Practice mode */}

      {/* MODE 1: SPECIALIZED (BEST PRACTICE) - Zoomed Dynamic Y-Axis Curves + Standard Bar for Volume */}
      {displayMode === "specialized" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Chart 1: AOV - Dynamic Zoom Area Chart */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      AOV (Giá trị TB đơn)
                    </h3>
                  </div>
                  <p className="text-[11px] text-indigo-700 font-medium mt-0.5">
                    Trục Y phóng to: {Math.round(aovDynamicDomain[0] / 1000)}k - {Math.round(aovDynamicDomain[1] / 1000)}k ₫
                  </p>
                </div>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded">
                  TB: {Math.round(summary.avgAov / 1000)}k ₫
                </span>
              </div>

              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 12, right: 10, left: 5, bottom: 20 }}>
                    <defs>
                      <linearGradient id="aovGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      domain={aovDynamicDomain}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                    />
                    <Tooltip content={renderAOVTooltip} />
                    <ReferenceLine
                      y={summary.avgAov}
                      stroke="#4f46e5"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{ value: `TB: ${Math.round(summary.avgAov / 1000)}k`, position: 'insideTopLeft', fill: '#4f46e5', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="aov"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#aovGrad)"
                      dot={{ r: 3, fill: '#4f46e5', strokeWidth: 1.5, stroke: '#fff' }}
                      activeDot={{ r: 5, fill: '#312e81', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-200/60">
                <span>Thấp nhất: {Math.round(summary.aovMin / 1000)}k ₫</span>
                <span>Cao nhất: {Math.round(summary.aovMax / 1000)}k ₫</span>
              </div>
            </div>

            {/* Chart 2: Volume - Column Chart (Zero baseline is correct for absolute quantities) */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      Volume (Số đơn hàng)
                    </h3>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Biểu đồ cột chuẩn quy mô (Gốc 0)
                  </p>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded">
                  TB: {summary.avgOrders} đơn
                </span>
              </div>

              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 12, right: 10, left: -5, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip content={renderVolumeTooltip} cursor={{ fill: "#f1f5f9" }} />
                    <ReferenceLine
                      y={summary.avgOrders}
                      stroke="#059669"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{ value: `TB: ${summary.avgOrders}`, position: 'insideTopLeft', fill: '#059669', fontSize: 10 }}
                    />
                    <Bar dataKey="orders" radius={[4, 4, 0, 0]} maxBarSize={32}>
                      {data.map((entry, index) => (
                        <Cell
                          key={`vol-${index}`}
                          fill={entry.orders >= summary.avgOrders ? "#10b981" : "#6ee7b7"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-200/60">
                <span>Cột đậm: Vượt TB</span>
                <span>Cột nhạt: Dưới TB</span>
              </div>
            </div>

            {/* Chart 3: UPT - Tight Dynamic Domain Line Chart */}
            <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      SL sản phẩm/đơn (UPT)
                    </h3>
                  </div>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    Trục Y phóng to: {uptDynamicDomain[0]} - {uptDynamicDomain[1]} SP
                  </p>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded">
                  TB: {summary.avgUpt} SP
                </span>
              </div>

              <div className="h-[230px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data} margin={{ top: 12, right: 10, left: -10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="uptGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      angle={-25}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      domain={uptDynamicDomain}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(val) => `${val}`}
                    />
                    <Tooltip content={renderUPTTooltip} />
                    <ReferenceLine
                      y={summary.avgUpt}
                      stroke="#d97706"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{ value: `TB: ${summary.avgUpt}`, position: 'insideTopLeft', fill: '#d97706', fontSize: 10 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="upt"
                      stroke="#d97706"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#uptGrad)"
                      dot={{ r: 3.5, fill: '#d97706', strokeWidth: 1.5, stroke: '#fff' }}
                      activeDot={{ r: 5, fill: '#b45309', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 pt-1.5 border-t border-slate-200/60">
                <span>Thấp nhất: {summary.uptMin} SP</span>
                <span>Cao nhất: {summary.uptMax} SP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-indigo-50/60 border border-indigo-100 rounded-lg p-2.5 text-xs text-indigo-900">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Nhận xét trực quan:</strong> Khi áp dụng trục Y co giãn linh hoạt (Dynamic Zoom Domain), sự trồi sụt của AOV và UPT được phóng đại rõ nét, cho phép phát hiện các chu kỳ mua giỏ hàng lớn (UPT &gt; {summary.avgUpt}) hoặc các đợt AOV sụt giảm mà biểu đồ cột gốc 0 hoàn toàn che giấu.
            </span>
          </div>
        </div>
      )}

      {/* MODE 2: COMBO CHART (Volume Bar + AOV & UPT Lines) */}
      {displayMode === "combo" && (
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col gap-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Biểu đồ kết hợp: Volume (Cột) đối ứng AOV &amp; UPT (Đường)
              </h3>
              <p className="text-xs text-slate-500">
                Phát hiện quan hệ tương quan: Sản lượng đơn tăng thì giá trị đơn có bị pha loãng không?
              </p>
            </div>

            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-md text-xs">
              <span className="text-slate-500 font-medium px-1">Đường hiển thị:</span>
              <button
                onClick={() => setComboSecondary("both")}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  comboSecondary === "both" ? "bg-indigo-600 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Cả 2 (AOV &amp; UPT)
              </button>
              <button
                onClick={() => setComboSecondary("aov")}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  comboSecondary === "aov" ? "bg-indigo-600 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chỉ AOV
              </button>
              <button
                onClick={() => setComboSecondary("upt")}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  comboSecondary === "upt" ? "bg-amber-600 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chỉ UPT
              </button>
            </div>
          </div>

          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 15, right: 30, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                {/* Left Y Axis: Volume (Orders) */}
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#059669" }}
                  tickFormatter={(val) => `${val} đơn`}
                />
                {/* Right Y Axis 1: AOV */}
                <YAxis
                  yAxisId="rightAov"
                  orientation="right"
                  domain={aovDynamicDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#4f46e5" }}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k ₫`}
                  hide={comboSecondary === "upt"}
                />
                {/* Right Y Axis 2: UPT */}
                <YAxis
                  yAxisId="rightUpt"
                  orientation="right"
                  domain={uptDynamicDomain}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#d97706" }}
                  tickFormatter={(val) => `${val} SP`}
                  hide={comboSecondary !== "upt"}
                />
                <Tooltip content={renderComboTooltip} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                <Bar
                  yAxisId="left"
                  name="Volume (Số đơn)"
                  dataKey="orders"
                  fill="#10b981"
                  opacity={0.85}
                  radius={[5, 5, 0, 0]}
                  maxBarSize={40}
                />
                {(comboSecondary === "aov" || comboSecondary === "both") && (
                  <Line
                    yAxisId="rightAov"
                    name="AOV (Giá trị TB đơn)"
                    type="monotone"
                    dataKey="aov"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#4f46e5", stroke: "#fff", strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                )}
                {(comboSecondary === "upt" || comboSecondary === "both") && (
                  <Line
                    yAxisId={comboSecondary === "upt" ? "rightUpt" : "rightAov"}
                    name="SL SP/đơn (UPT)"
                    type="monotone"
                    dataKey="upt"
                    stroke="#d97706"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3.5, fill: "#d97706", stroke: "#fff", strokeWidth: 1.5 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Cột xanh: Quy mô sản lượng đơn (Trục trái)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Đường xanh tím: AOV (Trục phải)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Đường nét đứt cam: UPT
            </span>
          </div>
        </div>
      )}

      {/* MODE 3: VARIANCE / DEVIATION (%) - Highlights slight ±3% changes with prominent bars */}
      {displayMode === "variance" && (
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/90 flex flex-col gap-3">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Biểu đồ cột phân kỳ: % Độ lệch so với Mức chuẩn Trung bình
              </h3>
              <p className="text-xs text-slate-500">
                Biến các dao động nhỏ (±2% ~ 8%) thành tín hiệu cột trực quan: Cột xanh vượt chuẩn (+), cột đỏ hụt chuẩn (-)
              </p>
            </div>

            <div className="flex bg-white border border-slate-200 p-1 rounded-md text-xs font-medium">
              <button
                onClick={() => setVarianceMetric("aov")}
                className={`px-3 py-1 rounded transition-colors ${
                  varianceMetric === "aov" ? "bg-indigo-600 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                % Lệch AOV (Chuẩn: {Math.round(summary.avgAov / 1000)}k)
              </button>
              <button
                onClick={() => setVarianceMetric("upt")}
                className={`px-3 py-1 rounded transition-colors ${
                  varianceMetric === "upt" ? "bg-amber-600 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                % Lệch UPT (Chuẩn: {summary.avgUpt} SP)
              </button>
              <button
                onClick={() => setVarianceMetric("volume")}
                className={`px-3 py-1 rounded transition-colors ${
                  varianceMetric === "volume" ? "bg-emerald-600 text-white font-semibold" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                % Lệch Volume (Chuẩn: {summary.avgOrders} đơn)
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickFormatter={(val) => `${val > 0 ? `+${val}` : val}%`}
                />
                <Tooltip content={renderVarianceTooltip} cursor={{ fill: "#f1f5f9" }} />
                <ReferenceLine y={0} stroke="#475569" strokeWidth={1.5} />
                <Bar
                  dataKey={
                    varianceMetric === "aov"
                      ? "aovDev"
                      : varianceMetric === "upt"
                      ? "uptDev"
                      : "volDev"
                  }
                  radius={[4, 4, 4, 4]}
                  maxBarSize={38}
                >
                  {data.map((entry, index) => {
                    const val =
                      varianceMetric === "aov"
                        ? entry.aovDev
                        : varianceMetric === "upt"
                        ? entry.uptDev
                        : entry.volDev;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={val >= 0 ? "#10b981" : "#f43f5e"}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Cột xanh hướng lên (&gt; 0%): Vượt mức trung bình chu kỳ
            </span>
            <span className="flex items-center gap-1.5 text-rose-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Cột đỏ hướng xuống (&lt; 0%): Thấp hơn mức trung bình chu kỳ
            </span>
          </div>
        </div>
      )}

      {/* Data Detail Modal */}
      <DataDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dữ liệu chi tiết: AOV, Volume & SL sản phẩm/đơn theo thời gian"
        data={data}
        columns={modalColumns}
      />
    </div>
  );
};
