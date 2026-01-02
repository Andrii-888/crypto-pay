// success.logic.ts

import type {
  Fees,
  InvoiceStatus,
  InvoiceView,
  TxStatus,
} from "./success.types";

type JsonObject = Record<string, unknown>;

function asObject(v: unknown): JsonObject {
  return v && typeof v === "object" ? (v as JsonObject) : {};
}

function strOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length ? s : null;
}

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function isFeesObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object";
}

function readFeeField(o: JsonObject, key: keyof Fees): number | string | null {
  // Prefer nested fees if present
  const fees = o.fees;
  if (isFeesObject(fees) && key in fees) {
    const val = (fees as Record<string, unknown>)[key];
    // feePayer is string-ish, others are numbers
    return key === "feePayer" ? strOrNull(val) : numOrNull(val);
  }

  // Fallback to flattened fields
  const flat = o[key as string];
  return key === "feePayer" ? strOrNull(flat) : numOrNull(flat);
}

export function pickInvoiceId(data: unknown): string | null {
  const o = asObject(data);
  return strOrNull(o.invoiceId) ?? strOrNull(o.id);
}

export function pickStatus(data: unknown): InvoiceStatus | null {
  const o = asObject(data);
  const raw = strOrNull(o.status);
  if (!raw) return null;

  const s = raw.toLowerCase();
  if (
    s === "waiting" ||
    s === "confirmed" ||
    s === "expired" ||
    s === "rejected"
  ) {
    return s;
  }
  return null;
}

export function normalizeInvoiceStatus(v: unknown): InvoiceStatus {
  const raw = strOrNull(v) ?? "waiting";
  const s = raw.toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "expired") return "expired";
  if (s === "rejected") return "rejected";
  return "waiting";
}

export function normalizeTxStatus(v: unknown): TxStatus {
  const raw = strOrNull(v) ?? "pending";
  const s = raw.toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "detected") return "detected";
  return "pending";
}

export function normalizeInvoiceView(data: unknown): InvoiceView {
  const o = asObject(data);

  const grossAmount = numOrNull(readFeeField(o, "grossAmount"));
  const feeAmount = numOrNull(readFeeField(o, "feeAmount"));
  const netAmount = numOrNull(readFeeField(o, "netAmount"));
  const feeBps = numOrNull(readFeeField(o, "feeBps"));
  const feePayer = strOrNull(readFeeField(o, "feePayer"));

  const fees: Fees | null =
    grossAmount !== null ||
    feeAmount !== null ||
    netAmount !== null ||
    feeBps !== null ||
    feePayer !== null
      ? { grossAmount, feeAmount, netAmount, feeBps, feePayer }
      : null;

  return {
    invoiceId: strOrNull(o.invoiceId) ?? strOrNull(o.id) ?? "",
    status: normalizeInvoiceStatus(o.status),

    createdAt: strOrNull(o.createdAt),
    expiresAt: strOrNull(o.expiresAt),

    fiatAmount: numOrNull(o.fiatAmount),
    fiatCurrency: strOrNull(o.fiatCurrency),

    cryptoAmount: numOrNull(o.cryptoAmount),
    cryptoCurrency: strOrNull(o.cryptoCurrency),

    network: strOrNull(o.network),

    merchantId: strOrNull(o.merchantId),
    paymentUrl: strOrNull(o.paymentUrl),

    // keep both: nested + flattened (for UI compatibility)
    fees,
    grossAmount,
    feeAmount,
    netAmount,
    feeBps,
    feePayer,

    fxRate: numOrNull(o.fxRate),
    fxPair: strOrNull(o.fxPair),

    txStatus: normalizeTxStatus(o.txStatus),
    txHash: strOrNull(o.txHash),
    walletAddress: strOrNull(o.walletAddress),
    confirmations: numOrNull(o.confirmations),
    requiredConfirmations: numOrNull(o.requiredConfirmations),

    detectedAt: strOrNull(o.detectedAt),
    confirmedAt: strOrNull(o.confirmedAt),

    amlStatus: strOrNull(o.amlStatus),
    riskScore: numOrNull(o.riskScore),
    assetStatus: strOrNull(o.assetStatus),
    assetRiskScore: numOrNull(o.assetRiskScore),

    decisionStatus: strOrNull(o.decisionStatus),
    decisionReasonCode: strOrNull(o.decisionReasonCode),
    decisionReasonText: strOrNull(o.decisionReasonText),
    decidedAt: strOrNull(o.decidedAt),
    decidedBy: strOrNull(o.decidedBy),
  };
}
