import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useGeographyTypePagination } from "@/hooks/water-bill/geographytypemaster/useGeographyTypePagination";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("useGeographyTypePagination", () => {
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
    const { result } = renderHook(() => useGeographyTypePagination(defaultProps));

    expect(result.current.paginationInfo).toEqual({
      start: 1,
      end: 10,
      total: 25,
    });
  });

  it("should calculate pagination info correctly for other pages", () => {
    const { result } = renderHook(() =>
      useGeographyTypePagination({ ...defaultProps, pageNumber: 3 })
    );

    expect(result.current.paginationInfo).toEqual({
      start: 21,
      end: 25,
      total: 25,
    });
  });

  it("should build URL correctly", () => {
    const { result } = renderHook(() => useGeographyTypePagination(defaultProps));
    const url = result.current.buildUrl(2, 20, "test");
    expect(url).toContain("/en/water-bill/geography-type-master");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=20");
    expect(url).toContain("q=test");
  });

  it("should change page and preserve search term", () => {
    const { result } = renderHook(() =>
      useGeographyTypePagination({
        ...defaultProps,
        currentSearchTerm: "query",
      })
    );

    act(() => {
      result.current.changePage(2);
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=2"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("q=query"));
  });

  it("should handle page size change", () => {
    const { result } = renderHook(() => useGeographyTypePagination(defaultProps));

    act(() => {
      result.current.handlePageSizeChange("50");
    });

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("pageSize=50"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
  });

  it("should redirect to the last valid page if current page exceeds max page", () => {
    renderHook(() =>
      useGeographyTypePagination({
        ...defaultProps,
        pageNumber: 10,
        pageSize: 10,
        totalCount: 25,
      })
    );

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=3"));
  });
});
