import PaymentWidget from "@/components/payments/PaymentWidget";

type PageProps = {
  params: Promise<{
    invoiceId: string;
  }>;
};

export default async function InvoicePaymentPage({ params }: PageProps) {
  const { invoiceId } = await params;

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Crypto Payment</h1>

      <p style={{ marginBottom: "30px", color: "#555" }}>
        Pay your order using cryptocurrency. Your payment will be detected
        automatically on the blockchain.
      </p>

      {/* ВАЖНО: здесь должен быть виджет */}
      <PaymentWidget invoiceId={invoiceId} />
    </div>
  );
}
