import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchCommonRemarksPagedAction,
  fetchRemarkCategoriesAction,
  getCommonRemarkByIdAction,
  deleteCommonRemarkAction,
  saveCommonRemarkAction,
} from "@/app/[locale]/configuration-settings/common-remark-master/actions";
import {
  getCommonRemarksPaged,
  getCommonRemarkById,
  createCommonRemark,
  updateCommonRemark,
  deleteCommonRemark,
  getCommonRemarkCategories,
} from "@/lib/api/common-remark-master/common-remark-crud.service";
import { ApiError } from "@/lib/utils/api";

// Mock next/headers cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn().mockReturnValue({ value: "42" }),
  })),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock the crud service layer
vi.mock("@/lib/api/common-remark-master/common-remark-crud.service", () => ({
  getCommonRemarksPaged: vi.fn(),
  getCommonRemarkById: vi.fn(),
  createCommonRemark: vi.fn(),
  updateCommonRemark: vi.fn(),
  deleteCommonRemark: vi.fn(),
  getCommonRemarkCategories: vi.fn(),
}));

describe("common-remark-master actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchCommonRemarksPagedAction", () => {
    it("should call service and return paged response", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };
      vi.mocked(getCommonRemarksPaged).mockResolvedValue(mockResult);

      const result = await fetchCommonRemarksPagedAction(1, 10, "q", "All");

      expect(getCommonRemarksPaged).toHaveBeenCalledWith(1, 10, "q", "All", undefined, undefined);
      expect(result).toEqual(mockResult);
    });
  });

  describe("fetchRemarkCategoriesAction", () => {
    it("should return categories on success", async () => {
      const mockCats = [{ id: 1, categoryCode: "C1", categoryName: "Cat 1" }];
      vi.mocked(getCommonRemarkCategories).mockResolvedValue(mockCats);

      const result = await fetchRemarkCategoriesAction();

      expect(result).toEqual(mockCats);
    });

    it("should return empty array on failure", async () => {
      vi.mocked(getCommonRemarkCategories).mockRejectedValue(new Error("Network failed"));

      const result = await fetchRemarkCategoriesAction();

      expect(result).toEqual([]);
    });
  });

  describe("getCommonRemarkByIdAction", () => {
    it("should return data if record exists", async () => {
      const mockItem = {
        id: 10,
        remarkTypeId: 1,
        remarkType: "Type",
        remark: "Remark",
        isActive: true,
        createdDate: "",
        updatedDate: null,
      };
      vi.mocked(getCommonRemarkById).mockResolvedValue(mockItem);

      const result = await getCommonRemarkByIdAction(10);

      expect(result).toEqual(mockItem);
    });

    it("should throw ApiError 404 if record is null", async () => {
      vi.mocked(getCommonRemarkById).mockResolvedValue(null);

      await expect(getCommonRemarkByIdAction(10)).rejects.toThrow(ApiError);
    });
  });

  describe("deleteCommonRemarkAction", () => {
    it("should delete and return success: true", async () => {
      vi.mocked(deleteCommonRemark).mockResolvedValue(undefined);

      const fd = new FormData();
      fd.append("locale", "mr");
      fd.append("id", "10");

      const result = await deleteCommonRemarkAction(fd);

      expect(deleteCommonRemark).toHaveBeenCalledWith(10);
      expect(result).toEqual({ success: true });
    });
  });

  describe("saveCommonRemarkAction", () => {
    it("should call createCommonRemark for new records", async () => {
      vi.mocked(createCommonRemark).mockResolvedValue(undefined);

      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("remarkType", "1");
      fd.append("remark", "Content text");
      fd.append("isActive", "true");

      const result = await saveCommonRemarkAction("", fd);

      expect(createCommonRemark).toHaveBeenCalledWith(
        expect.objectContaining({
          remarkType: "1",
          remark: "Content text",
          isActive: true,
        })
      );
      expect(result).toEqual({ ok: true, mode: "create" });
    });

    it("should call updateCommonRemark for existing records", async () => {
      vi.mocked(updateCommonRemark).mockResolvedValue(undefined);

      const fd = new FormData();
      fd.append("locale", "en");
      fd.append("remarkType", "Other");
      fd.append("customRemarkType", "Custom label");
      fd.append("remark", "Content text updated");
      fd.append("isActive", "false");

      const result = await saveCommonRemarkAction("10", fd);

      expect(updateCommonRemark).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 10,
          remarkType: "Other",
          customRemarkType: "Custom label",
          remark: "Content text updated",
          isActive: false,
        })
      );
      expect(result).toEqual({ ok: true, mode: "update" });
    });
  });
});
