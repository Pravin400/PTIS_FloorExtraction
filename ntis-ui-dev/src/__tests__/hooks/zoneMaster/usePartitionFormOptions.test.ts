import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePartitionFormOptions } from "@/hooks/zoneMaster/usePartitionFormOptions";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { PartitionFormState } from "@/types/zone-master/properties/partition-form.types";

describe("usePartitionFormOptions", () => {
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
    {
      id: 2,
      propertyNo: "P002",
      partitionNo: "1",
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
      address: "456 Test St",
      addressEnglish: "456 Test St",
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

  const mockWingDetailsMast: WingDetailsMastItem[] = [
    {
      id: 101,
      isActive: true,
      createdBy: 1,
      createdDate: "2024-01-01",
      updatedBy: null,
      updatedDate: null,
      societyDetailsMastId: 1,
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
    {
      id: 102,
      isActive: true,
      createdBy: 1,
      createdDate: "2024-01-01",
      updatedBy: null,
      updatedDate: null,
      societyDetailsMastId: 1,
      wingMasterId: 2,
      wingName: "Wing B",
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
  ];

  const mockFloors: Floor[] = [
    { id: 1, floorCode: "G", description: "Ground Floor", descriptionEnglish: "Ground Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 1, isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 2, floorCode: "1", description: "First Floor", descriptionEnglish: "First Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 2, isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 3, floorCode: "2", description: "Second Floor", descriptionEnglish: "Second Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 3, isActive: true, createdDate: "2024-01-01", updatedDate: null },
  ];

  const initialForm: PartitionFormState = {
    mainPropertyId: null,
    partitionNo: "0",
    partitionType: "wing",
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
    fromPartition: "",
    toPartition: "",    selectedWingForAmenity: "",
    fromAmenity: "",
    toAmenity: "",  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should filter properties without partition number", () => {
    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: initialForm,
      })
    );

    expect(result.current.propertyOptions).toHaveLength(1);
    expect(result.current.propertyOptions[0]).toEqual({
      value: "1",
      label: "P001",
    });
  });

  it("should show category in property label when categoryMap is provided", () => {
    const categoryMap = new Map<number, string>();
    categoryMap.set(1, "Apartment");

    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: initialForm,
        categoryMap,
      })
    );

    expect(result.current.propertyOptions[0]).toEqual({
      value: "1",
      label: "P001 - Apartment",
    });
  });

  it("should generate wing options from wing details mast", () => {
    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: initialForm,
      })
    );

    expect(result.current.wingOptions).toHaveLength(2);
    expect(result.current.wingOptions).toContainEqual({
      value: "A",
      label: "A - Wing A",
    });
    expect(result.current.wingOptions).toContainEqual({
      value: "B",
      label: "B - Wing B",
    });
  });

  it("should provide generation type options", () => {
    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: initialForm,
      })
    );

    expect(result.current.generationTypeOptions).toHaveLength(4);
    expect(result.current.generationTypeOptions).toContainEqual({
      value: "V",
      label: "V - Vertical",
    });
    expect(result.current.generationTypeOptions).toContainEqual({
      value: "H",
      label: "H - Horizontal",
    });
  });

  it("should generate from floor options sorted by ID", () => {
    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: initialForm,
      })
    );

    expect(result.current.fromFloorOptions).toHaveLength(3);
    expect(result.current.fromFloorOptions[0]).toEqual({
      value: "1",
      label: "G - Ground Floor",
    });
    expect(result.current.fromFloorOptions[1]).toEqual({
      value: "2",
      label: "1 - First Floor",
    });
  });

  it("should generate to floor options filtered by from floor", () => {
    const formWithFromFloor: PartitionFormState = {
      ...initialForm,
      fromFloor: "2", // ID 2 = First Floor
    };

    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: formWithFromFloor,
      })
    );

    // Should only include floors with ID >= 2
    expect(result.current.toFloorOptions).toHaveLength(2);
    expect(result.current.toFloorOptions[0]).toEqual({
      value: "2",
      label: "1 - First Floor",
    });
    expect(result.current.toFloorOptions[1]).toEqual({
      value: "3",
      label: "2 - Second Floor",
    });
  });

  it("should return empty to floor options when from floor is not selected", () => {
    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: initialForm,
      })
    );

    expect(result.current.toFloorOptions).toHaveLength(0);
  });

  it("should handle invalid from floor ID", () => {
    const formWithInvalidFromFloor: PartitionFormState = {
      ...initialForm,
      fromFloor: "invalid",
    };

    const { result } = renderHook(() =>
      usePartitionFormOptions({
        allProperties: mockProperties,
        wingDetailsMast: mockWingDetailsMast,
        wings: mockWings,
        floors: mockFloors,
        form: formWithInvalidFromFloor,
      })
    );

    expect(result.current.toFloorOptions).toHaveLength(0);
  });
});
