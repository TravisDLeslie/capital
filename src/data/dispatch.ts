// src/data/dispatch.ts

export const DELIVERY_TYPES = [
  "General (dump)",
  "Hand Unload (1 person)",
  "Hand Unload (2 people)",
  "Forklift Unload (Donkey)",
  "Forklift Unload (Moffett)",
] as const;

export type DeliveryType = (typeof DELIVERY_TYPES)[number];

export const DRIVERS = ["Jaime", "Max", "Nolan", "Ryan", "Travis", "Justin"] as const;
export type DriverName = (typeof DRIVERS)[number];

export const TRUCKS = ["Int 1 (2019)", "Int 2 (2016)", "Int 2025 (Moffett Only)", "Ram 4500"] as const;
export type TruckName = (typeof TRUCKS)[number];

export const TIME_SLOTS = [
  "7:00 AM",
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
] as const;

export type DispatchStatus = "scheduled" | "enroute" | "delivered" | "hold";

export type DispatchOrder = {
  id: string;

  date: string; // YYYY-MM-DD
  timeSlot: (typeof TIME_SLOTS)[number];

  customer: string;
  jobName?: string;
  address?: string;

  deliveryType: DeliveryType;
  driver: DriverName;
  truck: TruckName;

  waitingOnSuppliers?: string[]; // ["Boise Cascade - LVL", "Truss plant", ...]
  notes?: string;

  status: DispatchStatus;
};

const KEY = "capital-lumber-dispatch";

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function loadDispatch(): DispatchOrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveDispatch(items: DispatchOrder[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function emptyDispatchOrder(): Omit<DispatchOrder, "id"> {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const iso = `${yyyy}-${mm}-${dd}`;

  return {
    date: iso,
    timeSlot: "8:00 AM",

    customer: "",
    jobName: "",
    address: "",

    deliveryType: "General (dump)",
    driver: "Jaime",
    truck: "Int 1 (2019)",

    waitingOnSuppliers: [],
    notes: "",

    status: "scheduled",
  };
}