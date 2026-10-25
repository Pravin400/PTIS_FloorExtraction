import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLinkWardPagination } from "@/hooks/rateSectionMaster/useLinkWardPagination";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { RateSectionWardItem } from "@/types/rateSectionMaster.types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

describe("useLinkWardPagination", () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush, refresh: vi.fn(), back: vi.fn() };
  const mockPathname = "/property-tax/rate-section-master";

  const mockAllWards: RateSectionWardItem[] = [
    { id: "1", wardNo: "W1", name: "Ward 1" },
    { id: "2", wardNo: "W2", name: "Ward 2" },
    { id: "3", wardNo: "W3", name: "Ward 3" },
    { id: "4", wardNo: "W4", name: "Ward 4" },
    { id: "5", wardNo: "W5", name: "Ward 5" },
  ];

  const mockViewAllWards: RateSectionWardItem[] = [
    { id: "1", wardNo: "W1", name: "Ward 1" },
    { id: "2", wardNo: "W2", name: "Ward 2" },
  ];

  const defaultParams = {
    open: true,
    ssrSelectedWards: ["W1", "W2"],
    ssrSelectedWardsTotalCount: 2,
    ssrAllWards: mockAllWards,
    ssrAllWardsCount: 5,
    ssrViewAllWards: mockViewAllWards,
    ssrViewAllWardsTotalCount: 2,
    ssrViewAllWardsTotalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as Partial<AppRouterInstance> as AppRouterInstance);
    vi.mocked(usePathname).mockReturnValue(mockPathname);
  });

  describe("initialization", () => {
    it("should initialize with SSR data", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.selectedWards).toEqual(["W1", "W2"]);
      expect(result.current.selectedWardsTotalCount).toBe(2);
      expect(result.current.loading).toBe(false);
      expect(result.current.activeTab).toBe("available");
      expect(result.current.viewAllWards).toEqual([]);
    });

    it("should initialize with search parameters", () => {
      const mockSearchParams = new URLSearchParams({
        wardTab: "viewAll",
        availablewardq: "test",
        viewwardq: "search",
        selectedwardq: "query",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.activeTab).toBe("viewAll");
      expect(result.current.availableSearch).toBe("test");
      expect(result.current.viewAllSearch).toBe("search");
      expect(result.current.selectedSearch).toBe("query");
    });

    it("should initialize pagination values", () => {
      const mockSearchParams = new URLSearchParams({
        availablewardpage: "2",
        availablewardpagesize: "20",
        viewwardpage: "3",
        viewwardpagesize: "5",
        selectedwardpage: "1",
        selectedwardpagesize: "10",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.availablePage).toBe(2);
      expect(result.current.availablePageSize).toBe(20);
      expect(result.current.viewWardPage).toBe(3);
      expect(result.current.viewWardPageSize).toBe(5);
      expect(result.current.selectedPage).toBe(1);
      expect(result.current.selectedPageSize).toBe(10);
    });
  });

  describe("viewAllWards calculation", () => {
    it("should return empty array when drawer is closed", () => {
      const mockSearchParams = new URLSearchParams({ wardTab: "viewAll" });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() =>
        useLinkWardPagination({ ...defaultParams, open: false })
      );

      expect(result.current.viewAllWards).toEqual([]);
    });

    it("should return empty array when not on viewAll tab", () => {
      const mockSearchParams = new URLSearchParams({ wardTab: "available" });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.viewAllWards).toEqual([]);
    });

    it("should return SSR view all wards when searching", () => {
      const mockSearchParams = new URLSearchParams({
        wardTab: "viewAll",
        viewwardq: "search",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.viewAllWards).toEqual(mockViewAllWards);
    });

    it("should paginate all wards when not searching", () => {
      const mockSearchParams = new URLSearchParams({
        wardTab: "viewAll",
        viewwardpage: "1",
        viewwardpagesize: "2",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.viewAllWards).toEqual([mockAllWards[0], mockAllWards[1]]);
    });
  });

  describe("filteredSelected calculation", () => {
    it("should return all selected wards when no search", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.filteredSelected).toEqual(["W1", "W2"]);
    });

    it("should filter selected wards by search term", () => {
      const mockSearchParams = new URLSearchParams({
        selectedwardq: "W1",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.filteredSelected).toEqual(["W1"]);
    });

    it("should be case insensitive", () => {
      const mockSearchParams = new URLSearchParams({
        selectedwardq: "w1",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.filteredSelected).toEqual(["W1"]);
    });
  });

  describe("state reset on drawer open/close", () => {
    it("should reset state when drawer closes", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result, rerender } = renderHook(
        ({ open }) => useLinkWardPagination({ ...defaultParams, open }),
        { initialProps: { open: true } }
      );

      // Set some checked items
      act(() => {
        result.current.setCheckedAvailable(new Set(["W3"]));
        result.current.setCheckedSelected(new Set(["W1"]));
      });

      expect(result.current.checkedAvailable.size).toBe(1);
      expect(result.current.checkedSelected.size).toBe(1);

      // Close drawer
      rerender({ open: false });

      expect(result.current.checkedAvailable.size).toBe(0);
      expect(result.current.checkedSelected.size).toBe(0);
    });

    it("should sync SSR data when drawer state changes", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result, rerender } = renderHook(
        ({ open, ssrSelectedWards, ssrSelectedWardsTotalCount }) =>
          useLinkWardPagination({
            ...defaultParams,
            open,
            ssrSelectedWards,
            ssrSelectedWardsTotalCount,
          }),
        {
          initialProps: {
            open: true,
            ssrSelectedWards: ["W1"],
            ssrSelectedWardsTotalCount: 1,
          },
        }
      );

      expect(result.current.selectedWards).toEqual(["W1"]);

      // Close and reopen drawer with new SSR data
      rerender({
        open: false,
        ssrSelectedWards: ["W1", "W2", "W3"],
        ssrSelectedWardsTotalCount: 3,
      });

      rerender({
        open: true,
        ssrSelectedWards: ["W1", "W2", "W3"],
        ssrSelectedWardsTotalCount: 3,
      });

      // Should now have updated data
      expect(result.current.selectedWards).toEqual(["W1", "W2", "W3"]);
      expect(result.current.selectedWardsTotalCount).toBe(3);
    });
  });

  describe("handleTabChange", () => {
    it("should update ward tab parameter", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      act(() => {
        result.current.handleTabChange("viewAll");
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("wardTab=viewAll"),
        { scroll: false }
      );
    });

    it("should clear pagination parameters when changing tabs", () => {
      const mockSearchParams = new URLSearchParams({
        availablewardpage: "2",
        viewwardpage: "3",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      act(() => {
        result.current.handleTabChange("viewAll");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).not.toContain("availablewardpage");
      expect(callArg).not.toContain("viewwardpage");
    });
  });

  describe("totalViewAllPages calculation", () => {
    it("should calculate total pages from all wards count when not searching", () => {
      const mockSearchParams = new URLSearchParams({
        viewwardpagesize: "2",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.totalViewAllPages).toBe(3); // 5 wards / 2 per page = 3 pages
    });

    it("should use SSR total pages when searching", () => {
      const mockSearchParams = new URLSearchParams({
        viewwardq: "search",
        viewwardpagesize: "10",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() =>
        useLinkWardPagination({
          ...defaultParams,
          ssrViewAllWardsTotalPages: 5,
        })
      );

      expect(result.current.totalViewAllPages).toBe(5);
    });

    it("should default to 1 page if count is 0", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() =>
        useLinkWardPagination({
          ...defaultParams,
          ssrAllWardsCount: 0,
        })
      );

      expect(result.current.totalViewAllPages).toBe(1);
    });
  });

  describe("state setters", () => {
    it("should update loading state", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it("should update checkedAvailable", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      act(() => {
        result.current.setCheckedAvailable(new Set(["W3", "W4"]));
      });

      expect(result.current.checkedAvailable).toEqual(new Set(["W3", "W4"]));
    });

    it("should update checkedSelected", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      act(() => {
        result.current.setCheckedSelected(new Set(["W1"]));
      });

      expect(result.current.checkedSelected).toEqual(new Set(["W1"]));
    });

    it("should update selectedWards", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      act(() => {
        result.current.setSelectedWards(["W1", "W2", "W3"]);
      });

      expect(result.current.selectedWards).toEqual(["W1", "W2", "W3"]);
    });

    it("should update selectedWardsTotalCount", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardPagination(defaultParams));

      act(() => {
        result.current.setSelectedWardsTotalCount(10);
      });

      expect(result.current.selectedWardsTotalCount).toBe(10);
    });
  });
});
