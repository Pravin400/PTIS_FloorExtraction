/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetDocumentDefinitionForm } from "@/hooks/asset-masters/asset-document-definition/useAssetDocumentDefinitionForm";
import {
  createAssetDocumentDefinitionAction,
  updateAssetDocumentDefinitionAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-document-definition/action";
import { toast } from "sonner";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/en/assets/configuration/master-data/asset-document-definition/add",
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

vi.mock("@/app/[locale]/assets/configuration/master-data/asset-document-definition/action", () => ({
  createAssetDocumentDefinitionAction: vi.fn(),
  updateAssetDocumentDefinitionAction: vi.fn(),
}));

describe("useAssetDocumentDefinitionForm Hook", () => {
  const mockCategories = [{ id: 10, name: "Land" }];
  const mockTypes = [{ id: 20, name: "Open Plot" }];

  const validInitialData = {
    id: 1,
    assetCategoryId: 10,
    assetTypeId: 20,
    documentCode: "DOC01",
    documentName: "Title Deed",
    description: "Property deed",
    isRequired: true,
    displayOrder: 1,
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes form state correctly for create mode", () => {
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.documentName).toBe("");
    expect(result.current.formData.isActive).toBe(true);
    expect(result.current.categoryOptions).toEqual([{ label: "Land", value: "10" }]);
    expect(result.current.typeOptions).toEqual([{ label: "Open Plot", value: "20" }]);
  });

  it("initializes form state correctly for edit mode", () => {
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.documentName).toBe("Title Deed");
    expect(result.current.displayOrderValue).toBe("1");
  });

  it("handles input change and sanitizes documentName", () => {
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "documentName", value: "  Title Deed_01!  " },
      } as any);
    });

    expect(result.current.formData.documentName).toBe("Title Deed_01 ");
  });

  it("handles displayOrder change correctly", () => {
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "displayOrder", value: "03" },
      } as any);
    });

    expect(result.current.displayOrderValue).toBe("3");
    expect(result.current.formData.displayOrder).toBe(3);
  });

  it("handles handleBlur and sets touched & validation error", () => {
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleBlur({
        target: { name: "documentCode", value: "" },
      } as any);
    });

    expect(result.current.showError("documentCode")).toBe(true);
    expect(result.current.errors.documentCode).toBe("form.validation.documentCodeRequired");
  });

  it("handles category selection change", () => {
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
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

  it("toggles active and required states", () => {
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
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
      useAssetDocumentDefinitionForm({
        id: null,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(createAssetDocumentDefinitionAction).not.toHaveBeenCalled();
    expect(result.current.showError("documentCode")).toBe(true);
  });

  it("submits form successfully on create", async () => {
    vi.mocked(createAssetDocumentDefinitionAction).mockResolvedValueOnce({
      success: true,
      message: "Created",
    });

    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: null,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(createAssetDocumentDefinitionAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("success.created");
  });

  it("submits form successfully on edit", async () => {
    vi.mocked(updateAssetDocumentDefinitionAction).mockResolvedValueOnce({
      success: true,
      message: "Updated",
    });

    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(updateAssetDocumentDefinitionAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("success.updated");
  });

  it("shows error toast when submit API fails", async () => {
    vi.mocked(createAssetDocumentDefinitionAction).mockResolvedValueOnce({
      success: false,
      message: "Duplicate document code",
    });

    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: null,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(toast.error).toHaveBeenCalledWith("errors.duplicateDocumentCode");
  });

  it("navigates back on handleCancel", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
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
    expect(mockPush).toHaveBeenCalledWith("/en/assets/configuration/master-data/asset-document-definition");
    vi.useRealTimers();
  });

  it("puts the deactivate reference error on isActive and clears it when the status toggles", async () => {
    vi.mocked(updateAssetDocumentDefinitionAction).mockResolvedValueOnce({
      success: false,
      message: "This Asset Document Definition cannot be deactivated because it is in use.",
    });

    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    act(() => {
      result.current.handleToggleStatus(false);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    const expected = "apiErrors.referenceBlocked.assetDocumentDefinition.deactivateInUse";
    expect(result.current.errors.isActive).toBe(expected);
    expect(toast.error).toHaveBeenCalledWith(expected);

    act(() => {
      result.current.handleToggleStatus(true);
    });
    expect(result.current.errors.isActive).toBeFalsy();
  });

  it("does not put the delete reference error on isActive", async () => {
    vi.mocked(updateAssetDocumentDefinitionAction).mockResolvedValueOnce({
      success: false,
      message: "This Asset Document Definition cannot be deleted because it is in use.",
    });

    const { result } = renderHook(() =>
      useAssetDocumentDefinitionForm({
        id: 1,
        initialData: validInitialData,
        categories: mockCategories,
        types: mockTypes,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as any);
    });

    expect(result.current.errors.isActive).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.assetDocumentDefinition.deleteInUse");
  });
});
