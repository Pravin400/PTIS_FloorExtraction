import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getGstMastersPaged,
  getGstMasterById,
  createGstMaster,
  updateGstMaster,
  deleteGstMaster,
} from "@/lib/api/asset-masters/gst-master.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { GstMasterFormModel } from "@/types/asset-masters/gst-master.types";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("GstMaster API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGstMastersPaged", () => {
    it("should fetch paged GST records successfully and normalize them", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [
            {
              id: 1,
              taxCode: "GST-18",
              taxName: "GST 18%",
              taxPercentage: 18,
              isActive: true,
              effectiveFromDate: "2017-07-01T00:00:00",
              effectiveToDate: null,
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

      const result = await getGstMastersPaged(1, 10, "GST", "taxCode", "asc");

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining("/GST?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=GST&SortBy=taxCode&SortOrder=asc")
      );
      expect(result.items[0]).toEqual({
        id: 1,
        taxCode: "GST-18",
        taxName: "GST 18%",
        taxPercentage: 18,
        isActive: true,
        effectiveFromDate: "2017-07-01T00:00:00",
        effectiveToDate: null,
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

      await expect(getGstMastersPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getGstMasterById", () => {
    it("should fetch single GST record and normalize it", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          id: 2,
          taxCode: "GST-12",
          taxName: "GST 12%",
          taxPercentage: 12,
          isActive: false,
        },
      });

      const result = await getGstMasterById(2);

      expect(apiClient.get).toHaveBeenCalledWith("/GST/2");
      expect(result).toEqual({
        id: 2,
        taxCode: "GST-12",
        taxName: "GST 12%",
        taxPercentage: 12,
        isActive: false,
        effectiveFromDate: null,
        effectiveToDate: null,
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

      const result = await getGstMasterById(2);
      expect(result).toBeNull();
    });
  });

  describe("createGstMaster", () => {
    it("should post new record correctly", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const formModel: GstMasterFormModel = {
        taxCode: "GST-5",
        taxName: "GST 5%",
        taxPercentage: 5,
        effectiveFromDate: "2017-07-01",
        effectiveToDate: "2026-12-05",
        isActive: true,
        createdBy: 99,
      };

      await createGstMaster(formModel);

      expect(apiClient.post).toHaveBeenCalledWith("/GST", {
        taxCode: "GST-5",
        taxName: "GST 5%",
        taxPercentage: 5,
        effectiveFromDate: "2017-07-01",
        effectiveToDate: "2026-12-05",
        isActive: true,
        createdBy: 99,
      });
    });
  });

  describe("updateGstMaster", () => {
    it("should send PUT request correctly", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });

      const formModel: GstMasterFormModel = {
        id: 3,
        taxCode: "GST-5",
        taxName: "GST 5% Updated",
        taxPercentage: "5",
        effectiveFromDate: "2017-07-01",
        effectiveToDate: "2026-12-05",
        isActive: false,
        updatedBy: 100,
      };

      await updateGstMaster(formModel);

      expect(apiClient.put).toHaveBeenCalledWith("/GST/3", {
        id: 3,
        taxCode: "GST-5",
        taxName: "GST 5% Updated",
        taxPercentage: 5,
        effectiveFromDate: "2017-07-01",
        effectiveToDate: "2026-12-05",
        isActive: false,
        updatedBy: 100,
      });
    });
  });

  describe("deleteGstMaster", () => {
    it("should send DELETE request for correct ID", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });

      await deleteGstMaster(4);

      expect(apiClient.delete).toHaveBeenCalledWith("/GST/4");
    });
  });
});
