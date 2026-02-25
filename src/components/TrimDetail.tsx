import { trimSalePerFoot, type TrimRow } from "../data/trim.data";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function TrimDetail({
  row,
  onBack,
}: {
  row: TrimRow;
  onBack: () => void;
}) {
  const contractor = trimSalePerFoot(row.costPerFoot, "contractor");
  const retail = trimSalePerFoot(row.costPerFoot, "retail");

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back to Trim
        </button>

        <div className="text-xs text-slate-500">
          {row.vendor}
          {row.brand ? ` • ${row.brand}` : ""}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200">
            {row.image ? (
              <img
                src={row.image}
                alt={`${row.category} ${row.profile} ${row.size}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
                No image yet
              </div>
            )}
          </div>

          {row.notes ? (
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
              {row.notes}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Trim Detail
            </div>

            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              {row.category} — {row.profile}
            </div>

            <div className="mt-1 text-sm text-slate-600">{row.size}</div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Spec label="Material" value={row.material} />
              <Spec label="Finish" value={row.finish || "—"} />
              <Spec label="Vendor" value={row.vendor} />
              <Spec label="SKU" value={row.sku || "—"} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <PriceCard label="Cost / ft" value={money(row.costPerFoot)} tone="neutral" />
            <PriceCard label="Contractor / ft" value={money(contractor)} tone="info" />
            <PriceCard label="Retail / ft" value={money(retail)} tone="good" />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">Stocking Lengths</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(row.stockingLengths ?? []).length ? (
                row.stockingLengths!.map((ft) => (
                  <span
                    key={ft}
                    className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 ring-1 ring-slate-200"
                  >
                    {ft}’
                  </span>
                ))
              ) : (
                <div className="text-sm text-slate-500">Not set yet.</div>
              )}
            </div>

            <div className="mt-3 text-xs text-slate-500">
              Tip: Add stockingLengths in <span className="font-semibold">trim.data.ts</span>{" "}
              (ex: [8, 12, 16]).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function PriceCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "neutral" | "info" | "good";
}) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50/60"
      : tone === "info"
      ? "border-sky-200 bg-sky-50/60"
      : "border-slate-200 bg-white";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-xl font-extrabold text-slate-900">{value}</div>
    </div>
  );
}