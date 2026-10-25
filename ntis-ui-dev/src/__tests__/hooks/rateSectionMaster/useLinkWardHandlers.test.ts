import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLinkWardHandlers } from "@/hooks/rateSectionMaster/useLinkWardHandlers";
import { useRouter, useSearchParams } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

describe("useLinkWardHandlers", () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush, refresh: vi.fn(), back: vi.fn(), forward: vi.fn(), replace: vi.fn(), prefetch: vi.fn() } as unknown as AppRouterInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as Partial<AppRouterInstance> as AppRouterInstance);
  });

  describe("updateAvailablePage", () => {
    it("should update available ward page parameter", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.updateAvailablePage(2);
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("availablewardpage=2"),
        { scroll: false }
      );
    });

    it("should preserve other parameters", () => {
      const mockSearchParams = new URLSearchParams({
        wardTab: "available",
        availablewardq: "test",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.updateAvailablePage(3);
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("wardTab=available");
      expect(callArg).toContain("availablewardq=test");
      expect(callArg).toContain("availablewardpage=3");
    });
  });

  describe("updateAvailablePageSize", () => {
    it("should update available ward page size and reset to page 1", () => {
      const mockSearchParams = new URLSearchParams({
        availablewardpage: "3",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.updateAvailablePageSize(20);
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("availablewardpagesize=20");
      expect(callArg).toContain("availablewardpage=1");
    });
  });

  describe("updateViewWardPage", () => {
    it("should update view ward page parameter", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.updateViewWardPage(2);
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("viewwardpage=2"),
        { scroll: false }
      );
    });
  });

  describe("updateViewWardPageSize", () => {
    it("should update view ward page size and reset to page 1", () => {
      const mockSearchParams = new URLSearchParams({
        viewwardpage: "4",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.updateViewWardPageSize(50);
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("viewwardpagesize=50");
      expect(callArg).toContain("viewwardpage=1");
    });
  });

  describe("updateSelectedPage", () => {
    it("should update selected ward page parameter", () => {
      const mockSearchParams = new URLSearchParams();
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.updateSelectedPage(3);
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringContaining("selectedwardpage=3"),
        { scroll: false }
      );
    });
  });

  describe("updateSelectedPageSize", () => {
    it("should update selected ward page size and reset to page 1", () => {
      const mockSearchParams = new URLSearchParams({
        selectedwardpage: "2",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.updateSelectedPageSize(15);
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("selectedwardpagesize=15");
      expect(callArg).toContain("selectedwardpage=1");
    });
  });

  describe("handleAvailableSearch", () => {
    it("should update available ward search parameter and reset to page 1", () => {
      const mockSearchParams = new URLSearchParams({
        availablewardpage: "3",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.handleAvailableSearch("test search");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("availablewardq=test+search");
      expect(callArg).toContain("availablewardpage=1");
    });

    it("should remove search parameter when search is empty", () => {
      const mockSearchParams = new URLSearchParams({
        availablewardq: "old search",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.handleAvailableSearch("");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).not.toContain("availablewardq");
    });
  });

  describe("handleViewAllSearch", () => {
    it("should update view all ward search parameter and reset to page 1", () => {
      const mockSearchParams = new URLSearchParams({
        viewwardpage: "2",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.handleViewAllSearch("ward search");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("viewwardq=ward+search");
      expect(callArg).toContain("viewwardpage=1");
    });

    it("should remove search parameter when search is empty", () => {
      const mockSearchParams = new URLSearchParams({
        viewwardq: "existing search",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.handleViewAllSearch("");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).not.toContain("viewwardq");
    });
  });

  describe("handleSelectedSearch", () => {
    it("should update selected ward search parameter and reset to page 1", () => {
      const mockSearchParams = new URLSearchParams({
        selectedwardpage: "3",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.handleSelectedSearch("filter");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("selectedwardq=filter");
      expect(callArg).toContain("selectedwardpage=1");
    });

    it("should remove search parameter when search is empty", () => {
      const mockSearchParams = new URLSearchParams({
        selectedwardq: "old filter",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.handleSelectedSearch("");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).not.toContain("selectedwardq");
    });
  });

  describe("parameter preservation", () => {
    it("should preserve unrelated parameters across all handlers", () => {
      const mockSearchParams = new URLSearchParams({
        someOtherParam: "value",
        rateSectionId: "123",
      });
      vi.mocked(useSearchParams).mockReturnValue(mockSearchParams as ReturnType<typeof useSearchParams>);

      const { result } = renderHook(() => useLinkWardHandlers({ searchParams: mockSearchParams, router: mockRouter }));

      act(() => {
        result.current.handleAvailableSearch("test");
      });

      const callArg = mockPush.mock.calls[0][0];
      expect(callArg).toContain("someOtherParam=value");
      expect(callArg).toContain("rateSectionId=123");
    });
  });
});
