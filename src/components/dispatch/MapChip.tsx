
const ORIGIN = "3105 W State St, Boise, ID 83703";

function mapsDirectionsUrl(destination: string) {
  const o = encodeURIComponent(ORIGIN);
  const d = encodeURIComponent(destination);
  return `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}&travelmode=driving`;
}

export default function MapChip({
  address,
  className = "",
  title = "Open route + ETA with traffic",
}: {
  address?: string | null;
  className?: string;
  title?: string;
}) {
  const dest = (address ?? "").trim();
  if (!dest) return null;

  return (
    <a
      href={mapsDirectionsUrl(dest)}
      target="_blank"
      rel="noreferrer"
      className={[
        "inline-flex max-w-full items-center gap-2 truncate rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50",
        className,
      ].join(" ")}
      title={title}
      onClick={(e) => e.stopPropagation()} // ✅ don’t open the stop modal when clicking map
    >
      🗺️ <span className="truncate">{dest}</span>
      <span className="ml-auto text-xs font-extrabold text-slate-900">Route</span>
    </a>
  );
}