// src/components/quotes/quotes.ui.tsx
import { useEffect, useMemo, useState } from "react";
import { money } from "./quotes.logic";

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function Card({
  label,
  value,
  sub,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  onClick?: () => void;
}) {
  const clickable = Boolean(onClick);
  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        clickable ? "cursor-pointer hover:bg-slate-50" : "",
      ].join(" ")}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
        {value}
      </div>
      <div className="mt-2 text-xs text-slate-500">{sub}</div>
    </div>
  );
}

export function ToplineCard({
  label,
  amount,
  count,
  sub,
  tone,
}: {
  label: string;
  amount: number;
  count: number;
  sub: string;
  tone: "neutral" | "info" | "good" | "bad";
}) {
  const toneCard =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50/60"
      : tone === "info"
      ? "border-sky-200 bg-sky-50/60"
      : tone === "bad"
      ? "border-rose-200 bg-rose-50/60"
      : "border-slate-200 bg-white";

  const toneBadge =
    tone === "good"
      ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
      : tone === "info"
      ? "bg-sky-100 text-sky-700 ring-sky-200"
      : tone === "bad"
      ? "bg-rose-100 text-rose-700 ring-rose-200"
      : "bg-slate-100 text-slate-700 ring-slate-200";

  const dot =
    tone === "good"
      ? "bg-emerald-500"
      : tone === "info"
      ? "bg-sky-500"
      : tone === "bad"
      ? "bg-rose-500"
      : "bg-slate-400";

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneCard}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dot}`} />
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {label}
            </div>
          </div>

          <div className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">
            {money(amount)}
          </div>

          <div className="mt-1 text-xs text-slate-600">{sub}</div>
        </div>

        <span
          className={`shrink-0 inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${toneBadge}`}
          title="Quote count"
        >
          {count}
        </span>
      </div>
    </div>
  );
}

export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
          ) : null}
        </div>

        {children}
      </div>
    </div>
  );
}