import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMeterTestStatusForm } from "@/hooks/water-bill/meter-test-status-master/useMeterTestStatusForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  createMeterTestStatusAction,
  updateMeterTestStatusAction,
} from "@/app/[locale]/water-bill/meterteststatusmaster/action";

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

vi.mock("@/app/[locale]/water-bill/meterteststatusmaster/action", () => ({
  createMeterTestStatusAction: vi.fn(),
  updateMeterTestStatusAction: vi.fn(),
}));

describe("useMeterTestStatusForm", () => {
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
    const { result } = renderHook(() => useMeterTestStatusForm(defaultProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.code).toBe("");
    expect(result.current.formData.meterTestStatus).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with initial data in edit mode", () => {
    const initialData = {
      id: 10,
      code: "PENDING",
      meterTestStatusCode: "PENDING",
      meterTestStatus: "Pending",
      isActive: true,
    };

    const { result } = renderHook(() =>
      useMeterTestStatusForm({ ...defaultProps, id: 10, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.code).toBe("PENDING");
    expect(result.current.formData.meterTestStatus).toBe("Pending");
  });

  it("should sanitize code input by removing special characters and converting to uppercase", () => {
    const { result } = renderHook(() => useMeterTestStatusForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("pass#123@!");
    });

    expect(result.current.formData.code).toBe("PASS123");
    expect(result.current.formData.meterTestStatusCode).toBe("PASS123");
  });

  it("should sanitize status name input by removing special characters", () => {
    const { result } = renderHook(() => useMeterTestStatusForm(defaultProps));

    act(() => {
      result.current.handleStatusNameChange("Passed Test #1");
    });

    expect(result.current.formData.meterTestStatus).toBe("Passed Test 1");
  });

  it("should toggle active status", () => {
    const { result } = renderHook(() => useMeterTestStatusForm(defaultProps));

    act(() => {
      result.current.handleToggleStatus(false);
    });

    expect(result.current.formData.isActive).toBe(false);
  });

  it("should validate required fields on submit", async () => {
    const { result } = renderHook(() => useMeterTestStatusForm(defaultProps));

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(result.current.errors.code).toBe("validation.codeRequired");
    expect(createMeterTestStatusAction).not.toHaveBeenCalled();
  });

  it("should call create action and succeed when form is valid", async () => {
    vi.mocked(createMeterTestStatusAction).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useMeterTestStatusForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("PASS");
      result.current.handleStatusNameChange("Pass");
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(createMeterTestStatusAction).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "PASS",
        meterTestStatusCode: "PASS",
        meterTestStatus: "Pass",
        isActive: true,
      })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("should call update action in edit mode", async () => {
    vi.mocked(updateMeterTestStatusAction).mockResolvedValue({ success: true });
    const initialData = {
      id: 10,
      code: "PENDING",
      meterTestStatusCode: "PENDING",
      meterTestStatus: "Pending",
      isActive: true,
    };

    const { result } = renderHook(() =>
      useMeterTestStatusForm({ ...defaultProps, id: 10, initialData })
    );

    await act(async () => {
      const e = { preventDefault: vi.fn() } as unknown as React.FormEvent;
      await result.current.handleSubmit(e);
    });

    expect(updateMeterTestStatusAction).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it("should show a toast error and keep the form open on API failure", async () => {
    vi.mocked(createMeterTestStatusAction).mockResolvedValue({
      success: false,
      statusCode: 409,
      message: "Record already exists.",
    });
    const { result } = renderHook(() => useMeterTestStatusForm(defaultProps));

    act(() => {
      result.current.handleCodeChange("PENDING");
      result.current.handleStatusNameChange("Pending");
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
