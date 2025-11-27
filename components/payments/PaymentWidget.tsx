"use client";

import { useEffect, useState } from "react";

type PaymentWidgetProps = {
  invoiceId: string;
};

type SupportedCrypto = "USDT" | "USDC";

type InvoiceData = {
  invoiceId: string;
  fiatCurrency: string;
  fiatAmount: number;
  cryptoCurrency: SupportedCrypto | string;
  cryptoAmount: number;
  status: "waiting" | "pending" | "confirmed" | "expired" | string;
  expiresAt: string;
};

export default function PaymentWidget({ invoiceId }: PaymentWidgetProps) {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Временный адрес — позже сюда подставим реальный USDT/USDC адрес от провайдера
  const rawAddress = "0x1234567890abcdef1234567890abcdef12345678";

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

  const timeLeftText = data ? "25:00" : "--:--"; // позже сделаем реальный таймер

  const fiatAmount = data?.fiatAmount ?? 0;
  const fiatCurrency = data?.fiatCurrency ?? "EUR";
  const cryptoAmount = data?.cryptoAmount ?? 0;
  const cryptoCurrency: string = data?.cryptoCurrency ?? "USDT";

  const displayAddress = `${rawAddress.slice(0, 10)}...${rawAddress.slice(-6)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(rawAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Pay with stablecoin
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Use USDT or USDC from your crypto wallet to complete this payment.
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

          {/* Payment details (address + instructions) */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <div className="text-sm font-medium text-gray-700">
                  Wallet address ({cryptoCurrency})
                </div>
                <div className="mt-1 rounded-md bg-gray-900 text-gray-100 text-xs font-mono px-3 py-2 break-all">
                  {displayAddress}
                </div>
                <div className="mt-1 text-[11px] text-gray-400">
                  Always double-check the address before sending.
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-100 transition self-start sm:self-auto"
              >
                {copied ? "Copied ✓" : "Copy address"}
              </button>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <div className="text-sm font-medium text-gray-700 mb-1">
                How to pay
              </div>
              <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
                <li>Open your crypto wallet (mobile or desktop).</li>
                <li>
                  Select <span className="font-semibold">{cryptoCurrency}</span>{" "}
                  on the correct network (as agreed with your provider).
                </li>
                <li>
                  Paste the address above and send exactly{" "}
                  <span className="font-semibold">
                    {cryptoAmount} {cryptoCurrency}
                  </span>
                  .
                </li>
                <li>
                  For large amounts, consider sending a small test transaction
                  first and wait for confirmation.
                </li>
              </ol>
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
