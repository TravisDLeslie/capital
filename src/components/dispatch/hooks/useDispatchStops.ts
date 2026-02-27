// src/components/dispatch/hooks/useDispatchStops.ts
import { useCallback, useState } from "react";
import type { DispatchStop } from "../../../data/dispatch";
import { loadDispatch, saveDispatch, uid } from "../../../data/dispatch";

export function useDispatchStops() {
  const [stops, setStops] = useState<DispatchStop[]>(() => loadDispatch());

  const persist = useCallback((next: DispatchStop[]) => {
    setStops(next);
    saveDispatch(next);
  }, []);

  const removeStop = useCallback(
    (id: string) => persist(stops.filter((s) => s.id !== id)),
    [stops, persist]
  );

  const upsertStop = useCallback(
    (
      payload: Omit<DispatchStop, "id" | "createdAt" | "updatedAt">,
      editingId: string | null
    ) => {
      const now = Date.now();
      if (editingId) {
        persist(stops.map((s) => (s.id === editingId ? { ...s, ...payload, updatedAt: now } : s)));
      } else {
        const next: DispatchStop = { id: uid(), ...payload, createdAt: now, updatedAt: now };
        persist([next, ...stops]);
      }
    },
    [stops, persist]
  );

  return { stops, persist, removeStop, upsertStop };
}