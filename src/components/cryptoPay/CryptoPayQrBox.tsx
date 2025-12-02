"use client";

import QRCode from "react-qr-code";

type CryptoPayQrBoxProps = {
  value: string;
};

export function CryptoPayQrBox({ value }: CryptoPayQrBoxProps) {
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="rounded-xl bg-slate-50 p-3">
          <QRCode
            value={value}
            size={200}
            style={{ height: "200px", width: "200px" }}
          />
        </div>
      </div>
      <p className="text-[11px] text-slate-400 text-center max-w-xs">
        Scan this QR code with your wallet app to send the payment to this
        address.
      </p>
    </div>
  );
}
