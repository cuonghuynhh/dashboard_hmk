import React, { useState, useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics, seededRandom } from "../utils/chartEngine";
import { InfoTooltip } from "./InfoTooltip";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";

type ViewMode = "gmv" | "netRev";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const current = payload.find((p: any) => p.dataKey === 'current')?.value || 0;
    const previous = payload.find((p: any) => p.dataKey === 'previous')?.value || 0;
    const growth = payload.find((p: any) => p.dataKey === 'growth')?.value || 0;
    
    const isPositive = growth >= 0;

    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg min-w-[200px]">
        <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">{label}</p>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#4f46e5]" />
              <span className="text-slate-600">Kỳ này (Current):</span>
            </div>
            <span className="font-semibold text-slate-700">{Math.round(current).toLocaleString('vi-VN')} Tr</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-slate-400 bg-transparent" />
              <span className="text-slate-600">Kỳ trước (Previous):</span>
            </div>
            <span className="font-semibold text-slate-700">{Math.round(previous).toLocaleString('vi-VN')} Tr</span>
          </div>
          <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 mt-1">
            <span className="text-slate-600 font-medium">Tăng trưởng:</span>
            <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
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
  const [viewMode, setViewMode] = useState<ViewMode>("gmv");

  const data = useMemo(() => {
    return generateChartDataByPeriod(
      dateRange.start, 
      dateRange.end, 
      period, 
      (s, e) => {
        const agg = aggregateMetrics(s, e, localRegion, localBranch);
        
        const currentGmv = agg.gmv;
        const currentNet = agg.netRev;
        
        const seed = s.getTime();
        const variation = 0.8 + (seededRandom(seed) * 0.4); 
        
        const prevGmv = currentGmv / variation;
        const prevNet = currentNet / variation;

        const currentVal = viewMode === "gmv" ? currentGmv : currentNet;
        const prevVal = viewMode === "gmv" ? prevGmv : prevNet;
        
        const growth = prevVal > 0 ? ((currentVal - prevVal) / prevVal) * 100 : 0;

        return {
          current: currentVal,
          previous: prevVal,
          growth: growth
        };
      }
    ).map(d => ({
      name: d.label,
      current: d.current,
      previous: d.previous,
      growth: d.growth
    }));
  }, [dateRange, period, viewMode, localRegion, localBranch]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col mt-6">
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <InfoTooltip
            label={
              <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Phân tích Tăng trưởng (Growth Rate)
              </span>
            }
            labelClassName=""
            description="So sánh hiệu suất kỳ này với kỳ trước. Thanh biểu đồ thể hiện % tăng trưởng."
            formula="Tăng trưởng (%) = ((Kỳ này - Kỳ trước) / Kỳ trước) * 100"
            tooltipWidth="w-72"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <LocalFilterUI 
            localRegion={localRegion}
            setLocalRegion={setLocalRegion}
            localBranch={localBranch}
            setLocalBranch={setLocalBranch}
          />
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button 
              onClick={() => setViewMode("gmv")}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'gmv' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>
              Phân tích GMV
            </button>
            <button 
              onClick={() => setViewMode("netRev")}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'netRev' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:bg-slate-200'}`}>
              Phân tích Thực thu
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-5">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} dy={10} />
              
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
                tickFormatter={(val) => `${val}%`}
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: "#94a3b8" }} 
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }} />
              
              <ReferenceLine yAxisId="right" y={0} stroke="#cbd5e1" strokeWidth={1} />
              
              <Line 
                yAxisId="left" 
                type="monotone" 
                name="Kỳ trước (Base)" 
                dataKey="previous" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={{ r: 3, fill: "white", stroke: "#94a3b8", strokeWidth: 2 }} 
                activeDot={{ r: 5 }} 
              />

              <Line 
                yAxisId="left" 
                type="monotone" 
                name="Kỳ này (Actual)" 
                dataKey="current" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "white", stroke: "#4f46e5", strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />

              <Bar 
                yAxisId="right" 
                dataKey="growth" 
                name="Tăng trưởng (%)" 
                radius={[4, 4, 4, 4]} 
                maxBarSize={40}
                fill="#10b981"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.growth >= 0 ? "#10b981" : "#fb7185"} />
                ))}
              </Bar>

            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
