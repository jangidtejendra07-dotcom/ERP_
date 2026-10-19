"use client";

import Link from "next/link";
import { AlertTriangle, Box, DollarSign, Package, ShoppingCart, Store, TrendingUp, XCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import HowItWorks from "@/components/ui/HowItWorks";
import ProductStatusBadge from "@/components/product/ProductStatusBadge";
import { DASHBOARD_KEY, getDashboardStats } from "@/features/dashboard/dashboard.service";
import { CATEGORIES_KEY, fetchCategories } from "@/features/categories/categories.service";
import { fetchProducts, productsKey, type ProductList } from "@/features/inventory/inventory.service";
import { useLoad } from "@/lib/useLoad";
import { formatCurrency } from "@/lib/utils";
import type { ProductView } from "@/types/product";

// Product ke custom columns ko chhoti line me dikhata hai: "Brand: Apple · Storage: 128GB"
function customSummary(p: ProductView, list: ProductList["categories"]): string {
  const cat = list.find((c) => c.id === p.categoryId);
  if (!cat) return "";
  return cat.fields
    .filter((f) => f.isActive && f.showInTable)
    .map((f) => {
      const v = p.custom[f.key];
      if (v === undefined || v === null || v === "") return null;
      const text = Array.isArray(v) ? v.join("/") : v === true ? "Yes" : v === false ? "No" : String(v);
      return `${f.label}: ${text}`;
    })
    .filter(Boolean)
    .slice(0, 4)
    .join(" · ");
}

export default function DashboardPage() {
  const { data: statsData } = useLoad(DASHBOARD_KEY, getDashboardStats);
  const { data: productData } = useLoad(productsKey({}), () => fetchProducts());
  const { data: catData } = useLoad(CATEGORIES_KEY, fetchCategories);
  const s = statsData ?? null;
  const data = productData ?? null;
  const cats = catData ?? [];

  if (!s) return <p className="text-sm text-slate-500">Loading...</p>;

  const recent = (data?.products ?? []).slice(0, 8); // API pehle se nayi-se-purani sort deti hai
  const attention = (data?.products ?? []).filter((p) => p.status !== "in_stock").slice(0, 8);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventory Overview</h1>
        <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>

      <HowItWorks
        id="dashboard"
        title="Dashboard kya dikhata hai"
        steps={[
          "Upar ke cards me aapka poora hisaab hai: kitni bikri hui, kitne products hain, stock ki value, low/out of stock.",
          "'Recently added products' me jo bhi product abhi judta hai (+ New Product ya Import Excel se) sabse upar dikhta hai, uske category wale columns ke saath.",
          "'Needs restock' me wo products hain jinka stock kam ya khatam hai. Naam par click karke stock badlo.",
          "'Category-wise stock' me har category ke products, units aur alerts hain. 'View' dabake us category ki poori list kholo.",
        ]}
        appearsIn={[
          "Naya product ya import hote hi ye saari lists aur cards apne-aap naye ho jate hain.",
          "Bikri hone par stock ghatta hai aur Total Sales / Profit badhta hai.",
        ]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Total Sales" value={String(s.totalSales)} note={`${formatCurrency(s.revenue)} revenue`} noteTone="green" icon={ShoppingCart} iconClass="bg-green-50 text-green-600" />
        <StatCard title="Total Products" value={String(s.totalProducts)} note={`${s.internalProducts} Internal · ${s.externalProducts} External`} icon={Box} iconClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Total Vendors" value={String(s.vendors)} icon={Store} iconClass="bg-purple-50 text-purple-600" />
        <StatCard title="Low Stock" value={`${s.lowStock} Products`} note="ACTION NEEDED" noteTone="red" icon={AlertTriangle} iconClass="bg-amber-50 text-amber-500" />
        <StatCard title="Out of Stock" value={`${s.outOfStock} Products`} note="Requires restocking" icon={XCircle} iconClass="bg-red-50 text-red-500" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard title="Total Cost (COGS)" value={formatCurrency(s.cogs)} note="Cost of goods sold" icon={DollarSign} iconClass="bg-orange-50 text-orange-500" />
        <StatCard title="Total Profit" value={formatCurrency(s.profit)} note={`+${s.margin}% margin`} noteTone="green" icon={TrendingUp} iconClass="bg-green-50 text-green-600" />
        <StatCard title="Stock Value" value={formatCurrency(s.stockValue)} note="Current inventory value" icon={Package} iconClass="bg-blue-50 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="font-semibold">Recently added products</h2>
            <Link href="/inventory" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          {!data ? (
            <p className="p-5 text-sm text-slate-500">Loading...</p>
          ) : recent.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">
              Abhi koi product nahi. <Link href="/inventory/new" className="text-brand-600 underline">+ New Product</Link> ya{" "}
              <Link href="/inventory/import" className="text-brand-600 underline">Import Excel</Link>.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/inventory/${encodeURIComponent(p.id)}`} className="font-medium text-brand-600 hover:underline">{p.name}</Link>
                    <p className="text-xs text-slate-400">{p.category} · {p.branchName ?? "—"}</p>
                    {data && customSummary(p, data.categories) && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">{customSummary(p, data.categories)}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">{formatCurrency(p.sellingPrice)}</p>
                    <p className="text-xs text-slate-400">Stock {p.quantity}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="font-semibold">Needs restock</h2>
            <Link href="/inventory?status=low_stock" className="text-sm text-brand-600 hover:underline">Inventory</Link>
          </div>
          {!data ? (
            <p className="p-5 text-sm text-slate-500">Loading...</p>
          ) : attention.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Sab products ka stock theek hai.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {attention.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <Link href={`/inventory/${encodeURIComponent(p.id)}`} className="font-medium text-brand-600 hover:underline">{p.name}</Link>
                    <p className="text-xs text-slate-400">{p.category} · {p.branchName ?? "—"}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-xs text-slate-500">{p.quantity} left</span>
                    <ProductStatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 pt-4">
          <h2 className="font-semibold">Category-wise stock</h2>
        </div>
        {cats.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Abhi koi category nahi.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Columns</th>
                  <th className="px-5 py-3 text-right font-medium">Products</th>
                  <th className="px-5 py-3 text-right font-medium">Units</th>
                  <th className="px-5 py-3 text-right font-medium">Low</th>
                  <th className="px-5 py-3 text-right font-medium">Out</th>
                  <th className="px-5 py-3 text-right font-medium" />
                </tr>
              </thead>
              <tbody>
                {cats.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100">
                    <td className="px-5 py-3 font-medium">{c.name}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">
                      {c.fields.filter((f) => f.isActive).map((f) => f.label).join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3 text-right">{c.productCount}</td>
                    <td className="px-5 py-3 text-right">{c.units}</td>
                    <td className="px-5 py-3 text-right text-amber-600">{c.lowStock}</td>
                    <td className="px-5 py-3 text-right text-red-500">{c.outOfStock}</td>
                    <td className="px-5 py-3 text-right">
                      <Link href={`/inventory?categoryId=${encodeURIComponent(c.id)}`} className="text-brand-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}