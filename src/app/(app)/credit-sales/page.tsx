"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, CreditCard, DollarSign, Phone, Plus, Search } from "lucide-react";
import CreditTable from "@/components/credit-sales/CreditTable";
import NewCreditSaleModal from "@/components/credit-sales/NewCreditSaleModal";
import { CREDITS_KEY, fetchAllCredits, selectCredits } from "@/features/credit-sales/credit-sales.service";
import { useLoad } from "@/lib/useLoad";
import { formatCurrency } from "@/lib/utils";
import type { CreditStatusFilter } from "@/types/credit";

const TABS: { label: string; value: CreditStatusFilter }[] = [
  { label: "All Credits", value: "all" },
  { label: "Active", value: "active" },
  { label: "Partially Paid", value: "partially_paid" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
  { label: "Written Off", value: "written_off" },
];

export default function CreditSalesPage() {
  const [status, setStatus] = useState<CreditStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data: rows, error, reload } = useLoad(CREDITS_KEY, fetchAllCredits);
  // Filter / search browser me hi hota hai, isliye turant badalta hai
  const view = useMemo(() => (rows ? selectCredits(rows, status, q) : null), [rows, status, q]);
  const credits = view?.credits ?? null;
  const stats = view?.stats ?? null;

  // Search ko 300ms debounce karo
  useEffect(() => {
    const t = setTimeout(() => setQ(search), 300);
    return () => clearTimeout(t);
  }, [search]);


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Credit Sales</h1>
          <p className="text-sm text-slate-500">Manage credit sales, installment payments, and customer balances</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/credit-sales/lookup" className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <Phone size={16} /> Customer Lookup
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <Plus size={16} /> New Credit Sale
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">Active Credits</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CreditCard size={18} />
              </div>
            </div>
            <p className="mt-1 text-2xl font-bold">{stats.activeCount}</p>
            <p className="mt-1 text-xs text-slate-400">of {stats.totalCount} total</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">Outstanding Balance</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="mt-1 text-2xl font-bold text-red-500">{formatCurrency(stats.outstanding)}</p>
            <p className="mt-1 text-xs text-slate-400">of {formatCurrency(stats.totalAmount)} total</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">Total Collected</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(stats.collected)}</p>
            <p className="mt-1 text-xs text-slate-400">from installment payments</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm text-slate-500">Overdue Credits</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <AlertTriangle size={18} />
              </div>
            </div>
            <p className="mt-1 text-2xl font-bold text-amber-500">{stats.overdueCount}</p>
            <p className="mt-1 text-xs text-amber-500">
              {stats.overdueCount === 0 ? "No overdue credits" : "Needs follow-up"}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setStatus(t.value)}
                className={clsx(
                  "rounded-lg px-4 py-2 text-sm",
                  status === t.value ? "bg-brand-500 font-medium text-white" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Credit #, Name, Phone..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {credits === null ? (
          <p className="p-6 text-center text-sm text-slate-400">Loading...</p>
        ) : credits.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">No credit sales found.</p>
        ) : (
          <CreditTable credits={credits} />
        )}
      </div>

      <NewCreditSaleModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}