import { mutated } from "@/lib/cache";
import { supabase, unwrap } from "@/lib/db";
import { getVendors } from "@/features/reference";
import type { Vendor } from "@/types/vendor";

export const fetchVendors = (): Promise<Vendor[]> => getVendors();

export async function createVendor(name: string): Promise<Vendor> {
  const clean = name.trim();
  if (!clean || clean.length > 80) throw new Error("Vendor ka naam likho (max 80 akshar)");
  const row = unwrap(await supabase.from("vendors").insert({ name: clean }).select("id,name").single());
  mutated();
  return row as Vendor;
}