"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, ClipboardList, DollarSign, FileText, Plus, ShoppingCart } from "lucide-react";
import HowItWorks from "@/components/ui/HowItWorks";
import SalesFilters from "@/components/sales/SalesFilters";
import SummaryCard from "@/components/sales/SummaryCard";
import { fetchSalesSummary, salesSummaryKey } from "@/features/sales/sales.service";
import { fetchVendors } from "@/features/vendors/vendors.service";
import { useLoad } from "@/lib/useLoad";
import { formatCurrency } from "@/lib/utils";
import type { SalesFilter } from "@/types/sale";

export default function SalesPage() {
  const [filter, setFilter] = useState<SalesFilter>({ type: "all" });
  const { data: vendorList } = useLoad("vendors", fetchVendors);
  const vendors = vendorList ?? [];
  const { data: summaryData, error } = useLoad(salesSummaryKey(filter), () => fetchSalesSummary(filter));
  const summary = summaryData ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sales Overview</h1>
          <p className="text-sm text-slate-500">Real-time sales performance and inventory metrics.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/sales/new"
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus size={16} /> New Sale
          </Link>
          <Link
            href="/sales/reconciliation"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <FileText size={16} /> Vendor Reconciliation
          </Link>
          <Link
            href="/sales/history"
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            <ClipboardList size={16} /> Sales History
          </Link>
        </div>
      </div>

      <HowItWorks
        id="sales-overview"
        title="Sales kaise darj karein aur dekhein"
        steps={[
          "'New Sale' dabao. Do tarike milenge: 'Quick Out' (poori list me jo bika uske saamne seedha number likho, jaise 3) ya 'Manual' (product dhundo, ek-ek karke jodo).",
          "Date chuno: aaj, kal ya koi purani date. Sale usi din ki darj hogi, aur stock apne-aap kam ho jayega.",
          "Yaha Today / This Week / This Month ke totals dikhte hain. Upar ke date filter se kisi bhi din ya range ka hisaab dekho.",
          "Har sale ki list (din-wise table ke saath) 'Sales History' me hai.",
        ]}
        appearsIn={[
          "Inventory: bika hua maal ka stock kam, aur low/out of stock alert.",
          "Dashboard: Total Sales, Revenue, Profit. Branches: us branch ki sales.",
          "Aage banne wala Analytics page isi date-wise data se chalega.",
        ]}
      />

      <SalesFilters value={filter} vendors={vendors} onChange={setFilter} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!summary ? (
        !error && <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
              <p className="mt-1 text-xs text-slate-400">
                vs. {formatCurrency(summary.previousPeriodRevenue)} last month
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Orders Today</p>
              <p className="mt-2 text-2xl font-bold">{summary.ordersToday}</p>
              <p className="mt-1 text-xs text-slate-400">
                Avg. {summary.avgOrdersPerDay.toFixed(1)} orders per day
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Average Order Value</p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(summary.averageOrderValue)}</p>
              <p className="mt-1 text-xs text-slate-400">Based on {summary.transactions} transactions</p>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-semibold">Sales Summary</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryCard
                label="Today"
                value={formatCurrency(summary.today.revenue)}
                sub={`${summary.today.count} sales · ${summary.today.items} items`}
                icon={DollarSign}
                accent="blue"
              />
              <SummaryCard
                label="This Week"
                value={formatCurrency(summary.week.revenue)}
                sub={`${summary.week.count} sales · ${summary.week.items} items`}
                icon={ShoppingCart}
                accent="green"
              />
              <SummaryCard
                label="This Month"
                value={formatCurrency(summary.month.revenue)}
                sub={`${summary.month.count} sales · ${summary.month.items} items`}
                icon={BarChart3}
                accent="purple"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}