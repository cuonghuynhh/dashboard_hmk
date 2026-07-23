import React, { createContext, useContext, useState } from "react";

export type Role = "BOD" | "MANAGER" | "STAFF";

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  lastUpdated: string;
  refreshData: () => void;
  isRefreshing: boolean;
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
      value={{ role, setRole, lastUpdated, refreshData, isRefreshing }}
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
