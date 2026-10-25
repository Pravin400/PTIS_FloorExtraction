import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import {
  getAssetDocumentDefinitionPaged,
  getAssetDocumentDefinitionById,
  createAssetDocumentDefinition,
  updateAssetDocumentDefinition,
  deleteAssetDocumentDefinition,
} from "@/lib/api/asset-masters/asset-document-definition.service";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Asset Document Definition API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAssetDocumentDefinitionPaged", () => {
    it("fetches paged asset document definitions successfully", async () => {
      const mockPagedData = {
        items: [{ id: 1, documentCode: "DOC01", documentName: "Title Deed" }],
        pageNumber: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      };

      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: mockPagedData,
      });

      const result = await getAssetDocumentDefinitionPaged(1, 10, "Title", "documentName", "asc");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/asset-management/document-definition?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=Title&SortBy=documentName&SortOrder=asc"
      );
      expect(result).toEqual(mockPagedData);
    });

    it("throws ApiError when response is unsuccessful", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: "Server Error",
      });

      await expect(getAssetDocumentDefinitionPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getAssetDocumentDefinitionById", () => {
    it("fetches single document definition by ID", async () => {
      const mockItem = { id: 3, documentCode: "DOC03", documentName: "Tax Receipt" };
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: mockItem,
      });

      const result = await getAssetDocumentDefinitionById(3);

      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/document-definition/3");
      expect(result).toEqual(mockItem);
    });

    it("throws ApiError 404 when item is not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      await expect(getAssetDocumentDefinitionById(99)).rejects.toThrow("Asset document definition not found");
    });
  });

  describe("createAssetDocumentDefinition", () => {
    it("posts payload and returns success message", async () => {
      const input = {
        assetCategoryId: 1,
        assetTypeId: 2,
        documentCode: "  DOC01  ",
        documentName: "  Title Deed  ",
        description: "  Property deed  ",
        isRequired: true,
        displayOrder: 1,
        isActive: true,
        createdBy: 123,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        message: "Document Definition created successfully",
      });

      const message = await createAssetDocumentDefinition(input);

      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/document-definition", {
        assetCategoryId: 1,
        assetTypeId: 2,
        documentCode: "DOC01",
        documentName: "Title Deed",
        description: "Property deed",
        isRequired: true,
        displayOrder: 1,
        isActive: true,
        createdBy: 123,
      });
      expect(message).toBe("Document Definition created successfully");
    });
  });

  describe("updateAssetDocumentDefinition", () => {
    it("puts payload and returns success message", async () => {
      const input = {
        id: 10,
        assetCategoryId: 1,
        assetTypeId: 2,
        documentCode: "DOC01",
        documentName: "Updated Deed",
        description: "Updated description",
        isRequired: false,
        displayOrder: 2,
        isActive: true,
        updatedBy: 123,
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        message: "Document Definition updated successfully",
      });

      const message = await updateAssetDocumentDefinition(input);

      expect(apiClient.put).toHaveBeenCalledWith(
        "/asset-management/document-definition/10",
        expect.objectContaining({ id: 10, documentName: "Updated Deed" })
      );
      expect(message).toBe("Document Definition updated successfully");
    });
  });

  describe("deleteAssetDocumentDefinition", () => {
    it("deletes document definition by id", async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: true,
        message: "Record marked for deletion",
      });

      const message = await deleteAssetDocumentDefinition(10);

      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/document-definition/10");
      expect(message).toBe("Record marked for deletion");
    });
  });
});
