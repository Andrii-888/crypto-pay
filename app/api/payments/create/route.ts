// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Хендлер, который вызывает магазин (frontend), когда создаёт платёж
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

    // 1️⃣ Пытаемся создать инвойс на backend psp-core, если он сконфигурирован
    if (PSP_API_URL) {
      try {
        const pspRes = await fetch(`${PSP_API_URL}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fiatAmount: amount,
            fiatCurrency,
            cryptoCurrency,
          }),
        });

        if (pspRes.ok) {
          const data = await pspRes.json();

          const invoiceId = (data.id || data.invoiceId) as string;
          const redirectUrl =
            (data.paymentUrl as string) ??
            `${origin}/open/pay/${invoiceId}?amount=${amount}&fiat=${fiatCurrency}&crypto=${cryptoCurrency}`;

          return NextResponse.json(
            {
              ok: true,
              invoiceId,
              redirectUrl,
            },
            { status: 200 }
          );
        }

        // Если backend ответил не 2xx — просто падаем в fallback
        console.error(
          "[create] PSP-core returned non-OK:",
          pspRes.status,
          await pspRes.text()
        );
      } catch (err) {
        console.error("[create] Error calling PSP-core:", err);
        // идём в fallback ниже
      }
    }

    // 2️⃣ Fallback: создаём "инвойс" локально, без psp-core
    const invoiceId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

    const redirectUrl = `${origin}/open/pay/${invoiceId}?amount=${amount}&fiat=${fiatCurrency}&crypto=${cryptoCurrency}`;

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        redirectUrl,
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
