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

export function CryptoPayStatusBadge({ status }: CryptoPayStatusBadgeProps) {
  let label = "";
  let themeClasses = "";

  switch (status) {
    case "waiting":
      label = "Waiting for crypto payment";
      themeClasses = "bg-amber-50 text-amber-800 border-amber-200";
      break;
    case "pending":
      label = "On-chain pending";
      themeClasses = "bg-sky-50 text-sky-800 border-sky-200";
      break;
    case "confirmed":
      label = "Payment confirmed";
      themeClasses = "bg-emerald-50 text-emerald-800 border-emerald-200";
      break;
    case "expired":
      label = "Payment link expired";
      themeClasses = "bg-slate-100 text-slate-700 border-slate-200";
      break;
    case "rejected":
      label = "Payment rejected";
      themeClasses = "bg-rose-50 text-rose-800 border-rose-200";
      break;
  }

  return (
    <div
      className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${themeClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </div>
  );
}
