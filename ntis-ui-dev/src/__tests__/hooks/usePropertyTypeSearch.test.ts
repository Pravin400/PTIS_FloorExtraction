import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePropertyTypeSearch } from "@/hooks/usePropertyTypeSearch";

// Mock dependencies
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => {
      if (key === "q") return "";
      return null;
    }),
  }),
}));

vi.mock("@/hooks/useSearchNavigation", () => ({
  useSearchNavigation: vi.fn(),
}));

describe("usePropertyTypeSearch", () => {
  const mockStartTransition = vi.fn((callback: () => void) => callback());

  const defaultProps = {
    pageSize: 10,
    locale: "en",
    sortBy: "propertyDescription",
    sortOrder: "asc",
    startTransition: mockStartTransition,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize with empty search term when URL has no query", () => {
      const { result } = renderHook(() => usePropertyTypeSearch(defaultProps));

      expect(result.current.search).toBe("");
      expect(result.current.currentSearchTerm).toBe("");
    });
  });

  describe("Search Change Handler", () => {
    it("should update search value when handleSearchChange is called", () => {
      const { result } = renderHook(() => usePropertyTypeSearch(defaultProps));

      act(() => {
        result.current.handleSearchChange("test search");
      });

      expect(result.current.search).toBe("test search");
    });

    it("should sanitize search input by removing special characters", () => {
      const { result } = renderHook(() => usePropertyTypeSearch(defaultProps));

      act(() => {
        result.current.handleSearchChange("test<>search");
      });

      // Should remove < and > characters based on TEXT_SANITIZE regex
      expect(result.current.search).not.toContain("<");
      expect(result.current.search).not.toContain(">");
    });

    it("should allow alphanumeric characters and spaces", () => {
      const { result } = renderHook(() => usePropertyTypeSearch(defaultProps));

      act(() => {
        result.current.handleSearchChange("Property Type 123");
      });

      expect(result.current.search).toBe("Property Type 123");
    });
  });

  describe("Return Values", () => {
    it("should return search, currentSearchTerm, and handleSearchChange", () => {
      const { result } = renderHook(() => usePropertyTypeSearch(defaultProps));

      expect(result.current).toHaveProperty("search");
      expect(result.current).toHaveProperty("currentSearchTerm");
      expect(result.current).toHaveProperty("handleSearchChange");
      expect(typeof result.current.handleSearchChange).toBe("function");
    });
  });
});
