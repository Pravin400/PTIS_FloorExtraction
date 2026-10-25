import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDepreciationValidation } from "@/hooks/useDepreciationValidation";

// Mock translation function
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    "errors.minMax": "Please enter both min and max",
    "errors.mustBeNumber": "Must be a valid number",
    "errors.invalidRange": "Min must be less than max",
    "errors.cannotBeNegative": "Cannot be negative",
    "errors.mustBe999OrLess": "Must be 999 or less",
    "errors.mustBe99OrLess": "Must be 99 or less",
  };
  return translations[key] || key;
});

describe("useDepreciationValidation", () => {
  beforeEach(() => {
    mockT.mockClear();
  });

  describe("validateMinMax - Client-side validation only", () => {
    it("should return valid for a correct range", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("11", "19");

      expect(validation.valid).toBe(true);
      expect(validation.minError).toBeNull();
      expect(validation.maxError).toBeNull();
    });

    it("should return error when min is empty", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("", "10");

      expect(validation.valid).toBe(false);
      expect(validation.minError).toBe("Please enter both min and max");
    });

    it("should return error when max is empty", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("5", "");

      expect(validation.valid).toBe(false);
      expect(validation.maxError).toBe("Please enter both min and max");
    });

    it("should return error when both min and max are empty", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("", "");

      expect(validation.valid).toBe(false);
      expect(validation.minError).toBe("Please enter both min and max");
      expect(validation.maxError).toBe("Please enter both min and max");
    });

    it("should return error when min is not a number", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("abc", "10");

      expect(validation.valid).toBe(false);
      expect(validation.minError).toBe("Must be a valid number");
    });

    it("should return error when max is not a number", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("5", "xyz");

      expect(validation.valid).toBe(false);
      expect(validation.maxError).toBe("Must be a valid number");
    });

    it("should return error when min is negative", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("-5", "10");

      expect(validation.valid).toBe(false);
      expect(validation.minError).toBe("Cannot be negative");
    });

    it("should return error when max is negative", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("5", "-10");

      expect(validation.valid).toBe(false);
      expect(validation.maxError).toBe("Cannot be negative");
    });

    it("should return error when min is greater than max", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("20", "10");

      expect(validation.valid).toBe(false);
      expect(validation.maxError).toBe("Min must be less than max");
    });

    it("should return error when min equals max", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("10", "10");

      expect(validation.valid).toBe(false);
      expect(validation.maxError).toBe("Min must be less than max");
    });

    it("should return error when min exceeds 999", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("1000", "1500");

      expect(validation.valid).toBe(false);
      expect(validation.minError).toBe("Must be 999 or less");
    });

    it("should return error when max exceeds 999", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("10", "1000");

      expect(validation.valid).toBe(false);
      expect(validation.maxError).toBe("Must be 999 or less");
    });

    it("should accept max value of exactly 999", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("0", "999");

      expect(validation.valid).toBe(true);
      expect(validation.maxError).toBeNull();
    });

    it("should accept valid range within 0–999", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("0", "500");

      expect(validation.valid).toBe(true);
      expect(validation.minError).toBeNull();
      expect(validation.maxError).toBeNull();
    });

    it("should accept valid range format even when overlap check is pending", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const validation = result.current.validateMinMax("5", "10");

      expect(validation.valid).toBe(true);
      expect(validation.minError).toBeNull();
      expect(validation.maxError).toBeNull();
    });
  });

  describe("checkOverlap - Returns conflicting range or null", () => {
    it("should return the conflicting range when fully contained", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(3, 5, existing)).toEqual({ min: 2, max: 6 });
    });

    it("should return the conflicting range on a left-side overlap", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(1, 4, existing)).toEqual({ min: 2, max: 6 });
    });

    it("should return the conflicting range on a right-side overlap", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(5, 8, existing)).toEqual({ min: 2, max: 6 });
    });

    it("should return the conflicting range when new range contains an existing range", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(1, 9, existing)).toEqual({ min: 2, max: 6 });
    });

    it("should return the conflicting range for an exact duplicate", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(2, 6, existing)).toEqual({ min: 2, max: 6 });
    });

    it("should return the conflicting range when boundary is shared (inclusive)", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(6, 10, existing)).toEqual({ min: 2, max: 6 });
    });

    it("should return null for a range with no shared boundary", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(7, 10, existing)).toBeNull();
    });

    it("should return null for a range entirely below existing range", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 2, max: 6 }];
      expect(result.current.checkOverlap(0, 1, existing)).toBeNull();
    });

    it("should return null when there are no existing ranges", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      expect(result.current.checkOverlap(2, 6, [])).toBeNull();
    });

    it("should return the correct conflicting range from a list of multiple ranges", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));
      const existing = [{ min: 0, max: 5 }, { min: 11, max: 20 }];
      expect(result.current.checkOverlap(15, 25, existing)).toEqual({ min: 11, max: 20 });
    });
  });

  describe("sanitizeInput", () => {
    it("should remove non-digit characters and limit to 3 chars", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));

      expect(result.current.sanitizeInput("abc123")).toBe("123");
      expect(result.current.sanitizeInput("12.34")).toBe("123");
      expect(result.current.sanitizeInput("-50")).toBe("50");
      expect(result.current.sanitizeInput("1a2b3c")).toBe("123");
    });

    it("should limit input to 3 characters", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));

      expect(result.current.sanitizeInput("1234")).toBe("123");
      expect(result.current.sanitizeInput("123456789")).toBe("123");
    });

    it("should return empty string for non-numeric input", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));

      expect(result.current.sanitizeInput("abc")).toBe("");
      expect(result.current.sanitizeInput("!@#$")).toBe("");
    });

    it("should handle empty input", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));

      expect(result.current.sanitizeInput("")).toBe("");
    });

    it("should preserve valid numeric input up to 3 digits", () => {
      const { result } = renderHook(() => useDepreciationValidation(mockT));

      expect(result.current.sanitizeInput("999")).toBe("999");
      expect(result.current.sanitizeInput("0")).toBe("0");
      expect(result.current.sanitizeInput("100")).toBe("100");
    });
  });
});
