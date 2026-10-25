import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useBuildingPreview } from "@/hooks/zoneMaster/useBuildingPreview";
import { generateBuildingStructureAction } from "@/app/[locale]/property-tax/zone-master/actions";
import { toast } from "sonner";
import { PartitionFormState } from "@/types/zone-master/properties/partition-form.types";
import { WardItem } from "@/types/wardMaster.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { BuildingStructureItem } from "@/types/zone-master/properties/building-structure.types";

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
  generateBuildingStructureAction: vi.fn(),
}));

describe("useBuildingPreview", () => {
  const mockSetLoadingPreview = vi.fn();
  const mockSetShowPreview = vi.fn();
  const mockSetPreviewData = vi.fn();
  const mockSetErrors = vi.fn();
  const mockValidate = vi.fn(() => ({ valid: true, errors: {} }));
  const mockT = vi.fn((key: string) => key);

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

  const mockForm: PartitionFormState = {
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
    incrementedBy: "5",
    prefix: "",
    generationType: "V",
    fromPartition: "",
    toPartition: "",
    selectedWingForAmenity: "",
    fromAmenity: "",
    toAmenity: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle missing fields", async () => {
    mockValidate.mockReturnValueOnce({ valid: false, errors: { wingLetter: "Wing letter required" } });
    const incompleteForm: PartitionFormState = {
      ...mockForm,
      wingLetter: "",
    };

    const { result } = renderHook(() =>
      useBuildingPreview({
        form: incompleteForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        floors: mockFloors,
        setLoadingPreview: mockSetLoadingPreview,
        setShowPreview: mockSetShowPreview,
        setPreviewData: mockSetPreviewData,
        setErrors: mockSetErrors,
        validate: mockValidate,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handlePreviewBuilding();
    });

    expect(mockSetErrors).toHaveBeenCalledWith({ wingLetter: "Wing letter required" });
  });

  it("should handle invalid floor selection", async () => {
    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });
    const invalidForm: PartitionFormState = {
      ...mockForm,
      fromFloor: "invalid",
    };

    const { result } = renderHook(() =>
      useBuildingPreview({
        form: invalidForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        floors: mockFloors,
        setLoadingPreview: mockSetLoadingPreview,
        setShowPreview: mockSetShowPreview,
        setPreviewData: mockSetPreviewData,
        setErrors: mockSetErrors,
        validate: mockValidate,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handlePreviewBuilding();
    });

    expect(generateBuildingStructureAction).not.toHaveBeenCalled();
  });

  it("should validate floor range (to floor >= from floor)", async () => {
    mockValidate.mockReturnValueOnce({ valid: false, errors: { toFloor: "To floor must be >= from floor" } });
    const invalidRangeForm: PartitionFormState = {
      ...mockForm,
      fromFloor: "3",
      toFloor: "1",
    };

    const { result } = renderHook(() =>
      useBuildingPreview({
        form: invalidRangeForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        floors: mockFloors,
        setLoadingPreview: mockSetLoadingPreview,
        setShowPreview: mockSetShowPreview,
        setPreviewData: mockSetPreviewData,
        setErrors: mockSetErrors,
        validate: mockValidate,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handlePreviewBuilding();
    });

    expect(generateBuildingStructureAction).not.toHaveBeenCalled();
  });

  it("should validate numeric fields", async () => {
    mockValidate.mockReturnValueOnce({ valid: false, errors: { noOfFlatOnOneFloor: "Must be a positive number" } });
    const invalidNumericForm: PartitionFormState = {
      ...mockForm,
      noOfFlatOnOneFloor: "-1",
    };

    const { result } = renderHook(() =>
      useBuildingPreview({
        form: invalidNumericForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        floors: mockFloors,
        setLoadingPreview: mockSetLoadingPreview,
        setShowPreview: mockSetShowPreview,
        setPreviewData: mockSetPreviewData,
        setErrors: mockSetErrors,
        validate: mockValidate,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handlePreviewBuilding();
    });

    expect(generateBuildingStructureAction).not.toHaveBeenCalled();
  });

  it("should successfully generate preview", async () => {
    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });
    const mockPreviewData: BuildingStructureItem[] = [
      {
        wardId: 1,
        propertyNo: "P001",
        wingId: 1,
        rowNo: 1,
        floorNo: 1,
        floorCode: "1",
        propertyFloorId: 1,
        unitNo: 1,
        flatNo: "A-101",
        partitionNo: "1",
        generationType: "V",
      },
    ];

    vi.mocked(generateBuildingStructureAction).mockResolvedValueOnce({
      success: true,
      data: mockPreviewData,
    });

    const { result } = renderHook(() =>
      useBuildingPreview({
        form: mockForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        floors: mockFloors,
        setLoadingPreview: mockSetLoadingPreview,
        setShowPreview: mockSetShowPreview,
        setPreviewData: mockSetPreviewData,
        setErrors: mockSetErrors,
        validate: mockValidate,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handlePreviewBuilding();
    });

    expect(mockSetLoadingPreview).toHaveBeenCalledWith(true);
    expect(mockSetShowPreview).toHaveBeenCalledWith(true);
    expect(mockSetPreviewData).toHaveBeenCalledWith(mockPreviewData);
    expect(toast.success).toHaveBeenCalled();
    expect(mockSetLoadingPreview).toHaveBeenCalledWith(false);
  });

  it("should handle API error", async () => {
    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });
    vi.mocked(generateBuildingStructureAction).mockResolvedValueOnce({
      success: false,
      error: "API Error",
    });

    const { result } = renderHook(() =>
      useBuildingPreview({
        form: mockForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        floors: mockFloors,
        setLoadingPreview: mockSetLoadingPreview,
        setShowPreview: mockSetShowPreview,
        setPreviewData: mockSetPreviewData,
        setErrors: mockSetErrors,
        validate: mockValidate,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handlePreviewBuilding();
    });

    expect(toast.error).toHaveBeenCalledWith("API Error");
    expect(mockSetPreviewData).toHaveBeenCalledWith([]);
  });

  it("should handle invalid wing selection", async () => {
    mockValidate.mockReturnValueOnce({ valid: true, errors: {} });
    const invalidWingForm: PartitionFormState = {
      ...mockForm,
      wingLetter: "Z",
    };

    const { result } = renderHook(() =>
      useBuildingPreview({
        form: invalidWingForm,
        selectedWard: mockWard,
        selectedProperty: mockProperty,
        wings: mockWings,
        floors: mockFloors,
        setLoadingPreview: mockSetLoadingPreview,
        setShowPreview: mockSetShowPreview,
        setPreviewData: mockSetPreviewData,
        setErrors: mockSetErrors,
        validate: mockValidate,
        t: mockT,
      })
    );

    await act(async () => {
      await result.current.handlePreviewBuilding();
    });

    expect(generateBuildingStructureAction).not.toHaveBeenCalled();
  });
});
