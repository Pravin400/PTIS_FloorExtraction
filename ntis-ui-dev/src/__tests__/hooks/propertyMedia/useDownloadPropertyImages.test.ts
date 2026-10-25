import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDownloadPropertyImages } from "@/hooks/PropertyMedia/useDownloadPropertyImages";
import * as clientApi from "@/lib/api/property-media/propertyMedia.client";

const mockToastInfo = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/components/common", () => ({
  useToast: () => ({
    info: mockToastInfo,
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("useDownloadPropertyImages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("fails with toast error if category or photoTypeId is missing", async () => {
      const { result } = renderHook(() => useDownloadPropertyImages());

      let success: boolean = true;
      await act(async () => {
        success = await result.current.handleDownloadImages({
          category: "",
          photoTypeId: "",
        });
      });

      expect(success).toBe(false);
      expect(mockToastError).toHaveBeenCalledWith(
        "uploadDownloadDrawer.validation.photoTypeAndCategoryRequired"
      );
      expect(result.current.downloadError).toBe(
        "uploadDownloadDrawer.validation.photoTypeAndCategoryRequired"
      );
      expect(result.current.isDownloading).toBe(false);
    });
  });

  describe("Successful Download", () => {
    it("downloads images archive and triggers success callbacks and toasts", async () => {
      const spyDownload = vi.spyOn(clientApi, "downloadPropertyMediaImages").mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useDownloadPropertyImages({ onSuccess }));

      let promise: Promise<boolean>;
      act(() => {
        promise = result.current.handleDownloadImages({
          category: "1",
          photoTypeId: "101",
          divisionId: "5",
          wardIds: ["1", "2"],
        });
      });

      expect(result.current.isDownloading).toBe(true);
      expect(mockToastInfo).toHaveBeenCalled();

      let success: boolean = false;
      await act(async () => {
        success = await promise;
      });

      expect(success).toBe(true);
      expect(spyDownload).toHaveBeenCalledWith({
        category: "1",
        photoTypeId: "101",
        divisionId: "5",
        wardIds: ["1", "2"],
      });
      expect(mockToastSuccess).toHaveBeenCalled();
      expect(onSuccess).toHaveBeenCalled();
      expect(result.current.isDownloading).toBe(false);
      expect(result.current.downloadError).toBeNull();
    });

    it("prevents duplicate concurrent download calls", async () => {
      let resolveDownload: () => void = () => {};
      const spyDownload = vi.spyOn(clientApi, "downloadPropertyMediaImages").mockImplementation(
        () => new Promise((resolve) => {
          resolveDownload = resolve;
        })
      );

      const { result } = renderHook(() => useDownloadPropertyImages());

      act(() => {
        result.current.handleDownloadImages({
          category: "1",
          photoTypeId: "101",
        });
      });

      expect(result.current.isDownloading).toBe(true);

      // Concurrent invocation should return false immediately
      let secondResult: boolean = true;
      await act(async () => {
        secondResult = await result.current.handleDownloadImages({
          category: "1",
          photoTypeId: "101",
        });
      });

      expect(secondResult).toBe(false);
      expect(spyDownload).toHaveBeenCalledTimes(1);

      await act(async () => {
        resolveDownload();
      });
      expect(result.current.isDownloading).toBe(false);
    });
  });

  describe("Failed Download", () => {
    it("sets downloadError, triggers toast error, and calls onError", async () => {
      const mockError = new Error("Network timeout");
      vi.spyOn(clientApi, "downloadPropertyMediaImages").mockRejectedValue(mockError);
      const onError = vi.fn();

      const { result } = renderHook(() => useDownloadPropertyImages({ onError }));

      let success: boolean = true;
      await act(async () => {
        success = await result.current.handleDownloadImages({
          category: "1",
          photoTypeId: "101",
        });
      });

      expect(success).toBe(false);
      expect(result.current.downloadError).toBe("Network timeout");
      expect(mockToastError).toHaveBeenCalledWith("Network timeout");
      expect(onError).toHaveBeenCalledWith(mockError);
      expect(result.current.isDownloading).toBe(false);
    });
  });
});
