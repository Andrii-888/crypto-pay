// success.types.ts

export type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

export type TxStatus = "pending" | "detected" | "confirmed" | (string & {});
export type DecisionStatus = "none" | "approved" | "rejected" | (string & {});

export type Fees = {
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: string | null;
};

export type StatusApiOk = {
  ok: true;
  invoiceId: string;
  status: InvoiceStatus;

  createdAt?: string | null;
  expiresAt?: string | null;

  fiatAmount?: number | null;
  fiatCurrency?: string | null;

  cryptoAmount?: number | null;
  cryptoCurrency?: string | null;

  network?: string | null;

  /**
   * ✅ Some backends return fees nested (fees.grossAmount...)
   */
  fees?: Fees | null;

  /**
   * ✅ Some backends return fees flattened (grossAmount, feeAmount...)
   * Keep these too to match real PSP response.
   */
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: string | null;

  fxRate?: number | null;
  fxPair?: string | null;

  txStatus?: TxStatus | null;
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

  decisionStatus?: DecisionStatus | null;
  decisionReasonCode?: string | null;
  decisionReasonText?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;

  merchantId?: string | null;
  paymentUrl?: string | null;
};

export type StatusApiErr = {
  ok: false;
  error?: string;
  details?: string;
};

export type StatusApiResponse = StatusApiOk | StatusApiErr;

/**
 * What the Success UI consumes (superset of what UI might render)
 */
export type InvoiceView = {
  invoiceId: string;
  status: InvoiceStatus;

  createdAt?: string | null;
  expiresAt?: string | null;

  fiatAmount?: number | null;
  fiatCurrency?: string | null;

  cryptoAmount?: number | null;
  cryptoCurrency?: string | null;

  network?: string | null;

  merchantId?: string | null;
  paymentUrl?: string | null;

  /**
   * Keep nested fees for UI/debug
   */
  fees?: Fees | null;

  /**
   * Also keep flattened fees because some UI blocks / merchant screen might use them
   */
  grossAmount?: number | null;
  feeAmount?: number | null;
  netAmount?: number | null;
  feeBps?: number | null;
  feePayer?: string | null;

  fxRate?: number | null;
  fxPair?: string | null;

  txStatus?: TxStatus | null;
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

  decisionStatus?: DecisionStatus | null;
  decisionReasonCode?: string | null;
  decisionReasonText?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
};
