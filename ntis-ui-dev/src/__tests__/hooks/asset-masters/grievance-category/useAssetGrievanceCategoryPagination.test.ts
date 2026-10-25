import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetGrievanceCategoryPagination } from "@/hooks/asset-masters/grievance-category/useAssetGrievanceCategoryPagination";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("useAssetGrievanceCategoryPagination", () => {
  const defaultProps = {
    pageNumber: 2,
    pageSize: 10,
    totalCount: 25,
    locale: "en",
    currentSearchTerm: "test",
    sortBy: "categoryName",
    sortOrder: "asc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate correct pagination info", () => {
    const { result } = renderHook(() => useAssetGrievanceCategoryPagination(defaultProps));

    expect(result.current.paginationInfo).toEqual({
      start: 11,
      end: 20,
      total: 25,
    });
  });

  it("should trigger navigation on changePage", () => {
    const { result } = renderHook(() => useAssetGrievanceCategoryPagination(defaultProps));

    act(() => {
      result.current.changePage(3);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/en/assets/configuration/master-data/grievance-category-master?page=3&pageSize=10&q=test&sortBy=categoryName&sortOrder=asc"
    );
  });

  it("should trigger navigation with page 1 on handlePageSizeChange", () => {
    const { result } = renderHook(() => useAssetGrievanceCategoryPagination(defaultProps));

    act(() => {
      result.current.handlePageSizeChange("25");
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/en/assets/configuration/master-data/grievance-category-master?page=1&pageSize=25&q=test&sortBy=categoryName&sortOrder=asc"
    );
  });
});
