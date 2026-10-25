import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetPhotoSearch } from "@/hooks/asset-masters/assetphototype/useAssetPhotoSearch";

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

describe("useAssetPhotoSearch", () => {
  const defaultProps = {
    pageSize: 10,
    locale: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.delete("q");
  });

  it("should initialize with search term from URL", () => {
    mockSearchParams.set("q", "photo");
    const { result } = renderHook(() => useAssetPhotoSearch(defaultProps));

    expect(result.current.search).toBe("photo");
    expect(result.current.currentSearchTerm).toBe("photo");
  });

  it("should sanitize and update search value when handleSearchChange is called", () => {
    const { result } = renderHook(() => useAssetPhotoSearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("   front   view   ");
    });

    expect(result.current.search).toBe("front view ");
  });
});
