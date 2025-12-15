// src/components/cryptoPay/CryptoPayStatusWithPolling.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoPayStatusBadge } from "./CryptoPayStatusBadge";

export type InvoiceStatus =
  | "waiting"
  | "pending"
  | "confirmed"
  | "expired"
  | "rejected";

type Props = {
  invoiceId: string;
  initialStatus: InvoiceStatus;
  expiresAt: string;
};

type PspInvoice = {
  id: string;
  status: InvoiceStatus;
  expiresAt?: string;
};

const PSP_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

function isFinalStatus(s: InvoiceStatus) {
  return s === "confirmed" || s === "expired" || s === "rejected";
}

function isExpiredByTime(expiresAt?: string) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return Date.now() >= t;
}

export function CryptoPayStatusWithPolling({
  invoiceId,
  initialStatus,
  expiresAt,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<InvoiceStatus>(initialStatus);
  const statusRef = useRef<InvoiceStatus>(initialStatus);
  const redirectedRef = useRef(false);

  // ✅ держим state в синхроне, если initialStatus поменялся извне
  useEffect(() => {
    setStatus(initialStatus);
    statusRef.current = initialStatus;
  }, [initialStatus]);

  // ✅ локальный тайм-аут на истечение (даже если PSP не отвечает)
  useEffect(() => {
    if (isFinalStatus(status)) return;
    if (!expiresAt) return;

    const t = Date.parse(expiresAt);
    if (Number.isNaN(t)) return;

    const ms = t - Date.now();
    if (ms <= 0) {
      setStatus("expired");
      return;
    }

    const timer = setTimeout(() => {
      // если к моменту истечения не финальный — ставим expired
      if (!isFinalStatus(statusRef.current)) {
        setStatus("expired");
      }
    }, ms);

    return () => clearTimeout(timer);
  }, [expiresAt, status]);

  // 🛰 Polling статуса раз в 5 сек (из PSP-core)
  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    // уже финальный — не поллим
    if (isFinalStatus(statusRef.current)) return;

    // нет API — поллинг выключен, живём на demo-логике + expiresAt
    if (!PSP_API_URL) return;

    const tick = async () => {
      if (cancelled) return;

      // если уже финальный — не делаем запросы
      if (isFinalStatus(statusRef.current)) return;

      // если уже истёк по времени — не дергаем PSP
      if (isExpiredByTime(expiresAt)) {
        setStatus("expired");
        return;
      }

      try {
        const res = await fetch(
          `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`,
          {
            cache: "no-store",
          }
        );

        if (res.ok) {
          const data = (await res.json()) as PspInvoice;

          if (data?.status) {
            const next = data.status;

            if (next !== statusRef.current) {
              statusRef.current = next;
              setStatus(next);
            }

            if (isFinalStatus(next)) return;
          }
        }
      } catch {
        // игнорируем, попробуем снова
      }

      // планируем следующий тик
      timeout = setTimeout(tick, 5000);
    };

    // первый тик сразу
    void tick();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [invoiceId, expiresAt]);

  // 🔁 Авто-редирект на success при confirmed (один раз)
  useEffect(() => {
    if (status === "confirmed" && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push(
        `/open/pay/success?invoiceId=${encodeURIComponent(invoiceId)}`
      );
    }
  }, [status, invoiceId, router]);

  return <CryptoPayStatusBadge status={status} />;
}
