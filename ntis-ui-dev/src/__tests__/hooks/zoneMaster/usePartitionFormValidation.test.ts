import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePartitionFormValidation } from "@/hooks/zoneMaster/usePartitionFormValidation";
import { PartitionFormState } from "@/types/zone-master/properties/partition-form.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { Floor } from "@/types/floor.types";

// Mock dependencies
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("usePartitionFormValidation", () => {
  const mockProperty: ZonePropertyItem = {
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
  };

  const mockProperties: ZonePropertyItem[] = [
    mockProperty,
    {
      ...mockProperty,
      id: 2,
      partitionNo: "1",
    },
    {
      ...mockProperty,
      id: 3,
      partitionNo: "2",
    },
  ];

  const mockFloors: Floor[] = [
    { id: 1, floorCode: "G", description: "Ground Floor", descriptionEnglish: "Ground Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 1, isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 2, floorCode: "1", description: "First Floor", descriptionEnglish: "First Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 2, isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 3, floorCode: "2", description: "Second Floor", descriptionEnglish: "Second Floor", fLatGenerationGroupId: 1, fLatGenerationSeq: 1, sequenceNo: 3, isActive: true, createdDate: "2024-01-01", updatedDate: null },
  ];

  const validWingForm: PartitionFormState = {
    mainPropertyId: 1,
    partitionNo: "0",
    partitionType: "wing",
    isActive: true,
    bulkCreateMode: false,
    alphanumericMode: false,
    createNewWing: true,
    wingLetter: "A",
    fromFloor: "1", // Ground Floor ID
    toFloor: "3",   // Second Floor ID
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

  const validPartitionForm: PartitionFormState = {
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
    fromPartition: "3",
    toPartition: "5",    selectedWingForAmenity: "",
    fromAmenity: "",
    toAmenity: "",  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate max partition number correctly", () => {
    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const maxPartition = result.current.calculateMaxPartition();
    expect(maxPartition).toBe(2);
  });

  it("should return 0 for max partition when no property selected", () => {
    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: null,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const maxPartition = result.current.calculateMaxPartition();
    expect(maxPartition).toBe(0);
  });

  it("should validate wing form successfully", () => {
    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(validWingForm);
    expect(validation.valid).toBe(true);
    expect(Object.keys(validation.errors).length).toBe(0);
  });

  it("should validate partition form successfully", () => {
    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(validPartitionForm);
    expect(validation.valid).toBe(true);
    expect(Object.keys(validation.errors).length).toBe(0);
  });

  it("should fail validation when main property is missing", () => {
    const invalidForm: PartitionFormState = {
      ...validWingForm,
      mainPropertyId: null,
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: null,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.mainPropertyId).toBeDefined();
  });

  it("should fail validation for wing form with missing fields", () => {
    const invalidForm: PartitionFormState = {
      ...validWingForm,
      wingLetter: "",
      fromFloor: "",
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.wingLetter).toBeDefined();
    expect(validation.errors.fromFloor).toBeDefined();
  });

  it("should fail validation when toFloor is less than fromFloor", () => {
    const invalidForm: PartitionFormState = {
      ...validWingForm,
      fromFloor: "3", // Second Floor (ID 3)
      toFloor: "1",   // Ground Floor (ID 1) - invalid because it's less than fromFloor
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.toFloor).toBeDefined();
  });

  it("should fail validation for negative numeric values", () => {
    const invalidForm: PartitionFormState = {
      ...validWingForm,
      noOfFlatOnOneFloor: "-1",
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.noOfFlatOnOneFloor).toBeDefined();
  });

  it("should fail validation for non-numeric values", () => {
    const invalidForm: PartitionFormState = {
      ...validWingForm,
      incrementedBy: "abc",
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.incrementedBy).toBeDefined();
  });

  it("should pass validation when incrementedBy equals noOfFlatOnOneFloor", () => {
    const formWithEqualValues: PartitionFormState = {
      ...validWingForm,
      noOfFlatOnOneFloor: "4",
      incrementedBy: "4", // Equal to noOfFlatOnOneFloor - should be valid
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(formWithEqualValues);
    expect(validation.valid).toBe(true);
    expect(validation.errors.incrementedBy).toBeUndefined();
  });

  it("should fail validation when incrementedBy is less than noOfFlatOnOneFloor", () => {
    const invalidForm: PartitionFormState = {
      ...validWingForm,
      noOfFlatOnOneFloor: "4",
      incrementedBy: "3", // Less than noOfFlatOnOneFloor - should be invalid
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.incrementedBy).toBeDefined();
  });

  it("should pass validation when incrementedBy is greater than noOfFlatOnOneFloor", () => {
    const formWithGreaterValue: PartitionFormState = {
      ...validWingForm,
      noOfFlatOnOneFloor: "4",
      incrementedBy: "5", // Greater than noOfFlatOnOneFloor - should be valid
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(formWithGreaterValue);
    expect(validation.valid).toBe(true);
    expect(validation.errors.incrementedBy).toBeUndefined();
  });

  it("should fail validation when fromPartition > toPartition", () => {
    const invalidForm: PartitionFormState = {
      ...validPartitionForm,
      fromPartition: "10",
      toPartition: "5",
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.toPartition).toBeDefined();
  });

  it("should detect duplicate partition numbers", () => {
    const invalidForm: PartitionFormState = {
      ...validPartitionForm,
      fromPartition: "1",
      toPartition: "3",
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.fromPartition).toBeDefined();
  });

  it("should fail validation for partition form with missing fields", () => {
    const invalidForm: PartitionFormState = {
      ...validPartitionForm,
      createNewWing: false,
      fromPartition: "",
      toPartition: "",
    };

    const { result } = renderHook(() =>
      usePartitionFormValidation({
        selectedProperty: mockProperty,
        allProperties: mockProperties,
        floors: mockFloors,
      })
    );

    const validation = result.current.validate(invalidForm);
    expect(validation.valid).toBe(false);
    expect(validation.errors.fromPartition).toBeDefined();
    expect(validation.errors.toPartition).toBeDefined();
  });
});
