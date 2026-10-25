import { renderHook, act } from "@testing-library/react";
import { vi } from "vitest";
import { usePropertyDelete } from "@/hooks/zoneMaster/usePropertyDelete";
import type { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import type { ConfirmContextType } from "@/components/common/ConfirmProvider";

// ── External dependencies ────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/components/common/ConfirmProvider", () => ({
  useConfirm: vi.fn(() => ({ confirm: vi.fn() })),
}));

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  deletePropertyAction: vi.fn(),
  deleteBulkPropertiesAction: vi.fn(),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/components/common/ConfirmProvider";
import {
  deletePropertyAction,
  deleteBulkPropertiesAction,
} from "@/app/[locale]/property-tax/zone-master/actions";

const mockRefresh = vi.fn();
vi.mocked(useRouter).mockImplementation(() => ({
  refresh: mockRefresh,
  push: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
} as unknown as ReturnType<typeof useRouter>));

const makeProperty = (overrides?: Partial<ZonePropertyItem>): ZonePropertyItem => ({
  id: 1,
  propertyNo: "PROP-001",
  taxZoneId: 1,
  wardId: 10,
  partitionNo: null,
  propertyTypeId: null,
  upicId: "",
  openPlot: false,
  csn: null,
  subZoneNo: null,
  plotNo: null,
  categoryId: null,
  type: null,
  ownerTitle: null,
  ownerName: null,
  ownerTitleEnglish: null,
  ownerNameEnglish: null,
  occupierTitle: null,
  occupierName: null,
  occupierTitleEnglish: null,
  occupierNameEnglish: null,
  flatOrShopNo: null,
  flatOrShopName: null,
  flatOrShopNoEnglish: null,
  flatOrShopNameEnglish: null,
  address: null,
  location: null,
  addressEnglish: null,
  locationEnglish: null,
  mobileNo: null,
  emailId: null,
  societyDetailId: null,
  markedForDeletion: false,
  propertySeqNo: null,
  displayProperty: null,
  isActive: true,
  createdDate: "2024-01-01T00:00:00Z",
  updatedDate: null,
  ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

describe("usePropertyDelete", () => {
  let onClearSelection: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    onClearSelection = vi.fn();
  });

  // ── Initial state ──────────────────────────────────────────────────────────

  it("initialises isDeleting as false", () => {
    const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
    expect(result.current.isDeleting).toBe(false);
  });

  it("exposes handleSingleDelete and handleBulkDelete as functions", () => {
    const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
    expect(typeof result.current.handleSingleDelete).toBe("function");
    expect(typeof result.current.handleBulkDelete).toBe("function");
  });

  // ── handleSingleDelete ─────────────────────────────────────────────────────

  describe("handleSingleDelete", () => {
    it("calls confirm with delete variant and the property's name", () => {
      const confirmMock = vi.fn();
      vi.mocked(useConfirm).mockReturnValue({ confirm: confirmMock });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      const property = makeProperty({ id: 42, propertyNo: "PROP-042" });

      act(() => { result.current.handleSingleDelete(property); });

      expect(confirmMock).toHaveBeenCalledOnce();
      const payload = confirmMock.mock.calls[0][0];
      expect(payload.variant).toBe("delete");
      expect(payload.title).toBe("Delete Property");
      expect(payload.description).toContain("PROP-042");
    });

    it("calls deletePropertyAction with the property id on confirm", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deletePropertyAction).mockResolvedValue({ success: true, message: "Deleted" });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleSingleDelete(makeProperty({ id: 7 })); });

      await act(async () => { await capturedOnConfirm?.(); });

      expect(deletePropertyAction).toHaveBeenCalledWith("7");
    });

    it("shows success toast and refreshes router on successful single delete", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deletePropertyAction).mockResolvedValue({
        success: true,
        message: "Property deleted successfully.",
      });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleSingleDelete(makeProperty()); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.success).toHaveBeenCalledWith("Property deleted successfully.");
      expect(mockRefresh).toHaveBeenCalled();
      expect(onClearSelection).toHaveBeenCalled();
    });

    it("shows error toast when delete action returns failure", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deletePropertyAction).mockResolvedValue({
        success: false,
        error: "Cannot delete – property has linked records.",
      });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleSingleDelete(makeProperty()); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.error).toHaveBeenCalledWith("Cannot delete – property has linked records.");
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("falls back to generic error message when action returns no error text", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deletePropertyAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleSingleDelete(makeProperty()); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.error).toHaveBeenCalledWith("Failed to delete property.");
    });

    it("shows generic error toast when deletePropertyAction throws", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deletePropertyAction).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleSingleDelete(makeProperty()); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.error).toHaveBeenCalledWith("Failed to delete property.");
    });

    it("resets isDeleting to false after successful delete", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deletePropertyAction).mockResolvedValue({ success: true });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleSingleDelete(makeProperty()); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(result.current.isDeleting).toBe(false);
    });

    it("resets isDeleting to false even when delete throws", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deletePropertyAction).mockRejectedValue(new Error("boom"));

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleSingleDelete(makeProperty()); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(result.current.isDeleting).toBe(false);
    });
  });

  // ── handleBulkDelete ───────────────────────────────────────────────────────

  describe("handleBulkDelete", () => {
    it("does nothing when selectedIds is empty", () => {
      const confirmMock = vi.fn();
      vi.mocked(useConfirm).mockReturnValue({ confirm: confirmMock });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete([]); });

      expect(confirmMock).not.toHaveBeenCalled();
    });

    it("calls confirm with correct count in description for multiple properties", () => {
      const confirmMock = vi.fn();
      vi.mocked(useConfirm).mockReturnValue({ confirm: confirmMock });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["1", "2", "3"]); });

      expect(confirmMock).toHaveBeenCalledOnce();
      const payload = confirmMock.mock.calls[0][0];
      expect(payload.variant).toBe("delete");
      expect(payload.title).toBe("Delete Selected Properties");
      expect(payload.description).toContain("3");
      expect(payload.description).toContain("properties");
    });

    it("uses singular 'property' in description when count is 1", () => {
      const confirmMock = vi.fn();
      vi.mocked(useConfirm).mockReturnValue({ confirm: confirmMock });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["99"]); });

      const payload = confirmMock.mock.calls[0][0];
      expect(payload.description).toContain("property");
    });

    it("calls deleteBulkPropertiesAction with the provided ids on confirm", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deleteBulkPropertiesAction).mockResolvedValue({
        success: true,
        message: "2 properties deleted successfully.",
      });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      const ids = ["5", "6"];
      act(() => { result.current.handleBulkDelete(ids); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(deleteBulkPropertiesAction).toHaveBeenCalledWith(ids);
    });

    it("shows success toast, refreshes router, and clears selection on bulk success", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deleteBulkPropertiesAction).mockResolvedValue({
        success: true,
        message: "2 properties deleted successfully.",
      });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["5", "6"]); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.success).toHaveBeenCalledWith("2 properties deleted successfully.");
      expect(mockRefresh).toHaveBeenCalled();
      expect(onClearSelection).toHaveBeenCalled();
    });

    it("falls back to default success message when action returns none", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deleteBulkPropertiesAction).mockResolvedValue({ success: true });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["1", "2"]); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.success).toHaveBeenCalledWith("2 properties deleted successfully.");
    });

    it("shows error toast when bulk action returns failure", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deleteBulkPropertiesAction).mockResolvedValue({
        success: false,
        error: "Backend rejected the request.",
      });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["1"]); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.error).toHaveBeenCalledWith("Backend rejected the request.");
    });

    it("falls back to generic error message when bulk action returns no error text", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deleteBulkPropertiesAction).mockResolvedValue({ success: false });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["1"]); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.error).toHaveBeenCalledWith("Failed to delete selected properties.");
    });

    it("shows generic error toast when deleteBulkPropertiesAction throws", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deleteBulkPropertiesAction).mockRejectedValue(new Error("Network failure"));

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["1", "2"]); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(toast.error).toHaveBeenCalledWith("Failed to delete selected properties.");
    });

    it("resets isDeleting to false after bulk delete completes", async () => {
      let capturedOnConfirm: (() => Promise<void>) | undefined;
      vi.mocked(useConfirm).mockReturnValue({
        confirm: (payload: { onConfirm?: () => Promise<void> }) => {
          capturedOnConfirm = payload.onConfirm;
        },
      } as ConfirmContextType);
      vi.mocked(deleteBulkPropertiesAction).mockResolvedValue({ success: true });

      const { result } = renderHook(() => usePropertyDelete({ onClearSelection }));
      act(() => { result.current.handleBulkDelete(["1"]); });
      await act(async () => { await capturedOnConfirm?.(); });

      expect(result.current.isDeleting).toBe(false);
    });
  });
});
