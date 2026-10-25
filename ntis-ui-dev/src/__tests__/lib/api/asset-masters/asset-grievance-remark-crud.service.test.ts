import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAssetGrievanceRemarkPaged,
  getAssetGrievanceRemarkById,
  createAssetGrievanceRemark,
  updateAssetGrievanceRemark,
  deleteAssetGrievanceRemark,
} from "@/lib/api/asset-masters/asset-grievance-remark-crud.service";
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

describe("Grievance Remark API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAssetGrievanceRemarkPaged", () => {
    it("should request and fetch paged remarks with override IsActive parameter", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, grievanceCategoryId: 2, remark: "R1", description: "D1", isActive: true }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getAssetGrievanceRemarkPaged(1, 10, "query", "grievanceCategoryId", "desc");
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/asset-grievance-remark?PageNumber=1&PageSize=10&MarkedForDeletion=false&IsActive=&SearchTerm=query&SortBy=grievanceCategoryId&SortOrder=desc");
      expect(result).toEqual(mockApiResponse.data);
    });
  });

  describe("getAssetGrievanceRemarkById", () => {
    it("should fetch remark details successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { id: 1, grievanceCategoryId: 2, remark: "R1", description: "D1", isActive: true },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getAssetGrievanceRemarkById(1);
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/asset-grievance-remark/1");
      expect(result).toEqual(mockApiResponse.data);
    });

    it("should throw error for invalid id", async () => {
      await expect(getAssetGrievanceRemarkById(0)).rejects.toThrow(ApiError);
    });
  });

  describe("createAssetGrievanceRemark", () => {
    it("should create remark successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "Grievance remark created successfully" },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse);

      const payload = {
        grievanceCategoryId: 3,
        remark: "Overflowing water tank",
        description: "Requires immediate attention",
        isActive: true,
      };

      const result = await createAssetGrievanceRemark({ ...payload, createdBy: 1 });
      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/asset-grievance-remark", {
        ...payload,
        remark: "Overflowing water tank",
        description: "Requires immediate attention",
        createdBy: 1,
      });
      expect(result).toBe("Grievance remark created successfully");
    });
  });

  describe("updateAssetGrievanceRemark", () => {
    it("should update remark successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "Grievance remark updated successfully" },
      };
      vi.mocked(apiClient.put).mockResolvedValue(mockApiResponse);

      const payload = {
        id: 1,
        grievanceCategoryId: 3,
        remark: "Overflowing water tank",
        description: "Resolved issue",
        isActive: true,
      };

      const result = await updateAssetGrievanceRemark({ ...payload, updatedBy: 1 });
      expect(apiClient.put).toHaveBeenCalledWith("/asset-management/asset-grievance-remark/1", {
        id: 1,
        grievanceCategoryId: 3,
        remark: "Overflowing water tank",
        description: "Resolved issue",
        isActive: true,
        updatedBy: 1,
      });
      expect(result).toBe("Grievance remark updated successfully");
    });
  });

  describe("deleteAssetGrievanceRemark", () => {
    it("should delete remark successfully", async () => {
      const mockApiResponse = {
        success: true,
      };
      vi.mocked(apiClient.delete).mockResolvedValue(mockApiResponse);

      await deleteAssetGrievanceRemark(1);
      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/asset-grievance-remark/1");
    });
  });
});
