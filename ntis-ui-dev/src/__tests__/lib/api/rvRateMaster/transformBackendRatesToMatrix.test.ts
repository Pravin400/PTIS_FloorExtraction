import { describe, it, expect } from "vitest";
import { transformBackendRatesToMatrix } from "@/lib/api/rvRateMaster/rvRateMaster.helpers";
import type { IBackendRateMaster, IZoneDescription, RateCategory } from "@/types/RVRateMaster";

describe("transformBackendRatesToMatrix", () => {
  const mockConstructionTypes: RateCategory[] = [
    { constructionId: "1", constructionCode: "AA", description: "Category AA" },
    { constructionId: "2", constructionCode: "BB", description: "Category BB" },
  ];

  const mockZoneDescriptions: IZoneDescription[] = [
    { taxZoneId: 101, zoneNo: "1", description: "Zone 1 description" },
    { taxZoneId: 102, zoneNo: "2", description: "Zone 2 description" },
    { taxZoneId: 103, zoneNo: "PRE", description: "Newly added Tax Zone" },
  ];

  const mockBackendRates: IBackendRateMaster[] = [
    {
      id: 1,
      year: 2026,
      floorId: 1,
      constructionTypeId: 1,
      typeOfUseGroupId: 2,
      rateSectionId: 1,
      rateSectionNo: "KOPRI",
      taxZoneId: 101,
      taxZoneNo: "1",
      yearRangeRVId: 3,
      rateSquareMeter: 10,
      rateSquareFeet: 0.93,
      rateRemark: "YearWise Rate",
      isActive: true,
      createdDate: "2026-01-01",
      updatedDate: null,
    },
    {
      id: 2,
      year: 2026,
      floorId: 1,
      constructionTypeId: 2,
      typeOfUseGroupId: 2,
      rateSectionId: 1,
      rateSectionNo: "KOPRI",
      taxZoneId: 101,
      taxZoneNo: "1",
      yearRangeRVId: 3,
      rateSquareMeter: 20,
      rateSquareFeet: 1.86,
      rateRemark: "YearWise Rate",
      isActive: true,
      createdDate: "2026-01-01",
      updatedDate: null,
    },
    {
      id: 3,
      year: 2026,
      floorId: 1,
      constructionTypeId: 1,
      typeOfUseGroupId: 2,
      rateSectionId: 1,
      rateSectionNo: "KOPRI",
      taxZoneId: 102,
      taxZoneNo: "2",
      yearRangeRVId: 3,
      rateSquareMeter: 15,
      rateSquareFeet: 1.39,
      rateRemark: "YearWise Rate",
      isActive: true,
      createdDate: "2026-01-01",
      updatedDate: null,
    },
  ];

  it("should include all active tax zones from zoneDescriptions even if they have no existing rates", () => {
    const result = transformBackendRatesToMatrix(
      mockBackendRates,
      mockConstructionTypes,
      mockZoneDescriptions,
      false
    );

    expect(result).toHaveLength(3);

    // Zone 1
    const zone1 = result.find((r) => r.zoneNo === "1");
    expect(zone1).toBeDefined();
    expect(zone1?.rateSection).toBe("KOPRI");
    expect(zone1?.assessmentYear).toBe("3");
    expect(zone1?.useGroup).toBe("2");
    expect(zone1?.rates.find((r) => r.rateCategory === "AA")?.ratePerSqMtr).toBe(10);
    expect(zone1?.rates.find((r) => r.rateCategory === "BB")?.ratePerSqMtr).toBe(20);

    // Zone 2
    const zone2 = result.find((r) => r.zoneNo === "2");
    expect(zone2).toBeDefined();
    expect(zone2?.rates.find((r) => r.rateCategory === "AA")?.ratePerSqMtr).toBe(15);
    expect(zone2?.rates.find((r) => r.rateCategory === "BB")?.ratePerSqMtr).toBeNull();

    // Newly added Tax Zone "PRE" (has no backend rates)
    const zonePRE = result.find((r) => r.zoneNo === "PRE");
    expect(zonePRE).toBeDefined();
    expect(zonePRE?.rateSection).toBe("KOPRI");
    expect(zonePRE?.assessmentYear).toBe("3");
    expect(zonePRE?.useGroup).toBe("2");
    expect(zonePRE?.rates.find((r) => r.rateCategory === "AA")?.ratePerSqMtr).toBeNull();
    expect(zonePRE?.rates.find((r) => r.rateCategory === "BB")?.ratePerSqMtr).toBeNull();
  });

  it("should include newly added construction types as columns with null rates for all zones", () => {
    const constructionTypesWithNew: RateCategory[] = [
      ...mockConstructionTypes,
      { constructionId: "99", constructionCode: "NEW_CONST", description: "New Construction Type" },
    ];

    const result = transformBackendRatesToMatrix(
      mockBackendRates,
      constructionTypesWithNew,
      mockZoneDescriptions,
      false
    );

    expect(result).toHaveLength(3);

    result.forEach((row) => {
      const newCol = row.rates.find((r) => r.rateCategory === "NEW_CONST");
      expect(newCol).toBeDefined();
      expect(newCol?.ratePerSqMtr).toBeNull();
    });
  });

  it("should preserve the exact order of zoneDescriptions", () => {
    const orderedZones: IZoneDescription[] = [
      { taxZoneId: 1, zoneNo: "1", description: "" },
      { taxZoneId: 2, zoneNo: "2", description: "" },
      { taxZoneId: 3, zoneNo: "test", description: "" },
      { taxZoneId: 4, zoneNo: "MI", description: "" },
      { taxZoneId: 5, zoneNo: "30", description: "" },
      { taxZoneId: 6, zoneNo: "PRE", description: "" },
    ];

    const result = transformBackendRatesToMatrix(
      mockBackendRates,
      mockConstructionTypes,
      orderedZones,
      false
    );

    expect(result.map((r) => r.zoneNo)).toEqual(["1", "2", "test", "MI", "30", "PRE"]);
  });

  it("should return empty array when backendData is empty", () => {
    const result = transformBackendRatesToMatrix(
      [],
      mockConstructionTypes,
      mockZoneDescriptions,
      false
    );

    expect(result).toEqual([]);
  });

  it("should handle open plot mode and include all active tax zones", () => {
    const openPlotCategories: RateCategory[] = [
      { constructionId: "10", constructionCode: "OP_COMM", typeOfUseGroupId: 5, description: "Open Plot Commercial" },
      { constructionId: "11", constructionCode: "OP_RES", typeOfUseGroupId: 6, description: "Open Plot Residential" },
    ];

    const openPlotBackendRates: IBackendRateMaster[] = [
      {
        id: 10,
        year: 2026,
        floorId: 1,
        constructionTypeId: 0,
        typeOfUseGroupId: 5,
        rateSectionId: 1,
        rateSectionNo: "KOPRI",
        taxZoneId: 101,
        taxZoneNo: "1",
        yearRangeRVId: 3,
        rateSquareMeter: 50,
        rateSquareFeet: 4.65,
        rateRemark: "YearWise Rate",
        isActive: true,
        createdDate: "2026-01-01",
        updatedDate: null,
      },
    ];

    const result = transformBackendRatesToMatrix(
      openPlotBackendRates,
      openPlotCategories,
      mockZoneDescriptions,
      true
    );

    expect(result).toHaveLength(3);
    const zonePRE = result.find((r) => r.zoneNo === "PRE");
    expect(zonePRE).toBeDefined();
    expect(zonePRE?.rates.find((r) => r.rateCategory === "OP_COMM")?.ratePerSqMtr).toBeNull();
    expect(zonePRE?.rates.find((r) => r.rateCategory === "OP_RES")?.ratePerSqMtr).toBeNull();

    const zone1 = result.find((r) => r.zoneNo === "1");
    expect(zone1?.rates.find((r) => r.rateCategory === "OP_COMM")?.ratePerSqMtr).toBe(50);
  });
});
