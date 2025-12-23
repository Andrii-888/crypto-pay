// src/lib/invoiceStore.ts

export type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

// txStatus живёт отдельно от invoice.status (у тебя txStatus может стать "detected",
// пока invoice.status остаётся "waiting")
export type TxStatus = "pending" | "detected" | "confirmed";

export type AmlStatus = "clean" | "dirty" | "unknown";
export type AssetStatus = "clean" | "dirty" | "unknown";

export type DecisionStatus = "none" | "approved" | "rejected";

export type FeePayer = "merchant" | "customer";

export type InvoiceData = {
  // core
  invoiceId: string;
  createdAt?: string | null;
  expiresAt: string;

  fiatAmount: number;
  fiatCurrency: string;

  cryptoAmount: number;
  cryptoCurrency: string;

  status: InvoiceStatus;
  paymentUrl: string;

  // money / fx (для дебага/презентации и будущих отчётов)
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: FeePayer | null;

  fxRate?: number | null;
  fxPair?: string | null;

  // chain / tx
  network?: string | null;

  txHash?: string | null;
  walletAddress?: string | null;

  txStatus?: TxStatus | null;
  confirmations?: number | null;
  requiredConfirmations?: number | null;

  detectedAt?: string | null;
  confirmedAt?: string | null;

  // aml / risk / decision
  riskScore?: number | null;
  amlStatus?: AmlStatus | null;

  assetRiskScore?: number | null;
  assetStatus?: AssetStatus | null;

  decisionStatus?: DecisionStatus | null;
  decisionReasonCode?: string | null;
  decisionReasonText?: string | null;

  decidedAt?: string | null;
  decidedBy?: string | null;

  merchantId?: string | null;
};
