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

  date: string;      // YYYY-MM-DD
  timeSlot: string;  // "7:00–9:00" etc

  customer: string;
  jobName?: string;
  address?: string;
  phone?: string;

  // ✅ new
  deliveryType?: string; // includes Hotshot, etc
  driver?: string;       // from list
  truck?: string;        // from list

  orderRef?: string;

  status: DispatchStatus;

  // ✅ dispatcher verification
  dispatchChecked?: boolean; // "check that order as well"

  notes?: string;

  dependencies?: DispatchDependency[];
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

export function loadDispatch(): DispatchStop[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
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