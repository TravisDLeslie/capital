import PriceTable, {
  calcPricePerFoot,
  type PriceRow,
  type PriceTier,
} from "./PriceTable";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function flagTrue(v: unknown) {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "y" || s === "1" || s === "🔥" || s === "❄️";
}

export default function ProductDetail({
  row,
  tier,
  onBack,
}: {
  row: PriceRow;
  tier: PriceTier;
  onBack: () => void;
}) {
  const pricePerFoot = calcPricePerFoot(row.costPerFoot, tier);
  const p12 = round2(pricePerFoot * 12);
  const p16 = round2(pricePerFoot * 16);
  const p20 = round2(pricePerFoot * 20);

  const fire = flagTrue(row.fireRated);
  const cool = flagTrue(row.coolRated);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Back
        </button>

        <div className="text-xs text-slate-500">
          {tier === "retail" ? "Retail (32%)" : "Contractor (27.5%)"}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Image */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50">
            {row.image ? (
              <img
                src={row.image}
                alt={`${row.color} large`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-400">
                No image
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center gap-2">
            {fire && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-200">
                🔥 Fire Rated
              </span>
            )}
            {cool && (
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 ring-1 ring-inset ring-sky-200">
                ❄️ Cool
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500">Product</div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
            {row.brand} {row.series}
          </h2>
          <div className="mt-2 text-sm font-semibold text-slate-700">
            {row.color}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Info label="Size" value={row.size} />
            <Info label="Vendor" value={row.vendor} />
            <Info label="Brand" value={row.brand} />
            <Info label="Series" value={row.series} />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Price label="Cost / ft" value={money(row.costPerFoot)} />
              <Price label="Price / ft" value={money(pricePerFoot)} strong />
              <Price label="12' board" value={money(p12)} />
              <Price label="16' board" value={money(p16)} />
              <Price label="20' board" value={money(p20)} />
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500">
            Prices are calculated from your cost using gross margin (tier).
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Price({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className={strong ? "text-lg font-extrabold text-slate-900" : "text-sm font-bold text-slate-900"}>
        {value}
      </div>
    </div>
  );
}