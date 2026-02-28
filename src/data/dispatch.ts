// src/data/dispatch.ts

export type DispatchStatus =
  | "scheduled"
  | "picking"
  | "waiting"
  | "loading"
  | "out"
  | "delivered"
  | "canceled";

export type DispatchDependency = {
  id: string;
  supplier: string;
  poOrRef?: string;
  eta?: string;
  received?: boolean;
  notes?: string;
};

export type DispatchStop = {
  id: string;
  createdAt: number;
  updatedAt?: number;

  date: string; // YYYY-MM-DD
  timeSlot: string; // "7:00am–9:00am" etc

  customer: string;
  jobName?: string;
  address?: string;
  phone?: string;

  // Delivery assignment
  deliveryType?: string; // includes Hotshot, etc
  driver?: string; // from list
  truck?: string; // from list

  orderRef?: string;

  status: DispatchStatus;

  // Dispatcher verification
  dispatchChecked?: boolean; // "check that order as well"

  notes?: string;
  dependencies?: DispatchDependency[];

  // ✅ time the truck left the yard for this stop
  outAt?: number;

  // ✅ Level 1 travel estimate inputs (dispatcher copies from Google Maps live traffic)
  driveMins?: number; // one-way minutes
  bufferMins?: number; // optional per-stop buffer (defaults to 10)
};

const KEY = "capital-lumber-dispatch";

export const DELIVERY_TYPES = [
  "General (dump)",
  "Hand Unload (1 person)",
  "Hand Unload (2 people)",
  "Forklift Unload (Donkey)",
  "Forklift Unload (Moffett)",
  "Hotshot",
] as const;

export const DRIVERS = ["Jaime", "Max", "Nolan", "Ryan", "Travis", "Justin"] as const;

export const TRUCKS = ["Int 1 (2019)", "Int 2 (2016)", "Int 2025", "Ram 4500"] as const;

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/** ✅ migrate older saved timeSlot values to new am/pm format */
function normalizeTimeSlot(slot: any): string {
  const s = String(slot ?? "").trim();

  const map: Record<string, string> = {
    "7:00–9:00": "7:00am–9:00am",
    "9:00–11:00": "9:00am–11:00am",
    "11:00–1:00": "11:00am–1:00pm",
    "1:00–3:00": "1:00pm–3:00pm",
    "3:00–5:00": "3:00pm–5:00pm",

    // also accept variants with spaces or different dash
    "7:00 - 9:00": "7:00am–9:00am",
    "9:00 - 11:00": "9:00am–11:00am",
    "11:00 - 1:00": "11:00am–1:00pm",
    "1:00 - 3:00": "1:00pm–3:00pm",
    "3:00 - 5:00": "3:00pm–5:00pm",
  };

  return map[s] ?? s;
}

export function loadDispatch(): DispatchStop[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];

    // normalize + ensure defaults exist
    return (data as DispatchStop[]).map((x: any) => ({
      ...x,
      timeSlot: normalizeTimeSlot(x.timeSlot),
      driveMins: Number(x.driveMins ?? 0) || 0,
      bufferMins: Number(x.bufferMins ?? 10) || 10,
    }));
  } catch {
    return [];
  }
}

export function saveDispatch(stops: DispatchStop[]) {
  localStorage.setItem(KEY, JSON.stringify(stops));
}

export function emptyStop(date: string): Omit<DispatchStop, "id" | "createdAt" | "updatedAt"> {
  return {
    date,
    timeSlot: "7:00am–9:00am",

    customer: "",
    jobName: "",
    address: "",
    phone: "",

    deliveryType: DELIVERY_TYPES[0],
    driver: DRIVERS[0],
    truck: TRUCKS[0],

    orderRef: "",
    status: "scheduled",
    dispatchChecked: false,
    notes: "",
    dependencies: [],

    // ✅ defaults for Level 1 estimate
    driveMins: 0,
    bufferMins: 10,
  };
}

export function isHotshot(s: Partial<DispatchStop>) {
  return String(s.deliveryType ?? "").toLowerCase().includes("hotshot");
}

export function depsAllReceived(deps?: DispatchDependency[]) {
  if (!deps || deps.length === 0) return true;
  return deps.every((d) => Boolean(d.received));
}

/**
 * ✅ "Ready to Ship" means:
 * - all supplier dependencies received
 * - AND dispatcher checked the order
 */
export function isReadyToShip(s: Partial<DispatchStop>) {
  return depsAllReceived(s.dependencies) && Boolean(s.dispatchChecked);
}

/* ------------------------------------------------------------------ */
/* ✅ Level 1: Rough delivery time helpers                              */
/* ------------------------------------------------------------------ */

const SERVICE_MINUTES: Record<string, number> = {
  "General (dump)": 10,
  "Hand Unload (1 person)": 25,
  "Hand Unload (2 people)": 15,
  "Forklift Unload (Donkey)": 15,
  "Forklift Unload (Moffett)": 10,
  Hotshot: 5,
};

export function serviceMinutes(deliveryType?: string) {
  return SERVICE_MINUTES[deliveryType ?? ""] ?? 15;
}

/**
 * Rough total time (minutes):
 * (drive one-way * 2) + service time + buffer
 */
export function roughTotalMinutes(s: Partial<DispatchStop>) {
  const oneWay = Number(s.driveMins ?? 0) || 0;
  const buffer = Number(s.bufferMins ?? 10) || 0;
  const service = serviceMinutes(s.deliveryType);

  return Math.max(0, Math.round(oneWay * 2 + service + buffer));
}

export function minutesToPretty(mins: number) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${m} min`;
  if (!r) return `${h} hr`;
  return `${h} hr ${r} min`;
}

export function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}