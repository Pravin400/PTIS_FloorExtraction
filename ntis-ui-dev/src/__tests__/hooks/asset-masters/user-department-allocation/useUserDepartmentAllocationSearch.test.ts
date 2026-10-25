import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserDepartmentAllocationSearch } from "@/hooks/asset-masters/user-department-allocation/useUserDepartmentAllocationSearch";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/en/assets/configuration/master-data/user-department-allocation",
  useSearchParams: () => mockSearchParams,
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (val: string) => val,
}));

describe("useUserDepartmentAllocationSearch", () => {
  const defaultProps = {
    pageSize: 10,
    sortBy: "userName",
    sortOrder: "asc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("initializes with search term from URL", () => {
    mockSearchParams.set("q", "john");
    const { result } = renderHook(() =>
      useUserDepartmentAllocationSearch(defaultProps)
    );

    expect(result.current.search).toBe("john");
    expect(result.current.currentSearchTerm).toBe("john");
  });

  it("sanitizes multiple whitespaces when typing", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationSearch(defaultProps)
    );

    act(() => {
      result.current.handleSearchChange("  test   user  ");
    });

    expect(result.current.search).toBe("test user ");
  });

  it("preserves @ symbol for username or email searching", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationSearch(defaultProps)
    );

    act(() => {
      result.current.handleSearchChange("user@example.com");
    });

    expect(result.current.search).toBe("user@example.com");
  });

  it("navigates to URL when search changes", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationSearch(defaultProps)
    );

    act(() => {
      result.current.handleSearchChange("admin");
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("q=admin")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=1")
    );
  });

  it("deletes search query from URL when cleared", () => {
    mockSearchParams.set("q", "admin");
    const { result } = renderHook(() =>
      useUserDepartmentAllocationSearch(defaultProps)
    );

    act(() => {
      result.current.handleSearchChange("");
    });

    expect(mockPush).toHaveBeenCalled();
  });
});
