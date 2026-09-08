import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
              <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">{gapPercent.replace('.', ',')}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
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
    ).map(d => ({
      name: d.label,
      gmv: d.gmv,
      netRev: d.netRev
    }));
  }, [dateRange, period, localRegion, localBranch]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
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
            data={data}
            margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#64748b" }} 
              tickFormatter={(tick) => `${tick}Tr`} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            <Bar dataKey="gmv" fill="#bfdbfe" name="GMV (Sức bán)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="netRev" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Doanh thu thuần" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
