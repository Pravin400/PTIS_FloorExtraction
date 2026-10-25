import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetGrievanceRemarkSearch } from "@/hooks/asset-masters/grievance-remark/useAssetGrievanceRemarkSearch";

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

describe("useAssetGrievanceRemarkSearch", () => {
  const defaultProps = {
    pageSize: 10,
    locale: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("q");
  });

  it("should initialize with search term from URL", () => {
    mockSearchParams.set("q", "remark-query");
    const { result } = renderHook(() => useAssetGrievanceRemarkSearch(defaultProps));

    expect(result.current.search).toBe("remark-query");
    expect(result.current.currentSearchTerm).toBe("remark-query");
  });

  it("should sanitize and update search value when handleSearchChange is called", () => {
    const { result } = renderHook(() => useAssetGrievanceRemarkSearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("   hello   remark   ");
    });

    expect(result.current.search).toBe("hello remark ");
  });
});
