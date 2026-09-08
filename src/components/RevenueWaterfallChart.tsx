import React, { useMemo } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowDownToLine } from 'lucide-react';
import { useAppContext } from "../AppContext";
import { aggregateMetrics } from "../utils/chartEngine";
import { InfoTooltip } from "./InfoTooltip";
import { useLocalFilter } from "../hooks/useLocalFilter";
import { LocalFilterUI } from "./LocalFilterUI";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isNegative = data.value < 0;
    
    return (
      <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg min-w-[200px]">
        <p className="font-semibold text-slate-800 mb-2 border-b border-slate-100 pb-2">{data.name}</p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">Giá trị:</span>
          <span className={`font-bold ${isNegative ? 'text-rose-600' : 'text-slate-800'}`}>
            {isNegative ? '-' : '+'}{Math.abs(Math.round(data.value)).toLocaleString('vi-VN')} Tr
          </span>
        </div>
        {data.isTotal && (
          <div className="mt-2 text-xs text-slate-500 italic text-right">
            (Bằng {((data.value / data.base) * 100).toFixed(1).replace('.', ',')}% so với GMV)
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const RevenueWaterfallChart: React.FC = () => {
  const { dateRange } = useAppContext();
  const { localRegion, setLocalRegion, localBranch, setLocalBranch } = useLocalFilter();

  const data = useMemo(() => {
    const agg = aggregateMetrics(new Date(dateRange.start), new Date(dateRange.end), localRegion, localBranch);
    
    const gmv = agg.gmv;
    const refunds = agg.refunds;
    // To ensure the waterfall has no visual gap, we calculate the remaining as netRev
    const netRev = gmv - refunds; 

    return [
      { name: "Tổng GMV", value: gmv, color: "#bfdbfe", isTotal: false },
      { name: "Hoàn/Hủy", value: -refunds, color: "#fca5a5", isTotal: false },
      { name: "Thực thu", value: netRev, color: "#10b981", isTotal: true, base: gmv }
    ];
  }, [dateRange, localRegion, localBranch]);

  // We need to calculate start and end points for the waterfall bars
  const waterfallData = useMemo(() => {
    let currentTotal = 0;
    return data.map((item, index) => {
      if (index === 0 || item.isTotal) {
        currentTotal = item.value;
        return {
          ...item,
          start: 0,
          end: item.value,
          fill: item.color
        };
      } else {
        const prevTotal = currentTotal;
        currentTotal += item.value;
        return {
          ...item,
          start: prevTotal,
          end: currentTotal,
          fill: item.color
        };
      }
    });
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <InfoTooltip
            label={
              <span className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-indigo-600" />
                Thác nước Doanh thu (Waterfall)
              </span>
            }
            labelClassName=""
            description="Phân tích các khoản giảm trừ từ GMV (Tổng sức bán) xuống còn Doanh thu thuần (Thực thu)."
            formula="Thực thu = GMV - Hoàn/Hủy"
            tooltipWidth="w-80"
          />
        </div>
        <LocalFilterUI 
          localRegion={localRegion}
          setLocalRegion={setLocalRegion}
          localBranch={localBranch}
          setLocalBranch={setLocalBranch}
        />
      </div>
      
      <div className="h-[300px] w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={waterfallData}
            margin={{ top: 20, right: 30, left: -20, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#64748b", angle: -45, textAnchor: 'end' }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#64748b" }} 
              tickFormatter={(tick) => `${tick}Tr`} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            
            {/* Custom Bar for Waterfall */}
            <Bar dataKey={(entry) => [entry.start, entry.end]} maxBarSize={60}>
              {waterfallData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
