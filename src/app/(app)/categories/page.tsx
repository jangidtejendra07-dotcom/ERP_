"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import HowItWorks from "@/components/ui/HowItWorks";
import CategoryModal from "@/components/category/CategoryModal";
import { CATEGORIES_KEY, deleteCategory, fetchCategories } from "@/features/categories/categories.service";
import { useLoad } from "@/lib/useLoad";
import type { CategoryView } from "@/types/category";

export default function CategoriesPage() {
  const { data, error: loadError, reload, mutate } = useLoad(CATEGORIES_KEY, fetchCategories);
  const items = data ?? null;
  const [actionError, setActionError] = useState("");
  const error = actionError || loadError;
  const setError = setActionError;
  const [msg, setMsg] = useState("");
  const [modal, setModal] = useState<{ category?: CategoryView } | null>(null);

  const load = reload;

  async function remove(c: CategoryView) {
    if (!window.confirm(`Category "${c.name}" delete karni hai?`)) return;
    mutate((list) => list.filter((x) => x.id !== c.id)); // screen se turant hatao
    try {
      await deleteCategory(c.id);
      setError("");
      setMsg(`"${c.name}" delete ho gayi.`);
    } catch (e) {
      setMsg("");
      setError((e as Error).message);
      load(); // fail hua to asli list wapas lao
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-sm text-slate-500">Apne maal ki categories banao, badlo ya hatao (jaise Phones, Clothes, Books).</p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} /> New Category
        </button>
      </div>

      <HowItWorks
        id="categories"
        title="Categories kaise use karein"
        steps={[
          "'+ New Category' dabao, naam likho, Save. Bas itna hi.",
          "Naam badalna ho to pencil icon, hatana ho to dustbin icon. Jis category me products hain wo delete nahi hoti: pehle uske products doosri category me daalo.",
          "Product jodte waqt (+ New Product) aur Excel import me yahi categories milti hain. Excel me 'Category' column ho aur naam yaha na ho to wo category import ke saath apne-aap ban jati hai.",
          "Extra columns (Size, Color, Author...) optional hain: list me 'Columns' dabake jodo.",
        ]}
        appearsIn={[
          "Inventory: Category column aur filter.",
          "Product form aur Import Excel: category chunne ke liye.",
          "Sales: Quick Out me category se filter.",
          "Dashboard: category-wise stock table.",
        ]}
      />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {msg && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{msg}</p>}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        {!items ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Abhi koi category nahi. <button onClick={() => setModal({})} className="text-brand-600 underline">Pehli category banao</button>{" "}
            ya <Link href="/inventory/import" className="text-brand-600 underline">Excel import</Link> karo (Category column se apne-aap ban jayegi).
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Products</th>
                <th className="px-4 py-3 text-right font-medium">Units</th>
                <th className="px-4 py-3 font-medium">Jaldi jao</th>
                <th className="px-4 py-3 text-right font-medium">Edit / Delete</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => {
                const cols = c.fields.filter((f) => f.isActive).length;
                const id = encodeURIComponent(c.id);
                return (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-4 py-3">
                      <p className="font-medium">{c.name}</p>
                      {c.description && <p className="text-xs text-slate-400">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">{c.productCount}</td>
                    <td className="px-4 py-3 text-right">{c.units}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-brand-600">
                        <Link href={`/inventory?categoryId=${id}`} className="hover:underline">Products</Link>
                        <Link href={`/inventory/import?categoryId=${id}`} className="hover:underline">Import Excel</Link>
                        <Link href={`/sales/new?categoryId=${id}`} className="hover:underline">Becho</Link>
                        <Link href={`/categories/${id}`} className="hover:underline">Columns ({cols})</Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-slate-400">
                        <button onClick={() => setModal({ category: c })} aria-label="Edit category" className="hover:text-slate-700">
                          <Pencil size={17} />
                        </button>
                        <button onClick={() => remove(c)} aria-label="Delete category" className="hover:text-red-500">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <CategoryModal
          initial={modal.category}
          onClose={() => setModal(null)}
          onSaved={(c) => {
            setModal(null);
            setError("");
            setMsg(modal.category ? `"${c.name}" update ho gayi.` : `"${c.name}" ban gayi. Ab product jodte ya import karte waqt ye category milegi.`);
            load();
          }}
        />
      )}
    </div>
  );
}