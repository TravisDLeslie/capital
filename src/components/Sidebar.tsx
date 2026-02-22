
type Page = "decking" | "fascia" | "calculator" | "settings";

export default function Sidebar({
  page,
  onNavigate,
  onLogout,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  onLogout: () => void;
}) {
  const NavItem = ({ label, value }: { label: string; value: Page }) => {
    const active = page === value;

    return (
      <button onClick={() => onNavigate(value)} className="group w-full text-left">
        <div className="relative py-3 px-6 text-sm font-semibold text-white">
          {label}

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
      <nav className="mt-6 space-y-2">
        <div className="px-6 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Decking
        </div>
        <NavItem label="Decking Price Lookup" value="decking" />
        <NavItem label="Fascia Price Lookup" value="fascia" />
        <NavItem label="Decking Calculator" value="calculator" />

        <div className="mt-6 px-6 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          Admin
        </div>
        <NavItem label="Settings" value="settings" />
      </nav>

      {/* Footer actions */}
      <div className="mt-auto border-t border-white/10 px-6 py-4 space-y-3">
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