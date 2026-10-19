import { ValidationError } from "./errors";
import { cleanCategory, newFieldFor, rand } from "./categories";
import { isRealDate, randomCode, validate, type Snapshot } from "./products";
import {
  FILTERABLE_TYPES,
  type Category,
  type CategoryField,
  type CustomValue,
  type FieldType,
} from "@/types/category";
import type {
  ImportCategoryResult,
  ImportCell,
  ImportNewField,
  ImportRequest,
  ImportResult,
  ImportRow,
  ImportRowResult,
  SystemTarget,
} from "@/types/import";
import type { Product, ProductInput } from "@/types/product";

const MAX_ROWS = 5000;
const SYSTEM: SystemTarget[] = ["category", "name", "sku", "imei", "costPrice", "sellingPrice", "quantity", "lowStockThreshold", "receivedAt"];
const FIELD_TYPES: FieldType[] = ["text", "number", "decimal", "date", "boolean", "select", "multiselect"];

const isEmpty = (c: ImportCell | undefined) => c === null || c === undefined || String(c).trim() === "";
const str = (c: ImportCell | undefined) => (isEmpty(c) ? "" : String(c).trim());

function parseNum(c: ImportCell | undefined): number | undefined {
  if (isEmpty(c)) return undefined;
  if (typeof c === "number") return c;
  const cleaned = String(c).replace(/[₹,\s]|rs\.?|inr/gi, "");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(`"${c}" number nahi hai`);
  return n;
}

const TRUE_WORDS = ["yes", "y", "true", "1", "haan", "ha"];
const FALSE_WORDS = ["no", "n", "false", "0", "nahi", "na"];

function toIsoDate(c: ImportCell): string | null {
  const s = String(c).trim();
  if (isRealDate(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // dd/mm/yyyy (India)
  if (m) {
    const iso = `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    return isRealDate(iso) ? iso : null; // 31/02/2026 jaisi galat date null
  }
  return null;
}

// Excel ki ek value ko column ke type ke hisaab se badalta hai
function coerce(f: CategoryField, cell: ImportCell | undefined): CustomValue | undefined {
  if (isEmpty(cell)) return undefined;
  const v = str(cell);
  switch (f.type) {
    case "text":
      return v;
    case "number": {
      const n = parseNum(cell);
      if (n === undefined || !Number.isInteger(n)) throw new Error(`${f.label}: "${v}" poora number nahi hai`);
      return n;
    }
    case "decimal": {
      const n = parseNum(cell);
      if (n === undefined) return undefined;
      return n;
    }
    case "date": {
      const d = toIsoDate(cell as ImportCell);
      if (!d || Number.isNaN(new Date(d).getTime())) throw new Error(`${f.label}: "${v}" date nahi hai (dd/mm/yyyy ya yyyy-mm-dd likho)`);
      return d;
    }
    case "boolean": {
      const l = v.toLowerCase();
      if (TRUE_WORDS.includes(l)) return true;
      if (FALSE_WORDS.includes(l)) return false;
      throw new Error(`${f.label}: "${v}" Yes/No nahi hai`);
    }
    case "select": {
      const hit = f.options.find((o) => o.toLowerCase() === v.toLowerCase());
      if (!hit) throw new Error(`${f.label}: "${v}" options me nahi hai (${f.options.join(", ")})`);
      return hit;
    }
    case "multiselect": {
      const parts = v.split(/[,;|]/).map((x) => x.trim()).filter(Boolean);
      const out: string[] = [];
      for (const p of parts) {
        const hit = f.options.find((o) => o.toLowerCase() === p.toLowerCase());
        if (!hit) throw new Error(`${f.label}: "${p}" options me nahi hai (${f.options.join(", ")})`);
        out.push(hit);
      }
      return out;
    }
  }
}

// Naye column ka type Excel ke data dekh ke andaza lagata hai
export function guessType(values: string[]): FieldType {
  const vals = values.map((v) => v.trim()).filter(Boolean);
  const n = vals.length;
  if (n === 0) return "text";

  // Kam rows ho to sab match karni chahiye; zyada rows me 80% match kaafi hai (baaki galat rows maani jayengi)
  const mostly = (pred: (v: string) => boolean) => {
    const ok = vals.filter(pred).length;
    return n < 5 ? ok === n : ok / n >= 0.8;
  };

  const wordBool = ["yes", "no", "true", "false", "y", "n", "haan", "nahi"];
  if (mostly((v) => wordBool.includes(v.toLowerCase()))) return "boolean";

  const isNum = (v: string) => Number.isFinite(Number(v.replace(/,/g, "")));
  const longOrZeroLed = (v: string) => v.replace(/[-.,]/g, "").length > 12 || /^0\d/.test(v);
  if (mostly(isNum) && !vals.some((v) => isNum(v) && longOrZeroLed(v))) {
    const nums = vals.filter(isNum);
    return nums.every((v) => Number.isInteger(Number(v.replace(/,/g, "")))) ? "number" : "decimal";
  }
  if (mostly((v) => toIsoDate(v) !== null)) return "date";

  const distinct = new Set(vals.map((v) => v.toLowerCase()));
  if (n >= 5 && distinct.size <= 10 && distinct.size <= n / 2 && vals.every((v) => v.length <= 40)) {
    return "select";
  }
  return "text";
}

function distinctValues(values: string[], split: boolean): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const parts = split ? raw.split(/[,;|]/) : [raw];
    for (const p of parts.map((x) => x.trim()).filter(Boolean)) {
      if (!seen.has(p.toLowerCase())) {
        seen.add(p.toLowerCase());
        out.push(p);
      }
    }
  }
  return out;
}

const MAX_NEW_CATEGORIES = 30;

type Plan = {
  category: Category;
  isNew: boolean;
  fieldMap: { column: string; field: CategoryField }[];
  newFields: ImportNewField[];
  rows: ImportRow[];
  valid: number;
};

export type DB = Snapshot;
export type ImportOutcome = { result: ImportResult; work: DB; newProducts: Product[] };

export function executeImport(req: ImportRequest, db: DB): ImportOutcome {
  if (!req || !Array.isArray(req.rows) || !Array.isArray(req.mapping)) {
    throw new ValidationError("Invalid import request");
  }
  if (req.rows.length === 0) throw new ValidationError("File me koi data row nahi mili");
  if (req.rows.length > MAX_ROWS) throw new ValidationError(`Ek baar me max ${MAX_ROWS} rows import ho sakti hain`);

  const work: DB = { ...structuredClone({ categories: db.categories, branches: db.branches, vendors: db.vendors }), products: [...db.products] };
  const newProducts: Product[] = [];

  // ----- Branch / type / vendor (ek hi baar check) -----
  const branch = work.branches.find((b) => b.id === req.branchId);
  if (!branch) throw new ValidationError("Branch chuno");
  if (!branch.isActive) throw new ValidationError(`Branch "${branch.name}" inactive hai`);
  if (req.type !== "internal" && req.type !== "external") throw new ValidationError("Stock type chuno");
  if (req.type === "external" && !work.vendors.some((v) => v.id === req.vendorId)) {
    throw new ValidationError("Consignment maal ke liye vendor chuno");
  }

  // ----- Mapping check -----
  const usedSystem = new Set<SystemTarget>();
  const usedFields = new Set<string>();
  const sysMap: { column: string; field: SystemTarget }[] = [];
  const fixedFieldIds: { column: string; fieldId: string }[] = [];
  const newMap: { column: string; label: string; type: FieldType | "auto" }[] = [];

  for (const m of req.mapping) {
    if (!m || typeof m.column !== "string") throw new ValidationError("Invalid mapping");
    if (m.target === "skip") continue;
    if (m.target === "system") {
      if (!SYSTEM.includes(m.field)) throw new ValidationError("Invalid column target");
      if (usedSystem.has(m.field)) throw new ValidationError("Ek ERP column ek hi Excel column se judega");
      usedSystem.add(m.field);
      sysMap.push({ column: m.column, field: m.field });
    } else if (m.target === "field") {
      if (usedFields.has(m.fieldId)) throw new ValidationError("Ek category column do Excel columns se judne wala hai");
      usedFields.add(m.fieldId);
      fixedFieldIds.push({ column: m.column, fieldId: m.fieldId });
    } else if (m.target === "new") {
      if (m.type !== "auto" && !FIELD_TYPES.includes(m.type)) throw new ValidationError("Invalid column type");
      const label = String(m.label ?? "").trim();
      if (!label) throw new ValidationError(`"${m.column}" ke naye column ka naam likho`);
      newMap.push({ column: m.column, label, type: m.type });
    } else {
      throw new ValidationError("Invalid mapping");
    }
  }
  if (!usedSystem.has("name")) throw new ValidationError("'Product name' ke liye ek Excel column chuno");
  const multi = usedSystem.has("category");
  if (multi && fixedFieldIds.length > 0) {
    throw new ValidationError("Category column wale import me custom columns naam se judte hain (\"+ Naya column\" use karo)");
  }
  const catColumn = sysMap.find((s) => s.field === "category")?.column;

  // ----- Default category (agar di ho) -----
  const byName = (name: string) => work.categories.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  const plans = new Map<string, Plan>(); // key: category id
  let newCategories = 0;

  function planFor(name: string): Plan {
    let cat = byName(name);
    let isNew = false;
    if (!cat) {
      if (++newCategories > MAX_NEW_CATEGORIES) {
        throw new ValidationError(
          `Category column me ${MAX_NEW_CATEGORIES} se zyada nayi categories hain. Shayad galat column chuna hai?`
        );
      }
      const now = new Date().toISOString();
      cat = {
        id: `cat-${rand()}`,
        ...cleanCategory({ name }, work.categories),
        fields: [],
        createdAt: now,
        updatedAt: now,
      };
      work.categories.push(cat);
      isNew = true;
    }
    let plan = plans.get(cat.id);
    if (!plan) {
      plan = { category: cat, isNew, fieldMap: [], newFields: [], rows: [], valid: 0 };
      plans.set(cat.id, plan);
    }
    return plan;
  }

  let defaultName = "";
  if (typeof req.newCategoryName === "string" && req.newCategoryName.trim()) {
    defaultName = req.newCategoryName.trim();
  } else if (req.categoryId) {
    const found = work.categories.find((c) => c.id === req.categoryId);
    if (!found) throw new ValidationError("Chuni hui category nahi mili");
    defaultName = found.name;
  }
  if (!multi && !defaultName) throw new ValidationError("Category chuno ya naya naam likho");

  // ----- Rows ko categories me bantna -----
  const rowPlans = new Map<ImportRow, Plan | string>(); // Plan ya error message
  for (const r of req.rows) {
    const raw = multi ? str(r.cells?.[catColumn as string]) : "";
    const name = raw || defaultName;
    if (!name) {
      rowPlans.set(r, "Category khali hai (Excel me bharo ya upar default category chuno)");
      continue;
    }
    try {
      const plan = planFor(name);
      plan.rows.push(r);
      rowPlans.set(r, plan);
    } catch (e) {
      if (e instanceof ValidationError && /zyada nayi/.test(e.message)) throw e;
      rowPlans.set(r, `Category "${name}": ${(e as Error).message}`);
    }
  }

  // ----- Har category ke columns taiyar karo -----
  for (const plan of plans.values()) {
    const cat = plan.category;
    for (const fx of fixedFieldIds) {
      const f = cat.fields.find((x) => x.id === fx.fieldId && x.isActive);
      if (!f) throw new ValidationError("Chuna hua column is category me nahi mila");
      plan.fieldMap.push({ column: fx.column, field: f });
    }
    for (const nm of newMap) {
      // Pehle se is naam ka column ho to wahi use karo, warna naya banao
      const existing = cat.fields.find((f) => f.label.toLowerCase() === nm.label.toLowerCase());
      if (existing) {
        if (!existing.isActive) {
          throw new ValidationError(`"${existing.label}" column "${cat.name}" me band (inactive) hai. Pehle use Categories page par active karo.`);
        }
        if (!plan.fieldMap.some((x) => x.field.id === existing.id)) plan.fieldMap.push({ column: nm.column, field: existing });
        continue;
      }
      const values = plan.rows.map((r) => str(r.cells[nm.column])).filter(Boolean);
      if (values.length === 0) continue; // is category ki rows me ye column khali hai, banane ki zarurat nahi
      let type: FieldType = nm.type === "auto" ? guessType(values) : nm.type;
      let options: string[] = [];
      if (type === "select" || type === "multiselect") {
        options = distinctValues(values, type === "multiselect");
        if (options.length === 0 || options.length > 50) {
          type = "text";
          options = [];
        }
      }
      const field = newFieldFor(cat.fields, {
        label: nm.label,
        type,
        options,
        showInTable: true,
        showInFilter: FILTERABLE_TYPES.includes(type),
      });
      cat.fields.push(field);
      plan.fieldMap.push({ column: nm.column, field });
      plan.newFields.push({ column: nm.column, label: field.label, type, options });
    }
  }

  // ----- Row by row -----
  const results: ImportRowResult[] = [];
  const now = new Date().toISOString();

  for (const r of req.rows) {
    const errors: string[] = [];
    const planOrErr = rowPlans.get(r) as Plan | string;
    const cell = (col: string) => r.cells?.[col];
    const sys: Partial<Record<SystemTarget, ImportCell | undefined>> = {};
    for (const s of sysMap) sys[s.field] = cell(s.column);
    const name = str(sys.name);

    if (typeof planOrErr === "string") {
      results.push({ row: r.row, name: name || "(naam nahi)", category: "—", ok: false, errors: [planOrErr] });
      continue;
    }
    const plan = planOrErr;

    const num = (key: "costPrice" | "sellingPrice" | "quantity" | "lowStockThreshold", dflt: number) => {
      try {
        const n = parseNum(sys[key]);
        return n === undefined ? dflt : n;
      } catch (e) {
        errors.push(`${key}: ${(e as Error).message}`);
        return dflt;
      }
    };

    const receivedAtOf = (): string | undefined => {
      if (isEmpty(sys.receivedAt)) return undefined; // khali ho to aaj ki date
      const d = toIsoDate(sys.receivedAt as ImportCell);
      if (!d || Number.isNaN(new Date(d).getTime())) {
        errors.push(`Maal aane ki date: "${str(sys.receivedAt)}" date nahi hai (dd/mm/yyyy ya yyyy-mm-dd likho)`);
        return undefined;
      }
      return d;
    };

    const custom: Record<string, CustomValue> = {};
    for (const fm of plan.fieldMap) {
      try {
        const v = coerce(fm.field, cell(fm.column));
        if (v !== undefined) custom[fm.field.key] = v;
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    const input: ProductInput = {
      name,
      sku: str(sys.sku),
      imei: str(sys.imei) || null,
      categoryId: plan.category.id,
      branchId: branch.id,
      type: req.type,
      vendorId: req.type === "external" ? (req.vendorId ?? null) : null,
      costPrice: num("costPrice", 0),
      sellingPrice: num("sellingPrice", 0),
      quantity: num("quantity", 0),
      lowStockThreshold: num("lowStockThreshold", 5),
      receivedAt: receivedAtOf(),
      custom,
    };

    if (errors.length === 0) {
      try {
        const clean = validate(input, work);
        const product: Product = {
          id: `PRD-${randomCode(8)}`,
          ...clean,
          createdAt: now,
          updatedAt: now,
        };
        work.products.push(product); // aage ki rows ka duplicate SKU pakadne ke liye
        newProducts.push(product);
        plan.valid++;
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Invalid row");
      }
    }
    results.push({ row: r.row, name: name || "(naam nahi)", category: plan.category.name, ok: errors.length === 0, errors });
  }

  const valid = results.filter((x) => x.ok).length;
  const categories: ImportCategoryResult[] = [...plans.values()].map((p) => ({
    id: p.isNew ? null : p.category.id,
    name: p.category.name,
    isNew: p.isNew,
    total: p.rows.length,
    valid: p.valid,
    newFields: p.newFields,
  }));

  return {
    work,
    newProducts,
    result: {
      total: results.length,
      valid,
      invalid: results.length - valid,
      created: 0,
      branchName: branch.name,
      categories,
      results,
    },
  };
}