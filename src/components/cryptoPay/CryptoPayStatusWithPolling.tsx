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

  const [invoiceSnap, setInvoiceSnap] = useState<Record<
    string,
    unknown
  > | null>(null);

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
        setInvoiceSnap(invObj);

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

  return (
    <div className="w-full">
      <CryptoPayStatusBadge status={status} />

      {/* DEBUG (dev only): invoice snapshot from polling */}
      {process.env.NODE_ENV !== "production" && invoiceSnap && (
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-2 text-xs font-semibold text-zinc-300">
            Debug: invoice snapshot
          </div>

          <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">invoice.status</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.status ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">txStatus</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.txStatus ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">walletAddress</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.walletAddress ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">txHash</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.txHash ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">
                confirmations / required
              </div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.confirmations ?? "—")} /{" "}
                {String(invoiceSnap.requiredConfirmations ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">amlStatus</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.amlStatus ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">amlProvider</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.amlProvider ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">amlCheckedAt</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.amlCheckedAt ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">assetStatus</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.assetStatus ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">assetRiskScore</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.assetRiskScore ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">decisionStatus</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.decisionStatus ?? "—")}
              </div>
            </div>

            <div className="rounded-lg bg-zinc-950 p-2">
              <div className="text-[11px] text-zinc-500">decisionReason</div>
              <div className="break-all text-zinc-200">
                {String(invoiceSnap.decisionReasonCode ?? "—")}{" "}
                {invoiceSnap.decisionReasonText
                  ? `(${String(invoiceSnap.decisionReasonText)})`
                  : ""}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
