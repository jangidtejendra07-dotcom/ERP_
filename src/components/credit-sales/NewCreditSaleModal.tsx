"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createCredit } from "@/features/credit-sales/credit-sales.service";
import type { PaymentMethod } from "@/types/credit";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

export default function NewCreditSaleModal({ open, onClose, onCreated }: Props) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [total, setTotal] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  function reset() {
    setCustomerName("");
    setPhone("");
    setTotal("");
    setDownPayment("");
    setMethod("cash");
    setDueDate("");
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await createCredit({
        customerName,
        phone,
        total: Number(total),
        downPayment: downPayment ? Number(downPayment) : 0,
        method,
        dueDate: dueDate || null,
      });
      reset();
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create credit sale");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Credit Sale</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Customer name</label>
          <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Phone</label>
          <input required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Total (₹)</label>
            <input required type="number" min="0.01" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Down payment</label>
            <input type="number" min="0" step="0.01" value={downPayment} onChange={(e) => setDownPayment(e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Payment method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={inputClass}>
              <option value="cash">Cash</option>
              <option value="momo">Mobile Money</option>
              <option value="card">Card</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? "Saving..." : "Create Credit Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}