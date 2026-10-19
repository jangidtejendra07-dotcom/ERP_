"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { addField, updateField } from "@/features/categories/categories.service";
import { FIELD_TYPE_LABEL, FILTERABLE_TYPES, type CategoryField, type CategoryView, type FieldType } from "@/types/category";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

type Props = {
  categoryId: string;
  initial?: CategoryField;
  onClose: () => void;
  onSaved: (c: CategoryView) => void;
};

export default function FieldModal({ categoryId, initial, onClose, onSaved }: Props) {
  const [label, setLabel] = useState(initial?.label ?? "");
  const [type, setType] = useState<FieldType>(initial?.type ?? "text");
  const [required, setRequired] = useState(initial?.required ?? false);
  const [optionsText, setOptionsText] = useState((initial?.options ?? []).join("\n"));
  const [showInTable, setShowInTable] = useState(initial?.showInTable ?? true);
  const [showInFilter, setShowInFilter] = useState(initial?.showInFilter ?? false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const hasOptions = type === "select" || type === "multiselect";
  const canFilter = FILTERABLE_TYPES.includes(type);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    setError("");
    const options = optionsText.split("\n").map((o) => o.trim()).filter(Boolean);
    try {
      const input = { label, type, required, options: hasOptions ? options : [], showInTable, showInFilter: canFilter && showInFilter };
      const saved = initial ? await updateField(categoryId, initial.id, input) : await addField(categoryId, input);
      onSaved(saved);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Portal: modal body me alag lagta hai, isliye bahar ke form se kabhi nahi takrata
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{initial ? "Edit Column" : "Add Column"}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Column name *</span>
          <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass} placeholder="Size, Color, Author..." autoFocus />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium">Type</span>
          <select value={type} disabled={Boolean(initial)} onChange={(e) => setType(e.target.value as FieldType)} className={inputClass}>
            {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
            ))}
          </select>
          {initial && <span className="text-xs text-slate-400">Type banne ke baad nahi badalta (purana data kharab na ho). Zarurat ho to naya column banao.</span>}
        </label>

        {hasOptions && (
          <label className="block space-y-1 text-sm">
            <span className="font-medium">Options (ek line me ek)</span>
            <textarea value={optionsText} onChange={(e) => setOptionsText(e.target.value)} rows={4} className={inputClass} placeholder={"S\nM\nL\nXL"} />
          </label>
        )}

        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} /> Product jodte waqt zaruri</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={showInTable} onChange={(e) => setShowInTable(e.target.checked)} /> Inventory table me column dikhao</label>
          <label className={`flex items-center gap-2 ${canFilter ? "" : "opacity-50"}`}>
            <input type="checkbox" disabled={!canFilter} checked={canFilter && showInFilter} onChange={(e) => setShowInFilter(e.target.checked)} />
            Filter banao {!canFilter && "(is type par filter nahi banta)"}
          </label>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Cancel</button>
          <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Saving..." : "Save Column"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}