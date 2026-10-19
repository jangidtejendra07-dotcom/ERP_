import type { FieldType } from "./category";
import type { ProductType } from "./product";

export type ImportCell = string | number | boolean | null;

export type SystemTarget =
  | "category"
  | "name"
  | "sku"
  | "imei"
  | "costPrice"
  | "sellingPrice"
  | "quantity"
  | "lowStockThreshold"
  | "receivedAt";

export const SYSTEM_TARGET_LABEL: Record<SystemTarget, string> = {
  category: "Category (har row ki apni)",
  name: "Product name *",
  sku: "SKU",
  imei: "IMEI / Serial",
  costPrice: "Cost price (₹)",
  sellingPrice: "Selling price (₹)",
  quantity: "Quantity (opening stock)",
  lowStockThreshold: "Low-stock alert at",
  receivedAt: "Maal aane ki date",
};

// Excel ke ek column ka kya karna hai
export type ColumnMap =
  | { column: string; target: "skip" }
  | { column: string; target: "system"; field: SystemTarget }
  | { column: string; target: "field"; fieldId: string } // category ka maujooda column
  | { column: string; target: "new"; label: string; type: FieldType | "auto" }; // naya column banao

export type ImportRow = { row: number; cells: Record<string, ImportCell> };

export type ImportRequest = {
  rows: ImportRow[];
  mapping: ColumnMap[];
  categoryId?: string;
  newCategoryName?: string;
  branchId: string;
  type: ProductType;
  vendorId?: string | null;
  commit: boolean;
};

export type ImportRowResult = {
  row: number;
  name: string;
  category: string;
  ok: boolean;
  errors: string[];
};

export type ImportNewField = { column: string; label: string; type: FieldType; options: string[] };

// Har category ka alag hisaab (Excel me Category column ho to kai categories ho sakti hain)
export type ImportCategoryResult = {
  id: string | null; // nayi category ho to save hone tak null
  name: string;
  isNew: boolean;
  total: number;
  valid: number;
  newFields: ImportNewField[]; // is category me jo naye columns banenge
};

export type ImportResult = {
  total: number;
  valid: number;
  invalid: number;
  created: number; // commit par kitne product bane
  branchName: string;
  categories: ImportCategoryResult[];
  results: ImportRowResult[]; // saari rows ka result
};