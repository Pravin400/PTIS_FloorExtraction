import {
  validateAssetCategoryForm,
  sanitizeFieldValue,
  CODE_MAX,
  NAME_MAX,
  DESCRIPTION_MAX,
  VALUATION_TYPE_MAX,
} from "@/hooks/asset-masters/asset-category/validation";
import type { AssetCategoryFormModel } from "@/types/asset-masters/asset-category.types";
import { describe, test, expect } from "vitest";

const t = (key: string) => key;

describe("validateAssetCategoryForm", () => {
  const baseModel: AssetCategoryFormModel = {
    code: "",
    name: "",
    description: "",
    isMovable: false,
    hasFloorDetails: false,
    hasInventory: false,
    isInventoryMandatory: false,
    hasLegalCompliance: false,
    valuationType: "FIXED_ASSET",
    isActive: false,
  };

  describe("Category Code validation (MAX: 20)", () => {
    test("requires code", () => {
      const errors = validateAssetCategoryForm({ ...baseModel }, t, false);
      expect(errors.code).toBe("Code is required");
    });

    test("enforces maximum length of 20", () => {
      expect(CODE_MAX).toBe(20);
      const longCode = "A".repeat(21);
      const errors = validateAssetCategoryForm({ ...baseModel, code: longCode }, t, false);
      expect(errors.code).toBe("Code cannot exceed 20 characters");
    });

    test("rejects all-zeros codes", () => {
      const errorsZeros = validateAssetCategoryForm({ ...baseModel, code: "0000" }, t, false);
      expect(errorsZeros.code).toBe("Code cannot be all zeros");
    });

    test("rejects invalid code format and accepts valid English code", () => {
      const errorsFormat = validateAssetCategoryForm({ ...baseModel, code: "Code@123" }, t, false);
      expect(errorsFormat.code).toBe("Only letters, numbers, hyphens, and underscores allowed");

      const validModel = { ...baseModel, code: "WH-STG-04", name: "Valid Name" };
      const errors = validateAssetCategoryForm(validModel, t, false);
      expect(errors.code).toBeUndefined();
    });
  });

  describe("Category Name validation (MAX: 100, NAME_ONLY)", () => {
    test("requires name", () => {
      const errors = validateAssetCategoryForm({ ...baseModel, code: "CODE1" }, t, false);
      expect(errors.name).toBe("Name is required");
    });

    test("enforces maximum length of 100", () => {
      expect(NAME_MAX).toBe(100);
      const longName = "A".repeat(101);
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: longName },
        t,
        false
      );
      expect(errors.name).toBe("Name cannot exceed 100 characters");
    });

    test("rejects all zeros", () => {
      const errorsZeros = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "0000" },
        t,
        false
      );
      expect(errorsZeros.name).toBe("Name cannot be all zeros");
    });

    test("accepts English category names", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Warehouse Storage Racks" },
        t,
        false
      );
      expect(errors.name).toBeUndefined();
    });

    test("accepts Marathi category names (Unicode)", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "गोदाम साठवण रॅक शेल्व्हिंग" },
        t,
        false
      );
      expect(errors.name).toBeUndefined();
    });

    test("accepts Hindi category names (Unicode)", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "सर्वर और नेटवर्किंग आधारभूत संरचना" },
        t,
        false
      );
      expect(errors.name).toBeUndefined();
    });

    test("rejects numbers in category name (NAME_ONLY constraint)", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Warehouse 101" },
        t,
        false
      );
      expect(errors.name).toBe(
        "Only letters (any language), numbers, spaces, and basic punctuation allowed (,./-())."
      );
    });

    test("rejects special characters in category name (NAME_ONLY constraint)", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Storage & Racks!" },
        t,
        false
      );
      expect(errors.name).toBe(
        "Only letters (any language), numbers, spaces, and basic punctuation allowed (,./-())."
      );
    });
  });

  describe("Valuation Type validation (MAX: 20)", () => {
    test("requires valuationType", () => {
      const errors = validateAssetCategoryForm({ ...baseModel, code: "CODE1", name: "Valid Name", valuationType: "" }, t, false);
      expect(errors.valuationType).toBe("Valuation Type is required");
    });

    test("enforces maximum length of 20", () => {
      expect(VALUATION_TYPE_MAX).toBe(20);
      const longValuation = "A".repeat(21);
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Valid Name", valuationType: longValuation },
        t,
        false
      );
      expect(errors.valuationType).toBe("Maximum length is 20 characters");
    });

    test("accepts valid valuation type up to 20 characters", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Valid Name", valuationType: "FIXED_ASSET" },
        t,
        false
      );
      expect(errors.valuationType).toBeUndefined();
    });

    test("rejects invalid characters in valuation type", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Valid Name", valuationType: "<script>" },
        t,
        false
      );
      expect(errors.valuationType).toBe("Only alphanumeric, spaces, underscore and hyphen allowed");
    });
  });

  describe("Description validation (MAX: 500)", () => {
    test("enforces maximum length of 500", () => {
      expect(DESCRIPTION_MAX).toBe(500);
      const longDesc = "A".repeat(501);
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Valid Name", description: longDesc },
        t,
        false
      );
      expect(errors.description).toBe("Description cannot exceed 500 characters");
    });

    test("accepts Marathi and Hindi descriptions", () => {
      const marathiDesc = "औद्योगिक पॅलेट रॅकिंग सिस्टीम आणि गोदाम इन्व्हेंटरीसाठी शेल्व्हिंग";
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "गोदाम साठवण रॅक", description: marathiDesc },
        t,
        false
      );
      expect(errors.description).toBeUndefined();
    });
  });

  describe("Active status validation", () => {
    test("must be active on create", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Valid Name", isActive: false },
        t,
        false
      );
      expect(errors.isActive).toBe("Must be active on creation");
    });

    test("can be inactive on edit", () => {
      const errors = validateAssetCategoryForm(
        { ...baseModel, code: "CODE1", name: "Valid Name", isActive: false },
        t,
        true
      );
      expect(errors.isActive).toBeUndefined();
    });
  });
});

describe("sanitizeFieldValue for Asset Category", () => {
  test("sanitizes code: uppercase, removes special characters, truncates to 20", () => {
    expect(sanitizeFieldValue("code", "wh-stg_01@#$")).toBe("WH-STG_01");
    expect(sanitizeFieldValue("code", "a".repeat(25))).toBe("A".repeat(20));
  });

  test("sanitizes name: NAME_ONLY removes digits and symbols, preserves Marathi, Hindi, English", () => {
    expect(sanitizeFieldValue("name", "Warehouse Storage 123!@#")).toBe("Warehouse Storage ");
    expect(sanitizeFieldValue("name", "गोदाम साठवण रॅक 123")).toBe("गोदाम साठवण रॅक ");
    expect(sanitizeFieldValue("name", "सर्वर और नेटवर्किंग 456")).toBe("सर्वर और नेटवर्किंग ");
    expect(sanitizeFieldValue("name", "A".repeat(110))).toBe("A".repeat(100));
  });

  test("sanitizes valuationType: uppercase, allows only valid characters, truncates to 20", () => {
    expect(sanitizeFieldValue("valuationType", "fixed_asset-01@#$")).toBe("FIXED_ASSET-01");
    expect(sanitizeFieldValue("valuationType", "A".repeat(25))).toBe("A".repeat(20));
  });

  test("sanitizes description: truncates to 500, normalizes spaces", () => {
    expect(sanitizeFieldValue("description", "  Line   one  ")).toBe("Line one ");
    expect(sanitizeFieldValue("description", "A".repeat(510))).toBe("A".repeat(500));
  });
});
