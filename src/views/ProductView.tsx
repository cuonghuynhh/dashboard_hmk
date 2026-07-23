import React, { useState, useMemo } from "react";
import {
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  treemapData,
  scatterData,
  brandPerformanceData,
  topProductsData,
  multidimensionalAnalysisData,
} from "../data";
import { DataDetailModal, Column } from "../components/DataDetailModal";
import { FileText, ChevronDown } from "lucide-react";
import { CustomTooltip } from "../components/CustomTooltip";

import { ProductGrowthAnalysisChart } from "../components/ProductGrowthAnalysisChart";
import { DrilldownTreemap } from "../components/DrilldownTreemap";

type AnalysisDimension =
  | "category"
  | "subCategoryLens"
  | "subCategoryFrame"
  | "brandLens"
  | "brandFrame"
  | "supplier"
  | "refractiveIndex"
  | "color";
type AnalysisMetric = "value" | "quantity";

const dimensionOptions: { value: AnalysisDimension; label: string }[] = [
  { value: "category", label: "Từng ngành hàng" },
  { value: "subCategoryLens", label: "Nhóm ngành hàng Tròng" },
  { value: "subCategoryFrame", label: "Nhóm ngành hàng Gọng" },
  { value: "brandLens", label: "Thương hiệu Tròng" },
  { value: "brandFrame", label: "Thương hiệu Gọng" },
  { value: "supplier", label: "Nhà cung cấp" },
  { value: "refractiveIndex", label: "Chiết suất (Tròng)" },
  { value: "color", label: "Màu sắc" },
];

const metricOptions: { value: AnalysisMetric; label: string }[] = [
  { value: "value", label: "Doanh thu (Tỷ VNĐ)" },
  { value: "quantity", label: "Số lượng (Đơn hàng/Sản phẩm)" },
];

export const ProductView: React.FC = () => {
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

  const [activeDimension, setActiveDimension] =
    useState<AnalysisDimension>("category");
  const [activeMetric, setActiveMetric] = useState<AnalysisMetric>("value");
  
  const [activeTreemapDimension, setActiveTreemapDimension] = useState<AnalysisDimension | "hierarchical">("hierarchical");

  const treemapChartData = useMemo(() => {
    if (activeTreemapDimension === "hierarchical") {
      return undefined; // DrilldownTreemap will fallback to hierarchicalTreemapData
    }
    // Convert flat multidimensional data into treemap format
    const flatData = multidimensionalAnalysisData[activeTreemapDimension];
    const colors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
    return flatData.map((item, idx) => ({
      name: item.name,
      size: item.value,
      fill: colors[idx % colors.length]
    }));
  }, [activeTreemapDimension]);

  const openModal = (title: string, data: any[], columns: Column<any>[]) => {
    setModalConfig({ isOpen: true, title, data, columns });
  };

  const closeModal = () => setModalConfig({ ...modalConfig, isOpen: false });

  const currentAnalysisData = useMemo(() => {
    return [...multidimensionalAnalysisData[activeDimension]].sort(
      (a, b) => b[activeMetric] - a[activeMetric],
    );
  }, [activeDimension, activeMetric]);

  const activeDimensionLabel =
    dimensionOptions.find((d) => d.value === activeDimension)?.label || "";
  const activeMetricLabel =
    metricOptions.find((m) => m.value === activeMetric)?.label || "";

  return (
    <div className="space-y-6">
      <DataDetailModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        data={modalConfig.data}
        columns={modalConfig.columns}
      />

      {/* Phân tích Tăng trưởng Sản phẩm */}
      <ProductGrowthAnalysisChart />

      {/* Phân tích Đa chiều */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Phân tích Đa chiều (Multi-dimensional Analysis)
            </h2>
            <p className="text-xs text-slate-500">
              Doanh thu / Đơn hàng theo các tiêu chí phân loại
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={activeMetric}
                  onChange={(e) =>
                    setActiveMetric(e.target.value as AnalysisMetric)
                  }
                  className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-1.5 pl-3 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {metricOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={activeDimension}
                  onChange={(e) =>
                    setActiveDimension(e.target.value as AnalysisDimension)
                  }
                  className="appearance-none bg-slate-50 border border-slate-200 text-indigo-600 py-1.5 pl-3 pr-8 rounded-md text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {dimensionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
              </div>
            </div>

            <button
              onClick={() =>
                openModal(
                  `Dữ liệu Phân tích: ${activeMetricLabel} theo ${activeDimensionLabel}`,
                  currentAnalysisData,
                  [
                    { key: "name", header: activeDimensionLabel },
                    {
                      key: activeMetric,
                      header: activeMetricLabel,
                      align: "right",
                    },
                  ],
                )
              }
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors border border-transparent hover:border-indigo-100"
              title="Xem chi tiết dữ liệu"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={currentAnalysisData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                dy={10}
                angle={currentAnalysisData.length > 5 ? -45 : 0}
                textAnchor={currentAnalysisData.length > 5 ? "end" : "middle"}
                height={currentAnalysisData.length > 5 ? 60 : 30}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(val) =>
                  activeMetric === "value"
                    ? `${val}T`
                    : val >= 1000
                      ? `${(val / 1000).toFixed(1)}k`
                      : val
                }
              />
              <Tooltip
                content={
                  <CustomTooltip
                    titleLabel={activeDimensionLabel}
                    valueFormatter={(val) =>
                      activeMetric === "value" ? `${val} Tỷ VNĐ` : `${val} SP`
                    }
                  />
                }
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar
                dataKey={activeMetric}
                fill={activeMetric === "value" ? "#6366f1" : "#10b981"}
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
                name={activeMetricLabel}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Phân khúc Ngành hàng - Treemap */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Cấu trúc Danh mục (Product Matrix)
              </h2>
              <p className="text-xs text-slate-500">
                Tỷ trọng đóng góp doanh thu theo ngành hàng (Treemap)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={activeTreemapDimension}
                  onChange={(e) =>
                    setActiveTreemapDimension(e.target.value as AnalysisDimension | "hierarchical")
                  }
                  className="appearance-none bg-slate-50 border border-slate-200 text-indigo-600 py-1.5 pl-3 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[200px] text-ellipsis"
                >
                  <option value="hierarchical">Cấu trúc phân cấp (Mặc định)</option>
                  {dimensionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-indigo-400 pointer-events-none" />
              </div>
              <button
                onClick={() =>
                  openModal("Dữ liệu Cấu trúc Danh mục", treemapChartData || treemapData, [
                    { key: "name", header: "Danh mục" },
                    { key: "size", header: "Tỷ trọng (%)", align: "right" },
                  ])
                }
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Xem chi tiết dữ liệu"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="h-[300px] w-full flex-grow">
            <DrilldownTreemap data={treemapChartData} />
          </div>
        </div>

        {/* Scatter Plot cho Hero SKUs (Suất khúc xạ / Số lượng) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Ma trận Phôi Tròng (Sphere vs Cylinder)
              </h2>
              <p className="text-xs text-slate-500">
                Phân tán số lượng bán ra theo Độ Cận/Viễn (Sphere) và Độ Loạn (Cylinder)
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() =>
                  openModal("Ma trận Phôi Tròng", scatterData, [
                    { key: "sphere", header: "Độ Cận/Viễn (SPH)" },
                    { key: "cylinder", header: "Độ Loạn (CYL)" },
                    {
                      key: "quantity",
                      header: "Số lượng bán ra",
                      align: "right",
                    },
                    { key: "color", header: "Phân loại" },
                  ])
                }
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Xem chi tiết dữ liệu"
              >
                <FileText className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>Trong
                  suốt
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>Đổi
                  màu
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>Đa
                  tròng
                </span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full flex-grow mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey="sphere"
                  name="Sphere"
                  unit="D"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                  label={{ value: 'Độ Cận (-) / Viễn (+)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="cylinder"
                  name="Cylinder"
                  unit="D"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  domain={['auto', 'auto']}
                  label={{ value: 'Độ Loạn (CYL)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                />
                <ZAxis 
                  type="number"
                  dataKey="quantity"
                  range={[50, 400]} 
                  name="Số lượng"
                />
                <Tooltip
                  content={<CustomTooltip titleLabel="Thuộc tính" />}
                  cursor={{ strokeDasharray: "3 3" }}
                />
                <Scatter name="Phôi tròng" data={scatterData} fill="#8884d8">
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thương hiệu & Nhà cung cấp */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-1">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Thương hiệu Phân phối
              </h2>
              <p className="text-xs text-slate-500">
                Doanh thu theo thương hiệu gọng / tròng
              </p>
            </div>
            <button
              onClick={() =>
                openModal(
                  "Dữ liệu Thương hiệu Phân phối",
                  brandPerformanceData,
                  [
                    { key: "name", header: "Thương hiệu" },
                    {
                      key: "revenue",
                      header: "Doanh thu (Tỷ VNĐ)",
                      align: "right",
                    },
                  ],
                )
              }
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Xem chi tiết dữ liệu"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandPerformanceData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  tickFormatter={(val) => `${val} Tỷ`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  width={80}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      titleLabel="Thương hiệu"
                      valueFormatter={(val) => `${val} Tỷ VNĐ`}
                    />
                  }
                  cursor={{ fill: "#f8fafc" }}
                />
                <Bar
                  dataKey="value"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                  name="Doanh thu (Tỷ)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Sản phẩm bán chạy */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2 flex flex-col">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Top Sản phẩm & Vật tư tiêu hao
              </h2>
              <p className="text-xs text-slate-500">
                Hỗ trợ quản trị hàng tồn kho (Inventory Management)
              </p>
            </div>
            <button className="bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-slate-50 transition-colors">
              Xem toàn bộ danh mục
            </button>
          </div>
          <div className="overflow-x-auto flex-grow">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-white font-medium">
                <tr>
                  <th className="px-6 py-4 w-16">#</th>
                  <th className="px-6 py-4">Sản phẩm</th>
                  <th className="px-6 py-4">Nhà cung cấp</th>
                  <th className="px-6 py-4">Thuộc tính (Suất / Màu)</th>
                  <th className="px-6 py-4 text-right">Số lượng bán ra</th>
                </tr>
              </thead>
              <tbody>
                {topProductsData.map((product, idx) => (
                  <tr
                    key={product.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 whitespace-nowrap"
                  >
                    <td className="px-6 py-4 text-indigo-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {product.supplier}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {product.power !== "N/A" && (
                        <span className="bg-slate-100 px-2 py-1 rounded mr-2">
                          Suất: {product.power}
                        </span>
                      )}
                      {product.color !== "N/A" && (
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          Màu: {product.color}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      <span className="bg-slate-100 text-slate-700 py-1 px-3 rounded-full text-xs">
                        {product.quantity.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
