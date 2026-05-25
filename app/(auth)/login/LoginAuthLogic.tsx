"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LegalFooter from "@/lib/LegalFooter";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function LoginAuthLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [setupCheckFailed, setSetupCheckFailed] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch("/api/setup/status", { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        clearTimeout(timeout);
        if (data.success !== false && !data.isComplete) {
          router.replace("/setup");
        } else {
          setCheckingSetup(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        clearTimeout(timeout);
        setSetupCheckFailed(true);
        setCheckingSetup(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [router]);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        if (data.error && data.error.includes("verify your email")) {
          setShowResend(true);
        }
        return;
      }
      // Construct the final redirect URL, preserving the original redirectParam
      const finalRedirect = redirectParam && redirectParam !== '/setup' ? redirectParam : "/dashboard";
      router.push(finalRedirect);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

if (checkingSetup) {
    return (
      <div style={bgStyle}>
        <div style={spinnerStyle}>Loading...</div>
        <LegalFooter />
      </div>
    );
  }

  if (setupCheckFailed) {
    return (
      <div style={bgStyle}>
        <div style={spinnerStyle}>
          <div style={{ marginBottom: "16px", color: "#dc2626", fontSize: "13px", textAlign: "center" }}>
            Could not verify setup status. Please try again.
          </div>
          <button
            onClick={() => {
              setSetupCheckFailed(false);
              setCheckingSetup(true);
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 8000);
              fetch("/api/setup/status", { signal: controller.signal })
                .then((r) => r.json())
                .then((data) => {
                  if (data.success !== false && !data.isComplete) {
                    router.replace("/setup");
                  } else {
                    setCheckingSetup(false);
                  }
                })
                .catch(() => {
                  setSetupCheckFailed(true);
                  setCheckingSetup(false);
                })
                .finally(() => clearTimeout(timeout));
            }}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#C4973A",
              color: "white",
              borderRadius: "8px",
              border: "none",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
        <LegalFooter />
      </div>
    );
  }

  return (
    <div style={bgStyle}>
      <div style={spinnerStyle}>
        <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#111318", marginBottom: "4px" }}>
          Sign In
        </h2>
        <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "22px" }}>
          Access your business workspace with secure authentication.
        </p>
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
            }}
          >
            {error}
          </div>
        )}
        {showResend && !resent && (
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "8px",
              padding: "9px 12px",
              marginBottom: "14px",
              fontSize: "12px",
              color: "#1d4ed8",
              textAlign: "center",
            }}
          >
            Didn&apos;t receive a verification email?{" "}
            <button
              onClick={async () => {
                setResending(true);
                try {
                  const r = await fetch("/api/auth/resend-verification", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, turnstileToken }),
                  });
                  const rd = await r.json();
                  setResent(true);
                  setShowResend(false);
                  setError(rd.message || "Verification email sent.");
                } catch {
                  setError("Failed to resend. Please try again.");
                } finally {
                  setResending(false);
                }
              }}
              disabled={resending}
              style={{
                background: "none",
                border: "none",
                color: "#1d4ed8",
                fontWeight: 600,
                cursor: resending ? "not-allowed" : "pointer",
                padding: 0,
                fontSize: "12px",
                textDecoration: "underline",
              }}
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
          </div>
        )}
        {resent && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "9px 12px",
              marginBottom: "14px",
              fontSize: "13px",
              color: "#16a34a",
            }}
          >
            Verification email sent. Check your inbox.
          </div>
        )}
        <form onSubmit={handleFormSubmit}>
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required // Added required attribute
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
              }}
            />
          </div>
          <div style={{ marginBottom: "6px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "5px",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required // Added required attribute
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
              }}
            />
          </div>
          <div style={{ textAlign: "right", marginBottom: "18px" }}>
            <a
              href="/forgot-password"
              style={{ fontSize: "12px", color: "var(--brand, #C4973A)", textDecoration: "none", fontWeight: 500 }}
            >
              Forgot password?
            </a>
          </div>
          <TurnstileWidget
            onVerify={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken("")}
            onExpired={() => setTurnstileToken("")}
            theme="light"
            size="compact"
          />
          <button
            type="submit" // Changed to type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "var(--brand, #C4973A)",
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#f0f0f0" }} />
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>or</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#f0f0f0" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#6b7280" }}>New here?</span>
          <a
            href="/register"
            style={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#374151",
              padding: "5px 14px",
              borderRadius: "20px",
              border: "1px solid #e5e7eb",
              backgroundColor: "white",
              textDecoration: "none",
            }}
          >
            Create account
          </a>
        </div>
      </div>
      <LegalFooter />
    </div>
  );
};

// Styles defined outside the component for better readability
const bgStyle: React.CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden",
  background: "linear-gradient(135deg,#f0e0c8 0%,#ede8e0 25%,#e8e8f0 60%,#d4d8e8 100%)",
};

const spinnerStyle: React.CSSProperties = {
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
};
