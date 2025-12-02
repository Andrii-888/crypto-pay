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
        <span className="text-sm text-slate-500">Order amount</span>
        <span className="text-lg font-semibold text-slate-900">
          {fiatCurrency} {fiatAmount.toFixed(2)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">To pay in crypto</span>
        <span className="text-base font-semibold text-slate-900">
          {cryptoAmount.toFixed(2)} {cryptoCurrency}
        </span>
      </div>

      <p className="text-[11px] text-slate-400">
        The final crypto amount is calculated based on the current rate. In
        production this value is locked by the Swiss payment provider.
      </p>
    </section>
  );
}
