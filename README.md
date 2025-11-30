# 🟦 Crypto Pay — Premium Demo Ecommerce Integration

A modern, high-end crypto checkout experience powered by a Swiss-regulated partner.  
Designed for real e-commerce, premium brands and fintech integrations.

---

## ✨ Overview

**Crypto Pay Demo** — это демонстрационный интернет-магазин, который принимает криптовалюту (USDT / USDC) через швейцарского регулируемого провайдера (модель TripleA / Swiss PSP).

В демо уже показываем:

- современный каталог товаров
- живую корзину и пересчёт суммы
- премиальный экран checkout
- бэкенд-API для создания крипто-инвойсов
- базовую hosted-страницу оплаты `/open/pay/[invoiceId]`
- адаптивную верстку уровня Apple / Stripe
- архитектуру, готовую к подключению реального провайдера

**Tech stack**

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Vercel (Production deployment)

---

## ✅ What’s Already Implemented

### 🛍 1. Premium Product Catalog

- 6 real products:
  - NeoVision 3D Glasses
  - iPhone 17 Pro Max
  - Crypto Vault USB Key
  - Hardware Wallet Pro
  - Desk LED Lamp
  - Mystery tech gadget
- High-resolution images in `/public/products`
- Clean “Apple-style” layout:
  - soft shadows
  - rounded cards
  - balanced typography
- Fully responsive (from iPhone to large desktop)

### 🧺 2. Fully Functional Shopping Cart

- Tap on a product card → item instantly added to cart
- Dynamic total with `€` formatting
- Item counter (0 → N items)
- Separate **sticky Cart summary** panel on the right
- Everything работает без перезагрузки (React client components)

### 💳 3. Payment Methods (Stripe-like UI)

В панели оплаты:

- **Pay by card** — disabled placeholder (будущий Stripe/Adyen)
- **Bank transfer (IBAN)** — disabled placeholder
- **Pay with Crypto (CryptoPay)** — активный метод

Crypto Pay:

- доступен только при `cartTotal > 0`
- перенаправляет пользователя на `/checkout?amount=XXX.XX`

### 💼 4. Checkout Page (Order Confirmation)

`/checkout`

- Премиальный макет в стиле Apple Pay / Stripe Checkout
- Отображение фиксированной суммы заказа
- Блок “What happens next?” с понятной логикой для клиента
- Секция “Crypto payment” объясняет работу швейцарского провайдера
- Кнопка **“Continue to Crypto Pay (create invoice)”** запускает реальный бэкенд-запрос

### 🛠 5. Backend API — Invoice Creation

`POST /api/payments/create`

- Принимает JSON:

  ```json
  {
    "amount": 1648,
    "fiatCurrency": "EUR"
  }
  Создаёт мок-инвойс и возвращает:
  ```

json
Copy code
{
"invoiceId": "inv_1764512345678",
"fiatAmount": 1648,
"fiatCurrency": "EUR",
"cryptoCurrency": "USDT",
"cryptoAmount": 1648,
"status": "waiting",
"expiresAt": "2025-11-30T09:43:49.749Z",
"paymentUrl": "/open/pay/inv_1764512345678"
}
Использует in-memory invoice store в src/lib/invoiceStore.ts

Связан c checkout: после успешного ответа пользователь перенаправляется на paymentUrl

💳 6. Hosted Invoice Page (Demo)
/open/pay/[invoiceId]

Читает данные инвойса из invoiceStore

Если инвойс не найден → показывает “Invoice not found” (как у реальных PSP)

Базовый layout:

заголовок

краткий текст

заготовка под блок оплаты / статус

Это фундамент для будущей полноценной страницы с QR-кодом и статусами.

☁️ 7. Vercel Deployment
Production deployment: crypto-pay-\*.vercel.app

Чистый билд, без ошибок

Рабочие маршруты:

/ — каталог + корзина

/checkout — подтверждение заказа

/api/payments/create — создание инвойса

/open/pay/[invoiceId] — hosted-страница инвойса (demo)

🧩 Project Structure
txt
Copy code
/
├─ app/
│ ├─ page.tsx # Main catalog entry (mounts DemoCartPage)
│ ├─ checkout/
│ │ └─ page.tsx # Order confirmation + "Continue to Crypto Pay"
│ ├─ open/
│ │ └─ pay/
│ │ └─ [invoiceId]/page.tsx # Hosted invoice page (demo)
│ └─ api/
│ └─ payments/
│ └─ create/route.ts # Invoice generator (backend mock)
│
├─ public/
│ ├─ products/ # All product images
│ └─ icons/ # UI icons (if needed later)
│
└─ src/
├─ components/
│ ├─ demo/
│ │ ├─ DemoCartPage.tsx # Main catalog + cart layout
│ │ ├─ ProductCard.tsx # Product tile with image
│ │ ├─ CartSummary.tsx # Right-side summary card
│ │ ├─ PaymentMethods.tsx# Payment options (card / bank / crypto)
│ │ └─ demoCartTypes.ts # Product types
│ └─ checkout/
│ └─ CheckoutClient.tsx # Client-side logic for /checkout
│
└─ lib/
└─ invoiceStore.ts # In-memory invoice storage (demo only)
🟣 Roadmap — Next Steps to Production-Ready Crypto Gateway
Ниже — чёткий план, что ещё нужно сделать, чтобы превратить демо в полноценную систему оплаты криптовалютой.

🔜 Step 1 — Upgrade Hosted Invoice Page
Цель: сделать /open/pay/[invoiceId] настоящей страницей оплаты.

План:

Показать:

сумму в EUR

сумму в USDT/USDC

сеть (например, TRC20 / ERC20 / Polygon)

таймер на 25 минут (как у TripleA / Farfetch)

Добавить выбор валюты (USDT / USDC)

Состояния:

waiting — ожидаем платеж

pending — транзакция найдена, ждём подтверждений

confirmed — оплата прошла

expired — время вышло

🔜 Step 2 — QR-код и адрес кошелька
Генерация QR-кода на основе:

vbnet
Copy code
usdt:<address>?amount=XXX&label=Order%20INV_xxx
Кнопка Copy address

Кнопка Copy amount

Всплывающие toast-уведомления “Address copied / Amount copied”

🔜 Step 3 — Live Crypto Rate (Price Lock)
Подключить внешний API (тип CoinGecko или API провайдера)

При создании инвойса:

фиксировать курс EUR → USDT / USDC на 25 минут

сохранять в инвойсе cryptoRate + lockedUntil

Показать пользователю:

“Rate locked for 25 minutes”

🔜 Step 4 — Invoice Status API
Добавить новый endpoint:

GET /api/payments/[invoiceId]/status

Возвращает:

json
Copy code
{
"invoiceId": "inv\_...",
"status": "waiting | pending | confirmed | expired",
"txHash": "0x... (optional)"
}
На фронте:

setInterval / polling каждые 5–10 cекунд

Автоматическое обновление статуса на hosted-странице

Редирект обратно в магазин после confirmed

🔜 Step 5 — Webhook Simulation (Provider → Store)
Добавить:

POST /api/webhooks/payment

Поведение:

эмулирует callback от швейцарского провайдера

по invoiceId меняет статус в invoiceStore на pending или confirmed

логирует события (для отладки)

Позже этот endpoint можно заменить на реальный webhook от партнёра.

🔜 Step 6 — Admin Panel (optional, но красиво)
Раздел /admin:

Таблица со всеми инвойсами:

дата

сумма

статус

txHash / network

Фильтры по статусам

Тестовая кнопка “Simulate webhook: paid”

🏁 Final Result (после выполнения Roadmap)
После завершения шагов выше у тебя будет:

полноценная white-label система крипто-платежей

премиальный UI, который можно показывать:

инвесторам,

владельцам интернет-магазинов,

швейцарским/европейским партнёрам

готовая основа для интеграции:

в существующие Next.js / Shopify / Headless-магазины,

в твою финтех-экосистему (Alpine Bridge / Swiss partners).

📌 Premium Checklist
Premium product gallery

Apple-quality cart system

Modern checkout page

Invoice backend (/api/payments/create)

In-memory invoice store

Hosted invoice page (demo state)

Vercel production deployment

Full hosted invoice UI (QR + timer)

Live FX rate & locked price

Invoice polling (/status API)

Webhook processor (provider → store)

Admin dashboard
