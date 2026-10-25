import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMeterTypeForm } from "@/hooks/water-bill/meter-type-master/useMeterTypeForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createMeterTypeAction,
  updateMeterTypeAction,
} from "@/app/[locale]/water-bill/metertypemaster/action";

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

vi.mock("@/app/[locale]/water-bill/metertypemaster/action", () => ({
  createMeterTypeAction: vi.fn(),
  updateMeterTypeAction: vi.fn(),
}));

describe("useMeterTypeForm", () => {
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
    const { result } = renderHook(() => useMeterTypeForm(defaultProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.code).toBe("");
    expect(result.current.formData.meterType).toBe("");
    expect(result.current.formData.description).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with initial data in edit mode", () => {
    const initialData = {
      id: 20,
      code: "AMR",
      meterTypeCode: "AMR",
      meterType: "AMR Meter",
      description: "Automatic Meter Reading",
      isActive: true,
    };

    const { result } = renderHook(() =>
      useMeterTypeForm({ ...defaultProps, id: 20, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.code).toBe("AMR");
    expect(result.current.formData.meterType).toBe("AMR Meter");
    expect(result.current.formData.description).toBe("Automatic Meter Reading");
  });

  it("should sanitize code input by removing special characters and converting to uppercase", () => {
    const { result } = renderHook(() => useMeterTypeForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("ultra_sound#1!");
    });

    expect(result.current.formData.code).toBe("ULTRASOUND1");
  });

  it("should sanitize meter type name input", () => {
    const { result } = renderHook(() => useMeterTypeForm(defaultProps));

    act(() => {
      result.current.handleMeterTypeChange("Ultrasonic Meter <v2>");
    });

    expect(result.current.formData.meterType).toBe("Ultrasonic Meter v2");
  });

  it("should update description", () => {
    const { result } = renderHook(() => useMeterTypeForm(defaultProps));

    act(() => {
      result.current.handleDescriptionChange("High precision ultrasonic flow sensor");
    });

    expect(result.current.formData.description).toBe("High precision ultrasonic flow sensor");
  });

  it("should validate required fields on submit", async () => {
    const { result } = renderHook(() => useMeterTypeForm(defaultProps));

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(result.current.errors.code).toBe("validation.codeRequired");
    expect(createMeterTypeAction).not.toHaveBeenCalled();
  });

  it("should call create action and succeed when form is valid", async () => {
    vi.mocked(createMeterTypeAction).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useMeterTypeForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("MECH");
      result.current.handleMeterTypeChange("Mechanical Meter");
      result.current.handleDescriptionChange("Standard dial meter");
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(createMeterTypeAction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "MECH",
        meterTypeCode: "MECH",
        meterType: "Mechanical Meter",
        description: "Standard dial meter",
        isActive: true,
      })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should call update action in edit mode", async () => {
    vi.mocked(updateMeterTypeAction).mockResolvedValue({ success: true });
    const initialData = {
      id: 20,
      code: "AMR",
      meterTypeCode: "AMR",
      meterType: "AMR Meter",
      description: "Automatic Meter Reading",
      isActive: true,
    };

    const { result } = renderHook(() =>
      useMeterTypeForm({ ...defaultProps, id: 20, initialData })
    );

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(updateMeterTypeAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show a toast error and keep the form open on API failure", async () => {
    vi.mocked(createMeterTypeAction).mockResolvedValue({
      success: false,
      statusCode: 409,
      message: "Record already exists.",
    });
    const { result } = renderHook(() => useMeterTypeForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("MECH");
      result.current.handleMeterTypeChange("Mechanical Meter");
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
