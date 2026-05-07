"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Printer, RefreshCw } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  brand: "#C4973A",
  secondary: "#6366f1",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  purple: "#8b5cf6",
};
const PALETTE = [
  COLORS.brand,
  COLORS.secondary,
  COLORS.success,
  COLORS.danger,
  COLORS.warning,
  COLORS.purple,
];

type SalesReport = {
  summary: {
    totalRevenue: number;
    avgOrderValue: number;
    taxCollected: number;
    totalDiscounts: number;
    totalSales: number;
  };
  chartData: {
    trend: { date: string; revenue: number; count: number }[];
    byPaymentMethod: { method: string; amount: number; count: number }[];
    byPaymentStatus: { status: string; amount: number; count: number }[];
    topProducts: { name: string; revenue: number; quantity: number }[];
    topCustomers: { name: string; revenue: number; orders: number }[];
  };
  records: Record<string, string | number>[];
};

type ExpenseReport = {
  summary: {
    totalExpenses: number;
    avgExpense: number;
    totalTax: number;
    totalTransactions: number;
  };
  chartData: {
    byCategory: { category: string; amount: number; count: number }[];
    trend: { date: string; amount: number; count: number }[];
    byPaymentMethod: { method: string; amount: number }[];
  };
  records: Record<string, string | number>[];
};

type ProfitReport = {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    grossProfit: number;
    profitMargin: number;
  };
  chartData: {
    monthly: { month: string; revenue: number; expenses: number; profit: number }[];
    trend: { date: string; profit: number }[];
  };
};

type Tab = "sales" | "expenses" | "profit";

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("sales");
  const [from, setFrom] = useState(daysAgoISO(29));
  const [to, setTo] = useState(todayISO());
  const [appliedFrom, setAppliedFrom] = useState(from);
  const [appliedTo, setAppliedTo] = useState(to);

  const [sales, setSales] = useState<SalesReport | null>(null);
  const [expenses, setExpenses] = useState<ExpenseReport | null>(null);
  const [profit, setProfit] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = `from=${appliedFrom}&to=${appliedTo}`;
    try {
      const [sRes, eRes, pRes] = await Promise.all([
        fetch(`/api/reports/sales?${qs}`),
        fetch(`/api/reports/expenses?${qs}`),
        fetch(`/api/reports/profit?${qs}`),
      ]);
      if (sRes.ok) setSales(await sRes.json());
      if (eRes.ok) setExpenses(await eRes.json());
      if (pRes.ok) setProfit(await pRes.json());
      if (!sRes.ok || !eRes.ok || !pRes.ok) {
        setError("Some report data failed to load");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    }
    setLoading(false);
  }, [appliedFrom, appliedTo]);

  useEffect(() => {
    load();
  }, [load]);

  function applyRange() {
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  function resetRange() {
    const f = daysAgoISO(29);
    const t = todayISO();
    setFrom(f);
    setTo(t);
    setAppliedFrom(f);
    setAppliedTo(t);
  }

  function quickRange(days: number) {
    const t = todayISO();
    const f = days === 0 ? t : daysAgoISO(days - 1);
    setFrom(f);
    setTo(t);
    setAppliedFrom(f);
    setAppliedTo(t);
  }

  return (
    <div>
      <div className="no-print" style={pageHeader}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Reports
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>
            Analyse sales, expenses, and profitability over any date range
          </p>
        </div>
      </div>

      <div className="no-print" style={filterBar}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <Label>From</Label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={dateInput}
            />
          </div>
          <div>
            <Label>To</Label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={dateInput}
            />
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
            <button onClick={() => quickRange(0)} style={quickBtn}>
              Today
            </button>
            <button onClick={() => quickRange(7)} style={quickBtn}>
              7d
            </button>
            <button onClick={() => quickRange(30)} style={quickBtn}>
              30d
            </button>
            <button onClick={() => quickRange(90)} style={quickBtn}>
              90d
            </button>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "flex-end" }}>
            <button onClick={applyRange} style={btnPrimary}>
              Apply
            </button>
            <button onClick={resetRange} style={btnSecondary}>
              <RefreshCw size={13} /> Reset
            </button>
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Showing: {appliedFrom} — {appliedTo}
        </div>
      </div>

      <div className="no-print" style={tabBar}>
        <TabBtn active={tab === "sales"} onClick={() => setTab("sales")}>
          Sales Report
        </TabBtn>
        <TabBtn active={tab === "expenses"} onClick={() => setTab("expenses")}>
          Expense Report
        </TabBtn>
        <TabBtn active={tab === "profit"} onClick={() => setTab("profit")}>
          Profit Report
        </TabBtn>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {loading && (
        <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
          Loading…
        </div>
      )}

      {!loading && tab === "sales" && sales && <SalesTab data={sales} />}
      {!loading && tab === "expenses" && expenses && <ExpensesTab data={expenses} />}
      {!loading && tab === "profit" && profit && <ProfitTab data={profit} />}
    </div>
  );
}

function SalesTab({ data }: { data: SalesReport }) {
  const { summary, chartData, records } = data;
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={cardGrid}>
        <SummaryCard label="Total Revenue" value={`৳${formatMoney(summary.totalRevenue)}`} />
        <SummaryCard label="Avg Order Value" value={`৳${formatMoney(summary.avgOrderValue)}`} />
        <SummaryCard label="Tax / VAT Collected" value={`৳${formatMoney(summary.taxCollected)}`} />
        <SummaryCard label="Total Discounts" value={`৳${formatMoney(summary.totalDiscounts)}`} />
      </div>

      <ChartCard
        title="Revenue Trend"
        actions={
          <ExportActions
            onCSV={() => exportToCSV(records, `sales-${todayISO()}`)}
            onPrint={() => window.print()}
          />
        }
      >
        {chartData.trend.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={COLORS.brand}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <div style={twoColGrid}>
        <ChartCard title="Revenue by Payment Method">
          {chartData.byPaymentMethod.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.byPaymentMethod}
                  dataKey="amount"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(props) => String((props as { method?: string }).method ?? "")}
                >
                  {chartData.byPaymentMethod.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip nameKey="method" />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Revenue by Payment Status">
          {chartData.byPaymentStatus.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.byPaymentStatus}
                  dataKey="amount"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(props) => String((props as { status?: string }).status ?? "")}
                >
                  {chartData.byPaymentStatus.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={<MoneyTooltip nameKey="status" />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <div style={twoColGrid}>
        <ChartCard title="Top 5 Products by Revenue">
          {chartData.topProducts.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="revenue" fill={COLORS.brand} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top 5 Customers by Revenue">
          {chartData.topCustomers.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="revenue" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ExpensesTab({ data }: { data: ExpenseReport }) {
  const { summary, chartData, records } = data;
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={cardGrid}>
        <SummaryCard label="Total Expenses" value={`৳${formatMoney(summary.totalExpenses)}`} />
        <SummaryCard label="Avg Expense" value={`৳${formatMoney(summary.avgExpense)}`} />
        <SummaryCard label="Total Tax" value={`৳${formatMoney(summary.totalTax)}`} />
        <SummaryCard label="Total Transactions" value={String(summary.totalTransactions)} />
      </div>

      <ChartCard
        title="Expenses by Category"
        actions={
          <ExportActions
            onCSV={() => exportToCSV(records, `expenses-${todayISO()}`)}
            onPrint={() => window.print()}
          />
        }
      >
        {chartData.byCategory.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.byCategory}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={(props) => String((props as { category?: string }).category ?? "")}
              >
                {chartData.byCategory.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip content={<MoneyTooltip nameKey="category" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Expense Trend">
        {chartData.trend.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke={COLORS.danger}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function ProfitTab({ data }: { data: ProfitReport }) {
  const { summary, chartData } = data;
  const profitColor = summary.grossProfit >= 0 ? COLORS.success : COLORS.danger;
  const csvRows = chartData.monthly.map((m) => ({
    month: m.month,
    revenue: m.revenue,
    expenses: m.expenses,
    profit: m.profit,
  }));
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={cardGrid}>
        <SummaryCard label="Total Revenue" value={`৳${formatMoney(summary.totalRevenue)}`} />
        <SummaryCard label="Total Expenses" value={`৳${formatMoney(summary.totalExpenses)}`} />
        <SummaryCard
          label="Gross Profit"
          value={`৳${formatMoney(summary.grossProfit)}`}
          valueColor={profitColor}
        />
        <SummaryCard
          label="Profit Margin"
          value={`${summary.profitMargin.toFixed(2)}%`}
          valueColor={profitColor}
        />
      </div>

      <ChartCard
        title="Revenue vs Expenses (by month)"
        actions={
          <ExportActions
            onCSV={() => exportToCSV(csvRows, `profit-${todayISO()}`)}
            onPrint={() => window.print()}
          />
        }
      >
        {chartData.monthly.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="revenue" fill={COLORS.brand} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill={COLORS.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title="Profit Trend">
        {chartData.monthly.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<MoneyTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="profit"
                stroke={profitColor}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div style={summaryCard}>
      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: valueColor ?? "var(--text-primary)",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
  actions,
}: {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div style={chartCard}>
      <div style={chartHeader}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
          {title}
        </h3>
        {actions && <div className="no-print">{actions}</div>}
      </div>
      <div style={{ padding: "12px" }}>{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div
      style={{
        height: "260px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: "13px",
      }}
    >
      No data for this period
    </div>
  );
}

function ExportActions({ onCSV, onPrint }: { onCSV: () => void; onPrint: () => void }) {
  return (
    <div style={{ display: "flex", gap: "6px" }}>
      <button onClick={onCSV} style={btnSecondary}>
        <Download size={13} /> Export CSV
      </button>
      <button onClick={onPrint} style={btnSecondary}>
        <Printer size={13} /> Print
      </button>
    </div>
  );
}

type TooltipPayloadItem = {
  name?: string | number;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

function MoneyTooltip({
  active,
  payload,
  label,
  nameKey,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  nameKey?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "8px 10px",
        fontSize: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
      {label !== undefined && (
        <div style={{ fontWeight: 600, marginBottom: "4px", color: "#111318" }}>{label}</div>
      )}
      {payload.map((p, i) => {
        const displayName =
          nameKey && p.payload
            ? String((p.payload as Record<string, unknown>)[nameKey] ?? p.name ?? "")
            : String(p.name ?? "");
        const value = typeof p.value === "number" ? formatMoney(p.value) : String(p.value ?? "");
        return (
          <div key={i} style={{ color: p.color ?? "#111318" }}>
            {displayName}: ৳{value}
          </div>
        );
      })}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 16px",
        backgroundColor: active ? "var(--card-bg)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-secondary)",
        border: "none",
        borderBottom: active ? "2px solid var(--brand)" : "2px solid transparent",
        fontSize: "13px",
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "11px",
        fontWeight: 500,
        color: "var(--text-muted)",
        marginBottom: "4px",
      }}
    >
      {children}
    </label>
  );
}

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function exportToCSV(data: Record<string, string | number>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => JSON.stringify((row as Record<string, unknown>)[h] ?? "")).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}

const pageHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
};

const filterBar: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "12px 14px",
  marginBottom: "12px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const tabBar: React.CSSProperties = {
  display: "flex",
  gap: "4px",
  borderBottom: "1px solid var(--card-border)",
  marginBottom: "16px",
};

const cardGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "12px",
};

const twoColGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "12px",
};

const summaryCard: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "14px 16px",
};

const chartCard: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  overflow: "hidden",
};

const chartHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid var(--card-border)",
};

const dateInput: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--input-bg)",
  fontSize: "13px",
  color: "var(--text-primary)",
};

const quickBtn: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  fontSize: "12px",
  color: "var(--text-secondary)",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 14px",
  borderRadius: "7px",
  border: "none",
  backgroundColor: "var(--brand)",
  color: "white",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  borderRadius: "7px",
  border: "1px solid var(--input-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  padding: "10px 14px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontSize: "13px",
  marginBottom: "12px",
};
