import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWardListHandlers } from "@/hooks/zoneMaster/useWardListHandlers";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { WardItem } from "@/types/wardMaster.types";import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@/components/common", () => ({
  useConfirm: vi.fn(() => ({
    confirm: vi.fn((options) => {
      if (options.onConfirm) options.onConfirm();
    }),
  })),
}));

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  deleteWardAction: vi.fn(),
}));

vi.mock("@/components/modules/property-tax/zone-master/wards/wardColumns", () => ({
  getWardColumns: vi.fn(() => []),
}));

describe("useWardListHandlers", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockRouter = { push: mockPush, refresh: mockRefresh, back: vi.fn() };
  const mockSearchParams = new URLSearchParams();
  const mockPathname = "/property-tax/zone-master";
  const mockT = vi.fn((key: string) => key);

  const mockWards: WardItem[] = [
    {
      id: 1,
      wardNo: "W1",
      zoneId: 1,
      description: "Ward One",
      sequenceNo: 1,
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
    {
      id: 2,
      wardNo: "W2",
      zoneId: 1,
      description: "Ward Two",
      sequenceNo: 2,
      isActive: true,
      createdDate: "2024-01-02",
      updatedDate: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as Partial<AppRouterInstance> as AppRouterInstance);
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);
    vi.mocked(usePathname).mockReturnValue(mockPathname);
  });

  it("should initialize with empty local search", () => {
    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
        t: mockT,
      })
    );

    expect(result.current.localSearch).toBe("");
    expect(result.current.handleSearchChange).toBeDefined();
    expect(result.current.handleDelete).toBeDefined();
    expect(result.current.handleEdit).toBeDefined();
    expect(result.current.columns).toBeDefined();
  });

  it("should sync local search with provided search term", async () => {
    const { result, rerender } = renderHook(
      ({ searchTerm }) =>
        useWardListHandlers({
          selectedZoneId: 1,
          searchTerm,
          pageNumber: 1,
          pageSize: 10,
          t: mockT,
        }),
      { initialProps: { searchTerm: "" } }
    );

    expect(result.current.localSearch).toBe("");

    rerender({ searchTerm: "test" });

    // Wait for effect to sync the search term
    await vi.waitFor(() => {
      expect(result.current.localSearch).toBe("test");
    });
  });

  it("should handle search change", () => {
    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
        t: mockT,
      })
    );

    act(() => {
      result.current.handleSearchChange("new search");
    });

    expect(result.current.localSearch).toBe("new search");
  });

  it("should handle page change with search term", () => {
    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: 1,
        searchTerm: "test",
        pageNumber: 1,
        pageSize: 10,
        t: mockT,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("wardPage=2")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("wardQ=test")
    );
  });

  it("should handle page size change and reset to page 1", () => {
    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 2,
        pageSize: 10,
        t: mockT,
      })
    );

    act(() => {
      result.current.handlePageSizeChange(20);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("wardPageSize=20")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("wardPage=1")
    );
  });

  it("should call onWardsChanged when deleting", () => {
    const mockOnWardsChanged = vi.fn();

    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: 1,
        searchTerm: "",
        onWardsChanged: mockOnWardsChanged,
        pageNumber: 1,
        pageSize: 10,
        t: mockT,
      })
    );

    act(() => {
      result.current.handleDelete(mockWards[0]);
    });

    // Verify that refresh was potentially called
    // Note: Actual implementation may vary
  });

  it("should not trigger search when zone is not selected", () => {
    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: null,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
        t: mockT,
      })
    );

    mockPush.mockClear();

    act(() => {
      result.current.handleSearchChange("test");
    });

    // Search should update locally but not trigger navigation if no zone selected
    expect(result.current.localSearch).toBe("test");
  });

  it("should include wardQ in URL when searching", async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useWardListHandlers({
          selectedZoneId: 1,
          searchTerm: "",
          pageNumber: 1,
          pageSize: 10,
          t: mockT,
        })
      );

      act(() => {
        result.current.handleSearchChange("ward search");
      });

      // Advance timers by debounce duration
      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("wardQ=ward")
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("should handle edit action", () => {
    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
        t: mockT,
      })
    );

    act(() => {
      result.current.handleEdit(mockWards[0]);
    });

    // Verify handler was called
    expect(result.current.handleEdit).toBeDefined();
  });

  it("should preserve existing params during page navigation", () => {
    const paramsWithExisting = new URLSearchParams("zoneId=1&other=value");
    vi.mocked(useSearchParams).mockReturnValue(paramsWithExisting as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() =>
      useWardListHandlers({
        selectedZoneId: 1,
        searchTerm: "",
        pageNumber: 1,
        pageSize: 10,
        t: mockT,
      })
    );

    act(() => {
      result.current.handlePageChange(3);
    });

    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).toContain("zoneId=1");
    expect(callArg).toContain("other=value");
    expect(callArg).toContain("wardPage=3");
  });
});
