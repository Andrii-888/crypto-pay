// app/api/payments/simulate-paid/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { invoiceId } = await req.json();

  if (!invoiceId) {
    return NextResponse.json(
      { ok: false, error: "invoiceId required" },
      { status: 400 }
    );
  }

  const r = await fetch(
    `${process.env.PSP_API_URL}/invoices/${invoiceId}/tx/confirm`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.PSP_API_KEY!,
      },
      body: JSON.stringify({
        txHash: "0xFAKE_TX_HASH",
        walletAddress: "TFAKE_TRON_ADDRESS",
        confirmations: 1,
      }),
    }
  );

  const data = await r.json();
  return NextResponse.json({ ok: true, data });
}
