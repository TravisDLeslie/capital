// src/components/dispatch/hooks/useDispatchBoard.ts
import { useMemo } from "react";
import type { DispatchStatus, DispatchStop } from "../../../data/dispatch";
import { TIME_SLOTS } from "../../dispatch/utils/constants";

export function useDispatchBoard(opts: {
  stops: DispatchStop[];
  date: string;
  query: string;
  statusFilter: DispatchStatus | "all";
}) {
  const { stops, date, query, statusFilter } = opts;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return stops
      .filter((s) => s.date === date)
      .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
      .filter((s) => {
        if (!q) return true;
        const deps = (s.dependencies ?? [])
          .map((d) => `${d.supplier} ${d.poOrRef ?? ""} ${d.notes ?? ""}`)
          .join(" ");
        const blob = `${s.customer} ${s.jobName ?? ""} ${s.address ?? ""} ${s.driver ?? ""} ${s.truck ?? ""} ${
          s.deliveryType ?? ""
        } ${s.orderRef ?? ""} ${s.phone ?? ""} ${s.notes ?? ""} ${deps}`;
        return blob.toLowerCase().includes(q);
      })
      .sort((a, b) => TIME_SLOTS.indexOf(a.timeSlot as any) - TIME_SLOTS.indexOf(b.timeSlot as any));
  }, [stops, date, query, statusFilter]);

  const bySlot = useMemo(() => {
    const map: Record<string, DispatchStop[]> = {};
    for (const slot of TIME_SLOTS) map[slot] = [];
    for (const s of filtered) (map[s.timeSlot] ?? (map[s.timeSlot] = [])).push(s);
    return map;
  }, [filtered]);

  return { filtered, bySlot };
}