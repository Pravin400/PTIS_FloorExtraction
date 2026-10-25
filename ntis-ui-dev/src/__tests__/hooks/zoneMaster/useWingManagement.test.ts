import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWingManagement } from "@/hooks/zoneMaster/useWingManagement";
import {
  createSocietyDetailAction,
  createWingDetailsMastAction,
  updateWingDetailsMastAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import { toast } from "sonner";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";

// Mock dependencies
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  createSocietyDetailAction: vi.fn(),
  createWingDetailsMastAction: vi.fn(),
  updateWingDetailsMastAction: vi.fn(),
}));

function makeWingDetailsMast(overrides: Partial<WingDetailsMastItem> = {}): WingDetailsMastItem {
  return {
    id: 100,
    isActive: true,
    createdBy: 1,
    createdDate: "2024-01-01",
    updatedBy: null,
    updatedDate: null,
    societyDetailsMastId: 1,
    wingMasterId: 1,
    wingName: "A",
    secretaryName: null,
    managerName: null,
    secretaryNameEnglish: null,
    managerNameEnglish: null,
    managerMobileNo: null,
    managerMobileNoRemarkId: null,
    secretaryMobileNo: null,
    secretaryMobileNoRemarkId: null,
    secretaryEmailId: null,
    managerEmailId: null,
    markedForDeletion: false,
    markedForDeletionDate: null,
    societyWingDetails: null,
    ...overrides,
  };
}

describe("useWingManagement", () => {
  const mockSetSocietyDetails = vi.fn();
  const mockSetWingDetailsMast = vi.fn();

  // At most one SocietyDetails row per property under the new model.
  const mockSocietyDetails: SocietyDetailItem[] = [
    {
      id: 1,
      propertyId: 1,
      wingId: null,
      wingName: null,
      societyName: "",
      societyAddress: "",
      secretaryName: "",
      managerName: "",
      landOwnerName: "",
      builderName: "",
      secretaryNameEnglish: "",
      societyNameEnglish: "",
      societyAddressEnglish: "",
      managerNameEnglish: "",
      landOwnerNameEnglish: "",
      builderNameEnglish: "",
      managerMobileNo: "",
      secretaryMobileNo: "",
      societyEmailId: "",
      secretaryEmailId: "",
      managerEmailId: "",
      markedForDeletion: false,
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
  ];

  const mockWings: WingItem[] = [
    {
      id: 1,
      wingNo: "A",
      sequenceNo: 1,
      createdDate: "2024-01-01",
      updatedDate: null,
      isActive: true,
    },
    {
      id: 2,
      wingNo: "B",
      sequenceNo: 2,
      createdDate: "2024-01-01",
      updatedDate: null,
      isActive: true,
    },
    {
      id: 3,
      wingNo: "C",
      sequenceNo: 3,
      createdDate: "2024-01-01",
      updatedDate: null,
      isActive: true,
    },
  ];

  // wing master ids 1 and 2 already have WingDetailsMast records
  let mockWingDetailsMast: WingDetailsMastItem[] = [
    makeWingDetailsMast({ id: 101, societyDetailsMastId: 1, wingMasterId: 1, wingName: "A" }),
    makeWingDetailsMast({ id: 102, societyDetailsMastId: 1, wingMasterId: 2, wingName: "B" }),
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockWingDetailsMast = [
      makeWingDetailsMast({ id: 101, societyDetailsMastId: 1, wingMasterId: 1, wingName: "A" }),
      makeWingDetailsMast({ id: 102, societyDetailsMastId: 1, wingMasterId: 2, wingName: "B" }),
    ];
  });

  function setup(overrides: Partial<Parameters<typeof useWingManagement>[0]> = {}) {
    return renderHook(() =>
      useWingManagement({
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        wings: mockWings,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        selectedPropertyId: 1,
        ...overrides,
      })
    );
  }

  it("should initialize with default state", () => {
    const { result } = setup();

    expect(result.current.showWingConfig).toBe(false);
    expect(result.current.showAddWingForm).toBe(false);
    expect(result.current.newWingName).toBe("");
    expect(result.current.addingWing).toBe(false);
    expect(result.current.editingWingDetailId).toBeNull();
    expect(result.current.newWingId).toBeNull();
  });

  it("should pick the next unused Wing master id as nextWingId", () => {
    // wings 1 and 2 are used (per mockWingDetailsMast); wing 3 is free
    const { result } = setup();

    expect(result.current.nextWingId).toBe(3);
  });

  it("should return null nextWingId when all wings are used", () => {
    const { result } = setup({
      wings: mockWings.slice(0, 2), // only wing masters 1 and 2 exist, both used
    });

    expect(result.current.nextWingId).toBeNull();
  });

  it("should generate wing summaries directly from WingDetailsMast", () => {
    const { result } = setup();

    expect(result.current.wingSummaries).toHaveLength(2);

    const wingA = result.current.wingSummaries.find(w => w.wingDetailId === 101);
    expect(wingA).toBeDefined();
    expect(wingA?.wingMasterId).toBe(1);
    expect(wingA?.wingNo).toBe("A");
    expect(wingA?.wingName).toBe("A");

    const wingB = result.current.wingSummaries.find(w => w.wingDetailId === 102);
    expect(wingB).toBeDefined();
    expect(wingB?.wingMasterId).toBe(2);
    expect(wingB?.wingNo).toBe("B");
    expect(wingB?.wingName).toBe("B");
  });

  it("should reuse the existing SocietyDetails record and create a new WingDetailsMast for a new wing", async () => {
    vi.mocked(createWingDetailsMastAction).mockResolvedValueOnce({
      success: true,
      data: makeWingDetailsMast({ id: 103, societyDetailsMastId: 1, wingMasterId: 3, wingName: "Wing C" }),
    });

    const { result } = setup();

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("Wing C");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    // SocietyDetails already exists for this property - should not be re-created
    expect(createSocietyDetailAction).not.toHaveBeenCalled();

    expect(createWingDetailsMastAction).toHaveBeenCalledWith(
      expect.objectContaining({
        societyDetailsMastId: 1,
        wingMasterId: 3,
        wingName: "Wing C",
        societyWingDetails: expect.objectContaining({
          wingId: 3,
          societyDetailId: 1,
          propertyId: 1,
        }),
      })
    );

    expect(mockSetWingDetailsMast).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should create a SocietyDetails record first when none exists yet for the property", async () => {
    const newSocietyDetail: SocietyDetailItem = {
      ...mockSocietyDetails[0],
      id: 5,
    };

    vi.mocked(createSocietyDetailAction).mockResolvedValueOnce({
      success: true,
      data: newSocietyDetail,
    });
    vi.mocked(createWingDetailsMastAction).mockResolvedValueOnce({
      success: true,
      data: makeWingDetailsMast({ id: 103, societyDetailsMastId: 5, wingMasterId: 3, wingName: "Wing C" }),
    });

    const { result } = setup({
      societyDetails: [], // no SocietyDetails record exists yet for this property
      wingDetailsMast: [],
    });

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("Wing C");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(createSocietyDetailAction).toHaveBeenCalledWith({
      propertyId: 1,
      isActive: true,
      createdBy: 1,
    });
    expect(createWingDetailsMastAction).toHaveBeenCalledWith(
      expect.objectContaining({ societyDetailsMastId: 5, wingMasterId: 3 })
    );
    expect(mockSetSocietyDetails).toHaveBeenCalled();
  });

  it("should not create a duplicate WingDetailsMast if one already exists for the wing", async () => {
    const { result } = setup();

    act(() => {
      result.current.setShowAddWingForm(true);
      // wing master id 1 already has a WingDetailsMast record (id 101)
      result.current.setNewWingId(1);
      result.current.setNewWingName("A");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(createSocietyDetailAction).not.toHaveBeenCalled();
    expect(createWingDetailsMastAction).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should preserve all existing wing details when updating the wing name", async () => {
    const societyWingDetails = {
      id: 1,
      isActive: true,
      createdBy: 1,
      wingId: 1,
      propertyId: 1,
      societyDetailId: 1,
      wingDetailsMastId: 101,
      fromFloor: "G",
      toFloor: "10",
      oldWingName: "A",
      newWingName: "A",
      noOfFlat: 24,
      noOfShop: 2,
      noOfRowHouse: 0,
    };
    mockWingDetailsMast = [
      makeWingDetailsMast({
        id: 101,
        societyDetailsMastId: 1,
        wingMasterId: 1,
        wingName: "A",
        secretaryName: "Secretary",
        managerName: "Manager",
        secretaryNameEnglish: "Secretary English",
        managerNameEnglish: "Manager English",
        managerMobileNo: "1234567890",
        managerMobileNoRemarkId: 2,
        secretaryMobileNo: "0987654321",
        secretaryMobileNoRemarkId: 3,
        secretaryEmailId: "secretary@example.com",
        managerEmailId: "manager@example.com",
        markedForDeletion: false,
        markedForDeletionDate: null,
        societyWingDetails,
      }),
      makeWingDetailsMast({ id: 102, societyDetailsMastId: 1, wingMasterId: 2, wingName: "B" }),
    ];

    vi.mocked(updateWingDetailsMastAction).mockResolvedValueOnce({
      success: true,
      data: makeWingDetailsMast({ id: 101, wingName: "A Updated" }),
    });

    const { result } = setup();

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setEditingWingDetailId(101);
      result.current.setNewWingId(1);
      result.current.setNewWingName("A Updated");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(updateWingDetailsMastAction).toHaveBeenCalledWith(101, {
      isActive: true,
      wingName: "A Updated",
      secretaryName: "Secretary",
      managerName: "Manager",
      secretaryNameEnglish: "Secretary English",
      managerNameEnglish: "Manager English",
      managerMobileNo: "1234567890",
      managerMobileNoRemarkId: 2,
      secretaryMobileNo: "0987654321",
      secretaryMobileNoRemarkId: 3,
      secretaryEmailId: "secretary@example.com",
      managerEmailId: "manager@example.com",
      markedForDeletion: false,
      markedForDeletionDate: null,
      societyWingDetails,
    });

    expect(mockSetWingDetailsMast).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should validate wing name is required", async () => {
    const { result } = setup();

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(mockSetErrors).toHaveBeenCalled();
    expect(createSocietyDetailAction).not.toHaveBeenCalled();
  });

  it("should handle create SocietyDetails API error", async () => {
    vi.mocked(createSocietyDetailAction).mockResolvedValueOnce({
      success: false,
      error: "API Error",
    });

    const { result } = setup({ societyDetails: [], wingDetailsMast: [] });

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("Wing C");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(createWingDetailsMastAction).not.toHaveBeenCalled();
  });

  it("should handle create WingDetailsMast API error and surface the backend message", async () => {
    vi.mocked(createWingDetailsMastAction).mockResolvedValueOnce({
      success: false,
      error: "The specified wing does not exist.",
    });

    const { result } = setup();

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("Wing C");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(toast.error).toHaveBeenCalledWith("The specified wing does not exist.");
    // Form should NOT be reset on failure (still mid-flow for retry)
    expect(result.current.showAddWingForm).toBe(true);
  });

  it("should handle update wing API error", async () => {
    vi.mocked(updateWingDetailsMastAction).mockResolvedValueOnce({
      success: false,
      error: "API Error",
    });

    const { result } = setup();

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setEditingWingDetailId(101);
      result.current.setNewWingId(1);
      result.current.setNewWingName("A Updated");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(toast.error).toHaveBeenCalled();
  });

  it("should not save wing if property is not selected", async () => {
    const { result } = setup({ selectedPropertyId: null });

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("Wing C");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(createSocietyDetailAction).not.toHaveBeenCalled();
  });

  it("should reset form after successful save", async () => {
    vi.mocked(createWingDetailsMastAction).mockResolvedValueOnce({
      success: true,
      data: makeWingDetailsMast({ id: 103, societyDetailsMastId: 1, wingMasterId: 3, wingName: "Wing C" }),
    });

    const { result } = setup();

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("Wing C");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    // Form should be reset
    expect(result.current.newWingId).toBeNull();
    expect(result.current.newWingName).toBe("");
    expect(result.current.editingWingDetailId).toBeNull();
    expect(result.current.showAddWingForm).toBe(false);
  });

  it("should call onWingSaveSuccess callback after successful wing save", async () => {
    vi.mocked(createWingDetailsMastAction).mockResolvedValueOnce({
      success: true,
      data: makeWingDetailsMast({ id: 103, societyDetailsMastId: 1, wingMasterId: 3, wingName: "Wing C" }),
    });

    const mockOnWingSaveSuccess = vi.fn();

    const { result } = setup({ onWingSaveSuccess: mockOnWingSaveSuccess });

    act(() => {
      result.current.setShowAddWingForm(true);
      result.current.setNewWingId(3);
      result.current.setNewWingName("Wing C");
    });

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSaveWing(mockErrors, mockSetErrors);
    });

    expect(createWingDetailsMastAction).toHaveBeenCalled();
    expect(mockOnWingSaveSuccess).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalled();
  });
});
