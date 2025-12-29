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

  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: string | null;

  fxRate?: number | null;
  fxPair?: string | null;

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

  merchantId?: string | null;
  paymentUrl?: string | null;
};

type StatusApiErr = { ok: false; error?: string; details?: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function normalizeStatus(s?: string | null): InvoiceStatus {
  return s === "waiting" ||
    s === "confirmed" ||
    s === "expired" ||
    s === "rejected"
    ? s
    : "waiting";
}

function isFinalStatus(s: InvoiceStatus) {
  return s === "confirmed" || s === "expired" || s === "rejected";
}

function isStatusApiOk(v: unknown): v is StatusApiOk {
  if (!isObject(v)) return false;
  if (v.ok !== true) return false;

  const invoiceId = v.invoiceId;
  const status = v.status;

  if (typeof invoiceId !== "string" || !invoiceId.trim()) return false;
  if (typeof status !== "string") return false;

  const ns = normalizeStatus(status);
  return ns === status;
}

function isStatusApiErr(v: unknown): v is StatusApiErr {
  if (!isObject(v)) return false;
  return v.ok === false;
}

function formatMoney(amount: number, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

function fmtTs(ts?: string | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
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

type InvoiceView = {
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

  decisionStatus?: string | null;
  decisionReasonText?: string | null;
};

function mergeInvoice(prev: InvoiceView, snap: StatusApiOk): InvoiceView {
  const next: InvoiceView = { ...prev };

  const setIfDefined = <K extends keyof InvoiceView>(
    key: K,
    value: InvoiceView[K] | null | undefined
  ) => {
    if (value !== undefined && value !== null) {
      next[key] = value;
    }
  };

  setIfDefined("invoiceId", snap.invoiceId);
  setIfDefined("status", normalizeStatus(snap.status));

  setIfDefined("createdAt", snap.createdAt ?? undefined);
  setIfDefined("expiresAt", snap.expiresAt ?? undefined);

  setIfDefined("fiatAmount", snap.fiatAmount ?? undefined);
  setIfDefined("fiatCurrency", snap.fiatCurrency ?? undefined);

  setIfDefined("cryptoAmount", snap.cryptoAmount ?? undefined);
  setIfDefined("cryptoCurrency", snap.cryptoCurrency ?? undefined);

  setIfDefined("network", snap.network ?? undefined);

  // txStatus: keep previous if snap is null/undefined
  const nextTxStatus =
    (typeof snap.txStatus === "string" && snap.txStatus.trim()
      ? snap.txStatus
      : null) ??
    prev.txStatus ??
    "pending";
  setIfDefined("txStatus", nextTxStatus);

  setIfDefined("txHash", snap.txHash ?? undefined);
  setIfDefined("walletAddress", snap.walletAddress ?? undefined);

  if (typeof snap.confirmations === "number")
    next.confirmations = snap.confirmations;
  if (typeof snap.requiredConfirmations === "number")
    next.requiredConfirmations = snap.requiredConfirmations;

  setIfDefined("detectedAt", snap.detectedAt ?? undefined);
  setIfDefined("confirmedAt", snap.confirmedAt ?? undefined);

  setIfDefined("amlStatus", snap.amlStatus ?? undefined);
  if (typeof snap.riskScore === "number") next.riskScore = snap.riskScore;

  setIfDefined("decisionStatus", snap.decisionStatus ?? undefined);
  setIfDefined("decisionReasonText", snap.decisionReasonText ?? undefined);

  return next;
}

function SuccessInner({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<InvoiceView>(() => ({
    invoiceId: id,
    status: "waiting",
    txStatus: "pending",
  }));

  const [error, setError] = useState<string | null>(null);

  const startedRef = useRef(false);
  const statusRef = useRef<InvoiceStatus>("waiting");

  useEffect(() => {
    if (!id) return;
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timeoutId = setTimeout(tick, 2500);
    };

    const tick = async () => {
      if (cancelled) return;
      if (isFinalStatus(statusRef.current)) return;

      try {
        const res = await fetch(
          `/api/payments/status?invoiceId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          schedule();
          return;
        }

        const data: unknown = await res.json().catch(() => null);

        if (isStatusApiOk(data)) {
          const snap = data;

          setInvoice((prev) => mergeInvoice(prev, snap));

          const nextStatus = normalizeStatus(snap.status);
          statusRef.current = nextStatus;

          if (isFinalStatus(nextStatus)) return;

          setError(null);
          schedule();
          return;
        }

        if (isStatusApiErr(data)) {
          setError(data.error ?? "API error");
          schedule();
          return;
        }

        setError("Invalid API response");
        schedule();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Fetch failed");
        schedule();
      }
    };

    void tick();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      startedRef.current = false;
    };
  }, [id]);

  const ui = statusUi(invoice.status);

  const requiredConfs = invoice.requiredConfirmations ?? 1;
  const confs = invoice.confirmations ?? 0;

  const showAml = useMemo(() => {
    return (
      Boolean(invoice.amlStatus) ||
      typeof invoice.riskScore === "number" ||
      Boolean(invoice.decisionStatus)
    );
  }, [invoice.amlStatus, invoice.riskScore, invoice.decisionStatus]);

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

        {error ? (
          <p className="mt-2 text-[11px] text-rose-600">
            Status update warning: {error}
          </p>
        ) : null}
      </header>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Invoice</span>
          <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
            {id}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Payment status</span>
          <span
            className={`inline-flex items-center gap-2 h-7 px-3 rounded-full border text-xs font-medium ${ui.badgeCls}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="whitespace-nowrap leading-none">{ui.badge}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Fiat amount</span>
          <span className="text-slate-900 tabular-nums">
            {typeof invoice.fiatAmount === "number" && invoice.fiatCurrency
              ? formatMoney(invoice.fiatAmount, invoice.fiatCurrency)
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Crypto amount</span>
          <span className="text-slate-900 tabular-nums">
            {typeof invoice.cryptoAmount === "number" && invoice.cryptoCurrency
              ? formatMoney(invoice.cryptoAmount, invoice.cryptoCurrency)
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Network</span>
          <span className="text-slate-900">{invoice.network ?? "—"}</span>
        </div>
      </section>

      <section className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Transaction</h3>
          <span className="text-[11px] text-slate-500">
            Status:{" "}
            <span className="font-mono text-slate-900">
              {invoice.txStatus ?? "pending"}
            </span>
          </span>
        </div>

        <div className="text-xs text-slate-700 space-y-1">
          <div className="flex items-start gap-2">
            <span className="w-28 shrink-0 text-slate-500">txHash</span>
            <span className="font-mono break-all text-slate-900">
              {invoice.txHash ?? "—"}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-28 shrink-0 text-slate-500">Wallet</span>
            <span className="font-mono break-all text-slate-900">
              {invoice.walletAddress ?? "—"}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-28 shrink-0 text-slate-500">Confirmations</span>
            <span className="font-mono text-slate-900">
              {String(confs)} / {String(requiredConfs)}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-28 shrink-0 text-slate-500">Detected</span>
            <span className="text-slate-900">{fmtTs(invoice.detectedAt)}</span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-28 shrink-0 text-slate-500">Confirmed</span>
            <span className="text-slate-900">{fmtTs(invoice.confirmedAt)}</span>
          </div>
        </div>
      </section>

      {showAml ? (
        <section className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900">
            AML &amp; Decision
          </h3>

          <div className="text-xs text-slate-700 space-y-1">
            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">AML</span>
              <span className="font-mono text-slate-900">
                {invoice.amlStatus ?? "—"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">Risk</span>
              <span className="font-mono text-slate-900">
                {typeof invoice.riskScore === "number"
                  ? invoice.riskScore
                  : "—"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-28 shrink-0 text-slate-500">Decision</span>
              <span className="font-mono text-slate-900">
                {invoice.decisionStatus ?? "—"}
              </span>
            </div>

            {invoice.decisionReasonText ? (
              <div className="pt-1 text-[11px] text-slate-600">
                {invoice.decisionReasonText}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  );
}

export default function ClientSuccess({ invoiceId }: { invoiceId: string }) {
  const id = (invoiceId ?? "").trim();

  if (!id) {
    const ui = statusUi(undefined);
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
            Tip: open this page as{" "}
            <span className="font-mono">/open/pay/success?invoiceId=...</span>
          </p>
        </header>
      </>
    );
  }

  // ✅ key forces a clean re-mount when invoiceId changes (no “reset setState in effect” needed)
  return <SuccessInner key={id} id={id} />;
}
