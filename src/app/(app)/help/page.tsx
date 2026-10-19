import Link from "next/link";

const FLOW = [
  { n: 1, title: "Branch banao", where: "Branches", href: "/branches", text: "Apni dukaan / godown ka naam jodo. Bina branch ke product nahi jud sakta." },
  { n: 2, title: "Category aur uske columns banao", where: "Categories", href: "/categories", text: "Clothes, Books, Phones... Har category ke apne columns (Size, Author, Storage) yahi banate hain." },
  { n: 3, title: "Vendor jodo (agar consignment maal hai)", where: "Vendors", href: "/vendors", text: "Jo maal vendor ka hai uska vendor yaha rakho. Apna maal ho to ye step chhod do." },
  { n: 4, title: "Product jodo", where: "Inventory", href: "/inventory", text: "Ek-ek karke '+ New Product' se, ya poori Excel 'Import Excel' se." },
  { n: 5, title: "Stock check karo", where: "Inventory", href: "/inventory", text: "Search aur filters lagao. Low stock ka peela alert dekho." },
  { n: 6, title: "Becho", where: "Sales / Credit Sales", href: "/sales", text: "Cash bikri Sales me, udhaar bikri Credit Sales me. Bikne par stock apne-aap ghatta hai." },
  { n: 7, title: "Hisaab dekho", where: "Dashboard", href: "/dashboard", text: "Total sales, profit, stock value aur alerts ek nazar me." },
];

const WHERE = [
  ["Naya branch banaya", "Branches list, Inventory ka Branch filter, Product form ka Branch dropdown"],
  ["Naya category / column banaya", "Categories, Product form, Inventory table aur filters"],
  ["Product jodha", "Inventory, Dashboard (count, stock value, alerts), Branches, Categories, Sales ka product list"],
  ["Bikri ki", "Sales, Dashboard (revenue, profit), Branches (sales/revenue), Inventory (stock kam)"],
  ["Udhaar bikri ki", "Credit Sales (baaki rakam, payment, write-off), Dashboard, Inventory (stock kam)"],
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Training Guide</h1>
        <p className="text-sm text-slate-500">Isse padh ke koi bhi naya banda ERP chalana seekh sakta hai. Har page ke upar bhi chhota guide hai.</p>
      </div>

      <ol className="space-y-3">
        {FLOW.map((s) => (
          <li key={s.n} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">{s.n}</span>
            <div className="flex-1">
              <p className="font-semibold">{s.title}</p>
              <p className="text-sm text-slate-600">{s.text}</p>
            </div>
            <Link href={s.href} className="self-center whitespace-nowrap text-sm font-medium text-brand-600 hover:underline">{s.where} →</Link>
          </li>
        ))}
      </ol>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-3 font-medium">Aap ye karo</th><th className="px-4 py-3 font-medium">Ye yaha dikhega</th></tr>
          </thead>
          <tbody>
            {WHERE.map(([a, b]) => (
              <tr key={a} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{a}</td><td className="px-4 py-3 text-slate-600">{b}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}