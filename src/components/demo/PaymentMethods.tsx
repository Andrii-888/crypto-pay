// src/components/demo/PaymentMethods.tsx

type PaymentMethodsProps = {
  hasItems: boolean;
  cartTotal: number;
};

export function PaymentMethods({ hasItems, cartTotal }: PaymentMethodsProps) {
  function handleCryptoClick() {
    if (!hasItems) return;
    window.location.href = `/checkout?amount=${cartTotal.toFixed(2)}`;
  }

  const infoHref =
    cartTotal > 0
      ? `/crypto-payment-info?amount=${cartTotal.toFixed(2)}`
      : `/crypto-payment-info`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Payment methods
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          In this demo only Crypto Pay is active. Other methods are
          placeholders.
        </p>
      </div>

      {/* 🔐 Info link (always visible, before any payment actions) */}
      <a href={infoHref} className="crypto-info-link">
        <div className="crypto-info-link-inner">
          <span className="crypto-info-link-left">
            <span className="crypto-info-link-icon">ⓘ</span>
            <span>How crypto payments are verified &amp; protected</span>
          </span>
          <span className="crypto-info-link-arrow">→</span>
        </div>
      </a>

      <div className="space-y-2">
        {/* Crypto Pay - active */}
        <button
          type="button"
          onClick={handleCryptoClick}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
            hasItems
              ? "bg-black text-white hover:bg-gray-900"
              : "bg-gray-900/10 text-gray-400 cursor-not-allowed"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-full border border-white/20 bg-white/10 flex items-center justify-center text-[10px] font-bold">
              ₿
            </span>
            <span className="flex flex-col text-left">
              <span>Pay with Crypto</span>
              <span className="text-[10px] font-normal opacity-75">
                Crypto Pay · Crypto-friendly checkout
              </span>
            </span>
          </span>
          <span className="text-[10px]">{hasItems ? "→" : ""}</span>
        </button>
        {/* Bank transfer - disabled */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-400 cursor-not-allowed shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center text-[13px]">
              🏦
            </span>
            <span className="font-medium">Bank transfer (coming soon)</span>
          </span>
          <span className="text-[10px]">IBAN</span>
        </button>
        {/* Card - disabled */}
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-400 cursor-not-allowed shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-md bg-gray-200 flex items-center justify-center text-[13px]">
              💳
            </span>
            <span className="font-medium">Pay by card (coming soon)</span>
          </span>
          <span className="text-[10px]">••••</span>
        </button>
      </div>

      <p className="text-[10px] text-slate-400 leading-relaxed">
        This store uses Crypto Pay as a crypto-friendly checkout powered by a
        Swiss PSP (demo only, no real funds are moved).
      </p>
    </div>
  );
}
