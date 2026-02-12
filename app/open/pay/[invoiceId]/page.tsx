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

type TxStatus = "pending" | "detected" | "confirmed";

type StatusApiOk = {
  ok: true;
  invoice: unknown;
};

function normalizeParam(v: string | string[] | undefined) {
  if (!v) return "";
  return Array.isArray(v) ? String(v[0] ?? "") : String(v);
}

function isStatusApiOk(x: unknown): x is StatusApiOk {
  if (!x || typeof x !== "object") return false;
  const o = x as { ok?: unknown; invoice?: unknown };
  return o.ok === true && o.invoice != null;
}

function normalizeTxStatus(v?: unknown): TxStatus {
  const s = String(v ?? "pending")
    .trim()
    .toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "detected") return "detected";
  return "pending";
}

function strOrUndef(v?: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function numOrUndef(v?: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

async function fetchInvoiceSnapshot(
  invoiceId: string
): Promise<unknown | null> {
  if (!invoiceId) return null;

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";

  // IMPORTANT: fallback should match local dev port
  const baseUrl = host ? `${proto}://${host}` : "http://localhost:3002";

  const url = `${baseUrl}/api/payments/status?invoiceId=${encodeURIComponent(
    invoiceId
  )}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json().catch(() => null)) as unknown;
  if (!isStatusApiOk(data)) return null;

  return data.invoice ?? null;
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

  const raw = await fetchInvoiceSnapshot(finalInvoiceId);
  if (!raw) return <NotFoundUI invoiceId={finalInvoiceId} />;

  const inv = asObject(raw);
  const pay = asObject(inv.pay);

  const initialInvoice: InvoiceData = {
    invoiceId: (strOrUndef(inv.id) ??
      finalInvoiceId) as InvoiceData["invoiceId"],
    status: (strOrUndef(inv.status) ?? "waiting") as InvoiceData["status"],
    txStatus: normalizeTxStatus(inv.txStatus) as InvoiceData["txStatus"],

    paymentUrl: (strOrUndef(inv.paymentUrl) ?? "") as InvoiceData["paymentUrl"],
    merchantId: (strOrUndef(inv.merchantId) ?? "") as InvoiceData["merchantId"],

    createdAt: (strOrUndef(inv.createdAt) ??
      undefined) as InvoiceData["createdAt"],
    expiresAt: (strOrUndef(inv.expiresAt) ??
      undefined) as InvoiceData["expiresAt"],

    fiatAmount: (numOrUndef(inv.fiatAmount) ??
      undefined) as InvoiceData["fiatAmount"],
    fiatCurrency: (strOrUndef(inv.fiatCurrency) ??
      undefined) as InvoiceData["fiatCurrency"],

    // amount to pay comes from provider payload (string) — UI already handles string/number safely
    cryptoAmount: (strOrUndef(pay.amount) ??
      numOrUndef(inv.cryptoAmount)) as unknown as InvoiceData["cryptoAmount"],
    cryptoCurrency: (strOrUndef(inv.cryptoCurrency) ??
      strOrUndef(pay.currency) ??
      undefined) as InvoiceData["cryptoCurrency"],

    network: (strOrUndef(inv.network) ??
      strOrUndef(pay.network) ??
      undefined) as InvoiceData["network"],

    grossAmount: (numOrUndef(inv.grossAmount) ??
      undefined) as InvoiceData["grossAmount"],
    feeAmount: (numOrUndef(inv.feeAmount) ??
      undefined) as InvoiceData["feeAmount"],
    netAmount: (numOrUndef(inv.netAmount) ??
      undefined) as InvoiceData["netAmount"],
    feeBps: (numOrUndef(inv.feeBps) ?? undefined) as InvoiceData["feeBps"],
    feePayer: (strOrUndef(inv.feePayer) ??
      undefined) as InvoiceData["feePayer"],

    fxRate: (numOrUndef(inv.fxRate) ?? undefined) as InvoiceData["fxRate"],
    fxPair: (strOrUndef(inv.fxPair) ?? undefined) as InvoiceData["fxPair"],

    txHash: (strOrUndef(inv.txHash) ?? undefined) as InvoiceData["txHash"],

    walletAddress: (strOrUndef(pay.address) ??
      strOrUndef(inv.walletAddress) ??
      undefined) as InvoiceData["walletAddress"],

    confirmations: (numOrUndef(inv.confirmations) ??
      undefined) as InvoiceData["confirmations"],
    requiredConfirmations: (numOrUndef(inv.requiredConfirmations) ??
      undefined) as InvoiceData["requiredConfirmations"],

    detectedAt: (strOrUndef(inv.detectedAt) ??
      undefined) as InvoiceData["detectedAt"],
    confirmedAt: (strOrUndef(inv.confirmedAt) ??
      undefined) as InvoiceData["confirmedAt"],

    amlStatus: (strOrUndef(inv.amlStatus) ??
      undefined) as InvoiceData["amlStatus"],
    riskScore: (numOrUndef(inv.riskScore) ??
      undefined) as InvoiceData["riskScore"],
    assetStatus: (strOrUndef(inv.assetStatus) ??
      undefined) as InvoiceData["assetStatus"],
    assetRiskScore: (numOrUndef(inv.assetRiskScore) ??
      undefined) as InvoiceData["assetRiskScore"],

    decisionStatus: (strOrUndef(inv.decisionStatus) ??
      undefined) as InvoiceData["decisionStatus"],
    decisionReasonCode: (strOrUndef(inv.decisionReasonCode) ??
      undefined) as InvoiceData["decisionReasonCode"],
    decisionReasonText: (strOrUndef(inv.decisionReasonText) ??
      undefined) as InvoiceData["decisionReasonText"],
    decidedAt: (strOrUndef(inv.decidedAt) ??
      undefined) as InvoiceData["decidedAt"],
    decidedBy: (strOrUndef(inv.decidedBy) ??
      undefined) as InvoiceData["decidedBy"],
  };

  return <CryptoPayPaymentClient initialInvoice={initialInvoice} />;
}
