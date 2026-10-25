import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLinkWardActions } from "@/hooks/rateSectionMaster/useLinkWardActions";
import { toast } from "sonner";
import {
  linkWardsToRateSectionAction,
  deleteSelectedWardsAction,
  refreshSelectedWardsAction
} from "@/app/[locale]/property-tax/rate-section-master/actions";
import { RateItem } from "@/types/rateSectionMaster.types";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/rate-section-master/actions", () => ({
  linkWardsToRateSectionAction: vi.fn(),
  deleteSelectedWardsAction: vi.fn(),
  refreshSelectedWardsAction: vi.fn(),
}));

const mockConfirm = vi.fn((options) => {
  if (options.onConfirm) options.onConfirm();
});

vi.mock("@/components/common", () => ({
  useConfirm: vi.fn(() => ({
    confirm: mockConfirm,
  })),
}));

describe("useLinkWardActions", () => {
  const mockT = vi.fn((key: string, values?: Record<string, string | number>) => {
    if (values) {
      return `${key}: ${JSON.stringify(values)}`;
    }
    return key;
  });

  const mockRates: RateItem[] = [
    {
      id: 1,
      rateSectionNo: "RS1",
      description: "Rate Section One",
      isActive: true,
    },
    {
      id: 2,
      rateSectionNo: "RS2",
      description: "Rate Section Two",
      isActive: true,
    },
  ];

  const mockWardAssignments = {
    W1: { rateSectionNo: "1", id: 1, description: "Rate Section One" },
    W2: { rateSectionNo: "2", id: 2, description: "Rate Section Two" },
  };

  const mockRouter = {
    refresh: vi.fn(),
  };

  const defaultParams = {
    rates: mockRates,
    allRateSections: mockRates,
    selectedZoneNo: "1",
    wardAssignments: mockWardAssignments,
    checkedAvailable: new Set<string>(),
    selectedWards: [],
    setCheckedAvailable: vi.fn(),
    checkedSelected: new Set<string>(),
    setCheckedSelected: vi.fn(),
    setLoading: vi.fn(),
    setSelectedWards: vi.fn(),
    setSelectedWardsTotalCount: vi.fn(),
    setWardAssignments: vi.fn(),
    router: mockRouter,
    t: mockT,
    isViewAllSelectAllActive: false,
    isAvailableSelectAllActive: false,
    isRateSectionSelectAllActive: false,
    setViewAllSelectAllLoading: vi.fn(),
    setAvailableSelectAllLoading: vi.fn(),
    setIsViewAllSelectAllActive: vi.fn(),
    setIsAvailableSelectAllActive: vi.fn(),
    setIsRateSectionSelectAllActive: vi.fn(),
    viewAllSearch: "",
    availableSearch: ""
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("moveToSelected", () => {
    it("should do nothing if no wards are checked", async () => {
      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          checkedAvailable: new Set<string>(),
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      expect(defaultParams.setLoading).not.toHaveBeenCalled();
    });

    it("should show error if rate section is not found", async () => {
      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "INVALID",
          checkedAvailable: new Set(["W3"]),
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("wards.rateSectionNotFound")
      );
    });

    it("should prompt confirmation for wards already in other rate section and link if confirmed", async () => {
      vi.mocked(linkWardsToRateSectionAction).mockResolvedValue({
        success: true,
        data: { hasFailures: false, successCount: 1, failedCount: 0 },
      });

      vi.mocked(refreshSelectedWardsAction).mockResolvedValue({
        success: true,
        wardNos: ["W2"],
        totalCount: 1,
      });

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedAvailable: new Set(["W2"]), // W2 is in rate section 2
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      expect(mockConfirm).toHaveBeenCalled();
      expect(linkWardsToRateSectionAction).toHaveBeenCalledWith(1, ["W2"]);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("wards.saveSuccess")
      );
    });

    it("should successfully link valid wards", async () => {
      vi.mocked(linkWardsToRateSectionAction).mockResolvedValue({
        success: true,
        data: { hasFailures: false, successCount: 1, failedCount: 0 },
      });

      vi.mocked(refreshSelectedWardsAction).mockResolvedValue({
        success: true,
        wardNos: ["W3"],
        totalCount: 1,
      });

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedAvailable: new Set(["W3"]), // New ward, not assigned
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      expect(defaultParams.setLoading).toHaveBeenCalledWith(true);
      expect(linkWardsToRateSectionAction).toHaveBeenCalledWith(1, ["W3"]);
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("wards.saveSuccess")
      );
      expect(defaultParams.setSelectedWards).toHaveBeenCalled();
      expect(defaultParams.setWardAssignments).toHaveBeenCalled();
      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(defaultParams.setLoading).toHaveBeenCalledWith(false);
    });

    it("should show partial success warning", async () => {
      vi.mocked(linkWardsToRateSectionAction).mockResolvedValue({
        success: true,
        data: { hasFailures: true, successCount: 1, failedCount: 1 },
      });

      vi.mocked(refreshSelectedWardsAction).mockResolvedValue({
        success: true,
        wardNos: ["W3"],
        totalCount: 1,
      });

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedAvailable: new Set(["W3", "W4"]),
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      expect(toast.warning).toHaveBeenCalled();
    });

    it("should handle API error", async () => {
      vi.mocked(linkWardsToRateSectionAction).mockResolvedValue({
        success: false,
        error: "API Error",
      });

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedAvailable: new Set(["W3"]),
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      expect(toast.error).toHaveBeenCalledWith("API Error");
      expect(defaultParams.setLoading).toHaveBeenCalledWith(false);
    });

    it("should handle exception during link", async () => {
      vi.mocked(linkWardsToRateSectionAction).mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedAvailable: new Set(["W3"]),
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("wards.saveError")
      );
      expect(defaultParams.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe("moveToAvailable", () => {
    it("should do nothing if no wards are checked", async () => {
      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          checkedSelected: new Set<string>(),
        })
      );

      await act(async () => {
        await result.current.moveToAvailable();
      });

      expect(defaultParams.setLoading).not.toHaveBeenCalled();
    });

    it("should show error if rate section is not found", async () => {
      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "INVALID",
          checkedSelected: new Set(["W1"]),
        })
      );

      await act(async () => {
        await result.current.moveToAvailable();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("wards.rateSectionNotFound")
      );
    });

    it("should successfully remove wards", async () => {
      vi.mocked(deleteSelectedWardsAction).mockResolvedValue({
        success: true,
        deletedCount: 1,
      });

      vi.mocked(refreshSelectedWardsAction).mockResolvedValue({
        success: true,
        wardNos: [],
        totalCount: 0,
      });

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedSelected: new Set(["W1"]),
        })
      );

      await act(async () => {
        await result.current.moveToAvailable();
      });

      expect(defaultParams.setLoading).toHaveBeenCalledWith(true);
      expect(deleteSelectedWardsAction).toHaveBeenCalledWith(1, ["W1"]);
      expect(toast.success).toHaveBeenCalled();
      expect(defaultParams.setSelectedWards).toHaveBeenCalled();
      expect(defaultParams.setWardAssignments).toHaveBeenCalled();
      expect(mockRouter.refresh).toHaveBeenCalled();
      expect(defaultParams.setLoading).toHaveBeenCalledWith(false);
    });

    it("should handle API error during delete", async () => {
      vi.mocked(deleteSelectedWardsAction).mockResolvedValue({
        success: false,
        deletedCount: 0,
        error: "Delete failed",
      });

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedSelected: new Set(["W1"]),
        })
      );

      await act(async () => {
        await result.current.moveToAvailable();
      });

      expect(toast.error).toHaveBeenCalledWith("Delete failed");
      expect(defaultParams.setLoading).toHaveBeenCalledWith(false);
    });

    it("should handle exception during delete", async () => {
      vi.mocked(deleteSelectedWardsAction).mockRejectedValue(
        new Error("Network error")
      );

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedSelected: new Set(["W1"]),
        })
      );

      await act(async () => {
        await result.current.moveToAvailable();
      });

      expect(toast.error).toHaveBeenCalledWith(
        expect.stringContaining("wards.deleteError")
      );
      expect(defaultParams.setLoading).toHaveBeenCalledWith(false);
    });
  });

  describe("Optimistic UI updates", () => {
    it("should immediately update selectedWards when moving to selected", async () => {
      vi.mocked(linkWardsToRateSectionAction).mockResolvedValue({
        success: true,
        data: { hasFailures: false, successCount: 1, failedCount: 0 },
      });

      vi.mocked(refreshSelectedWardsAction).mockResolvedValue({
        success: true,
        wardNos: ["W3"],
        totalCount: 1,
      });

      const setSelectedWards = vi.fn();
      const setSelectedWardsTotalCount = vi.fn();

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedAvailable: new Set(["W3"]),
          setSelectedWards,
          setSelectedWardsTotalCount,
        })
      );

      await act(async () => {
        await result.current.moveToSelected();
      });

      // Should be called twice: once for optimistic update, once for server data
      expect(setSelectedWards).toHaveBeenCalledTimes(2);
      expect(setSelectedWardsTotalCount).toHaveBeenCalledTimes(2);
    });

    it("should immediately update selectedWards when moving to available", async () => {
      vi.mocked(deleteSelectedWardsAction).mockResolvedValue({
        success: true,
        deletedCount: 1,
      });

      vi.mocked(refreshSelectedWardsAction).mockResolvedValue({
        success: true,
        wardNos: [],
        totalCount: 0,
      });

      const setSelectedWards = vi.fn();
      const setSelectedWardsTotalCount = vi.fn();

      const { result } = renderHook(() =>
        useLinkWardActions({
          ...defaultParams,
          selectedZoneNo: "1",
          checkedSelected: new Set(["W1"]),
          selectedWards: ["W1"],
          setSelectedWards,
          setSelectedWardsTotalCount,
        })
      );

      await act(async () => {
        await result.current.moveToAvailable();
      });

      // Should be called twice: once for optimistic update, once for server data
      expect(setSelectedWards).toHaveBeenCalledTimes(2);
      expect(setSelectedWardsTotalCount).toHaveBeenCalledTimes(2);
    });
  });
});
