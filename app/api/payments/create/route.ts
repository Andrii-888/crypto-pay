// app/api/payments/create/route.ts
import { NextResponse } from "next/server";
import { type InvoiceData, saveInvoice } from "@/lib/invoiceStore";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    // Сумма в фиате
    const fiatAmountRaw = Number(body?.amount);
    const fiatCurrency: string = body?.fiatCurrency || "EUR";

    if (!Number.isFinite(fiatAmountRaw) || fiatAmountRaw <= 0) {
      return NextResponse.json(
        { error: "Invalid fiatAmount" },
        { status: 400 }
      );
    }

    const fiatAmount = Math.round(fiatAmountRaw * 100) / 100;

    // В демо считаем 1:1, USDT
    const cryptoCurrency: InvoiceData["cryptoCurrency"] = "USDT";
    const cryptoAmount = fiatAmount;

    const invoiceId = `inv_${Date.now()}`;

    const mockInvoice: InvoiceData = {
      invoiceId,
      fiatAmount,
      fiatCurrency,
      cryptoCurrency,
      cryptoAmount,
      status: "waiting",
      expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      paymentUrl: `/open/pay/${invoiceId}`,
    };

    // Сохраняем инвойс в in-memory хранилище
    saveInvoice(mockInvoice);

    return NextResponse.json(mockInvoice, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
