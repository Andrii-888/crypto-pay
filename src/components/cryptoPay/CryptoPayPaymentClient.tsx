// src/components/cryptoPay/CryptoPayPaymentClient.tsx
"use client";

import { useMemo, useState } from "react";
import type { InvoiceData } from "@/lib/invoiceStore";

import { CryptoPayHeader } from "@/components/cryptoPay/CryptoPayHeader";
import { CryptoPayAmountCard } from "@/components/cryptoPay/CryptoPayAmountCard";
import { CryptoPayTimer } from "@/components/cryptoPay/CryptoPayTimer";
import { CryptoPayWalletSection } from "@/components/cryptoPay/CryptoPayWalletSection";
import { CryptoPayStatusWithPolling } from "@/components/cryptoPay/CryptoPayStatusWithPolling";

type Props = {
  initialInvoice: InvoiceData;
};

function isFinalStatus(status: InvoiceData["status"]) {
  return (
    status === "confirmed" || status === "expired" || status === "rejected"
  );
}

function fmtTs(ts?: string | null) {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
}

export function CryptoPayPaymentClient({ initialInvoice }: Props) {
  const [invoice, setInvoice] = useState<InvoiceData>(initialInvoice);

  const isFinal = isFinalStatus(invoice.status);

  // txStatus может быть detected/confirmed, даже если invoice.status ещё waiting
  const txReady = useMemo(() => {
    return (
      Boolean(invoice.txHash) ||
      (invoice.txStatus && invoice.txStatus !== "pending")
    );
  }, [invoice.txHash, invoice.txStatus]);

  const showInstructions = !isFinal; // waiting + detected и т.п.
  const showTx = txReady; // как только tx найден

  return (
    <>
      {/* Header */}
      <CryptoPayHeader invoiceId={invoice.invoiceId} />

      {/* Status + polling полного invoice */}
      <CryptoPayStatusWithPolling
        invoiceId={invoice.invoiceId}
        initialStatus={invoice.status}
        expiresAt={invoice.expiresAt}
        onInvoiceUpdate={setInvoice}
      />

      {/* Summary */}
      <div className="mt-3 mb-4">
        {invoice.status === "confirmed" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="font-semibold mb-0.5">
              Payment successfully confirmed
            </div>
            <div>
              The merchant has received your crypto payment. You can safely
              close this page.
            </div>
          </div>
        )}

        {(invoice.status === "expired" || invoice.status === "rejected") && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <div className="font-semibold mb-0.5">Payment not completed</div>
            <div>
              This payment link is no longer valid. Please return to the store
              checkout and create a new payment.
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <CryptoPayAmountCard
          fiatAmount={invoice.fiatAmount}
          fiatCurrency={invoice.fiatCurrency}
          cryptoAmount={invoice.cryptoAmount}
          cryptoCurrency={invoice.cryptoCurrency}
        />

        {showInstructions && (
          <>
            <CryptoPayTimer expiresAt={invoice.expiresAt} />

            {/* Instructions (address/amount UI) */}
            <CryptoPayWalletSection
              invoiceId={invoice.invoiceId}
              cryptoCurrency={invoice.cryptoCurrency}
              cryptoAmount={invoice.cryptoAmount}
              walletAddress={invoice.walletAddress}
              network={invoice.network}
            />

            {/* Transaction details (dynamic) */}
            {showTx && (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Transaction
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Status:{" "}
                    <span className="font-mono text-slate-900">
                      {invoice.txStatus ?? "pending"}
                    </span>
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div className="flex items-start gap-2">
                    <span className="w-24 shrink-0 text-slate-500">txHash</span>
                    <span className="font-mono break-all text-slate-900">
                      {invoice.txHash ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-24 shrink-0 text-slate-500">Wallet</span>
                    <span className="font-mono break-all text-slate-900">
                      {invoice.walletAddress ?? "—"}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-24 shrink-0 text-slate-500">
                      Confirmations
                    </span>
                    <span className="font-mono text-slate-900">
                      {(invoice.confirmations ?? 0).toString()} /{" "}
                      {(invoice.requiredConfirmations ?? 0).toString()}
                    </span>
                  </div>

                  {invoice.detectedAt ? (
                    <div className="flex items-start gap-2">
                      <span className="w-24 shrink-0 text-slate-500">
                        Detected
                      </span>
                      <span className="text-slate-900">
                        {fmtTs(invoice.detectedAt)}
                      </span>
                    </div>
                  ) : null}

                  {invoice.confirmedAt ? (
                    <div className="flex items-start gap-2">
                      <span className="w-24 shrink-0 text-slate-500">
                        Confirmed
                      </span>
                      <span className="text-slate-900">
                        {fmtTs(invoice.confirmedAt)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </section>
            )}
          </>
        )}

        {/* AML/Decision (optional — показываем только после confirmed) */}
        {invoice.status === "confirmed" && (
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">
              AML & Decision
            </h3>
            <div className="text-xs text-slate-700 space-y-1">
              <div className="flex items-start gap-2">
                <span className="w-24 shrink-0 text-slate-500">AML</span>
                <span className="font-mono text-slate-900">
                  {invoice.amlStatus ?? "—"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-24 shrink-0 text-slate-500">Risk</span>
                <span className="font-mono text-slate-900">
                  {invoice.riskScore ?? "—"}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-24 shrink-0 text-slate-500">Decision</span>
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
        )}
      </div>
    </>
  );
}
