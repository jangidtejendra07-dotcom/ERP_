export type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BranchInput = {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  manager?: string;
  isActive?: boolean;
};

export type BranchView = Branch & {
  productCount: number;
  units: number;
  stockValue: number; // sirf internal (apna) stock, cost par
  lowStock: number;
  outOfStock: number;
  salesCount: number;
  revenue: number;
};

export type BranchStats = {
  total: number;
  active: number;
  products: number;
  units: number;
  stockValue: number;
};