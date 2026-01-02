"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { InvoiceStatus, InvoiceView, StatusApiOk } from "./success.types";
import {
  normalizeInvoiceStatus,
  normalizeInvoiceView,
  normalizeTxStatus,
} from "./success.logic";
import { DebugPanel, fmtTs, formatMoney, statusUi, KVRow } from "./success.ui";

function isObject(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === "object";
}

function isStatusOk(x: unknown): x is StatusApiOk {
  if (!isObject(x)) return false;
  return x.ok === true && typeof x.invoiceId === "string";
}

function getErrorMessage(x: unknown): string | null {
  if (!isObject(x)) return null;
  const msg = typeof x.message === "string" ? x.message : null;
  const err = typeof x.error === "string" ? x.error : null;
  if (msg && msg.trim()) return msg;
  if (err && err.trim()) return err;
  return null;
}

function SuccessInner({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<InvoiceView>(() => ({
    invoiceId: id,
    status: "waiting",
    txStatus: "pending",
  }));

  const [debugInvoice, setDebugInvoice] = useState<unknown | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusRef = useRef<InvoiceStatus>("waiting");

  useEffect(() => {
    console.log("[SUCCESS CLIENT] mounted (browser)");
  }, []);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timeoutId = setTimeout(() => {
        void tick();
      }, 2500);
    };

    const tick = async () => {
      if (cancelled) return;

      // stop polling only when we already have a final status
      if (statusRef.current !== "waiting") return;

      try {
        const res = await fetch(
          `/api/payments/status?invoiceId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        const data: unknown = await res.json().catch(() => null);

        // ✅ ALWAYS store snapshot (even if ok:false or invalid shape)
        setDebugInvoice(data);

        // Debug (browser)
        console.log("[SUCCESS][status raw]", data);

        const d = isObject(data) ? data : {};
        console.log("[SUCCESS][http]", {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
        });
        console.log("[SUCCESS][key fields]", {
          ok: d.ok,
          invoiceId: d.invoiceId,
          status: d.status,
          txStatus: d.txStatus,
          walletAddress: d.walletAddress,
          txHash: d.txHash,
          network: d.network,
          fiatAmount: d.fiatAmount,
          fiatCurrency: d.fiatCurrency,
          cryptoAmount: d.cryptoAmount,
          cryptoCurrency: d.cryptoCurrency,
          fees: d.fees,
          grossAmount: d.grossAmount,
          feeAmount: d.feeAmount,
          netAmount: d.netAmount,
        });

        // if HTTP failed — show best error we can and keep polling
        if (!res.ok) {
          setError(getErrorMessage(data) ?? `HTTP ${res.status}`);
          schedule();
          return;
        }

        // not ok-shape — keep polling
        if (!isStatusOk(data)) {
          setError(getErrorMessage(data) ?? "Invalid API response");
          schedule();
          return;
        }

        // Normalize to UI view (handles nested+flat fees, numbers-as-strings, etc.)
        const nextView = normalizeInvoiceView(data);

        // Ensure status/txStatus are normalized to known states
        const nextStatus = normalizeInvoiceStatus(data.status);
        const nextTxStatus = normalizeTxStatus(data.txStatus);

        statusRef.current = nextStatus;

        setInvoice((prev) => ({
          ...prev,
          ...nextView,
          invoiceId: id,
          status: nextStatus,
          txStatus: nextTxStatus,
        }));

        setError(null);

        if (nextStatus !== "waiting") return;

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

  const debugEnabled = process.env.NODE_ENV !== "production";

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

        <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
          {ui.subtitle}
        </p>

        {error ? (
          <p className="mt-2 text-[11px] text-rose-600">
            Status update warning: {error}
          </p>
        ) : null}
      </header>

      {/* Summary */}
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Invoice</span>
          <span className="max-w-[60%] truncate font-mono text-[11px] text-slate-900">
            {id}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Payment status</span>
          <span
            className={`inline-flex h-7 items-center gap-2 rounded-full border px-3 text-xs font-medium ${ui.badgeCls}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            <span className="whitespace-nowrap leading-none">{ui.badge}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Fiat amount</span>
          <span className="tabular-nums text-slate-900">
            {typeof invoice.fiatAmount === "number" && invoice.fiatCurrency
              ? formatMoney(invoice.fiatAmount, invoice.fiatCurrency)
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500">Crypto amount</span>
          <span className="tabular-nums text-slate-900">
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

      {/* Transaction */}
      <section className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Transaction</h3>
          <span className="text-[11px] text-slate-500">
            Status:{" "}
            <span className="font-mono text-slate-900">
              {invoice.txStatus ?? "pending"}
            </span>
          </span>
        </div>

        <div className="space-y-1 text-xs text-slate-700">
          <KVRow k="txHash" v={invoice.txHash ?? "—"} />
          <KVRow k="Wallet" v={invoice.walletAddress ?? "—"} />
          <KVRow
            k="Confirmations"
            v={`${String(confs)} / ${String(requiredConfs)}`}
          />

          <div className="flex items-start gap-2">
            <span className="w-28 shrink-0 text-slate-500">Detected</span>
            <span className="text-[11px] text-slate-900">
              {fmtTs(invoice.detectedAt)}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="w-28 shrink-0 text-slate-500">Confirmed</span>
            <span className="text-[11px] text-slate-900">
              {fmtTs(invoice.confirmedAt)}
            </span>
          </div>
        </div>
      </section>

      {/* AML */}
      {showAml ? (
        <section className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">
            AML &amp; Decision
          </h3>

          <div className="space-y-1 text-xs text-slate-700">
            <KVRow k="AML" v={invoice.amlStatus ?? "—"} />
            <KVRow
              k="Risk"
              v={
                typeof invoice.riskScore === "number" ? invoice.riskScore : "—"
              }
            />
            <KVRow k="Decision" v={invoice.decisionStatus ?? "—"} />

            {invoice.decisionReasonText ? (
              <div className="pt-1 text-[11px] text-slate-600">
                {invoice.decisionReasonText}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* Debug */}
      {debugEnabled ? (
        <DebugPanel
          open={debugOpen}
          snapshot={debugInvoice}
          onToggle={() => setDebugOpen((v) => !v)}
        />
      ) : null}
    </>
  );
}

export default function ClientSuccess({ invoiceId }: { invoiceId: string }) {
  const id = (invoiceId ?? "").trim();

  if (!id) {
    const ui = statusUi(undefined);

    return (
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

        <p className="mx-auto mt-2 max-w-sm text-xs text-slate-500">
          Tip: open this page as{" "}
          <span className="font-mono">/open/pay/success?invoiceId=...</span>
        </p>
      </header>
    );
  }

  return <SuccessInner key={id} id={id} />;
}
