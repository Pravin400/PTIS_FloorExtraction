import { describe, it, expect } from "vitest";
import {
  parseDateComponents,
  addDays,
  diffDays,
  formatDateToDDMMYYYY,
  getFrequencyPeriodsPerYear,
  getFinancialYearDates,
  calculatePeriodToDate,
  calculateNextPeriodFromDate,
  calculateBillingPeriodSequenceNo,
} from "@/lib/utils/water-bill/billing-configuration/billingPeriodCalculation.utils";
import type { BillingPeriodMaster, DropdownOption } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

describe("billingPeriodCalculation.utils", () => {
  describe("getFinancialYearDates", () => {
    it("extracts startDate and endDate from option data", () => {
      const option: DropdownOption = {
        value: "1",
        label: "Financial Year 2026-2027",
        data: {
          startDate: "2026-04-01T00:00:00",
          endDate: "2027-03-31T00:00:00",
        },
      };
      expect(getFinancialYearDates(option)).toEqual({
        startDate: "2026-04-01",
        endDate: "2027-03-31",
      });
    });

    it("derives dates from option.data.year when dates are absent", () => {
      const option: DropdownOption = {
        value: "1",
        label: "2026-2027",
        data: { year: 2026 },
      };
      expect(getFinancialYearDates(option)).toEqual({
        startDate: "2026-04-01",
        endDate: "2027-03-31",
      });
    });

    it("derives dates from option label when data is absent", () => {
      const option: DropdownOption = {
        value: "1",
        label: "2026-2027",
      };
      expect(getFinancialYearDates(option)).toEqual({
        startDate: "2026-04-01",
        endDate: "2027-03-31",
      });
    });

    it("returns empty strings for undefined option", () => {
      expect(getFinancialYearDates(undefined)).toEqual({
        startDate: "",
        endDate: "",
      });
    });
  });

  describe("parseDateComponents", () => {
    it("parses YYYY-MM-DD format correctly", () => {
      expect(parseDateComponents("2026-04-01")).toEqual({ y: 2026, m: 4, d: 1 });
      expect(parseDateComponents("2026-12-31")).toEqual({ y: 2026, m: 12, d: 31 });
    });

    it("parses MM/DD/YYYY format correctly", () => {
      expect(parseDateComponents("04/01/2026")).toEqual({ y: 2026, m: 4, d: 1 });
      expect(parseDateComponents("12/31/2026")).toEqual({ y: 2026, m: 12, d: 31 });
    });

    it("parses ISO date strings correctly", () => {
      expect(parseDateComponents("2026-05-01T00:00:00.000Z")).toEqual({ y: 2026, m: 5, d: 1 });
    });

    it("returns null for invalid or empty inputs", () => {
      expect(parseDateComponents("")).toBeNull();
      expect(parseDateComponents(null)).toBeNull();
      expect(parseDateComponents("invalid-date")).toBeNull();
    });
  });

  describe("addDays", () => {
    it("adds calendar days across month boundaries", () => {
      expect(addDays("2026-04-30", 1)).toBe("2026-05-01");
      expect(addDays("2026-05-31", 1)).toBe("2026-06-01");
      expect(addDays("2026-05-31", 31)).toBe("2026-07-01");
      expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    });

    it("returns empty string on empty input", () => {
      expect(addDays("", 1)).toBe("");
    });
  });

  describe("diffDays", () => {
    it("returns 0 when dates are the same", () => {
      expect(diffDays("2026-05-31", "2026-05-31")).toBe(0);
    });

    it("calculates exact calendar days between two dates", () => {
      expect(diffDays("2026-05-31", "2026-06-30")).toBe(30);
      expect(diffDays("2026-05-31", "2026-07-01")).toBe(31);
      expect(diffDays("2026-04-01", "2026-04-30")).toBe(29);
    });

    it("returns 0 if end is before start", () => {
      expect(diffDays("2026-06-01", "2026-05-01")).toBe(0);
    });
  });

  describe("getFrequencyPeriodsPerYear", () => {
    it("extracts periodsPerYear from DropdownOption data", () => {
      const option: DropdownOption = {
        value: "1",
        label: "Monthly",
        data: { periodsPerYear: 12 },
      };
      expect(getFrequencyPeriodsPerYear(option)).toBe(12);
    });

    it("returns 0 for missing or invalid data", () => {
      expect(getFrequencyPeriodsPerYear(undefined)).toBe(0);
      expect(getFrequencyPeriodsPerYear({ value: "1", label: "Custom" })).toBe(0);
    });
  });

  describe("calculatePeriodToDate", () => {
    it("calculates monthly period to date (1 month offset)", () => {
      expect(calculatePeriodToDate("2026-04-01", 12)).toBe("2026-04-30");
      expect(calculatePeriodToDate("2026-05-01", 12)).toBe("2026-05-31");
      expect(calculatePeriodToDate("2026-06-01", 12)).toBe("2026-06-30");
    });

    it("calculates quarterly period to date (3 months offset)", () => {
      expect(calculatePeriodToDate("2026-04-01", 4)).toBe("2026-06-30");
      expect(calculatePeriodToDate("2026-07-01", 4)).toBe("2026-09-30");
    });

    it("calculates half-yearly period to date (6 months offset)", () => {
      expect(calculatePeriodToDate("2026-04-01", 2)).toBe("2026-09-30");
    });

    it("calculates yearly period to date (12 months offset)", () => {
      expect(calculatePeriodToDate("2026-04-01", 1)).toBe("2027-03-31");
    });

    it("returns yearEndDate for the last period (Quarterly Period 4)", () => {
      // Dec 1 with 3 months offset normally gives 2027-02-28, but last period must end on 2027-03-31
      expect(calculatePeriodToDate("2026-12-01", 4, true, "2027-03-31")).toBe("2027-03-31");
    });

    it("caps at yearEndDate if calculated date exceeds yearEndDate", () => {
      expect(calculatePeriodToDate("2027-02-01", 4, false, "2027-03-31")).toBe("2027-03-31");
    });
  });

  describe("calculateNextPeriodFromDate", () => {
    const existingMonthly: BillingPeriodMaster[] = [
      {
        id: 1,
        billingPeriodCode: "2026-M1",
        financialYearId: 1,
        billingFrequencyId: 10,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        graceDays: 0,
        isActive: true,
      },
    ];

    it("returns yearStartDate when no matching existing periods exist", () => {
      expect(calculateNextPeriodFromDate("2026-04-01", [], 1, 10)).toBe("2026-04-01");
      expect(calculateNextPeriodFromDate("2026-04-01", existingMonthly, 1, 20)).toBe("2026-04-01");
    });

    it("returns next day after latest existing period to date", () => {
      expect(calculateNextPeriodFromDate("2026-04-01", existingMonthly, 1, 10)).toBe("2026-05-01");
    });
  });

  describe("calculateBillingPeriodSequenceNo", () => {
    const existingQuarterly: BillingPeriodMaster[] = [
      {
        id: 1,
        billingPeriodCode: "2026-Q1",
        financialYearId: 1,
        billingFrequencyId: 20,
        sequenceNo: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-06-30",
        graceDays: 0,
        isActive: true,
      },
      {
        id: 2,
        billingPeriodCode: "2026-Q2",
        financialYearId: 1,
        billingFrequencyId: 20,
        sequenceNo: 2,
        periodFromDate: "2026-07-01",
        periodToDate: "2026-08-30",
        graceDays: 0,
        isActive: true,
      },
    ];

    it("returns 3 when periods 1 and 2 already exist for quarterly", () => {
      const seq = calculateBillingPeriodSequenceNo(
        "2026-08-31", // Custom period from date
        4,
        "2026-04-01",
        undefined,
        existingQuarterly,
        1,
        20
      );
      expect(seq).toBe(3);
    });

    it("does not reuse existing sequence number 2 even if passed when 2 is already taken", () => {
      const seq = calculateBillingPeriodSequenceNo(
        "2026-08-31",
        4,
        "2026-04-01",
        2, // Conflict: 2 already exists
        existingQuarterly,
        1,
        20
      );
      expect(seq).toBe(3);
    });

    it("preserves valid sequence number when in edit mode or not in conflict", () => {
      const seq = calculateBillingPeriodSequenceNo(
        "2026-08-31",
        4,
        "2026-04-01",
        2,
        [], // No conflict
        1,
        20
      );
      expect(seq).toBe(2);
    });

    it("preserves sequence number when editing an existing period and currentId is provided", () => {
      const seq = calculateBillingPeriodSequenceNo(
        "2026-07-01",
        4,
        "2026-04-01",
        2,
        existingQuarterly,
        1,
        20,
        2 // currentId is 2, so it's editing period 2
      );
      expect(seq).toBe(2);
    });
  });

  describe("formatDateToDDMMYYYY", () => {
    it("formats ISO date string (YYYY-MM-DD) to DD/MM/YYYY", () => {
      expect(formatDateToDDMMYYYY("2026-04-01")).toBe("01/04/2026");
      expect(formatDateToDDMMYYYY("2027-03-31")).toBe("31/03/2027");
    });

    it("formats ISO timestamp with time component without drift", () => {
      expect(formatDateToDDMMYYYY("2026-04-01T00:00:00")).toBe("01/04/2026");
      expect(formatDateToDDMMYYYY("2026-10-15T18:30:00.000Z")).toBe("15/10/2026");
    });

    it("formats existing DD-MM-YYYY to DD/MM/YYYY", () => {
      expect(formatDateToDDMMYYYY("01-04-2026")).toBe("01/04/2026");
      expect(formatDateToDDMMYYYY("5-8-2026")).toBe("05/08/2026");
    });

    it("formats Date objects properly", () => {
      const d = new Date(2026, 3, 1); // April 1, 2026
      expect(formatDateToDDMMYYYY(d)).toBe("01/04/2026");
    });

    it("handles null, undefined, empty, and invalid strings gracefully", () => {
      expect(formatDateToDDMMYYYY(null)).toBe("—");
      expect(formatDateToDDMMYYYY(undefined)).toBe("—");
      expect(formatDateToDDMMYYYY("")).toBe("—");
      expect(formatDateToDDMMYYYY("INVALID")).toBe("—");
      expect(formatDateToDDMMYYYY("0001-01-01T00:00:00")).toBe("—");
      expect(formatDateToDDMMYYYY(null, "-")).toBe("-");
    });
  });
});
