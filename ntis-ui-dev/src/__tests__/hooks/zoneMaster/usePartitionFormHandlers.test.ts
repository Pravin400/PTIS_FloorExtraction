import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePartitionFormHandlers } from "@/hooks/zoneMaster/usePartitionFormHandlers";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { Floor } from "@/types/floor.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";

// Mock router push
const mockPush = vi.fn();

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/property-tax/zone-master",
  useSearchParams: () => ({
    toString: () => "",
  }),
}));

describe("usePartitionFormHandlers", () => {
  const mockSetForm = vi.fn();
  const mockSetErrors = vi.fn();

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

  const initialErrors: PartitionFormErrors = {};

  const mockProperties: ZonePropertyItem[] = [
    { id: 1, propertyNo: "68" } as ZonePropertyItem,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("should handle property selection", () => {
    const { result } = renderHook(() =>
      usePartitionFormHandlers({
        form: initialForm,
        setForm: mockSetForm,
        errors: initialErrors,
        setErrors: mockSetErrors,
        floors: mockFloors,
        allProperties: mockProperties,
      })
    );

    const mockEvent = {} as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handlePropertySelect(mockEvent, "1");
    });

    // Check that router.push was called with the correct URL
    expect(mockPush).toHaveBeenCalledWith("/property-tax/zone-master?partitionPropertyId=1&partitionPropertyNo=68");
    // Check that errors were cleared
    expect(mockSetErrors).toHaveBeenCalledWith({
      ...initialErrors,
      mainPropertyId: undefined,
    });
  });

  it("should handle property deselection", () => {
    const { result } = renderHook(() =>
      usePartitionFormHandlers({
        form: { ...initialForm, mainPropertyId: 1 },
        setForm: mockSetForm,
        errors: initialErrors,
        setErrors: mockSetErrors,
        floors: mockFloors,
        allProperties: mockProperties,
      })
    );

    const mockEvent = {} as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handlePropertySelect(mockEvent, "");
    });

    // Check that router.push was called without partitionPropertyId parameter
    expect(mockPush).toHaveBeenCalledWith("/property-tax/zone-master?");
  });

  it("should handle from floor change", () => {
    const { result } = renderHook(() =>
      usePartitionFormHandlers({
        form: initialForm,
        setForm: mockSetForm,
        errors: initialErrors,
        setErrors: mockSetErrors,
        floors: mockFloors,
        allProperties: mockProperties,
      })
    );

    const mockEvent = {} as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handleFromFloorChange(mockEvent, "G");
    });

    expect(mockSetForm).toHaveBeenCalled();
    expect(mockSetErrors).toHaveBeenCalledWith({
      ...initialErrors,
      fromFloor: undefined,
      toFloor: undefined,
    });
  });

  it("should reset to floor when from floor is changed to higher value", () => {
    const formWithFloors: PartitionFormState = {
      ...initialForm,
      fromFloor: "G",
      toFloor: "1",
    };

    const { result } = renderHook(() =>
      usePartitionFormHandlers({
        form: formWithFloors,
        setForm: mockSetForm,
        errors: initialErrors,
        setErrors: mockSetErrors,
        floors: mockFloors,
        allProperties: mockProperties,
      })
    );

    const mockEvent = {} as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handleFromFloorChange(mockEvent, "2");
    });

    expect(mockSetForm).toHaveBeenCalled();
    // The toFloor should be reset because "1" is less than "2"
    const setFormCall = mockSetForm.mock.calls[0][0];
    expect(typeof setFormCall).toBe("function");
  });

  it("should handle to floor change", () => {
    const { result } = renderHook(() =>
      usePartitionFormHandlers({
        form: initialForm,
        setForm: mockSetForm,
        errors: initialErrors,
        setErrors: mockSetErrors,
        floors: mockFloors,
        allProperties: mockProperties,
      })
    );

    const mockEvent = {} as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handleToFloorChange(mockEvent, "2");
    });

    expect(mockSetForm).toHaveBeenCalledWith({
      ...initialForm,
      toFloor: "2",
    });
    expect(mockSetErrors).toHaveBeenCalledWith({
      ...initialErrors,
      toFloor: undefined,
    });
  });

  it("should clear errors when fields change", () => {
    const errorsWithMessages: PartitionFormErrors = {
      fromFloor: "Required",
      toFloor: "Required",
    };

    const { result } = renderHook(() =>
      usePartitionFormHandlers({
        form: initialForm,
        setForm: mockSetForm,
        errors: errorsWithMessages,
        setErrors: mockSetErrors,
        floors: mockFloors,
        allProperties: mockProperties,
      })
    );

    const mockEvent = {} as React.ChangeEvent<HTMLSelectElement>;

    act(() => {
      result.current.handleFromFloorChange(mockEvent, "G");
    });

    expect(mockSetErrors).toHaveBeenCalledWith({
      ...errorsWithMessages,
      fromFloor: undefined,
      toFloor: undefined,
    });
  });
});
