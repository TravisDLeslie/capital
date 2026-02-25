// src/data/quotes.ts
export type QuoteStatus = "draft" | "sent" | "won" | "lost";

export type QuoteLineItem = {
  id: string;
  sku?: string;
  description: string;
  qty: number;
  unit: string; // ea, lf, sf, bdft, etc
  unitPrice: number;
  vendor?: string;
};

export type Quote = {
  id: string;
  customer: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  jobName?: string;
  spruceQuoteNumber?: string;

  createdAt: number;
  updatedAt: number;

  neededBy?: string; // ISO date
  nextFollowUp?: string; // ISO date
  followUpNotes?: string;

  status: QuoteStatus;

  lostReason?: string;        // short label (price, lead time, etc.)
  lostReasonNotes?: string;   // longer “why” detail
  notes?: string;

  items: QuoteLineItem[];
};

const KEY = "capital-lumber-quotes";

export function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function loadQuotes(): Quote[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveQuotes(quotes: Quote[]) {
  localStorage.setItem(KEY, JSON.stringify(quotes));
}

export function emptyQuote(): Omit<Quote, "id" | "createdAt" | "updatedAt"> {
  return {
    customer: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    jobName: "",
    spruceQuoteNumber: "",
    neededBy: "",
    nextFollowUp: "",
    followUpNotes: "",
    status: "draft",
    notes: "",
    items: [
      {
        id: uid(),
        sku: "",
        description: "",
        qty: 1,
        unit: "ea",
        unitPrice: 0,
        vendor: "",
      },
    ],
  };
}