// app/open/pay/success/page.tsx
import Link from "next/link";
import type { InvoiceData } from "@/lib/invoiceStore";

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type PspInvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

interface PspInvoice {
  id: string;
  createdAt: string;
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
  merchantId?: string | null;
}

type PageProps = {
  searchParams?: Promise<{
    invoiceId?: string | string[];
  }>;
};

function normalizeParam(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

async function fetchInvoiceFromPsp(
  invoiceId: string
): Promise<PspInvoice | null> {
  if (!PSP_API_URL) return null;

  try {
    const res = await fetch(
      `${PSP_API_URL.replace(/\/+$/, "")}/invoices/${invoiceId}`,
      {
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as PspInvoice;
  } catch {
    return null;
  }
}

function formatMoney(amount: number, currency: string) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return `${amount} ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

export default async function CryptoPaySuccessPage(props: PageProps) {
  const sp = (await props.searchParams) ?? {};
  const invoiceId = normalizeParam(sp.invoiceId);

  const pspInvoice = invoiceId ? await fetchInvoiceFromPsp(invoiceId) : null;

  // Нормализуем в общую структуру (если надо будет использовать дальше)
  const invoice: InvoiceData | null = pspInvoice
    ? {
        invoiceId: pspInvoice.id,
        fiatAmount: Number(pspInvoice.fiatAmount),
        fiatCurrency: pspInvoice.fiatCurrency,
        cryptoAmount: Number(pspInvoice.cryptoAmount),
        cryptoCurrency: pspInvoice.cryptoCurrency,
        status: pspInvoice.status,
        expiresAt: pspInvoice.expiresAt,
        paymentUrl: pspInvoice.paymentUrl,
      }
    : null;

  const statusLabel =
    invoice?.status === "confirmed"
      ? "Completed"
      : invoice?.status === "waiting"
      ? "Waiting confirmation"
      : invoice?.status === "expired"
      ? "Expired"
      : invoice?.status === "rejected"
      ? "Rejected"
      : "Unknown";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 lg:py-12">
        {/* Header */}
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-base font-semibold text-emerald-700">✓</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Payment received (demo)
          </h1>

          <p className="mt-2 max-w-sm mx-auto text-xs text-slate-500">
            This screen shows the final invoice state. In production, customers
            are redirected here only after the Swiss partner confirms the
            on-chain payment.
          </p>
        </header>

        {/* Summary card */}
        <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Invoice</span>
            <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
              {invoiceId ?? "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Payment status</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Fiat amount</span>
            <span className="text-slate-900">
              {invoice
                ? formatMoney(invoice.fiatAmount, invoice.fiatCurrency)
                : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Crypto amount</span>
            <span className="text-slate-900">
              {invoice
                ? formatMoney(invoice.cryptoAmount, invoice.cryptoCurrency)
                : "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Network</span>
            <span className="text-slate-900">{pspInvoice?.network ?? "—"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tx hash</span>
            <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
              {pspInvoice?.txHash ?? "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Wallet</span>
            <span className="font-mono text-[11px] text-slate-900 truncate max-w-[60%]">
              {pspInvoice?.walletAddress ?? "—"}
            </span>
          </div>

          {!invoiceId && (
            <p className="pt-1 text-[11px] text-rose-500">
              Missing <span className="font-mono">invoiceId</span> in URL. This
              page should be opened as:
              <span className="font-mono">
                {" "}
                /open/pay/success?invoiceId=...
              </span>
            </p>
          )}

          {invoiceId && !invoice && (
            <p className="pt-1 text-[11px] text-rose-500">
              Invoice not found in PSP-core (check that PSP-core is running and
              NEXT_PUBLIC_API_URL is correct).
            </p>
          )}
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
