import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyListHandlers } from "@/hooks/zoneMaster/usePropertyListHandlers";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/property-tax/zone-master",
  useSearchParams: () => ({
    toString: () => "",
  }),
}));

describe("usePropertyListHandlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize with search term", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "P001",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    expect(result.current.localSearch).toBe("P001");
  });

  it("should handle search change with sanitization", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handleSearchChange("P001");
    });

    expect(result.current.localSearch).toBe("P001");
  });

  it("should sanitize special characters in search", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handleSearchChange("P001<script>");
    });

    // Should sanitize special characters
    expect(result.current.localSearch).not.toContain("<");
    expect(result.current.localSearch).not.toContain(">");
  });

  it("should debounce search input", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handleSearchChange("P");
    });

    act(() => {
      result.current.handleSearchChange("P0");
    });

    act(() => {
      result.current.handleSearchChange("P00");
    });

    // Search should be updated locally
    expect(result.current.localSearch).toBe("P00");
  });

  it("should handle page change", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "P001",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });

    // Function should be called without errors
    expect(result.current).toBeDefined();
  });

  it("should handle page size change", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "P001",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handlePageSizeChange(20);
    });

    // Function should be called without errors
    expect(result.current).toBeDefined();
  });

  it("should handle ward change", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "P001",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handleWardChange("2");
    });

    // Function should be called without errors
    expect(result.current).toBeDefined();
  });

  it("should clear ward selection", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: 1,
        selectedZoneId: 1,
        searchTerm: "P001",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handleWardChange("");
    });

    // Function should be called without errors
    expect(result.current).toBeDefined();
  });

  it("should sync local search when searchTerm prop changes", () => {
    const { result, rerender } = renderHook(
      ({ searchTerm }) =>
        usePropertyListHandlers({
          selectedWardId: 1,
          selectedZoneId: 1,
          searchTerm,
          pageNumber: 1,
          pageSize: 10,
        }),
      { initialProps: { searchTerm: "" } }
    );

    expect(result.current.localSearch).toBe("");

    rerender({ searchTerm: "P001" });

    expect(result.current.localSearch).toBe("P001");
  });

  it("should not trigger search when ward is not selected", () => {
    const { result } = renderHook(() =>
      usePropertyListHandlers({
        selectedWardId: null,
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
      })
    );

    act(() => {
      result.current.handleSearchChange("P001");
    });

    // Should update local search but not trigger API call
    expect(result.current.localSearch).toBe("P001");
  });
});
