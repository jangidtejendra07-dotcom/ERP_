import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Props = {
  title: string;
  value: string;
  note?: string;
  noteTone?: "green" | "red" | "muted";
  icon: LucideIcon;
  iconClass?: string;
};

export default function StatCard({ title, value, note, noteTone = "muted", icon: Icon, iconClass }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={clsx("flex h-9 w-9 items-center justify-center rounded-lg", iconClass)}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {note && (
        <p
          className={clsx(
            "mt-1 text-xs",
            noteTone === "green" && "text-green-600",
            noteTone === "red" && "text-red-500",
            noteTone === "muted" && "text-slate-400"
          )}
        >
          {note}
        </p>
      )}
    </div>
  );
}