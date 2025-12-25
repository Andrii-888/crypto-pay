// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PSP_API_URL = (
  process.env.PSP_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/+$/, "");

const PSP_API_KEY = (process.env.PSP_API_KEY ?? "").trim();

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

async function safeReadBody(res: Response): Promise<unknown> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    return res.json().catch(() => ({}));
  }
  const text = await res.text().catch(() => "");
  return text ? { message: text.slice(0, 500) } : {};
}

export async function POST(request: NextRequest) {
  const baseUrl = getOrigin(request);

  let amount = 0;
  let fiatCurrency = "EUR";
  let cryptoCurrency: "USDT" | "USDC" = "USDT";
  let orderId: string | undefined;

  try {
    const body = (await request.json().catch(() => ({}))) as JsonObject;

    amount =
      Number(extractField(body, ["amount", "fiatAmount", "total"], 0)) || 0;

    fiatCurrency = toUpperSafe(
      extractField(body, ["fiatCurrency", "currency"], "EUR"),
      "EUR"
    );

    const token = toUpperSafe(
      extractField(body, ["cryptoCurrency", "token"], "USDT"),
      "USDT"
    );
    cryptoCurrency = token === "USDC" ? "USDC" : "USDT";

    orderId = extractField<string>(body, ["orderId", "description"], undefined);
  } catch {
    // ignore
  }

  if (!amount || amount <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "VALIDATION_ERROR",
        message: "amount must be > 0",

        // ✅ DIAG
        pspApiUrl: PSP_API_URL,
        hasPspKey: Boolean(PSP_API_KEY),
      },
      { status: 400 }
    );
  }

  if (!PSP_API_URL) {
    return NextResponse.json(
      {
        ok: false,
        error: "CONFIG_ERROR",
        message: "PSP_API_URL is empty",

        // ✅ DIAG
        pspApiUrl: PSP_API_URL,
        hasPspKey: Boolean(PSP_API_KEY),
      },
      { status: 500 }
    );
  }

  if (!PSP_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error: "CONFIG_ERROR",
        message: "PSP_API_KEY is empty (set PSP_API_KEY in env and redeploy)",

        // ✅ DIAG
        pspApiUrl: PSP_API_URL,
        hasPspKey: Boolean(PSP_API_KEY),
      },
      { status: 500 }
    );
  }

  try {
    const pspRes = await fetch(`${PSP_API_URL}/invoices`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PSP_API_KEY}`,
      },
      body: JSON.stringify({
        merchantId: "mrc_test_001",
        orderId: orderId ?? `demo_${Date.now()}`,
        fiatAmount: amount,
        fiatCurrency,
        cryptoCurrency,
        network: "TRON",
        expiresInMinutes: 10,
      }),
    });

    const backendStatus = `HTTP ${pspRes.status}`;
    const data = (await safeReadBody(pspRes)) as JsonObject;

    if (!pspRes.ok) {
      const msg =
        extractField<string>(data, ["message", "error"], undefined) ??
        `PSP responded with ${backendStatus}`;

      return NextResponse.json(
        {
          ok: false,
          error: "PSP_ERROR",
          message: msg,
          backendStatus,
          backendData: data,

          // ✅ DIAG (самое важное!)
          pspApiUrl: PSP_API_URL,
          hasPspKey: Boolean(PSP_API_KEY),
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

          // ✅ DIAG
          pspApiUrl: PSP_API_URL,
          hasPspKey: Boolean(PSP_API_KEY),
        },
        { status: 502 }
      );
    }

    const backendPaymentUrl =
      extractField<string>(data, ["paymentUrl", "payment_url"], undefined) ??
      undefined;

    const paymentUrl =
      backendPaymentUrl ??
      `${baseUrl}/open/pay/${encodeURIComponent(invoiceId)}`;

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        paymentUrl,

        amount:
          extractField<number>(data, ["fiatAmount", "fiat_amount"], amount) ??
          amount,

        fiatCurrency: toUpperSafe(
          extractField(data, ["fiatCurrency", "fiat_currency"], fiatCurrency),
          fiatCurrency
        ),

        cryptoCurrency: toUpperSafe(
          extractField(
            data,
            ["cryptoCurrency", "crypto_currency"],
            cryptoCurrency
          ),
          cryptoCurrency
        ),

        cryptoAmount:
          extractField<number>(data, ["cryptoAmount", "crypto_amount"]) ??
          undefined,

        expiresAt:
          extractField<string>(data, ["expiresAt", "expires_at"]) ?? undefined,

        backendStatus,

        // ✅ DIAG
        pspApiUrl: PSP_API_URL,
        hasPspKey: Boolean(PSP_API_KEY),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Unknown fetch error",

        // ✅ DIAG
        pspApiUrl: PSP_API_URL,
        hasPspKey: Boolean(PSP_API_KEY),
      },
      { status: 502 }
    );
  }
}
