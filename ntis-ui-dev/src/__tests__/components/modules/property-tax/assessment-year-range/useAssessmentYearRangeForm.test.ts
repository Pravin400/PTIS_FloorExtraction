import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock dependencies before importing the hook
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

import { useAssessmentYearRangeForm } from "@/hooks/useAssessmentYearRangeForm";
import type { AssessmentYearRangeConfig, AssessmentYearRangeRV } from "@/types/assessment-year-range.types";

describe("useAssessmentYearRangeForm", () => {
  const mockConfig: AssessmentYearRangeConfig = {
    type: "RV",
    endpoint: "AssessmentYearRange",
    idField: "id",
    routePath: "/property-tax/assessment-year-range/rateablevalue",
    translationNamespace: "assessmentYearRange.rateableValue",
  };

  const mockCreateAction = vi.fn().mockResolvedValue({ success: true });
  const mockUpdateAction = vi.fn().mockResolvedValue({ success: true });

  const mockInitialData: AssessmentYearRangeRV = {
    id: 1,
    fromYear: 2020,
    toYear: 2025,
    isActive: true,
    createdDate: "2026-01-01",
    updatedDate: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default values for new record", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    expect(result.current.isEdit).toBe(false);
    expect(result.current.isActive).toBe(true);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it("initializes with existing data for edit mode", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: 1,
        initialData: mockInitialData,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    expect(result.current.isEdit).toBe(true);
    expect(result.current.fromYearValue).toBe("2020");
    expect(result.current.toYearValue).toBe("2025");
    expect(result.current.isActive).toBe(true);
  });

  it("handles year change correctly", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    act(() => {
      result.current.handleYearChange("fromYear", "2021");
    });

    expect(result.current.fromYearValue).toBe("2021");

    act(() => {
      result.current.handleYearChange("toYear", "2026");
    });

    expect(result.current.toYearValue).toBe("2026");
  });

  it("sanitizes year input to only allow digits", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    act(() => {
      result.current.handleYearChange("fromYear", "20ab21");
    });

    expect(result.current.fromYearValue).toBe("2021");
  });

  it("limits year input to 4 characters", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    act(() => {
      result.current.handleYearChange("fromYear", "202123");
    });

    expect(result.current.fromYearValue).toBe("2021");
  });

  it("toggles status correctly", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: 1,
        initialData: mockInitialData,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    expect(result.current.isActive).toBe(true);

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.isActive).toBe(false);

    act(() => {
      result.current.handleToggleStatus();
    });

    expect(result.current.isActive).toBe(true);
  });

  it("showError returns falsy value when field has no errors", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    // Initially should not show errors (can be false or undefined)
    expect(result.current.showError("fromYear")).toBeFalsy();
  });

  it("does not surface the strict less-than validation error for equal years", async () => {
    const createAction = vi.fn().mockResolvedValue({
      success: false,
      statusCode: 400,
      message: JSON.stringify({
        errors: {
          fromYear: ["FromYear_MustBeLessThanToYear"],
        },
      }),
    });

    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction,
        updateAction: mockUpdateAction,
      })
    );

    act(() => {
      result.current.handleYearChange("fromYear", "2024");
      result.current.handleYearChange("toYear", "2024");
    });

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: vi.fn() } as unknown as React.FormEvent<HTMLFormElement>);
    });

    expect(result.current.errors.fromYear).toBeUndefined();
  });

  it("provides translation functions", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    expect(typeof result.current.t).toBe("function");
    expect(typeof result.current.tCommon).toBe("function");
  });

  it("opens drawer by default", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangeForm({
        config: mockConfig,
        id: null,
        initialData: undefined,
        createAction: mockCreateAction,
        updateAction: mockUpdateAction,
      })
    );

    expect(result.current.open).toBe(true);
  });
});
