"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import SaleMeta from "./SaleMeta";
import { fetchProducts, type ProductList } from "@/features/inventory/inventory.service";
import { createSales } from "@/features/sales/sales.service";
import { soldAtFor, todayStr } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { Sale } from "@/types/sale";

const cellInput =
  "w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500";
const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500";

export default function QuickOutGrid({ onRecorded }: { onRecorded: (sales: Sale[], date: string) => void }) {
  const [data, setData] = useState<ProductList | null>(null);
  const [q, setQ] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [qty, setQty] = useState<Record<string, string>>({});
  const [price, setPrice] = useState<Record<string, string>>({});
  const [customer, setCustomer] = useState("");
  const [date, setDate] = useState(todayStr());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    fetchProducts().then(setData).catch((e: Error) => setError(e.message));
    // Categories page ke "Becho" link se aaye ho to wahi category pehle se chuni ho
    const wanted = new URLSearchParams(window.location.search).get("categoryId");
    if (wanted) setCategoryId(wanted);
  }, []);

  const all = useMemo(() => (data?.products ?? []).filter((p) => p.quantity > 0), [data]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter(
      (p) =>
        (!categoryId || p.categoryId === categoryId) &&
        (!branchId || p.branchId === branchId) &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          p.sku.toLowerCase().includes(needle) ||
          (p.imei ?? "").toLowerCase().includes(needle))
    );
  }, [all, q, categoryId, branchId]);

  // Jin products me qty bhari hai (filter badalne par bhi yaad rehta hai)
  const entries = all
    .filter((p) => (qty[p.id] ?? "").trim() !== "")
    .map((p) => {
      const n = Number(qty[p.id]);
      const unit = price[p.id] !== undefined && price[p.id] !== "" ? Number(price[p.id]) : p.sellingPrice;
      return { p, n, unit };
    });
  const units = entries.reduce((s, e) => s + (Number.isInteger(e.n) ? e.n : 0), 0);
  const revenue = entries.reduce((s, e) => s + (Number.isInteger(e.n) ? e.n : 0) * (Number.isFinite(e.unit) ? e.unit : 0), 0);

  // Enter dabane par neeche wali row ki qty par jao (Excel jaisa)
  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const inputs = Array.from(tableRef.current?.querySelectorAll<HTMLInputElement>("input[data-qty]") ?? []);
    inputs[inputs.indexOf(e.currentTarget) + 1]?.focus();
  }

  async function submit() {
    setError("");
    for (const e of entries) {
      if (!Number.isInteger(e.n) || e.n < 1) return setError(`"${e.p.name}": quantity poora number (1 ya zyada) likho`);
      if (e.n > e.p.quantity) return setError(`"${e.p.name}": sirf ${e.p.quantity} stock me hain`);
      if (!Number.isFinite(e.unit) || e.unit < 0) return setError(`"${e.p.name}": price galat hai`);
    }
    setBusy(true);
    try {
      const sales = await createSales({
        customerName: customer,
        soldAt: soldAtFor(date),
        items: entries.map((e) => ({ productId: e.p.id, quantity: e.n, unitPrice: e.unit })),
      });
      onRecorded(sales, date);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">1. Jo bika uske saamne number likho</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, SKU, IMEI..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
            <option value="">All categories</option>
            {(data?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={selectClass}>
            <option value="">All branches</option>
            {(data?.branches ?? []).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          {entries.length > 0 && (
            <button onClick={() => { setQty({}); setPrice({}); }} className="text-sm text-brand-600 hover:underline">
              Saare numbers hatao
            </button>
          )}
        </div>

        <div className="max-h-[28rem] overflow-auto rounded-lg border border-slate-200">
          {!data ? (
            <p className="p-5 text-sm text-slate-500">Loading...</p>
          ) : shown.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Koi in-stock product nahi mila.</p>
          ) : (
            <table ref={tableRef} className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Product</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Branch</th>
                  <th className="px-3 py-2 text-right font-medium">Stock</th>
                  <th className="px-3 py-2 text-right font-medium">Price (₹)</th>
                  <th className="px-3 py-2 text-right font-medium">Kitne bike</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((p) => {
                  const filled = (qty[p.id] ?? "").trim() !== "";
                  return (
                    <tr key={p.id} className={filled ? "border-t border-slate-100 bg-brand-50/50" : "border-t border-slate-100"}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.sku}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{p.category}</td>
                      <td className="px-3 py-2 text-slate-600">{p.branchName ?? "—"}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{p.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={price[p.id] ?? String(p.sellingPrice)}
                          onChange={(e) => setPrice((x) => ({ ...x, [p.id]: e.target.value }))}
                          className={cellInput}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setQty((x) => ({ ...x, [p.id]: String(p.quantity) }))}
                            className="text-xs text-brand-600 hover:underline"
                            title="Poora stock bika"
                          >
                            sab
                          </button>
                          <input
                            data-qty
                            type="number"
                            min="1"
                            max={p.quantity}
                            step="1"
                            placeholder="0"
                            value={qty[p.id] ?? ""}
                            onChange={(e) => setQty((x) => ({ ...x, [p.id]: e.target.value }))}
                            onKeyDown={onKey}
                            className={cellInput}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-xs text-slate-400">Tip: number likh ke Enter dabao, agli row par chale jaoge. &quot;sab&quot; dabane se poora stock bika maana jata hai.</p>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">2. Customer aur date</h2>
        <SaleMeta customer={customer} date={date} onCustomer={setCustomer} onDate={setDate} />

        <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          {entries.length === 0 ? (
            "Abhi kisi product ke saamne number nahi likha."
          ) : (
            <>
              <b>{entries.length}</b> products · <b>{units}</b> units · Total <b>{formatCurrency(revenue)}</b>
            </>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={submit}
          disabled={entries.length === 0 || busy}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy && <Loader2 size={16} className="animate-spin" />} Record all sales ({entries.length})
        </button>
      </section>
    </div>
  );
}