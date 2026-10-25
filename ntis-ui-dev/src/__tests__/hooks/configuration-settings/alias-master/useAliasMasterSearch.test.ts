import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAliasMasterSearch } from "@/hooks/configuration-settings/alias-master/useAliasMasterSearch";

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

describe("useAliasMasterSearch", () => {
  const defaultProps = {
    pageSize: 10,
    locale: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("q");
  });

  it("initializes with the search term from the URL", () => {
    mockSearchParams.set("q", "Ward");
    const { result } = renderHook(() => useAliasMasterSearch(defaultProps));

    expect(result.current.search).toBe("Ward");
    expect(result.current.currentSearchTerm).toBe("Ward");
  });

  it("returns undefined currentSearchTerm when the URL has no search term", () => {
    const { result } = renderHook(() => useAliasMasterSearch(defaultProps));
    expect(result.current.currentSearchTerm).toBeUndefined();
  });

  it("sanitizes and collapses whitespace when handleSearchChange is called", () => {
    const { result } = renderHook(() => useAliasMasterSearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("   hello   world   ");
    });

    expect(result.current.search).toBe("hello world ");
  });

  it("navigates to the alias-master list URL with the new search term", () => {
    const { result } = renderHook(() => useAliasMasterSearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("Ward");
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/en/configuration-settings/alias-master?")
    );
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("q=Ward"));
  });
});
