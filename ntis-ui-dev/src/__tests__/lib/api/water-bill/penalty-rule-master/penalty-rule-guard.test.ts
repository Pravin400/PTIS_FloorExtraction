import { describe, it, expect } from "vitest";
import {
  isPagedResponse,
  isPenaltyRuleShape,
  normalizePenaltyRule,
} from "@/lib/api/water-bill/penalty-rule-master/penalty-rule-guard";
import { ApiError } from "@/lib/utils/api";

describe("penalty-rule-guard", () => {
  describe("isPagedResponse", () => {
    it("returns true for a valid PagedResponse shape", () => {
      const valid = {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
      };
      expect(isPagedResponse(valid)).toBe(true);
    });

    it("returns false for non-objects or invalid shapes", () => {
      expect(isPagedResponse(null)).toBe(false);
      expect(isPagedResponse(undefined)).toBe(false);
      expect(isPagedResponse("string")).toBe(false);
      expect(isPagedResponse({ items: [] })).toBe(false);
    });
  });

  describe("isPenaltyRuleShape", () => {
    it("returns true when id is a positive number", () => {
      expect(isPenaltyRuleShape({ id: 1 })).toBe(true);
      expect(isPenaltyRuleShape({ penaltyRuleId: 5 })).toBe(true);
    });

    it("returns false when id is missing, negative, or not a number", () => {
      expect(isPenaltyRuleShape(null)).toBe(false);
      expect(isPenaltyRuleShape({})).toBe(false);
      expect(isPenaltyRuleShape({ id: -1 })).toBe(false);
      expect(isPenaltyRuleShape({ id: "1" })).toBe(false);
    });
  });

  describe("normalizePenaltyRule", () => {
    it("normalizes a valid raw penalty rule with standard fields", () => {
      const raw = {
        id: 1,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent Fee",
        calculationType: "Percentage",
        penaltyValue: 5.5,
        gracePeriodDays: 10,
        isActive: true,
      };
      const result = normalizePenaltyRule(raw);
      expect(result).toEqual({
        id: 1,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent Fee",
        calculationType: "Percentage",
        penaltyValue: 5.5,
        gracePeriodDays: 10,
        isActive: true,
        createdDate: null,
        updatedDate: null,
        createdBy: null,
        updatedBy: null,
      });
    });

    it("normalizes water bill specific backend properties (penaltyRuleId, percentageRate)", () => {
      const raw = {
        penaltyRuleId: 42,
        penaltyType: "WATER_LATE",
        percentageRate: 12,
        fromDay: 15,
        isActive: "true",
      };
      const result = normalizePenaltyRule(raw);
      expect(result.id).toBe(42);
      expect(result.penaltyCode).toBe("WATER_LATE");
      expect(result.calculationType).toBe("Percentage");
      expect(result.penaltyValue).toBe(12);
      expect(result.gracePeriodDays).toBe(15);
      expect(result.isActive).toBe(true);
    });

    it("throws ApiError if id is invalid", () => {
      expect(() => normalizePenaltyRule({ id: 0 })).toThrow(ApiError);
    });

    it("preserves createdBy and updatedBy as numbers", () => {
      const raw = {
        id: 1,
        penaltyCode: "PEN",
        penaltyName: "Penalty",
        calculationType: "Percentage",
        penaltyValue: 5,
        gracePeriodDays: 10,
        isActive: true,
        createdBy: 10,
        updatedBy: 20,
      };
      const result = normalizePenaltyRule(raw);
      expect(result.createdBy).toBe(10);
      expect(result.updatedBy).toBe(20);
      expect(typeof result.updatedBy).toBe("number");
    });
  });
});
