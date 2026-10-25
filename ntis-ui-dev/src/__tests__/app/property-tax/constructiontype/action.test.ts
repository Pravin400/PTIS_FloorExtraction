import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchConstructionPagedServerAction,
} from "@/app/[locale]/property-tax/constructiontype/action";
import { getConstructionPaged } from "@/lib/api/constructiontypemaster/construction-crud.service";
import { ApiError } from "@/lib/utils/api";

vi.mock("@/lib/api/constructiontypemaster/construction-crud.service", () => ({
  getConstructionPaged: vi.fn(),
  createConstructionType: vi.fn(),
  updateConstructionType: vi.fn(),
  deleteConstructionType: vi.fn(),
  getConstructionTypeById: vi.fn(),
  getConstruction: vi.fn(),
}));

describe("constructiontype/action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchConstructionPagedServerAction", () => {
    it("allows descriptionEnglish in sortBy and passes through valid params", async () => {
      const mockResult = {
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      };
      vi.mocked(getConstructionPaged).mockResolvedValue(mockResult);

      const result = await fetchConstructionPagedServerAction(
        1,
        10,
        "search",
        "descriptionEnglish",
        "asc"
      );

      expect(getConstructionPaged).toHaveBeenCalledWith(
        1,
        10,
        "search",
        "descriptionEnglish",
        "asc"
      );
      expect(result).toEqual(mockResult);
    });

    it("allows all whitelisted sort columns: constructionCode, description, searchSequence", async () => {
      vi.mocked(getConstructionPaged).mockResolvedValue({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      });

      await fetchConstructionPagedServerAction(1, 10, undefined, "constructionCode", "desc");
      expect(getConstructionPaged).toHaveBeenCalledWith(1, 10, undefined, "constructionCode", "desc");

      await fetchConstructionPagedServerAction(1, 10, undefined, "description", "ASC");
      expect(getConstructionPaged).toHaveBeenCalledWith(1, 10, undefined, "description", "asc");

      await fetchConstructionPagedServerAction(1, 10, undefined, "searchSequence", "desc");
      expect(getConstructionPaged).toHaveBeenCalledWith(1, 10, undefined, "searchSequence", "desc");
    });

    it("discards unwhitelisted sort columns and invalid sort orders", async () => {
      vi.mocked(getConstructionPaged).mockResolvedValue({
        items: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      });

      await fetchConstructionPagedServerAction(1, 10, undefined, "unsupportedColumn", "invalidOrder");
      expect(getConstructionPaged).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined);
    });

    it("throws ApiError for invalid pagination parameters", async () => {
      await expect(fetchConstructionPagedServerAction(-1, 10)).rejects.toThrow(ApiError);
      await expect(fetchConstructionPagedServerAction(1, 0)).rejects.toThrow(ApiError);
      await expect(fetchConstructionPagedServerAction(1, 101)).rejects.toThrow(ApiError);
      await expect(fetchConstructionPagedServerAction(10001, 10)).rejects.toThrow(ApiError);
    });
  });
});
