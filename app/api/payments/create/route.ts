// app/api/payments/create/route.ts
import { NextResponse } from "next/server";

const BUILD_STAMP = "create-route-v3-2026-01-02__A1";

const PSP_API_URL = (process.env.PSP_API_URL ?? "").replace(/\/+$/, "");
const PSP_API_KEY = (process.env.PSP_API_KEY ?? "").trim();

// merchant id для MerchantAuthGuard (обязателен)
const PSP_MERCHANT_ID_RAW = (process.env.PSP_MERCHANT_ID ?? "").trim();

type CreateBody = {
  amount?: number | string;
  currency?: string;
  asset?: string;
  network?: string;
  description?: string;
};

type OkResponse = {
  ok: true;
  buildStamp?: string;
  invoiceId: string;
  status?: string;
  paymentUrl?: string | null;
  backendData?: unknown;
};

type ErrResponse = {
  ok: false;
  buildStamp?: string;
  error: string;
  message?: string;
  details?: string;
  backendStatus?: string;
  pspApiUrl?: string;
};

type JsonObject = Record<string, unknown>;

function asObject(v: unknown): JsonObject {
  return v && typeof v === "object" ? (v as JsonObject) : {};
}

async function safeReadBody(res: Response): Promise<string | undefined> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const json = (await res.json().catch(() => null)) as unknown;
    return json ? JSON.stringify(json).slice(0, 2000) : undefined;
  }
  const text = await res.text().catch(() => "");
  return text ? text.slice(0, 2000) : undefined;
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

function normalizeNetwork(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toLowerCase();
  return s.length ? s : null;
}

function pickMerchantId(): string | null {
  if (PSP_MERCHANT_ID_RAW) return PSP_MERCHANT_ID_RAW;

  // dev fallback (чтобы “поехало” сразу) — но лучше выставить PSP_MERCHANT_ID явно
  if (process.env.NODE_ENV === "development") return "m_test_1";

  return null;
}

// backend может отдавать url по-разному — вытащим максимально надёжно
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
    const res: ErrResponse = {
      ok: false,
      buildStamp: BUILD_STAMP,
      error: "PSP_API_URL is empty",
      details: "Set PSP_API_URL in .env.local and restart",
    };
    return NextResponse.json(res, { status: 500 });
  }

  if (!PSP_API_KEY) {
    const res: ErrResponse = {
      ok: false,
      buildStamp: BUILD_STAMP,
      error: "PSP_API_KEY is empty",
      details: "Set PSP_API_KEY in .env.local and restart",
    };
    return NextResponse.json(res, { status: 500 });
  }

  const merchantId = pickMerchantId();
  if (!merchantId) {
    const res: ErrResponse = {
      ok: false,
      buildStamp: BUILD_STAMP,
      error: "PSP_MERCHANT_ID is empty",
      details:
        "Set PSP_MERCHANT_ID in .env.local (must exist in psp-core merchants table)",
    };
    return NextResponse.json(res, { status: 500 });
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
  const network = normalizeNetwork(body.network);
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  if (!fiatAmount || fiatAmount <= 0) {
    const res: ErrResponse = {
      ok: false,
      buildStamp: BUILD_STAMP,
      error: "Invalid amount",
      details: "amount must be a positive number (comma or dot allowed)",
    };
    return NextResponse.json(res, { status: 400 });
  }

  if (!fiatCurrency) {
    const res: ErrResponse = {
      ok: false,
      buildStamp: BUILD_STAMP,
      error: "Invalid currency",
      details: "currency must be a 3-letter code like USD/EUR/CHF",
    };
    return NextResponse.json(res, { status: 400 });
  }

  if (!cryptoCurrency) {
    const res: ErrResponse = {
      ok: false,
      buildStamp: BUILD_STAMP,
      error: "Invalid asset",
      details: "asset must be USDT or USDC",
    };
    return NextResponse.json(res, { status: 400 });
  }

  // network может быть опциональным — но мы передаём, если есть
  const payload: Record<string, unknown> = {
    fiatAmount,
    fiatCurrency,
    cryptoCurrency,
    // важно для трассировки в psp-core логах
    metadata: {
      source: "crypto-pay",
      buildStamp: BUILD_STAMP,
    },
  };
  if (network) payload.network = network;
  if (description) payload.description = description;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    console.log("[create] PSP_API_URL =", PSP_API_URL);
    console.log("[create] PSP_MERCHANT_ID =", merchantId);
    console.log("[create] PSP_API_KEY_len =", PSP_API_KEY.length);
    console.log("[create] BUILD_STAMP =", BUILD_STAMP);

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

    if (!pspRes.ok) {
      const details = await safeReadBody(pspRes);
      const res: ErrResponse = {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "PSP_ERROR",
        message: `PSP responded ${pspRes.status}`,
        backendStatus: `HTTP ${pspRes.status}`,
        details,
        pspApiUrl: PSP_API_URL,
      };
      return NextResponse.json(res, { status: 502 });
    }

    const raw = (await pspRes.json().catch(() => ({}))) as unknown;
    const data = asObject(raw);

    const invoiceId = String(data.id ?? data.invoiceId ?? "");
    if (!invoiceId) {
      const res: ErrResponse = {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "PSP_ERROR",
        message: "PSP response missing invoice id",
        details: JSON.stringify(data).slice(0, 2000),
        pspApiUrl: PSP_API_URL,
      };
      return NextResponse.json(res, { status: 502 });
    }

    const res: OkResponse = {
      ok: true,
      buildStamp: BUILD_STAMP,
      invoiceId,
      status: typeof data.status === "string" ? data.status : undefined,
      paymentUrl: extractPaymentUrl(data),
      backendData: data,
    };

    const out = NextResponse.json(res, { status: 200 });
    out.headers.set("Cache-Control", "no-store");
    return out;
  } catch (e: unknown) {
    const isAbort = e instanceof Error && e.name === "AbortError";

    const res: ErrResponse = {
      ok: false,
      buildStamp: BUILD_STAMP,
      error: isAbort ? "PSP timeout" : "Fetch failed",
      details:
        e instanceof Error
          ? `${e.name}: ${e.message}`.slice(0, 300)
          : String(e ?? "Unknown error").slice(0, 300),
      pspApiUrl: PSP_API_URL,
    };
    return NextResponse.json(res, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
