export default function Loading() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "50vh",
      color: "var(--text-muted)",
    }}>
      <div style={{
        width: "32px",
        height: "32px",
        border: "3px solid var(--card-border)",
        borderTop: "3px solid var(--brand)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}/>
    </div>
  );
}