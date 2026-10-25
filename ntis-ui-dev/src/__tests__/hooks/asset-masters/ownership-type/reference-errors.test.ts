import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { isDeactivateBlockedMessage, mapOwnershipTypeApiError } from "@/hooks/asset-masters/ownership-type/validation";
import ownershipTypeEn from "@/i18n/locales/en/ownership-type.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { ownershipType: ownershipTypeEn }, namespace: "ownershipType" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Ownership Type").
const DELETE = "This Ownership Type cannot be deleted because it is in use.";
const DEACTIVATE = "This Ownership Type cannot be deactivated because it is in use.";

describe("ownership type reference errors", () => {
  // The ownership-type actions return the backend text in `error`.
  it.each([DELETE, DEACTIVATE])("translates %s from error", (message) => {
    expect(mapOwnershipTypeApiError({ success: false, error: message, statusCode: 400 }, t as never, tCommon as never)).toBe(message);
  });

  it.each([DELETE, DEACTIVATE])("translates %s from message", (message) => {
    expect(mapOwnershipTypeApiError({ success: false, message, statusCode: 400 }, t as never, tCommon as never)).toBe(message);
  });

  it("detects only the deactivate message", () => {
    expect(isDeactivateBlockedMessage(DEACTIVATE)).toBe(true);
    expect(isDeactivateBlockedMessage(DELETE)).toBe(false);
  });
});
