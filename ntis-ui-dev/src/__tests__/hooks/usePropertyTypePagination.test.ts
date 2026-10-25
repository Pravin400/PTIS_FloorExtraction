import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyTypePagination } from "@/hooks/usePropertyTypePagination";

// Mock dependencies
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

describe("usePropertyTypePagination", () => {
  const mockStartTransition = vi.fn((callback: () => void) => callback());

  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 100,
    locale: "en",
    currentSearchTerm: "",
    sortBy: "propertyDescription",
    sortOrder: "asc",
    startTransition: mockStartTransition,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildUrl", () => {
    it("should build URL with page and pageSize", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      const url = result.current.buildUrl(2, 20);

      expect(url).toContain("/en/property-tax/propertytype");
      expect(url).toContain("page=2");
      expect(url).toContain("pageSize=20");
    });

    it("should include search term in URL when provided", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      const url = result.current.buildUrl(1, 10, "test search");

      // URLSearchParams uses + for spaces, which is valid URL encoding
      expect(url).toMatch(/q=test(\+|%20)search/);
    });

    it("should include sort parameters when provided", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      const url = result.current.buildUrl(1, 10, undefined, "type", "desc");

      expect(url).toContain("sortBy=type");
      expect(url).toContain("sortOrder=desc");
    });

    it("should handle all parameters together", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      const url = result.current.buildUrl(3, 25, "search", "propertyTypeGroup", "asc");

      expect(url).toContain("page=3");
      expect(url).toContain("pageSize=25");
      expect(url).toContain("q=search");
      expect(url).toContain("sortBy=propertyTypeGroup");
      expect(url).toContain("sortOrder=asc");
    });
  });

  describe("changePage", () => {
    it("should navigate to new page", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      act(() => {
        result.current.changePage(3);
      });

      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=3"));
    });

    it("should preserve search term when changing page", () => {
      const propsWithSearch = {
        ...defaultProps,
        currentSearchTerm: "test",
      };

      const { result } = renderHook(() => usePropertyTypePagination(propsWithSearch));

      act(() => {
        result.current.changePage(2);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("q=test"));
    });

    it("should preserve sort parameters when changing page", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      act(() => {
        result.current.changePage(2);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("sortBy=propertyDescription"));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("sortOrder=asc"));
    });
  });

  describe("handlePageSizeChange", () => {
    it("should navigate to page 1 with new page size", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      act(() => {
        result.current.handlePageSizeChange("25");
      });

      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageSize=25"));
    });

    it("should preserve search term when changing page size", () => {
      const propsWithSearch = {
        ...defaultProps,
        currentSearchTerm: "test",
      };

      const { result } = renderHook(() => usePropertyTypePagination(propsWithSearch));

      act(() => {
        result.current.handlePageSizeChange("20");
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("q=test"));
    });
  });

  describe("paginationInfo", () => {
    it("should calculate correct pagination info for first page", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      expect(result.current.paginationInfo.start).toBe(1);
      expect(result.current.paginationInfo.end).toBe(10);
      expect(result.current.paginationInfo.total).toBe(100);
    });

    it("should calculate correct pagination info for middle page", () => {
      const propsPage3 = {
        ...defaultProps,
        pageNumber: 3,
      };

      const { result } = renderHook(() => usePropertyTypePagination(propsPage3));

      expect(result.current.paginationInfo.start).toBe(21);
      expect(result.current.paginationInfo.end).toBe(30);
      expect(result.current.paginationInfo.total).toBe(100);
    });

    it("should calculate correct pagination info for last page with partial results", () => {
      const propsLastPage = {
        ...defaultProps,
        pageNumber: 10,
        totalCount: 95,
      };

      const { result } = renderHook(() => usePropertyTypePagination(propsLastPage));

      expect(result.current.paginationInfo.start).toBe(91);
      expect(result.current.paginationInfo.end).toBe(95); // Should not exceed totalCount
      expect(result.current.paginationInfo.total).toBe(95);
    });

    it("should handle empty results", () => {
      const propsEmpty = {
        ...defaultProps,
        pageNumber: 1,
        totalCount: 0,
      };

      const { result } = renderHook(() => usePropertyTypePagination(propsEmpty));

      expect(result.current.paginationInfo.start).toBe(0);
      expect(result.current.paginationInfo.end).toBe(0);
      expect(result.current.paginationInfo.total).toBe(0);
    });

    it("should handle different page sizes", () => {
      const propsPageSize25 = {
        ...defaultProps,
        pageSize: 25,
        pageNumber: 2,
        totalCount: 100,
      };

      const { result } = renderHook(() => usePropertyTypePagination(propsPageSize25));

      expect(result.current.paginationInfo.start).toBe(26);
      expect(result.current.paginationInfo.end).toBe(50);
      expect(result.current.paginationInfo.total).toBe(100);
    });
  });

  describe("Return Values", () => {
    it("should return all required functions and values", () => {
      const { result } = renderHook(() => usePropertyTypePagination(defaultProps));

      expect(result.current).toHaveProperty("buildUrl");
      expect(result.current).toHaveProperty("changePage");
      expect(result.current).toHaveProperty("handlePageSizeChange");
      expect(result.current).toHaveProperty("paginationInfo");
      
      expect(typeof result.current.buildUrl).toBe("function");
      expect(typeof result.current.changePage).toBe("function");
      expect(typeof result.current.handlePageSizeChange).toBe("function");
      expect(typeof result.current.paginationInfo).toBe("object");
    });
  });
});
