// crypto-pay: src/app/api/debug/env/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = req.headers.get("x-debug-token");
  const expected = process.env.DEBUG_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const has = (key: string) =>
    Boolean(process.env[key] && String(process.env[key]).trim().length > 0);

  return NextResponse.json({
    ok: true,
    env: {
      PSP_API_URL: has("PSP_API_URL"),
      PSP_MERCHANT_ID: has("PSP_MERCHANT_ID"),
      PSP_API_KEY: has("PSP_API_KEY"),
      PROVIDER_TX_SECRET: has("PROVIDER_TX_SECRET"),
    },
  });
}
