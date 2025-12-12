type CryptoPayHeaderProps = {
  invoiceId: string;
};

export function CryptoPayHeader({ invoiceId }: CryptoPayHeaderProps) {
  return (
    <header className="mb-8 text-center space-y-3">
      {/* Account context */}
      <div className="flex items-center justify-center gap-2 text-[12px] text-slate-600">
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

      {/* Main title */}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Crypto Pay checkout
      </h1>

      {/* Invoice badge */}
      <div className="text-[11px] text-slate-500">
        Invoice ID:
        <span className="font-mono ml-1 px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700">
          {invoiceId}
        </span>
      </div>

      {/* Trust explanation */}
      <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
        You are paying for your order from your personal account. This payment
        will be automatically matched to your account and order using the
        invoice reference above. The crypto transaction is securely processed by
        a Swiss-licensed partner.
      </p>
    </header>
  );
}
