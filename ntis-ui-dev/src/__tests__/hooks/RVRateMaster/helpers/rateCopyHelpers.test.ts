import { describe, it, expect } from "vitest";
import { 
  processRatesForCopy,
  buildZoneEditsFromRates,
  applyRatesToMatrix
} from "@/hooks/RVRateMaster/helpers/rateCopyHelpers";
import type { IBackendRateMaster, RateCategory, IZoneDescription } from "@/types/RVRateMaster";

describe("rateCopyHelpers", () => {
  const mockRateCategories: RateCategory[] = [
    { constructionId: "1", constructionCode: "RCC", description: "RCC Building" },
    { constructionId: "2", constructionCode: "LOAD", description: "Load Bearing" },
    { constructionId: "3", constructionCode: "MUD", description: "Mud Building" },
  ];

  const mockZoneDescriptions: IZoneDescription[] = [
    { taxZoneId: 1, zoneNo: "Z1", description: "Zone 1" },
    { taxZoneId: 2, zoneNo: "Z2", description: "Zone 2" },
  ];

  const mockBackendRates: IBackendRateMaster[] = [
    { 
      id: 1, 
      taxZoneNo: "Z1", 
      taxZoneId: 1,
      constructionTypeId: 1, 
      rateSquareMeter: 100,
      rateSquareFeet: 9.29,
      rateRemark: "",
      typeOfUseGroupId: 1,
      rateSectionId: 1,
      yearRangeRVId: 1,
      year: 2024,
      floorId: 1,
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null
    },
    { 
      id: 2, 
      taxZoneNo: "Z1", 
      taxZoneId: 1,
      constructionTypeId: 2, 
      rateSquareMeter: 80,
      rateSquareFeet: 7.43,
      rateRemark: "",
      typeOfUseGroupId: 1,
      rateSectionId: 1,
      yearRangeRVId: 1,
      year: 2024,
      floorId: 1,
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null
    },
    { 
      id: 3, 
      taxZoneNo: "Z2", 
      taxZoneId: 2,
      constructionTypeId: 1, 
      rateSquareMeter: 90,
      rateSquareFeet: 8.36,
      rateRemark: "",
      typeOfUseGroupId: 1,
      rateSectionId: 1,
      yearRangeRVId: 1,
      year: 2024,
      floorId: 1,
      isActive: true,
      createdDate: "2024-01-01",
      updatedDate: null
    },
  ];

  describe("processRatesForCopy", () => {
    it("should process rates into a zone-keyed map", () => {
      const result = processRatesForCopy(mockBackendRates);

      expect(result.ratesByZone).toBeDefined();
      expect(result.ratesByZone.has("1")).toBe(true); // taxZoneId as key
      expect(result.ratesByZone.has("2")).toBe(true);
    });

    it("should map construction type IDs to rate values", () => {
      const result = processRatesForCopy(mockBackendRates);

      const zone1Rates = result.ratesByZone.get("1");
      expect(zone1Rates?.get("1")).toBe(100); // constructionTypeId 1 = 100
      expect(zone1Rates?.get("2")).toBe(80);  // constructionTypeId 2 = 80
    });

    it("should handle empty rates array", () => {
      const result = processRatesForCopy([]);

      expect(result.ratesByZone.size).toBe(0);
    });
  });

  describe("buildZoneEditsFromRates", () => {
    it("should build zone edits from rates map", () => {
      const processedRates = processRatesForCopy(mockBackendRates);
      const result = buildZoneEditsFromRates(
        processedRates.ratesByZone, 
        mockZoneDescriptions, 
        mockRateCategories
      );

      expect(result["Z1"]).toBeDefined();
      expect(result["Z1"]["RCC"]).toBe(100);
      expect(result["Z1"]["LOAD"]).toBe(80);
    });

    it("should handle zones without rates", () => {
      const emptyRates = new Map<string, Map<string, number>>();
      const result = buildZoneEditsFromRates(
        emptyRates, 
        mockZoneDescriptions, 
        mockRateCategories
      );

      // Should still have zone entries, just empty
      expect(result["Z1"]).toBeDefined();
      expect(Object.keys(result["Z1"])).toHaveLength(0);
    });
  });

  describe("applyRatesToMatrix", () => {
    const existingMatrix = [
      { id: 1, zoneNo: "Z1", taxZoneId: 1, RCC: 50, LOAD: 40, MUD: 30 },
      { id: 2, zoneNo: "Z2", taxZoneId: 2, RCC: 45, LOAD: 35, MUD: 25 },
    ];

    it("should apply copied rates to matrix", () => {
      const processedRates = processRatesForCopy(mockBackendRates);
      const result = applyRatesToMatrix(
        existingMatrix, 
        processedRates.ratesByZone, 
        mockZoneDescriptions, 
        mockRateCategories
      );

      expect(result[0].RCC).toBe(100);
      expect(result[0].LOAD).toBe(80);
    });

    it("should preserve zones not in copied rates", () => {
      const singleZoneRates = processRatesForCopy([mockBackendRates[0]]);
      const result = applyRatesToMatrix(
        existingMatrix, 
        singleZoneRates.ratesByZone, 
        mockZoneDescriptions, 
        mockRateCategories
      );

      // Z1 should have updated value
      expect(result[0].RCC).toBe(100);
    });

    it("should handle empty rates map", () => {
      const emptyRates = new Map<string, Map<string, number>>();
      const result = applyRatesToMatrix(
        existingMatrix, 
        emptyRates, 
        mockZoneDescriptions, 
        mockRateCategories
      );

      // Matrix should remain unchanged
      expect(result).toHaveLength(2);
    });
  });
});
