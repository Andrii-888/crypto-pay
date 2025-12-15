// app/api/payments/simulate-paid/route.ts
import { NextResponse } from "next/server";

const PSP_API_URL = (
  process.env.PSP_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  ""
).replace(/\/+$/, "");

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

type PspConfirmResponse = {
  id?: string;
  status?: string;
  message?: string;
  error?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as {
      invoiceId?: string;
    } | null;
    const invoiceId = body?.invoiceId?.trim();

    if (!invoiceId) {
      const res: ErrorBody = { ok: false, error: "Missing invoiceId" };
      return NextResponse.json(res, { status: 400 });
    }

    if (!PSP_API_URL) {
      const res: ErrorBody = {
        ok: false,
        error: "PSP_API_URL is empty",
        details: "Set PSP_API_URL (preferred) or NEXT_PUBLIC_API_URL",
      };
      return NextResponse.json(res, { status: 500 });
    }

    const confirmRes = await fetch(
      `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}/confirm`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    const contentType = confirmRes.headers.get("content-type") || "";
    const data: PspConfirmResponse = contentType.includes("application/json")
      ? ((await confirmRes.json().catch(() => ({}))) as PspConfirmResponse)
      : {};

    const res: SuccessBody = {
      ok: true,
      invoiceId: data.id ?? invoiceId,
      status: data.status ?? "confirmed",
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
