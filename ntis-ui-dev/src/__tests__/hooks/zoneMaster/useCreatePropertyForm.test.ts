import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCreatePropertyForm } from "@/hooks/zoneMaster/useCreatePropertyForm";
import { PropertyType } from "@/types/property-type.types";
import { PropertyCategory } from "@/types/property-category.types";
import { TaxZone } from "@/types/taxzoning.types";

// Mock dependencies
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("useCreatePropertyForm", () => {
  const mockPropertyTypes: PropertyType[] = [
    {
      id: 1,
      type: "Residential",
      propertyDescription: "Residential Property",
      propertyTypeGroup: "Group A",
      searchSequence: 1,
      propertyTypeCategoryId: 1,
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
  ];

  const mockPropertyCategories: PropertyCategory[] = [
    {
      id: 1,
      propertyCategoryName: "Apartment",
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
  ];

  const mockTaxZones: TaxZone[] = [
    {
      id: 1,
      taxZoneNo: "TZ1",
      taxZoneType: "Type A",
      remark: null,
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty form data", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    expect(result.current.formData.propertyTypeId).toBe("");
    expect(result.current.formData.categoryId).toBe("");
    expect(result.current.formData.taxZoneId).toBe("");
    expect(result.current.formData.isBulkCreate).toBe(false);
  });

  it("should pre-populate property number when drawer opens", () => {
    const { result, rerender } = renderHook(
      ({ isOpen }) =>
        useCreatePropertyForm({
          isOpen,
          nextPropertyNumber: "P001",
          propertyTypes: mockPropertyTypes,
          propertyCategories: mockPropertyCategories,
          taxZones: mockTaxZones,
        }),
      { initialProps: { isOpen: false } }
    );

    // Open drawer
    rerender({ isOpen: true });

    expect(result.current.formData.propertyNo).toBe("P001");
  });

  it("should generate property type options correctly", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    expect(result.current.propertyTypeOptions).toHaveLength(1);
    expect(result.current.propertyTypeOptions[0]).toEqual({
      value: "1",
      label: "Residential Property",
    });
  });

  it("should generate category options correctly", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    expect(result.current.categoryOptions).toHaveLength(1);
    expect(result.current.categoryOptions[0]).toEqual({
      value: "1",
      label: "Apartment",
    });
  });

  it("should generate tax zone options correctly", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    expect(result.current.taxZoneOptions).toHaveLength(1);
    expect(result.current.taxZoneOptions[0]).toEqual({
      value: "1",
      label: "TZ1 - Type A",
    });
  });

  it("should handle field changes", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    act(() => {
      result.current.handleFieldChange("ownerName", "John Doe");
    });

    expect(result.current.formData.ownerName).toBe("John Doe");
  });

  it("should clear society name when a non-apartment category is selected", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: [
          ...mockPropertyCategories,
          {
            id: 2,
            propertyCategoryName: "Commercial",
            isActive: true,
            createdDate: "2024-01-01",
            updatedDate: null,
          },
        ],
        taxZones: mockTaxZones,
      })
    );

    act(() => {
      result.current.setFormData((current) => ({
        ...current,
        categoryId: "1",
        societyName: "Sunrise Society",
      }));
      result.current.handleFieldChange("categoryId", "2");
    });

    expect(result.current.formData.societyName).toBe("");
  });

  it("should toggle bulk create mode", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: true,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    expect(result.current.formData.isBulkCreate).toBe(false);

    act(() => {
      result.current.handleBulkToggle(true);
    });

    expect(result.current.formData.isBulkCreate).toBe(true);
    expect(result.current.formData.fromPropertyNo).toBe("P001");
    expect(result.current.formData.propertyNo).toBe("");
  });

  it("should calculate bulk property count correctly", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: true,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    act(() => {
      result.current.handleBulkToggle(true);
      result.current.handleFieldChange("fromPropertyNo", "100");
      result.current.handleFieldChange("toPropertyNo", "110");
    });

    expect(result.current.bulkPropertyCount).toBe(11);
  });

  it("should validate form - missing required fields", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.propertyTypeId).toBeDefined();
    expect(result.current.errors.categoryId).toBeDefined();
    expect(result.current.errors.taxZoneId).toBeDefined();
  });

  it("should validate form - invalid bulk range", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: true,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    act(() => {
      result.current.handleBulkToggle(true);
      result.current.handleFieldChange("propertyTypeId", "1");
      result.current.handleFieldChange("categoryId", "1");
      result.current.handleFieldChange("taxZoneId", "1");
      result.current.handleFieldChange("ownerName", "John Doe");
      result.current.handleFieldChange("fromPropertyNo", "110");
      result.current.handleFieldChange("toPropertyNo", "100");
    });

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(false);
    });

    expect(result.current.errors.toPropertyNo).toBeDefined();
  });

  it("should validate form - valid single property", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: true,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    act(() => {
      result.current.handleFieldChange("propertyTypeId", "1");
      result.current.handleFieldChange("categoryId", "1");
      result.current.handleFieldChange("taxZoneId", "1");
      result.current.handleFieldChange("ownerName", "John Doe");
      result.current.handleFieldChange("propertyNo", "P001");
    });

    act(() => {
      const isValid = result.current.validateForm();
      expect(isValid).toBe(true);
    });

    expect(Object.keys(result.current.errors).length).toBe(0);
  });

  it("should reset form", () => {
    const { result } = renderHook(() =>
      useCreatePropertyForm({
        isOpen: false,
        nextPropertyNumber: "P001",
        propertyTypes: mockPropertyTypes,
        propertyCategories: mockPropertyCategories,
        taxZones: mockTaxZones,
      })
    );

    act(() => {
      result.current.handleFieldChange("ownerName", "John Doe");
      result.current.handleFieldChange("propertyTypeId", "1");
    });

    expect(result.current.formData.ownerName).toBe("John Doe");

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData.ownerName).toBe("");
    expect(result.current.formData.propertyTypeId).toBe("");
  });
});
