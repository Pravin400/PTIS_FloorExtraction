import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AssessmentYearRangeConfig, AssessmentYearRangeFormModel } from "@/types/assessment-year-range.types";

// Mock the API client
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

vi.mock("@/lib/utils/api", () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;
    responseText: string;
    constructor(statusCode: number, responseText: string, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.responseText = responseText;
    }
  },
}));

import {
  getAssessmentYearRangePaged,
  getAssessmentYearRangeById,
  createAssessmentYearRange,
  updateAssessmentYearRange,
  deleteAssessmentYearRange,
} from "@/lib/api/assessment-year-range.service";

describe("Assessment Year Range Service", () => {
  const mockConfig: AssessmentYearRangeConfig = {
    type: "RV",
    endpoint: "AssessmentYearRange",
    idField: "id",
    routePath: "/property-tax/assessment-year-range/rateablevalue",
    translationNamespace: "assessmentYearRange.rateableValue",
  };

  const mockPagedResponse = {
    success: true,
    data: {
      items: [
        {
          id: 1,
          fromYear: 2020,
          toYear: 2025,
          isActive: true,
          createdDate: "2026-01-01",
          updatedDate: null,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAssessmentYearRangePaged", () => {
    it("fetches paginated data successfully", async () => {
      mockGet.mockResolvedValue(mockPagedResponse);

      const result = await getAssessmentYearRangePaged(mockConfig, 1, 10);

      expect(mockGet).toHaveBeenCalledWith("/AssessmentYearRange?PageNumber=1&PageSize=10");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].fromYear).toBe(2020);
    });

    it("throws error for invalid pagination parameters", async () => {
      await expect(getAssessmentYearRangePaged(mockConfig, -1, 10)).rejects.toThrow();
      await expect(getAssessmentYearRangePaged(mockConfig, 1, 0)).rejects.toThrow();
      await expect(getAssessmentYearRangePaged(mockConfig, 1, 101)).rejects.toThrow();
    });

    it("throws error when API returns unsuccessful response", async () => {
      mockGet.mockResolvedValue({ success: false, error: "Server error" });

      await expect(getAssessmentYearRangePaged(mockConfig, 1, 10)).rejects.toThrow();
    });
  });

  describe("getAssessmentYearRangeById", () => {
    const mockSingleResponse = {
      success: true,
      data: {
        id: 1,
        fromYear: 2020,
        toYear: 2025,
        isActive: true,
        createdDate: "2026-01-01",
        updatedDate: null,
      },
    };

    it("fetches single record successfully", async () => {
      mockGet.mockResolvedValue(mockSingleResponse);

      const result = await getAssessmentYearRangeById(mockConfig, 1);

      expect(mockGet).toHaveBeenCalledWith("/AssessmentYearRange/1");
      expect(result?.fromYear).toBe(2020);
    });

    it("throws error for invalid ID", async () => {
      await expect(getAssessmentYearRangeById(mockConfig, 0)).rejects.toThrow();
      await expect(getAssessmentYearRangeById(mockConfig, -1)).rejects.toThrow();
    });

    it("returns null when no data returned", async () => {
      mockGet.mockResolvedValue({ success: true, data: null });

      const result = await getAssessmentYearRangeById(mockConfig, 999);
      expect(result).toBeNull();
    });
  });

  describe("createAssessmentYearRange", () => {
    const mockFormData: AssessmentYearRangeFormModel = {
      fromYear: 2020,
      toYear: 2025,
      isActive: true,
    };

    it("creates record successfully", async () => {
      mockPost.mockResolvedValue({ success: true });

      await createAssessmentYearRange(mockConfig, mockFormData);

      expect(mockPost).toHaveBeenCalledWith("/AssessmentYearRange", expect.objectContaining({
        fromYear: 2020,
        toYear: 2025,
        isActive: true,
      }));
    });

    it("throws error for invalid year range", async () => {
      await expect(
        createAssessmentYearRange(mockConfig, { ...mockFormData, fromYear: 1699 })
      ).rejects.toThrow();

      await expect(
        createAssessmentYearRange(mockConfig, { ...mockFormData, toYear: 2101 })
      ).rejects.toThrow();
    });

    it("throws error when fromYear is greater than toYear", async () => {
      await expect(
        createAssessmentYearRange(mockConfig, { ...mockFormData, fromYear: 2026, toYear: 2020 })
      ).rejects.toThrow();
    });

    it("throws error when API returns unsuccessful response", async () => {
      mockPost.mockResolvedValue({ success: false, error: "Duplicate entry" });

      await expect(createAssessmentYearRange(mockConfig, mockFormData)).rejects.toThrow();
    });
  });

  describe("updateAssessmentYearRange", () => {
    const mockFormData: AssessmentYearRangeFormModel = {
      id: 1,
      fromYear: 2020,
      toYear: 2025,
      isActive: true,
    };

    it("updates record successfully", async () => {
      mockPut.mockResolvedValue({ success: true });

      await updateAssessmentYearRange(mockConfig, mockFormData);

      expect(mockPut).toHaveBeenCalledWith("/AssessmentYearRange/1", expect.objectContaining({
        id: 1,
        fromYear: 2020,
        toYear: 2025,
        isActive: true,
      }));
    });

    it("throws error when ID is missing", async () => {
      await expect(
        updateAssessmentYearRange(mockConfig, { ...mockFormData, id: undefined })
      ).rejects.toThrow();
    });

    it("throws error when ID is invalid", async () => {
      await expect(
        updateAssessmentYearRange(mockConfig, { ...mockFormData, id: 0 })
      ).rejects.toThrow();
    });

    it("throws error when API returns unsuccessful response", async () => {
      mockPut.mockResolvedValue({ success: false, error: "Not found" });

      await expect(updateAssessmentYearRange(mockConfig, mockFormData)).rejects.toThrow();
    });
  });

  describe("deleteAssessmentYearRange", () => {
    it("deletes record successfully", async () => {
      mockDelete.mockResolvedValue({ success: true });

      await deleteAssessmentYearRange(mockConfig, 1);

      expect(mockDelete).toHaveBeenCalledWith("/AssessmentYearRange/1/purge");
    });

    it("throws error for invalid ID", async () => {
      await expect(deleteAssessmentYearRange(mockConfig, 0)).rejects.toThrow();
      await expect(deleteAssessmentYearRange(mockConfig, -1)).rejects.toThrow();
    });

    it("throws error when API returns unsuccessful response", async () => {
      mockDelete.mockResolvedValue({ success: false, error: "Record in use" });

      await expect(deleteAssessmentYearRange(mockConfig, 1)).rejects.toThrow();
    });
  });

  describe("CV Configuration", () => {
    const cvConfig: AssessmentYearRangeConfig = {
      type: "CV",
      endpoint: "AssessmentYearRangeCV",
      idField: "id",
      routePath: "/property-tax/assessment-year-range/capitalvalue",
      translationNamespace: "assessmentYearRange.capitalValue",
    };

    it("uses correct endpoint for CV operations", async () => {
      mockGet.mockResolvedValue({
        success: true,
        data: {
          items: [
            {
              id: 1,
              fromYear: 2018,
              toYear: 2023,
              isActive: true,
              createdDate: "2026-01-01",
              updatedDate: null,
            },
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10,
          totalPages: 1,
        },
      });

      await getAssessmentYearRangePaged(cvConfig, 1, 10);

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining("AssessmentYearRangeCV"));
    });

    it("uses correct ID field for CV update", async () => {
      mockPut.mockResolvedValue({ success: true });

      await updateAssessmentYearRange(cvConfig, {
        id: 1,
        fromYear: 2018,
        toYear: 2023,
        isActive: true,
      });

      expect(mockPut).toHaveBeenCalledWith(
        "/AssessmentYearRangeCV/1",
        expect.objectContaining({ id: 1 })
      );
    });
  });
});
