"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invitation token is missing.");
      return;
    }

    fetch("/api/users/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Invitation accepted! You now have access to the business.");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to accept invitation.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      });
  }, [token]);

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "linear-gradient(135deg,#f0e0c8 0%,#ede8e0 25%,#e8e8f0 60%,#d4d8e8 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "radial-gradient(circle,#00000012 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 10,
            width: "100%",
            maxWidth: "420px",
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            borderRadius: "18px",
            padding: "32px 28px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
            border: "1px solid rgba(255,255,255,0.6)",
            animation: "fadeIn 0.4s ease-out",
          }}
        >
          {status === "loading" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#fef3c7",
                  border: "3px solid #fcd34d",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              >
                <span style={{ fontSize: "26px", display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111318", marginBottom: "10px" }}>
                Accepting invitation...
              </h3>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5 }}>
                Please wait while we process your invitation.
              </p>
            </div>
          )}

          {status === "success" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ fontSize: "28px" }}>✓</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111318", marginBottom: "10px" }}>
                Invitation Accepted!
              </h3>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5, marginBottom: "20px" }}>
                {message}
              </p>
              <Link
                href="/dashboard"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  backgroundColor: "var(--brand, #C4973A)",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Go to Dashboard
              </Link>
            </div>
          )}

          {status === "error" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <span style={{ fontSize: "28px" }}>✕</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#111318", marginBottom: "10px" }}>
                Invitation Failed
              </h3>
              <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.5, marginBottom: "20px" }}>
                {message}
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <Link
                  href="/login"
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "var(--brand, #C4973A)",
                    color: "white",
                    borderRadius: "8px",
                    textDecoration: "none",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: "24px" }}>⟳</span>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}