import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGroupForm } from "@/hooks/asset-masters/type-of-use/useGroupForm";
import type { TypeOfUseGroup } from "@/types/asset-masters/type-of-use.types";
import { updateTypeOfUseGroupAction } from "@/app/[locale]/assets/configuration/master-data/type-of-use/action";
import { toast } from "sonner";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, string | number | Date>) =>
    values?.default ? String(values.default) : key,
  useLocale: () => "en",
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/app/[locale]/assets/configuration/master-data/type-of-use/action", () => ({
  createTypeOfUseGroupAction: vi.fn(),
  updateTypeOfUseGroupAction: vi.fn(),
}));

const initialData = {
  id: 3,
  typeOfUseGroupCode: "RES",
  groupName: "Residential",
  groupIcon: "home",
  isActive: true,
} as TypeOfUseGroup;

describe("useGroupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the deactivate reference error on the status field and clears it on toggle", async () => {
    vi.mocked(updateTypeOfUseGroupAction).mockResolvedValueOnce({
      success: false,
      statusCode: 400,
      message:
        "This Type Of Use Group cannot be deactivated because it has Type Of Uses and CV Rates. Please delete all Type Of Uses and CV Rates for this Type Of Use Group first.",
    });

    const { result } = renderHook(() => useGroupForm({ id: 3, initialData }));

    act(() => result.current.handleToggleStatus(false));
    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.isActive).toBe("apiErrors.referenceBlocked.typeOfUseGroup.deactivateHasMasters");
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.typeOfUseGroup.deactivateHasMasters");

    act(() => result.current.handleToggleStatus(true));
    expect(result.current.errors.isActive).toBe("");
  });

  it("does not set the status error for a delete reference message", async () => {
    vi.mocked(updateTypeOfUseGroupAction).mockResolvedValueOnce({
      success: false,
      statusCode: 400,
      message: "This Type Of Use Group cannot be deleted because it is in use.",
    });

    const { result } = renderHook(() => useGroupForm({ id: 3, initialData }));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(result.current.errors.isActive).toBeUndefined();
    expect(toast.error).toHaveBeenCalledWith("apiErrors.referenceBlocked.typeOfUseGroup.deleteInUse");
  });
});
