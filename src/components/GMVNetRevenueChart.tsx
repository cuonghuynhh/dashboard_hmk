import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics } from "../utils/chartEngine";
import { InfoTooltip } from "./InfoTooltip";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const gmv = payload.find((p: any) => p.dataKey === 'gmv')?.value || 0;
    const netRev = payload.find((p: any) => p.dataKey === 'netRev')?.value || 0;
    
    const gap = gmv - netRev;
    const gapPercent = gmv > 0 ? ((gap / gmv) * 100).toFixed(1) : "0.0";
    
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg min-w-[220px]">
        <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#bfdbfe]" />
              <span className="text-slate-600">GMV (Sức bán):</span>
            </div>
            <span className="font-semibold text-slate-700">{Math.round(gmv).toLocaleString('vi-VN')} Tr</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4f46e5]" />
              <span className="text-slate-600">Doanh thu thuần:</span>
            </div>
            <span className="font-semibold text-slate-700">{Math.round(netRev).toLocaleString('vi-VN')} Tr</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 mt-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-slate-300" />
              <span className="text-slate-600 font-medium">Chênh lệch:</span>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="font-semibold text-slate-700">{Math.round(gap).toLocaleString('vi-VN')} Tr</span>
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">-{gapPercent.replace('.', ',')}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Render percentage badge directly on top of each GMV column
const renderPercentLabel = (props: any) => {
  const { x, y, width, value } = props;
  if (value === undefined || value === null || width < 12) return null;

  const labelStr = String(value);
  const cx = x + width / 2;
  const isNarrow = width < 30;

  if (isNarrow) {
    return (
      <text
        x={cx}
        y={y - 8}
        fill="#334155"
        textAnchor="middle"
        fontSize={10}
        fontWeight={700}
      >
        {labelStr}
      </text>
    );
  }

  const pillW = Math.max(38, labelStr.length * 7 + 8);
  const pillH = 17;

  return (
    <g>
      <rect
        x={cx - pillW / 2}
        y={y - 22}
        width={pillW}
        height={pillH}
        rx={4}
        fill="#f8fafc"
        stroke="#cbd5e1"
        strokeWidth={1}
      />
      <text
        x={cx}
        y={y - 10}
        fill="#334155"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={10}
        fontWeight={700}
      >
        {labelStr}
      </text>
    </g>
  );
};

export const GMVNetRevenueChart: React.FC = () => {
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
          gmv: agg.gmv,
          netRev: agg.netRev
        };
      }
    ).map(d => {
      const gap = d.gmv - d.netRev;
      const gapPercent = d.gmv > 0 ? ((gap / d.gmv) * 100).toFixed(1) : "0.0";
      const percentLabel = d.gmv > 0 ? (gap > 0.05 ? `-${gapPercent.replace('.', ',')}%` : '0%') : '0%';
      return {
        name: d.label,
        gmv: d.gmv,
        netRev: d.netRev,
        gap,
        gapPercent,
        percentLabel
      };
    });
  }, [dateRange, period, localRegion, localBranch]);

  // Dynamically calculate Y-axis domain based on min and max of values
  const { yMin, yMax } = useMemo(() => {
    if (!data || data.length === 0) return { yMin: 0, yMax: 'auto' };

    const allVals = data
      .flatMap(d => [d.gmv, d.netRev])
      .filter(v => typeof v === 'number' && !isNaN(v));

    if (allVals.length === 0) return { yMin: 0, yMax: 'auto' };

    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);

    if (maxVal <= 0) return { yMin: 0, yMax: 10 };

    const range = maxVal - minVal;

    // Headroom for % labels on top of the bars
    const paddingTop = range > 0 ? Math.max(range * 0.28, maxVal * 0.12) : maxVal * 0.2;
    // Room at the bottom
    const paddingBottom = range > 0 ? Math.max(range * 0.2, minVal * 0.1) : minVal * 0.1;

    let calculatedMin = Math.max(0, minVal - paddingBottom);
    let calculatedMax = maxVal + paddingTop;

    if (minVal < 15) {
      calculatedMin = 0;
    }

    // Determine rounding step (e.g. 2, 5, 10, 50, 100...)
    const roughStep = Math.max(1, (calculatedMax - calculatedMin) / 5);
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    let step = magnitude;
    if (roughStep / magnitude >= 5) step = magnitude * 5;
    else if (roughStep / magnitude >= 2) step = magnitude * 2;

    calculatedMin = Math.max(0, Math.floor(calculatedMin / step) * step);
    calculatedMax = Math.ceil(calculatedMax / step) * step;

    if (calculatedMin >= calculatedMax) {
      calculatedMax = calculatedMin + step;
    }

    return { yMin: calculatedMin, yMax: calculatedMax };
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <InfoTooltip
            label={
              <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Tương quan: GMV vs Doanh thu thuần
              </span>
            }
            labelClassName=""
            description="Theo dõi độ trễ giữa Sức chốt sale và Thực thu tiền"
            formula="Thực thu = GMV - Hoàn/Hủy - Rớt đơn"
            tooltipWidth="w-72"
          />
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            Số % trên cột: Tỷ lệ chênh lệch
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
            <Bar dataKey="gmv" fill="#bfdbfe" name="GMV (Sức bán)" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="percentLabel" content={renderPercentLabel} />
            </Bar>
            <Line type="monotone" dataKey="netRev" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Doanh thu thuần" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
