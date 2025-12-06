// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

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

    // Аккуратно читаем тело (НЕ падаем, если пусто или битое)
    try {
      const body = await request.json();
      amount = Number(body.amount ?? body.fiatAmount ?? 0) || 0;
      fiatCurrency = (body.fiatCurrency as string) || "EUR";
      cryptoCurrency = (body.cryptoCurrency as string) || "USDT";
    } catch {
      // оставляем дефолты
    }

    const origin = request.nextUrl.origin;

    // Пробуем создать инвойс на PSP-core
    let invoiceIdFromBackend: string | null = null;
    let backendStatus: string | null = null;
    let backendError: string | null = null;

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

        backendStatus = `HTTP ${pspRes.status}`;

        if (pspRes.ok) {
          const data = await pspRes.json();
          invoiceIdFromBackend =
            (data.id as string) || (data.invoiceId as string) || null;
        } else {
          backendError = `PSP responded with status ${pspRes.status}`;
        }
      } catch (err) {
        backendError =
          err instanceof Error ? err.message : "Unknown fetch error";
      }
    } else {
      backendError = "PSP_API_URL is empty";
    }

    const invoiceId = invoiceIdFromBackend ?? generateInvoiceId();

    const paymentUrl = `${origin}/open/pay/${invoiceId}?amount=${amount}&fiat=${fiatCurrency}&crypto=${cryptoCurrency}`;

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        paymentUrl,
        // 👇 временные диагностические поля
        backendStatus,
        backendError,
      },
      { status: 200 }
    );
  } catch (err) {
    const fallbackId = generateInvoiceId();

    return NextResponse.json(
      {
        ok: true,
        invoiceId: fallbackId,
        paymentUrl: `/open/pay/${fallbackId}`,
        backendStatus: null,
        backendError:
          err instanceof Error ? err.message : "Unknown top-level error",
      },
      { status: 200 }
    );
  }
}
