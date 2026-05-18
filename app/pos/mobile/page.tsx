"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

function MobileScannerInner() {
  const params = useSearchParams();
  const sessionId = params.get("session") ?? "";

  useEffect(() => {
    if (sessionId) {
      window.location.replace(`/scan/pos/${sessionId}`);
    }
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f172a",
        color: "#fff",
        fontFamily: "system-ui"
      }}>
        <div>Missing session ID</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0f172a",
      color: "#fff",
      fontFamily: "system-ui"
    }}>
      <div>Redirecting to scanner...</div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0f172a",
      color: "#fff",
      fontFamily: "system-ui"
    }}>
      <div>Loading...</div>
    </div>
  );
}

export default function MobileScannerPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MobileScannerInner />
    </Suspense>
  );
}