// src/components/demo/PaymentMethods.tsx

type PaymentMethodsProps = {
  hasItems: boolean;
  cartTotal: number;
};

export function PaymentMethods({ hasItems, cartTotal }: PaymentMethodsProps) {
  function handleCryptoClick() {
    if (!hasItems) return;
    // Переход на страницу /checkout с суммой в query
    window.location.href = `/checkout?amount=${cartTotal.toFixed(2)}`;
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Payment methods
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Only Crypto Pay is active in this prototype.
        </p>
      </div>

      <div className="space-y-2">
        {/* Card - disabled */}
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-400 shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-[13px]">
              💳
            </span>
            <span className="font-medium">Pay by card (coming soon)</span>
          </span>
          <span className="text-[10px]">••••</span>
        </button>

        {/* Bank transfer - disabled */}
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center justify-between rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-400 shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200 text-[13px]">
              🏦
            </span>
            <span className="font-medium">Bank transfer (coming soon)</span>
          </span>
          <span className="text-[10px]">IBAN</span>
        </button>

        {/* Crypto Pay - active */}
        <button
          type="button"
          onClick={handleCryptoClick}
          disabled={!hasItems}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition ${
            hasItems
              ? "bg-black text-white hover:bg-gray-900"
              : "cursor-not-allowed bg-gray-900/10 text-gray-400"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[10px] font-bold">
              ₿
            </span>
            <span className="flex flex-col text-left">
              <span>Pay with Crypto (CryptoPay)</span>
              <span className="text-[10px] font-normal text-slate-300">
                Official crypto-friendly method for this store
              </span>
            </span>
          </span>
          <span className="text-[10px]">{hasItems ? "→" : ""}</span>
        </button>
      </div>

      <p className="text-[10px] leading-relaxed text-slate-400">
        By choosing Crypto Pay you still pay the online store. Crypto payment is
        processed by a Swiss crypto-friendly payment partner and settled to the
        merchant in fiat (demo).
      </p>
    </div>
  );
}
