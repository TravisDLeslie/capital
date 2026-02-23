import { useEffect, useMemo, useState } from "react";
import { monthlySales, monthLabel } from "../data/sales";
import {
  loadJobs,
  monthLabel as jobMonthLabel,
  type PipelineJob,
} from "../data/jobs";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate(); // month 1-12
}
function isSameMonth(aYear: number, aMonth: number, d: Date) {
  return aYear === d.getFullYear() && aMonth === d.getMonth() + 1;
}

function getMonthValue(year: number, month: number) {
  return (
    monthlySales.find((x) => x.year === year && x.month === month)?.chargedOut ??
    0
  );
}
function sumUpToMonth(year: number, month: number) {
  return monthlySales
    .filter((x) => x.year === year && x.month >= 1 && x.month <= month)
    .reduce(
      (sum, x) => sum + (Number.isFinite(x.chargedOut) ? x.chargedOut : 0),
      0
    );
}
function sumFullYear(year: number) {
  return monthlySales
    .filter((x) => x.year === year)
    .reduce(
      (sum, x) => sum + (Number.isFinite(x.chargedOut) ? x.chargedOut : 0),
      0
    );
}
function availableYears() {
  const ys = Array.from(new Set(monthlySales.map((x) => x.year))).sort(
    (a, b) => b - a
  );
  return ys.length ? ys : [new Date().getFullYear()];
}

/** ===== Pipeline helpers ===== */
function isCommittedStatus(s: PipelineJob["status"]) {
  return s === "po" || s === "in-progress";
}
function sortByExpectedDate(a: PipelineJob, b: PipelineJob) {
  const da = a.expectedYear * 100 + a.expectedMonth;
  const db = b.expectedYear * 100 + b.expectedMonth;
  if (da !== db) return da - db;
  return b.amount - a.amount;
}
function weightedAmount(job: PipelineJob) {
  const p = clamp(Number(job.probability) || 0, 0, 100) / 100;
  return (Number(job.amount) || 0) * p;
}

function StatCard({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const toneCls =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "warn"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </div>
      {sub && (
        <div
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneCls}`}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function BarChart({
  values,
  goalLine,
}: {
  values: { label: string; value: number }[];
  goalLine?: number;
}) {
  const max = Math.max(1, ...values.map((v) => v.value), goalLine ?? 0);
  const h = 140;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Monthly Charged Out
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Fast visual scan. Goal line shows required monthly pace.
          </div>
        </div>
      </div>

      <div className="mt-4">
        <svg viewBox={`0 0 720 ${h + 30}`} className="w-full">
          {goalLine && goalLine > 0 && (
            <>
              {(() => {
                const y = (1 - goalLine / max) * h + 10;
                return (
                  <>
                    <line
                      x1="30"
                      y1={y}
                      x2="710"
                      y2={y}
                      stroke="#FC2C38"
                      strokeDasharray="6 6"
                    />
                    <text x="30" y={y - 6} fontSize="10" fill="#FC2C38">
                      Monthly goal: {money(goalLine)}
                    </text>
                  </>
                );
              })()}
            </>
          )}

          {values.map((v, i) => {
            const barW = 44;
            const gap = 14;
            const x = 30 + i * (barW + gap);
            const barH = (v.value / max) * h;
            const y = 10 + (h - barH);

            return (
              <g key={v.label}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="10"
                  fill="#0f172a"
                  opacity="0.08"
                />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx="10"
                  fill="#FC2C38"
                  opacity="0.85"
                />
                <text
                  x={x + barW / 2}
                  y={h + 26}
                  fontSize="10"
                  textAnchor="middle"
                  fill="#64748b"
                >
                  {v.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/** ✅ Updated: accepts year + ytdChargedOut so we can show an outlook */
function PipelineWidget({
  year,
  ytdChargedOut,
}: {
  year: number;
  ytdChargedOut: number;
}) {
  const [jobs, setJobs] = useState<PipelineJob[]>(() => loadJobs());

  // keep dashboard updated if jobs change in another tab/window
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "capital-lumber-pipeline-jobs") setJobs(loadJobs());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeJobs = useMemo(
    () => jobs.filter((j) => j.status !== "complete"),
    [jobs]
  );

  // ✅ Only jobs expected in the selected year
  const activeJobsThisYear = useMemo(
    () => activeJobs.filter((j) => j.expectedYear === year),
    [activeJobs, year]
  );

  const totals = useMemo(() => {
    const committed = activeJobsThisYear
      .filter((j) => isCommittedStatus(j.status))
      .reduce((s, j) => s + (Number(j.amount) || 0), 0);

    const weighted = activeJobsThisYear.reduce(
      (s, j) => s + weightedAmount(j),
      0
    );

    return { committed, weighted };
  }, [activeJobsThisYear]);

  const nextJobs = useMemo(() => {
    return [...activeJobsThisYear].sort(sortByExpectedDate).slice(0, 6);
  }, [activeJobsThisYear]);

  // ✅ Combined outlook numbers
  const outlookCommitted = useMemo(
    () => (Number(ytdChargedOut) || 0) + (Number(totals.committed) || 0),
    [ytdChargedOut, totals.committed]
  );
  const outlookWeighted = useMemo(
    () => (Number(ytdChargedOut) || 0) + (Number(totals.weighted) || 0),
    [ytdChargedOut, totals.weighted]
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Pipeline Snapshot ({year})
          </div>
          <div className="mt-1 text-xs text-slate-500">
            PO jobs + upcoming work so we can see where sales are going.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Committed (PO + In Progress)
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {money(totals.committed)}
          </div>
          <div className="mt-1 text-xs text-slate-500">Real work in-hand.</div>
        </div>

        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Weighted Forecast
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {money(totals.weighted)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Includes probability.
          </div>
        </div>
      </div>

      {/* ✅ New: Year outlook (Charged Out + Pipeline) */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Year Outlook
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Charged out YTD + pipeline = where the year can land.
            </div>
          </div>

          <span className="rounded-full bg-[#FC2C38]/10 px-3 py-1 text-xs font-bold text-slate-900 ring-1 ring-[#FC2C38]/20">
            {year}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Charged Out YTD
            </div>
            <div className="mt-2 text-xl font-extrabold text-slate-900">
              {money(Number(ytdChargedOut) || 0)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Actuals booked so far.
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Outlook (YTD + Committed)
            </div>
            <div className="mt-2 text-xl font-extrabold text-slate-900">
              {money(outlookCommitted)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Conservative view (PO + in-progress).
            </div>
          </div>

        </div>
      </div>

      {/* Next jobs */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Next jobs coming up
          </div>
          <div className="text-xs text-slate-500">
            {activeJobsThisYear.length} active
          </div>
        </div>

        <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {nextJobs.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-500">
              No pipeline jobs yet for {year}. Add PO work in the Jobs page.
            </div>
          ) : (
            nextJobs.map((j) => (
              <div
                key={j.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-900">
                    {j.customer} — {j.jobName}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {jobMonthLabel(j.expectedMonth)} {j.expectedYear}
                    {j.poNumber ? ` • PO ${j.poNumber}` : ""}
                    {j.status === "po"
                      ? " • ✅ PO"
                      : j.status === "in-progress"
                      ? " • 🏗 In Progress"
                      : ""}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-900">
                    {money(Number(j.amount) || 0)}
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.round(clamp(Number(j.probability) || 0, 0, 100))}% •{" "}
                    {money(weightedAmount(j))} wtd
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3 rounded-xl bg-[#FC2C38]/10 p-3 text-xs text-slate-700 ring-1 ring-[#FC2C38]/20">
          💡 Tip: Keep PO jobs updated with expected month — the forecast becomes
          scary accurate.
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const years = useMemo(() => availableYears(), []);
  const now = new Date();

  const defaultYear = years[0] ?? now.getFullYear();
  const defaultMonth = now.getMonth() + 1;

  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(clamp(defaultMonth, 1, 12));

  // Goal state
  const total2025 = useMemo(() => sumFullYear(2025), []);
  const target2026 = useMemo(() => total2025 * 1.25, [total2025]);

  const [annualGoal, setAnnualGoal] = useState<number>(() =>
    defaultYear === 2026 ? target2026 : 1_800_000
  );
  const [goalTouched, setGoalTouched] = useState(false);

  useEffect(() => {
    if (year === 2026 && !goalTouched) setAnnualGoal(target2026);
  }, [year, target2026, goalTouched]);

  // Core values
  const ytd = useMemo(() => sumUpToMonth(year, month), [year, month]);
  const mtd = useMemo(() => getMonthValue(year, month), [year, month]);

  const lastMonthVal = useMemo(() => {
    if (month === 1) return getMonthValue(year - 1, 12);
    return getMonthValue(year, month - 1);
  }, [year, month]);

  // Days left & pace (only if selected month is current month on this computer)
  const showDaysLeft = isSameMonth(year, month, now);
  const totalDays = daysInMonth(year, month);
  const dayOfMonth = now.getDate();

  const daysLeft = showDaysLeft ? Math.max(0, totalDays - dayOfMonth) : 0;
  const daysElapsed = showDaysLeft ? Math.max(1, dayOfMonth) : 0;

  const pacePerDay = showDaysLeft ? mtd / daysElapsed : 0;
  const projectedMonthEnd = showDaysLeft ? pacePerDay * totalDays : 0;

  // Goal / pace metrics
  const monthsCompleted = month;
  const pacePerMonth = monthsCompleted > 0 ? ytd / monthsCompleted : 0;
  const forecast = pacePerMonth * 12;

  const remaining = Math.max(0, annualGoal - ytd);
  const monthsLeft = Math.max(0, 12 - month);
  const neededPerMonth = monthsLeft > 0 ? remaining / monthsLeft : remaining;

  const monthlyGoalLine = annualGoal / 12;
  const goalProgress =
    annualGoal > 0 ? clamp((ytd / annualGoal) * 100, 0, 999) : 0;

  const lmDiff = mtd - lastMonthVal;
  const lmPct = lastMonthVal > 0 ? (lmDiff / lastMonthVal) * 100 : 0;

  const vibe =
    goalProgress >= 100
      ? "🏆 Goal crushed. Raise the bar."
      : goalProgress >= 70
      ? "🔥 On pace. Keep the hammer down."
      : "👀 Eyes on the prize — the next close matters.";

  const monthValues = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      return { label: monthLabel(m), value: getMonthValue(year, m) };
    });
  }, [year]);

  return (
    <div className="w-full">
      {/* Header + Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Charged-out scoreboard + pipeline snapshot — keep the team locked on
            the goal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year */}
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Year
            </div>
            <select
              className="mt-1 w-28 bg-transparent text-sm font-semibold text-slate-900 outline-none"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Month */}
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Month
            </div>
            <select
              className="mt-1 w-28 bg-transparent text-sm font-semibold text-slate-900 outline-none"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {monthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Goal */}
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Annual Goal {year === 2026 ? "(auto +25%)" : ""}
            </div>
            <input
              value={Math.round(annualGoal)}
              onChange={(e) => {
                setGoalTouched(true);
                setAnnualGoal(
                  Number(e.target.value.replace(/[^0-9]/g, "")) || 0
                );
              }}
              inputMode="numeric"
              className="mt-1 w-44 bg-transparent text-sm font-semibold text-slate-900 outline-none"
              placeholder="1800000"
            />
          </div>
        </div>
      </div>

      {/* Headline YTD progress */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              YTD Goal Progress
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {vibe}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">YTD / Goal</div>
            <div className="text-sm font-extrabold text-slate-900">
              {money(ytd)} / {money(annualGoal)}
            </div>
          </div>
        </div>

        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-[#FC2C38]"
            style={{ width: `${clamp(goalProgress, 0, 100)}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {round1(goalProgress)}% of goal • Forecast at current pace:{" "}
          <span className="font-semibold text-slate-900">{money(forecast)}</span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`YTD (${year})`}
          value={money(ytd)}
          sub={`${monthLabel(month)} selected`}
        />

        <StatCard
          label={`MTD (${monthLabel(month)})`}
          value={money(mtd)}
          sub={
            showDaysLeft
              ? `⏳ ${daysLeft} day(s) left • Pace: ${money(pacePerDay)} / day`
              : lastMonthVal > 0
              ? `${lmDiff >= 0 ? "🚀 Up" : "⚠️ Down"} ${round1(
                  Math.abs(lmPct)
                )}% vs last month`
              : "Add last month data"
          }
          tone={
            showDaysLeft
              ? "neutral"
              : lastMonthVal > 0
              ? lmDiff >= 0
                ? "good"
                : "warn"
              : "neutral"
          }
        />

        <StatCard
          label="Projected Month-End"
          value={showDaysLeft ? money(projectedMonthEnd) : "—"}
          sub={
            showDaysLeft
              ? `Based on pace (${money(pacePerDay)}/day)`
              : "Select current month to project"
          }
          tone="neutral"
        />

        <StatCard
          label="Needed / Month"
          value={monthsLeft > 0 ? money(neededPerMonth) : money(remaining)}
          sub={monthsLeft > 0 ? `${monthsLeft} month(s) left` : "Year complete"}
          tone={remaining <= 0 ? "good" : "neutral"}
        />
      </div>

      {/* Chart + Pipeline */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <BarChart values={monthValues} goalLine={monthlyGoalLine} />

          {/* ✅ Pipeline now uses selected year + YTD charged out */}
          <PipelineWidget year={year} ytdChargedOut={ytd} />
        </div>

        {/* Insights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">
            Keep your eye on the goal
          </div>

          <div className="mt-3 text-sm text-slate-600">
            <ul className="space-y-2">
              <li>
                🎯{" "}
                <span className="font-semibold text-slate-900">Goal gap:</span>{" "}
                {money(Math.max(0, annualGoal - ytd))}
              </li>
              <li>
                ⏱️{" "}
                <span className="font-semibold text-slate-900">
                  Current pace:
                </span>{" "}
                {money(pacePerMonth)} / month
              </li>
              <li>
                🧮{" "}
                <span className="font-semibold text-slate-900">Forecast:</span>{" "}
                {money(forecast)}
              </li>
              <li>
                💥{" "}
                <span className="font-semibold text-slate-900">Simple play:</span>{" "}
                quotes fast, follow-up faster, don’t let deals cool off.
              </li>
            </ul>
          </div>

          <div className="mt-5 rounded-xl bg-[#FC2C38] p-4 text-white">
            <div className="text-sm font-extrabold">Let’s Kick Ass Today.</div>
            <div className="mt-1 text-xs opacity-90">
              Don’t let that sale go. Every quote counts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}