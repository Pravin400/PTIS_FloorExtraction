import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getWaterRatesPaged,
  getWaterRateById,
  createWaterRate,
  updateWaterRate,
  deleteWaterRate,
} from "@/lib/api/water-connection-master/water-rate-master.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

describe("Water Rate Master Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockItem = {
    id: 1,
    waterConnectionTypeId: 1,
    connectionTypeName: "Domestic",
    waterConnectionSizeId: 2,
    connectionSizeDisplay: "15mm",
    financeYearId: 3,
    yearCode: "2024-25",
    yearlyRate: 1500,
    isActive: true,
  };

  const mockResponsePaged = {
    items: [mockItem],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 10,
    totalPages: 1,
  };

  describe("getWaterRatesPaged", () => {
    it("should call apiClient.get with correct endpoint and return paged response", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: mockResponsePaged,
      });

      const result = await getWaterRatesPaged(1, 10, "Domestic");

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/WaterRateMaster?PageNumber=1&PageSize=10&SearchTerm=Domestic")
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].yearlyRate).toBe(1500);
    });

    it("should throw ApiError when response is not successful", async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        statusCode: 500,
        error: "Server Error",
      });

      await expect(getWaterRatesPaged(1, 10)).rejects.toThrow(ApiError);
    });

    it("should fallback to rate property in normalizeWaterRate", async () => {
      const itemWithAlternateKeys = {
        id: 1,
        waterConnectionTypeId: 1,
        connectionTypeName: "Domestic",
        waterConnectionSizeId: 2,
        connectionSizeDisplay: "15mm",
        financeYearId: 3,
        yearCode: "2024-25",
        rate: 2000,
        isActive: true,
      };

      mockGet.mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: {
          items: [itemWithAlternateKeys],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      const result = await getWaterRatesPaged(1, 10);
      expect(result.items[0].yearlyRate).toBe(2000);
    });
  });

  describe("getWaterRateById", () => {
    it("should call apiClient.get and return normalized item", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: mockItem,
      });

      const result = await getWaterRateById(1);

      expect(apiClient.get).toHaveBeenCalledWith("/WaterRateMaster/1");
      expect(result.yearlyRate).toBe(1500);
    });

    it("should throw ApiError when response data is missing", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: null,
      });

      await expect(getWaterRateById(1)).rejects.toThrow(ApiError);
    });
  });

  describe("createWaterRate", () => {
    it("should call apiClient.post and return normalized created item", async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        statusCode: 201,
        data: mockItem,
      });

      const formInput = {
        waterConnectionTypeId: 1,
        waterConnectionSizeId: 2,
        financeYearId: 3,
        yearlyRate: 1500,
        isActive: true,
      };

      const result = await createWaterRate(formInput, 123);

      expect(apiClient.post).toHaveBeenCalledWith(
        "/WaterRateMaster",
        expect.objectContaining({
          waterConnectionTypeId: 1,
          waterConnectionSizeId: 2,
          financeYearId: 3,
          yearlyRate: 1500,
          rate: 1500,
          isActive: true,
          createdBy: 123,
        })
      );
      expect(result.yearlyRate).toBe(1500);
    });
  });

  describe("updateWaterRate", () => {
    it("should call apiClient.put and return normalized updated item", async () => {
      mockPut.mockResolvedValueOnce({
        success: true,
        statusCode: 200,
        data: mockItem,
      });

      const formInput = {
        id: 1,
        waterConnectionTypeId: 1,
        waterConnectionSizeId: 2,
        financeYearId: 3,
        yearlyRate: 1500,
        isActive: true,
      };

      const result = await updateWaterRate(1, formInput, 123);

      expect(apiClient.put).toHaveBeenCalledWith(
        "/WaterRateMaster/1",
        expect.objectContaining({
          id: 1,
          waterConnectionTypeId: 1,
          waterConnectionSizeId: 2,
          financeYearId: 3,
          yearlyRate: 1500,
          rate: 1500,
          isActive: true,
          updatedBy: 123,
        })
      );
      expect(result.yearlyRate).toBe(1500);
    });
  });

  describe("deleteWaterRate", () => {
    it("should call apiClient.delete", async () => {
      mockDelete.mockResolvedValueOnce({
        success: true,
        statusCode: 200,
      });

      await deleteWaterRate(1, 123);

      expect(apiClient.delete).toHaveBeenCalledWith("/WaterRateMaster/1/purge");
    });
  });
});
