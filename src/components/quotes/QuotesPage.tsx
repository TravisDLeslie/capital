// src/components/quotes/QuotesPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { Quote, QuoteLineItem, QuoteStatus } from "../../data/quotes";
import { emptyQuote, loadQuotes, saveQuotes, uid } from "../../data/quotes";

import {
  followUpLabel,
  followUpToneClass,
  money,
  quoteTotal,
  statusLabel,
  statusPill,
  daysUntil,
} from "./quotes.logic";

import { Card, ToplineCard } from "./quotes.ui";
import QuotesModal from "./QuotesModal";
import FollowUpsModal from "./FollowUpsModal";

type Draft = Omit<Quote, "id" | "createdAt" | "updatedAt">;

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>(() => loadQuotes());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "all">("all");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyQuote());

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [followupsOpen, setFollowupsOpen] = useState(false);

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
        const blob = `${qt.customer} ${qt.salesperson ?? ""} ${qt.jobName ?? ""} ${qt.spruceQuoteNumber ?? ""} ${
          qt.contactName ?? ""
        } ${qt.contactPhone ?? ""} ${qt.contactEmail ?? ""} ${qt.notes ?? ""} ${qt.followUpNotes ?? ""} ${
          qt.lostReason ?? ""
        } ${qt.lostReasonNotes ?? ""}`;
        return blob.toLowerCase().includes(q);
      })
      .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [quotes, query, status]);

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

  function removeQuote(id: string) {
    persist(quotes.filter((q) => q.id !== id));
  }

  function addLine() {
    setDraft((d) => ({
      ...d,
      items: [
        ...(d.items ?? []),
        { id: uid(), sku: "", description: "", qty: 1, unit: "ea", unitPrice: 0, vendor: "" },
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
    setDraft((d) => ({ ...d, items: (d.items ?? []).filter((it) => it.id !== id) }));
  }

  function submit() {
    const customer = draft.customer.trim();
    if (!customer) return;

    const cleanedItems = (draft.items ?? [])
      .map((it) => ({
        ...it,
        qty: Number(it.qty) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        description: (it.description ?? "").trim(),
      }))
      .filter((it) => it.description.length > 0);

    if (cleanedItems.length === 0) return;

    const now = Date.now();

    if (editingId) {
      persist(quotes.map((q) => (q.id === editingId ? { ...q, ...draft, items: cleanedItems, updatedAt: now } : q)));
    } else {
      persist([{ id: uid(), ...draft, items: cleanedItems, createdAt: now, updatedAt: now }, ...quotes]);
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <ToplineCard tone="neutral" label="Draft" amount={topline.sums.draft} count={topline.counts.draft} sub="Not sent yet" />
        <ToplineCard tone="info" label="Sent" amount={topline.sums.sent} count={topline.counts.sent} sub="Out for decision" />
        <ToplineCard tone="good" label="Won" amount={topline.sums.won} count={topline.counts.won} sub="Closed / landed" />
        <ToplineCard tone="bad" label="Lost" amount={topline.sums.lost} count={topline.counts.lost} sub="Learn + move on" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card label="Open Quotes (Draft + Sent)" value={String(topline.openCount)} sub="Active quotes that could turn into sales." />
        <Card
          label="Follow-ups Due"
          value={String(topline.followDueCount)}
          sub="Click to see everything due today / overdue."
          onClick={() => setFollowupsOpen(true)}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, salesperson, job, quote #, contact..."
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
              {filtered.map((q) => (
                <tr
                  key={q.id}
                  onClick={() => openEdit(q)}
                  className="cursor-pointer hover:bg-slate-50"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openEdit(q);
                  }}
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">{q.customer}</td>

                  <td className="px-4 py-3 text-slate-700">{q.salesperson || "—"}</td>

                  <td className="px-4 py-3 text-slate-800">{q.jobName || "—"}</td>

                  <td className="px-4 py-3 text-slate-700">{q.spruceQuoteNumber || "—"}</td>

                  <td className={`px-4 py-3 ${followUpToneClass(q)}`}>{followUpLabel(q)}</td>

                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(quoteTotal(q))}</td>

                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusPill(q.status)}`}>
                      {statusLabel[q.status]}
                    </span>

                    {q.status === "lost" && (q.lostReason || q.lostReasonNotes) ? (
                      <div className="mt-1 text-[11px] text-rose-700">
                        Why: <span className="font-semibold">{q.lostReason || "—"}</span>
                        {q.lostReasonNotes ? ` • ${q.lostReasonNotes}` : ""}
                      </div>
                    ) : null}
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
                              setMenuOpenId(null);
                              // immediately open modal as Lost so they fill the reason
                              openEdit({ ...q, status: "lost" });
                            }}
                          >
                            Mark as Lost
                          </button>

                          <div className="h-px bg-slate-200" />

                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            onClick={() => {
                              removeQuote(q.id);
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
              ))}

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

      <FollowUpsModal
        open={followupsOpen}
        quotes={quotes}
        onClose={() => setFollowupsOpen(false)}
        onOpenQuote={(q) => {
          setFollowupsOpen(false);
          openEdit(q);
        }}
      />

      <QuotesModal
        open={open}
        editing={Boolean(editingId)}
        draft={draft}
        setDraft={setDraft}
        onAddLine={addLine}
        onUpdateLine={updateLine}
        onRemoveLine={removeLine}
        onSubmit={submit}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}