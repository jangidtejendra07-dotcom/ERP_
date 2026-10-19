import type { ImportCell } from "@/types/import";

export type RawSheet = ImportCell[][]; // saari rows, header ke saath (index 0 = Excel row 1)

const MAX_BYTES = 8 * 1024 * 1024;

function clean(v: unknown): ImportCell {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
  // exceljs ke special cells: formula, hyperlink, rich text
  if (typeof v === "object") {
    const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[]; error?: unknown };
    if (o.richText) return clean(o.richText.map((r) => r.text).join(""));
    if (o.result !== undefined) return clean(o.result);
    if (o.text !== undefined) return clean(o.text);
    return null;
  }
  if (typeof v === "number" || typeof v === "boolean") return v;
  const s = String(v).trim();
  return s === "" ? null : s;
}

// Simple CSV parser (quotes aur commas sambhalta hai)
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cur);
      cur = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else cur += ch;
  }
  if (cur !== "" || row.length > 0) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

export function isCsv(file: File): boolean {
  return /\.(csv|txt)$/i.test(file.name) || file.type === "text/csv";
}

// exceljs bhaari hai, isliye sirf import page par, jab file chuni jaye tab load hota hai
async function loadWorkbook(file: File) {
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  return wb;
}

export async function getSheetNames(file: File): Promise<string[]> {
  if (file.size > MAX_BYTES) throw new Error("File 8 MB se badi hai. Chhoti files me tod ke daalo.");
  if (isCsv(file)) return ["CSV"];
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Sirf .xlsx ya .csv file chalegi. (.xls ho to Excel me 'Save as .xlsx' karo)");
  try {
    const wb = await loadWorkbook(file);
    const names = wb.worksheets.map((w) => w.name);
    if (names.length === 0) throw new Error("File me koi sheet nahi mili");
    return names;
  } catch (e) {
    throw new Error(`File padh nahi paye (${(e as Error).message}). Excel me kholke 'Save as .xlsx' karke dobara try karo.`);
  }
}

export async function readSheet(file: File, sheetIndex: number): Promise<RawSheet> {
  if (isCsv(file)) {
    return parseCsv(await file.text()).map((r) => r.map(clean));
  }
  const wb = await loadWorkbook(file);
  const ws = wb.worksheets[sheetIndex];
  if (!ws) throw new Error("Sheet nahi mili");
  const width = ws.actualColumnCount || ws.columnCount;
  const out: RawSheet = [];
  const last = ws.actualRowCount ? ws.rowCount : 0;
  for (let r = 1; r <= last; r++) {
    const row = ws.getRow(r);
    const cells: ImportCell[] = [];
    for (let c = 1; c <= width; c++) cells.push(clean(row.getCell(c).value));
    out.push(cells);
  }
  return out;
}

// Header row ka andaza: shuru ki 10 rows me jisme sabse zyada text cells ho
export function guessHeaderRow(sheet: RawSheet): number {
  let best = 0;
  let bestScore = -1;
  sheet.slice(0, 10).forEach((r, i) => {
    const score = r.filter((c) => typeof c === "string" && c.trim() !== "").length;
    if (score > bestScore) {
      best = i;
      bestScore = score;
    }
  });
  return best;
}

export function headersOf(sheet: RawSheet, headerRow: number): string[] {
  const raw = sheet[headerRow] ?? [];
  const seen = new Map<string, number>();
  return raw.map((c, i) => {
    let h = c === null ? `Column ${i + 1}` : String(c).trim();
    const k = h.toLowerCase();
    const n = (seen.get(k) ?? 0) + 1;
    seen.set(k, n);
    if (n > 1) h = `${h} (${n})`;
    return h;
  });
}

export function downloadCsv(filename: string, rows: string[][]) {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}