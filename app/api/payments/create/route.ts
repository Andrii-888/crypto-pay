// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const amount = Number(body.amount ?? 0);
    const fiatCurrency = (body.fiatCurrency as string) || "EUR";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Мокаем расчёт инвойса
    const invoiceId = `inv_${Date.now()}`;
    const cryptoCurrency = "USDT";

    // Псевдо-курс: 1 USDT = 1 EUR (для демо)
    const cryptoAmount = amount;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 25 * 60 * 1000).toISOString(); // +25 минут

    return NextResponse.json(
      {
        invoiceId,
        fiatAmount: amount,
        fiatCurrency,
        cryptoCurrency,
        cryptoAmount,
        status: "waiting", // waiting / pending / confirmed / expired
        expiresAt,
        paymentUrl: `/open/pay/${invoiceId}`, // потом сделаем страницу
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
