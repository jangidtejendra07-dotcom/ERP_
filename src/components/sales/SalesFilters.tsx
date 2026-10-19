"use client";

import clsx from "clsx";
import { Calendar, Store } from "lucide-react";
import type { SalesFilter, SaleType } from "@/types/sale";
import type { Vendor } from "@/types/vendor";

type Props = {
  value: SalesFilter;
  vendors: Vendor[];
  onChange: (next: SalesFilter) => void;
};

const TYPES: { label: string; value: SaleType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Internal", value: "internal" },
  { label: "External", value: "external" },
];

export default function SalesFilters({ value, vendors, onChange }: Props) {
  const type = value.type ?? "all";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex rounded-lg bg-slate-100 p-1">
        {TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() =>
              onChange({ ...value, type: t.value, vendorId: t.value === "internal" ? undefined : value.vendorId })
            }
            className={clsx(
              "rounded-md px-4 py-1.5 text-sm",
              type === t.value ? "bg-white font-medium text-brand-600 shadow-sm" : "text-slate-600"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Store size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <select
          value={value.vendorId ?? ""}
          disabled={type === "internal"}
          onChange={(e) => onChange({ ...value, vendorId: e.target.value || undefined })}
          className="min-w-44 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500 disabled:opacity-50"
        >
          <option value="">All Vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500">
        <div className="relative">
          <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={value.from ?? ""}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
            className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <span>to</span>
        <div className="relative">
          <Calendar size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={value.to ?? ""}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
            className="rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {(value.from || value.to || value.vendorId || type !== "all") && (
        <button onClick={() => onChange({ type: "all" })} className="text-sm text-brand-600 hover:underline">
          Clear
        </button>
      )}
    </div>
  );
}