// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
const IS_PROD = process.env.NODE_ENV === "production";

// Генерация invoiceId на фронте (fallback)
function generateInvoiceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export async function POST(request: NextRequest) {
  try {
    let amount = 0;
    let fiatCurrency = "EUR";
    let cryptoCurrency = "USDT";

    // Аккуратно читаем тело (НЕ падаем, если тело пустое или сломано)
    try {
      const body = await request.json();
      amount = Number(body.amount ?? body.fiatAmount ?? 0) || 0;
      fiatCurrency = (body.fiatCurrency as string) || "EUR";
      cryptoCurrency = (body.cryptoCurrency as string) || "USDT";
    } catch {
      // игнорируем ошибку — используем дефолты
    }

    const origin = request.nextUrl.origin;

    // Пытаемся создать инвойс на PSP-core (только в проде)
    let invoiceId: string | null = null;

    if (IS_PROD && PSP_API_URL) {
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
          invoiceId = (data.id as string) || (data.invoiceId as string) || null;
        }
      } catch {
        // Бэк недоступен — fallback
      }
    }

    // Если бэк не дал id → генерируем локальный
    if (!invoiceId) {
      invoiceId = generateInvoiceId();
    }

    const paymentUrl = `${origin}/open/pay/${invoiceId}?amount=${amount}&fiat=${fiatCurrency}&crypto=${cryptoCurrency}`;

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        paymentUrl,
      },
      { status: 200 }
    );
  } catch {
    // Даже если что-то сломалось — не ломаем checkout
    const fallbackId = generateInvoiceId();

    return NextResponse.json(
      {
        ok: true,
        invoiceId: fallbackId,
        paymentUrl: `/open/pay/${fallbackId}`,
      },
      { status: 200 }
    );
  }
}
