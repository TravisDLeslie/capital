import { useEffect, useMemo, useState } from "react";

export default function SettingsPinModal({
  open,
  correctPin,
  onClose,
  onSuccess,
}: {
  open: boolean;
  correctPin: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const cleanedPin = useMemo(() => pin.replace(/\D/g, "").slice(0, 8), [pin]);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setError("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function submit() {
    if (cleanedPin === correctPin) {
      onSuccess();
      onClose();
      return;
    }
    setError("Wrong PIN.");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="text-sm font-semibold text-slate-900">
            Enter Settings PIN
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Admin-only access.
          </div>
        </div>

        <div className="px-6 py-5">
          <label className="text-xs font-semibold text-slate-600">PIN</label>
          <input
            autoFocus
            value={cleanedPin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            placeholder="••••"
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />

          {error && (
            <div className="mt-2 text-xs font-semibold text-red-500">
              {error}
            </div>
          )}

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              onClick={submit}
              className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}