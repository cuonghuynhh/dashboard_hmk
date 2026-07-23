import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import {
  orderAgingData,
  populationData,
  basketSizeData,
  dayOfWeekData,
  hourOfDayData,
  paymentData,
  marketingCampaignsData,
} from "../data";
import { DataDetailModal, Column } from "../components/DataDetailModal";
import { FileText } from "lucide-react";
import { CustomTooltip } from "../components/CustomTooltip";
import { ConversionAndRefundAnalysis } from "../components/ConversionAndRefundAnalysis";
import { RegionalComparison } from "../components/RegionalComparison";
import { AnomalyDetectionChart } from "../components/AnomalyDetectionChart";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

export const OperationalView: React.FC = () => {
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

  const [agingType, setAgingType] = useState<"quantity" | "value">("quantity");
  const [demographicsType, setDemographicsType] = useState<
    "quantity" | "value"
  >("quantity");
  const [timePeakMetric, setTimePeakMetric] = useState<"quantity" | "value">("quantity");
  // Aggregate data for Pie and Bar charts based on current demographicsType
  const demographicsData = useMemo(() => {
    const rawData = populationData[demographicsType];
    const genderData = [
      {
        name: "Nam",
        value: rawData.reduce((acc, curr) => acc + Math.abs(curr.male), 0),
        fill: "#3b82f6",
      },
      {
        name: "Nữ",
        value: rawData.reduce((acc, curr) => acc + curr.female, 0),
        fill: "#ec4899",
      },
    ];
    const ageData = rawData.map((item) => ({
      name: item.age,
      value: Math.abs(item.male) + item.female,
      fill: "#6366f1",
    }));

    return { genderData, ageData };
  }, [demographicsType]);

  const valueFormatterDemographics = (val: number) => {
    return demographicsType === "value" ? `${val.toFixed(1)} Tỷ` : `${val}%`;
  };

  // Generate a flattened array for the time peak heatmap data for the modal
  const timePeakFlattenedData = useMemo(() => {
    const flattened: any[] = [];
    dayOfWeekData.forEach((day, dIdx) => {
      hourOfDayData.forEach((hour, hIdx) => {
        const isWeekend = day.name === "Thứ 7" || day.name === "Chủ Nhật";
        const isEvening = hour.name === "16-18h" || hour.name === "18-20h";

        let intensity = 0.1;
        if (isWeekend) intensity += 0.4;
        if (isEvening) intensity += 0.3;
        if (!isWeekend && hour.name === "10-12h") intensity += 0.2;
        if (!isWeekend && hour.name === "8-10h") intensity = 0.05;

        intensity = Math.min(
          Math.max(intensity + (Math.random() * 0.2 - 0.1), 0.05),
          1,
        );
        const val = Math.floor(intensity * 150);
        const revenueValue = (intensity * 45).toFixed(1);
        flattened.push({ 
          day: day.name, 
          hour: hour.name, 
          orders: val, 
          revenueValue,
          revenue: `${revenueValue} Tr`,
          intensity
        });
      });
    });
    return flattened;
  }, []);

  return (
    <div className="space-y-6">
      <DataDetailModal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        data={modalConfig.data}
        columns={modalConfig.columns}
      />

      {/* Vận hành & Cảnh báo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-1 flex flex-col">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Cảnh báo Tồn đọng (Order Aging)
              </h2>
              <p className="text-xs text-slate-500">
                Đơn hàng chưa hoàn thành theo thời gian lưu
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() =>
                  openModal(
                    "Dữ liệu Cảnh báo Tồn đọng",
                    orderAgingData[agingType],
                    [
                      { key: "stage", header: "Trạng thái" },
                      { key: "day1_5", header: "1-5 ngày", align: "right" },
                      { key: "day5_10", header: "5-10 ngày", align: "right" },
                      { key: "day10_20", header: "10-20 ngày", align: "right" },
                      { key: "dayOver20", header: "> 20 ngày", align: "right" },
                    ],
                  )
                }
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Xem chi tiết dữ liệu"
              >
                <FileText className="w-4 h-4" />
              </button>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button
                  onClick={() => setAgingType("quantity")}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${agingType === "quantity" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Theo số lượng
                </button>
                <button
                  onClick={() => setAgingType("value")}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${agingType === "value" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Theo Value
                </button>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={orderAgingData[agingType]}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickFormatter={(val) =>
                    agingType === "value" ? `${val}Tr` : val
                  }
                />
                <YAxis
                  dataKey="stage"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  width={80}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      titleLabel="Tồn đọng"
                      valueFormatter={(val) =>
                        agingType === "value" ? `${val} Triệu` : `${val} đơn`
                      }
                    />
                  }
                  cursor={{ fill: "#f8fafc" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px" }}
                />
                <Bar
                  dataKey="day1_5"
                  name="1-5 ngày"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="day5_10"
                  name="5-10 ngày"
                  stackId="a"
                  fill="#f59e0b"
                  radius={[0, 0, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="day10_20"
                  name="10-20 ngày"
                  stackId="a"
                  fill="#f97316"
                  radius={[0, 0, 0, 0]}
                  barSize={24}
                />
                <Bar
                  dataKey="dayOver20"
                  name="> 20 ngày"
                  stackId="a"
                  fill="#ef4444"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 lg:col-span-2">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Thời gian Bán hàng Tối ưu (Time Peak)
              </h2>
              <p className="text-xs text-slate-500">
                Biểu đồ nhiệt phân bố số lượng đơn hàng theo khung giờ & ngày
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  openModal(
                    "Dữ liệu Thời gian Bán hàng",
                    timePeakFlattenedData,
                    [
                      { key: "day", header: "Ngày trong tuần" },
                      { key: "hour", header: "Khung giờ" },
                      timePeakMetric === "quantity" 
                        ? { key: "orders", header: "Số lượng đơn", align: "right" }
                        : { key: "revenue", header: "Doanh thu (Tr)", align: "right" }
                    ],
                  )
                }
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Xem chi tiết dữ liệu"
              >
                <FileText className="w-4 h-4" />
              </button>
              <div className="flex bg-slate-100 p-1 rounded-md">
                <button
                  onClick={() => setTimePeakMetric("quantity")}
                  className={`${
                    timePeakMetric === "quantity"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-600 hover:bg-slate-200"
                  } px-3 py-1 rounded text-sm font-medium`}
                >
                  Theo Đơn hàng
                </button>
                <button
                  onClick={() => setTimePeakMetric("value")}
                  className={`${
                    timePeakMetric === "value"
                      ? "bg-white shadow-sm text-slate-800"
                      : "text-slate-600 hover:bg-slate-200"
                  } px-3 py-1 rounded text-sm font-medium`}
                >
                  Theo Doanh thu
                </button>
              </div>
            </div>
          </div>
          <div className="w-full overflow-x-auto mt-2">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-2 font-medium text-slate-500 text-xs"></th>
                  {hourOfDayData.map((h) => (
                    <th
                      key={h.name}
                      className="p-2 font-medium text-slate-500 text-xs text-center"
                    >
                      {h.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayOfWeekData.map((day, dIdx) => (
                  <tr key={day.name}>
                    <td className="p-2 font-medium text-slate-700 text-xs whitespace-nowrap text-right pr-4">
                      {day.name}
                    </td>
                    {hourOfDayData.map((hour) => {
                      const cellData = timePeakFlattenedData.find(d => d.day === day.name && d.hour === hour.name);
                      if (!cellData) return <td key={hour.name} className="p-1 min-w-[50px]"></td>;
                      
                      const intensity = cellData.intensity;
                      const bgColor = `rgba(99, 102, 241, ${intensity})`;
                      const textColor = intensity > 0.5 ? "text-white" : "text-slate-700";
                      const valQuantity = cellData.orders;
                      const valValue = cellData.revenueValue;
                      
                      const displayVal = timePeakMetric === "quantity" ? valQuantity : `${valValue}Tr`;
                      const tooltipText = timePeakMetric === "quantity" ? `${valQuantity} đơn` : `${valValue} Triệu VNĐ`;

                      return (
                        <td key={hour.name} className="p-1 min-w-[50px]">
                          <div
                            className={`w-full h-9 flex items-center justify-center rounded-md text-[11px] font-medium transition-all hover:ring-2 hover:ring-indigo-300 cursor-pointer ${textColor}`}
                            style={{ backgroundColor: bgColor }}
                            title={`${day.name} ${hour.name}: ${tooltipText}`}
                          >
                            {(timePeakMetric === "quantity" && valQuantity > 10) || (timePeakMetric === "value" && parseFloat(valValue) > 3) ? displayVal : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Hành vi & Chân dung Khách hàng */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Phân tích Nhân khẩu học Khách hàng
            </h2>
            <p className="text-xs text-slate-500">
              Giới tính & Nhóm tuổi (Tháp dân số)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <button
              onClick={() =>
                openModal(
                  "Dữ liệu Chân dung Khách hàng",
                  populationData[demographicsType],
                  [
                    { key: "age", header: "Nhóm tuổi" },
                    { key: "female", header: "Nữ", align: "right" },
                    { key: "male", header: "Nam", align: "right" },
                  ],
                )
              }
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
              title="Xem chi tiết dữ liệu"
            >
              <FileText className="w-4 h-4" />
            </button>
            <div className="flex bg-slate-100 p-1 rounded-md">
              <button
                onClick={() => setDemographicsType("quantity")}
                className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${demographicsType === "quantity" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >
                Theo số lượng (Đơn hàng)
              </button>
              <button
                onClick={() => setDemographicsType("value")}
                className={`px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${demographicsType === "value" ? "bg-white shadow-sm text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
              >
                Theo Value (Doanh thu)
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 mt-2">
          {/* Pie Chart: Gender */}
          <div className="lg:col-span-3 h-[260px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 text-center">
              Tỷ trọng Giới tính
            </h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={demographicsData.genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {demographicsData.genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomTooltip
                        titleLabel="Giới tính"
                        valueFormatter={valueFormatterDemographics}
                      />
                    }
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Age */}
          <div className="lg:col-span-4 h-[260px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 text-center">
              Phân bổ Nhóm tuổi
            </h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={demographicsData.ageData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    dy={10}
                  />
                  <YAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(val) =>
                      demographicsType === "value" ? `${val}T` : val
                    }
                  />
                  <Tooltip
                    content={
                      <CustomTooltip
                        titleLabel="Nhóm tuổi"
                        valueFormatter={valueFormatterDemographics}
                      />
                    }
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                    {demographicsData.ageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Population Pyramid: Age x Gender */}
          <div className="lg:col-span-5 h-[260px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-2 text-center">
              Tháp Dân số (Giới tính & Nhóm tuổi)
            </h3>
            <div className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={populationData[demographicsType]}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
                  stackOffset="sign"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={true}
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickFormatter={(val) =>
                      Math.abs(val) + (demographicsType === "value" ? "T" : "")
                    }
                  />
                  <YAxis
                    dataKey="age"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    width={80}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border border-slate-200 shadow-md rounded-lg p-3 z-50">
                            <p className="font-bold text-slate-700 mb-2">
                              {label}
                            </p>
                            {payload.map((entry, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between gap-4 mt-1"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: entry.color }}
                                  />
                                  <span className="text-sm text-slate-600">
                                    {entry.name}
                                  </span>
                                </div>
                                <span className="font-semibold text-slate-800">
                                  {Math.abs(entry.value as number).toFixed(1)}{" "}
                                  {demographicsType === "value"
                                    ? "Tỷ VNĐ"
                                    : demographicsType === "quantity"
                                      ? "%"
                                      : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                  <Bar
                    dataKey="male"
                    name="Nam"
                    fill="#3b82f6"
                    stackId="stack"
                    radius={[4, 0, 0, 4]}
                    barSize={16}
                  />
                  <Bar
                    dataKey="female"
                    name="Nữ"
                    fill="#ec4899"
                    stackId="stack"
                    radius={[0, 4, 4, 0]}
                    barSize={16}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col gap-6">
          <div>
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Phân khúc Hóa đơn (Basket Size)
                </h2>
                <p className="text-xs text-slate-500">
                  Tỷ trọng các khoảng giá trị đơn hàng
                </p>
              </div>
              <button
                onClick={() =>
                  openModal("Dữ liệu Phân khúc Hóa đơn", basketSizeData, [
                    { key: "name", header: "Phân khúc (VND)" },
                    { key: "value", header: "Tỷ trọng (%)", align: "right" },
                  ])
                }
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Xem chi tiết dữ liệu"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[200px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <Pie
                    data={basketSizeData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                  >
                    {basketSizeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={
                      <CustomTooltip
                        titleLabel="Phân khúc"
                        valueFormatter={(val) => `${val}%`}
                      />
                    }
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", right: 0 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <div className="mb-4 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Hình thức Thanh toán
                </h2>
                <p className="text-xs text-slate-500">
                  Sự dịch chuyển dòng tiền qua các kênh
                </p>
              </div>
              <button
                onClick={() =>
                  openModal("Dữ liệu Hình thức Thanh toán", paymentData, [
                    { key: "name", header: "Hình thức" },
                    { key: "value", header: "Tỷ trọng (%)", align: "right" },
                  ])
                }
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                title="Xem chi tiết dữ liệu"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            <div className="h-[120px] w-full flex items-center">
              {/* Custom Stacked Bar for Payment Methods to match a distinct aesthetic */}
              <div className="w-full flex h-8 rounded-full overflow-hidden">
                {paymentData.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.fill,
                    }}
                    className="h-full flex items-center justify-center text-white text-[10px] font-medium transition-all hover:opacity-90"
                    title={`${item.name}: ${item.value}%`}
                  >
                    {item.value > 10 && `${item.value}%`}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {paymentData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-xs text-slate-600"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  ></div>
                  {item.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Campaigns */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            Hiệu quả Chiến dịch (Marketing & Promotions)
          </h2>
          <p className="text-xs text-slate-500">
            Đo lường doanh thu và lượng đơn hàng đổ về từ các chương trình ưu
            đãi
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 bg-slate-50 font-medium">
              <tr>
                <th className="px-6 py-4">Tên chương trình / Campaign</th>
                <th className="px-6 py-4 text-right">Doanh thu mang lại</th>
                <th className="px-6 py-4 text-right">Số lượng Đơn hàng</th>
              </tr>
            </thead>
            <tbody>
              {marketingCampaignsData.map((campaign, idx) => (
                <tr
                  key={idx}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-bold text-indigo-600">
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">
                    {campaign.revenue} Tỷ VNĐ
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    {campaign.orders.toLocaleString()} đơn
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <RegionalComparison />

      <AnomalyDetectionChart />

      <ConversionAndRefundAnalysis />
    </div>
  );
};
