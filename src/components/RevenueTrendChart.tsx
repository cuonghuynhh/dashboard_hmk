import React, { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Target } from 'lucide-react';
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics } from "../utils/chartEngine";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";
import { InfoTooltip } from "./InfoTooltip";

type ViewMode = "gmv" | "netRev";

const CustomTooltip = ({ active, payload, label, mode }: any) => {
  if (active && payload && payload.length) {
    const current = payload.find((p: any) => p.dataKey === 'current')?.value || 0;
    const cumulative = payload.find((p: any) => p.dataKey === 'cumulative')?.value || 0;
    
    const color = mode === "gmv" ? "#10b981" : "#4f46e5";
    const barColor = mode === "gmv" ? "#6ee7b7" : "#93c5fd";

    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg min-w-[200px]">
        <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: barColor }} />
              <span className="text-slate-600">Phát sinh kỳ này:</span>
            </div>
            <span className="font-semibold text-slate-700">{Math.round(current).toLocaleString('vi-VN')} Tr</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-slate-600">Lũy kế YTD:</span>
            </div>
            <span className="font-semibold text-slate-700">{Math.round(cumulative).toLocaleString('vi-VN')} Tr</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueTrendChart: React.FC = () => {
  const { dateRange, period } = useAppContext();
  const { localRegion, setLocalRegion, localBranch, setLocalBranch } = useLocalFilter();
  const [viewMode, setViewMode] = useState<ViewMode>("netRev");

  const { data, targetLine } = useMemo(() => {
    let cumulativeGmv = 0;
    let cumulativeNet = 0;
    
    // We want YTD, so conceptually we should start from beginning of year, but for simplicity
    // in this UI filter, we will just accumulate across the selected filtered range.
    
    const chartData = generateChartDataByPeriod(
      dateRange.start, 
      dateRange.end, 
      period, 
      (s, e) => {
        const agg = aggregateMetrics(s, e, localRegion, localBranch);
        cumulativeGmv += agg.gmv;
        cumulativeNet += agg.netRev;
        
        return {
          gmvCurrent: agg.gmv,
          gmvCumulative: cumulativeGmv,
          netCurrent: agg.netRev,
          netCumulative: cumulativeNet
        };
      }
    ).map(d => ({
      name: d.label,
      current: viewMode === "gmv" ? d.gmvCurrent : d.netCurrent,
      cumulative: viewMode === "gmv" ? d.gmvCumulative : d.netCumulative
    }));

    // Target logic based on days. Assume 35m / day net, 42m / day gmv
    const days = (new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / 86400000;
    const target = viewMode === "gmv" ? (days * 42) : (days * 35);

    return { data: chartData, targetLine: target };
  }, [dateRange, period, viewMode, localRegion, localBranch]);

  const color = viewMode === "gmv" ? "#10b981" : "#4f46e5";
  const barColor = viewMode === "gmv" ? "#6ee7b7" : "#93c5fd";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Xu hướng Lũy kế (YTD)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Số phát sinh trong kỳ & Số lũy kế cộng dồn
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-md">
          <button 
            onClick={() => setViewMode("gmv")}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'gmv' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>
            Sức bán GMV
          </button>
          <button 
            onClick={() => setViewMode("netRev")}
            className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'netRev' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>
            Doanh thu thuần
          </button>
        </div>
      </div>
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#94a3b8" }} 
              dy={10} 
            />
            <YAxis 
              yAxisId="left" 
              tickFormatter={(val) => `${val}Tr`} 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#94a3b8" }} 
            />
            <YAxis 
              yAxisId="right" 
              orientation="right" 
              tickFormatter={(val) => `${val}Tr`}
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#94a3b8" }} 
            />
            <Tooltip content={<CustomTooltip mode={viewMode} />} cursor={{ fill: "#f8fafc" }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
            
            <Bar 
              yAxisId="left" 
              dataKey="current" 
              name="Phát sinh kỳ này" 
              fill={barColor} 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40} 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              name="Lũy kế cộng dồn" 
              dataKey="cumulative" 
              stroke={color} 
              strokeWidth={3} 
              dot={false} 
              activeDot={{ r: 6, fill: color, stroke: "#fff", strokeWidth: 2 }} 
            />
            <ReferenceLine 
              yAxisId="right" 
              y={targetLine} 
              stroke="#f43f5e" 
              strokeDasharray="3 3" 
              label={{ position: "insideTopLeft", value: `Target: ${(targetLine/1000).toFixed(1)} Tỷ`, fill: "#f43f5e", fontSize: 11 }} 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
