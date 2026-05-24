"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  onboarding?: {
    isNew: boolean;
    productCount: number;
    customerCount: number;
    profileMissing: boolean;
    profileCompleteness: number;
    profileCompletenessTotal: number;
    businessName: string | null;
    phone: string | null;
    address: string | null;
    logoUrl: string | null;
  };
};

const quickActions = [
  { label: "Add Product", href: "/products" },
  { label: "Create Order", href: "/orders" },
  { label: "Add Customer", href: "/customers" },
  { label: "View Subscription", href: "/system/subscription" },
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

  const isEmpty = data?.onboarding?.isNew ?? false;
  const profileMissing = data?.onboarding?.profileMissing ?? false;
  const onboarding = data?.onboarding;

  const checklistItems = [
    {
      label: "Complete business profile",
      done: !profileMissing,
      href: "/system/settings",
      icon: "1",
    },
    {
      label: "Add first product",
      done: (onboarding?.productCount ?? 0) > 0,
      href: "/products",
      icon: "2",
    },
    {
      label: "Add first customer",
      done: (onboarding?.customerCount ?? 0) > 0,
      href: "/customers",
      icon: "3",
    },
    {
      label: "Create first order",
      done: (data?.totalOrders?.value ?? 0) > 0,
      href: "/orders",
      icon: "4",
    },
    {
      label: "Review subscription",
      done: false,
      href: "/system/subscription",
      icon: "5",
    },
  ];

  const doneCount = checklistItems.filter((i) => i.done).length;
  const allDone = doneCount === checklistItems.length;

  const recentActivityEmpty =
    !loading &&
    (data?.totalOrders?.value ?? 0) === 0 &&
    (data?.totalSales?.value ?? 0) === 0;

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

      {isEmpty && !loading && (
        <div style={onboardingCardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>
                Get Started with Accoraze
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {allDone
                  ? "Great work! You've completed your initial setup."
                  : `Complete ${checklistItems.length - doneCount} more item${checklistItems.length - doneCount === 1 ? "" : "s"} to get started`}
              </p>
            </div>
            {!allDone && (
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--brand)",
                backgroundColor: "rgba(196,151,58,0.1)",
                padding: "3px 8px",
                borderRadius: "6px",
              }}>
                {doneCount}/{checklistItems.length}
              </span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {checklistItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  borderRadius: "7px",
                  border: "1px solid var(--card-border)",
                  backgroundColor: item.done ? "rgba(16,185,129,0.06)" : "var(--card-bg)",
                  textDecoration: "none",
                  transition: "border-color 0.15s, background-color 0.15s",
                }}
              >
                <div style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: 700,
                  flexShrink: 0,
                  backgroundColor: item.done ? "#10b981" : "var(--card-bg)",
                  color: item.done ? "white" : "var(--text-muted)",
                  border: item.done ? "none" : "1px solid var(--card-border)",
                }}>
                  {item.done ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : item.icon}
                </div>
                <span style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: item.done ? "#10b981" : "var(--text-primary)",
                  flex: 1,
                }}>
                  {item.label}
                </span>
                {!item.done && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                    <path d="M2.5 6H9.5M6.5 3L9.5 6L6.5 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

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
          {recentActivityEmpty ? (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "10px" }}>
                No activity recorded yet.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href="/products" style={ctaBtnStyle}>Add Product</Link>
                <Link href="/customers" style={ctaBtnSecondaryStyle}>Add Customer</Link>
                <Link href="/orders" style={ctaBtnSecondaryStyle}>Create Order</Link>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Recent activity will appear here.</p>
          )}
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

const onboardingCardStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "18px 20px",
  marginBottom: "16px",
  borderLeft: "3px solid var(--brand)",
};

const ctaBtnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 14px",
  backgroundColor: "var(--brand)",
  color: "white",
  borderRadius: "7px",
  fontSize: "12px",
  fontWeight: 600,
  textDecoration: "none",
};

const ctaBtnSecondaryStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 14px",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  borderRadius: "7px",
  border: "1px solid var(--card-border)",
  fontSize: "12px",
  fontWeight: 500,
  textDecoration: "none",
};
