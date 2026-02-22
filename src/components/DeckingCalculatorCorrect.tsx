import { useMemo, useState } from "react";
import { calcPricePerFoot, type PriceRow, type PriceTier } from "./PriceTable";

type InputMode = "sqft" | "dimensions";
type BoardLen = 12 | 16 | 20;

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function parseDimensions(text: string): { a: number; b: number } | null {
  // Accepts: 17' x 24', 17 x 24, 17ft x 24ft, 17.5 x 24
  const s = (text ?? "").toLowerCase().trim();
  if (!s) return null;

  // Replace common separators
  const cleaned = s
    .replace(/feet|foot|ft|'/g, "")
    .replace(/"/g, "")
    .replace(/\s+/g, " ")
    .replace(/[×]/g, "x");

  const m = cleaned.match(/^\s*([0-9]*\.?[0-9]+)\s*x\s*([0-9]*\.?[0-9]+)\s*$/);
  if (!m) return null;

  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  return { a, b };
}

export default function DeckingCalculator({
  rows,
  tier,
}: {
  rows: PriceRow[];
  tier: PriceTier;
}) {
  const [mode, setMode] = useState<InputMode>("sqft");
  const [sqft, setSqft] = useState<string>("");
  const [dims, setDims] = useState<string>("");

  const [selectedId, setSelectedId] = useState<string>(() => rows[0]?.id ?? "");
  const [boardLen, setBoardLen] = useState<BoardLen>(16);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? rows[0],
    [rows, selectedId]
  );

  const pricePerFoot = useMemo(() => {
    if (!selected) return 0;
    return calcPricePerFoot(selected.costPerFoot, tier);
  }, [selected, tier]);

  // 1x6 actual coverage width = 5.5"
  // sqft per linear foot = (5.5 in / 12) * 1 ft = 0.458333... sqft
  const sqftPerLinearFoot = 5.5 / 12;

  const baseSqft = useMemo(() => {
    if (mode === "sqft") {
      const n = Number(String(sqft).trim());
      return Number.isFinite(n) && n > 0 ? n : 0;
    }
    const parsed = parseDimensions(dims);
    if (!parsed) return 0;
    return parsed.a * parsed.b;
  }, [mode, sqft, dims]);

  const sqftWithWaste = useMemo(() => round2(baseSqft * 1.15), [baseSqft]);

  const linearFeetNeeded = useMemo(() => {
    if (!sqftWithWaste) return 0;
    return round2(sqftWithWaste / sqftPerLinearFoot); // LF = sqft / sqftPerLF
  }, [sqftWithWaste]);

  const estimatedTotal = useMemo(() => round2(linearFeetNeeded * pricePerFoot), [
    linearFeetNeeded,
    pricePerFoot,
  ]);

  const boardsNeeded = useMemo(() => {
    if (!linearFeetNeeded || !boardLen) return 0;
    return Math.ceil(linearFeetNeeded / boardLen);
  }, [linearFeetNeeded, boardLen]);

  const roundedBoardTotal = useMemo(() => {
    if (!boardsNeeded) return 0;
    return round2(boardsNeeded * boardLen * pricePerFoot);
  }, [boardsNeeded, boardLen, pricePerFoot]);

  const dimsHint = useMemo(() => {
    const parsed = parseDimensions(dims);
    if (!parsed) return "";
    return `${parsed.a} ft × ${parsed.b} ft = ${round2(parsed.a * parsed.b)} sqft`;
  }, [dims]);

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Inputs */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold text-slate-800">Decking Calculator</div>
            <div className="mt-1 text-xs text-slate-500">
              Adds <span className="font-semibold">15% waste</span>. Uses{" "}
              <span className="font-semibold">1x6 = 5.5&quot;</span> true coverage.
            </div>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Product Select */}
            <div>
              <label className="text-xs font-semibold text-slate-600">Select Decking</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              >
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.brand} • {r.series} • {r.color} • {r.vendor}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("sqft")}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  mode === "sqft"
                    ? "border-[#FC2C38] bg-[#FC2C38] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Enter Sqft
              </button>
              <button
                type="button"
                onClick={() => setMode("dimensions")}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  mode === "dimensions"
                    ? "border-[#FC2C38] bg-[#FC2C38] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Enter Dimensions
              </button>
            </div>

            {/* Inputs */}
            {mode === "sqft" ? (
              <div>
                <label className="text-xs font-semibold text-slate-600">Square Feet</label>
                <input
                  value={sqft}
                  onChange={(e) => setSqft(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 350"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-600">Dimensions</label>
                <input
                  value={dims}
                  onChange={(e) => setDims(e.target.value)}
                  placeholder="e.g. 17' x 24'"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
                {dimsHint && <div className="mt-2 text-xs text-slate-500">{dimsHint}</div>}
              </div>
            )}

            {/* Board length */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-600">Board Length Estimate</div>
                <div className="text-xs text-slate-500">Rounds up to whole boards.</div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={boardLen}
                  onChange={(e) => setBoardLen(Number(e.target.value) as BoardLen)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  <option value={12}>12&apos;</option>
                  <option value={16}>16&apos;</option>
                  <option value={20}>20&apos;</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Results */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold text-slate-800">Results</div>
            <div className="mt-1 text-xs text-slate-500">
              Pricing is <span className="font-semibold">{tier}</span>.
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            <ResultRow label="Selected Price / Foot" value={money(pricePerFoot)} highlight />

            <ResultRow label="Sqft (input)" value={baseSqft ? `${round2(baseSqft)} sqft` : "—"} />
            <ResultRow label="Sqft + 15% waste" value={sqftWithWaste ? `${sqftWithWaste} sqft` : "—"} />

            <ResultRow
              label="Linear feet needed (5.5” coverage)"
              value={linearFeetNeeded ? `${linearFeetNeeded} LF` : "—"}
            />

            <div className="h-px bg-slate-200" />

            <ResultRow
              label="Estimated total (exact LF)"
              value={estimatedTotal ? money(estimatedTotal) : "—"}
              highlight
            />

            <ResultRow
              label={`Rounded boards (${boardLen}' ea)`}
              value={boardsNeeded ? `${boardsNeeded} boards` : "—"}
            />

            <ResultRow
              label={`Rounded total (${boardLen}' boards)`}
              value={roundedBoardTotal ? money(roundedBoardTotal) : "—"}
              highlight
            />

            <div className="pt-2 text-[11px] text-slate-500">
              Note: Board totals round up to whole boards. Waste is included before rounding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className={highlight ? "text-sm font-extrabold text-slate-900" : "text-sm font-semibold text-slate-800"}>
        {value}
      </div>
    </div>
  );
}