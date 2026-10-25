import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSubTypeOfUseForm } from "@/hooks/asset-masters/type-of-use/useSubTypeOfUseForm";
import type { AssetSubTypeOfUse } from "@/types/asset-masters/type-of-use.types";
import {
  createAssetSubTypeOfUseAction,
  updateAssetSubTypeOfUseAction,
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
  createAssetSubTypeOfUseAction: vi.fn(),
  updateAssetSubTypeOfUseAction: vi.fn(),
}));

describe("useSubTypeOfUseForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes default values for a new Sub-Type of Use", () => {
    const { result } = renderHook(() => useSubTypeOfUseForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.typeOfUseId).toBe(0);
    expect(result.current.formData.description).toBe("");
    expect(result.current.formData.searchSequence).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("initializes from provided edit data and normalizes null fields", () => {
    const initialData = {
      id: 31,
      isActive: false,
      typeOfUseId: 14,
      description: null,
      searchSequence: null,
    } as unknown as AssetSubTypeOfUse;

    const { result } = renderHook(() =>
      useSubTypeOfUseForm({ ...mockProps, id: 31, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.typeOfUseId).toBe(14);
    expect(result.current.formData.description).toBe("");
    expect(result.current.formData.searchSequence).toBe("");
    expect(result.current.formData.isActive).toBe(false);
  });

  it("handles form field change and sanitization", () => {
    const { result } = renderHook(() => useSubTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "searchSequence", value: "009" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.searchSequence).toBe(9);
  });

  it("handles handleBlur and validation error setting", () => {
    const { result } = renderHook(() => useSubTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleBlur({
        target: { name: "description", value: "" },
      } as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.errors.description).toBeDefined();
    expect(result.current.showError("description")).toBe(true);
  });

  it("blocks submission on invalid form data", async () => {
    const { result } = renderHook(() => useSubTypeOfUseForm(mockProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(toast.error).toHaveBeenCalled();
    expect(createAssetSubTypeOfUseAction).not.toHaveBeenCalled();
  });

  it("handles successful form submission on create", async () => {
    vi.mocked(createAssetSubTypeOfUseAction).mockResolvedValueOnce({
      success: true,
      message: "Sub-Type created successfully",
    });

    const { result } = renderHook(() => useSubTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleChange({ target: { name: "typeOfUseId", value: "5" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "description", value: "Apartment" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "searchSequence", value: "2" } } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createAssetSubTypeOfUseAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Sub-Type created successfully");
    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  it("handles failed API submission error toast", async () => {
    vi.mocked(createAssetSubTypeOfUseAction).mockResolvedValueOnce({
      success: false,
      message: "Sub-Type Description already exists",
    });

    const { result } = renderHook(() => useSubTypeOfUseForm(mockProps));

    act(() => {
      result.current.handleChange({ target: { name: "typeOfUseId", value: "5" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "description", value: "Apartment" } } as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({ target: { name: "searchSequence", value: "2" } } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createAssetSubTypeOfUseAction).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Sub-Type Name already exists");
  });

  it("handles successful form submission on edit", async () => {
    vi.mocked(updateAssetSubTypeOfUseAction).mockResolvedValueOnce({
      success: true,
      message: "Sub-Type updated successfully",
    });

    const initialData = {
      id: 31,
      isActive: true,
      typeOfUseId: 14,
      description: "Apartment",
      searchSequence: 2,
    } as unknown as AssetSubTypeOfUse;

    const { result } = renderHook(() =>
      useSubTypeOfUseForm({ ...mockProps, id: 31, initialData })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(updateAssetSubTypeOfUseAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Sub-Type updated successfully");
    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  it("shows the deactivate reference error on the status field and clears it on toggle", async () => {
    vi.mocked(updateAssetSubTypeOfUseAction).mockResolvedValueOnce({
      success: false,
      statusCode: 400,
      message:
        "This Sub Type Of Use cannot be deactivated because it has Use Factors. Please delete all Use Factors for this Sub Type Of Use first.",
    });

    const initialData = {
      id: 31,
      isActive: true,
      typeOfUseId: 14,
      description: "Apartment",
      searchSequence: 2,
    } as unknown as AssetSubTypeOfUse;

    const { result } = renderHook(() =>
      useSubTypeOfUseForm({ ...mockProps, id: 31, initialData })
    );

    act(() => result.current.handleToggleStatus(false));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.isActive).toBe("apiErrors.referenceBlocked.subTypeOfUse.deactivateHasMasters");
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.subTypeOfUse.deactivateHasMasters");

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBe("");
  });
});
