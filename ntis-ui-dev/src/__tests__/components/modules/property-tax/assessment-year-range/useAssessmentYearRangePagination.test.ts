import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

import { useAssessmentYearRangePagination } from "@/hooks/useAssessmentYearRangePagination";
import type { AssessmentYearRangeConfig } from "@/types/assessment-year-range.types";

describe("useAssessmentYearRangePagination", () => {
  const mockConfig: AssessmentYearRangeConfig = {
    type: "RV",
    endpoint: "AssessmentYearRange",
    idField: "id",
    routePath: "/property-tax/assessment-year-range/rateablevalue",
    translationNamespace: "assessmentYearRange.rateableValue",
  };

  const mockStartTransition = vi.fn((callback) => callback());

  const defaultProps = {
    config: mockConfig,
    pageNumber: 1,
    pageSize: 10,
    totalCount: 50,
    locale: "en",
    startTransition: mockStartTransition,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calculates pagination info correctly for first page", () => {
    const { result } = renderHook(() => useAssessmentYearRangePagination(defaultProps));

    expect(result.current.paginationInfo.start).toBe(1);
    expect(result.current.paginationInfo.end).toBe(10);
    expect(result.current.paginationInfo.total).toBe(50);
  });

  it("calculates pagination info correctly for middle page", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangePagination({
        ...defaultProps,
        pageNumber: 3,
      })
    );

    expect(result.current.paginationInfo.start).toBe(21);
    expect(result.current.paginationInfo.end).toBe(30);
    expect(result.current.paginationInfo.total).toBe(50);
  });

  it("calculates pagination info correctly for last partial page", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangePagination({
        ...defaultProps,
        pageNumber: 5,
        totalCount: 45,
      })
    );

    expect(result.current.paginationInfo.start).toBe(41);
    expect(result.current.paginationInfo.end).toBe(45);
    expect(result.current.paginationInfo.total).toBe(45);
  });

  it("handles zero total count", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangePagination({
        ...defaultProps,
        totalCount: 0,
      })
    );

    expect(result.current.paginationInfo.start).toBe(0);
    expect(result.current.paginationInfo.end).toBe(0);
    expect(result.current.paginationInfo.total).toBe(0);
  });

  it("builds URL correctly with basic parameters", () => {
    const { result } = renderHook(() => useAssessmentYearRangePagination(defaultProps));

    const url = result.current.buildUrl(1, 10);
    expect(url).toBe("/en/property-tax/assessment-year-range/rateablevalue?page=1&pageSize=10");
  });

  it("builds URL correctly with different page and size", () => {
    const { result } = renderHook(() => useAssessmentYearRangePagination(defaultProps));

    const url = result.current.buildUrl(2, 20);
    expect(url).toBe("/en/property-tax/assessment-year-range/rateablevalue?page=2&pageSize=20");
  });

  it("navigates to correct page when changePage is called", () => {
    const { result } = renderHook(() => useAssessmentYearRangePagination(defaultProps));

    act(() => {
      result.current.changePage(3);
    });

    expect(mockStartTransition).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      "/en/property-tax/assessment-year-range/rateablevalue?page=3&pageSize=10"
    );
  });

  it("handles page size change correctly", () => {
    const { result } = renderHook(() => useAssessmentYearRangePagination(defaultProps));

    act(() => {
      result.current.handlePageSizeChange("20");
    });

    expect(mockStartTransition).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(
      "/en/property-tax/assessment-year-range/rateablevalue?page=1&pageSize=20"
    );
  });

  it("resets to page 1 when changing page size", () => {
    const { result } = renderHook(() =>
      useAssessmentYearRangePagination({
        ...defaultProps,
        pageNumber: 5,
      })
    );

    act(() => {
      result.current.handlePageSizeChange("50");
    });

    // Should reset to page 1
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("page=1"));
  });

  it("works with CV configuration", () => {
    const cvConfig: AssessmentYearRangeConfig = {
      type: "CV",
      endpoint: "AssessmentYearRangeCV",
      idField: "id",
      routePath: "/property-tax/assessment-year-range/capitalvalue",
      translationNamespace: "assessmentYearRange.capitalValue",
    };

    const { result } = renderHook(() =>
      useAssessmentYearRangePagination({
        ...defaultProps,
        config: cvConfig,
      })
    );

    const url = result.current.buildUrl(1, 10);
    expect(url).toContain("/capitalvalue");
  });
});
