"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DateFilter, { type DateFilterValue } from "@/components/filters/DateFilter";
import { buildDateQueryParams, getDateRangeFromPreset } from "@/lib/date-filter";
import { useCurrency } from "@/contexts/CurrencyContext";

type Metric = {
  value: number;
  percentChange: number;
  trend: "up" | "down" | "stable";
};

type DashboardKpi = {
  totalRevenue?: Metric;
  totalSales?: Metric;
  totalExpenses?: Metric;
  netProfit?: Metric;
  totalProfit?: Metric;
  totalOrders?: Metric;
  totalCustomers?: Metric;
  lowStock?: Metric;
  unpaidOrders?: Metric;
};

const quickActions = [
  { label: "Create Order", href: "/orders" },
  { label: "Add Expense", href: "/expenses" },
  { label: "Manage Products", href: "/products" },
  { label: "View Reports", href: "/reports" },
];

function defaultRange(): DateFilterValue {
  const range = getDateRangeFromPreset("this_month");
  return { preset: "this_month", ...range };
}

function formatCount(value: number | undefined): string {
  return String(value ?? 0);
}

function metricSub(metric: Metric | undefined, fallback: string) {
  if (!metric) return fallback;
  if (metric.percentChange === 0) return "No change vs previous period";
  const direction = metric.percentChange > 0 ? "up" : "down";
  return `${Math.abs(metric.percentChange)}% ${direction} vs previous period`;
}

export default function DashboardPage() {
  const { format: formatCurrency } = useCurrency();
  const [dateRange, setDateRange] = useState<DateFilterValue>(() => defaultRange());
  const [data, setData] = useState<DashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = buildDateQueryParams(new URLSearchParams(), dateRange).toString();
    try {
      const res = await fetch(`/api/dashboard/kpi?${qs}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to load dashboard KPIs");
        return;
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard KPIs");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    load();
  }, [load]);

  const kpiData = useMemo(() => {
    const revenue = data?.totalRevenue ?? data?.totalSales;
    const profit = data?.netProfit ?? data?.totalProfit;
    return [
      {
        label: "TOTAL REVENUE",
        value: formatCurrency(revenue?.value),
        sub: metricSub(revenue, "From selected date range"),
        color: "#C4973A",
      },
      {
        label: "ORDERS",
        value: formatCount(data?.totalOrders?.value),
        sub: metricSub(data?.totalOrders, "Order volume"),
        color: "#6366f1",
      },
      {
        label: "EXPENSES",
        value: formatCurrency(data?.totalExpenses?.value),
        sub: metricSub(data?.totalExpenses, "Operational spend"),
        color: "#ef4444",
      },
      {
        label: "NET PROFIT",
        value: formatCurrency(profit?.value),
        sub: metricSub(profit, "Revenue - Expenses"),
        color: "#10b981",
      },
      {
        label: "CUSTOMERS",
        value: formatCount(data?.totalCustomers?.value),
        sub: metricSub(data?.totalCustomers, "New customer profiles"),
        color: "#8b5cf6",
      },
      {
        label: "LOW STOCK",
        value: formatCount(data?.lowStock?.value),
        sub: "Needs replenishment",
        color: "#f59e0b",
      },
      {
        label: "UNPAID ORDERS",
        value: formatCount(data?.unpaidOrders?.value),
        sub: metricSub(data?.unpaidOrders, "Payment follow-up"),
        color: "#ec4899",
      },
    ];
  }, [data]);

  return (
    <div>
      <div className="acc-page-header" style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Overview</p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Business Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>
            Real-time data from orders, sales, expenses, customers, and inventory.
          </p>
        </div>
        <div className="acc-header-actions" style={headerActionsStyle}>
          <DateFilter value={dateRange} onChange={setDateRange} />
          <a href="/reports" style={btnPrimary}>
            New Report
          </a>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      <div className="acc-dashboard-cards" style={primaryGridStyle}>
        {kpiData.slice(0, 4).map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} loading={loading} />
        ))}
      </div>

      <div className="acc-dashboard-cards" style={secondaryGridStyle}>
        {kpiData.slice(4).map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} loading={loading} />
        ))}
      </div>

      <div style={bottomGridStyle}>
        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Recent Activity</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No activity yet.</p>
        </div>
        <div style={panelStyle}>
          <h2 style={panelTitleStyle}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {quickActions.map((action) => (
              <a key={action.label} href={action.href} style={quickActionStyle}>
                {action.label}
                <span style={{ color: "var(--brand)" }}>{"->"}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  color,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div style={kpiCardStyle}>
      <p style={kpiLabelStyle}>{label}</p>
      <p style={kpiValueStyle}>{loading ? "..." : value}</p>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 12px" }}>
        {loading ? "Loading selected period" : sub}
      </p>
      <div style={{ height: "3px", backgroundColor: "var(--card-border)", borderRadius: "2px" }}>
        <div
          style={{
            height: "100%",
            width: loading ? "20%" : "35%",
            backgroundColor: color,
            borderRadius: "2px",
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
}

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--brand)",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "4px",
};

const headerActionsStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const primaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
  marginBottom: "12px",
};

const secondaryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "18px 20px",
};

const kpiLabelStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "8px",
};

const kpiValueStyle: React.CSSProperties = {
  fontSize: "26px",
  fontWeight: 700,
  color: "var(--text-primary)",
  lineHeight: 1,
};

const bottomGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 280px",
  gap: "12px",
};

const panelStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "20px 22px",
};

const panelTitleStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-primary)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: "14px",
};

const quickActionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "9px 12px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  textDecoration: "none",
  fontSize: "13px",
  color: "var(--text-primary)",
  fontWeight: 500,
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "white",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  textDecoration: "none",
};

const errorBox: React.CSSProperties = {
  padding: "10px 14px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontSize: "13px",
  marginBottom: "12px",
};
