// src/components/cryptoPay/CryptoPayPaymentClient.tsx
"use client";

import { useState } from "react";
import type { InvoiceData } from "@/lib/invoiceStore";

import { CryptoPayHeader } from "@/components/cryptoPay/CryptoPayHeader";
import { CryptoPayAmountCard } from "@/components/cryptoPay/CryptoPayAmountCard";
import { CryptoPayTimer } from "@/components/cryptoPay/CryptoPayTimer";
import { CryptoPayWalletSection } from "@/components/cryptoPay/CryptoPayWalletSection";
import { CryptoPayStatusWithPolling } from "@/components/cryptoPay/CryptoPayStatusWithPolling";

type Props = {
  initialInvoice: InvoiceData;
};

function CryptoPayPaymentClientInner({ initialInvoice }: Props) {
  const [invoice, setInvoice] = useState<InvoiceData>(() => initialInvoice);

  const invoiceId = (invoice.invoiceId ?? "").trim();

  // Hard stop: don’t render payment UI until we actually have invoiceId.
  if (!invoiceId) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="text-sm font-semibold text-slate-900">
          Loading payment…
        </div>
        <div className="mt-1 text-xs text-slate-600">
          Preparing invoice details…
        </div>
        <div className="mt-2 text-[11px] text-slate-500">
          Keep this page open — it updates automatically.
        </div>
      </section>
    );
  }

  // show instructions unless link is dead
  const showInstructions =
    invoice.status !== "expired" && invoice.status !== "rejected";

  // wallet instructions require address to be actually useful
  const hasPaymentAddress = Boolean(invoice.walletAddress);

  return (
    <>
      <CryptoPayHeader invoiceId={invoiceId} />

      <CryptoPayStatusWithPolling
        invoiceId={invoiceId}
        initialStatus={invoice.status}
        expiresAt={invoice.expiresAt ?? ""}
        onInvoiceUpdate={setInvoice}
      />

      <div className="mt-3 mb-4">
        {(invoice.status === "expired" || invoice.status === "rejected") && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <div className="font-semibold mb-0.5">Payment not completed</div>
            <div>
              This payment link is no longer valid. Please return to the store
              checkout and create a new payment.
            </div>
          </div>
        )}

        {/* NOTE: confirmed redirect happens automatically in polling component */}
        {invoice.status === "confirmed" && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="font-semibold mb-0.5">Payment confirmed</div>
            <div>Redirecting to the success page…</div>
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

            {!hasPaymentAddress ? (
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Payment instructions
                </div>
                <div className="mt-1 text-xs text-slate-600">
                  Waiting for payment details (wallet address / network)…
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  Keep this page open — it updates automatically.
                </div>
              </section>
            ) : (
              <CryptoPayWalletSection
                invoiceId={invoiceId}
                cryptoCurrency={invoice.cryptoCurrency}
                cryptoAmount={invoice.cryptoAmount}
                walletAddress={invoice.walletAddress}
                network={invoice.network}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

export function CryptoPayPaymentClient({ initialInvoice }: Props) {
  // ✅ If invoiceId changes (new invoice), fully reset local state without effects.
  const key = (initialInvoice.invoiceId ?? "").trim() || "invoice";
  return (
    <CryptoPayPaymentClientInner key={key} initialInvoice={initialInvoice} />
  );
}
