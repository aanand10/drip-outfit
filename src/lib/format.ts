const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatINR(amount: number): string {
  return `₹${inr.format(amount)}`;
}

export function formatDelta(amount: number): string {
  if (amount === 0) return "Same price";
  return `${amount > 0 ? "+" : "−"}${formatINR(Math.abs(amount))}`;
}
