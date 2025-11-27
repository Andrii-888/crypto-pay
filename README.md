# Crypto-Pay — White-Label Cryptocurrency Payment Gateway

A complete Next.js-based payment system that allows any online store to accept cryptocurrency through a licensed Swiss financial partner.  
The project includes: payment pages, merchant dashboard, API, webhooks, SDK, multi-language support, and integration logic with a Swiss crypto/fiat provider.

---

## 🚀 Getting Started

Install dependencies:

```bash
npm install
Run the development server:

bash
Copy code
npm run dev
Open http://localhost:3000 in your browser.

📂 Project Structure
bash
Copy code
crypto-pay/
├── README.md
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── .env.local
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   │
    │   ├── [lang]/                      # Multi-language routing
    │   │   ├── page.tsx                 # Landing for all languages
    │   │   │
    │   │   ├── open/pay/[invoiceId]/page.tsx
    │   │   │   # Public payment page (QR, timer, status)
    │   │   │
    │   │   └── dashboard/
    │   │       ├── page.tsx             # Merchant dashboard
    │   │       └── transactions/page.tsx
    │   │
    │   └── api/
    │       ├── payments/
    │       │   ├── route.ts             # POST /api/payments → create invoice
    │       │   └── [id]/route.ts        # GET /api/payments/[id] → status
    │       │
    │       ├── webhook/
    │       │   └── partner/route.ts     # Webhook from Swiss partner
    │       │
    │       └── merchants/
    │           └── api-key/route.ts     # Merchant API key rotation
    │
    ├── components/
    │   ├── layout/
    │   │   └── Header.tsx
    │   ├── payments/
    │   │   ├── PaymentWidget.tsx
    │   │   ├── PaymentStatus.tsx
    │   │   └── CryptoSelector.tsx
    │   └── ui/                          # Buttons, inputs, modals, etc.
    │
    ├── lib/
    │   ├── i18n/
    │   │   ├── index.ts                 # Language setup
    │   │   └── dictionaries/
    │   │       ├── en.json
    │   │       ├── it.json
    │   │       ├── de.json
    │   │       ├── fr.json
    │   │       └── ru.json
    │   │
    │   ├── partner/partnerApi.ts        # Swiss partner integration (crypto/fiat)
    │   ├── payments/
    │   │   ├── createInvoice.ts
    │   │   ├── updateStatus.ts
    │   │   └── validateCallback.ts
    │   ├── security/
    │   │   ├── signWebhook.ts
    │   │   └── apiAuth.ts
    │   └── config.ts
    │
    ├── db/
    │   ├── schema.prisma                # Merchant accounts, payments, logs
    │   └── client.ts                    # Prisma client
    │
    ├── sdk/
    │   └── index.ts                     # Public SDK for online stores
    │
    └── styles/
        └── globals.css
🌍 Multi-language Support (i18n)
Supported languages:

English (en)

Italian (it)

German (de)

French (fr)

Russian (ru)

Language is used as a URL prefix:

swift
Copy code
/en/open/pay/123
/it/open/pay/123
/de/open/pay/123
...
🔌 API Overview
Create Invoice
POST /api/payments

Get Payment Status
GET /api/payments/[id]

Receive Webhook from Swiss Partner
POST /api/webhook/partner

Merchant API Key
POST /api/merchants/api-key

🧩 SDK for Online Stores
Located in:

bash
Copy code
/src/sdk/index.ts
Used by merchants to integrate Crypto-Pay into ANY website or platform.

🏦 Swiss Financial Partner
All crypto reception, blockchain verification, AML/KYC and fiat payouts are processed by a licensed Swiss partner.
Crypto-Pay provides the technical layer only (white-label).

📦 Deployment
Deploy easily to Vercel:

https://vercel.com/new

```
