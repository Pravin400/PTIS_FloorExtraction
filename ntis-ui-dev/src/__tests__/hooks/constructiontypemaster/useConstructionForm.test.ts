import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConstructionForm } from "@/hooks/constructiontypemaster/useConstructionForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { createConstructionAction, updateConstructionAction } from "@/app/[locale]/property-tax/constructiontype/action";
import type { ConstructionType } from "@/types/construction.types";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
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
vi.mock("@/app/[locale]/property-tax/constructiontype/action", () => ({
  createConstructionAction: vi.fn(),
  updateConstructionAction: vi.fn(),
  getAllConstructionTypesAction: vi.fn(() => Promise.resolve([])),
}));

describe("useConstructionForm", () => {
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
  });

  const defaultProps = {
    id: null,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  it("should initialize with default values for create mode", () => {
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    expect(result.current.formData.constructionCode).toBe("");
    expect(result.current.isEdit).toBe(false);
    expect(result.current.isActive).toBe(true);
  });

  it("should initialize with initial data for edit mode", () => {
    const initialData = {
      id: 123,
      constructionCode: "C001",
      description: "Desc",
      searchSequence: 5,
      isActive: false,
      createdDate: "2024-01-01",
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useConstructionForm({ ...defaultProps, id: 123, initialData })
    );

    expect(result.current.formData.constructionCode).toBe("C001");
    expect(result.current.isEdit).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it("should handle input changes", () => {
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "constructionCode", value: "NEWCODE" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.constructionCode).toBe("NEWCODE");
  });

  it("should handle status toggle", () => {
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.formData.isActive).toBe(false);
  });

  it("should validate and show errors on submit", async () => {
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.constructionCode).toBeDefined();
    expect(createConstructionAction).not.toHaveBeenCalled();
  });

  it("should call create action on successful submit", async () => {
    vi.mocked(createConstructionAction).mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "constructionCode", value: "C1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "descriptionEnglish", value: "Valid English" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "description", value: "Valid Description" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "searchSequence", value: "5" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createConstructionAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should call update action in edit mode", async () => {
    vi.mocked(updateConstructionAction).mockResolvedValue({ success: true });
    
    const initialData = {
      id: 123,
      constructionCode: "C1",
      description: "D1",
      descriptionEnglish: "English D1",
      searchSequence: 1,
      isActive: true,
      createdDate: "",
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useConstructionForm({ ...defaultProps, id: 123, initialData })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(updateConstructionAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should allow Marathi/Hindi description on submission", async () => {
    vi.mocked(createConstructionAction).mockResolvedValue({ success: true });
    
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "constructionCode", value: "C1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "descriptionEnglish", value: "RCC Construction" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "description", value: "आरसीसी बांधकाम प्रकार" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "searchSequence", value: "1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createConstructionAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show error toast when description contains only numbers", async () => {
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "constructionCode", value: "C1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "descriptionEnglish", value: "Valid English" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "description", value: "12345" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "searchSequence", value: "1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(toast.error).toHaveBeenCalledWith("form.validation.descriptionNumbersOnlyNotAllowed");
    expect(createConstructionAction).not.toHaveBeenCalled();
  });

  it("should handle cancel", () => {
    const { result } = renderHook(() => useConstructionForm(defaultProps));

    act(() => {
      result.current.handleCancel();
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should show duplicate error when duplicate english description is entered", () => {
    const existing = [
      { id: 1, constructionCode: "C1", description: "R1", descriptionEnglish: "Existing English", searchSequence: 1, isActive: true },
    ];
    const { result } = renderHook(() =>
      useConstructionForm({ ...defaultProps, existingItems: existing as unknown as ConstructionType[] })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "descriptionEnglish", value: "Existing English" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.errors.descriptionEnglish).toBe("form.validation.descriptionEnglishExists");
  });

  it("should show duplicate error when duplicate regional description is entered", () => {
    const existing = [
      { id: 1, constructionCode: "C1", description: "Existing Regional", descriptionEnglish: "E1", searchSequence: 1, isActive: true },
    ];
    const { result } = renderHook(() =>
      useConstructionForm({ ...defaultProps, existingItems: existing as unknown as ConstructionType[] })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "description", value: "Existing Regional" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.errors.description).toBe("form.validation.descriptionExists");
  });

  it("should allow editing own record without triggering duplicate error", () => {
    const existing = [
      { id: 123, constructionCode: "C1", description: "My Regional", descriptionEnglish: "My English", searchSequence: 1, isActive: true },
    ];
    const { result } = renderHook(() =>
      useConstructionForm({
        ...defaultProps,
        id: 123,
        initialData: existing[0] as unknown as ConstructionType,
        existingItems: existing as unknown as ConstructionType[],
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: "descriptionEnglish", value: "My English" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "description", value: "My Regional" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.errors.descriptionEnglish).toBeUndefined();
    expect(result.current.errors.description).toBeUndefined();
  });
});
