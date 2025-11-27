"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpenDemo() {
    router.push("/open/pay/123456");
  }

  async function handleCreateTestInvoice() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: "ORDER-TEST",
          fiatAmount: 120,
          fiatCurrency: "EUR",
          cryptoCurrency: "BTC",
        }),
      });

      if (!res.ok) {
        throw new Error(`Create failed: ${res.status}`);
      }

      const data = await res.json();

      if (!data.paymentUrl) {
        throw new Error("No paymentUrl in response");
      }

      // Переходим на страницу оплаты
      router.push(data.paymentUrl as string);
    } catch (err) {
      console.error(err);
      setError("Failed to create test invoice.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Crypto Pay – dev console
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Use this page to test the cryptocurrency payment flow for online
            stores.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleOpenDemo}
            className="w-full inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-100 transition"
          >
            Open demo invoice (ID: 123456)
          </button>

          <button
            type="button"
            onClick={handleCreateTestInvoice}
            disabled={loading}
            className="w-full inline-flex items-center justify-center rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating invoice…" : "Create test invoice and open"}
          </button>
        </div>

        <p className="text-xs text-gray-400">
          Later this screen can be replaced with merchant dashboard or embedded
          into partner integration docs.
        </p>
      </div>
    </main>
  );
}
