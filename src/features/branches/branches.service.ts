import { cached, invalidate, mutated } from "@/lib/cache";
import { supabase, unwrap, deleteById } from "@/lib/db";
import { toBranch } from "@/lib/mappers";
import { cleanBranch } from "@/lib/logic/branches";
import { NotFoundError } from "@/lib/logic/errors";
import { ValidationError } from "@/lib/logic/errors";
import { getBranches } from "@/features/reference";
import type { Branch, BranchInput, BranchStats, BranchView } from "@/types/branch";

export type BranchList = { branches: BranchView[]; stats: BranchStats };

const cents = (n: number) => Math.round(n * 100);

// Hamesha taaza (counts ke saath) - Branches page ke liye
export const BRANCHES_KEY = "branches:view";

export function fetchBranches(): Promise<BranchList> {
  return cached(BRANCHES_KEY, loadBranches);
}

async function loadBranches(): Promise<BranchList> {
  const rows = unwrap(await supabase.from("branch_view").select("*").order("created_at")) ?? [];
  const branches: BranchView[] = rows.map((r) => ({
    ...toBranch(r),
    productCount: r.product_count,
    units: r.units,
    stockValue: Number(r.stock_value),
    lowStock: r.low_stock,
    outOfStock: r.out_of_stock,
    salesCount: r.sales_count,
    revenue: Number(r.revenue),
  }));
  return {
    branches,
    stats: {
      total: branches.length,
      active: branches.filter((b) => b.isActive).length,
      products: branches.reduce((s, b) => s + b.productCount, 0),
      units: branches.reduce((s, b) => s + b.units, 0),
      stockValue: branches.reduce((s, b) => s + cents(b.stockValue), 0) / 100,
    },
  };
}

// Halki list (form / import ke dropdown ke liye, cache se)
export const fetchBranchOptions = (): Promise<Branch[]> => getBranches();

export async function createBranch(input: BranchInput): Promise<Branch> {
  const all = await getBranches();
  const row = {
    id: `br-${crypto.randomUUID().slice(0, 8)}`,
    ...cleanBranch(input, all),
    is_active: input.isActive ?? true,
  };
  const saved = unwrap(await supabase.from("branches").insert(row).select("*").single());
  mutated();
  return toBranch(saved);
}

export async function updateBranch(id: string, input: BranchInput): Promise<Branch> {
  invalidate("branches");
  const all = await getBranches();
  const current = all.find((b) => b.id === id);
  if (!current) throw new NotFoundError("Branch not found");

  const isActive = input.isActive ?? current.isActive;
  if (!isActive && all.filter((b) => b.isActive && b.id !== id).length === 0) {
    throw new ValidationError("At least one branch must stay active");
  }
  const { name, code, address, phone, manager } = cleanBranch(input, all, id);
  const saved = unwrap(
    await supabase.from("branches").update({ name, code, address, phone, manager, is_active: isActive }).eq("id", id).select("*").single()
  );
  mutated();
  return toBranch(saved);
}

export async function deleteBranch(id: string): Promise<void> {
  invalidate("branches");
  const all = await getBranches();
  const branch = all.find((b) => b.id === id);
  if (!branch) throw new NotFoundError("Branch not found");
  if (all.length === 1) throw new ValidationError("You need at least one branch");

  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("branch_id", id);
  if (count && count > 0) {
    throw new ValidationError(
      `"${branch.name}" still holds ${count} product${count > 1 ? "s" : ""}. Move them to another branch first, or deactivate this branch instead.`
    );
  }
  await deleteById("branches", id, "Branch");
  mutated();
}