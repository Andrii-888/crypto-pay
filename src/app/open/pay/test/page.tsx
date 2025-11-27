export default function TestPaymentPage() {
  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        Test Payment Page
      </h1>
      <p>This is a test page for the crypto payment flow.</p>

      <div
        style={{
          marginTop: "20px",
          padding: "15px",
          background: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <strong>Status:</strong> Working ✔️
      </div>
    </div>
  );
}
