import { ValidationError } from "./errors";
import {
  FILTERABLE_TYPES,
  type Category,
  type CategoryField,
  type CategoryInput,
  type FieldInput,
  type FieldType,
} from "@/types/category";

const FIELD_TYPES: FieldType[] = ["text", "number", "decimal", "date", "boolean", "select", "multiselect"];
export const MAX_FIELDS = 30;
export const rand = () => crypto.randomUUID().slice(0, 8);

export function cleanCategory(input: CategoryInput, categories: Category[], selfId?: string) {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 50) throw new ValidationError("name is required (max 50 characters)");
  if (categories.some((c) => c.id !== selfId && c.name.toLowerCase() === name.toLowerCase())) {
    throw new ValidationError(`A category named "${name}" already exists`);
  }
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (description.length > 200) throw new ValidationError("description is too long (max 200)");
  return { name, description };
}

// Stable key: label se banta hai, baad me label badalne par key nahi badalti
export function makeKey(label: string, taken: Set<string>): string {
  let base = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field";
  if (/^\d/.test(base)) base = `f_${base}`;
  let key = base;
  let n = 2;
  while (taken.has(key)) key = `${base}_${n++}`;
  return key;
}

export function cleanField(input: FieldInput, fields: CategoryField[], selfId: string | null) {
  const label = typeof input.label === "string" ? input.label.trim() : "";
  if (!label || label.length > 40) throw new ValidationError("label is required (max 40 characters)");
  if (fields.some((f) => f.id !== selfId && f.label.toLowerCase() === label.toLowerCase())) {
    throw new ValidationError(`A column named "${label}" already exists`);
  }
  if (!FIELD_TYPES.includes(input.type)) throw new ValidationError("Invalid column type");

  let options: string[] = [];
  if (input.type === "select" || input.type === "multiselect") {
    const raw = Array.isArray(input.options) ? input.options : [];
    options = [...new Set(raw.map((o) => (typeof o === "string" ? o.trim() : "")).filter(Boolean))];
    if (options.length < 1) throw new ValidationError("Add at least one option");
    if (options.length > 50 || options.some((o) => o.length > 40)) {
      throw new ValidationError("Max 50 options, each up to 40 characters");
    }
  }

  return {
    label,
    type: input.type,
    required: Boolean(input.required),
    options,
    showInTable: input.showInTable ?? true,
    showInFilter: FILTERABLE_TYPES.includes(input.type) && Boolean(input.showInFilter),
    isActive: input.isActive ?? true,
  };
}

// Import ke liye: naya column memory me banata hai (save caller karta hai)
export function newFieldFor(fields: CategoryField[], input: FieldInput): CategoryField {
  if (fields.length >= MAX_FIELDS) throw new ValidationError(`Max ${MAX_FIELDS} columns per category`);
  const data = cleanField(input, fields, null);
  return {
    id: `fld-${rand()}`,
    key: makeKey(data.label, new Set(fields.map((f) => f.key))),
    ...data,
  };
}