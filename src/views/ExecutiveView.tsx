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
import { useAppContext } from "../AppContext";
import { generateChartDataByPeriod, aggregateMetrics } from "../utils/chartEngine";
import { GrowthAnalysisChart } from "../components/GrowthAnalysisChart";
import { FinancialOverviewCards } from "../components/FinancialOverviewCards";
import { GMVNetRevenueChart } from "../components/GMVNetRevenueChart";
import { GMVBreakdownChart } from "../components/GMVBreakdownChart";
import { RevenueTrendChart } from "../components/RevenueTrendChart";
import { RevenueWaterfallChart } from "../components/RevenueWaterfallChart";
import { TopPerformanceTable } from "../components/TopPerformanceTable";
import { BranchRevenueComparison } from "../components/BranchRevenueComparison";
import { LocalFilterUI } from "../components/LocalFilterUI";

const baseGmvNetRevenueData = [
  { name: 'T2', gmv: 120, netRev: 90 },
  { name: 'T3', gmv: 135, netRev: 100 },
  { name: 'T4', gmv: 140, netRev: 120 },
  { name: 'T5', gmv: 160, netRev: 130 },
  { name: 'T6', gmv: 180, netRev: 160 },
  { name: 'T7', gmv: 250, netRev: 210 },
  { name: 'CN', gmv: 280, netRev: 240 },
];

const baseGmvBreakdownData = [
  { name: 'T2', directOrder: 45, preOrder: 55 },
  { name: 'T3', directOrder: 50, preOrder: 50 },
  { name: 'T4', directOrder: 40, preOrder: 60 },
  { name: 'T5', directOrder: 35, preOrder: 65 },
  { name: 'T6', directOrder: 55, preOrder: 45 },
  { name: 'T7', directOrder: 60, preOrder: 40 },
  { name: 'CN', directOrder: 65, preOrder: 35 },
];

export const ExecutiveView: React.FC = () => {
  const { dateRange, period } = useAppContext();
  const [includeVat, setIncludeVat] = useState(true);
  const [timePeriod, setTimePeriod] = useState<"day" | "week" | "month" | "quarter">("month");
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
    const multiplier = selectedBranches.length === 0 ? 1 : (selectedBranches.length / branchOptions.length) * 0.8 + 0.2;
    let baseData: any[] = [];
    
    if (timePeriod === "day") {
      baseData = timeTrendData;
    } else if (timePeriod === "week") {
      baseData = Array.from({ length: 4 }).map((_, i) => {
        const target = (i + 1) * 1050;
        const revenue = Math.floor(Math.random() * 560) + 770;
        const revenueYTD = target - (4 - i) * 105 + Math.random() * 140;
        const actualCollection = Math.floor(revenue * (0.85 + Math.random() * 0.1));
        return {
          date: `Tuần ${i + 1}`,
          revenue,
          revenueYTD: Math.floor(revenueYTD),
          actualCollection,
          actualCollectionYTD: Math.floor(revenueYTD * 0.9),
          target,
          actualTarget: target * 0.9,
        };
      });
    } else if (timePeriod === "month") {
      baseData = Array.from({ length: 12 }).map((_, i) => {
        const target = (i + 1) * 4500;
        const revenue = Math.floor(Math.random() * 2400) + 3300;
        const revenueYTD = target - (12 - i) * 450 + Math.random() * 600;
        const actualCollection = Math.floor(revenue * (0.85 + Math.random() * 0.1));
        return {
          date: `Tháng ${i + 1}`,
          revenue,
          revenueYTD: Math.floor(revenueYTD),
          actualCollection,
          actualCollectionYTD: Math.floor(revenueYTD * 0.9),
          target,
          actualTarget: target * 0.9,
        };
      });
    } else if (timePeriod === "quarter") {
      baseData = Array.from({ length: 4 }).map((_, i) => {
        const target = (i + 1) * 13500;
        const revenue = Math.floor(Math.random() * 7200) + 9900;
        const revenueYTD = target - (4 - i) * 1350 + Math.random() * 1800;
        const actualCollection = Math.floor(revenue * (0.85 + Math.random() * 0.1));
        return {
          date: `Quý ${i + 1}`,
          revenue,
          revenueYTD: Math.floor(revenueYTD),
          actualCollection,
          actualCollectionYTD: Math.floor(revenueYTD * 0.9),
          target,
          actualTarget: target * 0.9,
        };
      });
    }

    return baseData.map(d => ({
      ...d,
      revenue: Math.floor(d.revenue * multiplier),
      revenueYTD: Math.floor(d.revenueYTD * multiplier),
      target: Math.floor(d.target * multiplier),
      actualCollection: Math.floor(d.actualCollection * multiplier),
      actualCollectionYTD: Math.floor(d.actualCollectionYTD * multiplier),
      actualTarget: Math.floor(d.actualTarget * multiplier)
    }));
  }, [selectedBranches, timePeriod]);

  const gmvNetRevenueData = useMemo(() => {
    const multiplier = selectedBranches.length === 0 ? 1 : (selectedBranches.length / branchOptions.length) * 0.8 + 0.2;
    let base = baseGmvNetRevenueData;
    
    if (timePeriod === "week") {
      base = [
        { name: "Tuần 1", gmv: 850, netRev: 720 },
        { name: "Tuần 2", gmv: 920, netRev: 780 },
        { name: "Tuần 3", gmv: 1100, netRev: 950 },
        { name: "Tuần 4", gmv: 1250, netRev: 1100 },
      ];
    } else if (timePeriod === "month") {
      base = [
        { name: "T1", gmv: 3200, netRev: 2800 },
        { name: "T2", gmv: 3500, netRev: 3100 },
        { name: "T3", gmv: 3800, netRev: 3400 },
        { name: "T4", gmv: 4200, netRev: 3800 },
        { name: "T5", gmv: 4800, netRev: 4300 },
        { name: "T6", gmv: 5100, netRev: 4600 },
        { name: "T7", gmv: 5500, netRev: 5000 },
      ];
    } else if (timePeriod === "quarter") {
      base = [
        { name: "Q1", gmv: 10500, netRev: 9300 },
        { name: "Q2", gmv: 14100, netRev: 12700 },
        { name: "Q3", gmv: 5500, netRev: 5000 },
      ];
    }

    return base.map(d => {
      const variation1 = 1 + (Math.random() * 0.1 - 0.05);
      const variation2 = 1 + (Math.random() * 0.1 - 0.05);
      return {
        ...d,
        gmv: Math.floor(d.gmv * multiplier * variation1),
        netRev: Math.floor(d.netRev * multiplier * variation2),
      };
    });
  }, [selectedBranches, timePeriod]);

  const gmvBreakdownData = useMemo(() => {
    const multiplier = selectedBranches.length === 0 ? 1 : (selectedBranches.length / branchOptions.length) * 0.8 + 0.2;
    let base = baseGmvBreakdownData;
    
    if (timePeriod === "week") {
      base = [
        { name: "Tuần 1", directOrder: 350, preOrder: 400 },
        { name: "Tuần 2", directOrder: 380, preOrder: 440 },
        { name: "Tuần 3", directOrder: 450, preOrder: 550 },
        { name: "Tuần 4", directOrder: 550, preOrder: 630 },
      ];
    } else if (timePeriod === "month") {
      base = [
        { name: "T1", directOrder: 1500, preOrder: 1700 },
        { name: "T2", directOrder: 1600, preOrder: 1900 },
        { name: "T3", directOrder: 1800, preOrder: 2000 },
        { name: "T4", directOrder: 2000, preOrder: 2200 },
        { name: "T5", directOrder: 2200, preOrder: 2600 },
        { name: "T6", directOrder: 2400, preOrder: 2700 },
        { name: "T7", directOrder: 2600, preOrder: 2900 },
      ];
    } else if (timePeriod === "quarter") {
      base = [
        { name: "Q1", directOrder: 4900, preOrder: 5600 },
        { name: "Q2", directOrder: 6600, preOrder: 7500 },
        { name: "Q3", directOrder: 2600, preOrder: 2900 },
      ];
    }

    return base.map(d => {
      return {
        ...d,
        directOrder: Math.floor(d.directOrder * multiplier * (1 + (Math.random() * 0.15 - 0.05))), 
        preOrder: Math.floor(d.preOrder * multiplier * (1 + (Math.random() * 0.15 - 0.05))),
      };
    });
  }, [selectedBranches, timePeriod]);

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

      <FinancialOverviewCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GMVNetRevenueChart />
        <RevenueWaterfallChart />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <GMVBreakdownChart />
        
      </div>

      <RevenueTrendChart />

      <TopPerformanceTable />
      <BranchRevenueComparison />
      <GrowthAnalysisChart />
    </div>
  );
};
