import { describe, it, expect } from "vitest";
import { getWaterRateColumns } from "@/components/modules/property-tax/WaterConnectionMaster/waterRateColumns";
import type { WaterRate } from "@/types/water-connection.types";

const t = (key: string) => key;

const mockRow: WaterRate = {
  id: 1,
  waterConnectionTypeId: 1,
  connectionTypeName: "Domestic",
  waterConnectionSizeId: 1,
  connectionSizeDisplay: "15mm",
  financeYearId: 1,
  yearCode: "2024-25",
  yearlyRate: 1500,
  isActive: true,
};

describe("getWaterRateColumns", () => {
  it("returns 7 columns", () => {
    expect(getWaterRateColumns(t)).toHaveLength(7);
  });

  it("has correct keys in order", () => {
    const keys = getWaterRateColumns(t).map((c) => c.key);
    expect(keys).toEqual([
      "connectionTypeName",
      "connectionSizeDisplay",
      "yearCode",
      "yearlyRate",
      "quarterlyRate",
      "monthlyRate",
      "isActive",
    ]);
  });

  it("all columns have center alignment", () => {
    const columns = getWaterRateColumns(t);
    columns.forEach((col) => {
      expect(col.align).toBe("center");
    });
  });

  it("isActive column has isStatus: true", () => {
    const statusCol = getWaterRateColumns(t).find((c) => c.key === "isActive");
    expect(statusCol?.isStatus).toBe(true);
  });

  describe("yearlyRate render", () => {
    function renderRate(value: unknown) {
      const col = getWaterRateColumns(t).find((c) => c.key === "yearlyRate")!;
      return col.render!(value as WaterRate[keyof WaterRate], mockRow, 0);
    }

    it("has a render function", () => {
      const col = getWaterRateColumns(t).find((c) => c.key === "yearlyRate")!;
      expect(col.render).toBeDefined();
    });

    it("prefixes output with ₹", () => {
      expect(String(renderRate(1500))).toMatch(/^₹/);
    });

    it("does not include decimal places", () => {
      expect(String(renderRate(1500))).not.toContain(".");
    });

    it("does not show .00 suffix", () => {
      expect(String(renderRate(1500))).not.toContain(".00");
    });

    it("renders 1500 correctly", () => {
      expect(String(renderRate(1500))).toContain("1,500");
    });

    it("renders 3000 correctly", () => {
      expect(String(renderRate(3000))).toContain("3,000");
    });

    it("renders 0 as -", () => {
      expect(renderRate(0)).toBe("-");
    });

    it("renders undefined as -", () => {
      expect(renderRate(undefined)).toBe("-");
    });

    it("renders null as -", () => {
      expect(renderRate(null)).toBe("-");
    });

    it("renders a 5-digit value without decimals", () => {
      const result = String(renderRate(99999));
      expect(result).toMatch(/^₹/);
      expect(result).not.toContain(".");
    });
  });
});
