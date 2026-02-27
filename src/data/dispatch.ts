// src/data/dispatch.ts

export const DRIVERS = ["Jaime", "Max", "Nolan", "Ryan", "Travis", "Justin"] as const;
export type DispatchDriver = (typeof DRIVERS)[number];

export const TRUCKS = ["Int 1 (2019)", "Int 2 (2016)", "Int 2025", "Ram 4500"] as const;
export type DispatchTruck = (typeof TRUCKS)[number];

export const DELIVERY_TYPES = [
  "General (dump)",
  "Hand Unload (1 person)",
  "Forklift Unload (Donkey)",
  "Forklift Unload (Moffett)",
  "Hand Unload (2 people)",
] as const;
export type DispatchDeliveryType = (typeof DELIVERY_TYPES)[number];

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
  timeSlot: string;

  customer: string;
  jobName?: string;
  address?: string;
  phone?: string;
  orderRef?: string;

  // ✅ NEW
  deliveryType?: DispatchDeliveryType;
  driver?: DispatchDriver;
  truck?: DispatchTruck;

  status: DispatchStatus;

  notes?: string;
  dependencies?: DispatchDependency[];
};

const KEY = "capital-lumber-dispatch";

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function loadDispatch(): DispatchStop[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as DispatchStop[]) : [];
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
    timeSlot: "7:00–9:00",

    customer: "",
    jobName: "",
    address: "",
    phone: "",
    orderRef: "",

    deliveryType: "General (dump)",
    driver: "Jaime",
    truck: "Int 1 (2019)",

    status: "scheduled",
    notes: "",
    dependencies: [],
  };
}

// Ready = no dependencies OR all marked received
export function isReady(stop: Pick<DispatchStop, "dependencies">) {
  const deps = stop.dependencies ?? [];
  if (!deps.length) return true;
  return deps.every((d) => Boolean(d.received));
}