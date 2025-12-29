// src/components/cryptoPay/CryptoPayTimer.tsx
"use client";

import { useMemo, useSyncExternalStore } from "react";

type Props = {
  expiresAt?: string | null;
};

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

function subscribeTick(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}

export function CryptoPayTimer({ expiresAt }: Props) {
  const expiryMs = useMemo(() => {
    if (!expiresAt) return null;
    const ms = Date.parse(expiresAt);
    return Number.isNaN(ms) ? null : ms;
  }, [expiresAt]);

  // SSR snapshot must be stable → always "—"
  const now = useSyncExternalStore(
    subscribeTick,
    () => Date.now(),
    () => 0
  );

  const label = useMemo(() => {
    if (!expiryMs) return "—";
    if (now === 0) return "—"; // server / first hydration snapshot
    const diff = Math.max(0, Math.floor((expiryMs - now) / 1000));
    return formatMMSS(diff);
  }, [expiryMs, now]);

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">
          Quote expires in
        </span>

        <span className="font-mono text-slate-900" suppressHydrationWarning>
          {label}
        </span>
      </div>
    </section>
  );
}
