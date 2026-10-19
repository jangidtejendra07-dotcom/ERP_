"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { fetchBranchOptions } from "@/features/branches/branches.service";
import { fetchCategories } from "@/features/categories/categories.service";
import { runImport } from "@/features/inventory/import.service";
import { fetchVendors } from "@/features/vendors/vendors.service";
import {
  downloadCsv,
  getSheetNames,
  guessHeaderRow,
  headersOf,
  readSheet,
  type RawSheet,
} from "@/lib/spreadsheet";
import { FIELD_TYPE_LABEL, type CategoryView, type FieldType } from "@/types/category";
import type { Branch } from "@/types/branch";
import type { ProductType } from "@/types/product";
import type { Vendor } from "@/types/vendor";
import {
  SYSTEM_TARGET_LABEL,
  type ColumnMap,
  type ImportRequest,
  type ImportResult,
  type SystemTarget,
} from "@/types/import";

const NEW_CATEGORY = "__new";
const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const ALIASES: Record<SystemTarget, string[]> = {
  category: ["category", "categories", "cat", "itemcategory", "productcategory", "group", "vibhag"],
  name: ["name", "productname", "product", "item", "itemname", "title", "naam", "productnaam"],
  sku: ["sku", "code", "itemcode", "productcode", "skucode"],
  imei: ["imei", "serial", "serialno", "serialnumber", "imeiserial", "imeino"],
  costPrice: ["cost", "costprice", "purchaseprice", "buyingprice", "purchase", "cp", "kharid", "costrs", "cost"],
  sellingPrice: ["price", "sellingprice", "saleprice", "sp", "mrp", "rate", "bikri", "sellingrs"],
  quantity: ["qty", "quantity", "stock", "openingstock", "units", "count", "maal"],
  lowStockThreshold: ["lowstock", "lowstockalert", "threshold", "minstock", "reorderlevel", "alertat", "lowstockthreshold"],
  receivedAt: ["date", "receiveddate", "receivedon", "receivedat", "stockdate", "purchasedate", "arrivaldate", "maalaanedate"],
};

// Header ke naam dekh ke pehle se mapping bhar deta hai
function autoMap(headers: string[], category: CategoryView | undefined): ColumnMap[] {
  const usedSys = new Set<SystemTarget>();
  const usedFld = new Set<string>();
  const fields = (category?.fields ?? []).filter((f) => f.isActive);
  // Excel me Category column ho to har row ki apni category hogi; tab custom columns naam se judte hain
  const multi = headers.some((h) => ALIASES.category.includes(norm(h)));

  const maps: ColumnMap[] = headers.map((h) => {
    const k = norm(h);
    const sys = (Object.keys(ALIASES) as SystemTarget[]).find((t) => !usedSys.has(t) && ALIASES[t].includes(k));
    if (sys) {
      usedSys.add(sys);
      return { column: h, target: "system", field: sys };
    }
    const f = multi ? undefined : fields.find((x) => !usedFld.has(x.id) && (norm(x.label) === k || norm(x.key) === k));
    if (f) {
      usedFld.add(f.id);
      return { column: h, target: "field", fieldId: f.id };
    }
    return { column: h, target: "new", label: h, type: "auto" };
  });

  // Naam wala column na mile to pehla (category ke alawa) column naam maan lo
  if (!usedSys.has("name") && maps.length > 0) {
    const i = maps.findIndex((m) => !(m.target === "system" && m.field === "category"));
    if (i >= 0) maps[i] = { column: headers[i], target: "system", field: "name" };
  }
  return maps;
}

// Category column mapped ho to "category ka maujooda column" wale mapping ko "naya/naam se column" bana do
function normalizeMap(maps: ColumnMap[], category: CategoryView | undefined): ColumnMap[] {
  const multi = maps.some((m) => m.target === "system" && m.field === "category");
  if (!multi) return maps;
  return maps.map((m) => {
    if (m.target !== "field") return m;
    const label = category?.fields.find((f) => f.id === m.fieldId)?.label ?? m.column;
    return { column: m.column, target: "new", label, type: "auto" };
  });
}

const encode = (m: ColumnMap) =>
  m.target === "system" ? `sys:${m.field}` : m.target === "field" ? `fld:${m.fieldId}` : m.target;

export default function ImportWizard() {
  const router = useRouter();
  const params = useSearchParams();

  const [categories, setCategories] = useState<CategoryView[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [sheet, setSheet] = useState<RawSheet | null>(null);
  const [headerRow, setHeaderRow] = useState(0);
  const [readError, setReadError] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [branchId, setBranchId] = useState("");
  const [type, setType] = useState<ProductType>("internal");
  const [vendorId, setVendorId] = useState("");

  const [mapping, setMapping] = useState<ColumnMap[]>([]);
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<"" | "check" | "import">("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCategories()
      .then((list) => {
        setCategories(list);
        const wanted = params.get("categoryId");
        if (wanted && list.some((c) => c.id === wanted)) setCategoryId(wanted);
      })
      .catch(() => setCategories([]));
    fetchBranchOptions()
      .then((list) => {
        setBranches(list);
        const first = list.find((b) => b.isActive);
        if (first) setBranchId(first.id);
      })
      .catch(() => setBranches([]));
    fetchVendors().then(setVendors).catch(() => setVendors([]));
  }, []);

  const category = categories.find((c) => c.id === categoryId);
  const headers = useMemo(() => (sheet ? headersOf(sheet, headerRow) : []), [sheet, headerRow]);
  const dataRows = useMemo(() => {
    if (!sheet) return [];
    return sheet
      .map((cells, i) => ({ cells, row: i + 1 }))
      .slice(headerRow + 1)
      .filter((r) => r.cells.some((c) => c !== null));
  }, [sheet, headerRow]);

  // File / header row / category badle to mapping dobara bhar do
  useEffect(() => {
    if (headers.length > 0) setMapping(autoMap(headers, category));
    setPreview(null);
  }, [headers, category]);

  async function onFile(f: File | null) {
    setFile(f);
    setSheet(null);
    setSheetNames([]);
    setPreview(null);
    setReadError("");
    setError("");
    if (!f) return;
    try {
      const names = await getSheetNames(f);
      setSheetNames(names);
      setSheetIndex(0);
      const rows = await readSheet(f, 0);
      if (rows.length < 2) throw new Error("File me header ke neeche koi data nahi mila.");
      setSheet(rows);
      setHeaderRow(guessHeaderRow(rows));
    } catch (e) {
      setReadError((e as Error).message || "File padh nahi paye");
    }
  }

  async function onSheetChange(i: number) {
    if (!file) return;
    setSheetIndex(i);
    setPreview(null);
    try {
      const rows = await readSheet(file, i);
      if (rows.length < 2) throw new Error("Is sheet me data nahi hai.");
      setSheet(rows);
      setHeaderRow(guessHeaderRow(rows));
      setReadError("");
    } catch (e) {
      setSheet(null);
      setReadError((e as Error).message);
    }
  }

  function setTarget(index: number, value: string) {
    setPreview(null);
    setMapping((prev) =>
      normalizeMap(
        prev.map((m, i) => {
          if (i !== index) return m;
          const column = m.column;
          if (value === "skip") return { column, target: "skip" };
          if (value === "new") return { column, target: "new", label: column, type: "auto" };
          if (value.startsWith("sys:")) return { column, target: "system", field: value.slice(4) as SystemTarget };
          return { column, target: "field", fieldId: value.slice(4) };
        }),
        category
      )
    );
  }

  function patchNew(index: number, change: { label?: string; type?: FieldType | "auto" }) {
    setPreview(null);
    setMapping((prev) =>
      prev.map((m, i) => (i === index && m.target === "new" ? { ...m, ...change } : m))
    );
  }

  const usedValues = new Set(mapping.map(encode).filter((v) => v !== "skip" && v !== "new"));
  const hasName = mapping.some((m) => m.target === "system" && m.field === "name");
  const multi = mapping.some((m) => m.target === "system" && m.field === "category");
  const categoryOk = categoryId === NEW_CATEGORY ? newCategoryName.trim().length > 0 : Boolean(category);
  const settingsOk = (multi || categoryOk) && Boolean(branchId) && (type === "internal" || Boolean(vendorId));
  const canCheck = Boolean(sheet) && settingsOk && hasName && dataRows.length > 0;

  function buildRequest(commit: boolean): ImportRequest {
    return {
      rows: dataRows.map((r) => {
        const cells: ImportRequest["rows"][number]["cells"] = {};
        headers.forEach((h, i) => (cells[h] = r.cells[i] ?? null));
        return { row: r.row, cells };
      }),
      mapping,
      categoryId: categoryId === NEW_CATEGORY ? undefined : categoryId,
      newCategoryName: categoryId === NEW_CATEGORY ? newCategoryName : undefined,
      branchId,
      type,
      vendorId: type === "external" ? vendorId : null,
      commit,
    };
  }

  async function onCheck() {
    setBusy("check");
    setError("");
    try {
      setPreview(await runImport(buildRequest(false)));
    } catch (e) {
      setPreview(null);
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function onImport() {
    setBusy("import");
    setError("");
    try {
      const res = await runImport(buildRequest(true));
      if (res.created === 0) {
        setPreview(res);
        setError("Koi sahi row nahi thi, isliye kuch import nahi hua.");
        setBusy("");
        return;
      }
      const qs = new URLSearchParams({
        imported: String(res.created),
        skipped: String(res.invalid),
        cat: res.categories.map((c) => c.name).join(", "),
        branch: res.branchName,
        newcols: [...new Set(res.categories.flatMap((c) => c.newFields.map((f) => f.label)))].join(", "),
      });
      router.push(`/inventory?${qs.toString()}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  }

  function downloadErrors() {
    if (!preview) return;
    downloadCsv("import-errors.csv", [
      ["Excel row", "Product", "Category", "Problem"],
      ...preview.results.filter((r) => !r.ok).map((r) => [String(r.row), r.name, r.category, r.errors.join(" | ")]),
    ]);
  }

  const failed = preview?.results.filter((r) => !r.ok) ?? [];
  const newCount = mapping.filter((m) => m.target === "new").length;

  return (
    <div className="space-y-6">
      {/* Step 1 */}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold">1. File chuno</h2>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:bg-slate-50">
          <FileSpreadsheet size={32} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">{file ? file.name : "Excel (.xlsx) ya CSV file yaha chuno"}</span>
          <span className="text-xs text-slate-400">Pehli row me column ke naam hone chahiye. Max 5000 rows.</span>
          <input
            type="file"
            accept=".xlsx,.csv,.txt"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {readError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{readError}</p>}

        {sheet && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-end gap-4 text-sm">
              {sheetNames.length > 1 && (
                <label className="space-y-1">
                  <span className="font-medium">Sheet</span>
                  <select value={sheetIndex} onChange={(e) => onSheetChange(Number(e.target.value))} className={selectClass}>
                    {sheetNames.map((n, i) => (
                      <option key={n} value={i}>{n}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="space-y-1">
                <span className="font-medium">Column ke naam kis row me hain?</span>
                <select value={headerRow} onChange={(e) => setHeaderRow(Number(e.target.value))} className={selectClass}>
                  {sheet.slice(0, 10).map((_, i) => (
                    <option key={i} value={i}>Row {i + 1}</option>
                  ))}
                </select>
              </label>
              <p className="pb-2 text-slate-500">{dataRows.length} data rows mili, {headers.length} columns.</p>
            </div>
          </div>
        )}
      </section>

      {sheet && (
        <>
          {/* Step 2 */}
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">2. Ye maal kahan jayega?</h2>
            {multi ? (
              <p className="rounded-lg bg-brand-50 p-2.5 text-sm text-brand-700">
                Aapki Excel me <b>Category</b> column mila: har row apni category me jayegi, aur jo category abhi ERP me nahi hai wo apne-aap ban jayegi.
                Neeche wali category sirf un rows ke liye hai jinka category khali ho (optional).
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Poori file ek category me jayegi. Alag-alag categories ek hi file me chahiye to Excel me ek &quot;Category&quot; column rakho.
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium">{multi ? "Default category (optional)" : "Category"}</span>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={selectClass}>
                  <option value="">Select category...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value={NEW_CATEGORY}>+ Nayi category banao</option>
                </select>
                <Link href="/categories" className="text-xs text-brand-600 hover:underline">Categories manage karo</Link>
              </label>
              {categoryId === NEW_CATEGORY && (
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Nayi category ka naam</span>
                  <input value={newCategoryName} onChange={(e) => { setNewCategoryName(e.target.value); setPreview(null); }} placeholder="Clothes, Books..." className={selectClass} />
                </label>
              )}
              <label className="space-y-1 text-sm">
                <span className="font-medium">Branch</span>
                <select value={branchId} onChange={(e) => { setBranchId(e.target.value); setPreview(null); }} className={selectClass}>
                  <option value="">Select branch...</option>
                  {branches.filter((b) => b.isActive).map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Stock type</span>
                <select value={type} onChange={(e) => { setType(e.target.value as ProductType); setPreview(null); }} className={selectClass}>
                  <option value="internal">Internal (apna maal)</option>
                  <option value="external">Consignment (vendor ka maal)</option>
                </select>
              </label>
              {type === "external" && (
                <label className="space-y-1 text-sm">
                  <span className="font-medium">Vendor</span>
                  <select value={vendorId} onChange={(e) => { setVendorId(e.target.value); setPreview(null); }} className={selectClass}>
                    <option value="">Select vendor...</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </section>

          {/* Step 3 */}
          <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-semibold">3. Excel ke har column ka kya karna hai?</h2>
              <p className="text-sm text-slate-500">
                Jo column ERP me pehle se hai usse jodo. Jo nahi hai wo <b>&quot;+ Naya column banao&quot;</b> rakho: system apne-aap
                us category me naya column bana dega aur uska type data dekh ke tay karega. Kuch nahi chahiye to Skip.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-3 py-2 font-medium">Excel column</th>
                    <th className="px-3 py-2 font-medium">Pehli values</th>
                    <th className="px-3 py-2 font-medium">ERP me kya banega</th>
                  </tr>
                </thead>
                <tbody>
                  {mapping.map((m, i) => {
                    const samples = dataRows.slice(0, 3).map((r) => r.cells[i]).filter((c) => c !== null).join(", ");
                    const value = encode(m);
                    const resolved = preview?.categories.flatMap((c) => c.newFields).find((f) => f.column === m.column);
                    return (
                      <tr key={m.column} className={clsx("border-t border-slate-100", m.target === "skip" && "opacity-60")}>
                        <td className="px-3 py-3 font-medium">{m.column}</td>
                        <td className="max-w-[220px] truncate px-3 py-3 text-slate-500">{samples || "—"}</td>
                        <td className="space-y-2 px-3 py-3">
                          <select value={value} onChange={(e) => setTarget(i, e.target.value)} className={selectClass}>
                            <optgroup label="ERP ke columns">
                              {(Object.keys(SYSTEM_TARGET_LABEL) as SystemTarget[]).map((t) => (
                                <option key={t} value={`sys:${t}`} disabled={usedValues.has(`sys:${t}`) && value !== `sys:${t}`}>
                                  {SYSTEM_TARGET_LABEL[t]}
                                </option>
                              ))}
                            </optgroup>
                            {!multi && category && category.fields.some((f) => f.isActive) && (
                              <optgroup label={`${category.name} ke columns`}>
                                {category.fields.filter((f) => f.isActive).map((f) => (
                                  <option key={f.id} value={`fld:${f.id}`} disabled={usedValues.has(`fld:${f.id}`) && value !== `fld:${f.id}`}>
                                    {f.label} ({FIELD_TYPE_LABEL[f.type]})
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <optgroup label="Aur">
                              <option value="new">+ Naya column banao</option>
                              <option value="skip">Skip (import mat karo)</option>
                            </optgroup>
                          </select>
                          {m.target === "new" && (
                            <div className="flex flex-wrap gap-2">
                              <input
                                value={m.label}
                                onChange={(e) => patchNew(i, { label: e.target.value })}
                                placeholder="Naye column ka naam"
                                className={clsx(selectClass, "max-w-[200px]")}
                              />
                              <select
                                value={m.type}
                                onChange={(e) => patchNew(i, { type: e.target.value as FieldType | "auto" })}
                                className={clsx(selectClass, "max-w-[200px]")}
                              >
                                <option value="auto">Type: auto detect{resolved ? ` → ${FIELD_TYPE_LABEL[resolved.type as FieldType]}` : ""}</option>
                                {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((t) => (
                                  <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!hasName && <p className="text-sm text-red-600">Kisi ek column ko &quot;Product name&quot; chuno.</p>}
            {newCount > 0 && (
              <p className="rounded-lg bg-brand-50 p-2.5 text-xs text-brand-700">
                {newCount} column naam se jude hain: category me is naam ka column pehle se hoga to wahi use hoga, warna naya ban jayega
                {multi ? " (har category me alag-alag)" : category ? ` ("${category.name}" me)` : ""}. Baad me Categories page se naam, type ya options badal sakte ho.
              </p>
            )}
          </section>

          {/* Step 4 */}
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">4. Check karo, phir import karo</h2>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onCheck}
                disabled={!canCheck || busy !== ""}
                className="flex items-center gap-2 rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50 disabled:opacity-50"
              >
                {busy === "check" && <Loader2 size={16} className="animate-spin" />} Check file (kuch save nahi hoga)
              </button>
              {!settingsOk && <span className="text-xs text-amber-600">Step 2 poora karo (category, branch{type === "external" ? ", vendor" : ""}).</span>}
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            {preview && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">Total rows</p><p className="text-xl font-bold">{preview.total}</p></div>
                  <div className="rounded-lg bg-green-50 p-3"><p className="text-xs text-green-700">Sahi (import hongi)</p><p className="text-xl font-bold text-green-700">{preview.valid}</p></div>
                  <div className="rounded-lg bg-red-50 p-3"><p className="text-xs text-red-700">Galat (chhodi jayengi)</p><p className="text-xl font-bold text-red-700">{preview.invalid}</p></div>
                </div>

                <div className="space-y-2">
                  {preview.categories.map((c) => (
                    <div key={c.name} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                      <p>
                        <b>{c.valid}</b> / {c.total} products <b>{c.name}</b>
                        {c.isNew && <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">nayi category banegi</span>} me,{" "}
                        <b>{preview.branchName}</b> branch me jud jayenge.
                      </p>
                      {c.newFields.length > 0 && (
                        <ul className="mt-2 list-inside list-disc text-slate-600">
                          {c.newFields.map((f) => (
                            <li key={f.column}>
                              Naya column <b>{f.label}</b> banega, type: {FIELD_TYPE_LABEL[f.type]}
                              {f.options.length > 0 && ` (options: ${f.options.slice(0, 8).join(", ")}${f.options.length > 8 ? "..." : ""})`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {failed.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-red-700">
                        <AlertTriangle size={16} /> Ye rows galat hain (Excel me theek karke dobara daal sakte ho)
                      </p>
                      <button onClick={downloadErrors} className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
                        <Download size={14} /> Errors download
                      </button>
                    </div>
                    <div className="max-h-64 overflow-auto rounded-lg border border-red-100">
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-red-50 text-xs uppercase text-red-700">
                          <tr><th className="px-3 py-2">Excel row</th><th className="px-3 py-2">Product</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Problem</th></tr>
                        </thead>
                        <tbody>
                          {failed.slice(0, 200).map((r) => (
                            <tr key={r.row} className="border-t border-red-50">
                              <td className="px-3 py-2">{r.row}</td>
                              <td className="px-3 py-2">{r.name}</td>
                              <td className="px-3 py-2">{r.category}</td>
                              <td className="px-3 py-2 text-red-600">{r.errors.join(" · ")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  onClick={onImport}
                  disabled={preview.valid === 0 || busy !== ""}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {busy === "import" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Import {preview.valid} products
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}