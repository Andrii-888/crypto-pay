import Link from "next/link";
import ClientSuccess from "./success/success.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: {
    invoiceId?: string | string[];
    debug?: string | string[];
  };
};

function normalizeParam(value?: string | string[]): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default function CryptoPaySuccessPage({ searchParams }: PageProps) {
  const invoiceId = (normalizeParam(searchParams.invoiceId) ?? "").trim();
  const debug = normalizeParam(searchParams.debug) === "1" ? "1" : undefined;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl px-4 py-10 lg:py-12">
        <ClientSuccess invoiceId={invoiceId} debug={debug} />

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
