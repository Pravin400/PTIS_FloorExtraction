import { describe, it, expect, vi } from "vitest";
import { DateUtils } from "@/lib/utils/date-helpers";

// Mock the logger to avoid console clutter during tests
vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("DateUtils.validate", () => {
  it("should accept valid dates in DD-MM-YYYY format", () => {
    const result = DateUtils.validate("15-08-1947");
    expect(result.valid).toBe(true);
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date?.getFullYear()).toBe(1947);
    expect(result.date?.getMonth()).toBe(7); // August is 7
    expect(result.date?.getDate()).toBe(15);
  });

  it("should reject structurally invalid date formats", () => {
    const invalidFormats = [
      "15/08/194",
      "15-8-1947",
      "1-08-1947",
      "15-08-20",
      "abc",
      "",
    ];

    invalidFormats.forEach((format) => {
      const result = DateUtils.validate(format);
      expect(result.valid).toBe(false);
      expect(result.error).toBe("invalidFormat");
    });
  });

  it("should reject calendar dates that do not exist (e.g. Feb 31st)", () => {
    const result = DateUtils.validate("31-02-2024");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("invalidDate");
  });

  it("should handle leap years correctly", () => {
    // 2024 is a leap year (Feb 29 exists)
    const leapYear = DateUtils.validate("29-02-2024");
    expect(leapYear.valid).toBe(true);

    // 2025 is not a leap year (Feb 29 does not exist)
    const nonLeapYear = DateUtils.validate("29-02-2025");
    expect(nonLeapYear.valid).toBe(false);
    expect(nonLeapYear.error).toBe("invalidDate");
  });

  it("should reject future dates", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const day = String(tomorrow.getDate()).padStart(2, "0");
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const year = tomorrow.getFullYear();
    
    const tomorrowStr = `${day}-${month}-${year}`;
    const result = DateUtils.validate(tomorrowStr);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBe("futureDate");
  });
});

describe("DateUtils.formatToDDMMYYYY", () => {
  it("should format ISO dates to DD-MM-YYYY format", () => {
    expect(DateUtils.formatToDDMMYYYY("2026-02-10T00:00:00")).toBe("10-02-2026");
    expect(DateUtils.formatToDDMMYYYY("1985-04-01")).toBe("01-04-1985");
  });

  it("should return empty string for null, undefined or invalid strings", () => {
    expect(DateUtils.formatToDDMMYYYY(null)).toBe("");
    expect(DateUtils.formatToDDMMYYYY(undefined)).toBe("");
    expect(DateUtils.formatToDDMMYYYY("string")).toBe("");
  });
});



describe("DateUtils.parseToISO", () => {
  it("should parse DD-MM-YYYY dates to ISO structure", () => {
    expect(DateUtils.parseToISO("10-02-2026")).toBe("2026-02-10T00:00:00");
  });

  it("should return null for invalid date formats", () => {
    expect(DateUtils.parseToISO("31-02-2024")).toBeNull();
    expect(DateUtils.parseToISO("")).toBeNull();
  });
});

describe("DateUtils.calculateDurationYearsMonths", () => {
  it("should return N/A if either date is missing or toDate is before fromDate", () => {
    expect(DateUtils.calculateDurationYearsMonths(null, "2026-08-22")).toBe("N/A");
    expect(DateUtils.calculateDurationYearsMonths("2026-06-22", undefined)).toBe("N/A");
    expect(DateUtils.calculateDurationYearsMonths("2026-06-22", "2025-06-22")).toBe("N/A");
  });

  it("should calculate exact year differences", () => {
    // 22-06-2026 to 21-06-2027 (inclusive, exactly 1 year)
    expect(DateUtils.calculateDurationYearsMonths("2026-06-22", "2027-06-21")).toBe("1Y 0M");
    // 22-06-2026 to 22-06-2027
    expect(DateUtils.calculateDurationYearsMonths("2026-06-22", "2027-06-22")).toBe("1Y 0M");
  });

  it("should calculate the user's specific case correctly", () => {
    // 22-06-2026 to 22-08-2027
    expect(DateUtils.calculateDurationYearsMonths("2026-06-22", "2027-08-22")).toBe("1Y 2M");
    // 22-06-2026 to 21-08-2027
    expect(DateUtils.calculateDurationYearsMonths("2026-06-22", "2027-08-21")).toBe("1Y 2M");
  });

  it("should handle partial months correctly", () => {
    // 22-06-2026 to 20-08-2027 (1Y 1M)
    expect(DateUtils.calculateDurationYearsMonths("2026-06-22", "2027-08-20")).toBe("1Y 1M");
  });

  it("should handle standard 11 months agreements correctly", () => {
    // 01-04-2026 to 28-02-2027
    expect(DateUtils.calculateDurationYearsMonths("2026-04-01", "2027-02-28")).toBe("0Y 11M");
  });

  it("should support other date string formats", () => {
    expect(DateUtils.calculateDurationYearsMonths("22-06-2026", "22-08-2027")).toBe("1Y 2M");
    expect(DateUtils.calculateDurationYearsMonths("22/06/2026", "22/08/2027")).toBe("1Y 2M");
  });
});

describe("DateUtils.isValidDateTime", () => {
  it("should return true for valid dates and datetimes from specified minYear onwards", () => {
    expect(DateUtils.isValidDateTime("2026-08-20T18:14")).toBe(true);
    expect(DateUtils.isValidDateTime("15-08-2026 10:30")).toBe(true);
    expect(DateUtils.isValidDateTime("2000-01-01", 1900)).toBe(true);
    expect(DateUtils.isValidDateTime("01-01-1900 00:00", 1900)).toBe(true);
  });

  it("should return false for out-of-range years such as 1111", () => {
    expect(DateUtils.isValidDateTime("11-11-1111 18:14")).toBe(false);
    expect(DateUtils.isValidDateTime("1111-11-11T18:14")).toBe(false);
    expect(DateUtils.isValidDateTime("1899-12-31")).toBe(false);
    expect(DateUtils.isValidDateTime("2101-01-01")).toBe(false);
  });

  it("should return false for invalid calendar dates and formats", () => {
    expect(DateUtils.isValidDateTime("31-02-2026 18:14")).toBe(false);
    expect(DateUtils.isValidDateTime("invalid date")).toBe(false);
    expect(DateUtils.isValidDateTime(null)).toBe(false);
    expect(DateUtils.isValidDateTime("")).toBe(false);
  });
});

