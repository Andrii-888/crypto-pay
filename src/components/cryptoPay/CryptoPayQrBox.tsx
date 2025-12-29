"use client";

import QRCode from "react-qr-code";

type CryptoPayQrBoxProps = {
  value: string;
};

export function CryptoPayQrBox({ value }: CryptoPayQrBoxProps) {
  if (!value) return null; // optional safety

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Scan to pay</p>
          <p className="text-[11px] text-slate-500">QR</p>
        </div>

        <div className="mt-3 flex items-center justify-center">
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200">
            <div className="aspect-square w-220px">
              <QRCode value={value} size={220} />
            </div>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-slate-400 text-center leading-snug">
          Scan with your wallet app. Always verify the network and the address
          before sending.
        </p>
      </div>
    </div>
  );
}
