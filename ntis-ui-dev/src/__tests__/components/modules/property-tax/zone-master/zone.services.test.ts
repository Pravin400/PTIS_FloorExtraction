import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getZones, getZoneById, createZone, updateZone, deleteZone } from "@/lib/api/zone.services";
import { ZoneItem, CreateZonePayload, UpdateZonePayload } from "@/types/zoneMaster.types";

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

describe("zone.services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("getZones", () => {
    const mockZonesResponse = {
      items: [
        { id: 1, zoneNo: "UT", description: "उथळसर", sequenceNo: null, isActive: true, createdDate: "2026-04-09", updatedDate: null },
        { id: 2, zoneNo: "NK", description: "नौपाडा", sequenceNo: null, isActive: true, createdDate: "2026-04-09", updatedDate: null },
      ],
      totalCount: 2,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    };

    it("fetches paginated zones successfully", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: mockZonesResponse,
      });

      const result = await getZones(1, 10);

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.items[0].zoneNo).toBe("UT");
    });

    it("includes search term in query params when provided", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: mockZonesResponse,
      });

      await getZones(1, 10, "UT");

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining("SearchTerm=UT")
      );
    });

    it("throws error on non-ok response", async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        error: "Failed to fetch zones",
      });

      await expect(getZones(1, 10)).rejects.toThrow("Get zones failed");
    });
  });

  describe("getZoneById", () => {
    const mockZone: ZoneItem = {
      id: 1,
      zoneNo: "UT",
      description: "उथळसर",
      sequenceNo: null,
      isActive: true,
      createdDate: "2026-04-09T10:59:28.577",
      updatedDate: null,
    };

    it("fetches single zone by id successfully", async () => {
      mockGet.mockResolvedValueOnce({
        success: true,
        data: mockZone,
      });

      const result = await getZoneById(1);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(1);
      expect(result!.zoneNo).toBe("UT");
      expect(result!.description).toBe("उथळसर");
    });

    it("returns null when zone not found", async () => {
      mockGet.mockResolvedValueOnce({
        success: false,
        error: "Zone not found",
      });

      const result = await getZoneById(999);
      expect(result).toBeNull();
    });
  });

  describe("createZone", () => {
    const mockCreatePayload: CreateZonePayload = {
      zoneNo: "WKD",
      description: "Wakad",
      sequenceNo: 66,
      isActive: true,
      createdBy: 0,
    };

    const mockCreateResponse = {
      success: true,
      message: "Record inserted successfully",
      items: {
        id: 10,
        zoneNo: "WKD",
        description: "Wakad",
        sequenceNo: 66,
        isActive: true,
        createdDate: "2026-04-29T12:57:14.6114114+05:30",
        updatedDate: null,
      },
      errors: null,
    };

    it("creates zone successfully", async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: mockCreateResponse,
      });

      const result = await createZone(mockCreatePayload);

      expect(result.success).toBe(true);
      expect(result.items?.zoneNo).toBe("WKD");
    });

    it("handles empty response body", async () => {
      mockPost.mockResolvedValueOnce({
        success: true,
        data: { success: true, message: "Created", items: null, errors: null },
      });

      const result = await createZone(mockCreatePayload);

      expect(result.success).toBe(true);
      expect(result.items).toBeNull();
    });

    it("throws error on failed creation", async () => {
      mockPost.mockResolvedValueOnce({
        success: false,
        error: "Zone already exists",
      });

      const result = await createZone(mockCreatePayload);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Zone already exists");
    });
  });

  describe("updateZone", () => {
    const mockUpdatePayload: UpdateZonePayload = {
      zoneNo: "WKDN",
      description: "Wakad new",
      sequenceNo: 65,
      isActive: true,
      updatedBy: 0,
    };

    const mockUpdateResponse = {
      success: true,
      message: "Record updated successfully",
      items: {
        id: 10,
        zoneNo: "WKDN",
        description: "Wakad new",
        sequenceNo: 65,
        isActive: true,
        createdDate: "2026-04-29T12:57:14.61",
        updatedDate: "2026-04-29T12:58:23.3866092+05:30",
      },
      errors: null,
    };

    it("updates zone successfully", async () => {
      mockPut.mockResolvedValueOnce({
        success: true,
        data: mockUpdateResponse,
      });

      const result = await updateZone(10, mockUpdatePayload);

      expect(result.success).toBe(true);
      expect(result.items?.zoneNo).toBe("WKDN");
    });

    it("throws error on failed update", async () => {
      mockPut.mockResolvedValueOnce({
        success: false,
        error: "Zone not found",
      });

      const result = await updateZone(999, mockUpdatePayload);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Zone not found");
    });
  });

  describe("deleteZone", () => {
    const mockDeleteResponse = {
      success: true,
      message: "Record permanently deleted",
      items: null,
      errors: null,
    };

    it("deletes zone successfully using /purge endpoint", async () => {
      mockDelete.mockResolvedValueOnce({
        success: true,
        data: mockDeleteResponse,
      });

      const result = await deleteZone(10);

      // Verify /purge endpoint is used
      expect(mockDelete).toHaveBeenCalledWith(
        expect.stringContaining("/Zone/10/purge")
      );
      expect(result.success).toBe(true);
    });

    it("handles empty response body on successful delete", async () => {
      mockDelete.mockResolvedValueOnce({
        success: true,
        data: { success: true, message: "Deleted", items: null, errors: null },
      });

      const result = await deleteZone(10);

      expect(result.success).toBe(true);
      expect(result.items).toBeNull();
    });

    it("throws error when zone is in use", async () => {
      mockDelete.mockResolvedValueOnce({
        success: false,
        error: "Zone is referenced by rate sections",
      });

      const result = await deleteZone(1);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Zone is referenced by rate sections");
    });

    it("throws error when zone has wards", async () => {
      mockDelete.mockResolvedValueOnce({
        success: false,
        error: "Cannot delete zone with associated wards",
      });

      const result = await deleteZone(1);
      expect(result.success).toBe(false);
      expect(result.message).toBe("Cannot delete zone with associated wards");
    });
  });
});
