import { describe, it, expect } from "vitest";
import { 
  parseExcelOrCsvContent, 
  validateFileType,
  applyImportedEditsToMatrix 
} from "@/hooks/RVRateMaster/helpers/rateImportHelpers";
import type { IZoneDescription, RateCategory } from "@/types/RVRateMaster";

describe("rateImportHelpers", () => {
  const mockRateCategories: RateCategory[] = [
    { constructionId: "1", constructionCode: "RCC", description: "RCC Building" },
    { constructionId: "2", constructionCode: "LOAD", description: "Load Bearing" },
    { constructionId: "3", constructionCode: "MUD", description: "Mud Building" },
  ];

  const mockZoneDescriptions: IZoneDescription[] = [
    { taxZoneId: 1, zoneNo: "Z1", description: "Zone 1" },
    { taxZoneId: 2, zoneNo: "Z2", description: "Zone 2" },
  ];

  const mockT = ((key: string) => key) as unknown as ReturnType<typeof import("next-intl").useTranslations>;

  describe("validateFileType", () => {
    it("should accept CSV files", () => {
      const file = new File([""], "test.csv", { type: "text/csv" });
      expect(validateFileType(file)).toBe(true);
    });

    it("should accept files with .csv extension", () => {
      const file = new File([""], "test.csv", { type: "application/octet-stream" });
      expect(validateFileType(file)).toBe(true);
    });

    it("should accept XLSX files", () => {
      const file = new File([""], "test.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      expect(validateFileType(file)).toBe(true);
    });

    it("should accept XLS files", () => {
      const file = new File([""], "test.xls", { type: "application/vnd.ms-excel" });
      expect(validateFileType(file)).toBe(true);
    });

    it("should reject non-excel/non-csv files", () => {
      const file = new File([""], "test.txt", { type: "text/plain" });
      expect(validateFileType(file)).toBe(false);
    });
  });

  describe("parseExcelOrCsvContent", () => {
    it("should parse valid CSV content correctly", () => {
      const csvContent = `Tax Zone No,RCC (Rs./Sq.mtr),LOAD (Rs./Sq.mtr),MUD (Rs./Sq.mtr)
Z1,100,80,50
Z2,90,70,40`;

      const result = parseExcelOrCsvContent(
        csvContent,
        "csv",
        mockZoneDescriptions,
        mockRateCategories,
        "SqMeter",
        mockT
      );

      expect(result.zoneEdits).toBeDefined();
      expect(result.zoneEdits["Z1"]).toBeDefined();
      expect(result.zoneEdits["Z1"]["RCC"]).toBe(100);
      expect(result.zoneEdits["Z1"]["LOAD"]).toBe(80);
      expect(result.zoneEdits["Z1"]["MUD"]).toBe(50);
    });

    it("should return imported rate count", () => {
      const csvContent = `Tax Zone No,RCC (Rs./Sq.mtr),LOAD (Rs./Sq.mtr),MUD (Rs./Sq.mtr)
Z1,100,80,50
Z2,90,70,40`;

      const result = parseExcelOrCsvContent(
        csvContent,
        "csv",
        mockZoneDescriptions,
        mockRateCategories,
        "SqMeter",
        mockT
      );

      expect(result.importedRateCount).toBe(6);
    });

    it("should throw error if header column is modified", () => {
      const csvContent = `Modified Tax Zone No,RCC (Rs./Sq.mtr),LOAD (Rs./Sq.mtr),MUD (Rs./Sq.mtr)
Z1,100,80,50
Z2,90,70,40`;

      expect(() => parseExcelOrCsvContent(
        csvContent,
        "csv",
        mockZoneDescriptions,
        mockRateCategories,
        "SqMeter",
        mockT
      )).toThrow("messages.validationCorrectTemplate");
    });

    it("should throw error if row zone is modified", () => {
      const csvContent = `Tax Zone No,RCC (Rs./Sq.mtr),LOAD (Rs./Sq.mtr),MUD (Rs./Sq.mtr)
Z1_Modified,100,80,50
Z2,90,70,40`;

      expect(() => parseExcelOrCsvContent(
        csvContent,
        "csv",
        mockZoneDescriptions,
        mockRateCategories,
        "SqMeter",
        mockT
      )).toThrow("messages.validationCorrectTemplate");
    });

    it("should throw error if row count is different", () => {
      const csvContent = `Tax Zone No,RCC (Rs./Sq.mtr),LOAD (Rs./Sq.mtr),MUD (Rs./Sq.mtr)
Z1,100,80,50`;

      expect(() => parseExcelOrCsvContent(
        csvContent,
        "csv",
        mockZoneDescriptions,
        mockRateCategories,
        "SqMeter",
        mockT
      )).toThrow("messages.validationCorrectTemplate");
    });

    it("should parse numeric decimal values correctly", () => {
      const csvContent = `Tax Zone No,RCC (Rs./Sq.mtr),LOAD (Rs./Sq.mtr),MUD (Rs./Sq.mtr)
Z1,100.5,80.25,50.75
Z2,90,70,40`;

      const result = parseExcelOrCsvContent(
        csvContent,
        "csv",
        mockZoneDescriptions,
        mockRateCategories,
        "SqMeter",
        mockT
      );

      expect(result.zoneEdits["Z1"]["RCC"]).toBeCloseTo(100.5);
      expect(result.zoneEdits["Z1"]["LOAD"]).toBeCloseTo(80.25);
      expect(result.zoneEdits["Z1"]["MUD"]).toBeCloseTo(50.75);
    });
  });

  describe("applyImportedEditsToMatrix", () => {
    const existingMatrix = [
      { id: 1, zoneNo: "Z1", RCC: 50, LOAD: 40, MUD: 30 },
      { id: 2, zoneNo: "Z2", RCC: 45, LOAD: 35, MUD: 25 },
    ];

    it("should apply imported edits to matching zones", () => {
      const importedEdits: Record<string, Record<string, number>> = {
        "Z1": { RCC: 100, LOAD: 80, MUD: 50 },
      };

      const result = applyImportedEditsToMatrix(existingMatrix, importedEdits);

      expect(result[0].RCC).toBe(100);
      expect(result[0].LOAD).toBe(80);
      expect(result[0].MUD).toBe(50);
      // Z2 should remain unchanged
      expect(result[1].RCC).toBe(45);
    });
  });
});
