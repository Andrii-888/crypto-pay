import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    PSP_API_URL: process.env.PSP_API_URL ?? null,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? null,
    PSP_API_KEY: process.env.PSP_API_KEY ? "SET" : "EMPTY",
    NODE_ENV: process.env.NODE_ENV ?? null,
  });
}
