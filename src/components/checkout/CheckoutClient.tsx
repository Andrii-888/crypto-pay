// src/components/checkout/CheckoutClient.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

type InvoiceResponse = {
  invoiceId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  cryptoAmount: number;
  status: string;
  expiresAt: string;
  paymentUrl: string;
};

type CheckoutClientProps = {
  initialAmount: number;
};

export default function CheckoutClient({ initialAmount }: CheckoutClientProps) {
  const amount = initialAmount > 0 ? initialAmount : 0;
  const hasAmount = amount > 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);

  async function handleCreateInvoice() {
    if (!hasAmount || loading) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          fiatCurrency: "EUR",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create invoice");
      }

      const json = (await res.json()) as InvoiceResponse;
      setInvoice(json);
      console.log("Invoice created:", json);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top nav / header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
              CP
            </div>
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
                Crypto Pay
              </div>
              <div className="text-xs text-slate-500">
                Demo checkout powered by Swiss partner
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 underline-offset-4 hover:underline"
          >
            ← Back to cart
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-10">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Confirm your order
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            This page simulates the step where your customer is redirected to
            the crypto payment provider with a fixed order amount.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          {/* Order summary */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Order details
              </h2>
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                Demo only
              </span>
            </div>

            {hasAmount ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Order amount</span>
                    <span className="text-lg font-semibold text-slate-900">
                      €{amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Taxes, shipping and discounts are not applied in this demo.
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-xs text-slate-600 space-y-1">
                  <p className="font-medium text-slate-800">
                    What happens next?
                  </p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>We will create a crypto invoice for this amount.</li>
                    <li>
                      You will see the provider&apos;s payment page with the
                      final amount in USDT / USDC.
                    </li>
                    <li>
                      After the payment is confirmed on-chain, the order will be
                      marked as paid.
                    </li>
                  </ol>
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-3 text-xs text-amber-800 space-y-2">
                <p className="font-medium">No order amount provided.</p>
                <p>
                  Please go back to the cart, add at least one product and then
                  choose Crypto Pay as a payment method.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center text-[11px] font-medium text-amber-900 underline underline-offset-4"
                >
                  ← Back to cart
                </Link>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 mt-2">
                {error}
              </div>
            )}

            {invoice && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-3 text-xs text-emerald-800 space-y-1 mt-2">
                <p className="font-medium">Invoice created</p>
                <p>
                  ID: <span className="font-mono">{invoice.invoiceId}</span>
                </p>
                <p>
                  To pay:{" "}
                  <span className="font-semibold">
                    {invoice.cryptoAmount} {invoice.cryptoCurrency}
                  </span>
                </p>
                <p className="text-[10px] text-emerald-700/80">
                  Next step (later): automatically redirect to{" "}
                  <span className="font-mono">{invoice.paymentUrl}</span>
                </p>
              </div>
            )}
          </section>

          {/* Side panel: provider & action */}
          <aside className="space-y-4 lg:pt-2">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Crypto payment
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  In production this step would redirect the customer to a
                  regulated Swiss crypto payment provider.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3 text-[11px] text-slate-600 space-y-1">
                <p>
                  • Provider locks the crypto rate for a short time window (e.g.
                  25 minutes).
                </p>
                <p>
                  • Customer pays in USDT/USDC from their own wallet, funds do
                  not touch your infrastructure.
                </p>
                <p>• You receive EUR/CHF on your business account (or USDT).</p>
              </div>

              <button
                type="button"
                onClick={handleCreateInvoice}
                disabled={!hasAmount || loading}
                className={`w-full rounded-lg px-4 py-2 text-xs font-medium transition ${
                  hasAmount && !loading
                    ? "bg-black text-white hover:bg-gray-900"
                    : "bg-gray-900/10 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading
                  ? "Creating invoice…"
                  : hasAmount
                  ? "Continue to Crypto Pay (create invoice)"
                  : "Select products in cart first"}
              </button>

              <p className="text-[10px] text-slate-400">
                This button calls our own backend endpoint, creates a crypto
                invoice via API and (later) will redirect the customer to the
                provider&apos;s hosted payment page.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
