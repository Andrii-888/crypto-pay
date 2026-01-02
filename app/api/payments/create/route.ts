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
    return json ? JSON.stringify(json) : undefined;
  }
  const text = await res.text().catch(() => "");
  return text ? text.slice(0, 1200) : undefined;
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

export async function POST(req: Request) {
  if (!PSP_API_URL) {
    const res: ErrResponse = {
      ok: false,
      error: "PSP_API_URL is empty",
      details: "Set PSP_API_URL in .env.local and restart",
    };
    return NextResponse.json(res, { status: 500 });
  }

  if (!PSP_API_KEY) {
    const res: ErrResponse = {
      ok: false,
      error: "PSP_API_KEY is empty",
      details: "Set PSP_API_KEY in .env.local and restart",
    };
    return NextResponse.json(res, { status: 500 });
  }

  const merchantId = pickMerchantId();
  if (!merchantId) {
    const res: ErrResponse = {
      ok: false,
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
      error: "Invalid amount",
      details: "amount must be a positive number (comma or dot allowed)",
    };
    return NextResponse.json(res, { status: 400 });
  }

  if (!fiatCurrency) {
    const res: ErrResponse = {
      ok: false,
      error: "Invalid currency",
      details: "currency must be a 3-letter code like USD/EUR/CHF",
    };
    return NextResponse.json(res, { status: 400 });
  }

  if (!cryptoCurrency) {
    const res: ErrResponse = {
      ok: false,
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
  };
  if (network) payload.network = network;
  if (description) payload.description = description;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

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
        error: "PSP_ERROR",
        message: "PSP response missing invoice id",
        details: JSON.stringify(data),
        pspApiUrl: PSP_API_URL,
      };
      return NextResponse.json(res, { status: 502 });
    }

    const res: OkResponse = {
      ok: true,
      buildStamp: BUILD_STAMP,
      invoiceId,
      status: typeof data.status === "string" ? data.status : undefined,
      paymentUrl: typeof data.paymentUrl === "string" ? data.paymentUrl : null,
      backendData: data,
    };

    const out = NextResponse.json(res, { status: 200 });
    out.headers.set("Cache-Control", "no-store");
    return out;
  } catch (e: unknown) {
    const err =
      e instanceof Error && e.name === "AbortError"
        ? "PSP timeout"
        : "Fetch failed";

    const res: ErrResponse = {
      ok: false,
      error: err,
      details: e instanceof Error ? e.message : "Unknown error",
      pspApiUrl: PSP_API_URL,
    };
    return NextResponse.json(res, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
