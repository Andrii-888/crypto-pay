import { NextRequest, NextResponse } from "next/server";

const PSP_API_URL = (
  process.env.PSP_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/+$/, "");

// ✅ безопасно читаем JSON
type JsonObject = Record<string, unknown>;

function extractField<T = unknown>(
  source: unknown,
  keys: string[],
  fallback?: T
): T | undefined {
  if (!source || typeof source !== "object") return fallback;
  const obj = source as JsonObject;

  for (const key of keys) {
    const value = obj[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return fallback;
}

function toUpperSafe(v: unknown, fallback: string) {
  return typeof v === "string" && v.trim() ? v.trim().toUpperCase() : fallback;
}

function getOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin) return origin.replace(/\/+$/, "");

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`.replace(/\/+$/, "");

  return req.nextUrl.origin.replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const baseUrl = getOrigin(request);

  let amount = 0;
  let fiatCurrency = "EUR";
  let cryptoCurrency = "USDT";
  let description: string | undefined;

  try {
    const body = (await request.json().catch(() => ({}))) as JsonObject;

    amount =
      Number(extractField(body, ["amount", "fiatAmount", "total"], 0)) || 0;

    fiatCurrency = toUpperSafe(
      extractField(body, ["fiatCurrency", "currency"], "EUR"),
      "EUR"
    );

    cryptoCurrency = toUpperSafe(
      extractField(body, ["cryptoCurrency", "token"], "USDT"),
      "USDT"
    );

    description = extractField<string>(
      body,
      ["description", "orderId"],
      undefined
    );
  } catch {
    // ignore
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

  if (!PSP_API_URL) {
    return NextResponse.json(
      { ok: false, error: "CONFIG_ERROR", message: "PSP_API_URL is empty" },
      { status: 500 }
    );
  }

  try {
    const pspRes = await fetch(`${PSP_API_URL}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fiatAmount: amount,
        fiatCurrency,
        cryptoCurrency, // ✅ отправляем выбранный токен (USDT/USDC)
        description,
      }),
    });

    const backendStatus = `HTTP ${pspRes.status}`;
    const data = (await pspRes.json().catch(() => ({}))) as JsonObject;

    if (!pspRes.ok) {
      const msg =
        extractField<string>(data, ["message", "error"], undefined) ??
        `PSP responded with status ${pspRes.status}`;
      return NextResponse.json(
        {
          ok: false,
          error: "PSP_ERROR",
          message: msg,
          backendStatus,
          backendData: data,
        },
        { status: 502 }
      );
    }

    const invoiceId =
      extractField<string>(data, ["id", "invoiceId", "invoice_id"]) ??
      undefined;

    if (!invoiceId) {
      return NextResponse.json(
        {
          ok: false,
          error: "PSP_ERROR",
          message: "PSP did not return invoice id",
          backendStatus,
          backendData: data,
        },
        { status: 502 }
      );
    }

    const normalizedAmount =
      extractField<number>(
        data,
        ["amount", "fiatAmount", "fiat_amount"],
        amount
      ) ?? amount;

    const normalizedFiatCurrency = toUpperSafe(
      extractField(
        data,
        ["fiatCurrency", "fiat_currency", "currency"],
        fiatCurrency
      ),
      fiatCurrency
    );

    // ✅ ВАЖНО: если PSP не вернул cryptoCurrency — используем то, что выбрал клиент
    const normalizedCryptoCurrency = toUpperSafe(
      extractField(
        data,
        ["cryptoCurrency", "crypto_currency", "token"],
        cryptoCurrency
      ),
      cryptoCurrency
    );

    const cryptoAmount =
      extractField<number>(data, [
        "cryptoAmount",
        "amountCrypto",
        "crypto_amount",
      ]) ?? undefined;

    const expiresAt =
      extractField<string>(data, ["expiresAt", "expires_at", "expiration"]) ??
      undefined;

    // ✅ FIX: сначала берём paymentUrl, который вернул PSP (psp-core),
    // иначе fallback на текущий фронт
    const backendPaymentUrl =
      extractField<string>(data, ["paymentUrl", "payment_url"], undefined) ??
      undefined;

    const paymentUrl =
      backendPaymentUrl ??
      `${baseUrl}/open/pay/${encodeURIComponent(
        invoiceId
      )}?amount=${encodeURIComponent(
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
        cryptoAmount,
        expiresAt,
        backendStatus,
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Unknown fetch error",
      },
      { status: 502 }
    );
  }
}
