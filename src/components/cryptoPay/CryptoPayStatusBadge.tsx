// src/components/cryptoPay/CryptoPayStatusBadge.tsx

type CryptoPayStatus =
  | "waiting"
  | "pending"
  | "confirmed"
  | "expired"
  | "rejected";

type CryptoPayStatusBadgeProps = {
  status: CryptoPayStatus;
};

const STATUS_MAP: Record<
  CryptoPayStatus,
  {
    label: string;
    classes: string;
    pulse?: boolean;
  }
> = {
  waiting: {
    label: "Waiting for payment",
    classes: "bg-amber-50 text-amber-800 border-amber-200",
    pulse: true,
  },
  pending: {
    label: "On-chain pending",
    classes: "bg-sky-50 text-sky-800 border-sky-200",
    pulse: true,
  },
  confirmed: {
    label: "Payment confirmed",
    classes: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  expired: {
    label: "Payment expired",
    classes: "bg-slate-100 text-slate-700 border-slate-200",
  },
  rejected: {
    label: "Payment rejected",
    classes: "bg-rose-50 text-rose-800 border-rose-200",
  },
};

export function CryptoPayStatusBadge({ status }: CryptoPayStatusBadgeProps) {
  const cfg = STATUS_MAP[status];

  return (
    <div className="mb-3">
      <div
        className={`
          inline-flex items-center gap-2
          h-7 px-3
          rounded-full border
          text-xs font-medium
          ${cfg.classes}
        `}
      >
        {/* Indicator (fixed size, no layout shift) */}
        <span
          className={`
            inline-block h-1.5 w-1.5 rounded-full bg-current
            ${cfg.pulse ? "animate-pulse" : ""}
          `}
        />

        {/* Label (never wraps, stable width) */}
        <span className="whitespace-nowrap leading-none">{cfg.label}</span>
      </div>
    </div>
  );
}
