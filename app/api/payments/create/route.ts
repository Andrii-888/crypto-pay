//app/api/payments/create/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUILD_STAMP = "create-route-v5-2026-01-11__HARDENED";

const PSP_API_URL = (process.env.PSP_API_URL ?? "").replace(/\/+$/, "");
const PSP_API_KEY = (process.env.PSP_API_KEY ?? "").trim();
const PSP_MERCHANT_ID_RAW = (process.env.PSP_MERCHANT_ID ?? "").trim();

const IS_PROD = process.env.NODE_ENV === "production";

type CreateBody = {
  amount?: number | string;
  currency?: string; // fiat currency (CHF-only)
  asset?: string; // USDT/USDC
  network?: string; // UI may send: "tron"/"trc20"/"eth"/"erc20"/"ethereum"
  description?: string;
};

type OkResponse = {
  ok: true;
  buildStamp?: string;
  invoiceId: string;
  status?: string;
  paymentUrl?: string | null;
  // ✅ For safety: do not expose full backend invoice in production
  backendData?: unknown;
};

type ErrResponse = {
  ok: false;
  buildStamp?: string;
  error: "config" | "bad_request" | "psp_error" | "network_error";
  message?: string;
  details?: string;
  backendStatus?: string;
  pspApiUrl?: string;
};

type JsonObject = Record<string, unknown>;

function asObject(v: unknown): JsonObject {
  return v && typeof v === "object" ? (v as JsonObject) : {};
}

function sliceDetails(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s ? s.slice(0, 2000) : undefined;
}

function parseNumberLike(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const s = v.trim().replace(",", ".");
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normalizeCurrency3(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(s)) return null;
  return s;
}

function normalizeCryptoCurrency(v: unknown): "USDT" | "USDC" | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toUpperCase();
  if (s === "USDT" || s === "USDC") return s;
  return null;
}

/**
 * psp-core expects chain values: "TRON" | "ETH"
 * UI may send: tron/trc20, eth/erc20/ethereum, TRON/ETH etc.
 */
function normalizeNetworkChain(v: unknown): "TRON" | "ETH" | null {
  if (v === null || v === undefined) return null;
  if (typeof v !== "string") return null;

  const s = v.trim().toUpperCase();
  if (!s) return null;

  if (s === "TRON" || s === "TRC20") return "TRON";
  if (s === "ETH" || s === "ERC20" || s === "ETHEREUM") return "ETH";

  return null;
}

function pickMerchantId(): string | null {
  if (PSP_MERCHANT_ID_RAW) return PSP_MERCHANT_ID_RAW;
  return null;
}

function extractPaymentUrl(data: JsonObject): string | null {
  const direct = data.paymentUrl ?? data.payUrl ?? data.url;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const links = asObject(data.links);
  const pay = links.pay ?? links.payment ?? links.checkout;
  if (typeof pay === "string" && pay.trim()) return pay.trim();

  const hosted = asObject(data.hosted);
  const hostedUrl = hosted.url ?? hosted.paymentUrl;
  if (typeof hostedUrl === "string" && hostedUrl.trim())
    return hostedUrl.trim();

  return null;
}

export async function POST(req: Request) {
  if (!PSP_API_URL) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "config",
        message: "PSP_API_URL is empty",
        details: "Set PSP_API_URL in .env.local and restart",
      },
      { status: 500 }
    );
  }

  if (!PSP_API_KEY) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "config",
        message: "PSP_API_KEY is empty",
        details: "Set PSP_API_KEY in .env.local and restart",
      },
      { status: 500 }
    );
  }

  const merchantId = pickMerchantId();
  if (!merchantId) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "config",
        message: "PSP_MERCHANT_ID is empty",
        details:
          "Set PSP_MERCHANT_ID in .env.local (must match psp-core merchant)",
      },
      { status: 500 }
    );
  }

  let body: CreateBody = {};
  try {
    body = (await req.json().catch(() => ({}))) as CreateBody;
  } catch {
    body = {};
  }

  const fiatAmount = parseNumberLike(body.amount);
  const fiatCurrency = normalizeCurrency3(body.currency);
  const cryptoCurrency = normalizeCryptoCurrency(body.asset);
  const networkChain = normalizeNetworkChain(body.network);
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  if (!fiatAmount || fiatAmount <= 0) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Invalid amount",
        details: "amount must be a positive number (comma or dot allowed)",
      },
      { status: 400 }
    );
  }

  if (!fiatCurrency) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Invalid currency",
        details: "currency must be a 3-letter code (CHF)",
      },
      { status: 400 }
    );
  }

  // ✅ CHF-first/CHF-only (presentation layer guard):
  // crypto-pay must NEVER create non-CHF fiat invoices.
  if (fiatCurrency !== "CHF") {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Unsupported currency",
        details: "Only CHF is supported in this environment",
      },
      { status: 400 }
    );
  }

  if (!cryptoCurrency) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Invalid asset",
        details: "asset must be USDT or USDC",
      },
      { status: 400 }
    );
  }

  // Enforce known unsupported pair early
  if (cryptoCurrency === "USDC" && networkChain === "TRON") {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Invalid crypto/network pair",
        details: "USDC + TRON is not supported. Use USDC + ETH.",
      },
      { status: 400 }
    );
  }

  const payload: Record<string, unknown> = {
    fiatAmount,
    fiatCurrency,
    cryptoCurrency,
    metadata: {
      source: "crypto-pay",
      buildStamp: BUILD_STAMP,
    },
  };

  if (networkChain) payload.network = networkChain;
  if (description) payload.description = description;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    if (!IS_PROD) {
      console.log("[create]", {
        PSP_API_URL,
        PSP_MERCHANT_ID: merchantId,
        PSP_API_KEY_len: PSP_API_KEY.length,
        BUILD_STAMP,
      });
    }

    const pspRes = await fetch(`${PSP_API_URL}/invoices`, {
      method: "POST",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        Accept: "application/json",
        "x-api-key": PSP_API_KEY,
        "x-merchant-id": merchantId,
      },
      body: JSON.stringify(payload),
    });

    // Read once
    const contentType = pspRes.headers.get("content-type") ?? "";
    const rawText = await pspRes.text();

    let parsed: unknown = rawText;
    if (contentType.includes("application/json")) {
      try {
        parsed = JSON.parse(rawText) as unknown;
      } catch {
        parsed = rawText;
      }
    }

    if (!pspRes.ok) {
      // ✅ pass-through status (like status-route)
      const status = pspRes.status;

      return NextResponse.json<ErrResponse>(
        {
          ok: false,
          buildStamp: BUILD_STAMP,
          error: "psp_error",
          message: `PSP responded ${status}`,
          backendStatus: `HTTP ${status}`,
          details: sliceDetails(parsed),
          pspApiUrl: PSP_API_URL,
        },
        { status }
      );
    }

    const data = asObject(parsed);
    const invoiceId = String(data.id ?? data.invoiceId ?? "").trim();

    if (!invoiceId) {
      return NextResponse.json<ErrResponse>(
        {
          ok: false,
          buildStamp: BUILD_STAMP,
          error: "psp_error",
          message: "PSP response missing invoice id",
          details: sliceDetails(data),
          pspApiUrl: PSP_API_URL,
        },
        { status: 502 }
      );
    }

    const res: OkResponse = {
      ok: true,
      buildStamp: BUILD_STAMP,
      invoiceId,
      status: typeof data.status === "string" ? data.status : undefined,
      paymentUrl: extractPaymentUrl(data),
      backendData: IS_PROD ? undefined : data,
    };

    const out = NextResponse.json(res, { status: 200 });
    out.headers.set("Cache-Control", "no-store");
    return out;
  } catch (e: unknown) {
    const isAbort = e instanceof Error && e.name === "AbortError";
    const details =
      e instanceof Error
        ? `${e.name}: ${e.message}`.slice(0, 300)
        : String(e ?? "Unknown error").slice(0, 300);

    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "network_error",
        message: isAbort ? "PSP timeout" : "Fetch failed",
        details,
        pspApiUrl: PSP_API_URL,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }
}
