import { describe, it, expect } from "vitest";
import {
  isPagedResponse,
  isCommonRemarkShape,
  isRemarkCategoryShape,
  normalizeCommonRemark,
  normalizeRemarkCategory,
} from "@/lib/api/common-remark-master/common-remark-types-guard";
import { ApiError } from "@/lib/utils/api";

describe("common-remark-types-guard", () => {
  describe("isPagedResponse", () => {
    it("should validate a correct PagedResponse object structure", () => {
      const valid = {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };
      expect(isPagedResponse(valid)).toBe(true);
    });

    it("should invalidate null or incorrect structures", () => {
      expect(isPagedResponse(null)).toBe(false);
      expect(isPagedResponse({})).toBe(false);
    });
  });

  describe("isCommonRemarkShape", () => {
    it("should validate valid structures with all required fields", () => {
      expect(
        isCommonRemarkShape({
          id: 101,
          remarkTypeId: 2,
          remark: "Test Remark",
          createdDate: "2026-06-09",
        })
      ).toBe(true);
      expect(
        isCommonRemarkShape({
          id: "101",
          remarkTypeId: "2",
          remark: "Test Remark",
          createdDate: "2026-06-09",
        })
      ).toBe(true);
    });

    it("should invalidate objects missing required fields or having invalid values", () => {
      expect(isCommonRemarkShape({})).toBe(false);
      expect(isCommonRemarkShape({ id: "abc", remarkTypeId: 2, remark: "Test", createdDate: "2026" })).toBe(false);
      expect(isCommonRemarkShape({ id: 101, remarkTypeId: "abc", remark: "Test", createdDate: "2026" })).toBe(false);
      expect(isCommonRemarkShape({ id: 101, remarkTypeId: 2, remark: "", createdDate: "2026" })).toBe(false);
      expect(isCommonRemarkShape({ id: 101, remarkTypeId: 2, remark: "Test", createdDate: "  " })).toBe(false);
      expect(isCommonRemarkShape({ id: 101 })).toBe(false);
    });
  });

  describe("isRemarkCategoryShape", () => {
    it("should validate structures with correct ID and remarkTypeName", () => {
      expect(isRemarkCategoryShape({ id: 1, remarkTypeName: "Category Name" })).toBe(true);
      expect(isRemarkCategoryShape({ id: "1", remarkTypeName: "Category Name" })).toBe(true);
    });

    it("should invalidate objects missing required fields or having invalid values", () => {
      expect(isRemarkCategoryShape({})).toBe(false);
      expect(isRemarkCategoryShape({ id: "abc", remarkTypeName: "Category Name" })).toBe(false);
      expect(isRemarkCategoryShape({ id: 1, remarkTypeName: "" })).toBe(false);
      expect(isRemarkCategoryShape({ id: 1 })).toBe(false);
    });
  });

  describe("normalizeCommonRemark", () => {
    const mockCategories = [
      { id: 1, categoryCode: "CAT1", categoryName: "Category 1" },
    ];

    it("should normalize and resolve dynamic category names successfully", () => {
      const input = {
        id: "10",
        remarkTypeId: "1",
        remark: "   Test Content   ",
        isActive: "true",
        createdDate: "2026-06-09",
        updatedDate: null,
      };

      const result = normalizeCommonRemark(input, mockCategories);

      expect(result.id).toBe(10);
      expect(result.remarkTypeId).toBe(1);
      expect(result.remarkType).toBe("Category 1");
      expect(result.remark).toBe("Test Content");
      expect(result.isActive).toBe(true);
    });

    it("should throw ApiError if required fields are missing", () => {
      const input = {
        id: "10",
        remarkTypeId: "1",
        // missing remark and createdDate
      };

      expect(() => normalizeCommonRemark(input, mockCategories)).toThrow(ApiError);
    });
  });

  describe("normalizeRemarkCategory", () => {
    it("should normalize raw category inputs successfully", () => {
      const input = {
        id: "2",
        remarkTypeName: "   New Category   ",
      };

      const result = normalizeRemarkCategory(input);

      expect(result.id).toBe(2);
      expect(result.categoryName).toBe("New Category");
      expect(result.categoryCode).toBe("New Category");
    });

    it("should throw ApiError if category properties are invalid or missing", () => {
      const input = {
        id: "abc",
        remarkTypeName: "",
      };

      expect(() => normalizeRemarkCategory(input)).toThrow(ApiError);
    });
  });
});
