// src/components/dispatch/ui/DispatchBoard.tsx
import type { DispatchStop } from "../../../data/dispatch";
import { TIME_SLOTS } from "../utils/constants";
import DispatchColumn from "./DispatchColumn";

export default function DispatchBoard({
  bySlot,
  onOpenStop,
}: {
  bySlot: Record<string, DispatchStop[]>;
  onOpenStop: (s: DispatchStop) => void;
}) {
  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-4">
      {TIME_SLOTS.map((slot) => (
        <DispatchColumn key={slot} slot={slot} stops={bySlot[slot] ?? []} onOpenStop={onOpenStop} />
      ))}
    </div>
  );
}