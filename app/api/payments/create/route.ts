import { NextResponse } from "next/server";

type SupportedCrypto = "USDT" | "USDC";

type CreatePaymentBody = {
  orderId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: SupportedCrypto; // USDT | USDC
};

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = (await req.json()) as CreatePaymentBody;

    const { orderId, fiatAmount, fiatCurrency, cryptoCurrency } = body;

    if (!orderId || !fiatAmount || !fiatCurrency || !cryptoCurrency) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // ВСТАВЛЯЕМ валюту в invoiceId
    const invoiceId = `inv_${cryptoCurrency.toLowerCase()}_${Date.now()}`;

    // 1:1 для демо
    const cryptoAmount = fiatAmount;

    const paymentUrl = `/open/pay/${invoiceId}`;

    const invoice = {
      invoiceId,
      orderId,
      fiatAmount,
      fiatCurrency,
      cryptoCurrency,
      cryptoAmount,
      status: "waiting" as const,
      expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      paymentUrl,
    };

    return NextResponse.json(invoice);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
