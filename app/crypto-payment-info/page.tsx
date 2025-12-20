"use client";

import { useMemo, useState } from "react";

type Lang = "en" | "it" | "ru";

type Copy = {
  title: string;
  subtitle: string;
  bullets: string[];
  whyTitle: string;
  whyText: string;
  footer: string;
};

const COPY: Record<Lang, Copy> = {
  en: {
    title: "Crypto Payment Verification & Security",
    subtitle:
      "Before you pay with crypto, please review how payments are verified and protected.",
    bullets: [
      "Crypto payments are processed by a licensed payment service provider (PSP).",
      "Transactions are automatically verified before being credited.",
      "In rare cases, a payment may be temporarily held for additional review.",
      "High-risk transactions may be rejected in line with compliance rules.",
      "Only verified payments are completed and forwarded to the merchant.",
    ],
    whyTitle: "Why this exists",
    whyText:
      "Cryptocurrency transactions are irreversible. Verification helps protect customers, merchants, and the payment infrastructure from fraud and high-risk activity.",
    footer:
      "If you have questions about your order, please contact the merchant support.",
  },
  it: {
    title: "Verifica e Sicurezza del Pagamento in Cripto",
    subtitle:
      "Prima di pagare in cripto, leggi come i pagamenti vengono verificati e protetti.",
    bullets: [
      "I pagamenti in cripto sono gestiti da un fornitore di servizi di pagamento (PSP) autorizzato.",
      "Le transazioni vengono verificate automaticamente prima dell’accredito.",
      "In rari casi, un pagamento può essere trattenuto temporaneamente per un controllo aggiuntivo.",
      "Le transazioni ad alto rischio possono essere rifiutate secondo le regole di conformità.",
      "Solo i pagamenti verificati vengono completati e inoltrati al commerciante.",
    ],
    whyTitle: "Perché è necessario",
    whyText:
      "Le transazioni in criptovaluta sono irreversibili. La verifica protegge clienti, commercianti e l’infrastruttura dei pagamenti da frodi e attività ad alto rischio.",
    footer: "Per domande sull’ordine, contatta l’assistenza del commerciante.",
  },
  ru: {
    title: "Проверка и безопасность крипто-платежей",
    subtitle:
      "Перед оплатой криптовалютой ознакомьтесь, как платежи проверяются и защищаются.",
    bullets: [
      "Крипто-платежи обрабатываются лицензированным платёжным провайдером (PSP).",
      "Транзакции автоматически проверяются перед зачислением.",
      "В редких случаях платёж может быть временно удержан для дополнительной проверки.",
      "Транзакции с высоким риском могут быть отклонены по правилам комплаенса.",
      "Только проверенные платежи завершаются и передаются продавцу.",
    ],
    whyTitle: "Зачем это нужно",
    whyText:
      "Крипто-транзакции необратимы. Проверка помогает защитить клиентов, продавцов и платёжную инфраструктуру от мошенничества и высокорисковой активности.",
    footer:
      "Если у вас вопросы по заказу, пожалуйста, свяжитесь со службой поддержки магазина.",
  },
};

function LangButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white"
          : "rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
      }
    >
      {children}
    </button>
  );
}

export default function CryptoPaymentInfoPage() {
  const [lang, setLang] = useState<Lang>("en");
  const c = useMemo(() => COPY[lang], [lang]);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-200 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl md:text-2xl">
                  {c.title}
                </h1>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                  {c.subtitle}
                </p>
              </div>

              {/* Language switcher */}
              <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                <LangButton
                  active={lang === "en"}
                  onClick={() => setLang("en")}
                >
                  EN
                </LangButton>
                <LangButton
                  active={lang === "it"}
                  onClick={() => setLang("it")}
                >
                  IT
                </LangButton>
                <LangButton
                  active={lang === "ru"}
                  onClick={() => setLang("ru")}
                >
                  RU
                </LangButton>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <ul className="space-y-2 text-sm leading-relaxed text-slate-800 sm:text-[15px]">
                {c.bullets.map((t, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="mt-1 text-slate-400">•</span>
                    <span className="min-w-0 break-all">{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 sm:mt-6">
              <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                {c.whyTitle}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                {c.whyText}
              </p>
            </div>

            <p className="mt-6 text-xs leading-relaxed text-slate-500 sm:text-sm">
              {c.footer}
            </p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <a
                href="/"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-center text-xs font-semibold text-slate-900 hover:bg-slate-50 sm:text-sm"
              >
                Back to store
              </a>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-400 sm:text-xs">
          Demo page. No real funds are moved.
        </p>
      </div>
    </main>
  );
}
