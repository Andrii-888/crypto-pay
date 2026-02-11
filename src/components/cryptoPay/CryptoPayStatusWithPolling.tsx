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

type StatusApiOk = {
  ok: true;
  invoice: unknown;
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

function isStatusApiOk(x: unknown): x is StatusApiOk {
  if (!x || typeof x !== "object") return false;
  const o = x as { ok?: unknown; invoice?: unknown };
  return o.ok === true && o.invoice != null;
}

function asObject(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
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

    const schedule = (ms: number) => {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(poll, ms);
    };

    const poll = async () => {
      if (cancelled) return;

      const id = invoiceId.trim();
      if (!id || redirectedRef.current) {
        schedule(2500);
        return;
      }

      if (isFinalStatus(statusRef.current)) return;

      if (isExpiredByTime(expiresAt)) {
        statusRef.current = "expired";
        setStatus("expired");
        onInvoiceUpdate?.((prev) => ({ ...prev, status: "expired" }));
        return;
      }

      try {
        const res = await fetch(
          `/api/payments/status?invoiceId=${encodeURIComponent(id)}`,
          { cache: "no-store" }
        );

        if (!res.ok) throw new Error("status fetch failed");

        const snap = (await res.json()) as unknown;
        if (!isStatusApiOk(snap)) throw new Error("status api shape mismatch");

        const invObj = asObject(snap.invoice);

        // ✅ status is inside invoice
        const nextStatus = normalizeStatus(
          typeof invObj.status === "string" ? invObj.status : undefined
        );

        // ✅ push entire invoice snapshot up (so wallet address / txHash appear)
        onInvoiceUpdate?.((prev) => {
          // we merge safely; prev has correct types, server snapshot may contain more fields
          return {
            ...prev,
            ...(snap.invoice as Partial<InvoiceData>),
            invoiceId: prev.invoiceId || id,
          };
        });

        if (nextStatus !== statusRef.current) {
          statusRef.current = nextStatus;
          setStatus(nextStatus);
        }

        if (nextStatus === "confirmed" && !redirectedRef.current) {
          redirectedRef.current = true;
          router.push(`/open/pay/success?invoiceId=${encodeURIComponent(id)}`);
          return;
        }

        if (!isFinalStatus(nextStatus)) schedule(2500);
      } catch {
        schedule(3000);
      }
    };

    schedule(2500);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [invoiceId, expiresAt, router, onInvoiceUpdate]);

  return <CryptoPayStatusBadge status={status} />;
}
