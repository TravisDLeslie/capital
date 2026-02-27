// src/components/dispatch/utils/constants.ts
import type { DispatchStatus } from "../../../data/dispatch";

export const TIME_SLOTS = [
  "7:00a9:00",
  "9:00–11:00",
  "11:00–1:00",
  "1:00–3:00",
  "3:00–5:00",
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

// 🔐 Dispatcher-only PIN (keep here or in env later)
export const DISPATCH_PIN = "DP3105";