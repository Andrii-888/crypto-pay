// app/open/pay/[invoiceId]/page.tsx

import Link from "next/link";
import type { InvoiceData } from "@/lib/invoiceStore";

import { CryptoPayWalletSection } from "@/components/cryptoPay/CryptoPayWalletSection";
import { CryptoPayHeader } from "@/components/cryptoPay/CryptoPayHeader";
import { CryptoPayAmountCard } from "@/components/cryptoPay/CryptoPayAmountCard";
import { CryptoPayTimer } from "@/components/cryptoPay/CryptoPayTimer";
import { CryptoPayStatusWithPolling } from "@/components/cryptoPay/CryptoPayStatusWithPolling";

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type PspInvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

interface PspInvoice {
  id: string;
  createdAt: string;
  expiresAt: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  status: PspInvoiceStatus;
  paymentUrl: string;
}

type PageProps = {
  params: Promise<{ invoiceId: string }>;
  searchParams?: Promise<{
    amount?: string | string[];
    fiat?: string | string[];
    crypto?: string | string[];
  }>;
};

function normalizeParam(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

// helper для demo-режима: срок жизни инвойса 25 минут
function getDemoExpiresAt(): string {
  const now = Date.now();
  return new Date(now + 25 * 60 * 1000).toISOString();
}

// Загружаем инвойс из backend PSP-core
async function fetchInvoiceFromPsp(
  invoiceId: string
): Promise<InvoiceData | null> {
  if (!PSP_API_URL) return null;

  try {
    const res = await fetch(`${PSP_API_URL}/invoices/${invoiceId}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as PspInvoice;

    return {
      invoiceId: data.id,
      fiatAmount: data.fiatAmount,
      fiatCurrency: data.fiatCurrency,
      cryptoAmount: data.cryptoAmount,
      cryptoCurrency: data.cryptoCurrency,
      status: data.status,
      expiresAt: data.expiresAt,
      paymentUrl: data.paymentUrl,
    };
  } catch {
    return null;
  }
}

export default async function PaymentPage(props: PageProps) {
  const { invoiceId } = await props.params;
  const sp = (await props.searchParams) ?? {};

  let invoice: InvoiceData | null = await fetchInvoiceFromPsp(invoiceId);

  // Fallback — данные из query (демо-режим)
  if (!invoice) {
    const rawAmount = normalizeParam(sp.amount);
    const rawFiat = normalizeParam(sp.fiat);
    const rawCrypto = normalizeParam(sp.crypto);

    const parsedAmount = rawAmount ? Number(rawAmount) : 0;

    if (parsedAmount > 0 && rawFiat) {
      invoice = {
        invoiceId,
        fiatAmount: parsedAmount,
        fiatCurrency: rawFiat,
        cryptoCurrency: (rawCrypto as string) || "USDT",
        cryptoAmount: parsedAmount,
        status: "waiting",
        expiresAt: getDemoExpiresAt(),
        paymentUrl: `/open/pay/${invoiceId}`,
      };
    }
  }

  if (!invoice) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full text-center space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">
            Invoice not found
          </h1>
          <p className="text-sm text-slate-500">
            The payment link is invalid or expired. Please go back to the store
            and create a new payment.
          </p>
        </div>
      </main>
    );
  }

  const {
    fiatAmount,
    fiatCurrency,
    cryptoAmount,
    cryptoCurrency,
    expiresAt,
    status,
  } = invoice;

  const checkoutHref = `/checkout?amount=${encodeURIComponent(
    fiatAmount.toFixed(2)
  )}`;

  const isWaiting = status === "waiting";
  const isConfirmed = status === "confirmed";
  const isFailed = status === "expired" || status === "rejected";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8 lg:py-10">
        {/* Back link */}
        <div className="mb-3">
          <Link
            href={checkoutHref}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <span className="text-sm">←</span>
            <span>Back to checkout</span>
          </Link>
        </div>

        {/* Header */}
        <CryptoPayHeader invoiceId={invoice.invoiceId} />

        {/* Status with polling */}
        <CryptoPayStatusWithPolling
          invoiceId={invoice.invoiceId}
          initialStatus={status as PspInvoiceStatus}
          expiresAt={expiresAt}
        />

        {/* Верхний блок с summary */}
        <div className="mt-3 mb-4">
          {isConfirmed && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <div className="font-semibold mb-0.5">
                Payment successfully confirmed
              </div>
              <div>
                The merchant has received your crypto payment. You can safely
                close this page.
              </div>
            </div>
          )}

          {isFailed && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <div className="font-semibold mb-0.5">Payment not completed</div>
              <div>
                This payment link is no longer valid. Please return to the store
                checkout and create a new payment.
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <CryptoPayAmountCard
            fiatAmount={fiatAmount}
            fiatCurrency={fiatCurrency}
            cryptoAmount={cryptoAmount}
            cryptoCurrency={cryptoCurrency}
          />

          {/* Таймер, кошелёк и demo-кнопка показываем только пока ожидаем оплату */}
          {isWaiting && (
            <>
              <CryptoPayTimer expiresAt={expiresAt} />

              <CryptoPayWalletSection
                invoiceId={invoice.invoiceId}
                cryptoCurrency={cryptoCurrency}
                cryptoAmount={cryptoAmount}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
