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
