// src/components/cryptoPay/CryptoPayStatusBadge.tsx
"use client";

import { useEffect, useState } from "react";

// Добавили "rejected" к статусам
type CryptoPayStatus = "waiting" | "confirmed" | "expired" | "rejected";

type CryptoPayStatusBadgeProps = {
  expiresAt: string;
  initialStatus?: CryptoPayStatus;
};

function isExpired(expiresAt: string): boolean {
  const target = new Date(expiresAt);
  return Date.now() > target.getTime();
}

export function CryptoPayStatusBadge({
  expiresAt,
  initialStatus = "waiting",
}: CryptoPayStatusBadgeProps) {
  const [expired, setExpired] = useState(() => isExpired(expiresAt));
  const [status, setStatus] = useState<CryptoPayStatus>(initialStatus);

  // Следим за истечением времени
  useEffect(() => {
    const id = setInterval(() => {
      setExpired(isExpired(expiresAt));
    }, 1000);

    return () => clearInterval(id);
  }, [expiresAt]);

  // Если время вышло и платёж всё ещё "waiting" — помечаем как expired
  // (но НЕ трогаем confirmed и rejected)
  useEffect(() => {
    if (expired && status === "waiting") {
      setStatus("expired");
    }
  }, [expired, status]);

  let label: string;
  let bgClass: string;
  let dotClass: string;

  switch (status) {
    case "confirmed":
      label = "Payment confirmed";
      bgClass = "bg-emerald-50 text-emerald-700";
      dotClass = "bg-emerald-400";
      break;
    case "expired":
      label = "Invoice expired — create a new payment link";
      bgClass = "bg-slate-100 text-slate-700";
      dotClass = "bg-slate-400";
      break;
    case "rejected":
      label = "Payment rejected — please contact support or create a new link";
      bgClass = "bg-red-50 text-red-700";
      dotClass = "bg-red-400";
      break;
    default:
      label = "Waiting for payment — on-chain confirmation pending";
      bgClass = "bg-amber-50 text-amber-700";
      dotClass = "bg-amber-400";
      break;
  }

  return (
    <div className="mb-4 flex justify-center">
      <div
        className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[11px] ${bgClass}`}
      >
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span className="truncate">{label}</span>
      </div>
    </div>
  );
}
