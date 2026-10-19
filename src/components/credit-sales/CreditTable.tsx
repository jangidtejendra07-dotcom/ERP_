import Link from "next/link";
import clsx from "clsx";
import { Eye } from "lucide-react";
import CreditStatusBadge from "./CreditStatusBadge";
import { formatDate } from "@/lib/date";
import { formatCurrency } from "@/lib/utils";
import type { CreditView } from "@/types/credit";

export default function CreditTable({ credits }: { credits: CreditView[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Credit #</th>
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Progress</th>
            <th className="px-4 py-3 font-medium">Balance</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {credits.map((c) => {
            const lastReceipt = c.payments.at(-1)?.receiptNumber;
            return (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-4">
                  <Link href={`/credit-sales/${encodeURIComponent(c.id)}`} className="font-medium text-brand-600 hover:underline">
                    {c.id}
                  </Link>
                  {lastReceipt && <p className="text-xs text-slate-400">{lastReceipt}</p>}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium">{c.customerName}</p>
                  <p className="text-xs text-slate-400">{c.phone}</p>
                </td>
                <td className="px-4 py-4 font-medium">{formatCurrency(c.total)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={clsx("h-full rounded-full", c.progress === 100 ? "bg-green-500" : "bg-brand-500")}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{c.progress}%</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatCurrency(c.paid)} paid</p>
                </td>
                <td className={clsx("px-4 py-4 font-medium", c.balance > 0 ? "text-red-500" : "text-green-600")}>
                  {formatCurrency(c.balance)}
                </td>
                <td className="px-4 py-4">
                  <CreditStatusBadge status={c.status} />
                </td>
                <td className="px-4 py-4 text-slate-500">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/credit-sales/${encodeURIComponent(c.id)}`}
                    aria-label="View credit"
                    className="inline-flex text-slate-400 hover:text-slate-700"
                  >
                    <Eye size={18} />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}