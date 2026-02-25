// src/components/quotes/FollowUpsModal.tsx
import { useMemo } from "react";
import type { Quote } from "../../data/quotes";
import {
  followUpLabel,
  followUpToneClass,
  isFollowUpDue,
  money,
  quoteTotal,
} from "./quotes.logic";
import { ModalShell } from "./quotes.ui";

export default function FollowUpsModal({
  open,
  quotes,
  onClose,
  onOpenQuote,
}: {
  open: boolean;
  quotes: Quote[];
  onClose: () => void;
  onOpenQuote: (q: Quote) => void;
}) {
  const dueList = useMemo(() => {
    return quotes
      .filter(isFollowUpDue)
      .sort((a, b) => {
        const da = a.nextFollowUp ? new Date(a.nextFollowUp).getTime() : 0;
        const db = b.nextFollowUp ? new Date(b.nextFollowUp).getTime() : 0;
        return da - db;
      });
  }, [quotes]);

  if (!open) return null;

  return (
    <ModalShell
      title="Follow-ups Due"
      subtitle="Draft + Sent quotes that are due today or overdue."
      onClose={onClose}
    >
      <div className="max-h-[80vh] overflow-y-auto px-5 py-5">
        {dueList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            ✅ No follow-ups due right now.
          </div>
        ) : (
          <div className="space-y-3">
            {dueList.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onOpenQuote(q)}
                className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-slate-900">
                      {q.customer}
                      {q.jobName ? ` — ${q.jobName}` : ""}
                    </div>

                    <div className="mt-1 text-xs text-slate-600">
                      Spruce: <span className="font-semibold">{q.spruceQuoteNumber || "—"}</span>
                      {q.contactName ? ` • ${q.contactName}` : ""}
                      {q.contactPhone ? ` • ${q.contactPhone}` : ""}
                    </div>

                    {q.followUpNotes ? (
                      <div className="mt-2 text-xs text-slate-700 line-clamp-2">
                        <span className="font-semibold">Next:</span> {q.followUpNotes}
                      </div>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <div className={`text-xs ${followUpToneClass(q)}`}>
                      {followUpLabel(q)}
                    </div>
                    <div className="mt-1 text-sm font-extrabold text-slate-900">
                      {money(quoteTotal(q))}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}