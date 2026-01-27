"use client";

import { useState } from "react";

type PaymentWidgetProps = {
  invoiceId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
};

type Status = "waiting" | "pending" | "confirmed";

export default function PaymentWidget({
  invoiceId,
  fiatAmount,
  fiatCurrency,
  cryptoAmount,
  cryptoCurrency,
}: PaymentWidgetProps) {
  const [status, setStatus] = useState<Status>("waiting");

  const statusLabel: Record<Status, string> = {
    waiting: "Waiting for payment",
    pending: "Payment detected, waiting for confirmations",
    confirmed: "Payment confirmed",
  };

  const statusDotClass: Record<Status, string> = {
    waiting: "bg-amber-400",
    pending: "bg-blue-500",
    confirmed: "bg-emerald-500",
  };

  async function handleMarkPending() {
    // здесь позже будет логика “платёж замечен”
    setStatus("pending");
  }

  async function handleMarkConfirmed() {
    // здесь позже будет логика “платёж подтверждён”
    setStatus("confirmed");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 lg:py-10">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
              CP
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">
                Crypto Pay
              </div>
              <div className="text-xs text-slate-500">
                Demo payment page powered by Swiss partner
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            ← Back to cart
          </button>
        </header>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-6 lg:gap-8">
          {/* Left: order details */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-lg font-semibold text-slate-900">
                  Confirm your order
                </h1>
                <p className="mt-1 text-xs text-slate-500 max-w-md">
                  This page simulates the step where your customer is redirected
                  to the crypto payment provider with a fixed order amount.
                </p>
              </div>
              <span className="text-[11px] uppercase tracking-[0.16em] text-slate-400">
                Demo only
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Order amount</span>
                <span className="text-base font-semibold text-slate-900">
                  {fiatCurrency}{" "}
                  {fiatAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">To pay in crypto</span>
                <span className="text-xs font-medium text-slate-700">
                  {cryptoAmount.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {cryptoCurrency}
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="font-medium">Invoice created</span>
              </div>
              <p>ID: {invoiceId}</p>
              <p>
                To pay: {cryptoAmount} {cryptoCurrency}
              </p>
              <p className="text-[11px] text-emerald-700">
                Next step (later): customer will be redirected to the hosted
                payment page of the provider.
              </p>
            </div>
          </section>

          {/* Right: status + demo buttons */}
          <aside className="rounded-xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Crypto payment
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                In production this step redirects the customer to a regulated
                Swiss crypto payment provider.
              </p>
            </div>

            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-1.5">
              <p>• Provider locks the crypto rate for a short time window.</p>
              <p>• Customer pays in USDT/USDC from their own wallet.</p>
              <p>• You receive CHF on your business account (or USDT).</p>
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${statusDotClass[status]}`}
                />
                <span className="text-xs text-slate-700">
                  {statusLabel[status]}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                ID: {invoiceId}
              </span>
            </div>

            {/* Demo buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleMarkPending}
                className="w-full rounded-lg bg-black text-white text-xs font-medium px-3 py-2 hover:bg-slate-900 transition"
              >
                I&apos;ve sent the payment (demo)
              </button>
              <button
                type="button"
                onClick={handleMarkConfirmed}
                className="w-full rounded-lg border border-slate-200 text-xs font-medium text-slate-700 px-3 py-2 hover:bg-slate-50 transition"
              >
                Mark as confirmed (demo)
              </button>
            </div>

            <p className="text-[10px] text-slate-400">
              In a real integration these buttons would be replaced by automatic
              webhook callbacks from the provider after on-chain confirmation.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
