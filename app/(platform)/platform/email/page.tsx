"use client";

import { 
  Mail, 
  ShieldCheck, 
  AlertTriangle,
  Server,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  Save,
  Eye,
  EyeOff
} from "lucide-react";
import { useState, useEffect } from "react";

interface PlatformEmailConfig {
  configured: boolean;
  hasPassword: boolean;
  host: string | null;
  port: number | null;
  secure: boolean | null;
  user: string | null;
  fromEmail: string | null;
  fromName: string;
  replyTo: string | null;
  source: "database" | "environment" | null;
}

interface FormData {
  host: string;
  port: string;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
}

const initialFormData: FormData = {
  host: "",
  port: "587",
  user: "",
  password: "",
  fromEmail: "",
  fromName: "Accoraze Platform",
  replyTo: "",
};

export default function PlatformEmailPolicy() {
  const [config, setConfig] = useState<PlatformEmailConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [testRecipient, setTestRecipient] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchConfig = () => {
    fetch("/api/platform/email")
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        if (data.configured && data.source === "database") {
          setFormData({
            host: data.host || "",
            port: String(data.port || "587"),
            user: data.user || "",
            password: "",
            fromEmail: data.fromEmail || "",
            fromName: data.fromName || "Accoraze Platform",
            replyTo: data.replyTo || "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!formData.host || !formData.user || !formData.fromEmail) {
      setMessage({ type: "error", text: "Host, username, and from email are required" });
      return;
    }

    const port = parseInt(formData.port, 10);
    const secure = port === 465;

    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          data: {
            host: formData.host,
            port: port,
            secure: secure,
            user: formData.user,
            password: formData.password,
            fromEmail: formData.fromEmail,
            fromName: formData.fromName,
            replyTo: formData.replyTo || undefined,
          },
        }),
      });
      const data = await res.json();
      setMessage({ type: data.success ? "success" : "error", text: data.message });
      if (data.success) {
        fetchConfig();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save configuration" });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testRecipient || !testRecipient.includes("@")) {
      setMessage({ type: "error", text: "Please enter a valid test recipient email" });
      return;
    }

    setTesting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/platform/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", email: testRecipient }),
      });
      const data = await res.json();
      setMessage({ type: data.success ? "success" : "error", text: data.message });
    } catch {
      setMessage({ type: "error", text: "Failed to send test email" });
    }
    setTesting(false);
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Email Policy</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>Platform and tenant email infrastructure</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <PolicyCard 
          icon={<ShieldCheck size={20} color="var(--brand)" />}
          title="Platform SMTP"
          description="Used only for Accoraze platform/internal emails. Managed via database or environment variables."
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Server size={16} color="var(--text-primary)" />
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Platform SMTP Settings</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {loading ? (
                <Loader2 size={14} className="animate-spin" style={{ color: "var(--text-muted)" }} />
              ) : config?.configured ? (
                <>
                  <CheckCircle2 size={14} color="#16a34a" />
                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 500 }}>Configured</span>
                  {config.source === "environment" && (
                    <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "4px" }}>(env)</span>
                  )}
                </>
              ) : (
                <>
                  <XCircle size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>Not Set</span>
                </>
              )}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <Loader2 size={20} className="animate-spin" style={{ margin: "0 auto", color: "var(--text-muted)" }} />
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <FormField label="SMTP Host" required>
                  <input
                    type="text"
                    value={formData.host}
                    onChange={e => handleChange("host", e.target.value)}
                    placeholder="smtp.gmail.com"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Port" required>
                  <input
                    type="text"
                    value={formData.port}
                    onChange={e => handleChange("port", e.target.value)}
                    placeholder="587"
                    style={inputStyle}
                  />
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    Port 465 uses SSL automatically. Port 587 uses STARTTLS automatically.
                  </div>
                </FormField>
                <FormField label="Username" required>
                  <input
                    type="text"
                    value={formData.user}
                    onChange={e => handleChange("user", e.target.value)}
                    placeholder="your@email.com"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Password" required>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={e => handleChange("password", e.target.value)}
                      placeholder={config?.hasPassword ? "•••••••• (keep existing)" : "Enter password"}
                      style={{ ...inputStyle, paddingRight: "32px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={eyeButtonStyle}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </FormField>
                <FormField label="From Email" required>
                  <input
                    type="text"
                    value={formData.fromEmail}
                    onChange={e => handleChange("fromEmail", e.target.value)}
                    placeholder="noreply@example.com"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="From Name">
                  <input
                    type="text"
                    value={formData.fromName}
                    onChange={e => handleChange("fromName", e.target.value)}
                    placeholder="Accoraze Platform"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Reply-To">
                  <input
                    type="text"
                    value={formData.replyTo}
                    onChange={e => handleChange("replyTo", e.target.value)}
                    placeholder="support@example.com"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="Test Recipient">
                  <input
                    type="text"
                    value={testRecipient}
                    onChange={e => {
                      setTestRecipient(e.target.value);
                      if (message?.type === "error" && e.target.value.includes("@")) {
                        setMessage(null);
                      }
                    }}
                    placeholder="test@example.com"
                    style={inputStyle}
                  />
                </FormField>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--card-border)" }}>
                <button
                  onClick={handleTest}
                  disabled={testing || !config?.configured}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    backgroundColor: "transparent",
                    color: config?.configured ? "var(--brand)" : "var(--text-muted)",
                    border: "1px solid",
                    borderColor: config?.configured ? "var(--brand)" : "var(--card-border)",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: config?.configured && !testing ? "pointer" : "not-allowed",
                    opacity: config?.configured && !testing ? 1 : 0.5,
                  }}
                >
                  {testing ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />}
                  Test
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    backgroundColor: "var(--brand)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Save
                </button>
              </div>

              {message && (
                <div style={{ 
                  marginTop: "12px", 
                  padding: "10px", 
                  borderRadius: "6px",
                  backgroundColor: message.type === "success" ? "#dcfce7" : "#fef2f2",
                  color: message.type === "success" ? "#166534" : "#991b1b",
                  fontSize: "12px"
                }}>
                  {message.text}
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ 
          padding: "12px", 
          backgroundColor: "#fffbeb", 
          borderRadius: "8px", 
          border: "1px solid #fde68a"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", color: "#92400e" }}>
            <AlertTriangle size={14} />
            <h3 style={{ fontSize: "12px", fontWeight: 700 }}>Critical Policies</h3>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ padding: "8px", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400e" }}>1. Tenant Isolation</div>
              <div style={{ fontSize: "10px", color: "#b45309" }}>Platform SMTP must NOT send tenant emails.</div>
            </div>
            <div style={{ padding: "8px", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400e" }}>2. Business SMTP Required</div>
              <div style={{ fontSize: "10px", color: "#b45309" }}>Each business configures own SMTP.</div>
            </div>
            <div style={{ padding: "8px", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400e" }}>3. Usage Limits</div>
              <div style={{ fontSize: "10px", color: "#b45309" }}>Free: 100 emails/month.</div>
            </div>
            <div style={{ padding: "8px", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: "4px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400e" }}>4. V1 Behavior</div>
              <div style={{ fontSize: "10px", color: "#b45309" }}>No auto-send. Manual only.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children, required, wide }: { label: string; children: React.ReactNode; required?: boolean; wide?: boolean }) {
  return (
    <div style={{ gridColumn: wide ? "span 2" : "auto" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "4px" }}>
        {label}
        {required && <span style={{ color: "#ef4444" }}> *</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  fontSize: "12px",
  border: "1px solid var(--card-border)",
  borderRadius: "6px",
  backgroundColor: "var(--page-bg)",
  color: "var(--text-primary)",
  outline: "none",
};

const eyeButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: "8px",
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
  padding: "4px",
  display: "flex",
  alignItems: "center",
};

function PolicyCard({ icon, title, description, points, note, status }: any) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon}
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>{title}</h3>
        </div>
        <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", padding: "3px 6px", backgroundColor: "var(--page-bg)", borderRadius: "3px", color: "var(--text-muted)" }}>
          {status}
        </span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px" }}>{description}</p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
        {points.map((p: string, i: number) => (
          <li key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
            <CheckCircle2 size={12} color="#16a34a" />
            {p}
          </li>
        ))}
      </ul>
      {note && (
        <div style={{ marginTop: "10px", padding: "8px 10px", backgroundColor: "var(--page-bg)", borderRadius: "4px", border: "1px solid var(--card-border)" }}>
          <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic" }}>{note}</div>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "8px",
  padding: "16px",
};