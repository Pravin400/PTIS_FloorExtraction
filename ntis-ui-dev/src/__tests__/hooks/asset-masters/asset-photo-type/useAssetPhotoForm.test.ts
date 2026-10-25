import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetPhotoForm } from "@/hooks/asset-masters/assetphototype/useAssetPhotoForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/asset-photo-type/action";
import { toast } from "sonner";
import type { AssetPhotoType } from "@/types/asset-masters/asset-photo-type.types";
import { ChangeEvent, FormEvent } from "react";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/en/assets/configuration/master-data/asset-photo-type",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/asset-photo-type/action", () => ({
  createAssetPhotoAction: vi.fn(),
  updateAssetPhotoAction: vi.fn(),
}));

describe("useAssetPhotoForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default data when adding a new photo type", () => {
    const { result } = renderHook(() => useAssetPhotoForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.photoTypeCode).toBe("");
    expect(result.current.formData.isActive).toBe(true);
    expect(result.current.formData.isRequired).toBe(false);
  });

  it("should initialize with provided data when editing", () => {
    const initialData = {
      id: 5,
      photoTypeCode: "CODE5",
      photoTypeName: "Name 5",
      description: "Desc 5",
      displayOrder: 5,
      isActive: true,
      assetCategoryId: 1,
      assetTypeId: 2,
      isRequired: true,
    } as AssetPhotoType;

    const { result } = renderHook(() =>
      useAssetPhotoForm({ ...mockProps, id: 5, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.photoTypeCode).toBe("CODE5");
    expect(result.current.formData.isRequired).toBe(true);
  });

  it("should update form data when handleChange is called", () => {
    const { result } = renderHook(() => useAssetPhotoForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "photoTypeName", value: "New Photo Name" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.photoTypeName).toBe("New Photo Name");
  });

  it("should sanitize and update form data on handleBlur", () => {
    const { result } = renderHook(() => useAssetPhotoForm(mockProps));

    act(() => {
      result.current.handleBlur({
        target: { name: "photoTypeCode", value: "PHOTO_#123" },
      } as unknown as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.formData.photoTypeCode).toBe("PHOTO_123");
  });

  it("should toggle status", () => {
    const { result } = renderHook(() => useAssetPhotoForm(mockProps));

    act(() => {
      result.current.handleToggleStatus(false);
    });
    expect(result.current.formData.isActive).toBe(false);

    act(() => {
      result.current.handleToggleStatus(true);
    });
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should toggle isRequired", () => {
    const { result } = renderHook(() => useAssetPhotoForm(mockProps));

    act(() => {
      result.current.handleToggleRequired(true);
    });
    expect(result.current.formData.isRequired).toBe(true);

    act(() => {
      result.current.handleToggleRequired(false);
    });
    expect(result.current.formData.isRequired).toBe(false);
  });

  it("should call createAssetPhotoAction on submit when adding", async () => {
    const mockResult = { success: true, message: "" };
    vi.mocked(actions.createAssetPhotoAction).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useAssetPhotoForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "photoTypeCode", value: "TEST" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "photoTypeName", value: "Test Name" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "description", value: "Test description" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "displayOrder", value: "1" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.handleSelectChange("assetCategoryId", "1");
      result.current.handleSelectChange("assetTypeId", "2");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(actions.createAssetPhotoAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  it("should handle non-numeric select values in handleSelectChange and set them to null", () => {
    const { result } = renderHook(() => useAssetPhotoForm(mockProps));

    act(() => {
      result.current.handleSelectChange("assetTypeId", "abc");
    });

    expect(result.current.formData.assetTypeId).toBeNull();
  });

  it("puts the deactivate reference error on isActive and clears it when the status toggles", async () => {
    vi.mocked(actions.updateAssetPhotoAction).mockResolvedValue({
      success: false,
      message: "This Asset Photo Type cannot be deactivated because it is in use.",
      statusCode: 400,
    });
    const initialData = {
      id: 5,
      photoTypeCode: "CODE5",
      photoTypeName: "Name 5",
      description: "Desc 5",
      displayOrder: 5,
      isActive: true,
      assetCategoryId: 1,
      assetTypeId: 2,
      isRequired: true,
    } as AssetPhotoType;

    const { result } = renderHook(() => useAssetPhotoForm({ ...mockProps, id: 5, initialData }));

    act(() => {
      result.current.handleToggleStatus(false);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    const expected = "apiErrors.referenceBlocked.assetPhotoType.deactivateInUse";
    expect(actions.updateAssetPhotoAction).toHaveBeenCalled();
    expect(result.current.errors.isActive).toBe(expected);
    expect(toast.error).toHaveBeenCalledWith(expected);

    act(() => {
      result.current.handleToggleStatus(true);
    });
    expect(result.current.errors.isActive).toBeFalsy();
  });

  it("does not put the delete reference error on isActive", async () => {
    vi.mocked(actions.updateAssetPhotoAction).mockResolvedValue({
      success: false,
      message: "This Asset Photo Type cannot be deleted because it is in use.",
      statusCode: 400,
    });
    const initialData = {
      id: 5,
      photoTypeCode: "CODE5",
      photoTypeName: "Name 5",
      description: "Desc 5",
      displayOrder: 5,
      isActive: true,
      assetCategoryId: 1,
      assetTypeId: 2,
      isRequired: true,
    } as AssetPhotoType;

    const { result } = renderHook(() => useAssetPhotoForm({ ...mockProps, id: 5, initialData }));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(result.current.errors.isActive).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.assetPhotoType.deleteInUse");
  });
});
