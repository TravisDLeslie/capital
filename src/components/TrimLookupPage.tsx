import { useMemo, useState } from "react";
import { trimRows, trimSalePerFoot, type TrimRow } from "../data/trim.data";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function TrimLookupPage({
  onOpenDetail,
}: {
  onOpenDetail: (row: TrimRow) => void;
}) {
  const [vendor, setVendor] = useState<string>("All Vendors");
  const [category, setCategory] = useState<string>("All Categories");
  const [material, setMaterial] = useState<string>("All Materials");
  const [finish, setFinish] = useState<string>("All Finishes");
  const [query, setQuery] = useState("");

  const vendors = useMemo(() => {
    const set = new Set(trimRows.map((r) => r.vendor).filter(Boolean));
    return ["All Vendors", ...Array.from(set).sort()];
  }, []);

  const categories = useMemo(() => {
    const set = new Set(trimRows.map((r) => r.category).filter(Boolean));
    return ["All Categories", ...Array.from(set).sort()];
  }, []);

  const materials = useMemo(() => {
    const set = new Set(trimRows.map((r) => r.material).filter(Boolean));
    return ["All Materials", ...Array.from(set).sort()];
  }, []);

  const finishes = useMemo(() => {
    const set = new Set(trimRows.map((r) => (r.finish || "—")).filter(Boolean));
    return ["All Finishes", ...Array.from(set).sort()];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return trimRows.filter((r) => {
      const matchesVendor = vendor === "All Vendors" ? true : r.vendor === vendor;
      const matchesCategory = category === "All Categories" ? true : r.category === category;
      const matchesMaterial = material === "All Materials" ? true : r.material === material;
      const matchesFinish = finish === "All Finishes" ? true : (r.finish || "—") === finish;

      const blob = `${r.vendor} ${r.brand ?? ""} ${r.category} ${r.profile} ${r.size} ${
        r.material
      } ${r.finish ?? ""} ${r.sku ?? ""} ${r.notes ?? ""}`.toLowerCase();

      const matchesQuery = !q ? true : blob.includes(q);

      return matchesVendor && matchesCategory && matchesMaterial && matchesFinish && matchesQuery;
    });
  }, [vendor, category, material, finish, query]);

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Trim Price Lookup</h1>
        <p className="mt-2 max-w-4xl text-sm text-slate-600">
          Cost + calculated sale prices (Contractor 45% margin, Retail 50% margin).
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Select value={vendor} onChange={setVendor} options={vendors} />
        <Select value={category} onChange={setCategory} options={categories} />
        <Select value={material} onChange={setMaterial} options={materials} />
        <Select value={finish} onChange={setFinish} options={finishes} />

        <div className="w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search profile, size, SKU, notes..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />
        </div>
      </div>

      <section className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-800">Trim Items</div>
          <div className="mt-1 text-xs text-slate-500">
            Click a row to view details • Showing{" "}
            <span className="font-semibold">{filtered.length}</span>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1050px] w-full text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr className="text-left">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Profile</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Finish</th>
                <th className="px-4 py-3 text-right">Cost/ft</th>
                <th className="px-4 py-3 text-right">Contractor/ft</th>
                <th className="px-4 py-3 text-right">Retail/ft</th>
                <th className="px-4 py-3">SKU</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filtered.map((r) => {
                const contractor = trimSalePerFoot(r.costPerFoot, "contractor");
                const retail = trimSalePerFoot(r.costPerFoot, "retail");

                return (
                  <tr
                    key={r.id}
                    onClick={() => onOpenDetail(r)}
                    className="cursor-pointer hover:bg-slate-50"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") onOpenDetail(r);
                    }}
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {r.vendor}
                      {r.brand ? (
                        <span className="ml-2 text-xs text-slate-500">{r.brand}</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.category}</td>
                    <td className="px-4 py-3 text-slate-800">{r.profile}</td>
                    <td className="px-4 py-3 text-slate-700">{r.size}</td>
                    <td className="px-4 py-3 text-slate-700">{r.material}</td>
                    <td className="px-4 py-3 text-slate-700">{r.finish || "—"}</td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {money(r.costPerFoot)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {money(contractor)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {money(retail)}
                    </td>

                    <td className="px-4 py-3 text-slate-600">{r.sku || "—"}</td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No matches. Try adjusting filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="w-full sm:w-56">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}