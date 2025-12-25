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

  // Parent passes setInvoice, so we must accept functional updates
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
  // backend can return a lot of fields — we accept anything and merge safely
  [key: string]: any;
};

type StatusApiResponse =
  | StatusApiOk
  | { ok: false; error?: string; details?: string };

/**
 * Merge API snapshot into InvoiceData, NEVER wiping existing fields with null/undefined.
 * This is the key to "no flicker" and stable UI.
 */
function mergeSnapshot(prev: InvoiceData, snap: StatusApiOk): InvoiceData {
  // In case backend later wraps payload as { invoice: {...} }
  const src = (snap as any).invoice ?? snap;

  const next: InvoiceData = { ...prev };

  const setIfDefined = <K extends keyof InvoiceData>(key: K, value: any) => {
    if (value !== undefined && value !== null) {
      next[key] = value;
    }
  };

  // Always keep invoiceId consistent
  setIfDefined("invoiceId", src.invoiceId ?? src.id);

  // Status / expiry
  setIfDefined("status", normalizeStatus(src.status) as InvoiceData["status"]);
  setIfDefined("expiresAt", src.expiresAt);

  // Amounts / currencies
  setIfDefined("fiatAmount", src.fiatAmount);
  setIfDefined("fiatCurrency", src.fiatCurrency);
  setIfDefined("cryptoAmount", src.cryptoAmount);
  setIfDefined("cryptoCurrency", src.cryptoCurrency);
  setIfDefined("network", src.network);

  // Fees / FX
  setIfDefined("grossAmount", src.grossAmount);
  setIfDefined("feeAmount", src.feeAmount);
  setIfDefined("netAmount", src.netAmount);
  setIfDefined("feeBps", src.feeBps);
  setIfDefined("feePayer", src.feePayer);

  setIfDefined("fxRate", src.fxRate);
  setIfDefined("fxPair", src.fxPair);

  // TX snapshot (never overwrite with null/undefined)
  setIfDefined("txStatus", src.txStatus ?? prev.txStatus ?? "pending");
  setIfDefined("txHash", src.txHash);
  setIfDefined("walletAddress", src.walletAddress);

  if (typeof src.confirmations === "number") {
    next.confirmations = src.confirmations;
  }

  if (typeof src.requiredConfirmations === "number") {
    next.requiredConfirmations = src.requiredConfirmations;
  }

  // Timestamps
  setIfDefined("detectedAt", src.detectedAt);
  setIfDefined("confirmedAt", src.confirmedAt);
  setIfDefined("createdAt", src.createdAt);

  // AML / decision
  setIfDefined("amlStatus", src.amlStatus);
  setIfDefined("riskScore", src.riskScore);
  setIfDefined("assetStatus", src.assetStatus);
  setIfDefined("assetRiskScore", src.assetRiskScore);

  setIfDefined("decisionStatus", src.decisionStatus);
  setIfDefined("decisionReasonCode", src.decisionReasonCode);
  setIfDefined("decisionReasonText", src.decisionReasonText);
  setIfDefined("decidedAt", src.decidedAt);
  setIfDefined("decidedBy", src.decidedBy);

  // Merchant
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

  // keep badge in sync if parent updates (SSR->CSR hydration)
  useEffect(() => {
    const s = normalizeStatus(initialStatus);
    setStatus(s);
    statusRef.current = s;
  }, [initialStatus]);

  // local expiry fallback (even if API down)
  useEffect(() => {
    if (isFinalStatus(statusRef.current)) return;
    if (!expiresAt) return;

    const t = Date.parse(expiresAt);
    if (Number.isNaN(t)) return;

    const ms = t - Date.now();
    if (ms <= 0) {
      statusRef.current = "expired";
      setStatus("expired");
      return;
    }

    const timer = setTimeout(() => {
      if (!isFinalStatus(statusRef.current)) {
        statusRef.current = "expired";
        setStatus("expired");
      }
    }, ms);

    return () => clearTimeout(timer);
  }, [expiresAt]);

  // Poll via Next API (server adds x-api-key)
  useEffect(() => {
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      if (!invoiceId) return;
      if (isFinalStatus(statusRef.current)) return;

      if (isExpiredByTime(expiresAt)) {
        statusRef.current = "expired";
        setStatus("expired");
        return;
      }

      try {
        const res = await fetch(
          `/api/payments/status?invoiceId=${encodeURIComponent(invoiceId)}`,
          { cache: "no-store" }
        );

        if (res.ok) {
          const snap = (await res.json()) as StatusApiResponse;

          if ((snap as any).ok) {
            const okSnap = snap as StatusApiOk;

            // merge into shared invoice state (FULL payload, no wipe)
            onInvoiceUpdate?.((prev) => mergeSnapshot(prev, okSnap));

            const nextStatus = normalizeStatus((okSnap as any).status);
            if (nextStatus !== statusRef.current) {
              statusRef.current = nextStatus;
              setStatus(nextStatus);
            }

            // redirect once when confirmed
            if (nextStatus === "confirmed" && !redirectedRef.current) {
              redirectedRef.current = true;
              router.push(
                `/open/pay/success?invoiceId=${encodeURIComponent(invoiceId)}`
              );
              return;
            }

            if (isFinalStatus(nextStatus)) return;
          }
        }
      } catch {
        // ignore transient errors
      }

      timeout = setTimeout(tick, 2500);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [invoiceId, expiresAt, onInvoiceUpdate, router]);

  return <CryptoPayStatusBadge status={status} />;
}
