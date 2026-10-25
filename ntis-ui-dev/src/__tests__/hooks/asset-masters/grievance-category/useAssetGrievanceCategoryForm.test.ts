import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetGrievanceCategoryForm } from "@/hooks/asset-masters/grievance-category/useAssetGrievanceCategoryForm";

const mockPush = vi.fn();
const mockToastError = vi.fn();
const mockToastSuccess = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useLocale: () => "en",
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({
  toast: {
    error: (msg: string) => mockToastError(msg),
    success: (msg: string) => mockToastSuccess(msg),
  },
}));

vi.mock("@/app/[locale]/assets/configuration/master-data/grievance-category-master/action", () => ({
  createAssetGrievanceCategoryAction: vi.fn().mockResolvedValue({ success: true, message: "Created successfully" }),
  updateAssetGrievanceCategoryAction: vi.fn().mockResolvedValue({ success: true, message: "Updated successfully" }),
}));

describe("useAssetGrievanceCategoryForm", () => {
  const defaultProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default empty form data when not editing", () => {
    const { result } = renderHook(() => useAssetGrievanceCategoryForm(defaultProps));

    expect(result.current.formData).toEqual({
      id: undefined,
      grievanceTypeCode: "",
      grievanceTypeName: "",
      grievanceTypeNameLocal: "",
      codeFormat: "",
      targetTableName: "",
      slaDays: null,
      displaySequence: null,   // null sentinel — must be explicitly entered
      description: "",
      isActive: true,
    });
    expect(result.current.isEdit).toBe(false);
  });

  it("should initialize with provided initialData when editing", () => {
    const initialData = {
      id: 5,
      grievanceTypeCode: "GRV_WATER",
      grievanceTypeName: "Water Issue",
      grievanceTypeNameLocal: "पाणी समस्या",
      codeFormat: "WTR-{SEQ}",
      targetTableName: "tbl_water",
      slaDays: 3,
      displaySequence: 1,
      description: "Leakage issues",
      isActive: false,
      markedForDeletion: false,
      createdDate: "2026-08-05T00:00:00Z",
      updatedDate: null,
    };
    const { result } = renderHook(() => useAssetGrievanceCategoryForm({ ...defaultProps, id: 5, initialData }));

    expect(result.current.formData).toEqual({
      id: 5,
      grievanceTypeCode: "GRV_WATER",
      grievanceTypeName: "Water Issue",
      grievanceTypeNameLocal: "पाणी समस्या",
      codeFormat: "WTR-{SEQ}",
      targetTableName: "tbl_water",
      slaDays: 3,
      displaySequence: 1,
      description: "Leakage issues",
      isActive: false,
    });
    expect(result.current.isEdit).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it("should update form state correctly on handleChange", () => {
    const { result } = renderHook(() => useAssetGrievanceCategoryForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "grievanceTypeName", value: "New Category" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.grievanceTypeName).toBe("New Category");
  });

  it("should toggle isActive state when handleToggleStatus is called", () => {
    const { result } = renderHook(() => useAssetGrievanceCategoryForm(defaultProps));

    act(() => {
      result.current.handleToggleStatus(false);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.formData.isActive).toBe(false);
  });

  it("should keep null sentinel when displaySequence is cleared so required error fires", () => {
    const { result } = renderHook(() => useAssetGrievanceCategoryForm(defaultProps));

    // type a value first
    act(() => {
      result.current.handleChange({
        target: { name: "displaySequence", value: "3" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.displaySequence).toBe(3);

    // then clear it
    act(() => {
      result.current.handleChange({
        target: { name: "displaySequence", value: "" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    // sentinel must be null, not 0, so the required validator will fire
    expect(result.current.formData.displaySequence).toBeNull();
    expect(result.current.displaySequenceValue).toBe("");
  });

  it("shows the deactivate reference error under the status toggle and clears it on toggle", async () => {
    const { updateAssetGrievanceCategoryAction } = await import("@/app/[locale]/assets/configuration/master-data/grievance-category-master/action");
    vi.mocked(updateAssetGrievanceCategoryAction).mockResolvedValueOnce({
      success: false,
      statusCode: 400,
      message: "This Grievance Category cannot be deactivated because it has Grievance Remarks. Please delete all Grievance Remarks for this Grievance Category first.",
    });
    const initialData = {
      id: 5,
      grievanceTypeCode: "GRV_WATER",
      grievanceTypeName: "Water Issue",
      grievanceTypeNameLocal: "Water",
      codeFormat: "WTR-{SEQ}",
      targetTableName: "tbl_water",
      slaDays: 3,
      displaySequence: 1,
      description: "Leakage issues",
      isActive: true,
      markedForDeletion: false,
      createdDate: "2026-08-05T00:00:00Z",
      updatedDate: null,
    };
    const { result } = renderHook(() => useAssetGrievanceCategoryForm({ ...defaultProps, id: 5, initialData }));

    act(() => result.current.handleToggleStatus(false));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never);
    });

    expect(mockToastError).toHaveBeenCalledWith("apiErrors.referenceBlocked.grievanceCategory.deactivateHasMasters");
    expect(result.current.errors.isActive).toBe("apiErrors.referenceBlocked.grievanceCategory.deactivateHasMasters");

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBe("");
  });
});
