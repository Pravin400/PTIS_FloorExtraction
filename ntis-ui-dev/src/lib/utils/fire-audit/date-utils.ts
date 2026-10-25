/**
 * Fire Audit Date & Time Utilities
 * Path: src/lib/utils/fire-audit/date-utils.ts
 *
 * Provides locale-safe, timezone-fixed (Asia/Kolkata) date comparison and formatting
 * functions for dashboard metrics, table cells, and activity feeds.
 * Line ceiling: <= 300 lines.
 */

export const IST_TIMEZONE = "Asia/Kolkata";

export const BCP47_LOCALES: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

export function getBcp47Locale(locale?: string): string {
  if (locale && locale in BCP47_LOCALES) {
    return BCP47_LOCALES[locale];
  }
  return "en-IN";
}

/**
 * Parses diverse date inputs (Date, ISO string, timestamp ms, DD/MM/YYYY)
 * into a valid Date object anchored to Asia/Kolkata (+05:30) when date-only.
 */
export function parseDate(input: unknown): Date | null {
  if (!input) return null;
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }
  if (typeof input === "number") {
    const d = new Date(input < 1e11 ? input * 1000 : input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. ISO 8601 string with time/timezone or YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    // If date-only (YYYY-MM-DD), anchor to midnight IST
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const d = new Date(`${trimmed}T00:00:00+05:30`);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY format
  const ddmmyyyyMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (ddmmyyyyMatch) {
    const day = parseInt(ddmmyyyyMatch[1], 10);
    const month = parseInt(ddmmyyyyMatch[2], 10);
    const year = parseInt(ddmmyyyyMatch[3], 10);
    const hour = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
    const min = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
    const sec = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;

    const isoString = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}+05:30`;
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Fallback standard constructor
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

/**
 * Extracts YYYY-MM-DD string in Asia/Kolkata timezone.
 */
export function getIstYmdString(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Safe parser for relative English time strings (e.g. "10 min ago", "2 hours ago", "yesterday", "today")
 * avoiding bare substring false-positives (such as "min" matching "administration").
 */
function parseRelativeDate(input: string, referenceDate: Date): Date | null {
  const lower = input.trim().toLowerCase();

  if (lower === "today") {
    return new Date(referenceDate);
  }

  const minMatch = lower.match(/\b(\d+)\s*(?:min|mins|minute|minutes)\s*ago\b/);
  if (minMatch) {
    const mins = parseInt(minMatch[1], 10);
    return new Date(referenceDate.getTime() - mins * 60 * 1000);
  }

  const hourMatch = lower.match(/\b(\d+)\s*(?:hour|hours|hr|hrs)\s*ago\b/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    return new Date(referenceDate.getTime() - hours * 60 * 60 * 1000);
  }

  if (lower === "yesterday") {
    return new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);
  }

  const dayMatch = lower.match(/\b(\d+)\s*(?:day|days)\s*ago\b/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    return new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);
  }

  return null;
}

/**
 * Converts date or date string to ISO string.
 */
export function parseDateToIso(
  dateInput: string | number | Date | null | undefined
): string | undefined {
  const d = parseDate(dateInput);
  return d ? d.toISOString() : undefined;
}

/**
 * Checks if the given date matches today's calendar date in Asia/Kolkata (IST).
 */
export function isToday(
  dateInput: unknown,
  referenceDate: Date = new Date()
): boolean {
  if (!dateInput) return false;
  const parsed =
    parseDate(dateInput) ||
    (typeof dateInput === "string" ? parseRelativeDate(dateInput, referenceDate) : null);
  if (!parsed) return false;

  return getIstYmdString(parsed) === getIstYmdString(referenceDate);
}

/**
 * Backward-compatible alias for isToday.
 */
export function isSameDayAsToday(
  dateInput: unknown,
  referenceDate: Date = new Date()
): boolean {
  return isToday(dateInput, referenceDate);
}

/**
 * Calculates start (Monday 00:00:00) and end (Sunday 23:59:59.999) of week in IST.
 */
export function getIstWeekBounds(referenceDate: Date = new Date()): {
  startOfWeek: Date;
  endOfWeek: Date;
} {
  const ymd = getIstYmdString(referenceDate);
  const [year, month, day] = ymd.split("-").map(Number);

  const weekdayShort = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
  }).format(referenceDate);

  const daysMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const dayOfWeek = daysMap[weekdayShort] ?? 0;
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const refEpoch = Date.UTC(year, month - 1, day);
  const mondayEpoch = refEpoch - daysSinceMonday * 24 * 60 * 60 * 1000;
  const sundayEpoch = mondayEpoch + 6 * 24 * 60 * 60 * 1000;

  const monDate = new Date(mondayEpoch);
  const sunDate = new Date(sundayEpoch);

  const monYmd = `${monDate.getUTCFullYear()}-${String(monDate.getUTCMonth() + 1).padStart(2, "0")}-${String(monDate.getUTCDate()).padStart(2, "0")}`;
  const sunYmd = `${sunDate.getUTCFullYear()}-${String(sunDate.getUTCMonth() + 1).padStart(2, "0")}-${String(sunDate.getUTCDate()).padStart(2, "0")}`;

  const startOfWeek = new Date(`${monYmd}T00:00:00.000+05:30`);
  const endOfWeek = new Date(`${sunYmd}T23:59:59.999+05:30`);

  return { startOfWeek, endOfWeek };
}

/**
 * Checks if the given date falls within the current calendar week in Asia/Kolkata (IST).
 */
export function isThisWeek(
  dateInput: unknown,
  referenceDate: Date = new Date()
): boolean {
  if (!dateInput) return false;
  const parsed =
    parseDate(dateInput) ||
    (typeof dateInput === "string" ? parseRelativeDate(dateInput, referenceDate) : null);
  if (!parsed) return false;

  const { startOfWeek, endOfWeek } = getIstWeekBounds(referenceDate);
  const time = parsed.getTime();
  return time >= startOfWeek.getTime() && time <= endOfWeek.getTime();
}

/**
 * Formats a date into a localized date string in Asia/Kolkata timezone.
 */
export function formatDateIst(
  dateInput: unknown,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const parsed = parseDate(dateInput);
  if (!parsed) return typeof dateInput === "string" ? dateInput : "";
  const bcp47 = getBcp47Locale(locale);
  return new Intl.DateTimeFormat(bcp47, {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...options,
  }).format(parsed);
}

/**
 * Formats a date and time into a localized string in Asia/Kolkata timezone.
 */
export function formatDateTimeIst(
  dateInput: unknown,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const parsed = parseDate(dateInput);
  if (!parsed) return typeof dateInput === "string" ? dateInput : "";
  const bcp47 = getBcp47Locale(locale);
  return new Intl.DateTimeFormat(bcp47, {
    timeZone: IST_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  }).format(parsed);
}
