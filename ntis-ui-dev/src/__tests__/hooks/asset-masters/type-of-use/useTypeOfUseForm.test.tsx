import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTypeOfUseForm } from "@/hooks/asset-masters/type-of-use/useTypeOfUseForm";
import type { AssetTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import {
  createAssetTypeOfUseAction,
  updateAssetTypeOfUseAction,
} from "@/app/[locale]/assets/configuration/master-data/type-of-use/action";
import { toast } from "sonner";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number | Date>) =>
    values?.default ? String(values.default) : key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/type-of-use/action", () => ({
  createAssetTypeOfUseAction: vi.fn(),
  updateAssetTypeOfUseAction: vi.fn(),
}));

describe("useTypeOfUseForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
    initialTypes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes default values for a new Type of Use", () => {
    const { result } = renderHook(() => useTypeOfUseForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.assetCategoryId).toBe(0);
    expect(result.current.formData.assetTypeId).toBe(0);
    expect(result.current.formData.typeOfUseGroupId).toBe(0);
    expect(result.current.formData.typeOfUseCode).toBe("");
    expect(result.current.formData.description).toBe("");
    expect(result.current.formData.searchSequence).toBe("");
    expect(result.current.formData.type).toBe("");
  });

  it("initializes from provided edit data and normalizes null fields", () => {
    const initialData = {
      id: 17,
      isActive: false,
      assetCategoryId: 5,
      assetTypeId: 8,
      typeOfUseGroupId: 12,
      typeOfUseCode: "RES",
      description: null,
      type: "R",
      searchSequence: null,
    } as unknown as AssetTypeOfUse;

    const { result } = renderHook(() =>
      useTypeOfUseForm({ ...mockProps, id: 17, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.assetCategoryId).toBe(5);
    expect(result.current.formData.assetTypeId).toBe(8);
    expect(result.current.formData.typeOfUseGroupId).toBe(12);
    expect(result.current.formData.typeOfUseCode).toBe("RES");
    expect(result.current.formData.description).toBe("");
    expect(result.current.formData.searchSequence).toBe("");
    expect(result.current.formData.isActive).toBe(false);
  });

  it("handles form field change and sanitization", () => {
    const { result } = renderHook(() => useTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "typeOfUseCode", value: "res-123!" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.typeOfUseCode).toBe("RES-123");

    act(() => {
      result.current.handleChange({
        target: { name: "searchSequence", value: "005" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.searchSequence).toBe(5);
  });

  it("handles handleBlur and validation error setting", () => {
    const { result } = renderHook(() => useTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleBlur({
        target: { name: "typeOfUseCode", value: "" },
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.errors.typeOfUseCode).toBeDefined();
    expect(result.current.showError("typeOfUseCode")).toBe(true);
  });

  it("blocks submission on invalid form data", async () => {
    const { result } = renderHook(() => useTypeOfUseForm(mockProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(createAssetTypeOfUseAction).not.toHaveBeenCalled();
  });

  it("handles successful form submission on create", async () => {
    vi.mocked(createAssetTypeOfUseAction).mockResolvedValueOnce({
      success: true,
      message: "Type created successfully",
    });

    const { result } = renderHook(() => useTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleChange({ target: { name: "assetCategoryId", value: "1" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "assetTypeId", value: "2" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "typeOfUseGroupId", value: "3" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "typeOfUseCode", value: "RES" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "description", value: "Residential" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "type", value: "R" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "searchSequence", value: "1" } } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createAssetTypeOfUseAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Type created successfully");
    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  it("handles failed API submission error toast", async () => {
    vi.mocked(createAssetTypeOfUseAction).mockResolvedValueOnce({
      success: false,
      message: "Duplicate record",
    });

    const { result } = renderHook(() => useTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleChange({ target: { name: "assetCategoryId", value: "1" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "assetTypeId", value: "2" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "typeOfUseGroupId", value: "3" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "typeOfUseCode", value: "RES" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "description", value: "Residential" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "type", value: "R" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "searchSequence", value: "1" } } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createAssetTypeOfUseAction).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Duplicate record");
  });

  it("handles successful form submission on edit", async () => {
    vi.mocked(updateAssetTypeOfUseAction).mockResolvedValueOnce({
      success: true,
      message: "Type updated successfully",
    });

    const initialData = {
      id: 17,
      isActive: true,
      assetCategoryId: 5,
      assetTypeId: 8,
      typeOfUseGroupId: 12,
      typeOfUseCode: "RES",
      description: "Residential",
      type: "R",
      searchSequence: 4,
    } as unknown as AssetTypeOfUse;

    const { result } = renderHook(() =>
      useTypeOfUseForm({ ...mockProps, id: 17, initialData })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(updateAssetTypeOfUseAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Type updated successfully");
    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  it("shows the deactivate reference error on the status field and clears it on toggle", async () => {
    vi.mocked(updateAssetTypeOfUseAction).mockResolvedValueOnce({
      success: false,
      statusCode: 400,
      message:
        "This Type Of Use cannot be deactivated because it has Sub Type Of Uses and Use Factors. Please delete all Sub Type Of Uses and Use Factors for this Type Of Use first.",
    });

    const initialData = {
      id: 17,
      isActive: true,
      assetCategoryId: 5,
      assetTypeId: 8,
      typeOfUseGroupId: 12,
      typeOfUseCode: "RES",
      description: "Residential",
      type: "R",
      searchSequence: 4,
    } as unknown as AssetTypeOfUse;

    const { result } = renderHook(() =>
      useTypeOfUseForm({ ...mockProps, id: 17, initialData })
    );

    act(() => result.current.handleToggleStatus(false));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.isActive).toBe("apiErrors.referenceBlocked.typeOfUse.deactivateHasMasters");
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.typeOfUse.deactivateHasMasters");

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBe("");
  });
});
