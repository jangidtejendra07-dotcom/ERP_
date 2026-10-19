"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, ArrowLeft, ArrowUp, Pencil, Plus } from "lucide-react";
import HowItWorks from "@/components/ui/HowItWorks";
import CategoryModal from "@/components/category/CategoryModal";
import FieldModal from "@/components/category/FieldModal";
import { fetchCategory, reorderFields, updateField } from "@/features/categories/categories.service";
import { FIELD_TYPE_LABEL, FILTERABLE_TYPES, type CategoryField, type CategoryView } from "@/types/category";

const SYSTEM_COLUMNS = ["Name", "SKU", "Branch", "Type", "Cost", "Price", "Stock", "Status"];

export default function CategoryDesignerPage() {
  const { id } = useParams<{ id: string }>();
  const [cat, setCat] = useState<CategoryView | null>(null);
  const [error, setError] = useState("");
  const [fieldModal, setFieldModal] = useState<{ field?: CategoryField } | null>(null);
  const [editCat, setEditCat] = useState(false);

  const load = useCallback(() => {
    fetchCategory(id).then(setCat).catch((e: Error) => setError(e.message));
  }, [id]);
  useEffect(load, [load]);

  async function patch(f: CategoryField, change: Partial<CategoryField>) {
    try {
      setCat(await updateField(id, f.id, change));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    if (!cat) return;
    const order = cat.fields.map((f) => f.id);
    const j = index + dir;
    if (j < 0 || j >= order.length) return;
    [order[index], order[j]] = [order[j], order[index]];
    try {
      setCat(await reorderFields(id, order));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (error && !cat) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>;
  if (!cat) return <p className="text-sm text-slate-500">Loading...</p>;

  const tableCols = cat.fields.filter((f) => f.isActive && f.showInTable);

  return (
    <div className="space-y-5">
      <Link href="/categories" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Back to Categories
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{cat.name} — Columns</h1>
          <p className="text-sm text-slate-500">
            {cat.description || "Is category ke products ke extra columns yaha design karo."} · {cat.productCount} products
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditCat(true)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50">Rename</button>
          <button onClick={() => setFieldModal({})} className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
            <Plus size={16} /> Add Column
          </button>
        </div>
      </div>

      <HowItWorks
        id="category-designer"
        title="Column Designer kaise chalta hai"
        steps={[
          "'+ Add Column' dabao, naam aur type chuno (Text, Number, Date, Yes/No, Single select, Multi select).",
          "Select type me options ek line me ek likho (S, M, L).",
          "'Table' tick = inventory list me column dikhega. 'Filter' tick = inventory me us column se chhantne ke buttons aayenge.",
          "Upar-neeche teer se columns ka order badlo; isi order me inventory table me dikhenge.",
          "Active band karne par column form aur table se hat jata hai, par purana data nahi marta.",
        ]}
        appearsIn={[
          "'+ New Product' form: ye columns category chunte hi dikhte hain.",
          "Inventory table: 'Table' wale columns.",
          "Inventory filters: 'Filter' wale columns (select, multi-select, Yes/No, text).",
        ]}
      />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Fixed columns (har category me)</p>
        <div className="flex flex-wrap gap-1.5">
          {SYSTEM_COLUMNS.map((c) => (
            <span key={c} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">{c}</span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {cat.fields.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500">Abhi koi custom column nahi. &quot;+ Add Column&quot; se pehla column banao.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Column</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Required</th>
                <th className="px-4 py-3 font-medium">Table</th>
                <th className="px-4 py-3 font-medium">Filter</th>
                <th className="px-4 py-3 font-medium">Active</th>
                <th className="px-4 py-3 text-right font-medium">Edit</th>
              </tr>
            </thead>
            <tbody>
              {cat.fields.map((f, i) => (
                <tr key={f.id} className={clsx("border-t border-slate-100", !f.isActive && "opacity-50")}>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 text-slate-400">
                      <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="hover:text-slate-700 disabled:opacity-30"><ArrowUp size={15} /></button>
                      <button onClick={() => move(i, 1)} disabled={i === cat.fields.length - 1} aria-label="Move down" className="hover:text-slate-700 disabled:opacity-30"><ArrowDown size={15} /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{f.label}</p>
                    {f.options.length > 0 && <p className="text-xs text-slate-400">{f.options.join(", ")}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{FIELD_TYPE_LABEL[f.type]}</td>
                  <td className="px-4 py-3">{f.required ? "Yes" : "—"}</td>
                  <td className="px-4 py-3"><input type="checkbox" checked={f.showInTable} onChange={(e) => patch(f, { showInTable: e.target.checked })} /></td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={f.showInFilter} disabled={!FILTERABLE_TYPES.includes(f.type)} onChange={(e) => patch(f, { showInFilter: e.target.checked })} />
                  </td>
                  <td className="px-4 py-3"><input type="checkbox" checked={f.isActive} onChange={(e) => patch(f, { isActive: e.target.checked })} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setFieldModal({ field: f })} aria-label="Edit column" className="text-slate-400 hover:text-slate-700"><Pencil size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Inventory table preview</p>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {["Product", "Branch", ...tableCols.map((c) => c.label), "Type", "Cost", "Price", "Stock", "Status"].map((c, i) => (
            <span key={`${c}-${i}`} className={clsx("rounded border px-2 py-1", tableCols.some((t) => t.label === c) ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500")}>
              {c}
            </span>
          ))}
        </div>
      </div>

      {fieldModal && (
        <FieldModal
          categoryId={cat.id}
          initial={fieldModal.field}
          onClose={() => setFieldModal(null)}
          onSaved={(c) => {
            setCat(c);
            setFieldModal(null);
          }}
        />
      )}
      {editCat && (
        <CategoryModal
          initial={cat}
          onClose={() => setEditCat(false)}
          onSaved={() => {
            setEditCat(false);
            load();
          }}
        />
      )}
    </div>
  );
}