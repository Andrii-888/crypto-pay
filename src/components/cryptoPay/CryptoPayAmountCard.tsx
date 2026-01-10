// src/components/cryptoPay/CryptoPayAmountCard.tsx

type CryptoPayAmountCardProps = {
  fiatAmount?: number | string | null;
  fiatCurrency?: string | null;
  cryptoAmount?: number | string | null;
  cryptoCurrency?: string | null;
};

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;

  if (typeof v === "string") {
    const s = v.trim().replace(",", ".");
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function formatAmount(v: unknown, digits: number): string {
  const n = toNumber(v);
  if (n === null) return "—";
  return n.toFixed(digits);
}

function formatText(v: unknown): string {
  if (typeof v !== "string") return "—";
  const s = v.trim();
  return s ? s : "—";
}

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
          <span>{formatAmount(fiatAmount, 2)}</span>
          <span className="text-slate-700">{formatText(fiatCurrency)}</span>
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-black">To pay in crypto</span>

        <span className="flex items-baseline gap-2 text-base font-semibold text-slate-900 tabular-nums">
          {/* crypto amount часто приходит строкой и требует больше точности */}
          <span>{formatAmount(cryptoAmount, 6)}</span>
          <span className="text-slate-700">{formatText(cryptoCurrency)}</span>
        </span>
      </div>

      <p className="text-[11px] text-slate-400">
        The final crypto amount is calculated based on the current rate. In
        production this value is locked by the Swiss payment provider.
      </p>
    </section>
  );
}
