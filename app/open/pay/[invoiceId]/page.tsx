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

  // 1) Пытаемся взять инвойс из in-memory store (локальная разработка)
  let invoice = getInvoice(invoiceId);

  // 2) Если в store нет (типичный случай на Vercel),
  //    пробуем собрать "мок-инвойс" из query-параметров
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

  // 3) Если всё равно нет данных — значит ссылка реально битая
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

  // 4) Красивый экран оплаты
  const {
    fiatAmount,
    fiatCurrency,
    cryptoAmount,
    cryptoCurrency,
    expiresAt,
    status,
  } = invoice;

  // Ссылка назад на checkout с той же суммой
  const checkoutHref = `/checkout?amount=${encodeURIComponent(
    fiatAmount.toFixed(2)
  )}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8 lg:py-10">
        {/* Back link */}
        <div className="mb-3">
          <a
            href={checkoutHref}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <span className="text-sm">←</span>
            <span>Back to checkout</span>
          </a>
        </div>

        {/* Header */}
        <CryptoPayHeader invoiceId={invoice.invoiceId} />

        {/* Статус инвойса */}
        <CryptoPayStatusBadge
          expiresAt={expiresAt}
          initialStatus={status as "waiting" | "confirmed" | "expired"}
        />

        <div className="space-y-4">
          {/* Amount card */}
          <CryptoPayAmountCard
            fiatAmount={fiatAmount}
            fiatCurrency={fiatCurrency}
            cryptoAmount={cryptoAmount}
            cryptoCurrency={cryptoCurrency}
          />

          {/* Timer под суммой */}
          <CryptoPayTimer expiresAt={expiresAt} />

          {/* Wallet info — отдельный умный компонент */}
          <CryptoPayWalletSection
            cryptoCurrency={cryptoCurrency}
            cryptoAmount={cryptoAmount}
          />

          {/* Demo переход на success-страницу */}
          <div className="pt-2 text-center">
            <a
              href="/open/pay/success"
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition"
            >
              <span>I have sent the payment (demo)</span>
              <span className="text-xs">→</span>
            </a>
            <p className="mt-1 text-[10px] text-slate-400">
              In a real integration, this step is triggered automatically after
              the Swiss provider confirms your on-chain payment.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
