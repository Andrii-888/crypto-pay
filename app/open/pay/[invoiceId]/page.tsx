import { getInvoice } from "@/lib/invoiceStore";
import PaymentWidget from "@/components/payments/PaymentWidget";

export default async function PaymentPage(props: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { invoiceId } = await props.params;

  const invoice = getInvoice(invoiceId);

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm px-6 py-4 text-center">
          <h2 className="text-lg font-semibold text-slate-900">
            Invoice not found
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            The payment link is invalid or the demo server was restarted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PaymentWidget
      invoiceId={invoice.invoiceId}
      fiatAmount={invoice.fiatAmount}
      fiatCurrency={invoice.fiatCurrency}
      cryptoAmount={invoice.cryptoAmount}
      cryptoCurrency={invoice.cryptoCurrency}
    />
  );
}
