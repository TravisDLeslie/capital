import { useState } from "react";

interface PinGateProps {
  correctPin: string;
  onUnlock: () => void;

  // Optional custom messaging
  title?: string;
  subtitle?: string;
  buttonText?: string;
}

export default function PinGate({
  correctPin,
  onUnlock,
  title = "Access Required",
  subtitle = "Enter PIN to continue.",
  buttonText = "Unlock",
}: PinGateProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  function handleSubmit() {
    if (pin === correctPin) {
      onUnlock(); // no more sessionStorage here
      setPin("");
    } else {
      setError(true);
      setPin("");
    }
  }

  return (
    <div className="w-full text-center">
      {/* Logo */}
      <div className="flex justify-center">
        <img
          src="/logoBlack.svg"
          alt="Capital Lumber"
          className="h-14 w-auto object-contain"
        />
      </div>

      <h2 className="mt-6 text-xl font-extrabold text-slate-900">
        {title}
      </h2>

      <p className="mt-3 text-sm font-medium text-slate-600">
        {subtitle}
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
        className="mt-6 w-full rounded-lg border border-slate-300 px-4 py-2 text-center text-lg tracking-widest outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
        placeholder="Enter PIN"
        autoFocus
      />

      {error && (
        <p className="mt-3 text-xs font-semibold text-red-500">
          Incorrect PIN. Try again.
        </p>
      )}

      <button
        onClick={handleSubmit}
        className="mt-6 w-full rounded-lg bg-[#FC2C38] py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.99]"
      >
        {buttonText}
      </button>
    </div>
  );
}