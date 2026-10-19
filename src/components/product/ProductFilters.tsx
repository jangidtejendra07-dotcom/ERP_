"use client";

import clsx from "clsx";
import { Search } from "lucide-react";
import type { Branch } from "@/types/branch";
import type { Category } from "@/types/category";
import type { ProductFilter, ProductType, StockStatus } from "@/types/product";
import type { Vendor } from "@/types/vendor";
import { addDays, todayStr } from "@/lib/date";

type Props = {
  value: ProductFilter;
  search: string;
  categories: Category[];
  branches: Branch[];
  vendors: Vendor[];
  onSearch: (s: string) => void;
  onChange: (next: ProductFilter) => void;
};

const TYPES: { label: string; value: ProductType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Internal", value: "internal" },
  { label: "Consignment", value: "external" },
];

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:opacity-50";

export default function ProductFilters({ value, search, categories, branches, vendors, onSearch, onChange }: Props) {
  const type = value.type ?? "all";
  const category = categories.find((c) => c.id === value.categoryId);
  const custom = value.custom ?? {};
  const customFields = (category?.fields ?? []).filter((f) => f.isActive && f.showInFilter);
  const setCustom = (key: string, v: string) => onChange({ ...value, custom: { ...custom, [key]: v } });
  const hasFilters = value.status !== "all" || value.categoryId || value.branchId || value.vendorId || value.receivedFrom || value.receivedTo || type !== "all" || search;

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, SKU, IMEI, category..."
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={value.status ?? "all"}
          onChange={(e) => onChange({ ...value, status: e.target.value as StockStatus | "all" })}
          className={selectClass}
        >
          <option value="all">All stock levels</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>

        <select
          value={value.categoryId ?? ""}
          onChange={(e) => onChange({ ...value, categoryId: e.target.value || undefined, custom: {} })}
          className={selectClass}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={value.branchId ?? ""}
          onChange={(e) => onChange({ ...value, branchId: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <select
          value={value.vendorId ?? ""}
          disabled={type === "internal"}
          onChange={(e) => onChange({ ...value, vendorId: e.target.value || undefined })}
          className={selectClass}
        >
          <option value="">All vendors</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Maal aaya:</span>
          <input
            type="date"
            value={value.receivedFrom ?? ""}
            max={value.receivedTo || todayStr()}
            onChange={(e) => onChange({ ...value, receivedFrom: e.target.value || undefined })}
            className={selectClass}
            aria-label="Received from"
          />
          <span className="text-slate-400">se</span>
          <input
            type="date"
            value={value.receivedTo ?? ""}
            min={value.receivedFrom || undefined}
            max={todayStr()}
            onChange={(e) => onChange({ ...value, receivedTo: e.target.value || undefined })}
            className={selectClass}
            aria-label="Received to"
          />
          {[
            { label: "Aaj", from: todayStr() },
            { label: "7 din", from: addDays(todayStr(), -6) },
            { label: "30 din", from: addDays(todayStr(), -29) },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onChange({ ...value, receivedFrom: c.from, receivedTo: todayStr() })}
              className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              {c.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              onSearch("");
              onChange({ type: "all", status: "all", custom: {} });
            }}
            className="text-sm text-brand-600 hover:underline"
          >
            Clear all
          </button>
        )}
      </div>
      {customFields.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-medium uppercase text-slate-400">{category?.name} filters</span>
          {customFields.map((f) => {
            const cur = custom[f.key] ?? "";
            if (f.type === "boolean") {
              return (
                <select key={f.id} value={cur} onChange={(e) => setCustom(f.key, e.target.value)} className={selectClass}>
                  <option value="">{f.label}: any</option>
                  <option value="true">{f.label}: Yes</option>
                  <option value="false">{f.label}: No</option>
                </select>
              );
            }
            if (f.type === "select" || f.type === "multiselect") {
              return (
                <select key={f.id} value={cur} onChange={(e) => setCustom(f.key, e.target.value)} className={selectClass}>
                  <option value="">{f.label}: all</option>
                  {f.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              );
            }
            return (
              <input
                key={f.id}
                value={cur}
                onChange={(e) => setCustom(f.key, e.target.value)}
                placeholder={f.label}
                className={selectClass}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}