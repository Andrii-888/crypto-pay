import { NextResponse } from "next/server";
import { saveInvoice, type InvoiceData } from "@/lib/invoiceStore";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const amount = Number(body?.amount ?? 0);
  const fiatCurrency = (body?.fiatCurrency as string) || "EUR";

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const invoiceId = `inv_${Date.now()}`;

  const cryptoCurrency = "USDT";
  const cryptoAmount = amount;

  const invoice: InvoiceData = {
    invoiceId,
    fiatAmount: amount,
    fiatCurrency,
    cryptoCurrency,
    cryptoAmount,
    status: "waiting",
    expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
    paymentUrl: `/open/pay/${invoiceId}`,
  };

  saveInvoice(invoice);

  return NextResponse.json(invoice, { status: 201 });
}
