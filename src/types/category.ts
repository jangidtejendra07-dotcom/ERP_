export type FieldType = "text" | "number" | "decimal" | "date" | "boolean" | "select" | "multiselect";

export const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "Text",
  number: "Number (whole)",
  decimal: "Decimal",
  date: "Date",
  boolean: "Yes / No",
  select: "Single select",
  multiselect: "Multi select",
};

// In types par filter ban sakta hai
export const FILTERABLE_TYPES: FieldType[] = ["text", "select", "multiselect", "boolean"];

export type CustomValue = string | number | boolean | string[] | null;

export type CategoryField = {
  id: string;
  key: string; // stable internal key, rename par nahi badalta
  label: string; // editable display naam
  type: FieldType;
  required: boolean;
  options: string[]; // select / multiselect ke liye
  showInTable: boolean;
  showInFilter: boolean;
  isActive: boolean; // delete nahi, sirf hide/deactivate (purani values bachi rehti hain)
};

export type Category = {
  id: string;
  name: string;
  description: string;
  fields: CategoryField[]; // array ka order hi column order hai
  createdAt: string;
  updatedAt: string;
};

export type CategoryView = Category & {
  productCount: number;
  units: number;
  lowStock: number;
  outOfStock: number;
};

export type CategoryInput = {
  name: string;
  description?: string;
};

export type FieldInput = {
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  showInTable?: boolean;
  showInFilter?: boolean;
  isActive?: boolean;
};