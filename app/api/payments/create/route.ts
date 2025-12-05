// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

// ВРЕМЕННЫЙ стабильный вариант: без реального psp-core,
// всегда ведём клиента на нашу hosted-страницу /open/pay/[invoiceId]
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const amount = Number(body.amount ?? body.fiatAmount ?? 0);
    const fiatCurrency = (body.fiatCurrency as string) ?? "EUR";
    const cryptoCurrency = (body.cryptoCurrency as string) ?? "USDT";

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid amount" },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;

    // Генерируем локальный invoiceId
    const invoiceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    // ❗ ВСЕГДА ведём на наш домен, НЕ на Render / бэк
    const paymentUrl = `${origin}/open/pay/${invoiceId}?amount=${amount}&fiat=${fiatCurrency}&crypto=${cryptoCurrency}`;

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        paymentUrl,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[create] Unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
