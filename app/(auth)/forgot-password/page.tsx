"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import AuthShell, {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthPageIntro,
} from "../_components/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [devToken, setDevToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  const triggerError = (message: string) => {
    setError(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      triggerError("Email is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || "Failed to send reset email");
        return;
      }

      setSuccess(true);
      if (data.devToken) {
        setDevToken(data.devToken);
      }
    } catch {
      triggerError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      visualMode="forgot"
      visualKicker="Security first"
      visualTitle="Secure by default, always."
      visualDescription="Accoraze uses protected, time-limited reset links. Your account and data stay protected."
    >
      <div className="auth-flow">
        {success ? (
          <div className="auth-success-panel">
            <span className="auth-success-icon" aria-hidden="true">
              <MailCheck size={26} />
            </span>
            <h2>Check your email</h2>
            <p>
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
            </p>

            {devToken && (
              <div className="auth-dev-token">
                <span>DEV MODE - Reset Token</span>
                <code>{devToken}</code>
                <Link href={`/reset-password?token=${devToken}`} className="auth-link">
                  Open reset link
                </Link>
              </div>
            )}

            <Link href="/login" className="auth-button auth-button--primary">
              <ArrowLeft size={16} aria-hidden="true" /> Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <AuthPageIntro
              eyebrow="Password recovery"
              title="Reset your password"
              description="Enter your account email and Accoraze will send a secure reset link."
            />

            {error && (
              <div style={{ animation: shaking ? "authShake 0.5s ease-in-out" : "none" }}>
                <AuthAlert type="error">{error}</AuthAlert>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <AuthInput
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                placeholder="you@company.com"
                autoComplete="email"
              />

              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken("")}
                onExpired={() => setTurnstileToken("")}
                theme="light"
                size="normal"
              />

              <AuthButton type="submit" loading={loading}>
                {loading ? "Sending reset link" : "Send reset link"}
              </AuthButton>
            </form>

            <div className="auth-link-row">
              <ArrowLeft size={14} aria-hidden="true" />
              <Link href="/login" className="auth-link">
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
}
