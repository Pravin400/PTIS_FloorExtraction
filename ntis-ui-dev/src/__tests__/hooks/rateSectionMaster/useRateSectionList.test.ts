import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRateSectionList } from "@/hooks/rateSectionMaster/useRateSectionList";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe("useRateSectionList", () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush, refresh: vi.fn(), back: vi.fn() };
  const mockPathname = "/property-tax/rate-section-master";

  const defaultParams = {
    initialWardCounts: { RS1: 5, RS2: 10 },
    initialSearch: "",
    totalCount: 20,
    pageSize: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as Partial<AppRouterInstance> as AppRouterInstance);
    vi.mocked(usePathname).mockReturnValue(mockPathname);
  });

  describe("initialization", () => {
    it("should initialize with provided values", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useRateSectionList(defaultParams));

      expect(result.current.wardCounts).toEqual({ RS1: 5, RS2: 10 });
      expect(result.current.searchValue).toBe("");
      expect(result.current.deletingId).toBeNull();
      expect(result.current.effectivePageSize).toBe(10);
      expect(result.current.totalPages).toBe(2); // 20 / 10 = 2
    });

    it("should calculate total pages correctly", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() =>
        useRateSectionList({
          ...defaultParams,
          totalCount: 25,
          pageSize: 10,
        })
      );

      expect(result.current.totalPages).toBe(3); // 25 / 10 = 3 pages
    });

    it("should default to 10 for page size if 0 or undefined", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() =>
        useRateSectionList({
          ...defaultParams,
          pageSize: 0,
        })
      );

      expect(result.current.effectivePageSize).toBe(10);
    });
  });

  describe("ward counts accumulation", () => {
    it("should merge new ward counts with existing", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result, rerender } = renderHook(
        ({ initialWardCounts }: { initialWardCounts: Record<string, number> }) =>
          useRateSectionList({
            ...defaultParams,
            initialWardCounts,
          }),
        { initialProps: { initialWardCounts: { RS1: 5, RS2: 10 } as Record<string, number> } }
      );

      expect(result.current.wardCounts).toEqual({ RS1: 5, RS2: 10 });

      // Update with new counts
      rerender({ initialWardCounts: { RS1: 7, RS2: 10, RS3: 3 } });

      // Should have merged the counts
      expect(result.current.wardCounts).toEqual({ RS1: 7, RS2: 10, RS3: 3 });
    });

    it("should not update if counts are the same", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const initialCounts = { RS1: 5, RS2: 10 };
      const { result, rerender } = renderHook(
        ({ initialWardCounts }) =>
          useRateSectionList({
            ...defaultParams,
            initialWardCounts,
          }),
        { initialProps: { initialWardCounts: initialCounts } }
      );

      const firstCounts = result.current.wardCounts;

      // Rerender with same counts
      rerender({ initialWardCounts: initialCounts });

      expect(result.current.wardCounts).toBe(firstCounts); // Should be same reference
    });
  });

  describe("search value synchronization", () => {
    it("should sync search value with initial search", () => {
      const mockSearchParams = new URLSearchParams({ q: "test" });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() =>
        useRateSectionList({
          ...defaultParams,
          initialSearch: "test",
        })
      );

      expect(result.current.searchValue).toBe("test");
    });

    it("should update URL when search value changes", async () => {
      vi.useFakeTimers();
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useRateSectionList(defaultParams));

      act(() => {
        result.current.setSearchValue("new search");
      });

      expect(result.current.searchValue).toBe("new search");

      // Fast-forward debounce timer
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("q=new+search")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("ratesectionpage=1")
      );

      vi.useRealTimers();
    });

    it("should handle clearing search value", async () => {
      vi.useFakeTimers();
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() =>
        useRateSectionList(defaultParams)
      );

      // Set a search value
      act(() => {
        result.current.setSearchValue("test search");
      });

      // Verify search is set immediately while typing
      expect(result.current.searchValue).toBe("test search");

      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Verify URL was updated
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("q=test+search")
      );

      // Clear the search value
      act(() => {
        result.current.setSearchValue("");
      });

      // Should update local state immediately while typing
      expect(result.current.searchValue).toBe("");

      vi.useRealTimers();
    });

    it("should debounce search updates", async () => {
      vi.useFakeTimers();
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useRateSectionList(defaultParams));

      act(() => {
        result.current.setSearchValue("a");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setSearchValue("ab");
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      act(() => {
        result.current.setSearchValue("abc");
      });

      // Should not have pushed yet
      expect(mockPush).not.toHaveBeenCalled();

      // Complete the debounce
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Should only push once with final value
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("q=abc")
      );

      vi.useRealTimers();
    });
  });

  describe("changePageSize", () => {
    it("should update page size and reset to page 1", () => {
      const mockSearchParams = new URLSearchParams({
        ratesectionpage: "3",
        wardpage: "2",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useRateSectionList(defaultParams));

      act(() => {
        result.current.changePageSize(20);
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("ratesectionpagesize=20")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("ratesectionpage=1")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("wardpage=1")
      );
    });
  });

  describe("handlePageChange", () => {
    it("should update rate section page and reset ward page", () => {
      const mockSearchParams = new URLSearchParams({
        wardpage: "5",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useRateSectionList(defaultParams));

      act(() => {
        result.current.handlePageChange(3);
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("ratesectionpage=3")
      );
      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("wardpage=1")
      );
    });

    it("should preserve other parameters", () => {
      const mockSearchParams = new URLSearchParams({
        q: "search term",
        someOtherParam: "value",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useRateSectionList(defaultParams));

      act(() => {
        result.current.handlePageChange(2);
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("q=search+term");
      expect(callArg).toContain("someOtherParam=value");
    });
  });

  describe("deletingId state", () => {
    it("should manage deletingId state", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useRateSectionList(defaultParams));

      expect(result.current.deletingId).toBeNull();

      act(() => {
        result.current.setDeletingId("RS1");
      });

      expect(result.current.deletingId).toBe("RS1");

      act(() => {
        result.current.setDeletingId(null);
      });

      expect(result.current.deletingId).toBeNull();
    });
  });
});
