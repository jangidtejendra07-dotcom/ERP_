// Indian Rupee, Indian digit grouping (e.g. ₹1,00,000.00)
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return inr.format(amount);
}