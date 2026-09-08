import React, { createContext, useContext, useState } from "react";

export type Role = "BOD" | "MANAGER" | "STAFF";
export type Period = "day" | "week" | "month" | "quarter" | "year";

interface AppContextType {
  dateRange: { start: string; end: string };
  setDateRange: (range: { start: string; end: string }) => void;
  period: Period;
  setPeriod: (period: Period) => void;
  role: Role;
  setRole: (role: Role) => void;
  lastUpdated: string;
  refreshData: () => void;
  isRefreshing: boolean;
  globalRegion: string;
  setGlobalRegion: (r: string) => void;
  globalBranch: string;
  setGlobalBranch: (b: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [role, setRole] = useState<Role>("BOD");
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({ start: "2026-06-01", end: "2026-09-30" });
  const [period, setPeriod] = useState<Period>("week");
  const [globalRegion, setGlobalRegion] = useState("Tất cả Khu vực");
  const [globalBranch, setGlobalBranch] = useState("Tất cả Chi nhánh");

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <AppContext.Provider
      value={{ role, setRole, lastUpdated, refreshData, isRefreshing, dateRange, setDateRange, period, setPeriod, globalRegion, setGlobalRegion, globalBranch, setGlobalBranch }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
};
