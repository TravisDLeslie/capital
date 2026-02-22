export type PriceItem = {
  id: string;
  vendor: string;     // e.g. "Trex"
  brand: string;      // e.g. "Trex"
  line?: string;      // e.g. "Transcend"
  color: string;      // e.g. "Spiced Rum"
  sku?: string;       // optional
  buy: number;        // your cost
  sell: number;       // your price
  unit?: string;      // e.g. "LF", "board", "sqft"
  notes?: string;
  updatedAt: number;  // timestamp
};