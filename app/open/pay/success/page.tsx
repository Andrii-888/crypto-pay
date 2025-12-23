// app/open/pay/success/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

type PspInvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

interface PspInvoice {
  id: string;
  createdAt?: string | null;
  expiresAt: string;

  fiatAmount: number;
  fiatCurrency: string;

  cryptoAmount: number;
  cryptoCurrency: string;

  status: PspInvoiceStatus;
  paymentUrl: string;

  network?: string | null;

  txHash?: string | null;
  walletAddress?: string | null;
  txStatus?: "pending" | "detected" | "confirmed" | null;

  confirmations?: number | null;
  requiredConfirmations?: number | null;

  detectedAt?: string | null;
  confirmedAt?: string | null;

  amlStatus?: "clean" | "dirty" | "unknown" | null;
  riskScore?: number | null;
  assetStatus?: "clean" | "dirty" | "unknown" | null;
  assetRiskScore?: number | null;
  decisionStatus?: "none" | "approved" | "rejected" | null;
  decisionReasonText?: string | null;
}

const PSP_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const POLL_MS = 2000;

function isFinalStatus(s?: PspInvoiceStatus | null) {
  return s === "confirmed" || s === "expired" || s === "rejected";
}

function formatMoney(amount: number, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

function statusUi(status?: PspInvoiceStatus) {
  switch (status) {
    case "confirmed":
      return {
        title: "Payment confirmed",
        subtitle: "Your crypto payment was received and confirmed.",
        badge: "Confirmed",
        badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "waiting":
      return {
        title: "Payment processing",
        subtitle:
          "We’re still waiting for on-chain confirmation. This page will update automatically.",
        badge: "Waiting",
        badgeCls: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "expired":
      return {
        title: "Payment expired",
        subtitle:
          "This payment link has expired. Please return to the store and create a new payment.",
        badge: "Expired",
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
      };
    case "rejected":
      return {
        title: "Payment rejected",
        subtitle:
          "The payment was rejected by the provider. Please return to the store and try again.",
        badge: "Rejected",
        badgeCls: "bg-rose-50 text-rose-800 border-rose-200",
      };
    default:
      return {
        title: "Payment status",
        subtitle:
          "This page shows the invoice state from the payment provider and updates automatically.",
        badge: "Unknown",
        badgeCls: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export default function CryptoPaySuccessPage() {
  const sp = useSearchParams();
  const invoiceId = sp.get("invoiceId")?.trim() || "";

  const [invoice, setInvoice] = useState<PspInvoice | null>(null);
  const [loading, setLoading] = useState(Boolean(invoiceId));
  const [hint, setHint] = useState<string | null>(null);

  const stopRef = useRef(false);

  const ui = useMemo(() => statusUi(invoice?.status), [invoice?.status]);

  // polling
  useEffect(() => {
    stopRef.current = false;

    if (!invoiceId) {
      setLoading(false);
      setHint("Tip: open this page as /open/pay/success?invoiceId=...");
      return;
    }

    if (!PSP_API_URL) {
      setLoading(false);
      setHint("NEXT_PUBLIC_API_URL is not set on Vercel.");
      return;
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (stopRef.current) return;

      try {
        const res = await fetch(
          `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const data = (await res.json()) as PspInvoice;
          if (data?.id) {
            setInvoice(data);
            setHint(null);
          }
        } else {
          // не спамим красным — просто оставим подсказку
          setHint("Provider data is not available yet.");
        }
      } catch {
        setHint("Provider is temporarily unavailable.");
      } finally {
        setLoading(false);
      }

      // останавливаем polling только когда:
      // 1) статус финальный И 2) есть txHash или txStatus уже не pending
      const s = invoice?.status;
      const txReady =
        Boolean(invoice?.txHash) ||
        (invoice?.txStatus && invoice?.txStatus !== "pending");

      if (isFinalStatus(s) && txReady) return;

      timeout = setTimeout(tick, POLL_MS);
    };

    void tick();

    return () => {
      stopRef.current = true;
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 lg:py-12">
        {/* Header */}
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-base font-semibold text-emerald-700">✓</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {ui.title}
          </h1>

          <p className="mt-2 max-w-sm mx-auto text-xs text-slate-500">
            {ui.subtitle}
          </p>

          {loading ? (
            <p className="mt-2 text-[11px] text-slate-400">
              Loading provider data…
            </p>
          ) : null}
        </header>

        {/* Summary card */}
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Invoice</span>
            <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
              {invoiceId || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Payment status</span>
            <span
              className={`inline-flex items-center gap-2 h-7 px-3 rounded-full border text-xs font-medium ${ui.badgeCls}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              <span className="whitespace-nowrap leading-none">{ui.badge}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Fiat amount</span>
            <span className="text-slate-900 tabular-nums">
              {invoice
                ? formatMoney(invoice.fiatAmount, invoice.fiatCurrency)
                : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Crypto amount</span>
            <span className="text-slate-900 tabular-nums">
              {invoice
                ? formatMoney(invoice.cryptoAmount, invoice.cryptoCurrency)
                : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Network</span>
            <span className="text-slate-900">{invoice?.network ?? "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tx hash</span>
            <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
              {invoice?.txHash ?? "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Wallet</span>
            <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
              {invoice?.walletAddress ?? "—"}
            </span>
          </div>

          {hint ? (
            <p className="pt-1 text-[11px] text-slate-400">
              {hint}{" "}
              {PSP_API_URL ? (
                <>
                  (API: <span className="font-mono">{PSP_API_URL}</span>)
                </>
              ) : null}
            </p>
          ) : null}
        </section>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-black"
          >
            ← Back to demo store
          </Link>
        </div>
      </div>
    </main>
  );
}
