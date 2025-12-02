// src/components/checkout/CheckoutClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CheckoutClientProps = {
  initialAmount: number;
};

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

export default function CheckoutClient({ initialAmount }: CheckoutClientProps) {
  const router = useRouter();

  const [amount] = useState(() =>
    !Number.isFinite(initialAmount) || initialAmount < 0 ? 0 : initialAmount
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateInvoice() {
    if (!amount || amount <= 0) {
      setError("Cart amount is missing. Go back and add at least one product.");
      return;
    }

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
        let data: any = {};
        try {
          data = await res.json();
        } catch {
          // ignore
        }
        throw new Error(data?.error || "Failed to create invoice");
      }

      const json = (await res.json()) as InvoiceResponse;

      if (!json.paymentUrl) {
        throw new Error("Payment URL is missing in invoice response.");
      }

      router.push(json.paymentUrl);
    } catch (err: unknown) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unexpected error while creating invoice."
      );
    } finally {
      setLoading(false);
    }
  }

  const displayAmount = amount > 0 ? amount.toFixed(2) : "0.00";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 lg:py-12">
        {/* Header */}
        <header className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <span className="text-sm">←</span>
            <span>Back to store</span>
          </button>

          <h1 className="mt-3 text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-lg">
            Review your order and continue to Crypto Pay — a crypto-friendly
            payment flow where the payment itself is processed by a regulated
            Swiss partner. You always pay from your own wallet; funds are never
            held on this website.
          </p>
        </header>

        <div className="space-y-6">
          {/* Order summary */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Order summary
              </h2>
              <span className="text-xs text-slate-500">Demo checkout</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total amount</span>
              <span className="text-lg font-semibold text-slate-900">
                €{displayAmount}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              This is a demo environment. Taxes, shipping and discounts are not
              applied.
            </p>
          </section>

          {/* Crypto payment info */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm px-5 py-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Crypto payment (Crypto Pay)
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                After confirming this step, you will be redirected to a hosted
                Crypto Pay page. There you can pay with USDT / USDC from your
                own wallet (MetaMask, Ledger or any compatible wallet), while a
                Swiss-licensed partner handles the crypto side securely in the
                background.
              </p>
            </div>

            <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">
              <li>
                The crypto rate for your payment will be locked for a limited
                time window.
              </li>
              <li>
                You&apos;ll see the exact amount in USDT/USDC, the network to
                use and the wallet address / QR code.
              </li>
              <li>
                Your payment will be marked as completed only after on-chain
                confirmation by the Swiss partner.
              </li>
              <li>
                For larger or high-risk transfers, an additional AML check may
                be required in line with Swiss regulations.
              </li>
            </ul>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Button */}
          <section className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleCreateInvoice}
              disabled={loading || amount <= 0}
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-4 py-2.5 text-sm font-medium hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {loading ? "Creating invoice..." : "Continue to Crypto Pay"}
            </button>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              By clicking continue, a demo invoice will be created and you will
              be redirected to a Crypto Pay payment page. No real payment will
              be processed in this demo. In a production setup, continuing means
              you accept our Terms of use, Privacy policy and AML &amp; Risk
              notice.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
