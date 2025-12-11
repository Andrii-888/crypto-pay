// src/components/cryptoPay/CryptoPayHeader.tsx

type CryptoPayHeaderProps = {
  invoiceId: string;
};

export function CryptoPayHeader({ invoiceId }: CryptoPayHeaderProps) {
  return (
    <header className="mb-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Crypto Pay checkout
      </h1>

      {/* Invoice badge */}
      <div className="mt-3 text-[11px] text-slate-500">
        Invoice ID:
        <span className="font-mono ml-1 px-1.5 py-0.5 rounded-md border border-slate-200 bg-white text-slate-700">
          {invoiceId}
        </span>
      </div>

      {/* Доверительный маленький подзаголовок */}
      <p className="mt-3 text-xs text-center text-slate-500 leading-relaxed max-w-sm mx-auto">
        You are paying for your order at{" "}
        <span className="font-medium text-slate-700">Your Store</span> using{" "}
        <span className="font-medium text-slate-700">Crypto&nbsp;Pay</span> —
        the store’s crypto-friendly payment method. The crypto transaction is
        securely processed by a Swiss-licensed partner while the merchant
        receives the fiat amount.
      </p>
    </header>
  );
}
