import clsx from "clsx";
import { STATUS_LABEL, type CreditStatus } from "@/types/credit";

const STYLES: Record<CreditStatus, string> = {
  active: "bg-blue-50 text-blue-600",
  partially_paid: "bg-amber-50 text-amber-600",
  paid: "bg-green-50 text-green-600",
  overdue: "bg-red-50 text-red-600",
  written_off: "bg-slate-100 text-slate-600",
};

export default function CreditStatusBadge({ status }: { status: CreditStatus }) {
  return (
    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}