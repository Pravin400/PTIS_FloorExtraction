import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getGrievanceWorkflowStageMastersPaged,
  getGrievanceWorkflowStageMasterById,
  createGrievanceWorkflowStageMaster,
  updateGrievanceWorkflowStageMaster,
  deleteGrievanceWorkflowStageMaster,
} from "@/lib/api/asset-masters/grievance-workflow-stage-master.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { GrievanceWorkflowStageMasterFormModel } from "@/types/asset-masters/grievance-workflow-stage-master.types";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("grievance-workflow-stage-master.service Tests", () => {
  const sampleRawItem = {
    id: 10,
    ulbTypeId: 1,
    ulbTypeName: "Municipal Corporation",
    stageCode: "STAGE_01",
    stageName: "Initial Verification",
    stageNameLocal: "प्रारंभिक पडताळणी",
    stageOrder: 1,
    status: "IN REVIEW",
    description: "Initial stage of grievance review",
    isActive: true,
    createdDate: "2026-01-01T00:00:00Z",
    updatedDate: "2026-01-02T00:00:00Z",
    createdBy: "admin",
    updatedBy: "admin",
  };

  const sampleFormData: GrievanceWorkflowStageMasterFormModel = {
    id: 10,
    ulbTypeId: 1,
    stageCode: "STAGE_01",
    stageName: "Initial Verification",
    stageNameLocal: "प्रारंभिक पडताळणी",
    stageOrder: 1,
    status: "IN REVIEW",
    description: "Initial stage of grievance review",
    isActive: true,
    createdBy: "admin",
    updatedBy: "admin",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGrievanceWorkflowStageMastersPaged", () => {
    it("should fetch paged grievance workflow stages with query parameters", async () => {
      const mockPagedResponse = {
        success: true,
        data: {
          items: [sampleRawItem],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockPagedResponse as never);

      const result = await getGrievanceWorkflowStageMastersPaged(1, 10, "STAGE", "stageOrder", "asc");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/asset-management/grievance-workflow-stage?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=STAGE&SortBy=stageOrder&SortOrder=asc"
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].stageCode).toBe("STAGE_01");
      expect(result.items[0].ulbTypeName).toBe("Municipal Corporation");
    });

    it("should throw ApiError on failure response", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Server Error",
      } as never);

      await expect(getGrievanceWorkflowStageMastersPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getGrievanceWorkflowStageMasterById", () => {
    it("should return normalized stage data when ID exists", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: sampleRawItem,
      } as never);

      const result = await getGrievanceWorkflowStageMasterById(10);

      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/grievance-workflow-stage/10");
      expect(result).not.toBeNull();
      expect(result?.id).toBe(10);
      expect(result?.stageName).toBe("Initial Verification");
    });

    it("should return null if response data is missing", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: null,
      } as never);

      const result = await getGrievanceWorkflowStageMasterById(999);
      expect(result).toBeNull();
    });

    it("should throw ApiError when GET fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 404,
        error: "Not Found",
      } as never);

      await expect(getGrievanceWorkflowStageMasterById(999)).rejects.toThrow(ApiError);
    });
  });

  describe("createGrievanceWorkflowStageMaster", () => {
    it("should send POST request with trimmed payload", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: { success: true, message: "Created" },
      } as never);

      await createGrievanceWorkflowStageMaster(sampleFormData);

      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/grievance-workflow-stage", {
        ulbTypeId: 1,
        stageCode: "STAGE_01",
        stageName: "Initial Verification",
        stageNameLocal: "प्रारंभिक पडताळणी",
        stageOrder: 1,
        status: "IN REVIEW",
        description: "Initial stage of grievance review",
        isActive: true,
        createdBy: "admin",
      });
    });

    it("should throw ApiError if creation fails", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Duplicate stage code",
      } as never);

      await expect(createGrievanceWorkflowStageMaster(sampleFormData)).rejects.toThrow(ApiError);
    });
  });

  describe("updateGrievanceWorkflowStageMaster", () => {
    it("should send PUT request when valid ID is provided", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        success: true,
        data: { success: true, message: "Updated" },
      } as never);

      await updateGrievanceWorkflowStageMaster(sampleFormData);

      expect(apiClient.put).toHaveBeenCalledWith("/asset-management/grievance-workflow-stage/10", {
        id: 10,
        ulbTypeId: 1,
        stageCode: "STAGE_01",
        stageName: "Initial Verification",
        stageNameLocal: "प्रारंभिक पडताळणी",
        stageOrder: 1,
        status: "IN REVIEW",
        description: "Initial stage of grievance review",
        isActive: true,
        updatedBy: "admin",
      });
    });

    it("should throw ApiError if ID is missing", async () => {
      const invalidData = { ...sampleFormData, id: null as unknown as number };
      await expect(updateGrievanceWorkflowStageMaster(invalidData)).rejects.toThrow(ApiError);
    });
  });

  describe("deleteGrievanceWorkflowStageMaster", () => {
    it("should call DELETE endpoint with encoded ID", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: true,
        data: { success: true },
      } as never);

      await deleteGrievanceWorkflowStageMaster(10);

      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/grievance-workflow-stage/10");
    });

    it("should throw ApiError when delete fails", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: false,
        statusCode: 409,
        error: "Record in use",
      } as never);

      await expect(deleteGrievanceWorkflowStageMaster(10)).rejects.toThrow(ApiError);
    });
  });
});
