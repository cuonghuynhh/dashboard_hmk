import React, { useState, useMemo } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Scatter,
} from "recharts";
import { AlertTriangle, Map } from "lucide-react";

const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
const branches = ["HMK HN Chi nhánh 1", "HMK ĐN Chi nhánh 2", "HMK BD Chi nhánh 3"];

const generateData = () => {
  const data = [];
  let currentVal = 100;
  const rawValues = [];
  
  for (let i = 1; i <= 30; i++) {
    currentVal = currentVal + Math.sin(i / 3) * 5 + (Math.random() * 10 - 5);
    // Inject anomalies
    if (i === 10) currentVal += 45;
    if (i === 22) currentVal -= 40;
    
    rawValues.push(currentVal);
  }

  const window = 5;
  for (let i = 0; i < 30; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      sum += rawValues[j];
      count++;
    }
    const ma = sum / count;
    
    let varianceSum = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      varianceSum += Math.pow(rawValues[j] - ma, 2);
    }
    const stdDev = Math.sqrt(varianceSum / count);
    const ub = ma + stdDev * 2 + 10;
    const lb = Math.max(0, ma - stdDev * 2 - 10);
    
    const value = parseFloat(rawValues[i].toFixed(1));
    const isAnomaly = value > ub || value < lb;
    
    data.push({
      date: `${i + 1}/7`,
      revenue: value,
      ma: parseFloat(ma.toFixed(1)),
      bounds: [parseFloat(lb.toFixed(1)), parseFloat(ub.toFixed(1))],
      anomaly: isAnomaly ? value : null,
      isAnomaly,
    });
  }
  return data;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg z-50">
        <p className="font-bold text-slate-800 mb-2">{label}</p>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div> Doanh thu:
            </span>
            <span className="text-sm font-semibold text-slate-800">{data.revenue} Tr</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-400"></div> Trung bình (MA):
            </span>
            <span className="text-sm font-semibold text-slate-800">{data.ma} Tr</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm text-slate-600 flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-slate-200"></div> Ngưỡng cảnh báo:
            </span>
            <span className="text-sm font-semibold text-slate-800">{data.bounds[0]} - {data.bounds[1]}</span>
          </div>
          {data.isAnomaly && (
            <div className="mt-2 pt-2 border-t border-rose-100 flex items-center gap-1 text-xs font-bold text-rose-600">
              <AlertTriangle className="w-3 h-3" /> Phát hiện bất thường!
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export const AnomalyDetectionChart: React.FC = () => {
  const [level, setLevel] = useState<"region" | "branch">("region");
  const [entity, setEntity] = useState<string>("Hồ Chí Minh");
  
  // Re-generate mock data when entity changes to simulate real fetching
  const data = useMemo(() => generateData(), [entity]);

  const anomaliesCount = data.filter(d => d.isAnomaly).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mt-6 flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Phát hiện Bất thường (Anomaly Detection)
          </h2>
          <p className="text-xs text-slate-500">
            Cảnh báo biến động doanh thu so với đường trung bình (Moving Average)
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value as "region" | "branch");
                setEntity(e.target.value === "region" ? regions[0] : branches[0]);
              }}
              className="border border-slate-200 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm"
            >
              <option value="region">Theo Khu vực</option>
              <option value="branch">Theo Chi nhánh</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              className="border border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              {(level === "region" ? regions : branches).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {anomaliesCount > 0 && (
        <div className="mb-4 flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Phát hiện {anomaliesCount} điểm bất thường trong chu kỳ 30 ngày qua tại {entity}.
        </div>
      )}
      
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#64748b" }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#64748b" }} 
              tickFormatter={(val) => `${val} Tr`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px" }} />
            
            <Area 
              type="monotone" 
              dataKey="bounds" 
              stroke="none" 
              fill="#e2e8f0" 
              fillOpacity={0.5} 
              name="Khoảng tin cậy (Confidence Interval)" 
            />
            <Line 
              type="monotone" 
              dataKey="ma" 
              stroke="#94a3b8" 
              strokeWidth={2} 
              strokeDasharray="5 5" 
              dot={false} 
              name="Trung bình (Moving Average)" 
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#4f46e5" 
              strokeWidth={2} 
              dot={{ r: 3, fill: "#4f46e5" }} 
              activeDot={{ r: 6 }} 
              name="Doanh thu thực tế" 
            />
            <Scatter 
              dataKey="anomaly" 
              fill="#e11d48" 
              name="Bất thường" 
              shape="circle"
              legendType="circle"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
