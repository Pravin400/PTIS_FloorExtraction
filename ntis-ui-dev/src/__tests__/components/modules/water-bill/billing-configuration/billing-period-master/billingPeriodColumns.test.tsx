import { describe, it, expect, vi } from "vitest";
import { getBillingPeriodColumns } from "@/components/modules/water-bill/billing-configuration/billing-period/billingPeriodColumns";
import {
  renderDateCell,
  renderBillingFrequency,
  renderDateRange,
} from "@/components/modules/water-bill/billing-configuration/billing-period/billingPeriodColumnRenderers";

describe("billingPeriodColumns", () => {
  const t = (key: string) => key;
  const tCommon = (key: string) => key;

  it("generates correct columns list", () => {
    const onSort = vi.fn();
    const columns = getBillingPeriodColumns(t, tCommon, "financialYear", "asc", onSort);
    expect(columns).toHaveLength(10);
    const keys = columns.map((c) => c.key);
    expect(keys).toEqual([
      "financialYear",
      "billingFrequency",
      "periodFromDate",
      "periodToDate",
      "billGenerationDate",
      "dueDate",
      "graceDays",
      "currentPenaltyStartDate",
      "pendingPenaltyStartDate",
      "isActive",
    ]);
  });

  describe("renderers", () => {
    it("renders date cell properly", () => {
      const emptyResult = renderDateCell(null);
      expect(emptyResult).toBeDefined();

      const validResult = renderDateCell("2026-04-01");
      expect(validResult).toBeDefined();
    });

    it("renders billing frequency badges", () => {
      const qResult = renderBillingFrequency("Quarterly");
      expect(qResult).toBeDefined();

      const mResult = renderBillingFrequency("Monthly");
      expect(mResult).toBeDefined();
    });

    it("renders penalty date range properly", () => {
      const rangeResult = renderDateRange("2026-05-01", "2026-05-15", "to", "current");
      expect(rangeResult).toBeDefined();
    });
  });
});
