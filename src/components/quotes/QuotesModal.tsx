// src/components/quotes/QuotesModal.tsx
import { useEffect, useMemo, useState } from "react";
import type { Quote, QuoteLineItem, QuoteStatus } from "../../data/quotes";
import { money } from "./quotes.logic";
import { Field, ModalShell } from "./quotes.ui";

type Draft = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export default function QuotesModal({
  open,
  editing,
  draft,
  setDraft,
  onAddLine,
  onUpdateLine,
  onRemoveLine,
  onSubmit,
  onClose,
}: {
  open: boolean;
  editing: boolean;
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onAddLine: () => void;
  onUpdateLine: (id: string, patch: Partial<QuoteLineItem>) => void;
  onRemoveLine: (id: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const draftSubtotal = useMemo(() => {
    return (draft.items ?? []).reduce((sum, it) => {
      const qty = Number(it.qty) || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      return sum + qty * unitPrice;
    }, 0);
  }, [draft.items]);

  if (!open) return null;

  return (
    <ModalShell
      title={editing ? "Edit Quote" : "New Quote"}
      subtitle="Track Spruce quote # + line items + follow-up date so you close more deals."
      onClose={onClose}
    >
      {/* scroll area */}
      <div className="max-h-[80vh] overflow-y-auto px-5 py-5 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Customer *">
            <input
              value={draft.customer}
              onChange={(e) =>
                setDraft((d) => ({ ...d, customer: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>

          <Field label="Job Name">
            <input
              value={draft.jobName ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, jobName: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>

          <Field label="Spruce Quote #">
            <input
              value={draft.spruceQuoteNumber ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, spruceQuoteNumber: e.target.value }))
              }
              placeholder="ex: Q-104233"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>

          <Field label="Status">
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft((d) => ({ ...d, status: e.target.value as QuoteStatus }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
          </Field>

          <Field label="Contact Name">
            <input
              value={draft.contactName ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, contactName: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>

          <Field label="Contact Phone">
            <input
              value={draft.contactPhone ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, contactPhone: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>

          <Field label="Contact Email">
            <input
              value={draft.contactEmail ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, contactEmail: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>

          <Field label="Needed By (optional)">
            <input
              type="date"
              value={draft.neededBy ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, neededBy: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>

          <Field label="Next Follow-up (timeline)">
            <input
              type="date"
              value={draft.nextFollowUp ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, nextFollowUp: e.target.value }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />
          </Field>
        </div>

        <Field label="Follow-up Notes (what to do / say)">
          <textarea
            value={draft.followUpNotes ?? ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, followUpNotes: e.target.value }))
            }
            placeholder="ex: Call GC, confirm framing date, ask for PO, offer delivery schedule..."
            className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />
        </Field>

        {draft.status === "lost" && (
  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4">
    <div className="text-sm font-semibold text-rose-900">Why did we lose it?</div>
    <div className="mt-1 text-xs text-rose-700">
      Capture the reason so we can fix patterns (pricing, lead time, missed follow-up, etc.).
    </div>

    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Lost Reason">
        <select
          value={draft.lostReason ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, lostReason: e.target.value }))}
          className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
        >
          <option value="">Select…</option>
          <option value="price">Price</option>
          <option value="lead-time">Lead time</option>
          <option value="availability">Availability / stock</option>
          <option value="service">Service / communication</option>
          <option value="spec-mismatch">Spec mismatch</option>
          <option value="relationship">Relationship / incumbent supplier</option>
          <option value="no-decision">No decision / project cancelled</option>
          <option value="other">Other</option>
        </select>
      </Field>

      <Field label="Lost Reason Notes">
        <textarea
          value={draft.lostReasonNotes ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, lostReasonNotes: e.target.value }))}
          placeholder="ex: Beat by $220, but we had better material. Follow-up was 5 days late."
          className="h-24 w-full resize-none rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
        />
      </Field>
    </div>
  </div>
)}

        <Field label="Internal Notes">
          <textarea
            value={draft.notes ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
            className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />
        </Field>

        {/* Line items */}
        <div className="rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Line Items</div>
              <div className="text-xs text-slate-500">Add products/materials being quoted.</div>
            </div>
            <button
              type="button"
              onClick={onAddLine}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              + Add line
            </button>
          </div>

          <div className="overflow-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr className="text-left">
                  <th className="px-3 py-2">SKU</th>
                  <th className="px-3 py-2">Description *</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2 text-right">Unit Price</th>
                  <th className="px-3 py-2">Vendor</th>
                  <th className="px-3 py-2 text-right">Line Total</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {(draft.items ?? []).map((it) => {
                  const lineTotal = (Number(it.qty) || 0) * (Number(it.unitPrice) || 0);
                  return (
                    <tr key={it.id}>
                      <td className="px-3 py-2">
                        <input
                          value={it.sku ?? ""}
                          onChange={(e) => onUpdateLine(it.id, { sku: e.target.value })}
                          className="w-28 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.description}
                          onChange={(e) => onUpdateLine(it.id, { description: e.target.value })}
                          className="w-full min-w-[260px] rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          value={String(it.qty ?? 0)}
                          onChange={(e) => onUpdateLine(it.id, { qty: Number(e.target.value) || 0 })}
                          inputMode="decimal"
                          className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-[#FC2C38]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.unit ?? "ea"}
                          onChange={(e) => onUpdateLine(it.id, { unit: e.target.value })}
                          className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <input
                          value={String(it.unitPrice ?? 0)}
                          onChange={(e) =>
                            onUpdateLine(it.id, { unitPrice: Number(e.target.value) || 0 })
                          }
                          inputMode="decimal"
                          className="w-28 rounded-md border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-[#FC2C38]"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={it.vendor ?? ""}
                          onChange={(e) => onUpdateLine(it.id, { vendor: e.target.value })}
                          className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">
                        {money(lineTotal)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveLine(it.id)}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <div className="text-xs text-slate-500">
              Tip: Set <span className="font-semibold">Next Follow-up</span> so it shows up as “Due / Overdue”.
            </div>
            <div className="text-sm font-extrabold text-slate-900">
              Subtotal: {money(draftSubtotal)}
            </div>
          </div>
        </div>

        {/* sticky footer inside scroll area */}
        <div className="sticky bottom-0 bg-white pt-3">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              type="button"
            >
              {editing ? "Save Quote" : "Create Quote"}
            </button>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}