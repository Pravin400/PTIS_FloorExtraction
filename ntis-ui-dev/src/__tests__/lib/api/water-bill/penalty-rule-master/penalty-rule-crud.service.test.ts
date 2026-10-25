import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPenaltyRulesPaged,
  getPenaltyRuleById,
  createPenaltyRule,
  updatePenaltyRule,
  deletePenaltyRule,
} from "@/lib/api/water-bill/penalty-rule-master/penalty-rule.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PenaltyRuleFormModel } from "@/types/water-bill/penalty-rule-master.types";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("WaterBill penalty-rule.service facade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPenaltyRulesPaged", () => {
    it("fetches paged penalty rules and normalizes items", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              penaltyCode: "LATE_RENT",
              penaltyName: "Late Rent",
              calculationType: "Percentage",
              penaltyValue: 10,
              gracePeriodDays: 5,
              isActive: true,
            },
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getPenaltyRulesPaged(1, 10, "LATE", "penaltyCode", "asc");

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/PenaltyRuleMaster?PageNumber=1&PageSize=10&SearchTerm=LATE&SortBy=penaltyCode&SortOrder=asc")
      );
      expect(result.items[0]).toEqual({
        id: 1,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
        createdDate: null,
        updatedDate: null,
        createdBy: null,
        updatedBy: null,
      });
    });

    it("throws ApiError when response is unsuccessful", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Server Error",
      });

      await expect(getPenaltyRulesPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getPenaltyRuleById", () => {
    it("fetches single penalty rule by ID", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          id: 5,
          penaltyCode: "CODE_05",
          penaltyName: "Name 05",
          calculationType: "FlatAmount",
          penaltyValue: 500,
          gracePeriodDays: 0,
          isActive: true,
        },
      });

      const result = await getPenaltyRuleById(5);
      expect(result?.id).toBe(5);
      expect(result?.penaltyCode).toBe("CODE_05");
    });

    it("throws ApiError if id is invalid", async () => {
      await expect(getPenaltyRuleById(0)).rejects.toThrow(ApiError);
    });
  });

  describe("createPenaltyRule", () => {
    it("posts payload to api", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true, statusCode: 200, data: {} });

      const model: PenaltyRuleFormModel = {
        penaltyCode: "CODE_01",
        penaltyName: "Rule 01",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
      };

      await createPenaltyRule(model);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/PenaltyRuleMaster",
        expect.objectContaining({
          penaltyCode: "CODE_01",
          penaltyName: "Rule 01",
          calculationType: "Percentage",
          penaltyValue: 10,
          gracePeriodDays: 5,
          isActive: true,
        })
      );
    });
  });

  describe("updatePenaltyRule", () => {
    it("puts payload to api", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true, statusCode: 200, data: {} });

      const model: PenaltyRuleFormModel = {
        id: 12,
        penaltyCode: "CODE_01",
        penaltyName: "Rule 01",
        calculationType: "FlatAmount",
        penaltyValue: 100,
        gracePeriodDays: 0,
        isActive: true,
      };

      await updatePenaltyRule(model);
      expect(apiClient.put).toHaveBeenCalledWith(
        "/PenaltyRuleMaster/12",
        expect.objectContaining({
          id: 12,
          penaltyCode: "CODE_01",
        })
      );
    });
  });

  describe("deletePenaltyRule", () => {
    it("calls delete on api", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true, statusCode: 200, data: undefined });

      await deletePenaltyRule(7);
      expect(apiClient.delete).toHaveBeenCalledWith("/PenaltyRuleMaster/7");
    });
  });
});
