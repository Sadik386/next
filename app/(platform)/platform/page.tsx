"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function PlatformDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/platform/summary")
      .then(res => res.json())
      .then(res => {
        if (res.success) setData(res.summary);
        else toast.error(res.error || "Failed to load summary");
      })
      .catch(() => toast.error("Connection error"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
        <Loader2 className="animate-spin" size={32} color="var(--brand)" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Platform Overview</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>High-level metrics across all tenants</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "32px" }}>
        <StatCard 
          icon={<Building2 size={20} />} 
          label="Total Businesses" 
          value={data?.totalBusinesses} 
          subValue={`${data?.activeBusinesses} Active`} 
        />
        <StatCard 
          icon={<Users size={20} />} 
          label="Total Users" 
          value={data?.totalUsers} 
          subValue="Cross-business"
        />
        <StatCard 
          icon={<CreditCard size={20} />} 
          label="Active Subscriptions" 
          value={data?.totalSubscriptions} 
          subValue="Active"
        />
        <StatCard 
          icon={<TrendingUp size={20} />} 
          label="Paid Conversion" 
          value={data?.totalBusinesses ? `${((data?.paidSubscriptions / data.totalBusinesses) * 100).toFixed(1)}%` : "0.0%"} 
          subValue="Paid"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Plan Distribution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
            {data?.planStats.map((plan: any) => (
              <div key={plan.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{plan.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, margin: "0 20px" }}>
                  <div style={{ 
                    flex: 1, 
                    height: "8px", 
                    backgroundColor: "var(--page-bg)", 
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${(plan.count / data.totalBusinesses) * 100}%`, 
                      height: "100%", 
                      backgroundColor: "var(--brand)" 
                    }} />
                  </div>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{plan.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>System Status</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
            <StatusItem label="API Services" status="healthy" />
            <StatusItem label="Database Cluster" status="healthy" />
            <StatusItem label="Email Outbound" status="notConfigured" />
            <StatusItem label="Background Workers" status="notEnabled" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue }: any) {
  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", color: "var(--text-muted)" }}>
        {icon}
        <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>{value}</div>
      <div style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 500 }}>{subValue}</div>
    </div>
  );
}

function StatusItem({ label, status }: { label: string; status: string }) {
  const statusConfig: Record<string, { color: string; text: string; icon: any }> = {
    healthy: { color: "#16a34a", text: "Healthy", icon: CheckCircle2 },
    notConfigured: { color: "#d97706", text: "Not Configured", icon: AlertCircle },
    notEnabled: { color: "#6b7280", text: "Not Enabled", icon: AlertCircle },
    policyOnly: { color: "#d97706", text: "Policy Only", icon: AlertCircle },
  };
  const config = statusConfig[status] || statusConfig.notConfigured;
  const Icon = config.icon;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: config.color, fontSize: "12px", fontWeight: 600 }}>
        <Icon size={14} />
        {config.text}
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
};

const cardTitleStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "var(--text-primary)",
  marginBottom: "8px",
};
