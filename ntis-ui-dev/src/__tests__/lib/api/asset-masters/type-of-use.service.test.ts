import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTypeOfUseGroupsPaged,
  getAssetTypeOfUsesPaged,
  getAssetSubTypeOfUsesPaged,
  createTypeOfUseGroup,
  updateTypeOfUseGroup,
  updateAssetTypeOfUse,
  updateAssetSubTypeOfUse,
  deleteTypeOfUseGroup,
  getAssetTypeOfUses,
  getAssetSubTypeOfUses,
} from "@/lib/api/asset-masters/type-of-use.service";
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

describe("Type of Use API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTypeOfUseGroupsPaged", () => {
    it("should fetch groups successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1, typeOfUseGroupCode: "G1", groupName: "Group 1", isActive: true }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getTypeOfUseGroupsPaged(1, 10, "query", "groupName", "asc");
      expect(apiClient.get).toHaveBeenCalledWith(
        "/asset-management/type-of-use-group?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=query&SortBy=groupName&SortOrder=asc"
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should throw ApiError when request fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Bad Request",
      });
      await expect(getTypeOfUseGroupsPaged(1, 10)).rejects.toThrow(ApiError);
    });

    it("should reject a paged response without an items array", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

      await expect(getTypeOfUseGroupsPaged(1, 10)).rejects.toThrow(ApiError);
    });

    it("should accept a valid empty paged response", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: { items: [] } });

      await expect(getTypeOfUseGroupsPaged(1, 10)).resolves.toEqual({ items: [] });
    });
  });

  describe("paged type and sub-type responses", () => {
    it("should reject paged types when items is missing", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

      await expect(getAssetTypeOfUsesPaged(1, 10)).rejects.toThrow(ApiError);
    });

    it("should reject paged sub-types when items is not an array", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: { items: null } });

      await expect(getAssetSubTypeOfUsesPaged(1, 10, 1)).rejects.toThrow(ApiError);
    });
  });

  describe("createTypeOfUseGroup", () => {
    it("should create a group successfully", async () => {
      const mockResponse = {
        success: true,
        data: { id: 1 },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const payload = {
        typeOfUseGroupCode: "G1",
        groupName: "Group 1",
        groupIcon: "home",
        isActive: true,
        createdBy: 99,
      };
      await createTypeOfUseGroup(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/type-of-use-group", {
        ...payload,
      });
    });
  });

  describe("updateTypeOfUseGroup", () => {
    it("should update a group successfully", async () => {
      const mockResponse = {
        success: true,
        data: { id: 1 },
      };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const payload = {
        id: 1,
        typeOfUseGroupCode: "G1",
        groupName: "Group 1",
        groupIcon: "home",
        isActive: true,
        updatedBy: 99,
      };
      await updateTypeOfUseGroup(payload);
      expect(apiClient.put).toHaveBeenCalledWith("/asset-management/type-of-use-group/1", {
        typeOfUseGroupCode: "G1",
        groupName: "Group 1",
        groupIcon: "home",
        isActive: true,
        updatedBy: 99,
      });
    });
  });

  describe("deleteTypeOfUseGroup", () => {
    it("should delete a group successfully", async () => {
      const mockResponse = {
        success: true,
      };
      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      await deleteTypeOfUseGroup(1);
      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/type-of-use-group/1");
    });
  });

  describe("getAssetTypeOfUses", () => {
    it("should fetch types successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1, typeOfUseCode: "T1", description: "Type 1", typeOfUseGroupId: 1, isActive: true }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getAssetTypeOfUses(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/asset-management/asset-type-of-use?TypeOfUseGroupId=1&MarkedForDeletion=false&PageSize=-1"
      );
      expect(result).toEqual(mockResponse.data.items);
    });

    it("returns a valid empty list when the backend returns items: []", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: { items: [] } });

      await expect(getAssetTypeOfUses(1)).resolves.toEqual([]);
    });

    it("throws when the backend omits items", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true, data: {} });

      await expect(getAssetTypeOfUses(1)).rejects.toThrow(ApiError);
    });
  });

  it("does not send the type id in the type update body", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ success: true, data: { message: "updated" } });

    await updateAssetTypeOfUse({
      id: 12,
      assetCategoryId: 1,
      assetTypeId: 2,
      typeOfUseGroupId: 3,
      typeOfUseCode: "RES",
      description: "Residential",
      type: "R",
      searchSequence: "",
      isActive: false,
      updatedBy: 99,
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      "/asset-management/asset-type-of-use/12",
      expect.objectContaining({ isActive: false, updatedBy: 99, searchSequence: undefined })
    );
  });

  it("does not send the sub-type id in the update body", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ success: true, data: { message: "updated" } });

    await updateAssetSubTypeOfUse({
      id: 15,
      typeOfUseId: 12,
      description: "Apartment",
      searchSequence: 2,
      isActive: true,
      updatedBy: 99,
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      "/asset-management/asset-sub-type-of-use/15",
      expect.objectContaining({ typeOfUseId: 12, isActive: true, updatedBy: 99, searchSequence: 2 })
    );
  });

  describe("getAssetSubTypeOfUses", () => {
    it("should fetch sub-types successfully", async () => {
      const mockResponse = {
        success: true,
        data: {
          items: [{ id: 1, subTypeName: "Sub 1", typeOfUseId: 1, isActive: true }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await getAssetSubTypeOfUses(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        "/asset-management/asset-sub-type-of-use?TypeOfUseId=1&MarkedForDeletion=false&PageSize=-1"
      );
      expect(result).toEqual(mockResponse.data.items);
    });

    it("throws when the backend response data is missing", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ success: true });

      await expect(getAssetSubTypeOfUses(1)).rejects.toThrow(ApiError);
    });
  });
});
