"use client";

import { useEffect, useState } from "react";
import { 
  Loader2, 
  Search, 
  CheckCircle2,
  XCircle,
  Building2
} from "lucide-react";
import { toast } from "sonner";

export default function PlatformBusinesses() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/platform/businesses")
      .then(res => res.json())
      .then(res => {
        if (res.success) setBusinesses(res.businesses);
        else toast.error(res.error || "Failed to load businesses");
      })
      .catch(() => toast.error("Connection error"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase()) ||
    b.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Businesses</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Manage all tenant organizations</p>
        </div>
        
        <div style={{ position: "relative" }}>
          <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={16} />
          <input 
            type="text" 
            placeholder="Search businesses..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px 12px 10px 36px",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--card-bg)",
              fontSize: "14px",
              width: "300px",
              outline: "none",
            }}
          />
        </div>
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
                <th style={thStyle}>Slug</th>
                <th style={thStyle}>Owner Email</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Users</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                  <td style={tdStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "var(--brand-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)" }}>
                        <Building2 size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.name}</span>
                    </div>
                  </td>
                  <td style={tdStyle}><code style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{b.slug}</code></td>
                  <td style={tdStyle}>{b.ownerEmail}</td>
                  <td style={tdStyle}>
                    <span style={{ 
                      padding: "4px 8px", 
                      borderRadius: "6px", 
                      fontSize: "12px", 
                      fontWeight: 600,
                      backgroundColor: b.plan === "Pro" ? "#7c3aed20" : b.plan === "Business" ? "#2563eb20" : "var(--page-bg)",
                      color: b.plan === "Pro" ? "#7c3aed" : b.plan === "Business" ? "#2563eb" : "var(--text-secondary)"
                    }}>
                      {b.plan}
                    </span>
                  </td>
                  <td style={tdStyle}>{b.userCount}</td>
                  <td style={tdStyle}>
                    {b.isActive ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#16a34a", fontSize: "13px" }}>
                        <CheckCircle2 size={14} /> Active
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#dc2626", fontSize: "13px" }}>
                        <XCircle size={14} /> Inactive
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{new Date(b.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No businesses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
