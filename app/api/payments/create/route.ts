// src/app/api/payments/create/route.ts

import { NextRequest, NextResponse } from "next/server";

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL;

// Этот хэндлер вызывается фронтом, когда магазин создаёт платёж.
// Мы просто прокидываем данные дальше в наш backend psp-core.
export async function POST(request: NextRequest) {
  try {
    if (!PSP_API_URL) {
      return NextResponse.json(
        { error: "PSP API URL is not configured" },
        { status: 500 }
      );
    }

    // Тело запроса, которое пришло от фронта (сумма, валюта и т.п.)
    const body = await request.json();

    // Формируем данные, которые ждёт psp-core.
    // Минимально: fiatAmount, fiatCurrency, cryptoCurrency.
    const payload = {
      fiatAmount: body.fiatAmount,
      fiatCurrency: body.fiatCurrency ?? "EUR",
      cryptoCurrency: body.cryptoCurrency ?? "USDT",
    };

    const res = await fetch(`${PSP_API_URL}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(
        "[create payment] PSP-core error:",
        res.status,
        await res.text()
      );
      return NextResponse.json(
        { error: "Failed to create invoice in PSP-core" },
        { status: 502 }
      );
    }

    const invoice = await res.json();

    // Просто возвращаем инвойс дальше на фронт.
    return NextResponse.json(invoice);
  } catch (error) {
    console.error("[create payment] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unexpected error while creating invoice" },
      { status: 500 }
    );
  }
}
