import type { DropdownOption } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

export const MAX_GRACE_DAYS = 31;

/**
 * Robust date parser supporting YYYY-MM-DD, MM/DD/YYYY, and ISO date strings
 */
export const parseDateComponents = (
  dateStr?: string | null
): { y: number; m: number; d: number } | null => {
  if (!dateStr || typeof dateStr !== "string") return null;
  const clean = dateStr.trim().split("T")[0];

  // Format: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymdMatch) {
    return {
      y: parseInt(ymdMatch[1], 10),
      m: parseInt(ymdMatch[2], 10),
      d: parseInt(ymdMatch[3], 10),
    };
  }

  // Format: MM/DD/YYYY or DD/MM/YYYY
  const slashMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (slashMatch) {
    const part1 = parseInt(slashMatch[1], 10);
    const part2 = parseInt(slashMatch[2], 10);
    const year = parseInt(slashMatch[3], 10);
    if (part1 > 12) {
      return { y: year, m: part2, d: part1 };
    }
    return { y: year, m: part1, d: part2 };
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      y: parsed.getUTCFullYear(),
      m: parsed.getUTCMonth() + 1,
      d: parsed.getUTCDate(),
    };
  }

  return null;
};

/**
 * Add N calendar days to a date string, returns YYYY-MM-DD
 */
export const addDays = (dateStr: string, days: number): string => {
  if (!dateStr) return "";
  const comp = parseDateComponents(dateStr);
  if (!comp) return "";
  const d = new Date(Date.UTC(comp.y, comp.m - 1, comp.d + days));
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

/**
 * Count calendar days between two date strings (start to end)
 */
export const diffDays = (startStr: string, endStr: string): number => {
  if (!startStr || !endStr) return 0;
  const start = parseDateComponents(startStr);
  const end = parseDateComponents(endStr);
  if (!start || !end) return 0;
  const startUtc = Date.UTC(start.y, start.m - 1, start.d);
  const endUtc = Date.UTC(end.y, end.m - 1, end.d);
  return Math.max(0, Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24)));
};

/**
 * Formats a date string, Date object, or ISO timestamp into DD/MM/YYYY format.
 * Returns emptyFallback ('—' by default) if date is empty or invalid.
 */
export const formatDateToDDMMYYYY = (
  dateStr?: string | Date | null,
  emptyFallback = "—"
): string => {
  if (!dateStr) return emptyFallback;

  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return emptyFallback;
    const d = String(dateStr.getDate()).padStart(2, "0");
    const m = String(dateStr.getMonth() + 1).padStart(2, "0");
    const y = dateStr.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(dateStr).trim();
  if (
    !str ||
    str === "null" ||
    str === "undefined" ||
    str === "—" ||
    str === "-" ||
    str === "INVALID" ||
    str.startsWith("0001-01-01")
  ) {
    return emptyFallback;
  }

  // Already DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3];
    return `${day}/${month}/${year}`;
  }

  // ISO YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, "0");
    const day = ymdMatch[3].padStart(2, "0");
    return `${day}/${month}/${year}`;
  }

  const comp = parseDateComponents(str);
  if (comp) {
    const d = String(comp.d).padStart(2, "0");
    const m = String(comp.m).padStart(2, "0");
    return `${d}/${m}/${comp.y}`;
  }

  return str;
};

/**
 * Get periods per year directly from Billing Frequency API data
 */
export const getFrequencyPeriodsPerYear = (option?: DropdownOption): number => {
  if (!option?.data) return 0;
  const count = Number(option.data.periodsPerYear);
  return !isNaN(count) && count > 0 ? count : 0;
};

/**
 * Extract Financial Year Start and End dates from DropdownOption
 */
export const getFinancialYearDates = (
  option?: DropdownOption
): { startDate: string; endDate: string } => {
  if (!option) return { startDate: "", endDate: "" };

  let startDate = "";
  let endDate = "";

  if (option.data?.startDate) {
    startDate = String(option.data.startDate).split("T")[0];
  }
  if (option.data?.endDate) {
    endDate = String(option.data.endDate).split("T")[0];
  }

  if (!startDate || !endDate) {
    let yearNum: number | undefined;
    if (option.data?.year && !isNaN(Number(option.data.year))) {
      yearNum = Number(option.data.year);
    } else {
      const match = (option.label || "").match(/\d{4}/);
      if (match) {
        yearNum = parseInt(match[0], 10);
      }
    }

    if (yearNum && !isNaN(yearNum)) {
      if (!startDate) startDate = `${yearNum}-04-01`;
      if (!endDate) endDate = `${yearNum + 1}-03-31`;
    }
  }

  return { startDate, endDate };
};
