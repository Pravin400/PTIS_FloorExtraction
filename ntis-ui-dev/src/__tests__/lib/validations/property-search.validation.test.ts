import { describe, expect, it } from "vitest";
import { validatePropertySearchCriteria } from "@/lib/validations/property-search.validation";
import {
  getPropertySearchFieldErrors,
  validateSearchFieldValue,
} from "@/lib/validations/property-search-field-rules";
import { sanitizePropertySearchField } from "@/lib/validations/property-search-input-sanitizers";
import { INITIAL_SEARCH_CRITERIA } from "@/components/modules/property-tax/search-property/constants";
import type { SearchCriteria } from "@/types/property-search";

const t = (key: string) => key;

describe("property-search-field-rules", () => {
  it("accepts valid property numbers", () => {
    expect(validateSearchFieldValue("propertyNoFrom", "10", t)).toBeNull();
    expect(validateSearchFieldValue("propertyNoFrom", "123456", t)).toBeNull();
    expect(validateSearchFieldValue("propertyNoFrom", "P-2023-001", t)).toBeNull();
    expect(validateSearchFieldValue("propertyNoFrom", "10/A", t)).toBeNull();
    expect(validateSearchFieldValue("propertyNoFrom", "NK10", t)).toBeNull();
    expect(validateSearchFieldValue("propertyNoFrom", "NK-10", t)).toBeNull();
  });

  it("rejects invalid property numbers", () => {
    expect(validateSearchFieldValue("propertyNoFrom", "@123", t)).toBe(
      "propertyNoInvalid"
    );
    expect(validateSearchFieldValue("propertyNoFrom", "NK", t)).toBe(
      "propertyNoInvalid"
    );
  });

  it("rejects over-length property numbers", () => {
    const tooLong = "A1".repeat(11);
    expect(validateSearchFieldValue("propertyNoFrom", tooLong, t)).toBe(
      "propertyNoInvalid"
    );
  });

  it("validates UPIC ID format", () => {
    expect(validateSearchFieldValue("upicId", "ABC123", t)).toBeNull();
    expect(validateSearchFieldValue("upicId", "ABC-123", t)).toBe(
      "upicIdInvalid"
    );
    expect(validateSearchFieldValue("upicId", "ABC@123", t)).toBe(
      "upicIdInvalid"
    );
  });

  it("validates Old Property No format", () => {
    expect(validateSearchFieldValue("oldPropertyNo", "OLD123", t)).toBeNull();
    expect(validateSearchFieldValue("oldPropertyNo", "OLD", t)).toBe(
      "oldPropertyNoInvalid"
    );
    expect(validateSearchFieldValue("oldPropertyNo", "OLD-123", t)).toBe(
      "oldPropertyNoInvalid"
    );
    expect(validateSearchFieldValue("oldPropertyNo", "OLD/123", t)).toBe(
      "oldPropertyNoInvalid"
    );
  });

  it("validates sub zone as alphanumeric only", () => {
    expect(validateSearchFieldValue("subZoneNo", "CSN005A", t)).toBeNull();
    expect(validateSearchFieldValue("subZoneNo", "12/3", t)).toBe(
      "subZoneNoInvalid"
    );
  });

  it("validates person names", () => {
    expect(validateSearchFieldValue("holderName", "John Doe", t)).toBeNull();
    expect(validateSearchFieldValue("holderName", "राम प्रसाद", t)).toBeNull();
    expect(validateSearchFieldValue("holderName", "John123", t)).toBe(
      "holderNameInvalid"
    );
  });

  it("validates mobile numbers", () => {
    expect(validateSearchFieldValue("mobile", "9876543210", t)).toBeNull();
    expect(validateSearchFieldValue("mobile", "123", t)).toBe("mobileInvalid");
    expect(validateSearchFieldValue("mobile", "5876543210", t)).toBe(
      "mobileInvalid"
    );
  });

  it("blocks HTML and validates words in address", () => {
    expect(validateSearchFieldValue("address", "<script>alert(1)</script>", t)).toBe(
      "addressInvalid"
    );
    expect(validateSearchFieldValue("address", "Lodha Amara Kolshet Road", t)).toBeNull();
    expect(validateSearchFieldValue("address", "सनराइज को-ऑपरेटिव हाउसिंग सोसायटी", t)).toBeNull();

    // Verify 500 words limit
    const tooManyWords = Array(501).fill("word").join(" ");
    expect(validateSearchFieldValue("address", tooManyWords, t)).toBe(
      "addressInvalid"
    );
  });

  it("validates rateable value format", () => {
    expect(validateSearchFieldValue("rateableValueFrom", "1234", t)).toBeNull();
    expect(validateSearchFieldValue("rateableValueFrom", "1,23,456", t)).toBeNull();
    expect(validateSearchFieldValue("rateableValueFrom", "1,23,456.78", t)).toBeNull();
    expect(validateSearchFieldValue("rateableValueFrom", "1,07,45,17,92,073.64", t)).toBeNull();
    expect(validateSearchFieldValue("rateableValueFrom", "123.45", t)).toBeNull();
    expect(validateSearchFieldValue("rateableValueFrom", "123.456", t)).toBe(
      "rateableValueInvalid"
    );
    expect(validateSearchFieldValue("rateableValueFrom", "1,23,456.789", t)).toBe(
      "rateableValueInvalid"
    );
    expect(validateSearchFieldValue("rateableValueFrom", "-100", t)).toBe(
      "rateableValueInvalid"
    );
    expect(validateSearchFieldValue("rateableValueFrom", "+50", t)).toBe(
      "rateableValueInvalid"
    );
    expect(validateSearchFieldValue("rateableValueFrom", "0", t)).toBe(
      "rateableValueInvalid"
    );
    expect(validateSearchFieldValue("rateableValueFrom", "0.00", t)).toBe(
      "rateableValueInvalid"
    );
  });
});

describe("property-search-input-sanitizers", () => {
  it("strips invalid special characters from property no", () => {
    expect(sanitizePropertySearchField("propertyNoFrom", "P#001")).toBe("P001");
    expect(sanitizePropertySearchField("propertyNoFrom", "12/34")).toBe("12/34");
  });

  it("limits mobile to digits only", () => {
    expect(sanitizePropertySearchField("mobile", "98ab76543210")).toBe(
      "9876543210"
    );
  });

  it("collapses multiple spaces in names", () => {
    expect(sanitizePropertySearchField("holderName", "John   Doe")).toBe(
      "John Doe"
    );
  });

  it("preserves Devanagari characters in names, societies, and addresses", () => {
    expect(sanitizePropertySearchField("holderName", "राम प्रसाद")).toBe("राम प्रसाद");
    expect(sanitizePropertySearchField("societyName", "सनराइज को-ऑपरेटिव हाउसिंग सोसायटी")).toBe("सनराइज को-ऑपरेटिव हाउसिंग सोसायटी");
    expect(sanitizePropertySearchField("address", "Lodha Amara, Kolshet Road - 400607")).toBe("Lodha Amara, Kolshet Road - 400607");
    expect(sanitizePropertySearchField("address", " Lodha  Amara ")).toBe("Lodha Amara ");
  });

  it("strips invalid characters from rateable value", () => {
    expect(sanitizePropertySearchField("rateableValueFrom", "-123")).toBe("123");
    expect(sanitizePropertySearchField("rateableValueTo", "45.67")).toBe("45.67");
    expect(sanitizePropertySearchField("rateableValueTo", "45.678")).toBe("45.67");
    expect(sanitizePropertySearchField("rateableValueTo", "1,23,456.78")).toBe("1,23,456.78");
    expect(sanitizePropertySearchField("rateableValueFrom", "+5e3")).toBe("53");
  });
});

describe("property-search.validation", () => {
  describe("validatePropertySearchCriteria", () => {
    it("requires zone when ward is selected", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        wardId: 5,
      };

      const result = validatePropertySearchCriteria(criteria, "quick-search", t);

      expect(result).toEqual({ valid: false, message: "wardRequiresZone" });
    });

    it("rejects quick search when propertyNoTo is set without propertyNoFrom", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        propertyNoTo: "100",
      };

      const result = validatePropertySearchCriteria(criteria, "quick-search", t);

      expect(result).toEqual({ valid: false, message: "propertyNoFromRequired" });
    });

    it("rejects invalid property number range", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        propertyNoFrom: "200",
        propertyNoTo: "100",
      };

      const result = validatePropertySearchCriteria(criteria, "quick-search", t);

      expect(result).toEqual({ valid: false, message: "propertyNoRangeInvalid" });
    });

    it("rejects invalid mobile on kyc tab", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        mobile: "123",
      };

      const result = validatePropertySearchCriteria(criteria, "kyc", t);

      expect(result).toEqual({ valid: false, message: "mobileInvalid" });
    });

    it("requires at least one active search field", () => {
      const result = validatePropertySearchCriteria(
        INITIAL_SEARCH_CRITERIA,
        "quick-search",
        t
      );

      expect(result).toEqual({ valid: false, message: "noSearchCriteria" });
    });

    it("accepts a stat-card status filter without other criteria", () => {
      const result = validatePropertySearchCriteria(
        INITIAL_SEARCH_CRITERIA,
        "quick-search",
        t,
        "Register Property"
      );

      expect(result).toEqual({ valid: true });
    });

    it("accepts valid quick search criteria", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        upicId: "ABC123",
      };

      const result = validatePropertySearchCriteria(criteria, "quick-search", t);

      expect(result).toEqual({ valid: true });
    });

    it("accepts valid kyc search criteria", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        occupierName: "John Doe",
      };

      const result = validatePropertySearchCriteria(criteria, "kyc", t);

      expect(result).toEqual({ valid: true });
    });

    it("returns field errors for invalid quick search input", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        upicId: "bad@id",
      };

      const errors = getPropertySearchFieldErrors(criteria, "quick-search", t);

      expect(errors.upicId).toBe("upicIdInvalid");
    });

    it("returns field errors for invalid values-dues input", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        rateableValueFrom: "bad-value",
      };

      const errors = getPropertySearchFieldErrors(criteria, "values-dues", t);

      expect(errors.rateableValueFrom).toBe("rateableValueInvalid");
    });

    it("rejects invalid rateable value ranges in between filter", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        rateableValueFilter: "between",
        rateableValueFrom: "1,00,000",
        rateableValueTo: "50,000",
      };

      const errors = getPropertySearchFieldErrors(criteria, "values-dues", t);

      expect(errors.rateableValueTo).toBe("rateableValueRangeInvalid");
    });

    it("rejects zero or negative count in top filter", () => {
      const criteria1: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        rateableValueFilter: "top",
        rateableValueFrom: "0",
      };
      const errors1 = getPropertySearchFieldErrors(criteria1, "values-dues", t);
      expect(errors1.rateableValueFrom).toBe("rateableValueInvalid");

      const criteria2: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        rateableValueFilter: "top",
        rateableValueFrom: "-5",
      };
      const errors2 = getPropertySearchFieldErrors(criteria2, "values-dues", t);
      expect(errors2.rateableValueFrom).toBe("rateableValueInvalid");
    });

    it("rejects 0 to 0 range in between filter", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        rateableValueFilter: "between",
        rateableValueFrom: "0",
        rateableValueTo: "0",
      };

      const errors = getPropertySearchFieldErrors(criteria, "values-dues", t);

      expect(errors.rateableValueFrom).toBe("rateableValueInvalid");
      expect(errors.rateableValueTo).toBe("rateableValueInvalid");
    });

    it("does not return field errors for empty values in getPropertySearchFieldErrors", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        rateableValueFilter: "between",
        rateableValueFrom: "",
        rateableValueTo: "",
      };

      const errors = getPropertySearchFieldErrors(criteria, "values-dues", t);
      expect(errors.rateableValueFrom).toBeUndefined();
      expect(errors.rateableValueTo).toBeUndefined();
    });

    it("rejects empty values-dues criteria in validatePropertySearchCriteria", () => {
      const criteriaBetween: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "rv",
        rateableValueFilter: "between",
        rateableValueFrom: "",
        rateableValueTo: "",
      };
      const resultBetween = validatePropertySearchCriteria(criteriaBetween, "values-dues", t);
      expect(resultBetween).toEqual({ valid: false, message: "rateableValueBetweenRequired" });

      const criteriaTop: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "rv",
        rateableValueFilter: "top",
        rateableValueFrom: "",
      };
      const resultTop = validatePropertySearchCriteria(criteriaTop, "values-dues", t);
      expect(resultTop).toEqual({ valid: false, message: "rateableValueInvalid" });

      const criteriaExact: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "rv",
        rateableValueFilter: "exact",
        rateableValueFrom: "",
      };
      const resultExact = validatePropertySearchCriteria(criteriaExact, "values-dues", t);
      expect(resultExact).toEqual({ valid: false, message: "rateableValueInvalid" });
    });

    it("rejects values-dues criteria when valuationMethod is missing", () => {
      const criteria: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "",
        rateableValueFilter: "exact",
        rateableValueFrom: "1000",
      };
      const result = validatePropertySearchCriteria(criteria, "values-dues", t);
      expect(result).toEqual({ valid: false, message: "valuationMethodRequired" });
    });

    it("returns correct field errors for Total Tax and CV", () => {
      const criteriaTax: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "totalTax",
        rateableValueFilter: "between",
        rateableValueFrom: "3",
        rateableValueTo: "1",
      };
      const errorsTax = getPropertySearchFieldErrors(criteriaTax, "values-dues", t);
      expect(errorsTax.rateableValueTo).toBe("totalTaxRangeInvalid");

      const criteriaCV: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "cv",
        rateableValueFilter: "between",
        rateableValueFrom: "3",
        rateableValueTo: "1",
      };
      const errorsCV = getPropertySearchFieldErrors(criteriaCV, "values-dues", t);
      expect(errorsCV.rateableValueTo).toBe("capitalValueRangeInvalid");
    });

    it("rejects empty values-dues criteria dynamically for Total Tax and CV in validatePropertySearchCriteria", () => {
      const criteriaTax: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "totalTax",
        rateableValueFilter: "between",
        rateableValueFrom: "",
        rateableValueTo: "",
      };
      const resultTax = validatePropertySearchCriteria(criteriaTax, "values-dues", t);
      expect(resultTax).toEqual({ valid: false, message: "totalTaxBetweenRequired" });

      const criteriaCV: SearchCriteria = {
        ...INITIAL_SEARCH_CRITERIA,
        valuationMethod: "cv",
        rateableValueFilter: "between",
        rateableValueFrom: "",
        rateableValueTo: "",
      };
      const resultCV = validatePropertySearchCriteria(criteriaCV, "values-dues", t);
      expect(resultCV).toEqual({ valid: false, message: "capitalValueBetweenRequired" });
    });
  });
});
