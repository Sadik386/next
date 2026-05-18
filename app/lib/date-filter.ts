export type DateFilterPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "last_7_days"
  | "last_14_days"
  | "last_28_days"
  | "this_year"
  | "custom"
  | "lifetime";

export type DateFilterRange = {
  preset: DateFilterPreset;
  startDate: Date | null;
  endDate: Date | null;
};

export type DateFilterInput = {
  preset?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
};

export const DATE_FILTER_PRESET_LABELS: Record<DateFilterPreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  this_week: "This Week",
  this_month: "This Month",
  last_month: "Last Month",
  last_7_days: "Last 7 Days",
  last_14_days: "Last 14 Days",
  last_28_days: "Last 28 Days",
  this_year: "This Year",
  custom: "Custom Date Range",
  lifetime: "All Time",
};

export const DATE_FILTER_PRESETS: DateFilterPreset[] = [
  "today",
  "yesterday",
  "this_week",
  "this_month",
  "last_month",
  "last_7_days",
  "last_14_days",
  "last_28_days",
  "this_year",
  "lifetime",
  "custom",
];

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

export function formatDateInput(date: Date | null): string {
  if (!date || !isValidDate(date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValidDate(value) ? new Date(value) : null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    const parsed = new Date(Number(y), Number(m) - 1, Number(d));
    return isValidDate(parsed) ? parsed : null;
  }

  const parsed = new Date(trimmed);
  return isValidDate(parsed) ? parsed : null;
}

export function normalizeDateFilterPreset(value: string | null | undefined): DateFilterPreset {
  switch (value) {
    case "today":
    case "yesterday":
    case "this_week":
    case "this_month":
    case "last_month":
    case "last_7_days":
    case "last_14_days":
    case "last_28_days":
    case "this_year":
    case "custom":
    case "lifetime":
      return value;
    case "week":
      return "this_week";
    case "month":
      return "this_month";
    case "year":
      return "this_year";
    case "all":
    case "":
    case null:
    case undefined:
      return "lifetime";
    default:
      return "lifetime";
  }
}

export function getDateRangeFromPreset(
  presetValue: string | null | undefined,
  options: { now?: Date; weekStartDay?: number } = {}
): { startDate: Date | null; endDate: Date | null } {
  const preset = normalizeDateFilterPreset(presetValue);
  const now = options.now ?? new Date();
  const weekStartDay = options.weekStartDay ?? 0;
  const today = startOfDay(now);

  switch (preset) {
    case "today":
      return { startDate: today, endDate: endOfDay(now) };
    case "yesterday": {
      const yesterday = addDays(today, -1);
      return { startDate: yesterday, endDate: endOfDay(yesterday) };
    }
    case "this_week": {
      const dayDiff = (today.getDay() - weekStartDay + 7) % 7;
      return { startDate: addDays(today, -dayDiff), endDate: endOfDay(now) };
    }
    case "this_month":
      return {
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: endOfDay(now),
      };
    case "last_month": {
      const lastMonth = addMonths(today, -1);
      return {
        startDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
        endDate: endOfDay(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    }
    case "last_7_days":
      return { startDate: addDays(today, -6), endDate: endOfDay(now) };
    case "last_14_days":
      return { startDate: addDays(today, -13), endDate: endOfDay(now) };
    case "last_28_days":
      return { startDate: addDays(today, -27), endDate: endOfDay(now) };
    case "this_year":
      return { startDate: new Date(today.getFullYear(), 0, 1), endDate: endOfDay(now) };
    case "custom":
    case "lifetime":
    default:
      return { startDate: null, endDate: null };
  }
}

export function normalizeDateRange(
  input: DateFilterInput,
  options: { defaultPreset?: DateFilterPreset | null; now?: Date; weekStartDay?: number } = {}
): DateFilterRange {
  const preset = input.preset
    ? normalizeDateFilterPreset(input.preset)
    : options.defaultPreset ?? "lifetime";
  const start = parseDateValue(input.startDate);
  const end = parseDateValue(input.endDate);
  const hasValidExplicitDate = Boolean(start || end);

  if (preset !== "custom" && preset !== "lifetime" && !hasValidExplicitDate) {
    const range = getDateRangeFromPreset(preset, options);
    return { preset, ...range };
  }

  return {
    preset,
    startDate: start ? startOfDay(start) : null,
    endDate: end ? endOfDay(end) : null,
  };
}

export function parseDateRangeFromSearchParams(
  searchParams: URLSearchParams,
  options: { defaultPreset?: DateFilterPreset | null; now?: Date; weekStartDay?: number } = {}
): DateFilterRange {
  const startDate =
    searchParams.get("startDate") ??
    searchParams.get("from") ??
    searchParams.get("start");
  const endDate =
    searchParams.get("endDate") ??
    searchParams.get("to") ??
    searchParams.get("end");
  const preset = searchParams.get("datePreset") ?? searchParams.get("preset");

  return normalizeDateRange({ preset, startDate, endDate }, options);
}

export function buildDateQueryParams(
  params: URLSearchParams,
  range: DateFilterRange
): URLSearchParams {
  params.delete("datePreset");
  params.delete("startDate");
  params.delete("endDate");
  params.delete("from");
  params.delete("to");
  params.delete("start");
  params.delete("end");

  params.set("datePreset", range.preset);
  if (range.startDate) {
    params.set("startDate", formatDateInput(range.startDate));
  }
  if (range.endDate) {
    params.set("endDate", formatDateInput(range.endDate));
  }

  return params;
}
