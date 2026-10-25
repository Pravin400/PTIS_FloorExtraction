import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePropertySearchResults } from "@/hooks/search-property/usePropertySearchResults";
import type { SearchResult } from "@/types/property-search";

function makeResult(id: string, propertyId = 1): SearchResult {
  return {
    id,
    propertyId,
    upicId: "",
    zone: "",
    ward: "",
    propertyNo: "",
    partitionNo: "",
    oldPropertyNo: "",
    citySurveyNo: "",
    plotNo: "",
    wingFlatNo: "",
    propertyCount: 0,
    category: "",
    description: "",
    mobile: "",
    alternateMobile: "",
    holderName: "",
    holderNameMarathi: "",
    occupierName: "",
    occupierNameMarathi: "",
    shopBuildingName: "",
    societyName: "",
    address: "",
    rv: 0,
    cv: null,
    totalTax: 0,
    status: "Register Property",
  };
}

describe("usePropertySearchResults", () => {
  it("resets page number when the result set identity changes", () => {
    const firstPage = Array.from({ length: 15 }, (_, index) =>
      makeResult(`a-${index + 1}`)
    );
    const secondPage = Array.from({ length: 15 }, (_, index) =>
      makeResult(`b-${index + 1}`)
    );

    const { result, rerender } = renderHook(
      ({ results }) => usePropertySearchResults({ results }),
      { initialProps: { results: firstPage } }
    );

    act(() => {
      result.current.handlePageChange(2);
    });
    expect(result.current.pageNumber).toBe(2);

    rerender({ results: secondPage });
    expect(result.current.pageNumber).toBe(1);
  });

  it("keeps page number when the same result set is re-rendered", () => {
    const results = Array.from({ length: 15 }, (_, index) =>
      makeResult(`a-${index + 1}`)
    );

    const { result, rerender } = renderHook(
      ({ results: currentResults }) =>
        usePropertySearchResults({ results: currentResults }),
      { initialProps: { results } }
    );

    act(() => {
      result.current.handlePageChange(2);
    });
    expect(result.current.pageNumber).toBe(2);

    rerender({ results: [...results] });
    expect(result.current.pageNumber).toBe(2);
  });

  it("uses server-side pagination when totalCount is provided", () => {
    const results = Array.from({ length: 5 }, (_, index) =>
      makeResult(`a-${index + 1}`)
    );
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    const { result } = renderHook(() =>
      usePropertySearchResults({
        results,
        totalCount: 100,
        pageNumber: 3,
        pageSize: 5,
        onPageChange,
        onPageSizeChange,
      })
    );

    expect(result.current.totalCount).toBe(100);
    expect(result.current.pageNumber).toBe(3);
    expect(result.current.pageSize).toBe(5);
    expect(result.current.totalPages).toBe(20);
    expect(result.current.paginatedData).toEqual(results);

    result.current.handlePageChange(4);
    expect(onPageChange).toHaveBeenCalledWith(4);

    result.current.handlePageSizeChange(20);
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
