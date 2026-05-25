"use client";

import { useEffect, useRef, useState } from "react";

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

export default function TurnstileWidget({
  onVerify,
  onError,
  onExpired,
  className,
  theme = "light",
  size = "normal",
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      console.warn("[Turnstile] NEXT_PUBLIC_TURNSTILE_SITE_KEY not set — CAPTCHA widget hidden");
      return;
    }

    const scriptId = "turnstile-script";
    const existing = document.getElementById(scriptId);

    const initTurnstile = () => {
      if (window.turnstile && containerRef.current) {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          "error-callback": onError,
          "expired-callback": onExpired,
          theme,
          size,
        });
        widgetIdRef.current = id;
        setIsReady(true);
      }
    };

    if (existing) {
      initTurnstile();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setTimeout(initTurnstile, 0);
    };
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
        }
      }
    };
  }, [onVerify, onError, onExpired, theme, size]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ marginBottom: "14px", minHeight: size === "compact" ? "44px" : "65px" }}
    />
  );
}

export function resetTurnstile(widgetId: string) {
  if (typeof window !== "undefined" && window.turnstile) {
    try {
      window.turnstile.reset(widgetId);
    } catch {
    }
  }
}