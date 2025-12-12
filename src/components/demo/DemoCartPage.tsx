"use client";

import { useState } from "react";
import type { Product } from "./demoCartTypes";
import { ProductCard } from "./ProductCard";
import { CartSummary } from "./CartSummary";
import { PaymentMethods } from "./PaymentMethods";

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "NeoVision 3D Glasses",
    price: 249,
    description: "Immersive 3D/AR glasses for work, gaming and trading.",
    imageSrc: "/products/shopping2.jpeg",
  },
  {
    id: 2,
    name: "iPhone 17 Pro Max",
    price: 1399,
    description: "Next-gen OLED display, ultra camera and AI-powered apps.",
    imageSrc: "/products/shopping3.jpeg",
  },
  {
    id: 3,
    name: "Crypto Vault USB Key",
    price: 89,
    description: "Secure USB key for storing private keys and seed phrase.",
    imageSrc: "/products/shopping4.jpeg",
  },
  {
    id: 4,
    name: "Hardware Wallet Pro",
    price: 119,
    description: "Cold storage wallet for long-term crypto holdings.",
    imageSrc: "/products/shopping5.jpeg",
  },
  {
    id: 5,
    name: "Desk LED Lamp",
    price: 59,
    description: "Minimalist desk lamp with warm & cool light modes.",
    imageSrc: "/products/shopping6.jpeg",
  },
  {
    id: 6,
    name: "Unknown Gadget",
    price: 49,
    description: "Mystery tech accessory for your setup.",
    imageSrc: "/products/shopping1.jpeg",
  },
];

export default function DemoCartPage() {
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const hasItems = cartTotal > 0;

  function handleAddToCart(product: Product) {
    setCartTotal((prev) => prev + product.price);
    setCartCount((prev) => prev + 1);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Top header */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center text-xs font-semibold text-white">
              YS
            </div>

            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-900">
                Your Store
              </div>
              <div className="text-xs text-slate-500">
                Clean tech shopping · Crypto-friendly store
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2 py-0.5">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-medium text-slate-700">
                    Crypto Pay · Crypto-friendly checkout (demo)
                  </span>
                </div>

                {/* ✅ Account context (logged in) */}
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-2 py-0.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white text-[10px] font-semibold">
                    MB
                  </div>
                  <span className="text-[10px] font-medium text-slate-700">
                    Maria Busyhina
                  </span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                    Logged in
                  </span>
                </div>
              </div>
            </div>
          </div>

          <nav className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
            <span className="cursor-not-allowed">Store</span>
            <span className="cursor-not-allowed">Support</span>
            <span className="cursor-not-allowed">Account</span>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8 lg:py-10">
        {/* Page title */}
        <section className="mb-6 lg:mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-slate-900">
              Your shopping cart
            </h1>
            <p className="mt-1 text-sm text-slate-500 max-w-xl">
              Choose a few products, see how the cart behaves and then pay with
              Crypto Pay — our crypto-friendly checkout powered by a Swiss
              partner (demo only, no real funds are moved).
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1.5 text-[11px]">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>Crypto Pay demo integration</span>
          </div>
        </section>

        {/* Grid: products + sidebar */}
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] lg:gap-10">
          {/* Products section */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
              {PRODUCTS.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>

          {/* Sidebar: cart + payment methods */}
          <aside className="lg:pt-1">
            <div className="sticky top-20 space-y-4">
              <CartSummary cartTotal={cartTotal} cartCount={cartCount} />
              <PaymentMethods hasItems={hasItems} cartTotal={cartTotal} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
