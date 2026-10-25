import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSubZoneForm } from "@/hooks/asset-masters/mouja-subzone/useSubZoneForm";
import type { SubZoneDetails } from "@/types/asset-masters/mouja-subzone.types";

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
  createSubZoneAction: vi.fn(),
  updateSubZoneAction: vi.fn(),
}));

describe("useSubZoneForm", () => {
  const mockProps = {
    id: null,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default data when adding a new SubZone", () => {
    const { result } = renderHook(() => useSubZoneForm(mockProps));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData.subZoneNo).toBe("");
    expect(result.current.formData.subZoneName).toBe("");
    expect(result.current.formData.isActive).toBe(true);
  });

  it("should initialize with provided data when editing", () => {
    const initialData = {
      id: 774,
      moujaId: 1025,
      subZoneNo: "S1",
      subZoneName: "SubZone 1",
      isActive: true,
    } as SubZoneDetails;

    const { result } = renderHook(() =>
      useSubZoneForm({ ...mockProps, id: 774, initialData })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.subZoneNo).toBe("S1");
    expect(result.current.formData.subZoneName).toBe("SubZone 1");
  });

  it("shows the deactivate reference error under the status toggle and clears it on toggle", async () => {
    const { updateSubZoneAction } = await import("@/app/[locale]/assets/configuration/master-data/mouja-subzone/action");
    const { toast } = await import("sonner");
    vi.mocked(updateSubZoneAction).mockResolvedValue({
      success: false,
      statusCode: 400,
      message: "This Sub Zone cannot be deactivated because it has CV Rates. Please delete all CV Rates for this Sub Zone first.",
    });
    const initialData = { id: 774, moujaId: 1025, subZoneNo: "SZ-01", subZoneName: "SubZone A", isActive: true } as SubZoneDetails;
    const { result } = renderHook(() => useSubZoneForm({ ...mockProps, id: 774, initialData }));

    act(() => result.current.handleToggleStatus(false));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as never);
    });

    expect(toast.error).toHaveBeenCalledWith("apiErrors.subZoneDeactivateBlocked");
    expect(result.current.errors.isActive).toBe("apiErrors.subZoneDeactivateBlocked");

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBe("");
  });
});
