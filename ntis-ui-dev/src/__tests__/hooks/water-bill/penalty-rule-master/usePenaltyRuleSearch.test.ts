import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePenaltyRuleSearch } from "@/hooks/water-bill/penalty-rule-master/usePenaltyRuleSearch";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => "/en/water-bill/penalty-rule-master"),
}));

describe("usePenaltyRuleSearch", () => {
  const mockPush = vi.fn();
  const mockStartTransition = vi.fn((cb) => cb());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
    } as unknown as ReturnType<typeof useRouter>);
  });

  const defaultProps = {
    pageSize: 10,
    locale: "en",
    startTransition: mockStartTransition,
    basePath: "/water-bill/penalty-rule-master",
  };

  it("initializes with initial filter values when provided", () => {
    const { result } = renderHook(() =>
      usePenaltyRuleSearch({
        ...defaultProps,
        initialFilters: {
          searchTerm: "test",
          financialYearId: 2,
          penaltyType: "Percentage",
          statusFilter: "active",
        },
      })
    );

    expect(result.current.searchTerm).toBe("test");
    expect(result.current.financialYearId).toBe(2);
    expect(result.current.penaltyType).toBe("Percentage");
    expect(result.current.statusFilter).toBe("active");
  });

  it("updates search term and navigates with filters", () => {
    const { result } = renderHook(() => usePenaltyRuleSearch(defaultProps));

    act(() => {
      result.current.handleSearchChange("late fee");
    });
    expect(result.current.searchTerm).toBe("late fee");

    act(() => {
      result.current.navigateWithFilters({ q: "late fee" });
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("q=late+fee")
    );
  });

  it("updates financial year filter", () => {
    const { result } = renderHook(() => usePenaltyRuleSearch(defaultProps));

    act(() => {
      result.current.handleFinancialYearChange(5);
    });

    expect(result.current.financialYearId).toBe(5);
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("financialYearId=5")
    );
  });

  it("resets all filters on handleReset", () => {
    const { result } = renderHook(() =>
      usePenaltyRuleSearch({
        ...defaultProps,
        initialFilters: {
          searchTerm: "filter",
          financialYearId: 3,
        },
      })
    );

    act(() => {
      result.current.handleReset();
    });

    expect(result.current.searchTerm).toBe("");
    expect(result.current.financialYearId).toBeUndefined();
    expect(result.current.statusFilter).toBe("all");
    expect(mockPush).toHaveBeenCalled();
  });
});
