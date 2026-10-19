import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";
import HowItWorks from "@/components/ui/HowItWorks";
import ProductForm from "@/components/product/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">New Product</h1>
        <p className="text-sm text-slate-500">Ek product ek baar me jodne ka form.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p>
          <span className="font-semibold">Bahut saare products hain?</span> Ek-ek karke mat bharo. Poori Excel file{" "}
          <span className="font-semibold">Import</span> se ek saath add ho sakti hai.
        </p>
        <Link
          href="/inventory/import"
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-medium text-indigo-700 shadow-sm hover:bg-indigo-100"
        >
          <FileSpreadsheet size={16} /> Import Excel
        </Link>
      </div>

      <HowItWorks
        id="inventory-new"
        title="Product kaise jodein"
        steps={[
          "Product ka naam likho.",
          "Category chuno. Category chunte hi us category ke apne columns (jaise Brand, Storage, Size) neeche aa jate hain. Category nahi dikh rahi to pehle Categories page par banao.",
          "Branch chuno: ye maal kis jagah rakha hai.",
          "Type chuno: Internal (apna maal) ya Consignment (vendor ka maal; vendor chunna padega).",
          "Cost price (kharid) aur Selling price (bikri) ₹ me bharo. Margin neeche apne-aap dikhega.",
          "Quantity (abhi kitna stock hai) aur Low-stock alert (kitne par warning chahiye) bharo.",
          "Save dabao. Aap Inventory list par pahunch jaoge aur batayega ki product kaha-kaha dikhega.",
        ]}
        appearsIn={[
          "Inventory list: category aur branch ke saath.",
          "Dashboard: product count, stock value, alerts.",
          "Branches / Categories: unke count aur value me.",
          "Sales / Credit Sales: bechne ke liye select ho sakega.",
        ]}
        note="IMEI sirf phones jaise items ke liye hai; unique hona chahiye. SKU khali chhodo to apne-aap ban jata hai."
      />

      <ProductForm />
    </div>
  );
}