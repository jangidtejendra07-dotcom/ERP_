"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createCategory, updateCategory } from "@/features/categories/categories.service";
import type { CategoryView } from "@/types/category";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

type Props = { initial?: CategoryView; onClose: () => void; onSaved: (c: CategoryView) => void };

export default function CategoryModal({ initial, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = initial
        ? await updateCategory(initial.id, { name, description })
        : await createCategory({ name, description });
      onSaved(saved);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{initial ? "Edit Category" : "New Category"}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Category name *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Clothes, Books, Phones..." autoFocus />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
        </label>
        {!initial && (
          <p className="rounded-lg bg-brand-50 p-2.5 text-xs text-brand-700">
            Save karne ke baad aap seedhe is category ke columns (Size, Color, Author...) banane wale page par pahunch jaoge.
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Saving..." : "Save Category"}
          </button>
        </div>
      </form>
    </div>
  );
}