import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useWardRateSectionLabel } from "@/hooks/rateSectionMaster/useWardRateSectionLabel";
import { RateItem, SectionItem } from "@/types/rateSectionMaster.types";

describe("useWardRateSectionLabel", () => {
  const mockRates: RateItem[] = [
    {
      id: 1,
      rateSectionNo: "RS1",
      description: "Rate Section One",
      isActive: true,
    },
    {
      id: 2,
      rateSectionNo: "RS2",
      description: "Rate Section Two",
      isActive: true,
    },
    {
      id: 3,
      rateSectionNo: "RS3",
      description: "",
      isActive: true,
    },
  ];

  const mockSections: SectionItem[] = [
    {
      rateSectionDetailsId: 1,
      wardNo: "W1",
      rateSectionId: 1,
      rateSectionNo: "RS1",
      description: "Rate Section One",
    },
  ];

  const defaultParams = {
    selectedRateSection: null,
    propSelectedRateSectionLabel: undefined,
    rates: mockRates,
    sections: [],
  };

  describe("label generation", () => {
    it("should return null when no rate section is selected", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel(defaultParams)
      );

      expect(result.current.rateSectionLabel).toBeNull();
      expect(result.current.effectiveSelectedRateSection).toBeNull();
    });

    it("should use propSelectedRateSectionLabel when provided", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          propSelectedRateSectionLabel: "Custom Label",
        })
      );

      expect(result.current.rateSectionLabel).toBe("Custom Label");
    });

    it("should generate label from rates with description", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
        })
      );

      expect(result.current.rateSectionLabel).toBe("Rate Section One");
    });

    it("should return rateSectionNo when description is missing", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS3",
        })
      );

      expect(result.current.rateSectionLabel).toBe("RS3");
    });

    it("should fallback to sections when rate not found", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          rates: [],
          sections: mockSections,
        })
      );

      expect(result.current.rateSectionLabel).toBe("Rate Section One");
    });

    it("should fallback to selectedRateSection when not found anywhere", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "UNKNOWN",
          rates: [],
          sections: [],
        })
      );

      expect(result.current.rateSectionLabel).toBe("UNKNOWN");
    });

    it("should handle sections without description", () => {
      const sectionsWithoutDesc: SectionItem[] = [
        {
          rateSectionDetailsId: 1,
          wardNo: "W1",
          rateSectionId: 1,
          rateSectionNo: "RS5",
        },
      ];

      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS5",
          rates: [],
          sections: sectionsWithoutDesc,
        })
      );

      expect(result.current.rateSectionLabel).toBe("RS5");
    });
  });

  describe("rate section existence check", () => {
    it("should indicate rate section exists when found in rates", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
        })
      );

      expect(result.current.effectiveSelectedRateSection).toBe("RS1");
    });

    it("should indicate rate section exists when sections are present", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          rates: [],
          sections: mockSections,
        })
      );

      expect(result.current.effectiveSelectedRateSection).toBe("RS1");
    });

    it("should indicate rate section exists when prop label is provided", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          propSelectedRateSectionLabel: "Custom",
          rates: [],
          sections: [],
        })
      );

      expect(result.current.effectiveSelectedRateSection).toBe("RS1");
    });

    it("should return null for effective selection when not found", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "UNKNOWN",
          rates: [],
          sections: [],
        })
      );

      expect(result.current.effectiveSelectedRateSection).toBeNull();
    });

    it("should return null when selectedRateSection is null", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel(defaultParams)
      );

      expect(result.current.effectiveSelectedRateSection).toBeNull();
    });
  });

  describe("memoization", () => {
    it("should only recalculate when dependencies change", () => {
      const { result, rerender } = renderHook(
        ({ selectedRateSection }) =>
          useWardRateSectionLabel({
            ...defaultParams,
            selectedRateSection,
          }),
        { initialProps: { selectedRateSection: "RS1" } }
      );

      const firstLabel = result.current.rateSectionLabel;

      // Rerender with same props
      rerender({ selectedRateSection: "RS1" });

      // Should be same reference (memoized)
      expect(result.current.rateSectionLabel).toBe(firstLabel);
    });

    it("should recalculate when selectedRateSection changes", () => {
      const { result, rerender } = renderHook(
        ({ selectedRateSection }) =>
          useWardRateSectionLabel({
            ...defaultParams,
            selectedRateSection,
          }),
        { initialProps: { selectedRateSection: "RS1" } }
      );

      expect(result.current.rateSectionLabel).toBe("Rate Section One");

      rerender({ selectedRateSection: "RS2" });

      expect(result.current.rateSectionLabel).toBe("Rate Section Two");
    });

    it("should recalculate when rates change", () => {
      const { result, rerender } = renderHook(
        ({ rates }) =>
          useWardRateSectionLabel({
            ...defaultParams,
            selectedRateSection: "RS1",
            rates,
          }),
        { initialProps: { rates: mockRates } }
      );

      expect(result.current.rateSectionLabel).toBe("Rate Section One");

      const newRates: RateItem[] = [
        {
          id: 1,
          rateSectionNo: "RS1",
          description: "Updated Description",
          isActive: true,
        },
      ];

      rerender({ rates: newRates });

      expect(result.current.rateSectionLabel).toBe("Updated Description");
    });

    it("should recalculate when propSelectedRateSectionLabel changes", () => {
      const { result, rerender } = renderHook(
        ({ propSelectedRateSectionLabel }: { propSelectedRateSectionLabel?: string }) =>
          useWardRateSectionLabel({
            ...defaultParams,
            selectedRateSection: "RS1",
            propSelectedRateSectionLabel,
          }),
        { initialProps: { propSelectedRateSectionLabel: undefined as string | undefined } }
      );

      expect(result.current.rateSectionLabel).toBe("Rate Section One");

      rerender({ propSelectedRateSectionLabel: "Override Label" as string | undefined });

      expect(result.current.rateSectionLabel).toBe("Override Label");
    });
  });

  describe("edge cases", () => {
    it("should handle empty rates array", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          rates: [],
        })
      );

      expect(result.current.rateSectionLabel).toBe("RS1");
    });

    it("should handle empty sections array", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          rates: [],
          sections: [],
        })
      );

      expect(result.current.rateSectionLabel).toBe("RS1");
    });

    it("should handle empty string as selectedRateSection", () => {
      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "",
        })
      );

      expect(result.current.rateSectionLabel).toBeNull();
      expect(result.current.effectiveSelectedRateSection).toBeNull();
    });

    it("should handle rate with null rateSectionNo", () => {
      const ratesWithNull: RateItem[] = [
        {
          id: 1,
          rateSectionNo: undefined,
          description: "No Code",
          isActive: true,
        },
      ];

      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          rates: ratesWithNull,
        })
      );

      expect(result.current.rateSectionLabel).toBe("RS1");
    });

    it("should prioritize rates over sections", () => {
      const conflictingSections: SectionItem[] = [
        {
          rateSectionDetailsId: 1,
          wardNo: "W1",
          rateSectionId: 1,
          rateSectionNo: "RS1",
          description: "Section Description",
        },
      ];

      const { result } = renderHook(() =>
        useWardRateSectionLabel({
          ...defaultParams,
          selectedRateSection: "RS1",
          sections: conflictingSections,
        })
      );

      // Should use rates description, not sections
      expect(result.current.rateSectionLabel).toBe("Rate Section One");
    });
  });
});
