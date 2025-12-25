// app/open/pay/[invoiceId]/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import { CryptoPayPaymentClient } from "@/components/cryptoPay/CryptoPayPaymentClient";
import type { InvoiceData } from "@/lib/invoiceStore";

export const dynamic = "force-dynamic";

type PageProps = {
  params: { invoiceId: string };
  searchParams?: {
    amount?: string | string[];
    fiat?: string | string[];
    crypto?: string | string[];
  };
};

function normalizeParam(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function getDemoExpiresAt(): string {
  return new Date(Date.now() + 25 * 60 * 1000).toISOString();
}

function getBaseUrl(): string {
  const envBase =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envBase) return envBase.replace(/\/+$/, "");

  // Runtime headers fallback (NO await here)
  try {
    const h = headers();
    const host = h.get("x-forwarded-host") || h.get("host");
    const proto = h.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`.replace(/\/+$/, "");
  } catch {
    // ignore
  }

  // Dev fallback
  if (process.env.NODE_ENV !== "production") return "http://localhost:3000";

  return "";
}

/**
 * SSR: load initial invoice snapshot via our Next API route
 */
async function fetchInvoiceFromNextApi(
  invoiceId: string
): Promise<InvoiceData | null> {
  try {
    const baseUrl = getBaseUrl();
    if (!baseUrl) return null;

    const url = `${baseUrl}/api/payments/status?invoiceId=${encodeURIComponent(
      invoiceId
    )}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const snap = (await res.json()) as any;
    if (!snap?.ok) return null;

    // If backend later wraps payload as { invoice: {...} }
    const src = snap.invoice ?? snap;

    const invoice: InvoiceData = {
      invoiceId: src.invoiceId ?? invoiceId,
      createdAt: src.createdAt ?? null,
      expiresAt: src.expiresAt ?? null,

      fiatAmount: typeof src.fiatAmount === "number" ? src.fiatAmount : 0,
      fiatCurrency: src.fiatCurrency ?? "CHF",
      cryptoAmount: typeof src.cryptoAmount === "number" ? src.cryptoAmount : 0,
      cryptoCurrency: src.cryptoCurrency ?? "USDT",

      status: (src.status ?? "waiting") as InvoiceData["status"],
      paymentUrl: `/open/pay/${invoiceId}`,

      grossAmount: src.grossAmount ?? null,
      feeAmount: src.feeAmount ?? null,
      netAmount: src.netAmount ?? null,
      feeBps: src.feeBps ?? null,
      feePayer: src.feePayer ?? null,

      fxRate: src.fxRate ?? null,
      fxPair: src.fxPair ?? null,

      network: src.network ?? null,

      txHash: src.txHash ?? null,
      walletAddress: src.walletAddress ?? null,
      txStatus: src.txStatus ?? "pending",
      confirmations:
        typeof src.confirmations === "number" ? src.confirmations : 0,
      requiredConfirmations:
        typeof src.requiredConfirmations === "number"
          ? src.requiredConfirmations
          : null,

      detectedAt: src.detectedAt ?? null,
      confirmedAt: src.confirmedAt ?? null,

      riskScore: src.riskScore ?? null,
      amlStatus: src.amlStatus ?? null,
      assetRiskScore: src.assetRiskScore ?? null,
      assetStatus: src.assetStatus ?? null,

      merchantId: src.merchantId ?? null,

      decisionStatus: src.decisionStatus ?? "none",
      decisionReasonCode: src.decisionReasonCode ?? null,
      decisionReasonText: src.decisionReasonText ?? null,
      decidedAt: src.decidedAt ?? null,
      decidedBy: src.decidedBy ?? null,
    };

    return invoice;
  } catch {
    return null;
  }
}

export default async function PaymentPage({ params, searchParams }: PageProps) {
  const { invoiceId } = params;

  let finalInvoice: InvoiceData | null = await fetchInvoiceFromNextApi(
    invoiceId
  );

  const isDev = process.env.NODE_ENV !== "production";

  // DEV-only demo fallback for UI testing without backend
  if (!finalInvoice && isDev) {
    const sp = searchParams ?? {};
    const rawAmount = normalizeParam(sp.amount);
    const rawFiat = normalizeParam(sp.fiat);
    const rawCrypto = normalizeParam(sp.crypto);

    const parsedAmount = rawAmount ? Number(rawAmount) : 0;

    if (parsedAmount > 0 && rawFiat) {
      finalInvoice = {
        invoiceId,
        fiatAmount: parsedAmount,
        fiatCurrency: rawFiat,
        cryptoCurrency: (rawCrypto || "USDT").toUpperCase(),
        cryptoAmount: parsedAmount, // demo UI only
        status: "waiting",
        expiresAt: getDemoExpiresAt(),
        paymentUrl: `/open/pay/${invoiceId}`,

        createdAt: null,
        grossAmount: null,
        feeAmount: null,
        netAmount: null,
        feeBps: null,
        feePayer: null,
        fxRate: null,
        fxPair: null,
        network: null,
        txHash: null,
        walletAddress: null,
        txStatus: "pending",
        confirmations: 0,
        requiredConfirmations: null,
        detectedAt: null,
        confirmedAt: null,
        riskScore: null,
        amlStatus: null,
        assetRiskScore: null,
        assetStatus: null,
        merchantId: null,
        decisionStatus: "none",
        decisionReasonCode: null,
        decisionReasonText: null,
        decidedAt: null,
        decidedBy: null,
      };
    }
  }

  if (!finalInvoice) {
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

  const checkoutHref = `/checkout?amount=${encodeURIComponent(
    Number(finalInvoice.fiatAmount || 0).toFixed(2)
  )}`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8 lg:py-10">
        <div className="mb-3">
          <Link
            href={checkoutHref}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <span className="text-sm">←</span>
            <span>Back to checkout</span>
          </Link>
        </div>

        <CryptoPayPaymentClient initialInvoice={finalInvoice} />
      </div>
    </main>
  );
}
