// src/lib/pspEnv.ts
// Server-only helper for PSP env vars (do NOT import from client components)

export type PspEnv = {
  apiUrl: string;
  merchantId: string;
  apiKey: string;
};

/**
 * Reads and validates PSP env vars.
 * - apiUrl is normalized (no trailing slashes)
 * - values are trimmed
 * - throws Error with clear message if something is missing
 */
export function getPspEnv(): PspEnv {
  const apiUrlRaw = (process.env.PSP_API_URL ?? "").trim();
  const merchantId = (process.env.PSP_MERCHANT_ID ?? "").trim();
  const apiKey = (process.env.PSP_API_KEY ?? "").trim();

  const apiUrl = apiUrlRaw.replace(/\/+$/, "");

  const missing: string[] = [];
  if (!apiUrl) missing.push("PSP_API_URL");
  if (!merchantId) missing.push("PSP_MERCHANT_ID");
  if (!apiKey) missing.push("PSP_API_KEY");

  if (missing.length) {
    throw new Error(
      `Missing required PSP env var(s): ${missing.join(
        ", "
      )}. Set them in .env.local and restart the dev server.`
    );
  }

  return { apiUrl, merchantId, apiKey };
}
