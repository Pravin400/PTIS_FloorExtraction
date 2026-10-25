import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLocalizationStringsSave } from "@/hooks/configuration-settings/multilingual-translation/useLocalizationStringsSave";
import type { MultilingualTranslation } from "@/types/multilingual-translation.types";

// Mock sonner toast
const mockToastInfo = vi.fn();
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("sonner", () => ({
  toast: {
    info: (msg: string) => mockToastInfo(msg),
    success: (msg: string) => mockToastSuccess(msg),
    error: (msg: string) => mockToastError(msg),
  },
}));

// Mock auth cookies
vi.mock("@/lib/utils/auth-session", () => ({
  getUserIdFromCookies: () => 123,
}));

// Mock actions
const mockBulkUpdateAction = vi.fn();

vi.mock("@/app/[locale]/configuration-settings/multilingual-translation/action", () => ({
  bulkUpdateMultilingualTranslationsAction: (items: unknown) => mockBulkUpdateAction(items),
}));

describe("useLocalizationStringsSave", () => {
  const mockData: MultilingualTranslation[] = [
    {
      id: 1,
      resource: "common",
      key: "greeting",
      en_US: "Hello",
      hi_IN: "नमस्ते",
      mr_IN: "नमस्कार",
    },
    {
      id: 2,
      resource: "common",
      key: "goodbye",
      en_US: "Goodbye",
      hi_IN: "",
      mr_IN: "",
    },
  ];

  const mockT = (key: string) => key;
  const mockTCommon = (key: string) => key;
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockBulkUpdateAction.mockResolvedValue({ success: true });
  });

  describe("initial state", () => {
    it("should initialize with isSaving false", () => {
      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits: {},
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      expect(result.current.isSaving).toBe(false);
    });

    it("should provide handleSaveAll function", () => {
      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits: {},
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      expect(typeof result.current.handleSaveAll).toBe("function");
    });
  });

  describe("handleSaveAll - no changes", () => {
    it("should show info toast when no edits", async () => {
      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits: {},
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      expect(mockToastInfo).toHaveBeenCalledWith("messages.noChanges");
      expect(mockBulkUpdateAction).not.toHaveBeenCalled();
    });

    it("should show info toast when rows have no translations", async () => {
      const dataWithoutTranslations: MultilingualTranslation[] = [
        {
          id: 3,
          resource: "common",
          key: "test",
          en_US: "Test",
          hi_IN: "",
          mr_IN: "",
        },
      ];

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: dataWithoutTranslations,
          edits: {},
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      expect(mockToastInfo).toHaveBeenCalledWith("messages.noChanges");
    });
  });

  describe("handleSaveAll - with edits", () => {
    it("should call bulk update action with edited rows", async () => {
      const edits = {
        2: { hi_IN: "अलविदा", mr_IN: "निरोप" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      expect(mockBulkUpdateAction).toHaveBeenCalledWith([
        {
          id: 2,
          data: {
            resource: "common",
            key: "goodbye",
            en_US: "Goodbye",
            hi_IN: "अलविदा",
            mr_IN: "निरोप",
          },
        },
      ]);
    });

    it("should show success toast on successful save", async () => {
      const edits = {
        1: { hi_IN: "नया" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("messages.saveSuccess");
      });
    });

    it("should call onSuccess callback after successful save", async () => {
      const edits = {
        1: { hi_IN: "परीक्षण" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it("should show error toast on failed save", async () => {
      mockBulkUpdateAction.mockResolvedValue({
        success: false,
        message: "Server error",
      });

      const edits = {
        1: { hi_IN: "त्रुटि" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Server error");
      });
    });

    it("should use fallback error message when server message is missing", async () => {
      mockBulkUpdateAction.mockResolvedValue({
        success: false,
      });

      const edits = {
        1: { hi_IN: "त्रुटि" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("errors.saveFailed");
      });
    });

    it("should not call onSuccess on failed save", async () => {
      mockBulkUpdateAction.mockResolvedValue({
        success: false,
        message: "Error",
      });

      const edits = {
        1: { hi_IN: "test" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("isSaving state", () => {
    it("should set isSaving to true during save", async () => {
      mockBulkUpdateAction.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      const edits = {
        1: { hi_IN: "test" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      act(() => {
        result.current.handleSaveAll();
      });

      expect(result.current.isSaving).toBe(true);

      await waitFor(() => {
        expect(result.current.isSaving).toBe(false);
      });
    });

    it("should reset isSaving after error", async () => {
      mockBulkUpdateAction.mockResolvedValue({
        success: false,
        message: "Error",
      });

      const edits = {
        1: { hi_IN: "test" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      expect(result.current.isSaving).toBe(false);
    });
  });

  describe("payload building", () => {
    it("should use draft values over original values", async () => {
      const edits = {
        1: { hi_IN: "नया हिंदी", mr_IN: "नवीन मराठी" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      const payload = mockBulkUpdateAction.mock.calls[0][0];
      expect(payload[0].data.hi_IN).toBe("नया हिंदी");
      expect(payload[0].data.mr_IN).toBe("नवीन मराठी");
    });

    it("should handle partial edits (only one field)", async () => {
      const edits = {
        1: { hi_IN: "केवल हिंदी" },
      };

      const { result } = renderHook(() =>
        useLocalizationStringsSave({
          data: mockData,
          edits,
          onSuccess: mockOnSuccess,
          t: mockT,
          tCommon: mockTCommon,
        })
      );

      await act(async () => {
        await result.current.handleSaveAll();
      });

      const payload = mockBulkUpdateAction.mock.calls[0][0];
      expect(payload[0].data.hi_IN).toBe("केवल हिंदी");
      expect(payload[0].data.mr_IN).toBe("नमस्कार"); // Original value
    });
  });
});
