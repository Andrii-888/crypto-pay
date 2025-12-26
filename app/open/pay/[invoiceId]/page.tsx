// app/open/pay/[invoiceId]/page.tsx
import { headers } from "next/headers";
import type { Metadata } from "next";
import { CryptoPayPaymentClient } from "@/components/cryptoPay/CryptoPayPaymentClient";
import type { InvoiceData } from "@/lib/invoiceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ invoiceId?: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type StatusApiOk = {
  ok: true;
  invoiceId: string;
  status: "waiting" | "confirmed" | "expired" | "rejected";

  createdAt?: string | null;
  expiresAt?: string | null;

  fiatAmount?: number | null;
  fiatCurrency?: string | null;

  cryptoAmount?: number | null;
  cryptoCurrency?: string | null;

  network?: string | null;

  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: string | null;

  fxRate?: number | null;
  fxPair?: string | null;

  txStatus?: string | null;
  txHash?: string | null;
  walletAddress?: string | null;
  confirmations?: number | null;
  requiredConfirmations?: number | null;

  detectedAt?: string | null;
  confirmedAt?: string | null;

  amlStatus?: string | null;
  riskScore?: number | null;
  assetStatus?: string | null;
  assetRiskScore?: number | null;

  decisionStatus?: string | null;
  decisionReasonCode?: string | null;
  decisionReasonText?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;

  merchantId?: string | null;
  paymentUrl?: string | null;

  [key: string]: any;
};

type StatusApiErr = { ok: false; error?: string; details?: string };
type StatusApiResponse = StatusApiOk | StatusApiErr;

function normalizeParam(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}

/**
 * ✅ Best practice for Vercel SSR:
 * - do NOT rely on NEXT_PUBLIC_SITE_URL here (often set to localhost)
 * - build baseUrl from forwarded headers
 */
async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

async function fetchInvoiceSnapshot(
  invoiceId: string
): Promise<StatusApiOk | null> {
  if (!invoiceId) return null;

  const baseUrl = await getBaseUrlFromHeaders();
  const url = `${baseUrl}/api/payments/status?invoiceId=${encodeURIComponent(
    invoiceId
  )}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as StatusApiResponse | null;
  if (!data || (data as any).ok !== true) return null;

  return data as StatusApiOk;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const p = await params;
  const invoiceId = String(p?.invoiceId ?? "").trim();
  return { title: invoiceId ? `Crypto Pay • ${invoiceId}` : "Crypto Pay" };
}

function NotFoundUI({ invoiceId }: { invoiceId?: string }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 shadow-sm p-5">
          <div className="text-sm font-semibold text-rose-900">
            Invoice not found
          </div>
          <div className="mt-1 text-xs text-rose-800">
            The payment link is invalid or expired. Please go back to the store
            and create a new payment.
          </div>
          {invoiceId ? (
            <div className="mt-2 text-[11px] text-rose-700 font-mono break-all">
              invoiceId: {invoiceId}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default async function PaymentPage({ params, searchParams }: PageProps) {
  const p = await params;
  const sp = await searchParams;

  const invoiceIdFromPath = String(p?.invoiceId ?? "").trim();
  const invoiceIdFromQuery = normalizeParam(sp.invoiceId).trim();

  const finalInvoiceId = invoiceIdFromPath || invoiceIdFromQuery;

  if (!finalInvoiceId) {
    return <NotFoundUI />;
  }

  // ✅ SSR fetch via our Next API
  const snap = await fetchInvoiceSnapshot(finalInvoiceId);

  if (!snap) {
    return <NotFoundUI invoiceId={finalInvoiceId} />;
  }

  // Map snapshot -> InvoiceData for client UI (do not write nulls)
  const initialInvoice = {
    invoiceId: snap.invoiceId ?? finalInvoiceId,
    status: snap.status ?? "waiting",

    ...(snap.createdAt ? { createdAt: snap.createdAt } : {}),
    ...(snap.expiresAt ? { expiresAt: snap.expiresAt } : {}),

    ...(typeof snap.fiatAmount === "number"
      ? { fiatAmount: snap.fiatAmount }
      : {}),
    ...(snap.fiatCurrency ? { fiatCurrency: snap.fiatCurrency } : {}),

    ...(typeof snap.cryptoAmount === "number"
      ? { cryptoAmount: snap.cryptoAmount }
      : {}),
    ...(snap.cryptoCurrency ? { cryptoCurrency: snap.cryptoCurrency } : {}),

    ...(snap.network ? { network: snap.network } : {}),

    ...(typeof snap.grossAmount === "number"
      ? { grossAmount: snap.grossAmount }
      : {}),
    ...(typeof snap.feeAmount === "number"
      ? { feeAmount: snap.feeAmount }
      : {}),
    ...(typeof snap.netAmount === "number"
      ? { netAmount: snap.netAmount }
      : {}),
    ...(typeof snap.feeBps === "number" ? { feeBps: snap.feeBps } : {}),
    ...(snap.feePayer ? { feePayer: snap.feePayer } : {}),

    ...(typeof snap.fxRate === "number" ? { fxRate: snap.fxRate } : {}),
    ...(snap.fxPair ? { fxPair: snap.fxPair } : {}),

    txStatus: (snap.txStatus ?? "pending") as any,
    ...(snap.txHash ? { txHash: snap.txHash } : {}),
    ...(snap.walletAddress ? { walletAddress: snap.walletAddress } : {}),
    ...(typeof snap.confirmations === "number"
      ? { confirmations: snap.confirmations }
      : {}),
    ...(typeof snap.requiredConfirmations === "number"
      ? { requiredConfirmations: snap.requiredConfirmations }
      : {}),

    ...(snap.detectedAt ? { detectedAt: snap.detectedAt } : {}),
    ...(snap.confirmedAt ? { confirmedAt: snap.confirmedAt } : {}),

    ...(snap.amlStatus ? { amlStatus: snap.amlStatus } : {}),
    ...(typeof snap.riskScore === "number"
      ? { riskScore: snap.riskScore }
      : {}),
    ...(snap.assetStatus ? { assetStatus: snap.assetStatus } : {}),
    ...(typeof snap.assetRiskScore === "number"
      ? { assetRiskScore: snap.assetRiskScore }
      : {}),

    ...(snap.decisionStatus ? { decisionStatus: snap.decisionStatus } : {}),
    ...(snap.decisionReasonCode
      ? { decisionReasonCode: snap.decisionReasonCode }
      : {}),
    ...(snap.decisionReasonText
      ? { decisionReasonText: snap.decisionReasonText }
      : {}),
    ...(snap.decidedAt ? { decidedAt: snap.decidedAt } : {}),
    ...(snap.decidedBy ? { decidedBy: snap.decidedBy } : {}),
  } as InvoiceData;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 lg:py-12">
        <CryptoPayPaymentClient initialInvoice={initialInvoice} />
      </div>
    </main>
  );
}
