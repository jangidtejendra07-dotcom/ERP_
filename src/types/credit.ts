import type { SoldItem, StockLine } from "./stock";

export type CreditStatus = "active" | "partially_paid" | "paid" | "overdue" | "written_off";
export type CreditStatusFilter = CreditStatus | "all";
export type PaymentMethod = "cash" | "momo" | "card" | "bank";

export const STATUS_LABEL: Record<CreditStatus, string> = {
  active: "Active",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  written_off: "Written Off",
};

export type Payment = {
  id: string;
  receiptNumber: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string; // ISO
};

export type Credit = {
  id: string; // credit number e.g. CRD-20260404-47B7FEEA
  customerName: string;
  phone: string;
  total: number;
  dueDate: string | null; // yyyy-mm-dd
  createdAt: string; // ISO
  writtenOff: boolean;
  writtenOffAt: string | null;
  payments: Payment[];
  items?: SoldItem[]; // products jo is credit par diye gaye (stock se kate)
};

export type CreditView = Credit & {
  paid: number;
  balance: number;
  progress: number; // 0-100
  status: CreditStatus;
};

export type CreditStats = {
  activeCount: number;
  totalCount: number;
  outstanding: number;
  totalAmount: number;
  collected: number;
  overdueCount: number;
};

export type NewCreditInput = {
  customerName: string;
  phone: string;
  total?: number; // items na do tabhi zaroori
  items?: StockLine[]; // do to total khud nikalega aur stock ghategi
  downPayment?: number;
  dueDate?: string | null;
  method?: PaymentMethod;
};

export type NewPaymentInput = {
  amount: number;
  method: PaymentMethod;
};