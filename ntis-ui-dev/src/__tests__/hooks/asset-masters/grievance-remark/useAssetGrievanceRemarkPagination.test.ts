import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetGrievanceRemarkPagination } from "@/hooks/asset-masters/grievance-remark/useAssetGrievanceRemarkPagination";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("useAssetGrievanceRemarkPagination", () => {
  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 15,
    locale: "mr",
    currentSearchTerm: "remark-test",
    sortBy: "grievanceCategoryId",
    sortOrder: "desc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate correct pagination info", () => {
    const { result } = renderHook(() => useAssetGrievanceRemarkPagination(defaultProps));

    expect(result.current.paginationInfo).toEqual({
      start: 1,
      end: 10,
      total: 15,
    });
  });

  it("should trigger navigation on changePage", () => {
    const { result } = renderHook(() => useAssetGrievanceRemarkPagination(defaultProps));

    act(() => {
      result.current.changePage(2);
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/mr/assets/configuration/master-data/grievance-remark-master?page=2&pageSize=10&q=remark-test&sortBy=grievanceCategoryId&sortOrder=desc"
    );
  });

  it("should reset to page 1 on handlePageSizeChange", () => {
    const { result } = renderHook(() => useAssetGrievanceRemarkPagination(defaultProps));

    act(() => {
      result.current.handlePageSizeChange("50");
    });

    expect(mockPush).toHaveBeenCalledWith(
      "/mr/assets/configuration/master-data/grievance-remark-master?page=1&pageSize=50&q=remark-test&sortBy=grievanceCategoryId&sortOrder=desc"
    );
  });
});
