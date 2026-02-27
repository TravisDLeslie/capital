// src/components/dispatch/hooks/usePinAction.ts
import { useState } from "react";

export function usePinAction() {
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);

  function requirePin(action: () => void) {
    setPendingAction(() => action);
    setPinOpen(true);
  }

  function cancel() {
    setPinOpen(false);
    setPendingAction(null);
  }

  function success() {
    const act = pendingAction;
    setPinOpen(false);
    setPendingAction(null);
    if (act) act();
  }

  return { pinOpen, requirePin, cancel, success };
}