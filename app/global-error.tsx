"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8fafc",
          color: "#18181b",
          margin: 0,
          padding: "24px",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            width: "100%",
            backgroundColor: "#ffffff",
            border: "1px solid #e4e4e7",
            borderRadius: "12px",
            padding: "28px",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: "12px",
              color: "#b91c1c",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            System error
          </div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#09090b",
              margin: "0 0 8px 0",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "#71717a",
              lineHeight: 1.5,
              margin: "0 0 20px 0",
              wordBreak: "break-word",
            }}
          >
            {error.message || "An unexpected error occurred while loading the application."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "8px 18px",
              backgroundColor: "#1d4ed8",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
