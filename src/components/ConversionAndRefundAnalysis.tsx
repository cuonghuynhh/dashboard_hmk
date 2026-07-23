import React, { useState } from "react";
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
} from "recharts";
import { conversionRateData, refundRateData } from "../data";
import { CustomTooltip } from "./CustomTooltip";

export const ConversionAndRefundAnalysis: React.FC = () => {
  const [conversionView, setConversionView] = useState<
    "store" | "region" | "system"
  >("store");

  const conversionData = conversionRateData[conversionView];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Conversion Rate */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Tỷ lệ Chuyển đổi (Conversion Rate)
            </h2>
            <p className="text-sm text-slate-500">
              Đánh giá hiệu quả chốt sale tại cửa hàng
            </p>
          </div>
          <select
            value={conversionView}
            onChange={(e) => setConversionView(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-700 py-1.5 px-3 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="store">Top Cửa hàng</option>
            <option value="region">Theo Khu vực</option>
            <option value="system">Toàn Hệ thống</option>
          </select>
        </div>

        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={conversionData}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 30, bottom: 0 }}
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
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(val) => `${val}%`}
              />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                width={120}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    titleLabel="Phân tích"
                    valueFormatter={(val) => `${val}%`}
                  />
                }
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar
                dataKey="rate"
                fill="#10b981"
                radius={[0, 4, 4, 0]}
                barSize={24}
              >
                {conversionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? "#10b981" : "#34d399"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Refund Rate */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">
            Tỷ lệ Hoàn tiền (Refund Rate)
          </h2>
          <p className="text-sm text-slate-500">
            Đánh giá rủi ro và chất lượng dịch vụ (Theo Doanh thu / Hóa đơn)
          </p>
        </div>

        <div className="h-[250px] w-full flex justify-center items-center">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={refundRateData}
              margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
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
              />
              <YAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                content={
                  <CustomTooltip
                    titleLabel="Chỉ số"
                    valueFormatter={(val) => `${val}%`}
                  />
                }
                cursor={{ fill: "#f8fafc" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                {refundRateData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
