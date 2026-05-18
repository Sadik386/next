export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg,#f0e0c8 0%,#ede8e0 25%,#e8e8f0 60%,#d4d8e8 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(circle,#00000012 1px,transparent 1px)",
        backgroundSize: "24px 24px",
      }}/>
      <div style={{
        position: "relative",
        zIndex: 10,
        textAlign: "center",
        backgroundColor: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        borderRadius: "18px",
        padding: "48px 40px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
        border: "1px solid rgba(255,255,255,0.6)",
      }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "#fef3c7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          fontSize: "28px",
          fontWeight: 700,
          color: "#92400e",
        }}>
          404
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#111318", marginBottom: "8px" }}>
          Page Not Found
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <a
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 20px",
            backgroundColor: "#C4973A",
            color: "white",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}