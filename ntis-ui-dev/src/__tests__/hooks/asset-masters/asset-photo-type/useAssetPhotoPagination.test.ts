
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetPhotoPagination } from "@/hooks/asset-masters/assetphototype/useAssetPhotoPagination";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

describe("useAssetPhotoPagination", () => {
  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 100,
    locale: "en",
    currentSearchTerm: "",
    sortBy: "photoTypeCode",
    sortOrder: "asc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildUrl", () => {
    it("should build URL with page and pageSize", () => {
      const { result } = renderHook(() => useAssetPhotoPagination(defaultProps));

      const url = result.current.buildUrl(2, 20);

      expect(url).toContain("/en/assets/configuration/master-data/asset-photo-type");
      expect(url).toContain("page=2");
      expect(url).toContain("pageSize=20");
    });

    it("should include search term in URL when provided", () => {
      const { result } = renderHook(() => useAssetPhotoPagination(defaultProps));

      const url = result.current.buildUrl(1, 10, "test search");

      expect(url).toMatch(/q=test(\+|%20)search/);
    });

    it("should include sort parameters when provided", () => {
      const { result } = renderHook(() => useAssetPhotoPagination(defaultProps));

      const url = result.current.buildUrl(1, 10, undefined, "type", "desc");

      expect(url).toContain("sortBy=type");
      expect(url).toContain("sortOrder=desc");
    });
  });

  describe("changePage", () => {
    it("should navigate to new page", () => {
      const { result } = renderHook(() => useAssetPhotoPagination(defaultProps));

      act(() => {
        result.current.changePage(3);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=3"));
    });
  });

  describe("handlePageSizeChange", () => {
    it("should reset page to 1 and navigate with new page size", () => {
      const { result } = renderHook(() => useAssetPhotoPagination(defaultProps));

      act(() => {
        result.current.handlePageSizeChange("25");
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageSize=25"));
    });
  });

  describe("paginationInfo", () => {
    it("should calculate correct start, end, and total when totalCount > 0", () => {
      const { result } = renderHook(() =>
        useAssetPhotoPagination({
          ...defaultProps,
          pageNumber: 2,
          pageSize: 10,
          totalCount: 25,
        })
      );

      expect(result.current.paginationInfo).toEqual({
        start: 11,
        end: 20,
        total: 25,
      });
    });

    it("should calculate correct start, end, and total when totalCount = 0", () => {
      const { result } = renderHook(() =>
        useAssetPhotoPagination({
          ...defaultProps,
          pageNumber: 1,
          pageSize: 10,
          totalCount: 0,
        })
      );

      expect(result.current.paginationInfo).toEqual({
        start: 0,
        end: 0,
        total: 0,
      });
    });
  });
});
