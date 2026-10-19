import { invalidate, mutated } from "@/lib/cache";
import { supabase, unwrap } from "@/lib/db";
import { fieldRow, productRow } from "@/lib/mappers";
import { executeImport } from "@/lib/logic/import";
import { getBranches, getCategories, getVendors } from "@/features/reference";
import type { ImportRequest, ImportResult } from "@/types/import";
import type { Product } from "@/types/product";

// commit=false: sirf check (kuch save nahi). commit=true: sahi rows save, galat rows chhod do.
export async function runImport(req: ImportRequest): Promise<ImportResult> {
  invalidate("categories", "branches", "vendors");
  const [categories, branches, vendors, keys] = await Promise.all([
    getCategories(),
    getBranches(),
    getVendors(),
    supabase.rpc("product_keys"),
  ]);
  const existing = ((unwrap(keys) ?? []) as { sku: string; imei: string | null }[]).map(
    (k) => ({ id: `existing:${k.sku}`, sku: k.sku, imei: k.imei }) as Pick<Product, "id" | "sku" | "imei">
  );

  const { result, work, newProducts } = executeImport(req, { categories, branches, vendors, products: existing });
  if (!req.commit || result.valid === 0) return result;

  // Kya naya bana: categories, unke columns, products
  const oldCatIds = new Set(categories.map((c) => c.id));
  const oldFieldIds = new Set(categories.flatMap((c) => c.fields.map((f) => f.id)));
  const newCats = work.categories.filter((c) => !oldCatIds.has(c.id));
  const newFields = work.categories.flatMap((c) =>
    c.fields.map((f, i) => ({ f, cid: c.id, pos: i + 1 })).filter((x) => !oldFieldIds.has(x.f.id))
  );

  unwrap(
    await supabase.rpc("commit_import", {
      p_categories: newCats.map((c) => ({ id: c.id, name: c.name, description: c.description })),
      p_fields: newFields.map((x) => fieldRow(x.f, x.cid, x.pos)),
      p_products: newProducts.map(productRow),
    })
  );
  mutated();

  result.created = result.valid;
  for (const c of result.categories) {
    if (c.id === null) c.id = work.categories.find((x) => x.name === c.name)?.id ?? null;
  }
  return result;
}