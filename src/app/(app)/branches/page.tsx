"use client";

import { useState } from "react";
import Link from "next/link";
import { GitBranch, IndianRupee, Package, Pencil, Plus, Power, Trash2 } from "lucide-react";
import clsx from "clsx";
import StatCard from "@/components/dashboard/StatCard";
import HowItWorks from "@/components/ui/HowItWorks";
import BranchModal from "@/components/branch/BranchModal";
import { BRANCHES_KEY, deleteBranch, fetchBranches, updateBranch } from "@/features/branches/branches.service";
import { useLoad } from "@/lib/useLoad";
import { formatCurrency } from "@/lib/utils";
import type { Branch, BranchView } from "@/types/branch";

export default function BranchesPage() {
  const { data: loaded, error: loadError, reload, mutate } = useLoad(BRANCHES_KEY, fetchBranches);
  const data = loaded ?? null;
  const [actionError, setError] = useState("");
  const error = actionError || loadError;
  const [modal, setModal] = useState<{ branch?: Branch } | null>(null);

  const load = reload;

  async function toggle(b: BranchView) {
    mutate((d) => ({ ...d, branches: d.branches.map((x) => (x.id === b.id ? { ...x, isActive: !x.isActive } : x)) })); // turant dikhao
    try {
      await updateBranch(b.id, { name: b.name, isActive: !b.isActive });
      setError("");
    } catch (e) {
      setError((e as Error).message);
      load();
    }
  }

  async function remove(b: BranchView) {
    if (!window.confirm(`Branch "${b.name}" delete karni hai?`)) return;
    mutate((d) => ({ ...d, branches: d.branches.filter((x) => x.id !== b.id) }));
    try {
      await deleteBranch(b.id);
      setError("");
    } catch (e) {
      setError((e as Error).message);
      load();
    }
  }

  const s = data?.stats;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Branches</h1>
          <p className="text-sm text-slate-500">Dukaan / godown jaha aapka maal rakha hai.</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} /> New Branch
        </button>
      </div>

      <HowItWorks
        id="branches"
        title="Branches kaise use karein"
        steps={[
          "'+ New Branch' dabake apni dukaan ya godown ka naam jodo (jaise Main Store, Warehouse).",
          "Product jodte waqt har product ko ek branch chunni padti hai. Isiliye product jodne se pehle branch banana zaruri hai.",
          "Kisi branch ka stock dekhna ho to uske card par 'View stock' dabao: Inventory sirf us branch ke products dikhayega.",
          "Branch band karni ho to Deactivate karo. Band branch me naya product nahi jud sakta, par purana data safe rehta hai.",
          "Delete sirf tab hota hai jab branch me ek bhi product na ho. Aakhri active branch band ya delete nahi ho sakti.",
        ]}
        appearsIn={[
          "Inventory: Branch column aur Branch filter.",
          "Sales: bikri usi branch ke naam se darj hoti hai (ek bill me do branch ka maal nahi mil sakta).",
          "Dashboard: total stock value me saari branches judti hain.",
        ]}
      />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {s && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard title="Branches" value={`${s.active} / ${s.total}`} note="active / total" icon={GitBranch} iconClass="bg-indigo-50 text-indigo-600" />
          <StatCard title="Products" value={String(s.products)} icon={Package} iconClass="bg-purple-50 text-purple-600" />
          <StatCard title="Units in stock" value={String(s.units)} icon={Package} iconClass="bg-amber-50 text-amber-500" />
          <StatCard title="Stock Value" value={formatCurrency(s.stockValue)} note="internal, cost par" icon={IndianRupee} iconClass="bg-blue-50 text-blue-600" />
        </div>
      )}

      {!data ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.branches.map((b) => (
            <div key={b.id} className={clsx("rounded-xl border bg-white p-5 shadow-sm", b.isActive ? "border-slate-200" : "border-slate-200 opacity-70")}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-slate-400">
                    {b.code}
                    {b.manager && ` · ${b.manager}`}
                  </p>
                </div>
                <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", b.isActive ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-500")}>
                  {b.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {(b.address || b.phone) && (
                <p className="mt-2 text-xs text-slate-500">
                  {b.address}
                  {b.address && b.phone && " · "}
                  {b.phone}
                </p>
              )}

              <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div><dt className="text-xs text-slate-400">Products</dt><dd className="font-semibold">{b.productCount}</dd></div>
                <div><dt className="text-xs text-slate-400">Units</dt><dd className="font-semibold">{b.units}</dd></div>
                <div><dt className="text-xs text-slate-400">Stock value</dt><dd className="font-semibold">{formatCurrency(b.stockValue)}</dd></div>
                <div><dt className="text-xs text-slate-400">Low</dt><dd className="font-semibold text-amber-600">{b.lowStock}</dd></div>
                <div><dt className="text-xs text-slate-400">Out</dt><dd className="font-semibold text-red-500">{b.outOfStock}</dd></div>
                <div><dt className="text-xs text-slate-400">Sales</dt><dd className="font-semibold">{b.salesCount}</dd></div>
              </dl>
              <p className="mt-2 text-xs text-slate-400">Revenue: {formatCurrency(b.revenue)}</p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                <Link href={`/inventory?branchId=${encodeURIComponent(b.id)}`} className="text-sm font-medium text-brand-600 hover:underline">
                  View stock →
                </Link>
                <div className="flex gap-3 text-slate-400">
                  <button onClick={() => setModal({ branch: b })} aria-label="Edit branch" className="hover:text-slate-700"><Pencil size={17} /></button>
                  <button onClick={() => toggle(b)} aria-label={b.isActive ? "Deactivate" : "Activate"} className="hover:text-slate-700"><Power size={17} /></button>
                  <button onClick={() => remove(b)} aria-label="Delete branch" className="hover:text-red-500"><Trash2 size={17} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <BranchModal
          initial={modal.branch}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}