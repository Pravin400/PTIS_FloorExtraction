import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useOfficeForm } from "@/hooks/useOfficeForm";
import * as actions from "@/app/[locale]/configuration-settings/office-master/action";
import { officeValidations } from "@/lib/utils/validation";
import { toast } from "sonner";
import { Office } from "@/types/office.types";
import { ChangeEvent, FormEvent } from "react";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
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

vi.mock("@/app/[locale]/configuration-settings/office-master/action", () => ({
  createOfficeAction: vi.fn(),
  updateOfficeAction: vi.fn(),
}));

vi.mock("@/lib/utils/validation", () => ({
  officeValidations: {
    validate: vi.fn(() => ({})),
  },
}));

describe("useOfficeForm", () => {
  const mockProps = {
    officeId: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(officeValidations.validate).mockReturnValue({});
  });

  it("should initialize with default data when adding a new office", () => {
    const { result } = renderHook(() => useOfficeForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.officeName).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with provided data when editing", () => {
    const initialData = {
      officeId: 1,
      officeCode: "OFF01",
      officeName: "Head Office",
      type: "Main",
      isActive: true,
    } as Office;

    const { result } = renderHook(() =>
      useOfficeForm({ ...mockProps, officeId: 1, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.officeCode).toBe("OFF01");
    expect(result.current.formData.officeName).toBe("Head Office");
  });

  it("should update form data when handleChange is called", () => {
    const { result } = renderHook(() => useOfficeForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "officeName", value: "New Office Name" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.officeName).toBe("New Office Name");
  });

  it("should enforce input restrictions and lengths in handleChange", () => {
    const { result } = renderHook(() => useOfficeForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "officeCode", value: "123abc456def" },
      } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.officeCode).toBe("123456");

    act(() => {
      result.current.handleChange({
        target: { name: "officeName", value: "Test  Office!! @@Name" },
      } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.formData.officeName).toBe("Test Office Name");
  });

  it("should toggle status", () => {
    const { result } = renderHook(() => useOfficeForm(mockProps));

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.formData.isActive).toBe(false);

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.formData.isActive).toBe(true);
  });

  it("should call createOfficeAction on submit when adding", async () => {
    const mockResult = { success: true, message: "" };
    vi.mocked(actions.createOfficeAction).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useOfficeForm(mockProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(actions.createOfficeAction).toHaveBeenCalledWith({
      ...result.current.formData,
      establishedDate: null,
    });
    expect(toast.success).toHaveBeenCalled();
    expect(mockProps.onSuccess).toHaveBeenCalled();
  });

  it("should call updateOfficeAction on submit when editing", async () => {
    const mockResult = { success: true, message: "" };
    vi.mocked(actions.updateOfficeAction).mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useOfficeForm({ ...mockProps, officeId: 1 })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(actions.updateOfficeAction).toHaveBeenCalledWith({
      ...result.current.formData,
      establishedDate: null,
    });
    expect(toast.success).toHaveBeenCalled();
  });

  it("should handle validation errors on submission", async () => {
    const validationErrors = { officeName: "Required" };
    vi.mocked(officeValidations.validate).mockReturnValue(validationErrors);

    const { result } = renderHook(() => useOfficeForm(mockProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(result.current.errors.officeName).toBe("Required");
    expect(actions.createOfficeAction).not.toHaveBeenCalled();
  });

  it("should handle server errors", async () => {
    const mockResult = { success: false, message: "Duplicate code" };
    vi.mocked(actions.createOfficeAction).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useOfficeForm(mockProps));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as FormEvent);
    });

    expect(actions.createOfficeAction).toHaveBeenCalled();
    expect(vi.mocked(toast.error)).toHaveBeenCalled();
    expect(vi.mocked(toast.error)).toHaveBeenCalledWith("Duplicate code");
  });
});
