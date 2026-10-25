import { describe, it, expect, vi } from "vitest";
import {
  validateid,
  validateAndPrepareSearchTerm,
  validateCreateFormData,
  validateUpdateFormData,
  checkBackendResponseErrors,
  getDeleteErrorStatusCode,
  createApiError,
} from "@/lib/api/constructiontypemaster/construction-validation";
import { ApiError } from "@/lib/utils/api";
import { ConstructionTypeFormModel, ConstructionType } from "@/types/construction.types";

vi.mock("next-intl/server", () => ({
  getTranslations: vi.fn().mockRejectedValue(new Error("Outside server context")),
}));

const createMockConstructionType = (override: Partial<ConstructionType>): ConstructionType => ({
  id: 1,
  constructionCode: "C01",
  description: "वर्णन",
  descriptionEnglish: "Description",
  searchSequence: 1,
  isActive: true,
  createdDate: "2024-01-01",
  updatedDate: null,
  ...override,
});

describe("construction-validation", () => {
  describe("validateid", () => {
    it("returns true for positive integers", () => {
      expect(validateid(1)).toBe(true);
      expect(validateid(100)).toBe(true);
    });

    it("returns false for non-positive or non-finite numbers", () => {
      expect(validateid(0)).toBe(false);
      expect(validateid(-1)).toBe(false);
      expect(validateid(NaN)).toBe(false);
      expect(validateid(Infinity)).toBe(false);
    });
  });

  describe("validateAndPrepareSearchTerm", () => {
    it("returns trimmed search term", () => {
      expect(validateAndPrepareSearchTerm("  test  ")).toBe("test");
    });

    it("returns undefined for empty or invalid values", () => {
      expect(validateAndPrepareSearchTerm("   ")).toBeUndefined();
      expect(validateAndPrepareSearchTerm(undefined)).toBeUndefined();
      expect(validateAndPrepareSearchTerm(null as unknown as string)).toBeUndefined();
    });

    it("truncates search term longer than 100 characters", () => {
      const longTerm = "a".repeat(120);
      expect(validateAndPrepareSearchTerm(longTerm)).toHaveLength(100);
    });
  });

  describe("validateCreateFormData", () => {
    const validData: ConstructionTypeFormModel = {
      constructionCode: "C01",
      descriptionEnglish: "Reinforced Concrete",
      description: "आरसीसी",
      searchSequence: 1,
      isActive: true,
    };

    it("does not throw for valid data", async () => {
      await expect(validateCreateFormData(validData)).resolves.toBeUndefined();
    });

    it("throws ApiError when construction code is missing", async () => {
      await expect(validateCreateFormData({ ...validData, constructionCode: "" })).rejects.toThrow(ApiError);
    });

    it("throws ApiError when english description is missing", async () => {
      await expect(validateCreateFormData({ ...validData, descriptionEnglish: "" })).rejects.toThrow(ApiError);
    });

    it("throws ApiError when regional description is missing", async () => {
      await expect(validateCreateFormData({ ...validData, description: "" })).rejects.toThrow(ApiError);
    });

    it("throws ApiError when english description exceeds 100 characters", async () => {
      await expect(
        validateCreateFormData({ ...validData, descriptionEnglish: "a".repeat(101) })
      ).rejects.toThrow(ApiError);
    });

    it("throws ApiError when regional description exceeds 100 characters", async () => {
      await expect(
        validateCreateFormData({ ...validData, description: "a".repeat(101) })
      ).rejects.toThrow(ApiError);
    });

    it("throws ApiError when fields do not contain letters", async () => {
      await expect(validateCreateFormData({ ...validData, constructionCode: "123" })).rejects.toThrow(ApiError);
      await expect(validateCreateFormData({ ...validData, descriptionEnglish: "456" })).rejects.toThrow(ApiError);
      await expect(validateCreateFormData({ ...validData, description: "789" })).rejects.toThrow(ApiError);
    });

    it("throws ApiError when english description contains non-English characters", async () => {
      await expect(
        validateCreateFormData({ ...validData, descriptionEnglish: "आरसीसी Concrete" })
      ).rejects.toThrow(ApiError);
    });

    it("throws 409 ApiError when english description is duplicate", async () => {
      const existing: ConstructionType[] = [
        createMockConstructionType({
          id: 1,
          constructionCode: "C99",
          descriptionEnglish: "Reinforced Concrete",
          description: "इतर",
        }),
      ];
      await expect(
        validateCreateFormData(validData, existing)
      ).rejects.toThrow(ApiError);
      await expect(
        validateCreateFormData(validData, existing)
      ).rejects.toHaveProperty("statusCode", 409);
    });

    it("throws 409 ApiError when regional description is duplicate", async () => {
      const existing: ConstructionType[] = [
        createMockConstructionType({
          id: 1,
          constructionCode: "C99",
          descriptionEnglish: "Different",
          description: "आरसीसी",
        }),
      ];
      await expect(
        validateCreateFormData(validData, existing)
      ).rejects.toThrow(ApiError);
      await expect(
        validateCreateFormData(validData, existing)
      ).rejects.toHaveProperty("statusCode", 409);
    });

    it("throws 409 ApiError when construction code is duplicate", async () => {
      const existing: ConstructionType[] = [
        createMockConstructionType({
          id: 1,
          constructionCode: "C01",
          descriptionEnglish: "Unique",
          description: "वेगळे",
        }),
      ];
      await expect(
        validateCreateFormData(validData, existing)
      ).rejects.toThrow(ApiError);
      await expect(
        validateCreateFormData(validData, existing)
      ).rejects.toHaveProperty("statusCode", 409);
    });
  });

  describe("validateUpdateFormData", () => {
    const validData: ConstructionTypeFormModel = {
      id: 5,
      constructionCode: "C05",
      descriptionEnglish: "Steel Frame",
      description: "स्टील",
      searchSequence: 2,
      isActive: true,
    };

    it("does not throw for valid update data", async () => {
      await expect(validateUpdateFormData(validData)).resolves.toBeUndefined();
    });

    it("throws ApiError when id is missing or zero", async () => {
      await expect(validateUpdateFormData({ ...validData, id: 0 })).rejects.toThrow(ApiError);
    });

    it("throws ApiError when english description contains non-English characters", async () => {
      await expect(
        validateUpdateFormData({ ...validData, descriptionEnglish: "स्टील Steel" })
      ).rejects.toThrow(ApiError);
    });

    it("allows current record to keep its own descriptions without duplicate error", async () => {
      const existing: ConstructionType[] = [
        createMockConstructionType({
          id: 5,
          constructionCode: "C05",
          descriptionEnglish: "Steel Frame",
          description: "स्टील",
          searchSequence: 2,
        }),
      ];
      await expect(validateUpdateFormData(validData, existing)).resolves.toBeUndefined();
    });

    it("throws 409 ApiError when updating with duplicate english description from another record", async () => {
      const existing: ConstructionType[] = [
        createMockConstructionType({
          id: 10,
          constructionCode: "C10",
          descriptionEnglish: "Steel Frame",
          description: "इतर",
        }),
      ];
      await expect(
        validateUpdateFormData(validData, existing)
      ).rejects.toThrow(ApiError);
      await expect(
        validateUpdateFormData(validData, existing)
      ).rejects.toHaveProperty("statusCode", 409);
    });

    it("throws 409 ApiError when updating with duplicate regional description from another record", async () => {
      const existing: ConstructionType[] = [
        createMockConstructionType({
          id: 10,
          constructionCode: "C10",
          descriptionEnglish: "Other",
          description: "स्टील",
        }),
      ];
      await expect(
        validateUpdateFormData(validData, existing)
      ).rejects.toThrow(ApiError);
      await expect(
        validateUpdateFormData(validData, existing)
      ).rejects.toHaveProperty("statusCode", 409);
    });
  });

  describe("checkBackendResponseErrors", () => {
    it("throws ApiError for duplicate backend message", () => {
      expect(() => {
        checkBackendResponseErrors({ message: "Record already exists" }, "Create");
      }).toThrow(ApiError);
    });

    it("does not throw for successful backend message", () => {
      expect(() => {
        checkBackendResponseErrors({ message: "Record inserted successfully" }, "Create");
      }).not.toThrow();
    });

    it("does nothing for null or empty data", () => {
      expect(() => {
        checkBackendResponseErrors(null, "Create");
      }).not.toThrow();
    });
  });

  describe("getDeleteErrorStatusCode", () => {
    it("maps not found messages to 404", () => {
      expect(getDeleteErrorStatusCode("record not found")).toBe(404);
    });

    it("maps linked or in use messages to 409", () => {
      expect(getDeleteErrorStatusCode("record is in use")).toBe(409);
    });

    it("maps invalid messages to 400", () => {
      expect(getDeleteErrorStatusCode("invalid request")).toBe(400);
    });

    it("defaults to 500 for other messages", () => {
      expect(getDeleteErrorStatusCode("unknown failure")).toBe(500);
    });
  });

  describe("createApiError", () => {
    it("creates ApiError with default status", () => {
      const err = createApiError(400, "Bad input", "Operation failed");
      expect(err.statusCode).toBe(400);
      expect(err.responseText).toBe("Bad input");
    });

    it("detects duplicate error and sets 409 status", () => {
      const err = createApiError(undefined, "Duplicate code", "Operation failed");
      expect(err.statusCode).toBe(409);
    });
  });
});
