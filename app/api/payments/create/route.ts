// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

// ВРЕМЕННЫЙ stub: работаем без psp-core
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

    // Генерируем фейковый invoiceId
    const invoiceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    // URL нашей hosted-страницы оплаты
    const paymentUrl = `${origin}/open/pay/${invoiceId}?amount=${amount}&fiat=${fiatCurrency}&crypto=${cryptoCurrency}`;

    // ⚠️ ВАЖНО: вернуть именно paymentUrl, как ждёт фронт
    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        paymentUrl, // ← ключевое поле
        // можно оставить и alias, если хочешь:
        redirectUrl: paymentUrl,
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
