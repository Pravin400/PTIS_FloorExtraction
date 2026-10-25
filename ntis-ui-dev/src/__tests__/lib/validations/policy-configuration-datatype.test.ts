import { describe, it, expect } from "vitest";
import {
  validateValueByDataType,
  sanitizeValueByDataType,
} from "@/lib/validations/policy-configuration-datatype";

describe("Policy Configuration Data Type Validation", () => {
  describe("validateValueByDataType", () => {
    it("validates BIT data type", () => {
      expect(validateValueByDataType("0", "BIT")).toBeNull();
      expect(validateValueByDataType("1", "BIT")).toBeNull();
      expect(validateValueByDataType("2", "BIT")).toBe("form.validation.bitInvalid");
      expect(validateValueByDataType("a", "BIT")).toBe("form.validation.bitInvalid");
    });

    it("validates INT data type", () => {
      expect(validateValueByDataType("123", "INT")).toBeNull();
      expect(validateValueByDataType("123456", "INT")).toBeNull();
      expect(validateValueByDataType("1234567", "INT")).toBe("form.validation.intInvalid");
      expect(validateValueByDataType("12.3", "INT")).toBe("form.validation.intInvalid");
      expect(validateValueByDataType("abc", "INT")).toBe("form.validation.intInvalid");
    });

    it("validates DECIMAL data type", () => {
      expect(validateValueByDataType("12.34", "DECIMAL")).toBeNull();
      expect(validateValueByDataType("123456.78", "DECIMAL")).toBeNull();
      expect(validateValueByDataType("123456", "DECIMAL")).toBeNull();
      expect(validateValueByDataType("1234567.8", "DECIMAL")).toBe("form.validation.decimalInvalid");
      expect(validateValueByDataType("12.345", "DECIMAL")).toBe("form.validation.decimalInvalid");
      expect(validateValueByDataType("abc", "DECIMAL")).toBe("form.validation.decimalInvalid");
    });

    it("validates VARCHAR data type length", () => {
      expect(validateValueByDataType("short text", "VARCHAR")).toBeNull();
      expect(validateValueByDataType("a".repeat(40), "VARCHAR")).toBeNull();
      expect(validateValueByDataType("a".repeat(41), "VARCHAR")).toBe("form.validation.varcharMaxLength");
    });

    it("validates valid and invalid calendar dates", () => {
      // Valid calendar dates
      expect(validateValueByDataType("2026-06-03", "DATE")).toBeNull();
      expect(validateValueByDataType("2024-02-29", "DATE")).toBeNull(); // Leap year

      // Invalid formats
      expect(validateValueByDataType("03-06-2026", "DATE")).toBe("form.validation.dateInvalid");
      expect(validateValueByDataType("2026/06/03", "DATE")).toBe("form.validation.dateInvalid");
      expect(validateValueByDataType("abc", "DATE")).toBe("form.validation.dateInvalid");

      // Invalid calendar dates (should be rejected)
      expect(validateValueByDataType("2026-02-30", "DATE")).toBe("form.validation.dateInvalid");
      expect(validateValueByDataType("2026-04-31", "DATE")).toBe("form.validation.dateInvalid");
      expect(validateValueByDataType("2026-13-01", "DATE")).toBe("form.validation.dateInvalid");
    });

    it("validates TIME data type", () => {
      expect(validateValueByDataType("14:30", "TIME")).toBeNull();
      expect(validateValueByDataType("14:30:15", "TIME")).toBeNull();
      expect(validateValueByDataType("25:00", "TIME")).toBe("form.validation.timeInvalid");
      expect(validateValueByDataType("14:60", "TIME")).toBe("form.validation.timeInvalid");
      expect(validateValueByDataType("abc", "TIME")).toBe("form.validation.timeInvalid");
    });

    it("validates URL data type", () => {
      expect(validateValueByDataType("https://example.com", "URL")).toBeNull();
      expect(validateValueByDataType("example.com", "URL")).toBeNull();
      expect(validateValueByDataType("invalid-url", "URL")).toBe("form.validation.urlInvalid");
    });
  });

  describe("sanitizeValueByDataType", () => {
    it("sanitizes BIT data type", () => {
      expect(sanitizeValueByDataType("1abc", "BIT")).toBe("1");
      expect(sanitizeValueByDataType("2", "BIT")).toBe("");
    });

    it("sanitizes INT data type", () => {
      expect(sanitizeValueByDataType("123abc456789", "INT")).toBe("123456");
    });

    it("sanitizes DECIMAL data type", () => {
      expect(sanitizeValueByDataType("123.456", "DECIMAL")).toBe("123.45");
      expect(sanitizeValueByDataType("123.4.5", "DECIMAL")).toBe("123.45");
      expect(sanitizeValueByDataType("123456.78.9", "DECIMAL")).toBe("123456.78");
    });
  });
});
