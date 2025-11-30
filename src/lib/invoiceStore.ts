// src/lib/invoiceStore.ts

export type InvoiceData = {
  invoiceId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
  createdAt: number;
};

// Хранилище внутри globalThis (не сбрасывается при hot reload)
const g = globalThis as any;

if (!g.invoiceStore) {
  g.invoiceStore = new Map<string, InvoiceData>();
}

const store: Map<string, InvoiceData> = g.invoiceStore;

export function saveInvoice(invoice: InvoiceData) {
  store.set(invoice.invoiceId, invoice);
}

export function getInvoice(id: string) {
  return store.get(id);
}

export function listInvoices() {
  return [...store.values()];
}
