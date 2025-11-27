import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const { invoiceId } = await context.params;

  // Вычисляем валюту из invoiceId
  const parts = invoiceId.split("_"); // ["inv", "usdt", "123456"]
  const currencyPart = parts[1]?.toUpperCase();

  const cryptoCurrency =
    currencyPart === "USDT" || currencyPart === "USDC" ? currencyPart : "USDT";

  const mockInvoice = {
    invoiceId,
    fiatCurrency: "EUR",
    fiatAmount: 120,
    cryptoCurrency, // USDT or USDC
    cryptoAmount: 120,
    status: "waiting" as const,
    expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
  };

  return NextResponse.json(mockInvoice);
}
