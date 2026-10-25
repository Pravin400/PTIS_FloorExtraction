import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCommonRemarkForm } from "@/hooks/common-remark-master/useCommonRemarkForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { saveCommonRemarkAction, createRemarkCategoryAction, fetchRemarkCategoriesAction } from "@/app/[locale]/configuration-settings/common-remark-master/actions";
import type { CommonRemark } from "@/types/common-remark-master/common-remark.types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => {
    return key;
  }),
  useLocale: vi.fn(() => "en"),
}));

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock server actions
vi.mock("@/app/[locale]/configuration-settings/common-remark-master/actions", () => ({
  saveCommonRemarkAction: vi.fn(),
  createRemarkCategoryAction: vi.fn(),
  fetchRemarkCategoriesAction: vi.fn(() => Promise.resolve([])),
}));

describe("useCommonRemarkForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as unknown as ReturnType<typeof useTranslations>);
    vi.mocked(useLocale).mockReturnValue("en");
    vi.mocked(fetchRemarkCategoriesAction).mockResolvedValue([
      { id: 1, categoryCode: "CAT1", categoryName: "Category 1" },
      { id: 2, categoryCode: "CAT2", categoryName: "Category 2" },
    ]);
  });

  const defaultProps = {
    id: null as number | null,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
    categories: [
      { id: 1, categoryCode: "CAT1", categoryName: "Category 1" },
      { id: 2, categoryCode: "CAT2", categoryName: "Category 2" },
    ],
  };

  const renderFormHook = async (props: Parameters<typeof useCommonRemarkForm>[0] = defaultProps) => {
    const hook = renderHook(() => useCommonRemarkForm(props));
    // Flush microtasks to allow fetchRemarkCategoriesAction to resolve and state to update within act()
    await act(async () => {
      await Promise.resolve();
    });
    return hook;
  };

  it("should initialize with default values for create mode", async () => {
    const { result } = await renderFormHook(defaultProps);

    expect(result.current.formData.remarkType).toBe("");
    expect(result.current.formData.remark).toBe("");
    expect(result.current.formData.isActive).toBe(true);
    expect(result.current.isEdit).toBe(false);
  });

  it("should initialize with initial data for edit mode", async () => {
    const initialData: CommonRemark = {
      id: 101,
      remarkTypeId: 2,
      remarkType: "Category 2",
      remark: "Existing remark content",
      isActive: false,
      createdDate: "2026-06-09",
      updatedDate: null,
    };

    const { result } = await renderFormHook({ ...defaultProps, id: 101, initialData });

    expect(result.current.formData.remarkType).toBe("2");
    expect(result.current.formData.remark).toBe("Existing remark content");
    expect(result.current.formData.isActive).toBe(false);
    expect(result.current.isEdit).toBe(true);
  });

  it("should handle select change", async () => {
    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "1");
    });

    expect(result.current.formData.remarkType).toBe("1");
    expect(result.current.customRemarkType).toBe("");
  });

  it("should clear customRemarkType when selecting non-Other category", async () => {
    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "Other");
      result.current.handleCustomTypeChange({
        target: { value: "Custom Value" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.customRemarkType).toBe("Custom Value");

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "2");
    });
    expect(result.current.customRemarkType).toBe("");
  });

  it("should handle input changes", async () => {
    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleChange({
        target: { name: "remark", value: "New remark value" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });

    expect(result.current.formData.remark).toBe("New remark value");
  });

  it("should handle status toggle", async () => {
    const { result } = await renderFormHook(defaultProps);

    expect(result.current.formData.isActive).toBe(true);

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.formData.isActive).toBe(false);
  });

  it("should validate required fields on submit", async () => {
    const { result } = await renderFormHook(defaultProps);

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.remarkType).toBe("form.validation.remarkTypeRequired");
    expect(result.current.errors.remark).toBe("form.validation.remarkRequired");
    expect(saveCommonRemarkAction).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("errors.validationError");
  });

  it("should validate custom remark type length and constraints", async () => {
    const { result } = await renderFormHook(defaultProps);

    // Select "Other"
    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "Other");
      result.current.handleChange({
        target: { name: "remark", value: "Valid remark value" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });

    // Case 1: Empty custom remark type
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.customRemarkType).toBe("form.validation.customRemarkTypeRequired");

    // Case 2: Length < 3
    act(() => {
      result.current.handleCustomTypeChange({
        target: { value: "ab" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.customRemarkType).toBe("form.validation.customRemarkTypeMinLength");

    // Case 3: Length > 50
    act(() => {
      result.current.handleCustomTypeChange({
        target: { value: "a".repeat(51) },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.customRemarkType).toBe("form.validation.customRemarkTypeMaxLength");

    // Case 4: Spaces only (trims to empty string, triggering required validator)
    act(() => {
      result.current.handleCustomTypeChange({
        target: { value: "   " },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.customRemarkType).toBe("form.validation.customRemarkTypeRequired");

    // Case 5: Consecutive spaces
    act(() => {
      result.current.handleCustomTypeChange({
        target: { value: "Custom  Type" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.customRemarkType).toBe("form.validation.customRemarkTypeConsecutiveSpaces");
  });

  it("should validate remark constraints", async () => {
    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "1");
    });

    // Case 1: Length < 3
    act(() => {
      result.current.handleChange({
        target: { name: "remark", value: "ab" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.remark).toBe("form.validation.remarkMinLength");

    // Case 2: Length > 300
    act(() => {
      result.current.handleChange({
        target: { name: "remark", value: "a".repeat(301) },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.remark).toBe("form.validation.remarkMaxLength");

    // Case 3: Spaces only (trims to empty string, triggering required validator)
    act(() => {
      result.current.handleChange({
        target: { name: "remark", value: "   " },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.remark).toBe("form.validation.remarkRequired");

    // Case 4: Consecutive spaces
    act(() => {
      result.current.handleChange({
        target: { name: "remark", value: "Valid  remark" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });
    expect(result.current.errors.remark).toBe("form.validation.remarkConsecutiveSpaces");
  });

  it("should sanitize remark and customRemarkType input by removing invalid characters", async () => {
    const { result } = await renderFormHook(defaultProps);

    // Test sanitization on customRemarkType
    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "Other");
      result.current.handleCustomTypeChange({
        target: { value: "Test@#$ Remark%" },
      } as React.ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.customRemarkType).toBe("Test Remark");

    // Test sanitization on remark
    act(() => {
      result.current.handleChange({
        target: { name: "remark", value: "Valid remark with @#$ invalid chars" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });
    expect(result.current.formData.remark).toBe("Valid remark with  invalid chars");
  });

  it("should validate format errors when data contains unsanitized invalid characters", async () => {
    const initialData: CommonRemark = {
      id: 101,
      remarkTypeId: 2,
      remarkType: "Category 2",
      remark: "Invalid remark @#$",
      isActive: true,
      createdDate: "2026-06-09",
      updatedDate: null,
    };

    // Render with unsanitized initialData to bypass change handler sanitization
    const { result } = await renderFormHook({ ...defaultProps, id: 101, initialData });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.remark).toBe("form.validation.remarkFormat");
  });

  it("should validate that isActive must be true on create", async () => {
    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "1");
      result.current.handleChange({
        target: { name: "remark", value: "Valid remark" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
      result.current.handleToggleStatus(); // toggle active (true -> false)
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.isActive).toBe("form.validation.mustBeActive");
  });

  it("should allow inactive status in edit mode", async () => {
    vi.mocked(saveCommonRemarkAction).mockResolvedValue({ ok: true, mode: "update" });

    const initialData: CommonRemark = {
      id: 101,
      remarkTypeId: 1,
      remarkType: "Category 1",
      remark: "Valid remark content",
      isActive: true,
      createdDate: "2026-06-09",
      updatedDate: null,
    };

    const { result } = await renderFormHook({ ...defaultProps, id: 101, initialData });

    act(() => {
      result.current.handleToggleStatus(); // toggle active (true -> false)
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.isActive).toBeUndefined();
    expect(saveCommonRemarkAction).toHaveBeenCalled();
  });

  it("should call saveCommonRemarkAction and show success toast on successful save", async () => {
    vi.mocked(saveCommonRemarkAction).mockResolvedValue({ ok: true, mode: "create" });

    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "1");
      result.current.handleChange({
        target: { name: "remark", value: "Valid remark content" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(saveCommonRemarkAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("messages.addSuccess");
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should handle duplicate api error on submit", async () => {
    vi.mocked(saveCommonRemarkAction).mockResolvedValue({ ok: false, error: "duplicate", message: "Duplicate record" });

    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "1");
      result.current.handleChange({
        target: { name: "remark", value: "Duplicate remark content" },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.remark).toBe("apiErrors.duplicateRecord");
    expect(toast.error).toHaveBeenCalledWith("apiErrors.duplicateRecord");
  });

  it("should handle backend JSON validation errors on submit when creating custom remark type", async () => {
    const rawBackendError = 'Failed to create remark type category: {"type":"https://tools.ietf.org/html/rfc9110#section-15.5.1","title":"One or more validation errors occurred.","status":400,"errors":{"RemarkTypeName":["RemarkTypeName_Invalid"]}}';
    
    vi.mocked(createRemarkCategoryAction).mockResolvedValue({ 
      ok: false, 
      error: "api_error", 
      message: rawBackendError 
    });

    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "Other");
      result.current.handleCustomTypeChange({
        target: { value: "Custom Type" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.customRemarkType).toBe("form.validation.customRemarkTypeFormat");
    expect(toast.error).toHaveBeenCalledWith("form.validation.customRemarkTypeFormat");
  });

  it("should successfully create a new remark type and switch back to select screen with new category selected", async () => {
    vi.mocked(createRemarkCategoryAction).mockResolvedValue({
      ok: true,
      data: { id: 3, categoryCode: "3", categoryName: "New Custom Type" },
    });

    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleSelectChange({} as React.ChangeEvent<HTMLSelectElement>, "Other");
      result.current.handleCustomTypeChange({
        target: { value: "New Custom Type" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createRemarkCategoryAction).toHaveBeenCalled();
    expect(result.current.formData.remarkType).toBe("3");
    expect(result.current.customRemarkType).toBe("");
    expect(result.current.categories).toContainEqual({
      id: 3,
      categoryCode: "3",
      categoryName: "New Custom Type",
    });
    expect(toast.success).toHaveBeenCalledWith("messages.remarkTypeAddSuccess");
  });

  it("should trigger cancel callback", async () => {
    const { result } = await renderFormHook(defaultProps);

    act(() => {
      result.current.handleCancel();
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
