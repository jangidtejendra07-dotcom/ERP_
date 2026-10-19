"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Plus } from "lucide-react";
import FieldModal from "@/components/category/FieldModal";
import { fetchBranchOptions } from "@/features/branches/branches.service";
import { fetchCategories } from "@/features/categories/categories.service";
import { createProduct, updateProduct } from "@/features/inventory/inventory.service";
import { createVendor, fetchVendors } from "@/features/vendors/vendors.service";
import { todayStr } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { Branch } from "@/types/branch";
import type { CategoryField, CategoryView, CustomValue } from "@/types/category";
import type { ProductType, ProductView } from "@/types/product";
import type { Vendor } from "@/types/vendor";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

export default function ProductForm({ initial }: { initial?: ProductView }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const [name, setName] = useState(initial?.name ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [branchId, setBranchId] = useState(initial?.branchId ?? "");
  const [custom, setCustom] = useState<Record<string, CustomValue>>(initial?.custom ?? {});
  const [addingColumn, setAddingColumn] = useState(false);
  const [type, setType] = useState<ProductType>(initial?.type ?? "internal");
  const [vendorId, setVendorId] = useState(initial?.vendorId ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [imei, setImei] = useState(initial?.imei ?? "");
  const [costPrice, setCostPrice] = useState(String(initial?.costPrice ?? ""));
  const [sellingPrice, setSellingPrice] = useState(String(initial?.sellingPrice ?? ""));
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? "0"));
  const [threshold, setThreshold] = useState(String(initial?.lowStockThreshold ?? "5"));
  const [receivedAt, setReceivedAt] = useState(initial?.receivedAt ?? todayStr());

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchVendors().then(setVendors).catch(() => setVendors([]));
    fetchCategories().then(setCategories).catch(() => setCategories([]));
    fetchBranchOptions()
      .then((list) => {
        setBranches(list);
        if (!initial) {
          const first = list.find((b) => b.isActive);
          if (first) setBranchId((cur) => cur || first.id);
        }
      })
      .catch(() => setBranches([]));
  }, [initial]);

  const category = categories.find((c) => c.id === categoryId);
  const fields = (category?.fields ?? []).filter((f) => f.isActive);
  const setValue = (key: string, v: CustomValue) => setCustom((c) => ({ ...c, [key]: v }));

  const cost = Number(costPrice) || 0;
  const price = Number(sellingPrice) || 0;
  const margin = price > 0 ? ((price - cost) / price) * 100 : null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      name,
      categoryId,
      branchId,
      custom,
      type,
      vendorId: type === "external" ? vendorId : null,
      sku,
      imei: imei || null,
      costPrice: Number(costPrice),
      sellingPrice: Number(sellingPrice),
      quantity: Number(quantity),
      lowStockThreshold: Number(threshold),
      receivedAt: receivedAt || todayStr(),
    };
    try {
      if (initial) await updateProduct(initial.id, payload);
      else await createProduct(payload);
      router.push("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
      setBusy(false);
    }
  }

  return (
    <>
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Basic details</h2>

        <div className="space-y-1">
          <label className="text-sm font-medium">Stock type</label>
          <div className="flex w-fit rounded-lg bg-slate-100 p-1">
            {(
              [
                { label: "Internal (own stock)", value: "internal" },
                { label: "Consignment (vendor stock)", value: "external" },
              ] as { label: string; value: ProductType }[]
            ).map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setType(t.value)}
                className={clsx(
                  "rounded-md px-4 py-1.5 text-sm",
                  type === t.value ? "bg-white font-medium text-brand-600 shadow-sm" : "text-slate-600"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {type === "external" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Vendor</label>
              <button
                type="button"
                onClick={async () => {
                  const name = window.prompt("Naye vendor ka naam:");
                  if (!name) return;
                  try {
                    const v = await createVendor(name);
                    setVendors((l) => [...l, v]);
                    setVendorId(v.id);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
                className="text-xs text-brand-600 hover:underline"
              >
                + New vendor
              </button>
            </div>
            <select required value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={inputClass}>
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Product name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Category</label>
            <select
              required
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setCustom({});
              }}
              className={inputClass}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="text-xs text-amber-600">
                Abhi koi category nahi hai. <Link href="/categories" className="underline">Categories page</Link> par pehle category banao.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Branch</label>
            <select required value={branchId} onChange={(e) => setBranchId(e.target.value)} className={inputClass}>
              <option value="">Select branch...</option>
              {branches
                .filter((b) => b.isActive || b.id === initial?.branchId)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">SKU</label>
            <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Leave empty to auto-generate" className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">IMEI / Serial (optional)</label>
            <input value={imei} onChange={(e) => setImei(e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      {category && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{category.name} ke columns</h2>
            <button
              type="button"
              onClick={() => setAddingColumn(true)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              <Plus size={14} /> Add column
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-sm text-slate-500">Is category me abhi koi extra column nahi hai. &quot;Add column&quot; se apna column jodo (jaise Brand, Size).</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {fields.map((f) => (
                <CustomInput key={f.id} field={f} value={custom[f.key]} onChange={(v) => setValue(f.key, v)} />
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Pricing and stock</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Cost price (₹)</label>
            <input required type="number" min="0" step="0.01" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Selling price (₹)</label>
            <input required type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} className={inputClass} />
            {margin !== null && (
              <p className="text-xs text-slate-400">
                Profit per unit {formatCurrency(price - cost)} ({margin.toFixed(1)}% margin)
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Quantity in stock</label>
            <input required type="number" min="0" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Low-stock alert at</label>
            <input required type="number" min="0" step="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={inputClass} />
            <p className="text-xs text-slate-400">Is quantity ya usse kam hone par alert dikhega.</p>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Maal kis din aaya</label>
            <input required type="date" max={todayStr()} value={receivedAt} onChange={(e) => setReceivedAt(e.target.value)} className={inputClass} />
            <p className="text-xs text-slate-400">Inventory me isi date se filter karke dekh sakte ho.</p>
          </div>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {busy ? "Saving..." : editing ? "Save Changes" : "Add Product"}
        </button>
        <Link href="/inventory" className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm hover:bg-slate-50">
          Cancel
        </Link>
      </div>
    </form>
      {addingColumn && category && (
        <FieldModal
          categoryId={category.id}
          onClose={() => setAddingColumn(false)}
          onSaved={(c) => {
            setCategories((list) => list.map((x) => (x.id === c.id ? c : x)));
            setAddingColumn(false);
          }}
        />
      )}
    </>
  );
}

function CustomInput({ field, value, onChange }: { field: CategoryField; value: CustomValue | undefined; onChange: (v: CustomValue) => void }) {
  const label = (
    <label className="text-sm font-medium">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  );
  let input: React.ReactNode;
  switch (field.type) {
    case "number":
    case "decimal":
      input = (
        <input
          type="number"
          step={field.type === "number" ? "1" : "any"}
          value={typeof value === "number" ? String(value) : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={inputClass}
        />
      );
      break;
    case "date":
      input = <input type="date" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || null)} className={inputClass} />;
      break;
    case "boolean":
      input = (
        <select value={value === true ? "yes" : value === false ? "no" : ""} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value === "yes")} className={inputClass}>
          <option value="">—</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      );
      break;
    case "select":
      input = (
        <select value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
          <option value="">—</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      );
      break;
    case "multiselect": {
      const cur = Array.isArray(value) ? value : [];
      input = (
        <div className="flex flex-wrap gap-2">
          {field.options.map((o) => (
            <label key={o} className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-sm">
              <input type="checkbox" checked={cur.includes(o)} onChange={(e) => onChange(e.target.checked ? [...cur, o] : cur.filter((x) => x !== o))} />
              {o}
            </label>
          ))}
        </div>
      );
      break;
    }
    default:
      input = <input value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} className={inputClass} />;
  }
  return (
    <div className="space-y-1">
      {label}
      {input}
    </div>
  );
}