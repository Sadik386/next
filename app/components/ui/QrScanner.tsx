"use client";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";

interface QrScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let mounted = true;
    let codeReader: any = null;

    const startScanner = async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/library");
        codeReader = new BrowserMultiFormatReader();

        if (!mounted || !videoRef.current) return;

        setIsScanning(true);
        await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result: any, err: any) => {
          if (result && mounted) {
            onScan(result.getText());
          }
        });
      } catch (err) {
        if (mounted) setError("Camera access denied or unavailable");
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (codeReader) {
        try { codeReader.reset?.(); } catch {}
      }
    };
  }, [onScan]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      backgroundColor: "rgba(0,0,0,0.9)", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px"
    }}>
      <div style={{
        position: "relative", width: "280px", height: "280px",
        borderRadius: "16px", overflow: "hidden", backgroundColor: "#000"
      }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          border: "2px solid var(--brand)",
          borderRadius: "16px", pointerEvents: "none"
        }} />
      </div>
      {error && <p style={{ color: "#ef4444", fontSize: "13px" }}>{error}</p>}
      {isScanning && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#fff" }}>
          <Camera size={16} />
          <span style={{ fontSize: "13px" }}>Scanning...</span>
        </div>
      )}
      <button
        onClick={onClose}
        style={{
          padding: "10px 24px", borderRadius: "8px", border: "none",
          backgroundColor: "#333", color: "#fff", fontSize: "14px", cursor: "pointer"
        }}
      >
        Cancel
      </button>
    </div>
  );
}