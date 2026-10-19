"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import HowItWorks from "@/components/ui/HowItWorks";
import ManualSaleForm from "@/components/sales/ManualSaleForm";
import QuickOutGrid from "@/components/sales/QuickOutGrid";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { Sale } from "@/types/sale";

type Mode = "manual" | "quick";

export default function NewSalePage() {
  const [mode, setMode] = useState<Mode>("quick");
  const [done, setDone] = useState<{ sales: Sale[]; date: string } | null>(null);
  const [round, setRound] = useState(0); // naya sale shuru karne par form khali karne ke liye

  if (done) {
    const units = done.sales.reduce((s, x) => s + x.itemsCount, 0);
    const revenue = done.sales.reduce((s, x) => s + x.total, 0);
    return (
      <div className="space-y-5">
        <div className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-900">
          <CheckCircle2 size={22} className="mt-0.5 shrink-0 text-green-600" />
          <div className="space-y-2">
            <p className="text-base font-semibold">
              {done.sales.length} sale{done.sales.length > 1 ? "s" : ""} darj ho gayi: {units} units, {formatCurrency(revenue)}
            </p>
            <p>Bikri ki date: <b>{formatDate(`${done.date}T12:00:00`)}</b>. Stock apne-aap kam ho gaya. Ab ye yaha-yaha dikhega:</p>
            <ul className="list-inside list-disc space-y-0.5 text-green-800">
              <li>Sales History me us din ke filter ke saath (date-wise dekh sakte ho).</li>
              <li>Sales Overview me Today / This Week / This Month ke numbers me.</li>
              <li>Dashboard me Total Sales, Revenue aur Profit me.</li>
              <li>Inventory me product ka stock kam, aur Low/Out of Stock alert me agar stock kam bacha.</li>
              <li>Branches me us branch ke Sales aur Revenue me.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href={`/sales/history?from=${done.date}&to=${done.date}`}
                className="rounded-lg bg-green-700 px-4 py-2 font-medium text-white hover:bg-green-800"
              >
                Us din ki Sales History dekho
              </Link>
              <button
                onClick={() => {
                  setDone(null);
                  setRound((r) => r + 1);
                }}
                className="rounded-lg border border-green-300 bg-white px-4 py-2 font-medium text-green-800 hover:bg-green-100"
              >
                Aur sale darj karo
              </button>
              <Link href="/inventory" className="rounded-lg border border-green-300 bg-white px-4 py-2 font-medium text-green-800 hover:bg-green-100">
                Inventory dekho
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/sales" className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft size={14} /> Back to Sales Overview
        </Link>
        <h1 className="text-2xl font-bold">New Sale</h1>
        <p className="text-sm text-slate-500">Inventory se maal becho. Stock apne-aap kam hoga aur sale date ke saath darj hogi.</p>
      </div>

      <div className="flex w-fit rounded-lg bg-slate-100 p-1">
        {(
          [
            { label: "Quick Out (Excel jaisa)", value: "quick" },
            { label: "Manual (ek-ek maal)", value: "manual" },
          ] as { label: string; value: Mode }[]
        ).map((t) => (
          <button
            key={t.value}
            onClick={() => setMode(t.value)}
            className={clsx(
              "rounded-md px-4 py-1.5 text-sm",
              mode === t.value ? "bg-white font-medium text-brand-600 shadow-sm" : "text-slate-600"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === "quick" ? (
        <HowItWorks
          id="sales-quick"
          title="Quick Out: ek saath bahut saari bikri darj karo"
          steps={[
            "Neeche saare in-stock products ki list hai. Jo bika uske saamne 'Kitne bike' me seedha number likho (jaise 3). Enter dabane se agli row par jaoge.",
            "Price apne-aap product ka selling price hota hai. Kisi ko kam/zyada me becha ho to wahi price badal do.",
            "Search, category aur branch se list chhoti kar sakte ho. Jo numbers likh chuke ho wo filter badalne par bhi bane rehte hain.",
            "Date chuno (aaj, kal ya koi purani date). Purani date daloge to sale usi din ki darj hogi.",
            "'Record all sales' dabao. Saare products ka stock ek saath kam hoga. Koi bhi galti ho (jaise stock se zyada) to kuch bhi save nahi hota.",
          ]}
          appearsIn={[
            "Sales History: date ke saath, date-wise filter me.",
            "Sales Overview aur Dashboard: revenue, profit, orders.",
            "Inventory: stock kam, low/out of stock alert.",
          ]}
          note="Alag branch ya alag type (apna / consignment) ka maal ek saath daalo to system apne-aap alag sales bana deta hai."
        />
      ) : (
        <HowItWorks
          id="sales-manual"
          title="Manual sale: ek-ek maal ke hisaab se"
          steps={[
            "Upar search me product ka naam, SKU ya IMEI likho aur list se product chuno. Aise kai products jod sakte ho.",
            "Har product ki quantity aur price check karo (price apne-aap selling price hota hai, badal sakte ho).",
            "Customer ka naam (optional) aur date chuno.",
            "'Record sale' dabao. Stock kam ho jata hai aur sale history me date ke saath darj hoti hai.",
          ]}
          appearsIn={[
            "Sales History, Sales Overview, Dashboard, Inventory (stock) aur Branches (revenue).",
          ]}
        />
      )}

      {mode === "quick" ? (
        <QuickOutGrid key={`q${round}`} onRecorded={(sales, date) => setDone({ sales, date })} />
      ) : (
        <ManualSaleForm key={`m${round}`} onRecorded={(sales, date) => setDone({ sales, date })} />
      )}
    </div>
  );
}