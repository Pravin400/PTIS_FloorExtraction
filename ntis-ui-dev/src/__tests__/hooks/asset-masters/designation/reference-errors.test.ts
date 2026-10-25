import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { getErrorMessage, isDeactivateBlockedMessage, mapDesignationApiError } from "@/hooks/asset-masters/designation/validation";
import designationEn from "@/i18n/locales/en/designation.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { designation: designationEn }, namespace: "designation" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Designation").
const DELETE = "This Designation cannot be deleted because it is in use.";
const DEACTIVATE = "This Designation cannot be deactivated because it is in use.";

describe("designation reference errors", () => {
  it.each([DELETE, DEACTIVATE])("delete toast translates %s", (message) => {
    expect(getErrorMessage(message, 400, t as never, tCommon as never, "Designation Master")).toBe(message);
  });

  it.each([DELETE, DEACTIVATE])("form submit translates %s", (message) => {
    expect(mapDesignationApiError({ message, statusCode: 400 }, t as never, tCommon as never)).toBe(message);
  });

  it("detects only the deactivate message", () => {
    expect(isDeactivateBlockedMessage(DEACTIVATE)).toBe(true);
    expect(isDeactivateBlockedMessage(DELETE)).toBe(false);
  });
});
