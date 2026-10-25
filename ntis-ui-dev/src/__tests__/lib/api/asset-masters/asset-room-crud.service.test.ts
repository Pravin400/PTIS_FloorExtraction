import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAssetRoomTypes,
  getAssetRoomPaged,
  getAssetRoomTypeById,
  createAssetRoomType,
  updateAssetRoomType,
  deleteAssetRoomType,
  getAssetTypes,
} from "@/lib/api/asset-masters/asset-room-crud.service";
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

describe("AssetRoomType API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAssetRoomTypes", () => {
    it("should fetch all asset room types successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, roomTypeCode: "R1", roomTypeName: "N1", description: "D1", isActive: true, assetTypeId: 5 }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getAssetRoomTypes();
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/asset-room-type?MarkedForDeletion=false");
      expect(result).toEqual(mockApiResponse.data.items);
    });
  });

  describe("getAssetRoomPaged", () => {
    it("should fetch paged asset room types successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, roomTypeCode: "R1", roomTypeName: "N1", description: "D1", isActive: true, assetTypeId: 5 }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getAssetRoomPaged(1, 10, "query", "roomTypeCode", "asc");
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/asset-management/asset-room-type?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=query&SortBy=roomTypeCode&SortOrder=asc")
      );
      expect(result).toEqual(mockApiResponse.data);
    });

    it("should throw ApiError if request fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Bad Request",
      });
      await expect(getAssetRoomPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getAssetRoomTypeById", () => {
    it("should fetch single record and return it", async () => {
      const mockItem = { id: 1, roomTypeCode: "R1", roomTypeName: "N1", description: "D1", isActive: true, assetTypeId: 5 };
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: mockItem,
      });

      const result = await getAssetRoomTypeById(1);
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/asset-room-type/1");
      expect(result).toEqual(mockItem);
    });
  });

  describe("createAssetRoomType", () => {
    it("should send post request with correct payload", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });
      const data = {
        roomTypeCode: "CODE",
        roomTypeName: "Name",
        description: "Desc",
        isActive: true,
        assetCategoryId: 1,
        assetTypeId: 5,
      };

      await createAssetRoomType(data);
      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/asset-room-type", {
        roomTypeCode: "CODE",
        roomTypeName: "Name",
        description: "Desc",
        isActive: true,
        createdBy: null,
        assetCategoryId: 1,
        assetTypeId: 5,
      });
    });
  });

  describe("updateAssetRoomType", () => {
    it("should send put request with correct payload", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });
      const data = {
        id: 10,
        roomTypeCode: "CODE",
        roomTypeName: "Name",
        description: "Desc",
        isActive: true,
        assetCategoryId: 1,
        assetTypeId: 5,
      };

      await updateAssetRoomType(data);
      expect(apiClient.put).toHaveBeenCalledWith("/asset-management/asset-room-type/10", {
        roomTypeCode: "CODE",
        roomTypeName: "Name",
        description: "Desc",
        isActive: true,
        updatedBy: null,
        assetCategoryId: 1,
        assetTypeId: 5,
      });
    });
  });

  describe("deleteAssetRoomType", () => {
    it("should send delete request for correct ID", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });
      await deleteAssetRoomType(15);
      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/asset-room-type/15");
    });
  });

  describe("getAssetTypes", () => {
    it("should fetch asset types", async () => {
      const mockTypes = {
        success: true,
        data: {
          items: [{ id: 5, typeName: "Type 5", isActive: true }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockTypes);

      const result = await getAssetTypes();
      expect(result).toEqual(mockTypes.data.items);
    });
  });
});

