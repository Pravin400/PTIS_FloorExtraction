import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMoujaMasterHandlers } from "@/hooks/moujamaster/useMoujaMasterHandlers";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteMoujaAction } from "@/app/[locale]/property-tax/moujamaster/action";
import type { Mouja } from "@/types/mouja.types";

type TranslationFunction = ReturnType<typeof import("next-intl").useTranslations>;

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/moujamaster/action", () => ({
  deleteMoujaAction: vi.fn(),
}));

describe("useMoujaMasterHandlers", () => {
  const mockPush = vi.fn();
  const mockRefresh = vi.fn();
  const mockConfirm = vi.fn();
  const mockStartTransition = vi.fn((cb: () => void) => cb());
  
  const mockT = vi.fn((key: string, values?: Record<string, unknown>) => {
    if (key === "delete.confirmDescription") return "Are you sure you want to delete?";
    if (key === "success.deleted") return `Successfully deleted ${values?.code}`;
    if (key === "apiErrors.inUse") return "Record is in use";
    if (key === "apiErrors.validationError") return "Validation Error";
    if (key === "apiErrors.notFound") return "Record not found";
    return key;
  });
  
  const mockTCommon = vi.fn((key: string) => {
    if (key === "errors.deleteError") return "Generic Delete Error";
    return key;
  });

  const defaultProps = {
    locale: "en",
    t: mockT as unknown as TranslationFunction,
    tCommon: mockTCommon as unknown as TranslationFunction,
    confirm: mockConfirm,
    startTransition: mockStartTransition,
  };

  const mockMouja: Mouja = {
    id: 123,
    moujaNo: "M-001",
    moujaName: "Test Mouja",
    isActive: true,
    createdDate: "2024-01-01",
    updatedDate: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  describe("handleEdit", () => {
    it("should navigate to edit page on handleEdit", () => {
      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      act(() => {
        result.current.handleEdit(mockMouja);
      });

      expect(mockStartTransition).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/en/property-tax/moujamaster/edit/123");
    });
  });

  describe("handleDelete", () => {
    it("should call confirm with correct options", () => {
      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      act(() => {
        result.current.handleDelete(mockMouja);
      });

      expect(mockConfirm).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "delete",
          title: "M-001 - Test Mouja",
          description: "Are you sure you want to delete?",
          meta: { name: "Test Mouja" },
          onConfirm: expect.any(Function),
        })
      );
    });

    it("should delete successfully and refresh list", async () => {
      (deleteMoujaAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: true,
      });

      // Extract onConfirm and call it
      mockConfirm.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      await act(async () => {
        result.current.handleDelete(mockMouja);
      });

      expect(deleteMoujaAction).toHaveBeenCalled();
      const fdCallArg = (deleteMoujaAction as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fdCallArg.get("id")).toBe("123");

      expect(toast.success).toHaveBeenCalledWith("Successfully deleted M-001");
      expect(mockRefresh).toHaveBeenCalled();
    });

    it("should handle 409 in use error", async () => {
      (deleteMoujaAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        statusCode: 409,
      });

      mockConfirm.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      await act(async () => {
        result.current.handleDelete(mockMouja);
      });

      expect(toast.error).toHaveBeenCalledWith("Record is in use");
    });

    it("should handle 400 validation error", async () => {
      (deleteMoujaAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        statusCode: 400,
      });

      mockConfirm.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      await act(async () => {
        result.current.handleDelete(mockMouja);
      });

      expect(toast.error).toHaveBeenCalledWith("Validation Error");
    });

    it("should handle 404 not found error", async () => {
      (deleteMoujaAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        statusCode: 404,
      });

      mockConfirm.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      await act(async () => {
        result.current.handleDelete(mockMouja);
      });

      expect(toast.error).toHaveBeenCalledWith("Record not found");
    });

    it("should handle specific API error message", async () => {
      (deleteMoujaAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        statusCode: 500,
        message: "Internal server issue occurred",
      });

      mockConfirm.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      await act(async () => {
        result.current.handleDelete(mockMouja);
      });

      expect(toast.error).toHaveBeenCalledWith("Internal server issue occurred");
    });

    it("should handle generic delete error as fallback", async () => {
      (deleteMoujaAction as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
      });

      mockConfirm.mockImplementation(({ onConfirm }) => {
        onConfirm();
      });

      const { result } = renderHook(() => useMoujaMasterHandlers(defaultProps));

      await act(async () => {
        result.current.handleDelete(mockMouja);
      });

      expect(toast.error).toHaveBeenCalledWith("Generic Delete Error");
    });
  });
});
