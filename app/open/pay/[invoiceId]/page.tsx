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
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>Crypto Payment</h1>

      <p style={{ marginBottom: "30px", color: "#555" }}>
        This page will be used to pay an order with cryptocurrency.
      </p>

      <div
        style={{
          padding: "16px 20px",
          background: "#f5f5f5",
          borderRadius: "8px",
          marginBottom: "16px",
        }}
      >
        <strong>Invoice ID:</strong> {invoiceId}
      </div>

      <div
        style={{
          padding: "16px 20px",
          background: "#fafafa",
          borderRadius: "8px",
        }}
      >
        <strong>Status:</strong> Loading invoice data…
      </div>
    </div>
  );
}
