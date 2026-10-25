import { describe, it, expect } from "vitest";
import {
  validateid,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  getDeleteErrorStatusCode,
  createApiError,
} from "@/lib/api/water-bill/penalty-rule-master/penalty-rule-validation";
import { ApiError } from "@/lib/utils/api";
import type { PenaltyRuleFormModel } from "@/types/water-bill/penalty-rule-master.types";

describe("penalty-rule-validation", () => {
  describe("validateid", () => {
    it("returns true for positive integers", () => {
      expect(validateid(1)).toBe(true);
      expect(validateid(100)).toBe(true);
    });

    it("returns false for non-positive or non-finite numbers", () => {
      expect(validateid(0)).toBe(false);
      expect(validateid(-1)).toBe(false);
      expect(validateid(NaN)).toBe(false);
    });
  });

  describe("validateAndPrepareSearchTerm", () => {
    it("trims and truncates long search terms", () => {
      expect(validateAndPrepareSearchTerm("  hello  ")).toBe("hello");
      expect(validateAndPrepareSearchTerm("")).toBeUndefined();
      expect(validateAndPrepareSearchTerm(undefined)).toBeUndefined();
      expect(validateAndPrepareSearchTerm("a".repeat(150))?.length).toBe(100);
    });
  });

  describe("validateCreateFormData", () => {
    const validData: PenaltyRuleFormModel = {
      penaltyCode: "LATE_01",
      penaltyName: "Late Payment",
      calculationType: "Percentage",
      penaltyValue: 5,
      gracePeriodDays: 10,
      isActive: true,
    };

    it("does not throw for valid create data", () => {
      expect(() => validateCreateFormData(validData)).not.toThrow();
    });

    it("throws ApiError if penaltyCode is missing", () => {
      expect(() => validateCreateFormData({ ...validData, penaltyCode: "" })).toThrow(ApiError);
    });

    it("throws ApiError if penaltyName is missing", () => {
      expect(() => validateCreateFormData({ ...validData, penaltyName: "" })).toThrow(ApiError);
    });

    it("throws ApiError if calculationType is invalid", () => {
      expect(() => validateCreateFormData({ ...validData, calculationType: "Invalid" })).toThrow(ApiError);
    });

    it("throws ApiError if penaltyValue is negative or exceeds percentage limit", () => {
      expect(() => validateCreateFormData({ ...validData, penaltyValue: -5 })).toThrow(ApiError);
      expect(() => validateCreateFormData({ ...validData, penaltyValue: 1000 })).toThrow(ApiError);
    });

    it("throws ApiError if gracePeriodDays is invalid", () => {
      expect(() => validateCreateFormData({ ...validData, gracePeriodDays: -1 })).toThrow(ApiError);
      expect(() => validateCreateFormData({ ...validData, gracePeriodDays: 101 })).toThrow(ApiError);
    });

    it("accepts fromDay exceeding 100 days for overdue rule tiers (e.g., 180 or 365 days)", () => {
      expect(() => validateCreateFormData({ ...validData, fromDay: 180, gracePeriodDays: undefined })).not.toThrow();
      expect(() => validateCreateFormData({ ...validData, fromDay: 365, toDay: 730, gracePeriodDays: undefined })).not.toThrow();
    });

    it("throws ApiError if fromDay is negative or not an integer", () => {
      expect(() => validateCreateFormData({ ...validData, fromDay: -1, gracePeriodDays: undefined })).toThrow(ApiError);
      expect(() => validateCreateFormData({ ...validData, fromDay: 10.5, gracePeriodDays: undefined })).toThrow(ApiError);
    });

    it("throws ApiError if toDay is less than fromDay", () => {
      expect(() => validateCreateFormData({ ...validData, fromDay: 180, toDay: 90, gracePeriodDays: undefined })).toThrow(ApiError);
    });
  });

  describe("validateUpdateFormData", () => {
    it("throws ApiError if id is missing or invalid", () => {
      const data: PenaltyRuleFormModel = {
        penaltyCode: "LATE_01",
        penaltyName: "Late Payment",
        calculationType: "Percentage",
        penaltyValue: 5,
        gracePeriodDays: 10,
        isActive: true,
      };
      expect(() => validateUpdateFormData(data)).toThrow(ApiError);
      expect(() => validateUpdateFormData({ ...data, id: 0 })).toThrow(ApiError);
    });
  });

  describe("getDeleteErrorStatusCode", () => {
    it("identifies 404 and 409 error statuses", () => {
      expect(getDeleteErrorStatusCode("Record not found")).toBe(404);
      expect(getDeleteErrorStatusCode("Penalty rule is in use")).toBe(409);
      expect(getDeleteErrorStatusCode("Other error")).toBe(500);
    });
  });

  describe("createApiError", () => {
    it("handles duplicates as 409", () => {
      const err = createApiError(undefined, "Penalty rule already exists");
      expect(err.statusCode).toBe(409);
    });
  });
});
