import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMoujaForm } from "@/hooks/asset-masters/mouja-subzone/useMoujaForm";
import type { Mouja } from "@/types/asset-masters/mouja-subzone.types";
import { ChangeEvent } from "react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
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

vi.mock("@/app/[locale]/assets/configuration/master-data/mouja-subzone/action", () => ({
  createMoujaAction: vi.fn(),
  updateMoujaAction: vi.fn(),
}));

describe("useMoujaForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default data when adding a new Mouja", () => {
    const { result } = renderHook(() => useMoujaForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.moujaNo).toBe("");
    expect(result.current.formData.moujaName).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with provided data when editing", () => {
    const initialData = {
      id: 1025,
      moujaNo: "M1",
      moujaName: "Mouja 1",
      isActive: true,
    } as Mouja;

    const { result } = renderHook(() =>
      useMoujaForm({ ...mockProps, id: 1025, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.moujaNo).toBe("M1");
    expect(result.current.formData.moujaName).toBe("Mouja 1");
  });

  it("should update form data when handleChange is called", () => {
    const { result } = renderHook(() => useMoujaForm(mockProps));

    act(() => {
      result.current.handleChange({
        target: { name: "moujaName", value: "New Mouja Name" },
      } as ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.moujaName).toBe("New Mouja Name");
  });

  it("shows the deactivate reference error under the status toggle and clears it on toggle", async () => {
    const { updateMoujaAction } = await import("@/app/[locale]/assets/configuration/master-data/mouja-subzone/action");
    const { toast } = await import("sonner");
    vi.mocked(updateMoujaAction).mockResolvedValue({
      success: false,
      statusCode: 400,
      message: "This Mouja cannot be deactivated because it has Sub Zones. Please delete all Sub Zones for this Mouja first.",
    });
    const initialData = { id: 1025, moujaNo: "MJ-001", moujaName: "Akola", isActive: true } as Mouja;
    const { result } = renderHook(() => useMoujaForm({ ...mockProps, id: 1025, initialData }));

    act(() => result.current.handleToggleStatus(false));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never);
    });

    expect(toast.error).toHaveBeenCalledWith("apiErrors.moujaDeactivateBlocked");
    expect(result.current.errors.isActive).toBe("apiErrors.moujaDeactivateBlocked");

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBe("");
  });
});
