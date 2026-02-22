import { useState } from "react";

interface PinGateProps {
  correctPin: string;
  onUnlock: () => void;
}

export default function PinGate({ correctPin, onUnlock }: PinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit() {
    if (pin === correctPin) {
      sessionStorage.setItem("capital-lumber-unlocked", "true");
      sessionStorage.setItem("capital-lumber-unlocked-at", String(Date.now()));
      onUnlock();
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-10 shadow-xl text-center">
        {/* Logo */}
        <div className="flex justify-center">
          <img
            src="/logoBlack.svg"
            alt="Capital Lumber"
            className="h-16 w-auto object-contain"
          />
        </div>

        <h2 className="mt-6 text-2xl font-extrabold text-slate-900">
          Internal Pricing Access
        </h2>

        <p className="mt-3 text-sm font-medium text-slate-600">
          Let’s Kick Ass Today! Don’t Let That Sale Go!
        </p>

        <input
          type="password"
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          className="mt-8 w-full rounded-lg border border-slate-300 px-4 py-2 text-center text-lg tracking-widest outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
          placeholder="Enter PIN"
          autoFocus
        />

        {error && (
          <p className="mt-3 text-xs font-semibold text-red-500">
            Wrong PIN. Try again.
          </p>
        )}

        <button
          onClick={handleSubmit}
          className="mt-6 w-full rounded-lg bg-[#FC2C38] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
        >
          Unlock Pricing
        </button>
      </div>
    </div>
  );
}