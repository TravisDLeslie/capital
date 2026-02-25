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
  createdAt: number;
  updatedAt?: number;

  customer: string;
  jobName?: string;
  spruceQuoteNumber?: string;

  // ✅ Salesperson on your end
  salesperson?: string;

  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;

  status: QuoteStatus;

  neededBy?: string;
  nextFollowUp?: string;

  followUpNotes?: string;
  notes?: string;

  // ✅ Lost tracking
  lostReason?: string;
  lostReasonNotes?: string;

  items?: QuoteLineItem[];
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
    return Array.isArray(data) ? (data as Quote[]) : [];
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
    jobName: "",
    spruceQuoteNumber: "",

    salesperson: "",

    contactName: "",
    contactPhone: "",
    contactEmail: "",

    status: "draft",

    neededBy: "",
    nextFollowUp: "",

    followUpNotes: "",
    notes: "",

    lostReason: "",
    lostReasonNotes: "",

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