export type MonthlySales = {
  year: number;   // e.g. 2026
  month: number;  // 1-12
  chargedOut: number;
};

export const monthNames = [
  "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
] as const;

export function monthLabel(m: number) {
  return monthNames[m - 1] ?? `M${m}`;
}

export const monthlySales: MonthlySales[] = [
  // ✅ 2026 (this year)
  { year: 2026, month: 1, chargedOut: 139_000 },
  { year: 2026, month: 2, chargedOut: 137_000 },

  // ✅ 2025 (your “last year” data)
  { year: 2025, month: 1, chargedOut: 90_633.0 },
  { year: 2025, month: 2, chargedOut: 25_144.0 },
  { year: 2025, month: 3, chargedOut: 170_434.0 },
  { year: 2025, month: 4, chargedOut: 176_575.0 },
  { year: 2025, month: 5, chargedOut: 196_970.0 },
  { year: 2025, month: 6, chargedOut: 194_687.0 },
  { year: 2025, month: 7, chargedOut: 291_626.0 },
  { year: 2025, month: 8, chargedOut: 194_480.24 },
  { year: 2025, month: 9, chargedOut: 344_644.71 },
  { year: 2025, month: 10, chargedOut: 285_182.07 },
  { year: 2025, month: 11, chargedOut: 214_382.0 },
  { year: 2025, month: 12, chargedOut: 250_178.0 },
];