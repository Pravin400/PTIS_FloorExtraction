import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAssetGrievanceRemarkForm } from "@/hooks/asset-masters/grievance-remark/useAssetGrievanceRemarkForm";

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

vi.mock("@/app/[locale]/assets/configuration/master-data/grievance-remark-master/action", () => ({
  createAssetGrievanceRemarkAction: vi.fn().mockResolvedValue({ success: true, message: "Remark created successfully" }),
  updateAssetGrievanceRemarkAction: vi.fn().mockResolvedValue({ success: true, message: "Remark updated successfully" }),
}));

describe("useAssetGrievanceRemarkForm", () => {
  const defaultProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize form data for creation", () => {
    const { result } = renderHook(() => useAssetGrievanceRemarkForm(defaultProps));

    expect(result.current.formData).toEqual({
      id: undefined,
      grievanceCategoryId: 0,
      remark: "",
      description: "",
      isActive: true,
    });
    expect(result.current.isEdit).toBe(false);
  });

  it("should initialize form data when editing", () => {
    const initialData = {
      id: 8,
      grievanceCategoryId: 2,
      grievanceCategoryName: "Water Issue",
      remark: "Broken pipe",
      description: "Needs immediate repair",
      isActive: false,
      markedForDeletion: false,
      createdDate: "2026-08-05T00:00:00Z",
      updatedDate: null,
    };
    const { result } = renderHook(() => useAssetGrievanceRemarkForm({ ...defaultProps, id: 8, initialData }));

    expect(result.current.formData).toEqual({
      id: 8,
      grievanceCategoryId: 2,
      remark: "Broken pipe",
      description: "Needs immediate repair",
      isActive: false,
    });
    expect(result.current.isEdit).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it("should handle select change correctly", () => {
    const { result } = renderHook(() => useAssetGrievanceRemarkForm(defaultProps));

    act(() => {
      result.current.handleSelectChange("grievanceCategoryId", "5");
    });

    expect(result.current.formData.grievanceCategoryId).toBe(5);
  });
});
