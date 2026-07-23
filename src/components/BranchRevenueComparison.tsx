import React, { useState, useMemo } from "react";
import { Filter, Users, X } from "lucide-react";

type PeriodType = "day" | "week" | "month";
type MetricType = "target" | "revenue" | "traffic" | "conversionRate";

// Generate mock data for 80 branches to demonstrate scalability
const generateMockData = () => {
  const branchInfo = Array.from({ length: 80 }, (_, i) => {
    const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
    const prefixes = ["HMK", "HMK HN", "HMK ĐN", "HMK BD"];
    const idx = i % prefixes.length;
    return {
      name: `${prefixes[idx]} Chi nhánh ${i + 1}`,
      region: regions[idx]
    };
  });
  
  const days = Array.from({ length: 31 }, (_, i) => `${i + 1}/7`);
  const weeks = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
  const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7"];

  const generateData = (periods: string[]) => {
    return branchInfo.map((info) => {
      const row: Record<string, any> = { branch: info.name, region: info.region };
      periods.forEach((period) => {
        // Random performance data matching the screenshot style
        row[period] = {
          target: Math.floor(Math.random() * 200) + 10,
          revenue: Math.floor(Math.random() * 800) + 50,
          orders: Math.floor(Math.random() * 150) + 20,
          traffic: Math.floor(Math.random() * 500) + 200,
        };
      });
      return row;
    });
  };

  return {
    day: { periods: days, data: generateData(days) },
    week: { periods: weeks, data: generateData(weeks) },
    month: { periods: months, data: generateData(months) },
  };
};

const mockData = generateMockData();

type ViewMode = "branch" | "region";

export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  const [data, setData] = useState(mockData);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("branch");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  
  const currentData = data[period];

  const aggregatedData = useMemo(() => {
    if (viewMode === "branch" && selectedRegion === "all") {
      return currentData.data;
    }
    
    if (viewMode === "branch") {
      return currentData.data.filter((row: any) => row.region === selectedRegion);
    }
    
    // Aggregate by region
    const regionMap: Record<string, any> = {};
    currentData.data.forEach((row: any) => {
      const r = row.region;
      if (!regionMap[r]) {
        regionMap[r] = { branch: r, isRegion: true, count: 0 };
        currentData.periods.forEach((p: string) => {
          regionMap[r][p] = { targetSum: 0, revenue: 0, orders: 0, traffic: 0 };
        });
      }
      
      regionMap[r].count += 1;
      currentData.periods.forEach((p: string) => {
        regionMap[r][p].targetSum += row[p].target || 0;
        regionMap[r][p].revenue += row[p].revenue || 0;
        regionMap[r][p].orders += row[p].orders || 0;
        regionMap[r][p].traffic += row[p].traffic || 0;
      });
    });
    
    return Object.values(regionMap).map((regionRow: any) => {
      const finalRow: any = { branch: regionRow.branch, isRegion: true };
      currentData.periods.forEach((p: string) => {
        finalRow[p] = {
          target: Math.round(regionRow[p].targetSum / regionRow.count), // Average
          revenue: regionRow[p].revenue, // Sum
          orders: regionRow[p].orders, // Sum
          traffic: regionRow[p].traffic, // Sum
        };
      });
      return finalRow;
    });
  }, [currentData, viewMode, selectedRegion]);
  
  const allRegions = useMemo(() => {
    const regions = new Set<string>();
    mockData.day.data.forEach((row: any) => regions.add(row.region));
    return Array.from(regions);
  }, []);

  const handleTrafficChange = (branch: string, p: string, newTraffic: number) => {
    setData((prev) => {
      const newData = { ...prev };
      const periodData = { ...newData[period] };
      periodData.data = periodData.data.map((row: any) => {
        if (row.branch === branch) {
          return {
            ...row,
            [p]: {
              ...row[p],
              traffic: newTraffic,
            },
          };
        }
        return row;
      });
      newData[period] = periodData;
      return newData;
    });
  };

  const getColorClass = (value: number, metricType: MetricType, cellData?: any, isRegion?: boolean) => {
    const scale = isRegion ? 20 : 1; // Approx 20 branches per region

    if (metricType === "target") {
      if (value < 30) return "bg-[#fb7185] text-white";
      if (value < 60) return "bg-[#fbbf24] text-slate-800";
      if (value < 100) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "revenue") {
      if (value < 200 * scale) return "bg-[#fb7185] text-white";
      if (value < 400 * scale) return "bg-[#fbbf24] text-slate-800";
      if (value < 600 * scale) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    } else if (metricType === "traffic") {
      return "bg-slate-100 text-slate-800";
    } else if (metricType === "conversionRate") {
      const cr = cellData?.traffic ? (cellData.orders / cellData.traffic) * 100 : 0;
      if (cr < 10) return "bg-[#fb7185] text-white";
      if (cr < 20) return "bg-[#fbbf24] text-slate-800";
      if (cr < 30) return "bg-[#34d399] text-white";
      return "bg-[#10b981] text-white";
    }
    return "bg-slate-100 text-slate-800";
  };

  const formatValue = (value: number, metricType: MetricType, cellData?: any, isRegion?: boolean) => {
    if (metricType === "revenue" && value >= 1000) {
      return `${(value / 1000).toFixed(1)}B`; // Convert thousands of Millions to Billions
    }
    if (metricType === "target") return `${value}%`;
    if (metricType === "revenue") return `${value}M`;
    if (metricType === "traffic") return `${value}`;
    if (metricType === "conversionRate") {
      if (!cellData?.traffic) return "0%";
      return `${((cellData.orders / cellData.traffic) * 100).toFixed(1)}%`;
    }
    return value;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Bản đồ hiệu suất chi nhánh
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi tỷ lệ đạt mục tiêu và doanh thu của toàn bộ hệ thống
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setViewMode("branch")}
              className={`px-4 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "branch" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Chi nhánh
            </button>
            <button
              onClick={() => setViewMode("region")}
              className={`px-4 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === "region" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Khu vực
            </button>
          </div>

          {viewMode === "branch" && (
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="all">Tất cả chi nhánh</option>
              {allRegions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
          <button 
            onClick={() => setIsTrafficModalOpen(true)}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" />
            Nhập Traffic
          </button>

          <div className="flex bg-slate-100 p-1 rounded-md">
            {[
              { id: "day", label: "Ngày" },
              { id: "week", label: "Tuần" },
              { id: "month", label: "Tháng" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as PeriodType)}
                className={`px-4 py-1 rounded text-sm font-medium transition-colors ${
                  period === tab.id
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
              { id: "target", label: "% Target" },
              { id: "revenue", label: "Doanh thu" },
              { id: "traffic", label: "Traffic" },
              { id: "conversionRate", label: "Tỷ lệ CĐ" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMetric(tab.id as MetricType)}
                className={`px-4 py-1 rounded text-sm font-medium transition-colors ${
                  metric === tab.id
                    ? "bg-white shadow-sm text-slate-800"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
        <table className="w-full text-sm text-left border-collapse min-w-max relative">
          <thead className="text-slate-500 bg-slate-50 font-medium sticky top-0 z-30 shadow-[0_1px_0_0_#e2e8f0]">
            <tr>
              <th className="px-4 py-3 bg-slate-50 sticky left-0 z-40 shadow-[1px_0_0_0_#e2e8f0,0_1px_0_0_#e2e8f0] min-w-[200px]">
                Cửa hàng
              </th>
              {currentData.periods.map((p) => (
                <th key={p} className="px-2 py-3 text-center min-w-[60px] whitespace-nowrap">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((row: any, idx: number) => (
              <tr
                key={idx}
                className="hover:bg-slate-50/50 group"
              >
                <td className="px-4 py-3 font-medium text-slate-700 bg-white sticky left-0 z-20 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-slate-50 transition-colors border-b border-slate-100">
                  {row.branch}
                </td>
                {currentData.periods.map((p) => {
                  const cellData = row[p];
                  const value = cellData[metric];
                  
                  // Removed input for traffic to only display it on the tab

                  return (
                    <td key={p} className="p-1 border-b border-slate-100">
                      <div 
                        className={`w-full h-full py-1.5 px-1 text-center rounded text-xs font-semibold ${getColorClass(value, metric, cellData, row.isRegion)}`}
                      >
                        {formatValue(value, metric, cellData, row.isRegion)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isTrafficModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Nhập Traffic</h3>
                <p className="text-sm text-slate-500">Cập nhật lưu lượng khách hàng cho các chi nhánh</p>
              </div>
              <button 
                onClick={() => setIsTrafficModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-grow bg-slate-50">
              <div className="space-y-6">
                {currentData.periods.slice(0, 7).map((p) => (
                  <div key={p} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <h4 className="font-semibold text-slate-700 mb-3">{p}</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentData.data.slice(0, 12).map((row) => (
                        <div key={row.branch} className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-slate-600 truncate" title={row.branch}>
                            {row.branch}
                          </label>
                          <input
                            type="number"
                            value={row[p].traffic || ""}
                            onChange={(e) => handleTrafficChange(row.branch, p, parseInt(e.target.value) || 0)}
                            className="w-full py-1.5 px-2 text-sm rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-center text-slate-500 mt-4">* Đang hiển thị 12 chi nhánh và 7 chu kỳ để demo</p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setIsTrafficModalOpen(false)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
