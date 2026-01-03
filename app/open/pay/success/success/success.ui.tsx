import React from "react";
import type { InvoiceStatus } from "./success.types";

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

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={[
        "h-4 w-4",
        "text-slate-500",
        "transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 8l5 5 5-5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DebugPanel({
  open,
  snapshot,
  onToggle,
}: {
  open: boolean;
  snapshot: unknown | null;
  onToggle: () => void;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={[
          "w-full",
          "flex items-center justify-between gap-4",
          "px-4 py-4",
          "text-left",
          "transition",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2",
          open ? "bg-slate-50" : "bg-white hover:bg-slate-50",
        ].join(" ")}
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            Payment details (technical)
          </div>
          <div className="mt-0.5 text-[11px] text-slate-500">
            Includes txHash, wallet, AML &amp; full provider response
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={[
              "shrink-0",
              "inline-flex items-center",
              "rounded-full",
              "px-3 py-1",
              "text-xs font-semibold",
              "border",
              "transition",
              open
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-900 border-slate-200 hover:border-slate-300",
            ].join(" ")}
          >
            {open ? "Hide" : "Show"}
          </span>
          <Chevron open={open} />
        </div>
      </button>

      {open ? (
        <div className="px-4 pb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wide text-slate-600">
              RAW INVOICE (ALL FIELDS)
            </h3>
            <span className="text-[11px] text-slate-500">
              {snapshot ? "live" : "—"}
            </span>
          </div>

          <pre className="max-h-[420px] overflow-auto rounded-xl bg-slate-900 p-3 text-[11px] leading-5 text-slate-100">
            {JSON.stringify(
              snapshot ?? { ok: false, error: "No snapshot yet" },
              null,
              2
            )}
          </pre>
        </div>
      ) : null}
    </section>
  );
}
