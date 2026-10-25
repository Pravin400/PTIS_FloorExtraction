import { describe, it, expect, vi } from "vitest";
import { getPenaltyRuleColumns } from "@/components/modules/water-bill/penalty-rule-master/penaltyRuleColumns";
import type { WaterPenaltyRuleDto } from "@/types/water-bill/penalty-rule-master.types";

describe("penaltyRuleColumns", () => {
  const mockT = vi.fn((key: string) => key);

  it("returns full 14 columns configuration for Water Bill Penalty Rules", () => {
    const columns = getPenaltyRuleColumns(mockT);

    expect(columns).toHaveLength(14);
    expect(columns.map((c) => c.key)).toEqual([
      "financialYearName",
      "connectionCategoryName",
      "geographyName",
      "chargeHeadName",
      "penaltyType",
      "fromDay",
      "toDay",
      "percentageRate",
      "flatAmount",
      "maximumAmount",
      "effectiveFrom",
      "effectiveTo",
      "isCurrentBill",
      "isActive",
    ]);
  });

  it("renders financial year, category, and rate properly", () => {
    const columns = getPenaltyRuleColumns(mockT);

    const row: WaterPenaltyRuleDto = {
      penaltyRuleId: 1,
      financialYearId: 1,
      financialYearName: "2026-27",
      connectionCategoryId: 1,
      connectionCategoryName: "Residential",
      geographyUnitId: null,
      geographyName: null,
      chargeHeadId: 1,
      chargeHeadName: "Late Fee",
      penaltyType: "Percentage",
      fromDay: 1,
      toDay: 30,
      percentageRate: 2.5,
      flatAmount: null,
      maximumAmount: 500,
      effectiveFrom: "2026-04-01T00:00:00",
      effectiveTo: "2027-03-31T00:00:00",
      isCurrentBill: true,
      isPendingBill: false,
      isActive: true,
    };

    const fyCol = columns.find((c) => c.key === "financialYearName");
    expect(fyCol).toBeDefined();
    expect(fyCol?.render?.(row.financialYearName, row, 0)).toBeDefined();

    const catCol = columns.find((c) => c.key === "connectionCategoryName");
    expect(catCol).toBeDefined();
    expect(catCol?.render?.(row.connectionCategoryName, row, 0)).toBeDefined();

    const rateCol = columns.find((c) => c.key === "percentageRate");
    expect(rateCol).toBeDefined();
    expect(rateCol?.render?.(row.percentageRate, row, 0)).toBeDefined();
  });
});
