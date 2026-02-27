// src/components/Header.tsx
import type { Dispatch, SetStateAction } from "react";
import type { PriceTier, SortDir } from "./PriceTable";

export type Page =
  | "pulse"
  | "sales"
  | "decking"
  | "fascia"
  | "calculator"
  | "trim"
  | "trimDetail"
  | "jobs"
  | "quotes"
  | "dispatch"   // ✅ add this
  | "settings"
  | "detail";

export default function Header({
  page,
  tier,
  setTier,
  sortDir,
  setSortDir,
}: {
  page: Page;
  tier: PriceTier;
  setTier: Dispatch<SetStateAction<PriceTier>>;
  sortDir: SortDir;
  setSortDir: Dispatch<SetStateAction<SortDir>>;
}) {
  // Breadcrumb “Price Lookup › X”
  const isLookupArea =
  page === "decking" || page === "fascia" || page === "trim" || page === "trimDetail";

  // Only show tier + sort on decking/fascia
  const showTierSort = page === "decking" || page === "fascia";

  const title =
    page === "pulse"
      ? "Team Pulse"
      : page === "sales"
      ? "Sales Dashboard"
      : page === "decking"
      ? "Decking"
      : page === "fascia"
      ? "Fascia"
      : page === "trim"
      ? "Trim"
      : page === "trimDetail"
      ? "Trim Detail"
      : page === "calculator"
      ? "Decking Calculator"
      : page === "jobs"
      ? "Jobs Pipeline"
      : page === "quotes"
      ? "Quotes"
      : page === "settings"
      ? "Settings"
      : "Product Detail";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left */}
        <div className="text-sm text-slate-500">
          {isLookupArea && page !== "decking" && page !== "fascia" && page !== "trim" ? (
            <>
              Price Lookup <span className="mx-1">›</span>
              <span className="font-semibold text-slate-800">{title}</span>
            </>
          ) : isLookupArea ? (
            <>
              Price Lookup <span className="mx-1">›</span>
              <span className="font-semibold text-slate-800">{title}</span>
            </>
          ) : (
            <span className="font-semibold text-slate-800">{title}</span>
          )}
        </div>

        {/* Right Controls */}
        {showTierSort ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full border border-slate-200 bg-white p-1">
              <TierButton active={tier === "retail"} onClick={() => setTier("retail")} label="Retail" percent="32%" />
              <TierButton active={tier === "contractor"} onClick={() => setTier("contractor")} label="Contractor" percent="27.5%" />
            </div>

            <button
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              title="Toggle sort by Price / Foot"
              type="button"
            >
              Price/ft
              <span className="text-slate-400">{sortDir === "desc" ? "↓" : "↑"}</span>
            </button>
          </div>
        ) : (
          <div />
        )}
      </div>
    </header>
  );
}

function TierButton({
  active,
  onClick,
  label,
  percent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  percent: string;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "rounded-full px-4 py-1.5 text-xs font-semibold transition",
        active ? "bg-[#FC2C38] text-white shadow-sm" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      ].join(" ")}
      type="button"
    >
      {label}
      <span className={["ml-1 text-[10px] font-bold", active ? "text-white" : "text-slate-400"].join(" ")}>
        {percent}
      </span>
    </button>
  );
}