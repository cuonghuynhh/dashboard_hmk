import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { picSalesData, picKtvDoData, picKtvMaiData } from "../data";
import {
  UserCircle,
  Eye,
  Wrench,
  Trophy,
  Target,
  TrendingUp,
  Award,
} from "lucide-react";
import { useAppContext } from "../AppContext";

export const PersonnelView: React.FC = () => {
  const { role } = useAppContext();

  if (role === "STAFF") {
    return (
      <div className="space-y-6">
        {/* Personal Overview Scorecards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-sm font-medium mb-1">
                Doanh số cá nhân (Tháng)
              </p>
              <h3 className="text-3xl font-bold">
                128.5 <span className="text-lg font-normal">Tr</span>
              </h3>
              <p className="text-indigo-200 text-xs mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +15% so với mục tiêu
              </p>
            </div>
            <Trophy className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-10" />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">
                Xếp hạng nội bộ
              </p>
              <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                Top 2{" "}
                <span className="text-xs text-amber-500 ml-2 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                  / 15 Sales
                </span>
              </h3>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: "85%" }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">
                Giá trị đơn TB (AOV)
              </p>
              <h3 className="text-2xl font-bold text-slate-800">
                1.8{" "}
                <span className="text-sm font-medium text-slate-500">
                  Tr/đơn
                </span>
              </h3>
            </div>
            <p className="text-emerald-500 text-xs mt-2 font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +0.2 Tr so với TB Cửa hàng
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">
                Đánh giá CSKH (NPS)
              </p>
              <h3 className="text-2xl font-bold text-slate-800">
                4.9{" "}
                <span className="text-sm font-medium text-slate-500">
                  / 5.0
                </span>
              </h3>
            </div>
            <div className="flex text-amber-400 mt-2">★★★★★</div>
          </div>
        </div>

        {/* Detailed Breakdown for Staff */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-md font-bold text-slate-800">
                  Tiến độ KPI Tuần
                </h2>
                <p className="text-xs text-slate-500">
                  Theo dõi doanh số đạt được theo kế hoạch
                </p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">
                    Tròng kính cận / đa tròng
                  </span>
                  <span className="font-bold text-indigo-600">80%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: "80%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">
                    Gọng kính cao cấp
                  </span>
                  <span className="font-bold text-indigo-600">65%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-700">Kính mát</span>
                  <span className="font-bold text-indigo-600">110%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex flex-col items-center justify-center text-center">
            <Award className="w-16 h-16 text-amber-400 mb-3" />
            <h2 className="text-xl font-bold text-slate-800">
              Nhân viên xuất sắc
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-sm">
              Chúc mừng bạn đã đạt chỉ tiêu sớm 5 ngày trong chu kỳ tuần này.
              Tiếp tục duy trì phong độ để nhận thưởng hiệu suất!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Global Leaderboard (BOD / MANAGER)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIC Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <UserCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Bảng Xếp Hạng PIC Sales
              </h2>
              <p className="text-xs text-slate-500">
                Đánh giá năng lực chốt sales qua Doanh số & Giá trị đơn (AOV)
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-slate-500 bg-slate-50 font-medium">
                <tr>
                  <th className="px-4 py-3 w-10">#</th>
                  <th className="px-4 py-3">Nhân sự</th>
                  <th className="px-4 py-3 w-1/3">Tiến độ Doanh số</th>
                  <th className="px-4 py-3 text-right">Doanh số</th>
                  <th className="px-4 py-3 text-right">AOV (Tr/Đơn)</th>
                </tr>
              </thead>
              <tbody>
                {[...picSalesData]
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((pic, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 font-medium text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-700">
                        {pic.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${(pic.revenue / 2) * 100}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-indigo-600">
                        {pic.revenue} Tỷ
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                        {pic.aov}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KTV Đo & KTV Mài Lắp */}
        <div className="flex flex-col gap-6">
          {/* PIC KTV Đo Khúc xạ */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex-grow flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-md font-bold text-slate-800">
                  Hiệu suất KTV Khúc Xạ
                </h2>
                <p className="text-xs text-slate-500">
                  Tỷ lệ chuyển đổi ra đơn & Độ chính xác đo khám
                </p>
              </div>
            </div>
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-slate-50 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3">Nhân sự</th>
                    <th className="px-4 py-3 w-1/3">Tỷ lệ chuyển đổi</th>
                    <th className="px-4 py-3 text-right">Chính xác</th>
                  </tr>
                </thead>
                <tbody>
                  {[...picKtvDoData]
                    .sort((a, b) => b.conversion - a.conversion)
                    .map((pic, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3 font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {pic.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className="bg-emerald-500 h-1.5 rounded-full"
                                style={{ width: `${pic.conversion}%` }}
                              ></div>
                            </div>
                            <span className="text-emerald-600 font-medium text-xs">
                              {pic.conversion}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          {pic.accuracy}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PIC KTV Mài Lắp */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex-grow flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-md font-bold text-slate-800">
                  Hiệu suất Phòng Lab
                </h2>
                <p className="text-xs text-slate-500">
                  Tốc độ hoàn thành & Tỷ lệ hư hao vật tư
                </p>
              </div>
            </div>
            <div className="overflow-x-auto flex-grow">
              <table className="w-full text-sm text-left">
                <thead className="text-slate-500 bg-slate-50 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-10">#</th>
                    <th className="px-4 py-3">Phòng Lab</th>
                    <th className="px-4 py-3 w-1/3">Hoàn thành đúng hạn</th>
                    <th className="px-4 py-3 text-right">Tỷ lệ hư hao</th>
                  </tr>
                </thead>
                <tbody>
                  {[...picKtvMaiData]
                    .sort((a, b) => b.speed - a.speed)
                    .map((pic, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3 font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {pic.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className="bg-amber-500 h-1.5 rounded-full"
                                style={{ width: `${pic.speed}%` }}
                              ></div>
                            </div>
                            <span className="text-amber-600 font-medium text-xs">
                              {pic.speed}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-rose-500">
                          {pic.defect}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
