// src/components/dispatch/DispatchPage.tsx
import { useMemo, useState } from "react";
import type { DispatchDependency, DispatchStatus, DispatchStop } from "../../data/dispatch";
import {
  DELIVERY_TYPES,
  DRIVERS,
  TRUCKS,
  depsAllReceived,
  emptyStop,
  isHotshot,
  isReadyToShip,
  loadDispatch,
  saveDispatch,
  uid,
} from "../../data/dispatch";

import PinGate from "../PinGate";

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TIME_SLOTS = ["7:00–9:00", "9:00–11:00", "11:00–1:00", "1:00–3:00", "3:00–5:00"];

const STATUS: { value: DispatchStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "picking", label: "Picking" },
  { value: "waiting", label: "Waiting on Supplier" },
  { value: "loading", label: "Loading" },
  { value: "out", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "canceled", label: "Canceled" },
];

const DISPATCH_PIN = "DP3105";
const DISPATCH_UNLOCK_KEY = "capital-lumber-dispatch-unlocked";

function pill(status: DispatchStatus) {
  switch (status) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "out":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "loading":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "waiting":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "canceled":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

type Draft = Omit<DispatchStop, "id" | "createdAt" | "updatedAt">;

export default function DispatchPage() {
  const [date, setDate] = useState<string>(() => todayISO());
  const [stops, setStops] = useState<DispatchStop[]>(() => loadDispatch());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DispatchStatus | "all">("all");

  // 🔐 edit lock
  const [dispatchUnlocked, setDispatchUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(DISPATCH_UNLOCK_KEY) === "true";
  });
  const [unlockOpen, setUnlockOpen] = useState(false);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyStop(todayISO()));
  const [statusError, setStatusError] = useState<string>("");

  const readOnly = !dispatchUnlocked;

  function persist(next: DispatchStop[]) {
    setStops(next);
    saveDispatch(next);
  }

  function requireUnlock(action: () => void) {
    if (dispatchUnlocked) return action();
    setUnlockOpen(true);
  }

  function openNew() {
    setStatusError("");
    setEditingId(null);
    setDraft(emptyStop(date));
    setOpen(true);
  }

  function openEdit(s: DispatchStop) {
    setStatusError("");
    setEditingId(s.id);
    const { id, createdAt, updatedAt, ...rest } = s;
    setDraft(rest);
    setOpen(true);
  }

  function removeStop(id: string) {
    persist(stops.filter((s) => s.id !== id));
  }

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
      .sort((a, b) => TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot));
  }, [stops, date, query, statusFilter]);

  const bySlot = useMemo(() => {
    const map: Record<string, DispatchStop[]> = {};
    for (const slot of TIME_SLOTS) map[slot] = [];
    for (const s of filtered) (map[s.timeSlot] ?? (map[s.timeSlot] = [])).push(s);
    return map;
  }, [filtered]);

  function submit() {
    if (readOnly) return;

    setStatusError("");
    const customer = (draft.customer ?? "").trim();
    if (!customer) return;

    // hard rule: shipping stages require dispatchChecked
    if (
      (draft.status === "loading" || draft.status === "out" || draft.status === "delivered") &&
      !draft.dispatchChecked
    ) {
      setStatusError("To set Loading / Out / Delivered, you must check ✅ Order checked.");
      return;
    }

    const now = Date.now();

    const cleanedDeps = (draft.dependencies ?? [])
      .map((d) => ({
        ...d,
        supplier: (d.supplier ?? "").trim(),
        poOrRef: (d.poOrRef ?? "").trim(),
        eta: (d.eta ?? "").trim(),
        notes: (d.notes ?? "").trim(),
        received: Boolean(d.received),
      }))
      .filter((d) => d.supplier.length > 0);

    const payload: Draft = {
      ...draft,
      customer,
      jobName: (draft.jobName ?? "").trim(),
      address: (draft.address ?? "").trim(),
      phone: (draft.phone ?? "").trim(),
      orderRef: (draft.orderRef ?? "").trim(),
      notes: (draft.notes ?? "").trim(),
      dependencies: cleanedDeps,
    };

    if (editingId) {
      persist(stops.map((s) => (s.id === editingId ? { ...s, ...payload, updatedAt: now } : s)));
    } else {
      const next: DispatchStop = { id: uid(), ...payload, createdAt: now, updatedAt: now };
      persist([next, ...stops]);
    }

    setOpen(false);
  }

  function addDep() {
    if (readOnly) return;
    setDraft((d) => ({
      ...d,
      dependencies: [
        ...(d.dependencies ?? []),
        { id: uid(), supplier: "", poOrRef: "", eta: "", received: false, notes: "" },
      ],
    }));
  }

  function updateDep(id: string, patch: Partial<DispatchDependency>) {
    if (readOnly) return;
    setDraft((d) => ({
      ...d,
      dependencies: (d.dependencies ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
    }));
  }

  function removeDep(id: string) {
    if (readOnly) return;
    setDraft((d) => ({ ...d, dependencies: (d.dependencies ?? []).filter((x) => x.id !== id) }));
  }

  const readyToShip = isReadyToShip(draft);
  const depsReceived = depsAllReceived(draft.dependencies);

  return (
    <div className="w-full space-y-6">
      {/* 🔐 Unlock overlay */}
      {unlockOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">Unlock Dispatch Editing</div>
              <div className="mt-1 text-xs text-slate-500">
                Dispatch is view-only unless you enter the dispatch PIN.
              </div>
            </div>
            <div className="p-5">
              <PinGate
                correctPin={DISPATCH_PIN}
                onUnlock={() => {
                  sessionStorage.setItem(DISPATCH_UNLOCK_KEY, "true");
                  setDispatchUnlocked(true);
                  setUnlockOpen(false);
                }}
              />
              <button
                type="button"
                onClick={() => setUnlockOpen(false)}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dispatch</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Timeslots + assignment + dependencies. Cards show status only. “Ready to Ship” is a clear badge.
          </p>

          {readOnly && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
              🔒 View-only
              <button
                type="button"
                onClick={() => setUnlockOpen(true)}
                className="rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-extrabold text-white hover:opacity-90"
              >
                Unlock Editing
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />

          <button
            onClick={() => requireUnlock(openNew)}
            className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            type="button"
          >
            + Add Stop
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, job, driver, truck, delivery type, supplier..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          >
            <option value="all">All statuses</option>
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ Mobile-first: stacked slots; Desktop: board columns */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-4">
        {TIME_SLOTS.map((slot) => (
          <section
            key={slot}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">{slot}</div>
              <div className="mt-0.5 text-xs text-slate-500">{bySlot[slot]?.length ?? 0} stop(s)</div>
            </div>

            <div className="p-3 space-y-3">
              {(bySlot[slot] ?? []).map((s) => {
                const hotshot = isHotshot(s);
                const ready = isReadyToShip(s);

                const cardClass = hotshot
                  ? "border-rose-200 bg-rose-50/40 hover:bg-rose-50"
                  : "border-slate-200 bg-white hover:bg-slate-50";

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => requireUnlock(() => openEdit(s))}
                    className={`relative w-full text-left rounded-2xl border p-4 ${cardClass}`}
                    title={readOnly ? "Unlock editing to open" : "Click to open"}
                  >
                    {/* Top badges row (never covers the name) */}
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

                    {/* header */}
                    <div className="flex items-start justify-between gap-2 pt-2">
                      <div className="min-w-0">
                        <div className="truncate text-base font-extrabold text-slate-900">
                          {s.customer}
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold text-slate-700">
                          {s.jobName || "—"}
                        </div>
                      </div>

                      {/* ✅ Status only */}
                      <span
                        className={`shrink-0 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${pill(
                          s.status
                        )}`}
                      >
                        {STATUS.find((x) => x.value === s.status)?.label ?? s.status}
                      </span>
                    </div>

                    {/* body */}
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                        <div className="text-[10px] font-semibold uppercase text-slate-500">Driver</div>
                        <div className="font-extrabold text-slate-900">{s.driver || "—"}</div>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
                        <div className="text-[10px] font-semibold uppercase text-slate-500">Truck</div>
                        <div className="font-extrabold text-slate-900">{s.truck || "—"}</div>
                      </div>
                    </div>

                    <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm ring-1 ring-slate-200">
                      <div className="text-[10px] font-semibold uppercase text-slate-500">Delivery Type</div>
                      <div className={`truncate font-extrabold ${hotshot ? "text-rose-700" : "text-slate-900"}`}>
                        {s.deliveryType || "—"}
                      </div>
                    </div>

                    <div className="mt-2 truncate text-sm text-slate-600">{s.address || "—"}</div>
                  </button>
                );
              })}

              {!bySlot[slot]?.length && (
                <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                  No stops in this slot.
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      {/* Modal (edit/create) - ONLY reachable after unlock */}
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">
              {editingId ? "Edit Dispatch Stop" : "New Dispatch Stop"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Status is the only card state. “Ready to Ship” requires dependencies received + ✅ Order checked.
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-5 py-5 space-y-5">
            {!!statusError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
                {statusError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Timeslot">
                <select
                  value={draft.timeSlot}
                  onChange={(e) => setDraft((d) => ({ ...d, timeSlot: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {TIME_SLOTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Customer *">
                <input
                  value={draft.customer}
                  onChange={(e) => setDraft((d) => ({ ...d, customer: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Job Name">
                <input
                  value={draft.jobName ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, jobName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Address">
                <input
                  value={draft.address ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Phone">
                <input
                  value={draft.phone ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Delivery Type">
                <select
                  value={draft.deliveryType ?? DELIVERY_TYPES[0]}
                  onChange={(e) => setDraft((d) => ({ ...d, deliveryType: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {DELIVERY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Driver">
                <select
                  value={draft.driver ?? DRIVERS[0]}
                  onChange={(e) => setDraft((d) => ({ ...d, driver: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {DRIVERS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Truck">
                <select
                  value={draft.truck ?? TRUCKS[0]}
                  onChange={(e) => setDraft((d) => ({ ...d, truck: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {TRUCKS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Order Ref (Spruce SO/Inv)">
                <input
                  value={draft.orderRef ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, orderRef: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Status">
                <select
                  value={draft.status}
                  onChange={(e) => {
                    const next = e.target.value as DispatchStatus;

                    // guard: shipping stages require dispatchChecked
                    if ((next === "loading" || next === "out" || next === "delivered") && !draft.dispatchChecked) {
                      setStatusError("To set Loading / Out / Delivered, you must check ✅ Order checked.");
                      return;
                    }

                    setStatusError("");
                    setDraft((d) => ({ ...d, status: next }));
                  }}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {STATUS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {/* ✅ Dispatcher “check order” */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">✅ Order checked</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Dispatcher must verify the order (counts, notes, dependencies). Required for Loading / Out / Delivered
                    and for the “Ready to Ship” badge.
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${
                        depsReceived ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200"
                      }`}
                    >
                      {depsReceived ? "Dependencies received" : "Waiting on dependencies"}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${
                        readyToShip ? "bg-emerald-600 text-white ring-emerald-700/20" : "bg-slate-100 text-slate-700 ring-slate-200"
                      }`}
                    >
                      {readyToShip ? "✅ Ready to Ship" : "Not ready to ship"}
                    </span>
                  </div>
                </div>

                <label className="inline-flex select-none items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.dispatchChecked)}
                    onChange={(e) => {
                      setStatusError("");
                      setDraft((d) => ({ ...d, dispatchChecked: e.target.checked }));
                    }}
                    className="h-5 w-5"
                  />
                  Checked
                </label>
              </div>
            </div>

            <Field label="Notes">
              <textarea
                value={draft.notes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                placeholder="ex: call ahead, gate code, long load, crane on site..."
              />
            </Field>

            {/* Dependencies */}
            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Supplier Dependencies</div>
                  <div className="text-xs text-slate-500">
                    Track anything not in-house yet. When all are Received, dispatch can check ✅ Order checked.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addDep}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  + Add dependency
                </button>
              </div>

              <div className="overflow-auto">
                <table className="min-w-[900px] w-full text-sm">
                  <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                    <tr className="text-left">
                      <th className="px-3 py-2">Supplier *</th>
                      <th className="px-3 py-2">PO / Ref</th>
                      <th className="px-3 py-2">ETA</th>
                      <th className="px-3 py-2">Received</th>
                      <th className="px-3 py-2">Notes</th>
                      <th className="px-3 py-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(draft.dependencies ?? []).map((d) => (
                      <tr key={d.id}>
                        <td className="px-3 py-2">
                          <input
                            value={d.supplier}
                            onChange={(e) => updateDep(d.id, { supplier: e.target.value })}
                            className="w-48 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            placeholder="Boise Cascade"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={d.poOrRef ?? ""}
                            onChange={(e) => updateDep(d.id, { poOrRef: e.target.value })}
                            className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            placeholder="PO-1234"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={d.eta ?? ""}
                            onChange={(e) => updateDep(d.id, { eta: e.target.value })}
                            className="w-32 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            placeholder="Fri"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={Boolean(d.received)}
                              onChange={(e) => updateDep(d.id, { received: e.target.checked })}
                              className="h-4 w-4"
                            />
                            <span className="text-xs text-slate-700">Received</span>
                          </label>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            value={d.notes ?? ""}
                            onChange={(e) => updateDep(d.id, { notes: e.target.value })}
                            className="w-full min-w-[240px] rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            placeholder="Waiting on trim pack"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeDep(d.id)}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!(draft.dependencies ?? []).length && (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-xs text-slate-500">
                          No dependencies. This can be Ready once dispatch checks the order ✅.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white pt-3">
              <div className="flex justify-between gap-2">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      removeStop(editingId);
                      setOpen(false);
                    }}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submit}
                    className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                    type="button"
                  >
                    {editingId ? "Save Stop" : "Create Stop"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}