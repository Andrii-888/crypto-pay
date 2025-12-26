// src/components/cryptoPay/CryptoPayStatusWithPolling.tsx
"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoPayStatusBadge } from "./CryptoPayStatusBadge";
import type { InvoiceData } from "@/lib/invoiceStore";

export type InvoiceStatus = "waiting" | "confirmed" | "expired" | "rejected";

type Props = {
  invoiceId: string;
  initialStatus: InvoiceStatus;
  expiresAt?: string | null;

  onInvoiceUpdate?: React.Dispatch<React.SetStateAction<InvoiceData>>;
};

function isFinalStatus(s: InvoiceStatus) {
  return s === "confirmed" || s === "expired" || s === "rejected";
}

function normalizeStatus(s?: string | null): InvoiceStatus {
  return s === "waiting" ||
    s === "confirmed" ||
    s === "expired" ||
    s === "rejected"
    ? (s as InvoiceStatus)
    : "waiting";
}

function isExpiredByTime(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const t = Date.parse(expiresAt);
  if (Number.isNaN(t)) return false;
  return Date.now() >= t;
}

type StatusApiOk = {
  ok: true;
  [key: string]: any;
};

type StatusApiResponse =
  | StatusApiOk
  | { ok: false; error?: string; details?: string };

function mergeSnapshot(prev: InvoiceData, snap: StatusApiOk): InvoiceData {
  const src = (snap as any).invoice ?? snap;

  const next: InvoiceData = { ...prev };

  const setIfDefined = <K extends keyof InvoiceData>(key: K, value: any) => {
    if (value !== undefined && value !== null) {
      next[key] = value;
    }
  };

  setIfDefined("invoiceId", src.invoiceId ?? src.id);

  setIfDefined("status", normalizeStatus(src.status) as InvoiceData["status"]);
  setIfDefined("expiresAt", src.expiresAt);

  setIfDefined("createdAt", src.createdAt);
  setIfDefined("detectedAt", src.detectedAt);
  setIfDefined("confirmedAt", src.confirmedAt);

  setIfDefined("fiatAmount", src.fiatAmount);
  setIfDefined("fiatCurrency", src.fiatCurrency);
  setIfDefined("cryptoAmount", src.cryptoAmount);
  setIfDefined("cryptoCurrency", src.cryptoCurrency);
  setIfDefined("network", src.network);

  setIfDefined("grossAmount", src.grossAmount);
  setIfDefined("feeAmount", src.feeAmount);
  setIfDefined("netAmount", src.netAmount);
  setIfDefined("feeBps", src.feeBps);
  setIfDefined("feePayer", src.feePayer);

  setIfDefined("fxRate", src.fxRate);
  setIfDefined("fxPair", src.fxPair);

  // tx: не затираем null/undefined
  setIfDefined("txStatus", src.txStatus ?? prev.txStatus ?? "pending");
  setIfDefined("txHash", src.txHash);
  setIfDefined("walletAddress", src.walletAddress);

  if (typeof src.confirmations === "number")
    next.confirmations = src.confirmations;
  if (typeof src.requiredConfirmations === "number")
    next.requiredConfirmations = src.requiredConfirmations;

  setIfDefined("amlStatus", src.amlStatus);
  setIfDefined("riskScore", src.riskScore);
  setIfDefined("assetStatus", src.assetStatus);
  setIfDefined("assetRiskScore", src.assetRiskScore);

  setIfDefined("decisionStatus", src.decisionStatus);
  setIfDefined("decisionReasonCode", src.decisionReasonCode);
  setIfDefined("decisionReasonText", src.decisionReasonText);
  setIfDefined("decidedAt", src.decidedAt);
  setIfDefined("decidedBy", src.decidedBy);

  setIfDefined("merchantId", src.merchantId);

  return next;
}

export function CryptoPayStatusWithPolling({
  invoiceId,
  initialStatus,
  expiresAt,
  onInvoiceUpdate,
}: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<InvoiceStatus>(
    normalizeStatus(initialStatus)
  );
  const statusRef = useRef<InvoiceStatus>(normalizeStatus(initialStatus));
  const redirectedRef = useRef(false);

  useEffect(() => {
    const s = normalizeStatus(initialStatus);
    setStatus(s);
    statusRef.current = s;
  }, [initialStatus]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;

      const id = String(invoiceId ?? "").trim();
      if (!id) {
        timeoutId = setTimeout(tick, 2500);
        return;
      }

      // stop polling once final
      if (isFinalStatus(statusRef.current)) return;

      // client-side time expiry fallback
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

        if (res.ok) {
          const snap = (await res.json()) as StatusApiResponse;

          if ((snap as any).ok) {
            const okSnap = snap as StatusApiOk;

            onInvoiceUpdate?.((prev) => mergeSnapshot(prev, okSnap));

            const nextStatus = normalizeStatus((okSnap as any).status);
            if (nextStatus !== statusRef.current) {
              statusRef.current = nextStatus;
              setStatus(nextStatus);
            }

            if (nextStatus === "confirmed" && !redirectedRef.current) {
              redirectedRef.current = true;
              router.push(
                `/open/pay/success?invoiceId=${encodeURIComponent(id)}`
              );
              return;
            }

            if (isFinalStatus(nextStatus)) return;
          }
        }
      } catch {
        // ignore
      }

      timeoutId = setTimeout(tick, 2500);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [invoiceId, expiresAt, onInvoiceUpdate, router]);

  return <CryptoPayStatusBadge status={status} />;
}
