export function money(n: number) {
  if (!Number.isFinite(n)) return "$0.00";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function clampMoney(n: string) {
  // Allows "12.34" and returns number
  const cleaned = n.replace(/[^\d.]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function marginDollars(buy: number, sell: number) {
  return sell - buy;
}

export function marginPercent(buy: number, sell: number) {
  if (buy <= 0) return 0;
  return ((sell - buy) / buy) * 100;
}