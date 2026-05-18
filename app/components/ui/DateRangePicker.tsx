"use client";

import DateFilter, { type DateFilterValue } from "@/components/filters/DateFilter";
import {
  buildDateQueryParams,
  getDateRangeFromPreset,
} from "@/lib/date-filter";
import type { DateFilterPreset } from "@/lib/date-filter";

export type DateRangePreset = DateFilterPreset;

export interface DateRangeValue {
  from: Date | null;
  to: Date | null;
  preset: DateRangePreset;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
}

export function buildDateFilterParams(
  params: URLSearchParams,
  dateRange: DateRangeValue
): URLSearchParams {
  return buildDateQueryParams(params, {
    preset: dateRange.preset,
    startDate: dateRange.from,
    endDate: dateRange.to,
  });
}

export function computePresetRange(
  preset: DateRangePreset,
  weekStartDay: number
): { from: Date | null; to: Date | null } {
  const range = getDateRangeFromPreset(preset, { weekStartDay });
  return { from: range.startDate, to: range.endDate };
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const filterValue: DateFilterValue = {
    preset: value.preset,
    startDate: value.from,
    endDate: value.to,
  };

  return (
    <DateFilter
      value={filterValue}
      onChange={(next) =>
        onChange({
          preset: next.preset,
          from: next.startDate,
          to: next.endDate,
        })
      }
    />
  );
}
