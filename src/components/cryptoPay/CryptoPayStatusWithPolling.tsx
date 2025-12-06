"use client";

import { useEffect, useState } from "react";
import { CryptoPayStatusBadge } from "./CryptoPayStatusBadge";

type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

type Props = {
  invoiceId: string;
  initialStatus: InvoiceStatus;
  expiresAt: string;
};

type StatusResponse =
  | {
      ok: true;
      invoiceId: string;
      status: InvoiceStatus;
      expiresAt?: string;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Обёртка над CryptoPayStatusBadge,
 * которая периодически опрашивает API /api/payments/status
 * и обновляет статус оплаты.
 */
export function CryptoPayStatusWithPolling({
  invoiceId,
  initialStatus,
  expiresAt,
}: Props) {
  const [status, setStatus] = useState<InvoiceStatus>(initialStatus);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string>(expiresAt);

  useEffect(() => {
    let isMounted = true;

    // Если статус уже не "waiting", нет смысла опрашивать
    if (initialStatus !== "waiting") {
      return;
    }

    const interval = setInterval(async () => {
      // Если уже не "waiting" (например, мы руками обновили), выходим
      if (!isMounted || status !== "waiting") return;

      try {
        const res = await fetch(
          `/api/payments/status?invoiceId=${encodeURIComponent(invoiceId)}`,
          { cache: "no-store" }
        );

        if (!res.ok) return;

        const data = (await res.json()) as StatusResponse;

        if (!data.ok) return;

        if (!isMounted) return;

        // Обновляем статус, если он поменялся
        if (data.status && data.status !== status) {
          setStatus(data.status);

          // Если бэк прислал актуальный expiresAt — обновим и его
          if ("expiresAt" in data && data.expiresAt) {
            setCurrentExpiresAt(data.expiresAt);
          }

          // Если статус стал финальным — можно остановить опрос
          if (
            data.status === "confirmed" ||
            data.status === "expired" ||
            data.status === "rejected"
          ) {
            clearInterval(interval);
          }
        }
      } catch {
        // Ошибки сети тихо игнорируем — в следующем тике попробуем ещё раз
      }
    }, 5000); // опрос каждые 5 секунд

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [invoiceId, initialStatus, status]);

  return (
    <CryptoPayStatusBadge expiresAt={currentExpiresAt} initialStatus={status} />
  );
}
