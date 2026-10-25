import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMoujaPagination } from "@/hooks/moujamaster/useMoujaPagination";

// Mock dependencies
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
}));

describe("useMoujaPagination", () => {
  const mockStartTransition = vi.fn((callback: () => void) => callback());

  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 100,
    locale: "en",
    currentSearchTerm: "",
    sortBy: "moujaNo",
    sortOrder: "asc",
    startTransition: mockStartTransition,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildUrl", () => {
    it("should build URL with page and pageSize", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      const url = result.current.buildUrl(2, 20);

      expect(url).toContain("/en/property-tax/moujamaster");
      expect(url).toContain("page=2");
      expect(url).toContain("pageSize=20");
    });

    it("should include search term in URL when provided", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      const url = result.current.buildUrl(1, 10, "test search");

      // URLSearchParams uses + for spaces, which is valid URL encoding
      expect(url).toMatch(/q=test(\+|%20)search/);
    });

    it("should include sort parameters when provided", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      const url = result.current.buildUrl(1, 10, undefined, "moujaName", "desc");

      expect(url).toContain("sortBy=moujaName");
      expect(url).toContain("sortOrder=desc");
    });

    it("should handle all parameters together", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      const url = result.current.buildUrl(3, 25, "search", "moujaNo", "asc");

      expect(url).toContain("page=3");
      expect(url).toContain("pageSize=25");
      expect(url).toContain("q=search");
      expect(url).toContain("sortBy=moujaNo");
      expect(url).toContain("sortOrder=asc");
    });

    it("should build correct URL without optional parameters", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      const url = result.current.buildUrl(1, 10);

      expect(url).toContain("page=1");
      expect(url).toContain("pageSize=10");
      expect(url).not.toContain("q=");
      expect(url).not.toContain("sortBy=");
      expect(url).not.toContain("sortOrder=");
    });
  });

  describe("changePage", () => {
    it("should navigate to new page", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

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

      const { result } = renderHook(() => useMoujaPagination(propsWithSearch));

      act(() => {
        result.current.changePage(2);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("q=test"));
    });

    it("should preserve sort parameters when changing page", () => {
      const propsWithSort = {
        ...defaultProps,
        sortBy: "moujaName",
        sortOrder: "desc",
      };

      const { result } = renderHook(() => useMoujaPagination(propsWithSort));

      act(() => {
        result.current.changePage(2);
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("sortBy=moujaName");
      expect(callArg).toContain("sortOrder=desc");
    });

    it("should preserve pageSize when changing page", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      act(() => {
        result.current.changePage(5);
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageSize=10"));
    });
  });

  describe("handlePageSizeChange", () => {
    it("should navigate to first page with new page size", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      act(() => {
        result.current.handlePageSizeChange("20");
      });

      expect(mockStartTransition).toHaveBeenCalled();
      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("page=1");
      expect(callArg).toContain("pageSize=20");
    });

    it("should preserve search term when changing page size", () => {
      const propsWithSearch = {
        ...defaultProps,
        currentSearchTerm: "test",
      };

      const { result } = renderHook(() => useMoujaPagination(propsWithSearch));

      act(() => {
        result.current.handlePageSizeChange("25");
      });

      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("q=test"));
    });

    it("should preserve sort parameters when changing page size", () => {
      const propsWithSort = {
        ...defaultProps,
        sortBy: "moujaName",
        sortOrder: "desc",
      };

      const { result } = renderHook(() => useMoujaPagination(propsWithSort));

      act(() => {
        result.current.handlePageSizeChange("30");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("sortBy=moujaName");
      expect(callArg).toContain("sortOrder=desc");
    });

    it("should handle different page size values", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      const pageSizes = ["10", "20", "30", "40", "50"];

      pageSizes.forEach((size, index) => {
        act(() => {
          result.current.handlePageSizeChange(size);
        });

        expect(mockPush).toHaveBeenNthCalledWith(
          index + 1,
          expect.stringContaining(`pageSize=${size}`)
        );
      });
    });
  });

  describe("paginationInfo", () => {
    it("should calculate correct start, end, and total for first page", () => {
      const { result } = renderHook(() => useMoujaPagination(defaultProps));

      expect(result.current.paginationInfo.start).toBe(1);
      expect(result.current.paginationInfo.end).toBe(10);
      expect(result.current.paginationInfo.total).toBe(100);
    });

    it("should calculate correct values for middle page", () => {
      const props = {
        ...defaultProps,
        pageNumber: 5,
      };

      const { result } = renderHook(() => useMoujaPagination(props));

      expect(result.current.paginationInfo.start).toBe(41); // (5-1) * 10 + 1
      expect(result.current.paginationInfo.end).toBe(50); // 41 + 10 - 1
      expect(result.current.paginationInfo.total).toBe(100);
    });

    it("should calculate correct values for last page with partial results", () => {
      const props = {
        ...defaultProps,
        pageNumber: 10,
        totalCount: 95,
      };

      const { result } = renderHook(() => useMoujaPagination(props));

      expect(result.current.paginationInfo.start).toBe(91); // (10-1) * 10 + 1
      expect(result.current.paginationInfo.end).toBe(95); // Min of 100 and 95
      expect(result.current.paginationInfo.total).toBe(95);
    });

    it("should handle empty results", () => {
      const props = {
        ...defaultProps,
        totalCount: 0,
      };

      const { result } = renderHook(() => useMoujaPagination(props));

      expect(result.current.paginationInfo.start).toBe(0);
      expect(result.current.paginationInfo.end).toBe(0);
      expect(result.current.paginationInfo.total).toBe(0);
    });

    it("should handle single result", () => {
      const props = {
        ...defaultProps,
        totalCount: 1,
      };

      const { result } = renderHook(() => useMoujaPagination(props));

      expect(result.current.paginationInfo.start).toBe(1);
      expect(result.current.paginationInfo.end).toBe(1);
      expect(result.current.paginationInfo.total).toBe(1);
    });

    it("should update pagination info when props change", () => {
      const { result, rerender } = renderHook(
        (props) => useMoujaPagination(props),
        { initialProps: defaultProps }
      );

      expect(result.current.paginationInfo.start).toBe(1);
      expect(result.current.paginationInfo.end).toBe(10);

      rerender({
        ...defaultProps,
        pageNumber: 2,
      });

      expect(result.current.paginationInfo.start).toBe(11);
      expect(result.current.paginationInfo.end).toBe(20);
    });

    it("should handle different page sizes", () => {
      const props = {
        ...defaultProps,
        pageSize: 25,
        pageNumber: 2,
      };

      const { result } = renderHook(() => useMoujaPagination(props));

      expect(result.current.paginationInfo.start).toBe(26); // (2-1) * 25 + 1
      expect(result.current.paginationInfo.end).toBe(50); // 26 + 25 - 1
    });
  });

  describe("Locale Handling", () => {
    it("should build URL with correct locale", () => {
      const propsWithHindi = {
        ...defaultProps,
        locale: "hi",
      };

      const { result } = renderHook(() => useMoujaPagination(propsWithHindi));

      const url = result.current.buildUrl(1, 10);

      expect(url).toContain("/hi/property-tax/moujamaster");
    });

    it("should build URL with Marathi locale", () => {
      const propsWithMarathi = {
        ...defaultProps,
        locale: "mr",
      };

      const { result } = renderHook(() => useMoujaPagination(propsWithMarathi));

      const url = result.current.buildUrl(1, 10);

      expect(url).toContain("/mr/property-tax/moujamaster");
    });
  });
});
