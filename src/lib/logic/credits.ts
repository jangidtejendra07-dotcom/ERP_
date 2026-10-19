import type { Credit, CreditStats, CreditStatus, CreditView } from "@/types/credit";

// Paise/pesewa me calculate karte hain taaki 0.1 + 0.2 jaisi float galtiyan na hon.
export const toCents = (n: number) => Math.round(n * 100);

export function toView(c: Credit): CreditView {
  const paidCents = c.payments.reduce((s, p) => s + toCents(p.amount), 0);
  const totalCents = toCents(c.total);
  const balanceCents = Math.max(totalCents - paidCents, 0);

  let status: CreditStatus;
  if (c.writtenOff) status = "written_off";
  else if (balanceCents === 0) status = "paid";
  else if (c.dueDate && new Date(`${c.dueDate}T23:59:59.999`).getTime() < Date.now()) status = "overdue";
  else if (paidCents > 0) status = "partially_paid";
  else status = "active";

  return {
    ...c,
    paid: paidCents / 100,
    balance: balanceCents / 100,
    progress: totalCents ? Math.min(Math.round((paidCents / totalCents) * 100), 100) : 0,
    status,
  };
}

export function computeStats(all: CreditView[]): CreditStats {
  const open = all.filter((c) => c.status !== "paid" && c.status !== "written_off");
  return {
    activeCount: open.length,
    totalCount: all.length,
    outstanding: open.reduce((s, c) => s + toCents(c.balance), 0) / 100,
    totalAmount: all.reduce((s, c) => s + toCents(c.total), 0) / 100,
    collected: all.reduce((s, c) => s + toCents(c.paid), 0) / 100,
    overdueCount: all.filter((c) => c.status === "overdue").length,
  };
}