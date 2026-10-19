import type { PostgrestError } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Supabase ke row ka shape (snake_case). Mapping neeche ke mappers me hoti hai.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

function friendly(e: PostgrestError): string {
  const m = e.message ?? "Request failed";
  if (e.code === "23505") {
    if (m.includes("products_sku_uq")) return "This SKU already exists, use a different SKU";
    if (m.includes("products_imei_uq")) return "This IMEI/serial already exists on another product";
    if (m.includes("branches_name_uq")) return "A branch with this name already exists";
    if (m.includes("branches_code_uq")) return "This branch code is already used";
    if (m.includes("categories_name_uq")) return "A category with this name already exists";
    if (m.includes("category_fields")) return "A column with this name already exists";
    if (m.includes("vendors_name_uq")) return "A vendor with this name already exists";
    return "Ye record pehle se maujood hai";
  }
  if (e.code === "23503") return "Ye record kisi aur data se juda hai, pehle wo hatao";
  if (e.code === "42501" || /row-level security|permission denied/i.test(m)) {
    return "Is kaam ki permission nahi hai (login karo, ya delete sirf admin kar sakta hai)";
  }
  if (/JWT|expired/i.test(m)) return "Session khatam ho gaya, dobara login karo";
  if (/Failed to fetch|NetworkError/i.test(m)) return "Internet / Supabase se connection nahi ho paya";
  return m;
}

// Supabase ka jawab kholta hai; error ho to saaf message ke saath throw
export function unwrap<T>(res: { data: T; error: PostgrestError | null }): T {
  if (res.error) throw new Error(friendly(res.error));
  return res.data;
}

// Delete: RLS (non-admin) ho to Supabase error nahi deta, 0 rows delete hoti hain. Use pakadte hain.
export async function deleteById(table: string, id: string, what: string): Promise<void> {
  const rows = unwrap(await supabase.from(table).delete().eq("id", id).select("id"));
  if (!rows || rows.length === 0) {
    throw new Error(`${what} delete nahi hua. Ya wo mila nahi, ya aap admin nahi ho (delete sirf admin kar sakta hai).`);
  }
}

// Supabase ek baar me max 1000 rows deta hai; zyada ho to page-page karke le aate hain
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>): Promise<T[]> {
  const size = 1000;
  const out: T[] = [];
  for (let i = 0; i < 20; i++) {
    const rows = unwrap(await page(i * size, i * size + size - 1)) ?? [];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export { supabase };