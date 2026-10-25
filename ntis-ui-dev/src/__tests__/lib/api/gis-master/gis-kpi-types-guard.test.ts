import { describe, it, expect } from "vitest";
import {
  isGisKpiMasterShape,
  isGisKpiPagedResponse,
  normalizeGisKpiMaster,
} from "@/lib/api/gis-master/gis-kpi-types-guard";

describe("gis-kpi-types-guard", () => {
  it("should validate a valid GisKpiMaster shape", () => {
    const raw = {
      id: 1,
      kpiCode: "TOTAL_ASSETS",
      defaultTitle: "Total Properties / Assets",
      defaultIcon: "fa-building",
      defaultColor: "#2563EB",
      isActive: true,
      createdDate: "2026-09-29T19:01:36.4",
      updatedDate: null,
    };
    expect(isGisKpiMasterShape(raw)).toBe(true);
  });

  it("should reject invalid shape missing id", () => {
    const raw = {
      kpiCode: "TOTAL_ASSETS",
    };
    expect(isGisKpiMasterShape(raw)).toBe(false);
  });

  it("should correctly normalize a valid GisKpiMaster", () => {
    const raw = {
      id: 1,
      kpiCode: " TOTAL_ASSETS ",
      defaultTitle: " Total Properties / Assets ",
      defaultIcon: "fa-building",
      defaultColor: "#2563EB",
      isActive: "true",
      createdDate: "2026-09-29T19:01:36.4",
    };
    const normalized = normalizeGisKpiMaster(raw);
    expect(normalized.id).toBe(1);
    expect(normalized.kpiCode).toBe("TOTAL_ASSETS");
    expect(normalized.defaultTitle).toBe("Total Properties / Assets");
    expect(normalized.isActive).toBe(true);
  });

  it("should validate paged response shape", () => {
    const paged = {
      items: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 0,
      hasPrevious: false,
      hasNext: false,
    };
    expect(isGisKpiPagedResponse(paged)).toBe(true);
  });
});
