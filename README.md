🟦 Crypto Pay — Premium Demo Ecommerce Integration

A modern, high-end crypto checkout experience powered by a Swiss regulated partner.
Designed for real e-commerce, premium brands and fintech integrations.

✨ Overview

Crypto Pay Demo — это полнофункциональная демонстрация интернет-магазина, который принимает криптовалюту (USDT/USDC) через швейцарского регулируемого провайдера.

Показаны:
• современный каталог товаров
• семантическая корзина
• премиальный интерфейс оплаты
• API для создания инвойса
• адаптивная верстка уровня Apple/Stripe
• структура для дальнейших реальных интеграций

🚀 Completed Functionality (Production-grade)
🛍️ 1. Premium Product Catalog

6 реальных товаров (3D glasses, iPhone 17, hardware wallets, USB devices, LEDs)

High-resolution изображения в /public/products

Apple-style сетка, clean UI, мягкие тени

TailwindCSS 4.0

Полная адаптивность (iPhone → Desktop)

🧺 2. Fully Functional Shopping Cart

Add-to-cart

Dynamic total

Item counter

Separate sticky summary panel

Молниеносная работа без перезагрузок (React client-side)

💳 3. Payment Methods (Stripe-like)

Card (disabled placeholder, enterprise-ready)

Bank transfer (disabled placeholder)

Crypto Pay (active) — интеграция с бэкендом

💼 4. Checkout Page (Order Confirmation)

Премиальный макет как у Apple Pay / Stripe Checkout

Подробный step-by-step процесс для клиента

Проверка суммы

Хватает для демонстрации инвестору/клиенту

🛠 5. Backend API (Swiss-style architecture)
/api/payments/create

✔ создаёт уникальный инвойс
✔ возвращает:

{
invoiceId,
fiatAmount,
fiatCurrency,
cryptoCurrency,
cryptoAmount,
status: "waiting",
expiresAt,
paymentUrl
}

✔ полностью связано с checkout

☁️ 6. Vercel Deployment — Ready

Полностью рабочая сборка

Zero errors

Чистый билд

Рабочие роуты и динамические параметры

🧩 Architecture
/
├─ app/
│ ├─ checkout/ # Order confirmation page
│ ├─ api/
│ │ └─ payments/create # Invoice generator (backend)
│ └─ page.tsx # Catalog entry
│
├─ public/
│ ├─ products/ # All product images
│ └─ icons/ # UI icons
│
└─ src/components/demo/
├─ DemoCartPage.tsx # Main catalog page
├─ ProductCard.tsx # Product tile
├─ CartSummary.tsx # Right-side summary
├─ PaymentMethods.tsx # Payment options
└─ demoCartTypes.ts # Product types

🟣 Next Steps To Complete Full Real Integration

Ниже — дорожная карта уровня «production-ready crypto gateway».

🔜 Step 1 — Hosted Invoice Page

Create:

/open/pay/[invoiceId]/page.tsx

На этой странице будет:
✔ сумма
✔ QR-код
✔ USDT/USDC адреса
✔ таймер (25 минут)
✔ статусы (waiting / pending / paid / expired)

🔜 Step 2 — Real Crypto Rate

Добавить запрос:

GET https://api.coingecko.com/api/v3/simple/price

или API швейцарского провайдера.

🔜 Step 3 — Redirect flow

После создания инвойса → автоматический переход на:
/open/pay/[invoiceId]

🔜 Step 4 — Invoice Status Checker

Frontend должен каждые 5–10 секунд запрашивать:

/api/payments/[invoiceId]/status

🔜 Step 5 — Webhook Simulation

Нужен endpoint:

POST /api/webhooks/payment

Эмулирует поведение реального провайдера.

🔜 Step 6 — Admin Panel (optional)

View invoices

Payment statuses

Filtering

Manual test webhook

🏁 Final Result (when completed)

Ты получишь законченную полноценную систему крипто-платежей, которую можно:

✔ показывать инвесторам
✔ демонстрировать клиентам бизнеса
✔ интегрировать в Shopify/Next.js магазины
✔ использовать как white-label продукт
✔ подключать как часть финтех-экосистемы

📌 Premium Checklist (для README)

- [x] Premium product gallery
- [x] Apple-quality cart system
- [x] Modern checkout page
- [x] Invoice backend
- [x] Vercel deployment
- [ ] Hosted invoice page
- [ ] QR payment screen
- [ ] Live rate conversion
- [ ] Invoice polling
- [ ] Webhook processor
- [ ] Admin dashboard
