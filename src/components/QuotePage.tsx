// src/components/quotes/QuotesPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  type Quote,
  type QuoteLineItem,
  type QuoteStatus,
  emptyQuote,
  loadQuotes,
  saveQuotes,
  uid,
} from "../data/quotes";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function quoteTotal(q: Quote) {
  return (q.items ?? []).reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0),
    0
  );
}

function daysUntil(iso?: string) {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

const statusLabel: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  won: "Won",
  lost: "Lost",
};

function statusPill(status: QuoteStatus) {
  switch (status) {
    case "won":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "sent":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "lost":
      return "bg-rose-50 text-rose-700 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

type Draft = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(() => loadQuotes());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "all">("all");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyQuote());

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // ✅ salespeople list (edit these)
  const salespeople = useMemo(
    () => ["—", "Travis", "Dane", "McKenzie", "Joe"],
    []
  );

  function persist(next: Quote[]) {
    setQuotes(next);
    saveQuotes(next);
  }

  function updateQuote(id: string, patch: Partial<Quote>) {
    const now = Date.now();
    persist(quotes.map((q) => (q.id === id ? { ...q, ...patch, updatedAt: now } : q)));
  }

  useEffect(() => {
    const onDoc = () => setMenuOpenId(null);
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes
      .filter((qt) => (status === "all" ? true : qt.status === status))
      .filter((qt) => {
        if (!q) return true;
        const blob = `${qt.customer} ${qt.salesperson ?? ""} ${qt.jobName ?? ""} ${
          qt.spruceQuoteNumber ?? ""
        } ${qt.contactName ?? ""} ${qt.contactPhone ?? ""} ${
          qt.contactEmail ?? ""
        } ${qt.notes ?? ""} ${qt.followUpNotes ?? ""}`;
        return blob.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [quotes, query, status]);

  // ✅ topline stats
  const topline = useMemo(() => {
    const sums: Record<QuoteStatus, number> = { draft: 0, sent: 0, won: 0, lost: 0 };
    const counts: Record<QuoteStatus, number> = { draft: 0, sent: 0, won: 0, lost: 0 };

    for (const q of quotes) {
      sums[q.status] += quoteTotal(q);
      counts[q.status] += 1;
    }

    const openCount = counts.draft + counts.sent;

    const followDueCount = quotes.filter((q) => {
      if (!(q.status === "draft" || q.status === "sent")) return false;
      const d = daysUntil(q.nextFollowUp);
      return d != null && d <= 0;
    }).length;

    return { sums, counts, openCount, followDueCount };
  }, [quotes]);

  function openNew() {
    setEditingId(null);
    setDraft(emptyQuote());
    setOpen(true);
  }

  function openEdit(q: Quote) {
    setEditingId(q.id);
    const { id, createdAt, updatedAt, ...rest } = q;
    setDraft(rest);
    setOpen(true);
  }

  function remove(id: string) {
    persist(quotes.filter((q) => q.id !== id));
  }

  const draftSubtotal = useMemo(() => {
    return (draft.items ?? []).reduce((sum, it) => {
      const qty = Number(it.qty) || 0;
      const unitPrice = Number(it.unitPrice) || 0;
      return sum + qty * unitPrice;
    }, 0);
  }, [draft.items]);

  function addLine() {
    setDraft((d) => ({
      ...d,
      items: [
        ...(d.items ?? []),
        {
          id: uid(),
          sku: "",
          description: "",
          qty: 1,
          unit: "ea",
          unitPrice: 0,
          vendor: "",
        },
      ],
    }));
  }

  function updateLine(id: string, patch: Partial<QuoteLineItem>) {
    setDraft((d) => ({
      ...d,
      items: (d.items ?? []).map((it) => (it.id === id ? { ...it, ...patch } : it)),
    }));
  }

  function removeLine(id: string) {
    setDraft((d) => ({
      ...d,
      items: (d.items ?? []).filter((it) => it.id !== id),
    }));
  }

  function submit() {
    const customer = draft.customer.trim();
    if (!customer) return;

    const now = Date.now();

    const cleanedItems = (draft.items ?? [])
      .map((it) => ({
        ...it,
        qty: Number(it.qty) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        description: (it.description ?? "").trim(),
      }))
      .filter((it) => it.description.length > 0);

    if (cleanedItems.length === 0) return;

    // ✅ clean salesperson value
    const sp = (draft.salesperson ?? "").trim();
    const cleanedSalesperson = !sp || sp === "—" ? "" : sp;

    if (editingId) {
      persist(
        quotes.map((q) =>
          q.id === editingId
            ? {
                ...q,
                ...draft,
                salesperson: cleanedSalesperson,
                items: cleanedItems,
                updatedAt: now,
              }
            : q
        )
      );
    } else {
      const newQuote: Quote = {
        id: uid(),
        ...draft,
        salesperson: cleanedSalesperson,
        items: cleanedItems,
        createdAt: now,
        updatedAt: now,
      };
      persist([newQuote, ...quotes]);
    }

    setOpen(false);
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Quotes</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Log Spruce quote #, line items, and follow-up timeline so nothing dies in the inbox.
          </p>
        </div>

        <button
          onClick={openNew}
          className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          type="button"
        >
          + New Quote
        </button>
      </div>

      {/* ✅ Topline $ by status */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <ToplineCard tone="neutral" label="Draft" amount={topline.sums.draft} count={topline.counts.draft} sub="Not sent yet" />
        <ToplineCard tone="info" label="Sent" amount={topline.sums.sent} count={topline.counts.sent} sub="Out for decision" />
        <ToplineCard tone="good" label="Won" amount={topline.sums.won} count={topline.counts.won} sub="Closed / landed" />
        <ToplineCard tone="bad" label="Lost" amount={topline.sums.lost} count={topline.counts.lost} sub="Learn + move on" />
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card label="Open Quotes (Draft + Sent)" value={String(topline.openCount)} sub="Active quotes that could turn into sales." />
        <Card label="Follow-ups Due" value={String(topline.followDueCount)} sub="Due today or overdue (based on Next Follow-up)." />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, salesperson, job, Spruce quote #, contact..."
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          />
        </div>

        <div className="w-full sm:w-56">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-800">Quotes</div>
          <div className="mt-1 text-xs text-slate-500">Click a quote row to open it.</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr className="text-left">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Salesperson</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Spruce Quote #</th>
                <th className="px-4 py-3">Follow-up</th>
                <th className="px-4 py-3 text-right">Quote Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filtered.map((q) => {
                const total = quoteTotal(q);
                const du = daysUntil(q.nextFollowUp);

                const followText =
                  q.nextFollowUp && du != null
                    ? du > 0
                      ? `${du} day(s)`
                      : du === 0
                      ? "Due today"
                      : `Overdue ${Math.abs(du)}`
                    : "—";

                const dueTone =
                  du == null
                    ? "text-slate-700"
                    : du <= 0
                    ? "text-rose-700 font-semibold"
                    : du <= 2
                    ? "text-amber-700 font-semibold"
                    : "text-slate-700";

                return (
                  <tr
                    key={q.id}
                    onClick={() => openEdit(q)}
                    className="cursor-pointer hover:bg-slate-50"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") openEdit(q);
                    }}
                    title="Click to open quote"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-900">{q.customer}</td>

                    {/* ✅ salesperson column */}
                    <td className="px-4 py-3 text-slate-800">{q.salesperson || "—"}</td>

                    <td className="px-4 py-3 text-slate-800">{q.jobName || "—"}</td>

                    <td className="px-4 py-3 text-slate-700">{q.spruceQuoteNumber || "—"}</td>

                    <td className={`px-4 py-3 ${dueTone}`}>{followText}</td>

                    <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(total)}</td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusPill(q.status)}`}>
                        {statusLabel[q.status]}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId((cur) => (cur === q.id ? null : q.id));
                          }}
                          className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          title="Quick actions"
                        >
                          ⋯
                        </button>

                        {menuOpenId === q.id && (
                          <div
                            className="absolute right-0 top-9 z-20 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                updateQuote(q.id, { status: "sent" });
                                setMenuOpenId(null);
                              }}
                            >
                              Mark as Sent
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                updateQuote(q.id, { status: "won" });
                                setMenuOpenId(null);
                              }}
                            >
                              Mark as Won
                            </button>
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                updateQuote(q.id, { status: "lost" });
                                setMenuOpenId(null);
                              }}
                            >
                              Mark as Lost
                            </button>
                            <div className="h-px bg-slate-200" />
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                remove(q.id);
                                setMenuOpenId(null);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No quotes yet. Add one with <span className="font-semibold">+ New Quote</span>.
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
            <div className="text-sm font-semibold text-slate-900">{editingId ? "Edit Quote" : "New Quote"}</div>
            <div className="mt-1 text-xs text-slate-500">
              Track Spruce quote # + line items + follow-up date so you close more deals.
            </div>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-5 py-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer *">
                <input
                  value={draft.customer}
                  onChange={(e) => setDraft((d) => ({ ...d, customer: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              {/* ✅ NEW: Salesperson */}
              <Field label="Salesperson (us)">
                <select
                  value={draft.salesperson ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, salesperson: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {salespeople.map((sp) => (
                    <option key={sp} value={sp === "—" ? "" : sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Job Name">
                <input
                  value={draft.jobName ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, jobName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Spruce Quote #">
                <input
                  value={draft.spruceQuoteNumber ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, spruceQuoteNumber: e.target.value }))}
                  placeholder="ex: Q-104233"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Status">
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as QuoteStatus }))}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
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
                  onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Contact Phone">
                <input
                  value={draft.contactPhone ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Contact Email">
                <input
                  value={draft.contactEmail ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Needed By (optional)">
                <input
                  type="date"
                  value={draft.neededBy ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, neededBy: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Next Follow-up (timeline)">
                <input
                  type="date"
                  value={draft.nextFollowUp ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, nextFollowUp: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>
            </div>

            <Field label="Follow-up Notes (what to do / say)">
              <textarea
                value={draft.followUpNotes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, followUpNotes: e.target.value }))}
                placeholder="ex: Call GC, confirm framing date, ask for PO, offer delivery schedule..."
                className="h-20 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              />
            </Field>

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
                  onClick={addLine}
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
                              onChange={(e) => updateLine(it.id, { sku: e.target.value })}
                              className="w-28 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              value={it.description}
                              onChange={(e) => updateLine(it.id, { description: e.target.value })}
                              className="w-full min-w-[260px] rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            />
                          </td>

                          <td className="px-3 py-2 text-right">
                            <input
                              value={String(it.qty ?? 0)}
                              onChange={(e) => updateLine(it.id, { qty: Number(e.target.value) || 0 })}
                              inputMode="decimal"
                              className="w-24 rounded-md border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-[#FC2C38]"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              value={it.unit ?? "ea"}
                              onChange={(e) => updateLine(it.id, { unit: e.target.value })}
                              className="w-20 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            />
                          </td>

                          <td className="px-3 py-2 text-right">
                            <input
                              value={String(it.unitPrice ?? 0)}
                              onChange={(e) => updateLine(it.id, { unitPrice: Number(e.target.value) || 0 })}
                              inputMode="decimal"
                              className="w-28 rounded-md border border-slate-200 px-2 py-1 text-sm text-right outline-none focus:border-[#FC2C38]"
                            />
                          </td>

                          <td className="px-3 py-2">
                            <input
                              value={it.vendor ?? ""}
                              onChange={(e) => updateLine(it.id, { vendor: e.target.value })}
                              className="w-40 rounded-md border border-slate-200 px-2 py-1 text-sm outline-none focus:border-[#FC2C38]"
                            />
                          </td>

                          <td className="px-3 py-2 text-right font-semibold text-slate-900">
                            {money(lineTotal)}
                          </td>

                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeLine(it.id)}
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
                <div className="text-sm font-extrabold text-slate-900">Subtotal: {money(draftSubtotal)}</div>
              </div>
            </div>

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
                  {editingId ? "Save Quote" : "Create Quote"}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ToplineCard({
  label,
  amount,
  count,
  sub,
  tone,
}: {
  label: string;
  amount: number;
  count: number;
  sub: string;
  tone: "neutral" | "info" | "good" | "bad";
}) {
  const toneCard =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50/60"
      : tone === "info"
      ? "border-sky-200 bg-sky-50/60"
      : tone === "bad"
      ? "border-rose-200 bg-rose-50/60"
      : "border-slate-200 bg-white";

  const toneBadge =
    tone === "good"
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : tone === "info"
      ? "bg-sky-100 text-sky-700 ring-sky-200"
      : tone === "bad"
      ? "bg-rose-100 text-rose-700 ring-rose-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const dot =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "info"
      ? "bg-sky-500"
      : tone === "bad"
      ? "bg-rose-500"
      : "bg-slate-400";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneCard}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</div>
          </div>

          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{money(amount)}</div>
          <div className="mt-1 text-xs text-slate-600">{sub}</div>
        </div>

        <span className={`shrink-0 inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneBadge}`} title="Quote count">
          {count}
        </span>
      </div>
    </div>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{sub}</div>
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
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">{children}</div>
    </div>
  );
}