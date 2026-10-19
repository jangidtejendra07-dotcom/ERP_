import { cached } from "@/lib/cache";
import { supabase, unwrap } from "@/lib/db";
import type { DashboardStats } from "@/types/dashboard";

export type { DashboardStats };

export const DASHBOARD_KEY = "dashboard";

export function getDashboardStats(): Promise<DashboardStats> {
  return cached(DASHBOARD_KEY, load);
}

async function load(): Promise<DashboardStats> {
  const r = unwrap(await supabase.from("dashboard_stats").select("*").single());
  const revenue = Number(r.revenue);
  const cogs = Number(r.cogs);
  const profit = Math.round((revenue - cogs) * 100) / 100;
  return {
    totalSales: r.total_sales,
    revenue,
    totalProducts: r.total_products,
    internalProducts: r.internal_products,
    externalProducts: r.external_products,
    vendors: r.vendors,
    lowStock: r.low_stock,
    outOfStock: r.out_of_stock,
    cogs,
    profit,
    margin: revenue ? Math.round((profit / revenue) * 1000) / 10 : 0,
    stockValue: Number(r.stock_value),
  };
}