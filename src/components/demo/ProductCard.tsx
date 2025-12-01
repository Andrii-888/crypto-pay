// src/components/demo/ProductCard.tsx

import Image from "next/image";
import type { Product } from "./demoCartTypes";

type ProductCardProps = {
  product: Product;
  onAddToCart: (product: Product) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Изображение товара — немного меньше и стабильное по высоте */}
      <div className="relative aspect-4/4 w-full overflow-hidden rounded-t-xl bg-slate-100">
        <Image
          src={product.imageSrc}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          priority={product.id <= 2}
        />
      </div>
      {/* Контент карточки */}
      <div className="flex flex-1 flex-col p-4 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-sm font-medium text-slate-900 line-clamp-2">
            {product.name}
          </h2>
          <span className="shrink-0 text-sm font-semibold text-slate-900">
            €{product.price.toFixed(2)}
          </span>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2">
          {product.description}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          {/* Маленький бейдж вместо + Add item */}
          <div className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
            In stock · Ships in 24h
          </div>

          {/* Реальная кнопка добавления в корзину */}
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-slate-800 active:scale-[0.97] transition"
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}
