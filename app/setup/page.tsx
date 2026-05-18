"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form data
  const [businessName, setBusinessName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check if already setup
  useEffect(() => {
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.isComplete) {
          router.push("/login");
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [router]);

  async function handleComplete() {
    setError("");
    setSubmitting(true);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setSubmitting(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Corrected JSON.stringify call
        body: JSON.stringify({ businessName, name, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed");
        setSubmitting(false);
        return;
      }
      setStep(4); // Success step
    } catch (err) { // Catch potential errors during fetch
      console.error("Setup failed:", err);
      setError("Something went wrong");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
    <div style={bgStyle}>
        <div style={spinner}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={bgStyle}>
          <div style={spinner}>
            {/* Progress dots */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "32px", justifyContent: "center" }}>
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  style={{
                    width: s === step ? "24px" : "8px",
                    height: "8px",
                    borderRadius: "4px",
                    backgroundColor: s <= step ? "#C4973A" : "#e5e7eb",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>

            {/* STEP 1 - Welcome */}
            {step === 1 && (
              <div style={cardStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <div style={logoCircle}>A</div>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "#111318" }}>Accoraze</span>
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111318", marginBottom: "8px" }}>
                  Welcome to Accoraze
                </h2>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "6px" }}>
                  Let&apos;s set up your business system
                </p>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "28px" }}>
                  This will take less than 2 minutes
                </p>
                <button
                  onClick={() => setStep(2)}
                  style={primaryBtn}
                >
                  Get Started
                  <span style={{ marginLeft: "6px" }}>→</span>
                </button>
              </div>
            )}

            {/* STEP 2 - Business Info */}
            {step === 2 && (
              <div style={cardStyle}>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>Step 1 of 2</p>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111318", marginBottom: "20px" }}>
                  Business Information
                </h2>
                <div style={{ marginBottom: "14px" }}>
                  <label style={labelStyle}>Business Name *</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    style={inputStyle}
                    placeholder="Enter your business name"
                  />
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setStep(1)}
                    style={secondaryBtn}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => businessName.trim() && setStep(3)}
                    disabled={!businessName.trim()}
                    style={{ ...primaryBtn, opacity: businessName.trim() ? 1 : 0.5 }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 - Admin Account */}
            {step === 3 && (
              <div style={cardStyle}>
                <p style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>Step 2 of 2</p>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#111318", marginBottom: "4px" }}>
                  Create Your Admin Account
                </h2>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "18px" }}>
                  This will be your <strong>Super Admin</strong> account (User #1)
                </p>

                {error && <div style={errorBox}>{error}</div>}

                <div style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={inputStyle}
                    placeholder="Enter your full name"
                  />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>Email *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                    placeholder="Enter your email"
                  />
                </div>
                <div style={{ marginBottom: "12px" }}>
                  <label style={labelStyle}>Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={inputStyle}
                    placeholder="Min 8 characters"
                  />
                </div>
                <div style={{ marginBottom: "18px" }}>
                  <label style={labelStyle}>Confirm Password *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={inputStyle}
                    placeholder="Re-enter your password"
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "space-between" }}>
                  <button
                    onClick={() => setStep(2)}
                    style={secondaryBtn}
                    disabled={submitting}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={submitting || !name.trim() || !email.trim() || !password || !confirmPassword}
                    style={{ ...primaryBtn, opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? "Setting up..." : "Complete Setup"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4 - Success */}
            {step === 4 && (
              <div style={cardStyle}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  backgroundColor: "#dcfce7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "24px",
                }}>
                  ✓
                </div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#111318", marginBottom: "8px" }}>
                  Setup Complete!
                </h2>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                  Welcome to Accoraze, {name}!
                </p>
                <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
                  Your business system is ready.
                </p>
                <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "24px" }}>
                  You are logged in as <strong style={{ color: "#111318" }}>Super Admin</strong>
                </p>
                <button
                  onClick={() => router.push("/dashboard")}
                  style={primaryBtn}
                >
                  Go to Dashboard →
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(12px)",
            borderRadius: "20px",
            padding: "5px 16px",
            fontSize: "12px",
            color: "#6b7280",
            border: "1px solid rgba(255,255,255,0.5)",
          }}>
            Accoraze Business Operating System
          </div>
        </div>
);
}

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

const spinner: React.CSSProperties = {
  position: "relative",
  zIndex: 10,
  width: "100%",
  maxWidth: "380px",
  backgroundColor: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(20px)",
  borderRadius: "18px",
  padding: "32px 28px 28px",
  boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
  border: "1px solid rgba(255,255,255,0.6)",
  textAlign: "center",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
};

const logoCircle: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "10px",
  backgroundColor: "#C4973A",
  color: "white",
  fontSize: "18px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 500,
  color: "#374151",
  marginBottom: "5px",
  textAlign: "left",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 13px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  backgroundColor: "white",
  color: "#111318",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 20px",
  backgroundColor: "#C4973A",
  color: "white",
  borderRadius: "8px",
  border: "none",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 16px",
  backgroundColor: "white",
  color: "#374151",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "10px 12px",
  marginBottom: "14px",
  fontSize: "13px",
  color: "#dc2626",
  textAlign: "left",
};



