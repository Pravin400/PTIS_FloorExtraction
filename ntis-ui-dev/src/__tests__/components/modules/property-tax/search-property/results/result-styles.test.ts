import { describe, expect, it } from "vitest";
import { formatDisplayText } from "@/components/modules/property-tax/search-property/results/result-styles";

describe("result-styles", () => {
  describe("formatDisplayText", () => {
    it("returns a dash placeholder only at render time for empty values", () => {
      expect(formatDisplayText("")).toBe("-");
      expect(formatDisplayText("   ")).toBe("-");
    });

    it("returns trimmed text when a value is present", () => {
      expect(formatDisplayText("  Ward 01  ")).toBe("Ward 01");
    });
  });
});
