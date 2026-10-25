import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useWardData } from "@/hooks/rateSectionMaster/useWardData";
import { SectionItem } from "@/types/rateSectionMaster.types";

describe("useWardData", () => {
  const mockSections: SectionItem[] = [
    {
      rateSectionDetailsId: 1,
      wardNo: "W1",
      rateSectionId: 1,
      rateSectionNo: "RS1",
      description: "Ward One",
    },
    {
      rateSectionDetailsId: 2,
      wardNo: "W2",
      rateSectionId: 1,
      rateSectionNo: "RS1",
      description: "Ward Two",
    },
    {
      rateSectionDetailsId: 3,
      wardNo: "W3",
      rateSectionId: 1,
      rateSectionNo: "RS1",
      description: "Ward Three",
    },
    {
      rateSectionDetailsId: 4,
      wardNo: "W4",
      rateSectionId: 1,
      rateSectionNo: "RS1",
      description: "Ward Four",
    },
    {
      rateSectionDetailsId: 5,
      wardNo: "W5",
      rateSectionId: 1,
      rateSectionNo: "RS1",
      description: "Ward Five",
    },
  ];

  const defaultParams = {
    sections: mockSections,
    sectionsTotalCount: 5,
    search: "",
    pageNumber: 1,
    pageSize: 10,
  };

  describe("initialization", () => {
    it("should initialize with all sections", () => {
      const { result } = renderHook(() => useWardData(defaultParams));

      expect(result.current.paginatedWards).toEqual(mockSections);
      expect(result.current.totalCount).toBe(5);
      expect(result.current.totalPages).toBe(1);
      expect(result.current.effectivePageNumber).toBe(1);
      expect(result.current.deletedIds.size).toBe(0);
    });

    it("should calculate total pages correctly", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          sectionsTotalCount: 25,
          pageSize: 10,
        })
      );

      expect(result.current.totalPages).toBe(3); // 25 / 10 = 3
    });

    it("should default to 10 for effective page size", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          pageSize: 0,
        })
      );

      expect(result.current.effectivePageSize).toBe(10);
    });
  });

  describe("filtering", () => {
    it("should filter wards by search term", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          search: "W1",
        })
      );

      expect(result.current.paginatedWards).toHaveLength(1);
      expect(result.current.paginatedWards[0].wardNo).toBe("W1");
    });

    it("should be case insensitive", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          search: "w2",
        })
      );

      expect(result.current.paginatedWards).toHaveLength(1);
      expect(result.current.paginatedWards[0].wardNo).toBe("W2");
    });

    it("should filter by partial match", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          search: "W",
        })
      );

      expect(result.current.paginatedWards).toHaveLength(5);
    });

    it("should update total count when filtering", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          search: "W1",
        })
      );

      expect(result.current.totalCount).toBe(1);
    });

    it("should return empty array for non-matching search", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          search: "XYZ",
        })
      );

      expect(result.current.paginatedWards).toHaveLength(0);
      expect(result.current.totalCount).toBe(0);
    });
  });

  describe("pagination", () => {
    it("should paginate wards correctly", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          pageSize: 2,
          pageNumber: 1,
          search: "W", // Filter to get all W* wards
        })
      );

      expect(result.current.paginatedWards).toHaveLength(2);
      expect(result.current.paginatedWards[0].wardNo).toBe("W1");
      expect(result.current.paginatedWards[1].wardNo).toBe("W2");
    });

    it("should show second page correctly", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          pageSize: 2,
          pageNumber: 2,
          search: "W",
        })
      );

      expect(result.current.paginatedWards).toHaveLength(2);
      expect(result.current.paginatedWards[0].wardNo).toBe("W3");
      expect(result.current.paginatedWards[1].wardNo).toBe("W4");
    });

    it("should handle last page with fewer items", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          pageSize: 2,
          pageNumber: 3,
          search: "W",
        })
      );

      expect(result.current.paginatedWards).toHaveLength(1);
      expect(result.current.paginatedWards[0].wardNo).toBe("W5");
    });

    it("should clamp page number to valid range", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          pageSize: 10,
          pageNumber: 999,
        })
      );

      expect(result.current.effectivePageNumber).toBe(1);
    });

    it("should default to page 1 when total pages is 0", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          sections: [],
          sectionsTotalCount: 0,
        })
      );

      expect(result.current.effectivePageNumber).toBe(1);
      expect(result.current.totalPages).toBe(0);
    });
  });

  describe("server-side pagination behavior", () => {
    it("should not paginate client-side when server provides data", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          sections: mockSections,
          sectionsTotalCount: 100, // Server says there are 100 total
          pageNumber: 1,
          pageSize: 10,
          search: "",
        })
      );

      // Should show all sections provided by server
      expect(result.current.paginatedWards).toEqual(mockSections);
      expect(result.current.totalCount).toBe(100); // Should use server count
    });

    it("should paginate client-side when searching", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          sections: mockSections,
          sectionsTotalCount: 100,
          pageNumber: 1,
          pageSize: 2,
          search: "W",
        })
      );

      // Should paginate filtered results
      expect(result.current.paginatedWards).toHaveLength(2);
      expect(result.current.totalCount).toBe(5); // Filtered count
    });
  });

  describe("deleted wards handling", () => {
    it("should exclude deleted wards", () => {
      const { result } = renderHook(() => useWardData(defaultParams));

      act(() => {
        result.current.setDeletedIds(new Set([1, 3]));
      });

      expect(result.current.paginatedWards).toHaveLength(3);
      expect(result.current.paginatedWards.find(w => w.rateSectionDetailsId === 1)).toBeUndefined();
      expect(result.current.paginatedWards.find(w => w.rateSectionDetailsId === 3)).toBeUndefined();
    });

    it("should handle wards without IDs", () => {
      const sectionsWithoutIds: SectionItem[] = [
        {
          wardNo: "W1",
          rateSectionId: 1,
          rateSectionNo: "RS1",
        },
        {
          rateSectionDetailsId: 2,
          wardNo: "W2",
          rateSectionId: 1,
          rateSectionNo: "RS1",
        },
      ];

      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          sections: sectionsWithoutIds,
          sectionsTotalCount: 2,
        })
      );

      act(() => {
        result.current.setDeletedIds(new Set([2]));
      });

      // Ward without ID should still be shown
      expect(result.current.paginatedWards).toHaveLength(1);
      expect(result.current.paginatedWards[0].wardNo).toBe("W1");
    });

    it("should update deleted IDs set", () => {
      const { result } = renderHook(() => useWardData(defaultParams));

      expect(result.current.deletedIds.size).toBe(0);

      act(() => {
        result.current.setDeletedIds(new Set([1, 2, 3]));
      });

      expect(result.current.deletedIds.size).toBe(3);
      expect(result.current.deletedIds.has(1)).toBe(true);
      expect(result.current.deletedIds.has(2)).toBe(true);
      expect(result.current.deletedIds.has(3)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle empty sections array", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          sections: [],
          sectionsTotalCount: 0,
        })
      );

      expect(result.current.paginatedWards).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.totalPages).toBe(0);
    });

    it("should handle null/undefined sections", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          sections: null as unknown as SectionItem[],
          sectionsTotalCount: 0,
        })
      );

      expect(result.current.paginatedWards).toEqual([]);
    });

    it("should handle very large page numbers", () => {
      const { result } = renderHook(() =>
        useWardData({
          ...defaultParams,
          pageNumber: 9999,
          pageSize: 2,
          search: "W",
        })
      );

      // Should clamp to valid range
      expect(result.current.effectivePageNumber).toBeLessThanOrEqual(result.current.totalPages);
    });
  });
});
