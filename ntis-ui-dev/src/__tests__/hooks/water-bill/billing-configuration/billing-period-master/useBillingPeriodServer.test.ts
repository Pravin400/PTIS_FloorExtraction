import { describe, it, expect } from "vitest";
import {
  validateBillingPeriodInput,
  mapToCreateBillingPeriodDto,
  mapToUpdateBillingPeriodDto,
} from "@/hooks/water-bill/billing-configuration/billing-period-master/useBillingPeriodServer";
import type { BillingPeriodInput } from "@/types/water-bill/billing-configuration/billingPeriodMaster.types";

describe("useBillingPeriodServer - Unit Tests", () => {
  const mockT = (key: string, values?: Record<string, string | number | Date>) => {
    if (values && "count" in values) {
      return `${key}_${values.count}`;
    }
    return key;
  };

  describe("validateBillingPeriodInput", () => {
    it("should return valid result for correct input", () => {
      const input: BillingPeriodInput = {
        billingPeriodCode: "BP-1-1-1",
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        isActive: true,
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("should fail validation when financialYearId is missing or invalid", () => {
      const input: BillingPeriodInput = {
        financialYearId: 0,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.financialYearId).toContain("validation.financialYearRequired");
    });

    it("should fail validation when billingFrequencyId is missing or invalid", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 0,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.billingFrequencyId).toContain("validation.billingFrequencyRequired");
    });

    it("should fail validation when periodFromDate is missing or invalid", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "invalid-date",
        periodToDate: "2026-04-30",
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.periodFromDate).toContain("validation.periodFromDateInvalid");
    });

    it("should fail validation when periodToDate is missing or invalid", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "invalid-date",
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.periodToDate).toContain("validation.periodToDateInvalid");
    });

    it("should fail validation when periodToDate is before periodFromDate", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-05-01",
        periodToDate: "2026-04-30",
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.periodToDate).toContain("validation.periodToDateAfterFromDate");
    });

    it("should fail validation when billGenerationDate is invalid", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        dueDate: "2026-04-30",
        billGenerationDate: "INVALID",
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.billGenerationDate).toContain("validation.billGenerationDateInvalid");
    });

    it("should fail validation when billGenerationDate is before periodFromDate", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-07-01",
        periodToDate: "2026-07-31",
        dueDate: "2026-07-31",
        billGenerationDate: "2026-05-31",
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.billGenerationDate).toContain("validation.billGenerationNotBeforePeriodFrom");
    });

    it("should fail validation when pendingPenaltyEndDate is before pendingPenaltyStartDate", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        dueDate: "2026-04-30",
        currentPenaltyStartDate: "2026-05-01",
        currentPenaltyEndDate: "2026-05-31",
        pendingPenaltyStartDate: "2026-06-01",
        pendingPenaltyEndDate: "2026-05-15", // before pendingPenaltyStartDate
      };

      const result = validateBillingPeriodInput(input, mockT);
      expect(result.isValid).toBe(false);
      expect(result.errors.pendingPenaltyEndDate).toContain("validation.pendingPenaltyEndAfterStart");
    });
  });

  describe("mapToCreateBillingPeriodDto", () => {
    it("should correctly map, sanitize, and auto-generate code from IDs without sequenceNo", () => {
      const input: BillingPeriodInput = {
        billingPeriodCode: "",
        financialYearId: 2,
        billingFrequencyId: 3,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        isActive: "true",
      };

      const dto = mapToCreateBillingPeriodDto(input);
      expect(dto.billingPeriodCode).toBe("BP-2-3");
      expect(dto.financialYearId).toBe(2);
      expect(dto.billingFrequencyId).toBe(3);
      expect(dto.sequenceNo).toBeUndefined();
      expect(dto.periodFromDate).toBe(new Date("2026-04-01").toISOString());
      expect(dto.periodToDate).toBe(new Date("2026-04-30").toISOString());
      expect(dto.isActive).toBe(true);
    });

    it("should include sequenceNo in auto-generated code and DTO when sequenceNo is provided", () => {
      const input: BillingPeriodInput = {
        billingPeriodCode: "",
        financialYearId: 2,
        billingFrequencyId: 3,
        sequenceNo: 4,
        periodFromDate: "2026-07-01",
        periodToDate: "2026-07-31",
        isActive: true,
      };

      const dto = mapToCreateBillingPeriodDto(input);
      expect(dto.billingPeriodCode).toBe("BP-2-3-4");
      expect(dto.sequenceNo).toBe(4);
      expect(dto.financialYearId).toBe(2);
      expect(dto.billingFrequencyId).toBe(3);
    });

    it("should generate distinct unique codes for multiple periods under the same Financial Year and Billing Frequency", () => {
      const period1Input: BillingPeriodInput = {
        financialYearId: 2,
        billingFrequencyId: 3,
        sequenceNo: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
      };
      const period2Input: BillingPeriodInput = {
        financialYearId: 2,
        billingFrequencyId: 3,
        sequenceNo: 2,
        periodFromDate: "2026-05-01",
        periodToDate: "2026-05-31",
      };

      const dto1 = mapToCreateBillingPeriodDto(period1Input);
      const dto2 = mapToCreateBillingPeriodDto(period2Input);

      expect(dto1.billingPeriodCode).toBe("BP-2-3-1");
      expect(dto2.billingPeriodCode).toBe("BP-2-3-2");
      expect(dto1.billingPeriodCode).not.toBe(dto2.billingPeriodCode);
    });

    it("should handle existing billing period code if provided", () => {
      const input: BillingPeriodInput = {
        billingPeriodCode: "EXISTING-CODE",
        financialYearId: 1,
        billingFrequencyId: 1,
        sequenceNo: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
      };

      const dto = mapToCreateBillingPeriodDto(input);
      expect(dto.billingPeriodCode).toBe("EXISTING-CODE");
      expect(dto.sequenceNo).toBe(1);
    });

    it("should include createdBy and CreatedBy when userId is passed", () => {
      const input: BillingPeriodInput = {
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
      };

      const dto = mapToCreateBillingPeriodDto(input, 99);
      expect(dto.createdBy).toBe(99);
    });
  });

  describe("mapToUpdateBillingPeriodDto", () => {
    it("should correctly map and include ID and sequenceNo", () => {
      const input: BillingPeriodInput = {
        id: 10,
        billingPeriodCode: "BP-UPDATE",
        financialYearId: 1,
        billingFrequencyId: 1,
        sequenceNo: 2,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
        isActive: true,
      };

      const dto = mapToUpdateBillingPeriodDto(10, input);
      expect(dto.id).toBe(10);
      expect(dto.billingPeriodCode).toBe("BP-UPDATE");
      expect(dto.sequenceNo).toBe(2);
      expect(dto.isActive).toBe(true);
    });

    it("should include updatedBy and UpdatedBy when userId is passed", () => {
      const input: BillingPeriodInput = {
        id: 10,
        financialYearId: 1,
        billingFrequencyId: 1,
        periodFromDate: "2026-04-01",
        periodToDate: "2026-04-30",
      };

      const dto = mapToUpdateBillingPeriodDto(10, input, 99);
      expect(dto.updatedBy).toBe(99);
    });
  });
});
