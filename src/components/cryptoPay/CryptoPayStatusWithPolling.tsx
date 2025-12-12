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
  expiresAt: string; // пока не используем, оставляем
};

type PspInvoice = {
  id: string;
  status: InvoiceStatus;
  expiresAt?: string;
};

const PSP_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function isFinalStatus(s: InvoiceStatus) {
  return s === "confirmed" || s === "expired" || s === "rejected";
}

export function CryptoPayStatusWithPolling(props: Props) {
  const { invoiceId, initialStatus } = props;

  const [status, setStatus] = useState<InvoiceStatus>(initialStatus);
  const statusRef = useRef<InvoiceStatus>(initialStatus);

  const router = useRouter();

  // держим ref синхронным, чтобы interval не ловил "устаревший" status
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // 🛰 Polling статуса раз в 5 сек (напрямую из PSP-core)
  useEffect(() => {
    let isMounted = true;

    // Если уже финальный — ничего не опрашиваем
    if (isFinalStatus(initialStatus)) {
      return () => {
        isMounted = false;
      };
    }

    // Если нет API URL — тихо выходим (будет работать demo-режим без бекенда)
    if (!PSP_API_URL) {
      return () => {
        isMounted = false;
      };
    }

    const base = PSP_API_URL.replace(/\/+$/, "");

    const tick = async () => {
      if (!isMounted) return;

      try {
        const res = await fetch(
          `${base}/invoices/${encodeURIComponent(invoiceId)}`,
          {
            cache: "no-store",
          }
        );

        if (!res.ok) return;

        const data = (await res.json()) as PspInvoice;

        if (!data?.status || !isMounted) return;

        const nextStatus = data.status;

        // обновляем только если реально изменился
        if (nextStatus !== statusRef.current) {
          setStatus(nextStatus);
        }

        // если финальный — дальше можно не опрашивать
        if (isFinalStatus(nextStatus)) {
          clearInterval(interval);
        }
      } catch {
        // игнорируем сетевые ошибки, попробуем снова
      }
    };

    // первый запрос сразу, чтобы не ждать 5 секунд
    void tick();

    const interval = setInterval(tick, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [invoiceId, initialStatus]);

  // 🔁 Авто-редирект на success при confirmed
  useEffect(() => {
    if (status === "confirmed") {
      router.push(
        `/open/pay/success?invoiceId=${encodeURIComponent(invoiceId)}`
      );
    }
  }, [status, invoiceId, router]);

  return <CryptoPayStatusBadge status={status} />;
}
