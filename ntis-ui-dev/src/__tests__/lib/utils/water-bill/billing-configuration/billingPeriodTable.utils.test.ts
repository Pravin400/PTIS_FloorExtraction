import { describe, it, expect } from "vitest";
import {
  filterBillingPeriodsForTable,
  extractFinancialYearNumber,
  getBillingFrequencyName,
  getSequenceNumber,
  compareBillingPeriodsDefault,
  sortBillingPeriodsTable,
} from "@/lib/utils/water-bill/billing-configuration/billingPeriodTable.utils";
import type { BillingPeriodMaster } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

describe("billingPeriodTable.utils", () => {
  const sampleItems: BillingPeriodMaster[] = [
    {
      id: 1,
      billingPeriodCode: "2026-Q1",
      financialYear: "2026",
      financialYearId: 1,
      billingFrequency: "Quarterly",
      billingFrequencyId: 20,
      sequenceNo: 1,
      periodFromDate: "2026-04-01",
      periodToDate: "2026-06-30",
      graceDays: 0,
      isActive: true,
    },
    {
      id: 2,
      billingPeriodCode: "2026-H1",
      financialYear: "2026",
      financialYearId: 1,
      billingFrequency: "Half-Yearly",
      billingFrequencyId: 15,
      sequenceNo: 1,
      periodFromDate: "2026-04-01",
      periodToDate: "2026-09-30",
      graceDays: 0,
      isActive: true,
    },
    {
      id: 3,
      billingPeriodCode: "2025-Q1",
      financialYear: "2025",
      financialYearId: 2,
      billingFrequency: "Quarterly",
      billingFrequencyId: 20,
      sequenceNo: 1,
      periodFromDate: "2025-04-01",
      periodToDate: "2025-06-30",
      graceDays: 0,
      isActive: true,
    },
    {
      id: 4,
      billingPeriodCode: "2026-Q2",
      financialYear: "2026",
      financialYearId: 1,
      billingFrequency: "Quarterly",
      billingFrequencyId: 20,
      sequenceNo: 2,
      periodFromDate: "2026-07-01",
      periodToDate: "2026-08-30",
      graceDays: 0,
      isActive: true,
    },
    {
      id: 5,
      billingPeriodCode: "2026-H2",
      financialYear: "2026",
      financialYearId: 1,
      billingFrequency: "Half-Yearly",
      billingFrequencyId: 15,
      sequenceNo: 2,
      periodFromDate: "2026-10-01",
      periodToDate: "2027-03-31",
      graceDays: 0,
      isActive: true,
    },
  ];

  describe("extractFinancialYearNumber", () => {
    it("extracts 4 digit year from financialYear or financialYearCode or periodFromDate", () => {
      expect(extractFinancialYearNumber({ financialYear: "2026-2027" } as BillingPeriodMaster)).toBe(2026);
      expect(extractFinancialYearNumber({ financialYearCode: "2025" } as BillingPeriodMaster)).toBe(2025);
      expect(extractFinancialYearNumber({ periodFromDate: "2024-04-01" } as BillingPeriodMaster)).toBe(2024);
      expect(extractFinancialYearNumber({} as BillingPeriodMaster)).toBe(0);
    });
  });

  describe("getBillingFrequencyName", () => {
    it("extracts and trims billing frequency name or code", () => {
      expect(getBillingFrequencyName({ billingFrequency: " Quarterly " } as BillingPeriodMaster)).toBe("Quarterly");
      expect(getBillingFrequencyName({ billingFrequencyCode: "M" } as BillingPeriodMaster)).toBe("M");
      expect(getBillingFrequencyName({} as BillingPeriodMaster)).toBe("");
    });
  });

  describe("getSequenceNumber", () => {
    it("extracts numeric sequence number or defaults to 0", () => {
      expect(getSequenceNumber({ sequenceNo: 3 } as BillingPeriodMaster)).toBe(3);
      expect(getSequenceNumber({ sequenceNo: null } as BillingPeriodMaster)).toBe(0);
      expect(getSequenceNumber({} as BillingPeriodMaster)).toBe(0);
    });
  });

  describe("filterBillingPeriodsForTable", () => {
    it("filters out records missing both financial year and billing frequency", () => {
      const invalidItem = {
        id: 99,
        billingPeriodCode: "INVALID",
        financialYearId: 0,
        billingFrequencyId: 0,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        graceDays: 0,
        isActive: true,
      };

      const result = filterBillingPeriodsForTable([...sampleItems, invalidItem]);
      expect(result).toHaveLength(sampleItems.length);
      expect(result.some((r) => r.id === 99)).toBe(false);
    });
  });

  describe("compareBillingPeriodsDefault", () => {
    it("sorts by Year DESC, BillingFrequency ASC, SequenceNo ASC matching SQL logic", () => {
      const sorted = [...sampleItems].sort(compareBillingPeriodsDefault);

      // 1. Year 2026 should come before Year 2025
      expect(sorted[0].financialYear).toBe("2026");
      expect(sorted[1].financialYear).toBe("2026");
      expect(sorted[2].financialYear).toBe("2026");
      expect(sorted[3].financialYear).toBe("2026");
      expect(sorted[4].financialYear).toBe("2025");

      // 2. Within 2026, 'Half-Yearly' comes before 'Quarterly'
      expect(sorted[0].billingFrequency).toBe("Half-Yearly");
      expect(sorted[0].sequenceNo).toBe(1); // 2026-H1

      expect(sorted[1].billingFrequency).toBe("Half-Yearly");
      expect(sorted[1].sequenceNo).toBe(2); // 2026-H2

      expect(sorted[2].billingFrequency).toBe("Quarterly");
      expect(sorted[2].sequenceNo).toBe(1); // 2026-Q1

      expect(sorted[3].billingFrequency).toBe("Quarterly");
      expect(sorted[3].sequenceNo).toBe(2); // 2026-Q2

      // 3. 2025 comes last
      expect(sorted[4].billingPeriodCode).toBe("2025-Q1");
    });
  });

  describe("sortBillingPeriodsTable", () => {
    it("defaults to SQL ordering when sortBy is undefined", () => {
      const sorted = sortBillingPeriodsTable(sampleItems);
      expect(sorted.map((s) => s.billingPeriodCode)).toEqual([
        "2026-H1",
        "2026-H2",
        "2026-Q1",
        "2026-Q2",
        "2025-Q1",
      ]);
    });

    it("sorts by financialYear desc with secondary frequency and sequence ordering", () => {
      const sorted = sortBillingPeriodsTable(sampleItems, "financialYear", "desc");
      expect(sorted.map((s) => s.billingPeriodCode)).toEqual([
        "2026-H1",
        "2026-H2",
        "2026-Q1",
        "2026-Q2",
        "2025-Q1",
      ]);
    });

    it("sorts by financialYear asc", () => {
      const sorted = sortBillingPeriodsTable(sampleItems, "financialYear", "asc");
      expect(sorted[0].billingPeriodCode).toBe("2025-Q1");
    });
  });
});
