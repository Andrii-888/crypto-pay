"use client";

type PaymentWidgetProps = {
  invoiceId: string;
};

export default function PaymentWidget({ invoiceId }: PaymentWidgetProps) {
  // В будущем сюда придут реальные данные с бэка / API.
  const mockAmountFiat = 120; // EUR
  const mockAmountCrypto = 0.0031; // BTC
  const mockCurrencyCrypto = "BTC";
  const mockStatus = "Waiting for payment";

  return (
    <div className="w-full max-w-xl mx-auto rounded-xl border border-gray-200 bg-white shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Pay with cryptocurrency
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Use your crypto wallet to complete the payment.
          </p>
        </div>
        <span className="text-xs font-mono text-gray-400">
          Invoice: {invoiceId}
        </span>
      </div>

      {/* Amount section */}
      <div className="rounded-lg bg-gray-50 p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Order amount</span>
          <span className="text-lg font-semibold text-gray-900">
            € {mockAmountFiat.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">To pay in crypto</span>
          <span className="text-base font-medium text-gray-900">
            {mockAmountCrypto} {mockCurrencyCrypto}
          </span>
        </div>
      </div>

      {/* QR + address placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px,1fr] gap-4 items-center">
        {/* QR placeholder */}
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 aspect-square">
          <span className="text-xs text-gray-400">QR code placeholder</span>
        </div>

        {/* Address + instructions */}
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              Wallet address
            </div>
            <div className="rounded-md bg-gray-900 text-gray-100 text-xs font-mono p-3 break-all">
              0x1234...abcd (example address)
            </div>
          </div>
          <ul className="text-xs text-gray-500 list-disc list-inside space-y-1">
            <li>Send only {mockCurrencyCrypto} to this address.</li>
            <li>
              The payment will be detected automatically on the blockchain.
            </li>
          </ul>
        </div>
      </div>

      {/* Status + timer (заглушка) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
          <span className="text-sm font-medium text-gray-800">
            {mockStatus}
          </span>
        </div>
        <div className="text-sm text-gray-500">
          Time left: <span className="font-medium text-gray-900">25:00</span>
        </div>
      </div>
    </div>
  );
}
