"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TurnstileWidget from "@/components/TurnstileWidget";
import type { TurnstileWidgetHandle } from "@/components/TurnstileWidget";
import AuthShell, {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthPageIntro,
} from "../_components/AuthShell";

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
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const redirectParam = searchParams.get("redirect");

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

  const retrySetupCheck = () => {
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
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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

      const finalRedirect = redirectParam && redirectParam !== "/setup" ? redirectParam : "/dashboard";
      router.push(finalRedirect);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);

    try {
      const r = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      const rd = await r.json();

      if (r.ok) {
        setResent(true);
        setShowResend(false);
        setError("");
      } else {
        setError(rd.message || "Failed to resend. Please try again.");
        turnstileRef.current?.reset();
        setTurnstileToken("");
      }
    } catch {
      setError("Failed to resend. Please try again.");
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } finally {
      setResending(false);
    }
  };

  if (checkingSetup) {
    return (
      <AuthShell visualMode="login" visualKicker="Secure access">
        <div className="auth-success-panel">
          <AuthPageIntro
            eyebrow="Loading"
            title="Preparing Accoraze"
            description="Checking your workspace setup before sign in."
          />
        </div>
      </AuthShell>
    );
  }

  if (setupCheckFailed) {
    return (
      <AuthShell visualMode="login" visualKicker="Secure access">
        <AuthPageIntro
          eyebrow="Setup check"
          title="Could not verify setup"
          description="Please retry the workspace check to continue."
        />
        <AuthAlert type="error">Could not verify setup status. Please try again.</AuthAlert>
        <AuthButton type="button" onClick={retrySetupCheck}>
          Retry
        </AuthButton>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      visualMode="login"
      visualKicker="Accoraze platform"
      visualTitle="Run your business, smarter."
      visualDescription="POS, inventory, orders, customers, and reports - all connected in one platform."
    >
      <div className="auth-flow">
        <AuthPageIntro
          eyebrow="Welcome back"
          title="Sign in to your workspace"
          description="Enter your email and password to continue."
        />

        {error && <AuthAlert type="error">{error}</AuthAlert>}

        {showResend && !resent && (
          <AuthAlert type="info">
            Didn&apos;t receive a verification email?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="auth-inline-button"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>
          </AuthAlert>
        )}

        {resent && <AuthAlert type="success">Verification email sent. Check your inbox.</AuthAlert>}

        <form className="auth-form" onSubmit={handleFormSubmit}>
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            autoComplete="email"
          />
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <div className="auth-form-meta-row">
            <Link href="/forgot-password" className="auth-link">
              Forgot password?
            </Link>
          </div>

          <TurnstileWidget
            ref={turnstileRef}
            onVerify={(token) => setTurnstileToken(token)}
            onError={() => setTurnstileToken("")}
            onExpired={() => setTurnstileToken("")}
            theme="light"
            size="normal"
          />

          <AuthButton type="submit" loading={loading}>
            {loading ? "Signing in" : "Sign in"}
          </AuthButton>
        </form>

        <div className="auth-link-row">
          <span>New to Accoraze?</span>
          <Link href="/register" className="auth-link">
            Create account
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}
