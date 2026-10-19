"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import CreditStatusBadge from "@/components/credit-sales/CreditStatusBadge";
import { addCreditPayment, fetchCredit, writeOffCredit } from "@/features/credit-sales/credit-sales.service";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { CreditView, PaymentMethod } from "@/types/credit";

const inputClass =
  "rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

export default function CreditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const creditId = decodeURIComponent(id);

  const [credit, setCredit] = useState<CreditView | null>(null);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    fetchCredit(creditId).then(setCredit).catch((e: Error) => setError(e.message));
  }, [creditId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onPay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      setCredit(await addCreditPayment(creditId, { amount: Number(amount), method }));
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function onWriteOff() {
    if (!window.confirm("Write off the remaining balance? This cannot be undone.")) return;
    setError("");
    try {
      setCredit(await writeOffCredit(creditId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Write-off failed");
    }
  }

  const open = credit && credit.status !== "paid" && credit.status !== "written_off";

  return (
    <div className="space-y-6">
      <Link href="/credit-sales" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Back to Credit Sales
      </Link>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {!credit ? (
        !error && <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">{credit.id}</h1>
              <p className="text-sm text-slate-500">
                {credit.customerName} · {credit.phone} · Created {formatDate(credit.createdAt)}
                {credit.dueDate && ` · Due ${formatDate(credit.dueDate)}`}
              </p>
            </div>
            <CreditStatusBadge status={credit.status} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(credit.total)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Paid ({credit.progress}%)</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(credit.paid)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Balance</p>
              <p className="mt-1 text-2xl font-bold text-red-500">{formatCurrency(credit.balance)}</p>
            </div>
          </div>

          {open && (
            <form onSubmit={onPay} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="space-y-1">
                <label className="text-sm font-medium">Installment amount (GHS)</label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={credit.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputClass}>
                  <option value="cash">Cash</option>
                  <option value="momo">Mobile Money</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {busy ? "Saving..." : "Record Payment"}
              </button>
              <button
                type="button"
                onClick={onWriteOff}
                className="ml-auto rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Write Off
              </button>
            </form>
          )}
        {credit.items && credit.items.length > 0 && (
  <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="mb-2 font-semibold">Items</h2>
    <ul className="space-y-1 text-sm">
      {credit.items.map((i) => (
        <li key={i.productId} className="flex justify-between">
          <span>
            {i.name} × {i.quantity}
          </span>
          <span className="font-medium">{formatCurrency(i.unitPrice * i.quantity)}</span>
        </li>
      ))}
    </ul>
  </div>
)}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Receipt #</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {credit.payments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No payments yet.</td>
                  </tr>
                ) : (
                  credit.payments.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3">{p.receiptNumber}</td>
                      <td className="px-4 py-3">{new Date(p.paidAt).toLocaleString()}</td>
                      <td className="px-4 py-3 capitalize">{p.method}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}