"use client";

import { 
  Mail, 
  ShieldCheck, 
  AlertTriangle,
  Server,
  Building2,
  CheckCircle2
} from "lucide-react";

export default function PlatformEmailPolicy() {
  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Email Policy & Foundation</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Infrastructure configuration for platform and tenant communications</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
        <PolicyCard 
          icon={<ShieldCheck size={20} color="var(--brand)" />}
          title="Platform SMTP"
          description="Used only for Accoraze platform/internal emails. Managed via environment variables."
          points={[
            "Platform admin alerts",
            "New business registration alerts",
            "Platform notices and security alerts",
            "Platform support/system messages"
          ]}
          note="Platform SMTP does NOT send tenant customer emails."
          status="Shared Resource"
        />

        <PolicyCard 
          icon={<Building2 size={20} color="#7c3aed" />}
          title="Business SMTP"
          description="Used for customer-facing tenant emails. Each business must configure its own SMTP."
          points={[
            "Order updates and invoice emails",
            "Receipt emails to customers",
            "Staff invitation emails",
            "Low stock alerts",
            "Customer notifications"
          ]}
          note="Required for customer-facing messages."
          status="Tenant Isolated"
        />
      </div>

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Server size={20} color="var(--text-primary)" />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>Platform SMTP Configuration</h3>
        </div>
        
        <div style={{ padding: "24px", backgroundColor: "var(--page-bg)", borderRadius: "8px", border: "1px solid var(--card-border)", textAlign: "center" }}>
          <Mail size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
          <h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Platform SMTP Configuration</h4>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto" }}>
            Platform SMTP is currently configured via environment variables (`SMTP_HOST`, `SMTP_USER`, etc.). 
            A dedicated UI for managing platform SMTP settings will be added in a future release.
          </p>
        </div>
      </div>

      <div style={{ 
        marginTop: "32px", 
        padding: "24px", 
        backgroundColor: "#fffbeb", 
        borderRadius: "12px", 
        border: "1px solid #fde68a",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#92400e" }}>
          <AlertTriangle size={20} />
          <h3 style={{ fontSize: "16px", fontWeight: 700 }}>Critical Policies</h3>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={policyItemStyle}>
            <div style={policyTitleStyle}>1. Tenant Isolation</div>
            <div style={policyDescStyle}>Platform SMTP must NOT send customer emails on behalf of businesses. Businesses must configure their own SMTP for all customer outreach.</div>
          </div>
          <div style={policyItemStyle}>
            <div style={policyTitleStyle}>2. Business SMTP Required</div>
            <div style={policyDescStyle}>If a business has not configured its own SMTP, customer-facing email actions must be blocked with a clear &quot;SMTP missing&quot; error. Platform SMTP must never be used as a fallback.</div>
          </div>
          <div style={policyItemStyle}>
            <div style={policyTitleStyle}>3. Usage Limits</div>
            <div style={policyDescStyle}>Business email sending is metered by plan quotas. Free plan: 100 emails/month. Limits reset monthly.</div>
          </div>
          <div style={policyItemStyle}>
            <div style={policyTitleStyle}>4. V1 Email Behavior</div>
            <div style={policyDescStyle}>No automatic email sending in V1. Manual email actions will use the configured Business SMTP and apply plan limits.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyCard({ icon, title, description, points, note, status }: any) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon}
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
        </div>
        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", padding: "4px 8px", backgroundColor: "var(--page-bg)", borderRadius: "4px", color: "var(--text-muted)" }}>
          {status}
        </span>
      </div>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>{description}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
        {points.map((p: string, i: number) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
            <CheckCircle2 size={14} color="#16a34a" />
            {p}
          </li>
        ))}
      </ul>
      {note && (
        <div style={{ marginTop: "12px", padding: "10px 12px", backgroundColor: "var(--page-bg)", borderRadius: "6px", border: "1px solid var(--card-border)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>{note}</div>
        </div>
      )}
    </div>
  );
}

const cardStyle = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "24px",
};

const policyItemStyle = {
  padding: "16px",
  backgroundColor: "rgba(255,255,255,0.5)",
  borderRadius: "8px",
};

const policyTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#92400e",
  marginBottom: "4px",
};

const policyDescStyle = {
  fontSize: "12px",
  color: "#b45309",
  lineHeight: 1.4,
};
