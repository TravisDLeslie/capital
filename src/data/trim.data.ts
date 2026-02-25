// src/data/trim.data.ts

export type TrimRow = {
  id: string;

  vendor: string;
  brand?: string;
  category: string;
  profile: string; // "WM 356", "Ranch", etc
  size: string; // '9/16" x 3-1/4"'
  material: string; // MDF, Pine, Poplar, PVC, Finger-Joint
  finish?: string; // Primed, Raw, Pre-finished

  costPerFoot: number;

  // Detail page fields
  image?: string; // local path like "/images/trim/metrie-ranch-356.jpg"
  stockingLengths?: number[]; // [8,10,12,16]
  sku?: string;
  notes?: string;

  // Optional future fields
  msrpPerFoot?: number;
};

export type TrimTier = "contractor" | "retail";
export const trimTiers: TrimTier[] = ["contractor", "retail"];

// 45% margin contractor, 50% retail
// sale = cost / (1 - margin)
export function trimSalePerFoot(costPerFoot: number, tier: TrimTier) {
  const cost = Number(costPerFoot);

  // guard against bad input
  if (!Number.isFinite(cost) || cost <= 0) return 0;

  const margin = tier === "contractor" ? 0.45 : 0.5;
  const denom = 1 - margin;
  if (denom <= 0) return 0;

  // round to cents
  const sale = cost / denom;
  return Math.round(sale * 100) / 100;
}

export const trimRows: TrimRow[] = [
  {
    id: "t1",
    vendor: "Boise Cascade",
    brand: "Metrie",
    category: "Baseboard",
    profile: "Ranch",
    size: '9/16" x 3-1/4"',
    material: "MDF",
    finish: "Primed",
    costPerFoot: 0.89,
    sku: "TRIM-BASE-325-MDF",
    image: "/images/trim/metrie-ranch-base-325.jpg",
    stockingLengths: [8, 12, 16],
  },
  {
    id: "t2",
    vendor: "Boise Cascade",
    brand: "Metrie",
    category: "Casing",
    profile: "WP 356",
    size: '11/16" x 2-1/4"',
    material: "MDF",
    finish: "Primed",
    costPerFoot: 0.72,
    image: "/images/trim/metrie-wp356-casing-224.jpg",
    stockingLengths: [7, 8, 12],
  },
  {
    id: "t3",
    vendor: "Weyerhaeuser",
    category: "Crown",
    profile: "Colonial",
    size: '3/4" x 3-5/8"',
    material: "Pine",
    finish: "Raw",
    costPerFoot: 1.35,
    image: "/images/trim/colonial-crown-358.jpg",
    stockingLengths: [8, 10, 12, 16],
  },
  {
    id: "t4",
    vendor: "JM Thomas",
    category: "Baseboard",
    profile: "Modern Square",
    size: '5/8" x 5-1/4"',
    material: "Poplar",
    finish: "Raw",
    costPerFoot: 1.95,
    notes: "Great paint-grade option.",
    image: "/images/trim/modern-square-base-524.jpg",
    stockingLengths: [8, 16],
  },
];