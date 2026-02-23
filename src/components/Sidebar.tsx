import React from "react";

type Page = "dashboard" | "decking" | "fascia" | "calculator" | "settings";

export default function Sidebar({
  page,
  onNavigate,
  onLogout,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
}) {
  const TopItem = ({ label, value }: { label: string; value: Page }) => {
    const active = page === value;

    return (
      <button
        onClick={() => onNavigate(value)}
        className="group w-full text-left"
      >
        <div className="relative flex items-center justify-between px-6 py-3 text-sm font-semibold text-white">
          <span className={active ? "text-white" : "text-white/85 group-hover:text-white"}>
            {label}
          </span>

          {/* Active underline */}
          {active && (
            <span className="absolute bottom-0 left-6 h-[3px] w-10 bg-[#FC2C38]" />
          )}

          {/* Hover underline */}
          {!active && (
            <span className="absolute bottom-0 left-6 h-[3px] w-0 bg-[#FC2C38] transition-all duration-300 group-hover:w-10" />
          )}
        </div>
      </button>
    );
  };

  const SubItem = ({
    label,
    value,
  }: {
    label: string;
    value: Page;
  }) => {
    const active = page === value;

    return (
      <button
        onClick={() => onNavigate(value)}
        className="group w-full text-left"
      >
        <div
          className={[
            "mx-3 flex items-center rounded-lg px-3 py-2 text-sm transition",
            active
              ? "bg-white/10 text-white"
              : "text-white/75 hover:bg-white/5 hover:text-white",
          ].join(" ")}
        >
          {/* left accent for active */}
          <span
            className={[
              "mr-3 h-2 w-2 rounded-full",
              active ? "bg-[#FC2C38]" : "bg-white/20 group-hover:bg-white/30",
            ].join(" ")}
          />
          <span className="font-semibold">{label}</span>
        </div>
      </button>
    );
  };

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="px-6 pt-5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-white/35">
      {children}
    </div>
  );

  return (
    <aside className="w-72 bg-[#1e1e1e] text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="Capital Lumber Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1">
        {/* Top level */}
        <TopItem label="Dashboard" value="dashboard" />

        <SectionTitle>Decking</SectionTitle>

        {/* Nested group */}
        <div className="space-y-1">
          <SubItem label="Price Lookup (Decking)" value="decking" />
          <SubItem label="Price Lookup (Fascia)" value="fascia" />
          <SubItem label="Decking Calculator" value="calculator" />
        </div>

        <SectionTitle>Admin</SectionTitle>
        <div className="space-y-1">
          <SubItem label="Settings" value="settings" />
        </div>
      </nav>

      {/* Footer actions */}
      <div className="border-t border-white/10 px-6 py-4 space-y-3">
        <button
          onClick={onLogout}
          className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          Logout
        </button>

        <div className="text-xs text-white/40">Internal Pricing Tool</div>
      </div>
    </aside>
  );
}