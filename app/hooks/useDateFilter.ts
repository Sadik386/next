"use client";

import { useState, useCallback, useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { computePresetRange, DateRangeValue, DateRangePreset } from "@/components/ui/DateRangePicker";

export interface UseDateFilterOptions {
  defaultPreset?: DateRangePreset;
  onPresetChange?: (preset: DateRangePreset) => void;
}

export interface UseDateFilterReturn {
  dateRange: DateRangeValue;
  setDateRange: (range: DateRangeValue) => void;
  setPreset: (preset: DateRangePreset) => void;
  setCustomRange: (from: Date | null, to: Date | null) => void;
  clearDateFilter: () => void;
  buildDateParams: (params: URLSearchParams) => URLSearchParams;
  dateParams: { from: string | null; to: string | null };
}

function serializeDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString();
}

export function useDateFilter(options: UseDateFilterOptions = {}): UseDateFilterReturn {
  const { defaultPreset = "lifetime", onPresetChange } = options;
  const { weekStartDay } = useSettings();

  const [dateRange, setDateRangeState] = useState<DateRangeValue>(() => {
    const range = computePresetRange(defaultPreset, weekStartDay);
    return {
      ...range,
      preset: defaultPreset,
    };
  });

  const setDateRange = useCallback(
    (range: DateRangeValue) => {
      setDateRangeState(range);
      if (range.preset !== "custom" && onPresetChange) {
        onPresetChange(range.preset);
      }
    },
    [onPresetChange]
  );

  const setPreset = useCallback(
    (preset: DateRangePreset) => {
      const range = computePresetRange(preset, weekStartDay);
      const newRange = { ...range, preset };
      setDateRangeState(newRange);
      if (onPresetChange) {
        onPresetChange(preset);
      }
    },
    [weekStartDay, onPresetChange]
  );

  const setCustomRange = useCallback((from: Date | null, to: Date | null) => {
    setDateRangeState({ from, to, preset: "custom" });
  }, []);

  const clearDateFilter = useCallback(() => {
    const range = computePresetRange("lifetime", weekStartDay);
    setDateRangeState({ ...range, preset: "lifetime" });
    if (onPresetChange) {
      onPresetChange("lifetime");
    }
  }, [weekStartDay, onPresetChange]);

  const buildDateParams = useCallback(
    (params: URLSearchParams): URLSearchParams => {
      if (dateRange.from) {
        params.set("from", serializeDate(dateRange.from) ?? "");
      }
      if (dateRange.to) {
        params.set("to", serializeDate(dateRange.to) ?? "");
      }
      return params;
    },
    [dateRange]
  );

  const dateParams = useMemo(
    () => ({
      from: serializeDate(dateRange.from),
      to: serializeDate(dateRange.to),
    }),
    [dateRange]
  );

  return {
    dateRange,
    setDateRange,
    setPreset,
    setCustomRange,
    clearDateFilter,
    buildDateParams,
    dateParams,
  };
}

export function getDateFilterParams(
  from: Date | null,
  to: Date | null
): { from: string | null; to: string | null } {
  return {
    from: serializeDate(from),
    to: serializeDate(to),
  };
}