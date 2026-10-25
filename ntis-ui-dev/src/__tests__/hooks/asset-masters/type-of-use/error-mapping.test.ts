import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import { getErrorMessage, isDeactivateBlockedMessage } from "@/hooks/asset-masters/type-of-use/error-mapping";
import assetTypeOfUseEn from "@/i18n/locales/en/assetTypeOfUse.json";
import commonEn from "@/i18n/locales/en/common.json";

const t = createTranslator({ locale: "en", messages: { assetTypeOfUse: assetTypeOfUseEn }, namespace: "assetTypeOfUse" });
const tCommon = createTranslator({ locale: "en", messages: { common: commonEn }, namespace: "common" });
const map = (message: string, statusCode = 400) => getErrorMessage(message, statusCode, t as never, tCommon as never, "Type of Use");

const hasMasters = (entity: string, verb: "deleted" | "deactivated", masters: string) =>
  `This ${entity} cannot be ${verb} because it has ${masters}. Please delete all ${masters} for this ${entity} first.`;
const inUse = (entity: string, verb: "deleted" | "deactivated") => `This ${entity} cannot be ${verb} because it is in use.`;

// Backend reference-check messages (ReferenceValidationService) for the three Type Of Use masters.
const CASES: Array<[string, string[]]> = [
  ["Type Of Use Group", ["Type Of Uses", "CV Rates"]],
  ["Type Of Use", ["Sub Type Of Uses", "Use Factors"]],
  ["Sub Type Of Use", ["Use Factors"]],
];

describe("type-of-use getErrorMessage reference errors", () => {
  describe.each(CASES)("%s", (entity, masters) => {
    it.each(["deleted", "deactivated"] as const)("translates the %s in-use message", (verb) => {
      expect(map(inUse(entity, verb))).toBe(inUse(entity, verb));
    });

    it.each(["deleted", "deactivated"] as const)("translates the %s message with one child master", (verb) => {
      const message = hasMasters(entity, verb, masters[0]);
      expect(map(message)).toBe(message);
    });

    if (masters.length > 1) {
      it.each(["deleted", "deactivated"] as const)("translates the %s message with two child masters", (verb) => {
        const message = hasMasters(entity, verb, `${masters[0]} and ${masters[1]}`);
        expect(map(message)).toBe(message);
      });
    }

    it("detects only the deactivate messages", () => {
      expect(isDeactivateBlockedMessage(hasMasters(entity, "deactivated", masters[0]))).toBe(true);
      expect(isDeactivateBlockedMessage(inUse(entity, "deactivated"))).toBe(true);
      expect(isDeactivateBlockedMessage(hasMasters(entity, "deleted", masters[0]))).toBe(false);
      expect(isDeactivateBlockedMessage(inUse(entity, "deleted"))).toBe(false);
    });
  });

  it("leaves other messages to the shared mapping", () => {
    expect(isDeactivateBlockedMessage("Group Code already exists")).toBe(false);
    expect(map("Server exploded", 500)).toBe(assetTypeOfUseEn.apiErrors.operationFailed);
  });
});
