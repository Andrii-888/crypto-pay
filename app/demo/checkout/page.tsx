"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SupportedCrypto = "USDT" | "USDC";

export default function DemoCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cryptoCurrency, setCryptoCurrency] = useState<SupportedCrypto>("USDT");

  const priceFiat = 120;
  const fiatCurrency = "EUR";

  async function handlePayWithCrypto() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: "ORDER-STORE-001",
          fiatAmount: priceFiat,
          fiatCurrency,
          cryptoCurrency, // "USDT" или "USDC"
        }),
      });

      if (!res.ok) {
        throw new Error(`Create failed: ${res.status}`);
      }

      const data = await res.json();

      if (!data.paymentUrl) {
        throw new Error("No paymentUrl in response");
      }

      router.push(data.paymentUrl as string);
    } catch (err) {
      console.error(err);
      setError("Failed to start crypto payment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Demo checkout (online store)
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            This page simulates a real e-commerce checkout that redirects to the
            crypto payment page.
          </p>
        </div>

        {/* Блок товара */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-gray-900">
              Premium item example
            </div>
            <div className="text-xs text-gray-500 mt-1">
              White-label crypto payment integration for online stores.
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-semibold text-gray-900">
              {fiatCurrency} {priceFiat.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Выбор стейблкоина */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Choose stablecoin
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setCryptoCurrency("USDT")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
                cryptoCurrency === "USDT"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              USDT
            </button>
            <button
              type="button"
              onClick={() => setCryptoCurrency("USDC")}
              className={`px-4 py-1.5 text-xs font-medium rounded-md transition ${
                cryptoCurrency === "USDC"
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              USDC
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handlePayWithCrypto}
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading
              ? "Creating crypto invoice…"
              : `Pay with cryptocurrency (${cryptoCurrency})`}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          In a real store, this logic would live on the merchant&apos;s checkout
          page and call your Swiss payment provider API.
        </p>
      </div>
    </main>
  );
}
