import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAssetPhotoTypes,
  getAssetPhotoPaged,
  getAssetPhotoTypeById,
  createAssetPhotoType,
  updateAssetPhotoType,
  deleteAssetPhotoType,
  getAssetCategories,
  getAssetTypes,
} from "@/lib/api/asset-masters/asset-photo-crud.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("AssetPhotoType API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAssetPhotoTypes", () => {
    it("should fetch all asset photo types successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, photoTypeCode: "T1", photoTypeName: "N1", description: "D1", displayOrder: 1, isActive: true, isRequired: false, isSubUnit: false }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getAssetPhotoTypes();
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/photo-type?MarkedForDeletion=false");
      expect(result).toEqual(mockApiResponse.data.items);
    });
  });

  describe("getAssetPhotoPaged", () => {
    it("should fetch paged asset photo types successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, photoTypeCode: "T1", photoTypeName: "N1", description: "D1", displayOrder: 1, isActive: true, isRequired: false, isSubUnit: false }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getAssetPhotoPaged(1, 10, "query", "photoTypeCode", "asc");
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/asset-management/photo-type?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=query&SortBy=photoTypeCode&SortOrder=asc")
      );
      expect(result).toEqual(mockApiResponse.data);
    });

    it("should throw ApiError if request fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Bad Request",
      });
      await expect(getAssetPhotoPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getAssetPhotoTypeById", () => {
    it("should fetch single record and return it", async () => {
      const mockItem = { id: 1, photoTypeCode: "T1", photoTypeName: "N1", description: "D1", displayOrder: 1, isActive: true, isRequired: false, isSubUnit: false };
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const result = await getAssetPhotoTypeById(1);
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/photo-type/1");
      expect(result).toEqual(mockItem);
    });
  });

  describe("createAssetPhotoType", () => {
    it("should send post request with correct payload", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });
      const data = {
        photoTypeCode: "CODE",
        photoTypeName: "Name",
        description: "Desc",
        displayOrder: 2,
        isActive: true,
        assetCategoryId: 1,
        assetTypeId: 2,
        isRequired: true,
        isSubUnit: true,
      };

      await createAssetPhotoType(data);
      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/photo-type", {
        photoTypeCode: "CODE",
        photoTypeName: "Name",
        description: "Desc",
        displayOrder: 2,
        isActive: true,
        createdBy: null,
        assetCategoryId: 1,
        assetTypeId: 2,
        isRequired: true,
        isSubUnit: true,
      });
    });
  });

  describe("updateAssetPhotoType", () => {
    it("should send put request with correct payload", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });
      const data = {
        id: 10,
        photoTypeCode: "CODE",
        photoTypeName: "Name",
        description: "Desc",
        displayOrder: 2,
        isActive: true,
        assetCategoryId: 1,
        assetTypeId: 2,
        isRequired: true,
        isSubUnit: false,
      };

      await updateAssetPhotoType(data);
      expect(apiClient.put).toHaveBeenCalledWith("/asset-management/photo-type/10", {
        id: 10,
        photoTypeCode: "CODE",
        photoTypeName: "Name",
        description: "Desc",
        displayOrder: 2,
        isActive: true,
        updatedBy: null,
        assetCategoryId: 1,
        assetTypeId: 2,
        isRequired: true,
        isSubUnit: false,
      });
    });
  });

  describe("deleteAssetPhotoType", () => {
    it("should send delete request for correct ID", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });
      await deleteAssetPhotoType(15);
      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/photo-type/15");
    });
  });

  describe("getAssetCategories", () => {
    it("should fetch categories", async () => {
      const mockCategories = {
        success: true,
        data: {
          items: [{ id: 1, categoryName: "Cat 1", isActive: true }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockCategories);

      const result = await getAssetCategories();
      expect(result).toEqual(mockCategories.data.items);
    });
  });

  describe("getAssetTypes", () => {
    it("should fetch asset types", async () => {
      const mockTypes = {
        success: true,
        data: {
          items: [{ id: 2, typeName: "Type 2", isActive: true }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockTypes);

      const result = await getAssetTypes();
      expect(result).toEqual(mockTypes.data.items);
    });
  });
});

