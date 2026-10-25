import { describe, it, expect } from "vitest";
import {
  evaluatePropertyParameterMatch,
  calculateStringSimilarityPercentage,
  calculateNumericSimilarityPercentage,
  levenshteinDistance
} from "@/lib/utils/propertyComparison.utils";

describe("Property Comparison Similarity Utility (Industry Standard 80%+ Matching)", () => {
  describe("levenshteinDistance", () => {
    it("should calculate correct edit distance between strings", () => {
      expect(levenshteinDistance("cat", "hat")).toBe(1);
      expect(levenshteinDistance("hello", "hello")).toBe(0);
      expect(levenshteinDistance("", "abc")).toBe(3);
    });
  });

  describe("calculateStringSimilarityPercentage", () => {
    it("should return 100% for identical strings", () => {
      expect(calculateStringSimilarityPercentage("The Holder", "The Holder")).toBe(100);
      expect(calculateStringSimilarityPercentage("THANE 400607", "thane 400607")).toBe(100);
    });

    it("should return low similarity for generic title substring matches", () => {
      const sim = calculateStringSimilarityPercentage(
        "The Holder",
        "M/S SNEHDEEP CO.OP.HSG. SOC.LTD. THE HOLDER : SHRI. UNMESH MANOHAR MAHAJAN"
      );
      expect(sim).toBeLessThan(80);
    });

    it("should return high similarity (>=80%) for nearly identical addresses", () => {
      const sim = calculateStringSimilarityPercentage(
        "SAI KRUPA CHAWL, VARCHA GAON, KOLSHET, THANE-400607",
        "SAI KRUPA CHAWL, VARCHA GAON, KOLSHET, THANE 400607"
      );
      expect(sim).toBeGreaterThanOrEqual(80);
    });

    it("should return low similarity (<80%) for completely different addresses in the same city", () => {
      const sim = calculateStringSimilarityPercentage(
        "SAI KRUPA CHAWL, VARCHA GAON, KOLSHET, THANE-400607",
        "FIRST FLOOR MAHARSHI KARVE ROAD, NAUPADA, THANE"
      );
      expect(sim).toBeLessThan(80);
    });
  });

  describe("calculateNumericSimilarityPercentage", () => {
    it("should return 100% for exact numbers", () => {
      expect(calculateNumericSimilarityPercentage(500, 500)).toBe(100);
    });

    it("should return >=80% for numbers within 20% variance", () => {
      expect(calculateNumericSimilarityPercentage(1000, 950)).toBe(95);
      expect(calculateNumericSimilarityPercentage(1000, 800)).toBe(80);
    });

    it("should return <80% for numbers with large variance", () => {
      expect(calculateNumericSimilarityPercentage(4305.6, 876.77)).toBeLessThan(80);
    });
  });

  describe("evaluatePropertyParameterMatch", () => {
    it("should evaluate text match with 80% threshold correctly", () => {
      const resPass = evaluatePropertyParameterMatch(
        "SAI KRUPA CHAWL, VARCHA GAON",
        "SAI KRUPA CHAWL, VARCHA GAON",
        "text",
        80
      );
      expect(resPass.isMatch).toBe(true);

      const resFail = evaluatePropertyParameterMatch(
        "The Holder",
        "M/S SNEHDEEP CO.OP.HSG. SOC.LTD. THE HOLDER : SHRI. UNMESH MANOHAR MAHAJAN",
        "text",
        80
      );
      expect(resFail.isMatch).toBe(false);
    });

    it("should evaluate numeric match with 80% threshold correctly", () => {
      const matchRes = evaluatePropertyParameterMatch(1000, 900, "numeric", 80);
      expect(matchRes.isMatch).toBe(true);

      const unmatchRes = evaluatePropertyParameterMatch(4305.6, 876.77, "numeric", 80);
      expect(unmatchRes.isMatch).toBe(false);
    });

    it("should evaluate category match correctly", () => {
      const matchRes = evaluatePropertyParameterMatch("निवासी", "Residential", "category", 80);
      expect(matchRes.isMatch).toBe(true);

      const unmatchRes = evaluatePropertyParameterMatch("अनिवासी", "Residential", "category", 80);
      expect(unmatchRes.isMatch).toBe(false);

      const nivasiVsNonRes = evaluatePropertyParameterMatch("निवासी", "Non Residential", "category", 80);
      expect(nivasiVsNonRes.isMatch).toBe(false);

      const nivasiVsNonResHyphen = evaluatePropertyParameterMatch("निवासी", "Non-Residential", "category", 80);
      expect(nivasiVsNonResHyphen.isMatch).toBe(false);

      const anivasiVsNonRes = evaluatePropertyParameterMatch("अनिवासी", "Non Residential", "category", 80);
      expect(anivasiVsNonRes.isMatch).toBe(true);
    });

    it("should evaluate exact match fields strictly (Construction Year, Mobile, CTS, Zone/Ward)", () => {
      const yearMatch = evaluatePropertyParameterMatch("2026", "2026", "exact");
      expect(yearMatch.isMatch).toBe(true);

      const yearUnmatch = evaluatePropertyParameterMatch("2026", "1819", "exact");
      expect(yearUnmatch.isMatch).toBe(false);

      const ctsUnmatch = evaluatePropertyParameterMatch("CSN005A", "60", "exact");
      expect(ctsUnmatch.isMatch).toBe(false);

      const mobileUnmatch = evaluatePropertyParameterMatch("9322757603", "N/A", "exact");
      expect(mobileUnmatch.isMatch).toBe(false);

      const zoneWardUnmatch = evaluatePropertyParameterMatch("1 / MM11", "NAUPADA / 18", "exact");
      expect(zoneWardUnmatch.isMatch).toBe(false);
    });
  });
});
