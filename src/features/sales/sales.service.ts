import { cached, mutated, stable } from "@/lib/cache";
import { supabase, unwrap, fetchAll, type Row } from "@/lib/db";
import { toSale } from "@/lib/mappers";
import type { NewSaleInput, Sale, SalesFilter, SalesSummary } from "@/types/sale";

const DAY = 86_400_000;

// "yyyy-mm-dd" ke us din ka local midnight (UTC instant). tz = browser ka getTimezoneOffset() (India = -330)
function localMidnight(day: string, tz: number): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d) + tz * 60_000;
}

export const salesSummaryKey = (f: SalesFilter) => `sales-summary:${stable(f)}`;

export function fetchSalesSummary(f: SalesFilter): Promise<SalesSummary> {
  return cached(salesSummaryKey(f), () => loadSummary(f));
}

async function loadSummary(f: SalesFilter): Promise<SalesSummary> {
  const data = unwrap(
    await supabase.rpc("sales_summary", {
      p_type: f.type && f.type !== "all" ? f.type : null,
      p_vendor: f.vendorId || null,
      p_from: f.from || null,
      p_to: f.to || null,
      p_tz: new Date().getTimezoneOffset(), // "aaj" user ke timezone se nikalne ke liye
    })
  );
  return data as SalesSummary;
}

export function fetchSales(f: SalesFilter): Promise<Sale[]> {
  return cached(`sales:${stable(f)}`, () => loadSales(f));
}

async function loadSales(f: SalesFilter): Promise<Sale[]> {
  const tz = new Date().getTimezoneOffset();
  const rows = await fetchAll<Row>((from, to) => {
    let q = supabase.from("sales").select("*").order("created_at", { ascending: false }).range(from, to);
    if (f.type && f.type !== "all") q = q.eq("type", f.type);
    if (f.vendorId) q = q.eq("vendor_id", f.vendorId);
    if (f.from) q = q.gte("created_at", new Date(localMidnight(f.from, tz)).toISOString());
    if (f.to) q = q.lt("created_at", new Date(localMidnight(f.to, tz) + DAY).toISOString());
    return q;
  });
  return rows.map(toSale);
}

// Ek ya kai products bechna. Alag branch/type ka maal apne-aap alag sales me bat jata hai.
export async function createSales(input: Omit<NewSaleInput, "split">): Promise<Sale[]> {
  const rows = unwrap(
    await supabase.rpc("create_sales", {
      p_items: input.items,
      p_customer: input.customerName ?? null,
      p_sold_at: input.soldAt ?? null,
      p_split: true,
    })
  ) as Row[];
  mutated();
  return rows.map(toSale);
}