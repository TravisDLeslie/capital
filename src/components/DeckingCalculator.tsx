import { useMemo, useState } from "react";
import { calcPricePerFoot, type PriceRow, type PriceTier } from "./PriceTable";
import { generateDeckingPdf } from "../utils/generateDeckingPdf";

type InputMode = "sqft" | "dimensions";
type BoardLen = 12 | 16 | 20;

type AreaItem = {
  id: string;
  name: string;
  mode: InputMode;
  sqftText: string;
  dimsText: string;
  baseSqft: number;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function pad3(n: number) {
  return String(n).padStart(3, "0");
}

function nextQuoteFileName() {
  const key = "capital-lumber-quote-seq";
  const current = Number(localStorage.getItem(key) || "0");
  const next = current + 1;
  localStorage.setItem(key, String(next));
  return `Capital_Lumber_Quote_${pad3(next)}.pdf`;
}

function parseNumberLoose(input: string): number {
  // Accepts: "350", "350 sqft", "350.5", "1,250", "$350"
  const s = String(input ?? "").trim();
  if (!s) return 0;
  const cleaned = s.replace(/,/g, "").replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseDimensions(text: string): { a: number; b: number } | null {
  // Accepts: 17' x 24', 17 x 24, 17X24, 17 × 24, 17 by 24, 17ft x 24ft
  const s = (text ?? "").toLowerCase().trim();
  if (!s) return null;

  const cleaned = s
    .replace(/feet|foot|ft|'/g, "")
    .replace(/"/g, "")
    .replace(/[×]/g, "x")
    .replace(/\bby\b/g, "x")
    .replace(/\s+/g, " ")
    .trim();

  const m = cleaned.match(/^\s*([0-9]*\.?[0-9]+)\s*x\s*([0-9]*\.?[0-9]+)\s*$/);
  if (!m) return null;

  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;

  return { a, b };
}

function computeSqft(mode: InputMode, sqftText: string, dimsText: string) {
  if (mode === "sqft") return parseNumberLoose(sqftText);
  const parsed = parseDimensions(dimsText);
  return parsed ? parsed.a * parsed.b : 0;
}

export default function DeckingCalculator({
  rows,
  tier,
}: {
  rows: PriceRow[];
  tier: PriceTier;
}) {
  const WASTE_PCT = 0.15;
  const SALES_TAX_PCT = 0.06;
  const DELIVERY_FEE = 50;

  // 1x6 true coverage width = 5.5"
  const sqftPerLinearFoot = 5.5 / 12;

  const [customerName, setCustomerName] = useState<string>(""); // ✅ NEW

  const [selectedId, setSelectedId] = useState<string>(() => rows[0]?.id ?? "");
  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? rows[0],
    [rows, selectedId]
  );

  const [boardLen, setBoardLen] = useState<BoardLen>(16);

  // Draft area inputs
  const [draftName, setDraftName] = useState<string>("Area 1");
  const [draftMode, setDraftMode] = useState<InputMode>("sqft");
  const [draftSqft, setDraftSqft] = useState<string>("");
  const [draftDims, setDraftDims] = useState<string>("");

  // Saved areas
  const [areas, setAreas] = useState<AreaItem[]>([]);

  const pricePerFoot = useMemo(() => {
    if (!selected) return 0;
    return calcPricePerFoot(selected.costPerFoot, tier);
  }, [selected, tier]);

  const draftBaseSqft = useMemo(
    () => computeSqft(draftMode, draftSqft, draftDims),
    [draftMode, draftSqft, draftDims]
  );

  const draftError = useMemo(() => {
    if (draftMode === "sqft") {
      if (!draftSqft.trim()) return "";
      return draftBaseSqft > 0 ? "" : "Enter a valid sqft number (example: 350 or 350 sqft)";
    }
    if (!draftDims.trim()) return "";
    return draftBaseSqft > 0 ? "" : "Enter dimensions like 17' x 24' (or 17 x 24 / 17 by 24)";
  }, [draftMode, draftSqft, draftDims, draftBaseSqft]);

  const draftDimsHint = useMemo(() => {
    const parsed = parseDimensions(draftDims);
    if (!parsed) return "";
    return `${parsed.a} ft × ${parsed.b} ft = ${round2(parsed.a * parsed.b)} sqft`;
  }, [draftDims]);

  const canSave = draftBaseSqft > 0;

  function addArea() {
    const baseSqft = computeSqft(draftMode, draftSqft, draftDims);
    if (!baseSqft || baseSqft <= 0) return;

    setAreas((prev) => [
      ...prev,
      {
        id: uid(),
        name: draftName.trim() || `Area ${prev.length + 1}`,
        mode: draftMode,
        sqftText: draftSqft,
        dimsText: draftDims,
        baseSqft,
      },
    ]);

    setDraftName(`Area ${areas.length + 2}`);
    setDraftSqft("");
    setDraftDims("");
  }

  function removeArea(id: string) {
    setAreas((prev) => prev.filter((a) => a.id !== id));
  }

  function clearAll() {
    setAreas([]);
    setDraftName("Area 1");
    setDraftMode("sqft");
    setDraftSqft("");
    setDraftDims("");
  }

  const totals = useMemo(() => {
    const baseSqftTotal = areas.reduce((sum, a) => sum + (a.baseSqft || 0), 0);
    const sqftWithWaste = round2(baseSqftTotal * (1 + WASTE_PCT));
    const linearFeet = sqftWithWaste ? round2(sqftWithWaste / sqftPerLinearFoot) : 0;

    const subtotal = round2(linearFeet * pricePerFoot);
    const delivery = areas.length ? DELIVERY_FEE : 0;
    const taxable = round2(subtotal + delivery);
    const tax = round2(taxable * SALES_TAX_PCT);
    const grandTotal = round2(taxable + tax);

    const boardsNeeded = linearFeet ? Math.ceil(linearFeet / boardLen) : 0;
    const roundedBoardTotal = boardsNeeded ? round2(boardsNeeded * boardLen * pricePerFoot) : 0;

    return {
      baseSqftTotal: round2(baseSqftTotal),
      sqftWithWaste,
      linearFeet,
      pricePerFoot,
      subtotal,
      delivery,
      taxable,
      tax,
      grandTotal,
      boardsNeeded,
      roundedBoardTotal,
    };
  }, [
    areas,
    WASTE_PCT,
    sqftPerLinearFoot,
    pricePerFoot,
    SALES_TAX_PCT,
    DELIVERY_FEE,
    boardLen,
  ]);

  async function exportPdf() {
    if (!selected || !areas.length) return;

    const selectedProduct = `${selected.brand} • ${selected.series} • ${selected.color} • ${selected.vendor} • Size ${selected.size}`;

    await generateDeckingPdf({
      logoUrl: "/logo.png",
      customerName: customerName.trim(), // ✅ NEW
      selectedProduct,
      pricePerFoot: totals.pricePerFoot,
      boardLen,
      areas: areas.map((a) => ({
        name: a.name,
        mode: a.mode,
        input:
          a.mode === "sqft"
            ? `${a.sqftText || round2(a.baseSqft)} sqft`
            : `${a.dimsText} (${round2(a.baseSqft)} sqft)`,
        baseSqft: round2(a.baseSqft),
      })),
      totals: {
        baseSqftTotal: totals.baseSqftTotal,
        sqftWithWaste: totals.sqftWithWaste,
        linearFeet: totals.linearFeet,
        subtotal: totals.subtotal,
        delivery: totals.delivery,
        taxable: totals.taxable,
        tax: totals.tax,
        grandTotal: totals.grandTotal,
      },
      fileName: nextQuoteFileName(),
    });
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Builder */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold text-slate-800">Decking Calculator</div>
            <div className="mt-1 text-xs text-slate-500">
              Save multiple areas, then export a 1-page quote PDF (adds 15% waste, 6% sales tax, $50 delivery).
            </div>
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* ✅ Customer Name */}
            <div>
              <label className="text-xs font-semibold text-slate-600">Customer Name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Smith"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              />
            </div>

            {/* Product Select */}
            <div>
              <label className="text-xs font-semibold text-slate-600">Select Decking Product</label>
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

              <div className="mt-2 text-xs text-slate-500">
                Price/ft: <span className="font-semibold text-slate-800">{money(pricePerFoot)}</span>
              </div>
            </div>

            {/* Area name */}
            <div>
              <label className="text-xs font-semibold text-slate-600">Area name</label>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g. Back deck"
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              />
            </div>

            {/* Mode toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDraftMode("sqft")}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  draftMode === "sqft"
                    ? "border-[#FC2C38] bg-[#FC2C38] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Enter Sqft
              </button>

              <button
                type="button"
                onClick={() => setDraftMode("dimensions")}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  draftMode === "dimensions"
                    ? "border-[#FC2C38] bg-[#FC2C38] text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                Enter Dimensions
              </button>
            </div>

            {/* Draft input */}
            {draftMode === "sqft" ? (
              <div>
                <label className="text-xs font-semibold text-slate-600">Square feet</label>
                <input
                  value={draftSqft}
                  onChange={(e) => setDraftSqft(e.target.value)}
                  inputMode="decimal"
                  placeholder="e.g. 350 (or 350 sqft)"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSave) addArea();
                  }}
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold text-slate-600">Dimensions</label>
                <input
                  value={draftDims}
                  onChange={(e) => setDraftDims(e.target.value)}
                  placeholder="e.g. 17' x 24' (or 17 by 24)"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canSave) addArea();
                  }}
                />
                {draftDimsHint && <div className="mt-2 text-xs text-slate-500">{draftDimsHint}</div>}
              </div>
            )}

             {/* Board length estimate (moved up) */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <div className="text-xs font-semibold text-slate-700">Board length estimate</div>
                <div className="text-xs text-slate-500">Rounds up to whole boards.</div>
              </div>

              <select
                value={boardLen}
                onChange={(e) => setBoardLen(Number(e.target.value) as BoardLen)}
                className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              >
                <option value={12}>12&apos;</option>
                <option value={16}>16&apos;</option>
                <option value={20}>20&apos;</option>
              </select>
            </div>

            {/* Computed + error + Save */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                Computed sqft:{" "}
                <span className="font-semibold text-slate-800">
                  {draftBaseSqft ? `${round2(draftBaseSqft)} sqft` : "—"}
                </span>
                {draftError && <div className="mt-1 text-xs font-semibold text-red-500">{draftError}</div>}
              </div>

              <button
                type="button"
                onClick={addArea}
                disabled={!canSave}
                className={[
                  "rounded-lg px-4 py-2 text-sm font-semibold transition",
                  canSave ? "bg-[#FC2C38] text-white hover:opacity-90" : "bg-slate-200 text-slate-500 cursor-not-allowed",
                ].join(" ")}
              >
                Save Area
              </button>
            </div>

           

            {/* Saved Areas */}
            <div className="rounded-lg border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="text-sm font-semibold text-slate-800">Saved Areas</div>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900"
                >
                  Clear
                </button>
              </div>

              <div className="divide-y divide-slate-200">
                {areas.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-slate-500">
                    No areas saved yet. Add an area above.
                  </div>
                ) : (
                  areas.map((a) => (
                    <div key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-800">{a.name}</div>
                        <div className="mt-0.5 text-xs text-slate-500">
                          {a.mode === "sqft"
                            ? `Sqft: ${a.sqftText || round2(a.baseSqft)}`
                            : `Dims: ${a.dimsText} (${round2(a.baseSqft)} sqft)`}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-slate-800">{round2(a.baseSqft)} sqft</div>
                        <button
                          type="button"
                          onClick={() => removeArea(a.id)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Totals */}
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold text-slate-800">Quote Totals</div>
            <div className="mt-1 text-xs text-slate-500">
              Includes 15% waste, 6% sales tax, $50 delivery.
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            <ResultRow label="Total sqft (input)" value={areas.length ? `${totals.baseSqftTotal} sqft` : "—"} />
            <ResultRow label="Sqft + 15% waste" value={areas.length ? `${totals.sqftWithWaste} sqft` : "—"} />
            <ResultRow label='Linear feet (5.5" coverage)' value={areas.length ? `${totals.linearFeet} LF` : "—"} />

            <div className="h-px bg-slate-200" />

            <ResultRow label="Material subtotal" value={areas.length ? money(totals.subtotal) : "—"} />
            <ResultRow label="Delivery fee" value={areas.length ? money(totals.delivery) : "—"} />
            <ResultRow label="Taxable total" value={areas.length ? money(totals.taxable) : "—"} />
            <ResultRow label="Sales tax (6%)" value={areas.length ? money(totals.tax) : "—"} />

            <ResultRow label="Grand total" value={areas.length ? money(totals.grandTotal) : "—"} highlight />

            <div className="h-px bg-slate-200" />

            <ResultRow label={`Boards estimate (${boardLen}' ea)`} value={areas.length ? `${totals.boardsNeeded} boards` : "—"} />
            <ResultRow label="Rounded board total" value={areas.length ? money(totals.roundedBoardTotal) : "—"} />

            <button
              type="button"
              onClick={exportPdf}
              disabled={!areas.length || !selected}
              className={[
                "mt-2 w-full rounded-lg px-4 py-2 text-sm font-semibold transition",
                areas.length && selected
                  ? "bg-[#FC2C38] text-white hover:opacity-90"
                  : "bg-slate-200 text-slate-500 cursor-not-allowed",
              ].join(" ")}
            >
              Export 1-Page PDF Quote
            </button>

            <div className="pt-1 text-[11px] text-slate-500">
              Export name auto-increments (Capital_Lumber_Quote_###).
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
      <div
        className={
          highlight
            ? "text-sm font-extrabold text-slate-900"
            : "text-sm font-semibold text-slate-800"
        }
      >
        {value}
      </div>
    </div>
  );
}