import React, { useState, useMemo } from "react";
import { Users, X, Store } from "lucide-react";

type PeriodType = "day" | "week" | "month";
type MetricType = "target" | "revenue" | "traffic" | "conversionRate";
type ViewMode = "branch" | "region";

// Generate mock data for 80 branches with rich distribution matching the user criteria
const generateMockData = () => {
  const branchInfo = Array.from({ length: 80 }, (_, i) => {
    const regions = ["Hồ Chí Minh", "Miền Bắc", "Miền Trung", "Đông Nam Bộ"];
    const prefixes = ["HMK", "HMK HN", "HMK ĐN", "HMK BD"];
    const idx = i % prefixes.length;
    return {
      name: `${prefixes[idx]} Chi nhánh ${i + 1}`,
      region: regions[idx],
    };
  });

  const days = Array.from({ length: 31 }, (_, i) => `${i + 1}/7`);
  const weeks = ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
  const months = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7"];

  const generateData = (periods: string[]) => {
    return branchInfo.map((info, branchIdx) => {
      const row: Record<string, any> = { branch: info.name, region: info.region };
      periods.forEach((period, pIdx) => {
        // Pseudo-deterministic seed to keep data lively but balanced
        const seed = (branchIdx * 17 + pIdx * 23) % 100;

        // Target revenue between 350M and 650M
        const targetRevenue = 400 + ((branchIdx * 11 + pIdx * 7) % 250);

        // Revenue %: Balanced across >80% (Green), 60-80% (Yellow), <60% (Red)
        let targetPct: number;
        if (seed < 32) {
          // <60% (Red): 25% - 59%
          targetPct = 25 + (seed % 35);
        } else if (seed < 68) {
          // 60-80% (Yellow): 60% - 79%
          targetPct = 60 + (seed % 20);
        } else {
          // >80% (Green): 80% - 125%
          targetPct = 80 + (seed % 46);
        }
        const revenue = Math.round((targetRevenue * targetPct) / 100);

        // Conversion rate (CR = orders / traffic):
        // Balanced across >75% (Green), 50-75% (Yellow), <50% (Red)
        const crSeed = (branchIdx * 13 + pIdx * 29) % 100;
        let crPct: number;
        if (crSeed < 32) {
          // <50% (Red): 20% - 49%
          crPct = 20 + (crSeed % 30);
        } else if (crSeed < 68) {
          // 50-75% (Yellow): 50% - 74%
          crPct = 50 + (crSeed % 25);
        } else {
          // >75% (Green): 75% - 94%
          crPct = 75 + (crSeed % 20);
        }

        const traffic = 120 + ((branchIdx * 9 + pIdx * 13) % 220); // 120 to 340
        const orders = Math.max(1, Math.round((traffic * crPct) / 100));

        row[period] = {
          target: targetPct,
          targetRevenue,
          revenue,
          orders,
          traffic,
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

// Calculation of color codes, shades, and detailed statuses
export const getPerformanceDetails = (metricType: MetricType, cellData: any) => {
  const targetRevenue = cellData?.targetRevenue || 500;
  const revenue = cellData?.revenue || 0;
  const revPct =
    cellData?.target !== undefined
      ? cellData.target
      : targetRevenue > 0
      ? (revenue / targetRevenue) * 100
      : 0;

  const traffic = cellData?.traffic || 0;
  const orders = cellData?.orders || 0;
  const crPct = traffic > 0 ? (orders / traffic) * 100 : 0;

  if (metricType === "revenue" || metricType === "target") {
    // Quy tắc Doanh thu: >80% xanh, 60-80% vàng, <60% màu đỏ
    // Sắc độ đậm nhạt tùy vào giá trị
    if (revPct >= 80) {
      if (revPct >= 115) {
        return {
          bgClass: "bg-emerald-700 text-white font-bold",
          statusText: "Xuất sắc (≥115%)",
          colorCategory: "green",
          shade: "Xanh rất đậm",
          pct: revPct,
        };
      }
      if (revPct >= 100) {
        return {
          bgClass: "bg-emerald-600 text-white font-bold",
          statusText: "Đạt chuẩn (100-114%)",
          colorCategory: "green",
          shade: "Xanh đậm",
          pct: revPct,
        };
      }
      if (revPct >= 90) {
        return {
          bgClass: "bg-emerald-500 text-white font-semibold",
          statusText: "Đạt tốt (90-99%)",
          colorCategory: "green",
          shade: "Xanh vừa",
          pct: revPct,
        };
      }
      return {
        bgClass: "bg-emerald-400 text-slate-900 font-semibold",
        statusText: "Đạt yêu cầu (80-89%)",
        colorCategory: "green",
        shade: "Xanh nhạt",
        pct: revPct,
      };
    } else if (revPct >= 60) {
      if (revPct >= 74) {
        return {
          bgClass: "bg-amber-400 text-slate-900 font-bold",
          statusText: "Tiệm cận chỉ tiêu (74-79%)",
          colorCategory: "yellow",
          shade: "Vàng đậm",
          pct: revPct,
        };
      }
      if (revPct >= 67) {
        return {
          bgClass: "bg-amber-300 text-slate-900 font-semibold",
          statusText: "Mức trung bình (67-73%)",
          colorCategory: "yellow",
          shade: "Vàng vừa",
          pct: revPct,
        };
      }
      return {
        bgClass: "bg-amber-200 text-slate-900 font-medium",
        statusText: "Cần theo dõi (60-66%)",
        colorCategory: "yellow",
        shade: "Vàng nhạt",
        pct: revPct,
      };
    } else {
      if (revPct >= 50) {
        return {
          bgClass: "bg-rose-300 text-slate-900 font-medium",
          statusText: "Chưa đạt (50-59%)",
          colorCategory: "red",
          shade: "Đỏ nhạt",
          pct: revPct,
        };
      }
      if (revPct >= 40) {
        return {
          bgClass: "bg-rose-400 text-white font-semibold",
          statusText: "Cảnh báo thấp (40-49%)",
          colorCategory: "red",
          shade: "Đỏ vừa",
          pct: revPct,
        };
      }
      if (revPct >= 30) {
        return {
          bgClass: "bg-rose-500 text-white font-bold",
          statusText: "Nguy cơ cao (30-39%)",
          colorCategory: "red",
          shade: "Đỏ đậm",
          pct: revPct,
        };
      }
      return {
        bgClass: "bg-rose-700 text-white font-bold",
        statusText: "Nghiêm trọng (<30%)",
        colorCategory: "red",
        shade: "Đỏ rất đậm",
        pct: revPct,
      };
    }
  } else if (metricType === "conversionRate") {
    // Quy tắc Tỷ lệ CĐ: >75% xanh, 50-75% vàng, <50% màu đỏ
    // Sắc độ đậm nhạt tùy vào giá trị
    if (crPct >= 75) {
      if (crPct >= 90) {
        return {
          bgClass: "bg-emerald-700 text-white font-bold",
          statusText: "Chuyển đổi tối ưu (≥90%)",
          colorCategory: "green",
          shade: "Xanh rất đậm",
          pct: crPct,
        };
      }
      if (crPct >= 85) {
        return {
          bgClass: "bg-emerald-600 text-white font-bold",
          statusText: "Chuyển đổi xuất sắc (85-89%)",
          colorCategory: "green",
          shade: "Xanh đậm",
          pct: crPct,
        };
      }
      if (crPct >= 80) {
        return {
          bgClass: "bg-emerald-500 text-white font-semibold",
          statusText: "Chuyển đổi rất tốt (80-84%)",
          colorCategory: "green",
          shade: "Xanh vừa",
          pct: crPct,
        };
      }
      return {
        bgClass: "bg-emerald-400 text-slate-900 font-semibold",
        statusText: "Chuyển đổi tốt (75-79%)",
        colorCategory: "green",
        shade: "Xanh nhạt",
        pct: crPct,
      };
    } else if (crPct >= 50) {
      if (crPct >= 67) {
        return {
          bgClass: "bg-amber-400 text-slate-900 font-bold",
          statusText: "Chuyển đổi khá (67-74%)",
          colorCategory: "yellow",
          shade: "Vàng đậm",
          pct: crPct,
        };
      }
      if (crPct >= 58) {
        return {
          bgClass: "bg-amber-300 text-slate-900 font-semibold",
          statusText: "Trung bình khá (58-66%)",
          colorCategory: "yellow",
          shade: "Vàng vừa",
          pct: crPct,
        };
      }
      return {
        bgClass: "bg-amber-200 text-slate-900 font-medium",
        statusText: "Trung bình (50-57%)",
        colorCategory: "yellow",
        shade: "Vàng nhạt",
        pct: crPct,
      };
    } else {
      if (crPct >= 40) {
        return {
          bgClass: "bg-rose-300 text-slate-900 font-medium",
          statusText: "Chuyển đổi thấp (40-49%)",
          colorCategory: "red",
          shade: "Đỏ nhạt",
          pct: crPct,
        };
      }
      if (crPct >= 30) {
        return {
          bgClass: "bg-rose-400 text-white font-semibold",
          statusText: "Chuyển đổi rất thấp (30-39%)",
          colorCategory: "red",
          shade: "Đỏ vừa",
          pct: crPct,
        };
      }
      if (crPct >= 20) {
        return {
          bgClass: "bg-rose-500 text-white font-bold",
          statusText: "Chuyển đổi kém (20-29%)",
          colorCategory: "red",
          shade: "Đỏ đậm",
          pct: crPct,
        };
      }
      return {
        bgClass: "bg-rose-700 text-white font-bold",
        statusText: "Chuyển đổi rất kém (<20%)",
        colorCategory: "red",
        shade: "Đỏ rất đậm",
        pct: crPct,
      };
    }
  } else {
    // Traffic
    if (traffic >= 320) {
      return {
        bgClass: "bg-sky-700 text-white font-bold",
        statusText: "Traffic rất cao (≥320)",
        colorCategory: "blue",
        shade: "Xanh lam đậm",
        pct: traffic,
      };
    }
    if (traffic >= 240) {
      return {
        bgClass: "bg-sky-600 text-white font-bold",
        statusText: "Traffic cao (240-319)",
        colorCategory: "blue",
        shade: "Xanh lam vừa",
        pct: traffic,
      };
    }
    if (traffic >= 170) {
      return {
        bgClass: "bg-sky-400 text-slate-900 font-semibold",
        statusText: "Traffic trung bình (170-239)",
        colorCategory: "blue",
        shade: "Xanh lam sáng",
        pct: traffic,
      };
    }
    return {
      bgClass: "bg-sky-200 text-slate-900 font-medium",
      statusText: "Traffic thấp (<170)",
      colorCategory: "blue",
      shade: "Xanh lam nhạt",
      pct: traffic,
    };
  }
};

export const BranchRevenueComparison: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>("day");
  const [metric, setMetric] = useState<MetricType>("target");
  const [data, setData] = useState(mockData);
  const [isTrafficModalOpen, setIsTrafficModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("branch");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Hover state for interactive cell tooltip
  const [hoveredCell, setHoveredCell] = useState<{
    x: number;
    y: number;
    branch: string;
    period: string;
    cellData: any;
    isRegion?: boolean;
  } | null>(null);

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
          regionMap[r][p] = { targetSum: 0, targetRevenue: 0, revenue: 0, orders: 0, traffic: 0 };
        });
      }

      regionMap[r].count += 1;
      currentData.periods.forEach((p: string) => {
        regionMap[r][p].targetSum += row[p].target || 0;
        regionMap[r][p].targetRevenue += row[p].targetRevenue || (row[p].revenue * 100) / (row[p].target || 100);
        regionMap[r][p].revenue += row[p].revenue || 0;
        regionMap[r][p].orders += row[p].orders || 0;
        regionMap[r][p].traffic += row[p].traffic || 0;
      });
    });

    return Object.values(regionMap).map((regionRow: any) => {
      const finalRow: any = { branch: regionRow.branch, isRegion: true };
      currentData.periods.forEach((p: string) => {
        const totRev = regionRow[p].revenue;
        const totTargetRev = regionRow[p].targetRevenue;
        const avgTarget = Math.round(regionRow[p].targetSum / regionRow.count);
        finalRow[p] = {
          target: totTargetRev > 0 ? Math.round((totRev / totTargetRev) * 100) : avgTarget,
          targetRevenue: Math.round(totTargetRev),
          revenue: totRev,
          orders: regionRow[p].orders,
          traffic: regionRow[p].traffic,
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
          const updatedCell = {
            ...row[p],
            traffic: newTraffic,
          };
          return {
            ...row,
            [p]: updatedCell,
          };
        }
        return row;
      });
      newData[period] = periodData;
      return newData;
    });
  };

  const formatValue = (value: number, metricType: MetricType, cellData?: any) => {
    if (metricType === "revenue") {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}B`;
      }
      return `${value}M`;
    }
    if (metricType === "target") return `${value}%`;
    if (metricType === "traffic") return `${value}`;
    if (metricType === "conversionRate") {
      if (!cellData?.traffic) return "0%";
      return `${((cellData.orders / cellData.traffic) * 100).toFixed(1)}%`;
    }
    return value;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Bản đồ hiệu suất chi nhánh
          </h2>
          <p className="text-sm text-slate-500">
            Theo dõi tỷ lệ đạt mục tiêu, doanh thu và tỷ lệ chuyển đổi của toàn bộ hệ thống
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch/Region toggle */}
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

          {/* Region filter dropdown */}
          {viewMode === "branch" && (
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-slate-200 bg-white text-slate-700 px-3 py-1.5 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="all">Tất cả chi nhánh</option>
              {allRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          )}

          {/* Traffic modal button */}
          <button
            onClick={() => setIsTrafficModalOpen(true)}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-indigo-100 transition-colors shadow-sm"
          >
            <Users className="w-4 h-4" />
            Nhập Traffic
          </button>

          {/* Period selector */}
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
                  period === tab.id ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Metric selector tabs */}
          <div className="flex bg-slate-100 p-1 rounded-md">
            {[
              {
                id: "target",
                label: "% Target",
                title: "% Đạt kế hoạch: >80% xanh, 60-80% vàng, <60% đỏ",
              },
              {
                id: "revenue",
                label: "Doanh thu",
                title: "Doanh thu: >80% xanh, 60-80% vàng, <60% đỏ",
              },
              {
                id: "traffic",
                label: "Traffic",
                title: "Lưu lượng khách hàng",
              },
              {
                id: "conversionRate",
                label: "Tỷ lệ CĐ",
                title: "Tỉ lệ chuyển đổi = Số đơn/Traffic: >75% xanh, 50-75% vàng, <50% đỏ",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMetric(tab.id as MetricType)}
                title={tab.title}
                className={`px-4 py-1 rounded text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  metric === tab.id ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chú thích màu (Color Legend) */}
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700">Chú thích màu:</span>

          {metric === "conversionRate" ? (
            /* Quy tắc màu Tỷ lệ CĐ: >75% xanh, 50-75% vàng, <50% màu đỏ */
            <div className="flex flex-wrap items-center gap-2.5">
              {/* < 50% Đỏ */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <div className="flex gap-0.5">
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-700" title="<20% (Đỏ rất đậm)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-500" title="20-29% (Đỏ đậm)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-400" title="30-39% (Đỏ vừa)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-300" title="40-49% (Đỏ nhạt)" />
                </div>
                <span className="text-rose-700 font-bold">&lt; 50% Đỏ</span>
              </div>

              {/* 50-75% Vàng */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <div className="flex gap-0.5">
                  <span className="w-2.5 h-3.5 rounded-xs bg-amber-200" title="50-57% (Vàng nhạt)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-amber-300" title="58-66% (Vàng vừa)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-amber-400" title="67-74% (Vàng đậm)" />
                </div>
                <span className="text-amber-700 font-bold">50% - 75% Vàng</span>
              </div>

              {/* > 75% Xanh */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <div className="flex gap-0.5">
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-400" title="75-79% (Xanh nhạt)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-500" title="80-84% (Xanh vừa)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-600" title="85-89% (Xanh đậm)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-700" title="≥90% (Xanh rất đậm)" />
                </div>
                <span className="text-emerald-700 font-bold">&gt; 75% Xanh</span>
              </div>
            </div>
          ) : metric === "traffic" ? (
            /* Traffic */
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <div className="flex gap-0.5">
                <span className="w-2.5 h-3.5 rounded-xs bg-sky-200" />
                <span className="w-2.5 h-3.5 rounded-xs bg-sky-400" />
                <span className="w-2.5 h-3.5 rounded-xs bg-sky-600" />
                <span className="w-2.5 h-3.5 rounded-xs bg-sky-700" />
              </div>
              <span className="text-slate-700 font-medium">Sắc độ đậm dần theo số lượng khách (Traffic)</span>
            </div>
          ) : (
            /* Doanh thu / % Target: >80% xanh, 60-80% vàng, <60% màu đỏ */
            <div className="flex flex-wrap items-center gap-2.5">
              {/* < 60% Đỏ */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <div className="flex gap-0.5">
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-700" title="<30% (Đỏ rất đậm)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-500" title="30-39% (Đỏ đậm)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-400" title="40-49% (Đỏ vừa)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-rose-300" title="50-59% (Đỏ nhạt)" />
                </div>
                <span className="text-rose-700 font-bold">&lt; 60% Đỏ</span>
              </div>

              {/* 60-80% Vàng */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <div className="flex gap-0.5">
                  <span className="w-2.5 h-3.5 rounded-xs bg-amber-200" title="60-66% (Vàng nhạt)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-amber-300" title="67-73% (Vàng vừa)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-amber-400" title="74-79% (Vàng đậm)" />
                </div>
                <span className="text-amber-700 font-bold">60% - 80% Vàng</span>
              </div>

              {/* > 80% Xanh */}
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
                <div className="flex gap-0.5">
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-400" title="80-89% (Xanh nhạt)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-500" title="90-99% (Xanh vừa)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-600" title="100-114% (Xanh đậm)" />
                  <span className="w-2.5 h-3.5 rounded-xs bg-emerald-700" title="≥115% (Xanh rất đậm)" />
                </div>
                <span className="text-emerald-700 font-bold">&gt; 80% Xanh</span>
              </div>
            </div>
          )}
        </div>

        {/* Công thức Tỉ lệ chuyển đổi */}
        {metric === "conversionRate" && (
          <div className="text-slate-500 text-[11px] flex items-center gap-1">
            <span>Công thức:</span>
            <span className="font-semibold text-slate-700 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200">
              Số đơn / Traffic
            </span>
          </div>
        )}
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
        <table className="w-full text-sm text-left border-collapse min-w-max relative">
          <thead className="text-slate-500 bg-slate-50 font-medium sticky top-0 z-30 shadow-[0_1px_0_0_#e2e8f0]">
            <tr>
              <th className="px-4 py-3 bg-slate-50 sticky left-0 z-40 shadow-[1px_0_0_0_#e2e8f0,0_1px_0_0_#e2e8f0] min-w-[200px]">
                {viewMode === "branch" ? "Chi nhánh" : "Khu vực"}
              </th>
              {currentData.periods.map((p) => (
                <th key={p} className="px-2 py-3 text-center min-w-[60px] whitespace-nowrap font-semibold">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {aggregatedData.map((row: any, idx: number) => (
              <tr key={idx} className="hover:bg-slate-50/50 group">
                <td className="px-4 py-2.5 font-medium text-slate-700 bg-white sticky left-0 z-20 shadow-[1px_0_0_0_#e2e8f0] group-hover:bg-slate-50 transition-colors border-b border-slate-100 flex items-center gap-2">
                  <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{row.branch}</span>
                </td>
                {currentData.periods.map((p) => {
                  const cellData = row[p];
                  const value = cellData[metric];
                  const perf = getPerformanceDetails(metric, cellData);

                  const revPct =
                    cellData?.targetRevenue > 0
                      ? (cellData.revenue / cellData.targetRevenue) * 100
                      : cellData.target || 0;
                  const crPct =
                    cellData?.traffic > 0 ? (cellData.orders / cellData.traffic) * 100 : 0;

                  // Plain text title fallback for screen readers and accessibility
                  const tooltipTitle = `${row.branch} - Kỳ ${p}\n• Doanh thu: ${cellData.revenue}M (Chỉ tiêu: ${cellData.targetRevenue}M, Đạt: ${revPct.toFixed(1)}%)\n• Tỉ lệ CĐ: ${crPct.toFixed(1)}% (Số đơn / Traffic = ${cellData.orders} / ${cellData.traffic})\n• Lưu lượng: ${cellData.traffic} lượt | Số đơn: ${cellData.orders}\n• Đánh giá: ${perf.shade} (${perf.statusText})`;

                  return (
                    <td key={p} className="p-1 border-b border-slate-100">
                      <div
                        title={tooltipTitle}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredCell({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            branch: row.branch,
                            period: p,
                            cellData,
                            isRegion: row.isRegion,
                          });
                        }}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-full h-full py-1.5 px-1 text-center rounded text-xs transition-transform hover:scale-105 cursor-pointer select-none shadow-2xs ${perf.bgClass}`}
                      >
                        {formatValue(value, metric, cellData)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Floating Rich Tooltip on Cell Hover */}
      {hoveredCell &&
        (() => {
          const data = hoveredCell.cellData;
          const revPct =
            data.targetRevenue > 0 ? (data.revenue / data.targetRevenue) * 100 : data.target || 0;
          const cr = data.traffic > 0 ? (data.orders / data.traffic) * 100 : 0;
          const perf = getPerformanceDetails(metric, data);

          const showBelow = hoveredCell.y < 230;
          const tooltipY = showBelow ? hoveredCell.y + 36 : hoveredCell.y - 10;

          return (
            <div
              className="fixed z-50 pointer-events-none w-72 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl p-3.5 text-xs -translate-x-1/2 border border-slate-700/80 animate-in fade-in zoom-in-95 duration-150"
              style={{
                left: `${hoveredCell.x}px`,
                top: `${tooltipY}px`,
                transform: showBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
              }}
            >
              {/* Tooltip Header */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-100 truncate pr-2">
                  <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{hoveredCell.branch}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-500/25 text-indigo-300 font-semibold shrink-0 text-[11px]">
                  Kỳ {hoveredCell.period}
                </span>
              </div>

              {/* Metric Breakdown */}
              <div className="space-y-2">
                {/* Doanh thu */}
                <div
                  className={`p-2 rounded-lg ${
                    metric === "revenue" || metric === "target"
                      ? "bg-slate-800 ring-1 ring-emerald-500/50"
                      : "bg-slate-800/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 font-medium">Doanh thu:</span>
                    <span className="font-bold text-slate-100">
                      {data.revenue >= 1000
                        ? `${(data.revenue / 1000).toFixed(2)}B`
                        : `${data.revenue}M`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
                    <span>Chỉ tiêu: {data.targetRevenue}M</span>
                    <span className="font-semibold text-slate-200">
                      Đạt {revPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[10px]">
                    <span className="text-slate-400">Quy tắc màu:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        revPct >= 80
                          ? "bg-emerald-500/20 text-emerald-300"
                          : revPct >= 60
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {revPct >= 80
                        ? ">80% Xanh"
                        : revPct >= 60
                        ? "60-80% Vàng"
                        : "<60% Đỏ"}{" "}
                      ({getPerformanceDetails("revenue", data).shade})
                    </span>
                  </div>
                </div>

                {/* Tỉ lệ chuyển đổi */}
                <div
                  className={`p-2 rounded-lg ${
                    metric === "conversionRate"
                      ? "bg-slate-800 ring-1 ring-indigo-500/50"
                      : "bg-slate-800/50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400 font-medium">Tỉ lệ chuyển đổi:</span>
                    <span className="font-bold text-indigo-300 text-sm">
                      {cr.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-300 mb-1.5 font-mono bg-slate-950/40 px-2 py-0.5 rounded">
                    <span className="text-slate-400 font-sans text-[10px]">
                      Số đơn / Traffic:
                    </span>
                    <span>
                      {data.orders} / {data.traffic}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700/50 text-[10px]">
                    <span className="text-slate-400">Quy tắc màu:</span>
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold ${
                        cr >= 75
                          ? "bg-emerald-500/20 text-emerald-300"
                          : cr >= 50
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-rose-500/20 text-rose-300"
                      }`}
                    >
                      {cr >= 75
                        ? ">75% Xanh"
                        : cr >= 50
                        ? "50-75% Vàng"
                        : "<50% Đỏ"}{" "}
                      ({getPerformanceDetails("conversionRate", data).shade})
                    </span>
                  </div>
                </div>

                {/* Traffic & Đơn */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-800/40 p-2 rounded flex flex-col">
                    <span className="text-slate-400">Lưu lượng khách</span>
                    <span className="font-semibold text-slate-200 mt-0.5">
                      {data.traffic} lượt
                    </span>
                  </div>
                  <div className="bg-slate-800/40 p-2 rounded flex flex-col">
                    <span className="text-slate-400">Số đơn hoàn tất</span>
                    <span className="font-semibold text-slate-200 mt-0.5">
                      {data.orders} đơn
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Traffic Input Modal */}
      {isTrafficModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Nhập Traffic</h3>
                <p className="text-sm text-slate-500">
                  Cập nhật lưu lượng khách hàng cho các chi nhánh
                </p>
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
                          <label
                            className="text-xs font-medium text-slate-600 truncate"
                            title={row.branch}
                          >
                            {row.branch}
                          </label>
                          <input
                            type="number"
                            value={row[p].traffic || ""}
                            onChange={(e) =>
                              handleTrafficChange(row.branch, p, parseInt(e.target.value) || 0)
                            }
                            className="w-full py-1.5 px-2 text-sm rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-center text-slate-500 mt-4">
                  * Đang hiển thị 12 chi nhánh và 7 chu kỳ để demo
                </p>
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
