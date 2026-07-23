import React from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MinusIcon,
  BarChart3,
  Percent,
  ShoppingBasket,
  CircleDollarSign,
  Receipt,
  RefreshCw,
  Star,
  UserCheck,
  Package,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { MetricData } from "../types";
import { cn } from "../lib/utils";

interface MetricCardProps {
  data: MetricData;
}

const getIcon = (type?: string) => {
  switch (type) {
    case "chart":
      return <BarChart3 className="w-5 h-5" />;
    case "percent":
      return <Percent className="w-5 h-5" />;
    case "basket":
      return <ShoppingBasket className="w-5 h-5" />;
    case "money":
      return <CircleDollarSign className="w-5 h-5" />;
    case "receipt":
      return <Receipt className="w-5 h-5" />;
    case "refresh":
      return <RefreshCw className="w-5 h-5" />;
    case "star":
      return <Star className="w-5 h-5" />;
    case "user":
      return <UserCheck className="w-5 h-5" />;
    case "package":
      return <Package className="w-5 h-5" />;
    case "calendar":
      return <CalendarDays className="w-5 h-5" />;
    case "trash":
      return <Trash2 className="w-5 h-5" />;
    default:
      return null;
  }
};

const getIconBgColor = (type?: string) => {
  switch (type) {
    case "chart":
      return "bg-emerald-100 text-emerald-600";
    case "percent":
      return "bg-rose-100 text-rose-600";
    case "basket":
      return "bg-indigo-100 text-indigo-600";
    case "money":
      return "bg-amber-100 text-amber-600";
    case "receipt":
      return "bg-blue-100 text-blue-600";
    case "refresh":
      return "bg-teal-100 text-teal-600";
    case "star":
      return "bg-amber-100 text-amber-600";
    case "user":
      return "bg-emerald-100 text-emerald-600";
    case "calendar":
      return "bg-sky-100 text-sky-600";
    case "trash":
      return "bg-rose-100 text-rose-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  let { value, trend, trendValue, trendLabel, previousValue } = data;
  let isBadTrend = false;
  let isPositive = false;
  let isNeutral = false;

  if (
    data.currentValueNumber !== undefined &&
    data.previousValueNumber !== undefined
  ) {
    const current = data.currentValueNumber;
    const prev = data.previousValueNumber;
    const diff = current - prev;
    const percentChange = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;

    const formatNumber = (num: number) => {
      const locale = "vi-VN";
      if (data.formatType === "percent") return `${num.toFixed(1)}%`;
      if (data.formatType === "compact")
        return new Intl.NumberFormat(locale, {
          notation: "compact",
          compactDisplay: "short",
          maximumFractionDigits: 1,
          ...data.formatOptions,
        }).format(num);
      return new Intl.NumberFormat(locale, {
        maximumFractionDigits: 1,
        ...data.formatOptions,
      }).format(num);
    };

    value = value || formatNumber(current);
    previousValue = previousValue || formatNumber(prev);

    if (diff > 0) trend = "up";
    else if (diff < 0) trend = "down";
    else trend = "neutral";

    if (trend === "neutral") {
      trendValue = trendValue || "0%";
    } else {
      trendValue =
        trendValue || `${diff > 0 ? "+" : ""}${percentChange.toFixed(1)}%`;
    }

    trendLabel = trendLabel || "so với kỳ trước";
    isPositive = trend === "up";
    isNeutral = trend === "neutral";

    if (data.isInverse) {
      isBadTrend = trend === "up";
    } else {
      isBadTrend = trend === "down";
    }
  } else {
    isPositive = trend === "up";
    isNeutral = trend === "neutral";

    if (data.isInverse !== undefined) {
      isBadTrend = data.isInverse ? trend === "up" : trend === "down";
    } else {
      isBadTrend =
        (data.title === "REMAKE RATE" && trend === "up") ||
        (!isPositive && !isNeutral && data.title !== "REMAKE RATE");
    }
  }

  const trendColor = isNeutral
    ? "text-gray-500"
    : isBadTrend
      ? "text-rose-500"
      : "text-emerald-500";

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          {data.title}
        </h3>
        <div className={cn("p-2 rounded-lg", getIconBgColor(data.iconType))}>
          {getIcon(data.iconType)}
        </div>
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
        {data.unit && (
          <span className="text-sm font-semibold text-slate-500">
            {data.unit}
          </span>
        )}
      </div>

      {data.subValue && (
        <div className="text-sm text-slate-500 mt-1 font-medium">
          {data.subValue}
        </div>
      )}

      <div className="flex items-center gap-1 mt-2 text-sm">
        <span className={cn("flex items-center font-semibold", trendColor)}>
          {isPositive && <ArrowUpIcon className="w-3 h-3 mr-1" />}
          {trend === "down" && <ArrowDownIcon className="w-3 h-3 mr-1" />}
          {isNeutral && <MinusIcon className="w-3 h-3 mr-1" />}
          {trendValue}
        </span>
        <span className="text-slate-400">{trendLabel}</span>
      </div>

      {data.sparklineData && data.sparklineData.length > 0 && (
        <div className="h-12 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.sparklineData}>
              <YAxis domain={["dataMin", "dataMax"]} hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke={isBadTrend ? "#f43f5e" : "#10b981"}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="flex justify-between items-center mt-auto pt-4 text-xs font-medium text-slate-500 border-t border-slate-50">
        <span>01/07 — 31/07/2026</span>
        <div className="flex flex-col items-end">
          <span className="text-slate-400 font-normal text-[10px] mb-0.5">
            31/05 — 30/06/2026
          </span>
          <span className="text-slate-700">{previousValue}</span>
        </div>
      </div>
    </div>
  );
};
