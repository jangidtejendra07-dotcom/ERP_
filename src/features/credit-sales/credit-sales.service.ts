import { cached, mutated } from "@/lib/cache";
import { supabase, unwrap, fetchAll, type Row } from "@/lib/db";
import { toCredit } from "@/lib/mappers";
import { NotFoundError } from "@/lib/logic/errors";
import { computeStats, toView } from "@/lib/logic/credits";
import type {
  CreditStats,
  CreditStatusFilter,
  CreditView,
  NewCreditInput,
  NewPaymentInput,
} from "@/types/credit";

const SELECT = "*, credit_payments(*)";

export const CREDITS_KEY = "credits:all";

// Saari credits ek baar cache me; status/search browser me hi filter hota hai (isliye filter badalna turant hota hai)
export function fetchAllCredits(): Promise<Row[]> {
  return cached(CREDITS_KEY, () =>
    fetchAll<Row>((from, to) => supabase.from("credits").select(SELECT).order("created_at", { ascending: false }).range(from, to))
  );
}

export async function fetchCredits(
  status: CreditStatusFilter,
  q: string
): Promise<{ credits: CreditView[]; stats: CreditStats }> {
  return selectCredits(await fetchAllCredits(), status, q);
}

export function selectCredits(
  rows: Row[],
  status: CreditStatusFilter,
  q: string
): { credits: CreditView[]; stats: CreditStats } {
  const all = rows.map((r) => toView(toCredit(r)));
  const needle = q.trim().toLowerCase();
  const credits = all.filter((c) => {
    if (status !== "all" && c.status !== status) return false;
    if (!needle) return true;
    return (
      c.id.toLowerCase().includes(needle) ||
      c.customerName.toLowerCase().includes(needle) ||
      c.phone.toLowerCase().includes(needle)
    );
  });
  return { credits, stats: computeStats(all) };
}

export function fetchCredit(id: string): Promise<CreditView> {
  return cached(`credit:${id}`, async () => {
    const row = unwrap(await supabase.from("credits").select(SELECT).eq("id", id).maybeSingle());
    if (!row) throw new NotFoundError("Credit not found");
    return toView(toCredit(row));
  });
}

export async function createCredit(input: NewCreditInput): Promise<CreditView> {
  const id = unwrap(
    await supabase.rpc("create_credit", {
      p_customer: input.customerName,
      p_phone: input.phone,
      p_total: input.total ?? null,
      p_items: input.items && input.items.length ? input.items : null,
      p_down: input.downPayment ?? 0,
      p_due: input.dueDate || null,
      p_method: input.method ?? "cash",
    })
  ) as string;
  mutated();
  return fetchCredit(id);
}

export async function addCreditPayment(id: string, input: NewPaymentInput): Promise<CreditView> {
  unwrap(await supabase.rpc("add_credit_payment", { p_id: id, p_amount: input.amount, p_method: input.method }));
  mutated();
  return fetchCredit(id);
}

export async function writeOffCredit(id: string): Promise<CreditView> {
  unwrap(await supabase.rpc("write_off_credit", { p_id: id }));
  mutated();
  return fetchCredit(id);
}