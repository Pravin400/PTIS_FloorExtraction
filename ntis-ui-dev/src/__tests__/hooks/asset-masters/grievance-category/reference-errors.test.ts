import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import {
  getCategoryErrorMessage,
  isDeactivateBlockedMessage,
  mapGrievanceCategoryApiError,
} from "@/hooks/asset-masters/grievance-category/validation";
import assetGrievanceCategoryEn from "@/i18n/locales/en/assetGrievanceCategory.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { assetGrievanceCategory: assetGrievanceCategoryEn }, namespace: "assetGrievanceCategory" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Grievance Category", CheckMasters "Grievance Remarks").
const DELETE = "This Grievance Category cannot be deleted because it has Grievance Remarks. Please delete all Grievance Remarks for this Grievance Category first.";
const DEACTIVATE = "This Grievance Category cannot be deactivated because it has Grievance Remarks. Please delete all Grievance Remarks for this Grievance Category first.";

describe("grievance category reference errors", () => {
  it.each([DELETE, DEACTIVATE])("delete toast translates %s", (message) => {
    expect(getCategoryErrorMessage(message, 400, t as never, tCommon as never, "Grievance Category")).toBe(message);
  });

  it.each([DELETE, DEACTIVATE])("form submit translates %s", (message) => {
    expect(mapGrievanceCategoryApiError({ message, statusCode: 400 }, t as never, tCommon as never)).toBe(message);
  });

  it("detects only the deactivate message", () => {
    expect(isDeactivateBlockedMessage(DEACTIVATE)).toBe(true);
    expect(isDeactivateBlockedMessage(DELETE)).toBe(false);
  });
});
