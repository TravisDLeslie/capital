const fs = require("node:fs");
const path = require("node:path");
const Papa = require("papaparse");

const inputPath = process.argv[2] || "decking.csv";
const outputPath = process.argv[3] || "src/data/decking.ts";

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

  // Remove leading "Trex " from series (optional)
  const series = rawSeries.replace(/^trex\s+/i, "").trim();

  const brand =
    (pick(r, ["brand", "manufacturer"]) ?? "Trex").toString().trim() || "Trex";

  const vendor =
    (pick(r, ["vendor", "supplier"]) ?? "Boise").toString().trim() || "Boise";

  // IMPORTANT: your header is "Color Name"
  const color = (pick(r, ["color name", "color", "colour", "finish", "shade"]) ?? "")
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

  out.push({
    id: `d${idx++}`,
    series: series || rawSeries || "—",
    brand,
    vendor,
    color: color || "—",
    costPerFoot,
  });
}

const file = `import type { PriceRow } from "../components/PriceTable";

export const deckingRows: PriceRow[] = ${JSON.stringify(out, null, 2)};
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, file, "utf8");

console.log(`✅ Wrote ${out.length} rows to ${outputPath}`);
console.log(`ℹ️ Input: ${inputPath}`);