// src/lib/invoiceStore.ts

export type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

export type InvoiceData = {
  invoiceId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  status: InvoiceStatus;
  expiresAt: string;
  paymentUrl: string;
};
