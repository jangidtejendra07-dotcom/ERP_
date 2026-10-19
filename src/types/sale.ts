import type { SoldItem, StockLine } from "./stock";

export type SaleType = "internal" | "external";

export type Sale = {
  id: string;
  createdAt: string; // ISO date
  type: SaleType;
  vendorId: string | null;
  vendorName: string | null;
  customerName: string;
  itemsCount: number;
  total: number; // ₹
  cost: number; // COGS (₹)
  items?: SoldItem[]; // purani sales me nahi hoga
  branchId?: string | null; // kis branch se bika (purani sales me nahi hoga)
  branchName?: string | null;
};

export type SalesFilter = {
  type?: SaleType | "all";
  vendorId?: string;
  from?: string; // yyyy-mm-dd
  to?: string; // yyyy-mm-dd
  tz?: number; // browser ka getTimezoneOffset() (India = -330), taaki "aaj" sahi nikle
};

export type PeriodTotals = {
  revenue: number;
  count: number;
  items: number;
};

export type SalesSummary = {
  totalRevenue: number;
  previousPeriodRevenue: number;
  ordersToday: number;
  averageOrderValue: number;
  transactions: number;
  avgOrdersPerDay: number;
  today: PeriodTotals;
  week: PeriodTotals;
  month: PeriodTotals;
};

// Sale ab products se banti hai: total, cost, type aur vendor server khud nikalta hai.
export type NewSaleInput = {
  customerName?: string;
  items: StockLine[];
  soldAt?: string; // bikri ki date-time (ISO). Na do to abhi ka time
  split?: boolean; // true: alag branch/type/vendor ka maal apne-aap alag sales me bat jata hai
};