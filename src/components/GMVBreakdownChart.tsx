import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { PieChart } from 'lucide-react';
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics } from "../utils/chartEngine";
import { InfoTooltip } from "./InfoTooltip";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const directOrder = payload.find((p: any) => p.dataKey === 'directOrder')?.value || 0;
    const preOrder = payload.find((p: any) => p.dataKey === 'preOrder')?.value || 0;
    
    const total = directOrder + preOrder;
    
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg min-w-[200px]">
        <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#0ea5e9]" />
              <span className="text-slate-600">Đơn lắp sẵn:</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-slate-700">{Math.round(directOrder).toLocaleString('vi-VN')} Tr</span>
              <span className="text-xs text-slate-400">({total > 0 ? ((directOrder / total) * 100).toFixed(1).replace('.', ',') : 0}%)</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
              <span className="text-slate-600">Đơn đặt trước:</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold text-slate-700">{Math.round(preOrder).toLocaleString('vi-VN')} Tr</span>
              <span className="text-xs text-slate-400">({total > 0 ? ((preOrder / total) * 100).toFixed(1).replace('.', ',') : 0}%)</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 mt-1">
            <span className="text-slate-600 font-medium">Tổng GMV:</span>
            <span className="font-bold text-slate-800">{Math.round(total).toLocaleString('vi-VN')} Tr</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Render percentage for Direct Order segment (bottom bar)
const renderDirectLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || height < 14 || width < 16) return null;

  const cx = x + width / 2;
  const cy = y + height / 2;
  const isNarrow = width < 30;

  return (
    <text
      x={cx}
      y={cy}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={isNarrow ? 9 : 11}
      fontWeight={700}
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
    >
      {value}
    </text>
  );
};

// Render percentage for Pre-order segment (top bar)
const renderPreOrderLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value) return null;

  const cx = x + width / 2;
  const isNarrow = width < 30;

  // If segment is too short or narrow, render label cleanly above the bar
  if (height < 14 || width < 16) {
    return (
      <text
        x={cx}
        y={y - 6}
        fill="#b45309"
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
      >
        {value}
      </text>
    );
  }

  const cy = y + height / 2;

  return (
    <text
      x={cx}
      y={cy}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={isNarrow ? 9 : 11}
      fontWeight={700}
      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)', pointerEvents: 'none' }}
    >
      {value}
    </text>
  );
};

export const GMVBreakdownChart: React.FC = () => {
  const { dateRange, period } = useAppContext();
  const { localRegion, setLocalRegion, localBranch, setLocalBranch } = useLocalFilter();

  const data = useMemo(() => {
    return generateChartDataByPeriod(
      dateRange.start, 
      dateRange.end, 
      period, 
      (s, e) => {
        const agg = aggregateMetrics(s, e, localRegion, localBranch);
        return {
          directOrder: agg.directOrder,
          preOrder: agg.preOrder
        };
      }
    ).map(d => {
      const total = d.directOrder + d.preOrder;
      const directPct = total > 0 ? (d.directOrder / total) * 100 : 0;
      const directRound = Math.round(directPct);
      const preRound = 100 - directRound;

      return {
        name: d.label,
        directOrder: d.directOrder,
        preOrder: d.preOrder,
        total,
        directLabel: total > 0 ? `${directRound}%` : '0%',
        preLabel: total > 0 ? `${preRound}%` : '0%'
      };
    });
  }, [dateRange, period, localRegion, localBranch]);

  // Dynamically calculate Y-axis domain based on min and max of total column values
  const { yMin, yMax } = useMemo(() => {
    if (!data || data.length === 0) return { yMin: 0, yMax: 'auto' };

    const totals = data
      .map(d => d.directOrder + d.preOrder)
      .filter(v => typeof v === 'number' && !isNaN(v));

    if (totals.length === 0) return { yMin: 0, yMax: 'auto' };

    const maxVal = Math.max(...totals);
    if (maxVal <= 0) return { yMin: 0, yMax: 10 };

    // Headroom for top of columns and labels
    const paddingTop = Math.max(maxVal * 0.18, 5);
    let calculatedMax = maxVal + paddingTop;

    // Determine rounding step (e.g. 5, 10, 20, 50, 100...)
    const roughStep = Math.max(1, calculatedMax / 5);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    let step = magnitude;
    if (roughStep / magnitude >= 5) step = magnitude * 5;
    else if (roughStep / magnitude >= 2) step = magnitude * 2;

    calculatedMax = Math.ceil(calculatedMax / step) * step;

    return { yMin: 0, yMax: calculatedMax };
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <InfoTooltip
            label={
              <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-indigo-600" />
                Phân rã Nguồn hình thành GMV
              </span>
            }
            labelClassName=""
            description="Tỷ trọng đóng góp giữa Đơn lắp sẵn (nhận ngay) và Đơn đặt trước (chờ sản xuất)."
            formula="GMV Đặt trước = Các đơn hàng có cọc, chờ sản xuất/lắp ráp"
            tooltipWidth="w-72"
          />
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            Số % trên cột: Tỷ trọng nguồn đơn
          </span>
        </div>
        <LocalFilterUI 
          localRegion={localRegion}
          setLocalRegion={setLocalRegion}
          localBranch={localBranch}
          setLocalBranch={setLocalBranch}
        />
      </div>
      
      <div className="h-[320px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 25, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
            <YAxis 
              domain={[yMin, yMax]}
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#64748b" }} 
              tickFormatter={(tick) => `${Math.round(tick).toLocaleString('vi-VN')}Tr`} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="directOrder" stackId="a" fill="#0ea5e9" name="Đơn lắp sẵn" radius={[0, 0, 0, 0]} maxBarSize={50}>
              <LabelList dataKey="directLabel" content={renderDirectLabel} />
            </Bar>
            <Bar dataKey="preOrder" stackId="a" fill="#f59e0b" name="Đơn đặt trước" radius={[4, 4, 0, 0]} maxBarSize={50}>
              <LabelList dataKey="preLabel" content={renderPreOrderLabel} />
            </Bar>
            <Line type="monotone" dataKey={(row) => row.directOrder + row.preOrder} stroke="#4f46e5" strokeWidth={2} dot={false} activeDot={false} name="Tổng GMV" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
