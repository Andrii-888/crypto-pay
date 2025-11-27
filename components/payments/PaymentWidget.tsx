"use client";

import { useEffect, useState } from "react";

type PaymentWidgetProps = {
  invoiceId: string;
};

type InvoiceData = {
  invoiceId: string;
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrency: string;
  cryptoAmount: number;
  status: "waiting" | "pending" | "confirmed" | "expired" | string;
  expiresAt: string;
};

export default function PaymentWidget({ invoiceId }: PaymentWidgetProps) {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загружаем данные инвойса с нашего API
  useEffect(() => {
    let isMounted = true;

    async function fetchInvoice() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/payments/${invoiceId}`);

        if (!res.ok) {
          throw new Error(`Failed to load invoice: ${res.status}`);
        }

        const json = (await res.json()) as InvoiceData;
        if (isMounted) {
          setData(json);
        }
      } catch (err: unknown) {
        console.error(err);
        if (isMounted) {
          setError("Failed to load invoice data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchInvoice();

    return () => {
      isMounted = false;
    };
  }, [invoiceId]);

  const statusLabel =
    data?.status === "confirmed"
      ? "Payment confirmed"
      : data?.status === "expired"
      ? "Payment window expired"
      : data?.status === "pending"
      ? "Payment detected, waiting for confirmations"
      : "Waiting for payment";

  const statusDotClass =
    data?.status === "confirmed"
      ? "bg-emerald-500"
      : data?.status === "expired"
      ? "bg-gray-400"
      : data?.status === "pending"
      ? "bg-blue-500"
      : "bg-amber-400";

  const timeLeftText = data
    ? "25:00" // позже заменим на реальный таймер до expiresAt
    : "--:--";

  const fiatAmount = data?.fiatAmount ?? 0;
  const fiatCurrency = data?.fiatCurrency ?? "EUR";
  const cryptoAmount = data?.cryptoAmount ?? 0;
  const cryptoCurrency = data?.cryptoCurrency ?? "BTC";

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Pay with cryptocurrency
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Use your crypto wallet to complete the payment.
          </p>
        </div>
        <span className="text-xs font-mono text-gray-400">
          Invoice: {invoiceId}
        </span>
      </div>

      {/* Состояние загрузки / ошибки */}
      {loading && (
        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
          Loading invoice data…
        </div>
      )}

      {error && !loading && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Основной контент только когда нет ошибки */}
      {!loading && !error && data && (
        <>
          {/* Amount section */}
          <div className="rounded-lg bg-gray-50 p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Order amount</span>
              <span className="text-lg font-semibold text-gray-900">
                {fiatCurrency} {fiatAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">To pay in crypto</span>
              <span className="text-base font-medium text-gray-900">
                {cryptoAmount} {cryptoCurrency}
              </span>
            </div>
          </div>

          {/* QR + address placeholder */}
          <div className="grid grid-cols-1 sm:grid-cols-[160px,1fr] gap-4 items-center">
            {/* QR placeholder */}
            <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 aspect-square">
              <span className="text-xs text-gray-400">QR code placeholder</span>
            </div>

            {/* Address + instructions */}
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">
                  Wallet address
                </div>
                <div className="rounded-md bg-gray-900 text-gray-100 text-xs font-mono p-3 break-all">
                  0x1234...abcd (example address)
                </div>
              </div>
              <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
                <li>Send only {cryptoCurrency} to this address.</li>
                <li>
                  The payment will be detected automatically on the blockchain.
                </li>
              </ul>
            </div>
          </div>

          {/* Status + timer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex h-2 w-2 rounded-full ${statusDotClass}`}
              />
              <span className="text-sm font-medium text-gray-800">
                {statusLabel}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Time left:{" "}
              <span className="font-medium text-gray-900">{timeLeftText}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
