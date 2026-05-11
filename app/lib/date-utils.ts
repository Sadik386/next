export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function startOfDay(date: Date): Date {
  const x = new Date(date);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(date: Date): Date {
  const x = new Date(date);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(date: Date, days: number): Date {
  const x = new Date(date);
  x.setDate(x.getDate() + days);
  return x;
}

export function addMonths(date: Date, months: number): Date {
  const x = new Date(date);
  x.setMonth(x.getMonth() + months);
  return x;
}

export function startOfWeek(date: Date, weekStartDay: number = 0): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day - weekStartDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return startOfDay(d);
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function formatDateISO(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

export function formatDateForAPI(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString();
}

export function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

export function getDateRangePreset(
  preset: string,
  weekStartDay: number = 0
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
      const from = startOfWeek(now, weekStartDay);
      return { from, to: endOfDay(now) };
    }
    case "this_month": {
      const from = startOfMonth(now);
      return { from, to: endOfDay(now) };
    }
    case "last_month": {
      const from = startOfMonth(addMonths(now, -1));
      const to = endOfMonth(addMonths(now, -1));
      return { from, to };
    }
    case "this_year": {
      const from = startOfYear(now);
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

export function buildDateParams(
  params: URLSearchParams,
  from: Date | null,
  to: Date | null
): URLSearchParams {
  if (from) {
    params.set("from", formatDateForAPI(from) ?? "");
  }
  if (to) {
    params.set("to", formatDateForAPI(to) ?? "");
  }
  return params;
}

export function isValidDateRange(from: Date | null, to: Date | null): boolean {
  if (!from || !to) return true;
  return from <= to;
}