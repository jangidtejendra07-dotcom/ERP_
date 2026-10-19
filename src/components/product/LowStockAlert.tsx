import { AlertTriangle } from "lucide-react";

type Props = {
  lowStock: number;
  outOfStock: number;
  onShowLow: () => void;
  onShowOut: () => void;
};

export default function LowStockAlert({ lowStock, outOfStock, onShowLow, onShowOut }: Props) {
  if (lowStock + outOfStock === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle size={18} className="shrink-0" />
      <p className="flex-1">
        <span className="font-semibold">Restock needed:</span>{" "}
        {lowStock > 0 && `${lowStock} product${lowStock > 1 ? "s" : ""} running low`}
        {lowStock > 0 && outOfStock > 0 && " and "}
        {outOfStock > 0 && `${outOfStock} out of stock`}.
      </p>
      <div className="flex gap-2">
        {lowStock > 0 && (
          <button onClick={onShowLow} className="rounded-md bg-white px-3 py-1 font-medium shadow-sm hover:bg-amber-100">
            View low stock
          </button>
        )}
        {outOfStock > 0 && (
          <button onClick={onShowOut} className="rounded-md bg-white px-3 py-1 font-medium shadow-sm hover:bg-amber-100">
            View out of stock
          </button>
        )}
      </div>
    </div>
  );
}