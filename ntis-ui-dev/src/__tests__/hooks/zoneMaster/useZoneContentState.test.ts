import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useZoneContentState } from "@/hooks/zoneMaster/useZoneContentState";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(),
}));

describe("useZoneContentState", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockRouter = { push: mockPush, refresh: mockRefresh, back: vi.fn() };
  const mockPathname = "/property-tax/zone-master";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as Partial<AppRouterInstance> as AppRouterInstance);
    vi.mocked(usePathname).mockReturnValue(mockPathname);
  });

  it("should detect when addZone drawer is open", () => {
    const searchParams = new URLSearchParams("addZone");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    expect(result.current.isAddZoneOpen).toBe(true);
    expect(result.current.isAddWardOpen).toBe(false);
    expect(result.current.isCreateWardOpen).toBe(false);
    expect(result.current.isEditWardOpen).toBe(false);
    expect(result.current.isEditZoneOpen).toBe(false);
  });

  it("should detect when linkWard drawer is open", () => {
    const searchParams = new URLSearchParams("linkWard");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    expect(result.current.isAddZoneOpen).toBe(false);
    expect(result.current.isAddWardOpen).toBe(true);
  });

  it("should detect when createWard drawer is open", () => {
    const searchParams = new URLSearchParams("createWard");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    expect(result.current.isCreateWardOpen).toBe(true);
  });

  it("should detect when createWardBulk drawer is open", () => {
    const searchParams = new URLSearchParams("createWardBulk");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    expect(result.current.isCreateWardOpen).toBe(true);
  });

  it("should detect edit ward mode with wardId", () => {
    const searchParams = new URLSearchParams("editWard=123");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    expect(result.current.isEditWardOpen).toBe(true);
    expect(result.current.editWardId).toBe("123");
  });

  it("should detect edit zone mode with zoneId", () => {
    const searchParams = new URLSearchParams("editZone=456");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    expect(result.current.isEditZoneOpen).toBe(true);
    expect(result.current.editZoneId).toBe("456");
  });

  it("should handle zone selection", () => {
    const searchParams = new URLSearchParams();
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    act(() => {
      result.current.handleZoneSelect(5);
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("zoneId=5")
    );
  });

  it("should clear ward params when selecting a zone", () => {
    const searchParams = new URLSearchParams("wardQ=test&wardPage=2");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    act(() => {
      result.current.handleZoneSelect(5);
    });

    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).not.toContain("wardQ=");
    expect(callArg).not.toContain("wardPage=");
    expect(callArg).toContain("zoneId=5");
  });

  it("should handle drawer close and remove all drawer params", () => {
    const searchParams = new URLSearchParams(
      "addZone&linkWard&createWard&editWard=1&editZone=2&availablewardq=test&viewwardq=test2&viewwardpage=1"
    );
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    act(() => {
      result.current.handleCloseDrawer();
    });

    expect(result.current.isDrawerClosing).toBe(true);

    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).not.toContain("addZone");
    expect(callArg).not.toContain("linkWard");
    expect(callArg).not.toContain("createWard");
    expect(callArg).not.toContain("editWard");
    expect(callArg).not.toContain("editZone");
    expect(callArg).not.toContain("availablewardq");
    expect(callArg).not.toContain("viewwardq");
  });

  it("should call refresh when refreshAfterUpdate is invoked", () => {
    const searchParams = new URLSearchParams();
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    act(() => {
      result.current.refreshAfterUpdate();
    });

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle multiple drawer states correctly", () => {
    const searchParams = new URLSearchParams("addZone&editWard=1");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    expect(result.current.isAddZoneOpen).toBe(true);
    expect(result.current.isEditWardOpen).toBe(true);
    expect(result.current.editWardId).toBe("1");
  });

  it("should preserve other params when closing drawer", () => {
    const searchParams = new URLSearchParams(
      "addZone&zoneId=5&zonePage=2&other=value"
    );
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    act(() => {
      result.current.handleCloseDrawer();
    });

    const callArg = mockPush.mock.calls[0][0];
    expect(callArg).toContain("zoneId=5");
    expect(callArg).toContain("zonePage=2");
    expect(callArg).toContain("other=value");
    expect(callArg).not.toContain("addZone");
  });

  it("should reset closing state after timeout", async () => {
    vi.useFakeTimers();
    const searchParams = new URLSearchParams("addZone");
    vi.mocked(useSearchParams).mockReturnValue(searchParams as ReturnType<typeof useSearchParams>);

    const { result } = renderHook(() => useZoneContentState());

    act(() => {
      result.current.handleCloseDrawer();
    });

    expect(result.current.isDrawerClosing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.isDrawerClosing).toBe(false);

    vi.useRealTimers();
  });
});
