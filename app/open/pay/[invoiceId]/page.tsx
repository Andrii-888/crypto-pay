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

type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";
type TxStatus = "pending" | "detected" | "confirmed";

type StatusApiOk = {
  ok: true;
  invoiceId: string;
  status: InvoiceStatus;

  createdAt?: string | null;
  expiresAt?: string | null;
  paymentUrl?: string | null;
  merchantId?: string | null;

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
};

function normalizeParam(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}

function isStatusApiOk(x: unknown): x is StatusApiOk {
  if (!x || typeof x !== "object") return false;
  return (x as { ok?: unknown }).ok === true;
}

function normalizeTxStatus(v?: string | null): TxStatus {
  const s = String(v ?? "pending")
    .trim()
    .toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "detected") return "detected";
  return "pending";
}

function strOrUndef(v?: string | null): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function numOrUndef(v?: number | null): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

async function fetchInvoiceSnapshot(
  invoiceId: string
): Promise<StatusApiOk | null> {
  if (!invoiceId) return null;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";

  const baseUrl = host ? `${proto}://${host}` : "http://localhost:3000";

  const url = `${baseUrl}/api/payments/status?invoiceId=${encodeURIComponent(
    invoiceId
  )}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as unknown;
  if (!isStatusApiOk(data)) return null;

  return data;
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

  if (!finalInvoiceId) return <NotFoundUI />;

  const snap = await fetchInvoiceSnapshot(finalInvoiceId);
  if (!snap) return <NotFoundUI invoiceId={finalInvoiceId} />;

  // Собираем InvoiceData аккуратно:
  // - ключи со строгими типами НЕ получают null
  // - если значения нет -> просто не добавляем поле (undefined)
  const initialInvoice: InvoiceData = {
    invoiceId: snap.invoiceId ?? finalInvoiceId,
    status: snap.status ?? "waiting",
    txStatus: normalizeTxStatus(snap.txStatus) as InvoiceData["txStatus"],

    // если в InvoiceData эти поля обязательные — оставляем безопасные дефолты:
    paymentUrl: (strOrUndef(snap.paymentUrl) ??
      "") as InvoiceData["paymentUrl"],
    merchantId: (strOrUndef(snap.merchantId) ??
      "") as InvoiceData["merchantId"],

    createdAt: (strOrUndef(snap.createdAt) ??
      undefined) as InvoiceData["createdAt"],
    expiresAt: (strOrUndef(snap.expiresAt) ??
      undefined) as InvoiceData["expiresAt"],

    fiatAmount: (numOrUndef(snap.fiatAmount) ??
      undefined) as InvoiceData["fiatAmount"],
    fiatCurrency: (strOrUndef(snap.fiatCurrency) ??
      undefined) as InvoiceData["fiatCurrency"],

    cryptoAmount: (numOrUndef(snap.cryptoAmount) ??
      undefined) as InvoiceData["cryptoAmount"],
    cryptoCurrency: (strOrUndef(snap.cryptoCurrency) ??
      undefined) as InvoiceData["cryptoCurrency"],

    network: (strOrUndef(snap.network) ?? undefined) as InvoiceData["network"],

    grossAmount: (numOrUndef(snap.grossAmount) ??
      undefined) as InvoiceData["grossAmount"],
    feeAmount: (numOrUndef(snap.feeAmount) ??
      undefined) as InvoiceData["feeAmount"],
    netAmount: (numOrUndef(snap.netAmount) ??
      undefined) as InvoiceData["netAmount"],
    feeBps: (numOrUndef(snap.feeBps) ?? undefined) as InvoiceData["feeBps"],
    feePayer: (strOrUndef(snap.feePayer) ??
      undefined) as InvoiceData["feePayer"],

    fxRate: (numOrUndef(snap.fxRate) ?? undefined) as InvoiceData["fxRate"],
    fxPair: (strOrUndef(snap.fxPair) ?? undefined) as InvoiceData["fxPair"],

    txHash: (strOrUndef(snap.txHash) ?? undefined) as InvoiceData["txHash"],
    walletAddress: (strOrUndef(snap.walletAddress) ??
      undefined) as InvoiceData["walletAddress"],
    confirmations: (numOrUndef(snap.confirmations) ??
      undefined) as InvoiceData["confirmations"],
    requiredConfirmations: (numOrUndef(snap.requiredConfirmations) ??
      undefined) as InvoiceData["requiredConfirmations"],

    detectedAt: (strOrUndef(snap.detectedAt) ??
      undefined) as InvoiceData["detectedAt"],
    confirmedAt: (strOrUndef(snap.confirmedAt) ??
      undefined) as InvoiceData["confirmedAt"],

    // ⬇️ ВАЖНО: никаких ?? null
    amlStatus: (strOrUndef(snap.amlStatus) ??
      undefined) as InvoiceData["amlStatus"],
    riskScore: (numOrUndef(snap.riskScore) ??
      undefined) as InvoiceData["riskScore"],
    assetStatus: (strOrUndef(snap.assetStatus) ??
      undefined) as InvoiceData["assetStatus"],
    assetRiskScore: (numOrUndef(snap.assetRiskScore) ??
      undefined) as InvoiceData["assetRiskScore"],

    decisionStatus: (strOrUndef(snap.decisionStatus) ??
      undefined) as InvoiceData["decisionStatus"],
    decisionReasonCode: (strOrUndef(snap.decisionReasonCode) ??
      undefined) as InvoiceData["decisionReasonCode"],
    decisionReasonText: (strOrUndef(snap.decisionReasonText) ??
      undefined) as InvoiceData["decisionReasonText"],
    decidedAt: (strOrUndef(snap.decidedAt) ??
      undefined) as InvoiceData["decidedAt"],
    decidedBy: (strOrUndef(snap.decidedBy) ??
      undefined) as InvoiceData["decidedBy"],
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 lg:py-12">
        <CryptoPayPaymentClient initialInvoice={initialInvoice} />
      </div>
    </main>
  );
}
