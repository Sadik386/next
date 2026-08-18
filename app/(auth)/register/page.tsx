"use client";

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import AuthShell, {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthPageIntro,
  AuthSelect,
  AuthStepIndicator,
} from "../_components/AuthShell";

const COUNTRIES = [
  { code: "BD", name: "Bangladesh", currency: "BDT" },
  { code: "IN", name: "India", currency: "INR" },
  { code: "PK", name: "Pakistan", currency: "PKR" },
  { code: "US", name: "United States", currency: "USD" },
  { code: "GB", name: "United Kingdom", currency: "GBP" },
  { code: "CA", name: "Canada", currency: "CAD" },
  { code: "AU", name: "Australia", currency: "AUD" },
  { code: "DE", name: "Germany", currency: "EUR" },
  { code: "FR", name: "France", currency: "EUR" },
  { code: "AE", name: "United Arab Emirates", currency: "AED" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR" },
  { code: "MY", name: "Malaysia", currency: "MYR" },
  { code: "SG", name: "Singapore", currency: "SGD" },
];

const CURRENCIES = [
  { code: "BDT", name: "BDT - Taka" },
  { code: "INR", name: "INR - Rupee" },
  { code: "PKR", name: "PKR - Rupee" },
  { code: "USD", name: "USD - Dollar" },
  { code: "GBP", name: "GBP - Pound" },
  { code: "CAD", name: "CAD - Dollar" },
  { code: "AUD", name: "AUD - Dollar" },
  { code: "EUR", name: "EUR - Euro" },
  { code: "AED", name: "AED - Dirham" },
  { code: "SAR", name: "SAR - Riyal" },
  { code: "MYR", name: "MYR - Ringgit" },
  { code: "SGD", name: "SGD - Dollar" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
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
    businessName: "",
    businessUsername: "",
    country: "BD",
    currency: "BDT",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const triggerError = (message: string) => {
    setError(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "country") {
      const selectedCountry = COUNTRIES.find((c) => c.code === value);
      setFormData((prev) => ({
        ...prev,
        country: value,
        currency: selectedCountry?.currency || prev.currency,
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toBusinessSlug = (name: string): string => {
    return name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleBusinessNameBlur = () => {
    if (formData.businessName && !formData.businessUsername) {
      setFormData((prev) => ({
        ...prev,
        businessUsername: toBusinessSlug(prev.businessName),
      }));
    }
  };

  const validatePersonalStep = () => {
    if (!formData.name || !formData.username || !formData.email) {
      triggerError("Name, username, and email are required");
      return false;
    }
    if (!EMAIL_PATTERN.test(formData.email)) {
      triggerError("Enter a valid email address");
      return false;
    }

    setError("");
    return true;
  };

  const goToBusinessStep = () => {
    if (validatePersonalStep()) {
      setStep(2);
      setError("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const {
      name,
      username,
      email,
      phone,
      password,
      confirmPassword,
      gender,
      dob,
      address,
      businessName,
      businessUsername,
      country,
      currency,
    } = formData;

    if (!name || !username || !email || !password || !businessName || !businessUsername) {
      triggerError("All required fields are required");
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      triggerError("Enter a valid email address");
      setStep(1);
      return;
    }
    if (!/^[a-z0-9-]+$/.test(businessUsername)) {
      triggerError("Business username can only contain lowercase letters, numbers, and hyphens");
      return;
    }
    if (businessUsername.length < 3) {
      triggerError("Business username must be at least 3 characters");
      return;
    }
    if (password.length < 8) {
      triggerError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      triggerError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          email,
          phone,
          password,
          gender,
          dob,
          address,
          businessName,
          businessUsername,
          country,
          currency,
          turnstileToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || "Registration failed");
        return;
      }

      setSuccess(true);
    } catch {
      triggerError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      maxWidth="520px"
      visualMode="register"
      visualStage={step}
      visualKicker="Quick setup"
      visualTitle="Your workspace starts here."
      visualDescription="One account gives you a complete business operating system - POS, inventory, orders, and reports."
    >
      {success ? (
        <div className="auth-success-panel">
          <span className="auth-success-icon" aria-hidden="true">
            <CheckCircle2 size={26} />
          </span>
          <h2>Account created successfully</h2>
          <p>Check your email to verify your account and activate full access.</p>
          <Link href="/login" className="auth-button auth-button--primary">
            Continue to sign in
          </Link>
        </div>
      ) : (
        <div className="auth-flow">
          <AuthPageIntro
            eyebrow={`Step ${step} of 2`}
            title={step === 1 ? "Personal information" : "Business & security"}
            description={step === 1 ? "Tell us about yourself to get started." : "Set up your business workspace and secure your account."}
          />

          <AuthStepIndicator step={step} />

          {error && (
            <div style={{ animation: shaking ? "authShake 0.5s ease-in-out" : "none" }}>
              <AuthAlert type="error">{error}</AuthAlert>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="auth-step-panel">
                <div className="auth-form">
                  <AuthInput
                    label="Full name"
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="John Doe"
                    autoComplete="name"
                  />

                  <div className="auth-form-grid">
                    <AuthInput
                      label="Username"
                      required
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="johndoe"
                      autoComplete="username"
                    />
                    <AuthInput
                      label="Phone number"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="+1 234 567 8900"
                      autoComplete="tel"
                    />
                  </div>

                  <AuthInput
                    label="Email address"
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="john@example.com"
                    autoComplete="email"
                  />

                  <div className="auth-form-grid">
                    <AuthSelect
                      label="Gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </AuthSelect>
                    <AuthInput
                      label="Date of birth"
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>

                  <AuthInput
                    label="Address"
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={loading}
                    placeholder="123 Main St, City, Country"
                    autoComplete="street-address"
                  />

                  <AuthButton type="button" onClick={goToBusinessStep}>
                    Continue <ArrowRight size={16} aria-hidden="true" />
                  </AuthButton>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="auth-step-panel">
                <div className="auth-form">
                  <AuthInput
                    label="Business name"
                    required
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    onBlur={handleBusinessNameBlur}
                    disabled={loading}
                    placeholder="My Business"
                  />

                  <div className="auth-form-grid">
                    <AuthInput
                      label="Business username"
                      required
                      type="text"
                      name="businessUsername"
                      value={formData.businessUsername}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="my-business"
                    />
                    <AuthSelect
                      label="Country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </AuthSelect>
                  </div>

                  <AuthSelect
                    label="Currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </AuthSelect>

                  <div className="auth-form-grid">
                    <div className="auth-password-field">
                      <AuthInput
                        label="Password"
                        required
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Minimum 8 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="auth-icon-button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    <div className="auth-password-field">
                      <AuthInput
                        label="Confirm password"
                        required
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={loading}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((current) => !current)}
                        className="auth-icon-button"
                        aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <p className="auth-sr-only">
                    Your workspace is created immediately after registration. Acuity Commerce may review, limit, or suspend accounts that violate platform terms.
                  </p>

                  <div className="auth-security-note auth-security-note--mobile">
                    Your workspace is created immediately after registration. Acuity Commerce may review, limit, or suspend accounts that violate platform terms.
                  </div>

                  <TurnstileWidget
                    onVerify={(token) => setTurnstileToken(token)}
                    onError={() => setTurnstileToken("")}
                    onExpired={() => setTurnstileToken("")}
                    theme="light"
                    size="normal"
                  />

                  <div className="auth-form-actions">
                    <AuthButton type="button" variant="secondary" onClick={() => setStep(1)} disabled={loading}>
                      <ArrowLeft size={16} aria-hidden="true" /> Back
                    </AuthButton>
                    <AuthButton type="submit" loading={loading}>
                      {loading ? "Creating account" : "Create account"}
                    </AuthButton>
                  </div>
                </div>
              </div>
            )}
          </form>

          <div className="auth-link-row">
            <span>Already have an account?</span>
            <Link href="/login" className="auth-link">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
