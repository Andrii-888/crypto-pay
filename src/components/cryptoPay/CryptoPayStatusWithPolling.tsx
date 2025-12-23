// src/components/cryptoPay/CryptoPayStatusWithPolling.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoPayStatusBadge } from "./CryptoPayStatusBadge";
import type { InvoiceData } from "@/lib/invoiceStore";

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

  // ✅ новый callback: отдаём наружу полный invoice snapshot
  onInvoiceUpdate?: (invoice: InvoiceData) => void;
};

type PspInvoice = any;

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

function mapPspInvoiceToInvoiceData(data: PspInvoice): InvoiceData {
  return {
    invoiceId: data.id,

    createdAt: data.createdAt ?? null,
    expiresAt: data.expiresAt,

    fiatAmount: data.fiatAmount,
    fiatCurrency: data.fiatCurrency,

    cryptoAmount: data.cryptoAmount,
    cryptoCurrency: data.cryptoCurrency,

    status: data.status,
    paymentUrl: data.paymentUrl,

    grossAmount: data.grossAmount ?? null,
    feeAmount: data.feeAmount ?? null,
    netAmount: data.netAmount ?? null,
    feeBps: data.feeBps ?? null,
    feePayer: data.feePayer ?? null,

    fxRate: data.fxRate ?? null,
    fxPair: data.fxPair ?? null,

    network: data.network ?? null,

    txHash: data.txHash ?? null,
    walletAddress: data.walletAddress ?? null,
    txStatus: data.txStatus ?? null,

    confirmations: data.confirmations ?? null,
    requiredConfirmations: data.requiredConfirmations ?? null,

    detectedAt: data.detectedAt ?? null,
    confirmedAt: data.confirmedAt ?? null,

    riskScore: data.riskScore ?? null,
    amlStatus: data.amlStatus ?? null,

    assetRiskScore: data.assetRiskScore ?? null,
    assetStatus: data.assetStatus ?? null,

    merchantId: data.merchantId ?? null,

    decisionStatus: data.decisionStatus ?? null,
    decisionReasonCode: data.decisionReasonCode ?? null,
    decisionReasonText: data.decisionReasonText ?? null,
    decidedAt: data.decidedAt ?? null,
    decidedBy: data.decidedBy ?? null,
  };
}

export function CryptoPayStatusWithPolling({
  invoiceId,
  initialStatus,
  expiresAt,
  onInvoiceUpdate,
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
      if (!isFinalStatus(statusRef.current)) {
        setStatus("expired");
      }
    }, ms);

    return () => clearTimeout(timer);
  }, [expiresAt, status]);

  // 🛰 Polling полного invoice snapshot раз в 3 сек (из PSP-core)
  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (isFinalStatus(statusRef.current)) return;
    if (!PSP_API_URL) return;

    const tick = async () => {
      if (cancelled) return;
      if (isFinalStatus(statusRef.current)) return;

      if (isExpiredByTime(expiresAt)) {
        setStatus("expired");
        return;
      }

      try {
        const res = await fetch(
          `${PSP_API_URL}/invoices/${encodeURIComponent(invoiceId)}`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const data = (await res.json()) as PspInvoice;

          // ✅ отдаём наружу весь invoice
          if (data?.id) {
            onInvoiceUpdate?.(mapPspInvoiceToInvoiceData(data));
          }

          // ✅ status берём из нормализованного invoice, чтобы не словить "pending"
          if (data?.status) {
            const normalized = mapPspInvoiceToInvoiceData(data);
            const next = normalized.status as InvoiceStatus;

            if (next !== statusRef.current) {
              statusRef.current = next;
              setStatus(next);
            }

            if (isFinalStatus(next)) return;
          }
        }
      } catch {
        // ignore
      }

      timeout = setTimeout(tick, 3000);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [invoiceId, expiresAt, onInvoiceUpdate]);

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
