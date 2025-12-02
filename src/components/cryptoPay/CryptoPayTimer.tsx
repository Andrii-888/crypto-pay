// src/components/cryptoPay/CryptoPayTimer.tsx
"use client";

import { useEffect, useState } from "react";

type CryptoPayTimerProps = {
  expiresAt: string; // ISO-строка с сервера
};

function getRemainingSeconds(expiresAt: string): number {
  const target = new Date(expiresAt);
  const diff = target.getTime() - Date.now();
  return Math.max(0, Math.floor(diff / 1000));
}

export function CryptoPayTimer({ expiresAt }: CryptoPayTimerProps) {
  const [initialSeconds] = useState(() => getRemainingSeconds(expiresAt));
  const [remaining, setRemaining] = useState(initialSeconds);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(getRemainingSeconds(expiresAt));
    }, 1000);

    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const timeLabel =
    remaining > 0
      ? `${minutes}:${seconds.toString().padStart(2, "0")}`
      : "Expired";

  const progressPercent =
    initialSeconds > 0 ? Math.max(0, (remaining / initialSeconds) * 100) : 0;

  const isActive = remaining > 0;

  return (
    <div className="space-y-1 mt-1">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isActive ? "bg-amber-400" : "bg-red-400"
            }`}
          />
          <span className="font-medium text-slate-700">
            {isActive ? "Quote expires in" : "Quote expired"}
          </span>
        </div>
        <span className="font-mono text-slate-900">{timeLabel}</span>
      </div>

      {isActive && (
        <div className="h-1 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full bg-slate-900 transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
