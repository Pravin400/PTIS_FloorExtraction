import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePartitionSubmit } from "@/hooks/zoneMaster/usePartitionSubmit";
import { generateBuildingStructureAction, createBulkBuildingPropertiesAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { toast } from "sonner";
import { PartitionFormState } from "@/types/zone-master/properties/partition-form.types";
import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { SocietyWingDetailItem } from "@/types/zone-master/properties/society-wing-details.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";

// Mock dependencies
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    if (params) {
      return `${key}_${JSON.stringify(params)}`;
    }
    return key;
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/zone-master/actions", () => ({
  generateBuildingStructureAction: vi.fn(),
  createBulkBuildingPropertiesAction: vi.fn(),
}));

describe("usePartitionSubmit", () => {
  const mockSetLoading = vi.fn();
  const mockSetForm = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnClose = vi.fn();
  const mockValidate = vi.fn();
  const mockHandleSaveWing = vi.fn();

  const mockWard: WardItem = {
    id: 1,
    wardNo: "W1",
    zoneId: 1,
    description: "Ward One",
    sequenceNo: 1,
    isActive: true,
    createdDate: "2024-01-01",
    updatedDate: null,
  };

  const mockProperty: ZonePropertyItem = {
    id: 1,
    propertyNo: "P001",
    propertyTypeId: 1,
    categoryId: 1,
    taxZoneId: 1,
    wardId: 1,
    partitionNo: "0",
    upicId: "",
    openPlot: false,
    csn: null,
    subZoneNo: null,
    plotNo: null,
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
    address: "123 Test St",
    addressEnglish: "123 Test St",
    location: "Test Location",
    locationEnglish: "Test Location",
    mobileNo: null,
    emailId: null,
    societyDetailId: null,
    markedForDeletion: false,
    propertySeqNo: null,
    displayProperty: null,
    createdDate: "2024-01-01",
    updatedDate: null,
    isActive: true,
  };

  const mockWings: WingItem[] = [
    {
      id: 1,
      wingNo: "A",
      sequenceNo: 1,
      createdDate: "2024-01-01",
      updatedDate: null,
      isActive: true,
    },
  ];

  const mockFloors: Floor[] = [
    { id: 1, floorCode: "G", description: "Ground Floor", descriptionEnglish: "Ground Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 1, isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 2, floorCode: "1", description: "First Floor", descriptionEnglish: "First Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 2, isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 3, floorCode: "2", description: "Second Floor", descriptionEnglish: "Second Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 3, isActive: true, createdDate: "2024-01-01", updatedDate: null },
  ];

  const mockWingDetails: SocietyWingDetailItem[] = [
    {
      propertyId: 1,
      societyDetailId: 101,
      wingId: 1,
      wingNo: "A",
      wardNo: "W1",
      propertyNo: "P001",
      wingName: "Wing A",
      societyName: "Test Society",
      societyAddress: "123 Society St",
      secretaryName: "John Doe",
      managerName: "Jane Smith",
      landOwnerName: "Land Owner",
      builderName: "Builder Name",
      societyNameEnglish: "Test Society",
      societyAddressEnglish: "123 Society St",
      secretaryNameEnglish: "John Doe",
      managerNameEnglish: "Jane Smith",
      landOwnerNameEnglish: "Land Owner",
      builderNameEnglish: "Builder Name",
      managerMobileNo: "1234567890",
      secretaryMobileNo: "0987654321",
      societyEmailId: "society@test.com",
      secretaryEmailId: "secretary@test.com",
      managerEmailId: "manager@test.com",
      propertyCount: 10,
      aminityCount: 5,
    },
  ];

  const mockWingDetailsMast: WingDetailsMastItem[] = [
    {
      id: 501,
      isActive: true,
      createdBy: 1,
      createdDate: "2024-01-01",
      updatedBy: null,
      updatedDate: null,
      societyDetailsMastId: 101,
      wingMasterId: 1,
      wingName: "Wing A",
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
    },
  ];

  const mockSocietyDetails: SocietyDetailItem[] = [];
  const mockSetWingDetailsMast = vi.fn();
  const mockSetSocietyDetails = vi.fn();

  const wingForm: PartitionFormState = {
    mainPropertyId: 1,
    partitionNo: "0",
    partitionType: "wing",
    isActive: true,
    bulkCreateMode: false,
    alphanumericMode: false,
    createNewWing: true,
    wingLetter: "A",
    fromFloor: "1",
    toFloor: "3",
    noOfFlatOnOneFloor: "4",
    flatStart: "101",
    incrementedBy: "1",
    prefix: "",
    generationType: "V",
    fromPartition: "",
    toPartition: "",
    selectedWingForAmenity: "",
    fromAmenity: "",
    toAmenity: "",
  };

  const partitionForm: PartitionFormState = {
    mainPropertyId: 1,
    partitionNo: "0",
    partitionType: "partition",
    isActive: true,
    bulkCreateMode: false,
    alphanumericMode: false,
    createNewWing: false,
    wingLetter: "",
    fromFloor: "",
    toFloor: "",
    noOfFlatOnOneFloor: "",
    flatStart: "",
    incrementedBy: "",
    prefix: "",
    generationType: "",
    fromPartition: "1",
    toPartition: "3",
    selectedWingForAmenity: "",
    fromAmenity: "",
    toAmenity: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not submit when validation fails", async () => {
    mockValidate.mockReturnValueOnce({ valid: false, errors: { mainPropertyId: "Required" } });

    const { result } = renderHook(() =>
      usePartitionSubmit({
        form: wingForm,
        setForm: mockSetForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        wingDetails: mockWingDetails,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        selectedPropertyId: 1,
        floors: mockFloors,
        validate: mockValidate,
        setLoading: mockSetLoading,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        showAddWingForm: false,
        newWingId: null,
        newWingName: "",
        handleSaveWing: mockHandleSaveWing,
      })
    );

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSubmit(mockErrors, mockSetErrors);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(generateBuildingStructureAction).not.toHaveBeenCalled();
  });

  it("should successfully submit wing partition", async () => {
    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });
    vi.mocked(generateBuildingStructureAction).mockResolvedValueOnce({
      success: true,
      message: "Success",
    });

    const { result } = renderHook(() =>
      usePartitionSubmit({
        form: wingForm,
        setForm: mockSetForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        wingDetails: mockWingDetails,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        selectedPropertyId: 1,
        floors: mockFloors,
        validate: mockValidate,
        setLoading: mockSetLoading,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        showAddWingForm: false,
        newWingId: null,
        newWingName: "",
        handleSaveWing: mockHandleSaveWing,
      })
    );

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSubmit(mockErrors, mockSetErrors);
    });

    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(generateBuildingStructureAction).toHaveBeenCalledWith({
      wardId: 1,
      propertyNo: "P001",
      wingId: 1,
      fromFloor: "G",
      toFloor: "2",
      noOfFlatOnOneFloor: 4,
      flatStart: 101,
      incrementedBy: 1,
      prifix: undefined,
      generationType: "V",
    });
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockSetLoading).toHaveBeenCalledWith(false);
  });

  it("should successfully submit bulk partition", async () => {
    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });
    vi.mocked(createBulkBuildingPropertiesAction).mockResolvedValueOnce({
      success: true,
      data: {
        successCount: 3,
        failedCount: 0,
        results: [],
        errors: null,
        hasFailures: false,
        allSucceeded: true,
      },
    });

    const { result } = renderHook(() =>
      usePartitionSubmit({
        form: partitionForm,
        setForm: mockSetForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        wingDetails: mockWingDetails,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        selectedPropertyId: 1,
        floors: mockFloors,
        validate: mockValidate,
        setLoading: mockSetLoading,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        showAddWingForm: false,
        newWingId: null,
        newWingName: "",
        handleSaveWing: mockHandleSaveWing,
      })
    );

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSubmit(mockErrors, mockSetErrors);
    });

    expect(mockSetLoading).toHaveBeenCalledWith(true);
    expect(createBulkBuildingPropertiesAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle API error for wing partition", async () => {
    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });
    vi.mocked(generateBuildingStructureAction).mockResolvedValueOnce({
      success: false,
      error: "API Error",
    });

    const { result } = renderHook(() =>
      usePartitionSubmit({
        form: wingForm,
        setForm: mockSetForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        wingDetails: mockWingDetails,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        selectedPropertyId: 1,
        floors: mockFloors,
        validate: mockValidate,
        setLoading: mockSetLoading,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        showAddWingForm: false,
        newWingId: null,
        newWingName: "",
        handleSaveWing: mockHandleSaveWing,
      })
    );

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSubmit(mockErrors, mockSetErrors);
    });

    expect(toast.error).toHaveBeenCalledWith("API Error");
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("should handle wing form submission when showAddWingForm is true", async () => {
    const { result } = renderHook(() =>
      usePartitionSubmit({
        form: wingForm,
        setForm: mockSetForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        wingDetails: mockWingDetails,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        selectedPropertyId: 1,
        floors: mockFloors,
        validate: mockValidate,
        setLoading: mockSetLoading,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        showAddWingForm: true,
        newWingId: 1,
        newWingName: "Wing A",
        handleSaveWing: mockHandleSaveWing,
      })
    );

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSubmit(mockErrors, mockSetErrors);
    });

    expect(mockHandleSaveWing).toHaveBeenCalledWith(mockErrors, mockSetErrors);
  });

  it("should show warning when wing form is incomplete", async () => {
    const { result } = renderHook(() =>
      usePartitionSubmit({
        form: wingForm,
        setForm: mockSetForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        wingDetails: mockWingDetails,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        selectedPropertyId: 1,
        floors: mockFloors,
        validate: mockValidate,
        setLoading: mockSetLoading,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        showAddWingForm: true,
        newWingId: null,
        newWingName: "",
        handleSaveWing: mockHandleSaveWing,
      })
    );

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSubmit(mockErrors, mockSetErrors);
    });

    expect(toast.warning).toHaveBeenCalled();
  });

  it("should handle invalid floor selection", async () => {
    const invalidForm: PartitionFormState = {
      ...wingForm,
      fromFloor: "invalid",
    };

    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });

    const { result } = renderHook(() =>
      usePartitionSubmit({
        form: invalidForm,
        setForm: mockSetForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        wingDetails: mockWingDetails,
        wingDetailsMast: mockWingDetailsMast,
        setWingDetailsMast: mockSetWingDetailsMast,
        societyDetails: mockSocietyDetails,
        setSocietyDetails: mockSetSocietyDetails,
        selectedPropertyId: 1,
        floors: mockFloors,
        validate: mockValidate,
        setLoading: mockSetLoading,
        onSuccess: mockOnSuccess,
        onClose: mockOnClose,
        showAddWingForm: false,
        newWingId: null,
        newWingName: "",
        handleSaveWing: mockHandleSaveWing,
      })
    );

    const mockErrors = {};
    const mockSetErrors = vi.fn();

    await act(async () => {
      await result.current.handleSubmit(mockErrors, mockSetErrors);
    });

    expect(toast.error).toHaveBeenCalledWith("Invalid floor selection");
  });
});
