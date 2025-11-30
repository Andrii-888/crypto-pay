// src/lib/invoiceStore.ts

export type InvoiceStatus = "waiting" | "pending" | "confirmed" | "expired";

export type InvoiceData = {
  invoiceId: string;

  // Fiat side
  fiatAmount: number;
  fiatCurrency: string;

  // Crypto side
  cryptoCurrency: "USDT" | "USDC" | string;
  cryptoAmount: number;

  // State
  status: InvoiceStatus;
  expiresAt: string;

  // URL, куда мы редиректим клиента для оплаты
  paymentUrl: string;
};

// Простое in-memory хранилище для демо.
// На проде это будет БД или внешний провайдер.
const invoiceStore = new Map<string, InvoiceData>();

export function saveInvoice(invoice: InvoiceData): void {
  invoiceStore.set(invoice.invoiceId, invoice);
}

export function getInvoice(invoiceId: string): InvoiceData | undefined {
  return invoiceStore.get(invoiceId);
}
