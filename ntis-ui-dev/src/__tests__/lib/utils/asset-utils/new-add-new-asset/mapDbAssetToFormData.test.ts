import { describe, it, expect } from "vitest";
import { mapDbAssetToFormData } from "@/lib/utils/asset-utils/new-add-new-asset/mapDbAssetToFormData";

describe("mapDbAssetToFormData - assetName blanking", () => {
  it("blanks out assetName when it matches category + type name (e.g. Building Municipal School)", () => {
    const dbAsset: Record<string, unknown> = {
      id: 101,
      assetName: "Building Municipal School",
      assetCategoryName: "Building",
      assetTypeName: "Municipal School",
    };
    const prev: Record<string, unknown> = {
      category: "Building Assets",
      assetType: "Municipal School",
    };

    const result = mapDbAssetToFormData(dbAsset, prev);
    expect(result.assetName).toBe("");
  });

  it("blanks out assetName when it matches type name alone (e.g. Municipal School)", () => {
    const dbAsset: Record<string, unknown> = {
      id: 102,
      assetName: "Municipal School",
      assetCategoryName: "Building",
      assetTypeName: "Municipal School",
    };
    const prev: Record<string, unknown> = {
      category: "Building Assets",
      assetType: "Municipal School",
    };

    const result = mapDbAssetToFormData(dbAsset, prev);
    expect(result.assetName).toBe("");
  });

  it("blanks out assetName when it is 'Draft Asset'", () => {
    const dbAsset: Record<string, unknown> = {
      id: 103,
      assetName: "Draft Asset",
    };
    const prev: Record<string, unknown> = {};

    const result = mapDbAssetToFormData(dbAsset, prev);
    expect(result.assetName).toBe("");
  });

  it("preserves genuine user-provided asset names", () => {
    const dbAsset: Record<string, unknown> = {
      id: 104,
      assetName: "Mahatma Gandhi High School",
      assetCategoryName: "Building",
      assetTypeName: "Municipal School",
    };
    const prev: Record<string, unknown> = {
      category: "Building Assets",
      assetType: "Municipal School",
    };

    const result = mapDbAssetToFormData(dbAsset, prev);
    expect(result.assetName).toBe("Mahatma Gandhi High School");
  });

  it("correctly maps pTaxId from details.PTaxId", () => {
    const dbAsset: Record<string, unknown> = {
      id: 201,
      details: {
        PTaxId: "PTAX-9999",
      },
    };
    const prev: Record<string, unknown> = {};

    const result = mapDbAssetToFormData(dbAsset, prev);
    expect(result.pTaxId).toBe("PTAX-9999");
    expect((result.attributes as Record<string, unknown>)?.pTaxId).toBe("PTAX-9999");
  });

  it("correctly maps pTaxId from top-level dbAsset.pTaxId", () => {
    const dbAsset: Record<string, unknown> = {
      id: 202,
      pTaxId: "PTAX-8888",
    };
    const prev: Record<string, unknown> = {};

    const result = mapDbAssetToFormData(dbAsset, prev);
    expect(result.pTaxId).toBe("PTAX-8888");
  });

  it("correctly maps mpmsNo from details.MpmsNo", () => {
    const dbAsset: Record<string, unknown> = {
      id: 203,
      details: {
        MpmsNo: "Velitrepud",
      },
    };
    const prev: Record<string, unknown> = {};

    const result = mapDbAssetToFormData(dbAsset, prev);
    expect(result.mpmsNo).toBe("Velitrepud");
    expect((result.attributes as Record<string, unknown>)?.mpmsNo).toBe("Velitrepud");
  });
});
