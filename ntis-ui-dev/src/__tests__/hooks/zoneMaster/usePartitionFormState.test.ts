import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePartitionFormState } from "@/hooks/zoneMaster/usePartitionFormState";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";

describe("usePartitionFormState", () => {
  const mockProperties: ZonePropertyItem[] = [
    {
      id: 1,
      propertyNo: "P001",
      partitionNo: "0",
      categoryId: 1,
      propertyTypeId: 1,
      taxZoneId: 1,
      wardId: 1,
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
  ];

  const mockFloors: Floor[] = [
    { id: 1, floorCode: "G", description: "Ground Floor", descriptionEnglish: "Ground Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 1, isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 2, floorCode: "1", description: "First Floor", descriptionEnglish: "First Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 2, isActive: true, createdDate: "2024-01-01", updatedDate: null },
  ];

  const mockSocietyDetails: SocietyDetailItem[] = [
    {
      id: 1,
      propertyId: 1,
      wingId: 1,
      wingName: "Wing A",
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: null,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.form.mainPropertyId).toBeNull();
    expect(result.current.form.partitionType).toBe("wing");
    expect(result.current.form.isActive).toBe(true);
    expect(result.current.form.bulkCreateMode).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.loadingProperties).toBe(false);
    expect(result.current.loadingFloors).toBe(false);
  });

  it("should initialize with selected property ID", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.form.mainPropertyId).toBe(1);
    expect(result.current.selectedProperty).toEqual(mockProperties[0]);
  });

  it("should initialize with next partition number", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: 5,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.form.fromPartition).toBe("5");
  });

  it("should initialize SSR data correctly", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.allProperties).toEqual(mockProperties);
    expect(result.current.wings).toEqual(mockWings);
    expect(result.current.floors).toEqual(mockFloors);
    expect(result.current.societyDetails).toEqual(mockSocietyDetails);
  });

  it("should derive selected property from SSR data", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.selectedProperty).toEqual(mockProperties[0]);
  });

  it("should return null for selected property when ID is not found", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 999,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.selectedProperty).toBeNull();
  });

  it("should derive selectedWingDetailId when wing is selected", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    // Initially no wing selected
    expect(result.current.selectedWingDetailId).toBeUndefined();
  });

  it("should provide setters for state management", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(typeof result.current.setForm).toBe("function");
    expect(typeof result.current.setLoading).toBe("function");
    expect(typeof result.current.setErrors).toBe("function");
    expect(typeof result.current.setShowPreview).toBe("function");
    expect(typeof result.current.setPreviewData).toBe("function");
    expect(typeof result.current.setLoadingPreview).toBe("function");
    expect(typeof result.current.setSocietyDetails).toBe("function");
  });

  it("should initialize preview state", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.showPreview).toBe(false);
    expect(result.current.previewData).toEqual([]);
    expect(result.current.loadingPreview).toBe(false);
  });

  it("should provide INITIAL constant for form reset", () => {
    const { result } = renderHook(() =>
      usePartitionFormState({
        selectedPropertyId: 1,
        ssrNextPartitionNumber: null,
        ssrProperties: mockProperties,
        ssrWings: mockWings,
        ssrFloors: mockFloors,
        ssrSocietyDetails: mockSocietyDetails,
      })
    );

    expect(result.current.INITIAL).toBeDefined();
    expect(result.current.INITIAL.partitionType).toBe("wing");
    expect(result.current.INITIAL.isActive).toBe(true);
  });
});
