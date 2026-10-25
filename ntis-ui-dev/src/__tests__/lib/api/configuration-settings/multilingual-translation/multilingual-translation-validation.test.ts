import { describe, it, expect } from "vitest";
import {
  validateBulkUpdateItems,
  validateLanguageFilter,
  validateResourceFilter,
  validateTranslationId,
} from "@/lib/api/configuration-settings/multilingual-translation/multilingual-translation-validation";
import { ApiError } from "@/lib/utils/api";
import type { MultilingualTranslationBulkUpdateItem } from "@/types/multilingual-translation.types";

function makeItem(
  overrides: Partial<MultilingualTranslationBulkUpdateItem> = {}
): MultilingualTranslationBulkUpdateItem {
  return {
    id: 1,
    data: {
      resource: "common.json",
      key: "btn_submit",
      en_US: "Submit",
      hi_IN: "जमा करें",
      mr_IN: "सादर करा",
    },
    ...overrides,
  };
}

describe("validateTranslationId", () => {
  it("accepts positive finite integers", () => {
    expect(validateTranslationId(1)).toBe(true);
    expect(validateTranslationId(9999)).toBe(true);
  });

  it("rejects non-positive, NaN, and Infinity", () => {
    expect(validateTranslationId(0)).toBe(false);
    expect(validateTranslationId(-1)).toBe(false);
    expect(validateTranslationId(Number.NaN)).toBe(false);
    expect(validateTranslationId(Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("validateResourceFilter", () => {
  it("returns undefined for non-strings and blanks", () => {
    expect(validateResourceFilter(undefined)).toBeUndefined();
    expect(validateResourceFilter("")).toBeUndefined();
    expect(validateResourceFilter("   ")).toBeUndefined();
  });

  it("trims whitespace", () => {
    expect(validateResourceFilter("  common.json ")).toBe("common.json");
  });

  it("truncates to max length", () => {
    const long = "a".repeat(500);
    const result = validateResourceFilter(long);
    expect(result).toBeDefined();
    expect(result!.length).toBe(200);
  });
});

describe("validateLanguageFilter", () => {
  it("returns empty array for empty / undefined input", () => {
    expect(validateLanguageFilter(undefined)).toEqual([]);
    expect(validateLanguageFilter([])).toEqual([]);
  });

  it("keeps only supported codes and deduplicates", () => {
    expect(validateLanguageFilter(["hi", "mr", "en", "hi"])).toEqual(["hi", "mr"]);
  });

  it("normalizes casing and trims", () => {
    expect(validateLanguageFilter(["  HI ", "Mr"])).toEqual(["hi", "mr"]);
  });
});

describe("validateBulkUpdateItems", () => {
  it("throws ApiError(400) on empty input", () => {
    expect(() => validateBulkUpdateItems([])).toThrow(ApiError);
  });

  it("throws on too-many items", () => {
    const items = Array.from({ length: 501 }, (_, i) => makeItem({ id: i + 1 }));
    expect(() => validateBulkUpdateItems(items)).toThrow(/Cannot update more than/);
  });

  it("throws on invalid id", () => {
    expect(() => validateBulkUpdateItems([makeItem({ id: 0 })])).toThrow(/Invalid translation id/);
  });

  it("throws on duplicate ids in batch", () => {
    expect(() =>
      validateBulkUpdateItems([makeItem({ id: 5 }), makeItem({ id: 5 })])
    ).toThrow(/Duplicate translation id/);
  });

  it("throws when resource is missing or blank", () => {
    expect(() =>
      validateBulkUpdateItems([
        makeItem({ data: { ...makeItem().data, resource: "   " } }),
      ])
    ).toThrow(/Resource is required/);
  });

  it("throws when key is missing", () => {
    expect(() =>
      validateBulkUpdateItems([
        makeItem({ data: { ...makeItem().data, key: "" } }),
      ])
    ).toThrow(/Key is required/);
  });

  it("throws when a translation value is not a string", () => {
    expect(() =>
      validateBulkUpdateItems([
        makeItem({
          data: {
            ...makeItem().data,
            // @ts-expect-error — intentional misuse to test runtime guard
            hi_IN: 123,
          },
        }),
      ])
    ).toThrow(/hi_IN must be a string/);
  });

  it("throws when a translation exceeds max length", () => {
    expect(() =>
      validateBulkUpdateItems([
        makeItem({
          data: { ...makeItem().data, mr_IN: "a".repeat(4001) },
        }),
      ])
    ).toThrow(/mr_IN exceeds/);
  });

  it("passes for a valid batch", () => {
    expect(() => validateBulkUpdateItems([makeItem(), makeItem({ id: 2 })])).not.toThrow();
  });
});
