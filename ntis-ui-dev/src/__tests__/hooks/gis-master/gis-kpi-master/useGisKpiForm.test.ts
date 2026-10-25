import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useGisKpiForm } from "@/hooks/gis-master/gis-kpi-master/useGisKpiForm";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

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

vi.mock("@/app/[locale]/configuration-settings/gis-master/gis-kpi-master/action", () => ({
  createGisKpiAction: vi.fn(),
  updateGisKpiAction: vi.fn(),
}));

describe("useGisKpiForm", () => {
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
    const { result } = renderHook(() => useGisKpiForm(defaultProps));

    expect(result.current.formData.kpiCode).toBe("");
    expect(result.current.formData.defaultTitle).toBe("");
    expect(result.current.formData.defaultIcon).toBe("building");
    expect(result.current.formData.defaultColor).toBe("#2563EB");
    expect(result.current.isActive).toBe(true);
    expect(result.current.isEdit).toBe(false);
  });

  it("should handle input changes", () => {
    const { result } = renderHook(() => useGisKpiForm(defaultProps));

    act(() => {
      result.current.handleChange({
        target: { name: "kpiCode", value: "TOTAL_ASSETS" },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.formData.kpiCode).toBe("TOTAL_ASSETS");
  });

  it("should toggle active status", () => {
    const { result } = renderHook(() => useGisKpiForm(defaultProps));

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.isActive).toBe(false);
    expect(result.current.formData.isActive).toBe(false);
  });
});
