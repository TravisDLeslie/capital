const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");

const inputPath = process.argv[2] || "decking.csv";
const outputPath = process.argv[3] || "src/data/decking.ts";

function baseName(outPath) {
  return path.basename(outPath, path.extname(outPath)).toLowerCase();
}

function exportNameFromOutput(outPath) {
  const base = baseName(outPath);
  if (base.includes("decking")) return "deckingRows";
  if (base.includes("fascia")) return "fasciaRows";
  return `${base}Rows`;
}

function defaultSizeForOutput(outPath) {
  const base = baseName(outPath);
  if (base.includes("decking")) return "1x6";
  if (base.includes("fascia")) return "1x8";
  return "—";
}

function normKey(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w/ ]/g, "");
}

function pick(row, candidates) {
  const keys = Object.keys(row ?? {});
  const map = new Map(keys.map((k) => [normKey(k), k]));
  for (const c of candidates) {
    const hit = map.get(normKey(c));
    if (hit) return row[hit];
  }
  return undefined;
}

function parseMoney(val) {
  if (val == null) return 0;
  const s = String(val).trim();
  if (!s) return 0;
  const cleaned = s.replace(/[^0-9.\-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function escapeStr(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// Write clean TS (no quoted keys)
function toTs(rows, exportName) {
  const items = rows
    .map((r) => {
      return `  {
    id: "${escapeStr(r.id)}",
    size: "${escapeStr(r.size)}",
    series: "${escapeStr(r.series)}",
    brand: "${escapeStr(r.brand)}",
    vendor: "${escapeStr(r.vendor)}",
    color: "${escapeStr(r.color)}",
    costPerFoot: ${Number(r.costPerFoot) || 0},
    image: ${r.image ? `"${escapeStr(r.image)}"` : "undefined"},
  }`;
    })
    .join(",\n");

  return `import type { PriceRow } from "../components/PriceTable";

export const ${exportName}: PriceRow[] = [
${items}
];
`;
}

const csv = fs.readFileSync(inputPath, "utf8");
const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });

if (parsed.errors?.length) {
  console.error("CSV parse errors:", parsed.errors);
  process.exit(1);
}

const rows = parsed.data;

const out = [];
let idx = 1;

for (const r of rows) {
  const rawSeries = (pick(r, ["series", "line", "collection", "product series"]) ?? "")
    .toString()
    .trim();

  // Optional: strip leading "Trex " since Brand already has Trex
  const series = rawSeries.replace(/^trex\s+/i, "").trim();

  const brand =
    (pick(r, ["brand", "manufacturer"]) ?? "Trex").toString().trim() || "Trex";

  const vendor =
    (pick(r, ["vendor", "supplier"]) ?? "Boise").toString().trim() || "Boise";

  const color =
    (pick(r, ["color name", "color", "colour", "finish", "shade"]) ?? "")
      .toString()
      .trim();

  const sizeFromCsv =
    (pick(r, ["size", "board size", "dimension", "dimensions", "width"]) ?? "")
      .toString()
      .trim();

  const size = sizeFromCsv || defaultSizeForOutput(outputPath);

  const image =
    (pick(r, ["image", "image url", "photo", "picture", "thumbnail"]) ?? "")
      .toString()
      .trim();

  const costPerFoot = parseMoney(
    pick(r, [
      "cost per foot",
      "cost/foot",
      "cost per ft",
      "cost per lf",
      "cost per linear foot",
      "cost",
      "price",
    ])
  );

  const hasSomething = series || rawSeries || color || costPerFoot;
  if (!hasSomething) continue;

  const prefix = baseName(outputPath).includes("fascia")
    ? "f"
    : baseName(outputPath).includes("decking")
      ? "d"
      : "r";

  out.push({
    id: `${prefix}${idx++}`,
    size: size || "—",
    series: series || rawSeries || "—",
    brand,
    vendor,
    color: color || "—",
    costPerFoot,
    image: image || undefined,
  });
}

const exportName = exportNameFromOutput(outputPath);
const fileOut = toTs(out, exportName);

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, fileOut, "utf8");

console.log(`✅ Wrote ${out.length} rows to ${outputPath}`);
console.log(`📦 Exported as: ${exportName}`);
console.log(`ℹ️ Input: ${inputPath}`);