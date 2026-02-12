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

function readExtra(inv: InvoiceData) {
  const o = inv as unknown as Record<string, unknown>;
  const s = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : undefined;
  const n = (v: unknown) =>
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string"
      ? Number(v.replace(",", "."))
      : undefined;

  const amlProvider = s(o.amlProvider);
  const amlCheckedAt = s(o.amlCheckedAt);
  const decidedAt = s(o.decidedAt);
  const decidedBy = s(o.decidedBy);

  // riskScore / assetRiskScore might already exist on InvoiceData, but keep safe read
  const riskScore = n(o.riskScore);
  const assetRiskScore = n(o.assetRiskScore);

  const decisionReasonCode = s(o.decisionReasonCode);
  const decisionReasonText = s(o.decisionReasonText);

  return {
    amlProvider,
    amlCheckedAt,
    decidedAt,
    decidedBy,
    riskScore,
    assetRiskScore,
    decisionReasonCode,
    decisionReasonText,
  };
}

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

  const isExpired = invoice.status === "expired";
  const isRejected = invoice.status === "rejected";
  const isConfirmed = invoice.status === "confirmed";
  const isDead = isExpired || isRejected;

  const pay = readPay(invoice);
  const extra = readExtra(invoice);

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

  // Loading state — keep it inside same layout width
  if (!invoiceId) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
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
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* container: centered + max width + padding for all screens */}
      <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Keep previous spacing logic: header -> status -> content */}
        <div className="space-y-4 sm:space-y-6">
          <CryptoPayHeader invoiceId={invoiceId} />

          <CryptoPayStatusWithPolling
            invoiceId={invoiceId}
            initialStatus={invoice.status}
            expiresAt={invoice.expiresAt ?? ""}
            onInvoiceUpdate={handleInvoiceUpdate}
          />

          <div className="space-y-3">
            {isDead && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm px-4 py-3 text-sm text-rose-800 sm:px-5">
                <div className="font-semibold mb-0.5">Payment expired</div>
                <div>This payment request has expired.</div>
              </div>
            )}

            {/* confirmed redirect happens automatically in polling component */}
            {isConfirmed && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 shadow-sm px-4 py-3 text-sm text-emerald-800 sm:px-5">
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

            {/* AML & Decision (shown only when data exists) */}
            {invoice.amlStatus ||
            invoice.decisionStatus ||
            invoice.riskScore !== undefined ||
            invoice.assetStatus ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
                <div className="text-xs font-semibold text-slate-900">
                  AML & Decision
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[11px] text-slate-500">AML status</div>
                    <div className="font-medium text-slate-900">
                      {invoice.amlStatus ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Risk score</div>
                    <div className="font-medium text-slate-900">
                      {invoice.riskScore ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Decision</div>
                    <div className="font-medium text-slate-900">
                      {invoice.decisionStatus ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">Reason</div>
                    <div className="font-medium text-slate-900">
                      {invoice.decisionReasonText ??
                        invoice.decisionReasonCode ??
                        "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">
                      Asset status
                    </div>
                    <div className="font-medium text-slate-900">
                      {invoice.assetStatus ?? "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-500">
                      Asset risk score
                    </div>
                    <div className="font-medium text-slate-900">
                      {invoice.assetRiskScore ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>
                    Provider:{" "}
                    <span className="text-slate-700">
                      {extra.amlProvider ?? "—"}
                    </span>
                  </div>
                  <div>
                    AML checked:{" "}
                    <span className="text-slate-700">
                      {extra.amlCheckedAt ?? "—"}
                    </span>
                  </div>
                  <div>
                    Decided at:{" "}
                    <span className="text-slate-700">
                      {extra.decidedAt ?? "—"}
                    </span>
                  </div>
                  <div>
                    Decided by:{" "}
                    <span className="text-slate-700">
                      {extra.decidedBy ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Timer only makes sense when invoice is not final */}
            {!isConfirmed && !isDead ? (
              <CryptoPayTimer expiresAt={invoice.expiresAt} />
            ) : null}

            {/* Always render wallet section area (even if expired/rejected),
                so address/QR is visible for UX/debug. */}
            {!hasPaymentAddress ? (
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
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
          </div>
        </div>
      </div>
    </main>
  );
}

export function CryptoPayPaymentClient({ initialInvoice }: Props) {
  // ✅ If invoiceId changes (new invoice), fully reset local state without effects.
  const key = (initialInvoice.invoiceId ?? "").trim() || "invoice";
  return (
    <CryptoPayPaymentClientInner key={key} initialInvoice={initialInvoice} />
  );
}
