"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import HowItWorks from "@/components/ui/HowItWorks";
import SalesFilters from "@/components/sales/SalesFilters";
import { fetchSales } from "@/features/sales/sales.service";
import { fetchVendors } from "@/features/vendors/vendors.service";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { Sale, SalesFilter } from "@/types/sale";
import type { Vendor } from "@/types/vendor";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Sale ka din (browser ke timezone me), jaise "2026-10-14"
function dayOf(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function HistoryContent() {
  const params = useSearchParams();
  const from = params.get("from");
  const to = params.get("to");

  const [filter, setFilter] = useState<SalesFilter>({
    type: "all",
    from: from && DATE_RE.test(from) ? from : undefined,
    to: to && DATE_RE.test(to) ? to : undefined,
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchVendors().then(setVendors).catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    let ignore = false;
    setError("");
    fetchSales(filter)
      .then((s) => {
        if (!ignore) setSales(s);
      })
      .catch((e: Error) => {
        if (!ignore) setError(e.message);
      });
    return () => {
      ignore = true;
    };
  }, [filter]);

  const totals = useMemo(() => {
    const list = sales ?? [];
    return {
      count: list.length,
      units: list.reduce((s, x) => s + x.itemsCount, 0),
      revenue: list.reduce((s, x) => s + x.total, 0),
      profit: list.reduce((s, x) => s + (x.total - x.cost), 0),
    };
  }, [sales]);

  // Din-wise hisaab (nayi date upar)
  const days = useMemo(() => {
    const map = new Map<string, { count: number; units: number; revenue: number }>();
    for (const s of sales ?? []) {
      const k = dayOf(s.createdAt);
      const cur = map.get(k) ?? { count: 0, units: 0, revenue: 0 };
      cur.count += 1;
      cur.units += s.itemsCount;
      cur.revenue += s.total;
      map.set(k, cur);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [sales]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/sales" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft size={14} /> Back to Sales Overview
          </Link>
          <h1 className="text-2xl font-bold">Sales History</h1>
          <p className="text-sm text-slate-500">Har sale apni date ke saath. Date se filter karke kisi bhi din ki bikri dekho.</p>
        </div>
        <Link
          href="/sales/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} /> New Sale
        </Link>
      </div>

      <HowItWorks
        id="sales-history"
        title="Sales History kaise padhein"
        steps={[
          "Upar 'Today', 'Yesterday', 'Last 7 days', 'This month' dabao ya apni date range chuno. Sirf us range ki sales dikhengi.",
          "'Din-wise' table me har din ki sales, units aur revenue ek line me hai. Isse dekho kis din zyada bikri hui.",
          "Neeche list me har sale ka exact date-time, customer, kaunsa maal kitna bika, branch aur profit hai.",
          "Nayi bikri darj karne ke liye 'New Sale' dabao. Purani date daloge to wo usi din me aayegi.",
        ]}
        appearsIn={[
          "Sales Overview (Today / Week / Month), Dashboard (revenue, profit), Branches (sales aur revenue).",
          "Aage banne wale Analytics page me din-wise trend isi date data se banega.",
        ]}
      />

      <SalesFilters value={filter} vendors={vendors} onChange={setFilter} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Sales", value: String(totals.count) },
          { label: "Units bike", value: String(totals.units) },
          { label: "Revenue", value: formatCurrency(totals.revenue) },
          { label: "Profit", value: formatCurrency(totals.profit) },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="mt-1 text-xl font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {days.length > 1 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <p className="px-4 pt-4 font-semibold">Din-wise</p>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 text-right font-medium">Sales</th>
                  <th className="px-4 py-2 text-right font-medium">Units</th>
                  <th className="px-4 py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {days.map(([day, d]) => (
                  <tr key={day} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <button
                        onClick={() => setFilter({ ...filter, from: day, to: day })}
                        className="text-brand-600 hover:underline"
                        title="Sirf is din ki sales dekho"
                      >
                        {formatDate(`${day}T12:00:00`)}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right">{d.count}</td>
                    <td className="px-4 py-2 text-right">{d.units}</td>
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Customer / Maal</th>
              <th className="px-4 py-3 font-medium">Branch</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Vendor</th>
              <th className="px-4 py-3 text-right font-medium">Units</th>
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Profit</th>
            </tr>
          </thead>
          <tbody>
            {sales === null ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">Loading...</td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-slate-400">
                  Is range me koi sale nahi mili. <Link href="/sales/new" className="text-brand-600 underline">Nayi sale darj karo</Link>.
                </td>
              </tr>
            ) : (
              sales.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {s.customerName}
                    {s.items && (
                      <p className="text-xs text-slate-400">
                        {s.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{s.branchName ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{s.type}</td>
                  <td className="px-4 py-3">{s.vendorName ?? "—"}</td>
                  <td className="px-4 py-3 text-right">{s.itemsCount}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total)}</td>
                  <td className="px-4 py-3 text-right text-green-700">{formatCurrency(s.total - s.cost)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SalesHistoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
      <HistoryContent />
    </Suspense>
  );
}