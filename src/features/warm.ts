import { getBranches, getCategories, getVendors } from "./reference";
import { fetchBranches } from "./branches/branches.service";
import { fetchCategories } from "./categories/categories.service";
import { getDashboardStats } from "./dashboard/dashboard.service";
import { fetchAllCredits } from "./credit-sales/credit-sales.service";
import { fetchProducts } from "./inventory/inventory.service";
import { fetchSalesSummary } from "./sales/sales.service";

// Login ke turant baad mukhya pages ka data piche se mangwa ke rakh lo, taaki page kholte hi dikh jaye.
export function warm() {
  const quiet = (p: Promise<unknown>) => p.catch(() => undefined);
  void quiet(getDashboardStats());
  void quiet(fetchProducts({}));
  void quiet(fetchCategories());
  void quiet(fetchBranches());
  void quiet(getCategories());
  void quiet(getBranches());
  void quiet(getVendors());
  void quiet(fetchSalesSummary({ type: "all" }));
  void quiet(fetchAllCredits());
}