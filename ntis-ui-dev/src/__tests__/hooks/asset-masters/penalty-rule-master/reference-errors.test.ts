import { describe, it, expect } from "vitest";
import { createTranslator } from "next-intl";
import { getPenaltyRuleErrorMessage, parsePenaltyRuleApiErrors } from "@/hooks/asset-masters/penalty-rule-master/error-mapping";
import penaltyRuleMasterEn from "@/i18n/locales/en/penaltyRuleMaster.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { penaltyRuleMaster: penaltyRuleMasterEn }, namespace: "penaltyRuleMaster" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });

// The backend's reference-check messages (ReferenceValidationService, DisplayAs "Penalty Rule").
const DELETE = "This Penalty Rule cannot be deleted because it is in use.";
const DEACTIVATE = "This Penalty Rule cannot be deactivated because it is in use.";

describe("penalty rule reference errors", () => {
  it.each([DELETE, DEACTIVATE])("translates %s", (message) => {
    expect(getPenaltyRuleErrorMessage(message, 400, t as never, tCommon as never)).toBe(message);
  });

  it("puts the deactivate message on isActive", () => {
    expect(parsePenaltyRuleApiErrors(DEACTIVATE, 400, t as never, tCommon as never)).toEqual({
      fieldErrors: { isActive: DEACTIVATE },
      globalMessage: DEACTIVATE,
    });
  });

  it("adds no field error for the delete message", () => {
    expect(parsePenaltyRuleApiErrors(DELETE, 400, t as never, tCommon as never).fieldErrors).toEqual({});
  });
});
