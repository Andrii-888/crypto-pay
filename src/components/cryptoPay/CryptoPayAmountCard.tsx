// src/components/cryptoPay/CryptoPayAmountCard.tsx

type CryptoPayAmountCardProps = {
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAmount: number;
  cryptoCurrency: string;
};

export function CryptoPayAmountCard({
  fiatAmount,
  fiatCurrency,
  cryptoAmount,
  cryptoCurrency,
}: CryptoPayAmountCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-black">Order amount</span>

        <span className="flex items-baseline gap-2 text-base font-semibold text-slate-900 tabular-nums">
          <span>{fiatAmount.toFixed(2)}</span>
          <span className="text-slate-700">{fiatCurrency}</span>
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-black">To pay in crypto</span>

        <span className="flex items-baseline gap-2 text-base font-semibold text-slate-900 tabular-nums">
          <span>{cryptoAmount.toFixed(2)}</span>
          <span className="text-slate-700">{cryptoCurrency}</span>
        </span>
      </div>

      <p className="text-[11px] text-slate-400">
        The final crypto amount is calculated based on the current rate. In
        production this value is locked by the Swiss payment provider.
      </p>
    </section>
  );
}
