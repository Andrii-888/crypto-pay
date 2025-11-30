import Image from "next/image";
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
        group flex flex-col items-stretch
        rounded-xl border border-slate-200 bg-white
        shadow-sm
        hover:shadow-md hover:border-slate-300
        active:shadow-md active:border-slate-400 active:scale-[0.98]
        transition-all duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        text-left
      "
    >
      {/* Картинка товара с аккуратным соотношением сторон */}
      <div className="relative w-full pt-[40%] overflow-hidden rounded-t-xl bg-slate-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={product.imageSrc}
            alt={product.name}
            className="h-[85%] w-auto object-contain"
          />
        </div>
      </div>

      {/* Текстовая часть */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-900">{product.name}</h2>
          <span className="text-sm font-semibold text-slate-900">
            €{product.price.toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-slate-500">{product.description}</p>

        {/* Низ карточки — отклик на тап */}
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className="
              relative inline-flex items-center
              rounded-full bg-slate-100
              px-2.5 py-1
              text-[11px] font-medium
              text-slate-700
              transition-colors
              group-active:bg-emerald-500 group-active:text-white
            "
          >
            <span className="group-active:hidden">Tap to add to cart</span>
            <span className="hidden group-active:inline">Added to cart</span>
          </span>

          <span
            className="
              text-[11px] text-slate-400
              group-hover:text-slate-500
              transition-colors
            "
          >
            + Add item
          </span>
        </div>
      </div>
    </button>
  );
}
