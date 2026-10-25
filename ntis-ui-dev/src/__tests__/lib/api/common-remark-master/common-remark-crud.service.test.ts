import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCommonRemarkCategories,
  getCommonRemarksPaged,
  getCommonRemarkById,
  createRemarkCategory,
  createCommonRemark,
  updateCommonRemark,
  deleteCommonRemark,
} from "@/lib/api/common-remark-master/common-remark-crud.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

// Mock the api service
vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("common-remark-crud.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCommonRemarkCategories", () => {
    it("should fetch and normalize categories successfully", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          items: [
            { id: 1, remarkTypeName: "Category 1" },
            { id: 2, remarkTypeName: "Category 2" },
          ],
        },
      });

      const result = await getCommonRemarkCategories();

      expect(apiClient.get).toHaveBeenCalledWith("/CommonRemarkType?PageSize=-1");
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 1, categoryCode: "Category 1", categoryName: "Category 1" });
    });

    it("should throw ApiError if category fetch fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Server Error",
      });

      await expect(getCommonRemarkCategories()).rejects.toThrow(ApiError);
    });
  });

  describe("getCommonRemarksPaged", () => {
    it("should fetch paginated and filtered remarks successfully", async () => {
      vi.mocked(apiClient.get)
        // first call is for getCommonRemarkCategories
        .mockResolvedValueOnce({
          success: true,
          data: {
            items: [{ id: 1, remarkTypeName: "Category 1" }],
          },
        })
        // second call is for getCommonRemarksPaged
        .mockResolvedValueOnce({
          success: true,
          data: {
            items: [
              {
                id: 10,
                remarkTypeId: 1,
                remark: "Remark 10",
                isActive: "true",
                createdDate: "2026-06-09",
                updatedDate: null,
              },
            ],
            totalCount: 1,
            totalPages: 1,
            pageNumber: 1,
            hasPrevious: false,
            hasNext: false,
          },
        });

      const result = await getCommonRemarksPaged(1, 10, "Search", "Category 1", "remark", "asc");

      expect(apiClient.get).toHaveBeenLastCalledWith(
        expect.stringContaining("/CommonRemarkDetails?PageNumber=1&PageSize=10&SearchTerm=Search&SortBy=remark&SortOrder=asc&RemarkTypeId=1")
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].remarkType).toBe("Category 1");
    });
  });

  describe("getCommonRemarkById", () => {
    it("should retrieve a single remark by ID and normalize", async () => {
      vi.mocked(apiClient.get)
        // first call for getCommonRemarkById
        .mockResolvedValueOnce({
          success: true,
          data: {
            id: 10,
            remarkTypeId: 1,
            remark: "Remark 10",
            isActive: true,
            createdDate: "2026-06-09",
            updatedDate: null,
          },
        })
        // second call inside normalize for getCommonRemarkCategories
        .mockResolvedValueOnce({
          success: true,
          data: {
            items: [{ id: 1, remarkTypeName: "Category 1" }],
          },
        });

      const result = await getCommonRemarkById(10);

      expect(apiClient.get).toHaveBeenCalledWith("/CommonRemarkDetails/10");
      expect(result).not.toBeNull();
      expect(result?.remarkType).toBe("Category 1");
    });

    it("should throw validation error if ID is invalid", async () => {
      await expect(getCommonRemarkById(0)).rejects.toThrow("Valid Common Remark ID is required");
    });
  });

  describe("createCommonRemark", () => {
    it("should call POST API to save remark with existing category ID", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 1, remarkTypeName: "Category 1" }],
        },
      });
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const payload = {
        remarkType: "1",
        remark: "Valid remark content",
        isActive: true,
        createdBy: 42,
      };

      await createCommonRemark(payload);

      expect(apiClient.post).toHaveBeenCalledWith("/CommonRemarkDetails", {
        remarkTypeId: 1,
        remark: "Valid remark content",
        isActive: true,
        createdBy: 42,
      });
    });

    it("should create category first if remarkType is 'Other' and does not exist", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 1, remarkTypeName: "Category 1" }],
        },
      });
      vi.mocked(apiClient.post)
        // first post creates category
        .mockResolvedValueOnce({
          success: true,
          data: { id: 99, remarkTypeName: "Brand New Category" },
        })
        // second post saves common remark
        .mockResolvedValueOnce({ success: true });

      const payload = {
        remarkType: "Other",
        customRemarkType: "Brand New Category",
        remark: "Valid remark content",
        isActive: true,
        createdBy: 42,
      };

      await createCommonRemark(payload);

      expect(apiClient.post).toHaveBeenCalledWith("/CommonRemarkType", {
        remarkTypeName: "Brand New Category",
        isActive: true,
        createdBy: 42,
      });
      expect(apiClient.post).toHaveBeenLastCalledWith("/CommonRemarkDetails", {
        remarkTypeId: 99,
        remark: "Valid remark content",
        isActive: true,
        createdBy: 42,
      });
    });
  });

  describe("createRemarkCategory", () => {
    it("should throw ApiError 409 if category name already exists", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 1, remarkTypeName: "Existing Category" }],
        },
      });

      await expect(createRemarkCategory("Existing Category")).rejects.toThrow(ApiError);
    });
  });

  describe("updateCommonRemark", () => {
    it("should call PUT API to update remark successfully", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          items: [{ id: 1, remarkTypeName: "Category 1" }],
        },
      });
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });

      const payload = {
        id: 10,
        remarkType: "1",
        remark: "Updated remark content",
        isActive: false,
        updatedBy: 42,
      };

      await updateCommonRemark(payload);

      expect(apiClient.put).toHaveBeenCalledWith("/CommonRemarkDetails/10", {
        id: 10,
        remarkTypeId: 1,
        remark: "Updated remark content",
        isActive: false,
        updatedBy: 42,
      });
    });
  });

  describe("deleteCommonRemark", () => {
    it("should call DELETE API to delete remark successfully", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      await deleteCommonRemark(10);

      expect(apiClient.delete).toHaveBeenCalledWith("/CommonRemarkDetails/10/purge");
    });
  });
});
