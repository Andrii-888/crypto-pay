// app/api/payments/status/route.ts
import { NextResponse } from "next/server";
import { invoiceStore, type InvoiceStatus } from "@/lib/invoiceStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get("invoiceId");

  if (!invoiceId) {
    return NextResponse.json(
      { ok: false, error: "Missing invoiceId" },
      { status: 400 }
    );
  }

  const invoice = invoiceStore.get(invoiceId);

  if (!invoice) {
    return NextResponse.json(
      { ok: false, error: "Invoice not found" },
      { status: 404 }
    );
  }

  // Базовый статус из store
  let status: InvoiceStatus = invoice.status;

  // Авто-экспирация по времени
  const expiresAtMs = Date.parse(invoice.expiresAt);
  const now = Date.now();

  if (
    status === "waiting" &&
    Number.isFinite(expiresAtMs) &&
    expiresAtMs <= now
  ) {
    status = "expired";

    // Обновляем статус в in-memory store,
    // чтобы следующие запросы сразу видели "expired"
    invoice.status = "expired";
    invoiceStore.set(invoiceId, invoice);
  }

  return NextResponse.json({
    ok: true as const,
    invoiceId,
    status,
    expiresAt: invoice.expiresAt,
  });
}
