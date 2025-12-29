// app/api/payments/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PSP_API_URL = (process.env.PSP_API_URL ?? "").replace(/\/+$/, "");
const PSP_API_KEY = (process.env.PSP_API_KEY ?? "").trim();

// Optional: enable debug fields only when explicitly allowed
const DEBUG = (process.env.DEBUG_PAYMENTS_API ?? "").trim() === "true";

type JsonObject = Record<string, unknown>;

type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

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

function sanitizeAmount(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 0;
  // canonical 2 decimals (important for "amounts match")
  return Math.round(n * 100) / 100;
}

function normalizeNetwork(v: unknown): "TRON" | "ETH" {
  const n = toUpperSafe(v, "TRON");
  if (n === "TRON" || n === "TRC20") return "TRON";
  if (n === "ETH" || n === "ETHEREUM" || n === "ERC20") return "ETH";
  return "TRON";
}

function normalizeToken(v: unknown): "USDT" | "USDC" {
  const t = toUpperSafe(v, "USDT");
  return t === "USDC" ? "USDC" : "USDT";
}

/**
 * Guardrail: token <-> network pairing.
 * For demo we keep it strict:
 * - USDT -> TRON
 * - USDC -> ETH
 */
function enforceTokenNetworkPair(
  token: "USDT" | "USDC",
  net: "TRON" | "ETH"
): "TRON" | "ETH" {
  // бизнес-правило PSP
  if (token === "USDT") return "TRON";
  if (token === "USDC") return "ETH";

  return net; // fallback (на будущее)
}

function normalizeInvoiceStatus(raw: unknown): InvoiceStatus {
  const s = String(raw ?? "waiting").toLowerCase();
  if (
    s === "confirmed" ||
    s === "expired" ||
    s === "rejected" ||
    s === "waiting"
  )
    return s;
  return "waiting";
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
  if (ct.includes("application/json")) return res.json().catch(() => ({}));
  const text = await res.text().catch(() => "");
  return text ? { message: text.slice(0, 1000) } : {};
}

export async function POST(request: NextRequest) {
  const baseUrl = getOrigin(request);

  // defaults
  let fiatAmount = 0;
  let fiatCurrency = "EUR";
  let cryptoCurrency: "USDT" | "USDC" = "USDT";
  let network: "TRON" | "ETH" = "TRON";
  let orderId: string | undefined;

  try {
    const body = (await request.json().catch(() => ({}))) as JsonObject;

    fiatAmount = sanitizeAmount(
      extractField(body, ["amount", "fiatAmount", "total"], 0)
    );

    fiatCurrency = toUpperSafe(
      extractField(body, ["fiatCurrency", "currency"], "EUR"),
      "EUR"
    );

    cryptoCurrency = normalizeToken(
      extractField(body, ["cryptoCurrency", "token"], "USDT")
    );

    // network may come from UI, but we enforce pairing to avoid weird combos
    const reqNet = normalizeNetwork(extractField(body, ["network"], "TRON"));
    network = enforceTokenNetworkPair(cryptoCurrency, reqNet);

    const rawOrderId = extractField<string>(
      body,
      ["orderId", "order_id"],
      undefined
    );
    orderId =
      typeof rawOrderId === "string" && rawOrderId.trim()
        ? rawOrderId.trim().slice(0, 80)
        : undefined;
  } catch {
    // ignore
  }

  if (!fiatAmount || fiatAmount <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "VALIDATION_ERROR",
        message: "amount must be > 0",
        ...(DEBUG
          ? { pspApiUrl: PSP_API_URL, hasPspKey: Boolean(PSP_API_KEY) }
          : {}),
      },
      { status: 400 }
    );
  }

  if (!PSP_API_URL) {
    return NextResponse.json(
      {
        ok: false,
        error: "CONFIG_ERROR",
        message: "PSP_API_URL is empty (set PSP_API_URL and redeploy)",
        ...(DEBUG
          ? { pspApiUrl: PSP_API_URL, hasPspKey: Boolean(PSP_API_KEY) }
          : {}),
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
        ...(DEBUG
          ? { pspApiUrl: PSP_API_URL, hasPspKey: Boolean(PSP_API_KEY) }
          : {}),
      },
      { status: 500 }
    );
  }

  // always unique & stable
  const generatedOrderId = `cp_${Date.now()}_${randomUUID().slice(0, 8)}`;

  try {
    const pspRes = await fetch(`${PSP_API_URL}/invoices`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PSP_API_KEY,
      },
      body: JSON.stringify({
        merchantId: "mrc_test_001",
        orderId: orderId ?? generatedOrderId,
        orderDescription: "CryptoPay demo checkout",

        fiatAmount,
        fiatCurrency,
        cryptoCurrency,
        network,

        expiresInMinutes: 10,

        // optional: allow backend to build correct urls if it wants
        clientOrigin: baseUrl,
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
          ...(DEBUG ? { backendData: data, pspApiUrl: PSP_API_URL } : {}),
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
          ...(DEBUG ? { backendData: data, pspApiUrl: PSP_API_URL } : {}),
        },
        { status: 502 }
      );
    }

    // backend url is allowed only as supplementary field
    const backendPaymentUrl =
      extractField<string>(data, ["paymentUrl", "payment_url"], undefined) ??
      undefined;

    // ✅ always use our hosted route for navigation
    const hostedPaymentUrl = `${baseUrl}/open/pay/${encodeURIComponent(
      invoiceId
    )}`;

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        paymentUrl: hostedPaymentUrl,

        status: normalizeInvoiceStatus(
          extractField(data, ["status"], "waiting")
        ),
        expiresAt: extractField<string>(
          data,
          ["expiresAt", "expires_at"],
          undefined
        ),

        fiatAmount: (extractField<number>(
          data,
          ["fiatAmount", "fiat_amount"],
          fiatAmount
        ) ?? fiatAmount) as number,
        fiatCurrency: toUpperSafe(
          extractField(data, ["fiatCurrency", "fiat_currency"], fiatCurrency),
          fiatCurrency
        ),

        // ✅ keep strict token type for frontend
        cryptoCurrency,
        cryptoAmount: extractField<number>(
          data,
          ["cryptoAmount", "crypto_amount"],
          undefined
        ),

        network,

        ...(DEBUG
          ? {
              backendStatus,
              backendPaymentUrl,
              pspApiUrl: PSP_API_URL,
              hasPspKey: Boolean(PSP_API_KEY),
              generatedOrderId,
            }
          : {}),
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: "NETWORK_ERROR",
        message: err instanceof Error ? err.message : "Unknown fetch error",
        ...(DEBUG ? { pspApiUrl: PSP_API_URL } : {}),
      },
      { status: 502 }
    );
  }
}
