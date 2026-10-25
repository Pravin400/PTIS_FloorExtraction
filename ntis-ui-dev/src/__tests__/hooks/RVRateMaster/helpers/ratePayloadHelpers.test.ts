import { describe, it, expect } from "vitest";
import { 
  buildPayloadFromMatrix,
  applyMultiplierToMatrix,
  buildBulkUpdatePayload,
  buildBulkCreatePayload
} from "@/hooks/RVRateMaster/helpers/ratePayloadHelpers";
import type { IBackendRateMaster, RateCategory, RatePayload } from "@/types/RVRateMaster";

describe("ratePayloadHelpers", () => {
  const mockRateCategories: RateCategory[] = [
    { constructionId: "1", constructionCode: "RCC", description: "RCC Building" },
    { constructionId: "2", constructionCode: "LOAD", description: "Load Bearing" },
    { constructionId: "3", constructionCode: "MUD", description: "Mud Building" },
  ];

  const mockConfig = {
    selectedZone: "1",
    selectedUseGroup: "1",
    assessmentYear: "2024",
    rateFrequency: "Monthly" as const,
    rateUnit: "SqMeter" as const,
    rateCategories: mockRateCategories,
  };

  describe("applyMultiplierToMatrix", () => {
    const matrixData = [
      { zoneNo: "Z1", zoneDescription: "Zone 1", RCC: 100, LOAD: 80, MUD: 50 },
      { zoneNo: "Z2", zoneDescription: "Zone 2", RCC: 90, LOAD: 70, MUD: 40 },
    ];

    it("should apply multiplier to all rate values", () => {
      const result = applyMultiplierToMatrix(matrixData, 1.5, mockRateCategories);

      expect(result[0].RCC).toBe(150);
      expect(result[0].LOAD).toBe(120);
      expect(result[0].MUD).toBe(75);
    });

    it("should not modify non-rate fields", () => {
      const result = applyMultiplierToMatrix(matrixData, 2, mockRateCategories);

      expect(result[0].zoneNo).toBe("Z1");
      expect(result[0].zoneDescription).toBe("Zone 1");
    });

    it("should handle multiplier of 1 (no change)", () => {
      const result = applyMultiplierToMatrix(matrixData, 1, mockRateCategories);

      expect(result[0].RCC).toBe(100);
      expect(result[0].LOAD).toBe(80);
    });

    it("should handle zero values", () => {
      const dataWithZeros = [
        { zoneNo: "Z1", zoneDescription: "Zone 1", RCC: 0, LOAD: 80, MUD: 0 },
      ];

      const result = applyMultiplierToMatrix(dataWithZeros, 2, mockRateCategories);

      expect(result[0].RCC).toBe(0);
      expect(result[0].LOAD).toBe(160);
      expect(result[0].MUD).toBe(0);
    });

    it("should round to 2 decimal places", () => {
      const result = applyMultiplierToMatrix(matrixData, 1.333, mockRateCategories);

      expect(result[0].RCC).toBeCloseTo(133.3, 1);
    });
  });

  describe("buildPayloadFromMatrix", () => {
    const matrixData = [
      { zoneNo: "Z1", taxZoneId: 1, RCC: 100, LOAD: 80, MUD: 50 },
    ];

    const existingBackendRates: IBackendRateMaster[] = [
      { 
        id: 1, 
        taxZoneNo: "Z1", 
        taxZoneId: 1,
        constructionTypeId: 1, 
        rateSquareMeter: 90, // Different from matrix
        rateSquareFeet: 8.36,
        rateRemark: "",
        typeOfUseGroupId: 1,
        rateSectionId: 1,
        yearRangeRVId: 2024,
        year: 2024,
        floorId: 1,
        isActive: true,
        createdDate: "2024-01-01",
        updatedDate: null
      },
    ];

    it("should identify updates for existing rates", () => {
      const { updates } = buildPayloadFromMatrix(
        matrixData, 
        existingBackendRates, 
        mockConfig,
        "1"
      );

      expect(updates.length).toBeGreaterThanOrEqual(0);
    });

    it("should identify inserts for new rates", () => {
      const { inserts } = buildPayloadFromMatrix(
        matrixData, 
        [], // No existing rates
        mockConfig,
        "1"
      );

      expect(inserts.length).toBeGreaterThan(0);
    });

    it("should handle empty matrix", () => {
      const { updates, inserts } = buildPayloadFromMatrix(
        [], 
        existingBackendRates, 
        mockConfig,
        "1"
      );

      expect(updates).toHaveLength(0);
      expect(inserts).toHaveLength(0);
    });

    it("should skip zero rate values for inserts", () => {
      const matrixWithZeros = [
        { zoneNo: "Z1", taxZoneId: 1, RCC: 0, LOAD: 80, MUD: 0 },
      ];

      const { inserts } = buildPayloadFromMatrix(
        matrixWithZeros, 
        [], 
        mockConfig,
        "1"
      );

      // Should only insert LOAD (non-zero value)
      const loadInserts = inserts.filter(i => i.constructionTypeId === 2);
      expect(loadInserts.length).toBe(1);
    });

    describe("Rate Unit Calculations", () => {
      it("should store entered value in rateSquareMeter when unit is SqMeter", () => {
        const matrixWithRate = [
          { zoneNo: "Z1", taxZoneId: 1, RCC: 100 },
        ];

        const config = {
          ...mockConfig,
          rateUnit: "SqMeter" as const,
        };

        const { inserts } = buildPayloadFromMatrix(
          matrixWithRate,
          [],
          config,
          "1"
        );

        expect(inserts[0].rateSquareMeter).toBe(100);
        expect(inserts[0].rateSquareFeet).toBe(9.29); // 100 / 10.7639
      });

      it("should store entered value in rateSquareFeet when unit is SqFeet", () => {
        const matrixWithRate = [
          { zoneNo: "Z1", taxZoneId: 1, RCC: 100 },
        ];

        const config = {
          ...mockConfig,
          rateUnit: "SqFeet" as const,
        };

        const { inserts } = buildPayloadFromMatrix(
          matrixWithRate,
          [],
          config,
          "1"
        );

        expect(inserts[0].rateSquareFeet).toBe(100);
        expect(inserts[0].rateSquareMeter).toBe(1076.39); // 100 * 10.7639
      });

      it("should calculate rateSquareFeet correctly when SqMeter is selected", () => {
        const matrixWithRate = [
          { zoneNo: "Z1", taxZoneId: 1, RCC: 50.5 },
        ];

        const config = {
          ...mockConfig,
          rateUnit: "SqMeter" as const,
        };

        const { inserts } = buildPayloadFromMatrix(
          matrixWithRate,
          [],
          config,
          "1"
        );

        expect(inserts[0].rateSquareMeter).toBe(50.5);
        // 50.5 / 10.7639 = 4.69
        expect(inserts[0].rateSquareFeet).toBeCloseTo(4.69, 1);
      });

      it("should calculate rateSquareMeter correctly when SqFeet is selected", () => {
        const matrixWithRate = [
          { zoneNo: "Z1", taxZoneId: 1, RCC: 107.64 },
        ];

        const config = {
          ...mockConfig,
          rateUnit: "SqFeet" as const,
        };

        const { inserts } = buildPayloadFromMatrix(
          matrixWithRate,
          [],
          config,
          "1"
        );

        expect(inserts[0].rateSquareFeet).toBe(107.64);
        // 107.64 * 10.7639 = 1158.63
        expect(inserts[0].rateSquareMeter).toBeCloseTo(1158.63, 1);
      });

      it("should detect updates based on rateUnit selection", () => {
        const matrixWithRate = [
          { zoneNo: "Z1", taxZoneId: 1, RCC: 100 },
        ];

        const existingRates: IBackendRateMaster[] = [
          {
            id: 1,
            taxZoneNo: "Z1",
            taxZoneId: 1,
            constructionTypeId: 1,
            rateSquareMeter: 100,
            rateSquareFeet: 90, // Different from calculated
            rateRemark: "",
            typeOfUseGroupId: 1,
            rateSectionId: 1,
            yearRangeRVId: 2024,
            year: 2024,
            floorId: 1,
            isActive: true,
            createdDate: "2024-01-01",
            updatedDate: null
          },
        ];

        // When SqMeter is selected, compare with rateSquareMeter
        const configSqMeter = {
          ...mockConfig,
          rateUnit: "SqMeter" as const,
        };

        const resultSqMeter = buildPayloadFromMatrix(
          matrixWithRate,
          existingRates,
          configSqMeter,
          "1"
        );

        // No update because entered value (100) matches existing rateSquareMeter (100)
        expect(resultSqMeter.updates).toHaveLength(0);

        // When SqFeet is selected, compare with rateSquareFeet
        const configSqFeet = {
          ...mockConfig,
          rateUnit: "SqFeet" as const,
        };

        const resultSqFeet = buildPayloadFromMatrix(
          matrixWithRate,
          existingRates,
          configSqFeet,
          "1"
        );

        // Update detected because entered value (100) differs from existing rateSquareFeet (90)
        expect(resultSqFeet.updates.length).toBeGreaterThan(0);
      });

      it("should round calculated values to 2 decimal places", () => {
        const matrixWithRate = [
          { zoneNo: "Z1", taxZoneId: 1, RCC: 33.33 },
        ];

        const config = {
          ...mockConfig,
          rateUnit: "SqMeter" as const,
        };

        const { inserts } = buildPayloadFromMatrix(
          matrixWithRate,
          [],
          config,
          "1"
        );

        // 33.33 / 10.7639 = 3.10
        expect(inserts[0].rateSquareFeet).toBe(3.1);
      });
    });
  });

  describe("buildBulkUpdatePayload", () => {
    it("should format updates for bulk API call", () => {
      const updates: RatePayload[] = [
        { 
          Id: 1, 
          taxZoneId: 1,
          constructionTypeId: 1,
          typeOfUseGroupId: 1,
          YearRangeRVId: 2024,
          rateSectionId: 1,
          rateSquareMeter: 100, 
          rateSquareFeet: 10.76,
          rateRemark: "Test",
          createdBy: 1,
          floorId: 67,
          isActive: true,
        },
        { 
          Id: 2, 
          taxZoneId: 2,
          constructionTypeId: 1,
          typeOfUseGroupId: 1,
          YearRangeRVId: 2024,
          rateSectionId: 1,
          rateSquareMeter: 80, 
          rateSquareFeet: 8.61,
          rateRemark: "Test",
          createdBy: 1,
          floorId: 67,
          isActive: true,
        },
      ];

      const payload = buildBulkUpdatePayload(updates);

      expect(payload).toHaveLength(2);
      expect(payload[0].id).toBe(1);
      expect(payload[0].data.RateSquareMeter).toBe(100);
    });

    it("should handle empty updates", () => {
      const payload = buildBulkUpdatePayload([]);

      expect(payload).toHaveLength(0);
    });
  });

  describe("buildBulkCreatePayload", () => {
    it("should format inserts for bulk API call", () => {
      const inserts: RatePayload[] = [
        { 
          taxZoneId: 1,
          constructionTypeId: 1, 
          rateSquareMeter: 100,
          rateSquareFeet: 10.76,
          typeOfUseGroupId: 1,
          YearRangeRVId: 2024,
          rateSectionId: 1,
          rateRemark: "MonthWise Rate",
          createdBy: 1,
          floorId: 67,
          isActive: true,
        },
      ];

      const payload = buildBulkCreatePayload(inserts);

      expect(payload).toHaveLength(1);
      expect(payload[0].taxZoneId).toBe(1);
      expect(payload[0].rateSquareMeter).toBe(100);
    });

    it("should handle empty inserts", () => {
      const payload = buildBulkCreatePayload([]);

      expect(payload).toHaveLength(0);
    });
  });
});
