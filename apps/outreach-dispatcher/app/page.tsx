export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main style={{ padding: 32, fontFamily: "system-ui, sans-serif", color: "#F5F5F5", background: "#0A0A0A", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 32, color: "#E8192C", letterSpacing: "0.05em" }}>Outreach Dispatcher</h1>
      <p style={{ marginTop: 12, fontSize: 14, color: "#aaa" }}>
        Webhook receiver service. Endpoints:
      </p>
      <ul style={{ marginTop: 12, fontFamily: "monospace", fontSize: 13, color: "#F5F5F5" }}>
        <li>POST /api/webhooks/instantly</li>
        <li>POST /api/webhooks/smartlead</li>
      </ul>
      <p style={{ marginTop: 24, fontSize: 12, color: "#666" }}>
        Tenants configure these URLs in their Instantly/Smartlead dashboards.
      </p>
    </main>
  );
}
