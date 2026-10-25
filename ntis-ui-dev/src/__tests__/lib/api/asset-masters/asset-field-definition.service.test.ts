import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import {
  getAssetFieldDefinitionPaged,
  getAssetFieldDefinitionById,
  createAssetFieldDefinition,
  updateAssetFieldDefinition,
  deleteAssetFieldDefinition,
  getAssetFieldGroups,
} from "@/lib/api/asset-masters/asset-field-definition.service";

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

describe("Asset Field Definition API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAssetFieldDefinitionPaged", () => {
    it("fetches paged asset field definitions successfully", async () => {
      const mockPagedData = {
        items: [{ id: 1, fieldCode: "FLD01", fieldName: "Area" }],
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

      const result = await getAssetFieldDefinitionPaged(1, 10, "Area", "fieldName", "asc");

      expect(apiClient.get).toHaveBeenCalledWith(
        "/AssetFieldDefinition?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=Area&SortBy=fieldName&SortOrder=asc"
      );
      expect(result).toEqual(mockPagedData);
    });

    it("throws ApiError when response is unsuccessful", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: false,
        statusCode: 400,
        error: "Bad Request",
      });

      await expect(getAssetFieldDefinitionPaged(1, 10)).rejects.toThrow(ApiError);
    });

    it("throws ApiError when no data is received", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      await expect(getAssetFieldDefinitionPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getAssetFieldDefinitionById", () => {
    it("fetches a single asset field definition by ID", async () => {
      const mockItem = { id: 5, fieldCode: "FLD05", fieldName: "Height" };
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: mockItem,
      });

      const result = await getAssetFieldDefinitionById(5);

      expect(apiClient.get).toHaveBeenCalledWith("/AssetFieldDefinition/5");
      expect(result).toEqual(mockItem);
    });

    it("throws ApiError 404 when item is not found", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: null,
      });

      await expect(getAssetFieldDefinitionById(99)).rejects.toThrow("Asset field definition not found");
    });
  });

  describe("createAssetFieldDefinition", () => {
    it("posts payload and returns success message", async () => {
      const input = {
        assetCategoryId: 1,
        assetTypeId: 2,
        fieldCode: "  FLD01  ",
        fieldName: "  Total Area  ",
        fieldLabel: "  Area Label  ",
        fieldType: "  number  ",
        fieldGroup: "  Specs  ",
        isRequired: true,
        displayOrder: 1,
        isActive: true,
        createdBy: 123,
      };

      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: true,
        message: "Created successfully",
      });

      const message = await createAssetFieldDefinition(input);

      expect(apiClient.post).toHaveBeenCalledWith("/AssetFieldDefinition", {
        assetCategoryId: 1,
        assetTypeId: 2,
        fieldCode: "FLD01",
        fieldName: "Total Area",
        fieldLabel: "Area Label",
        fieldType: "number",
        fieldGroup: "Specs",
        optionsJson: null,
        isRequired: true,
        displayOrder: 1,
        isActive: true,
        createdBy: 123,
      });
      expect(message).toBe("Created successfully");
    });

    it("throws ApiError when post call fails", async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: "Server Error",
      });

      await expect(
        createAssetFieldDefinition({
          assetCategoryId: 1,
          assetTypeId: 2,
          fieldCode: "FLD01",
          fieldName: "Area",
          fieldLabel: "Area",
          fieldType: "number",
          fieldGroup: null,
          isRequired: false,
          displayOrder: 1,
          isActive: true,
          createdBy: 123,
        })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("updateAssetFieldDefinition", () => {
    it("puts payload and returns success message", async () => {
      const input = {
        id: 10,
        assetCategoryId: 1,
        assetTypeId: 2,
        fieldCode: "FLD01",
        fieldName: "Updated Area",
        fieldLabel: "Updated Label",
        fieldType: "number",
        fieldGroup: "Specs",
        isRequired: false,
        displayOrder: 2,
        isActive: true,
        updatedBy: 123,
      };

      vi.mocked(apiClient.put).mockResolvedValueOnce({
        success: true,
        message: "Updated successfully",
      });

      const message = await updateAssetFieldDefinition(input);

      expect(apiClient.put).toHaveBeenCalledWith("/AssetFieldDefinition/10", expect.objectContaining({ id: 10, fieldName: "Updated Area" }));
      expect(message).toBe("Updated successfully");
    });
  });

  describe("deleteAssetFieldDefinition", () => {
    it("deletes field definition by id", async () => {
      vi.mocked(apiClient.delete).mockResolvedValueOnce({
        success: true,
        message: "Deleted successfully",
      });

      const message = await deleteAssetFieldDefinition(15);

      expect(apiClient.delete).toHaveBeenCalledWith("/AssetFieldDefinition/15");
      expect(message).toBe("Deleted successfully");
    });
  });

  describe("getAssetFieldGroups", () => {
    it("returns list of field groups", async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        success: true,
        data: ["General Specs", "Dimensions"],
      });

      const groups = await getAssetFieldGroups();

      expect(apiClient.get).toHaveBeenCalledWith("/AssetFieldDefinition/field-groups");
      expect(groups).toEqual(["General Specs", "Dimensions"]);
    });

    it("returns empty array on error", async () => {
      vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("Network Error"));

      const groups = await getAssetFieldGroups();

      expect(groups).toEqual([]);
    });
  });
});
