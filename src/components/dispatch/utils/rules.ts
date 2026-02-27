// src/components/dispatch/utils/rules.ts
import type { DispatchStatus, DispatchStop } from "../../../data/dispatch";

export function requiresDispatchChecked(status: DispatchStatus) {
  return status === "loading" || status === "out" || status === "delivered";
}

export function validateStopForSubmit(draft: Omit<DispatchStop, "id" | "createdAt" | "updatedAt">) {
  const customer = (draft.customer ?? "").trim();
  if (!customer) return { ok: false as const, error: "Customer is required." };

  if (requiresDispatchChecked(draft.status) && !draft.dispatchChecked) {
    return {
      ok: false as const,
      error: "To set Loading / Out / Delivered, you must check ✅ Order checked.",
    };
  }

  return { ok: true as const, customer };
}