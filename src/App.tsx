import { useMemo, useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import PinGate from "./components/PinGate";
import PriceTable, { type PriceRow, type PriceTier, type SortDir } from "./components/PriceTable";
import ProductDetail from "./components/ProductDetail";
import DeckingCalculator from "./components/DeckingCalculator";
import { deckingRows } from "./data/decking";
import { fasciaRows } from "./data/fascia";

function isFireRated(v: unknown) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "🔥";
}

function isCoolRated(v: unknown) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "❄️";
}

type Page = "decking" | "fascia" | "calculator" | "settings" | "detail";

const APP_PIN = "3105"; // ❗ change this
const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

function isStillUnlocked() {
  const unlocked = sessionStorage.getItem("capital-lumber-unlocked") === "true";
  const unlockedAt = Number(sessionStorage.getItem("capital-lumber-unlocked-at") || "0");
  if (!unlocked || !unlockedAt) return false;
  return Date.now() - unlockedAt < EIGHT_HOURS_MS;
}

export default function App() {
  const [unlocked, setUnlocked] = useState<boolean>(() => isStillUnlocked());

  const [page, setPage] = useState<Page>("decking");
  const [lastListPage, setLastListPage] = useState<Page>("decking");
  const [selectedRow, setSelectedRow] = useState<PriceRow | null>(null);

  const [tier, setTier] = useState<PriceTier>("retail");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [vendor, setVendor] = useState<string>("All Vendors");
  const [query, setQuery] = useState("");
  const [fireOnly, setFireOnly] = useState(false);
  const [coolOnly, setCoolOnly] = useState(false);

  function logout() {
    sessionStorage.removeItem("capital-lumber-unlocked");
    sessionStorage.removeItem("capital-lumber-unlocked-at");
    setUnlocked(false);
  }

  useEffect(() => {
    if (!unlocked) return;
    const tick = () => {
      if (!isStillUnlocked()) logout();
    };
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked]);

  function go(next: Page) {
    setPage(next);
    setVendor("All Vendors");
    setQuery("");
    setFireOnly(false);
    setCoolOnly(false);
    if (next !== "detail") setSelectedRow(null);
    if (next === "decking" || next === "fascia") setLastListPage(next);
  }

  const data: { title: string; description: string; rows: PriceRow[] } = useMemo(() => {
    if (page === "fascia") {
      return {
        title: "Fascia Product Price Lookup",
        description: "View fascia pricing by size, series, brand, vendor, and color.",
        rows: fasciaRows as PriceRow[],
      };
    }
    return {
      title: "Decking Product Price Lookup",
      description: "View decking pricing by size, series, brand, vendor, and color.",
      rows: deckingRows as PriceRow[],
    };
  }, [page]);

  const vendors = useMemo(() => {
    const set = new Set(data.rows.map((r) => r.vendor).filter(Boolean));
    return ["All Vendors", ...Array.from(set).sort()];
  }, [data.rows]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.rows.filter((r) => {
      const matchesVendor = vendor === "All Vendors" ? true : r.vendor === vendor;
      const matchesQuery = !q
        ? true
        : `${r.size} ${r.series} ${r.brand} ${r.vendor} ${r.color}`.toLowerCase().includes(q);

      const matchesFire = fireOnly ? isFireRated((r as any).fireRated) : true;
      const matchesCool = coolOnly ? isCoolRated((r as any).coolRated) : true;

      return matchesVendor && matchesQuery && matchesFire && matchesCool;
    });
  }, [data.rows, vendor, query, fireOnly, coolOnly]);

  function openDetail(row: PriceRow) {
    setSelectedRow(row);
    if (page === "decking" || page === "fascia") setLastListPage(page);
    setPage("detail");
  }

  function backFromDetail() {
    setPage(lastListPage);
    setSelectedRow(null);
  }

  return (
    <>
      {!unlocked && <PinGate correctPin={APP_PIN} onUnlock={() => setUnlocked(true)} />}

      {unlocked && (
        <div className="min-h-screen w-full bg-slate-50 text-slate-900">
          <div className="flex min-h-screen w-full">
            <Sidebar page={page as any} onNavigate={go as any} onLogout={logout} />

            <div className="flex min-w-0 flex-1 flex-col">
              <Header
                page={page === "fascia" ? "fascia" : "decking"}
                tier={tier}
                setTier={setTier}
                sortDir={sortDir}
                setSortDir={setSortDir}
              />

              <main className="min-w-0 w-full flex-1 px-6 py-6">
                {page === "detail" && selectedRow ? (
                  <ProductDetail row={selectedRow} tier={tier} onBack={backFromDetail} />
                ) : page === "calculator" ? (
                  <DeckingCalculator rows={deckingRows as PriceRow[]} tier={tier} />
                ) : (
                  <>
                    <div>
                      <h1 className="text-3xl font-extrabold tracking-tight">{data.title}</h1>
                      <p className="mt-2 max-w-4xl text-sm text-slate-600">{data.description}</p>
                    </div>

                    {/* Filters */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
                      {/* Vendor */}
                      <div className="w-full sm:w-60">
                        <label className="sr-only">Vendor</label>
                        <div className="relative">
                          <select
                            value={vendor}
                            onChange={(e) => setVendor(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                          >
                            {vendors.map((v) => (
                              <option key={v} value={v}>
                                {v}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            ▾
                          </span>
                        </div>
                      </div>

                      {/* Search */}
                      <div className="w-full sm:max-w-md">
                        <label className="sr-only">Search</label>
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search size, series, brand, vendor, color..."
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                        />
                      </div>

                      {/* 🔥 */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setFireOnly((v) => !v)}
                          className={[
                            "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
                            fireOnly
                              ? "border-[#FC2C38] bg-[#FC2C38]/10 text-slate-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span className="text-base leading-none">🔥</span>
                          Fire Only
                          {fireOnly && (
                            <span className="ml-1 rounded-full bg-[#FC2C38] px-2 py-0.5 text-[10px] font-bold text-white">
                              ON
                            </span>
                          )}
                        </button>
                      </div>

                      {/* ❄️ */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setCoolOnly((v) => !v)}
                          className={[
                            "flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
                            coolOnly
                              ? "border-sky-400 bg-sky-50 text-slate-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span className="text-base leading-none">❄️</span>
                          Cool Only
                          {coolOnly && (
                            <span className="ml-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              ON
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <section className="mt-6 w-full rounded-xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 px-5 py-4">
                        <div className="text-sm font-semibold text-slate-800">
                          {page === "fascia" ? "Fascia Price Lookup" : "Decking Price Lookup"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Tip: click a row to view details.
                        </div>
                      </div>

                      <div className="px-5 py-4">
                        <PriceTable
                          rows={filteredRows}
                          tier={tier}
                          sortDir={sortDir}
                          onSelectRow={openDetail} // ✅ row click
                        />
                      </div>
                    </section>
                  </>
                )}
              </main>
            </div>
          </div>
        </div>
      )}
    </>
  );
}