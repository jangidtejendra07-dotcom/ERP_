import { cached, mutated, patch, stable } from "@/lib/cache";
import { supabase, unwrap, deleteById } from "@/lib/db";
import { productRow, toProduct } from "@/lib/mappers";
import { NotFoundError } from "@/lib/logic/errors";
import { matchesCustom, randomCode, statusOf, validate } from "@/lib/logic/products";
import { getBranches, getCategories, getVendors } from "@/features/reference";
import type { Branch } from "@/types/branch";
import type { Category } from "@/types/category";
import type { Product, ProductFilter, ProductInput, ProductStats, ProductView } from "@/types/product";
import type { Vendor } from "@/types/vendor";

export type ProductList = {
  products: ProductView[];
  stats: ProductStats;
  categories: Category[];
  branches: Branch[];
};

function toView(p: Product, cats: Category[], branches: Branch[], vendors: Vendor[]): ProductView {
  return {
    ...p,
    category: cats.find((c) => c.id === p.categoryId)?.name ?? "Unknown",
    branchName: branches.find((b) => b.id === p.branchId)?.name ?? null,
    vendorName: p.vendorId ? (vendors.find((v) => v.id === p.vendorId)?.name ?? null) : null,
    status: statusOf(p),
  };
}

export const productsKey = (f: ProductFilter = {}) => `products:${stable(f)}`;

export function fetchProducts(f: ProductFilter = {}): Promise<ProductList> {
  return cached(productsKey(f), () => loadProducts(f));
}

async function loadProducts(f: ProductFilter): Promise<ProductList> {
  const refs = Promise.all([getCategories(), getBranches(), getVendors()]);
  const needle0 = (f.q ?? "").trim();
  // search me category ka naam bhi dekhna hota hai, tabhi pehle categories chahiye; warna sab ek saath
  const categories0 = needle0 ? (await refs)[0] : [];

  let q = supabase.from("products").select("*").order("received_at", { ascending: false }).order("created_at", { ascending: false }).limit(1000);
  if (f.type && f.type !== "all") q = q.eq("type", f.type);
  if (f.status && f.status !== "all") q = q.eq("status", f.status);
  if (f.categoryId) q = q.eq("category_id", f.categoryId);
  if (f.branchId) q = q.eq("branch_id", f.branchId);
  if (f.vendorId) q = q.eq("vendor_id", f.vendorId);
  if (f.receivedFrom) q = q.gte("received_at", f.receivedFrom);
  if (f.receivedTo) q = q.lte("received_at", f.receivedTo);

  const needle = (f.q ?? "").trim().replace(/[,()%*\\]/g, " ").trim();
  if (needle) {
    const catIds = categories0.filter((c) => c.name.toLowerCase().includes(needle.toLowerCase())).map((c) => c.id);
    const parts = [`name.ilike.%${needle}%`, `sku.ilike.%${needle}%`, `imei.ilike.%${needle}%`];
    if (catIds.length) parts.push(`category_id.in.(${catIds.join(",")})`);
    q = q.or(parts.join(","));
  }

  const [rows, statsRow, [categories, branches, vendors]] = await Promise.all([q, supabase.from("product_stats").select("*").single(), refs]);
  let products = (unwrap(rows) ?? []).map(toProduct);

  const custom = f.custom ?? {};
  if (f.categoryId && Object.values(custom).some(Boolean)) {
    const fields = categories.find((c) => c.id === f.categoryId)?.fields ?? [];
    products = products.filter((p) => matchesCustom(p, fields, custom));
  }

  const s = unwrap(statsRow);
  return {
    products: products.map((p) => toView(p, categories, branches, vendors)),
    stats: {
      total: s.total,
      internal: s.internal,
      external: s.external,
      lowStock: s.low_stock,
      outOfStock: s.out_of_stock,
      stockValue: Number(s.stock_value),
    },
    categories,
    branches,
  };
}

async function getRow(id: string): Promise<Product> {
  const row = unwrap(await supabase.from("products").select("*").eq("id", id).maybeSingle());
  if (!row) throw new NotFoundError("Product not found");
  return toProduct(row);
}

export function fetchProduct(id: string): Promise<ProductView> {
  return cached(`product:${id}`, async () => {
    const [p, cats, branches, vendors] = await Promise.all([getRow(id), getCategories(), getBranches(), getVendors()]);
    return toView(p, cats, branches, vendors);
  });
}

export async function createProduct(input: ProductInput): Promise<ProductView> {
  const [categories, branches, vendors] = await Promise.all([getCategories(), getBranches(), getVendors()]);
  const clean = validate(input, { categories, branches, vendors, products: [] });
  const id = `PRD-${randomCode(8)}`;
  const row = unwrap(await supabase.from("products").insert(productRow({ id, ...clean })).select("*").single());
  const view = toView(toProduct(row), categories, branches, vendors);
  // List me turant dikhao (bina filter wali list me sabse upar), phir piche se asli data aa jayega
  patch<ProductList>(productsKey({}), (l, key) =>
    key === productsKey({}) ? { ...l, products: [view, ...l.products], stats: { ...l.stats, total: l.stats.total + 1 } } : l
  );
  mutated();
  return view;
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductView> {
  const [existing, categories, branches, vendors] = await Promise.all([getRow(id), getCategories(), getBranches(), getVendors()]);
  const clean = validate(input, { categories, branches, vendors, products: [] }, existing);
  const row = unwrap(await supabase.from("products").update(productRow({ id, ...clean })).eq("id", id).select("*").single());
  const view = toView(toProduct(row), categories, branches, vendors);
  patch<ProductList>("products:", (l) => ({ ...l, products: l.products.map((p) => (p.id === id ? view : p)) }));
  mutated();
  return view;
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteById("products", id, "Product");
  patch<ProductList>("products:", (l) => ({ ...l, products: l.products.filter((p) => p.id !== id) }));
  mutated();
}