// src/components/dispatch/ui/DispatchStopModal.tsx
import type { DispatchDependency, DispatchStatus, DispatchStop } from "../../../data/dispatch";
import { DELIVERY_TYPES, DRIVERS, TRUCKS, depsAllReceived, isReadyToShip, uid } from "../../../data/dispatch";

import Field from "./Field";
import Modal from "./Modal";
import { STATUS, TIME_SLOTS } from "../utils/constants";
import { pill } from "../utils/format";

export type Draft = Omit<DispatchStop, "id" | "createdAt" | "updatedAt">;
export type ModalMode = "view" | "edit";

export default function DispatchStopModal(props: {
  open: boolean;
  onClose: () => void;

  mode: ModalMode;
  canEdit: boolean;

  editingId: string | null;

  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;

  statusError: string;
  setStatusError: (v: string) => void;

  // PIN-gated requests (DispatchPage controls PIN modal)
  onRequestEdit: () => void; // asks for PIN then sets mode="edit"
  onRequestSave: () => void; // asks for PIN then submit
  onRequestDelete: () => void; // asks for PIN then delete

  addDep: () => void;
  updateDep: (id: string, patch: Partial<DispatchDependency>) => void;
  removeDep: (id: string) => void;
}) {
  const {
    open,
    onClose,
    mode,
    canEdit,
    editingId,
    draft,
    setDraft,
    statusError,
    setStatusError,
    onRequestEdit,
    onRequestSave,
    onRequestDelete,
    addDep,
    updateDep,
    removeDep,
  } = props;

  if (!open) return null;

  const readyToShip = isReadyToShip(draft as any);
  const depsReceived = depsAllReceived(draft.dependencies);

  return (
    <Modal
      onClose={() => {
        onClose();
      }}
    >
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              {editingId ? "Dispatch Stop" : "New Dispatch Stop"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Team can view. PIN required for add/edit/save/delete.
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRequestEdit}
              className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-extrabold text-white hover:opacity-90"
              title="Dispatcher only"
            >
              {mode === "edit" ? "Editing" : "Edit"}
            </button>
          </div>
        </div>

        {mode !== "edit" && (
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-700">
            🔒 View-only. Click <span className="font-extrabold">Edit</span> and enter PIN to make changes.
          </div>
        )}
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
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>

          <Field label="Timeslot">
            <select
              value={draft.timeSlot}
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, timeSlot: e.target.value }))}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, customer: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>

          <Field label="Job Name">
            <input
              value={draft.jobName ?? ""}
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, jobName: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>

          <Field label="Address">
            <input
              value={draft.address ?? ""}
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>

          <Field label="Phone">
            <input
              value={draft.phone ?? ""}
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>

          <Field label="Delivery Type">
            <select
              value={draft.deliveryType ?? DELIVERY_TYPES[0]}
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, deliveryType: e.target.value }))}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, driver: e.target.value }))}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, truck: e.target.value }))}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={!canEdit}
              onChange={(e) => setDraft((d) => ({ ...d, orderRef: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            />
          </Field>

          <Field label="Status">
            <select
              value={draft.status}
              disabled={!canEdit}
              onChange={(e) => {
                const next = e.target.value as DispatchStatus;

                // keep your guard here too
                if ((next === "loading" || next === "out" || next === "delivered") && !draft.dispatchChecked) {
                  setStatusError("To set Loading / Out / Delivered, you must check ✅ Order checked.");
                  return;
                }

                setStatusError("");
                setDraft((d) => ({ ...d, status: next }));
              }}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            >
              {STATUS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* ✅ Dispatcher check */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-extrabold text-slate-900">✅ Order checked</div>
              <div className="mt-1 text-xs text-slate-600">
                Required for Loading / Out / Delivered and “Ready to Ship”.
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${
                    depsReceived
                      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                      : "bg-amber-50 text-amber-800 ring-amber-200"
                  }`}
                >
                  {depsReceived ? "Dependencies received" : "Waiting on dependencies"}
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ring-1 ${
                    readyToShip
                      ? "bg-emerald-600 text-white ring-emerald-700/20"
                      : "bg-slate-100 text-slate-700 ring-slate-200"
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
                disabled={!canEdit}
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
            disabled={!canEdit}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
            placeholder="ex: call ahead, gate code, long load, crane on site..."
          />
        </Field>

        {/* Dependencies */}
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Supplier Dependencies</div>
              <div className="text-xs text-slate-500">Track anything not in-house yet.</div>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={addDep}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                + Add dependency
              </button>
            )}
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
                        disabled={!canEdit}
                        onChange={(e) => updateDep(d.id, { supplier: e.target.value })}
                        className="w-48 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Boise Cascade"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={d.poOrRef ?? ""}
                        disabled={!canEdit}
                        onChange={(e) => updateDep(d.id, { poOrRef: e.target.value })}
                        className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="PO-1234"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={d.eta ?? ""}
                        disabled={!canEdit}
                        onChange={(e) => updateDep(d.id, { eta: e.target.value })}
                        className="w-32 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Fri"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(d.received)}
                          disabled={!canEdit}
                          onChange={(e) => updateDep(d.id, { received: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <span className="text-xs text-slate-700">Received</span>
                      </label>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={d.notes ?? ""}
                        disabled={!canEdit}
                        onChange={(e) => updateDep(d.id, { notes: e.target.value })}
                        className="w-full min-w-[240px] rounded-md border border-slate-200 px-2 py-1 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="Waiting on trim pack"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => removeDep(d.id)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!(draft.dependencies ?? []).length && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-slate-500">
                      No dependencies.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white pt-3">
          <div className="flex justify-between gap-2">
            {editingId ? (
              <button
                type="button"
                onClick={onRequestDelete}
                className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                title="Dispatcher only"
              >
                Delete
              </button>
            ) : (
              <span />
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                type="button"
              >
                Close
              </button>

              {mode === "edit" && (
                <button
                  onClick={onRequestSave}
                  className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  type="button"
                  title="Dispatcher only"
                >
                  {editingId ? "Save Stop" : "Create Stop"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}