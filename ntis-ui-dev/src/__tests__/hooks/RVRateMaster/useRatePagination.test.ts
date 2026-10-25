import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRatePagination } from "@/hooks/RVRateMaster/useRatePagination";
import type { IZoneDescription } from "@/types/RVRateMaster";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("useRatePagination", () => {
  const mockZoneDescriptions: IZoneDescription[] = [
    { taxZoneId: 1, zoneNo: "Z1", description: "Zone 1" },
    { taxZoneId: 2, zoneNo: "Z2", description: "Zone 2" },
    { taxZoneId: 3, zoneNo: "Z3", description: "Zone 3" },
    { taxZoneId: 4, zoneNo: "Z4", description: "Zone 4" },
    { taxZoneId: 5, zoneNo: "Z5", description: "Zone 5" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with zone descriptions", () => {
    const { result } = renderHook(() => 
      useRatePagination({ 
        zoneDescriptions: mockZoneDescriptions 
      })
    );

    expect(result.current.matrixPageNumber).toBe(1);
    expect(result.current.matrixPageSize).toBe(100);
    expect(result.current.paginatedZoneDescriptions.length).toBeGreaterThan(0);
  });

  it("should initialize with paginated zones data from server", () => {
    const paginatedZonesData = {
      items: mockZoneDescriptions.slice(0, 2),
      totalPages: 3,
      totalCount: 5,
      pageNumber: 1,
      pageSize: 2,
    };

    const { result } = renderHook(() => 
      useRatePagination({ 
        paginatedZonesData,
        zoneDescriptions: mockZoneDescriptions 
      })
    );

    expect(result.current.matrixPageNumber).toBe(1);
    expect(result.current.matrixPageSize).toBe(2);
    expect(result.current.matrixTotalPages).toBe(3);
    expect(result.current.matrixTotalCount).toBe(5);
    expect(result.current.paginatedZoneDescriptions).toHaveLength(2);
  });

  it("should provide handleMatrixPaginationChange function", () => {
    const { result } = renderHook(() => 
      useRatePagination({ 
        zoneDescriptions: mockZoneDescriptions 
      })
    );

    expect(typeof result.current.handleMatrixPaginationChange).toBe("function");
  });

  it("should update pagination state when handleMatrixPaginationChange is called", () => {
    const { result } = renderHook(() => 
      useRatePagination({ 
        zoneDescriptions: mockZoneDescriptions 
      })
    );

    act(() => {
      result.current.handleMatrixPaginationChange(2, 5);
    });

    expect(result.current.matrixPageNumber).toBe(2);
    expect(result.current.matrixPageSize).toBe(5);
  });

  it("should calculate total pages correctly", () => {
    const paginatedZonesData = {
      items: mockZoneDescriptions.slice(0, 2),
      totalPages: 3,
      totalCount: 5,
      pageNumber: 1,
      pageSize: 2,
    };

    const { result } = renderHook(() => 
      useRatePagination({ 
        paginatedZonesData,
        zoneDescriptions: mockZoneDescriptions 
      })
    );

    expect(result.current.matrixTotalPages).toBe(3);
  });

  it("should update when paginatedZonesData changes", () => {
    const initialData = {
      items: mockZoneDescriptions.slice(0, 2),
      totalPages: 3,
      totalCount: 5,
      pageNumber: 1,
      pageSize: 2,
    };

    const { result, rerender } = renderHook(
      (props) => useRatePagination(props),
      { initialProps: { paginatedZonesData: initialData, zoneDescriptions: mockZoneDescriptions } }
    );

    expect(result.current.matrixPageNumber).toBe(1);

    const updatedData = {
      items: mockZoneDescriptions.slice(2, 4),
      totalPages: 3,
      totalCount: 5,
      pageNumber: 2,
      pageSize: 2,
    };

    rerender({ paginatedZonesData: updatedData, zoneDescriptions: mockZoneDescriptions });

    expect(result.current.matrixPageNumber).toBe(2);
    expect(result.current.paginatedZoneDescriptions).toHaveLength(2);
  });
});
