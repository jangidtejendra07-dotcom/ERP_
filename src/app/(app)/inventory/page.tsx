"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Box, CheckCircle2, FileSpreadsheet, IndianRupee, Package, Plus, Truck, XCircle } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import HowItWorks from "@/components/ui/HowItWorks";
import LowStockAlert from "@/components/product/LowStockAlert";
import ProductFilters from "@/components/product/ProductFilters";
import ProductTable from "@/components/product/ProductTable";
import { deleteProduct, fetchProducts, productsKey } from "@/features/inventory/inventory.service";
import { fetchVendors } from "@/features/vendors/vendors.service";
import { useLoad } from "@/lib/useLoad";
import { formatCurrency } from "@/lib/utils";
import type { ProductFilter, ProductView } from "@/types/product";

function InventoryContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [filter, setFilter] = useState<ProductFilter>({
    type: "all",
    status: (["in_stock", "low_stock", "out_of_stock"].includes(params.get("status") ?? "")
      ? params.get("status")
      : "all") as ProductFilter["status"],
    categoryId: params.get("categoryId") ?? undefined,
    branchId: params.get("branchId") ?? undefined,
    custom: {},
  });
  const [search, setSearch] = useState("");
  const [actionError, setError] = useState("");
  const [notice, setNotice] = useState<{ kind: "added" | "updated"; name: string; cat: string; branch: string } | null>(null);

  useEffect(() => {
    const added = params.get("added");
    const updated = params.get("updated");
    if (added || updated) {
      setNotice({
        kind: added ? "added" : "updated",
        name: (added ?? updated) as string,
        cat: params.get("cat") ?? "",
        branch: params.get("branch") ?? "",
      });
      router.replace("/inventory"); // refresh par notice dobara na aaye
    }
  }, [params, router]);

  const { data: vendorList } = useLoad("vendors", fetchVendors);
  const vendors = vendorList ?? [];

  // search debounce: type karte waqt har key par API na jaye
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const query = { ...filter, q: debounced };
  const { data: loaded, error: loadError, reload, mutate } = useLoad(productsKey(query), () => fetchProducts(query));
  const data = loaded ?? null;
  const error = actionError || loadError;

  const category = data?.categories.find((c) => c.id === filter.categoryId);
  const columns = useMemo(
    () => (category?.fields ?? []).filter((f) => f.isActive && f.showInTable),
    [category]
  );

  async function onDelete(p: ProductView) {
    if (!window.confirm(`"${p.name}" ko delete karna hai? Ye wapas nahi aayega.`)) return;
    mutate((d) => ({ ...d, products: d.products.filter((x) => x.id !== p.id) })); // turant hatao
    try {
      await deleteProduct(p.id);
      setError("");
      reload(); // counts / stock value chupke se taaza
    } catch (e) {
      setError((e as Error).message);
      reload();
    }
  }

  const s = data?.stats;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-slate-500">Apna aur consignment (vendor ka) saara maal ek jagah.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/inventory/import"
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet size={16} /> Import Excel
          </Link>
          <Link
            href="/inventory/new"
            className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={16} /> New Product
          </Link>
        </div>
      </div>

      {notice && (
        <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600" />
          <div className="flex-1 space-y-1.5">
            <p className="font-semibold">
              &quot;{notice.name}&quot; {notice.kind === "added" ? "add ho gaya" : "update ho gaya"}.
            </p>
            <p>Ab ye product yaha-yaha dikhega:</p>
            <ul className="list-inside list-disc space-y-0.5 text-green-800">
              <li>Neeche Inventory list me{notice.cat && ` (category: ${notice.cat})`}{notice.branch && ` (branch: ${notice.branch})`}.</li>
              <li>Dashboard me Total Products, Stock Value aur Low/Out of Stock ginti me.</li>
              <li>Branches page me us branch ke products, units aur stock value me.</li>
              <li>Categories page me us category ke product count me.</li>
              <li>Sales / Credit Sales me bechte waqt product list me (stock hone par).</li>
            </ul>
          </div>
          <button onClick={() => setNotice(null)} className="self-start text-xs text-green-700 hover:underline">
            Close
          </button>
        </div>
      )}

      <HowItWorks
        id="inventory"
        title="Inventory kaise use karein (pehli baar padhein)"
        steps={[
          "Pehle Branches page par kam se kam ek branch banao (jaha maal rakha hai) aur Categories page par category banao (jaise Phones, Clothes, Books). Category ke apne columns bhi wahi bante hain.",
          "Ek-ek product jodna ho to upar '+ New Product' dabao: naam, category, branch, cost/selling price, quantity bharo. Category ke custom columns apne-aap form me aa jayenge.",
          "Poori Excel file ek saath jodni ho to '+ New Product' ki jagah 'Import Excel' dabao: file upload karo, columns match karo, preview dekho, confirm karo. (Ye feature agla step hai.)",
          "Product add / import hone ke baad yahi list me dikhta hai. Search, category, branch, stock level aur category ke custom filters se dhundo.",
          "Low stock ho to peela alert aata hai. Stock kam hone par 'View low stock' dabake sirf wahi products dekho.",
          "Product ke naam par click karke edit karo. Delete karne se pehle confirm poochha jata hai.",
        ]}
        appearsIn={[
          "Dashboard: Total Products, Stock Value, Low Stock, Out of Stock.",
          "Branches: har branch ke products, units, stock value.",
          "Categories: har category ke products aur low/out count.",
          "Sales / Credit Sales: sirf in-stock product bech sakte ho; bikne par quantity ghat jati hai.",
        ]}
        note="Internal = apna kharida hua maal (stock value me ginta hai). Consignment = vendor ka maal (stock value me nahi ginta, bikne par vendor ko hisaab dena hota hai)."
      />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {s && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          <StatCard title="Total Products" value={String(s.total)} icon={Box} iconClass="bg-indigo-50 text-indigo-600" />
          <StatCard title="Internal / Consignment" value={`${s.internal} / ${s.external}`} icon={Truck} iconClass="bg-purple-50 text-purple-600" />
          <StatCard title="Low Stock" value={String(s.lowStock)} icon={AlertTriangle} iconClass="bg-amber-50 text-amber-500" />
          <StatCard title="Out of Stock" value={String(s.outOfStock)} icon={XCircle} iconClass="bg-red-50 text-red-500" />
          <StatCard title="Stock Value" value={formatCurrency(s.stockValue)} note="sirf internal, cost par" icon={IndianRupee} iconClass="bg-blue-50 text-blue-600" />
        </div>
      )}

      {s && (
        <LowStockAlert
          lowStock={s.lowStock}
          outOfStock={s.outOfStock}
          onShowLow={() => setFilter({ ...filter, status: "low_stock" })}
          onShowOut={() => setFilter({ ...filter, status: "out_of_stock" })}
        />
      )}

      <ProductFilters
        value={filter}
        search={search}
        categories={data?.categories ?? []}
        branches={data?.branches ?? []}
        vendors={vendors}
        onSearch={setSearch}
        onChange={setFilter}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {!data ? (
          <p className="p-6 text-sm text-slate-500">Loading...</p>
        ) : data.products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-slate-500">
            <Package size={32} className="text-slate-300" />
            <p>Koi product nahi mila.</p>
            <p className="max-w-md text-xs">
              Naya product jodne ke liye &quot;+ New Product&quot; dabao, ya poori Excel ke liye &quot;Import Excel&quot;. Filters lage hain to &quot;Clear all&quot; try karo.
            </p>
          </div>
        ) : (
          <ProductTable products={data.products} columns={columns} showCategory={!filter.categoryId} onDelete={onDelete} />
        )}
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
      <InventoryContent />
    </Suspense>
  );
}