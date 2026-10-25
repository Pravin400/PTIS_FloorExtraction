import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetRoomForm } from "@/hooks/asset-masters/assetroomtype/useAssetRoomForm";
import * as actions from "@/app/[locale]/assets/configuration/master-data/asset-room-type/action";
import { toast } from "sonner";
import type { AssetRoomType } from "@/types/asset-masters/asset-room-type.types";
import { ChangeEvent, FormEvent } from "react";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/en/assets/configuration/master-data/asset-room-type",
  useSearchParams: () => ({
    toString: () => "",
  }),
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

vi.mock("@/app/[locale]/assets/configuration/master-data/asset-room-type/action", () => ({
  createAssetRoomAction: vi.fn(),
  updateAssetRoomAction: vi.fn(),
}));

describe("useAssetRoomForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default data when adding a new room type", () => {
    const { result } = renderHook(() => useAssetRoomForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.roomTypeCode).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with provided data when editing", () => {
    const initialData = {
      id: 5,
      roomTypeCode: "ROOM5",
      roomTypeName: "Room 5",
      description: "Desc 5",
      isActive: true,
      assetTypeId: 2,
    } as AssetRoomType;

    const { result } = renderHook(() =>
      useAssetRoomForm({ ...mockProps, id: 5, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.roomTypeCode).toBe("ROOM5");
  });

  it("should update form data when handleChange is called", () => {
    const { result } = renderHook(() => useAssetRoomForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "roomTypeName", value: "New Room Name" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.roomTypeName).toBe("New Room Name");
  });

  it("should sanitize and update form data on handleBlur", () => {
    const { result } = renderHook(() => useAssetRoomForm(mockProps));

    act(() => {
      result.current.handleBlur({
        target: { name: "roomTypeCode", value: "ROOM_#123" },
      } as unknown as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.formData.roomTypeCode).toBe("ROOM_123");
  });

  it("should toggle status", () => {
    const { result } = renderHook(() => useAssetRoomForm(mockProps));

    act(() => {
      result.current.handleToggleStatus(false);
    });
    expect(result.current.formData.isActive).toBe(false);

    act(() => {
      result.current.handleToggleStatus(true);
    });
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should call createAssetRoomAction on submit when adding", async () => {
    const mockResult = { success: true, message: "" };
    vi.mocked(actions.createAssetRoomAction).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useAssetRoomForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "roomTypeCode", value: "TEST" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "roomTypeName", value: "Test Name" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "description", value: "Test description" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.handleSelectChange("assetCategoryId", "1");
      result.current.handleSelectChange("assetTypeId", "2");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(actions.createAssetRoomAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  it("should handle non-numeric select values in handleSelectChange and set them to null", () => {
    const { result } = renderHook(() => useAssetRoomForm(mockProps));

    act(() => {
      result.current.handleSelectChange("assetTypeId", "abc");
    });

    expect(result.current.formData.assetTypeId).toBeNull();
  });

  it("puts the deactivate reference error on isActive and clears it when the status toggles", async () => {
    vi.mocked(actions.updateAssetRoomAction).mockResolvedValue({
      success: false,
      message: "This Asset Room Type cannot be deactivated because it is in use.",
      statusCode: 400,
    });
    const initialData = {
      id: 5,
      roomTypeCode: "ROOM5",
      roomTypeName: "Room Name",
      description: "Room description",
      isActive: true,
      assetCategoryId: 1,
      assetTypeId: 2,
    } as AssetRoomType;

    const { result } = renderHook(() => useAssetRoomForm({ ...mockProps, id: 5, initialData }));

    act(() => {
      result.current.handleToggleStatus(false);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    const expected = "apiErrors.referenceBlocked.assetRoomType.deactivateInUse";
    expect(actions.updateAssetRoomAction).toHaveBeenCalled();
    expect(result.current.errors.isActive).toBe(expected);
    expect(toast.error).toHaveBeenCalledWith(expected);

    act(() => {
      result.current.handleToggleStatus(true);
    });
    expect(result.current.errors.isActive).toBeFalsy();
  });

  it("does not put the delete reference error on isActive", async () => {
    vi.mocked(actions.updateAssetRoomAction).mockResolvedValue({
      success: false,
      message: "This Asset Room Type cannot be deleted because it is in use.",
      statusCode: 400,
    });
    const initialData = {
      id: 5,
      roomTypeCode: "ROOM5",
      roomTypeName: "Room Name",
      description: "Room description",
      isActive: true,
      assetCategoryId: 1,
      assetTypeId: 2,
    } as AssetRoomType;

    const { result } = renderHook(() => useAssetRoomForm({ ...mockProps, id: 5, initialData }));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(result.current.errors.isActive).toBeFalsy();
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.assetRoomType.deleteInUse");
  });
});
