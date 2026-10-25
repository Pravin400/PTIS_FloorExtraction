import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOwningDepartmentsPaged,
  getOwningDepartmentById,
  createOwningDepartment,
  updateOwningDepartment,
  deleteOwningDepartment,
} from "@/lib/api/asset-masters/owning-department.service";
import { apiClient } from "@/services/api.service";
import { ApiError } from "@/lib/utils/api";
import type { OwningDepartmentFormModel } from "@/types/asset-masters/owning-department.types";

vi.mock("@/services/api.service", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("OwningDepartment API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOwningDepartmentsPaged", () => {
    it("should fetch paged owning departments and normalize them", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 1,
              owningDepartmentName: "PWD",
              description: "Public Works",
              isActive: true,
            },
          ],
        },
      });

      const result = await getOwningDepartmentsPaged(1, 10, "PWD", "name", "asc");
      expect(apiClient.get).toHaveBeenCalled();
      expect(result.items[0].owningDepartmentName).toBe("PWD");
    });

    it("should throw ApiError if get paged request fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 500,
      });

      await expect(getOwningDepartmentsPaged(1, 10)).rejects.toThrow(ApiError);
    });
  });

  describe("getOwningDepartmentById", () => {
    it("should fetch single owning department and normalize it", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: {
          id: 5,
          owningDepartmentName: "Health",
          description: "Public Health",
          isActive: false,
        },
      });

      const result = await getOwningDepartmentById(5);
      expect(result?.owningDepartmentName).toBe("Health");
    });

    it("should return null if API returns no data", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await getOwningDepartmentById(5);
      expect(result).toBeNull();
    });

    it("should throw ApiError if getById fails", async () => {
      vi.mocked(apiClient.get).mockResolvedValue({
        success: false,
        statusCode: 404,
      });

      await expect(getOwningDepartmentById(5)).rejects.toThrow(ApiError);
    });
  });

  describe("createOwningDepartment", () => {
    it("should post new record correctly", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const formModel: OwningDepartmentFormModel = {
        owningDepartmentName: "Estate",
        description: "Estate Dept",
        isActive: true,
        createdBy: 2,
      };

      await createOwningDepartment(formModel);
      expect(apiClient.post).toHaveBeenCalledWith("/OwningDepartment", {
        owningDepartmentName: "Estate",
        description: "Estate Dept",
        isActive: true,
        createdBy: 2,
      });
    });

    it("should throw ApiError if post request fails", async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ success: false, statusCode: 500 });
      await expect(
        createOwningDepartment({ owningDepartmentName: "a", description: "b", isActive: true })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("updateOwningDepartment", () => {
    it("should put updated record correctly", async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });

      const formModel: OwningDepartmentFormModel = {
        id: 10,
        owningDepartmentName: "Estate Updated",
        description: "Estate Dept Updated",
        isActive: true,
        updatedBy: 3,
      };

      await updateOwningDepartment(formModel);
      expect(apiClient.put).toHaveBeenCalledWith("/OwningDepartment/10", {
        id: 10,
        owningDepartmentName: "Estate Updated",
        description: "Estate Dept Updated",
        isActive: true,
        updatedBy: 3,
      });
    });

    it("should throw ApiError if ID is missing in update", async () => {
      await expect(
        updateOwningDepartment({ owningDepartmentName: "a", description: "b", isActive: true })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("deleteOwningDepartment", () => {
    it("should delete record correctly", async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ success: true });
      await deleteOwningDepartment(15);
      expect(apiClient.delete).toHaveBeenCalledWith("/OwningDepartment/15");
    });
  });
});
