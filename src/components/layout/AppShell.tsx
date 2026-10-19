"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { warm } from "@/features/warm";
import { revalidateActive } from "@/lib/cache";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const ROUTES = ["/dashboard", "/inventory", "/categories", "/branches", "/sales", "/sales/new", "/sales/history", "/credit-sales"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    warm();
    // Pages ka code bhi pehle se load kar lo
    const t = setTimeout(() => ROUTES.forEach((r) => router.prefetch(r)), 300);
    // Dusre log ne kuch badla ho to dikhe: khule page ka data har 30 second me chupke se taaza
    const every = setInterval(() => {
      if (document.visibilityState === "visible") revalidateActive();
    }, 30_000);
    return () => {
      clearTimeout(t);
      clearInterval(every);
    };
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}