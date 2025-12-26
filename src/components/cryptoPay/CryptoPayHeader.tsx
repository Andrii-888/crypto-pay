// src/components/cryptoPay/CryptoPayHeader.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type CryptoPayHeaderProps = {
  invoiceId: string;
};

export function CryptoPayHeader({ invoiceId }: CryptoPayHeaderProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(invoiceId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <header className="mb-8 space-y-3">
      {/* Top row: Back + context */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
        >
          <span className="text-sm">←</span>
          <span>Back to store</span>
        </button>

        <div className="flex items-center gap-2 text-[12px] text-slate-600">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-semibold">
            MB
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-700">Maria Busyhina</span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              Logged in
            </span>
          </div>
        </div>
      </div>

      {/* Main title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Crypto Pay checkout
        </h1>

        {/* Invoice badge + copy */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span>Invoice ID:</span>
          <span className="font-mono px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700">
            {invoiceId}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50 transition"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Trust explanation */}
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
          You are paying for your order from your personal account. This payment
          will be automatically matched to your account and order using the
          invoice reference above. The crypto transaction is securely processed
          by a Swiss-licensed partner.
        </p>
      </div>
    </header>
  );
}
