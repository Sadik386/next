"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

export function buildDateFilterParams(
  params: URLSearchParams,
  dateRange: DateRangeValue
): URLSearchParams {
  if (dateRange.from) {
    params.set("from", dateRange.from.toISOString());
  }
  if (dateRange.to) {
    params.set("to", dateRange.to.toISOString());
  }
  return params;
}

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_7_days"
  | "last_14_days"
  | "last_28_days"
  | "lifetime"
  | "custom";

export interface DateRangeValue {
  from: Date | null;
  to: Date | null;
  preset: DateRangePreset;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
}

const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  this_month: "This Month",
  last_month: "Last Month",
  this_year: "This Year",
  last_7_days: "Last 7 Days",
  last_14_days: "Last 14 Days",
  last_28_days: "Last 28 Days",
  lifetime: "Lifetime",
  custom: "Custom Range",
};

const PRESET_ORDER: DateRangePreset[] = [
  "today",
  "yesterday",
  "this_week",
  "this_month",
  "last_month",
  "this_year",
  "last_7_days",
  "last_14_days",
  "last_28_days",
  "lifetime",
  "custom",
];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function computePresetRange(
  preset: DateRangePreset,
  weekStartDay: number
): { from: Date | null; to: Date | null } {
  const now = new Date();
  const today = startOfDay(now);
  switch (preset) {
    case "today":
      return { from: today, to: endOfDay(now) };
    case "yesterday": {
      const y = addDays(today, -1);
      return { from: y, to: endOfDay(y) };
    }
    case "this_week": {
      const dayDiff = (today.getDay() - weekStartDay + 7) % 7;
      const from = addDays(today, -dayDiff);
      return { from, to: endOfDay(now) };
    }
    case "this_month": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from, to: endOfDay(now) };
    }
    case "last_month": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = endOfDay(new Date(today.getFullYear(), today.getMonth(), 0));
      return { from, to };
    }
    case "this_year": {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from, to: endOfDay(now) };
    }
    case "last_7_days":
      return { from: addDays(today, -6), to: endOfDay(now) };
    case "last_14_days":
      return { from: addDays(today, -13), to: endOfDay(now) };
    case "last_28_days":
      return { from: addDays(today, -27), to: endOfDay(now) };
    case "lifetime":
      return { from: null, to: null };
    default:
      return { from: null, to: null };
  }
}

function fmtInput(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const { weekStartDay } = useSettings();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const buttonLabel = useMemo(() => {
    if (value.preset !== "custom") return PRESET_LABELS[value.preset];
    if (value.from && value.to) {
      return `${fmtInput(value.from)} → ${fmtInput(value.to)}`;
    }
    return "Custom Range";
  }, [value]);

  function selectPreset(preset: DateRangePreset) {
    if (preset === "custom") {
      onChange({ from: value.from, to: value.to, preset: "custom" });
      return;
    }
    const range = computePresetRange(preset, weekStartDay);
    onChange({ ...range, preset });
    setOpen(false);
  }

  function setCustomFrom(s: string) {
    const d = s ? startOfDay(new Date(s)) : null;
    onChange({ from: d, to: value.to, preset: "custom" });
  }

  function setCustomTo(s: string) {
    const d = s ? endOfDay(new Date(s)) : null;
    onChange({ from: value.from, to: d, preset: "custom" });
  }

  function clearCustom() {
    onChange({ from: null, to: null, preset: "lifetime" });
  }

  return (
    <div ref={wrapRef} style={{ position: "relative", display: "inline-flex", gap: "8px" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1px solid var(--card-border)",
          backgroundColor: "var(--card-bg)",
          fontSize: "13px",
          color: "var(--text-primary)",
          cursor: "pointer",
        }}
      >
        <Calendar size={13} color="var(--text-muted)" />
        <span>{buttonLabel}</span>
        <ChevronDown size={13} color="var(--text-muted)" />
      </button>

      {value.preset === "custom" && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <input
            type="date"
            value={fmtInput(value.from)}
            onChange={(e) => setCustomFrom(e.target.value)}
            style={dateInput}
          />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>→</span>
          <input
            type="date"
            value={fmtInput(value.to)}
            onChange={(e) => setCustomTo(e.target.value)}
            style={dateInput}
          />
          <button
            type="button"
            onClick={clearCustom}
            aria-label="Clear date range"
            style={{
              padding: "6px",
              borderRadius: "6px",
              border: "1px solid var(--card-border)",
              backgroundColor: "var(--card-bg)",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.08)",
            padding: "4px",
            minWidth: "200px",
          }}
        >
          {PRESET_ORDER.map((p, i) => (
            <div key={p}>
              {p === "custom" && (
                <div
                  style={{
                    height: "1px",
                    background: "var(--card-border)",
                    margin: "4px 6px",
                  }}
                />
              )}
              <button
                type="button"
                onClick={() => selectPreset(p)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  border: "none",
                  background: value.preset === p ? "var(--brand-light)" : "transparent",
                  color: value.preset === p ? "var(--brand)" : "var(--text-primary)",
                  fontSize: "13px",
                  fontWeight: value.preset === p ? 600 : 400,
                  cursor: "pointer",
                  borderRadius: "6px",
                }}
              >
                {PRESET_LABELS[p]}
              </button>
              {/* avoid lint */}
              {i < 0 ? null : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const dateInput: React.CSSProperties = {
  padding: "7px 8px",
  borderRadius: "6px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  fontSize: "12px",
  color: "var(--text-primary)",
  outline: "none",
};
