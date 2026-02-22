import { useMemo, useState } from "react";
import SettingsPinModal from "./SettingsPinModal";

const NOTES_KEY = "capital-lumber-settings-notes";
const SETTINGS_UNLOCK_KEY = "capital-lumber-settings-unlocked";

export default function Settings({ settingsPin }: { settingsPin: string }) {
  const [notes, setNotes] = useState(() => localStorage.getItem(NOTES_KEY) ?? "");
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [unlocked, setUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem(SETTINGS_UNLOCK_KEY) === "true";
  });

  // ✅ Your exact commands
  const commands = useMemo(
    () => [
      {
        title: "Import Decking CSV → src/data/decking.ts",
        cmd: "node scripts/import-pricing-csv.cjs decking.csv src/data/decking.ts",
      },
      {
        title: "Import Fascia CSV → src/data/fascia.ts",
        cmd: "node scripts/import-pricing-csv.cjs fascia.csv src/data/fascia.ts",
      },
    ],
    []
  );

  function saveNotes(next: string) {
    setNotes(next);
    localStorage.setItem(NOTES_KEY, next);
  }

  function onUnlocked() {
    setUnlocked(true);
    sessionStorage.setItem(SETTINGS_UNLOCK_KEY, "true");
  }

  function lockSettings() {
    setUnlocked(false);
    sessionStorage.removeItem(SETTINGS_UNLOCK_KEY);
  }

  return (
    <div className="w-full">
      <SettingsPinModal
        open={modalOpen}
        correctPin={settingsPin}
        onClose={() => setModalOpen(false)}
        onSuccess={onUnlocked}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Settings</h2>
            <p className="mt-1 text-xs text-slate-500">
              Internal notes + CSV import commands.
            </p>
          </div>

          <button
            onClick={() => {
              if (!unlocked) setModalOpen(true);
              else lockSettings();
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            title={unlocked ? "Lock settings" : "Unlock settings"}
          >
            {unlocked ? "Lock" : "Unlock"}
          </button>
        </div>

        {!unlocked ? (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto max-w-md">
              <div className="text-sm font-semibold text-slate-800">Locked</div>
              <div className="mt-2 text-sm text-slate-600">
                Click <span className="font-semibold">Unlock</span> to enter the Settings PIN.
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-5 rounded-lg bg-[#FC2C38] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Unlock Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-6">
            {/* Notes */}
            <section>
              <div className="text-xs font-semibold text-slate-700">Script Notes</div>
              <textarea
                value={notes}
                onChange={(e) => saveNotes(e.target.value)}
                placeholder="Paste internal notes here (vendors, quirks, pricing rules, etc.)"
                className="mt-2 min-h-[180px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#FC2C38] focus:ring-2 focus:ring-[#FC2C38]/20"
              />
              <div className="mt-2 text-[11px] text-slate-500">
                Auto-saves to this browser (localStorage).
              </div>
            </section>

            {/* Commands */}
            <section>
              <div className="text-xs font-semibold text-slate-700">CSV Import Commands</div>

              <div className="mt-3 space-y-3">
                {commands.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-xs font-semibold text-slate-800">{c.title}</div>

                    <pre className="mt-2 overflow-auto rounded-md border border-slate-200 bg-white p-3 text-[12px] text-slate-800">
{c.cmd}
                    </pre>

                    <button
                      onClick={() => navigator.clipboard.writeText(c.cmd)}
                      className="mt-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Copy
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-slate-500">
                Tip: Put your CSV files in the project root (next to package.json) so these commands work as-is.
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}