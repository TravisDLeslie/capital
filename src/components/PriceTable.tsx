import type { ReactNode } from "react";

export type PriceRow = {
  id: string;
  size: string;
  series: string;
  brand: string;
  vendor: string;
  color: string;
  costPerFoot: number;
  image?: string;
  fireRated?: boolean | string | number;
  coolRated?: boolean | string | number;
};

export type PriceTier = "retail" | "contractor";
export type SortDir = "asc" | "desc";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// Margin pricing: sell = cost / (1 - margin)
function priceFromMargin(cost: number, margin: number) {
  if (!Number.isFinite(cost) || cost <= 0) return 0;
  const denom = 1 - margin;
  if (denom <= 0) return 0;
  return cost / denom;
}

export function tierMargin(tier: PriceTier) {
  return tier === "retail" ? 0.32 : 0.275;
}

export function calcPricePerFoot(costPerFoot: number, tier: PriceTier) {
  return round2(priceFromMargin(costPerFoot, tierMargin(tier)));
}

function brandStyles(brand: string) {
  const b = brand?.toLowerCase().trim();

  if (b === "trex")
    return "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200";

  if (b === "sylvanix")
    return "bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200";

  if (b === "timbertech")
    return "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200";

  return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
}

function flagTrue(v: unknown) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "🔥" || s === "❄️";
}

export default function PriceTable({
  rows,
  tier,
  sortDir,
  onSelectRow,
}: {
  rows: PriceRow[];
  tier: PriceTier;
  sortDir: SortDir;
  onSelectRow?: (row: PriceRow) => void; // ✅ NEW
}) {
  const sorted = [...rows].sort((a, b) => {
    const pa = calcPricePerFoot(a.costPerFoot, tier);
    const pb = calcPricePerFoot(b.costPerFoot, tier);
    return sortDir === "asc" ? pa - pb : pb - pa;
  });

  return (
    <div className="w-full rounded-lg border border-slate-200">
      <div className="max-h-[520px] w-full overflow-auto">
        <table className="w-full min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-[1] bg-white">
            <tr className="text-left text-xs font-bold text-slate-500">
              <Th>Size</Th>
              <Th>Series</Th>
              <Th>Brand</Th>
              <Th>Vendor</Th>
              <Th>Color</Th>
              <Th className="text-center">🔥</Th>
              <Th className="text-center">❄️</Th>
              <Th className="text-right">Cost / Ft</Th>

              <Th className="text-right">
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-xs font-bold tracking-wide">Price / Ft</span>
                  <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {tier === "retail" ? "32% Retail" : "27.5% Contractor"}
                  </span>
                </div>
              </Th>

              <Th className="text-right">12&apos;</Th>
              <Th className="text-right">16&apos;</Th>
              <Th className="text-right">20&apos;</Th>
            </tr>
          </thead>

          <tbody className="text-sm">
            {sorted.map((r) => {
              const pricePerFoot = calcPricePerFoot(r.costPerFoot, tier);
              const p12 = round2(pricePerFoot * 12);
              const p16 = round2(pricePerFoot * 16);
              const p20 = round2(pricePerFoot * 20);

              const fire = flagTrue(r.fireRated);
              const cool = flagTrue(r.coolRated);

              const clickable = !!onSelectRow;

              return (
                <tr
                  key={r.id}
                  className={[
                    "hover:bg-slate-50",
                    clickable ? "cursor-pointer" : "",
                  ].join(" ")}
                  onClick={() => onSelectRow?.(r)}
                  onKeyDown={(e) => {
                    if (!onSelectRow) return;
                    if (e.key === "Enter" || e.key === " ") onSelectRow(r);
                  }}
                  tabIndex={clickable ? 0 : -1}
                  role={clickable ? "button" : undefined}
                  aria-label={clickable ? `View details for ${r.brand} ${r.series} ${r.color}` : undefined}
                >
                  <Td className="font-semibold text-slate-800">{r.size}</Td>
                  <Td className="font-semibold text-slate-800">{r.series}</Td>

                  <Td>
                    <span
                      className={[
                        "inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold",
                        brandStyles(r.brand),
                      ].join(" ")}
                    >
                      {r.brand}
                    </span>
                  </Td>

                  <Td>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                      {r.vendor}
                    </span>
                  </Td>

                  {/* ✅ Hover zoom / preview */}
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        {r.image ? (
                          <>
                            <img
                              src={r.image}
                              alt={r.color}
                              className="h-8 w-8 rounded-md border border-slate-200 object-cover transition-transform duration-200 group-hover:scale-110"
                              loading="lazy"
                            />
                            {/* Larger preview on hover */}
                            <div className="pointer-events-none absolute left-10 top-1/2 z-30 hidden -translate-y-1/2 group-hover:block">
                              <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                                <img
                                  src={r.image}
                                  alt={`${r.color} preview`}
                                  className="h-44 w-44 rounded-lg object-cover"
                                />
                                <div className="mt-2 text-xs font-semibold text-slate-700">
                                  {r.color}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-8 w-8 rounded-md border border-slate-200 bg-slate-100" />
                        )}
                      </div>

                      <span className="font-semibold text-slate-800">{r.color}</span>
                    </div>
                  </Td>

                  <Td className="text-center">{fire ? <span className="text-lg">🔥</span> : <span className="text-slate-200">—</span>}</Td>
                  <Td className="text-center">{cool ? <span className="text-lg">❄️</span> : <span className="text-slate-200">—</span>}</Td>

                  <Td className="text-right font-semibold">{money(r.costPerFoot)}</Td>
                  <Td className="text-right font-extrabold text-slate-900">{money(pricePerFoot)}</Td>
                  <Td className="text-right font-semibold">{money(p12)}</Td>
                  <Td className="text-right font-semibold">{money(p16)}</Td>
                  <Td className="text-right font-semibold">{money(p20)}</Td>
                </tr>
              );
            })}

            {!sorted.length && (
              <tr>
                <td colSpan={12} className="px-4 py-10 text-center text-slate-500">
                  No results. Try a different search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <th className={`border-b border-slate-200 px-4 py-3 whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-b border-slate-200 px-4 py-3 ${className}`}>{children}</td>;
}