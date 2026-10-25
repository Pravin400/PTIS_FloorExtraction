import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLocalDeviceUpload } from "@/hooks/PropertyMedia/uploadDownload/useLocalDeviceUpload";
import * as serverActions from "@/app/[locale]/property-tax/property-media/action";

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/components/common", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
  }),
}));

vi.mock("@/app/[locale]/property-tax/property-media/action", () => ({
  uploadBrowseMatchMediaAction: vi.fn(),
}));

describe("useLocalDeviceUpload", () => {
  const mockOnClearFiles = vi.fn();
  const mockUpdateQueries = vi.fn();
  const mockSetTouched = vi.fn();
  const mockSetErrors = vi.fn();
  const mockTranslate = (key: string) => key;
  const mockMapApiError = ({ message }: { message?: string }) => message || "API Error";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Validation", () => {
    it("validates missing category and subCategory and aborts upload", async () => {
      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "",
          subCategory: "",
          selectedFiles: [],
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(mockSetTouched).toHaveBeenCalled();
      expect(mockSetErrors).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith("uploadDownloadDrawer.validation.categoryRequired");
    });

    it("validates missing files when category and subCategory are present", async () => {
      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "1",
          subCategory: "101",
          selectedFiles: [],
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(mockToastError).toHaveBeenCalledWith("uploadDownloadDrawer.noFilesSelectedError");
    });

    it("validates maximum 10 files limit and aborts upload regardless of file type", async () => {
      const files = Array.from(
        { length: 11 },
        (_, i) => new File(["file content"], `file_${i}.${i % 2 === 0 ? "pdf" : "jpg"}`, {
          type: i % 2 === 0 ? "application/pdf" : "image/jpeg",
        })
      );

      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "1",
          subCategory: "101",
          selectedFiles: files,
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(mockToastError).toHaveBeenCalledWith("uploadDownloadDrawer.validation.maxFilesExceeded");
    });

    it("validates total file size limit when exceeding 20MB and aborts upload", async () => {
      const oversizedFile = new File([new ArrayBuffer(21 * 1024 * 1024)], "document.pdf", {
        type: "application/pdf",
      });

      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "1",
          subCategory: "101",
          selectedFiles: [oversizedFile],
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(mockToastError).toHaveBeenCalledWith("uploadDownloadDrawer.validation.maxFileSizeExceeded");
    });

    it("validates total combined file size limit when multiple files together exceed 20MB", async () => {
      const file1 = new File([new ArrayBuffer(11 * 1024 * 1024)], "plan.pdf", {
        type: "application/pdf",
      });
      const file2 = new File([new ArrayBuffer(11 * 1024 * 1024)], "photo.jpg", {
        type: "image/jpeg",
      });

      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "1",
          subCategory: "101",
          selectedFiles: [file1, file2],
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(mockToastError).toHaveBeenCalledWith("uploadDownloadDrawer.validation.maxFileSizeExceeded");
    });
  });

  describe("Action Execution", () => {
    it("successfully uploads files and updates previewId in queries", async () => {
      const dummyFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      const spyAction = vi.spyOn(serverActions, "uploadBrowseMatchMediaAction").mockResolvedValue({
        success: true,
        data: {
          previewId: "preview-xyz-123",
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalMatched: 1,
          totalUnmatched: 0,
          items: [],
        },
        message: "Upload successful",
      });

      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "1",
          subCategory: "101",
          selectedFiles: [dummyFile],
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(spyAction).toHaveBeenCalled();
      expect(mockToastSuccess).toHaveBeenCalledWith("uploadDownloadDrawer.filesMatchedSummary");
      expect(mockOnClearFiles).not.toHaveBeenCalled();
      expect(mockUpdateQueries).toHaveBeenCalledWith({
        previewId: "preview-xyz-123",
        sourceTab: "device",
        page: 1,
      });
      expect(result.current.isUploadingLocal).toBe(false);
    });

    it("handles action failure response with error toast", async () => {
      const dummyFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      vi.spyOn(serverActions, "uploadBrowseMatchMediaAction").mockResolvedValue({
        success: false,
        error: "Server processing failed",
      });

      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "1",
          subCategory: "101",
          selectedFiles: [dummyFile],
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(mockToastError).toHaveBeenCalledWith("Server processing failed");
      expect(result.current.isUploadingLocal).toBe(false);
    });

    it("handles unexpected thrown errors with mapApiError", async () => {
      const dummyFile = new File(["test"], "photo.jpg", { type: "image/jpeg" });
      vi.spyOn(serverActions, "uploadBrowseMatchMediaAction").mockRejectedValue(
        new Error("Network disconnect")
      );

      const { result } = renderHook(() =>
        useLocalDeviceUpload({
          category: "1",
          subCategory: "101",
          selectedFiles: [dummyFile],
          onClearFiles: mockOnClearFiles,
          updateQueries: mockUpdateQueries,
          setTouched: mockSetTouched,
          setErrors: mockSetErrors,
          t: mockTranslate,
          mapApiError: mockMapApiError,
        })
      );

      await act(async () => {
        await result.current.handleLocalUpload();
      });

      expect(mockToastError).toHaveBeenCalledWith("Network disconnect");
      expect(result.current.isUploadingLocal).toBe(false);
    });
  });
});
