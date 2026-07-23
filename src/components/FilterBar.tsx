import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Filter,
  Map,
  Package,
  Users,
  RefreshCw,
  UserCircle,
  Store,
} from "lucide-react";
import { useAppContext } from "../AppContext";

export const FilterBar: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { role, isRefreshing, refreshData } = useAppContext();

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
      <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Time filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 font-medium">Chu kỳ:</span>
            <select className="border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 outline-none hover:border-indigo-400">
              <option>Tùy chọn ngày</option>
              <option>YTD (Đầu năm đến nay)</option>
              <option>Tuần này</option>
              <option>Tháng này</option>
              <option>Quý này</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-600">
              <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />{" "}
              01/07/2026
            </div>
            <span className="text-slate-400">-</span>
            <div className="flex items-center border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-600">
              <CalendarIcon className="w-4 h-4 mr-2 text-slate-400" />{" "}
              31/07/2026
            </div>
          </div>
        </div>

        {/* Global/Primary Filters */}
        <div className="flex items-center gap-3">
          {role === "BOD" && (
            <>
              <button className="flex items-center border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 hover:bg-slate-50">
                <Map className="w-4 h-4 mr-2 text-slate-400" /> Toàn quốc
              </button>
              <button className="flex items-center border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 hover:bg-slate-50">
                Tất cả Chi nhánh{" "}
                <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
              </button>
            </>
          )}
          {role === "MANAGER" && (
            <button className="flex items-center border border-indigo-200 rounded-md px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100">
              <Store className="w-4 h-4 mr-2 text-indigo-500" /> HMK ĐN LÊ DUẨN
              2
            </button>
          )}
          {role === "STAFF" && (
            <button className="flex items-center border border-indigo-200 rounded-md px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100">
              <UserCircle className="w-4 h-4 mr-2 text-indigo-500" /> PIC:
              Nguyễn Văn A
            </button>
          )}

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center px-4 py-1.5 rounded-md text-sm font-medium transition-colors border ${
              showAdvanced
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Bộ lọc đa chiều
            <ChevronDown
              className={`w-4 h-4 ml-2 transition-transform ${showAdvanced ? "rotate-180" : ""}`}
            />
          </button>
          <button
            onClick={refreshData}
            className={`p-1.5 text-slate-400 hover:text-indigo-600 transition-colors ${isRefreshing ? "animate-spin text-indigo-600" : ""}`}
            title="Đồng bộ dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Package className="w-3 h-3 mr-1" /> Ngành hàng & Sản phẩm
            </label>
            <div className="space-y-2">
              <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 bg-white outline-none">
                <option>Tất cả Ngành hàng</option>
                <option>Tròng kính</option>
                <option>Gọng kính</option>
                <option>Kính mát</option>
              </select>
              <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 bg-white outline-none">
                <option>Thương hiệu (Tất cả)</option>
                <option>HMK Eyewear</option>
                <option>Essilor</option>
                <option>Chemi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <Users className="w-3 h-3 mr-1" /> Khách hàng
            </label>
            <div className="space-y-2">
              <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 bg-white outline-none">
                <option>Giới tính (Tất cả)</option>
                <option>Nam</option>
                <option>Nữ</option>
              </select>
              <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 bg-white outline-none">
                <option>Phân khúc Hóa đơn (Tất cả)</option>
                <option>&lt; 5 Triệu</option>
                <option>5 - 10 Triệu</option>
                <option>&gt; 10 Triệu</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              <UserCircle className="w-3 h-3 mr-1" /> Nhân sự (PIC)
            </label>
            <div className="space-y-2">
              <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 bg-white outline-none">
                <option>PIC Sales (Tất cả)</option>
              </select>
              <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 bg-white outline-none">
                <option>KTV Khúc xạ / Mài lắp (Tất cả)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Trạng thái Đơn hàng
            </label>
            <div className="space-y-2">
              <select className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm text-slate-700 bg-white outline-none">
                <option>Tất cả trạng thái</option>
                <option>Đã hoàn thành</option>
                <option>Đang đo mắt</option>
                <option>Đang mài lắp</option>
                <option>Đang vận chuyển</option>
              </select>
              <div className="flex justify-end pt-2">
                <button className="bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded hover:bg-indigo-700 transition-colors">
                  Áp dụng bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
