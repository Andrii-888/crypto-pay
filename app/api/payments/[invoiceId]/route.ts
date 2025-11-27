import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    invoiceId: string;
  }>;
};

// GET /api/payments/[invoiceId]
export async function GET(
  _request: Request,
  context: RouteContext
): Promise<NextResponse> {
  const { invoiceId } = await context.params;

  // 👇 Пока что это мок-данные.
  // Позже заменим на реальные из БД / партнёра.
  const mockInvoice = {
    invoiceId,
    fiatCurrency: "EUR",
    fiatAmount: 777, // ← поставь другое число
    cryptoCurrency: "BTC",
    cryptoAmount: 0.0099,
    status: "waiting",
    expiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
  };

  return NextResponse.json(mockInvoice);
}
