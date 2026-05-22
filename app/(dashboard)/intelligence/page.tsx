"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Info,
  Minus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSettings } from "@/contexts/SettingsContext";

type AlertType = "critical" | "warning" | "info" | "success";

type IntelligenceAlert = {
  id: string;
  type: AlertType;
  title: string;
  description: string;
  action?: { label: string; href: string };
  data: Record<string, unknown>;
};

type Summary = {
  criticalAlerts: number;
  warnings: number;
  infos: number;
  successes: number;
  totalAlerts: number;
  topProductName: string | null;
  topProductPercent: number;
  peakHour: string;
  peakHourPercent: number;
  lastUpdated: string;
};

type AlertsResponse = {
  items: IntelligenceAlert[];
  total: number;
  counts: { total: number; critical: number; warning: number; info: number; success: number };
};

type TopProduct = {
  productId: string;
  name: string;
  category: string | null;
  totalQuantity: number;
  totalRevenue: number;
  avgUnitPrice: number;
  orderCount: number;
  trend: "up" | "down" | "stable";
  trendPercent: number;
};

type TimePatterns = {
  peakHour: string;
  peakHourPercent: number;
  peakDay: string;
  peakMonth: string;
  hourlyData: { hour: number; orders: number; revenue: number }[];
  weeklyData: { day: string; orders: number; revenue: number }[];
  monthlyData: { month: string; orders: number; revenue: number }[];
};

type InventoryItem = {
  inventoryKey: string;
  productId: string;
  productVariantId: number | null;
  variantLabel: string | null;
  name: string;
  category: string | null;
  stock: number;
  threshold: number;
  sold30d: number;
  lastSold: string | null;
};

type ReorderItem = {
  inventoryKey: string;
  productId: string;
  productVariantId: number | null;
  variantLabel: string | null;
  name: string;
  category: string | null;
  currentStock: number;
  dailySalesRate: number;
  daysLeft: number;
  suggestedOrderQty: number;
};

type InventoryInsights = {
  slowMoving: InventoryItem[];
  fastMoving: InventoryItem[];
  overstocked: InventoryItem[];
  understocked: InventoryItem[];
  reorderSuggestions: ReorderItem[];
};

type MonthlyTrend = {
  months: {
    month: string;
    label: string;
    orders: number;
    revenue: number;
    avgOrderValue: number;
    growthPercent: number;
  }[];
};

type Tab = "alerts" | "products" | "inventory" | "time" | "monthly";
type AlertFilter = "all" | AlertType;
type Metric = "revenue" | "quantity";

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function IntelligencePage() {
  const { currency } = useSettings();
  const [tab, setTab] = useState<Tab>("alerts");
  const [from, setFrom] = useState(daysAgoISO(29));
  const [to, setTo] = useState(todayISO());

  const [summary, setSummary] = useState<Summary | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [alertFilter, setAlertFilter] = useState<AlertFilter>("all");

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [metric, setMetric] = useState<Metric>("revenue");

  const [inventory, setInventory] = useState<InventoryInsights | null>(null);
  const [time, setTime] = useState<TimePatterns | null>(null);
  const [monthly, setMonthly] = useState<MonthlyTrend | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [tick, setTick] = useState(0);

  const fmtMoney = useCallback(
    (n: number) =>
      `${currencySymbol(currency)}${n.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}`,
    [currency]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = `from=${from}&to=${to}`;
      const [
        sumRes,
        alertsRes,
        prodRes,
        invRes,
        timeRes,
        monRes,
      ] = await Promise.all([
        fetch(`/api/intelligence/summary`, { cache: "no-store" }),
        fetch(`/api/intelligence/alerts?limit=200`, { cache: "no-store" }),
        fetch(`/api/intelligence/top-products?${qs}&limit=10&metric=${metric}`, { cache: "no-store" }),
        fetch(`/api/intelligence/inventory-insights`, { cache: "no-store" }),
        fetch(`/api/intelligence/time-patterns?${qs}`, { cache: "no-store" }),
        fetch(`/api/intelligence/monthly-trend`, { cache: "no-store" }),
      ]);
      if (sumRes.ok) setSummary(await sumRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (prodRes.ok) {
        const data = await prodRes.json();
        setTopProducts(data.items ?? []);
      }
      if (invRes.ok) setInventory(await invRes.json());
      if (timeRes.ok) setTime(await timeRes.json());
      if (monRes.ok) setMonthly(await monRes.json());
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load intelligence");
    }
    setLoading(false);
  }, [from, to, metric]);

  const lastLoadRef = useRef(load);
  useEffect(() => {
    lastLoadRef.current = load;
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => lastLoadRef.current(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const lastUpdatedLabel = useMemo(() => {
    void tick;
    if (!lastFetched) return "Loading…";
    const diff = Date.now() - lastFetched.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Last updated: just now";
    if (mins === 1) return "Last updated: 1 minute ago";
    if (mins < 60) return `Last updated: ${mins} minutes ago`;
    const hours = Math.floor(mins / 60);
    return `Last updated: ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }, [lastFetched, tick]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (alertFilter === "all") return alerts.items;
    return alerts.items.filter((a) => a.type === alertFilter);
  }, [alerts, alertFilter]);

  const noSalesData =
    summary !== null &&
    summary.totalAlerts === 0 &&
    topProducts.length === 0 &&
    (time?.hourlyData.every((h) => h.orders === 0) ?? true) &&
    (monthly?.months.every((m) => m.orders === 0) ?? true);

  return (
    <div>
      <div style={pageHeader}>
        <div>
          <p style={overlineStyle}>Insights</p>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
            Sales Intelligence
          </h1>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
            {lastUpdatedLabel}
          </p>
        </div>
        <button onClick={load} disabled={loading} style={btnPrimary}>
          <RefreshCw size={13} />
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {noSalesData && !loading && <EmptyState />}

      <div style={cardGrid4}>
        <SummaryCard
          tone="critical"
          label="Critical Alerts"
          value={summary ? String(summary.criticalAlerts) : "—"}
          sub="Immediate action needed"
        />
        <SummaryCard
          tone="warning"
          label="Warnings"
          value={summary ? String(summary.warnings) : "—"}
          sub="Act within 7 days"
        />
        <SummaryCard
          tone="pink"
          label="Best Product"
          value={summary?.topProductName ?? "—"}
          sub={
            summary && summary.topProductPercent > 0
              ? `${summary.topProductPercent.toFixed(1)}% of total revenue`
              : "No revenue this month"
          }
        />
        <SummaryCard
          tone="success"
          label="Peak Hour"
          value={summary?.peakHour ?? "—"}
          sub={
            summary && summary.peakHourPercent > 0
              ? `${summary.peakHourPercent.toFixed(1)}% of orders`
              : "Not enough data"
          }
        />
      </div>

      <div style={tabBar}>
        <TabBtn active={tab === "alerts"} onClick={() => setTab("alerts")}>
          🚨 Alerts ({summary?.totalAlerts ?? 0})
        </TabBtn>
        <TabBtn active={tab === "products"} onClick={() => setTab("products")}>
          📈 Top Products
        </TabBtn>
        <TabBtn active={tab === "inventory"} onClick={() => setTab("inventory")}>
          ⭐ Inventory Insights
        </TabBtn>
        <TabBtn active={tab === "time"} onClick={() => setTab("time")}>
          🕐 Time Patterns
        </TabBtn>
        <TabBtn active={tab === "monthly"} onClick={() => setTab("monthly")}>
          📅 Monthly Trends
        </TabBtn>
      </div>

      {tab === "alerts" && (
        <AlertsTab
          alerts={alerts}
          filter={alertFilter}
          setFilter={setAlertFilter}
          filtered={filteredAlerts}
          loading={loading}
        />
      )}

      {tab === "products" && (
        <TopProductsTab
          from={from}
          to={to}
          setFrom={setFrom}
          setTo={setTo}
          metric={metric}
          setMetric={setMetric}
          items={topProducts}
          loading={loading}
          fmtMoney={fmtMoney}
        />
      )}

      {tab === "inventory" && <InventoryTab data={inventory} loading={loading} />}

      {tab === "time" && <TimePatternsTab data={time} loading={loading} fmtMoney={fmtMoney} />}

      {tab === "monthly" && <MonthlyTab data={monthly} loading={loading} fmtMoney={fmtMoney} />}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={emptyStateBox}>
      <Sparkles size={28} color="var(--brand)" />
      <h2 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "12px 0 6px" }}>
        No sales data yet
      </h2>
      <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: 420, marginBottom: "14px" }}>
        Add sales data to see intelligence insights, alerts, trends, and inventory recommendations.
      </p>
      <Link href="/sales" style={btnPrimary}>
        Go to Sales <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function AlertsTab({
  alerts,
  filter,
  setFilter,
  filtered,
  loading,
}: {
  alerts: AlertsResponse | null;
  filter: AlertFilter;
  setFilter: (f: AlertFilter) => void;
  filtered: IntelligenceAlert[];
  loading: boolean;
}) {
  const counts = alerts?.counts ?? { total: 0, critical: 0, warning: 0, info: 0, success: 0 };
  return (
    <div>
      <div style={pillRow}>
        <Pill active={filter === "all"} onClick={() => setFilter("all")}>
          All ({counts.total})
        </Pill>
        <Pill tone="critical" active={filter === "critical"} onClick={() => setFilter("critical")}>
          Critical ({counts.critical})
        </Pill>
        <Pill tone="warning" active={filter === "warning"} onClick={() => setFilter("warning")}>
          Warning ({counts.warning})
        </Pill>
        <Pill tone="info" active={filter === "info"} onClick={() => setFilter("info")}>
          Info ({counts.info})
        </Pill>
        <Pill tone="success" active={filter === "success"} onClick={() => setFilter("success")}>
          Success ({counts.success})
        </Pill>
      </div>

      {loading && filtered.length === 0 && <LoadingBox />}

      {!loading && filtered.length === 0 && (
        <div style={infoBox}>No alerts in this category. Everything is on track.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: IntelligenceAlert }) {
  const tone = ALERT_TONES[alert.type];
  const Icon = tone.Icon;
  return (
    <div
      style={{
        backgroundColor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderLeft: `4px solid ${tone.border}`,
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: tone.iconBg,
          color: tone.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={16} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: tone.textColor,
            marginBottom: "4px",
          }}
        >
          {alert.title}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {alert.description}
        </div>
        {alert.action && (
          <Link
            href={alert.action.href}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginTop: "10px",
              padding: "6px 12px",
              backgroundColor: tone.actionBg,
              color: tone.actionColor,
              borderRadius: "7px",
              fontSize: "12px",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {alert.action.label}
          </Link>
        )}
      </div>
    </div>
  );
}

function TopProductsTab({
  from,
  to,
  setFrom,
  setTo,
  metric,
  setMetric,
  items,
  loading,
  fmtMoney,
}: {
  from: string;
  to: string;
  setFrom: (s: string) => void;
  setTo: (s: string) => void;
  metric: Metric;
  setMetric: (m: Metric) => void;
  items: TopProduct[];
  loading: boolean;
  fmtMoney: (n: number) => string;
}) {
  const top5 = items.slice(0, 5).map((p) => ({
    name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
    value: metric === "revenue" ? p.totalRevenue : p.totalQuantity,
  }));
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={filterBar}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", flexWrap: "wrap" }}>
          <DateInput label="From" value={from} onChange={setFrom} />
          <DateInput label="To" value={to} onChange={setTo} />
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              style={metric === "revenue" ? toggleActive : toggleBtn}
              onClick={() => setMetric("revenue")}
            >
              By Revenue
            </button>
            <button
              style={metric === "quantity" ? toggleActive : toggleBtn}
              onClick={() => setMetric("quantity")}
            >
              By Quantity
            </button>
          </div>
        </div>
      </div>

      {loading && items.length === 0 ? (
        <LoadingBox />
      ) : items.length === 0 ? (
        <div style={infoBox}>No product sales in this period.</div>
      ) : (
        <>
          <div style={cardWrap}>
            <div style={chartHeader}>
              <h3 style={chartTitle}>Top Products</h3>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <Th>Rank</Th>
                    <Th>Product</Th>
                    <Th>Category</Th>
                    <Th align="right">Units Sold</Th>
                    <Th align="right">Revenue</Th>
                    <Th align="right">Avg Price</Th>
                    <Th align="right">Orders</Th>
                    <Th align="right">Trend</Th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p, idx) => (
                    <tr key={p.productId}>
                      <Td>{idx + 1}</Td>
                      <Td>
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</span>
                      </Td>
                      <Td>{p.category ?? "—"}</Td>
                      <Td align="right">{p.totalQuantity}</Td>
                      <Td align="right">{fmtMoney(p.totalRevenue)}</Td>
                      <Td align="right">{fmtMoney(p.avgUnitPrice)}</Td>
                      <Td align="right">{p.orderCount}</Td>
                      <Td align="right">
                        <TrendBadge trend={p.trend} percent={p.trendPercent} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={cardWrap}>
            <div style={chartHeader}>
              <h3 style={chartTitle}>Top 5 Visually</h3>
            </div>
            <div style={{ padding: "12px" }}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={top5} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) => {
                      const n = typeof v === "number" ? v : Number(v);
                      return metric === "revenue" ? fmtMoney(n) : `${n}`;
                    }}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="value" fill="var(--brand)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TrendBadge({ trend, percent }: { trend: "up" | "down" | "stable"; percent: number }) {
  if (trend === "up") {
    return (
      <span style={{ ...trendBadge, color: "#15803d", backgroundColor: "#dcfce7" }}>
        <ArrowUp size={11} /> {Math.abs(percent).toFixed(1)}%
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span style={{ ...trendBadge, color: "#b91c1c", backgroundColor: "#fee2e2" }}>
        <ArrowDown size={11} /> {Math.abs(percent).toFixed(1)}%
      </span>
    );
  }
  return (
    <span style={{ ...trendBadge, color: "#6b7280", backgroundColor: "#f3f4f6" }}>
      <Minus size={11} /> stable
    </span>
  );
}

function InventoryTab({ data, loading }: { data: InventoryInsights | null; loading: boolean }) {
  if (loading && !data) return <LoadingBox />;
  if (!data) return <div style={infoBox}>No inventory data available.</div>;
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={cardWrap}>
        <div style={chartHeader}>
          <h3 style={chartTitle}>Reorder Suggestions</h3>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Sorted by urgency (lowest days left first)
          </span>
        </div>
        {data.reorderSuggestions.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            No reorder suggestions. Stock levels look healthy.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th align="right">Stock</Th>
                  <Th align="right">Daily Sales</Th>
                  <Th align="right">Days Left</Th>
                  <Th align="right">Suggested Order</Th>
                </tr>
              </thead>
              <tbody>
                {data.reorderSuggestions.map((r) => {
                  const urgency =
                    r.daysLeft < 7 ? "#ef4444" : r.daysLeft < 14 ? "#f59e0b" : "var(--text-primary)";
                  return (
                    <tr key={r.inventoryKey}>
                      <Td>
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</span>
                      </Td>
                      <Td align="right">{r.currentStock}</Td>
                      <Td align="right">{r.dailySalesRate.toFixed(2)}</Td>
                      <Td align="right">
                        <span style={{ color: urgency, fontWeight: 600 }}>
                          {r.daysLeft.toFixed(1)} days
                        </span>
                      </Td>
                      <Td align="right">{r.suggestedOrderQty}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InventorySection
        title="Slow Moving (needs attention)"
        items={data.slowMoving}
        emptyText="No slow-moving products."
        renderExtra={(p) => (
          <Td>
            {p.lastSold ? `Last sold ${new Date(p.lastSold).toISOString().slice(0, 10)}` : "Never sold"}
          </Td>
        )}
        extraHeader="Last Sold"
      />

      <InventorySection
        title="Fast Moving (doing well)"
        items={data.fastMoving}
        emptyText="No fast-moving products in last 30 days."
        renderExtra={(p) => <Td align="right">{p.sold30d} units</Td>}
        extraHeader="Sold 30d"
      />

      <InventorySection
        title="Overstocked (consider promotion)"
        items={data.overstocked}
        emptyText="No overstock issues."
        renderExtra={(p) => (
          <Td align="right">
            {p.sold30d === 0 ? "—" : `${(p.stock / Math.max(p.sold30d, 1)).toFixed(1)}× monthly rate`}
          </Td>
        )}
        extraHeader="Stock vs Sales"
      />
    </div>
  );
}

function InventorySection({
  title,
  items,
  emptyText,
  renderExtra,
  extraHeader,
}: {
  title: string;
  items: InventoryItem[];
  emptyText: string;
  renderExtra: (p: InventoryItem) => React.ReactNode;
  extraHeader: string;
}) {
  return (
    <div style={cardWrap}>
      <div style={chartHeader}>
        <h3 style={chartTitle}>{title}</h3>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Product</Th>
                <Th>Category</Th>
                <Th align="right">Stock</Th>
                <Th align="right">{extraHeader}</Th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.inventoryKey}>
                  <Td>
                    <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</span>
                  </Td>
                  <Td>{p.category ?? "—"}</Td>
                  <Td align="right">{p.stock}</Td>
                  {renderExtra(p)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TimePatternsTab({
  data,
  loading,
  fmtMoney,
}: {
  data: TimePatterns | null;
  loading: boolean;
  fmtMoney: (n: number) => string;
}) {
  if (loading && !data) return <LoadingBox />;
  if (!data) return <div style={infoBox}>Not enough data for time patterns.</div>;

  const peakHourIdx = data.hourlyData.reduce(
    (acc, h, i) => (h.orders > data.hourlyData[acc].orders ? i : acc),
    0
  );
  const peakDayIdx = data.weeklyData.reduce(
    (acc, w, i) => (w.orders > data.weeklyData[acc].orders ? i : acc),
    0
  );

  const hourly = data.hourlyData
    .filter((h) => h.hour >= 6 && h.hour <= 23)
    .map((h) => ({
      label: formatHourLabel(h.hour),
      orders: h.orders,
      revenue: h.revenue,
      isPeak: h.hour === peakHourIdx,
    }));

  const weekly = data.weeklyData.map((w, i) => ({
    label: w.day.slice(0, 3),
    orders: w.orders,
    revenue: w.revenue,
    isPeak: i === peakDayIdx,
  }));

  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={twoColGrid}>
        <div style={cardWrap}>
          <div style={chartHeader}>
            <h3 style={chartTitle}>Hourly Sales Pattern</h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Peak: {data.peakHour}</span>
          </div>
          <div style={{ padding: "12px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="orders" radius={[4, 4, 0, 0]}>
                  {hourly.map((entry, i) => (
                    <Cell key={i} fill={entry.isPeak ? "var(--brand)" : "#94a3b8"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={cardWrap}>
          <div style={chartHeader}>
            <h3 style={chartTitle}>Day of Week Pattern</h3>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Peak: {data.peakDay}</span>
          </div>
          <div style={{ padding: "12px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => {
                    const n = typeof v === "number" ? v : Number(v);
                    return name === "revenue" ? fmtMoney(n) : `${n}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="orders" radius={[4, 4, 0, 0]}>
                  {weekly.map((entry, i) => (
                    <Cell key={i} fill={entry.isPeak ? "var(--brand)" : "#94a3b8"} />
                  ))}
                </Bar>
                <Bar yAxisId="right" dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={cardWrap}>
        <div style={chartHeader}>
          <h3 style={chartTitle}>Monthly Trend (in range)</h3>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Peak: {data.peakMonth}</span>
        </div>
        <div style={{ padding: "12px" }}>
          {data.monthlyData.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No monthly data in this range.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v, name) => {
                    const n = typeof v === "number" ? v : Number(v);
                    return name === "revenue" ? fmtMoney(n) : `${n}`;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function MonthlyTab({
  data,
  loading,
  fmtMoney,
}: {
  data: MonthlyTrend | null;
  loading: boolean;
  fmtMoney: (n: number) => string;
}) {
  if (loading && !data) return <LoadingBox />;
  if (!data) return <div style={infoBox}>No monthly trend data.</div>;
  const chartData = data.months.map((m) => ({
    label: m.label,
    revenue: m.revenue,
    orders: m.orders,
  }));
  return (
    <div style={{ display: "grid", gap: "16px" }}>
      <div style={cardWrap}>
        <div style={chartHeader}>
          <h3 style={chartTitle}>Revenue Trend (last 12 months)</h3>
        </div>
        <div style={{ padding: "12px" }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => fmtMoney(typeof v === "number" ? v : Number(v))}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardWrap}>
        <div style={chartHeader}>
          <h3 style={chartTitle}>Orders per Month</h3>
        </div>
        <div style={{ padding: "12px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardWrap}>
        <div style={chartHeader}>
          <h3 style={chartTitle}>Monthly Breakdown</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <Th>Month</Th>
                <Th align="right">Orders</Th>
                <Th align="right">Revenue</Th>
                <Th align="right">Avg Order Value</Th>
                <Th align="right">Growth %</Th>
              </tr>
            </thead>
            <tbody>
              {data.months.map((m) => (
                <tr key={m.month}>
                  <Td>{m.label}</Td>
                  <Td align="right">{m.orders}</Td>
                  <Td align="right">{fmtMoney(m.revenue)}</Td>
                  <Td align="right">{fmtMoney(m.avgOrderValue)}</Td>
                  <Td align="right">
                    {m.growthPercent === 0 ? (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    ) : m.growthPercent > 0 ? (
                      <span style={{ color: "#15803d", fontWeight: 600 }}>+{m.growthPercent.toFixed(1)}%</span>
                    ) : (
                      <span style={{ color: "#b91c1c", fontWeight: 600 }}>{m.growthPercent.toFixed(1)}%</span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── presentational helpers ────────────────────────────────────────────────

function SummaryCard({
  tone,
  label,
  value,
  sub,
}: {
  tone: "critical" | "warning" | "pink" | "success";
  label: string;
  value: string;
  sub: string;
}) {
  const palette = SUMMARY_TONES[tone];
  return (
    <div
      style={{
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "10px",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: palette.label,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "8px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: palette.value,
          lineHeight: 1.2,
          marginBottom: "6px",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "11px", color: palette.sub }}>{sub}</div>
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
        padding: "8px 14px",
        borderRadius: "999px",
        border: active ? "1px solid var(--brand)" : "1px solid var(--card-border)",
        backgroundColor: active ? "var(--brand)" : "var(--card-bg)",
        color: active ? "white" : "var(--text-secondary)",
        fontSize: "12px",
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Pill({
  active,
  tone,
  onClick,
  children,
}: {
  active: boolean;
  tone?: AlertType;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const colors = tone ? ALERT_TONES[tone] : null;
  const accent = colors?.border ?? "var(--brand)";
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 12px",
        borderRadius: "999px",
        border: `1px solid ${active ? accent : "var(--card-border)"}`,
        backgroundColor: active ? accent : "var(--card-bg)",
        color: active ? "white" : "var(--text-secondary)",
        fontSize: "12px",
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 500,
          color: "var(--text-muted)",
          marginBottom: "4px",
        }}
      >
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "7px 10px",
          borderRadius: "7px",
          border: "1px solid var(--input-border)",
          backgroundColor: "var(--input-bg)",
          fontSize: "13px",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th
      style={{
        padding: "10px 12px",
        textAlign: align ?? "left",
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--text-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        borderBottom: "1px solid var(--card-border)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <td
      style={{
        padding: "10px 12px",
        textAlign: align ?? "left",
        fontSize: "13px",
        color: "var(--text-secondary)",
        borderBottom: "1px solid var(--card-border)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </td>
  );
}

function LoadingBox() {
  return (
    <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
      Loading…
    </div>
  );
}

function formatHourLabel(h: number): string {
  if (h === 0) return "12a";
  if (h < 12) return `${h}a`;
  if (h === 12) return "12p";
  return `${h - 12}p`;
}

function currencySymbol(code: string): string {
  switch (code) {
    case "BDT":
      return "৳";
    case "USD":
      return "$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "INR":
      return "₹";
    default:
      return code + " ";
  }
}

// ─── tones / styles ────────────────────────────────────────────────────────

const SUMMARY_TONES = {
  critical: {
    bg: "#fef2f2",
    border: "#fecaca",
    label: "#b91c1c",
    value: "#b91c1c",
    sub: "#991b1b",
  },
  warning: {
    bg: "#fffbeb",
    border: "#fde68a",
    label: "#b45309",
    value: "#b45309",
    sub: "#92400e",
  },
  pink: {
    bg: "#fdf2f8",
    border: "#fbcfe8",
    label: "#be185d",
    value: "#9d174d",
    sub: "#831843",
  },
  success: {
    bg: "#f0fdf4",
    border: "#bbf7d0",
    label: "#15803d",
    value: "#15803d",
    sub: "#166534",
  },
} as const;

const ALERT_TONES: Record<
  AlertType,
  {
    border: string;
    iconBg: string;
    iconColor: string;
    textColor: string;
    actionBg: string;
    actionColor: string;
    Icon: React.ComponentType<{ size?: number }>;
  }
> = {
  critical: {
    border: "#ef4444",
    iconBg: "#fee2e2",
    iconColor: "#b91c1c",
    textColor: "#b91c1c",
    actionBg: "#fee2e2",
    actionColor: "#b91c1c",
    Icon: AlertTriangle,
  },
  warning: {
    border: "#f59e0b",
    iconBg: "#fef3c7",
    iconColor: "#b45309",
    textColor: "#b45309",
    actionBg: "#fef3c7",
    actionColor: "#b45309",
    Icon: AlertTriangle,
  },
  info: {
    border: "#3b82f6",
    iconBg: "#dbeafe",
    iconColor: "#1d4ed8",
    textColor: "#1d4ed8",
    actionBg: "#dbeafe",
    actionColor: "#1d4ed8",
    Icon: Info,
  },
  success: {
    border: "#10b981",
    iconBg: "#d1fae5",
    iconColor: "#047857",
    textColor: "#047857",
    actionBg: "#d1fae5",
    actionColor: "#047857",
    Icon: CheckCircle2,
  },
};

const pageHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "16px",
  gap: "12px",
};

const overlineStyle: React.CSSProperties = {
  fontSize: "10px",
  color: "var(--brand)",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  marginBottom: "4px",
};

const cardGrid4: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "12px",
  marginBottom: "16px",
};

const tabBar: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "16px",
};

const pillRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  marginBottom: "12px",
};

const filterBar: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  padding: "12px 14px",
};

const cardWrap: React.CSSProperties = {
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

const chartTitle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-primary)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const twoColGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "12px",
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
  fontWeight: 500,
  cursor: "pointer",
  textDecoration: "none",
};

const toggleBtn: React.CSSProperties = {
  padding: "7px 12px",
  borderRadius: "7px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-secondary)",
  fontSize: "12px",
  fontWeight: 500,
  cursor: "pointer",
};

const toggleActive: React.CSSProperties = {
  ...toggleBtn,
  border: "1px solid var(--brand)",
  backgroundColor: "var(--brand)",
  color: "white",
  fontWeight: 600,
};

const trendBadge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
  padding: "3px 8px",
  borderRadius: "999px",
  fontSize: "11px",
  fontWeight: 600,
};

const errorBox: React.CSSProperties = {
  padding: "10px 14px",
  backgroundColor: "#fee2e2",
  color: "#991b1b",
  borderRadius: "8px",
  fontSize: "13px",
  marginBottom: "12px",
};

const infoBox: React.CSSProperties = {
  padding: "20px",
  textAlign: "center",
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "10px",
  color: "var(--text-muted)",
  fontSize: "13px",
};

const emptyStateBox: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  padding: "32px 24px",
  backgroundColor: "var(--card-bg)",
  border: "1px dashed var(--card-border)",
  borderRadius: "10px",
  marginBottom: "16px",
};

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "var(--card-bg)",
  border: "1px solid var(--card-border)",
  borderRadius: "6px",
  fontSize: "12px",
  color: "var(--text-primary)",
};
