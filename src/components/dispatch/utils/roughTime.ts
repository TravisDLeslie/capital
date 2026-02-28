// src/components/dispatch/utils/roughTime.ts
const SERVICE_MINUTES: Record<string, number> = {
  "General (dump)": 10,
  "Hand Unload (1 person)": 25,
  "Hand Unload (2 people)": 15,
  "Forklift Unload (Donkey)": 15,
  "Forklift Unload (Moffett)": 10,
  Hotshot: 5,
};

export function serviceMinutes(deliveryType?: string) {
  return SERVICE_MINUTES[deliveryType ?? ""] ?? 15;
}

export function roughTotalMinutes(args: {
  driveMinsOneWay?: number;
  deliveryType?: string;
  bufferMins?: number;
}) {
  const oneWay = Number(args.driveMinsOneWay ?? 0) || 0;
  const buffer = Number(args.bufferMins ?? 10) || 0;
  const service = serviceMinutes(args.deliveryType);
  return Math.max(0, Math.round(oneWay * 2 + service + buffer));
}

export function minutesToPretty(mins: number) {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${m} min`;
  if (!r) return `${h} hr`;
  return `${h} hr ${r} min`;
}