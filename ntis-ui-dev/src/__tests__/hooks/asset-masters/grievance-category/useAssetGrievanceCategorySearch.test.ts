import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetGrievanceCategorySearch } from "@/hooks/asset-masters/grievance-category/useAssetGrievanceCategorySearch";

const mockPush = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

describe("useAssetGrievanceCategorySearch", () => {
  const defaultProps = {
    pageSize: 10,
    locale: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("q");
  });

  it("should initialize with search term from URL", () => {
    mockSearchParams.set("q", "testing");
    const { result } = renderHook(() => useAssetGrievanceCategorySearch(defaultProps));

    expect(result.current.search).toBe("testing");
    expect(result.current.currentSearchTerm).toBe("testing");
  });

  it("should sanitize and update search value when handleSearchChange is called", () => {
    const { result } = renderHook(() => useAssetGrievanceCategorySearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("   hello   world   ");
    });

    expect(result.current.search).toBe("hello world ");
  });
});
