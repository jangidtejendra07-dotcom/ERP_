"use client";

import clsx from "clsx";
import { FIELD_TYPE_LABEL, type CategoryField, type CustomValue } from "@/types/category";

type Props = {
  field: CategoryField;
  value: CustomValue | undefined;
  onChange: (v: CustomValue) => void;
};

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500";

// Category ke ek custom column ke liye uske type ke hisaab se input banata hai.
export default function DynamicFieldInput({ field, value, onChange }: Props) {
  const label = (
    <label className="text-sm font-medium">
      {field.label}
      {field.required && <span className="text-red-500"> *</span>}
      <span className="ml-1 text-xs font-normal text-slate-400">({FIELD_TYPE_LABEL[field.type]})</span>
    </label>
  );

  switch (field.type) {
    case "text":
      return (
        <div className="space-y-1">
          {label}
          <input
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        </div>
      );

    case "number":
    case "decimal":
      return (
        <div className="space-y-1">
          {label}
          <input
            type="number"
            step={field.type === "number" ? "1" : "any"}
            value={typeof value === "number" ? value : ""}
            onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
            className={inputClass}
          />
        </div>
      );

    case "date":
      return (
        <div className="space-y-1">
          {label}
          <input
            type="date"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value || null)}
            className={inputClass}
          />
        </div>
      );

    case "boolean":
      return (
        <div className="space-y-1">
          {label}
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={value === true}
              onChange={(e) => onChange(e.target.checked)}
            />
            Yes
          </label>
        </div>
      );

    case "select": {
      const current = typeof value === "string" ? value : "";
      // Option hata di gayi ho to bhi purani value dikhti rahe
      const options = current && !field.options.includes(current) ? [current, ...field.options] : field.options;
      return (
        <div className="space-y-1">
          {label}
          <select value={current} onChange={(e) => onChange(e.target.value || null)} className={inputClass}>
            <option value="">Select...</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      );
    }

    case "multiselect": {
      const current = Array.isArray(value) ? value : [];
      const options = [...new Set([...field.options, ...current])];
      return (
        <div className="space-y-1">
          {label}
          <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 p-2">
            {options.map((o) => {
              const on = current.includes(o);
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => onChange(on ? current.filter((x) => x !== o) : [...current, o])}
                  className={clsx(
                    "rounded-full border px-3 py-1 text-xs",
                    on
                      ? "border-brand-500 bg-brand-50 font-medium text-brand-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {o}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
  }
}