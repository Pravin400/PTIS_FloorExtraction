import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOwningDepartments,
  getDesignationsPaged,
  getDesignationById,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "@/lib/api/asset-masters/designation-crud.service";
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

describe("Designation API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOwningDepartments", () => {
    it("should fetch all owning departments successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, owningDepartmentName: "D1", description: "Desc1", isActive: true }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getOwningDepartments();
      expect(apiClient.get).toHaveBeenCalledWith("/OwningDepartment?PageNumber=1&PageSize=-1&IsActive=true");
      expect(result).toEqual(mockApiResponse.data.items);
    });

    it("should throw ApiError when API call fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Bad Request",
      });
      await expect(getOwningDepartments()).rejects.toThrow(ApiError);
    });
  });

  describe("getDesignationsPaged", () => {
    it("should fetch paged designations successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, designationCode: "C1", designationName: "N1", designationLocal: "L1", designationDescription: "D1", owningDepartmentId: 1, isActive: true }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getDesignationsPaged(1, 10, "query", "designationCode", "asc");
      expect(apiClient.get).toHaveBeenCalledWith("/AssetDesignation?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=query&SortBy=designationCode&SortOrder=asc");
      expect(result).toEqual(mockApiResponse.data);
    });
  });

  describe("getDesignationById", () => {
    it("should fetch a single designation by ID successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { id: 1, designationCode: "C1", designationName: "N1", designationLocal: "L1", designationDescription: "D1", owningDepartmentId: 1, isActive: true },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getDesignationById(1);
      expect(apiClient.get).toHaveBeenCalledWith("/AssetDesignation/1");
      expect(result).toEqual(mockApiResponse.data);
    });

    it("should throw error for invalid id", async () => {
      await expect(getDesignationById(0)).rejects.toThrow(ApiError);
    });
  });

  describe("createDesignation", () => {
    it("should create a designation successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "Created successfully" },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse);

      const payload = {
        designationCode: "C1",
        designationName: "N1",
        designationLocal: "L1",
        designationDescription: "D1",
        owningDepartmentId: 1,
        isActive: true,
      };

      const result = await createDesignation(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/AssetDesignation", {
        ...payload,
        createdBy: null,
      });
      expect(result).toBe("Created successfully");
    });
  });

  describe("updateDesignation", () => {
    it("should update a designation successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "Updated successfully" },
      };
      vi.mocked(apiClient.put).mockResolvedValue(mockApiResponse);

      const payload = {
        id: 1,
        designationCode: "C1",
        designationName: "N1",
        designationLocal: "L1",
        designationDescription: "D1",
        owningDepartmentId: 1,
        isActive: true,
      };

      const result = await updateDesignation(payload);
      expect(apiClient.put).toHaveBeenCalledWith("/AssetDesignation/1", {
        ...payload,
        updatedBy: null,
      });
      expect(result).toBe("Updated successfully");
    });
  });

  describe("deleteDesignation", () => {
    it("should delete a designation successfully", async () => {
      const mockApiResponse = {
        success: true,
      };
      vi.mocked(apiClient.delete).mockResolvedValue(mockApiResponse);

      await deleteDesignation(1);
      expect(apiClient.delete).toHaveBeenCalledWith("/AssetDesignation/1");
    });
  });
});

