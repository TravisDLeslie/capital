import { useMemo } from "react";
import { loadJobs, type PipelineJob, monthLabel } from "../data/jobs";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

/** ===== Workday helpers (Mon–Sat). We don’t work Sundays. ===== */
function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month 1-12
}
function isSunday(d: Date) {
  return d.getDay() === 0; // 0 = Sunday
}
function workdaysInMonth(year: number, month: number) {
  const total = daysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= total; day++) {
    const d = new Date(year, month - 1, day);
    if (!isSunday(d)) count++;
  }
  return Math.max(1, count);
}
function workdaysElapsedSoFar(year: number, month: number, today: Date) {
  const lastDay = today.getDate();
  let count = 0;
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(year, month - 1, day);
    if (!isSunday(d)) count++;
  }
  return Math.max(1, count);
}

export default function Pulse() {
  const jobs = useMemo(() => loadJobs(), []);
  const active = useMemo(
    () => jobs.filter((j) => j.status !== "complete"),
    [jobs]
  );

  const next3 = useMemo(() => {
    return [...active]
      .sort((a, b) => {
        const da = a.expectedYear * 100 + a.expectedMonth;
        const db = b.expectedYear * 100 + b.expectedMonth;
        if (da !== db) return da - db;
        return (Number(b.amount) || 0) - (Number(a.amount) || 0);
      })
      .slice(0, 3);
  }, [active]);

  const committedCount = active.filter(
    (j) => j.status === "po" || j.status === "in-progress"
  ).length;

  const today = new Date();
  const weekday = today.toLocaleDateString(undefined, { weekday: "long" });

  const vibe = [
    "Send quotes fast. Follow up faster.",
    "Don’t let that sale go. Lock it in.",
    "Pipeline loves speed. Customers love clarity.",
    "Quote, follow up, close. Repeat.",
    "Every call is a chance to win.",
  ][today.getDate() % 5];

  // ✅ End-of-month push progress (workdays, Sundays excluded)
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const totalWorkdays = workdaysInMonth(year, month);
  const elapsedWorkdays = workdaysElapsedSoFar(year, month, today);
  const endOfMonthPushPct = clamp(
    (elapsedWorkdays / totalWorkdays) * 100,
    0,
    100
  );

  const pushLabel =
    endOfMonthPushPct >= 85
      ? "Final push"
      : endOfMonthPushPct >= 60
      ? "Mid-month grind"
      : "Early momentum";

  return (
    <div className="w-full space-y-6">
     {/* Header */}
<div className="flex flex-col gap-3">
  <h1 className="text-3xl font-extrabold tracking-tight">Team Pulse</h1>

  <p className="text-sm text-slate-600">
    {weekday} focus:{" "}
    <span className="font-semibold text-slate-900">{vibe}</span>
  </p>

  {/* Identity Statement */}
  <div className="rounded-xl border border-[#FC2C38]/20 bg-[#FC2C38]/5 p-4">
    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
      Who We Are
    </div>
    <div className="mt-2 text-sm font-semibold text-slate-900">
      We’re not the cheapest yard.
    </div>
    <div className="mt-1 text-sm text-slate-700">
      We’re the easiest. The most helpful. The most knowledgeable.  
      We provide solutions.
    </div>
    <div className="mt-2 text-sm font-bold text-[#FC2C38]">
      We will not be the cheapest.
    </div>
  </div>
</div>

      {/* Hero */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Today’s Mission
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900">
              Let’s Kick Ass Today. 💥
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Don’t let that sale go — speed wins.
            </div>
          </div>

          <div className="rounded-xl bg-[#FC2C38]/10 p-4 ring-1 ring-[#FC2C38]/20">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
              Pipeline Quick Read
            </div>
            <div className="mt-2 text-sm font-semibold text-slate-900">
              Active jobs:{" "}
              <span className="font-extrabold">{active.length}</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              Committed:{" "}
              <span className="font-extrabold">{committedCount}</span> ✅
            </div>
          </div>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Top 3 Next Jobs" subtitle="What’s coming up soon">
          {next3.length === 0 ? (
            <div className="text-sm text-slate-500">
              No jobs added yet. Add some in Jobs.
            </div>
          ) : (
            <div className="space-y-3">
              {next3.map((j) => (
                <div
                  key={j.id}
                  className="rounded-xl border border-slate-200 bg-white p-3"
                >
                  <div className="text-sm font-semibold text-slate-900">
                    {j.customer} — {j.jobName}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {monthLabel(j.expectedMonth)} {j.expectedYear}
                    {j.status === "po"
                      ? " • ✅ PO"
                      : j.status === "in-progress"
                      ? " • 🏗 In Progress"
                      : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Daily Checklist" subtitle="Simple wins = momentum">
          <ul className="space-y-2 text-sm text-slate-700">
            <li>✅ Send all pending quotes</li>
            <li>📞 Follow up on yesterday’s quotes</li>
            <li>🧾 Ask for PO on hot jobs</li>
            <li>🤝 Confirm delivery + schedule</li>
          </ul>
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200">
            Tip: If a quote is older than 24 hours, follow up.
          </div>
        </Card>

        <Card
          title="End of Month Push"
          subtitle="Workdays completed this month (Sundays excluded)"
        >
          <EndOfMonthPush
            value={endOfMonthPushPct}
            elapsed={elapsedWorkdays}
            total={totalWorkdays}
            label={pushLabel}
          />

          <div className="mt-3 text-sm text-slate-700">
            {pushLabel}: stay on quotes + follow-ups — close what’s hot before
            month-end.
          </div>

          <div className="mt-4 rounded-xl bg-[#FC2C38] p-4 text-white">
            <div className="text-sm font-extrabold">End-of-month push.</div>
            <div className="mt-1 text-xs opacity-90">
              Finish strong. Follow up. Ask for the PO.
            </div>
          </div>
        </Card>
      </div>

      {/* Footer hint */}
      <div className="text-xs text-slate-500">
        Want this page to track “Quotes sent today” or “Follow-ups due”? I can
        add a simple tracker stored in localStorage.
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EndOfMonthPush({
  value,
  elapsed,
  total,
  label,
}: {
  value: number;
  elapsed: number;
  total: number;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          End-of-month push
        </div>
        <div className="text-xs font-bold text-slate-700">
          {elapsed}/{total} workdays • {Math.round(value)}%
        </div>
      </div>

      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
        <div
          className="h-full rounded-full bg-[#FC2C38]"
          style={{ width: `${value}%` }}
        />
      </div>

      <div className="mt-2 text-xs text-slate-600">{label}</div>
    </div>
  );
}