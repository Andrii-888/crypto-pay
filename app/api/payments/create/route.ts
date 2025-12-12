// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

const PSP_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const FRONTEND_URL = (process.env.NEXT_PUBLIC_FRONTEND_URL ?? "").replace(
  /\/+$/,
  ""
);

// Генерация invoiceId на фронте (fallback)
function generateInvoiceId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

// Универсальный helper для вытаскивания поля из ответа бекенда
function extractField<T = unknown>(
  source: any,
  keys: string[],
  fallback?: T
): T | undefined {
  if (!source || typeof source !== "object") return fallback;
  for (const key of keys) {
    if (key in source && source[key] != null) {
      return source[key] as T;
    }
  }
  return fallback;
}

export async function POST(request: NextRequest) {
  try {
    let amount = 0;
    let fiatCurrency = "EUR";
    let cryptoCurrency = "USDT";
    let description: string | undefined;

    // Аккуратно читаем тело (НЕ падаем, если пусто или битое)
    try {
      const body = await request.json();
      amount = Number(body.amount ?? body.fiatAmount ?? body.total ?? 0) || 0;
      fiatCurrency =
        (body.fiatCurrency as string) || (body.currency as string) || "EUR";
      cryptoCurrency =
        (body.cryptoCurrency as string) || (body.token as string) || "USDT";
      description =
        (body.description as string) || (body.orderId as string) || undefined;
    } catch {
      // оставляем дефолты
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "VALIDATION_ERROR",
          message: "amount must be greater than 0",
        },
        { status: 400 }
      );
    }

    // БАЗА ДЛЯ ССЫЛКИ НА ОПЛАТУ:
    // 1) если задан NEXT_PUBLIC_FRONTEND_URL — используем его (важно для прод/доменов)
    // 2) иначе fallback на текущий origin
    const baseUrl = FRONTEND_URL || request.nextUrl.origin;

    let invoiceIdFromBackend: string | null = null;
    let backendStatus: string | null = null;
    let backendError: string | null = null;
    let backendData: any = null;

    // Пытаемся создать инвойс на PSP-core
    if (PSP_API_URL) {
      try {
        const pspRes = await fetch(`${PSP_API_URL}/invoices`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fiatAmount: amount,
            fiatCurrency,
            cryptoCurrency,
            description,
          }),
        });

        backendStatus = `HTTP ${pspRes.status}`;

        const data = await pspRes
          .json()
          .catch(() => ({} as Record<string, unknown>));
        backendData = data;

        if (pspRes.ok) {
          invoiceIdFromBackend =
            extractField<string>(data, ["id", "invoiceId", "invoice_id"]) ??
            null;
        } else {
          backendError =
            data?.message && typeof data.message === "string"
              ? data.message
              : `PSP responded with status ${pspRes.status}`;
        }
      } catch (err) {
        backendError =
          err instanceof Error ? err.message : "Unknown fetch error";
      }
    } else {
      backendError = "PSP_API_URL is empty";
    }

    // Если PSP отдал id — используем его, если нет — генерируем локальный
    const invoiceId = invoiceIdFromBackend ?? generateInvoiceId();

    // Нормализуем дополнительные поля из ответа PSP (если были)
    const normalizedAmount =
      extractField<number>(
        backendData,
        ["amount", "fiatAmount", "fiat_amount"],
        amount
      ) ?? amount;

    const normalizedFiatCurrency =
      extractField<string>(
        backendData,
        ["fiatCurrency", "fiat_currency", "currency"],
        fiatCurrency
      ) ?? fiatCurrency;

    const normalizedCryptoCurrency =
      extractField<string>(
        backendData,
        ["cryptoCurrency", "crypto_currency", "token"],
        cryptoCurrency
      ) ?? cryptoCurrency;

    const cryptoAmount =
      extractField<number>(
        backendData,
        ["cryptoAmount", "amountCrypto", "crypto_amount"],
        undefined
      ) ?? undefined;

    const expiresAt =
      extractField<string>(
        backendData,
        ["expiresAt", "expires_at", "expiration"],
        undefined
      ) ?? undefined;

    // ВАЖНО:
    // не берем paymentUrl от бекенда, потому что он может быть с несуществующим доменом
    // (типа demo.your-cryptopay.com -> NXDOMAIN)
    const paymentUrl = `${baseUrl}/open/pay/${invoiceId}?amount=${encodeURIComponent(
      normalizedAmount
    )}&fiat=${encodeURIComponent(
      normalizedFiatCurrency
    )}&crypto=${encodeURIComponent(normalizedCryptoCurrency)}`;

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        paymentUrl,
        amount: normalizedAmount,
        fiatCurrency: normalizedFiatCurrency,
        cryptoCurrency: normalizedCryptoCurrency,
        cryptoAmount: cryptoAmount,
        expiresAt,
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
        amount: null,
        fiatCurrency: null,
        cryptoCurrency: null,
        cryptoAmount: null,
        expiresAt: null,
        backendStatus: null,
        backendError:
          err instanceof Error ? err.message : "Unknown top-level error",
      },
      { status: 200 }
    );
  }
}
