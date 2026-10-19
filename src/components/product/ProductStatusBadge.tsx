import clsx from "clsx";
import { STOCK_STATUS_LABEL, type StockStatus } from "@/types/product";

const STYLES: Record<StockStatus, string> = {
  in_stock: "bg-green-50 text-green-600",
  low_stock: "bg-amber-50 text-amber-600",
  out_of_stock: "bg-red-50 text-red-600",
};

export default function ProductStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={clsx("rounded-full px-2.5 py-0.5 text-xs font-medium", STYLES[status])}>
      {STOCK_STATUS_LABEL[status]}
    </span>
  );
}