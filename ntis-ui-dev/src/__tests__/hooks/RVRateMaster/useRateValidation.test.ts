import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRateValidation } from "@/hooks/RVRateMaster/useRateValidation";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("useRateValidation", () => {
  const defaultProps = {
    selectedZone: "",
    selectedUseGroup: "",
    assessmentYear: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty errors", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    expect(result.current.errors).toEqual({
      zone: "",
      useGroup: "",
      assessmentYear: "",
    });
  });

  it("should show allFiltersSelected as false when fields are empty", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    expect(result.current.allFiltersSelected).toBe(false);
  });

  it("should show allFiltersSelected as true when all fields are filled", () => {
    const { result } = renderHook(() => useRateValidation({
      selectedZone: "1",
      selectedUseGroup: "1",
      assessmentYear: "2024",
    }));

    expect(result.current.allFiltersSelected).toBe(true);
  });

  it("should validate a field and return error message", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    const error = result.current.validateField("zone", "");

    expect(error).toBe("Please select a rate section");
  });

  it("should return empty string for valid field", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    const error = result.current.validateField("zone", "1");

    expect(error).toBe("");
  });

  it("should validate all fields and return false when invalid", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateAll();
    });

    expect(isValid!).toBe(false);
    expect(result.current.errors.zone).not.toBe("");
    expect(result.current.errors.useGroup).not.toBe("");
    expect(result.current.errors.assessmentYear).not.toBe("");
  });

  it("should validate all fields and return true when valid", () => {
    const { result } = renderHook(() => useRateValidation({
      selectedZone: "1",
      selectedUseGroup: "1",
      assessmentYear: "2024",
    }));

    let isValid: boolean;
    act(() => {
      isValid = result.current.validateAll();
    });

    expect(isValid!).toBe(true);
  });

  it("should clear a specific error", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    // First validate to set errors
    act(() => {
      result.current.validateAll();
    });

    expect(result.current.errors.zone).not.toBe("");

    // Clear the zone error
    act(() => {
      result.current.clearError("zone");
    });

    expect(result.current.errors.zone).toBe("");
  });

  it("should clear all errors", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    // First validate to set errors
    act(() => {
      result.current.validateAll();
    });

    expect(result.current.errors.zone).not.toBe("");

    // Clear all errors
    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.errors).toEqual({
      zone: "",
      useGroup: "",
      assessmentYear: "",
    });
  });

  it("should track existing rate found state", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    expect(result.current.existingRateFound).toBe(false);

    act(() => {
      result.current.setExistingRateFound(true);
    });

    expect(result.current.existingRateFound).toBe(true);
  });

  it("should track checking rates state", () => {
    const { result } = renderHook(() => useRateValidation(defaultProps));

    expect(result.current.isCheckingRates).toBe(false);

    act(() => {
      result.current.setIsCheckingRates(true);
    });

    expect(result.current.isCheckingRates).toBe(true);
  });

  it("should initialize with existing rate check when provided", () => {
    const { result } = renderHook(() => useRateValidation({
      ...defaultProps,
      initialExistingRatesCheck: true,
    }));

    expect(result.current.existingRateFound).toBe(true);
  });
});
