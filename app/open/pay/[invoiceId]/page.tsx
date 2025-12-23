// app/open/pay/[invoiceId]/page.tsx

import Link from "next/link";
import type { InvoiceData } from "@/lib/invoiceStore";

import { CryptoPayPaymentClient } from "@/components/cryptoPay/CryptoPayPaymentClient";

const PSP_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

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

  // ✅ дополнительные поля PSP Core (нужны для динамики txHash/walletAddress)
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: "merchant" | "customer" | null;

  fxRate?: number | null;
  fxPair?: string | null;

  network?: string | null;

  txHash?: string | null;
  walletAddress?: string | null;
  txStatus?: "pending" | "detected" | "confirmed" | null;

  confirmations?: number | null;
  requiredConfirmations?: number | null;

  detectedAt?: string | null;
  confirmedAt?: string | null;

  riskScore?: number | null;
  amlStatus?: "clean" | "dirty" | "unknown" | null;

  assetRiskScore?: number | null;
  assetStatus?: "clean" | "dirty" | "unknown" | null;

  merchantId?: string | null;

  decisionStatus?: "none" | "approved" | "rejected" | null;
  decisionReasonCode?: string | null;
  decisionReasonText?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
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
  return new Date(Date.now() + 25 * 60 * 1000).toISOString();
}

// Загружаем инвойс из backend PSP-core
async function fetchInvoiceFromPsp(
  invoiceId: string
): Promise<InvoiceData | null> {
  if (!PSP_API_URL) return null;

  try {
    const res = await fetch(
      `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`,
      { cache: "no-store" }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as PspInvoice;

    return {
      invoiceId: data.id,
      createdAt: data.createdAt ?? null,
      expiresAt: data.expiresAt,

      fiatAmount: data.fiatAmount,
      fiatCurrency: data.fiatCurrency,
      cryptoAmount: data.cryptoAmount,
      cryptoCurrency: data.cryptoCurrency,

      status: data.status,
      paymentUrl: data.paymentUrl,

      // money / fx
      grossAmount: data.grossAmount ?? null,
      feeAmount: data.feeAmount ?? null,
      netAmount: data.netAmount ?? null,
      feeBps: data.feeBps ?? null,
      feePayer: data.feePayer ?? null,

      fxRate: data.fxRate ?? null,
      fxPair: data.fxPair ?? null,

      // chain / tx
      network: data.network ?? null,
      txHash: data.txHash ?? null,
      walletAddress: data.walletAddress ?? null,
      txStatus: data.txStatus ?? null,
      confirmations: data.confirmations ?? null,
      requiredConfirmations: data.requiredConfirmations ?? null,
      detectedAt: data.detectedAt ?? null,
      confirmedAt: data.confirmedAt ?? null,

      // aml / decision
      riskScore: data.riskScore ?? null,
      amlStatus: data.amlStatus ?? null,
      assetRiskScore: data.assetRiskScore ?? null,
      assetStatus: data.assetStatus ?? null,

      merchantId: data.merchantId ?? null,

      decisionStatus: data.decisionStatus ?? null,
      decisionReasonCode: data.decisionReasonCode ?? null,
      decisionReasonText: data.decisionReasonText ?? null,
      decidedAt: data.decidedAt ?? null,
      decidedBy: data.decidedBy ?? null,
    };
  } catch {
    return null;
  }
}

export default async function PaymentPage(props: PageProps) {
  const { invoiceId } = await props.params;

  const invoice: InvoiceData | null = await fetchInvoiceFromPsp(invoiceId);

  // ✅ ВАЖНО: В ПРОДЕ никаких fallback-данных из query быть не должно.
  // Оставляем demo fallback только в dev, чтобы можно было верстать UI без бэка.
  const isDev = process.env.NODE_ENV !== "production";

  let finalInvoice = invoice;

  if (!finalInvoice && isDev) {
    const sp = (await props.searchParams) ?? {};
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
        // demo fallback — НЕ финансовая логика, только для UI
        cryptoAmount: parsedAmount,
        status: "waiting",
        expiresAt: getDemoExpiresAt(),
        paymentUrl: `/open/pay/${invoiceId}`,

        // чтобы тип совпадал
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
    finalInvoice.fiatAmount.toFixed(2)
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

        {/* ✅ Всё остальное рендерим в client-wrapper, чтобы работал polling invoice snapshot */}
        <CryptoPayPaymentClient initialInvoice={finalInvoice} />
      </div>
    </main>
  );
}
