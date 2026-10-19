"use client";

import Link from "next/link";
import { Bell, HelpCircle, Plus, Search } from "lucide-react";

export default function Topbar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
      <div className="relative w-full max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search inventory, IMEI, or orders..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-500"
        />
      </div>
      <div className="flex items-center gap-4">
        <Link href="/help" aria-label="Training guide" title="Training guide" className="text-slate-500 hover:text-slate-800">
          <HelpCircle size={18} />
        </Link>
        <button aria-label="Notifications" className="relative text-slate-500 hover:text-slate-800">
          <Bell size={18} />
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            1
          </span>
        </button>
        <Link
          href="/inventory/new"
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={16} /> New Product
        </Link>
      </div>
    </header>
  );
}