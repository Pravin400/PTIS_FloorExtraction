import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getWards, getWardById, createWard, updateWard, deleteWard, createWardBatch, createWardRange, bulkUpdateWards } from "@/lib/api/ward.services";
import { WardItem, CreateWardPayload, UpdateWardPayload, BatchWardCreatePayload, BatchRangeWardCreatePayload, BulkWardUpdateItem } from "@/types/wardMaster.types";

// Mock apiClient
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockGet(...args),
    post: (...args: unknown[]) => mockPost(...args),
    put: (...args: unknown[]) => mockPut(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

describe("ward.services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getWards", () => {
    const mockWardsResponse = {
      items: [
        { id: 1, wardNo: "UT1", zoneId: 1, description: "UT1", sequenceNo: null, isActive: true, createdDate: "2026-04-09", updatedDate: null },
        { id: 2, wardNo: "UT2", zoneId: 1, description: "UT2", sequenceNo: null, isActive: true, createdDate: "2026-04-09", updatedDate: null },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: true,
    };

    it("fetches paginated wards successfully", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: mockWardsResponse,
      });

      const result = await getWards(1, 10);

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.items[0].wardNo).toBe("UT1");
    });

    it("includes zone filter in query params when provided", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: mockWardsResponse,
      });

      await getWards(1, 10, undefined, 1);

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("ZoneId=1")
      );
    });

    it("includes search term in query params when provided", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: mockWardsResponse,
      });

      await getWards(1, 10, "UT1");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("SearchTerm=UT1")
      );
    });

    it("throws ApiError on failed fetch", async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        error: "Network error",
      });

      await expect(getWards(1, 10)).rejects.toThrow("Get wards failed");
    });
  });

  describe("getWardById", () => {
    const mockWard: WardItem = {
      id: 1,
      wardNo: "UT1",
      zoneId: 1,
      description: "UT1",
      sequenceNo: null,
      isActive: true,
      createdDate: "2026-04-09T10:59:28.6",
      updatedDate: null,
    };

    it("fetches single ward by id successfully", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: mockWard,
      });

      const result = await getWardById(1);

      expect(result?.id).toBe(1);
      expect(result?.wardNo).toBe("UT1");
      expect(result?.zoneId).toBe(1);
    });

    it("returns null when ward not found", async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        error: "Not found",
      });

      const result = await getWardById(999);

      expect(result).toBeNull();
    });
  });

  describe("createWard", () => {
    const mockCreatePayload: CreateWardPayload = {
      wardNo: "wkd12",
      zoneId: 11,
      description: "wakad 12",
      sequenceNo: 87,
      isActive: true,
      createdBy: 0,
    };

    const mockCreateResponse = {
      success: true,
      message: "Record inserted successfully",
      items: {
        id: 106,
        wardNo: "wkd12",
        zoneId: 11,
        description: "wakad 12",
        sequenceNo: 87,
        isActive: true,
        createdDate: "2026-04-29T13:05:26.3146278+05:30",
        updatedDate: null,
      },
      errors: null,
    };

    it("creates ward successfully", async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: mockCreateResponse,
      });

      const result = await createWard(mockCreatePayload);

      expect(result.success).toBe(true);
      expect(result.items?.wardNo).toBe("wkd12");
    });

    it("returns error response on failed creation", async () => {
      mockPost.mockResolvedValueOnce({
        success: false,
        error: "Ward already exists",
      });

      const result = await createWard(mockCreatePayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Ward already exists");
    });
  });

  describe("updateWard", () => {
    const mockUpdatePayload: UpdateWardPayload = {
      wardNo: "wkd21",
      zoneId: 11,
      description: "wakad 21",
      sequenceNo: 33,
      isActive: true,
      updatedBy: 0,
    };

    const mockUpdateResponse = {
      success: true,
      message: "Record updated successfully",
      items: {
        id: 106,
        wardNo: "wkd21",
        zoneId: 11,
        description: "wakad 21",
        sequenceNo: 33,
        isActive: true,
        createdDate: "2026-04-29T13:05:26.313",
        updatedDate: "2026-04-29T13:10:06.7802033+05:30",
      },
      errors: null,
    };

    it("updates ward successfully", async () => {
      mockPut.mockResolvedValueOnce({
        success: true,
        data: mockUpdateResponse,
      });

      const result = await updateWard(106, mockUpdatePayload);

      expect(result.success).toBe(true);
      expect(result.items?.wardNo).toBe("wkd21");
    });

    it("returns error response on failed update", async () => {
      mockPut.mockResolvedValueOnce({
        success: false,
        error: "Ward not found",
      });

      const result = await updateWard(999, mockUpdatePayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Ward not found");
    });
  });

  describe("deleteWard", () => {
    const mockDeleteResponse = {
      success: true,
      message: "Record permanently deleted",
      items: null,
      errors: null,
    };

    it("deletes ward successfully using /purge endpoint", async () => {
      mockDelete.mockResolvedValueOnce({
        success: true,
        data: mockDeleteResponse,
      });

      const result = await deleteWard(108);

      // Verify /purge endpoint is used
      expect(mockDelete).toHaveBeenCalledWith("/Ward/108/purge");
      expect(result.success).toBe(true);
    });

    it("handles 204 No Content response", async () => {
      mockDelete.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });

      const result = await deleteWard(108);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Ward deleted successfully");
    });

    it("returns error response when ward is in use", async () => {
      mockDelete.mockResolvedValueOnce({
        success: false,
        error: "Ward is assigned to rate sections",
      });

      const result = await deleteWard(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Ward is assigned to rate sections");
    });
  });

  describe("createWardBatch", () => {
    const mockBatchPayload: BatchWardCreatePayload = {
      fromValue: "DI15",
      toValue: "DI24",
      rangePropertyName: "wardno,description",
      template: {
        isActive: true,
        createdBy: 0,
        wardNo: "null",
        zoneId: 5,
        description: "",
      },
    };

    const mockBatchResponse = {
      success: true,
      message: "10 records created successfully",
      items: {
        successCount: 10,
        failedCount: 0,
        results: [
          { id: 11, wardNo: "DI15", zoneId: 5, description: "DI15", sequenceNo: null, isActive: true, createdDate: "2026-04-29", updatedDate: null },
          { id: 12, wardNo: "DI16", zoneId: 5, description: "DI16", sequenceNo: null, isActive: true, createdDate: "2026-04-29", updatedDate: null },
        ],
        errors: null,
        hasFailures: false,
        allSucceeded: true,
      },
      errors: null,
    };

    it("creates wards in batch successfully", async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: mockBatchResponse,
      });

      const result = await createWardBatch(mockBatchPayload);

      expect(result.success).toBe(true);
      expect(result.items?.successCount).toBe(10);
      expect(result.items?.allSucceeded).toBe(true);
    });

    it("returns error response on failed batch creation", async () => {
      mockPost.mockResolvedValueOnce({
        success: false,
        error: "Some wards already exist",
      });

      const result = await createWardBatch(mockBatchPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Some wards already exist");
    });
  });

  describe("createWardRange", () => {
    const mockRangePayload: BatchRangeWardCreatePayload = {
      rangeFrom: "40",
      rangeTo: "44",
      prefix: "wkd",
      suffix: "",
      startSequenceNo: 0,
      template: {
        isActive: true,
        createdBy: 0,
        wardNo: "string",
        zoneId: 11,
        description: "",
      },
    };

    const mockRangeResponse = {
      success: true,
      message: "5 records created successfully",
      items: {
        successCount: 5,
        failedCount: 0,
        results: [
          { id: 201, wardNo: "wkd40", zoneId: 11, description: "wkd40", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
          { id: 202, wardNo: "wkd41", zoneId: 11, description: "wkd41", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
          { id: 203, wardNo: "wkd42", zoneId: 11, description: "wkd42", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
          { id: 204, wardNo: "wkd43", zoneId: 11, description: "wkd43", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
          { id: 205, wardNo: "wkd44", zoneId: 11, description: "wkd44", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
        ],
        errors: null,
        hasFailures: false,
        allSucceeded: true,
      },
      errors: null,
    };

    it("creates wards in range successfully", async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: mockRangeResponse,
      });

      const result = await createWardRange(mockRangePayload);

      expect(result.success).toBe(true);
      expect(result.items?.successCount).toBe(5);
      expect(result.items?.allSucceeded).toBe(true);
      expect(mockPost).toHaveBeenCalledWith("/Ward/Range", mockRangePayload);
    });

    it("returns error response on failed range creation", async () => {
      mockPost.mockResolvedValueOnce({
        success: false,
        error: "Failed to create wards in range",
      });

      const result = await createWardRange(mockRangePayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to create wards in range");
    });

    it("handles partial success with failures", async () => {
      const partialSuccessResponse = {
        success: true,
        message: "3 records created, 2 failed",
        items: {
          successCount: 3,
          failedCount: 2,
          results: [
            { id: 201, wardNo: "wkd40", zoneId: 11, description: "wkd40", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
            { id: 202, wardNo: "wkd41", zoneId: 11, description: "wkd41", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
            { id: 203, wardNo: "wkd42", zoneId: 11, description: "wkd42", sequenceNo: null, isActive: true, createdDate: "2026-05-05", updatedDate: null },
          ],
          errors: ["wkd43 already exists", "wkd44 already exists"],
          hasFailures: true,
          allSucceeded: false,
        },
        errors: null,
      };

      mockPost.mockResolvedValueOnce({
        success: true,
        data: partialSuccessResponse,
      });

      const result = await createWardRange(mockRangePayload);

      expect(result.success).toBe(true);
      expect(result.items?.successCount).toBe(3);
      expect(result.items?.failedCount).toBe(2);
      expect(result.items?.allSucceeded).toBe(false);
      expect(result.items?.hasFailures).toBe(true);
    });
  });

  describe("bulkUpdateWards", () => {
    const mockBulkPayload: BulkWardUpdateItem[] = [
      {
        id: 14,
        data: {
          isActive: true,
          updatedBy: 11,
          wardNo: "KL12",
          zoneId: 4,
          description: "KL12",
          sequenceNo: 2,
        }
      },
      {
        id: 15,
        data: {
          isActive: true,
          updatedBy: 11,
          wardNo: "KL13",
          zoneId: 4,
          description: "KL13",
          sequenceNo: 3,
        }
      }
    ];

    const mockBulkResponse = {
      success: true,
      message: "2 records updated, 0 failed",
      items: {
        successCount: 2,
        failedCount: 0,
        results: [
          { id: 14, wardNo: "KL12", zoneId: 4, description: "KL12", sequenceNo: 2, isActive: true, createdDate: "2026-04-09T10:59:28.6", updatedDate: "2026-05-05T11:01:48.4418479+05:30" },
          { id: 15, wardNo: "KL13", zoneId: 4, description: "KL13", sequenceNo: 3, isActive: true, createdDate: "2026-04-09T10:59:28.6", updatedDate: "2026-05-05T11:01:48.4435849+05:30" },
        ],
        errors: null,
        hasFailures: false,
        allSucceeded: true,
      },
      errors: null,
    };

    it("bulk updates wards successfully", async () => {
      mockPut.mockResolvedValueOnce({
        success: true,
        data: mockBulkResponse,
      });

      const result = await bulkUpdateWards(mockBulkPayload);

      expect(result.success).toBe(true);
      expect(result.items?.successCount).toBe(2);
      expect(result.items?.allSucceeded).toBe(true);
      expect(mockPut).toHaveBeenCalledWith("/Ward/Bulk", mockBulkPayload);
    });

    it("returns error response on failed bulk update", async () => {
      mockPut.mockResolvedValueOnce({
        success: false,
        error: "Failed to update wards",
      });

      const result = await bulkUpdateWards(mockBulkPayload);

      expect(result.success).toBe(false);
      expect(result.message).toBe("Failed to update wards");
    });
  });
});
