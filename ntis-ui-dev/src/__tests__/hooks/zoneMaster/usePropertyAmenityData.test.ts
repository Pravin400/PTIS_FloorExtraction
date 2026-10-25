import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyAmenityData } from "@/components/modules/property-tax/zone-master/properties/components/hooks/usePropertyAmenityData";
import {
  fetchSocietyDetailsByPropertyAction,
  getSocietyAmenityDetailsAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";

// Mock actions
vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  fetchSocietyDetailsByPropertyAction: vi.fn(),
  getSocietyAmenityDetailsAction: vi.fn(),
}));

describe("usePropertyAmenityData", () => {
  const mockWings = [
    {
      id: 10,
      propertyId: 1,
      wingId: 1,
      wingName: "Wing AAA",
    },
    {
      id: 11,
      propertyId: 1,
      wingId: null,
      wingName: "Building Society",
    },
    {
      id: 12,
      propertyId: 1,
      wingId: undefined,
      wingName: "Wing BBB",
    },
    {
      id: 13,
      propertyId: 1,
      wingId: 3,
      wingName: "Wing CCC",
    },
    {
      id: 14,
      propertyId: 1,
      wingId: 2,
      wingName: null,
    },
    {
      id: 15,
      propertyId: 1,
      wingId: 0,
      wingName: "Wing Zero",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSocietyAmenityDetailsAction).mockResolvedValue({
      success: true,
      data: [],
    });
  });

  it("should format wingOptions from valid wing ids", async () => {
    vi.mocked(fetchSocietyDetailsByPropertyAction).mockResolvedValue({
      success: true,
      data: {
        items: mockWings as unknown as SocietyDetailItem[],
        totalCount: mockWings.length,
        pageSize: 10,
        pageNumber: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    const { result } = renderHook(() => usePropertyAmenityData({ propertyId: "1" }));

    await waitFor(() => {
      expect(result.current.wingsLoading).toBe(false);
    });

    expect(fetchSocietyDetailsByPropertyAction).toHaveBeenCalledWith(1);
    expect(result.current.wingOptions).toEqual([
      { label: "1 - Wing AAA", value: "1" },
      { label: "3 - Wing CCC", value: "3" },
      { label: "2", value: "2" },
    ]);
    expect(result.current.shouldShowWingDropdown).toBe(true);
    expect(result.current.filteredProperties).toEqual([]);

    act(() => {
      result.current.setSelectedWingId("2");
    });

    expect(result.current.filteredProperties).toEqual([mockWings[4]]);
    expect(result.current.selectedSocietyDetailId).toBe(14);
  });

  it("does not require wing selection when all wing ids are null, undefined, or zero", async () => {
    const societyDetails = [
      {
        id: 20,
        propertyId: 1,
        wingId: null,
        wingName: "Building Society",
      },
      {
        id: 21,
        propertyId: 1,
        wingId: undefined,
        wingName: "No Wing",
      },
      {
        id: 22,
        propertyId: 1,
        wingId: 0,
        wingName: "Zero Wing",
      },
    ];

    vi.mocked(fetchSocietyDetailsByPropertyAction).mockResolvedValue({
      success: true,
      data: {
        items: societyDetails as unknown as SocietyDetailItem[],
        totalCount: societyDetails.length,
        pageSize: 10,
        pageNumber: 1,
        totalPages: 1,
        hasNext: false,
        hasPrevious: false,
      },
    });

    const { result } = renderHook(() => usePropertyAmenityData({ propertyId: "1" }));

    await waitFor(() => {
      expect(result.current.wingsLoading).toBe(false);
    });

    expect(result.current.shouldShowWingDropdown).toBe(false);
    expect(result.current.filteredProperties).toEqual(societyDetails);
    expect(result.current.selectedSocietyDetailId).toBe(20);
  });
});
