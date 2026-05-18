"use client";

import { Calendar, X } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  DATE_FILTER_PRESET_LABELS,
  DATE_FILTER_PRESETS,
  formatDateInput,
  getDateRangeFromPreset,
  normalizeDateRange,
  normalizeDateFilterPreset,
} from "@/lib/date-filter";
import type { DateFilterPreset } from "@/lib/date-filter";

export type DateFilterValue = {
  preset: DateFilterPreset;
  startDate: Date | null;
  endDate: Date | null;
};

type DateFilterProps = {
  value: DateFilterValue;
  onChange: (value: DateFilterValue) => void;
  compact?: boolean;
  style?: React.CSSProperties;
};

export default function DateFilter({ value, onChange, compact = false, style }: DateFilterProps) {
  const { weekStartDay } = useSettings();

  function changePreset(nextValue: string) {
    const preset = normalizeDateFilterPreset(nextValue);
    if (preset === "custom") {
      onChange({ preset, startDate: value.startDate, endDate: value.endDate });
      return;
    }

    const range = getDateRangeFromPreset(preset, { weekStartDay });
    onChange({ preset, ...range });
  }

  function changeCustomStart(nextValue: string) {
    const next = normalizeDateRange({
      preset: "custom",
      startDate: nextValue,
      endDate: value.endDate,
    });
    onChange(next);
  }

  function changeCustomEnd(nextValue: string) {
    const next = normalizeDateRange({
      preset: "custom",
      startDate: value.startDate,
      endDate: nextValue,
    });
    onChange(next);
  }

  function clear() {
    onChange({ preset: "lifetime", startDate: null, endDate: null });
  }

  return (
    <div style={{ ...wrapStyle, ...(compact ? compactWrapStyle : null), ...style }}>
      <div style={selectWrapStyle}>
        <Calendar size={13} color="var(--text-muted)" />
        <select
          value={value.preset}
          onChange={(event) => changePreset(event.target.value)}
          aria-label="Date filter preset"
          style={selectStyle}
        >
          {DATE_FILTER_PRESETS.map((preset) => (
            <option key={preset} value={preset}>
              {DATE_FILTER_PRESET_LABELS[preset]}
            </option>
          ))}
        </select>
      </div>

      {value.preset === "custom" && (
        <div style={customWrapStyle}>
          <input
            type="date"
            value={formatDateInput(value.startDate)}
            onChange={(event) => changeCustomStart(event.target.value)}
            aria-label="Start date"
            style={dateInputStyle}
          />
          <span style={separatorStyle}>to</span>
          <input
            type="date"
            value={formatDateInput(value.endDate)}
            onChange={(event) => changeCustomEnd(event.target.value)}
            aria-label="End date"
            style={dateInputStyle}
          />
        </div>
      )}

      {value.preset !== "lifetime" && (
        <button type="button" onClick={clear} aria-label="Clear date filter" style={clearButtonStyle}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const compactWrapStyle: React.CSSProperties = {
  gap: "6px",
};

const selectWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  minHeight: "36px",
  padding: "0 10px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
};

const selectStyle: React.CSSProperties = {
  border: "none",
  outline: "none",
  background: "transparent",
  color: "var(--text-primary)",
  fontSize: "13px",
  minWidth: "150px",
  cursor: "pointer",
};

const customWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
};

const dateInputStyle: React.CSSProperties = {
  minHeight: "36px",
  padding: "0 9px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-primary)",
  fontSize: "13px",
  outline: "none",
};

const separatorStyle: React.CSSProperties = {
  fontSize: "12px",
  color: "var(--text-muted)",
};

const clearButtonStyle: React.CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  border: "1px solid var(--card-border)",
  backgroundColor: "var(--card-bg)",
  color: "var(--text-muted)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};
