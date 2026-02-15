// src/components/cryptoPay/CryptoPayWalletSection.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CryptoPayQrBox } from "./CryptoPayQrBox";

type CryptoPayWalletSectionProps = {
  cryptoCurrency: string;
  cryptoAmount: number;
  invoiceId: string;

  walletAddress?: string | null;
  network?: string | null; // "TRON" | "ETH"
};

type NetworkKey = "trc20" | "erc20";
type TokenKey = "USDT" | "USDC";

type TokenNetworkConfig = Partial<
  Record<
    NetworkKey,
    {
      code: string;
      label: string;
      description: string;
    }
  >
>;

const TOKEN_CONFIG: Record<TokenKey, TokenNetworkConfig> = {
  USDT: {
    trc20: {
      code: "TRC20 · TRON",
      label: "TRC20 · TRON",
      description: "Tether USDT · TRON (TRC-20)",
    },
    erc20: {
      code: "ERC20 · Ethereum",
      label: "ERC20 · Ethereum",
      description: "Tether USDT · Ethereum (ERC-20)",
    },
  },
  USDC: {
    erc20: {
      code: "ERC20 · Ethereum",
      label: "ERC20 · Ethereum",
      description: "USDC · Ethereum (ERC-20)",
    },
  },
};

type CopyKind = "address" | "amount" | null;

function normalizeToken(v: string): TokenKey {
  const t = String(v || "")
    .trim()
    .toUpperCase();
  return t === "USDC" ? "USDC" : "USDT";
}

function inferNetworkKey(network?: string | null): NetworkKey {
  const n = String(network || "")
    .trim()
    .toUpperCase();
  if (n === "TRON" || n === "TRC20") return "trc20";
  if (n === "ETH" || n === "ETHEREUM" || n === "ERC20") return "erc20";
  return "erc20";
}

export function CryptoPayWalletSection({
  cryptoCurrency,
  cryptoAmount,
  invoiceId,
  walletAddress,
  network: pspNetwork,
}: CryptoPayWalletSectionProps) {
  const router = useRouter();

  const token = useMemo(() => normalizeToken(cryptoCurrency), [cryptoCurrency]);
  const netKeyToUse: NetworkKey = useMemo(
    () => inferNetworkKey(pspNetwork),
    [pspNetwork]
  );

  const [copiedKind, setCopiedKind] = useState<CopyKind>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const addressToShow = useMemo(
    () => String(walletAddress ?? "").trim(),
    [walletAddress]
  );

  const amountNumber = useMemo(() => {
    if (cryptoAmount === null || cryptoAmount === undefined) return "0.000000";
    if (typeof cryptoAmount === "number") {
      return Number.isFinite(cryptoAmount)
        ? cryptoAmount.toFixed(6)
        : "0.000000";
    }
    const parsed = Number(String(cryptoAmount).replace(",", "."));
    return Number.isFinite(parsed) ? parsed.toFixed(6) : "0.000000";
  }, [cryptoAmount]);

  const amountText = useMemo(
    () => `${amountNumber} ${token}`,
    [amountNumber, token]
  );

  const networkCfg = useMemo(
    () => TOKEN_CONFIG[token]?.[netKeyToUse],
    [token, netKeyToUse]
  );

  const qrValue = useMemo(() => {
    if (!addressToShow) return "";
    const p = new URLSearchParams();
    p.set("amount", amountNumber);
    p.set("currency", token);
    p.set("invoice", invoiceId);

    const chain = String(pspNetwork ?? "")
      .trim()
      .toUpperCase();
    if (chain) p.set("network", chain);

    return `${addressToShow}?${p.toString()}`;
  }, [addressToShow, amountNumber, token, invoiceId, pspNetwork]);

  async function copy(text: string, kind: CopyKind) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKind(kind);
      setTimeout(() => setCopiedKind(null), 1400);
    } catch {
      // ignore
    }
  }

  async function handleConfirmDemoPayment() {
    if (!invoiceId || isConfirming) return;
    setIsConfirming(true);

    try {
      // Save tx context for Success screen "confirm once"
      // NOTE: txHash is not available in demo flow; Wallet tx flow will set it.
      sessionStorage.setItem(
        "cp_walletAddress",
        String(addressToShow ?? "").trim()
      );
      sessionStorage.setItem("cp_network", String(pspNetwork ?? "").trim());
      sessionStorage.setItem("cp_payCurrency", String(token ?? "").trim());

      // Reset confirm-once flag for a new attempt
      sessionStorage.removeItem("cp_confirmed_once");
    } catch {
      // ignore
    }

    // UX-only: user says “I’ve paid” -> go to success screen (real confirmation comes from polling)
    router.push(`/open/pay/success?invoiceId=${encodeURIComponent(invoiceId)}`);
  }

  if (!networkCfg) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">
          Receive {token}
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Send exactly{" "}
          <span className="inline-flex items-baseline gap-1 font-semibold text-slate-900 tabular-nums">
            <span>{amountNumber}</span>
            <span className="font-medium text-slate-700">{token}</span>
          </span>{" "}
          from your own wallet. The address and network are provided by the
          payment provider.
        </p>

        <p className="mt-2 text-[11px] text-slate-500">
          Invoice: <span className="font-mono text-slate-900">{invoiceId}</span>
        </p>
      </div>

      <div className="inline-flex items-center gap-2">
        <span className="text-[11px] text-slate-500">Network</span>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-900">
          {networkCfg.label}
        </span>
      </div>

      <div className="text-xs text-slate-600">
        <p className="font-medium">{networkCfg.description}</p>
      </div>

      <div className="space-y-1 text-xs">
        <p className="text-[11px] text-slate-500">Payment details</p>

        <div className="rounded-xl bg-slate-900 px-3 py-2.5 text-slate-50 space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] truncate flex-1">
              {addressToShow || "—"}
            </span>

            <button
              type="button"
              onClick={() => copy(addressToShow, "address")}
              className="inline-flex items-center rounded-lg bg-slate-700 px-2 py-1 text-[10px] font-medium hover:bg-slate-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!addressToShow}
            >
              {copiedKind === "address" ? "Copied" : "Copy address"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-200 tabular-nums flex-1">
              Amount:{" "}
              <span className="font-semibold text-white">
                {amountNumber}{" "}
                <span className="font-medium text-slate-200">{token}</span>
              </span>
            </span>

            <button
              type="button"
              onClick={() => copy(amountText, "amount")}
              className="inline-flex items-center rounded-lg bg-slate-700 px-2 py-1 text-[10px] font-medium hover:bg-slate-600 transition"
            >
              {copiedKind === "amount" ? "Copied" : "Copy amount"}
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Send only <span className="font-medium">{token}</span> on{" "}
          <span className="font-medium">{networkCfg.code}</span> to this
          address.
        </p>
      </div>

      <CryptoPayQrBox value={qrValue} />

      <ul className="list-disc list-inside text-[11px] text-slate-500 space-y-1 pt-1">
        <li>Always double-check the address and selected network.</li>
        <li>For larger payments, send a small test transaction first.</li>
        <li>
          This is a demo. In production, payments are processed by a Swiss
          regulated partner.
        </li>
      </ul>

      <button
        type="button"
        onClick={handleConfirmDemoPayment}
        disabled={isConfirming || !invoiceId}
        className="
          w-full h-11 rounded-xl
          bg-black text-white
          shadow-sm mt-2
          transition-colors duration-200
          hover:bg-slate-900
          disabled:opacity-60 disabled:cursor-not-allowed
        "
      >
        <span className="flex items-center justify-center gap-2">
          <span className="inline-flex w-4 justify-center">
            {isConfirming ? (
              <span
                className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                aria-hidden="true"
              />
            ) : (
              <span className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
          <span className="text-sm font-medium">I have sent the payment</span>
          <span
            className={`text-lg leading-none transition-opacity duration-150 ${
              isConfirming ? "opacity-40" : "opacity-100"
            }`}
            aria-hidden="true"
          >
            →
          </span>
        </span>
      </button>
    </section>
  );
}
