// src/components/dispatch/utils/format.ts
import type { DispatchStatus, DispatchStop } from "../../../data/dispatch";

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function pill(status: DispatchStatus) {
  switch (status) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "out":
      return "bg-sky-50 text-sky-700 ring-sky-200";
    case "loading":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "waiting":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "canceled":
      return "bg-slate-100 text-slate-600 ring-slate-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export function tipForStop(s: DispatchStop) {
  return [
    s.customer,
    s.jobName ? `Job: ${s.jobName}` : "",
    s.driver ? `Driver: ${s.driver}` : "",
    s.truck ? `Truck: ${s.truck}` : "",
    s.deliveryType ? `Type: ${s.deliveryType}` : "",
    s.address ? `Addr: ${s.address}` : "",
  ]
    .filter(Boolean)
    .join(" • ");
}