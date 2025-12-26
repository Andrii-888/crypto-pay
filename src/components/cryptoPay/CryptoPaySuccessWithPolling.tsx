"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

type StatusApiOk = {
  ok: true;
  invoiceId: string;
  status: InvoiceStatus;

  createdAt?: string | null;
  expiresAt?: string | null;

  fiatAmount?: number | null;
  fiatCurrency?: string | null;

  cryptoAmount?: number | null;
  cryptoCurrency?: string | null;

  network?: string | null;

  txStatus?: string | null;
  txHash?: string | null;
  walletAddress?: string | null;
  confirmations?: number | null;
  requiredConfirmations?: number | null;

  detectedAt?: string | null;
  confirmedAt?: string | null;

  amlStatus?: string | null;
  riskScore?: number | null;
  assetStatus?: string | null;
  assetRiskScore?: number | null;

  decisionStatus?: string | null;
  decisionReasonCode?: string | null;
  decisionReasonText?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;

  [key: string]: any;
};

type StatusApiErr = { ok: false; error?: string; details?: string };
type StatusApiResponse = StatusApiOk | StatusApiErr;

type Props = {
  invoiceId: string;
  initialSnapshot: StatusApiOk | null;
};

function normalizeStatus(s?: string | null): InvoiceStatus {
  return s === "waiting" ||
    s === "confirmed" ||
    s === "expired" ||
    s === "rejected"
    ? (s as InvoiceStatus)
    : "waiting";
}

function isFinalStatus(s: InvoiceStatus) {
  return s === "confirmed" || s === "expired" || s === "rejected";
}

function fmtTs(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  const c = (currency ?? "").trim() || "";
  return c ? `${amount.toFixed(2)} ${c}` : amount.toFixed(2);
}

function statusUi(status?: InvoiceStatus) {
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

export function CryptoPaySuccessWithPolling({
  invoiceId,
  initialSnapshot,
}: Props) {
  const [snap, setSnap] = useState<StatusApiOk | null>(initialSnapshot);
  const status = normalizeStatus(snap?.status ?? "waiting");
  const statusRef = useRef<InvoiceStatus>(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const id = String(invoiceId ?? "").trim();
    if (!id) return;

    let cancelled = false;
    let t: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;

      if (isFinalStatus(statusRef.current)) return;

      try {
        const res = await fetch(
          `/api/payments/status?invoiceId=${encodeURIComponent(id)}`,
          {
            cache: "no-store",
          }
        );

        if (res.ok) {
          const data = (await res
            .json()
            .catch(() => null)) as StatusApiResponse | null;
          if (data && (data as any).ok === true) {
            const ok = data as StatusApiOk;
            setSnap((prev) => {
              if (!prev) return ok;
              // merge without wiping with nulls
              const out: any = { ...prev };
              for (const [k, v] of Object.entries(ok)) {
                if (v === undefined || v === null) continue;
                out[k] = v;
              }
              return out as StatusApiOk;
            });

            const nextStatus = normalizeStatus(ok.status);
            statusRef.current = nextStatus;

            if (isFinalStatus(nextStatus)) return;
          }
        }
      } catch {
        // ignore
      }

      t = setTimeout(tick, 2500);
    };

    void tick();

    return () => {
      cancelled = true;
      if (t) clearTimeout(t);
    };
  }, [invoiceId]);

  const ui = statusUi(status);

  const showTx =
    Boolean(snap?.txHash) ||
    Boolean(snap?.walletAddress) ||
    (snap?.txStatus && snap.txStatus !== "pending") ||
    status === "confirmed";

  const showAml = status === "confirmed";

  const requiredConfs = snap?.requiredConfirmations ?? 1;
  const confs = snap?.confirmations ?? 0;

  const headlineRight = useMemo(() => {
    return (
      <span
        className={`inline-flex items-center gap-2 h-7 px-3 rounded-full border text-xs font-medium ${ui.badgeCls}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        <span className="whitespace-nowrap leading-none">{ui.badge}</span>
      </span>
    );
  }, [ui.badge, ui.badgeCls]);

  return (
    <>
      <header className="mb-6 text-center">
        <div
          className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full ${ui.iconBg}`}
        >
          <span className={`text-base font-semibold ${ui.iconText}`}>
            {ui.icon}
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {ui.title}
        </h1>
        <p className="mt-2 max-w-sm mx-auto text-xs text-slate-500">
          {ui.subtitle}
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Invoice</span>
          <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
            {invoiceId}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Payment status</span>
          {headlineRight}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Fiat amount</span>
          <span className="text-slate-900 tabular-nums">
            {formatMoney(snap?.fiatAmount ?? null, snap?.fiatCurrency ?? null)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Crypto amount</span>
          <span className="text-slate-900 tabular-nums">
            {formatMoney(
              snap?.cryptoAmount ?? null,
              snap?.cryptoCurrency ?? null
            )}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Network</span>
          <span className="text-slate-900">{snap?.network ?? "—"}</span>
        </div>
      </section>

      {showTx && (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Transaction
            </h3>
            <span className="text-[11px] text-slate-500">
              Status:{" "}
              <span className="font-mono text-slate-900">
                {snap?.txStatus ?? "pending"}
              </span>
            </span>
          </div>

          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">txHash</span>
              <span className="font-mono break-all text-slate-900">
                {snap?.txHash ?? "—"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">Wallet</span>
              <span className="font-mono break-all text-slate-900">
                {snap?.walletAddress ?? "—"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">
                Confirmations
              </span>
              <span className="font-mono text-slate-900">
                {String(confs)} / {String(requiredConfs)}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">Detected</span>
              <span className="text-slate-900">{fmtTs(snap?.detectedAt)}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">Confirmed</span>
              <span className="text-slate-900">{fmtTs(snap?.confirmedAt)}</span>
            </div>
          </div>
        </section>
      )}

      {showAml && (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            AML &amp; Decision
          </h3>

          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">AML</span>
              <span className="font-mono text-slate-900">
                {snap?.amlStatus ?? "—"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">Risk</span>
              <span className="font-mono text-slate-900">
                {snap?.riskScore ?? "—"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">Decision</span>
              <span className="font-mono text-slate-900">
                {snap?.decisionStatus ?? "—"}
              </span>
            </div>

            {snap?.decisionReasonText ? (
              <div className="pt-1 text-[11px] text-slate-600">
                {snap.decisionReasonText}
              </div>
            ) : null}
          </div>
        </section>
      )}
    </>
  );
}
