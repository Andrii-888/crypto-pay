import React from "react";
import type { InvoiceStatus } from "./success.types";

/* =========================
 * Formatting helpers
 * ========================= */

export function formatMoney(amount: number, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

export function fmtTs(ts?: string | null) {
  if (!ts) return "—";

  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";

  // Stable formatting across environments (local + Vercel)
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

/* =========================
 * Status UI mapping
 * ========================= */

export function statusUi(status?: InvoiceStatus) {
  switch (status) {
    case "confirmed":
      return {
        title: "Payment confirmed",
        subtitle: "Your crypto payment was received and confirmed.",
        badge: "Confirmed",
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
        iconBg: "bg-emerald-100",
        iconText: "text-emerald-700",
        icon: "✓",
      };

    case "waiting":
      return {
        title: "Payment processing",
        subtitle:
          "We’re still waiting for on-chain confirmation. Please keep this page open.",
        badge: "Waiting",
        badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
        iconBg: "bg-amber-100",
        iconText: "text-amber-800",
        icon: "…",
      };

    case "expired":
      return {
        title: "Payment expired",
        subtitle:
          "This payment link has expired. Please return to the store and create a new payment.",
        badge: "Expired",
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
        iconBg: "bg-slate-200",
        iconText: "text-slate-700",
        icon: "×",
      };

    case "rejected":
      return {
        title: "Payment rejected",
        subtitle:
          "The payment was rejected by the provider. Please return to the store and try again.",
        badge: "Rejected",
        badgeCls: "bg-rose-50 text-rose-800 border-rose-200",
        iconBg: "bg-rose-100",
        iconText: "text-rose-800",
        icon: "!",
      };

    default:
      return {
        title: "Payment status",
        subtitle:
          "This page shows the final invoice state once it is available from the payment provider.",
        badge: "Unknown",
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
        iconBg: "bg-slate-200",
        iconText: "text-slate-700",
        icon: "?",
      };
  }
}

/* =========================
 * Key / Value row
 * ========================= */

export function KVRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-28 shrink-0 text-slate-500">{k}</span>
      <span className="min-w-0 break-all font-mono text-[11px] text-slate-900">
        {v}
      </span>
    </div>
  );
}
