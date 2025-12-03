import Link from "next/link";
import { getInvoice, type InvoiceData } from "@/lib/invoiceStore";

import { CryptoPayWalletSection } from "@/components/cryptoPay/CryptoPayWalletSection";
import { CryptoPayHeader } from "@/components/cryptoPay/CryptoPayHeader";
import { CryptoPayAmountCard } from "@/components/cryptoPay/CryptoPayAmountCard";
import { CryptoPayTimer } from "@/components/cryptoPay/CryptoPayTimer";
import { CryptoPayStatusBadge } from "@/components/cryptoPay/CryptoPayStatusBadge";

type PageProps = {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{
    amount?: string | string[];
    fiat?: string | string[];
    crypto?: string | string[];
  }>;
};

function normalizeParam(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function PaymentPage(props: PageProps) {
  const { invoiceId } = await props.params;
  const sp = await props.searchParams;

  let invoice = getInvoice(invoiceId);

  // Если инвойса нет — создаём fallback (демо)
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

  // Если нет данных вообще
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

  // Ссылка назад на checkout
  const checkoutHref = `/checkout?amount=${encodeURIComponent(
    fiatAmount.toFixed(2)
  )}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8 lg:py-10">
        {/* Back link (Next.js Link) */}
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
          initialStatus={status as "waiting" | "confirmed" | "expired"}
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
