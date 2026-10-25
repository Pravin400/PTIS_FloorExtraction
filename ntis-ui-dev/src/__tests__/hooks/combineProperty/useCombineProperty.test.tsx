import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCombinePropertyForm, UseCombinePropertyParams } from "@/hooks/combineProperty/useCombineProperty";
import * as actions from "@/app/[locale]/property-tax/ptis/combineproperty/action";
import { toast } from "sonner";
import { CombinePropertyItem, PropertyCombineDetails } from "@/types/combine-property.types";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockBack = vi.fn();
const mockSearchParams = vi.fn(() => new URLSearchParams());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
    back: mockBack,
  }),
  usePathname: () => "/property-tax/ptis/combineproperty",
  useSearchParams: () => mockSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/property-tax/ptis/combineproperty/action", () => ({
  createCombinePropertyAction: vi.fn(),
  fetchPropertyCombineDetailsAction: vi.fn(),
}));

vi.mock('@/components/common/ConfirmProvider', () => ({
  useConfirm: () => ({
    confirm: vi.fn((payload) => {
      if (payload.onConfirm) payload.onConfirm();
    })
  })
}));

describe("useCombinePropertyForm hook", () => {
  const mockBasePropertyList: CombinePropertyItem[] = [
    { id: 1, wardId: 1, wardNo: "W1", propertyNo: "P1", fromProperty: "P1", toProperty: "P1", isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 2, wardId: 1, wardNo: "W1", propertyNo: "P2", fromProperty: "P2", toProperty: "P2", isActive: true, createdDate: "2024-01-01", updatedDate: null },
  ];

  const mockSubPropertyList: CombinePropertyItem[] = [
    { id: 3, wardId: 1, wardNo: "W1", propertyNo: "P3", fromProperty: "P3", toProperty: "P3", isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 4, wardId: 1, wardNo: "W1", propertyNo: "P4", fromProperty: "P4", toProperty: "P4", isActive: true, createdDate: "2024-01-01", updatedDate: null },
    { id: 5, wardId: 1, wardNo: "W1", propertyNo: "P5", fromProperty: "P5", toProperty: "P5", isActive: true, createdDate: "2024-01-01", updatedDate: null },
  ];

  const mockProps: UseCombinePropertyParams = {
    basePropertyList: mockBasePropertyList,
    subPropertyList: mockSubPropertyList,
    selectedBasePropertyId: "1",
    selectedWardId: "1",
    selectedPropertyNo: "P1",
    t: (key: string) => key,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams.mockReturnValue(new URLSearchParams(""));
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      expect(result.current.reviewData).toEqual([]);
      expect(result.current.isReviewing).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.rangeFrom).toBe("");
      expect(result.current.rangeTo).toBe("");
      expect(result.current.selectedProperties).toEqual([]);
      expect(result.current.selectionMethod).toBe("range");
      expect(result.current.selectedCount).toBe(0);
      expect(result.current.canProceed).toBe(false);
    });

    it("should read initial values from search params", () => {
      mockSearchParams.mockReturnValue(new URLSearchParams("method=individual&individual=3,4"));

      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      expect(result.current.selectionMethod).toBe("individual");
      expect(result.current.selectedProperties).toEqual(["3", "4"]);
      expect(result.current.selectedCount).toBe(2);
      expect(result.current.canProceed).toBe(true);
    });
  });

  describe("Handlers", () => {
    it("should handle base property change", () => {
      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      act(() => {
        result.current.handleBasePropertyChange("baseProperty", "2");
      });

      expect(result.current.router.push).toHaveBeenCalled();
    });

    it("should handle method change", () => {
      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      act(() => {
        result.current.handleMethodChange("individual");
      });

      expect(result.current.reviewData).toEqual([]);
      expect(result.current.isReviewing).toBe(false);
      expect(result.current.router.push).toHaveBeenCalled();
    });

    it("should handle range from and to changes", () => {
      // Set up searchParams to have range values after the handlers update the URL
      mockSearchParams.mockReturnValue(new URLSearchParams("from=3"));
      const { result, rerender } = renderHook(() => useCombinePropertyForm(mockProps));

      act(() => {
        result.current.handleRangeFromChange("rangeFrom", "3");
      });
      // rangeFrom is derived from searchParams, which we've mocked
      expect(result.current.rangeFrom).toBe("3");
      expect(result.current.router.replace).toHaveBeenCalled();

      // Update mock for next value
      mockSearchParams.mockReturnValue(new URLSearchParams("from=3&to=4"));
      rerender();

      act(() => {
        result.current.handleRangeToChange("rangeTo", "4");
      });
      expect(result.current.rangeTo).toBe("4");
    });

    it("should handle individual multi-select changes", () => {
      mockSearchParams.mockReturnValue(new URLSearchParams("method=individual&individual=3,5"));
      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      act(() => {
        result.current.handleIndividualChange(["3", "5"]);
      });

      // selectedProperties is derived from searchParams
      expect(result.current.selectedProperties).toEqual(["3", "5"]);
      expect(result.current.router.replace).toHaveBeenCalled();
    });

    it("should clear the form correctly", () => {
      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      act(() => {
        result.current.handleClear();
      });

      expect(result.current.reviewData).toEqual([]);
      expect(result.current.isReviewing).toBe(false);
      expect(result.current.router.push).toHaveBeenCalled();
    });
  });

  describe("API Actions", () => {
    it("should handle proceed to review", async () => {
      mockSearchParams.mockReturnValue(new URLSearchParams("from=3&to=4"));

      const mockDetails: PropertyCombineDetails[] = [
        { propertyId: 3, wardId: 1, wardNo: "W1", propertyNo: "P3", partitionNo: "P3", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
        { propertyId: 4, wardId: 1, wardNo: "W1", propertyNo: "P4", partitionNo: "P4", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
      ];
      vi.mocked(actions.fetchPropertyCombineDetailsAction).mockResolvedValue(mockDetails);

      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      await act(async () => {
        result.current.handleProceed();
      });

      expect(actions.fetchPropertyCombineDetailsAction).toHaveBeenCalledWith({
        wardId: 1,
        propertyNo: "P3,P4,P1",
        partitionNo: "P3,P4,P1",
      });
      expect(result.current.reviewData).toEqual(mockDetails);
    });

    it("should handle combine submission", async () => {
      const mockDetails: PropertyCombineDetails[] = [
        { propertyId: 3, wardId: 1, wardNo: "W1", propertyNo: "P3", partitionNo: "P3", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
      ];

      vi.mocked(actions.fetchPropertyCombineDetailsAction).mockResolvedValue(mockDetails);
      vi.mocked(actions.createCombinePropertyAction).mockResolvedValue({ success: true, message: "Success" });

      mockSearchParams.mockReturnValue(new URLSearchParams("from=3&to=3"));

      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      act(() => {
        result.current.handleRemarkChange("defaultRemark");
      });

      // Fetch details first to populate reviewData
      await act(async () => {
        result.current.handleProceed();
      });

      // Check the property to be combined
      act(() => {
        result.current.togglePropertyCheck(3);
      });

      // Now combine
      await act(async () => {
        await result.current.handleCombine();
      });

      expect(actions.createCombinePropertyAction).toHaveBeenCalledWith({
        sourcePropertyId: 1,
        combinedPropertyIds: "3",
        combineReason: "defaultRemark",
        propertyTypeId: 1,
        overrideOwnerNameMismatch: false
      });
      expect(toast.success).toHaveBeenCalled();
    });

    it("should allow combine with warning if multiple owners are detected", async () => {
      const mockDetails: PropertyCombineDetails[] = [
        { propertyId: 3, wardId: 1, wardNo: "W1", propertyNo: "P3", partitionNo: "P3", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
        { propertyId: 4, wardId: 1, wardNo: "W1", propertyNo: "P4", partitionNo: "P4", oldPropertyNo: "", ownerName: "Owner 2", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
      ];

      vi.mocked(actions.fetchPropertyCombineDetailsAction).mockResolvedValue(mockDetails);
      vi.mocked(actions.createCombinePropertyAction).mockResolvedValue({ success: true, message: "Success" });
      mockSearchParams.mockReturnValue(new URLSearchParams("from=3&to=4"));

      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      act(() => {
        result.current.handleRemarkChange("defaultRemark");
      });

      // Fetch details
      await act(async () => {
        result.current.handleProceed();
      });

      // Check the properties to be combined
      act(() => {
        result.current.togglePropertyCheck(3);
        result.current.togglePropertyCheck(4);
      });

      expect(result.current.hasDifferentOwners).toBe(true);

      // Attempt to combine
      await act(async () => {
        await result.current.handleCombine();
      });

      expect(actions.createCombinePropertyAction).toHaveBeenCalledWith(expect.objectContaining({
        overrideOwnerNameMismatch: true
      }));
    });

    it("should prevent combine if no properties are checked", async () => {
      const mockDetails: PropertyCombineDetails[] = [
        { propertyId: 3, wardId: 1, wardNo: "W1", propertyNo: "P3", partitionNo: "P3", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
      ];

      vi.mocked(actions.fetchPropertyCombineDetailsAction).mockResolvedValue(mockDetails);
      mockSearchParams.mockReturnValue(new URLSearchParams("from=3&to=3"));

      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      await act(async () => {
        result.current.handleProceed();
      });

      expect(result.current.checkedCount).toBe(1);

      // Attempt to combine without checking additional properties (only base property is checked)
      await act(async () => {
        await result.current.handleCombine();
      });

      expect(toast.error).toHaveBeenCalledWith("selectAtLeastOneToMerge");
      expect(actions.createCombinePropertyAction).not.toHaveBeenCalled();
    });

    it("should clear hasDifferentOwners if the mismatched property is unchecked", async () => {
      const mockDetails: PropertyCombineDetails[] = [
        { propertyId: 3, wardId: 1, wardNo: "W1", propertyNo: "P3", partitionNo: "P3", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
        { propertyId: 4, wardId: 1, wardNo: "W1", propertyNo: "P4", partitionNo: "P4", oldPropertyNo: "", ownerName: "Owner 2", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
      ];

      vi.mocked(actions.fetchPropertyCombineDetailsAction).mockResolvedValue(mockDetails);
      mockSearchParams.mockReturnValue(new URLSearchParams("from=3&to=4"));

      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      await act(async () => {
        result.current.handleProceed();
      });

      // Uncheck the mismatched property
      // wait, they are not checked initially anymore! We must first check them!
      act(() => {
        result.current.togglePropertyCheck(3);
        result.current.togglePropertyCheck(4);
      });

      // Initially has different owners
      expect(result.current.hasDifferentOwners).toBe(true);

      // Uncheck the mismatched property
      act(() => {
        result.current.togglePropertyCheck(4);
      });

      // Now it shouldn't have different owners because the checked properties only contain 'Owner 1'
      expect(result.current.hasDifferentOwners).toBe(false);
    });

    it("should toggle all properties correctly", async () => {
      const mockDetails: PropertyCombineDetails[] = [
        { propertyId: 3, wardId: 1, wardNo: "W1", propertyNo: "P3", partitionNo: "P3", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
        { propertyId: 4, wardId: 1, wardNo: "W1", propertyNo: "P4", partitionNo: "P4", oldPropertyNo: "", ownerName: "Owner 1", occupierName: "", taxAmount: 100, pendingAmount: 0, propertyDescription: ' ', propertyTypeId: 1 },
      ];

      vi.mocked(actions.fetchPropertyCombineDetailsAction).mockResolvedValue(mockDetails);
      mockSearchParams.mockReturnValue(new URLSearchParams("from=3&to=4"));

      const { result } = renderHook(() => useCombinePropertyForm(mockProps));

      await act(async () => {
        result.current.handleProceed();
      });

      // Initially only base property is checked
      expect(result.current.checkedCount).toBe(1);

      // Toggle all should check all
      act(() => {
        result.current.toggleAllProperties();
      });
      expect(result.current.checkedCount).toBe(3); // base + 2 from details

      // Toggle all again should uncheck all except base
      act(() => {
        result.current.toggleAllProperties();
      });
      expect(result.current.checkedCount).toBe(1);
    });
  });
});
