import type { PriceItem } from "./types";

const KEY = "capital-lumber:pricebook:v1";

export function loadItems(): PriceItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PriceItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveItems(items: PriceItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function exportJson(items: PriceItem[]) {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `capital-lumber-pricebook-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJsonFile(file: File): Promise<PriceItem[]> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) throw new Error("Invalid file format (expected an array).");
  return parsed;
}