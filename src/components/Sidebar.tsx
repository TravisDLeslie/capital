// src/components/Sidebar.tsx
import { useEffect, useMemo, useState } from "react";
import type { Page } from "./Header"; // ✅ single source of truth

export default function Sidebar({
  page,
  onNavigate,
  onLogout,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
}) {
  const NavItem = ({
    label,
    value,
    indent = false,
  }: {
    label: string;
    value: Page;
    indent?: boolean;
  }) => {
    const active = page === value;

    return (
      <button onClick={() => onNavigate(value)} className="group w-full text-left" type="button">
        <div
          className={[
            "relative flex items-center gap-2 py-2.5 text-sm font-semibold text-white/90",
            indent ? "pl-10 pr-6" : "px-6",
          ].join(" ")}
        >
          {indent && (
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                active ? "bg-[#FC2C38]" : "bg-white/30 group-hover:bg-white/50",
              ].join(" ")}
            />
          )}

          <span className="truncate">{label}</span>

          {active && <span className="absolute bottom-0 left-6 h-[3px] w-10 bg-[#FC2C38]" />}
          {!active && (
            <span className="absolute bottom-0 left-6 h-[3px] w-0 bg-[#FC2C38] transition-all duration-300 group-hover:w-10" />
          )}
        </div>
      </button>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="px-6 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
      {children}
    </div>
  );

  const isDeckingArea = useMemo(
    () => page === "decking" || page === "fascia" || page === "calculator",
    [page]
  );

  const [deckingOpen, setDeckingOpen] = useState<boolean>(isDeckingArea);

  useEffect(() => {
    if (isDeckingArea) setDeckingOpen(true);
  }, [isDeckingArea]);

  return (
    <aside className="min-h-screen w-72 shrink-0 bg-[#1e1e1e] text-white flex flex-col">
      <div className="flex items-center px-6 py-6 border-b border-white/10">
        <img src="/logo.svg" alt="Capital Lumber Logo" className="h-10 w-auto object-contain" />
      </div>

      <nav className="flex-1">
        <div className="mt-4 space-y-1">
          <NavItem label="Team Pulse" value="pulse" />
          <NavItem label="Sales Dashboard" value="sales" />
        </div>

        <SectionTitle>Price Lookup</SectionTitle>

        <div className="mx-3 mt-2 rounded-xl border border-white/10 bg-white/5">
          <button
            type="button"
            onClick={() => setDeckingOpen((v) => !v)}
            className="group w-full text-left"
          >
            <div className="flex items-center justify-between px-6 py-3 text-sm font-semibold text-white/90">
              <span>Decking</span>
              <span className="text-white/50 transition group-hover:text-white/80">
                {deckingOpen ? "▾" : "▸"}
              </span>
            </div>
          </button>

          {deckingOpen && (
            <div className="pb-2">
              <NavItem label="Decking Price Lookup" value="decking" indent />
              <NavItem label="Fascia Price Lookup" value="fascia" indent />
              <NavItem label="Decking Calculator" value="calculator" indent />
            </div>
          )}
        </div>

        <div className="mx-3 mt-2 rounded-xl border border-white/10 bg-white/5 py-1">
          <NavItem label="Trim Price Lookup" value="trim" />
        </div>

        <SectionTitle>Pipeline</SectionTitle>
        <NavItem label="Jobs Pipeline" value="jobs" />
        <NavItem label="Quotes" value="quotes" />

        <SectionTitle>Admin</SectionTitle>
        <NavItem label="Settings" value="settings" />
      </nav>

      <div className="border-t border-white/10 px-6 py-4 space-y-3">
        <button
          onClick={onLogout}
          type="button"
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          Logout
        </button>
        <div className="text-xs text-white/40">Internal Pricing Tool</div>
      </div>
    </aside>
  );
}