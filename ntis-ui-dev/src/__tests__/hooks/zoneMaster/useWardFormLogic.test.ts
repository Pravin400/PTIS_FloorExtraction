import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWardFormLogic } from "@/hooks/zoneMaster/useWardFormLogic";
import { getWardByIdAction, updateWardAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { toast } from "sonner";
import { WardItem } from "@/types/wardMaster.types";

// Mock dependencies
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  getWardByIdAction: vi.fn(),
  updateWardAction: vi.fn(),
}));

describe("useWardFormLogic", () => {
  const mockT = vi.fn((key: string) => key);
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

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

  const mockInitialData: WardItem = {
    id: 1,
    wardNo: "W1",
    zoneId: 1,
    description: "Ward One",
    sequenceNo: 1,
    isActive: true,
    createdDate: "2024-01-01",
    updatedDate: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty form state", () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: false,
        wardId: "1",
        wards: mockWards,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    expect(result.current.form.wardNo).toBe("");
    expect(result.current.form.description).toBe("");
    expect(result.current.form.sequenceNo).toBe("");
    expect(result.current.form.isActive).toBe(true);
  });

  it("should initialize with SSR data when provided", async () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form.wardNo).toBe("W1");
      expect(result.current.form.description).toBe("Ward One");
      expect(result.current.form.sequenceNo).toBe("1");
    });
  });

  it("should fetch ward data when SSR data is not available", async () => {
    const mockFetchedWard: WardItem = {
      id: 2,
      wardNo: "W2",
      zoneId: 1,
      description: "Ward Two",
      sequenceNo: 2,
      isActive: true,
      createdDate: "2024-01-02",
      updatedDate: null,
    };

    vi.mocked(getWardByIdAction).mockResolvedValueOnce({
      success: true,
      data: mockFetchedWard,
    });

    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "2",
        wards: [],
        onClose: mockOnClose,
        t: mockT,
      })
    );

    expect(result.current.fetching).toBe(true);

    await waitFor(() => {
      expect(result.current.fetching).toBe(false);
    });

    expect(getWardByIdAction).toHaveBeenCalledWith("2");
  });

  it("should use ward from list if API fetch is not needed", async () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form.wardNo).toBe("W1");
    });

    expect(getWardByIdAction).not.toHaveBeenCalled();
  });

  it("should validate ward number", () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    act(() => {
      result.current.setForm({
        wardNo: "",
        description: "Test",
        sequenceNo: "1",
        isActive: true,
      });
    });
  });

  it("should detect duplicate ward number", async () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form).toBeDefined();
    });

    act(() => {
      result.current.setForm({
        wardNo: "W2", // Duplicate
        description: "Different Description",
        sequenceNo: "10",
        isActive: true,
      });
    });

    const mockRefresh = vi.fn();
    await act(async () => {
      await result.current.handleSave(mockRefresh);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("should detect duplicate sequence number", async () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form).toBeDefined();
    });

    act(() => {
      result.current.setForm({
        wardNo: "W10",
        description: "New Ward",
        sequenceNo: "2", // Duplicate
        isActive: true,
      });
    });

    const mockRefresh = vi.fn();
    await act(async () => {
      await result.current.handleSave(mockRefresh);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("should validate sequence number is numeric", async () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form).toBeDefined();
    });

    act(() => {
      result.current.setForm({
        wardNo: "W10",
        description: "New Ward",
        sequenceNo: "abc", // Non-numeric
        isActive: true,
      });
    });

    const mockRefresh = vi.fn();
    await act(async () => {
      await result.current.handleSave(mockRefresh);
    });

    expect(result.current.errors.sequenceNo).toBeDefined();
  });

  it("should validate sequence number range", async () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form).toBeDefined();
    });

    act(() => {
      result.current.setForm({
        wardNo: "W10",
        description: "New Ward",
        sequenceNo: "1000", // Out of range
        isActive: true,
      });
    });

    const mockRefresh = vi.fn();
    await act(async () => {
      await result.current.handleSave(mockRefresh);
    });

    expect(result.current.errors.sequenceNo).toBeDefined();
  });

  it("should handle successful save", async () => {
    vi.mocked(updateWardAction).mockResolvedValueOnce({ success: true, data: null });

    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        onSuccess: mockOnSuccess,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form.wardNo).toBe("W1");
    });

    act(() => {
      result.current.setForm({
        wardNo: "W1-Updated",
        description: "Updated Ward",
        sequenceNo: "10",
        isActive: true,
      });
    });

    const mockRefresh = vi.fn();
    await act(async () => {
      await result.current.handleSave(mockRefresh);
    });

    expect(updateWardAction).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should handle API error during fetch", async () => {
    vi.mocked(getWardByIdAction).mockResolvedValueOnce({
      success: false,
      error: "API Error",
    });

    renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "999",
        wards: [],
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("should not allow duplicate with same wardId (edit mode)", async () => {
    const { result } = renderHook(() =>
      useWardFormLogic({
        open: true,
        wardId: "1",
        wards: mockWards,
        initialData: mockInitialData,
        onClose: mockOnClose,
        t: mockT,
      })
    );

    await waitFor(() => {
      expect(result.current.form.wardNo).toBe("W1");
    });

    // Keep same wardNo and sequenceNo - should not be flagged as duplicate
    const mockRefresh = vi.fn();
    vi.mocked(updateWardAction).mockResolvedValueOnce({ success: true, data: null });

    await act(async () => {
      await result.current.handleSave(mockRefresh);
    });

    // Should not show duplicate error since it's the same record
    const errorCalls = vi.mocked(toast.error).mock.calls;
    const hasDuplicateError = errorCalls.some(call => 
      call[0]?.toString().includes('duplicate')
    );
    expect(hasDuplicateError).toBe(false);
  });
});
