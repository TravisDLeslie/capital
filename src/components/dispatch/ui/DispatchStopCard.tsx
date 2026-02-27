// src/components/dispatch/ui/DispatchStopCard.tsx
import type { DispatchStop, DispatchStatus } from "../../../data/dispatch";
import { isHotshot, isReadyToShip } from "../../../data/dispatch";
import { STATUS } from "../utils/constants";
import { pill, tipForStop } from "../utils/format";

export default function DispatchStopCard({
  stop,
  onOpen,
}: {
  stop: DispatchStop;
  onOpen: (s: DispatchStop) => void;
}) {
  const hotshot = isHotshot(stop);
  const ready = isReadyToShip(stop);

  const cardClass = hotshot
    ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50"
    : "border-slate-200 bg-white hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={() => onOpen(stop)}
      className={`relative w-full text-left rounded-2xl border p-4 ${cardClass}`}
      title={tipForStop(stop) || "Click to view"}
    >
      <div className="absolute left-3 top-[-10px] z-10 flex gap-2">
        {hotshot && (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-extrabold text-white shadow ring-1 ring-rose-700/20">
            🔥 Hotshot
          </span>
        )}
        {ready && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-extrabold text-white shadow ring-1 ring-emerald-700/20">
            ✅ Ready to Ship
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 pt-2">
        <div className="min-w-0">
          <div className="truncate text-base font-extrabold text-slate-900">
            {stop.customer}
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-slate-700">
            {stop.jobName || "—"}
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${pill(
            stop.status as DispatchStatus
          )}`}
        >
          {STATUS.find((x) => x.value === stop.status)?.label ?? stop.status}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
          <div className="text-[10px] font-semibold uppercase text-slate-500">
            Driver
          </div>
          <div className="font-extrabold text-slate-900">{stop.driver || "—"}</div>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
          <div className="text-[10px] font-semibold uppercase text-slate-500">
            Truck
          </div>
          <div className="font-extrabold text-slate-900">{stop.truck || "—"}</div>
        </div>
      </div>

      <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
        <div className="text-[10px] font-semibold uppercase text-slate-500">
          Delivery Type
        </div>
        <div className={`truncate font-extrabold ${hotshot ? "text-rose-700" : "text-slate-900"}`}>
          {stop.deliveryType || "—"}
        </div>
      </div>

      <div className="mt-2 truncate text-sm text-slate-600">{stop.address || "—"}</div>
    </button>
  );
}