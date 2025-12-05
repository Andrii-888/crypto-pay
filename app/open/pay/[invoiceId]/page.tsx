// app/open/pay/[invoiceId]/page.tsx

import Link from "next/link";
import type { InvoiceData } from "@/lib/invoiceStore";

import { CryptoPayWalletSection } from "@/components/cryptoPay/CryptoPayWalletSection";
import { CryptoPayHeader } from "@/components/cryptoPay/CryptoPayHeader";
import { CryptoPayAmountCard } from "@/components/cryptoPay/CryptoPayAmountCard";
import { CryptoPayTimer } from "@/components/cryptoPay/CryptoPayTimer";
import { CryptoPayStatusBadge } from "@/components/cryptoPay/CryptoPayStatusBadge";

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

console.log("[open/pay] PSP_API_URL =", PSP_API_URL);

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
  // В NEXT 16 это Promise
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

// Забираем инвойс из psp-core и мапим в формат InvoiceData для UI
async function fetchInvoiceFromPsp(
  invoiceId: string
): Promise<InvoiceData | null> {
  if (!PSP_API_URL) {
    return null;
  }

  try {
    const url = `${PSP_API_URL}/invoices/${invoiceId}`;
    console.log("[open/pay] Fetch invoice from PSP-core:", url);

    const res = await fetch(url, {
      cache: "no-store",
    });

    console.log("[open/pay] PSP-core response status:", res.status);

    // 404 — считаем, что инвойса нет
    if (res.status === 404) {
      return null;
    }

    // Любой другой неуспешный статус — тоже тихий фоллбек
    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as PspInvoice;

    const mapped: InvoiceData = {
      invoiceId: data.id,
      fiatAmount: data.fiatAmount,
      fiatCurrency: data.fiatCurrency,
      cryptoAmount: data.cryptoAmount,
      cryptoCurrency: data.cryptoCurrency,
      status: data.status,
      expiresAt: data.expiresAt,
      paymentUrl: data.paymentUrl,
    };

    console.log("[open/pay] Mapped invoice:", mapped);

    return mapped;
  } catch (e) {
    console.log("[open/pay] Error while loading invoice from PSP-core:", e);
    return null;
  }
}

export default async function PaymentPage(props: PageProps) {
  // ✅ Правильно распаковываем Promise
  const { invoiceId } = await props.params;
  const sp = (await props.searchParams) ?? {};

  // 1) Пытаемся получить инвойс из psp-core
  let invoice: InvoiceData | null = await fetchInvoiceFromPsp(invoiceId);

  // 2) Если инвойса нет в бэке — fallback по query-параметрам
  if (!invoice) {
    const rawAmount = normalizeParam(sp.amount);
    const rawFiat = normalizeParam(sp.fiat);
    const rawCrypto = normalizeParam(sp.crypto);

    const parsedAmount = rawAmount ? Number(rawAmount) : 0;

    if (parsedAmount > 0 && rawFiat) {
      const fallback: InvoiceData = {
        invoiceId,
        fiatAmount: parsedAmount,
        fiatCurrency: rawFiat,
        cryptoCurrency: (rawCrypto as string) || "USDT",
        cryptoAmount: parsedAmount,
        status: "waiting",
        expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
        paymentUrl: `/open/pay/${invoiceId}`,
      };

      invoice = fallback;
    }
  }

  // 3) Если совсем ничего — показываем "Invoice not found"
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

        {/* Status */}
        <CryptoPayStatusBadge
          expiresAt={expiresAt}
          initialStatus={
            status as "waiting" | "confirmed" | "expired" | "rejected"
          }
        />

        <div className="space-y-4">
          <CryptoPayAmountCard
            fiatAmount={fiatAmount}
            fiatCurrency={fiatCurrency}
            cryptoAmount={cryptoAmount}
            cryptoCurrency={cryptoCurrency}
          />

          <CryptoPayTimer expiresAt={expiresAt} />

          <CryptoPayWalletSection
            cryptoCurrency={cryptoCurrency}
            cryptoAmount={cryptoAmount}
          />
        </div>
      </div>
    </main>
  );
}
