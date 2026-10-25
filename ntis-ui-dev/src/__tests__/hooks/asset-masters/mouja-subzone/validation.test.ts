import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { getErrorMessage, isDeactivateBlockedMessage } from "@/hooks/asset-masters/mouja-subzone/validation";
import moujaSubzoneEn from "@/i18n/locales/en/moujaSubzone.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { moujaSubzone: moujaSubzoneEn }, namespace: "moujaSubzone" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });
const map = (message: string) => getErrorMessage(message, 400, t as never, tCommon as never, "Mouja Master");

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Mouja" / "Sub Zone").
const MOUJA_DELETE = "This Mouja cannot be deleted because it has Sub Zones. Please delete all Sub Zones for this Mouja first.";
const MOUJA_DEACTIVATE = "This Mouja cannot be deactivated because it has Sub Zones. Please delete all Sub Zones for this Mouja first.";
const SUB_ZONE_DELETE = "This Sub Zone cannot be deleted because it has CV Rates. Please delete all CV Rates for this Sub Zone first.";
const SUB_ZONE_DEACTIVATE = "This Sub Zone cannot be deactivated because it has CV Rates. Please delete all CV Rates for this Sub Zone first.";

describe("mouja-subzone getErrorMessage reference errors", () => {
  it.each([MOUJA_DELETE, MOUJA_DEACTIVATE, SUB_ZONE_DELETE, SUB_ZONE_DEACTIVATE])("translates %s", (message) => {
    expect(map(message)).toBe(message);
  });

  it("detects only the deactivate messages", () => {
    expect(isDeactivateBlockedMessage(MOUJA_DEACTIVATE)).toBe(true);
    expect(isDeactivateBlockedMessage(SUB_ZONE_DEACTIVATE)).toBe(true);
    expect(isDeactivateBlockedMessage(MOUJA_DELETE)).toBe(false);
    expect(isDeactivateBlockedMessage(SUB_ZONE_DELETE)).toBe(false);
  });
});
