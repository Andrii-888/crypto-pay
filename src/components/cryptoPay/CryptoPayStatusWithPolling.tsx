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
  onInvoiceUpdate?: (updater: (prev: InvoiceData) => InvoiceData) => void;
};

type StatusApiOk = {
  ok: true;
  invoiceId?: string;
  status?: string;
  expiresAt?: string | null;

  createdAt?: string | null;
  detectedAt?: string | null;
  confirmedAt?: string | null;

  fiatAmount?: number;
  fiatCurrency?: string;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  network?: string;

  grossAmount?: number;
  feeAmount?: number;
  netAmount?: number;
  feeBps?: number;
  feePayer?: string;

  fxRate?: number;
  fxPair?: string;

  txStatus?: string;
  txHash?: string | null;
  walletAddress?: string | null;
  confirmations?: number;
  requiredConfirmations?: number;

  amlStatus?: string | null;
  riskScore?: number | null;
  assetStatus?: string | null;
  assetRiskScore?: number | null;

  decisionStatus?: string | null;
  decisionReasonCode?: string | null;
  decisionReasonText?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;

  merchantId?: string | null;
};

type StatusApiResponse =
  | StatusApiOk
  | { ok: false; error?: string; details?: string };

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

function mergeSnapshot(prev: InvoiceData, snap: StatusApiOk): InvoiceData {
  const next: InvoiceData = { ...prev };

  const set = <K extends keyof InvoiceData>(key: K, value: unknown) => {
    if (value === undefined || value === null) return;
    (next[key] as unknown) = value as InvoiceData[K];
  };

  set("invoiceId", snap.invoiceId ?? prev.invoiceId);
  set("status", normalizeStatus(snap.status) as InvoiceData["status"]);
  set("expiresAt", snap.expiresAt);

  set("createdAt", snap.createdAt);
  set("detectedAt", snap.detectedAt);
  set("confirmedAt", snap.confirmedAt);

  set("fiatAmount", snap.fiatAmount);
  set("fiatCurrency", snap.fiatCurrency);
  set("cryptoAmount", snap.cryptoAmount);
  set("cryptoCurrency", snap.cryptoCurrency);
  set("network", snap.network);

  set("grossAmount", snap.grossAmount);
  set("feeAmount", snap.feeAmount);
  set("netAmount", snap.netAmount);
  set("feeBps", snap.feeBps);
  set("feePayer", snap.feePayer);

  set("fxRate", snap.fxRate);
  set("fxPair", snap.fxPair);

  // tx (не затираем если пришло null/undefined)
  set("txStatus", snap.txStatus ?? prev.txStatus);
  set("txHash", snap.txHash ?? prev.txHash);
  set("walletAddress", snap.walletAddress ?? prev.walletAddress);

  if (typeof snap.confirmations === "number") {
    set("confirmations", snap.confirmations);
  }
  if (typeof snap.requiredConfirmations === "number") {
    set("requiredConfirmations", snap.requiredConfirmations);
  }

  set("amlStatus", snap.amlStatus);
  set("riskScore", snap.riskScore);
  set("assetStatus", snap.assetStatus);
  set("assetRiskScore", snap.assetRiskScore);

  set("decisionStatus", snap.decisionStatus);
  set("decisionReasonCode", snap.decisionReasonCode);
  set("decisionReasonText", snap.decisionReasonText);
  set("decidedAt", snap.decidedAt);
  set("decidedBy", snap.decidedBy);

  set("merchantId", snap.merchantId);

  return next;
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

  // синхронизация initialStatus → ref + state (один раз)
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

        const snap = (await res.json()) as StatusApiResponse;
        if (!snap.ok) throw new Error("status api error");

        onInvoiceUpdate?.((prev) => mergeSnapshot(prev, snap));

        const nextStatus = normalizeStatus(snap.status);
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

    void poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [invoiceId, expiresAt, onInvoiceUpdate, router]);

  return <CryptoPayStatusBadge status={status} />;
}
