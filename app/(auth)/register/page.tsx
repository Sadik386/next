"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    dob: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { name, username, email, phone, password, confirmPassword, gender, dob, address } = formData;

    if (!name || !username || !email || !password) {
      setError("All required fields are required");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, phone, password, gender, dob, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        setShaking(true);
        setTimeout(() => setShaking(false), 500);
        return;
      }
      setSuccess(true);
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
            maxWidth: "420px",
            maxHeight: "90vh",
            overflowY: "auto",
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(20px)",
            borderRadius: "18px",
            padding: "28px 24px 20px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
            border: "1px solid rgba(255,255,255,0.6)",
          }}
        >
          <h2 style={{ fontSize: "19px", fontWeight: 700, color: "#111318", marginBottom: "4px" }}>
            Create Account
          </h2>
          <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "18px" }}>
            Submit your details for administrator approval.
          </p>
          <form onSubmit={handleSubmit}>
          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ 
                width: "60px", 
                height: "60px", 
                borderRadius: "50%", 
                background: "#dcfce7", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                margin: "0 auto 16px"
              }}>
                <span style={{ fontSize: "28px" }}>✓</span>
              </div>
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111318", marginBottom: "8px" }}>
                Request Submitted!
              </h3>
              <p style={{ fontSize: "13px", color: "#6b7280", marginBottom: "20px", lineHeight: 1.5 }}>
                Your account is pending administrator approval.<br/>You'll be notified once approved.
              </p>
              <Link
                href="/login"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  backgroundColor: "#C4973A",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                }}
              >
                Back to Sign In
              </Link>
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

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
              Full Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              placeholder="John Doe"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
                Username <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                placeholder="johndoe"
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
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
                placeholder="+1 234 567 8900"
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
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
              Email Address <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              placeholder="john@example.com"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
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
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
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
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              disabled={loading}
              placeholder="123 Main St, City, Country"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
                Password <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    paddingRight: "36px",
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: "#6b7280",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "5px" }}>
                Confirm <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    paddingRight: "36px",
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
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: "12px",
                    color: "#6b7280",
                    cursor: "pointer",
                  }}
                >
                  {showConfirmPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>
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
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
          </>
          )}
          </form>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "13px", color: "#6b7280" }}>Already have an account?</span>
            <Link
              href="/login"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#374151",
                textDecoration: "none",
                marginLeft: "4px",
                transition: "color 0.2s ease",
              }}
            >
              Sign In
            </Link>
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
    </>
  );
}