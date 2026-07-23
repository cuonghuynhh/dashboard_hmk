import React from "react";
import { LayoutDashboard, Bell, UserCircle, Shield, Clock } from "lucide-react";
import { useAppContext, Role } from "../AppContext";
import { Target } from "lucide-react";
import { KPIConfigurationModal } from "./KPIConfigurationModal";
import { useState } from "react";

export const Header: React.FC = () => {
  const { role, setRole, lastUpdated } = useAppContext();
  const [isKPIModalOpen, setIsKPIModalOpen] = useState(false);

  return (
    <>
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
          <LayoutDashboard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800 leading-tight">
            EBID Workspace
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Eyewear Business Intelligence Dashboard
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 border-r border-slate-200 pr-6 mr-2 hidden md:flex">
          <Clock className="w-4 h-4 text-emerald-500" />
          <span className="text-xs text-slate-500 font-medium">
            Đồng bộ:{" "}
            <strong className="text-slate-700 ml-1">{lastUpdated}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
          <Shield className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">
            Quyền truy cập:
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="text-sm font-bold text-indigo-600 bg-indigo-50 border-none rounded-md py-1 px-2 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="BOD">Ban Giám Đốc (Toàn hệ thống)</option>
            <option value="MANAGER">Quản lý (Cửa hàng)</option>
            <option value="STAFF">Nhân viên (Cá nhân)</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          {role === 'BOD' && (
            <button 
              onClick={() => setIsKPIModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors border border-indigo-100"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Cấu hình KPI</span>
            </button>
          )}
          <button className="relative text-slate-400 hover:text-slate-600">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white">
              3
            </span>
          </button>
          <div className="flex items-center gap-2">
            <UserCircle className="w-8 h-8 text-slate-300" />
            <div className="hidden md:block text-sm">
              <p className="font-bold text-slate-700 leading-none mb-1">
                Admin
              </p>
              <p className="text-xs text-slate-500 leading-none">
                admin@hmkeyewear.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
      <KPIConfigurationModal isOpen={isKPIModalOpen} onClose={() => setIsKPIModalOpen(false)} />
    </>
  );
};
