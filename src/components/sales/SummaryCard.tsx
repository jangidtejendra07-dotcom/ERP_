import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

const ACCENTS = {
  blue: { border: "border-l-blue-500", icon: "bg-blue-50 text-blue-600" },
  green: { border: "border-l-green-500", icon: "bg-green-50 text-green-600" },
  purple: { border: "border-l-purple-500", icon: "bg-purple-50 text-purple-600" },
} as const;

type Props = {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
  accent: keyof typeof ACCENTS;
};

export default function SummaryCard({ label, value, sub, icon: Icon, accent }: Props) {
  const a = ACCENTS[accent];
  return (
    <div className={clsx("rounded-xl border border-l-4 border-slate-200 bg-white p-5 shadow-sm", a.border)}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={clsx("flex h-9 w-9 items-center justify-center rounded-lg", a.icon)}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}