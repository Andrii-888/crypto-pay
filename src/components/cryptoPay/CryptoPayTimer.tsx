// src/components/cryptoPay/CryptoPayTimer.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  expiresAt?: string | null;
};

function formatMMSS(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

export function CryptoPayTimer({ expiresAt }: Props) {
  const expiryMs = useMemo(() => {
    if (!expiresAt) return null;
    const ms = Date.parse(expiresAt);
    return Number.isNaN(ms) ? null : ms;
  }, [expiresAt]);

  const [mounted, setMounted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  // 1) ensure SSR + first client render match (always "—")
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2) start ticking only after mount
  useEffect(() => {
    if (!mounted) return;
    if (!expiryMs) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor((expiryMs - Date.now()) / 1000));
      setSecondsLeft(diff);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [mounted, expiryMs]);

  const label = mounted && secondsLeft !== null ? formatMMSS(secondsLeft) : "—";

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
