/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchAssetFieldDefinitionPagedAction,
  createAssetFieldDefinitionAction,
  updateAssetFieldDefinitionAction,
  deleteAssetFieldDefinitionAction,
  getAssetFieldDefinitionByIdAction,
} from "@/app/[locale]/assets/configuration/master-data/asset-field-definition/action";
import * as service from "@/lib/api/asset-masters/asset-field-definition.service";

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

vi.mock("@/lib/api/asset-masters/asset-field-definition.service", () => ({
  getAssetFieldDefinitionPaged: vi.fn(),
  createAssetFieldDefinition: vi.fn(),
  updateAssetFieldDefinition: vi.fn(),
  deleteAssetFieldDefinition: vi.fn(),
  getAssetFieldDefinitionById: vi.fn(),
}));

describe("Asset Field Definition Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAssetFieldDefinitionPagedAction", () => {
    it("calls service function with valid parameters", async () => {
      const mockResult = { items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false };
      vi.mocked(service.getAssetFieldDefinitionPaged).mockResolvedValueOnce(mockResult);

      const res = await fetchAssetFieldDefinitionPagedAction(1, 10, "test", "fieldCode", "asc");

      expect(service.getAssetFieldDefinitionPaged).toHaveBeenCalledWith(1, 10, "test", "fieldCode", "asc");
      expect(res).toEqual(mockResult);
    });
  });

  describe("createAssetFieldDefinitionAction", () => {
    it("creates field definition and returns success result", async () => {
      vi.mocked(service.createAssetFieldDefinition).mockResolvedValueOnce("Created successfully");

      const res = await createAssetFieldDefinitionAction({
        assetCategoryId: 1,
        assetTypeId: 2,
        fieldCode: "FLD01",
        fieldName: "Area",
        fieldLabel: "Area Label",
        fieldType: "text",
        fieldGroup: "Specs",
        isRequired: false,
        displayOrder: 1,
        isActive: true,
      });

      expect(res).toEqual({ success: true, message: "Created successfully" });
    });
  });

  describe("updateAssetFieldDefinitionAction", () => {
    it("updates field definition and returns success result", async () => {
      vi.mocked(service.updateAssetFieldDefinition).mockResolvedValueOnce("Updated successfully");

      const res = await updateAssetFieldDefinitionAction({
        id: 5,
        assetCategoryId: 1,
        assetTypeId: 2,
        fieldCode: "FLD01",
        fieldName: "Area Updated",
        fieldLabel: "Area Label",
        fieldType: "text",
        fieldGroup: "Specs",
        isRequired: false,
        displayOrder: 1,
        isActive: true,
      });

      expect(res).toEqual({ success: true, message: "Updated successfully" });
    });
  });

  describe("deleteAssetFieldDefinitionAction", () => {
    it("deletes field definition via FormData", async () => {
      vi.mocked(service.deleteAssetFieldDefinition).mockResolvedValueOnce("Deleted successfully");

      const formData = new FormData();
      formData.append("id", "5");

      const res = await deleteAssetFieldDefinitionAction(formData);

      expect(service.deleteAssetFieldDefinition).toHaveBeenCalledWith(5);
      expect(res).toEqual({ success: true, message: "Deleted successfully" });
    });
  });

  describe("getAssetFieldDefinitionByIdAction", () => {
    it("fetches single field definition by numeric id", async () => {
      const mockItem = { id: 5, fieldCode: "FLD01" } as any;
      vi.mocked(service.getAssetFieldDefinitionById).mockResolvedValueOnce(mockItem);

      const res = await getAssetFieldDefinitionByIdAction(5);

      expect(service.getAssetFieldDefinitionById).toHaveBeenCalledWith(5);
      expect(res).toEqual(mockItem);
    });
  });
});
