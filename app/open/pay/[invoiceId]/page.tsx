import PaymentWidget from "@/components/payments/PaymentWidget";

type PageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoicePaymentPage({ params }: PageProps) {
  const { invoiceId } = await params;

  return (
    <div className="min-h-screen bg-[#fafafa] px-4 py-10 flex justify-center">
      <div className="w-full max-w-3xl">
        {/* ======= HEADER ======= */}
        <div className="w-full flex items-center justify-between pb-6 border-b border-gray-200 mb-10 relative">
          {/* Back button */}
          <a
            href="/demo/checkout"
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
          >
            <span className="mr-1">←</span> Back
          </a>

          {/* Center title */}
          <h1 className="text-xl font-semibold text-gray-900 absolute left-1/2 -translate-x-1/2">
            Crypto Payment
          </h1>

          {/* Right empty block for symmetry */}
          <div className="w-10"></div>
        </div>

        {/* ======= PAYMENT WIDGET ======= */}
        <PaymentWidget invoiceId={invoiceId} />
      </div>
    </div>
  );
}
