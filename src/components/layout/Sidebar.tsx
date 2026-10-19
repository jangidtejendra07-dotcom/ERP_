"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import { LogOut, Package, Settings } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { useAuth } from "@/features/auth/AuthProvider";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const linkClass = (active: boolean) =>
    clsx(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
      active ? "bg-brand-50 font-medium text-brand-600" : "text-slate-600 hover:bg-slate-100"
    );

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Package size={20} />
        </div>
        <div>
          <p className="font-semibold leading-tight">{APP_NAME}</p>
          <p className="text-xs text-slate-500">{APP_TAGLINE}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={linkClass(pathname.startsWith(href))}>
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-200 p-3">
        <Link href="/settings" className={linkClass(pathname.startsWith("/settings"))}>
          <Settings size={18} /> Settings
        </Link>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className={clsx(linkClass(false), "w-full")}
        >
          <LogOut size={18} /> Logout
        </button>
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}