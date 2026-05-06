const kpiData = [
  { label: "TOTAL REVENUE", value: "৳0", sub: "From selected date range", color: "#C4973A" },
  { label: "ORDERS", value: "0", sub: "Order volume", color: "#6366f1" },
  { label: "EXPENSES", value: "৳0", sub: "Operational spend", color: "#ef4444" },
  { label: "NET PROFIT", value: "৳0", sub: "Revenue - Expenses", color: "#10b981" },
  { label: "CUSTOMERS", value: "0", sub: "Total active profiles", color: "#8b5cf6" },
  { label: "LOW STOCK", value: "0", sub: "Needs replenishment", color: "#f59e0b" },
  { label: "UNPAID ORDERS", value: "0", sub: "Payment follow-up", color: "#ec4899" },
];

const quickActions = [
  { label: "Create Order", href: "/orders" },
  { label: "Add Expense", href: "/expenses" },
  { label: "Manage Products", href: "/products" },
  { label: "View Reports", href: "/reports" },
];

export default function DashboardPage() {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "10px",
              color: "var(--brand)",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "4px",
            }}
          >
            Overview
          </p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Business Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "3px" }}>
            Real-time data from orders, sales, expenses, customers, and inventory.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--card-bg)",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
            }}
          >
            <option>Last 30 Days</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
            <option>This Year</option>
          </select>
          <button
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--card-bg)",
              color: "var(--text-primary)",
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Apply
          </button>
          <button
            style={{
              padding: "7px 16px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--brand)",
              color: "white",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            New Report
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        {kpiData.slice(0, 4).map((kpi) => (
          <div
            key={kpi.label}
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "10px",
              padding: "18px 20px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "8px",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {kpi.value}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 12px" }}>
              {kpi.sub}
            </p>
            <div
              style={{ height: "3px", backgroundColor: "var(--card-border)", borderRadius: "2px" }}
            >
              <div
                style={{
                  height: "100%",
                  width: "35%",
                  backgroundColor: kpi.color,
                  borderRadius: "2px",
                  opacity: 0.5,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {kpiData.slice(4).map((kpi) => (
          <div
            key={kpi.label}
            style={{
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              borderRadius: "10px",
              padding: "18px 20px",
            }}
          >
            <p
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "8px",
              }}
            >
              {kpi.label}
            </p>
            <p
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "var(--text-primary)",
                lineHeight: 1,
              }}
            >
              {kpi.value}
            </p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "6px 0 12px" }}>
              {kpi.sub}
            </p>
            <div
              style={{ height: "3px", backgroundColor: "var(--card-border)", borderRadius: "2px" }}
            >
              <div
                style={{
                  height: "100%",
                  width: "35%",
                  backgroundColor: kpi.color,
                  borderRadius: "2px",
                  opacity: 0.5,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "12px" }}>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            padding: "20px 22px",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "16px",
            }}
          >
            Recent Activity
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No activity yet.</p>
        </div>
        <div
          style={{
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            padding: "20px 22px",
          }}
        >
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: "14px",
            }}
          >
            Quick Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {quickActions.map((action) => (
              <a
                key={action.label}
                href={action.href}
                style={{
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
                }}
              >
                {action.label}
                <span style={{ color: "var(--brand)" }}>→</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
