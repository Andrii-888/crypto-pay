// app/api/payments/status/route.ts
import { NextResponse } from "next/server";
import { getPspEnv } from "@/lib/pspEnv";

export const revalidate = 0;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUILD_STAMP = "status-route-v2-2026-01-11__PASS_THRU_STATUS";

type ErrResponse = {
  ok: false;
  buildStamp?: string;
  error: "bad_request" | "config" | "psp_core_error" | "network_error";
  message?: string;
  details?: string;
  pspApiUrl?: string;
  backendStatus?: string;
  sentMerchantIdLast4?: string;
  sentApiKeyLast4?: string;
};

type StatusOkResponse = {
  ok: true;
  buildStamp?: string;
  invoice: unknown;
};

function sliceDetails(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s ? s.slice(0, 2000) : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = (searchParams.get("invoiceId") ?? "").trim();

  if (!invoiceId) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Missing invoiceId",
      },
      { status: 400 }
    );
  }

  // Centralized env validation (single source of truth)
  let env: ReturnType<typeof getPspEnv>;
  try {
    env = getPspEnv();
  } catch (e) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "config",
        message: "Missing PSP env vars",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }

  const url = `${env.apiUrl}/invoices/${encodeURIComponent(invoiceId)}`;

  try {
    const r = await fetch(url, {
      method: "GET",
      cache: "no-store",
      next: { revalidate: 0 },
      headers: {
        Accept: "application/json",
        "x-merchant-id": env.merchantId,
        "x-api-key": env.apiKey,
      },
    });

    const contentType = r.headers.get("content-type") ?? "";
    const rawText = await r.text();

    let payload: unknown = rawText;
    if (contentType.includes("application/json")) {
      try {
        payload = JSON.parse(rawText) as unknown;
      } catch {
        payload = rawText;
      }
    }

    if (!r.ok) {
      const status = r.status;

      return NextResponse.json<ErrResponse>(
        {
          ok: false,
          buildStamp: BUILD_STAMP,
          error: "psp_core_error",
          message: `PSP-Core responded with ${status}`,
          backendStatus: `HTTP ${status}`,
          details: sliceDetails(payload),
          pspApiUrl: env.apiUrl,
          sentMerchantIdLast4: env.merchantId ? env.merchantId.slice(-4) : "",
          sentApiKeyLast4: env.apiKey ? env.apiKey.slice(-4) : "",
        },
        { status }
      );
    }

    // --- derived expiry (UI truth) ---
    // PSP-Core может вернуть либо сам invoice, либо обёртку { invoice: ... }.
    // Для UI всегда нормализуем к "чистому" invoice-объекту.
    let invoiceOut: unknown = payload;

    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const root = payload as Record<string, unknown>;
      const maybeInvoice = root.invoice;

      const inv =
        maybeInvoice &&
        typeof maybeInvoice === "object" &&
        !Array.isArray(maybeInvoice)
          ? (maybeInvoice as Record<string, unknown>)
          : root;

      invoiceOut = inv;

      const status = typeof inv.status === "string" ? inv.status : null;
      const expiresAt =
        typeof inv.expiresAt === "string" ? inv.expiresAt : null;

      if (status === "waiting" && expiresAt) {
        const expMs = Date.parse(expiresAt);
        if (Number.isFinite(expMs) && Date.now() > expMs) {
          invoiceOut = { ...inv, status: "expired" };
        }
      }
    }

    // --- end derived expiry ---

    const out = NextResponse.json<StatusOkResponse>(
      {
        ok: true,
        buildStamp: BUILD_STAMP,
        invoice: invoiceOut,
      },
      { status: 200 }
    );
    out.headers.set("Cache-Control", "no-store");
    return out;
  } catch (e: unknown) {
    const details =
      e instanceof Error
        ? `${e.name}: ${e.message}`.slice(0, 300)
        : String(e ?? "Unknown error").slice(0, 300);

    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "network_error",
        message: "Failed to reach PSP-Core",
        details,
        pspApiUrl: env.apiUrl,
      },
      { status: 502 }
    );
  }
}
