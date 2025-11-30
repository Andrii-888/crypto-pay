// src/components/demo/ProductCard.tsx

import type { Product } from "./demoCartTypes";

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAddToCart(product)}
      className="
        group flex flex-col
        rounded-2xl border border-slate-200
        bg-white/95
        shadow-sm
        hover:shadow-2xl
        hover:-translate-y-1.5
        hover:border-sky-300/70
        hover:ring-1 hover:ring-sky-300/60
        transition-all duration-200 ease-out
        text-left overflow-hidden
        transform-gpu
      "
    >
      {/* Верхний блок с картинкой */}
      <div className="w-full h-32 sm:h-36 bg-slate-900 flex items-center justify-center relative overflow-hidden">
        {/* Мягкий блик сверху — через arbitrary property (Tailwind 4) */}
        <div className="pointer-events-none absolute inset-0 [background:linear-gradient(to_bottom,rgba(255,255,255,0.12),rgba(0,0,0,0.3))]" />

        <img
          src={product.imageSrc}
          alt={product.name}
          className="
            relative
            h-full w-full
            object-contain
            p-3
            transition-transform duration-200 ease-out
            group-hover:scale-110 group-active:scale-100
          "
        />
      </div>

      {/* Контент */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-900 line-clamp-2">
            {product.name}
          </h2>

          <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">
            €{product.price.toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className="
              inline-flex items-center
              rounded-full
              bg-slate-100
              px-2.5 py-1
              text-[11px] font-medium text-slate-700
              group-hover:bg-slate-900 group-hover:text-white
              transition-colors duration-150
            "
          >
            Tap to add to cart
          </span>

          <span className="text-[11px] text-slate-400 group-hover:text-slate-600">
            + Add item
          </span>
        </div>
      </div>
    </button>
  );
}
