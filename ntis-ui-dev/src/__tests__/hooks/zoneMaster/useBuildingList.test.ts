import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBuildingList } from "@/hooks/zoneMaster/useBuildingList";
import { getBuildingListByWardAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { BuildingListItem } from "@/types/zone-master/properties/building-list.types";

// Mock dependencies
vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  getBuildingListByWardAction: vi.fn(),
}));

describe("useBuildingList", () => {
  const mockBuildingList: BuildingListItem[] = [
    {
      propertyId: 1,
      wardNo: "W1",
      propertyNo: "P001",
      catPropertyCategoryName: "Residential",
      partitionNo: "0",
    },
    {
      propertyId: 2,
      wardNo: "W1",
      propertyNo: "P002",
      catPropertyCategoryName: "Commercial",
      partitionNo: "1",
    },
    {
      propertyId: 3,
      wardNo: "W1",
      propertyNo: "P003",
      catPropertyCategoryName: "Apartment",
      partitionNo: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty state", () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useBuildingList({ wardId: null }));

    expect(result.current.buildingList).toEqual([]);
    expect(result.current.loadingBuildingList).toBe(false);
    expect(result.current.buildingListError).toBeNull();
  });

  it("should not fetch when wardId is null", () => {
    const { result } = renderHook(() => useBuildingList({ wardId: null }));

    expect(getBuildingListByWardAction).not.toHaveBeenCalled();
    expect(result.current.buildingList).toEqual([]);
    expect(result.current.loadingBuildingList).toBe(false);
    expect(result.current.buildingListError).toBeNull();
  });

  it("should not fetch when wardId is undefined", () => {
    const { result } = renderHook(() => useBuildingList({ wardId: undefined }));

    expect(getBuildingListByWardAction).not.toHaveBeenCalled();
    expect(result.current.buildingList).toEqual([]);
    expect(result.current.loadingBuildingList).toBe(false);
    expect(result.current.buildingListError).toBeNull();
  });

  it("should not fetch when wardId is 0 or negative", () => {
    const { result: result1 } = renderHook(() => useBuildingList({ wardId: 0 }));
    expect(getBuildingListByWardAction).not.toHaveBeenCalled();
    expect(result1.current.buildingList).toEqual([]);

    const { result: result2 } = renderHook(() => useBuildingList({ wardId: -1 }));
    expect(getBuildingListByWardAction).not.toHaveBeenCalled();
    expect(result2.current.buildingList).toEqual([]);
  });

  it("should fetch building list successfully when wardId is provided", async () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: mockBuildingList,
    });

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    expect(result.current.loadingBuildingList).toBe(true);

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(getBuildingListByWardAction).toHaveBeenCalledWith(1);
    expect(result.current.buildingList).toEqual(mockBuildingList);
    expect(result.current.buildingListError).toBeNull();
  });

  it("should handle empty building list response", async () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(result.current.buildingList).toEqual([]);
    expect(result.current.buildingListError).toBeNull();
  });

  it("should handle API error response", async () => {
    const errorMessage = "Failed to fetch buildings";
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(result.current.buildingList).toEqual([]);
    expect(result.current.buildingListError).toBe(errorMessage);
  });

  it("should handle API error without custom message", async () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: false,
    });

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(result.current.buildingList).toEqual([]);
    expect(result.current.buildingListError).toBe("Failed to fetch building list");
  });

  it("should handle thrown errors", async () => {
    const thrownError = new Error("Network error");
    vi.mocked(getBuildingListByWardAction).mockRejectedValue(thrownError);

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(result.current.buildingList).toEqual([]);
    expect(result.current.buildingListError).toBe("Network error");
  });

  it("should handle non-Error thrown objects", async () => {
    vi.mocked(getBuildingListByWardAction).mockRejectedValue("String error");

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(result.current.buildingList).toEqual([]);
    expect(result.current.buildingListError).toBe("Failed to fetch building list");
  });

  it("should refetch building list when wardId changes", async () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: mockBuildingList,
    });

    const { result, rerender } = renderHook(
      ({ wardId }) => useBuildingList({ wardId }),
      { initialProps: { wardId: 1 } }
    );

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(getBuildingListByWardAction).toHaveBeenCalledTimes(1);
    expect(getBuildingListByWardAction).toHaveBeenCalledWith(1);

    // Change wardId
    const newMockData: BuildingListItem[] = [
      {
        propertyId: 4,
        wardNo: "W2",
        propertyNo: "P004",
        catPropertyCategoryName: "Industrial",
        partitionNo: "0",
      },
    ];

    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: newMockData,
    });

    rerender({ wardId: 2 });

    await waitFor(() => {
      expect(result.current.buildingList).toEqual(newMockData);
    });

    expect(getBuildingListByWardAction).toHaveBeenCalledTimes(2);
    expect(getBuildingListByWardAction).toHaveBeenCalledWith(2);
  });

  it("should clear building list when wardId changes to null", async () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: mockBuildingList,
    });

    const { result, rerender } = renderHook(
      ({ wardId }: { wardId: number | null }) => useBuildingList({ wardId }),
      { initialProps: { wardId: 1 as number | null } }
    );

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(result.current.buildingList).toEqual(mockBuildingList);

    // Change to null
    rerender({ wardId: null });

    expect(result.current.buildingList).toEqual([]);
    expect(result.current.buildingListError).toBeNull();
  });

  it("should manually refetch building list using refetchBuildingList", async () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: mockBuildingList,
    });

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(getBuildingListByWardAction).toHaveBeenCalledTimes(1);

    // Manually refetch
    const newMockData: BuildingListItem[] = [
      ...mockBuildingList,
      {
        propertyId: 5,
        wardNo: "W1",
        propertyNo: "P005",
        catPropertyCategoryName: "Mixed Use",
        partitionNo: "2",
      },
    ];

    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: newMockData,
    });

    await result.current.refetchBuildingList();

    await waitFor(() => {
      expect(result.current.buildingList).toEqual(newMockData);
    });

    expect(getBuildingListByWardAction).toHaveBeenCalledTimes(2);
  });

  it("should handle loading state correctly during fetch", async () => {
    let resolvePromise: (value: { success: boolean; data?: BuildingListItem[] }) => void;
    const promise = new Promise<{ success: boolean; data?: BuildingListItem[] }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(getBuildingListByWardAction).mockReturnValue(promise);

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    // Should be loading
    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(true);
    });

    // Resolve the promise
    resolvePromise!({
      success: true,
      data: mockBuildingList,
    });

    // Should finish loading
    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    expect(result.current.buildingList).toEqual(mockBuildingList);
  });

  it("should clear error when refetching after error", async () => {
    // First call returns error
    vi.mocked(getBuildingListByWardAction).mockResolvedValueOnce({
      success: false,
      error: "Initial error",
    });

    const { result } = renderHook(() => useBuildingList({ wardId: 1 }));

    await waitFor(() => {
      expect(result.current.buildingListError).toBe("Initial error");
    });

    // Second call succeeds
    vi.mocked(getBuildingListByWardAction).mockResolvedValueOnce({
      success: true,
      data: mockBuildingList,
    });

    await result.current.refetchBuildingList();

    await waitFor(() => {
      expect(result.current.buildingListError).toBeNull();
      expect(result.current.buildingList).toEqual(mockBuildingList);
    });
  });

  it("should handle concurrent wardId changes correctly", async () => {
    vi.mocked(getBuildingListByWardAction).mockResolvedValue({
      success: true,
      data: mockBuildingList,
    });

    const { result, rerender } = renderHook(
      ({ wardId }) => useBuildingList({ wardId }),
      { initialProps: { wardId: 1 } }
    );

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    // Quickly change wardId multiple times
    rerender({ wardId: 2 });
    rerender({ wardId: 3 });
    rerender({ wardId: 4 });

    await waitFor(() => {
      expect(result.current.loadingBuildingList).toBe(false);
    });

    // Should be called for the last wardId
    expect(getBuildingListByWardAction).toHaveBeenLastCalledWith(4);
  });

  it("should provide refetchBuildingList function", () => {
    const { result } = renderHook(() => useBuildingList({ wardId: null }));

    expect(typeof result.current.refetchBuildingList).toBe("function");
  });
});
