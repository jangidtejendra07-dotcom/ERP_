"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { createBranch, updateBranch } from "@/features/branches/branches.service";
import type { Branch } from "@/types/branch";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

type Props = { initial?: Branch; onClose: () => void; onSaved: () => void };

export default function BranchModal({ initial, onClose, onSaved }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [address, setAddress] = useState(initial?.address ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [manager, setManager] = useState(initial?.manager ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const input = { name, code, address, phone, manager };
      if (initial) await updateBranch(initial.id, input);
      else await createBranch(input);
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{initial ? "Edit Branch" : "New Branch"}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Branch name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Main Store" autoFocus />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Code</span>
            <input value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} placeholder="auto (MAIN)" />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Manager</span>
            <input value={manager} onChange={(e) => setManager(e.target.value)} className={inputClass} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium">Address</span>
            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} />
          </label>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm">
            Cancel
          </button>
          <button disabled={busy} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? "Saving..." : "Save Branch"}
          </button>
        </div>
      </form>
    </div>
  );
}