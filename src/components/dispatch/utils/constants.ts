// src/components/dispatch/utils/constants.ts
import type { DispatchStatus } from "../../../data/dispatch";

export const TIME_SLOTS = [
  "7:00am–9:00am",
  "9:00am–11:00am",
  "11:00am–1:00pm",
  "1:00pm–3:00pm",
  "3:00pm–5:00pm",
] as const;

export const STATUS: { value: DispatchStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "picking", label: "Picking" },
  { value: "waiting", label: "Waiting on Supplier" },
  { value: "loading", label: "Loading" },
  { value: "out", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "canceled", label: "Canceled" },
];

// 🔐 Dispatcher-only PIN (move to env later if you want)
export const DISPATCH_PIN = "DP3105";