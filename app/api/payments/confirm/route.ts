// app/api/payments/confirm/route.ts
import { NextResponse } from "next/server";
import { getPspEnv } from "@/lib/pspEnv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUILD_STAMP = "confirm-route-v1-2026-02-14__TX_CONFIRM_PROXY";

type ConfirmBody = {
  invoiceId?: string;
  txHash?: string;
  walletAddress?: string | null;
  payCurrency?: string | null; // e.g. usdttrc20
  network?: string | null; // e.g. TRON
};

type ErrResponse = {
  ok: false;
  buildStamp?: string;
  error: "bad_request" | "config" | "psp_core_error" | "network_error";
  message?: string;
  details?: string;
  pspApiUrl?: string;
  backendStatus?: string;
};

type OkResponse = {
  ok: true;
  buildStamp?: string;
  invoiceId?: string;
  backend: unknown;
};

function sliceDetails(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = typeof v === "string" ? v : JSON.stringify(v);
  return s ? s.slice(0, 2000) : undefined;
}

function safeStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function isHexTx(v: string): boolean {
  const s = String(v ?? "").trim();
  return /^(0x)?[0-9a-fA-F]{64}$/.test(s);
}

export async function POST(req: Request) {
  let body: ConfirmBody = {};
  try {
    body = (await req.json().catch(() => ({}))) as ConfirmBody;
  } catch {
    body = {};
  }

  const invoiceId = safeStr(body.invoiceId);
  const txHash = safeStr(body.txHash);
  const walletAddress = safeStr(body.walletAddress ?? "");
  const payCurrency = safeStr(body.payCurrency ?? "");
  const network = safeStr(body.network ?? "");

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

  if (!txHash || !isHexTx(txHash)) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Invalid txHash",
        details: "Expected 0x… hex string",
      },
      { status: 400 }
    );
  }

  // Centralized env validation
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

  // Provider secret for /providers/tx/detected
  const providerSecret = (process.env.PROVIDER_TX_SECRET ?? "").trim();
  if (!providerSecret) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "config",
        message: "Missing PROVIDER_TX_SECRET",
      },
      { status: 500 }
    );
  }

  if (!walletAddress) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Missing walletAddress",
        details: "Required to mark tx as detected in PSP-Core",
      },
      { status: 400 }
    );
  }

  if (!network) {
    return NextResponse.json<ErrResponse>(
      {
        ok: false,
        buildStamp: BUILD_STAMP,
        error: "bad_request",
        message: "Missing network",
        details: "Expected ETH or TRON",
      },
      { status: 400 }
    );
  }

  // 1) First, mark tx as DETECTED in PSP-Core (this attaches txHash + walletAddress)
  try {
    const detectedUrl = `${env.apiUrl}/providers/tx/detected`;
    await fetch(detectedUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-provider-secret": providerSecret,
      },
      body: JSON.stringify({
        invoiceId,
        txHash,
        walletAddress,
        network,
      }),
    });
  } catch {
    // best-effort: even if detected hook fails, we still try tx/confirm
  }

  const url = `${env.apiUrl}/invoices/${encodeURIComponent(
    invoiceId
  )}/tx/confirm`;

  // Send only what psp-core needs; extra fields are harmless if ignored.
  const payload = {
    txHash,
    walletAddress: walletAddress || null,
    payCurrency: payCurrency || null,
    network: network || null,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-merchant-id": env.merchantId,
        "x-api-key": env.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const contentType = r.headers.get("content-type") ?? "";
    const rawText = await r.text();

    let backendPayload: unknown = rawText;
    if (contentType.includes("application/json")) {
      try {
        backendPayload = JSON.parse(rawText) as unknown;
      } catch {
        backendPayload = rawText;
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
          details: sliceDetails(backendPayload),
          pspApiUrl: env.apiUrl,
        },
        { status }
      );
    }

    const out = NextResponse.json<OkResponse>(
      {
        ok: true,
        buildStamp: BUILD_STAMP,
        invoiceId,
        backend: backendPayload,
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
