"use client";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Printer } from "lucide-react";

type Size = "sm" | "md" | "lg";

const SIZE_MAP: Record<Size, { width: number; height: number; fontSize: number }> = {
  sm: { width: 1.5, height: 50, fontSize: 12 },
  md: { width: 2, height: 80, fontSize: 14 },
  lg: { width: 3, height: 110, fontSize: 18 },
};

export default function BarcodeDisplay({
  value,
  label,
  size = "md",
}: {
  value: string;
  label?: string;
  size?: Size;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const config = SIZE_MAP[size];

  useEffect(() => {
    if (!svgRef.current || !value) return;
    JsBarcode(svgRef.current, value, {
      format: "CODE128",
      width: config.width,
      height: config.height,
      displayValue: true,
      fontSize: config.fontSize,
      margin: 10,
    });
  }, [value, config.width, config.height, config.fontSize]);

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

  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {label && (
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-primary)",
            textAlign: "center",
          }}
        >
          {label}
        </div>
      )}
      <div style={{ backgroundColor: "white", padding: "8px", borderRadius: "6px" }}>
        <svg ref={svgRef} />
      </div>
      <button
        type="button"
        onClick={handlePrint}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          borderRadius: "6px",
          border: "1px solid var(--input-border)",
          backgroundColor: "var(--card-bg)",
          color: "var(--text-primary)",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        <Printer size={13} /> Print Barcode
      </button>
    </div>
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
