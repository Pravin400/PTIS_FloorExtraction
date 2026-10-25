/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => undefined),
      getAll: vi.fn(() => []),
    })
  ),
}));
vi.mock("@/lib/utils/cookie", () => ({
  getUserIdFromCookies: vi.fn(() => 1),
}));

vi.mock("@/lib/api/asset-masters/asset-category-crud.service", () => ({
  assetCategoryService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getById: vi.fn(),
  }
}));

import { revalidatePath } from "next/cache";
import {
  saveAssetCategoryAction,
  deleteAssetCategoryAction,
  getAssetCategoryByIdAction
} from "@/app/[locale]/assets/configuration/master-data/asset-category/actions";
import { assetCategoryService } from "@/lib/api/asset-masters/asset-category-crud.service";

describe("AssetCategory Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveAssetCategoryAction", () => {
    it("creates a category successfully and revalidates paths", async () => {
      vi.mocked(assetCategoryService.create).mockResolvedValue({} as any);
      const formData = new FormData();
      formData.append("code", "CAT1");
      formData.append("name", "Category 1");
      formData.append("description", "Desc");
      formData.append("isMovable", "true");
      formData.append("hasFloorDetails", "false");
      formData.append("hasInventory", "true");
      formData.append("isInventoryMandatory", "false");
      formData.append("hasLegalCompliance", "false");
      formData.append("valuationType", "Cost");
      formData.append("isActive", "true");

      const result = await saveAssetCategoryAction("", formData);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe("create");
      expect(assetCategoryService.create).toHaveBeenCalledWith(expect.objectContaining({ categoryCode: "CAT1" }));
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("updates a category successfully and revalidates paths", async () => {
      vi.mocked(assetCategoryService.update).mockResolvedValue({} as any);
      const formData = new FormData();
      formData.append("code", "CAT2");
      formData.append("name", "Category 2");
      formData.append("valuationType", "Cost");
      formData.append("isActive", "true");

      const result = await saveAssetCategoryAction("10", formData);
      expect(result.ok).toBe(true);
      expect(result.mode).toBe("update");
      expect(assetCategoryService.update).toHaveBeenCalledWith("10", expect.objectContaining({ categoryCode: "CAT2", id: 10 }));
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("rejects invalid valuationType format", async () => {
      const formData = new FormData();
      formData.append("code", "CAT1");
      formData.append("name", "Category 1");
      formData.append("valuationType", "<script>");
      const result = await saveAssetCategoryAction("", formData);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Invalid characters in valuation type");
      expect(result.field).toBe("valuationType");
    });

    it("handles errors gracefully", async () => {
      vi.mocked(assetCategoryService.create).mockRejectedValue(new Error("Database error"));
      const formData = new FormData();
      formData.append("code", "CAT1");
      formData.append("name", "Category 1");
      formData.append("valuationType", "Cost");
      const result = await saveAssetCategoryAction("", formData);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Database error");
    });
  });

  describe("deleteAssetCategoryAction", () => {
    it("deletes a category successfully", async () => {
      vi.mocked(assetCategoryService.delete).mockResolvedValue(true as any);
      const formData = new FormData();
      formData.append("id", "5");

      const result = await deleteAssetCategoryAction(formData);
      expect(result.ok).toBe(true);
      expect(assetCategoryService.delete).toHaveBeenCalledWith("5", 1);
      expect(revalidatePath).toHaveBeenCalled();
    });

    it("handles deletion errors gracefully", async () => {
      vi.mocked(assetCategoryService.delete).mockRejectedValue(new Error("Cannot delete"));
      const formData = new FormData();
      formData.append("id", "5");

      const result = await deleteAssetCategoryAction(formData);
      expect(result.ok).toBe(false);
      expect(result.error).toContain("Cannot delete");
    });
  });

  describe("getAssetCategoryByIdAction", () => {
    it("fetches single record by ID and maps to form model", async () => {
      const mockItem = {
        id: 2,
        categoryCode: "CAT2",
        categoryName: "Name 2",
        description: "Desc",
        isMovable: true,
        hasFloorDetails: false,
        hasInventory: true,
        isInventoryMandatory: false,
        hasLegalCompliance: false,
        valuationType: "Market",
        isActive: true
      };
      vi.mocked(assetCategoryService.getById).mockResolvedValue(mockItem as any);

      const result = await getAssetCategoryByIdAction(2);
      expect(result).toEqual({
        id: "2",
        code: "CAT2",
        name: "Name 2",
        description: "Desc",
        isMovable: true,
        hasFloorDetails: false,
        hasInventory: true,
        isInventoryMandatory: false,
        hasLegalCompliance: false,
        valuationType: "Market",
        isActive: true
      });
      expect(assetCategoryService.getById).toHaveBeenCalledWith("2");
    });

    it("returns null if record not found", async () => {
      vi.mocked(assetCategoryService.getById).mockResolvedValue(null as any);
      const result = await getAssetCategoryByIdAction(999);
      expect(result).toBeNull();
    });
  });
});
