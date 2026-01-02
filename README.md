🟦 Crypto Pay

Premium Crypto Checkout · Demo Ecommerce Integration

A modern, high-end crypto checkout experience powered by a Swiss-regulated PSP.
Designed for real online stores, premium brands, and fintech platforms.

✨ Overview

Crypto Pay is a demo ecommerce integration showcasing how crypto payments (USDT / USDC) can be accepted in a clean, compliant, production-ready way — without merchants ever touching blockchain complexity.

This project demonstrates an end-to-end payment flow:

Premium ecommerce UI

Shopping cart & checkout

Invoice creation (server-side)

Hosted crypto payment page (Stripe-like)

Real-time status updates (polling)

PSP-grade architecture, ready for production

💡 This is not a mock UI.
The architecture mirrors how real PSPs operate: invoice lifecycle, confirmations, AML hooks, and production patterns.

🧠 What This Demo Shows

Crypto payments that feel as simple as card payments

Merchants staying out of custody (no wallet management / no private keys)

Users paying directly from their own wallet

Honest handling of confirmations, delays, errors, and expiration

A checkout that looks premium, safe, and enterprise-ready

✅ What’s Already Implemented
🛍 1) Premium Product Catalog

6 demo products with HD images

Apple-style clean layout

Fully responsive (desktop / tablet / mobile)

🧺 2) Functional Shopping Cart

Instant add-to-cart

Live totals & recalculation

Sticky cart summary

Fully client-side (no reloads)

💳 3) Payment Methods

Card (placeholder)

Bank transfer (placeholder)

Crypto Pay — active

Crypto Pay redirects users to /checkout, where the final invoice is created securely.

🧾 4) Checkout Page

Order summary

Clear explanation of crypto payment flow

“Continue to Crypto Pay” button

Invoice is created via backend API (no amounts in URL)

🛠 5) Invoice Creation API

Endpoint

POST /api/payments/create

Responsibilities

Validates amounts

Enforces token ↔ network pairing

Creates invoice via PSP backend

Returns hosted payment URL

Response includes

invoiceId

fiat & crypto amounts

network

expiration timestamp

hosted payment URL

⚠️ No sensitive payment data is stored on the frontend.

💫 6) Hosted Crypto Payment Page

Route: /open/pay/[invoiceId]
A hosted payment experience similar to Stripe Checkout:

Fiat & crypto amounts

Network & wallet address

Payment status: waiting → confirmed / expired

Real-time polling

Honest placeholders while data is not yet available

Ready for QR codes, copy buttons, deep links

🔄 7) Real Payment Lifecycle (Demo-Driven)

Supported lifecycle:

Invoice created

User sees wallet + amount

Payment detected (txHash appears)

Confirmations processed

Payment confirmed

Success page rendered

All states are reflected in real time.

☁️ 8) Deployment

Ready for Vercel

Optimized for demos, onboarding, investor presentations

Clean separation between:

Merchant frontend

Hosted payment UI

PSP backend (separate project)

🧩 Project Structure
app/
├─ page.tsx
├─ checkout/
├─ open/
│ └─ pay/
│ └─ [invoiceId]/
├─ api/
│ └─ payments/
│ ├─ create/
│ └─ status/

src/
├─ components/
│ ├─ demo/
│ ├─ checkout/
│ └─ cryptoPay/
├─ lib/
│ └─ invoiceStore.ts (demo only)

🟩 Overall Status

≈ 75% complete

Already suitable for:

demos

partners

investors

merchant onboarding walkthroughs

🚧 Roadmap — Frontend Work for Production Grade

1. Remove Demo-Only Logic in Production

What

Disable query-based fallbacks in production

Remove any “simulate paid” behavior

Enforce backend-only data

Why

Prevents amount manipulation

Aligns with real PSP security models

2. Full Status Coverage in UI

Support as soon as PSP provides:

underpaid, overpaid, partial

pending_confirmations

rejected

Why

Reduces support tickets by 5–10×

Makes the system self-explanatory

3. Pending / Confirmations UX

When transaction is detected:

Show txHash (copyable)

Show confirmations progress (e.g. 1 / 3)

Clear messaging: “You can safely close this page” / “Please keep this page open”

Why

Users understand delays ≠ failure

Builds trust

4. Payment UX Improvements

Copy address (1 click)

Copy amount (1 click)

QR codes with amount (when supported)

Wallet deep links (MetaMask / Trust / TronLink)

Why

Fewer payment mistakes

Faster conversions

5. Expiration Handling

When invoice expires:

Block further payments

Show clear warning

CTA: “Create new invoice” / “Back to checkout”

Why

Prevents late payments

Avoids disputes

6. Network / PSP Error Handling

If PSP API is unavailable:

“Service temporarily unavailable”

Retry button

No fallback to query values in production

Why

Honest UX

No misleading data

7. Success Page as Final Receipt

Show:

invoiceId

paid crypto amount

fiat equivalent

timestamps

confirmation status

“Return to merchant” (via returnUrl)

Why

Acts as a receipt

Needed for merchants & users

8. Merchant Parameters Support

At invoice creation:

returnUrl

merchantName

orderId

orderDescription

webhookUrl

Why

Required for real ecommerce integrations

9. Security Guarantees

No amounts in URLs

No critical data in localStorage

Backend is the single source of truth

Why

Prevents tampering

PSP-level security baseline

10. Merchant Mode (Optional)

For hosted payment use cases:

Light theming (logo / colors)

i18n (EN / IT / DE)

White-label friendly

Why

Makes Crypto Pay sellable as a product

🧠 Final Takeaway

If psp-core is the payment engine, then Crypto Pay frontend is the merchant-facing trust layer.

The most important frontend goals are:

✅ Clear statuses

✅ Honest waiting states

✅ Perfect UX around confirmations

✅ No fake data, no illusions

✅ Success = receipt

🇷🇺 Русская версия
🟦 Crypto Pay

Премиальный крипто-чекаут · Demo интеграция для eCommerce

Современный, “дорогой” крипто-чекаут на базе швейцарского лицензированного PSP.
Подходит для реальных интернет-магазинов, премиальных брендов и финтех-платформ.

✨ Обзор

Crypto Pay — это демо интеграция для eCommerce, показывающая, как принимать крипто-платежи (USDT / USDC) чисто, комплаентно и “по-взрослому” — без того, чтобы мерчант вообще касался блокчейн-сложности.

Проект показывает полный end-to-end flow:

премиальный UI магазина

корзина и checkout

создание инвойса (на сервере)

hosted crypto payment page (как Stripe Checkout)

обновление статуса в реальном времени (polling)

PSP-архитектура, готовая к production

💡 Это не “макет”.
Архитектура повторяет, как работают реальные PSP: жизненный цикл инвойса, подтверждения, AML-хуки и production-паттерны.

🧠 Что демонстрирует этот проект

крипто-платёж ощущается как оплата картой

мерчант не хранит ключи и не управляет кошельками (нет custody)

пользователь платит напрямую со своего кошелька

задержки/подтверждения/ошибки отображаются честно и прозрачно

интерфейс выглядит премиально, безопасно и “enterprise-ready”

✅ Уже реализовано
🛍 1) Премиальный каталог

6 демо-товаров с HD-изображениями

чистый “Apple-style”

адаптивность (desktop / tablet / mobile)

🧺 2) Корзина

мгновенное добавление

живые суммы/пересчёт

липкий summary

полностью client-side

💳 3) Методы оплаты

Card (заглушка)

Bank transfer (заглушка)

Crypto Pay — активный

Crypto Pay ведёт на /checkout, где инвойс создаётся безопасно на сервере.

🧾 4) Checkout страница

summary заказа

понятное объяснение crypto-оплаты

кнопка “Continue to Crypto Pay”

инвойс создаётся через backend API (сумм в URL нет)

🛠 5) API создания инвойса

Endpoint

POST /api/payments/create

Что делает

валидирует суммы

проверяет соответствие token ↔ network

создаёт инвойс в PSP backend

возвращает hosted payment URL

В ответе

invoiceId

суммы fiat/crypto

сеть

срок действия

hosted payment URL

⚠️ Никаких чувствительных данных фронт не хранит.

💫 6) Hosted страница оплаты

Маршрут: /open/pay/[invoiceId]
Страница оплаты “как у Stripe”:

суммы fiat/crypto

сеть и адрес кошелька

статусы waiting → confirmed / expired

polling в реальном времени

честные placeholders пока данные ещё не готовы

готово под QR/copy/deeplinks

🔄 7) Полный жизненный цикл оплаты (демо)

инвойс создан

пользователь видит адрес+сумму

транзакция обнаружена (появляется txHash)

подтверждения обработаны

оплата подтверждена

рендерится success

Все состояния отображаются в реальном времени.

☁️ 8) Деплой

готово под Vercel

подходит для демо, онбординга, инвесторов

разделение:

merchant frontend

hosted payment UI

PSP backend (отдельный проект)

🧩 Структура проекта
app/
├─ page.tsx
├─ checkout/
├─ open/
│ └─ pay/
│ └─ [invoiceId]/
├─ api/
│ └─ payments/
│ ├─ create/
│ └─ status/

src/
├─ components/
│ ├─ demo/
│ ├─ checkout/
│ └─ cryptoPay/
├─ lib/
│ └─ invoiceStore.ts (demo only)

🟩 Текущий статус

≈ 75% готово

Уже подходит для:

демо

партнёров

инвесторов

онбординга мерчантов

🚧 Roadmap — что доделать на фронте до production

Убрать demo-логику в проде

Расширить статусы (underpaid/overpaid/partial/pending_confirmations/rejected)

Нормальный UX подтверждений (txHash, прогресс, сообщения)

Улучшить UX оплаты (copy address/amount, QR, wallet deeplinks)

Expiration flow (блокировка оплаты + CTA)

Ошибки PSP/network (честно + retry)

Success = чек/receipt (все суммы/таймстемпы/returnUrl)

Параметры мерчанта (orderId, description, webhookUrl, returnUrl)

Гарантии безопасности (без сумм в URL, backend = источник истины)

Merchant mode / white-label (опционально)

🧠 Итог

Если psp-core — это “движок платежей”, то Crypto Pay frontend — это trust layer для мерчанта и пользователя.

Главные цели фронта:

✅ понятные статусы

✅ честные ожидания

✅ идеальный UX подтверждений

✅ никаких “фейков”

✅ success = receipt
