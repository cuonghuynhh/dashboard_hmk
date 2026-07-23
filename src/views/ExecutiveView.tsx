import React, { useState, useMemo, useRef, useEffect } from "react";
import { MetricCard } from "../components/MetricCard";
import {
  executiveMetrics,
  timeTrendData,
  branchPerformanceData,
  branchRevenueByPeriod,
} from "../data";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { FileText, ChevronDown, Check, Store } from "lucide-react";
import { DataDetailModal, Column } from "../components/DataDetailModal";
import { CustomTooltip } from "../components/CustomTooltip";
import { BranchRevenueComparison } from "../components/BranchRevenueComparison";
import { GrowthAnalysisChart } from "../components/GrowthAnalysisChart";

export const ExecutiveView: React.FC = () => {
  const [includeVat, setIncludeVat] = useState(true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
  const [isBranchDropdownOpen2, setIsBranchDropdownOpen2] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRef2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen(false);
      }
      if (dropdownRef2.current && !dropdownRef2.current.contains(event.target as Node)) {
        setIsBranchDropdownOpen2(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const branchOptions = [
    "HMK BÌNH PHƯỚC",
    "HMK HN CẦU GIẤY",
    "HMK Q8",
    "HMK HẢI PHÒNG",
    "HMK BÌNH THẠNH",
    "HMK HN NGUYỄN TRÃI",
    "HMK TĐ Sense City",
    "HMK HUẾ 2",
    "HMK TÂN PHÚ"
  ];

  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev => {
      if (prev.includes(branch)) {
        return prev.filter(b => b !== branch);
      } else {
        return [...prev, branch];
      }
    });
  };

  const chartData = useMemo(() => {
    // If no branches selected, show overall data. If some selected, adjust data relative to selected branches count
    const multiplier = selectedBranches.length === 0 ? 1 : (selectedBranches.length / branchOptions.length) * 0.8 + 0.2;
    return timeTrendData.map(d => ({
      ...d,
      revenue: Math.floor(d.revenue * multiplier),
      revenueYTD: Math.floor(d.revenueYTD * multiplier),
      target: Math.floor(d.target * multiplier),
      actualCollection: Math.floor(d.actualCollection * multiplier),
      actualCollectionYTD: Math.floor(d.actualCollectionYTD * multiplier),
      actualTarget: Math.floor(d.actualTarget * multiplier)
    }));
  }, [selectedBranches]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    data: any[];
    columns: Column<any>[];
  }>({
    isOpen: false,
    title: "",
    data: [],
    columns: [],
  });

  const openModal = (title: string, data: any[], columns: Column<any>[]) => {
    setModalConfig({ isOpen: true, title, data, columns });
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  // Apply VAT adjustment (dynamic calculation based on pre-calculated data)
  const adjustedMetrics = executiveMetrics.map((metric) => {
    if ("currentValueNumberNoVat" in metric) {
      const cv = includeVat
        ? metric.currentValueNumber
        : metric.currentValueNumberNoVat || metric.currentValueNumber;
      const pv = includeVat
        ? metric.previousValueNumber
        : metric.previousValueNumberNoVat || metric.previousValueNumber;

      return {
        ...metric,
        currentValueNumber: cv,
        previousValueNumber: pv,
        subValue: includeVat
          ? metric.subValue
          : metric.title.includes("BIÊN LỢI NHUẬN") ? metric.subValue : "Không VAT (Net Revenue)",
      };
    }
    return metric;
  });

  return (
    <div className="space-y-6">
      <DataDetailModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        data={modalConfig.data}
        columns={modalConfig.columns}
      />

      <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-slate-100">
        <h2 className="text-sm font-bold text-slate-800 ml-2">
          TỔNG QUAN CHỈ SỐ KINH DOANH
        </h2>
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setIncludeVat(true)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${includeVat ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Có VAT
          </button>
          <button
            onClick={() => setIncludeVat(false)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${!includeVat ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Không VAT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        {adjustedMetrics.map((metric, idx) => (
          <MetricCard key={idx} data={metric} />
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Xu hướng Tăng trưởng (YTD)
            </h2>
            <p className="text-sm text-slate-500">
              Doanh thu phát sinh & Lũy kế dòng tiền đầu năm đến nay
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                openModal("Dữ liệu Xu hướng Tăng trưởng", chartData, [
                  { key: "date", header: "Ngày" },
                  {
                    key: "revenue",
                    header: "Doanh thu phát sinh (Tr)",
                    align: "right",
                  },
                  {
                    key: "revenueYTD",
                    header: "Lũy kế YTD (Tr)",
                    align: "right",
                  },
                  {
                    key: "target",
                    header: "Mục tiêu YTD (Tr)",
                    align: "right",
                  },
                  {
                    key: "progress",
                    header: "Tiến độ (%)",
                    align: "right",
                    render: (_, row: any) =>
                      `${((row.revenueYTD / row.target) * 100).toFixed(1)}%`,
                  },
                ])
              }
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Xem chi tiết dữ liệu"
            >
              <FileText className="w-4 h-4" />
            </button>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                className="flex items-center border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Store className="w-4 h-4 mr-2 text-slate-400" />
                {selectedBranches.length === 0 ? "Tất cả Chi nhánh" : `${selectedBranches.length} Chi nhánh`}
                <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
              </button>
              
              {isBranchDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Chọn chi nhánh</span>
                    <button 
                      onClick={() => setSelectedBranches([])}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  <div className="p-1">
                    {branchOptions.map(branch => {
                      const isSelected = selectedBranches.includes(branch);
                      return (
                        <div 
                          key={branch}
                          onClick={() => toggleBranch(branch)}
                          className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm text-slate-700">{branch}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button className="bg-white shadow-sm text-slate-800 px-3 py-1 rounded text-sm font-medium">
                Theo Ngày
              </button>
              <button className="text-slate-600 px-3 py-1 rounded text-sm font-medium hover:bg-slate-200">
                Theo Tuần
              </button>
              <button className="text-slate-600 px-3 py-1 rounded text-sm font-medium hover:bg-slate-200">
                Theo Tháng
              </button>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(val) =>
                  val.split("-").slice(1).reverse().join("/")
                }
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(val) => `${val}M`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    titleLabel="Ngày"
                    valueFormatter={(val) => `${val} Triệu VNĐ`}
                  />
                }
                cursor={{ fill: "#f8fafc" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
              />

              <Bar
                yAxisId="left"
                dataKey="revenue"
                name="Doanh thu thực tế (Cột)"
                fill="#93c5fd"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                name="Lũy kế YTD (Đường)"
                dataKey="revenueYTD"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#4f46e5",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />

              <ReferenceLine
                yAxisId="right"
                y={4500}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                label={{
                  position: "insideTopLeft",
                  value: "Target Tháng: 4.5 Tỷ",
                  fill: "#f43f5e",
                  fontSize: 11,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Dòng tiền thu được (Thực thu)
            </h2>
            <p className="text-sm text-slate-500">
              Dòng tiền thực tế thu được (đã trừ giá trị đơn trả)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                openModal("Dữ liệu Dòng tiền thu được", chartData, [
                  { key: "date", header: "Ngày" },
                  {
                    key: "actualCollection",
                    header: "Thực thu (Tr)",
                    align: "right",
                  },
                  {
                    key: "actualCollectionYTD",
                    header: "Lũy kế YTD (Tr)",
                    align: "right",
                  },
                  {
                    key: "actualTarget",
                    header: "Mục tiêu YTD (Tr)",
                    align: "right",
                  },
                  {
                    key: "progress",
                    header: "Tiến độ (%)",
                    align: "right",
                    render: (_, row: any) =>
                      `${((row.actualCollectionYTD / row.actualTarget) * 100).toFixed(1)}%`,
                  },
                ])
              }
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Xem chi tiết dữ liệu"
            >
              <FileText className="w-4 h-4" />
            </button>
            <div className="relative" ref={dropdownRef2}>
              <button
                onClick={() => setIsBranchDropdownOpen2(!isBranchDropdownOpen2)}
                className="flex items-center border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Store className="w-4 h-4 mr-2 text-slate-400" />
                {selectedBranches.length === 0 ? "Tất cả Chi nhánh" : `${selectedBranches.length} Chi nhánh`}
                <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
              </button>
              
              {isBranchDropdownOpen2 && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                  <div className="p-2 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Chọn chi nhánh</span>
                    <button 
                      onClick={() => setSelectedBranches([])}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                  <div className="p-1">
                    {branchOptions.map(branch => {
                      const isSelected = selectedBranches.includes(branch);
                      return (
                        <div 
                          key={branch}
                          onClick={() => toggleBranch(branch)}
                          className="flex items-center px-3 py-2 hover:bg-slate-50 cursor-pointer rounded-md transition-colors"
                        >
                          <div className={`w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className="text-sm text-slate-700">{branch}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button className="bg-white shadow-sm text-slate-800 px-3 py-1 rounded text-sm font-medium">
                Theo Ngày
              </button>
              <button className="text-slate-600 px-3 py-1 rounded text-sm font-medium hover:bg-slate-200">
                Theo Tuần
              </button>
              <button className="text-slate-600 px-3 py-1 rounded text-sm font-medium hover:bg-slate-200">
                Theo Tháng
              </button>
            </div>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(val) =>
                  val.split("-").slice(1).reverse().join("/")
                }
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                dy={10}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={(val) => `${val}M`}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    titleLabel="Ngày"
                    valueFormatter={(val) => `${val} Triệu VNĐ`}
                  />
                }
                cursor={{ fill: "#f8fafc" }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
              />

              <Bar
                yAxisId="left"
                dataKey="actualCollection"
                name="Thực thu (Cột)"
                fill="#93c5fd"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Line
                yAxisId="right"
                type="monotone"
                name="Lũy kế YTD (Đường)"
                dataKey="actualCollectionYTD"
                stroke="#4f46e5"
                strokeWidth={3}
                dot={false}
                activeDot={{
                  r: 6,
                  fill: "#4f46e5",
                  stroke: "#fff",
                  strokeWidth: 2,
                }}
              />

              <ReferenceLine
                yAxisId="right"
                y={4500}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                label={{
                  position: "insideTopLeft",
                  value: "Target Tháng: 4.5 Tỷ",
                  fill: "#f43f5e",
                  fontSize: 11,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Hiệu suất Top Chi nhánh
            </h2>
            <p className="text-sm text-slate-500">
              Đóng góp doanh thu và tỷ lệ đạt chỉ tiêu
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50 font-medium">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Cửa hàng</th>
                <th className="px-6 py-4 text-right">Doanh thu</th>
                <th className="px-6 py-4 w-[200px]">Tiến độ chỉ tiêu</th>
                <th className="px-6 py-4 text-right">Tăng trưởng</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformanceData.slice(0, 5).map((storeData, idx) => {
                const targetPercent =
                  storeData.targetPercent ??
                  (storeData.target && storeData.target > 0
                    ? (storeData.revenue / storeData.target) * 100
                    : 0);
                const growth =
                  storeData.growth ??
                  (storeData.previousRevenue && storeData.previousRevenue > 0
                    ? ((storeData.revenue - storeData.previousRevenue) /
                        storeData.previousRevenue) *
                      100
                    : 0);

                return (
                  <tr
                    key={storeData.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 text-indigo-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {storeData.name}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {storeData.revenue}M
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${Math.min(targetPercent, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-emerald-600 font-medium whitespace-nowrap">
                          {targetPercent.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td
                      className={`px-6 py-4 text-right font-medium ${growth >= 0 ? "text-emerald-500" : "text-rose-500"}`}
                    >
                      {growth > 0 ? "+" : ""}
                      {growth.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <BranchRevenueComparison />
      <GrowthAnalysisChart />
    </div>
  );
};
