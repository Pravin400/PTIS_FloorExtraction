import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useConstructionPagination } from "@/hooks/constructiontypemaster/useConstructionPagination";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("useConstructionPagination", () => {
  const mockPush = vi.fn();
  const mockStartTransition = vi.fn((cb) => cb());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
  });

  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 25,
    locale: "en",
    currentSearchTerm: "",
    startTransition: mockStartTransition,
  };

  it("should calculate pagination info correctly", () => {
    const { result } = renderHook(() => useConstructionPagination(defaultProps));

    expect(result.current.paginationInfo).toEqual({
      start: 1,
      end: 10,
      total: 25,
    });
  });

  it("should calculate pagination info correctly for other pages", () => {
    const { result } = renderHook(() =>
      useConstructionPagination({ ...defaultProps, pageNumber: 3 })
    );

    expect(result.current.paginationInfo).toEqual({
      start: 21,
      end: 25,
      total: 25,
    });
  });

  it("should build URL correctly", () => {
    const { result } = renderHook(() => useConstructionPagination(defaultProps));
    const url = result.current.buildUrl(2, 20, "test", "code", "asc");
    expect(url).toContain("/en/property-tax/constructiontype");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=20");
    expect(url).toContain("q=test");
    expect(url).toContain("sortBy=code");
    expect(url).toContain("sortOrder=asc");
  });

  it("should change page and preserve params", () => {
    const { result } = renderHook(() =>
      useConstructionPagination({
        ...defaultProps,
        currentSearchTerm: "query",
        sortBy: "description",
        sortOrder: "desc",
      })
    );

    act(() => {
      result.current.changePage(2);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=2")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("q=query")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=description")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortOrder=desc")
    );
  });

  it("should handle page size change", () => {
    const { result } = renderHook(() => useConstructionPagination(defaultProps));

    act(() => {
      result.current.handlePageSizeChange("50");
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=50")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=1")
    );
  });
});
