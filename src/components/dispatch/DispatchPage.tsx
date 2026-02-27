// src/components/dispatch/DispatchPage.tsx
import { useMemo, useState } from "react";
import {
  DELIVERY_TYPES,
  DRIVERS,
  TRUCKS,
  TIME_SLOTS,
  type DispatchOrder,
  emptyDispatchOrder,
  loadDispatch,
  saveDispatch,
  uid,
} from "../../data/dispatch";

function clsx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function DispatchPage() {
  const [items, setItems] = useState<DispatchOrder[]>(() => loadDispatch());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyDispatchOrder());

  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("");

  function persist(next: DispatchOrder[]) {
    setItems(next);
    saveDispatch(next);
  }

  function openNew() {
    setEditingId(null);
    setDraft(emptyDispatchOrder());
    setOpen(true);
  }

  function openEdit(o: DispatchOrder) {
    setEditingId(o.id);
    const { id, ...rest } = o;
    setDraft(rest);
    setOpen(true);
  }

  function remove(id: string) {
    persist(items.filter((x) => x.id !== id));
  }

  function submit() {
    const customer = (draft.customer ?? "").trim();
    if (!customer) return;

    const nowList = [...items];

    const cleaned: Omit<DispatchOrder, "id"> = {
      ...draft,
      customer,
      jobName: (draft.jobName ?? "").trim(),
      address: (draft.address ?? "").trim(),
      notes: (draft.notes ?? "").trim(),
      waitingOnSuppliers: (draft.waitingOnSuppliers ?? []).map((s) => s.trim()).filter(Boolean),
    };

    if (editingId) {
      persist(
        nowList.map((x) => (x.id === editingId ? { id: editingId, ...cleaned } : x))
      );
    } else {
      persist([{ id: uid(), ...cleaned }, ...nowList]);
    }

    setOpen(false);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((o) => (dateFilter ? o.date === dateFilter : true))
      .filter((o) => {
        if (!q) return true;
        const blob = `${o.customer} ${o.jobName ?? ""} ${o.address ?? ""} ${o.driver} ${o.truck} ${
          o.deliveryType
        } ${(o.waitingOnSuppliers ?? []).join(" ")} ${o.notes ?? ""}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date > b.date ? 1 : -1;
        return TIME_SLOTS.indexOf(a.timeSlot) - TIME_SLOTS.indexOf(b.timeSlot);
      });
  }, [items, query, dateFilter]);

  const todaysDate = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dispatch</h1>
          <p className="mt-2 max-w-4xl text-sm text-slate-600">
            Time slots + driver + truck + delivery type. Track holds (waiting on suppliers) so we stop guessing.
          </p>
        </div>

        <button
          onClick={openNew}
          className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          type="button"
        >
          + New Dispatch
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, job, address, driver, truck, notes..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />
        </div>

        <div className="w-full sm:w-56">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />
        </div>

        <button
          type="button"
          onClick={() => setDateFilter(todaysDate)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Today
        </button>

        <button
          type="button"
          onClick={() => setDateFilter("")}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          All Dates
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-800">Loads</div>
          <div className="mt-1 text-xs text-slate-500">Click a row to edit. Use “Hold” when waiting on suppliers.</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr className="text-left">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Truck</th>
                <th className="px-4 py-3">Delivery Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Waiting On</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => openEdit(o)}
                  className="cursor-pointer hover:bg-slate-50"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openEdit(o);
                  }}
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">{o.date}</td>
                  <td className="px-4 py-3 text-slate-800">{o.timeSlot}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{o.customer}</td>
                  <td className="px-4 py-3 text-slate-700">{o.jobName || "—"}</td>
                  <td className="px-4 py-3 text-slate-800">{o.driver}</td>
                  <td className="px-4 py-3 text-slate-800">{o.truck}</td>
                  <td className="px-4 py-3 text-slate-700">{o.deliveryType}</td>

                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1",
                        o.status === "delivered"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : o.status === "enroute"
                          ? "bg-sky-50 text-sky-700 ring-sky-200"
                          : o.status === "hold"
                          ? "bg-rose-50 text-rose-700 ring-rose-200"
                          : "bg-slate-100 text-slate-700 ring-slate-200"
                      )}
                    >
                      {o.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {(o.waitingOnSuppliers ?? []).length ? (
                      <div className="flex flex-wrap gap-2">
                        {o.waitingOnSuppliers!.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200"
                          >
                            {s}
                          </span>
                        ))}
                        {o.waitingOnSuppliers!.length > 2 ? (
                          <span className="text-xs font-semibold text-slate-500">
                            +{o.waitingOnSuppliers!.length - 2} more
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(o.id);
                      }}
                      className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    No dispatch items yet. Create one with <span className="font-semibold">+ New Dispatch</span>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-sm font-semibold text-slate-900">
              {editingId ? "Edit Dispatch" : "New Dispatch"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Use “Hold” + Waiting On Suppliers when we’re blocked (Boise, trusses, special order, etc.).
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-5 py-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Time Slot">
                <select
                  value={draft.timeSlot}
                  onChange={(e) => setDraft((d) => ({ ...d, timeSlot: e.target.value as any }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>
                      {t}
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

              <Field label="Status">
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as any }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  <option value="scheduled">scheduled</option>
                  <option value="enroute">enroute</option>
                  <option value="delivered">delivered</option>
                  <option value="hold">hold</option>
                </select>
              </Field>

              <Field label="Driver">
                <select
                  value={draft.driver}
                  onChange={(e) => setDraft((d) => ({ ...d, driver: e.target.value as any }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
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
                  value={draft.truck}
                  onChange={(e) => setDraft((d) => ({ ...d, truck: e.target.value as any }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {TRUCKS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Delivery Type">
                <select
                  value={draft.deliveryType}
                  onChange={(e) => setDraft((d) => ({ ...d, deliveryType: e.target.value as any }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {DELIVERY_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Waiting On Suppliers (one per line)">
              <textarea
                value={(draft.waitingOnSuppliers ?? []).join("\n")}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    waitingOnSuppliers: e.target.value.split("\n"),
                  }))
                }
                placeholder="ex:
Boise Cascade - LVL
Truss plant
Special order windows"
                className="h-28 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={draft.notes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              />
            </Field>

            <div className="sticky bottom-0 bg-white pt-3">
              <div className="flex justify-end gap-2">
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
                  {editingId ? "Save" : "Create"}
                </button>
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