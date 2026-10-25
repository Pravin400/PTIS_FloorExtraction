import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRoomSubmissionSidebar } from "@/hooks/apartmentQc/useRoomSubmissionSidebar";
import { toast } from 'sonner';
import type { FloorDataRow, PropertyEditFormCopy } from "@/types/propertyEdit.types";

// Mock the action
vi.mock('@/app/[locale]/property-tax/ptis/appartmentQC/action', () => ({
  fetchRoomWiseSubmissionsAction: vi.fn(),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useRoomSubmissionSidebar", () => {
  const mockPropertyId = 12345;
  const mockOnAreaUpdate = vi.fn();
  const mockCopy = {
    pageTitle: "Property Edit",
    badges: {
      ward: "Ward",
      zone: "Zone",
      prop: "Property",
      type: "Type",
    },
    buttons: {
      back: "Back",
      save: "Save",
      saving: "Saving...",
    },
    messages: {
      propertyIdMissing: "Property ID missing",
      validationErrors: "Validation errors",
      floorQCValidationError: "Floor QC validation error",
      basicDetailsUpdateFailed: "Basic details update failed",
      floorQCUpdateFailed: "Floor QC update failed",
      allChangesSaved: "All changes saved",
      basicDetailsUpdated: "Basic details updated",
      roomDataUpdated: "Room data updated",
      failedToLoadRooms: "Failed to load rooms",
      cannotOpenRoomSubmission: "Cannot open room submission",
    },
    basicInfo: {
      title: "Basic Info",
      fields: {} as Record<string, unknown>,
      validation: {} as Record<string, unknown>,
    },
    floorQC: {
      title: "Floor QC",
      columns: {} as Record<string, unknown>,
      tabs: {} as Record<string, unknown>,
      validation: {} as Record<string, unknown>,
      tooltips: {} as Record<string, unknown>,
    },
  } as PropertyEditFormCopy;

  const mockFloorRow: FloorDataRow = {
    id: "row-1",
    pdnId: 123,
    floorId: "1",
    conYear: "2020",
    asstYear: "2023",
    constructionTypeId: "1",
    typeOfUseId: "1",
    subTypeOfUseId: "1",
    noOfRooms: "3",
    area: "1000",
    rentMY: "",
    rateMY: "",
    rentalValue: "",
    depreciation: "",
    alv: "",
    mr: "",
    rv: "",
    sdrr: "",
    baseValue: "",
    floorFactor: "",
    ageFactor: "",
    ntbFactor: "",
    useFactor: "",
    capitalValue: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with closed state", () => {
    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.selectedFloorRow).toBeNull();
    expect(result.current.state.areaUnit).toBe("sq.m");
    expect(result.current.state.isLoading).toBe(false);
    expect(result.current.state.existingRooms).toEqual([]);
  });

  it("should show error toast when opening sidebar without pdnId", async () => {
    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    const rowWithoutPdnId: FloorDataRow = { ...mockFloorRow, pdnId: null };

    await act(async () => {
      await result.current.handleOpen(rowWithoutPdnId);
    });

    expect(toast.error).toHaveBeenCalledWith("Cannot open room submission");
    expect(result.current.state.isOpen).toBe(false);
  });

  it("should open sidebar with valid floor row", async () => {
    const { fetchRoomWiseSubmissionsAction } = await import(
      "@/app/[locale]/property-tax/ptis/appartmentQC/action"
    );
    vi.mocked(fetchRoomWiseSubmissionsAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    await act(async () => {
      await result.current.handleOpen(mockFloorRow);
    });

    await waitFor(() => {
      expect(result.current.state.isOpen).toBe(true);
      expect(result.current.state.selectedFloorRow).toEqual(mockFloorRow);
    });
  });

  it("should close sidebar", () => {
    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    act(() => {
      result.current.handleClose();
    });

    expect(result.current.state.isOpen).toBe(false);
    expect(result.current.state.selectedFloorRow).toBeNull();
    expect(result.current.state.existingRooms).toEqual([]);
  });

  it("should toggle area unit", () => {
    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    expect(result.current.state.areaUnit).toBe("sq.m");

    act(() => {
      result.current.handleToggleUnit();
    });

    expect(result.current.state.areaUnit).toBe("sq.ft");

    act(() => {
      result.current.handleToggleUnit();
    });

    expect(result.current.state.areaUnit).toBe("sq.m");
  });

  it("should fetch existing rooms when opening sidebar", async () => {
    const mockRooms = [
      { id: 1, roomNo: "Room 1", roomTypeId: 1 },
      { id: 2, roomNo: "Room 2", roomTypeId: 2 },
    ];

    const { fetchRoomWiseSubmissionsAction } = await import(
      "@/app/[locale]/property-tax/ptis/appartmentQC/action"
    );
    vi.mocked(fetchRoomWiseSubmissionsAction).mockResolvedValue({
      success: true,
      data: mockRooms,
    });

    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    await act(async () => {
      await result.current.handleOpen(mockFloorRow);
    });

    await waitFor(() => {
      expect(result.current.state.existingRooms).toHaveLength(2);
      expect(result.current.state.existingRooms[0].roomNo).toBe("Room 1");
      expect(result.current.state.existingRooms[1].roomNo).toBe("Room 2");
    });
  });

  it("should show error toast when fetching rooms fails", async () => {
    const { fetchRoomWiseSubmissionsAction } = await import(
      "@/app/[locale]/property-tax/ptis/appartmentQC/action"
    );
    vi.mocked(fetchRoomWiseSubmissionsAction).mockRejectedValue(
      new Error("API Error")
    );

    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    await act(async () => {
      await result.current.handleOpen(mockFloorRow);
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to load rooms");
    });
  });

  it("should update floor area after room submission", async () => {
    const { fetchRoomWiseSubmissionsAction } = await import(
      "@/app/[locale]/property-tax/ptis/appartmentQC/action"
    );
    vi.mocked(fetchRoomWiseSubmissionsAction).mockResolvedValue({
      success: true,
      data: [],
    });

    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    await act(async () => {
      await result.current.handleOpen(mockFloorRow);
    });

    const updateData = {
      floorNumber: "1",
      rooms: [],
      totalAreaSqM: 1200,
      builtUpAreaSqM: 1200,
      roomCount: 3,
    };

    await act(async () => {
      await result.current.handleUpdate(updateData);
    });

    await waitFor(() => {
      expect(mockOnAreaUpdate).toHaveBeenCalledWith("row-1", "1200.00");
    });
  });

  it("should set loading state during fetch", async () => {
    const { fetchRoomWiseSubmissionsAction } = await import(
      "@/app/[locale]/property-tax/ptis/appartmentQC/action"
    );
    
    // Create a promise that we can control
    let resolvePromise: (value: { success: true; data: unknown[] }) => void;
    const promise = new Promise<{ success: true; data: unknown[] }>((resolve) => {
      resolvePromise = resolve;
    });
    
    vi.mocked(fetchRoomWiseSubmissionsAction).mockReturnValue(promise);

    const { result } = renderHook(() =>
      useRoomSubmissionSidebar({
        propertyId: mockPropertyId,
        onAreaUpdate: mockOnAreaUpdate,
        copy: mockCopy,
      })
    );

    // Start opening - should set loading to true
    act(() => {
      result.current.handleOpen(mockFloorRow);
    });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(true);
    });

    // Resolve the promise
    await act(async () => {
      resolvePromise!({ success: true, data: [] });
      await promise;
    });

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });
  });
});
