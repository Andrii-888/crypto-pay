// app/api/payments/status/route.ts
import { NextResponse } from "next/server";

const PSP_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

type InvoiceStatus =
  | "waiting"
  | "pending"
  | "confirmed"
  | "expired"
  | "rejected";

type OkResponse = {
  ok: true;
  invoiceId: string;
  status: InvoiceStatus;
  expiresAt?: string;
};

type ErrResponse = {
  ok: false;
  error: string;
  details?: string;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");

  if (!invoiceId) {
    const res: ErrResponse = { ok: false, error: "Missing invoiceId" };
    return NextResponse.json(res, { status: 400 });
  }

  if (!PSP_API_URL) {
    const res: ErrResponse = {
      ok: false,
      error: "PSP_API_URL is empty",
      details: "Set NEXT_PUBLIC_API_URL (e.g. http://localhost:3000)",
    };
    return NextResponse.json(res, { status: 500 });
  }

  try {
    const pspRes = await fetch(
      `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`,
      {
        cache: "no-store",
      }
    );

    if (!pspRes.ok) {
      const txt = await pspRes.text().catch(() => "");
      const res: ErrResponse = {
        ok: false,
        error: `PSP responded ${pspRes.status}`,
        details: txt || undefined,
      };
      return NextResponse.json(res, { status: 502 });
    }

    const data = (await pspRes.json().catch(() => ({}))) as {
      id?: string;
      status?: InvoiceStatus;
      expiresAt?: string;
    };

    const res: OkResponse = {
      ok: true,
      invoiceId: data.id ?? invoiceId,
      status: data.status ?? "waiting",
      expiresAt: data.expiresAt,
    };

    return NextResponse.json(res, { status: 200 });
  } catch (e) {
    const res: ErrResponse = {
      ok: false,
      error: "Fetch failed",
      details: e instanceof Error ? e.message : "Unknown error",
    };
    return NextResponse.json(res, { status: 502 });
  }
}
