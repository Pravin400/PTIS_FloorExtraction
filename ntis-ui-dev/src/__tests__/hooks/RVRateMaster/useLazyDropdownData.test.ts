import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLazyDropdownData } from "@/hooks/RVRateMaster/useLazyDropdownData";

// Mock the server actions
vi.mock("@/app/[locale]/property-tax/rate-master/rvratemaster/action", () => ({
  getZoneOptions: vi.fn(),
  getUseGroupOptions: vi.fn(),
  getAssessmentYears: vi.fn(),
}));

import { getZoneOptions, getUseGroupOptions, getAssessmentYears } from "@/app/[locale]/property-tax/rate-master/rvratemaster/action";

describe("useLazyDropdownData", () => {
  const mockZoneOptions = [
    { label: "UTHALSAR", value: "1" },
    { label: "NAUPADA", value: "2" },
  ];

  const mockUseGroupOptions = [
    { label: "Residential", value: "1" },
    { label: "Commercial", value: "2" },
  ];

  const mockAssessmentYears = [
    { label: "1700-1997", value: "1", fromYear: "1700", toYear: "1997" },
    { label: "1998-2010", value: "2", fromYear: "1998", toYear: "2010" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty data and not loading", () => {
    const { result } = renderHook(() => useLazyDropdownData());

    expect(result.current.zoneOptions).toEqual([]);
    expect(result.current.useGroupOptions).toEqual([]);
    expect(result.current.assessmentYears).toEqual([]);
    expect(result.current.isLoadingZones).toBe(false);
    expect(result.current.isLoadingUseGroups).toBe(false);
    expect(result.current.isLoadingAssessmentYears).toBe(false);
  });

  it("should load zone options when loadZoneOptions is called", async () => {
    vi.mocked(getZoneOptions).mockResolvedValue(mockZoneOptions);
    
    const { result } = renderHook(() => useLazyDropdownData());

    expect(result.current.isLoadingZones).toBe(false);
    
    await act(async () => {
      result.current.loadZoneOptions();
    });

    await waitFor(() => {
      expect(result.current.zoneOptions).toEqual(mockZoneOptions);
    });

    expect(getZoneOptions).toHaveBeenCalledTimes(1);
    expect(result.current.isLoadingZones).toBe(false);
  });

  it("should load use group options when loadUseGroupOptions is called", async () => {
    vi.mocked(getUseGroupOptions).mockResolvedValue(mockUseGroupOptions);
    
    const { result } = renderHook(() => useLazyDropdownData());

    await act(async () => {
      result.current.loadUseGroupOptions();
    });

    await waitFor(() => {
      expect(result.current.useGroupOptions).toEqual(mockUseGroupOptions);
    });

    expect(getUseGroupOptions).toHaveBeenCalledTimes(1);
  });

  it("should load assessment years when loadAssessmentYears is called", async () => {
    vi.mocked(getAssessmentYears).mockResolvedValue(mockAssessmentYears);
    
    const { result } = renderHook(() => useLazyDropdownData());

    await act(async () => {
      result.current.loadAssessmentYears();
    });

    await waitFor(() => {
      expect(result.current.assessmentYears).toEqual(mockAssessmentYears);
    });

    expect(getAssessmentYears).toHaveBeenCalledTimes(1);
  });

  it("should not reload zone options if already loaded", async () => {
    vi.mocked(getZoneOptions).mockResolvedValue(mockZoneOptions);
    
    const { result } = renderHook(() => useLazyDropdownData());

    await act(async () => {
      result.current.loadZoneOptions();
    });
    await waitFor(() => {
      expect(result.current.zoneOptions).toEqual(mockZoneOptions);
    });

    // Call again
    await act(async () => {
      result.current.loadZoneOptions();
    });
    
    // Should still only be called once
    expect(getZoneOptions).toHaveBeenCalledTimes(1);
  });

  it("should handle errors gracefully when loading zones fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getZoneOptions).mockRejectedValue(new Error("API Error"));
    
    const { result } = renderHook(() => useLazyDropdownData());

    await act(async () => {
      result.current.loadZoneOptions();
    });

    await waitFor(() => {
      expect(result.current.isLoadingZones).toBe(false);
    });

    expect(result.current.zoneOptions).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Logger] PRODUCTION ERROR:",
      "Failed to load zone options",
      expect.objectContaining({ error: expect.any(Error) })
    );

    consoleErrorSpy.mockRestore();
  });

  it("should handle errors gracefully when loading use groups fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getUseGroupOptions).mockRejectedValue(new Error("API Error"));
    
    const { result } = renderHook(() => useLazyDropdownData());

    await act(async () => {
      result.current.loadUseGroupOptions();
    });

    await waitFor(() => {
      expect(result.current.isLoadingUseGroups).toBe(false);
    });

    expect(result.current.useGroupOptions).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Logger] PRODUCTION ERROR:",
      "Failed to load use group options",
      expect.objectContaining({ error: expect.any(Error) })
    );

    consoleErrorSpy.mockRestore();
  });

  it("should handle errors gracefully when loading assessment years fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(getAssessmentYears).mockRejectedValue(new Error("API Error"));
    
    const { result } = renderHook(() => useLazyDropdownData());

    await act(async () => {
      result.current.loadAssessmentYears();
    });

    await waitFor(() => {
      expect(result.current.isLoadingAssessmentYears).toBe(false);
    });

    expect(result.current.assessmentYears).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[Logger] PRODUCTION ERROR:",
      "Failed to load assessment years",
      expect.objectContaining({ error: expect.any(Error) })
    );

    consoleErrorSpy.mockRestore();
  });

  it("should allow loading all three dropdowns independently", async () => {
    vi.mocked(getZoneOptions).mockResolvedValue(mockZoneOptions);
    vi.mocked(getUseGroupOptions).mockResolvedValue(mockUseGroupOptions);
    vi.mocked(getAssessmentYears).mockResolvedValue(mockAssessmentYears);
    
    const { result } = renderHook(() => useLazyDropdownData());

    // Load all three
    result.current.loadZoneOptions();
    result.current.loadUseGroupOptions();
    result.current.loadAssessmentYears();

    await waitFor(() => {
      expect(result.current.zoneOptions).toEqual(mockZoneOptions);
      expect(result.current.useGroupOptions).toEqual(mockUseGroupOptions);
      expect(result.current.assessmentYears).toEqual(mockAssessmentYears);
    });

    expect(getZoneOptions).toHaveBeenCalledTimes(1);
    expect(getUseGroupOptions).toHaveBeenCalledTimes(1);
    expect(getAssessmentYears).toHaveBeenCalledTimes(1);
  });
});
