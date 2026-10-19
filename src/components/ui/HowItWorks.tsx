"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";

type Props = {
  id: string; // har guide ka alag id, taaki "Hide" karne par yaad rahe
  title: string;
  steps: string[]; // kaam kaise karna hai, ek ke baad ek
  appearsIn?: string[]; // ye data aage kahan-kahan dikhega
  appearsInTitle?: string;
  note?: string;
};

const storageKey = (id: string) => `erp_guide_${id}`;

export default function HowItWorks({
  id,
  title,
  steps,
  appearsIn,
  appearsInTitle = "Ye data aage yaha dikhega",
  note,
}: Props) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey(id)) === "closed") setOpen(false);
    } catch {
      // storage block ho to guide khula hi rahega
    }
  }, [id]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(storageKey(id), next ? "open" : "closed");
    } catch {
      // ignore
    }
  }

  return (
    <section className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-700">
          <Lightbulb size={16} /> {title}
        </span>
        <span className="flex items-center gap-1 text-xs text-brand-600">
          {open ? "Hide guide" : "Show guide"}
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>

      {open && (
        <div className="mt-3 grid gap-5 md:grid-cols-2">
          <ol className="space-y-2 text-sm text-slate-700">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ol>

          {(appearsIn || note) && (
            <div className="space-y-3 text-sm text-slate-700">
              {appearsIn && (
                <div>
                  <p className="mb-1.5 font-medium text-slate-800">{appearsInTitle}</p>
                  <ul className="space-y-1">
                    {appearsIn.map((a, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-brand-600">→</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {note && <p className="rounded-lg bg-white/70 p-2.5 text-xs text-slate-600">{note}</p>}
            </div>
          )}
        </div>
      )}
    </section>
  );
}