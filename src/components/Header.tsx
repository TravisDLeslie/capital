import React from "react";
import type { PriceTier, SortDir } from "./PriceTable";

type Page = "decking" | "fascia";

export default function Header({
  page,
  tier,
  setTier,
  sortDir,
  setSortDir,
}: {
  page: Page;
  tier: PriceTier;
  setTier: (t: PriceTier) => void;
  sortDir: SortDir;
  setSortDir: React.Dispatch<React.SetStateAction<SortDir>>;
}) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-6">
        {/* Left */}
        <div className="text-sm text-slate-500">
          Price Lookup <span className="mx-1">›</span>
          <span className="font-semibold text-slate-800">
            {page === "fascia" ? "Fascia" : "Decking"}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Tier Selector */}
          <div className="flex items-center rounded-full border border-slate-200 bg-white p-1">
            <TierButton
              active={tier === "retail"}
              onClick={() => setTier("retail")}
              label="Retail"
              percent="32%"
            />

            <TierButton
              active={tier === "contractor"}
              onClick={() => setTier("contractor")}
              label="Contractor"
              percent="27.5%"
            />
          </div>

          {/* Sort Button */}
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            title="Toggle sort by Price / Foot"
          >
            Price/ft
            <span className="text-slate-400">{sortDir === "desc" ? "↓" : "↑"}</span>
          </button>
        </div>
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
        active
          ? "bg-[#FC2C38] text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      ].join(" ")}
      type="button"
    >
      {label}
      <span
        className={[
          "ml-1 text-[10px] font-bold",
          active ? "text-white" : "text-slate-400",
        ].join(" ")}
      >
        {percent}
      </span>
    </button>
  );
}