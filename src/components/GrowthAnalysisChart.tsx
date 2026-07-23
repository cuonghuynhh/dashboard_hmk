import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";
import { Filter, TrendingUp, TrendingDown } from "lucide-react";

type MetricType = "revenue" | "orders";
type ComparisonType = "wow" | "mom" | "yoy";
type DimensionType = "system" | "region" | "branch";

const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
const branches = ["HMK HN Chi nhánh 1", "HMK ĐN Chi nhánh 2", "HMK BD Chi nhánh 3", "HMK Chi nhánh 4", "HMK HN Chi nhánh 5"];

// Mock data generator
const generateData = (comp: ComparisonType, dim: DimensionType) => {
  const periods = comp === "wow" ? ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"] 
               : comp === "mom" ? ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8"]
               : ["2018", "2019", "2020", "2021", "2022", "2023", "2024", "2025"];

  return periods.map(p => {
    const row: any = { period: p };
    if (dim === "system") {
      row["Toàn hệ thống"] = (Math.random() * 40) - 15; // -15% to 25%
    } else if (dim === "region") {
      regions.forEach(r => {
        row[r] = (Math.random() * 50) - 20;
      });
    } else {
      branches.forEach(b => {
        row[b] = (Math.random() * 60) - 30;
      });
    }
    return row;
  });
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export const GrowthAnalysisChart: React.FC = () => {
  const [metric, setMetric] = useState<MetricType>("revenue");
  const [comparison, setComparison] = useState<ComparisonType>("mom");
  const [dimension, setDimension] = useState<DimensionType>("region");
  const [selectedEntity, setSelectedEntity] = useState<string>("all");

  const data = useMemo(() => generateData(comparison, dimension), [comparison, dimension]);

  const dataKeys = useMemo(() => {
    if (dimension === "system") return ["Toàn hệ thống"];
    if (dimension === "region") return selectedEntity === "all" ? regions : [selectedEntity];
    return selectedEntity === "all" ? branches : [selectedEntity];
  }, [dimension, selectedEntity]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg">
          <p className="font-semibold text-slate-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-sm text-slate-600">{entry.name}:</span>
              <span className={`text-sm font-semibold ${entry.value >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {entry.value > 0 ? "+" : ""}{entry.value.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Phân tích Tăng trưởng (Growth Rate)
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi tỷ lệ tăng trưởng doanh thu / doanh số theo các chiều
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md">
            {[
              { id: "revenue", label: "Doanh thu" },
              { id: "orders", label: "Doanh số" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMetric(tab.id as MetricType)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  metric === tab.id
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-md">
            {[
              { id: "wow", label: "WoW" },
              { id: "mom", label: "MoM" },
              { id: "yoy", label: "YoY" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setComparison(tab.id as ComparisonType)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  comparison === tab.id
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-md">
            {[
              { id: "system", label: "Hệ thống" },
              { id: "region", label: "Khu vực" },
              { id: "branch", label: "Chi nhánh" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setDimension(tab.id as DimensionType);
                  setSelectedEntity("all");
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  dimension === tab.id
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {dimension === "region" && (
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="all">Tất cả Khu vực</option>
              {regions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}

          {dimension === "branch" && (
            <select
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm max-w-[150px]"
            >
              <option value="all">Top 5 Chi nhánh</option>
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      
      <div className="p-5">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {dimension === "system" ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Bar dataKey="Toàn hệ thống" radius={[4, 4, 0, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry["Toàn hệ thống"] >= 0 ? "#10b981" : "#fb7185"} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
                <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="3 3" />
                {dataKeys.map((key, idx) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={COLORS[idx % COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
