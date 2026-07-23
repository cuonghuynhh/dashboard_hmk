/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { FilterBar } from "./components/FilterBar";
import { ExecutiveView } from "./views/ExecutiveView";
import { OperationalView } from "./views/OperationalView";
import { ProductView } from "./views/ProductView";
import { PersonnelView } from "./views/PersonnelView";
import { KPIManagementView } from "./views/KPIManagementView";
import { cn } from "./lib/utils";
import { BarChart3, Activity, Package, UserCircle, Target } from "lucide-react";
import { AppProvider, useAppContext } from "./AppContext";

type Tab = "executive" | "operational" | "product" | "personnel" | "kpi";

const DashboardApp = () => {
  const { role } = useAppContext();
  const [activeTab, setActiveTab] = useState<Tab>("executive");

  useEffect(() => {
    if (role === "STAFF" && activeTab !== "personnel") {
      setActiveTab("personnel");
    }
    if (role === "MANAGER" && activeTab === "executive") {
      setActiveTab("operational");
    }
  }, [role, activeTab]);

  const renderView = () => {
    switch (activeTab) {
      case "executive":
        return role === "BOD" ? <ExecutiveView /> : <OperationalView />;
      case "operational":
        return role === "BOD" || role === "MANAGER" ? (
          <OperationalView />
        ) : (
          <PersonnelView />
        );
      case "product":
        return role === "BOD" || role === "MANAGER" ? (
          <ProductView />
        ) : (
          <PersonnelView />
        );
      case "personnel":
        return <PersonnelView />;
      case "kpi":
        return role === "BOD" || role === "MANAGER" ? <KPIManagementView /> : <PersonnelView />;
      default:
        return <PersonnelView />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      <Header />
      <FilterBar />

      <main className="max-w-[1600px] mx-auto w-full p-6 flex-grow">
        <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-lg w-fit mb-6">
          {role === "BOD" && (
            <button
              onClick={() => setActiveTab("executive")}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "executive"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
              )}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Tổng quan
            </button>
          )}
          {(role === "BOD" || role === "MANAGER") && (
            <>
              <button
                onClick={() => setActiveTab("operational")}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "operational"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
                )}
              >
                <Activity className="w-4 h-4 mr-2" />
                Vận hành & Khách hàng
              </button>
              <button
                onClick={() => setActiveTab("product")}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  activeTab === "product"
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
                )}
              >
                <Package className="w-4 h-4 mr-2" />
                Sản phẩm & Tồn kho
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab("personnel")}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
              activeTab === "personnel"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
            )}
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Hiệu suất Nhân sự
          </button>
          {(role === "BOD" || role === "MANAGER") && (
            <button
              onClick={() => setActiveTab("kpi")}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors",
                activeTab === "kpi"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-200/50",
              )}
            >
              <Target className="w-4 h-4 mr-2" />
              Quản lý KPI
            </button>
          )}
        </div>

        {renderView()}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <DashboardApp />
    </AppProvider>
  );
}
