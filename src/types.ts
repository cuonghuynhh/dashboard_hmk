export type Trend = "up" | "down" | "neutral";

export interface MetricData {
  title: string;
  value?: string;
  unit?: string;
  subValue?: string; // Added for VAT / No VAT breakdown
  trend?: Trend;
  trendValue?: string;
  trendLabel?: string;
  sparklineData?: { value: number }[];
  previousValue?: string;

  // For dynamic calculation
  currentValueNumber?: number;
  currentValueNumberNoVat?: number;
  previousValueNumber?: number;
  previousValueNumberNoVat?: number;
  isInverse?: boolean; // if true, higher is worse (e.g. Remake Rate)
  formatType?: "currency" | "number" | "percent" | "compact";
  formatOptions?: Intl.NumberFormatOptions;

  color?: string;
  iconType?:
    | "chart"
    | "percent"
    | "basket"
    | "money"
    | "receipt"
    | "refresh"
    | "star"
    | "user"
    | "package"
    | "calendar"
    | "trash";
}

export interface BranchPerformance {
  id: string;
  name: string;
  revenue: number;
  target?: number; // target revenue
  targetPercent?: number; // optionally pre-calculated
  previousRevenue?: number; // for growth calculation
  growth?: number; // optionally pre-calculated
  gpm: number;
  upt: number;
  atv: number;
  remakeRate: number;
  returnRate: number;
}

export interface ProductData {
  id: string;
  name: string;
  quantity: number;
  supplier?: string;
  power?: string;
  color?: string;
}
