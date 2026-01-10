// app/api/payments/status/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PSP_API_URL = (process.env.PSP_API_URL ?? "").replace(/\/+$/, "");
const PSP_API_KEY = (process.env.PSP_API_KEY ?? "").trim();
const PSP_MERCHANT_ID = (process.env.PSP_MERCHANT_ID ?? "").trim();

type ErrResponse = {
  ok: false;
  error: string;
  message?: string;
  details?: string;
  pspApiUrl?: string;
};

type StatusOkResponse = {
  ok: true;
  invoice: unknown;
};

async function safeReadBody(res: Response): Promise<string | undefined> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const json: unknown = await res.json().catch(() => null);
    return json ? JSON.stringify(json).slice(0, 2000) : undefined;
  }
  const text = await res.text().catch(() => "");
  return text ? text.slice(0, 2000) : undefined;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = (searchParams.get("invoiceId") ?? "").trim();

  if (!invoiceId) {
    return NextResponse.json<ErrResponse>(
      { ok: false, error: "bad_request", message: "Missing invoiceId" },
      { status: 400 }
    );
  }

  if (!PSP_API_URL) {
    return NextResponse.json<ErrResponse>(
      { ok: false, error: "config", message: "Missing PSP_API_URL" },
      { status: 500 }
    );
  }

  if (!PSP_MERCHANT_ID || !PSP_API_KEY) {
    return NextResponse.json<ErrResponse>(
      { ok: false, error: "config", message: "Missing PSP auth env vars" },
      { status: 500 }
    );
  }

  const url = `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`;

  try {
    const r = await fetch(url, {
      method: "GET",
      headers: {
        "x-merchant-id": PSP_MERCHANT_ID,
        "x-api-key": PSP_API_KEY,
      },
      cache: "no-store",
    });

    const contentType = r.headers.get("content-type") ?? "";
    const payloadText = await r.text();

    const payload: unknown = contentType.includes("application/json")
      ? (() => {
          try {
            return JSON.parse(payloadText) as unknown;
          } catch {
            return payloadText;
          }
        })()
      : payloadText;

    if (!r.ok) {
      // details берём безопасно, без any
      const details =
        payloadText?.slice(0, 2000) ||
        (await safeReadBody(new Response(payloadText, { headers: r.headers })));

      return NextResponse.json<ErrResponse>(
        {
          ok: false,
          error: "psp_core_error",
          message: `PSP-Core responded with ${r.status}`,
          details,
          pspApiUrl: PSP_API_URL,
        },
        { status: 502 }
      );
    }

    return NextResponse.json<StatusOkResponse>(
      { ok: true, invoice: payload },
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Failed to reach PSP-Core";

    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        error: "network_error",
        message,
        pspApiUrl: PSP_API_URL,
      },
      { status: 502 }
    );
  }
}
