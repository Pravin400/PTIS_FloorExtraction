/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAssetDocumentDefinitionPagedAction,
  createAssetDocumentDefinitionAction,
  updateAssetDocumentDefinitionAction,
  deleteAssetDocumentDefinitionAction,
  getAssetDocumentDefinitionByIdAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-document-definition/action";
import * as service from "@/lib/api/asset-masters/asset-document-definition.service";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: "user_123" }),
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/utils/cookie", () => ({
  getUserIdFromCookies: vi.fn().mockReturnValue("user_123"),
}));

vi.mock("@/lib/utils/server-logger", () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

vi.mock("@/lib/api/asset-masters/asset-document-definition.service", () => ({
  getAssetDocumentDefinitionPaged: vi.fn(),
  createAssetDocumentDefinition: vi.fn(),
  updateAssetDocumentDefinition: vi.fn(),
  deleteAssetDocumentDefinition: vi.fn(),
  getAssetDocumentDefinitionById: vi.fn(),
}));

describe("Asset Document Definition Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAssetDocumentDefinitionPagedAction", () => {
    it("calls service function with valid parameters", async () => {
      const mockResult = { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false };
      vi.mocked(service.getAssetDocumentDefinitionPaged).mockResolvedValueOnce(mockResult);

      const res = await fetchAssetDocumentDefinitionPagedAction(1, 10, "test", "documentCode", "asc");

      expect(service.getAssetDocumentDefinitionPaged).toHaveBeenCalledWith(1, 10, "test", "documentCode", "asc");
      expect(res).toEqual(mockResult);
    });
  });

  describe("createAssetDocumentDefinitionAction", () => {
    it("creates document definition and returns success result", async () => {
      vi.mocked(service.createAssetDocumentDefinition).mockResolvedValueOnce("Created successfully");

      const res = await createAssetDocumentDefinitionAction({
        assetCategoryId: 1,
        assetTypeId: 2,
        documentCode: "DOC01",
        documentName: "Title Deed",
        description: "Property deed",
        isRequired: true,
        displayOrder: 1,
        isActive: true,
      });

      expect(res).toEqual({ success: true, message: "Created successfully" });
    });
  });

  describe("updateAssetDocumentDefinitionAction", () => {
    it("updates document definition and returns success result", async () => {
      vi.mocked(service.updateAssetDocumentDefinition).mockResolvedValueOnce("Updated successfully");

      const res = await updateAssetDocumentDefinitionAction({
        id: 3,
        assetCategoryId: 1,
        assetTypeId: 2,
        documentCode: "DOC01",
        documentName: "Updated Deed",
        description: "Updated description",
        isRequired: true,
        displayOrder: 1,
        isActive: true,
      });

      expect(res).toEqual({ success: true, message: "Updated successfully" });
    });
  });

  describe("deleteAssetDocumentDefinitionAction", () => {
    it("deletes document definition via FormData", async () => {
      vi.mocked(service.deleteAssetDocumentDefinition).mockResolvedValueOnce("Deleted successfully");

      const formData = new FormData();
      formData.append("id", "3");

      const res = await deleteAssetDocumentDefinitionAction(formData);

      expect(service.deleteAssetDocumentDefinition).toHaveBeenCalledWith(3);
      expect(res).toEqual({ success: true, message: "Deleted successfully" });
    });
  });

  describe("getAssetDocumentDefinitionByIdAction", () => {
    it("fetches single document definition by numeric id", async () => {
      const mockItem = { id: 3, documentCode: "DOC01" } as any;
      vi.mocked(service.getAssetDocumentDefinitionById).mockResolvedValueOnce(mockItem);

      const res = await getAssetDocumentDefinitionByIdAction(3);

      expect(service.getAssetDocumentDefinitionById).toHaveBeenCalledWith(3);
      expect(res).toEqual(mockItem);
    });
  });
});
