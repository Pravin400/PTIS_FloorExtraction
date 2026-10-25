import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMoujasPaged,
  getMoujasAllActive,
  getMoujaById,
  createMouja,
  updateMouja,
  deleteMouja,
  getSubZonesPaged,
  getSubZoneById,
  createSubZone,
  updateSubZone,
  deleteSubZone,
} from "@/lib/api/asset-masters/mouja-subzone.service";
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

describe("Mouja & SubZone API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMoujasPaged", () => {
    it("should fetch paged Moujas successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, moujaNo: "M1", moujaName: "Mouja 1", isActive: true }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getMoujasPaged(1, 10, "query", "moujaNo", "asc");
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/mouja?PageNumber=1&PageSize=10&MarkedForDeletion=false&SearchTerm=query&SortBy=moujaNo&SortOrder=asc");
      expect(result).toEqual(mockApiResponse.data);
    });
  });

  describe("getMoujasAllActive", () => {
    it("should fetch active Moujas successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, moujaNo: "M1", moujaName: "Mouja 1", isActive: true }],
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getMoujasAllActive();
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/mouja?PageNumber=1&PageSize=-1&IsActive=true&MarkedForDeletion=false");
      expect(result).toEqual(mockApiResponse.data.items);
    });
  });

  describe("getMoujaById", () => {
    it("should fetch single Mouja by ID successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { id: 1025, moujaNo: "M1", moujaName: "Mouja 1", isActive: true },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getMoujaById(1025);
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/mouja/1025");
      expect(result).toEqual(mockApiResponse.data);
    });

    it("should throw error for invalid id", async () => {
      await expect(getMoujaById(0)).rejects.toThrow(ApiError);
    });
  });

  describe("createMouja", () => {
    it("should create Mouja successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "Created successfully" },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse);

      const payload = {
        moujaNo: "M1",
        moujaName: "Mouja 1",
        isActive: true,
      };

      const result = await createMouja(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/mouja", {
        ...payload,
        createdBy: null,
      });
      expect(result).toBe("Created successfully");
    });
  });

  describe("updateMouja", () => {
    it("should update Mouja successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "Updated successfully" },
      };
      vi.mocked(apiClient.put).mockResolvedValue(mockApiResponse);

      const payload = {
        id: 1,
        moujaNo: "M1",
        moujaName: "Mouja 1 Updated",
        isActive: true,
      };

      const result = await updateMouja(payload);
      expect(apiClient.put).toHaveBeenCalledWith("/asset-management/mouja/1", {
        ...payload,
        updatedBy: null,
      });
      expect(result).toBe("Updated successfully");
    });
  });

  describe("deleteMouja", () => {
    it("should delete Mouja successfully", async () => {
      const mockApiResponse = { success: true };
      vi.mocked(apiClient.delete).mockResolvedValue(mockApiResponse);

      await deleteMouja(1);
      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/mouja/1");
    });

    it("should throw error for invalid deletion id", async () => {
      await expect(deleteMouja(0)).rejects.toThrow(ApiError);
    });
  });

  describe("getSubZonesPaged", () => {
    it("should fetch paged SubZones successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: {
          items: [{ id: 1, moujaId: 1025, subZoneNo: "S1", subZoneName: "SubZone 1", isActive: true }],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
          hasPrevious: false,
          hasNext: false,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getSubZonesPaged(1, 10, 1025, "query", "subZoneNo", "asc");
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/sub-zone-details-cv?PageNumber=1&PageSize=10&MarkedForDeletion=false&MoujaId=1025&SearchTerm=query&SortBy=subZoneNo&SortOrder=asc");
      expect(result).toEqual(mockApiResponse.data);
    });
  });

  describe("getSubZoneById", () => {
    it("should fetch SubZone by ID successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { id: 10, moujaId: 1025, subZoneNo: "S1", subZoneName: "SubZone 1", isActive: true },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockApiResponse);

      const result = await getSubZoneById(10);
      expect(apiClient.get).toHaveBeenCalledWith("/asset-management/sub-zone-details-cv/10");
      expect(result).toEqual(mockApiResponse.data);
    });

    it("should throw error for invalid SubZone ID", async () => {
      await expect(getSubZoneById(0)).rejects.toThrow(ApiError);
    });
  });

  describe("createSubZone", () => {
    it("should create SubZone successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "SubZone created successfully" },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockApiResponse);

      const payload = {
        moujaId: 1025,
        subZoneNo: "SZ-01",
        subZoneName: "SubZone 1",
        isActive: true,
      };

      const result = await createSubZone(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/asset-management/sub-zone-details-cv", {
        ...payload,
        createdBy: null,
      });
      expect(result).toBe("SubZone created successfully");
    });
  });

  describe("updateSubZone", () => {
    it("should update SubZone successfully", async () => {
      const mockApiResponse = {
        success: true,
        data: { message: "SubZone updated successfully" },
      };
      vi.mocked(apiClient.put).mockResolvedValue(mockApiResponse);

      const payload = {
        id: 10,
        moujaId: 1025,
        subZoneNo: "SZ-01",
        subZoneName: "SubZone 1 Updated",
        isActive: true,
      };

      const result = await updateSubZone(payload);
      expect(apiClient.put).toHaveBeenCalledWith("/asset-management/sub-zone-details-cv/10", {
        ...payload,
        updatedBy: null,
      });
      expect(result).toBe("SubZone updated successfully");
    });
  });

  describe("deleteSubZone", () => {
    it("should delete SubZone successfully", async () => {
      const mockApiResponse = { success: true };
      vi.mocked(apiClient.delete).mockResolvedValue(mockApiResponse);

      await deleteSubZone(10);
      expect(apiClient.delete).toHaveBeenCalledWith("/asset-management/sub-zone-details-cv/10");
    });

    it("should throw error for invalid SubZone deletion ID", async () => {
      await expect(deleteSubZone(0)).rejects.toThrow(ApiError);
    });
  });
});
