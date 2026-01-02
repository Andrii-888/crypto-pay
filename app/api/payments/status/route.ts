// app/api/payments/status/route.ts
import { NextResponse } from "next/server";

const BUILD_STAMP = "status-route-v4-2026-01-02__S1";

const PSP_API_URL = (process.env.PSP_API_URL ?? "").replace(/\/+$/, "");
const PSP_API_KEY = (process.env.PSP_API_KEY ?? "").trim();
const PSP_MERCHANT_ID = (process.env.PSP_MERCHANT_ID ?? "").trim();

// set to "1" to enable verbose logs locally
const STATUS_DEBUG = (process.env.STATUS_DEBUG ?? "").trim() === "1";

type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

type Fees = {
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: string | null;
};

type OkResponse = {
  ok: true;

  // debug/meta
  buildStamp?: string;

  // required
  invoiceId: string;
  status: InvoiceStatus;

  // invoice core
  createdAt?: string | null;
  expiresAt?: string | null;
  paymentUrl?: string | null;
  merchantId?: string | null;

  // amounts
  fiatAmount?: number | null;
  fiatCurrency?: string | null;
  cryptoAmount?: number | null;
  cryptoCurrency?: string | null;

  // fees/fx (flattened for UI convenience)
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: string | null;
  fxRate?: number | null;
  fxPair?: string | null;

  // network + tx
  network?: string | null;
  txStatus?: string | null;
  txHash?: string | null;
  walletAddress?: string | null;
  confirmations?: number | null;
  requiredConfirmations?: number | null;
  detectedAt?: string | null;
  confirmedAt?: string | null;

  // aml/decision
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

type ErrResponse = {
  ok: false;
  error: string;
  details?: string;
  pspApiUrl?: string;
  invoiceId?: string;
  buildStamp?: string;
};

type JsonObject = Record<string, unknown>;

function isObject(v: unknown): v is JsonObject {
  return !!v && typeof v === "object";
}

function asObject(v: unknown): JsonObject {
  return isObject(v) ? v : {};
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeInvoiceStatus(raw: unknown): InvoiceStatus {
  const s = String(raw ?? "waiting")
    .trim()
    .toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "expired") return "expired";
  if (s === "rejected") return "rejected";
  return "waiting";
}

function pickFees(raw: unknown): Fees {
  // PSP may return either:
  // - flat: grossAmount/feeAmount/netAmount/feeBps/feePayer
  // - nested: fees: { grossAmount, ... }
  const o = asObject(raw);

  const feesObj = asObject(o.fees);
  const grossAmount =
    numOrNull(feesObj.grossAmount) ?? numOrNull(o.grossAmount);
  const feeAmount = numOrNull(feesObj.feeAmount) ?? numOrNull(o.feeAmount);
  const netAmount = numOrNull(feesObj.netAmount) ?? numOrNull(o.netAmount);
  const feeBps = numOrNull(feesObj.feeBps) ?? numOrNull(o.feeBps);
  const feePayer = strOrNull(feesObj.feePayer) ?? strOrNull(o.feePayer);

  return { grossAmount, feeAmount, netAmount, feeBps, feePayer };
}

async function safeReadBody(res: Response): Promise<string | undefined> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const json = (await res.json().catch(() => null)) as unknown;
    return json ? JSON.stringify(json) : undefined;
  }
  const text = await res.text().catch(() => "");
  return text ? text.slice(0, 800) : undefined;
}

function envGuard(): ErrResponse | null {
  if (!PSP_API_URL) {
    return {
      ok: false,
      error: "PSP_API_URL is empty",
      details: "Set PSP_API_URL in .env.local and restart",
      buildStamp: BUILD_STAMP,
    };
  }
  if (!PSP_API_KEY) {
    return {
      ok: false,
      error: "PSP_API_KEY is empty",
      details: "Set PSP_API_KEY in .env.local and restart",
      buildStamp: BUILD_STAMP,
    };
  }
  if (!PSP_MERCHANT_ID) {
    return {
      ok: false,
      error: "PSP_MERCHANT_ID is empty",
      details: "Set PSP_MERCHANT_ID in .env.local and restart",
      buildStamp: BUILD_STAMP,
    };
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = (searchParams.get("invoiceId") ?? "").trim();

  if (!invoiceId) {
    const res: ErrResponse = {
      ok: false,
      error: "Missing invoiceId",
      buildStamp: BUILD_STAMP,
    };
    return NextResponse.json(res, { status: 400 });
  }

  const envErr = envGuard();
  if (envErr) return NextResponse.json(envErr, { status: 500 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const url = `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`;

    if (STATUS_DEBUG) {
      console.log("[status] PSP_API_URL =", PSP_API_URL);
      console.log("[status] PSP_MERCHANT_ID =", PSP_MERCHANT_ID);
      console.log("[status] PSP_API_KEY_len =", PSP_API_KEY.length);
      console.log("[status] invoiceId =", invoiceId);
      console.log("[status] BUILD_STAMP =", BUILD_STAMP);
    }

    const pspRes = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "x-api-key": PSP_API_KEY,
        "x-merchant-id": PSP_MERCHANT_ID,
        Accept: "application/json",
      },
    });

    if (!pspRes.ok) {
      const details = await safeReadBody(pspRes);
      const res: ErrResponse = {
        ok: false,
        error: `PSP responded ${pspRes.status}`,
        details,
        pspApiUrl: PSP_API_URL,
        invoiceId,
        buildStamp: BUILD_STAMP,
      };
      return NextResponse.json(res, { status: 502 });
    }

    const raw = (await pspRes.json().catch(() => ({}))) as unknown;
    const data = asObject(raw);
    const fees = pickFees(data);

    const res: OkResponse = {
      ok: true,
      buildStamp: BUILD_STAMP,

      invoiceId: String(data.id ?? data.invoiceId ?? invoiceId),
      status: normalizeInvoiceStatus(data.status),

      createdAt: strOrNull(data.createdAt),
      expiresAt: strOrNull(data.expiresAt),
      paymentUrl: strOrNull(data.paymentUrl),
      merchantId: strOrNull(data.merchantId),

      fiatAmount: numOrNull(data.fiatAmount),
      fiatCurrency: strOrNull(data.fiatCurrency),
      cryptoAmount: numOrNull(data.cryptoAmount),
      cryptoCurrency: strOrNull(data.cryptoCurrency),

      grossAmount: fees.grossAmount ?? null,
      feeAmount: fees.feeAmount ?? null,
      netAmount: fees.netAmount ?? null,
      feeBps: fees.feeBps ?? null,
      feePayer: fees.feePayer ?? null,

      fxRate: numOrNull(data.fxRate),
      fxPair: strOrNull(data.fxPair),

      network: strOrNull(data.network),
      txStatus: strOrNull(data.txStatus),
      txHash: strOrNull(data.txHash),
      walletAddress: strOrNull(data.walletAddress),
      confirmations: numOrNull(data.confirmations),
      requiredConfirmations: numOrNull(data.requiredConfirmations),
      detectedAt: strOrNull(data.detectedAt),
      confirmedAt: strOrNull(data.confirmedAt),

      amlStatus: strOrNull(data.amlStatus),
      riskScore: numOrNull(data.riskScore),
      assetStatus: strOrNull(data.assetStatus),
      assetRiskScore: numOrNull(data.assetRiskScore),

      decisionStatus: strOrNull(data.decisionStatus),
      decisionReasonCode: strOrNull(data.decisionReasonCode),
      decisionReasonText: strOrNull(data.decisionReasonText),
      decidedAt: strOrNull(data.decidedAt),
      decidedBy: strOrNull(data.decidedBy),
    };

    const out = NextResponse.json(res, { status: 200 });
    out.headers.set("Cache-Control", "no-store");
    return out;
  } catch (e: unknown) {
    const isTimeout = e instanceof Error && e.name === "AbortError";
    const res: ErrResponse = {
      ok: false,
      error: isTimeout ? "PSP timeout" : "Fetch failed",
      details: e instanceof Error ? e.message : "Unknown error",
      pspApiUrl: PSP_API_URL,
      invoiceId,
      buildStamp: BUILD_STAMP,
    };
    return NextResponse.json(res, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
