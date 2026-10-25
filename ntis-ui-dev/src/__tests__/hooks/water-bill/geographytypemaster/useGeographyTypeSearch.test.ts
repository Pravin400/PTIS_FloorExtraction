import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useGeographyTypeSearch } from "@/hooks/water-bill/geographytypemaster/useGeographyTypeSearch";
import { useSearchParams } from "next/navigation";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/hooks/useSearchNavigation", () => ({
  useSearchNavigation: vi.fn(),
}));

describe("useGeographyTypeSearch", () => {
  const mockStartTransition = vi.fn((cb) => cb());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSearchParams).mockReturnValue({
      get: vi.fn().mockReturnValue("initial"),
    } as unknown as ReturnType<typeof useSearchParams>);
  });

  const defaultProps = {
    pageSize: 10,
    locale: "en",
    startTransition: mockStartTransition,
  };

  it("should initialize with current search term from URL", () => {
    const { result } = renderHook(() => useGeographyTypeSearch(defaultProps));
    expect(result.current.search).toBe("initial");
    expect(result.current.currentSearchTerm).toBe("initial");
  });

  it("should update search state and sanitize input", () => {
    const { result } = renderHook(() => useGeographyTypeSearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("new search!@#");
    });

    expect(result.current.search).toBe("new search");
  });

  it("should sync search state when URL search term changes", () => {
    const mockGet = vi.fn().mockReturnValue("first");
    vi.mocked(useSearchParams).mockReturnValue({ get: mockGet } as unknown as ReturnType<typeof useSearchParams>);

    const { result, rerender } = renderHook(() => useGeographyTypeSearch(defaultProps));
    expect(result.current.search).toBe("first");

    mockGet.mockReturnValue("second");
    rerender();

    expect(result.current.search).toBe("second");
  });

  it("should call useSearchNavigation with correct props", () => {
    renderHook(() => useGeographyTypeSearch(defaultProps));

    expect(useSearchNavigation).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "initial",
        currentSearchTerm: "initial",
        pageSize: 10,
        locale: "en",
        basePath: "/water-bill/geography-type-master",
        includePaginationParams: true,
      })
    );
  });
});
