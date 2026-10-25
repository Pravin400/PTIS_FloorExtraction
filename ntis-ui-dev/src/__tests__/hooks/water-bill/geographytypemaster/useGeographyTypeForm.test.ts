import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGeographyTypeForm } from "@/hooks/water-bill/geographytypemaster/useGeographyTypeForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createGeographyTypeAction,
  updateGeographyTypeAction,
} from "@/app/[locale]/water-bill/geography-type-master/action";

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

vi.mock("@/app/[locale]/water-bill/geography-type-master/action", () => ({
  createGeographyTypeAction: vi.fn(),
  updateGeographyTypeAction: vi.fn(),
}));

describe("useGeographyTypeForm", () => {
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
    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    expect(result.current.formData.geographyTypeCode).toBe("");
    expect(result.current.isEdit).toBe(false);
    expect(result.current.isActive).toBe(true);
  });

  it("should initialize with initial data for edit mode", () => {
    const initialData = {
      id: 123,
      geographyTypeCode: "ZONE",
      geographyType: "Zone",
      levelNo: 1,
      isActive: false,
      createdDate: "2026-09-16T10:20:18",
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useGeographyTypeForm({ ...defaultProps, id: 123, initialData })
    );

    expect(result.current.formData.geographyTypeCode).toBe("ZONE");
    expect(result.current.isEdit).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it("should handle input changes", () => {
    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "geographyTypeCode", value: "newcode" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.geographyTypeCode).toBe("NEWCODE");
  });

  it("should sanitize the level number to digits only", () => {
    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "levelNo", value: "12a3" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.levelNoValue).toBe("123");
    expect(result.current.formData.levelNo).toBe(123);
  });

  it("should handle status toggle", () => {
    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.formData.isActive).toBe(false);
  });

  it("should validate and show errors on submit", async () => {
    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.geographyTypeCode).toBeDefined();
    expect(createGeographyTypeAction).not.toHaveBeenCalled();
  });

  it("should call create action on successful submit", async () => {
    vi.mocked(createGeographyTypeAction).mockResolvedValue({ success: true });

    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "geographyTypeCode", value: "MOUJA" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "geographyType", value: "Mouja" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "levelNo", value: "3" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(createGeographyTypeAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should call update action in edit mode", async () => {
    vi.mocked(updateGeographyTypeAction).mockResolvedValue({ success: true });

    const initialData = {
      id: 123,
      geographyTypeCode: "ZONE",
      geographyType: "Zone",
      levelNo: 1,
      isActive: true,
      createdDate: "",
      updatedDate: null,
    };

    const { result } = renderHook(() =>
      useGeographyTypeForm({ ...defaultProps, id: 123, initialData })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(updateGeographyTypeAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show error toast when geography type contains only numbers", async () => {
    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "geographyTypeCode", value: "Z1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "geographyType", value: "12345" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
      result.current.handleChange({
        target: { name: "levelNo", value: "1" },
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(toast.error).toHaveBeenCalledWith("form.validation.geographyTypeNumbersOnlyNotAllowed");
    expect(createGeographyTypeAction).not.toHaveBeenCalled();
  });

  it("should handle cancel", () => {
    const { result } = renderHook(() => useGeographyTypeForm(defaultProps));

    act(() => {
      result.current.handleCancel();
    });

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
