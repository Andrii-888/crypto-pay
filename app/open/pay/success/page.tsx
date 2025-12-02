// app/open/pay/success/page.tsx

export default function CryptoPaySuccessPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-10 lg:py-12">
        {/* Back to store */}
        <div className="mb-4">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition"
          >
            <span className="text-sm">←</span>
            <span>Back to store</span>
          </a>
        </div>

        {/* Header */}
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-base font-semibold text-emerald-700">✓</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Payment received (demo)
          </h1>
          <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
            This screen simulates a successful Crypto Pay transaction. In
            production, you would redirect the customer here after the Swiss
            payment provider confirms the on-chain payment.
          </p>
        </header>

        {/* Summary card */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Payment status</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Completed (demo)
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500">Payment method</span>
            <span className="text-slate-900 ">Crypto Pay</span>
          </div>

          <p className="pt-1 text-[11px] text-slate-400">
            In a real setup, this block can show the final crypto amount,
            network used, transaction hash and the internal order ID from your
            e-commerce system.
          </p>
        </section>

        {/* Next steps */}
        <section className="mt-6 space-y-3 text-[11px] text-slate-500">
          <p>
            For this demo, no real payment is processed and no funds are moved.
            The goal is to show the customer experience from cart → checkout →
            crypto payment → success.
          </p>
          <p>
            In production, this page is typically shown only after a webhook
            callback from the Swiss-licensed provider confirms that the
            transaction is safely received and matched to your order.
          </p>
        </section>

        {/* CTA buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-black transition"
          >
            Back to demo store
          </a>
          <a
            href="/checkout"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Start a new demo payment
          </a>
        </div>
      </div>
    </main>
  );
}
