// src/components/dispatch/ui/DispatchColumn.tsx
import type { DispatchStop } from "../../../data/dispatch";
import DispatchStopCard from "./DispatchStopCard";

export default function DispatchColumn({
  slot,
  stops,
  onOpenStop,
}: {
  slot: string;
  stops: DispatchStop[];
  onOpenStop: (s: DispatchStop) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">{slot}</div>
        <div className="mt-0.5 text-xs text-slate-500">{stops?.length ?? 0} stop(s)</div>
      </div>

      <div className="p-3 space-y-3">
        {(stops ?? []).map((s) => (
          <DispatchStopCard key={s.id} stop={s} onOpen={onOpenStop} />
        ))}

        {!stops?.length && (
          <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
            No stops in this slot.
          </div>
        )}
      </div>
    </section>
  );
}