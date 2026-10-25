import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUserDepartmentAllocationPagination } from "@/hooks/asset-masters/user-department-allocation/useUserDepartmentAllocationPagination";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/en/assets/configuration/master-data/user-department-allocation",
  useSearchParams: () => mockSearchParams,
}));

describe("useUserDepartmentAllocationPagination", () => {
  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 55,
    sortBy: "userName",
    sortOrder: "asc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it("calculates paginationInfo correctly", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationPagination(defaultProps)
    );

    expect(result.current.paginationInfo).toEqual({
      start: 1,
      end: 10,
      total: 55,
    });
  });

  it("calculates paginationInfo for page 2 correctly", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationPagination({
        ...defaultProps,
        pageNumber: 2,
        pageSize: 10,
      })
    );

    expect(result.current.paginationInfo).toEqual({
      start: 11,
      end: 20,
      total: 55,
    });
  });

  it("handles page change navigation", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationPagination(defaultProps)
    );

    act(() => {
      result.current.handlePageChange(3);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=3")
    );
  });

  it("handles page size change navigation", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationPagination(defaultProps)
    );

    act(() => {
      result.current.handlePageSizeChange(25);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=25")
    );
  });

  it("toggles sort order when same column is sorted", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationPagination(defaultProps)
    );

    act(() => {
      result.current.handleSort("userName");
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortOrder=desc")
    );
  });

  it("defaults to asc sort order when different column is sorted", () => {
    const { result } = renderHook(() =>
      useUserDepartmentAllocationPagination(defaultProps)
    );

    act(() => {
      result.current.handleSort("email");
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortBy=email")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("sortOrder=asc")
    );
  });
});
