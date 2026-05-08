"use client";
import { useRef, useState } from "react";
import { Download, FileText, Package, Upload, Users, ShoppingCart, X, AlertCircle } from "lucide-react";

type ModuleKey = "products" | "customers" | "orders";

type ModuleDef = {
  key: ModuleKey;
  label: string;
  description: string;
  columns: string[];
  Icon: typeof Package;
};

const MODULES: ModuleDef[] = [
  {
    key: "products",
    label: "Products",
    description: "Product catalog with prices, stock, and units.",
    columns: [
      "Product Name*",
      "Description",
      "Category",
      "SKU",
      "Sale Price*",
      "Cost Price*",
      "Stock Quantity*",
      "Unit*",
      "Status*",
    ],
    Icon: Package,
  },
  {
    key: "customers",
    label: "Customers",
    description: "Customer accounts and contact details.",
    columns: ["Full Name*", "Email*", "Phone*", "Country", "City", "Street Address", "Account Status*"],
    Icon: Users,
  },
  {
    key: "orders",
    label: "Orders",
    description: "Customer orders with totals and shipping info.",
    columns: [
      "Customer ID*",
      "Date*",
      "Total Amount*",
      "Status*",
      "Payment Status*",
      "Payment Method*",
      "Shipping Address*",
    ],
    Icon: ShoppingCart,
  },
];

type PreviewState = {
  module: ModuleKey;
  fileName: string;
  file: File;
  headers: string[];
  rows: string[][];
};

type ImportResultState = {
  module: ModuleKey;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
};

export default function ImportExportPage() {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputs = useRef<Record<ModuleKey, HTMLInputElement | null>>({
    products: null,
    customers: null,
    orders: null,
  });

  function downloadFromUrl(url: string) {
    const a = document.createElement("a");
    a.href = url;
    a.click();
  }

  async function handleFileSelected(module: ModuleKey, file: File) {
    setError(null);
    setResult(null);
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
    if (lines.length === 0) {
      setError("CSV file is empty");
      return;
    }
    const parseLine = (line: string): string[] => {
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === "," && !inQuotes) {
          out.push(cur);
          cur = "";
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out;
    };
    const headers = parseLine(lines[0]);
    const rows = lines.slice(1, 6).map(parseLine);
    setPreview({ module, fileName: file.name, file, headers, rows });
  }

  async function confirmImport() {
    if (!preview) return;
    setImporting(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", preview.file);
    const res = await fetch(`/api/import/${preview.module}`, { method: "POST", body: fd });
    setImporting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Import failed");
      return;
    }
    const data = await res.json();
    setResult({
      module: preview.module,
      created: data.created ?? 0,
      skipped: data.skipped ?? 0,
      errors: data.errors ?? [],
    });
    setPreview(null);
    const input = fileInputs.current[preview.module];
    if (input) input.value = "";
  }

  function cancelPreview() {
    if (preview) {
      const input = fileInputs.current[preview.module];
      if (input) input.value = "";
    }
    setPreview(null);
  }

  return (
    <div>
      <div style={{ marginBottom: "16px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
          Import / Export
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
          Bulk-load or export your data using CSV files.
        </p>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#b91c1c",
            padding: "10px 12px",
            borderRadius: "8px",
            fontSize: "13px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {result && (
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
              Import results — {result.module}
            </div>
            <button
              onClick={() => setResult(null)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <X size={16} />
            </button>
          </div>
          <div style={{ display: "flex", gap: "16px", fontSize: "13px", marginBottom: "8px" }}>
            <span style={{ color: "#16a34a" }}>{result.created} created</span>
            <span style={{ color: "#b45309" }}>{result.skipped} skipped</span>
            <span style={{ color: "#dc2626" }}>{result.errors.length} errors</span>
          </div>
          {result.errors.length > 0 && (
            <div
              style={{
                maxHeight: "180px",
                overflowY: "auto",
                fontSize: "12px",
                backgroundColor: "var(--input-bg)",
                borderRadius: "6px",
                padding: "8px",
              }}
            >
              {result.errors.map((e, i) => (
                <div key={i} style={{ color: "var(--text-secondary)", marginBottom: "2px" }}>
                  Row {e.row}: {e.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {preview && (
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            padding: "14px 16px",
            marginBottom: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                Preview — {preview.module}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {preview.fileName} • showing first {preview.rows.length} rows
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={cancelPreview} style={btnSecondary}>
                Cancel
              </button>
              <button onClick={confirmImport} disabled={importing} style={btnPrimary}>
                {importing ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--input-bg)" }}>
                  {preview.headers.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, ri) => (
                  <tr key={ri} style={{ borderTop: "1px solid var(--card-border)" }}>
                    {preview.headers.map((_, ci) => (
                      <td key={ci} style={{ padding: "6px 8px", color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                        {row[ci] ?? ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "16px",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          marginBottom: "20px",
        }}
      >
        {MODULES.map(({ key, label, description, columns, Icon }) => (
          <div
            key={key}
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: "var(--brand-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-color)",
                }}
              >
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "15px", color: "var(--text-primary)" }}>
                  {label}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{description}</div>
              </div>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              <span style={{ fontWeight: 600 }}>Columns:</span> {columns.join(", ")}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "auto" }}>
              <button
                onClick={() => downloadFromUrl(`/api/templates/${key}`)}
                style={btnSecondary}
              >
                <FileText size={13} /> Template
              </button>
              <button
                onClick={() => downloadFromUrl(`/api/export/${key}`)}
                style={btnSecondary}
              >
                <Download size={13} /> Export
              </button>
              <button
                onClick={() => fileInputs.current[key]?.click()}
                style={btnPrimary}
              >
                <Upload size={13} /> Import
              </button>
              <input
                ref={(el) => {
                  fileInputs.current[key] = el;
                }}
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelected(key, f);
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "10px",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px" }}>
          Tips
        </div>
        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <li>Download the template first to see the expected column order.</li>
          <li>Required columns (marked with *) cannot be empty.</li>
          <li>Export is role-based — managers can export products and orders; admins are required for customers.</li>
          <li>Import requires admin or higher permission.</li>
        </ul>
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "8px",
  backgroundColor: "var(--brand-color)",
  color: "#fff",
  fontSize: "12.5px",
  fontWeight: 600,
  border: "none",
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "8px",
  backgroundColor: "var(--input-bg)",
  color: "var(--text-primary)",
  fontSize: "12.5px",
  fontWeight: 600,
  border: "1px solid var(--card-border)",
  cursor: "pointer",
};
