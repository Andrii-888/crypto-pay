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

type PayShape = {
  address?: string | null;
  network?: string | null;
};

function readPay(inv: InvoiceData): PayShape | null {
  const maybe = inv as unknown as { pay?: unknown };
  const p = maybe.pay;

  if (!p || typeof p !== "object") return null;

  const obj = p as Record<string, unknown>;

  const address =
    typeof obj.address === "string"
      ? obj.address
      : obj.address === null
      ? null
      : undefined;

  const network =
    typeof obj.network === "string"
      ? obj.network
      : obj.network === null
      ? null
      : undefined;

  return { address, network };
}

function CryptoPayPaymentClientInner({ initialInvoice }: Props) {
  const [invoice, setInvoice] = useState<InvoiceData>(() => initialInvoice);

  const invoiceId = (invoice.invoiceId ?? "").trim();

  // show instructions unless link is dead
  const showInstructions =
    invoice.status !== "expired" && invoice.status !== "rejected";

  const pay = readPay(invoice);

  // Prefer provider pay.* fields (NOWPayments) when present
  const effectiveWalletAddress = (
    pay?.address ??
    invoice.walletAddress ??
    ""
  ).trim();

  const effectiveNetwork = (pay?.network ?? invoice.network ?? "").trim();

  // wallet instructions require address to be actually useful
  const hasPaymentAddress = Boolean(effectiveWalletAddress);

  // ✅ Adapter: CryptoPayStatusWithPolling expects updater-style callback
  const handleInvoiceUpdate = (
    patch: InvoiceData | ((prev: InvoiceData) => InvoiceData)
  ) => {
    if (typeof patch === "function") {
      setInvoice((prev) => patch(prev));
      return;
    }
    setInvoice(patch);
  };

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

  return (
    <>
      <CryptoPayHeader invoiceId={invoiceId} />

      <CryptoPayStatusWithPolling
        invoiceId={invoiceId}
        initialStatus={invoice.status}
        expiresAt={invoice.expiresAt ?? ""}
        onInvoiceUpdate={handleInvoiceUpdate}
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
                walletAddress={effectiveWalletAddress}
                network={effectiveNetwork}
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
