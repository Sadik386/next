"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, XCircle } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import type { TurnstileWidgetHandle } from "@/components/TurnstileWidget";
import AuthShell, {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthPageIntro,
} from "../_components/AuthShell";

type PasswordStrength = {
  level: number;
  label: string;
  color: string;
};

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { level: 0, label: "Not started", color: "#98a2b3" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: 1, label: "Weak", color: "#b42318" };
  if (score <= 2) return { level: 2, label: "Fair", color: "#b7791f" };
  if (score <= 3) return { level: 3, label: "Good", color: "#0f1c3f" };
  return { level: 4, label: "Strong", color: "#067647" };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [tokenError, setTokenError] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const strength = getPasswordStrength(password);

  useEffect(() => {
    setTokenError(!token);
  }, [token]);

  const triggerError = (message: string) => {
    setError(message);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!token) {
      triggerError("This reset link is missing a valid token.");
      return;
    }

    if (!password) {
      triggerError("Enter a new password.");
      return;
    }

    if (password.length < 6) {
      triggerError("Use at least 6 characters for your new password.");
      return;
    }

    if (password !== confirmPassword) {
      triggerError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, turnstileToken }),
      });
      const data = await response.json();

      if (!response.ok) {
        triggerError(data.error || "Failed to reset password.");
        turnstileRef.current?.reset();
        setTurnstileToken("");
        return;
      }

      setSuccess(true);
      window.setTimeout(() => router.push("/login"), 2400);
    } catch {
      triggerError("Something went wrong. Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      visualMode="forgot"
      visualKicker="Protected recovery"
      visualTitle="Set a new password with confidence."
      visualDescription="Accoraze reset links are time-limited, bot-protected, and designed to keep your workspace secure."
    >
      <div className="auth-flow">
        {success ? (
          <div className="auth-status-panel auth-status-panel--center" aria-live="polite">
            <span className="auth-status-icon auth-status-icon--success" aria-hidden="true">
              <CheckCircle2 size={30} />
            </span>
            <h2>Password updated</h2>
            <p>Your new password is active. We are taking you back to sign in.</p>
            <Link href="/login" className="auth-button auth-button--primary">
              <span>Continue to sign in</span>
            </Link>
          </div>
        ) : tokenError ? (
          <>
            <AuthPageIntro
              eyebrow="Password recovery"
              title="Reset link unavailable"
              description="This reset link is missing or incomplete. Request a fresh link to continue securely."
            />

            <div className="auth-status-panel" aria-live="polite">
              <span className="auth-status-icon auth-status-icon--error" aria-hidden="true">
                <XCircle size={28} />
              </span>
              <h2>Invalid reset link</h2>
              <p>For your protection, Accoraze can only update a password from a valid reset link.</p>
            </div>

            <Link href="/forgot-password" className="auth-button auth-button--primary">
              <KeyRound size={16} aria-hidden="true" />
              <span>Request a new reset link</span>
            </Link>

            <div className="auth-link-row">
              <ArrowLeft size={14} aria-hidden="true" />
              <Link href="/login" className="auth-link">
                Back to sign in
              </Link>
            </div>
          </>
        ) : (
          <>
            <AuthPageIntro
              eyebrow="Password recovery"
              title="Create a new password"
              description="Choose a strong password for your Accoraze workspace."
            />

            {error && (
              <div style={{ animation: shaking ? "authShake 0.5s ease-in-out" : "none" }}>
                <AuthAlert type="error">{error}</AuthAlert>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-password-field">
                <AuthInput
                  label="New password"
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                  placeholder="Minimum 6 characters"
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

              <div className="auth-password-strength" style={{ "--strength-color": strength.color } as CSSProperties}>
                <div className="auth-password-strength__bars" aria-hidden="true">
                  {[1, 2, 3, 4].map((level) => (
                    <span key={level} className={level <= strength.level ? "is-active" : ""} />
                  ))}
                </div>
                <span className="auth-password-strength__label">Password strength: {strength.label}</span>
              </div>

              <div className="auth-password-field">
                <AuthInput
                  label="Confirm password"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
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

              <TurnstileWidget
                ref={turnstileRef}
                onVerify={(value) => setTurnstileToken(value)}
                onError={() => setTurnstileToken("")}
                onExpired={() => setTurnstileToken("")}
                theme="light"
                size="normal"
              />

              <AuthButton type="submit" loading={loading}>
                {loading ? "Updating password" : "Update password"}
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

function ResetPasswordFallback() {
  return (
    <AuthShell
      visualMode="forgot"
      visualKicker="Protected recovery"
      visualTitle="Set a new password with confidence."
      visualDescription="Accoraze reset links are time-limited, bot-protected, and designed to keep your workspace secure."
    >
      <div className="auth-status-panel" aria-live="polite">
        <span className="auth-status-icon auth-status-icon--loading" aria-hidden="true">
          <LoaderCircle size={28} />
        </span>
        <h2>Preparing reset</h2>
        <p>Checking your password reset link.</p>
      </div>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
