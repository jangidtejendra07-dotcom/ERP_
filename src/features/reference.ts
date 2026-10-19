import { cached } from "@/lib/cache";
import { supabase, unwrap } from "@/lib/db";
import { toBranch, toCategory } from "@/lib/mappers";
import type { Branch } from "@/types/branch";
import type { Category } from "@/types/category";
import type { Vendor } from "@/types/vendor";

// Chhoti "reference" lists jo har page ko chahiye. 30 sec cache, badalne par invalidate() hota hai.

export const getCategories = (): Promise<Category[]> =>
  cached("categories", async () => {
    const [cats, fields] = await Promise.all([
      supabase.from("categories").select("*").order("name"),
      supabase.from("category_fields").select("*").order("position"),
    ]);
    const f = unwrap(fields) ?? [];
    return (unwrap(cats) ?? []).map((c) => toCategory(c, f));
  });

export const getBranches = (): Promise<Branch[]> =>
  cached("branches", async () => {
    const rows = unwrap(await supabase.from("branches").select("*").order("created_at"));
    return (rows ?? []).map(toBranch);
  });

export const getVendors = (): Promise<Vendor[]> =>
  cached("vendors", async () => {
    const rows = unwrap(await supabase.from("vendors").select("id,name").order("name"));
    return (rows ?? []) as Vendor[];
  });