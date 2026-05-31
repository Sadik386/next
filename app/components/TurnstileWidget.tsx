"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render(container: HTMLElement, options: Record<string, unknown>): string;
      reset(widgetId: string): void;
      remove(widgetId: string): void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError: () => void;
  onExpired?: () => void;
  className?: string;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact";
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

type TurnstileStatus = "loading" | "ready" | "verified" | "error" | "expired" | "unavailable";

const statusMessage: Record<TurnstileStatus, string> = {
  loading: "Preparing secure check",
  ready: "Security check ready",
  verified: "Security check verified",
  error: "Security check needs retry",
  expired: "Security check expired",
  unavailable: "Security check unavailable",
};

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget({
  onVerify,
  onError,
  onExpired,
  className,
  theme = "light",
  size = "normal",
}, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onVerify, onError, onExpired });
  const [status, setStatus] = useState<TurnstileStatus>("loading");

  useEffect(() => {
    callbacksRef.current = { onVerify, onError, onExpired };
  }, [onVerify, onError, onExpired]);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.warn("[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY not set - CAPTCHA widget unavailable");
      setStatus("unavailable");
      return;
    }

    let cancelled = false;
    let cleanupListeners: void | (() => void);
    const scriptId = "turnstile-script";

    const initTurnstile = () => {
      if (cancelled || !window.turnstile || !containerRef.current || widgetIdRef.current) {
        return;
      }

      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          setStatus("verified");
          callbacksRef.current.onVerify(token);
        },
        "error-callback": () => {
          setStatus("error");
          callbacksRef.current.onError();
        },
        "expired-callback": () => {
          setStatus("expired");
          callbacksRef.current.onExpired?.();
        },
        theme,
        size,
      });

      widgetIdRef.current = id;
      setStatus("ready");
    };

    const waitForTurnstile = (script: HTMLScriptElement) => {
      if (window.turnstile) {
        initTurnstile();
        return;
      }

      const handleLoad = () => {
        window.setTimeout(initTurnstile, 0);
      };
      const handleScriptError = () => {
        setStatus("error");
        callbacksRef.current.onError();
      };

      script.addEventListener("load", handleLoad, { once: true });
      script.addEventListener("error", handleScriptError, { once: true });

      return () => {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleScriptError);
      };
    };

    const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existingScript) {
      cleanupListeners = waitForTurnstile(existingScript);
    } else {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      cleanupListeners = waitForTurnstile(script);
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      cleanupListeners?.();

      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
        }
      }

      widgetIdRef.current = null;
    };
  }, [theme, size]);

  useImperativeHandle(ref, () => ({
    reset() {
      if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current);
          setStatus("ready");
        } catch {
        }
      }
    },
  }), []);

  return (
    <div
      className={`auth-turnstile auth-turnstile--${size} ${className || ""}`.trim()}
      data-status={status}
    >
      <div className="auth-turnstile__meta">
        <span className="auth-turnstile__icon" aria-hidden="true" />
        <span className="auth-turnstile__message">{statusMessage[status]}</span>
      </div>
      <div ref={containerRef} className="auth-turnstile__widget" />
    </div>
  );
});

export default TurnstileWidget;
