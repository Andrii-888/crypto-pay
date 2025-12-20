🟦 Crypto Pay — Premium Demo Ecommerce Integration

A modern, high-end crypto checkout experience powered by a Swiss-regulated PSP.
Designed for real online stores, premium brands and fintech platforms.

✨ Overview

Crypto Pay Demo is a showcase ecommerce system that accepts USDT/USDC through a Swiss-regulated partner.
It demonstrates:

a modern product catalog

full shopping cart logic

premium checkout experience

invoice creation API

hosted payment page (/open/pay/[invoiceId])

architecture ready for real production integration

✅ What’s Already Implemented
🛍 1. Premium Product Catalog

6 products with HD images

Apple-style layout

fully responsive

🧺 2. Functional Shopping Cart

instant add-to-cart

live totals

sticky Cart Summary

client components, no reloads

💳 3. Payment Methods

card (placeholder)

bank transfer (placeholder)

Crypto Pay — active payment method

Redirects to:

/checkout?amount=XXX.XX

🧾 4. Checkout Page

order summary

explanation of crypto payment flow

“Continue to Crypto Pay” creates invoice

🛠 5. Invoice Creation API

POST /api/payments/create

Returns:

invoiceId
amount
currency
cryptoAmount
expiresAt
paymentUrl

Uses in-memory invoiceStore.

💫 6. Hosted Invoice Page (/open/pay/[invoiceId])

fiat & crypto amounts

status: waiting / confirmed / expired

timer

ready for QR and wallet address

polling integration baked in

☁️ 7. Vercel Deployment

Ready for demonstrations and onboarding partners.

🧩 Project Structure
app/
page.tsx
checkout/
open/pay/[invoiceId]/
api/payments/create/

src/components/
demo/
checkout/
cryptoPay/

src/lib/invoiceStore.ts

🎯 Roadmap — Remaining Work for Production Grade

1. Complete Hosted Payment UI (QR, statuses)

70% done.

2. QR & Copy Buttons

50% done.

3. Live Crypto Rate + Price Lock

30% done.

4. Status API + Polling

60% done.

5. Webhooks (PSP → Store)

20% done.

6. Mini Admin Panel (optional)

Dashboard already exists in separate PSP project.

🟩 Overall Completion

≈ 75% complete.
Already suitable for investors, partners, and demo deployments.

Что ещё сделать на фронте и зачем

1. Убрать “демо-логику” из прод полностью

Что: fallback из query (мы уже ограничили dev), simulate-paid скрыть/запретить в prod UI.
Зачем: чтобы нельзя было “сгенерить” оплату и суммы без бэка.

2. Полный набор статусов в UI

Что: красиво отображать не только waiting/confirmed/expired/rejected, но и (как только появятся в psp-core):

underpaid (оплатили меньше)

overpaid (оплатили больше)

partial (частично)

pending_confirmations (есть tx, ждём подтверждений)

Зачем: это снижает поддержку в 5–10 раз.

3. Страница “Pending / Confirmations”

Что: отдельный блок, если tx найден:

tx hash (с кнопкой copy)

confirmations progress (например “1/3”)

“Do not close” / “You can close safely” логика

Зачем: user видит, что всё ок, просто сеть подтверждает.

4. UX оплаты: “Copy address” + “Copy amount” + deep links

Что:

копировать адрес одним кликом

копировать сумму одним кликом

deep links для кошельков (если применимо): MetaMask / Trust / TronLink (зависит от сети)

QR должен включать адрес + amount (если сеть/стандарт поддерживает)

Зачем: меньше ошибок “отправил не туда / не ту сумму”.

5. Таймер и сценарий истечения

Что: когда истёк — UI:

блокирует оплату

предлагает кнопку “Create new invoice” (или “Back to checkout”)

показывает, что оплату по этой ссылке не принимать

Зачем: предотвращает оплату “после истечения” и споры.

6. Обработка ошибок сети (PSP недоступен)

Что: на /open/pay/[invoiceId] если fetch упал:

показать “Service temporarily unavailable”

кнопка “Retry”

не показывать суммы из query в prod

Зачем: честный UX вместо мусорных данных.

7. Страница Success — финальная “квитанция”

Что: на success показывать:

invoiceId

paid amount (crypto + fiat)

timestamp

status confirmed

“Return to merchant” (если есть returnUrl)

Зачем: пользователь и мерчант видят подтверждение.

8. Параметры мерчанта (returnUrl, webhookUrl) — прокинуть корректно

Что: при создании инвойса поддержать:

returnUrl (куда вернуть пользователя после оплаты)

merchantName/orderId/description

Зачем: это must-have для интеграций магазинов.

9. Безопасность: не хранить деньги/суммы в URL и localStorage

Что: никаких amount/cryptoAmount в URL, никаких “истинных” сумм в localStorage.
Зачем: защита от подмены и багов.

10. “Merchant mode” (минимум)

Если crypto-pay будет как “hosted payment page”:

простая тема/брендинг через query (logo, colors) но без денег

i18n (EN/IT/DE)

Зачем: выглядит как продукт, который можно продавать.

В сухом остатке

Если psp-core доделываем как платёжку, то на фронте самое важное:
✅ статусы (under/over/pending confirmations)
✅ copy/deeplink/QR без ошибок
✅ retry/ошибки сети
✅ таймер+expired
✅ success receipt + returnUrl
