"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginAuthLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectParam = searchParams.get('redirect');

  useEffect(() => {
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((data) => {
        if (!data.isComplete) {
          router.push("/setup");
        } else {
          if (redirectParam && redirectParam !== '/setup') {
            router.push(redirectParam);
          } else {
            router.push("/dashboard");
          }
        }
      })
      .catch(() => {
        // Fallback to dashboard or original redirect if setup status fails
        if (redirectParam && redirectParam !== '/setup') {
            router.push(redirectParam);
        } else {
            router.push("/dashboard");
        }
      });
  }, [router, searchParams, redirectParam]); // Added redirectParam to dependency array

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
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
      <div
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 20,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "5px 16px",
            fontSize: "12px",
            color: "#6b7280",
            whiteSpace: "nowrap",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          Accoraze Business Operating System
        </div>
      </div>
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