import type { Row } from "./db";
import type { Branch } from "@/types/branch";
import type { Category, CategoryField, CategoryView } from "@/types/category";
import type { Credit } from "@/types/credit";
import type { Product } from "@/types/product";
import type { Sale } from "@/types/sale";

// Database (snake_case) <-> app types (camelCase)

export const toProduct = (r: Row): Product => ({
  id: r.id,
  name: r.name,
  sku: r.sku,
  imei: r.imei ?? null,
  categoryId: r.category_id,
  branchId: r.branch_id,
  type: r.type,
  vendorId: r.vendor_id ?? null,
  costPrice: Number(r.cost_price),
  sellingPrice: Number(r.selling_price),
  quantity: r.quantity,
  lowStockThreshold: r.low_stock_threshold,
  receivedAt: r.received_at ?? String(r.created_at).slice(0, 10),
  custom: r.custom ?? {},
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const productRow = (p: Omit<Product, "createdAt" | "updatedAt"> | Product) => ({
  id: p.id,
  name: p.name,
  sku: p.sku,
  imei: p.imei,
  category_id: p.categoryId,
  branch_id: p.branchId,
  type: p.type,
  vendor_id: p.vendorId,
  cost_price: p.costPrice,
  selling_price: p.sellingPrice,
  quantity: p.quantity,
  low_stock_threshold: p.lowStockThreshold,
  received_at: p.receivedAt,
  custom: p.custom,
});

export const toBranch = (r: Row): Branch => ({
  id: r.id,
  name: r.name,
  code: r.code,
  address: r.address ?? "",
  phone: r.phone ?? "",
  manager: r.manager ?? "",
  isActive: r.is_active,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toField = (r: Row): CategoryField => ({
  id: r.id,
  key: r.key,
  label: r.label,
  type: r.type,
  required: r.required,
  options: Array.isArray(r.options) ? r.options : [],
  showInTable: r.show_in_table,
  showInFilter: r.show_in_filter,
  isActive: r.is_active,
});

export const fieldRow = (f: CategoryField, categoryId: string, position: number) => ({
  id: f.id,
  category_id: categoryId,
  key: f.key,
  label: f.label,
  type: f.type,
  required: f.required,
  options: f.options,
  show_in_table: f.showInTable,
  show_in_filter: f.showInFilter,
  is_active: f.isActive,
  position,
});

export const toCategory = (r: Row, fields: Row[]): Category => ({
  id: r.id,
  name: r.name,
  description: r.description ?? "",
  fields: fields.filter((f) => f.category_id === r.id).sort((a, b) => a.position - b.position).map(toField),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export const toCategoryView = (r: Row, fields: Row[]): CategoryView => ({
  ...toCategory(r, fields),
  productCount: r.product_count,
  units: r.units,
  lowStock: r.low_stock,
  outOfStock: r.out_of_stock,
});

export const toSale = (r: Row): Sale => ({
  id: r.id,
  createdAt: r.created_at,
  type: r.type,
  vendorId: r.vendor_id ?? null,
  vendorName: r.vendor_name ?? null,
  customerName: r.customer_name,
  itemsCount: r.items_count,
  total: Number(r.total),
  cost: Number(r.cost),
  items: r.items ?? undefined,
  branchId: r.branch_id ?? null,
  branchName: r.branch_name ?? null,
});

export const toCredit = (r: Row): Credit => ({
  id: r.id,
  customerName: r.customer_name,
  phone: r.phone,
  total: Number(r.total),
  dueDate: r.due_date ?? null,
  createdAt: r.created_at,
  writtenOff: r.written_off,
  writtenOffAt: r.written_off_at ?? null,
  payments: ((r.credit_payments ?? []) as Row[])
    .sort((a, b) => String(a.paid_at).localeCompare(String(b.paid_at)))
    .map((p) => ({ id: p.id, receiptNumber: p.receipt_number, amount: Number(p.amount), method: p.method, paidAt: p.paid_at })),
  ...(r.items ? { items: r.items } : {}),
});