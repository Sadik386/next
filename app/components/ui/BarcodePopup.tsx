"use client";
import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, { width: number; height: number; fontSize: number }> = {
  sm: { width: 1.5, height: 50, fontSize: 12 },
  md: { width: 2, height: 80, fontSize: 14 },
  lg: { width: 3, height: 110, fontSize: 18 },
};

export function BarcodePopup({
  trigger,
  value,
  label,
  size = "md",
  filename = "barcode",
}: {
  trigger: React.ReactNode;
  value: string;
  label?: string;
  size?: Size;
  filename?: string;
}) {
  const [open, setOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const config = SIZE_MAP[size];

  useEffect(() => {
    if (!open || !svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      width: config.width,
      height: config.height,
      displayValue: true,
      fontSize: config.fontSize,
      margin: 10,
    });
  }, [open, value, config]);

  function handlePrint() {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const win = window.open("", "_blank", "width=600,height=400");
    if (!win) return;
    win.document.write(`<!doctype html>
<html>
  <head>
    <title>Print Barcode${label ? ` — ${label}` : ""}</title>
    <style>
      html, body { margin: 0; padding: 0; }
      body {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: ui-sans-serif, system-ui, sans-serif;
        color: #111;
        background: #fff;
      }
      .label { font-size: 14px; margin-bottom: 12px; font-weight: 600; }
      .barcode { display: flex; align-items: center; justify-content: center; }
      @media print {
        @page { margin: 8mm; }
        body { min-height: auto; }
      }
    </style>
  </head>
  <body>
    ${label ? `<div class="label">${escapeHtml(label)}</div>` : ""}
    <div class="barcode">${svgString}</div>
    <script>
      window.addEventListener('load', function () {
        setTimeout(function () { window.print(); }, 100);
      });
    <\/script>
  </body>
</html>`);
    win.document.close();
  }

  function handleDownload() {
    if (!svgRef.current) return;
    const svgString = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {trigger}
      </div>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.4)",
              zIndex: 200,
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 201,
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "12px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              minWidth: "300px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text-primary)",
                textAlign: "center",
              }}
            >
              {label ?? value}
            </div>
            <div
              style={{
                backgroundColor: "white",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid var(--card-border)",
              }}
            >
              <svg ref={svgRef} />
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handlePrint}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "7px",
                  border: "1px solid var(--input-border)",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
              <button
                onClick={handleDownload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "7px",
                  border: "none",
                  backgroundColor: "var(--brand)",
                  color: "white",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}