"use client";
export default function Error({
  error, reset
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "50vh",
      gap: "16px",
    }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)" }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
        {error.message || "An unexpected error occurred"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "8px 20px",
          backgroundColor: "var(--brand)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Try again
      </button>
    </div>
  );
}