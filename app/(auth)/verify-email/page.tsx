"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, MailCheck, RefreshCcw, XCircle } from "lucide-react";
import TurnstileWidget from "@/components/TurnstileWidget";
import type { TurnstileWidgetHandle } from "@/components/TurnstileWidget";
import AuthShell, {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthPageIntro,
} from "../_components/AuthShell";

type VerifyStatus = "loading" | "success" | "error";
type ResendStatus = "idle" | "sending" | "sent";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("Verifying your email address.");
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resendStatus, setResendStatus] = useState<ResendStatus>("idle");
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    setStatus("loading");
    setMessage("Verifying your email address.");

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;

        if (data.success) {
          setStatus("success");
          setMessage(data.message || "Your email has been verified. You can now sign in.");
          return;
        }

        setStatus("error");
        setMessage(data.error || "Verification failed. The link may have expired or already been used.");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        setMessage("Something went wrong while verifying your email. Please try again.");
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResendError("");
    setResendMessage("");

    if (!email.trim()) {
      setResendError("Enter the email address you used to create your account.");
      return;
    }

    setResendStatus("sending");

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), turnstileToken }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setResendError(data.message || "Could not send a new verification email. Please try again.");
        turnstileRef.current?.reset();
        setTurnstileToken("");
        setResendStatus("idle");
        return;
      }

      setResendStatus("sent");
      setResendMessage(data.message || "A new verification email has been sent. Check your inbox.");
    } catch {
      setResendError("Could not send a new verification email. Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setResendStatus("idle");
    }
  };

  return (
    <AuthShell
      visualMode="forgot"
      visualKicker="Email security"
      visualTitle="Verify once. Work with confidence."
      visualDescription="Acuity Commerce keeps new workspaces protected with secure, time-limited email verification."
    >
      <div className="auth-flow">
        {status === "loading" && (
          <>
            <AuthPageIntro
              eyebrow="Email verification"
              title="Checking your link"
              description="Please wait while Acuity Commerce verifies this email address."
            />

            <div className="auth-status-panel" aria-live="polite">
              <span className="auth-status-icon auth-status-icon--loading" aria-hidden="true">
                <LoaderCircle size={28} />
              </span>
              <h2>Verifying email</h2>
              <p>{message}</p>
            </div>
          </>
        )}

        {status === "success" && (
          <div className="auth-status-panel auth-status-panel--center" aria-live="polite">
            <span className="auth-status-icon auth-status-icon--success" aria-hidden="true">
              <CheckCircle2 size={30} />
            </span>
            <h2>Email verified</h2>
            <p>{message}</p>
            <Link href="/login" className="auth-button auth-button--primary">
              <MailCheck size={16} aria-hidden="true" />
              <span>Continue to sign in</span>
            </Link>
          </div>
        )}

        {status === "error" && (
          <>
            <AuthPageIntro
              eyebrow="Verification issue"
              title="This link did not work"
              description="The verification link may be expired, already used, or incomplete."
            />

            <div className="auth-status-panel" aria-live="polite">
              <span className="auth-status-icon auth-status-icon--error" aria-hidden="true">
                <XCircle size={28} />
              </span>
              <h2>Verification failed</h2>
              <p>{message}</p>
            </div>

            {resendError && <AuthAlert type="error">{resendError}</AuthAlert>}
            {resendMessage && <AuthAlert type="success">{resendMessage}</AuthAlert>}

            {resendStatus !== "sent" && (
              <form className="auth-form" onSubmit={handleResend}>
                <AuthInput
                  label="Account email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={resendStatus === "sending"}
                />

                <TurnstileWidget
                  ref={turnstileRef}
                  onVerify={(value) => setTurnstileToken(value)}
                  onError={() => setTurnstileToken("")}
                  onExpired={() => setTurnstileToken("")}
                  theme="light"
                  size="normal"
                />

                <AuthButton type="submit" loading={resendStatus === "sending"}>
                  {resendStatus !== "sending" && <RefreshCcw size={16} aria-hidden="true" />}
                  {resendStatus === "sending" ? "Sending new link" : "Send new verification link"}
                </AuthButton>
              </form>
            )}

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

function VerifyEmailFallback() {
  return (
    <AuthShell
      visualMode="forgot"
      visualKicker="Email security"
      visualTitle="Verify once. Work with confidence."
      visualDescription="Acuity Commerce keeps new workspaces protected with secure, time-limited email verification."
    >
      <div className="auth-status-panel" aria-live="polite">
        <span className="auth-status-icon auth-status-icon--loading" aria-hidden="true">
          <LoaderCircle size={28} />
        </span>
        <h2>Loading verification</h2>
        <p>Preparing your email verification check.</p>
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
