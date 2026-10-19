"use client";

import clsx from "clsx";
import { addDays, todayStr } from "@/lib/date";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

type Props = {
  customer: string;
  date: string;
  onCustomer: (v: string) => void;
  onDate: (v: string) => void;
};

// Customer ka naam aur bikri ki date (dono tarike ke sale form me same)
export default function SaleMeta({ customer, date, onCustomer, onDate }: Props) {
  const today = todayStr();
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-1 text-sm">
        <span className="font-medium">Customer (optional)</span>
        <input
          value={customer}
          onChange={(e) => onCustomer(e.target.value)}
          placeholder="Walk-in Customer"
          className={inputClass}
        />
      </label>
      <div className="space-y-1 text-sm">
        <span className="font-medium">Bikri ki date</span>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={date}
            max={today}
            onChange={(e) => onDate(e.target.value || today)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          {[
            { label: "Aaj", v: today },
            { label: "Kal", v: addDays(today, -1) },
          ].map((c) => (
            <button
              key={c.label}
              type="button"
              onClick={() => onDate(c.v)}
              className={clsx(
                "rounded-full border px-3 py-1 text-xs",
                date === c.v ? "border-brand-500 bg-brand-50 font-medium text-brand-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Purani date daalo to us din ki sale darj hogi (Sales History me us din ke filter me dikhegi).</p>
      </div>
    </div>
  );
}