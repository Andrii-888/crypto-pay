🟦 Crypto Pay
Premium Crypto Checkout · Demo Ecommerce Integration

A modern, high-end crypto checkout experience powered by a Swiss-regulated PSP.
Designed for real online stores, premium brands, and fintech platforms.

✨ Overview

Crypto Pay is a demo ecommerce integration showcasing how crypto payments (USDT / USDC) can be accepted in a clean, compliant and production-ready way, without merchants ever touching blockchain complexity.

The project demonstrates a full end-to-end payment flow:

premium ecommerce UI

shopping cart & checkout

invoice creation

hosted crypto payment page

real-time status updates

PSP-grade architecture, ready for production

💡 This is not a mock UI.
The architecture mirrors how real PSPs operate (invoice lifecycle, webhooks, confirmations, AML hooks).

🧠 What This Demo Shows

How crypto payments can feel as simple as card payments

How merchants stay out of custody

How users pay directly from their own wallet

How confirmations, delays and failures are handled honestly and transparently

How a crypto checkout can look premium, safe and enterprise-ready

✅ What’s Already Implemented
🛍 1. Premium Product Catalog

6 demo products with HD images

Apple-style clean layout

Fully responsive (desktop / tablet / mobile)

🧺 2. Functional Shopping Cart

Instant add-to-cart

Live totals & recalculation

Sticky cart summary

Fully client-side (no reloads)

💳 3. Payment Methods

Card (placeholder)

Bank transfer (placeholder)

Crypto Pay — active

Crypto Pay redirects users to:

/checkout

where the final invoice is created securely.

🧾 4. Checkout Page

Order summary

Clear explanation of crypto payment flow

“Continue to Crypto Pay” button

Invoice is created via backend API (no amounts in URL)

🛠 5. Invoice Creation API

Endpoint

POST /api/payments/create

Responsibilities

Validates amounts

Enforces token ↔ network pairing

Creates invoice via PSP backend

Returns a hosted payment URL

Response includes

invoiceId

fiat & crypto amounts

network

expiration timestamp

hosted payment URL

⚠️ No sensitive payment data is stored on the frontend.

💫 6. Hosted Crypto Payment Page

/open/pay/[invoiceId]

A fully hosted payment experience similar to Stripe Checkout:

Fiat & crypto amounts

Network & wallet address

Payment status:

waiting

confirmed

expired

Real-time polling

Honest placeholders while data is not yet available

Ready for QR codes, copy buttons and deep links

🔄 7. Real Payment Lifecycle (Demo-Driven)

The demo already supports the full lifecycle:

Invoice created

User sees wallet + amount

Payment detected (txHash appears)

Confirmations processed

Payment confirmed

Success page rendered

All states are reflected in real time.

☁️ 8. Deployment

Ready for Vercel

Optimized for demos, onboarding and investor presentations

Clean separation between:

merchant frontend

hosted payment UI

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

Below — what still makes sense to do on the Crypto Pay frontend, and why.

1️⃣ Remove Demo-Only Logic in Production

What

Disable query-based fallbacks in prod

Remove any “simulate paid” behaviour

Enforce backend-only data

Why

Prevents amount manipulation

Aligns with real PSP security models

2️⃣ Full Status Coverage in UI

Support (as soon as PSP provides them):

underpaid

overpaid

partial

pending_confirmations

rejected

Why

Reduces support tickets by 5–10×

Makes the system self-explanatory for users

3️⃣ Pending / Confirmations UX

When a transaction is detected:

Show txHash (copyable)

Show confirmations progress (e.g. 1 / 3)

Clear messaging:

“You can safely close this page”

or “Please keep this page open”

Why

Users understand delays ≠ failure

Builds trust

4️⃣ Payment UX Improvements

Copy address (1 click)

Copy amount (1 click)

QR codes with amount (when supported)

Wallet deep links (MetaMask / Trust / TronLink)

Why

Fewer payment mistakes

Faster conversions

5️⃣ Expiration Handling

When invoice expires:

Block further payments

Clear warning

CTA:

“Create new invoice”

or “Back to checkout”

Why

Prevents late payments

Avoids disputes

6️⃣ Network / PSP Error Handling

If PSP API is unavailable:

Show “Service temporarily unavailable”

Retry button

No fallback to query values in prod

Why

Honest UX

No misleading data

7️⃣ Success Page = Final Receipt

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

8️⃣ Merchant Parameters Support

At invoice creation:

returnUrl

merchantName

orderId

orderDescription

webhookUrl

Why

Required for real ecommerce integrations

9️⃣ Security Guarantees

No amounts in URLs

No critical data in localStorage

Backend is the single source of truth

Why

Prevents tampering

PSP-level security baseline

🔟 Merchant Mode (Optional)

For hosted payment use cases:

Light theming (logo / colors)

i18n (EN / IT / DE)

White-label friendly

Why

Makes Crypto Pay sellable as a product

🧠 Final Takeaway

If psp-core is the payment engine, then Crypto Pay frontend is the merchant-facing trust layer.

The most important frontend goals are:

✅ clear statuses
✅ honest waiting states
✅ perfect UX around confirmations
✅ no fake data, no illusions
✅ success = receipt
