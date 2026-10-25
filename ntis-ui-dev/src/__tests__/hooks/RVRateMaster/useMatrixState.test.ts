import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMatrixState } from "@/hooks/RVRateMaster/useMatrixState";

describe("useMatrixState", () => {
  const mockRateCategories = [
    { constructionId: "1", constructionCode: "RCC", description: "RCC Building" },
    { constructionId: "2", constructionCode: "LOAD", description: "Load Bearing" },
    { constructionId: "3", constructionCode: "MUD", description: "Mud Building" },
  ];

  const mockZoneDescriptions = [
    { taxZoneId: 1, zoneNo: "Z1", description: "Zone 1" },
    { taxZoneId: 2, zoneNo: "Z2", description: "Zone 2" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate filled rates count correctly for empty edits", () => {
    const { result } = renderHook(() =>
      useMatrixState({
        allZones: mockZoneDescriptions,
        rateCategories: mockRateCategories,
        paginatedZoneDescriptions: mockZoneDescriptions,
        allZoneEdits: {},
      })
    );

    expect(result.current.filledRatesCount).toBe(0);
    expect(result.current.totalPossibleRates).toBe(6); // 2 zones * 3 categories
    expect(result.current.completionPercentage).toBe(0);
  });

  it("should calculate filled rates count correctly with zone edits", () => {
    const { result } = renderHook(() =>
      useMatrixState({
        allZones: mockZoneDescriptions,
        rateCategories: mockRateCategories,
        paginatedZoneDescriptions: mockZoneDescriptions,
        allZoneEdits: {
          "Z1": { "RCC": 100, "LOAD": 80 },
          "Z2": { "MUD": 50 },
        },
      })
    );

    expect(result.current.filledRatesCount).toBe(3); // RCC and LOAD in Z1, MUD in Z2
    expect(result.current.totalPossibleRates).toBe(6);
    expect(result.current.completionPercentage).toBe(50);
  });

  it("should calculate completion percentage correctly", () => {
    const { result } = renderHook(() =>
      useMatrixState({
        allZones: mockZoneDescriptions,
        rateCategories: mockRateCategories,
        paginatedZoneDescriptions: mockZoneDescriptions,
        allZoneEdits: {
          "Z1": { "RCC": 100, "LOAD": 80, "MUD": 50 },
          "Z2": { "RCC": 90, "LOAD": 70, "MUD": 40 },
        },
      })
    );

    expect(result.current.filledRatesCount).toBe(6);
    expect(result.current.completionPercentage).toBe(100);
  });

  it("should count zero values as filled rates if present in edits", () => {
    const { result } = renderHook(() =>
      useMatrixState({
        allZones: mockZoneDescriptions,
        rateCategories: mockRateCategories,
        paginatedZoneDescriptions: mockZoneDescriptions,
        allZoneEdits: {
          "Z1": { "RCC": 0, "LOAD": 80, "MUD": 0 },
        },
      })
    );

    // RCC, LOAD, and MUD are all present in edits (even though two are 0)
    expect(result.current.filledRatesCount).toBe(3);
  });

  it("should build complete matrix for submission", () => {
    const { result } = renderHook(() =>
      useMatrixState({
        allZones: mockZoneDescriptions,
        rateCategories: mockRateCategories,
        paginatedZoneDescriptions: mockZoneDescriptions,
        allZoneEdits: {
          "Z1": { "RCC": 100, "LOAD": 80 },
        },
      })
    );

    const matrix = result.current.buildCompleteMatrixForSubmission();
    
    expect(matrix).toHaveLength(2);
    expect(matrix[0].zoneNo).toBe("Z1");
    expect(matrix[0]["RCC"]).toBe(100);
    expect(matrix[0]["LOAD"]).toBe(80);
  });
});
