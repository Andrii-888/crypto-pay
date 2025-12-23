// app/api/payments/simulate-paid/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

const PSP_API_URL = (process.env.PSP_API_URL ?? "").replace(/\/+$/, "");

type ErrorBody = { ok: false; error: string; details?: string };

function makeDeterministicTxHash(invoiceId: string): string {
  return "0x" + crypto.createHash("sha256").update(invoiceId).digest("hex");
}

function makeDemoWalletAddress(invoiceId: string): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = crypto
    .createHash("sha256")
    .update(`wallet:${invoiceId}`)
    .digest();
  let out = "T";
  for (let i = 0; i < 33; i++)
    out += alphabet[bytes[i % bytes.length] % alphabet.length];
  return out;
}

async function safeText(res: Response) {
  return await res.text().catch(() => "");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      invoiceId?: string;
    } | null;
    const invoiceId = body?.invoiceId?.trim();

    if (!invoiceId) {
      return NextResponse.json(
        { ok: false, error: "Missing invoiceId" } satisfies ErrorBody,
        { status: 400 }
      );
    }

    if (!PSP_API_URL) {
      return NextResponse.json(
        {
          ok: false,
          error: "PSP_API_URL is empty",
          details: "Set PSP_API_URL on Vercel (Server env)",
        } satisfies ErrorBody,
        { status: 500 }
      );
    }

    const txHash = makeDeterministicTxHash(invoiceId);
    const walletAddress = makeDemoWalletAddress(invoiceId);
    const network = "TRON";

    // 1) DETECTED
    const detectedRes = await fetch(`${PSP_API_URL}/providers/tx/detected`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId, txHash, network, walletAddress }),
      cache: "no-store",
    });

    if (!detectedRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `PSP detected failed (${detectedRes.status})`,
          details: await safeText(detectedRes),
        } satisfies ErrorBody,
        { status: 502 }
      );
    }

    // 2) CONFIRM
    const confirmRes = await fetch(
      `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}/tx/confirm`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmations: 1 }),
        cache: "no-store",
      }
    );

    if (!confirmRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `PSP confirm failed (${confirmRes.status})`,
          details: await safeText(confirmRes),
        } satisfies ErrorBody,
        { status: 502 }
      );
    }

    // 3) IMPORTANT: сразу читаем invoice назад и отдаём фронту фактические поля
    const invoiceRes = await fetch(
      `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`,
      {
        cache: "no-store",
      }
    );

    if (!invoiceRes.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `PSP fetch invoice failed (${invoiceRes.status})`,
          details: await safeText(invoiceRes),
        } satisfies ErrorBody,
        { status: 502 }
      );
    }

    const invoice = await invoiceRes.json();

    return NextResponse.json(
      {
        ok: true,
        invoiceId,
        txHash,
        walletAddress,
        invoice, // 👈 вот тут ты увидишь txHash/walletAddress прямо в ответе
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error",
        details: e instanceof Error ? e.message : "Unknown error",
      } satisfies ErrorBody,
      { status: 500 }
    );
  }
}
