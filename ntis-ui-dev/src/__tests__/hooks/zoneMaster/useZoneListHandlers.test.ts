import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useZoneListHandlers } from "@/hooks/zoneMaster/useZoneListHandlers";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ZoneItem } from "@/types/zoneMaster.types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

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
  deleteZoneAction: vi.fn(),
  fetchWardsPagedAction: vi.fn(),
}));

describe("useZoneListHandlers", () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush, refresh: vi.fn(), back: vi.fn() };
  const mockSearchParams = new URLSearchParams();
  const mockPathname = "/property-tax/zone-master";
  const mockT = vi.fn((key: string) => key);

  const mockZones: ZoneItem[] = [
    {
      id: 1,
      zoneNo: "Z1",
      description: "Zone One",
      sequenceNo: null,
      isActive: true,
      wardCount: 5,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
    {
      id: 2,
      zoneNo: "Z2",
      description: "Zone Two",
      sequenceNo: null,
      isActive: true,
      wardCount: 3,
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

  it("should initialize successfully", () => {
    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    expect(result.current.handleDeleteClick).toBeDefined();
    expect(result.current.handlePageChange).toBeDefined();
    expect(result.current.handlePageSizeChange).toBeDefined();
    expect(result.current.handleSearchChange).toBeDefined();
  });

  it("should handle page change", () => {
    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("zonePage=2")
    );
  });

  it("should handle page size change and reset to page 1", () => {
    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    act(() => {
      result.current.handlePageSizeChange(20);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("zonePageSize=20")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("zonePage=1")
    );
  });

  it("should handle search change with query", () => {
    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    act(() => {
      result.current.handleSearchChange("test", "");
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("q=test")
    );
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("zonePage=1")
    );
  });

  it("should remove query param when search is cleared", () => {
    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    act(() => {
      result.current.handleSearchChange("", "previous");
    });

    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).not.toContain("q=");
  });

  it("should not navigate if search value hasn't changed", () => {
    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    mockPush.mockClear();

    act(() => {
      result.current.handleSearchChange("same", "same");
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("should handle delete click", () => {
    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    act(() => {
      result.current.handleDeleteClick(1, "Z1", "Zone One");
    });

    // Verify confirm was called (through the mock)
    expect(mockT).toHaveBeenCalledWith("zoneList.deleteTitle", expect.anything());
  });

  it("should preserve existing search params during navigation", () => {
    const paramsWithExisting = new URLSearchParams("existing=value");
    vi.mocked(useSearchParams).mockReturnValue(paramsWithExisting as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() =>
      useZoneListHandlers({
        zones: mockZones,
        t: mockT,
      })
    );

    act(() => {
      result.current.handlePageChange(2);
    });

    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).toContain("existing=value");
    expect(callArg).toContain("zonePage=2");
  });
});
