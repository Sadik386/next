"use client";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";

type SessionState = {
  sessionId: string;
  status: string;
  expiresAt: string;
};

type ScannerUrlState = {
  sessionId: string;
  accessToken: string;
  ready: boolean;
};

function ScannerContent() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [manual, setManual] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [scannerUrl, setScannerUrl] = useState<ScannerUrlState>({
    sessionId: "",
    accessToken: "",
    ready: false,
  });

  useEffect(() => {
    const pathParts = window.location.pathname.split("/");
    const sid = pathParts[pathParts.length - 1] || "";
    setScannerUrl({
      sessionId: sid,
      accessToken: new URLSearchParams(window.location.search).get("token") ?? "",
      ready: true,
    });
  }, []);

  useEffect(() => {
    if (!scannerUrl.ready || !scannerUrl.sessionId) return;
    if (!scannerUrl.accessToken) {
      setError("Missing scanner token");
      return;
    }

    const tokenParam = `?token=${encodeURIComponent(scannerUrl.accessToken)}`;
    fetch(`/api/scan/products/session/${scannerUrl.sessionId}${tokenParam}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setSession({ sessionId: d.sessionId, status: d.status, expiresAt: d.expiresAt });
          if (d.status !== "active") setError("Session is not active");
        }
      })
      .catch(() => setError("Failed to load session"));
  }, [scannerUrl]);

  const submitScan = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      const now = Date.now();
      if (lastScanRef.current && lastScanRef.current.code === trimmed && now - lastScanRef.current.at < 1500) {
        return;
      }
      lastScanRef.current = { code: trimmed, at: now };

      try {
        if (!scannerUrl.accessToken) {
          setLastResult({ ok: false, message: "Missing scanner token" });
          return;
        }

        const tokenParam = `?token=${encodeURIComponent(scannerUrl.accessToken)}`;
        const res = await fetch(`/api/scan/products/session/${scannerUrl.sessionId}/scan${tokenParam}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setLastResult({ ok: false, message: data.error ?? "Scan failed" });
          return;
        }
        setLastResult({
          ok: true,
          message: data.productName ? `Found: ${data.productName}` : `Sent: ${trimmed}`,
        });
      } catch {
        setLastResult({ ok: false, message: "Network error" });
      }
    },
    [scannerUrl]
  );

  useEffect(() => {
    if (!cameraOn || !scannerUrl.sessionId) return;
    let stopped = false;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    (async () => {
      try {
        if (typeof navigator === "undefined" || !navigator.mediaDevices) {
          setCameraError("Camera access requires HTTPS or a secure browser context. Use manual SKU input below.");
          setCameraOn(false);
          return;
        }
        if (!navigator.mediaDevices.getUserMedia) {
          setCameraError("Camera is not available in this browser. Use manual SKU input below.");
          setCameraOn(false);
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        await reader.decodeFromVideoDevice(null, video, (result) => {
          if (stopped) return;
          if (result) {
            submitScan(result.getText());
          }
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Camera error";
        if (errMsg.includes("Permission denied") || errMsg.includes("NotAllowed") || errMsg.includes("NotFound")) {
          setCameraError("Camera permission denied. Use manual SKU input below.");
        } else if (errMsg.includes("getUserMedia")) {
          setCameraError("Camera access requires HTTPS. Use manual SKU input below.");
        } else {
          setCameraError(errMsg);
        }
        setCameraOn(false);
      }
    })();

    return () => {
      stopped = true;
      readerRef.current?.reset();
      readerRef.current = null;
    };
  }, [cameraOn, scannerUrl.sessionId, submitScan]);

  function manualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manual.trim()) return;
    submitScan(manual);
    setManual("");
  }

  return (
    <div className="acc-mobile-scanner" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 700 }}>Accoraze Scanner</div>
          <div style={contextBadge}>Products</div>
        </div>
      </header>

      <main style={mainStyle}>
        {!session && !error ? (
          <div style={{ color: "#fff", padding: "20px" }}>Loading session…</div>
        ) : (
          <>
            {error && <div style={errorBox}>{error}</div>}

            {session && session.status === "active" && (
              <>
                <div style={cameraBox}>
                  {cameraOn ? (
                    <video
                      ref={videoRef}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      muted
                      playsInline
                    />
                  ) : (
                    <div style={cameraPlaceholder}>
                      <div style={{ fontSize: "13px", opacity: 0.7, marginBottom: "12px" }}>
                        Tap below to start camera
                      </div>
                      <button onClick={() => setCameraOn(true)} style={primaryButton}>
                        Start Camera
                      </button>
                    </div>
                  )}
                  {cameraOn && (
                    <div style={viewfinderOverlay}>
                      <div style={viewfinderFrame} />
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div style={warningBox}>{cameraError}</div>
                )}

                {cameraOn && (
                  <button
                    onClick={() => setCameraOn(false)}
                    style={{ ...secondaryButton, marginTop: "12px" }}
                  >
                    Stop Camera
                  </button>
                )}
              </>
            )}

            <form onSubmit={manualSubmit} style={manualForm}>
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                placeholder="Type or paste SKU / barcode"
                style={manualInput}
                autoCapitalize="off"
                autoComplete="off"
              />
              <button type="submit" style={primaryButton}>
                Send
              </button>
            </form>

            {lastResult && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  backgroundColor: lastResult.ok ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)",
                  border: `1px solid ${lastResult.ok ? "#22c55e" : "#ef4444"}`,
                  color: "#fff",
                  fontSize: "13px",
                }}
              >
                {lastResult.message}
              </div>
            )}
          </>
        )}
      </main>

      <footer style={footerStyle}>
        Scan or enter SKU to find a product on desktop.
      </footer>
    </div>
  );
}

export default function ScannerPage() {
  return (
    <Suspense fallback={<div style={pageStyle} />}>
      <ScannerContent />
    </Suspense>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  backgroundColor: "#0f172a",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 18px",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const contextBadge: React.CSSProperties = {
  display: "inline-block",
  marginTop: "4px",
  padding: "2px 8px",
  borderRadius: "999px",
  backgroundColor: "rgba(59,130,246,0.2)",
  color: "#3b82f6",
  fontSize: "10px",
  fontWeight: 600,
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: "16px",
  display: "flex",
  flexDirection: "column",
};

const cameraBox: React.CSSProperties = {
  position: "relative",
  width: "100%",
  aspectRatio: "3/4",
  maxHeight: "60vh",
  backgroundColor: "#000",
  borderRadius: "14px",
  overflow: "hidden",
};

const cameraPlaceholder: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
};

const viewfinderOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const viewfinderFrame: React.CSSProperties = {
  width: "70%",
  height: "30%",
  border: "2px solid #3b82f6",
  borderRadius: "10px",
  boxShadow: "0 0 0 9999px rgba(0,0,0,0.35)",
};

const manualForm: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginTop: "16px",
};

const manualInput: React.CSSProperties = {
  flex: 1,
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.18)",
  backgroundColor: "rgba(255,255,255,0.06)",
  color: "#fff",
  fontSize: "14px",
};

const primaryButton: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "10px",
  border: "none",
  backgroundColor: "#3b82f6",
  color: "#fff",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.2)",
  backgroundColor: "transparent",
  color: "#fff",
  fontSize: "13px",
  cursor: "pointer",
  alignSelf: "flex-start",
};

const footerStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: "11px",
  color: "rgba(255,255,255,0.6)",
  textAlign: "center",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const errorBox: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  backgroundColor: "rgba(239,68,68,0.2)",
  border: "1px solid #ef4444",
  color: "#fff",
  fontSize: "13px",
};

const warningBox: React.CSSProperties = {
  marginTop: "12px",
  padding: "10px 12px",
  borderRadius: "8px",
  backgroundColor: "rgba(251,191,36,0.15)",
  border: "1px solid #fbbf24",
  color: "#fbbf24",
  fontSize: "12px",
};
