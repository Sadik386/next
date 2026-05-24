"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LegalFooter from "@/lib/LegalFooter";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [devToken, setDevToken] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Email is required");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send reset email");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        return;
      }
      setSuccess(true);
      if (data.devToken) {
        setDevToken(data.devToken);
      }
    } catch {
      setError("Something went wrong.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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
            maxWidth: "340px",
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            borderRadius: "18px",
            padding: "32px 28px 24px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#111318", marginBottom: "4px" }}>
            Reset Password
          </h2>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "22px" }}>
            Enter your email to receive a password reset link.
          </p>
          <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "9px 12px",
                marginBottom: "14px",
                fontSize: "13px",
                color: "#dc2626",
                animation: shaking ? "shake 0.5s ease-in-out" : "none",
              }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "14px",
                fontSize: "13px",
                color: "#16a34a",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: "4px" }}>✓ Check your email for reset link</div>
              {devToken && (
                <div style={{ marginTop: "12px", padding: "10px", background: "#fef3c7", borderRadius: "6px", color: "#b45309" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, marginBottom: "4px" }}>DEV MODE - Reset Token:</div>
                  <code style={{ fontSize: "11px", wordBreak: "break-all" }}>{devToken}</code>
                  <a
                    href={`/reset-password?token=${devToken}`}
                    style={{ display: "block", marginTop: "8px", color: "var(--brand, #C4973A)", fontWeight: 500, fontSize: "12px" }}
                  >
                    Click here to reset password →
                  </a>
                </div>
              )}
            </div>
          )}
          {!success && (
            <>
              <div style={{ marginBottom: "18px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "#374151",
                    marginBottom: "5px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "white",
                    color: "#111318",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box",
                    opacity: loading ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  backgroundColor: "#C4973A",
                  color: "white",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.8 : 1,
                  marginBottom: "16px",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {loading ? (
                  <>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Link
              href="/login"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#374151",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
            >
              Back to Sign In
            </Link>
          </div>
          </form>
        </div>
        <LegalFooter />
      </div>
    </>
  );
}