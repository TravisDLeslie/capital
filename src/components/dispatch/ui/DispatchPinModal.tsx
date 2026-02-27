// src/components/dispatch/ui/DispatchPinModal.tsx
import { useState } from "react";

export default function DispatchPinModal({
  correctPin,
  title,
  subtitle,
  buttonText,
  onSuccess,
  onCancel,
}: {
  correctPin: string;
  title: string;
  subtitle: string;
  buttonText: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function submit() {
    if (pin === correctPin) {
      onSuccess();
      setPin("");
      setError(false);
      return;
    }
    setError(true);
    setPin("");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/35 backdrop-blur-[2px]"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCancel();
        }}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-md shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-700">{subtitle}</div>
        </div>

        <div className="p-5">
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full rounded-lg border border-slate-300 bg-white/70 px-4 py-2 text-center text-lg tracking-widest outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            placeholder="Enter Dispatcher PIN"
            autoFocus
          />

          {error && (
            <p className="mt-3 text-xs font-semibold text-rose-700">
              Wrong PIN. Try again.
            </p>
          )}

          <button
            onClick={submit}
            className="mt-4 w-full rounded-lg bg-[#FC2C38] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
            type="button"
          >
            {buttonText}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full rounded-lg border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}