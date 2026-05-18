"use client";

import Link from "next/link";
import { FileText, ShieldCheck, Activity } from "lucide-react";

export default function PlatformLogs() {
  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>System Logs</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Platform audit and security logs</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
        <LogLinkCard
          icon={<FileText size={24} />}
          title="All Logs"
          description="Activity logs across all modules, actions, and entities."
          href="/logs?tab=activity"
        />
        <LogLinkCard
          icon={<Activity size={24} />}
          title="Activity Logs"
          description="Detailed logs for all business operations and changes."
          href="/logs?tab=activity"
        />
        <LogLinkCard
          icon={<ShieldCheck size={24} />}
          title="Security Logs"
          description="Login history, suspicious access patterns, and security events."
          href="/logs?tab=security"
        />
      </div>

      <div style={{
        marginTop: "32px",
        padding: "20px",
        backgroundColor: "var(--brand-light)",
        borderRadius: "12px",
        border: "1px solid var(--brand-border)",
        display: "flex",
        gap: "12px"
      }}>
        <FileText size={20} color="var(--brand)" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          <strong>Note:</strong> Logs are shared audit/security records for all businesses. 
          Access is restricted to Platform Admins only. Use the links above to view specific log categories.
        </div>
      </div>
    </div>
  );
}

function LogLinkCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        padding: "24px",
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "12px",
        textDecoration: "none",
        transition: "all 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ color: "var(--brand)" }}>{icon}</div>
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{title}</h3>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.4 }}>{description}</p>
      </div>
    </Link>
  );
}