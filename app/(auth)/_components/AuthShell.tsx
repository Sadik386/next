"use client";

import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { LoaderCircle } from "lucide-react";
import LegalFooter from "@/lib/LegalFooter";
import { PUBLIC_LINKS } from "@/lib/public-links";

type AuthVisualMode = "login" | "register" | "forgot";

interface AuthShellProps {
  children: ReactNode;
  maxWidth?: string;
  visualMode?: AuthVisualMode;
  visualStage?: 1 | 2;
  visualKicker?: string;
  visualTitle?: string;
  visualDescription?: string;
}

export default function AuthShell({
  children,
  maxWidth = "430px",
  visualMode = "login",
  visualStage = 1,
  visualKicker = "Acuity Commerce workspace",
  visualTitle = "Run every counter, team, and workflow from one calm operating layer.",
  visualDescription = "A secure business command center for sales, inventory, customers, and daily decisions.",
}: AuthShellProps) {
  return (
    <main className={`auth-shell auth-shell--${visualMode}`}>
      <div className="auth-shell__frame">
        <section
          className="auth-shell__form-pane"
          style={{ "--auth-form-max": maxWidth } as CSSProperties}
        >
          <div className="auth-shell__form-inner">{children}</div>
          <div className="auth-shell__footer">
            <LegalFooter variant="inline" showBadge={false} showMainLink />
          </div>
        </section>

        <aside className="auth-shell__visual-pane" aria-hidden="true">
          <AuthVisual
            mode={visualMode}
            stage={visualStage}
            kicker={visualKicker}
            title={visualTitle}
            description={visualDescription}
          />
        </aside>
      </div>
    </main>
  );
}

function AuthVisual({
  mode,
  stage,
  kicker,
  title,
  description,
}: {
  mode: AuthVisualMode;
  stage: 1 | 2;
  kicker: string;
  title: string;
  description: string;
}) {
  const panelLabel = mode === "register" ? "Setup progress" : mode === "forgot" ? "Security features" : "Business dashboard - this month";

  return (
    <div className="auth-visual">
      <div className="auth-visual__pattern" />
      <div className="auth-visual__top">
        <p>{kicker}</p>
        <h2>{title}</h2>
        <span>{description}</span>
      </div>

      {mode === "register" && (
        <div className="auth-visual__notice">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Workspace policy</strong>
            <p>Workspace access starts immediately after registration. Acuity Commerce may review accounts that violate platform terms.</p>
          </div>
        </div>
      )}

      <div className="auth-visual__board">
        <div className="auth-visual__window-bar">
          <i />
          <i />
          <i />
          <span>{panelLabel}</span>
        </div>
        <div className="auth-visual__window-body">
          {mode === "login" && <LoginVisualBoard />}
          {mode === "register" && <RegisterVisualBoard stage={stage} />}
          {mode === "forgot" && <ForgotVisualBoard />}
        </div>
      </div>
    </div>
  );
}

function LoginVisualBoard() {
  return (
    <>
      <div className="auth-visual__stats">
        <div>
          <strong>৳18.4k</strong>
          <span>Revenue</span>
        </div>
        <div>
          <strong>248</strong>
          <span>Orders</span>
        </div>
        <div>
          <strong>1,340</strong>
          <span>Customers</span>
        </div>
      </div>
      <div className="auth-visual__chart">
        {[42, 58, 38, 70, 52, 88, 65].map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>
      <div className="auth-visual__mini-grid">
        <div>
          <span>Low stock</span>
          <strong>3 items</strong>
        </div>
        <div>
          <span>Top product</span>
          <strong>Roll Up Banner</strong>
        </div>
        <div>
          <span>Pending orders</span>
          <strong>12</strong>
        </div>
      </div>
    </>
  );
}

function RegisterVisualBoard({ stage }: { stage: 1 | 2 }) {
  const items = ["Personal information", "Business workspace", "Owner role", "Free plan"];

  return (
    <div className="auth-visual__feature-list">
      {items.map((item, index) => (
        <div
          key={item}
          className={[
            index < stage - 1 ? "is-complete" : "",
            index === stage - 1 ? "is-current" : "",
          ].filter(Boolean).join(" ")}
        >
          <span>{index + 1}</span>
          <strong>{item}</strong>
          <small>{index < stage - 1 ? "Done" : index === stage - 1 ? "Current" : "Included"}</small>
        </div>
      ))}
    </div>
  );
}

function ForgotVisualBoard() {
  const items = [
    "Turnstile bot protection",
    "Encrypted reset links",
    "Time-limited tokens",
    "Secure account recovery",
  ];

  return (
    <div className="auth-visual__feature-list">
      {items.map((item) => (
        <div key={item} className="is-current">
          <span>OK</span>
          <strong>{item}</strong>
          <small>Active</small>
        </div>
      ))}
    </div>
  );
}

function AuthLogo({
  compact = false,
  variant = "dark",
  linked = true,
  className = "",
}: {
  compact?: boolean;
  variant?: "dark" | "light";
  linked?: boolean;
  className?: string;
}) {
  const logoClassName = `auth-logo auth-logo--${variant} ${compact ? "auth-logo--compact" : ""} ${className}`.trim();
  const logoContent = (
    <>
      <span className="auth-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" role="img">
          <rect x="3" y="3" width="17" height="17" rx="5" />
          <rect x="24" y="3" width="17" height="17" rx="5" />
          <rect x="3" y="24" width="17" height="17" rx="5" />
          <rect x="24" y="24" width="17" height="17" rx="5" />
        </svg>
      </span>
      <span className="auth-logo__word">Acuity Commerce</span>
    </>
  );

  if (!linked) {
    return <span className={logoClassName}>{logoContent}</span>;
  }

  return (
    <Link
      href={PUBLIC_LINKS.main}
      target="_blank"
      rel="noopener noreferrer"
      className={logoClassName}
      aria-label="Acuity Commerce main site"
    >
      {logoContent}
    </Link>
  );
}

function AuthPageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <header className="auth-intro">
      <AuthLogo />
      <div className="auth-intro__copy">
        {eyebrow && <p className="auth-intro__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </header>
  );
}

function AuthAlert({
  type,
  children,
}: {
  type: "error" | "success" | "info" | "warning";
  children: ReactNode;
}) {
  return (
    <div className={`auth-alert auth-alert--${type}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

function AuthInput({
  label,
  required,
  className,
  ...inputProps
}: {
  label: string;
  required?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="auth-field">
      <span className="auth-field__label">
        {label}
        {required && <span aria-hidden="true">*</span>}
      </span>
      <input
        {...inputProps}
        required={required}
        className={`auth-field__control ${className || ""}`.trim()}
      />
    </label>
  );
}

function AuthSelect({
  label,
  required,
  children,
  className,
  ...selectProps
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="auth-field">
      <span className="auth-field__label">
        {label}
        {required && <span aria-hidden="true">*</span>}
      </span>
      <select
        {...selectProps}
        required={required}
        className={`auth-field__control auth-field__control--select ${className || ""}`.trim()}
      >
        {children}
      </select>
    </label>
  );
}

function AuthButton({
  loading,
  children,
  className,
  variant = "primary",
  ...props
}: {
  loading?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`auth-button auth-button--${variant} ${className || ""}`.trim()}
      data-loading={loading ? "true" : "false"}
    >
      {loading && <LoaderCircle className="auth-button__spinner" size={16} aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

function AuthStepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="auth-steps" aria-label={`Registration step ${step} of 2`}>
      <div className={`auth-steps__item ${step >= 1 ? "auth-steps__item--active" : ""}`}>
        <span>1</span>
        <strong>Personal</strong>
      </div>
      <div className="auth-steps__line" />
      <div className={`auth-steps__item ${step >= 2 ? "auth-steps__item--active" : ""}`}>
        <span>2</span>
        <strong>Business</strong>
      </div>
    </div>
  );
}

export {
  AuthAlert,
  AuthButton,
  AuthInput,
  AuthLogo,
  AuthPageIntro,
  AuthSelect,
  AuthStepIndicator,
};
