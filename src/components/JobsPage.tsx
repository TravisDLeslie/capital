import { useMemo, useState } from "react";
import {
  type PipelineJob,
  type JobStatus,
  loadJobs,
  saveJobs,
  uid,
  monthLabel,
} from "../data/jobs";

function money(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

const statusLabel: Record<JobStatus, string> = {
  prospect: "Prospect",
  quoted: "Quoted",
  po: "PO (Committed)",
  "in-progress": "In Progress",
  complete: "Complete",
};

function statusPill(status: JobStatus) {
  switch (status) {
    case "po":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "quoted":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "in-progress":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "complete":
      return "bg-slate-100 text-slate-700 ring-slate-200";
    default:
      return "bg-rose-50 text-rose-700 ring-rose-200";
  }
}

type Draft = Omit<PipelineJob, "id" | "createdAt" | "updatedAt">;

function emptyDraft(): Draft {
  const now = new Date();
  return {
    customer: "",
    jobName: "",
    poNumber: "",
    expectedYear: now.getFullYear(),
    expectedMonth: now.getMonth() + 1,
    amount: 0,
    status: "po",
    probability: 80,
    notes: "",
  };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<PipelineJob[]>(() => loadJobs());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<JobStatus | "all">("all");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft());

  function persist(next: PipelineJob[]) {
    setJobs(next);
    saveJobs(next);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return jobs
      .filter((j) => (status === "all" ? true : j.status === status))
      .filter((j) => {
        if (!q) return true;
        return `${j.customer} ${j.jobName} ${j.poNumber ?? ""} ${j.notes ?? ""}`
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => {
        const da = a.expectedYear * 100 + a.expectedMonth;
        const db = b.expectedYear * 100 + b.expectedMonth;
        if (da !== db) return da - db;
        return b.amount - a.amount;
      });
  }, [jobs, query, status]);

  const totals = useMemo(() => {
    const active = jobs.filter((j) => j.status !== "complete");

    const committed = active
      .filter((j) => j.status === "po" || j.status === "in-progress")
      .reduce((s, j) => s + (Number(j.amount) || 0), 0);

    const weighted = active.reduce((s, j) => {
      const p = clamp(Number(j.probability) || 0, 0, 100) / 100;
      return s + (Number(j.amount) || 0) * p;
    }, 0);

    return { committed, weighted };
  }, [jobs]);

  function openNew() {
    setEditingId(null);
    setDraft(emptyDraft());
    setOpen(true);
  }

  function openEdit(job: PipelineJob) {
    setEditingId(job.id);
    const { id, createdAt, updatedAt, ...rest } = job;
    setDraft(rest);
    setOpen(true);
  }

  function remove(id: string) {
    persist(jobs.filter((j) => j.id !== id));
  }

  function submit() {
    const customer = draft.customer.trim();
    const jobName = draft.jobName.trim();
    if (!customer || !jobName) return;

    const now = Date.now();

    if (editingId) {
      persist(
        jobs.map((j) =>
          j.id === editingId
            ? {
                ...j,
                ...draft,
                amount: Number(draft.amount) || 0,
                probability: Number(draft.probability) || 0,
                updatedAt: now,
              }
            : j
        )
      );
    } else {
      const newJob: PipelineJob = {
        id: uid(),
        ...draft,
        amount: Number(draft.amount) || 0,
        probability: Number(draft.probability) || 0,
        createdAt: now,
        updatedAt: now,
      };
      persist([newJob, ...jobs]);
    }

    setOpen(false);
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Pipeline Jobs</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Track PO jobs + future work so the team can see what’s coming next.
          </p>
        </div>

        <button
          onClick={openNew}
          className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Add Job
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card label="Committed (PO + In Progress)" value={money(totals.committed)} sub="PO in hand = real money coming." />
        <Card label="Forecast (Weighted)" value={money(totals.weighted)} sub="Probability-adjusted pipeline." />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="w-full sm:max-w-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, job, PO #, notes..."
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
            <option value="prospect">Prospect</option>
            <option value="quoted">Quoted</option>
            <option value="po">PO (Committed)</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-800">Jobs</div>
        </div>

        <div className="overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500">
              <tr className="text-left">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">PO #</th>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Prob</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filtered.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{j.customer}</td>
                  <td className="px-4 py-3 text-slate-800">{j.jobName}</td>
                  <td className="px-4 py-3 text-slate-600">{j.poNumber || "—"}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {monthLabel(j.expectedMonth)} {j.expectedYear}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {money(Number(j.amount) || 0)}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-800">
                    {Math.round(clamp(Number(j.probability) || 0, 0, 100))}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusPill(j.status)}`}>
                      {statusLabel[j.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openEdit(j)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(j.id)}
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filtered.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No jobs yet. Add one with <span className="font-semibold">+ Add Job</span>.
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
              {editingId ? "Edit Job" : "Add Job"}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              PO jobs = committed pipeline. Probabilities help forecasting.
            </div>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Customer">
                <input
                  value={draft.customer}
                  onChange={(e) => setDraft((d) => ({ ...d, customer: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Job Name">
                <input
                  value={draft.jobName}
                  onChange={(e) => setDraft((d) => ({ ...d, jobName: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="PO # (optional)">
                <input
                  value={draft.poNumber ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, poNumber: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Amount">
                <input
                  value={String(draft.amount ?? 0)}
                  onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) || 0 }))}
                  inputMode="decimal"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Expected Month">
                <select
                  value={draft.expectedMonth}
                  onChange={(e) => setDraft((d) => ({ ...d, expectedMonth: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {monthLabel(m)}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Expected Year">
                <input
                  value={String(draft.expectedYear)}
                  onChange={(e) => setDraft((d) => ({ ...d, expectedYear: Number(e.target.value) || new Date().getFullYear() }))}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>

              <Field label="Status">
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as JobStatus }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                >
                  <option value="prospect">Prospect</option>
                  <option value="quoted">Quoted</option>
                  <option value="po">PO (Committed)</option>
                  <option value="in-progress">In Progress</option>
                  <option value="complete">Complete</option>
                </select>
              </Field>

              <Field label="Probability %">
                <input
                  value={String(draft.probability ?? 0)}
                  onChange={(e) => setDraft((d) => ({ ...d, probability: Number(e.target.value) || 0 }))}
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                />
              </Field>
            </div>

            <Field label="Notes (optional)">
              <textarea
                value={draft.notes ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                className="h-24 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              />
            </Field>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                {editingId ? "Save Changes" : "Add Job"}
              </button>
            </div>
          </div>
        </Modal>
      )}
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
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
}