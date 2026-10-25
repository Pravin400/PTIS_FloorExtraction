/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetFieldDefinitionForm } from "@/hooks/asset-masters/asset-field-definition/useAssetFieldDefinitionForm";
import {
  createAssetFieldDefinitionAction,
  updateAssetFieldDefinitionAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-field-definition/action";
import { toast } from "sonner";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/en/assets/configuration/master-data/asset-field-definition/add",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: any) => {
    if (values?.count) return `${key} ${values.count}`;
    if (values?.default) return String(values.default);
    return key;
  },
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/asset-field-definition/action", () => ({
  createAssetFieldDefinitionAction: vi.fn(),
  updateAssetFieldDefinitionAction: vi.fn(),
}));

describe("useAssetFieldDefinitionForm Hook", () => {
  const mockCategories = [{ id: 10, name: "Land" }];
  const mockTypes = [{ id: 20, name: "Open Plot" }];
  const mockFieldGroups = ["General Specs"];

  const validInitialData = {
    id: 1,
    assetCategoryId: 10,
    assetTypeId: 20,
    fieldCode: "FLD01",
    fieldName: "Total Area",
    fieldLabel: "Total Area Label",
    fieldType: "text",
    fieldGroup: "General Specs",
    isRequired: true,
    displayOrder: 1,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes form state correctly for create mode", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
        fieldGroups: mockFieldGroups,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.fieldName).toBe("");
    expect(result.current.formData.isActive).toBe(true);
    expect(result.current.categoryOptions).toEqual([{ label: "Land", value: "10" }]);
    expect(result.current.typeOptions).toEqual([{ label: "Open Plot", value: "20" }]);
  });

  it("initializes form state correctly for edit mode", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
        fieldGroups: mockFieldGroups,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.fieldName).toBe("Total Area");
    expect(result.current.displayOrderValue).toBe("1");
  });

  it("handles input change and sanitizes fieldName (Name Only)", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "fieldName", value: "Building 123 Name" },
      } as any);
    });

    expect(result.current.formData.fieldName).toBe("Building Name");
  });

  it("handles displayOrder change correctly", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "displayOrder", value: "05" },
      } as any);
    });

    expect(result.current.displayOrderValue).toBe("5");
    expect(result.current.formData.displayOrder).toBe(5);
  });

  it("handles handleBlur and sets touched & validation error", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: "fieldCode", value: "" },
      } as any);
    });

    expect(result.current.showError("fieldCode")).toBe(true);
    expect(result.current.errors.fieldCode).toBe("form.validation.fieldCodeRequired");
  });

  it("handles select change for category and updates search query", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleSelectChange("assetCategoryId", "10");
    });

    expect(result.current.formData.assetCategoryId).toBe(10);
    expect(mockReplace).toHaveBeenCalled();
  });

  it("handles select change for fieldGroup and preserves optionsJson", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleSelectChange("fieldType", "checkbox");
      result.current.handleChange({
        target: { name: "optionsJson", value: "Male, Female" },
      } as any);
    });

    expect(result.current.formData.optionsJson).toBe("Male, Female");

    act(() => {
      result.current.handleSelectChange("fieldGroup", "General Specs");
    });

    expect(result.current.formData.fieldGroup).toBe("General Specs");
    expect(result.current.formData.optionsJson).toBe("Male, Female");
  });

  it("toggles active and required flags", () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleToggleStatus(false);
      result.current.handleToggleRequired(true);
    });

    expect(result.current.formData.isActive).toBe(false);
    expect(result.current.formData.isRequired).toBe(true);
  });

  it("blocks submit when validation fails", async () => {
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(createAssetFieldDefinitionAction).not.toHaveBeenCalled();
    expect(result.current.showError("fieldCode")).toBe(true);
  });

  it("submits form successfully on create", async () => {
    vi.mocked(createAssetFieldDefinitionAction).mockResolvedValueOnce({
      success: true,
      message: "Created",
    });

    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(createAssetFieldDefinitionAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("success.created");
  });

  it("submits form successfully on edit", async () => {
    vi.mocked(updateAssetFieldDefinitionAction).mockResolvedValueOnce({
      success: true,
      message: "Updated",
    });

    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(updateAssetFieldDefinitionAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("success.updated");
  });

  it("shows error toast when submit API fails", async () => {
    vi.mocked(createAssetFieldDefinitionAction).mockResolvedValueOnce({
      success: false,
      message: "Duplicate field code",
    });

    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(toast.error).toHaveBeenCalledWith("errors.duplicateFieldCode");
  });

  it("navigates back on handleCancel", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleCancel();
    });

    expect(result.current.open).toBe(false);
    vi.advanceTimersByTime(400);
    expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/asset-field-definition");
    vi.useRealTimers();
  });

  it("puts the deactivate reference error on isActive and clears it when the status toggles", async () => {
    vi.mocked(updateAssetFieldDefinitionAction).mockResolvedValueOnce({
      success: false,
      message: "This Asset Field Definition cannot be deactivated because it is in use.",
    });

    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
        fieldGroups: mockFieldGroups,
      })
    );

    act(() => {
      result.current.handleToggleStatus(false);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    const expected = "apiErrors.referenceBlocked.assetFieldDefinition.deactivateInUse";
    expect(result.current.errors.isActive).toBe(expected);
    expect(toast.error).toHaveBeenCalledWith(expected);

    act(() => {
      result.current.handleToggleStatus(true);
    });
    expect(result.current.errors.isActive).toBeFalsy();
  });

  it("does not put the delete reference error on isActive", async () => {
    vi.mocked(updateAssetFieldDefinitionAction).mockResolvedValueOnce({
      success: false,
      message: "This Asset Field Definition cannot be deleted because it is in use.",
    });

    const { result } = renderHook(() =>
      useAssetFieldDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
        fieldGroups: mockFieldGroups,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.errors.isActive).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.assetFieldDefinition.deleteInUse");
  });
});
