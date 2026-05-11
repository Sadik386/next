"use client";
import { useEffect, useRef, useState } from "react";

export default function ScannerComponent({
  onScan,
  onClose,
}: {
  onScan: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let reader: { reset: () => void } | null = null;

    import("@zxing/library").then(({ BrowserMultiFormatReader }) => {
      if (!videoRef.current) return;
      const br = new BrowserMultiFormatReader();
      reader = br;
      br.decodeFromVideoDevice(null, videoRef.current, (result) => {
        if (result) onScan(result.getText());
      }).catch((e: Error) => {
        setError(e.message);
      });
    });

    return () => {
      reader?.reset();
    };
  }, [onScan]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0,0,0,0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <video
        ref={videoRef}
        style={{ width: "100%", maxWidth: 480, borderRadius: 12 }}
        playsInline
        muted
      />
      {error && (
        <div style={{ color: "#ef4444", marginTop: 12, fontSize: 13 }}>
          Camera error: {error}
        </div>
      )}
      <button
        onClick={onClose}
        style={{
          marginTop: 20,
          padding: "8px 24px",
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.1)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </div>
  );
}
