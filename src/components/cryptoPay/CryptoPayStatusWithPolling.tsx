// src/components/cryptoPay/CryptoPayStatusWithPolling.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoPayStatusBadge } from "./CryptoPayStatusBadge";
import type { InvoiceData } from "@/lib/invoiceStore";

export type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

type Props = {
  invoiceId: string;
  initialStatus: InvoiceStatus;
  expiresAt?: string | null;
  onInvoiceUpdate?: (
    patch: InvoiceData | ((prev: InvoiceData) => InvoiceData)
  ) => void;
};

function normalizeStatus(s?: string | null): InvoiceStatus {
  return s === "waiting" ||
    s === "confirmed" ||
    s === "expired" ||
    s === "rejected"
    ? s
    : "waiting";
}

function isFinalStatus(s: InvoiceStatus) {
  return s === "confirmed" || s === "expired" || s === "rejected";
}

function isExpiredByTime(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  return Number.isFinite(t) && Date.now() >= t;
}

export function CryptoPayStatusWithPolling({
  invoiceId,
  initialStatus,
  expiresAt,
  onInvoiceUpdate,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<InvoiceStatus>(() =>
    normalizeStatus(initialStatus)
  );

  const statusRef = useRef<InvoiceStatus>(normalizeStatus(initialStatus));
  const redirectedRef = useRef(false);

  // sync initialStatus -> ref + state
  useEffect(() => {
    const s = normalizeStatus(initialStatus);
    statusRef.current = s;
    setStatus(s);
  }, [initialStatus]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      if (cancelled) return;

      const id = invoiceId.trim();
      if (!id || redirectedRef.current) {
        timer = setTimeout(poll, 2500);
        return;
      }

      if (isFinalStatus(statusRef.current)) return;

      if (isExpiredByTime(expiresAt)) {
        statusRef.current = "expired";
        setStatus("expired");
        return;
      }

      try {
        const res = await fetch(
          `/api/payments/status?invoiceId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error("status fetch failed");

        const snap = await res.json();

        if (!snap || typeof snap !== "object" || snap.ok !== true) {
          throw new Error("status api error");
        }

        // 🔹 отдаем снапшот наверх (PaymentClient сам обновляет state)
        onInvoiceUpdate?.(snap);

        const nextStatus = normalizeStatus(
          typeof snap.status === "string" ? snap.status : undefined
        );

        if (nextStatus !== statusRef.current) {
          statusRef.current = nextStatus;
          setStatus(nextStatus);
        }

        if (nextStatus === "confirmed" && !redirectedRef.current) {
          redirectedRef.current = true;
          router.push(`/open/pay/success?invoiceId=${encodeURIComponent(id)}`);
          return;
        }

        if (!isFinalStatus(nextStatus)) {
          timer = setTimeout(poll, 2500);
        }
      } catch {
        timer = setTimeout(poll, 3000);
      }
    };

    timer = setTimeout(poll, 2500);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [invoiceId, expiresAt, onInvoiceUpdate, router]);

  return <CryptoPayStatusBadge status={status} />;
}
