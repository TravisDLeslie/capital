import { useEffect, useMemo, useState } from "react";

const SETTINGS_UNLOCK_KEY = "capital-lumber-settings-unlocked";
const SETTINGS_UNLOCK_AT_KEY = "capital-lumber-settings-unlocked-at";
const SETTINGS_NOTES_KEY = "capital-lumber-settings-notes";

// You can change how long Settings stays unlocked (minutes)
const SETTINGS_TTL_MS = 60 * 60 * 1000; // 1 hour

function isSettingsUnlocked() {
  const ok = sessionStorage.getItem(SETTINGS_UNLOCK_KEY) === "true";
  const at = Number(sessionStorage.getItem(SETTINGS_UNLOCK_AT_KEY) || "0");
  if (!ok || !at) return false;
  return Date.now() - at < SETTINGS_TTL_MS;
}

function setSettingsUnlocked() {
  sessionStorage.setItem(SETTINGS_UNLOCK_KEY, "true");
  sessionStorage.setItem(SETTINGS_UNLOCK_AT_KEY, String(Date.now()));
}

function lockSettings() {
  sessionStorage.removeItem(SETTINGS_UNLOCK_KEY);
  sessionStorage.removeItem(SETTINGS_UNLOCK_AT_KEY);
}

async function copyText(text: string) {
  // modern clipboard
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "-9999px";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function Settings({ settingsPin }: { settingsPin: string }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => isSettingsUnlocked());
  const [showModal, setShowModal] = useState<boolean>(() => !isSettingsUnlocked());
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string>("");

  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem(SETTINGS_NOTES_KEY) || "";
  });

  useEffect(() => {
    localStorage.setItem(SETTINGS_NOTES_KEY, notes);
  }, [notes]);

  // Auto re-lock settings when TTL expires
  useEffect(() => {
    if (!unlocked) return;
    const id = window.setInterval(() => {
      if (!isSettingsUnlocked()) {
        lockSettings();
        setUnlocked(false);
        setShowModal(true);
      }
    }, 15_000);
    return () => window.clearInterval(id);
  }, [unlocked]);

  const commands = useMemo(() => {
    return [
      {
        title: "Import Decking CSV",
        cmd: "node scripts/import-pricing-csv.cjs decking.csv src/data/decking.ts",
        hint: "Run from your project root (capital-lumber folder).",
      },
      {
        title: "Import Fascia CSV",
        cmd: "node scripts/import-pricing-csv.cjs fascia.csv src/data/fascia.ts",
        hint: "Run from your project root (capital-lumber folder).",
      },
    ];
  }, []);

  async function handleCopy(cmd: string) {
    const ok = await copyText(cmd);
    if (!ok) alert("Copy failed. Try selecting the text and copying manually.");
  }

  function handleUnlock() {
    setError("");
    if (pin.trim() !== settingsPin) {
      setError("Wrong PIN.");
      return;
    }
    setSettingsUnlocked();
    setUnlocked(true);
    setShowModal(false);
    setPin("");
  }

  function handleLock() {
    lockSettings();
    setUnlocked(false);
    setShowModal(true);
    setPin("");
    setError("");
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600">
            Admin-only tools: CSV import commands + internal notes.
          </p>
        </div>

        {unlocked && (
          <button
            onClick={handleLock}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            title="Lock Settings"
          >
            Lock Settings
          </button>
        )}
      </div>

      {/* Locked overlay trigger */}
      {!unlocked && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">
            Settings are locked
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Enter the Settings PIN to view scripts and notes.
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Enter PIN
          </button>
        </div>
      )}

      {/* Unlocked content */}
      {unlocked && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Scripts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">
              CSV Import Scripts
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Paste these into Terminal (project root).
            </div>

            <div className="mt-4 space-y-4">
              {commands.map((c) => (
                <div key={c.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {c.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{c.hint}</div>
                    </div>

                    <button
                      onClick={() => handleCopy(c.cmd)}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Copy
                    </button>
                  </div>

                  <pre className="mt-3 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-800">
{c.cmd}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-slate-900">
              Script Notes / Internal Notes
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Saved locally in your browser.
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add reminders like: where CSV files live, column rules, image folder rules, etc..."
              className="mt-4 h-72 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
            />

            <div className="mt-3 text-xs text-slate-500">
              Tip: You can paste “how-to” steps for the team here.
            </div>
          </div>
        </div>
      )}

      {/* PIN MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => {
            // click outside to close (optional)
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">
                Settings PIN
              </div>
              <div className="mt-1 text-xs text-slate-500">
                Enter PIN to unlock admin settings.
              </div>
            </div>

            <div className="px-5 py-5">
              <label className="text-xs font-semibold text-slate-600">
                PIN
              </label>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUnlock();
                }}
                inputMode="numeric"
                autoFocus
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
                placeholder="••••"
              />

              {error && (
                <div className="mt-2 text-xs font-semibold text-[#FC2C38]">
                  {error}
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                    setPin("");
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleUnlock}
                  className="rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}