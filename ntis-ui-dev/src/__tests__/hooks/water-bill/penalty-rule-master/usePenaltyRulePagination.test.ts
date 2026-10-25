import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePenaltyRulePagination } from "@/hooks/water-bill/penalty-rule-master/usePenaltyRulePagination";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("usePenaltyRulePagination", () => {
  const mockPush = vi.fn();
  const mockStartTransition = vi.fn((cb) => cb());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
  });

  const defaultProps = {
    pageNumber: 1,
    pageSize: 10,
    totalCount: 50,
    locale: "en",
    startTransition: mockStartTransition,
    basePath: "/water-bill/penalty-rule-master",
  };

  it("calculates pagination info correctly for first page", () => {
    const { result } = renderHook(() => usePenaltyRulePagination(defaultProps));

    expect(result.current.paginationInfo).toEqual({
      start: 1,
      end: 10,
      total: 50,
    });
  });

  it("calculates pagination info correctly for empty data", () => {
    const { result } = renderHook(() =>
      usePenaltyRulePagination({
        ...defaultProps,
        totalCount: 0,
      })
    );

    expect(result.current.paginationInfo).toEqual({
      start: 0,
      end: 0,
      total: 0,
    });
  });

  it("changes page and navigates to target page URL", () => {
    const { result } = renderHook(() => usePenaltyRulePagination(defaultProps));

    act(() => {
      result.current.changePage(3);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("page=3")
    );
  });
});
