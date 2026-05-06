export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--page-bg)",
        color: "var(--text-primary)",
      }}
    >
      <div style={{ textAlign: "center", padding: "24px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>404</h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Page not found.</p>
      </div>
    </div>
  );
}
