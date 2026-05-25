"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LegalFooter from "@/lib/LegalFooter";
import TurnstileWidget from "@/components/TurnstileWidget";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: "Weak", color: "#dc2626" };
    if (score <= 2) return { level: 2, label: "Fair", color: "#f59e0b" };
    if (score <= 3) return { level: 3, label: "Good", color: "#3b82f6" };
    return { level: 4, label: "Strong", color: "#16a34a" };
  };

  const strength = getPasswordStrength(password);

  useEffect(() => {
    if (!token) {
      setTokenError(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Invalid reset token");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    if (!password) {
      setError("Password is required");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong.");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          New Password
        </h2>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "22px" }}>
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit}>
        {tokenError ? (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "9px 12px",
              marginBottom: "14px",
              fontSize: "13px",
              color: "#dc2626",
            }}
          >
            Invalid reset token. Please request a new password reset.
          </div>
        ) : (
        <>
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
              padding: "9px 12px",
              marginBottom: "14px",
              fontSize: "13px",
              color: "#16a34a",
            }}
          >
            Password reset successfully! Redirecting to login...
          </div>
        )}
        {!success && (
          <>
            <div style={{ marginBottom: "12px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#374151",
                  marginBottom: "5px",
                }}
              >
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Min 8 characters"
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
                }}
              />
              {password && (
                <div style={{ marginTop: "8px" }}>
                  <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        style={{
                          flex: 1,
                          height: "4px",
                          borderRadius: "2px",
                          background: level <= strength.level ? strength.color : "#e5e7eb",
                          transition: "background 0.2s",
                        }}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: "11px", color: strength.color, fontWeight: 500 }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>
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
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                }}
              />
            </div>
            <TurnstileWidget
              onVerify={(token) => setTurnstileToken(token)}
              onError={() => setTurnstileToken("")}
              onExpired={() => setTurnstileToken("")}
              theme="light"
              size="compact"
            />
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
              }}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </>
        )}
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
            }}
          >
            Back to Sign In
          </Link>
        </div>
        </form>
</div>
        <LegalFooter />
      </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Loading...
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}