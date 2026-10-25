import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { mapAssetCategoryApiError, getErrorMessage, isDeactivateBlockedMessage } from "@/hooks/asset-masters/asset-category/validation";
import assetEn from "@/i18n/locales/en/asset.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { asset: assetEn }, namespace: "asset.configuration.masterData.form" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Asset Category").
const DELETE_IN_USE = "This Asset Category cannot be deleted because it is in use.";
const DEACTIVATE_IN_USE = "This Asset Category cannot be deactivated because it is in use.";
const hasMasters = (verb: "deleted" | "deactivated", masters: string) =>
  `This Asset Category cannot be ${verb} because it has ${masters}. Please delete all ${masters} for this Asset Category first.`;
const ALL_MASTERS =
  "Asset Types, Asset Document Definitions, Asset Field Definitions, Type Of Uses, Asset Photo Types, Asset Room Types, Inventory Categories and Asset Conditions";
const ONE = hasMasters("deleted", "Asset Types");
const TWO = hasMasters("deactivated", "Inventory Categories and Asset Conditions");
const THREE = hasMasters("deleted", "Asset Types, Type Of Uses and Asset Room Types");
const ALL = hasMasters("deleted", ALL_MASTERS);
const ALL_DEACTIVATE = hasMasters("deactivated", ALL_MASTERS);

describe("asset-category reference-check errors", () => {
  it.each([DELETE_IN_USE, DEACTIVATE_IN_USE, ONE, TWO, THREE, ALL, ALL_DEACTIVATE])("mapAssetCategoryApiError translates %s", (message) => {
    expect(mapAssetCategoryApiError({ statusCode: 400, message }, t as never, tCommon as never)).toBe(message);
  });

  it("translates the delete toast message (error field) from the list action", () => {
    expect(mapAssetCategoryApiError({ error: ALL }, t as never, tCommon as never)).toBe(ALL);
  });

  it.each([DELETE_IN_USE, DEACTIVATE_IN_USE, ONE, TWO, THREE])("getErrorMessage translates %s", (message) => {
    expect(getErrorMessage(message, 400, t as never, tCommon as never)).toBe(message);
  });

  it("detects only the deactivate messages", () => {
    expect(isDeactivateBlockedMessage(DEACTIVATE_IN_USE)).toBe(true);
    expect(isDeactivateBlockedMessage(ALL_DEACTIVATE)).toBe(true);
    expect(isDeactivateBlockedMessage(DELETE_IN_USE)).toBe(false);
    expect(isDeactivateBlockedMessage(ALL)).toBe(false);
  });
});
