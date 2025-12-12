// app/api/payments/simulate-paid/route.ts
import { NextResponse } from "next/server";

const PSP_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

type SuccessBody = {
  ok: true;
  invoiceId: string;
  status: string;
};

type ErrorBody = {
  ok: false;
  error: string;
  details?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      invoiceId?: string;
    } | null;

    const invoiceId = body?.invoiceId;

    if (!invoiceId) {
      const res: ErrorBody = { ok: false, error: "Missing invoiceId" };
      return NextResponse.json(res, { status: 400 });
    }

    if (!PSP_API_URL) {
      const res: ErrorBody = {
        ok: false,
        error: "PSP_API_URL is empty",
        details: "Set NEXT_PUBLIC_API_URL=http://localhost:3000",
      };
      return NextResponse.json(res, { status: 500 });
    }

    // ✅ Реально подтверждаем инвойс в psp-core
    const confirmRes = await fetch(
      `${PSP_API_URL}/invoices/${invoiceId}/confirm`,
      {
        method: "POST",
      }
    );

    if (!confirmRes.ok) {
      const txt = await confirmRes.text().catch(() => "");
      const res: ErrorBody = {
        ok: false,
        error: `PSP confirm failed (${confirmRes.status})`,
        details: txt || undefined,
      };
      return NextResponse.json(res, { status: 502 });
    }

    const data = (await confirmRes.json().catch(() => null)) as any;

    const res: SuccessBody = {
      ok: true,
      invoiceId: data?.id ?? invoiceId,
      status: data?.status ?? "confirmed",
    };

    return NextResponse.json(res, { status: 200 });
  } catch (e) {
    const res: ErrorBody = {
      ok: false,
      error: "Internal error",
      details: e instanceof Error ? e.message : "Unknown error",
    };
    return NextResponse.json(res, { status: 500 });
  }
}
