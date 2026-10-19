import { cached, invalidate, mutated } from "@/lib/cache";
import { supabase, unwrap, deleteById, type Row } from "@/lib/db";
import { fieldRow, toCategoryView, toField } from "@/lib/mappers";
import { cleanCategory, cleanField, makeKey, MAX_FIELDS, rand } from "@/lib/logic/categories";
import { NotFoundError, ValidationError } from "@/lib/logic/errors";
import { getCategories } from "@/features/reference";
import type { CategoryField, CategoryInput, CategoryView, FieldInput } from "@/types/category";

// Hamesha taaza (product counts ke saath)
export const CATEGORIES_KEY = "categories:view";

export function fetchCategories(): Promise<CategoryView[]> {
  return cached(CATEGORIES_KEY, loadCategories);
}

async function loadCategories(): Promise<CategoryView[]> {
  const [cats, fields] = await Promise.all([
    supabase.from("category_view").select("*").order("name"),
    supabase.from("category_fields").select("*").order("position"),
  ]);
  const f = unwrap(fields) ?? [];
  return (unwrap(cats) ?? []).map((c) => toCategoryView(c, f));
}

export function fetchCategory(id: string): Promise<CategoryView> {
  return cached(`category:${id}`, () => loadCategory(id));
}

async function loadCategory(id: string): Promise<CategoryView> {
  const [cat, fields] = await Promise.all([
    supabase.from("category_view").select("*").eq("id", id).maybeSingle(),
    supabase.from("category_fields").select("*").eq("category_id", id).order("position"),
  ]);
  const row = unwrap(cat);
  if (!row) throw new NotFoundError("Category not found");
  return toCategoryView(row, unwrap(fields) ?? []);
}

export async function createCategory(input: CategoryInput): Promise<CategoryView> {
  invalidate("categories");
  const all = await getCategories();
  const id = `cat-${rand()}`;
  unwrap(await supabase.from("categories").insert({ id, ...cleanCategory(input, all) }).select("id").single());
  mutated();
  return fetchCategory(id);
}

export async function updateCategory(id: string, input: CategoryInput): Promise<CategoryView> {
  invalidate("categories");
  const all = await getCategories();
  if (!all.some((c) => c.id === id)) throw new NotFoundError("Category not found");
  unwrap(await supabase.from("categories").update(cleanCategory(input, all, id)).eq("id", id).select("id").single());
  mutated();
  return fetchCategory(id);
}

export async function deleteCategory(id: string): Promise<void> {
  invalidate("categories");
  const all = await getCategories();
  const cat = all.find((c) => c.id === id);
  if (!cat) throw new NotFoundError("Category not found");
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
  if (count && count > 0) {
    throw new ValidationError(`"${cat.name}" has ${count} product${count > 1 ? "s" : ""}. Move or delete them first.`);
  }
  await deleteById("categories", id, "Category");
  mutated();
}

// ---------- Custom columns ----------
async function currentFields(categoryId: string): Promise<{ fields: CategoryField[]; rows: Row[] }> {
  const [exists, fieldRows] = await Promise.all([
    supabase.from("categories").select("id").eq("id", categoryId).maybeSingle(),
    supabase.from("category_fields").select("*").eq("category_id", categoryId).order("position"),
  ]);
  if (!unwrap(exists)) throw new NotFoundError("Category not found");
  const rows = unwrap(fieldRows) ?? [];
  return { fields: rows.map(toField), rows };
}

export async function addField(categoryId: string, input: FieldInput): Promise<CategoryView> {
  const { fields, rows } = await currentFields(categoryId);
  if (fields.length >= MAX_FIELDS) throw new ValidationError(`Max ${MAX_FIELDS} columns per category`);
  const data = cleanField(input, fields, null);
  const field: CategoryField = {
    id: `fld-${rand()}`,
    key: makeKey(data.label, new Set(fields.map((f) => f.key))),
    ...data,
  };
  const position = rows.reduce((m, r) => Math.max(m, r.position), 0) + 1;
  unwrap(await supabase.from("category_fields").insert(fieldRow(field, categoryId, position)).select("id").single());
  mutated();
  return fetchCategory(categoryId);
}

export async function updateField(categoryId: string, fieldId: string, input: Partial<FieldInput>): Promise<CategoryView> {
  const { fields } = await currentFields(categoryId);
  const current = fields.find((f) => f.id === fieldId);
  if (!current) throw new NotFoundError("Column not found");

  // Type badalne se purana data kharab ho sakta hai, isliye type lock hai
  if (input.type && input.type !== current.type) {
    throw new ValidationError("Column type cannot be changed. Deactivate this column and add a new one.");
  }
  const merged: FieldInput = {
    label: current.label,
    type: current.type,
    required: current.required,
    options: current.options,
    showInTable: current.showInTable,
    showInFilter: current.showInFilter,
    isActive: current.isActive,
    ...input,
  };
  const d = cleanField(merged, fields, fieldId);
  unwrap(
    await supabase
      .from("category_fields")
      .update({
        label: d.label,
        required: d.required,
        options: d.options,
        show_in_table: d.showInTable,
        show_in_filter: d.showInFilter,
        is_active: d.isActive,
      })
      .eq("id", fieldId)
      .select("id")
      .single()
  );
  mutated();
  return fetchCategory(categoryId);
}

export async function reorderFields(categoryId: string, order: string[]): Promise<CategoryView> {
  const { fields } = await currentFields(categoryId);
  const same =
    order.length === fields.length && new Set(order).size === order.length && order.every((i) => fields.some((f) => f.id === i));
  if (!same) throw new ValidationError("order must list every column exactly once");
  unwrap(await supabase.rpc("reorder_category_fields", { p_category: categoryId, p_order: order }));
  mutated();
  return fetchCategory(categoryId);
}