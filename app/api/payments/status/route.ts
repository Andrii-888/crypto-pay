// app/api/payments/status/route.ts
import { NextResponse } from "next/server";

const BUILD_STAMP = "status-route-v2-2025-12-25-__A1";

const PSP_API_URL = (process.env.PSP_API_URL ?? "").replace(/\/+$/, "");
const PSP_API_KEY = (process.env.PSP_API_KEY ?? "").trim();

type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

type OkResponse = {
  ok: true;

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

  // fees/fx
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
};

async function safeReadBody(res: Response): Promise<string | undefined> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const json = await res.json().catch(() => null);
    return json ? JSON.stringify(json) : undefined;
  }
  const text = await res.text().catch(() => "");
  return text ? text.slice(0, 800) : undefined;
}

function normalizeInvoiceStatus(raw: any): InvoiceStatus {
  const s = String(raw ?? "waiting").toLowerCase();
  if (
    s === "confirmed" ||
    s === "expired" ||
    s === "rejected" ||
    s === "waiting"
  ) {
    return s;
  }
  return "waiting";
}

function numOrNull(v: any): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function strOrNull(v: any): string | null {
  return typeof v === "string" && v.length ? v : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");

  if (!invoiceId) {
    const res: ErrResponse = { ok: false, error: "Missing invoiceId" };
    return NextResponse.json(res, { status: 400 });
  }

  if (!PSP_API_URL) {
    const res: ErrResponse = {
      ok: false,
      error: "PSP_API_URL is empty",
      details: "Set PSP_API_URL in .env.local and restart",
    };
    return NextResponse.json(res, { status: 500 });
  }

  if (!PSP_API_KEY) {
    const res: ErrResponse = {
      ok: false,
      error: "PSP_API_KEY is empty",
      details: "Set PSP_API_KEY in .env.local and restart",
    };
    return NextResponse.json(res, { status: 500 });
  }

  try {
    const url = `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`;

    const pspRes = await fetch(url, {
      cache: "no-store",
      headers: {
        "x-api-key": PSP_API_KEY,
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
      };
      return NextResponse.json(res, { status: 502 });
    }

    const data = (await pspRes.json().catch(() => ({}))) as any;

    const res: OkResponse = {
      ok: true,

      // @ts-expect-error debug stamp
      buildStamp: BUILD_STAMP,

      // required
      invoiceId: String(data.id ?? data.invoiceId ?? invoiceId),
      status: normalizeInvoiceStatus(data.status),

      // core
      createdAt: strOrNull(data.createdAt),
      expiresAt: strOrNull(data.expiresAt),
      paymentUrl: strOrNull(data.paymentUrl),
      merchantId: strOrNull(data.merchantId),

      // amounts
      fiatAmount: numOrNull(data.fiatAmount),
      fiatCurrency: strOrNull(data.fiatCurrency),
      cryptoAmount: numOrNull(data.cryptoAmount),
      cryptoCurrency: strOrNull(data.cryptoCurrency),

      // fees/fx
      grossAmount: numOrNull(data.grossAmount),
      feeAmount: numOrNull(data.feeAmount),
      netAmount: numOrNull(data.netAmount),
      feeBps: numOrNull(data.feeBps),
      feePayer: strOrNull(data.feePayer),
      fxRate: numOrNull(data.fxRate),
      fxPair: strOrNull(data.fxPair),

      // network + tx
      network: strOrNull(data.network),
      txStatus: strOrNull(data.txStatus),
      txHash: strOrNull(data.txHash),
      walletAddress: strOrNull(data.walletAddress),
      confirmations: numOrNull(data.confirmations),
      requiredConfirmations: numOrNull(data.requiredConfirmations),
      detectedAt: strOrNull(data.detectedAt),
      confirmedAt: strOrNull(data.confirmedAt),

      // aml/decision
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

    return NextResponse.json(res, { status: 200 });
  } catch (e) {
    const res: ErrResponse = {
      ok: false,
      error: "Fetch failed",
      details: e instanceof Error ? e.message : "Unknown error",
      pspApiUrl: PSP_API_URL,
    };
    return NextResponse.json(res, { status: 502 });
  }
}
