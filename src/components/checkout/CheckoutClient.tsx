// src/components/checkout/CheckoutClient.tsx
"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type InvoiceResponse = {
  invoiceId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  cryptoAmount: number;
  status: string;
  paymentUrl: string;
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawAmount = searchParams.get("amount");
  const initialAmount = rawAmount ? Number.parseFloat(rawAmount) : 0;

  const [amount] = useState(initialAmount);
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateInvoice() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          fiatCurrency: "EUR",
        }),
      });

      if (!res.ok) {
        let message = "Failed to create invoice";

        try {
          const data = await res.json();
          if (data?.error) message = data.error;
        } catch {
          // игнорируем ошибки парсинга
        }

        throw new Error(message);
      }

      const json = (await res.json()) as InvoiceResponse;
      console.log("Invoice created:", json);
      setInvoice(json);

      // 🚀 КЛЮЧЕВОЕ: редирект на страницу оплаты
      if (json.paymentUrl) {
        router.push(json.paymentUrl);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-10">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-6 text-xs text-slate-500 hover:text-slate-700"
        >
          ← Back to cart
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
          {/* Левая колонка: детали заказа */}
          <section className="space-y-4">
            <h1 className="text-2xl font-semibold text-slate-900">
              Confirm your order
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              This page simulates the step where your customer is redirected to
              the crypto payment provider with a fixed order amount.
            </p>

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Order amount
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Taxes, shipping and discounts are not applied in this demo.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-slate-400">
                    Demo only
                  </div>
                  <div className="text-xl font-semibold text-slate-900">
                    €{amount.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800">
                  What happens next?
                </div>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>We will create a crypto invoice for this amount.</li>
                  <li>
                    You will see the provider&apos;s payment page with the final
                    amount in USDT / USDC.
                  </li>
                  <li>
                    After the payment is confirmed on-chain, the order will be
                    marked as paid.
                  </li>
                </ol>
              </div>

              {invoice && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 space-y-1">
                  <div className="font-semibold">Invoice created</div>
                  <div>
                    <span className="font-semibold">ID:</span>{" "}
                    {invoice.invoiceId}
                  </div>
                  <div>
                    <span className="font-semibold">To pay:</span>{" "}
                    {invoice.cryptoAmount} {invoice.cryptoCurrency}
                  </div>
                  <div className="text-[11px] text-emerald-700/80">
                    Next step (later): automatically redirect to{" "}
                    {invoice.paymentUrl}
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>
          </section>

          {/* Правая колонка: блок Crypto payment */}
          <aside>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Crypto payment
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  In production this step would redirect the customer to a
                  regulated Swiss crypto payment provider.
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 text-[11px] text-slate-600 space-y-1.5">
                <ul className="space-y-1">
                  <li>
                    • Provider locks the crypto rate for a short time window
                    (e.g. 25 minutes).
                  </li>
                  <li>
                    • Customer pays in USDT/USDC from their own wallet, funds do
                    not touch your infrastructure.
                  </li>
                  <li>
                    • You receive EUR/CHF on your business account (or USDT).
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={handleCreateInvoice}
                disabled={loading}
                className="w-full rounded-lg bg-black text-white text-xs font-medium px-4 py-2.5 hover:bg-slate-900 disabled:opacity-70 disabled:cursor-wait transition"
              >
                {loading
                  ? "Creating crypto invoice..."
                  : "Continue to Crypto Pay (create invoice)"}
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
