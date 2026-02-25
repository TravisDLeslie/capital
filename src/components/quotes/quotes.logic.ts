// src/components/quotes/quotes.logic.ts
import type { Quote, QuoteStatus } from "../../data/quotes";

export function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function quoteTotal(q: Quote) {
  return (q.items ?? []).reduce(
    (s, it) => s + (Number(it.qty) || 0) * (Number(it.unitPrice) || 0),
    0
  );
}

export function daysUntil(iso?: string) {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();

  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diff = target.getTime() - today.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function isOpenStatus(s: QuoteStatus) {
  return s === "draft" || s === "sent";
}

export function isFollowUpDue(q: Quote) {
  if (!isOpenStatus(q.status)) return false;
  const d = daysUntil(q.nextFollowUp);
  return d != null && d <= 0; // due today or overdue
}

export function followUpLabel(q: Quote) {
  const du = daysUntil(q.nextFollowUp);
  if (!q.nextFollowUp || du == null) return "—";
  if (du > 0) return `${du} day(s)`;
  if (du === 0) return "Due today";
  return `Overdue ${Math.abs(du)}`;
}

export function followUpToneClass(q: Quote) {
  const du = daysUntil(q.nextFollowUp);
  if (du == null) return "text-slate-700";
  if (du <= 0) return "text-rose-700 font-semibold";
  if (du <= 2) return "text-amber-700 font-semibold";
  return "text-slate-700";
}

export const statusLabel: Record<QuoteStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  won: "Won",
  lost: "Lost",
};

export function statusPill(status: QuoteStatus) {
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