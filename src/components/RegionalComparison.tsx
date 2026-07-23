import React, { useState, useMemo } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { Map, TrendingUp } from "lucide-react";

const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
const branches = ["HMK HN Chi nhánh 1", "HMK ĐN Chi nhánh 2", "HMK BD Chi nhánh 3", "HMK Chi nhánh 4", "HMK HN Chi nhánh 5"];

const metrics = [
  { key: "revenue", label: "Doanh thu", domain: [0, 100] },
  { key: "conversion", label: "Tỷ lệ chuyển đổi", domain: [0, 100] },
  { basketSize: "basketSize", label: "GTTB Đơn hàng", domain: [0, 100] },
  { traffic: "traffic", label: "Lưu lượng KH", domain: [0, 100] },
  { returning: "returning", label: "Khách quay lại", domain: [0, 100] },
  { satisfaction: "satisfaction", label: "Độ hài lòng", domain: [0, 100] },
];

const generateDataForEntities = (entities) => {
  return entities.map(entity => ({
    name: entity,
    revenue: Math.floor(Math.random() * 40) + 60, // 60-100
    conversion: Math.floor(Math.random() * 40) + 60,
    basketSize: Math.floor(Math.random() * 40) + 60,
    traffic: Math.floor(Math.random() * 40) + 60,
    returning: Math.floor(Math.random() * 40) + 60,
    satisfaction: Math.floor(Math.random() * 20) + 80,
  }));
};

const mockRegionsData = generateDataForEntities(regions);
const mockBranchesData = generateDataForEntities(branches);

const nationalAverage = {
  name: "Trung bình Toàn quốc",
  revenue: 75,
  conversion: 70,
  basketSize: 72,
  traffic: 78,
  returning: 68,
  satisfaction: 85,
};

const regionalAverage = {
  name: "Trung bình Khu vực",
  revenue: 80,
  conversion: 75,
  basketSize: 76,
  traffic: 82,
  returning: 70,
  satisfaction: 88,
};

const allRegionData = [...mockRegionsData, nationalAverage];
const allBranchData = [...mockBranchesData, regionalAverage, nationalAverage];

type CompareType = "region" | "branch";

export const RegionalComparison: React.FC = () => {
  const [compareType, setCompareType] = useState<CompareType>("region");
  const [baseEntity, setBaseEntity] = useState<string>("Hồ Chí Minh");
  const [compareEntity, setCompareEntity] = useState<string>("Trung bình Toàn quốc");

  // Effect to handle switching comparison types
  React.useEffect(() => {
    if (compareType === "region") {
      setBaseEntity("Hồ Chí Minh");
      setCompareEntity("Trung bình Toàn quốc");
    } else {
      setBaseEntity("HMK HN Chi nhánh 1");
      setCompareEntity("Trung bình Khu vực");
    }
  }, [compareType]);

  const chartData = useMemo(() => {
    const dataset = compareType === "region" ? allRegionData : allBranchData;
    const fallbackBase = compareType === "region" ? mockRegionsData[0] : mockBranchesData[0];
    const fallbackCompare = compareType === "region" ? nationalAverage : regionalAverage;
    
    const base = dataset.find(d => d.name === baseEntity) || fallbackBase;
    const compare = dataset.find(d => d.name === compareEntity) || fallbackCompare;

    return [
      { subject: "Doanh thu", A: base.revenue, B: compare.revenue },
      { subject: "Tỷ lệ chuyển đổi", A: base.conversion, B: compare.conversion },
      { subject: "GTTB Đơn hàng", A: base.basketSize, B: compare.basketSize },
      { subject: "Lưu lượng KH", A: base.traffic, B: compare.traffic },
      { subject: "Khách quay lại", A: base.returning, B: compare.returning },
      { subject: "Độ hài lòng", A: base.satisfaction, B: compare.satisfaction },
    ];
  }, [baseEntity, compareEntity, compareType]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mt-6 flex flex-col">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Map className="w-5 h-5 text-indigo-600" />
            Benchmarking Hiệu suất (Performance Comparison)
          </h2>
          <p className="text-xs text-slate-500">
            So sánh hiệu suất giữa các chi nhánh, khu vực hoặc với điểm chuẩn
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md mr-2">
            <button
              onClick={() => setCompareType("region")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                compareType === "region" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Khu vực
            </button>
            <button
              onClick={() => setCompareType("branch")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                compareType === "branch" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Chi nhánh
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Phân tích:</span>
            <select
              value={baseEntity}
              onChange={(e) => setBaseEntity(e.target.value)}
              className="border border-indigo-200 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm max-w-[150px]"
            >
              {(compareType === "region" ? regions : branches).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">So với:</span>
            <select
              value={compareEntity}
              onChange={(e) => setCompareEntity(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 shadow-sm max-w-[150px]"
            >
              <option value="Trung bình Toàn quốc">Trung bình Toàn quốc</option>
              {compareType === "branch" && <option value="Trung bình Khu vực">Trung bình Khu vực</option>}
              {(compareType === "region" ? regions : branches).map(r => (
                <option key={r} value={r} disabled={r === baseEntity}>{r}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="h-[400px] w-full lg:w-2/3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickCount={6} />
              <Radar
                name={baseEntity}
                dataKey="A"
                stroke="#6366f1"
                fill="#818cf8"
                fillOpacity={0.5}
                strokeWidth={2}
              />
              <Radar
                name={compareEntity}
                dataKey="B"
                stroke="#f59e0b"
                fill="#fbbf24"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ fontSize: '13px', fontWeight: 500 }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          <h3 className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-2">Điểm chuẩn (Index: 100 = Khá)</h3>
          
          {chartData.map((item, idx) => {
            const diff = item.A - item.B;
            const isPositive = diff >= 0;
            
            return (
              <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-slate-700">{item.subject}</div>
                  <div className="text-xs text-slate-500 mt-1 flex gap-3">
                    <span className="text-indigo-600 font-semibold">{item.A}</span>
                    <span className="text-slate-300">vs</span>
                    <span className="text-amber-600 font-semibold">{item.B}</span>
                  </div>
                </div>
                
                <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-md ${
                  isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <TrendingUp className={`w-3 h-3 ${!isPositive && 'rotate-180'}`} />
                  {Math.abs(diff)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
