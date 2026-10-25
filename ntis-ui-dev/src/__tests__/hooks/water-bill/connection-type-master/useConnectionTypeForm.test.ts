import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useConnectionTypeForm } from "@/hooks/water-bill/connection-type-master/useConnectionTypeForm";
import * as actions from "@/app/[locale]/water-bill/connection-type-master/actions";
import type { ConnectionType } from "@/types/waterBill/connectionTypeMaster.types";
import { toast } from "sonner";

const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
  usePathname: () => "/en/water-bill/connection-type-master/connection-type",
}));

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/app/[locale]/water-bill/connection-type-master/actions", () => ({
  createConnectionTypeAction: vi.fn(),
  updateConnectionTypeAction: vi.fn(),
  getConnectionTypePagedAction: vi.fn().mockResolvedValue({ items: [] }),
}));

const mockInitialData: ConnectionType = {
  id: 1,
  connectionTypeCode: "RES",
  connectionType: "Residential",
  description: "Residential connection",
  isActive: true,
};

describe("useConnectionTypeForm Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes create form with default values", () => {
    const { result } = renderHook(() => useConnectionTypeForm(null));

    expect(result.current.isEdit).toBe(false);
    expect(result.current.formData).toEqual({
      connectionTypeCode: "",
      connectionType: "",
      description: "",
      isActive: true,
    });
  });

  it("initializes edit form with initial values", () => {
    const { result } = renderHook(() => useConnectionTypeForm(1, mockInitialData));

    expect(result.current.isEdit).toBe(true);
    expect(result.current.formData.connectionTypeCode).toBe("RES");
    expect(result.current.formData.connectionType).toBe("Residential");
    expect(result.current.formData.description).toBe("Residential connection");
  });

  it("validates required fields when values are empty", () => {
    const { result } = renderHook(() => useConnectionTypeForm(null));

    expect(result.current.errors.connectionTypeCode).toBeDefined();
    expect(result.current.errors.connectionType).toBeDefined();
  });

  it("sanitizes input on change", () => {
    const { result } = renderHook(() => useConnectionTypeForm(null));

    act(() => {
      // Includes disallowed special characters for alphanumeric with spaces validation
      result.current.handleChange("connectionType", "Resid@ential#");
    });

    // Special characters should be stripped out
    expect(result.current.formData.connectionType).toBe("Residential");
  });

  it("submits create form and redirects on success", async () => {
    vi.mocked(actions.createConnectionTypeAction).mockResolvedValueOnce({
      success: true,
      data: mockInitialData,
    });

    const { result } = renderHook(() => useConnectionTypeForm(null));

    act(() => {
      result.current.handleChange("connectionTypeCode", "RES");
      result.current.handleChange("connectionType", "Residential");
      result.current.handleChange("description", "Residential connection");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(actions.createConnectionTypeAction).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionTypeCode: "RES",
        connectionType: "Residential",
        description: "Residential connection",
        isActive: true,
      })
    );
    expect(toast.success).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-type-master/connection-type");
  });

  it("submits update form and redirects on success", async () => {
    vi.mocked(actions.updateConnectionTypeAction).mockResolvedValueOnce({
      success: true,
      data: mockInitialData,
    });

    const { result } = renderHook(() => useConnectionTypeForm(1, mockInitialData));

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent);
    });

    expect(actions.updateConnectionTypeAction).toHaveBeenCalledWith(1, expect.objectContaining({ connectionTypeCode: "RES" }));
    expect(toast.success).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith("/en/water-bill/connection-type-master/connection-type");
  });
});
