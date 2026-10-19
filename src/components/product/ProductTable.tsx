import Link from "next/link";
import clsx from "clsx";
import { Pencil, Trash2 } from "lucide-react";
import ProductStatusBadge from "./ProductStatusBadge";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { CategoryField, CustomValue } from "@/types/category";
import type { ProductView } from "@/types/product";

function show(v: CustomValue | undefined, type: CategoryField["type"]): string {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.join(", ");
  if (type === "boolean") return v ? "Yes" : "No";
  return String(v);
}

type Props = {
  products: ProductView[];
  columns: CategoryField[]; // chuni hui category ke custom columns
  showCategory: boolean;
  onDelete: (p: ProductView) => void;
};

export default function ProductTable({ products, columns, showCategory, onDelete }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            {showCategory && <th className="px-4 py-3 font-medium">Category</th>}
            <th className="px-4 py-3 font-medium">Branch</th>
            {columns.map((c) => (
              <th key={c.id} className="px-4 py-3 font-medium">{c.label}</th>
            ))}
            <th className="px-4 py-3 font-medium">Received</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 text-right font-medium">Cost</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">Stock</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr
              key={p.id}
              className={clsx("border-t border-slate-100", p.status === "low_stock" && "bg-amber-50/40", p.status === "out_of_stock" && "bg-red-50/30")}
            >
              <td className="px-4 py-4">
                <Link href={`/inventory/${encodeURIComponent(p.id)}`} className="font-medium text-brand-600 hover:underline">
                  {p.name}
                </Link>
                <p className="text-xs text-slate-400">
                  {p.sku}
                  {p.imei && ` · ${p.imei}`}
                </p>
              </td>
              {showCategory && <td className="px-4 py-4 text-slate-600">{p.category}</td>}
              <td className="px-4 py-4 text-slate-600">{p.branchName ?? "—"}</td>
              {columns.map((c) => (
                <td key={c.id} className="px-4 py-4 text-slate-600">{show(p.custom[c.key], c.type)}</td>
              ))}
              <td className="whitespace-nowrap px-4 py-4 text-slate-600">{formatDate(`${p.receivedAt}T12:00:00`)}</td>
              <td className="px-4 py-4">
                {p.type === "internal" ? (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">Internal</span>
                ) : (
                  <div>
                    <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-600">Consignment</span>
                    {p.vendorName && <p className="mt-1 text-xs text-slate-400">{p.vendorName}</p>}
                  </div>
                )}
              </td>
              <td className="px-4 py-4 text-right">{formatCurrency(p.costPrice)}</td>
              <td className="px-4 py-4 text-right font-medium">{formatCurrency(p.sellingPrice)}</td>
              <td className="px-4 py-4 text-right">
                <p className={clsx("font-semibold", p.status === "out_of_stock" && "text-red-500", p.status === "low_stock" && "text-amber-600")}>
                  {p.quantity}
                </p>
                <p className="text-xs text-slate-400">alert at {p.lowStockThreshold}</p>
              </td>
              <td className="px-4 py-4">
                <ProductStatusBadge status={p.status} />
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-3 text-slate-400">
                  <Link href={`/inventory/${encodeURIComponent(p.id)}`} aria-label="Edit product" className="hover:text-slate-700">
                    <Pencil size={17} />
                  </Link>
                  <button onClick={() => onDelete(p)} aria-label="Delete product" className="hover:text-red-500">
                    <Trash2 size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}