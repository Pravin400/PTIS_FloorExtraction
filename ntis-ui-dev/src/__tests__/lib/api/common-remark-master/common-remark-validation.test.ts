import { describe, it, expect } from "vitest";
import {
  validateCustomRemarkType,
  validateRemarkType,
  validateRemark,
  validateIsActive,
} from "@/lib/api/common-remark-master/common-remark-validation";

describe("common-remark-validation", () => {
  describe("validateCustomRemarkType", () => {
    it("should return null for valid custom remark type when mode is 'Other'", () => {
      const result = validateCustomRemarkType("New Category", "Other", []);
      expect(result).toBeNull();
    });

    it("should return required error key if custom remark type is empty", () => {
      const result = validateCustomRemarkType("", "Other", []);
      expect(result).toBe("form.validation.customRemarkTypeRequired");
    });

    it("should return minLength error key if custom remark type is under 3 chars", () => {
      const result = validateCustomRemarkType("ab", "Other", []);
      expect(result).toBe("form.validation.customRemarkTypeMinLength");
    });

    it("should return customRemarkTypeExists error key if custom remark type matches existing category (case-insensitive)", () => {
      const existing = [{ categoryName: "Survey" }, { categoryName: "Recovery" }];
      
      const match1 = validateCustomRemarkType("Survey", "Other", existing);
      expect(match1).toBe("form.validation.customRemarkTypeExists");

      const match2 = validateCustomRemarkType("RECOVERY", "Other", existing);
      expect(match2).toBe("form.validation.customRemarkTypeExists");
    });

    it("should return null if remarkType is not 'Other'", () => {
      const result = validateCustomRemarkType("Survey", "1", [{ categoryName: "Survey" }]);
      expect(result).toBeNull();
    });
  });

  describe("validateRemarkType", () => {
    it("should fail if empty", () => {
      expect(validateRemarkType("")).toBe("form.validation.remarkTypeRequired");
    });
    it("should pass if valid string", () => {
      expect(validateRemarkType("1")).toBeNull();
    });
  });

  describe("validateRemark", () => {
    it("should fail if empty", () => {
      expect(validateRemark("")).toBe("form.validation.remarkRequired");
    });
    it("should fail if less than 3 characters", () => {
      expect(validateRemark("ab")).toBe("form.validation.remarkMinLength");
    });
    it("should pass for valid content", () => {
      expect(validateRemark("Valid remark content")).toBeNull();
    });
  });

  describe("validateIsActive", () => {
    it("should fail if inactive on creation", () => {
      expect(validateIsActive(false, false)).toBe("form.validation.mustBeActive");
    });
    it("should pass if inactive on edit", () => {
      expect(validateIsActive(false, true)).toBeNull();
    });
  });
});
