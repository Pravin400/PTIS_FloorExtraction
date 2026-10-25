import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDesignationPagination } from "@/hooks/asset-masters/designation/useDesignationPagination";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

describe("useDesignationPagination", () => {
  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 100,
    locale: "en",
    currentSearchTerm: "",
    sortBy: "designationCode",
    sortOrder: "asc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildUrl", () => {
    it("should build URL with page and pageSize", () => {
      const { result } = renderHook(() => useDesignationPagination(defaultProps));

      const url = result.current.buildUrl(2, 20);

      expect(url).toContain("/en/assets/configuration/master-data/designation-master");
      expect(url).toContain("page=2");
      expect(url).toContain("pageSize=20");
    });
  });

  describe("changePage", () => {
    it("should navigate to new page", () => {
      const { result } = renderHook(() => useDesignationPagination(defaultProps));

      act(() => {
        result.current.changePage(3);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=3"));
    });
  });
});
