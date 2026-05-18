"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  Calendar,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function PlatformUsage() {
  const [usage, setUsage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platform/usage")
      .then(res => res.json())
      .then(res => {
        if (res.success) setUsage(res.usage);
        else toast.error(res.error || "Failed to load usage");
      })
      .catch(() => toast.error("Connection error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Platform Usage</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Cross-business metric consumption</p>
      </div>

      <div style={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "12px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <Loader2 className="animate-spin" size={24} color="var(--brand)" style={{ margin: "0 auto" }} />
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--card-border)", backgroundColor: "var(--page-bg)" }}>
                <th style={thStyle}>Business</th>
                <th style={thStyle}>Metric</th>
                <th style={thStyle}>Current Value</th>
                <th style={thStyle}>Period End</th>
                <th style={thStyle}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((u) => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{u.businessName}</span>
                  </td>
                  <td style={tdStyle}>
                    <code style={{ 
                      fontSize: "12px", 
                      backgroundColor: "var(--page-bg)", 
                      padding: "2px 6px", 
                      borderRadius: "4px",
                      color: "var(--brand)"
                    }}>
                      {u.key}
                    </code>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{u.value}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Calendar size={14} color="var(--text-muted)" />
                      {new Date(u.periodEnd).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={tdStyle}>{new Date(u.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
              {usage.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                      <AlertCircle size={24} />
                      <span>No usage data found in current periods.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "var(--page-bg)", borderRadius: "8px", border: "1px dashed var(--sidebar-border)" }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
          Usage tracking is automatically reset at the start of each month. 
          No usage data tracked yet. Email usage tracking will appear after the manual email module is enabled.
        </p>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  fontSize: "14px",
  color: "var(--text-secondary)",
};
