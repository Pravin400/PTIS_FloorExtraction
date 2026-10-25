import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetRoomSearch } from "@/hooks/asset-masters/assetroomtype/useAssetRoomSearch";

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

describe("useAssetRoomSearch", () => {
  const defaultProps = {
    pageSize: 10,
    locale: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("q");
  });

  it("should initialize with search term from URL", () => {
    mockSearchParams.set("q", "hall");
    const { result } = renderHook(() => useAssetRoomSearch(defaultProps));

    expect(result.current.search).toBe("hall");
    expect(result.current.currentSearchTerm).toBe("hall");
  });

  it("should sanitize and update search value when handleSearchChange is called", () => {
    const { result } = renderHook(() => useAssetRoomSearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("   living   room   ");
    });

    expect(result.current.search).toBe("living room ");
  });
});
