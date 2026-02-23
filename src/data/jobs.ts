export type JobStatus = "prospect" | "quoted" | "po" | "in-progress" | "complete";

export type PipelineJob = {
  id: string;
  customer: string;
  jobName: string;
  poNumber?: string;

  expectedYear: number;
  expectedMonth: number; // 1-12

  amount: number; // expected dollars
  status: JobStatus;
  probability: number; // 0-100

  notes?: string;
  createdAt: number;
  updatedAt: number;
};

const KEY = "capital-lumber-pipeline-jobs";

export function monthLabel(m: number) {
  return (
    ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] ??
    `M${m}`
  );
}

export function loadJobs(): PipelineJob[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as PipelineJob[];
  } catch {
    return [];
  }
}

export function saveJobs(jobs: PipelineJob[]) {
  localStorage.setItem(KEY, JSON.stringify(jobs));
}

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}