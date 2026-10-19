// Sale ya Credit banate waqt jo products jaate hain unka shape.

// Client se aane wali line: kaunsa product, kitna.
export type StockLine = {
  productId: string;
  quantity: number;
  unitPrice?: number; // na do to product ka selling price lagega
};

// Bikne ke waqt ka snapshot (baad me product ka naam/price badle to history na badle).
export type SoldItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
};