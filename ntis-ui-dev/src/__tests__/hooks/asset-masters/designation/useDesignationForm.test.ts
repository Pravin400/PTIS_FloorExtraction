import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useDesignationForm } from "@/hooks/asset-masters/designation/useDesignationForm";
import type { Designation } from "@/types/asset-masters/designation.types";
import { ChangeEvent } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/en/assets/configuration/master-data/designation-master",
  useSearchParams: () => new URLSearchParams(),
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

vi.mock("@/app/[locale]/assets/configuration/master-data/designation-master/action", () => ({
  createDesignationAction: vi.fn(),
  updateDesignationAction: vi.fn(),
}));

describe("useDesignationForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default data when adding a new designation", () => {
    const { result } = renderHook(() => useDesignationForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.designationCode).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with provided data when editing", () => {
    const initialData = {
      id: 5,
      designationCode: "CODE5",
      designationName: "Name 5",
      designationLocal: "L5",
      designationDescription: "Desc 5",
      owningDepartmentId: 1,
      isActive: true,
    } as Designation;

    const { result } = renderHook(() =>
      useDesignationForm({ ...mockProps, id: 5, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.designationCode).toBe("CODE5");
  });

  it("should update form data when handleChange is called", () => {
    const { result } = renderHook(() => useDesignationForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "designationName", value: "New Designation Name" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.designationName).toBe("New Designation Name");
  });

  it("should sanitize and update form data on handleBlur", () => {
    const { result } = renderHook(() => useDesignationForm(mockProps));

    act(() => {
      result.current.handleBlur({
        target: { name: "designationCode", value: "DESIG_#123" },
      } as unknown as React.FocusEvent<HTMLInputElement>);
    });

    expect(result.current.formData.designationCode).toBe("DESIG_123");
  });

  it("should update status on handleToggleStatus", () => {
    const { result } = renderHook(() => useDesignationForm(mockProps));

    act(() => {
      result.current.handleToggleStatus(false);
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.formData.isActive).toBe(false);
  });

  it("shows the deactivate reference error under the status toggle and clears it on toggle", async () => {
    const { updateDesignationAction } = await import("@/app/[locale]/assets/configuration/master-data/designation-master/action");
    const { toast } = await import("sonner");
    vi.mocked(updateDesignationAction).mockResolvedValue({
      success: false,
      statusCode: 400,
      message: "This Designation cannot be deactivated because it is in use.",
    });
    const initialData = {
      id: 5,
      designationCode: "CODE5",
      designationName: "Name Five",
      designationLocal: "Local",
      designationDescription: "Desc",
      owningDepartmentId: 1,
      isActive: true,
    } as Designation;
    const { result } = renderHook(() => useDesignationForm({ ...mockProps, id: 5, initialData }));

    act(() => result.current.handleToggleStatus(false));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never);
    });

    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.designation.deactivateInUse");
    expect(result.current.errors.isActive).toBe("apiErrors.referenceBlocked.designation.deactivateInUse");

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBe("");
  });
});
