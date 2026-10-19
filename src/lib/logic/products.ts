import { ValidationError } from "./errors";
import type { Branch } from "@/types/branch";
import type { Category, CategoryField, CustomValue } from "@/types/category";
import type { Vendor } from "@/types/vendor";
import type {
  Product,
  ProductFilter,
  ProductInput,
  ProductStats,
  ProductView,
  StockStatus,
} from "@/types/product";

const cents = (n: number) => Math.round(n * 100);
const money = (n: number) => cents(n) / 100;
export const randomCode = (len: number) => crypto.randomUUID().replace(/-/g, "").slice(0, len).toUpperCase();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Asli date hai ya nahi (31/02 jaisi galat date pakadne ke liye)
export function isRealDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
const localToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function statusOf(p: Pick<Product, "quantity" | "lowStockThreshold">): StockStatus {
  if (p.quantity <= 0) return "out_of_stock";
  if (p.quantity <= p.lowStockThreshold) return "low_stock";
  return "in_stock";
}

// Category ke custom filters (sirf active + showInFilter fields, aur sirf jab category chuni ho)
export function matchesCustom(p: Product, fields: CategoryField[], custom: Record<string, string>): boolean {
  for (const [key, wanted] of Object.entries(custom)) {
    if (!wanted) continue;
    const f = fields.find((x) => x.key === key && x.isActive && x.showInFilter);
    if (!f) continue;
    const have = p.custom[key];
    if (f.type === "boolean") {
      if (String(have === true) !== String(wanted === "true")) return false;
    } else if (f.type === "select") {
      const options = wanted.split(",");
      if (typeof have !== "string" || !options.includes(have)) return false;
    } else if (f.type === "multiselect") {
      const options = wanted.split(",");
      if (!Array.isArray(have) || !have.some((v) => options.includes(v))) return false;
    } else if (f.type === "text") {
      if (typeof have !== "string" || !have.toLowerCase().includes(wanted.toLowerCase())) return false;
    }
  }
  return true;
}

// Custom columns ki values ko category ke fields ke hisaab se check karta hai.
// Purani values (inactive fields ya baaki keys) bachi rehti hain.
function cleanCustom(
  fields: CategoryField[],
  input: Record<string, CustomValue> | undefined,
  existing: Record<string, CustomValue>
): Record<string, CustomValue> {
  const out: Record<string, CustomValue> = { ...existing };
  const given = input && typeof input === "object" ? input : {};

  for (const f of fields.filter((x) => x.isActive)) {
    const raw = given[f.key];
    const empty =
      raw === undefined || raw === null || raw === "" || (Array.isArray(raw) && raw.length === 0);

    if (empty) {
      if (f.required) throw new ValidationError(`${f.label} is required`);
      delete out[f.key];
      continue;
    }

    const old = existing[f.key];
    switch (f.type) {
      case "text": {
        if (typeof raw !== "string" || raw.trim().length > 200) {
          throw new ValidationError(`${f.label} must be text (max 200 characters)`);
        }
        out[f.key] = raw.trim();
        break;
      }
      case "number": {
        if (typeof raw !== "number" || !Number.isInteger(raw)) {
          throw new ValidationError(`${f.label} must be a whole number`);
        }
        out[f.key] = raw;
        break;
      }
      case "decimal": {
        if (typeof raw !== "number" || !Number.isFinite(raw)) {
          throw new ValidationError(`${f.label} must be a number`);
        }
        out[f.key] = raw;
        break;
      }
      case "date": {
        if (typeof raw !== "string" || !isRealDate(raw)) {
          throw new ValidationError(`${f.label} must be a valid date`);
        }
        out[f.key] = raw;
        break;
      }
      case "boolean": {
        if (typeof raw !== "boolean") throw new ValidationError(`${f.label} must be yes or no`);
        out[f.key] = raw;
        break;
      }
      case "select": {
        // Option hata di gayi ho tab bhi purani value rakh sakte hain
        if (typeof raw !== "string" || (!f.options.includes(raw) && raw !== old)) {
          throw new ValidationError(`${f.label}: choose one of the listed options`);
        }
        out[f.key] = raw;
        break;
      }
      case "multiselect": {
        const oldList = Array.isArray(old) ? old : [];
        if (
          !Array.isArray(raw) ||
          raw.some((v) => typeof v !== "string" || (!f.options.includes(v) && !oldList.includes(v)))
        ) {
          throw new ValidationError(`${f.label}: choose from the listed options`);
        }
        out[f.key] = [...new Set(raw)];
        break;
      }
    }
  }
  return out;
}

// validate ko jo data chahiye (ab ye Supabase se aata hai)
export type Snapshot = { vendors: Vendor[]; categories: Category[]; branches: Branch[]; products: Pick<Product, "id" | "sku" | "imei">[] };

export type Clean = Omit<Product, "id" | "createdAt" | "updatedAt">;

export function validate(input: ProductInput, db: Snapshot, existing?: Pick<Product, "id" | "categoryId" | "branchId" | "custom"> & { receivedAt?: string }): Clean {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 120) throw new ValidationError("name is required (max 120 characters)");

  const category = db.categories.find((c) => c.id === input.categoryId);
  if (!category) throw new ValidationError("Select a valid category");

  const branch = db.branches.find((b) => b.id === input.branchId);
  if (!branch) throw new ValidationError("Select a valid branch");
  if (!branch.isActive && existing?.branchId !== branch.id) {
    throw new ValidationError(`Branch "${branch.name}" is inactive`);
  }

  if (input.type !== "internal" && input.type !== "external") {
    throw new ValidationError("type must be internal or external");
  }

  let vendorId: string | null = null;
  if (input.type === "external") {
    if (!db.vendors.some((v) => v.id === input.vendorId)) {
      throw new ValidationError("A valid vendor is required for consignment (external) products");
    }
    vendorId = input.vendorId as string;
  }

  const num = (v: unknown, label: string) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0) {
      throw new ValidationError(`${label} must be 0 or more`);
    }
    return v;
  };
  const costPrice = money(num(input.costPrice, "costPrice"));
  const sellingPrice = money(num(input.sellingPrice, "sellingPrice"));

  const whole = (v: unknown, label: string) => {
    if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
      throw new ValidationError(`${label} must be a whole number, 0 or more`);
    }
    return v;
  };
  const quantity = whole(input.quantity, "quantity");
  const lowStockThreshold = whole(input.lowStockThreshold, "lowStockThreshold");

  const imei = typeof input.imei === "string" && input.imei.trim() ? input.imei.trim() : null;
  if (imei && imei.length > 40) throw new ValidationError("imei/serial is too long");

  let sku = typeof input.sku === "string" ? input.sku.trim() : "";
  if (sku.length > 40) throw new ValidationError("sku is too long");
  if (!sku) sku = `SKU-${randomCode(6)}`;
  if (imei && db.products.some((p) => p.id !== existing?.id && p.imei === imei)) {
    throw new ValidationError(`IMEI/serial "${imei}" already exists`);
  }
  const dup = db.products.some((p) => p.id !== existing?.id && p.sku.toLowerCase() === sku.toLowerCase());
  if (dup) throw new ValidationError(`SKU "${sku}" already exists`);

  const receivedAt = typeof input.receivedAt === "string" && input.receivedAt.trim() ? input.receivedAt.trim() : (existing as { receivedAt?: string } | undefined)?.receivedAt ?? localToday();
  if (!isRealDate(receivedAt)) {
    throw new ValidationError("Maal aane ki date sahi nahi hai");
  }
  if (receivedAt > localToday()) throw new ValidationError("Maal aane ki date aaj se aage ki nahi ho sakti");

  // Category badli to purani category ke custom values chhod do
  const previous = existing && existing.categoryId === category.id ? existing.custom : {};
  const custom = cleanCustom(category.fields, input.custom, previous);

  return {
    name,
    sku,
    imei,
    categoryId: category.id,
    branchId: branch.id,
    type: input.type,
    vendorId,
    costPrice,
    sellingPrice,
    quantity,
    lowStockThreshold,
    receivedAt,
    custom,
  };
}