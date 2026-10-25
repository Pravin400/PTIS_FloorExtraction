import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReadingSourceForm } from "@/hooks/water-bill/reading-source-master/useReadingSourceForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createReadingSourceAction,
  updateReadingSourceAction,
} from "@/app/[locale]/water-bill/readingsourcemaster/action";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => "en"),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/readingsourcemaster/action", () => ({
  createReadingSourceAction: vi.fn(),
  updateReadingSourceAction: vi.fn(),
}));

describe("useReadingSourceForm", () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  };

  const defaultProps = {
    id: null,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue(mockRouter as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useTranslations).mockReturnValue(((key: string) => key) as unknown as ReturnType<typeof useTranslations>);
    vi.mocked(useLocale).mockReturnValue("en");
  });

  it("should initialize default form values in create mode", () => {
    const { result } = renderHook(() => useReadingSourceForm(defaultProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.code).toBe("");
    expect(result.current.formData.readingSource).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with initial data in edit mode", () => {
    const initialData = {
      id: 30,
      code: "FIELD",
      readingSourceCode: "FIELD",
      readingSource: "Field Inspection",
      isActive: true,
    };

    const { result } = renderHook(() =>
      useReadingSourceForm({ ...defaultProps, id: 30, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.code).toBe("FIELD");
    expect(result.current.formData.readingSource).toBe("Field Inspection");
  });

  it("should sanitize code input by removing special characters and converting to uppercase", () => {
    const { result } = renderHook(() => useReadingSourceForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("import_file#1");
    });

    expect(result.current.formData.code).toBe("IMPORTFILE1");
  });

  it("should sanitize reading source name input", () => {
    const { result } = renderHook(() => useReadingSourceForm(defaultProps));

    act(() => {
      result.current.handleSourceNameChange("Field Visit (2026)");
    });

    expect(result.current.formData.readingSource).toBe("Field Visit 2026");
  });

  it("should validate required fields on submit", async () => {
    const { result } = renderHook(() => useReadingSourceForm(defaultProps));

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(result.current.errors.code).toBe("validation.codeRequired");
    expect(createReadingSourceAction).not.toHaveBeenCalled();
  });

  it("should call create action and succeed when form is valid", async () => {
    vi.mocked(createReadingSourceAction).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useReadingSourceForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("FIELD");
      result.current.handleSourceNameChange("Field Inspection");
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(createReadingSourceAction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "FIELD",
        readingSourceCode: "FIELD",
        readingSource: "Field Inspection",
        isActive: true,
      })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should call update action in edit mode", async () => {
    vi.mocked(updateReadingSourceAction).mockResolvedValue({ success: true });
    const initialData = {
      id: 30,
      code: "FIELD",
      readingSourceCode: "FIELD",
      readingSource: "Field Inspection",
      isActive: true,
    };

    const { result } = renderHook(() =>
      useReadingSourceForm({ ...defaultProps, id: 30, initialData })
    );

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(updateReadingSourceAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show a toast error and keep the form open on API failure", async () => {
    vi.mocked(createReadingSourceAction).mockResolvedValue({
      success: false,
      statusCode: 409,
      message: "Record already exists.",
    });
    const { result } = renderHook(() => useReadingSourceForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("FIELD");
      result.current.handleSourceNameChange("Field Inspection");
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(toast.error).toHaveBeenCalledWith("messages.duplicateRecord");
    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(false);
  });
});
