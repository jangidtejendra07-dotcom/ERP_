import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import HowItWorks from "@/components/ui/HowItWorks";
import ImportWizard from "@/components/import/ImportWizard";

export default function ImportPage() {
  return (
    <div className="space-y-5">
      <Link href="/inventory" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={14} /> Back to Inventory
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Import Excel</h1>
        <p className="text-sm text-slate-500">Poori Excel / CSV file ek saath inventory me jodo. Naye columns apne-aap ban jate hain.</p>
      </div>

      <HowItWorks
        id="inventory-import"
        title="Import kaise karein"
        steps={[
          "Excel (.xlsx) ya CSV file chuno. Pehli row me column ke naam hone chahiye (Name, Price, Size, Color...).",
          "Branch aur stock type chuno. Category ke 2 tarike hain: (a) Excel me 'Category' naam ka column ho to har row apni category me jayegi, nayi category apne-aap ban jayegi; (b) column na ho to upar se ek category chuno (ya nayi banao), poori file usme jayegi.",
          "Har Excel column ke saamne chuno: ERP ka kaunsa column hai. Jo column ERP me nahi hai wo '+ Naya column banao' rakho, system use us category me bana dega aur type (text, number, select...) khud pehchan lega.",
          "'Check file' dabao. Kuch save nahi hota; bas dikhta hai kitni rows sahi hain, kaun se naye columns banenge, aur galat rows kyu galat hain.",
          "Sab theek lage to 'Import' dabao. Sahi rows judti hain, galat rows chhod di jati hain (unki list download kar sakte ho).",
        ]}
        appearsIn={[
          "Inventory list me saare naye products, naye columns ke saath.",
          "Categories page: nayi categories aur unke product count (wahi categories jo aap Categories page par banate ho).",
          "Dashboard: Total Products, Stock Value, recently added list, category-wise ginti.",
          "Branches aur Categories ke count aur value me.",
          "Naye select columns Inventory me filter ke roop me bhi milenge.",
        ]}
        note="Quantity wale column ko 'Quantity (opening stock)' se jodo. Price/Quantity na jodo to 0 maane jate hain (Quantity 0, alert 5). Jo SKU pehle se hai us row ko duplicate maan ke chhod diya jata hai."
      />

      <Suspense fallback={<p className="text-sm text-slate-500">Loading...</p>}>
        <ImportWizard />
      </Suspense>
    </div>
  );
}