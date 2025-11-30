// src/components/demo/CartSummary.tsx

type CartSummaryProps = {
  cartTotal: number;
  cartCount: number;
};

export function CartSummary({ cartTotal, cartCount }: CartSummaryProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Cart summary</h2>
        <span className="text-xs text-slate-500">
          {cartCount} item{cartCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">Total</span>
        <span className="text-lg font-semibold text-slate-900">
          €{cartTotal.toFixed(2)}
        </span>
      </div>
      <p className="text-xs text-slate-400">
        This is a demo store. Taxes, shipping and discounts are not applied.
      </p>
    </div>
  );
}
