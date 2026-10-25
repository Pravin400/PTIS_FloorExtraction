import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPenaltyRulesPaged,
  getPenaltyRuleById,
  createPenaltyRule,
  updatePenaltyRule,
  deletePenaltyRule,
} from "@/lib/api/asset-masters/penalty-rule-master.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { PenaltyRuleFormModel } from "@/types/asset-masters/penalty-rule-master.types";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("PenaltyRuleMaster API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPenaltyRulesPaged", () => {
    it("should fetch paged penalty rules successfully and normalize them", async () => {
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
          hasPrevious: false,
          hasNext: false,
        },
      };

      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getPenaltyRulesPaged(1, 10, "LATE", "penaltyCode", "asc");

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/PenaltyRule?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=LATE&SortBy=penaltyCode&SortOrder=asc")
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

    it("should throw ApiError if the api request fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 400,
        error: "Bad Request",
      });

      await expect(getPenaltyRulesPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getPenaltyRuleById", () => {
    it("should fetch single penalty rule and normalize it", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          id: 2,
          penaltyCode: "FLAT_FEE",
          penaltyName: "Flat Fee",
          calculationType: "FlatAmount",
          penaltyValue: 100,
          gracePeriodDays: 2,
          isActive: false,
        },
      });

      const result = await getPenaltyRuleById(2);

      expect(apiClient.get).toHaveBeenCalledWith("/PenaltyRule/2");
      expect(result).toEqual({
        id: 2,
        penaltyCode: "FLAT_FEE",
        penaltyName: "Flat Fee",
        calculationType: "FlatAmount",
        penaltyValue: 100,
        gracePeriodDays: 2,
        isActive: false,
        createdDate: null,
        updatedDate: null,
        createdBy: null,
        updatedBy: null,
      });
    });

    it("should return null if API returns no data", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await getPenaltyRuleById(2);
      expect(result).toBeNull();
    });

    it("should throw ApiError if get by id fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 404,
        error: "Not Found",
      });

      await expect(getPenaltyRuleById(2)).rejects.toThrow(ApiError);
    });
  });

  describe("createPenaltyRule", () => {
    it("should post new record correctly", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const formModel: PenaltyRuleFormModel = {
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
        createdBy: 99,
      };

      await createPenaltyRule(formModel);

      expect(apiClient.post).toHaveBeenCalledWith("/PenaltyRule", {
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
        createdBy: 99,
      });
    });

    it("should throw ApiError if post request fails", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Internal Server Error",
      });

      const formModel: PenaltyRuleFormModel = {
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
      };

      await expect(createPenaltyRule(formModel)).rejects.toThrow(ApiError);
    });
  });

  describe("updatePenaltyRule", () => {
    it("should send PUT request correctly", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });

      const formModel: PenaltyRuleFormModel = {
        id: 3,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent Updated",
        calculationType: "Percentage",
        penaltyValue: "15",
        gracePeriodDays: "3",
        isActive: false,
        updatedBy: 100,
      };

      await updatePenaltyRule(formModel);

      expect(apiClient.put).toHaveBeenCalledWith("/PenaltyRule/3", {
        id: 3,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent Updated",
        calculationType: "Percentage",
        penaltyValue: 15,
        gracePeriodDays: 3,
        isActive: false,
        updatedBy: 100,
      });
    });

    it("should throw ApiError if ID is missing in update", async () => {
      const formModel: PenaltyRuleFormModel = {
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent",
        calculationType: "Percentage",
        penaltyValue: 10,
        gracePeriodDays: 5,
        isActive: true,
      };

      await expect(updatePenaltyRule(formModel)).rejects.toThrow(ApiError);
    });

    it("should throw ApiError if PUT request fails", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Internal Server Error",
      });

      const formModel: PenaltyRuleFormModel = {
        id: 3,
        penaltyCode: "LATE_RENT",
        penaltyName: "Late Rent Updated",
        calculationType: "Percentage",
        penaltyValue: 15,
        gracePeriodDays: 3,
        isActive: false,
      };

      await expect(updatePenaltyRule(formModel)).rejects.toThrow(ApiError);
    });
  });

  describe("deletePenaltyRule", () => {
    it("should send DELETE request for correct ID", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      await deletePenaltyRule(4);

      expect(apiClient.delete).toHaveBeenCalledWith("/PenaltyRule/4");
    });

    it("should throw ApiError if delete request fails", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({
        success: false,
        statusCode: 500,
        error: "Internal Server Error",
      });

      await expect(deletePenaltyRule(4)).rejects.toThrow(ApiError);
    });
  });
});
