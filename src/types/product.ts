import type { CustomValue } from "./category";

export type ProductType = "internal" | "external"; // external = consignment (vendor ka maal)
export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "In Stock",
  low_stock: "Low Stock",
  out_of_stock: "Out of Stock",
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  imei: string | null;
  categoryId: string;
  branchId: string; // ye product kis branch me rakha hai
  type: ProductType;
  vendorId: string | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  receivedAt: string; // maal kis din aaya (yyyy-mm-dd)
  custom: Record<string, CustomValue>; // category ke custom columns ki values (key -> value)
  createdAt: string;
  updatedAt: string;
};

export type ProductView = Product & {
  category: string; // category ka naam
  branchName: string | null;
  vendorName: string | null;
  status: StockStatus;
};

export type ProductInput = {
  name: string;
  sku?: string;
  imei?: string | null;
  categoryId: string;
  branchId: string;
  type: ProductType;
  vendorId?: string | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  receivedAt?: string; // khali ho to aaj ki date
  custom?: Record<string, CustomValue>;
};

export type ProductFilter = {
  q?: string;
  type?: ProductType | "all";
  status?: StockStatus | "all";
  categoryId?: string;
  branchId?: string;
  vendorId?: string;
  receivedFrom?: string; // yyyy-mm-dd, is din ya iske baad aaya maal
  receivedTo?: string; // yyyy-mm-dd, is din tak aaya maal
  custom?: Record<string, string>; // custom field key -> filter value (sirf category chuni ho tab)
};

export type ProductStats = {
  total: number;
  internal: number;
  external: number;
  lowStock: number;
  outOfStock: number;
  stockValue: number; // sirf internal (apna) stock ki cost value
};