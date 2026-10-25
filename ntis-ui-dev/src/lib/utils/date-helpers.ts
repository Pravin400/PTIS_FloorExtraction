import { logger } from "@/lib/utils/logger";

export interface DateValidationResult {
  valid: boolean;
  error?: "invalidFormat" | "invalidDate" | "futureDate";
  date?: Date;
}

export class DateUtils {
  private static readonly DD_MM_YYYY_REGEX =
    /^(0[1-9]|[12][0-9]|3[01])[-/](0[1-9]|1[012])[-/](19|20)\d\d$/;

  /**
   * Validates DD-MM-YYYY date format
   */
  static validate(dateStr: string): DateValidationResult {
    // Step 1: Check format
    if (!this.DD_MM_YYYY_REGEX.test(dateStr)) {
      return { valid: false, error: "invalidFormat" };
    }

    // Step 2: Parse and validate date exists
    const parts = dateStr.replace(/\//g, "-").split("-");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    const dateObj = new Date(year, month - 1, day);

    // Verify date components match (catches invalid dates like Feb 31st or April 31st)
    const isValidDate =
      dateObj.getFullYear() === year &&
      dateObj.getMonth() === month - 1 &&
      dateObj.getDate() === day;

    if (!isValidDate) {
      return { valid: false, error: "invalidDate" };
    }

    // Step 3: Check if date is in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateObj >= tomorrow) {
      return { valid: false, error: "futureDate" };
    }

    return { valid: true, date: dateObj };
  }

  /**
   * Format ISO date to DD-MM-YYYY
   */
  static formatToDDMMYYYY(isoDate: string | null | undefined): string {
    if (!isoDate || isoDate === "string") return "";

    try {
      const cleanDate = isoDate.split("T")[0];
      const parts = cleanDate.split("-");

      if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}-${month}-${year}`;
      }

      logger.warn("Invalid date format in formatToDDMMYYYY", { isoDate });
      return "";
    } catch (error) {
      logger.error("Error formatting date to DD-MM-YYYY", {
        isoDate,
        error: error instanceof Error ? error : new Error(String(error))
      });
      return "";
    }
  }

  /**
   * Parse DD-MM-YYYY to ISO format
   */
  static parseToISO(ddmmyyyy: string | null | undefined): string | null {
    if (!ddmmyyyy) return null;

    const validation = this.validate(ddmmyyyy);
    if (!validation.valid) return null;

    const parts = ddmmyyyy.replace(/\//g, "-").split("-");
    const [day, month, year] = parts;

    return `${year.padStart(4, "0")}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00`;
  }

  /**
   * Calculates duration in years and months between two dates.
   * Inclusive of the end date (typical for rental agreement durations).
   * Supports: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, or other standard ISO strings.
   */
  static calculateDurationYearsMonths(
    fromDateStr: string | null | undefined,
    toDateStr: string | null | undefined
  ): string {
    if (!fromDateStr || !toDateStr) return "N/A";

    const parseLocal = (dateStr: string): Date | null => {
      if (!dateStr) return null;
      // Match YYYY-MM-DD
      const ymdMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymdMatch) {
        return new Date(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]));
      }
      // Match DD-MM-YYYY or DD/MM/YYYY
      const dmyMatch = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (dmyMatch) {
        return new Date(Number(dmyMatch[3]), Number(dmyMatch[2]) - 1, Number(dmyMatch[1]));
      }
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? null : d;
    };

    const start = parseLocal(fromDateStr);
    const end = parseLocal(toDateStr);

    if (!start || !end || end < start) return "N/A";

    // Adjust end date by adding 1 day to make the duration calculation inclusive
    const endAdjusted = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1);

    let years = endAdjusted.getFullYear() - start.getFullYear();
    let months = endAdjusted.getMonth() - start.getMonth();

    if (endAdjusted.getDate() < start.getDate()) {
      months -= 1;
    }

    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return `${years}Y ${months}M`;
  }

  /**
   * Validates if string is a valid date or datetime with year starting from minYear (defaults to current year)
   */
  static isValidDateTime(val: string | null | undefined, minYear: number = new Date().getFullYear()): boolean {
    if (!val || !val.trim()) return false;
    const str = val.trim();

    // Match DD-MM-YYYY HH:mm:ss or DD-MM-YYYY HH:mm or DD-MM-YYYY
    const ddmmyyyyMatch = str.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[\sT](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
    );
    if (ddmmyyyyMatch) {
      const day = parseInt(ddmmyyyyMatch[1], 10);
      const month = parseInt(ddmmyyyyMatch[2], 10);
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const hour = ddmmyyyyMatch[4] ? parseInt(ddmmyyyyMatch[4], 10) : 0;
      const minute = ddmmyyyyMatch[5] ? parseInt(ddmmyyyyMatch[5], 10) : 0;
      const second = ddmmyyyyMatch[6] ? parseInt(ddmmyyyyMatch[6], 10) : 0;

      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;
      if (year < minYear || year > 2100) return false;
      if (hour < 0 || hour > 23) return false;
      if (minute < 0 || minute > 59) return false;
      if (second < 0 || second > 59) return false;

      const dateObj = new Date(year, month - 1, day, hour, minute, second);
      return (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
      );
    }

    // Match ISO YYYY-MM-DDTHH:mm or YYYY-MM-DD
    const isoMatch = str.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/
    );
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10);
      const day = parseInt(isoMatch[3], 10);
      const hour = isoMatch[4] ? parseInt(isoMatch[4], 10) : 0;
      const minute = isoMatch[5] ? parseInt(isoMatch[5], 10) : 0;
      const second = isoMatch[6] ? parseInt(isoMatch[6], 10) : 0;

      if (month < 1 || month > 12) return false;
      if (day < 1 || day > 31) return false;
      if (year < minYear || year > 2100) return false;
      if (hour < 0 || hour > 23) return false;
      if (minute < 0 || minute > 59) return false;
      if (second < 0 || second > 59) return false;

      const dateObj = new Date(year, month - 1, day, hour, minute, second);
      return (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
      );
    }

    const dateObj = new Date(str);
    if (isNaN(dateObj.getTime())) return false;
    const yr = dateObj.getFullYear();
    return yr >= minYear && yr <= 2100;
  }

  /**
   * Format date/datetime string into HTML input format (YYYY-MM-DDTHH:mm or YYYY-MM-DD).
   * Rejects out-of-bounds/invalid years (< currentYear).
   */
  static formatForInput(val: string | null | undefined, isDateTime: boolean): string {
    if (!val || !val.trim()) return '';
    const str = val.trim();
    const currentYear = new Date().getFullYear();

    const ddmmyyyyMatch = str.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[\sT](\d{1,2}):(\d{1,2}))?/
    );
    if (ddmmyyyyMatch) {
      const day = ddmmyyyyMatch[1].padStart(2, '0');
      const month = ddmmyyyyMatch[2].padStart(2, '0');
      const year = parseInt(ddmmyyyyMatch[3], 10);
      const hour = (ddmmyyyyMatch[4] || '00').padStart(2, '0');
      const min = (ddmmyyyyMatch[5] || '00').padStart(2, '0');
      if (year < currentYear) return '';
      return isDateTime ? `${year}-${month}-${day}T${hour}:${min}` : `${year}-${month}-${day}`;
    }

    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = isoMatch[2];
      const day = isoMatch[3];
      const hour = isoMatch[4] || '00';
      const min = isoMatch[5] || '00';
      if (year < currentYear) return '';
      return isDateTime ? `${year}-${month}-${day}T${hour}:${min}` : `${year}-${month}-${day}`;
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    if (year < currentYear) return '';

    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return isDateTime ? `${year}-${month}-${day}T${hour}:${min}` : `${year}-${month}-${day}`;
  }

  /**
   * Format updatedDate / createdDate into "DD/MM/YYYY HH:mm" without timezone drift
   */
  static formatDisplayDate(dateStr: string | null | undefined): string {
    if (!dateStr || dateStr === 'string') return '—';
    const str = dateStr.trim();

    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (isoMatch) {
      const [, year, month, day, hours, minutes] = isoMatch;
      if (hours !== undefined && minutes !== undefined) {
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }
      return `${day}/${month}/${year}`;
    }

    const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[\sT](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3];
      const hours = dmyMatch[4];
      const minutes = dmyMatch[5];
      if (hours !== undefined && minutes !== undefined) {
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      }
      return `${day}/${month}/${year}`;
    }

    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) return '—';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
}